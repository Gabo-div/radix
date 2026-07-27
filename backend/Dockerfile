# Backend image for the throwaway test network (config/docker/testnet.yml).
# Not a production image: it carries no data, and everything it writes lives in
# the container or in tmpfs, so `docker compose down` leaves nothing behind.

FROM golang:1.25-alpine AS build
WORKDIR /src

COPY go.mod go.sum ./
RUN go mod download

COPY . .
# CGO_ENABLED=0 works because both database drivers are pure Go: tursogo for
# local-only mode and the libsql HTTP client for remote mode, which is the one
# these containers use against their own sqld.
RUN CGO_ENABLED=0 go build -trimpath -o /out/server ./cmd/server \
 && CGO_ENABLED=0 go build -trimpath -o /out/seed ./cmd/seed

FROM alpine:3.21
# ffprobe reads duration/resolution when a file is uploaded — without it an
# upload still works, it just stores no media metadata.
RUN apk add --no-cache ffmpeg ca-certificates

WORKDIR /app
COPY --from=build /out/server /out/seed ./
COPY docker-entrypoint.sh ./
# data/ only holds sessions.json in remote mode; uploads/ is where library files
# land, and the compose file mounts tmpfs over it.
RUN mkdir -p /app/uploads /app/data

EXPOSE 1323
ENTRYPOINT ["/app/docker-entrypoint.sh"]
