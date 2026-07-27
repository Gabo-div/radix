// Package clock provides the logical clock that orders writes across edge
// servers.
package clock

import (
	"sync"
	"time"
)

// HLC is a hybrid logical clock: a counter seeded from the wall clock, but
// monotonic by construction.
//
// It exists because the wall clock on its own can't be trusted here. An edge
// server is a Raspberry Pi with no RTC and, by design, no internet most of the
// time — so no NTP either. Its clock drifts, and after a power cut it can come
// back minutes or years behind. Any "last write wins" rule built directly on
// time.Now() would then resolve conflicts backwards: a node whose clock lags
// would lose every edit it makes until real time caught up.
//
// Now() returns max(wall clock, last+1), so the sequence never goes backwards
// no matter what the clock does, while still tracking real time closely enough
// that values from two nodes with roughly correct clocks compare the way a
// human would expect. Observe() folds in a value seen from another node, which
// is what carries causality between nodes: after importing a peer's rows, this
// node's next write is guaranteed to sort after everything it just learned.
//
// Values are milliseconds-since-epoch when the clock is healthy, which is what
// makes them readable in a dump and comparable as a plain INTEGER column.
//
// The zero value is ready to use.
type HLC struct {
	mu   sync.Mutex
	last int64
}

// Now returns the next timestamp, strictly greater than every value this clock
// has returned or observed before.
func (c *HLC) Now() int64 {
	c.mu.Lock()
	defer c.mu.Unlock()
	if now := time.Now().UnixMilli(); now > c.last {
		c.last = now
	} else {
		c.last++
	}
	return c.last
}

// Observe advances the clock past v if it isn't already. Called with rows
// arriving from another node (and once at startup with the highest value in
// this node's own database, so a restart with a rewound clock can't regress).
func (c *HLC) Observe(v int64) {
	c.mu.Lock()
	defer c.mu.Unlock()
	if v > c.last {
		c.last = v
	}
}

// Last reports the newest value returned or observed, without advancing.
func (c *HLC) Last() int64 {
	c.mu.Lock()
	defer c.mu.Unlock()
	return c.last
}
