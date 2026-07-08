package middleware

import (
	"encoding/json"
	"os"
	"strings"
	"time"

	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"

	"radix-backend/internal/models"
)

// NewBaseLogger is the app-wide logger for infra/lifecycle messages that
// can't route through the full logger (see NewLogger) — console-only, no
// dependency on LogBuffer/LogPersister. Used only where taking those as
// dependencies would create a cycle (store, persister itself).
func NewBaseLogger() *zap.Logger {
	core := zapcore.NewCore(
		zapcore.NewConsoleEncoder(zap.NewDevelopmentEncoderConfig()),
		zapcore.AddSync(os.Stdout),
		zapcore.DebugLevel,
	)
	return zap.New(core)
}

// NewLogger wraps base with an extra core that fans every log entry out to
// the live tail (LogBuffer) and durable history (LogPersister) — one zap
// call anywhere in the app now drives stdout, the live tail, and the DB at
// once. It applies to any log call, not just HTTP requests: whatever fields
// the caller attaches (zap.String/zap.Int/...) are captured generically into
// the persisted row's Fields JSON blob, so no fixed per-source column set.
func NewLogger(base *zap.Logger, buffer *LogBuffer, persister *LogPersister) *zap.Logger {
	obs := &observabilityCore{buffer: buffer, persister: persister}
	return base.WithOptions(zap.WrapCore(func(core zapcore.Core) zapcore.Core {
		return zapcore.NewTee(core, obs)
	}))
}

type observabilityCore struct {
	buffer    *LogBuffer
	persister *LogPersister
	fields    []zapcore.Field
}

func (c *observabilityCore) Enabled(zapcore.Level) bool { return true }

func (c *observabilityCore) With(fields []zapcore.Field) zapcore.Core {
	clone := *c
	clone.fields = append(append([]zapcore.Field{}, c.fields...), fields...)
	return &clone
}

func (c *observabilityCore) Check(entry zapcore.Entry, ce *zapcore.CheckedEntry) *zapcore.CheckedEntry {
	return ce.AddCore(entry, c)
}

func (c *observabilityCore) Sync() error { return nil }

// Write captures whatever fields the call site attached into a generic JSON
// object (via zapcore's own field-dispatch, so every zap field type is
// handled correctly) instead of extracting a few hardcoded keys — a request
// log and a background-job log can carry completely different shapes.
func (c *observabilityCore) Write(entry zapcore.Entry, fields []zapcore.Field) error {
	all := append(append([]zapcore.Field{}, c.fields...), fields...)
	enc := zapcore.NewMapObjectEncoder()
	for _, f := range all {
		f.AddTo(enc)
	}
	fieldsJSON, err := json.Marshal(enc.Fields)
	if err != nil {
		fieldsJSON = []byte("{}")
	}

	rendered := "[" + strings.ToUpper(entry.Level.String()) + "] " + entry.Time.Format("2006/01/02 15:04:05") + " " + entry.Message

	c.buffer.Write(rendered)
	c.persister.Enqueue(models.ServerLog{
		Timestamp: entry.Time.Format(time.RFC3339),
		Level:     entry.Level.String(),
		Message:   entry.Message,
		Fields:    string(fieldsJSON),
	})
	return nil
}
