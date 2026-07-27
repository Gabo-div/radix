package config

import (
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/joho/godotenv"
)

type Config struct {
	Port             string
	LogBufferSize    int
	LogRetentionDays int
	CORSOrigins      []string
	Environment      string
	DBPath           string
	TursoURL         string
	TursoAuthToken   string
	NodeID           string

	// Peer synchronisation. Empty SyncPeers means a standalone node: it still
	// records its operation log, nothing pulls it.
	SyncPeers    []string
	SyncToken    string
	SyncInterval time.Duration
}

func Load() *Config {
	// ENV_FILE lets a second node run from the same checkout with its own
	// settings (ENV_FILE=.env.b go run ./cmd/server), which is how peer
	// synchronisation is tried locally.
	godotenv.Load(getEnv("ENV_FILE", ".env"))

	port := getEnv("PORT", "1323")
	bufSize := getEnvInt("LOG_BUFFER_SIZE", 200)
	env := getEnv("ENVIRONMENT", "development")
	corsRaw := getEnv("CORS_ORIGINS", "*")

	origins := strings.Split(corsRaw, ",")
	for i := range origins {
		origins[i] = strings.TrimSpace(origins[i])
	}

	return &Config{
		Port:             port,
		LogBufferSize:    bufSize,
		LogRetentionDays: getEnvInt("LOG_RETENTION_DAYS", 30),
		CORSOrigins:      origins,
		Environment:      env,
		DBPath:           getEnv("DB_PATH", "./data/radix.db"),
		TursoURL:         getEnv("TURSO_URL", ""),
		TursoAuthToken:   getEnv("TURSO_AUTH_TOKEN", ""),
		NodeID:           getEnv("NODE_ID", defaultNodeID()),
		SyncPeers:        splitList(getEnv("SYNC_PEERS", "")),
		SyncToken:        getEnv("SYNC_TOKEN", ""),
		SyncInterval:     time.Duration(getEnvInt("SYNC_INTERVAL_SECONDS", 60)) * time.Second,
	}
}

// splitList parses a comma-separated setting, dropping blanks so a trailing
// comma or an empty variable yields no entries rather than one empty one.
func splitList(raw string) []string {
	var out []string
	for _, item := range strings.Split(raw, ",") {
		if item = strings.TrimSpace(item); item != "" {
			out = append(out, item)
		}
	}
	return out
}

// defaultNodeID keeps a single-node install working with no configuration,
// while still giving every write a stable origin. It only breaks down if two
// edge servers share a hostname, which is exactly when NODE_ID must be set by
// hand — the id is what tells two nodes' writes apart forever.
func defaultNodeID() string {
	if host, err := os.Hostname(); err == nil && host != "" {
		return host
	}
	return "node"
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func getEnvInt(key string, fallback int) int {
	if v := os.Getenv(key); v != "" {
		if n, err := strconv.Atoi(v); err == nil {
			return n
		}
	}
	return fallback
}
