#!/bin/sh
# Seeds the database, then runs the server.
#
# The seed doubles as the readiness check: it opens the database and applies the
# migrations, so if it succeeds sqld is up and the schema is current. That's why
# there's no separate wait-for-it — one thing that has to work anyway, instead of
# a health probe that could disagree with it.
set -e

seed_once() {
	if [ -n "$SEED_ZIP" ]; then
		/app/seed -zip "$SEED_ZIP"
	else
		/app/seed
	fi
}

attempt=0
until seed_once; do
	attempt=$((attempt + 1))
	if [ "$attempt" -ge 30 ]; then
		echo "la base de datos no respondió tras $attempt intentos" >&2
		exit 1
	fi
	echo "esperando a la base de datos (intento $attempt)..."
	sleep 2
done

exec /app/server
