package clock

import (
	"sync"
	"testing"
	"time"
)

func TestNowIsMonotonic(t *testing.T) {
	var c HLC
	prev := c.Now()
	for i := 0; i < 5000; i++ {
		next := c.Now()
		if next <= prev {
			t.Fatalf("call %d: %d is not greater than %d", i, next, prev)
		}
		prev = next
	}
}

// The whole point of the type: a clock that jumps backwards (a Pi with no RTC
// rebooting) must not produce timestamps that lose to what it already wrote.
func TestNowSurvivesClockGoingBackwards(t *testing.T) {
	var c HLC
	c.Observe(time.Now().Add(48 * time.Hour).UnixMilli()) // as if the DB held future rows
	future := c.Last()

	if got := c.Now(); got != future+1 {
		t.Fatalf("expected %d (one past the observed value), got %d", future+1, got)
	}
}

func TestObserveOnlyMovesForward(t *testing.T) {
	var c HLC
	high := c.Now()
	c.Observe(high - 10_000)
	if c.Last() != high {
		t.Fatalf("Observe moved the clock back to %d, expected it to stay at %d", c.Last(), high)
	}
}

func TestConcurrentNowNeverRepeats(t *testing.T) {
	var (
		c    HLC
		wg   sync.WaitGroup
		mu   sync.Mutex
		seen = map[int64]bool{}
	)
	for i := 0; i < 50; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for j := 0; j < 200; j++ {
				v := c.Now()
				mu.Lock()
				if seen[v] {
					mu.Unlock()
					t.Errorf("duplicate timestamp %d", v)
					return
				}
				seen[v] = true
				mu.Unlock()
			}
		}()
	}
	wg.Wait()
}
