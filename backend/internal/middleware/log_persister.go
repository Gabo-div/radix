package middleware

import (
	"context"
	"time"

	"go.uber.org/zap"

	"radix-backend/internal/models"
)

// ServerLogStore is the subset of store.Store the persister needs.
type ServerLogStore interface {
	AddServerLogs(ctx context.Context, logs []models.ServerLog) error
	DeleteOldServerLogs(ctx context.Context, cutoff string) (int64, error)
}

// LogPersister batches request-log entries and flushes them to the durable
// server_logs table on an interval, so the request hot path only ever pays
// for a non-blocking channel send — never a DB write.
type LogPersister struct {
	store  ServerLogStore
	logger *zap.Logger
	queue  chan models.ServerLog
	done   chan struct{}
}

func NewLogPersister(store ServerLogStore, logger *zap.Logger) *LogPersister {
	return &LogPersister{
		store:  store,
		logger: logger,
		queue:  make(chan models.ServerLog, 1000),
		done:   make(chan struct{}),
	}
}

// Enqueue never blocks: if the persister can't keep up (or is stopped), the
// entry is dropped rather than adding latency to the request.
func (p *LogPersister) Enqueue(entry models.ServerLog) {
	select {
	case p.queue <- entry:
	default:
	}
}

// Run flushes batches every flushInterval (or once batchSize is reached) and
// prunes rows older than retentionDays every retentionInterval. It blocks
// until the queue is closed by Stop.
func (p *LogPersister) Run(flushInterval time.Duration, batchSize, retentionDays int, retentionInterval time.Duration) {
	defer close(p.done)
	batch := make([]models.ServerLog, 0, batchSize)

	flushTicker := time.NewTicker(flushInterval)
	defer flushTicker.Stop()
	retentionTicker := time.NewTicker(retentionInterval)
	defer retentionTicker.Stop()

	flush := func() {
		if len(batch) == 0 {
			return
		}
		if err := p.store.AddServerLogs(context.Background(), batch); err != nil {
			p.logger.Error("failed to persist server logs", zap.Error(err), zap.Int("batchSize", len(batch)))
		}
		batch = batch[:0]
	}
	cleanup := func() {
		cutoff := time.Now().AddDate(0, 0, -retentionDays).Format(time.RFC3339)
		if n, err := p.store.DeleteOldServerLogs(context.Background(), cutoff); err != nil {
			p.logger.Error("failed to clean up old server logs", zap.Error(err))
		} else if n > 0 {
			p.logger.Info("pruned old server logs", zap.Int64("deleted", n), zap.String("cutoff", cutoff))
		}
	}
	cleanup()

	for {
		select {
		case entry, ok := <-p.queue:
			if !ok {
				flush()
				return
			}
			batch = append(batch, entry)
			if len(batch) >= batchSize {
				flush()
			}
		case <-flushTicker.C:
			flush()
		case <-retentionTicker.C:
			cleanup()
		}
	}
}

// Stop closes the queue and blocks until the final flush completes.
func (p *LogPersister) Stop() {
	close(p.queue)
	<-p.done
}
