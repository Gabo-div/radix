#!/usr/bin/env bash
#
# Recrea la red de pruebas desde cero: si ya está levantada la baja, la vuelve a
# construir, espera a que los nodos respondan y muestra las URLs.
#
#   ./testnet.sh              # 2 nodos
#   ./testnet.sh --three      # 3 nodos (A -> B -> C)
#   ./testnet.sh --no-build   # sin reconstruir imágenes
#   ./testnet.sh --open       # abre los frontends en el navegador
#
# El entorno no es persistente: al bajarlo no queda nada, y cada arranque vuelve
# a importar el zip semilla. Ver config/docker/testnet.yml.
set -euo pipefail

# Raíz del repositorio: el script se puede invocar desde cualquier directorio.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_FILE="$SCRIPT_DIR/config/docker/testnet.yml"

THREE=0
BUILD=1
OPEN=0
for arg in "$@"; do
	case "$arg" in
	-3 | --three) THREE=1 ;;
	--no-build) BUILD=0 ;;
	--open) OPEN=1 ;;
	-h | --help)
		# El bloque de comentarios de arriba es la ayuda: se imprime hasta la
		# primera línea que ya no sea comentario, así no se desincroniza.
		awk 'NR>2 && /^#/ {sub(/^# ?/, ""); print; next} NR>2 {exit}' "${BASH_SOURCE[0]}"
		exit 0
		;;
	*)
		echo "opción desconocida: $arg (probá --help)" >&2
		exit 2
		;;
	esac
done

if [ -t 1 ]; then
	BOLD=$(tput bold) DIM=$(tput dim) RESET=$(tput sgr0)
else
	BOLD="" DIM="" RESET=""
fi

step() { printf '\n%s==>%s %s\n' "$BOLD" "$RESET" "$1"; }
fail() {
	printf '\nerror: %s\n' "$1" >&2
	exit 1
}

command -v docker >/dev/null || fail "docker no está instalado"
command -v curl >/dev/null || fail "curl no está instalado (se usa para esperar a los nodos)"
docker info >/dev/null 2>&1 || fail "el demonio de docker no responde (¿está arrancado?)"
[ -f "$COMPOSE_FILE" ] || fail "no encuentro $COMPOSE_FILE"

# Los nodos, en el mismo orden en que se muestran al final.
NAMES=("A" "B")
IDS=("edge-a" "central")
WEB=(5173 5174)
API=(1323 1324)

COMPOSE=(docker compose -f "$COMPOSE_FILE")
if [ "$THREE" -eq 1 ]; then
	COMPOSE+=(--profile three)
	NAMES+=("C")
	IDS+=("edge-c")
	WEB+=(5175)
	API+=(1325)
fi

# Bajar primero, siempre: es lo que hace que el script sea repetible. --volumes y
# --remove-orphans para que no sobreviva nada de una corrida anterior, ni
# siquiera de una que tuviera más nodos que esta.
step "Bajando lo que hubiera"
"${COMPOSE[@]}" down --volumes --remove-orphans

step "Levantando ${#NAMES[@]} nodos"
UP=("${COMPOSE[@]}" up --detach)
[ "$BUILD" -eq 1 ] && UP+=(--build)
"${UP[@]}"

# Esperar de verdad a que respondan: `up --detach` vuelve en cuanto los
# contenedores arrancan, pero cada backend todavía tiene que aplicar las
# migraciones e importar el zip semilla (unos segundos, más en el primer
# arranque).
wait_for() {
	local url="$1" label="$2" deadline=$((SECONDS + 180))
	printf '    %-28s' "$label"
	while [ "$SECONDS" -lt "$deadline" ]; do
		# Sin -f: un 401 del backend ya prueba que está sirviendo.
		if curl -s -o /dev/null -m 2 "$url"; then
			printf 'listo\n'
			return 0
		fi
		printf '.'
		sleep 2
	done
	printf '\n'
	fail "$label no respondió tras 180 s. Mirá los logs con:
  ${COMPOSE[*]} logs"
}

step "Esperando a los nodos"
for i in "${!NAMES[@]}"; do
	wait_for "http://localhost:${API[$i]}/api/v1/courses" "backend ${NAMES[$i]} (:${API[$i]})"
	wait_for "http://localhost:${WEB[$i]}/" "frontend ${NAMES[$i]} (:${WEB[$i]})"
done

step "Red de pruebas lista"
echo
for i in "${!NAMES[@]}"; do
	printf '  Nodo %s  %s%-30s%s  api :%s  %s%s%s\n' \
		"${NAMES[$i]}" "$BOLD" "http://localhost:${WEB[$i]}" "$RESET" \
		"${API[$i]}" "$DIM" "${IDS[$i]}" "$RESET"
done
cat <<EOF

  Entrar con  ${BOLD}elena.vasquez@radix.edu${RESET} / ${BOLD}radix2024${RESET}  (docente, tiene Panel Admin)

  ${DIM}Los dos nodos arrancan con el mismo contenido del zip semilla. Editá algo en
  uno y aparece en el otro dentro de unos 15 s. Para ver la cola DTN llenarse,
  parar un backend y seguir trabajando en el otro:${RESET}

    ${COMPOSE[*]} stop backend-b
    ${COMPOSE[*]} start backend-b

  ${DIM}Logs:${RESET}    ${COMPOSE[*]} logs -f backend-a backend-b
  ${DIM}Apagar:${RESET}  ${COMPOSE[*]} down
EOF

if [ "$OPEN" -eq 1 ]; then
	for port in "${WEB[@]}"; do
		(xdg-open "http://localhost:$port" >/dev/null 2>&1 || open "http://localhost:$port" >/dev/null 2>&1) &
	done
	wait
fi
