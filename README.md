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
- **Monitor del Servidor:** Métricas en tiempo real (disco, usuarios activos, cola DTN) y logs estilo stdout de Go
- **Auto-detección de metadatos:** ffprobe extrae duración y resolución automáticamente al subir archivos
- **Sincronización Oportunista:** Cola de consistencia eventual (CRDT/DTN) con botón forzar sync

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

- [Go](https://go.dev/dl/) 1.25+
- [Bun](https://bun.sh/) 1.3+ o [Node.js](https://nodejs.org/) 18+
- [ffprobe](https://ffmpeg.org/) (para auto-detección de metadatos multimedia)

---

## 🚀 Inicio Rápido

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

Abrir [http://localhost:5173](http://localhost:5173) y seleccionar un rol en la pantalla de login.

---

## ⚙️ Configuración

### Backend (`.env`)

| Variable | Default | Descripción |
|---|---|---|
| `PORT` | `1323` | Puerto del servidor Go |
| `LOG_BUFFER_SIZE` | `200` | Máximo de líneas en el ring buffer de logs |
| `CORS_ORIGINS` | `*` | Orígenes CORS permitidos (separados por coma) |
| `ENVIRONMENT` | `development` | Entorno (`development` / `production`) |

### Frontend (`.env`)

| Variable | Default | Descripción |
|---|---|---|
| `VITE_API_PORT` | `1323` | Puerto del backend para el proxy de Vite |

---

## 📁 Estructura del Proyecto

```
radix/
├── backend/                          # Backend Go
│   ├── cmd/server/main.go           # Entry point (config → store → seed → echo → start)
│   ├── internal/
│   │   ├── config/config.go         # Carga de .env + struct de configuración
│   │   ├── models/models.go         # Tipos de datos (User, Lesson, Quiz, LibraryItem...)
│   │   ├── store/store.go           # DB en memoria thread-safe con sync.RWMutex
│   │   ├── seed/seed.go             # Datos de prueba realistas (3 usuarios, 3 cursos, 6 lecciones...)
│   │   ├── auth/auth.go             # Sesiones token + middleware RBAC
│   │   ├── middleware/logger.go     # Ring buffer de logs + middleware estilo stdout
│   │   └── handlers/               # Handlers REST por entidad
│   │       ├── handlers.go          # Struct Handler + RegisterRoutes()
│   │       ├── library.go           # Upload multipart + ffprobe + detail + file serve
│   │       ├── courses.go           # CRUD de cursos y lecciones + linking
│   │       ├── quizzes.go           # Creación y corrección de quizzes
│   │       ├── monitor.go           # Métricas y cola DTN
│   │       └── logs.go              # Endpoint de logs
│   ├── uploads/                     # Archivos subidos (gitignored)
│   ├── .env / .env.example
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
│   │   │   ├── layout/             # Header, Sidebar, RootLayout, TerminalConsole
│   │   │   ├── common/             # ProtectedRoute, FilePickerModal
│   │   │   ├── ui/                 # Card, Button, ProgressBar, Badge
│   │   │   ├── InlineMedia.tsx     # Renderiza media embebido según tipo
│   │   │   └── MarkdownEditor.tsx  # Editor CodeMirror 6 con toolbar
│   │   └── pages/
│   │       ├── Login.tsx            # 3 tarjetas de login (Admin/Student/Guest)
│   │       ├── Library.tsx          # Grid con filtros + upload
│   │       ├── LibraryDetail.tsx    # Preview + metadatos + editar
│   │       ├── Courses.tsx          # Lista de cursos
│   │       ├── CourseDetail.tsx     # Lecciones + botones crear/editar
│   │       ├── LessonViewer.tsx     # Visor con media embebido + quiz + sidebar
│   │       ├── LessonEditor.tsx     # Editor dedicado (crear/editar)
│   │       ├── student/Dashboard.tsx # Progreso, XP, medallas
│   │       ├── admin/AdminPanel.tsx # Crear cursos
│   │       └── admin/Monitor.tsx    # Métricas + logs del servidor
│   ├── .env / .env.example
│   └── package.json
│
└── README.md
```

---

## 🔌 API REST

Todas las rutas bajo `/api/v1/`. Autenticación vía `Authorization: Bearer <token>` o `?token=<token>` (para media embebido).

| Método | Ruta | Rol | Descripción |
|---|---|---|---|
| `POST` | `/auth/login` | público | Login: `{"role": "admin" | "student" | "guest"}` → `{token, user}` |
| `POST` | `/auth/logout` | auth | Invalida sesión |
| `GET` | `/library` | auth | Lista items (`?type=&category=` filtros) |
| `GET` | `/library/:id` | auth | Detalle del item |
| `PATCH` | `/library/:id` | admin | Editar título/categoría |
| `GET` | `/library/:id/file` | auth | Servir archivo (soporta `?token=` para media) |
| `POST` | `/library` | admin | Subir archivo (`multipart/form-data`) |
| `GET` | `/courses` | auth | Lista cursos |
| `POST` | `/courses` | admin | Crear curso |
| `GET` | `/courses/:id` | auth | Curso + lecciones |
| `POST` | `/courses/:id/lessons` | admin | Crear lección |
| `GET` | `/courses/:cId/lessons/:lId` | auth | Lección + media + quiz (oculto a guest) |
| `PUT` | `/lessons/:id` | admin | Editar lección (título + contenido) |
| `PATCH` | `/lessons/:lId/link` | admin | Vincular archivo principal (`libraryItemId`) |
| `POST` | `/quizzes` | admin | Crear quiz con preguntas |
| `GET` | `/quizzes/:id` | auth† | Ver quiz (†no guest) |
| `POST` | `/quizzes/:id/submit` | student | Responder → corrige, suma XP, encola sync |
| `GET` | `/monitor` | admin | Métricas (disco, usuarios, cola DTN) |
| `POST` | `/monitor/sync` | admin | Vaciar cola de transacciones |
| `GET` | `/logs` | auth | Últimas N líneas del log del servidor |

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
| Logs del servidor | ✅ (en Monitor) | ❌ | ❌ |

---

## 🧠 Modelo de Datos

```go
type User struct {
    ID, Name string
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
    LibraryItemID, QuizID *string
}

type Quiz struct {
    ID, LessonID string
    Questions []QuizQuestion // { Text, Options[], CorrectIndex }
}

type Course struct {
    ID, Title, Description, Category string
}

type SyncQueue struct {
    TransactionCount int
    Logs []string
}
```

---

## 🖥️ Rutas del Frontend

| Ruta | Componente | Rol | Descripción |
|---|---|---|---|
| `/login` | Login | público | Pantalla de inicio con 3 roles |
| `/dashboard` | StudentDashboard | student | Progreso, XP, medallas |
| `/library` | Library | todos | Grid de archivos con filtros |
| `/library/:id` | LibraryDetail | todos | Preview + metadatos + editar (admin) |
| `/courses` | Courses | todos | Lista de cursos |
| `/courses/:id` | CourseDetail | todos | Lecciones del curso |
| `/courses/:id/lessons/new` | LessonEditor | admin | Editor completo con CodeMirror |
| `/courses/:id/lessons/:lid/edit` | LessonEditor | admin | Editar lección existente |
| `/courses/:id/lessons/:lid` | LessonViewer | todos | Visor con media embebido + quiz |
| `/admin` | AdminPanel | admin | Crear cursos |
| `/admin/monitor` | Monitor | admin | Métricas + logs del servidor |

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

---

## 📸 Capturas de Pantalla

*(Agrega capturas aquí)*

---

## 📄 Licencia

Proyecto académico — Universidad.
