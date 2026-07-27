package handlers

import (
	"context"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"
	"time"

	"github.com/labstack/echo/v5"
	"go.uber.org/zap"

	"radix-backend/internal/dtn"
	"radix-backend/internal/models"
	"radix-backend/internal/store"
)

// End-to-end peer synchronisation: real store, real handler, real HTTP.
//
// Each node is a database of its own plus an httptest server exposing the one
// route a peer talks to, and the pulling side is the actual dtn.Syncer. What
// isn't exercised here is the network being unreliable, which is the whole
// premise — that part is verified by killing a node in the two-process local
// setup (see the README).

const testSyncToken = "token-de-prueba"

type node struct {
	id      string
	store   *store.Store
	url     string
	uploads string
	syncer  *dtn.Syncer
}

// newNode builds one edge server. peers are the URLs it pulls from.
func newNode(t *testing.T, id string) *node {
	t.Helper()
	s := newNodeStore(t, id)

	e := echo.New()
	h := &Handler{Store: s, SyncToken: testSyncToken}
	api := e.Group("/api/v1")
	api.GET("/sync/ops", h.GetSyncOps)
	api.GET("/sync/file/:id", h.GetSyncFile)
	srv := httptest.NewServer(e)
	t.Cleanup(srv.Close)

	return &node{id: id, store: s, url: srv.URL, uploads: t.TempDir()}
}

// follows points n at a peer, so n.sync() pulls from it.
func (n *node) follows(t *testing.T, peers ...*node) {
	t.Helper()
	urls := make([]string, len(peers))
	for i, peer := range peers {
		urls[i] = peer.url
	}
	n.syncer = dtn.New(n.store, zap.NewNop(), urls, testSyncToken, n.uploads, 5*time.Second)
}

// sync pulls once from every peer and fails the test if a link errored.
func (n *node) sync(t *testing.T) []models.SyncResult {
	t.Helper()
	results := n.syncer.Round(context.Background())
	for _, result := range results {
		if result.Error != "" {
			t.Fatalf("%s pulling %s: %s", n.id, result.Peer, result.Error)
		}
	}
	return results
}

// seedCourse gives a node a course to hang content off.
func seedCourse(t *testing.T, n *node, title string) *models.Course {
	t.Helper()
	course := &models.Course{Title: title, Description: "d", Category: "c"}
	if err := n.store.AddCourse(context.Background(), course); err != nil {
		t.Fatalf("add course on %s: %v", n.id, err)
	}
	return course
}

// TestOpsCrossBothWays is the basic claim: a change made on one node shows up on
// the other, and an answer made on the other comes back — without either ever
// sending its whole database.
func TestOpsCrossBothWays(t *testing.T) {
	ctx := context.Background()
	central := newNode(t, "central")
	edge := newNode(t, "edge-a")
	edge.follows(t, central)
	central.follows(t, edge)

	course := seedCourse(t, central, "Redes")
	lesson := &models.Lesson{CourseID: course.ID, Title: "Intro", ContentText: "texto"}
	if err := central.store.AddLesson(ctx, lesson); err != nil {
		t.Fatalf("add lesson: %v", err)
	}

	edge.sync(t)

	got, err := edge.store.GetLesson(ctx, lesson.ID)
	if err != nil {
		t.Fatalf("the lesson never reached the edge: %v", err)
	}
	if got.Title != "Intro" {
		t.Fatalf("lesson arrived wrong: %q", got.Title)
	}

	// Now the other direction, with an edit rather than a new row.
	if err := edge.store.UpdateLesson(ctx, &models.Lesson{
		ID: lesson.ID, CourseID: course.ID, Title: "Intro corregida", ContentText: "texto corregido",
	}); err != nil {
		t.Fatalf("edit on the edge: %v", err)
	}
	central.sync(t)

	back, err := central.store.GetLesson(ctx, lesson.ID)
	if err != nil {
		t.Fatalf("read back on central: %v", err)
	}
	if back.Title != "Intro corregida" {
		t.Fatalf("the edge's correction did not reach central: %q", back.Title)
	}
}

// TestSyncingAgainDoesNothing: the second round must be inert. Without the
// identity index a re-pull would re-apply everything, and every node would keep
// rewriting rows it already had.
func TestSyncingAgainDoesNothing(t *testing.T) {
	ctx := context.Background()
	central := newNode(t, "central")
	edge := newNode(t, "edge-a")
	edge.follows(t, central)

	course := seedCourse(t, central, "Redes")
	if err := central.store.AddLesson(ctx, &models.Lesson{CourseID: course.ID, Title: "Intro", ContentText: "t"}); err != nil {
		t.Fatalf("add lesson: %v", err)
	}

	first := edge.sync(t)
	if first[0].Applied == 0 {
		t.Fatal("the first round applied nothing")
	}

	second := edge.sync(t)
	if second[0].Pulled != 0 || second[0].Applied != 0 {
		t.Fatalf("the second round pulled=%d applied=%d, want nothing", second[0].Pulled, second[0].Applied)
	}
}

// TestUnenrolStaysUnenrolled covers the delete that matters most: enrolment
// gates access to a course. Without deletes travelling as ops, the next sync
// would put the student straight back in.
func TestUnenrolStaysUnenrolled(t *testing.T) {
	ctx := context.Background()
	central := newNode(t, "central")
	edge := newNode(t, "edge-a")
	edge.follows(t, central)

	course := seedCourse(t, central, "Redes")
	student := &models.User{ID: "u1", Name: "Ana", Email: "ana@radix.test", PasswordHash: "h", Role: models.RoleStudent}
	if err := central.store.AddUser(ctx, student); err != nil {
		t.Fatalf("add user: %v", err)
	}
	if err := central.store.EnrollStudent(ctx, student.ID, course.ID); err != nil {
		t.Fatalf("enrol: %v", err)
	}
	edge.sync(t)

	enrolled, err := edge.store.IsEnrolled(ctx, student.ID, course.ID)
	if err != nil || !enrolled {
		t.Fatalf("the enrolment did not reach the edge (enrolled=%v, err=%v)", enrolled, err)
	}

	if err := central.store.UnenrollStudent(ctx, student.ID, course.ID); err != nil {
		t.Fatalf("unenrol: %v", err)
	}
	edge.sync(t)

	enrolled, err = edge.store.IsEnrolled(ctx, student.ID, course.ID)
	if err != nil {
		t.Fatalf("check enrolment: %v", err)
	}
	if enrolled {
		t.Fatal("the student is still enrolled on the edge: the delete never travelled")
	}
}

// TestADeletedRowIsNotResurrected: ops from different nodes can arrive in any
// order, so an upsert older than a delete may well turn up after it. The
// operation log is what remembers the row was removed.
func TestADeletedRowIsNotResurrected(t *testing.T) {
	ctx := context.Background()
	central := newNode(t, "central")
	edge := newNode(t, "edge-a")
	edge.follows(t, central)

	course := seedCourse(t, central, "Redes")
	student := &models.User{ID: "u1", Name: "Ana", Email: "ana@radix.test", PasswordHash: "h", Role: models.RoleStudent}
	if err := central.store.AddUser(ctx, student); err != nil {
		t.Fatalf("add user: %v", err)
	}
	if err := central.store.EnrollStudent(ctx, student.ID, course.ID); err != nil {
		t.Fatalf("enrol: %v", err)
	}
	if err := central.store.UnenrollStudent(ctx, student.ID, course.ID); err != nil {
		t.Fatalf("unenrol: %v", err)
	}

	// Everything central produced, oldest first.
	ops, err := central.store.OpsSince(ctx, 0, 100)
	if err != nil {
		t.Fatalf("read ops: %v", err)
	}
	// Deliver the delete first and the enrolment afterwards — the order a
	// second-hand path could easily produce.
	var enrol, unenrol models.SyncOp
	for _, op := range ops {
		if op.Table != "course_enrollments" {
			continue
		}
		if op.Op == models.OpDelete {
			unenrol = op
		} else {
			enrol = op
		}
	}
	if enrol.Op == "" || unenrol.Op == "" {
		t.Fatalf("expected both an enrolment and its delete in %d ops", len(ops))
	}

	prelude := []models.SyncOp{}
	for _, op := range ops {
		if op.Table != "course_enrollments" {
			prelude = append(prelude, op)
		}
	}
	if _, _, err := edge.store.ApplyOps(ctx, prelude); err != nil {
		t.Fatalf("apply prelude: %v", err)
	}
	if _, _, err := edge.store.ApplyOps(ctx, []models.SyncOp{unenrol, enrol}); err != nil {
		t.Fatalf("apply out of order: %v", err)
	}

	enrolled, err := edge.store.IsEnrolled(ctx, student.ID, course.ID)
	if err != nil {
		t.Fatalf("check enrolment: %v", err)
	}
	if enrolled {
		t.Fatal("an enrolment older than its own delete came back to life")
	}
}

// TestOpsForwardAlongAChain is the property a whole-database zip can't give:
// C never talks to A, and still ends up with A's content, because B passes on
// what it learned. That's what makes this a network rather than a pair.
func TestOpsForwardAlongAChain(t *testing.T) {
	ctx := context.Background()
	a := newNode(t, "node-a")
	b := newNode(t, "node-b")
	c := newNode(t, "node-c")
	b.follows(t, a)
	c.follows(t, b) // c never sees a

	course := seedCourse(t, a, "Redes")
	lesson := &models.Lesson{CourseID: course.ID, Title: "Enrutamiento", ContentText: "t"}
	if err := a.store.AddLesson(ctx, lesson); err != nil {
		t.Fatalf("add lesson: %v", err)
	}

	b.sync(t)
	c.sync(t)

	got, err := c.store.GetLesson(ctx, lesson.ID)
	if err != nil {
		t.Fatalf("A's lesson never reached C: %v", err)
	}
	if got.Title != "Enrutamiento" {
		t.Fatalf("arrived wrong at C: %q", got.Title)
	}

	// And the provenance survives the hop: C knows the op came from A.
	ops, err := c.store.OpsSince(ctx, 0, 100)
	if err != nil {
		t.Fatalf("read C's log: %v", err)
	}
	for _, op := range ops {
		if op.Table == "lessons" && op.OriginNode != "node-a" {
			t.Fatalf("C recorded the lesson as coming from %q, not from node-a", op.OriginNode)
		}
	}
}

// TestQueueClearsOnceThePeerHasRead: the Monitor's pending count has to mean
// "nobody has taken this yet". A node with no reader reports everything as
// pending, which is the honest answer.
func TestQueueClearsOnceThePeerHasRead(t *testing.T) {
	ctx := context.Background()
	central := newNode(t, "central")
	edge := newNode(t, "edge-a")
	edge.follows(t, central)

	seedCourse(t, central, "Redes")

	queue, err := central.store.GetSyncQueue(ctx)
	if err != nil {
		t.Fatalf("read queue: %v", err)
	}
	if queue.TransactionCount == 0 {
		t.Fatal("the queue is empty right after a write")
	}

	edge.sync(t) // reads everything
	edge.sync(t) // and reports back its new position

	queue, err = central.store.GetSyncQueue(ctx)
	if err != nil {
		t.Fatalf("read queue: %v", err)
	}
	if queue.TransactionCount != 0 {
		t.Fatalf("%d ops still pending after the peer read them", queue.TransactionCount)
	}
}

// TestTheLogNeedsTheToken: the endpoint hands over every row of content this
// node holds, so an unauthenticated read of it would be a full data leak.
func TestTheLogNeedsTheToken(t *testing.T) {
	central := newNode(t, "central")
	seedCourse(t, central, "Redes")

	for _, header := range []string{"", "Bearer ", "Bearer wrong-token"} {
		req, err := http.NewRequest(http.MethodGet, central.url+"/api/v1/sync/ops?since=0", nil)
		if err != nil {
			t.Fatal(err)
		}
		if header != "" {
			req.Header.Set("Authorization", header)
		}
		resp, err := http.DefaultClient.Do(req)
		if err != nil {
			t.Fatal(err)
		}
		resp.Body.Close()
		if resp.StatusCode != http.StatusUnauthorized {
			t.Errorf("Authorization %q got %s, want 401", header, resp.Status)
		}
	}
}

// TestASyncTokenlessNodeServesNothing: leaving SYNC_TOKEN unset must close the
// endpoint, not open it.
func TestASyncTokenlessNodeServesNothing(t *testing.T) {
	s := newNodeStore(t, "central")
	e := echo.New()
	h := &Handler{Store: s} // no token configured
	e.Group("/api/v1").GET("/sync/ops", h.GetSyncOps)
	srv := httptest.NewServer(e)
	t.Cleanup(srv.Close)

	req, _ := http.NewRequest(http.MethodGet, srv.URL+"/api/v1/sync/ops?since=0", nil)
	req.Header.Set("Authorization", "Bearer "+testSyncToken)
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		t.Fatal(err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusUnauthorized {
		t.Fatalf("a node with no sync token answered %s", resp.Status)
	}
}

// TestUploadedFilesFollowTheirRows: an operation carries the library row, not
// the bytes, so a node that learns about a video would have its metadata and
// nothing to play. After applying the ops the puller works out which files it's
// missing and fetches those separately.
//
// The paths here are absolute so the two nodes can have separate upload folders
// inside one test process. In the app they're relative to the working directory
// (handlers.UploadsDir), which is what makes the same stored path resolve
// correctly on every node.
func TestUploadedFilesFollowTheirRows(t *testing.T) {
	ctx := context.Background()
	central := newNode(t, "central")
	edge := newNode(t, "edge-a")
	edge.follows(t, central)

	contents := []byte("PDF de la clase de redes")
	stored := filepath.Join(central.uploads, "item_apunte.pdf")
	if err := os.WriteFile(stored, contents, 0o644); err != nil {
		t.Fatalf("write the file on central: %v", err)
	}

	if _, err := central.store.AddLibraryItem(ctx, models.LibraryItem{
		Title: "Apunte", Type: "document", Category: "Redes", SizeKB: 1,
		MimeType: "application/pdf", OriginalFilename: "apunte.pdf",
		UploadedAt: "2026-01-01", ModifiedAt: "2026-01-01", FilePath: stored,
	}); err != nil {
		t.Fatalf("add library item: %v", err)
	}

	results := edge.sync(t)
	if results[0].Files != 1 {
		t.Fatalf("the edge downloaded %d files, want 1", results[0].Files)
	}

	landed := filepath.Join(edge.uploads, "item_apunte.pdf")
	got, err := os.ReadFile(landed)
	if err != nil {
		t.Fatalf("the file never reached the edge: %v", err)
	}
	if string(got) != string(contents) {
		t.Fatalf("the file arrived corrupted: %q", got)
	}

	// And nothing is downloaded twice.
	again := edge.sync(t)
	if again[0].Files != 0 {
		t.Fatalf("re-downloaded %d files that were already here", again[0].Files)
	}
}

// TestPeerFilesNeedTheToken: the file route hands over the actual content of
// this node's library, so it's gated exactly like the operation log.
func TestPeerFilesNeedTheToken(t *testing.T) {
	central := newNode(t, "central")

	req, err := http.NewRequest(http.MethodGet, central.url+"/api/v1/sync/file/whatever", nil)
	if err != nil {
		t.Fatal(err)
	}
	req.Header.Set("Authorization", "Bearer wrong-token")
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		t.Fatal(err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusUnauthorized {
		t.Fatalf("got %s, want 401", resp.Status)
	}
}
