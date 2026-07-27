# RADIX — Educación Offline 🌿

**RADIX** es un sistema educativo offline que simula un servidor de borde (Raspberry Pi) ejecutándose en la Amazonía. Combina un **backend RESTful en Go** con una **SPA en React** para ofrecer una experiencia LMS completa sin conexión a internet.

Los archivos se suben localmente al servidor de borde, los estudiantes consumen contenido offline ganando XP, y una cola DTN (Delay-Tolerant Networking) registra las transacciones para sincronización oportunista con un servidor central cuando la conectividad lo permita.

---

## ✨ Funcionalidades

- **3 roles con RBAC:** Profesor (Admin), Estudiante (User), Invitado (Guest)
- **LMS Offline:** Cursos con lecciones en markdown, quizzes, XP y medallas
- **Biblioteca Multimedia:** Upload real de archivos (video, audio, imagen, PDF, texto) con preview inline
- **Wiki Syntax `[[id]]`:** Enlaza archivos dentro del contenido de las lecciones, se renderizan como media embebido
- **Editor de Lecciones:** CodeMirror 6 con syntax highlight para `[[id]]`, hover tooltip con preview, y sidebar de archivos enlazados
- **Monitor del Servidor:** Métricas en tiempo real (disco, usuarios activos, cola DTN)
- **Observabilidad:** Página de Logs dedicada — tail en vivo, historial filtrable (nivel/fecha/texto libre vía full-text search) y estadísticas, con retención configurable
- **Auto-detección de metadatos:** ffprobe extrae duración y resolución automáticamente al subir archivos
- **Sincronización entre nodos:** Cola DTN real — cada escritura se anota como una operación reproducible, los nodos pares tiran solo lo que les falta, los conflictos se resuelven por versión de fila y los archivos se descargan aparte
- **Red de pruebas en Docker:** Varios servidores de borde completos hablando entre sí en una máquina (`./testnet.sh`)
- **Autenticación real:** Login por email/contraseña (bcrypt) + acceso invitado sin credenciales

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología |
|---|---|
| **Backend** | [Go](https://go.dev/) 1.25, [Echo v5](https://echo.labstack.com/), [godotenv](https://github.com/joho/godotenv) |
| **Frontend** | [React](https://react.dev/) 19, [TypeScript](https://www.typescriptlang.org/), [Vite](https://vitejs.dev/) 6 |
| **Routing** | [React Router](https://reactrouter.com/) v6 |
| **Estilos** | [Tailwind CSS](https://tailwindcss.com/) v3 |
| **Editor** | [CodeMirror 6](https://codemirror.net/) via `@uiw/react-codemirror` |
| **Markdown** | `react-markdown` + `remark-gfm` |
| **Iconos** | [lucide-react](https://lucide.dev/) |
| **Media Metadata** | [ffprobe](https://ffmpeg.org/ffprobe.html) (FFmpeg) |

---

## 📋 Prerrequisitos

- [Docker](https://docs.docker.com/get-docker/) — la base de datos corre en un contenedor, y la red de pruebas entera también
- [Go](https://go.dev/dl/) 1.25+
- [Bun](https://bun.sh/) 1.3+ o [Node.js](https://nodejs.org/) 18+
- [ffprobe](https://ffmpeg.org/) (para auto-detección de metadatos multimedia)

Para solo levantar la red de pruebas alcanza con Docker: ver
[Red de prueba en Docker](#red-de-prueba-en-docker).

---

## 🚀 Inicio Rápido

> Para ver el sistema distribuido completo sin instalar nada más que Docker, saltar a
> [Red de prueba en Docker](#red-de-prueba-en-docker).

```bash
# 1. Clonar el repositorio
git clone <url>
cd radix

# 2. Iniciar el backend
cd backend
cp .env.example .env        # Configurar puerto si es necesario
go run ./cmd/server          # Servidor en :1323

# 3. En otra terminal, iniciar el frontend
cd frontend
cp .env.example .env
bun install
bun run dev                  # SPA en :5173 (proxy automático al backend)
```

Abrir [http://localhost:5173](http://localhost:5173) e iniciar sesión (ver credenciales abajo) o entrar como invitado.

---

## 🔑 Credenciales de prueba

Usuarios creados por `go run ./cmd/seed`. Todos comparten la misma contraseña, solo cambia el email:

| Rol | Email | Password |
|---|---|---|
| Admin | `carlos.mendoza@radix.local` | `radix2024` |
| Student | `sofia.ramirez@radix.local` | `radix2024` |
| Student | `mateo.torres@radix.local` | `radix2024` |

Invitado no requiere credenciales (botón "Entrar como invitado" en el login).

---

## ⚙️ Configuración

### Backend (`.env`)

| Variable | Default | Descripción |
|---|---|---|
| `PORT` | `1323` | Puerto del servidor Go |
| `NODE_ID` | hostname | Identidad de este nodo; se graba en cada fila y resuelve los empates al fusionar datos de otro nodo |
| `SYNC_PEERS` | vacío | URLs base de los nodos pares de los que tirar operaciones, separadas por coma. Vacío = nodo aislado |
| `SYNC_TOKEN` | vacío | Secreto compartido para `GET /sync/ops`. Vacío cierra ese endpoint |
| `SYNC_INTERVAL_SECONDS` | `60` | Cada cuánto se intenta una ronda de sincronización |
| `ENV_FILE` | `.env` | Archivo de configuración a cargar; permite correr un segundo nodo desde el mismo checkout |
| `LOG_BUFFER_SIZE` | `200` | Máximo de líneas en el ring buffer de logs |
| `CORS_ORIGINS` | `*` | Orígenes CORS permitidos (separados por coma) |
| `ENVIRONMENT` | `development` | Entorno (`development` / `production`) |
| `LOG_RETENTION_DAYS` | `30` | Días de retención de logs en el historial buscable |

### Frontend (`.env`)

| Variable | Default | Descripción |
|---|---|---|
| `VITE_API_PORT` | `1323` | Puerto del backend para el proxy de Vite |

---

## 📁 Estructura del Proyecto

```
radix/
├── backend/                          # Backend Go
│   ├── cmd/
│   │   ├── server/main.go           # Entry point: grafo de dependencias con uber/fx
│   │   ├── seed/main.go             # Datos demo, o `-zip` para importar un respaldo
│   │   └── flush/main.go            # Vacía todas las tablas dejando el esquema
│   ├── internal/
│   │   ├── config/config.go         # Carga de .env + struct de configuración
│   │   ├── models/models.go         # Tipos de datos (User, Lesson, Quiz, LibraryItem...)
│   │   ├── database/                # Migraciones goose + esquema + código generado por sqlc
│   │   ├── store/
│   │   │   ├── store.go             # Adaptador sqlc ↔ models, y sesiones en memoria
│   │   │   ├── backup.go            # Export/import genérico por reflexión, fusión por versión
│   │   │   ├── version.go           # Columnas (hlc, origin_node) y regla de conflicto
│   │   │   └── ops.go               # Cola DTN: registrar, aplicar y reenviar operaciones
│   │   ├── clock/hlc.go             # Reloj lógico monótono (el Pi no tiene RTC ni NTP)
│   │   ├── dtn/syncer.go            # Tira de los nodos pares y baja los archivos que falten
│   │   ├── backupzip/               # Lectura del zip de respaldo (la usan el handler y el seed)
│   │   ├── seed/seed.go             # Datos de prueba realistas (3 usuarios, 3 cursos, 6 lecciones...)
│   │   ├── auth/auth.go             # Login email/password (bcrypt) + guest + sesiones + middleware RBAC
│   │   ├── middleware/
│   │   │   ├── logger.go            # Ring buffer en memoria + middleware de logging por request
│   │   │   ├── observability_core.go # Core de zap que unifica stdout + tail en vivo + DB en un solo log call
│   │   │   └── log_persister.go     # Batching async a server_logs + limpieza por retención
│   │   └── handlers/               # Handlers REST por entidad
│   │       ├── handlers.go          # Struct Handler + RegisterRoutes()
│   │       ├── library.go           # Upload multipart + ffprobe + detail + file serve + usage
│   │       ├── courses.go           # CRUD de cursos y lecciones
│   │       ├── quizzes.go           # Creación y corrección de quizzes
│   │       ├── monitor.go           # Métricas y cola DTN
│   │       ├── backup.go            # Exportar/importar la base como zip
│   │       ├── sync.go              # Rutas que consume otro nodo (token compartido)
│   │       └── logs.go              # Tail en vivo + historial filtrable + stats
│   ├── uploads/                     # Archivos subidos (gitignored)
│   ├── Dockerfile                   # Solo para la red de pruebas
│   ├── .env / .env.example / .env.b.example
│   └── go.mod
│
├── frontend/                         # Frontend React + Vite
│   ├── src/
│   │   ├── types/index.ts           # Interfaces TS espejo de los structs Go
│   │   ├── lib/
│   │   │   ├── api.ts               # Cliente fetch tipado con auth token
│   │   │   ├── markdown.ts          # Parser de [[id]] + extractor de TOC
│   │   │   ├── codemirror-wiki.ts   # Extensiones CodeMirror (highlight + tooltip para [[id]])
│   │   │   └── rbac.ts             # Helpers de permisos por rol
│   │   ├── context/AuthContext.tsx  # Estado global de autenticación
│   │   ├── components/
│   │   │   ├── layout/             # Header + NavItems, RootLayout, ReadingLayout, LessonSidebar
│   │   │   ├── common/             # ProtectedRoute, BackLink, AppearancePanel, modales de selección
│   │   │   ├── admin/              # MonitorPanel y LogsPanel (pestañas del Panel Admin)
│   │   │   ├── ui/                 # Card, Button, ProgressBar, Badge
│   │   │   ├── InlineMedia.tsx     # Renderiza media embebido según tipo
│   │   │   └── MarkdownEditor.tsx  # Editor CodeMirror 6 con toolbar
│   │   └── pages/
│   │       ├── Login.tsx            # Form email/password + botón invitado
│   │       ├── Library.tsx          # Grid con filtros + upload
│   │       ├── LibraryDetail.tsx    # Preview + metadatos + editar
│   │       ├── Courses.tsx          # Lista de cursos
│   │       ├── CourseDetail.tsx     # Lecciones + botones crear/editar
│   │       ├── LessonViewer.tsx     # Visor con media embebido + quiz + sidebar
│   │       ├── LessonEditor.tsx     # Editor dedicado (crear/editar)
│   │       ├── student/Dashboard.tsx # Progreso, XP, medallas
│   │       └── admin/AdminPanel.tsx # Tres pestañas: General, Monitor y Logs
│   ├── Dockerfile / nginx.conf.template  # Solo para la red de pruebas
│   ├── .env / .env.example
│   └── package.json
│
├── config/docker/
│   ├── docker-compose.yml           # Base de datos para desarrollo
│   └── testnet.yml                  # Red de pruebas: N nodos completos, efímeros
├── seeds/                           # Zip semilla + el generador que lo produce
├── docs/                            # Informes para la entrega universitaria
├── testnet.sh                       # Recrea la red de pruebas y muestra las URLs
└── README.md
```

---

## 🔌 API REST

Todas las rutas bajo `/api/v1/`. Autenticación vía `Authorization: Bearer <token>` o `?token=<token>` (para media embebido).

| Método | Ruta | Rol | Descripción |
|---|---|---|---|
| `POST` | `/auth/login` | público | Login: `{"email", "password"}` → `{token, user}` |
| `POST` | `/auth/guest` | público | Login invitado (sin credenciales) → `{token, user}` |
| `POST` | `/auth/logout` | auth | Invalida sesión |
| `GET` | `/library` | auth | Lista items (`?type=&category=` filtros) |
| `GET` | `/library/:id` | auth | Detalle del item |
| `PATCH` | `/library/:id` | admin | Editar título/categoría |
| `GET` | `/library/:id/file` | auth | Servir archivo (soporta `?token=` para media) |
| `GET` | `/library/:id/usage` | auth | Lecciones que enlazan este archivo vía `[[id]]` (calculado en vivo) |
| `POST` | `/library` | admin | Subir archivo (`multipart/form-data`) |
| `GET` | `/courses` | auth | Lista cursos |
| `POST` | `/courses` | admin | Crear curso |
| `GET` | `/courses/:id` | auth | Curso + lecciones |
| `POST` | `/courses/:id/lessons` | admin | Crear lección |
| `GET` | `/courses/:cId/lessons/:lId` | auth | Lección + quiz (oculto a guest) |
| `PUT` | `/lessons/:id` | admin | Editar lección (título + contenido) |
| `POST` | `/quizzes` | admin | Crear quiz con preguntas |
| `GET` | `/quizzes/:id` | auth† | Ver quiz (†no guest) |
| `POST` | `/quizzes/:id/submit` | student | Responder → corrige y registra la nota |
| `GET` | `/monitor` | admin | Métricas (disco, usuarios, cola DTN, nodos pares) |
| `POST` | `/monitor/sync` | admin | Ejecutar una ronda de sincronización ahora |
| `GET` | `/sync/ops` | nodo par | Registro de operaciones desde un cursor (`?since=&limit=&node=`), autenticado con `SYNC_TOKEN` |
| `GET` | `/sync/file/:id` | nodo par | Archivo de un item de biblioteca, para que el nodo par complete lo que la operación no lleva |
| `GET` | `/logs` | auth | Últimas N líneas del log del servidor (tail en vivo) |
| `GET` | `/logs/history` | admin | Historial filtrable (`?level=&from=&to=&q=&limit=&offset=`) |
| `GET` | `/logs/stats` | admin | Conteos por nivel + retención configurada (`?from=&to=`) |

---

## 🔄 Sincronización entre nodos

Cada servidor de borde anota todo lo que escribe como una **operación** reproducible en otro nodo: qué tabla, qué fila, qué versión y la fila entera. Un nodo par pide las operaciones que le faltan (`GET /sync/ops?since=N`) en vez de mandarse la base completa.

- **Store-and-forward.** Nada espera a la red: la escritura se guarda con su operación al lado, y sale cuando hay enlace. Si no lo hay, se reintenta en la ronda siguiente, indefinidamente.
- **Tira, no empuja.** Cada nodo lleva su propio cursor sobre el registro del otro. El que tiene energía y señal es el que inicia.
- **Idempotente.** La identidad de una operación es `(nodo de origen, tabla, clave, versión)`, con un índice único detrás: recibirla dos veces no hace nada.
- **Se reenvía.** Una operación aplicada se guarda conservando su origen, así que A → B → C converge sin que A y C se vean nunca.
- **Conflictos por versión.** Si dos nodos editaron la misma fila, gana la de `(hlc, origin_node)` mayor. El `hlc` es un reloj lógico monótono: un Raspberry Pi sin RTC ni NTP tiene la hora mal, y un simple timestamp resolvería los conflictos al revés.
- **Los borrados viajan.** Son operaciones como cualquier otra, y el propio registro hace de lápida: una edición vieja que llega después de un borrado no resucita la fila.

El respaldo ZIP sigue existiendo para lo que un delta no puede hacer: arrancar un nodo nuevo desde cero, y mover contenido a mano cuando no hay red.

- **Los archivos viajan aparte.** Una operación lleva la fila de la biblioteca, no los bytes. Después de aplicar operaciones, el nodo compara su inventario contra la carpeta `uploads/` y se baja lo que le falte (`GET /sync/file/:id`). Como compara el inventario entero y no solo lo recién llegado, también repara una transferencia que se cortó a la mitad.

**Techo conocido:** las operaciones no se podan todavía. Un nodo desconectado más tiempo del que se conserven tendrá que arrancar otra vez desde un ZIP.

### Red de prueba en Docker

Varios servidores de borde completos — base de datos, backend y frontend cada uno — hablando entre sí en la misma máquina. No es persistente a propósito: sirve para ver el sistema distribuido funcionando y para las capturas del informe, no para trabajar.

```bash
./testnet.sh              # recrea el entorno y muestra las URLs
./testnet.sh --three      # 3 nodos (A -> B -> C)
./testnet.sh --no-build   # sin reconstruir imágenes
./testnet.sh --open       # además abre los frontends
```

El script baja lo que hubiera, vuelve a levantar todo, espera a que cada nodo
responda de verdad (aplicar migraciones e importar el zip lleva unos segundos) y
recién ahí imprime las direcciones. Es repetible: correrlo otra vez deja el
entorno como recién nacido.

A mano, si preferís:

```bash
docker compose -f config/docker/testnet.yml up --build           # 2 nodos
docker compose -f config/docker/testnet.yml --profile three up   # 3 nodos
docker compose -f config/docker/testnet.yml down                 # no queda nada
```

| Nodo | Frontend | Backend | `NODE_ID` |
|---|---|---|---|
| A | http://localhost:5173 | `:1323` | `edge-a` |
| B | http://localhost:5174 | `:1324` | `central` |
| C (perfil `three`) | http://localhost:5175 | `:1325` | `edge-c` |

Las bases de datos **no** publican puertos: solo se llega a ellas a través de su propio backend, igual que en el equipo real. Los datos de sqld y los archivos subidos viven en tmpfs, así que apagar el entorno lo borra entero; cada arranque vuelve a importar el mismo zip semilla, con lo que los tres nodos parten del mismo contenido y de ahí divergen.

Entrar con cualquier correo `@radix.edu` del zip y la contraseña `radix2024` (el docente es `elena.vasquez@radix.edu`). El intervalo de sincronización está en 15 s en vez de 60 para no quedarse esperando.

Qué mirar:

1. Editá una lección en el nodo A y recargá el nodo B: aparece corregida.
2. Subí un archivo en A y abrilo en B — la operación lleva la fila, y el archivo se descarga aparte.
3. Parala: `docker compose -f config/docker/testnet.yml stop backend-b`. Seguí trabajando en A y mirá crecer la cola en Panel Admin → Monitor. Al hacer `start backend-b`, se vacía sola.
4. Con el tercer nodo, C solo tira de B y B no sabe que C existe: lo escrito en A igual llega a C, reenviado por B. (Por lo mismo, el enlace de C es de una sola dirección: lo que se escriba en C se queda ahí.)

### Dos nodos en una máquina (desarrollo)

Para iterar sobre el código con recarga en caliente, sin contenedores para la aplicación:

```bash
# Base de datos del segundo nodo
cd config/docker && docker compose --profile peer up -d

# Configuración del segundo nodo
cp backend/.env.b.example backend/.env.b     # PORT=1324, NODE_ID=central, :8081

# En backend/.env (primer nodo): NODE_ID=edge-a, SYNC_PEERS=http://localhost:1324
# y el mismo SYNC_TOKEN en los dos.

cd backend && ENV_FILE=.env.b go run ./cmd/server   # nodo B
cd backend && go run ./cmd/server                   # nodo A (otra terminal)

cd frontend && bun run dev                             # UI del nodo A
cd frontend && VITE_API_PORT=1324 bun run dev --port 5174   # UI del nodo B
```

Este camino usa la base del segundo nodo dentro de Docker pero corre backend y frontend en el host, con recarga en caliente. Para solo ver el sistema funcionando, la red de prueba de arriba es menos trabajo.

---

## 👥 Roles y Permisos

| Funcionalidad | Admin | Student | Guest |
|---|---|---|---|
| Dashboard personal con XP/medallas | — | ✅ | — |
| Explorar cursos y lecciones | ✅ | ✅ | ✅ |
| Crear / editar cursos | ✅ | — | — |
| Crear / editar lecciones | ✅ | — | — |
| Subir / editar archivos | ✅ | — | — |
| Ver quizzes | ✅ | ✅ | ❌ |
| Responder quizzes | — | ✅ | — |
| Ganar XP y medallas | — | ✅ | — |
| Monitor del servidor | ✅ | — | — |
| Logs (tail en vivo + historial + stats) | ✅ | ❌ | ❌ |

---

## 🧠 Modelo de Datos

```go
type User struct {
    ID, Name, Email string
    PasswordHash string // no serializado
    Role     Role  // "admin" | "student" | "guest"
    Points   int
    CompletedLessons []string
}

type LibraryItem struct {
    ID, Title, Type, Category string // Type: video|audio|image|pdf|text|document
    SizeKB int
    MimeType, OriginalFilename string
    UploadedBy, UploadedAt, ModifiedAt string
    Duration, Resolution string // auto-detectados por ffprobe
    FilePath string // interno, no serializado
}

type Lesson struct {
    ID, CourseID, Title, ContentText string
    QuizID *string
}

type ServerLog struct {
    ID int64
    Timestamp, Level, Message string
    Fields string // JSON genérico — método/path/rol/status/duración para requests, lo que sea para otros logs
}

type Quiz struct {
    ID, LessonID string
    Questions []QuizQuestion // { Text, Options[], CorrectIndex }
}

type Course struct {
    ID, Title, Description, Category string
}

// Una operación: lo que viaja entre nodos. Identidad = (OriginNode, Table, PK, HLC).
type SyncOp struct {
    Seq int64            // orden local; cambia al reenviarse
    OriginNode string    // quién la produjo primero, se conserva
    Table, PK string
    Op string            // "upsert" | "delete"
    HLC int64            // versión: reloj lógico monótono
    Payload map[string]any // la fila entera (vacío en un delete)
    Label, CreatedAt string
}

type SyncQueue struct {
    TransactionCount int  // operaciones que ningún nodo par confirmó leer
    Logs []string
    Peers []SyncPeer      // { Peer, NodeID, LastSeq, LastSyncAt, LastError }
}
```

---

## 🖥️ Rutas del Frontend

| Ruta | Componente | Rol | Descripción |
|---|---|---|---|
| `/login` | Login | público | Login email/password + acceso invitado |
| `/dashboard` | StudentDashboard | student | Progreso, XP, medallas |
| `/library` | Library | todos | Grid de archivos con filtros |
| `/library/:id` | LibraryDetail | todos | Preview + metadatos + editar (admin) |
| `/courses` | Courses | todos | Lista de cursos |
| `/courses/:id` | CourseDetail | todos | Lecciones del curso |
| `/courses/:id/lessons/new` | LessonEditor | admin | Editor completo con CodeMirror |
| `/courses/:id/lessons/:lid/edit` | LessonEditor | admin | Editar lección existente |
| `/courses/:id/lessons/:lid` | LessonViewer | todos | Visor con media embebido + quiz |
| `/admin` | AdminPanel | admin | Crear cursos |
| `/admin/monitor` | Monitor | admin | Disco, sesiones activas, cola DTN |
| `/admin/logs` | Logs | admin | Tail en vivo + historial filtrable + stats |

---

## 📝 Wiki Syntax `[[id]]`

Dentro del contenido de cualquier lección (en markdown), puedes enlazar archivos de la biblioteca usando la sintaxis:

```markdown
# Introducción a la Biología

Lee [[lib1]] para una introducción completa.

Luego mira [[lib2]] y escucha [[lib3]] como material complementario.
```

Cada `[[id]]` se renderiza automáticamente como media embebido:

| Tipo de archivo | Renderizado |
|---|---|
| `video` | `<video controls>` con streaming |
| `audio` | `<audio controls>` |
| `image` | `<img>` con preview |
| `pdf` | `<iframe>` embebido |
| `text` | `<pre>` con fetch del contenido |
| `document` | Card con icono + descarga |

En el editor, los `[[id]]` se resaltan con syntax highlighting (CodeMirror) y al hacer hover se muestra un tooltip con los metadatos del archivo. La barra lateral derecha lista todos los archivos enlazados en tiempo real.

La página de detalle de un archivo en la Biblioteca muestra en qué lecciones se usa — calculado en vivo buscando `[[id]]` en el contenido de las lecciones (sin tabla de relación separada), así que si editás o eliminás una lección se refleja automáticamente.

---

## 📸 Capturas de Pantalla

*(Agrega capturas aquí)*

---

## 📄 Licencia

Proyecto académico — Universidad.
