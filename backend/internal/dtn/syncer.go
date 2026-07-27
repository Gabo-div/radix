// Package dtn carries this node's operation log to and from its peers.
//
// The name is the point: the link between two edge servers is delay-tolerant.
// It may be down for hours, come back for a minute, and go again. So the design
// is store-and-forward — writes are recorded locally as ops the moment they
// happen (internal/store/ops.go) and shipped whenever a peer answers. Nothing
// waits on the network, and a sync that fails costs nothing but a retry.
//
// Pull, not push. Each node asks its peers "what have you got after seq N?",
// which keeps all the cursor state on the side that's asking. A pushing node
// would have to track how far every peer had got, and be wrong about it every
// time a peer restored from a backup. Pulling also means the node that happens
// to have power and signal is the one that initiates, which is the realistic
// case here.
package dtn

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"go.uber.org/zap"

	"radix-backend/internal/models"
)

// Store is the slice of the store this package needs — same narrow-interface
// convention as auth and handlers.
type Store interface {
	NodeID() string
	ApplyOps(ctx context.Context, ops []models.SyncOp) (applied, skipped int, err error)
	PeerCursor(ctx context.Context, peer string) (int64, error)
	RecordPeer(ctx context.Context, peer models.SyncPeer) error
	LibraryFiles(ctx context.Context) ([]models.LibraryFile, error)
}

// batchesPerRound bounds one pull from one peer. A node that has been offline
// for a month catches up over several rounds instead of in a single enormous
// transaction that would hold the database for as long as it took.
const batchesPerRound = 20

// opsPerBatch must not exceed the server's own cap (store.maxOpsPerPull).
const opsPerBatch = 500

type Syncer struct {
	store      Store
	logger     *zap.Logger
	peers      []string
	token      string
	uploadsDir string
	client     *http.Client
	// fileClient has no timeout: a video over a village link can legitimately
	// take many minutes, and cutting it off at the ops timeout would mean never
	// finishing the transfer at all.
	fileClient *http.Client
}

func New(store Store, logger *zap.Logger, peers []string, token, uploadsDir string, timeout time.Duration) *Syncer {
	return &Syncer{
		store:      store,
		logger:     logger,
		peers:      peers,
		token:      token,
		uploadsDir: uploadsDir,
		client:     &http.Client{Timeout: timeout},
		fileClient: &http.Client{},
	}
}

// Enabled reports whether any peer is configured. A node with none is a
// perfectly normal standalone install, not a misconfiguration.
func (s *Syncer) Enabled() bool { return len(s.peers) > 0 }

// Run pulls from every peer on a fixed interval until ctx is cancelled.
//
// There's no backoff: a failed round is retried at the next tick, forever. That
// is the intended behaviour rather than an omission — the peer being
// unreachable is the normal state of this system, not an error condition to
// back away from, and the retry costs one failed connection per interval.
func (s *Syncer) Run(ctx context.Context, interval time.Duration) {
	ticker := time.NewTicker(interval)
	defer ticker.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			s.Round(ctx)
		}
	}
}

// Round pulls once from each peer and reports what happened with each. It never
// returns an error: one unreachable peer must not stop the others, and "the
// link was down" is an outcome, not a failure of the round.
func (s *Syncer) Round(ctx context.Context) []models.SyncResult {
	results := make([]models.SyncResult, 0, len(s.peers))
	for _, peer := range s.peers {
		result := s.pull(ctx, peer)
		results = append(results, result)

		fields := []zap.Field{
			zap.String("peer", peer),
			zap.String("peerNode", result.NodeID),
			zap.Int("pulled", result.Pulled),
			zap.Int("applied", result.Applied),
			zap.Int("skipped", result.Skipped),
		}
		if result.Error != "" {
			s.logger.Warn("Sincronización con el nodo par fallida", append(fields, zap.String("error", result.Error))...)
		} else if result.Pulled > 0 {
			s.logger.Info("Operaciones sincronizadas desde el nodo par", fields...)
		}
	}
	s.fetchFiles(ctx, results)
	return results
}

// fetchFiles downloads the uploads this node knows about but doesn't hold.
//
// It works from the whole library rather than from the ops just applied, and
// that's on purpose: a download that fails — the link dropped halfway through a
// video — has to be retried, and a node bootstrapped from a zip whose uploads
// folder was pruned needs the same repair. Comparing the inventory against the
// disk each round covers both, and costs one query plus a stat per item.
func (s *Syncer) fetchFiles(ctx context.Context, results []models.SyncResult) {
	files, err := s.store.LibraryFiles(ctx)
	if err != nil {
		s.logger.Error("no se pudo listar los archivos de la biblioteca", zap.Error(err))
		return
	}

	for _, file := range files {
		// filepath.Base: the path comes from another node's database and is
		// only ever a name inside this node's own uploads folder.
		local := filepath.Join(s.uploadsDir, filepath.Base(file.FilePath))
		if _, err := os.Stat(local); err == nil {
			continue
		}
		for i, peer := range s.peers {
			if results[i].Error != "" {
				continue // that link is down; no point asking it for bytes
			}
			if err := s.download(ctx, peer, file.ID, local); err != nil {
				s.logger.Warn("No se pudo traer el archivo del nodo par",
					zap.String("peer", peer), zap.String("item", file.ID), zap.Error(err))
				continue
			}
			results[i].Files++
			s.logger.Info("Archivo traído del nodo par",
				zap.String("peer", peer), zap.String("item", file.ID), zap.String("path", local))
			break
		}
	}
}

// download writes the peer's copy of one library file to dst. It lands on a
// temporary file first and is renamed into place, so an interrupted transfer
// leaves nothing that looks like a complete file — the next round would
// otherwise skip it forever.
func (s *Syncer) download(ctx context.Context, peer, itemID, dst string) error {
	endpoint, err := url.JoinPath(strings.TrimSuffix(peer, "/"), "api", "v1", "sync", "file", itemID)
	if err != nil {
		return err
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, endpoint, nil)
	if err != nil {
		return err
	}
	req.Header.Set("Authorization", "Bearer "+s.token)

	resp, err := s.fileClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("%s respondió %s", peer, resp.Status)
	}

	if err := os.MkdirAll(filepath.Dir(dst), 0o755); err != nil {
		return err
	}
	tmp, err := os.CreateTemp(filepath.Dir(dst), ".sync-*")
	if err != nil {
		return err
	}
	defer os.Remove(tmp.Name())

	if _, err := io.Copy(tmp, resp.Body); err != nil {
		tmp.Close()
		return err
	}
	if err := tmp.Close(); err != nil {
		return err
	}
	return os.Rename(tmp.Name(), dst)
}

func (s *Syncer) pull(ctx context.Context, peer string) models.SyncResult {
	result := models.SyncResult{Peer: peer}

	cursor, err := s.store.PeerCursor(ctx, peer)
	if err != nil {
		result.Error = err.Error()
		return result
	}

	for batch := 0; batch < batchesPerRound; batch++ {
		page, err := s.fetch(ctx, peer, cursor)
		if err != nil {
			result.Error = err.Error()
			break
		}
		result.NodeID = page.NodeID
		if len(page.Ops) == 0 {
			break
		}

		applied, skipped, err := s.store.ApplyOps(ctx, page.Ops)
		if err != nil {
			result.Error = err.Error()
			break
		}
		result.Pulled += len(page.Ops)
		result.Applied += applied
		result.Skipped += skipped

		// The cursor only moves over ops that made it into the transaction that
		// just committed. A crash before this point costs a re-pull, never a
		// silently skipped op.
		cursor = page.Ops[len(page.Ops)-1].Seq
		if err := s.store.RecordPeer(ctx, models.SyncPeer{Peer: peer, NodeID: page.NodeID, LastSeq: cursor}); err != nil {
			result.Error = err.Error()
			break
		}
		if len(page.Ops) < opsPerBatch {
			break
		}
	}

	if result.Error != "" {
		// Record the failure without touching the cursor, so the Monitor can
		// show why the link is quiet.
		if err := s.store.RecordPeer(ctx, models.SyncPeer{
			Peer: peer, NodeID: result.NodeID, LastSeq: cursor, LastError: result.Error,
		}); err != nil {
			s.logger.Error("no se pudo registrar el estado del nodo par", zap.Error(err))
		}
	}
	return result
}

// opsPage is the peer's answer to one pull — mirrors handlers.GetSyncOps.
type opsPage struct {
	NodeID string          `json:"nodeId"`
	Ops    []models.SyncOp `json:"ops"`
}

func (s *Syncer) fetch(ctx context.Context, peer string, cursor int64) (opsPage, error) {
	var page opsPage

	endpoint, err := url.JoinPath(strings.TrimSuffix(peer, "/"), "api", "v1", "sync", "ops")
	if err != nil {
		return page, fmt.Errorf("bad peer URL %q: %w", peer, err)
	}
	query := url.Values{
		"since": {strconv.FormatInt(cursor, 10)},
		"limit": {strconv.Itoa(opsPerBatch)},
		// Telling the peer who is asking, and how far we've read, is what lets
		// it report its queue as delivered instead of merely stored.
		"node": {s.store.NodeID()},
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, endpoint+"?"+query.Encode(), nil)
	if err != nil {
		return page, err
	}
	req.Header.Set("Authorization", "Bearer "+s.token)

	resp, err := s.client.Do(req)
	if err != nil {
		return page, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return page, fmt.Errorf("%s respondió %s", peer, resp.Status)
	}
	if err := json.NewDecoder(resp.Body).Decode(&page); err != nil {
		return page, fmt.Errorf("respuesta ilegible de %s: %w", peer, err)
	}
	return page, nil
}
