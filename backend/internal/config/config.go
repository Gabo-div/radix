package config

import (
	"os"
	"strconv"
	"strings"

	"github.com/joho/godotenv"
)

type Config struct {
	Port           string
	LogBufferSize  int
	CORSOrigins    []string
	Environment    string
	DBPath         string
	TursoURL       string
	TursoAuthToken string
}

func Load() *Config {
	godotenv.Load()

	port := getEnv("PORT", "1323")
	bufSize := getEnvInt("LOG_BUFFER_SIZE", 200)
	env := getEnv("ENVIRONMENT", "development")
	corsRaw := getEnv("CORS_ORIGINS", "*")

	origins := strings.Split(corsRaw, ",")
	for i := range origins {
		origins[i] = strings.TrimSpace(origins[i])
	}

	return &Config{
		Port:           port,
		LogBufferSize:  bufSize,
		CORSOrigins:    origins,
		Environment:    env,
		DBPath:         getEnv("DB_PATH", "./data/radix.db"),
		TursoURL:       getEnv("TURSO_URL", ""),
		TursoAuthToken: getEnv("TURSO_AUTH_TOKEN", ""),
	}
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
