# Respaldo de contenido para sembrar RADIX

`radix-seed-backup.zip` es un respaldo importable con contenido educativo real:
9 asignaturas, 4 temas por asignatura, un cuestionario por tema, un examen final
por asignatura, foro con hilos y respuestas, biblioteca con imágenes y videos, y
un curso poblado de estudiantes con notas y progreso.

No reemplaza a `go run ./cmd/seed` (que crea los tres usuarios de demostración y
un curso mínimo): esto es contenido de volumen para revisar la aplicación con
datos que se parecen a los de uso real.

## Contenido

| | |
|---|---|
| Asignaturas | 9 (Sistemas Distribuidos, Robótica, Redes, Bases de Datos, Matemática Discreta, Física, Biología Amazónica, Programación en Go, Teología) |
| Lecciones | 36, en markdown, con material incrustado y enlaces entre lecciones |
| Cuestionarios | 45 (36 por tema + 9 exámenes finales), 153 preguntas. Cada tema enlaza el suyo con `[[id]]`, que es lo que la vista de la lección muestra |
| Foro | 48 publicaciones entre hilos y respuestas, con 151 "me gusta" |
| Biblioteca | 36 archivos (imágenes, 2 videos, 7 lecturas escritas, 1 videojuego HTML) |
| Usuarios | 1 docente + 12 estudiantes |
| Filas totales | 1120 |

Usuarios: cualquier correo `@radix.edu` del respaldo con la contraseña
`radix2024` (la misma de `internal/seed`). El docente es
`elena.vasquez@radix.edu`.

No incluye la cola DTN ni los logs del servidor: son propios de cada nodo.

## Cómo importarlo

Desde la aplicación: **Monitor → Respaldo de la Base de Datos → Importar
respaldo**, con sesión de administrador.

Desde la terminal:

```bash
TOKEN=$(curl -s -X POST localhost:1323/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"carlos.mendoza@radix.local","password":"radix2024"}' | jq -r .token)

curl -X POST localhost:1323/api/v1/backup/import \
  -H "Authorization: Bearer $TOKEN" \
  -F file=@seeds/radix-seed-backup.zip
```

La importación **suma** a lo que ya exista y omite lo que colisione, así que
correrla dos veces no duplica nada y no borra datos previos.

## Cómo regenerarlo

```bash
cd seeds
python3 build_seed_backup.py             # usa los .lock.json y la caché
python3 build_seed_backup.py --refresh   # vuelve a resolver medios y videos
```

Requiere `python3` con `bcrypt` y `ffmpeg` en el PATH (para duración y
resolución de los medios, igual que hace el backend al subir un archivo).

- `seed_content.py` tiene todo el texto: asignaturas, lecciones, preguntas y
  foro. Es el archivo que se edita para agregar contenido.
- `build_seed_backup.py` resuelve los medios, descarga, calcula las relaciones
  (`lesson_links`, `quiz_links`, `forum_links`, matrículas, notas) y arma el zip.
- `media.lock.json` y `youtube.lock.json` fijan qué archivo de Wikimedia Commons
  y qué video de YouTube corresponde a cada entrada, para que dos ejecuciones
  produzcan el mismo resultado. Se pueden editar a mano si una elección
  automática no convence.
- Nada usa números aleatorios: matrículas, notas y fechas se derivan de un CRC de
  los identificadores, así que el zip es reproducible.

Antes de escribir el zip, el script valida claves foráneas, rangos de
`correct_index`, unicidad de cuestionario por lección y que ningún `[[id]]`
quede colgado. Si algo falla, no genera el archivo.

La prueba `TestSeedBackupImports` (en `backend/internal/handlers`) importa este
zip por el mismo camino que el endpoint y verifica el resultado. Si una
migración cambia una tabla que el respaldo transporta, esa prueba falla y hay
que regenerarlo.

## Medios

Las imágenes y videos vienen de Wikimedia Commons y conservan su licencia
original; la atribución está en `CREDITOS.md` dentro del zip y también como
material de la biblioteca ("Créditos de los materiales"). Los videos de YouTube
solo se enlazan, no se redistribuyen. Las guías y chuletas de lectura se
escribieron para este material.
