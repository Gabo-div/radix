#!/usr/bin/env python3
"""Builds seeds/radix-seed-backup.zip: an importable RADIX backup with real
educational content (8 asignaturas, 4 temas each, quizzes, forum, media).

The zip is the same layout POST /api/v1/backup/import expects:

    manifest.json
    data/<table>.json
    uploads/<library_item_id>_<filename>

Media comes from Wikimedia Commons (freely licensed) and the recommended videos
are YouTube links resolved by search. Both resolutions are pinned in
media.lock.json / youtube.lock.json so a re-run reproduces the same zip and
works offline once the cache is warm.

    python3 seeds/build_seed_backup.py            # build (uses locks + cache)
    python3 seeds/build_seed_backup.py --refresh  # re-resolve media/videos
"""

import argparse
import json
import mimetypes
import os
import re
import subprocess
import sys
import time
import urllib.parse
import urllib.request
import zipfile
import zlib
from pathlib import Path

import bcrypt

import seed_content as content

HERE = Path(__file__).resolve().parent
OUT_ZIP = HERE / "radix-seed-backup.zip"
MEDIA_LOCK = HERE / "media.lock.json"
YOUTUBE_LOCK = HERE / "youtube.lock.json"
CACHE = Path(os.environ.get("RADIX_SEED_CACHE", "/tmp/radix-seed-cache"))

UA = "RADIX-seed-builder/1.0 (universidad; contacto via repositorio)"
COMMONS_API = "https://commons.wikimedia.org/w/api.php"
SEED_PASSWORD = "radix2024"  # same demo password as internal/seed
BASE_DATE = "2026-03-02"     # inicio del semestre simulado


def log(msg):
    print(msg, flush=True)


def fetch(url, headers=None, retries=4):
    req = urllib.request.Request(url, headers={"User-Agent": UA, **(headers or {})})
    last = None
    for attempt in range(retries):
        try:
            with urllib.request.urlopen(req, timeout=90) as resp:
                return resp.read()
        except urllib.error.HTTPError as exc:
            last = exc
            if exc.code != 429:
                raise
            time.sleep(20 * (attempt + 1))  # Commons throttles hard; wait it out
        except Exception as exc:  # noqa: BLE001 - retry anything transient
            last = exc
            time.sleep(2 + attempt * 3)
    raise RuntimeError(f"GET {url} failed: {last}")


# --- Wikimedia Commons ------------------------------------------------------

def commons_search(query, filemime, limit=8):
    """Search Commons for files matching query, newest CirrusSearch ranking."""
    params = {
        "action": "query",
        "format": "json",
        "generator": "search",
        "gsrsearch": f"filemime:{filemime} {query}",
        "gsrnamespace": "6",
        "gsrlimit": str(limit),
        "prop": "imageinfo",
        "iiprop": "url|size|mime",
        "iiurlwidth": "1280",
    }
    time.sleep(1.5)  # be a polite API client, 429s are easy to trigger here
    data = json.loads(fetch(f"{COMMONS_API}?{urllib.parse.urlencode(params)}"))
    pages = data.get("query", {}).get("pages", {})
    results = []
    for page in pages.values():
        info = (page.get("imageinfo") or [{}])[0]
        if not info.get("url"):
            continue
        results.append({
            "title": page["title"],
            "url": info["url"],            # el archivo original
            "thumb": info.get("thumburl"),  # miniatura, solo válida para imágenes
            "width": info.get("width", 0),
            "bytes": info.get("size", 0),
            "mime": info.get("mime", ""),
            "index": page.get("index", 99),
        })
    results.sort(key=lambda r: r["index"])
    return results


def commons_thumb(title, width):
    """Thumbnail URL of an exact file at a given width, or None."""
    params = {
        "action": "query", "format": "json", "titles": title,
        "prop": "imageinfo", "iiprop": "url", "iiurlwidth": str(width),
    }
    time.sleep(1.5)
    data = json.loads(fetch(f"{COMMONS_API}?{urllib.parse.urlencode(params)}"))
    for page in data.get("query", {}).get("pages", {}).values():
        info = (page.get("imageinfo") or [{}])[0]
        if info.get("thumburl"):
            return info["thumburl"]
    return None


ALT_MIMES = {
    "image": ["image/png", "image/svg+xml", "image/jpeg"],
    "video": ["video/webm", "video/ogg", "video/mp4"],
    "pdf": ["application/pdf"],
}


def resolve_one(item):
    """First usable Commons hit, degrading the query until something matches.

    Commons search is picky: an exact phrase like "Lamport timestamps diagram
    distributed" can return nothing while "Lamport timestamps" returns the
    right file, and diagrams are as likely to be SVG as PNG. So this tries the
    preferred mime first, then the alternatives, then progressively shorter
    queries.
    """
    mimes = list(dict.fromkeys([item.get("filemime"), *ALT_MIMES[item["kind"]]]))
    mimes = [m for m in mimes if m]

    queries, words = [item["search"]], item["search"].split()
    while len(words) > 2:
        words = words[:-1]
        queries.append(" ".join(words))

    for query in queries:
        for mime in mimes:
            results = commons_search(query, mime)
            if item["kind"] == "video":
                # Keep the zip sane: smallest usable clip wins.
                results = [r for r in results if 200_000 < r["bytes"] < 12_000_000] or results
                results.sort(key=lambda r: r["bytes"])
            if results:
                return download_url(results[0], item["kind"])
    raise MediaNotFound(f"no Commons result for {item['id']!r} ({item['search']!r})")


def download_url(pick, kind):
    """Chooses which URL to actually fetch, and pins it into pick['url'].

    Images go through a thumbnail: upload.wikimedia.org throttles requests for
    original files hard (HTTP 429) and asks clients to use thumbnails, and a
    1280px render is plenty for a lesson. A video or a PDF has no usable
    thumbnail — its 'thumburl' is a poster frame — so those take the original.
    """
    if kind != "image":
        return pick
    thumb = pick["thumb"]
    if not thumb and pick["width"] > 400:
        # No 1280px render because the file itself is narrower; ask for one
        # that is definitely smaller than the original.
        thumb = commons_thumb(pick["title"], max(320, pick["width"] // 2))
    if thumb:
        pick["url"] = thumb
    return pick


class MediaNotFound(RuntimeError):
    pass


def resolve_media(items, refresh):
    """Pin every media item to a concrete Commons URL, cached in media.lock.json."""
    lock = {}
    if MEDIA_LOCK.exists() and not refresh:
        lock = json.loads(MEDIA_LOCK.read_text())

    for item in items:
        if item["kind"] == "text":
            continue  # authored locally, nothing to resolve
        if item["id"] in lock:
            continue
        pick = resolve_one(item)
        lock[item["id"]] = {
            "commons_title": pick["title"],
            "url": pick["url"],
            "mime": pick["mime"],
            "search": item["search"],
        }
        log(f"  resolved {item['id']:<22} {pick['title']}")
        # Written per item: a 429 halfway through shouldn't throw away the
        # resolutions already paid for.
        MEDIA_LOCK.write_text(json.dumps(lock, indent=2, ensure_ascii=False, sort_keys=True) + "\n")

    MEDIA_LOCK.write_text(json.dumps(lock, indent=2, ensure_ascii=False, sort_keys=True) + "\n")
    return lock


def safe_filename(commons_title, url):
    name = commons_title.split(":", 1)[-1]
    name = urllib.parse.unquote(name).replace(" ", "_")
    name = re.sub(r"[^A-Za-z0-9._-]", "", name) or "archivo"
    ext = Path(urllib.parse.urlparse(url).path).suffix
    if ext and not name.lower().endswith(ext.lower()):
        # Commons thumbnails add their own extension (e.g. .svg -> .svg.png).
        name = Path(name).stem + ext
    return name[:90]


def download(url, dest):
    if dest.exists() and dest.stat().st_size > 0:
        return dest
    dest.parent.mkdir(parents=True, exist_ok=True)
    tmp = dest.with_suffix(dest.suffix + ".part")
    time.sleep(2)  # upload.wikimedia.org rate-limits bursts of downloads
    tmp.write_bytes(fetch(url))
    tmp.replace(dest)
    return dest


def probe(path):
    """duration/resolution exactly like the backend's getFileMetadata."""
    try:
        out = subprocess.run(
            ["ffprobe", "-v", "quiet", "-print_format", "json", "-show_format", "-show_streams", str(path)],
            capture_output=True, text=True, timeout=60,
        ).stdout
        data = json.loads(out or "{}")
    except Exception:  # noqa: BLE001 - metadata is best-effort, same as the backend
        return None, None

    duration = None
    raw = (data.get("format") or {}).get("duration")
    if raw:
        secs = int(float(raw))
        duration = f"{secs // 60}:{secs % 60:02d}"
    resolution = None
    for stream in data.get("streams") or []:
        if stream.get("codec_type") == "video" and stream.get("width"):
            resolution = f"{stream['width']}x{stream['height']}"
            break
    return duration, resolution


# --- YouTube ---------------------------------------------------------------

def youtube_lookup(query):
    """First search hit for query, verified through oEmbed (no API key needed)."""
    url = "https://www.youtube.com/results?" + urllib.parse.urlencode({"search_query": query})
    html = fetch(url, headers={"Accept-Language": "es-ES,es;q=0.9"}).decode("utf-8", "replace")
    for vid in re.findall(r'"videoId":"([A-Za-z0-9_-]{11})"', html):
        oembed = "https://www.youtube.com/oembed?" + urllib.parse.urlencode(
            {"url": f"https://www.youtube.com/watch?v={vid}", "format": "json"})
        try:
            meta = json.loads(fetch(oembed, retries=1))
        except Exception:  # noqa: BLE001 - unavailable/private video, try the next hit
            continue
        return {"id": vid, "title": meta.get("title", query), "author": meta.get("author_name", "")}
    return None


def resolve_videos(queries, refresh):
    lock = {}
    if YOUTUBE_LOCK.exists() and not refresh:
        lock = json.loads(YOUTUBE_LOCK.read_text())
    for key, query in queries.items():
        if key in lock:
            continue
        found = youtube_lookup(query)
        if not found:
            log(f"  !! sin video para {key} ({query!r}) — se omite el enlace")
            continue
        lock[key] = {**found, "query": query}
        log(f"  video {key:<22} {found['title'][:60]}")
        YOUTUBE_LOCK.write_text(json.dumps(lock, indent=2, ensure_ascii=False, sort_keys=True) + "\n")
    YOUTUBE_LOCK.write_text(json.dumps(lock, indent=2, ensure_ascii=False, sort_keys=True) + "\n")
    return lock


# --- deterministic pseudo-randomness --------------------------------------
# No RNG: everything derives from a crc32 of stable ids, so two runs of this
# script produce byte-identical grades/enrolments/likes.

def rnd(*parts):
    return zlib.crc32("|".join(parts).encode())


def pick(seq, *parts):
    return seq[rnd(*parts) % len(seq)]


def chance(percent, *parts):
    return rnd(*parts) % 100 < percent


def day_offset(days, hour=9, minute=0):
    """ISO-8601 UTC timestamp, `days` after BASE_DATE."""
    base = time.mktime(time.strptime(BASE_DATE + " 00:00:00", "%Y-%m-%d %H:%M:%S"))
    ts = time.gmtime(base + days * 86400 + hour * 3600 + minute * 60)
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", ts)


# --- row assembly ----------------------------------------------------------

TABLES = [
    "users", "courses", "library_items", "lessons", "quizzes", "quiz_questions",
    "quiz_grades", "user_completed_lessons", "course_enrollments",
    "forum_posts", "forum_likes", "forum_links", "lesson_links", "quiz_links",
]

WIKI_REF = re.compile(r"\[\[([\w-]+)\]\]")

# mirrors handlers.detectType — same extension -> same type the upload endpoint
# would have assigned, so seeded items behave like uploaded ones in the UI.
TYPE_BY_EXT = {
    ".mp4": "video", ".webm": "video", ".avi": "video", ".mkv": "video", ".mov": "video",
    ".wmv": "video", ".flv": "video", ".ogv": "video",
    ".mp3": "audio", ".wav": "audio", ".ogg": "audio", ".flac": "audio", ".aac": "audio",
    ".m4a": "audio", ".opus": "audio",
    ".jpg": "image", ".jpeg": "image", ".png": "image", ".gif": "image", ".svg": "image",
    ".webp": "image", ".bmp": "image", ".ico": "image",
    ".pdf": "pdf",
    ".txt": "text", ".md": "text", ".csv": "text", ".json": "text", ".xml": "text",
    ".yaml": "text", ".yml": "text", ".log": "text", ".go": "text", ".ts": "text",
    ".js": "text", ".py": "text",
}


def detect_type(filename):
    return TYPE_BY_EXT.get(Path(filename).suffix.lower(), "document")


def credits_markdown(media_lock):
    """Attribution for the Commons files — required by their licenses."""
    lines = [
        "# Créditos de los materiales",
        "",
        "Las imágenes y videos de la biblioteca provienen de Wikimedia Commons y",
        "conservan la licencia con que fueron publicados ahí. La página de cada",
        "archivo indica autoría y licencia exactas.",
        "",
        "| Archivo en RADIX | Origen en Wikimedia Commons |",
        "|---|---|",
    ]
    titles = {item["id"]: item["title"] for item in content.MEDIA}
    for item_id in sorted(media_lock):
        commons_title = media_lock[item_id]["commons_title"]
        page = "https://commons.wikimedia.org/wiki/" + urllib.parse.quote(
            commons_title.replace(" ", "_"), safe=":()")
        lines.append(f"| {titles.get(item_id, item_id)} | [{commons_title}]({page}) |")
    lines += [
        "",
        "Los documentos de lectura (guías, chuletas y repertorios de consultas) se",
        "escribieron para este curso y no provienen de terceros.",
        "",
        "Los videos recomendados dentro de las lecciones son enlaces a YouTube: no",
        "se redistribuye ninguno, solo se enlaza a su publicación original.",
    ]
    return "\n".join(lines) + "\n"


def build_library(media_lock, uploads):
    """Returns library_items rows; appends (zip_name, local_path) to uploads."""
    rows = []
    for i, item in enumerate(content.MEDIA):
        if item["kind"] == "text":
            local = CACHE / "generated" / item["filename"]
            local.parent.mkdir(parents=True, exist_ok=True)
            local.write_text(item["body"].strip() + "\n", encoding="utf-8")
            filename = item["filename"]
            mime = "text/markdown" if filename.endswith(".md") else "text/plain"
        else:
            pinned = media_lock[item["id"]]
            filename = safe_filename(pinned["commons_title"], pinned["url"])
            local = download(pinned["url"], CACHE / "commons" / f"{item['id']}_{filename}")
            # From the filename, not from Commons' metadata: a thumbnail of an
            # SVG is a PNG, and serving PNG bytes as image/svg+xml would render
            # as a broken image in the lesson.
            mime = mimetypes.guess_type(filename)[0] or pinned["mime"] or "application/octet-stream"

        duration, resolution = probe(local) if item["kind"] in ("video", "image") else (None, None)

        stored_name = f"{item['id']}_{filename}"
        uploads.append((stored_name, local))
        uploaded_at = day_offset(1 + i % 20, 8, (i * 7) % 60)
        rows.append({
            "id": item["id"],
            "title": item["title"],
            "type": detect_type(filename),
            "category": item["category"],
            "size_kb": max(1, local.stat().st_size // 1024),
            "mime_type": mime,
            "original_filename": filename,
            "uploaded_at": uploaded_at,
            "modified_at": uploaded_at,
            "duration": duration,
            "resolution": resolution,
            "file_path": f"uploads/{stored_name}",
            "uploaded_by": content.TEACHER["id"],
        })
    return rows


def render_lesson(lesson, video_lock):
    """Substitutes the {video} placeholder with a resolved YouTube link."""
    body = lesson["content"].strip()
    if "{video}" not in body:
        return body
    found = video_lock.get(lesson["id"])
    if not found:
        return body.replace("{video}\n\n", "").replace("{video}", "")
    link = (f"**Video recomendado:** [{found['title']}]"
            f"(https://www.youtube.com/watch?v={found['id']})")
    if found.get("author"):
        link += f" — canal *{found['author']}*"
    return body.replace("{video}", link)


def quiz_rows(quiz, course_id, lesson_id, questions_out):
    for ordinal, (text, options, correct) in enumerate(quiz["questions"]):
        questions_out.append({
            "id": f"{quiz['id']}-q{ordinal + 1}",
            "quiz_id": quiz["id"],
            "ordinal": ordinal,
            "text": text,
            "options_json": json.dumps(options, ensure_ascii=False),
            "correct_index": correct,
        })
    return {
        "id": quiz["id"],
        "course_id": course_id,
        "lesson_id": lesson_id,
        "title": quiz["title"],
        "description": quiz.get("description", ""),
        "value": quiz.get("value", 100),
    }


def build_rows(media_lock, video_lock, uploads):
    rows = {table: [] for table in TABLES}

    # El archivo de créditos se genera aquí (necesita el lock resuelto) y entra
    # como material de la biblioteca, para que la atribución esté visible en la
    # aplicación y no solo dentro del zip.
    if not any(item["id"] == "lib-creditos" for item in content.MEDIA):
        content.MEDIA.append({
            "id": "lib-creditos", "title": "Créditos de los materiales", "category": "General",
            "kind": "text", "filename": "creditos-materiales.md", "body": credits_markdown(media_lock),
        })

    password_hash = bcrypt.hashpw(SEED_PASSWORD.encode(), bcrypt.gensalt(rounds=10)).decode()
    for user in [content.TEACHER, *content.STUDENTS]:
        rows["users"].append({
            "id": user["id"], "name": user["name"], "email": user["email"],
            "password_hash": password_hash, "role": user["role"],
        })

    rows["library_items"] = build_library(media_lock, uploads)

    for course_index, course in enumerate(content.COURSES):
        rows["courses"].append({
            "id": course["id"], "title": course["title"],
            "description": course["description"], "category": course["category"],
        })

        for lesson in course["lessons"]:
            rows["lessons"].append({
                "id": lesson["id"], "course_id": course["id"], "title": lesson["title"],
                "content_text": render_lesson(lesson, video_lock),
            })
            rows["quizzes"].append(
                quiz_rows(lesson["quiz"], course["id"], lesson["id"], rows["quiz_questions"]))

        rows["quizzes"].append(
            quiz_rows(course["exam"], course["id"], None, rows["quiz_questions"]))

        # --- inscripciones, progreso y notas -----------------------------
        for student_index, student in enumerate(content.STUDENTS):
            if (student_index + course_index) % 3 == 0:
                continue  # deja huecos: no todos cursan todo
            rows["course_enrollments"].append({"user_id": student["id"], "course_id": course["id"]})

            for lesson_index, lesson in enumerate(course["lessons"]):
                if not chance(62, student["id"], lesson["id"]):
                    continue
                rows["user_completed_lessons"].append({"user_id": student["id"], "lesson_id": lesson["id"]})
                quiz = lesson["quiz"]
                if not chance(80, student["id"], quiz["id"]):
                    continue
                rows["quiz_grades"].append({
                    "user_id": student["id"], "quiz_id": quiz["id"],
                    "grade": pick([12, 14, 15, 16, 17, 18, 19, 20], student["id"], quiz["id"]),
                    "graded_at": day_offset(12 + lesson_index * 9 + rnd(student["id"], quiz["id"]) % 6,
                                            10, rnd(quiz["id"], student["id"]) % 60),
                })

            if chance(45, student["id"], course["exam"]["id"]):
                rows["quiz_grades"].append({
                    "user_id": student["id"], "quiz_id": course["exam"]["id"],
                    "grade": pick([58, 64, 71, 76, 82, 88, 91, 96], student["id"], course["exam"]["id"]),
                    "graded_at": day_offset(96 + rnd(student["id"], course["exam"]["id"]) % 5, 15, 30),
                })

        # --- foro ---------------------------------------------------------
        for thread in course["forum"]:
            posts = [(thread, None)] + [(reply, thread["id"]) for reply in thread.get("replies", [])]
            for post, parent_id in posts:
                rows["forum_posts"].append({
                    "id": post["id"], "course_id": course["id"], "parent_id": parent_id,
                    "user_id": post["author"], "title": post.get("title", ""),
                    "body": post["body"].strip(), "created_at": post["created"],
                })
                for liker in post.get("likes", []):
                    rows["forum_likes"].append({"post_id": post["id"], "user_id": liker})

    # --- wiki-links ([[id]]) -------------------------------------------------
    # Same resolution rule as store.syncLessonLinks/syncQuizLinks/syncForumLinks:
    # a ref becomes a link only if the id really exists, and the target type is
    # whichever table owns it.
    library_ids = {row["id"] for row in rows["library_items"]}
    lesson_ids = {row["id"] for row in rows["lessons"]}
    quiz_ids = {row["id"] for row in rows["quizzes"]}

    def target_type(ref, allow_quiz=False):
        if ref in library_ids:
            return "library_item"
        if ref in lesson_ids:
            return "lesson"
        if allow_quiz and ref in quiz_ids:
            return "quiz"
        return None

    for lesson in rows["lessons"]:
        for ref in dict.fromkeys(WIKI_REF.findall(lesson["content_text"])):
            kind = target_type(ref)
            if kind and ref != lesson["id"]:
                rows["lesson_links"].append({
                    "source_lesson_id": lesson["id"], "target_id": ref, "target_type": kind})

    for quiz in rows["quizzes"]:
        for ref in dict.fromkeys(WIKI_REF.findall(quiz["description"])):
            kind = target_type(ref)
            if kind:
                rows["quiz_links"].append({
                    "source_quiz_id": quiz["id"], "target_id": ref, "target_type": kind})

    for post in rows["forum_posts"]:
        for ref in dict.fromkeys(WIKI_REF.findall(post["body"])):
            kind = target_type(ref, allow_quiz=True)
            if kind:
                rows["forum_links"].append({
                    "source_post_id": post["id"], "target_id": ref, "target_type": kind})

    return rows


# --- checks + zip ----------------------------------------------------------

def validate(rows):
    """Fails loudly here rather than as an opaque FK error at import time."""
    problems = []
    ids = {table: {row.get("id") for row in table_rows} for table, table_rows in rows.items()}

    def require(condition, message):
        if not condition:
            problems.append(message)

    for row in rows["lessons"]:
        require(row["course_id"] in ids["courses"], f"lesson {row['id']}: curso inexistente")
    for row in rows["quizzes"]:
        require(row["course_id"] in ids["courses"], f"quiz {row['id']}: curso inexistente")
        require(row["lesson_id"] is None or row["lesson_id"] in ids["lessons"],
                f"quiz {row['id']}: lección inexistente")
    for row in rows["quiz_questions"]:
        options = json.loads(row["options_json"])
        require(len(options) >= 3, f"pregunta {row['id']}: menos de 3 opciones")
        require(0 <= row["correct_index"] < len(options),
                f"pregunta {row['id']}: correct_index fuera de rango")
    for row in rows["quiz_grades"]:
        require(row["user_id"] in ids["users"], f"nota: usuario {row['user_id']} inexistente")
        require(row["quiz_id"] in ids["quizzes"], f"nota: quiz {row['quiz_id']} inexistente")
    for row in rows["forum_posts"]:
        require(row["user_id"] in ids["users"], f"post {row['id']}: autor inexistente")
    for row in rows["forum_likes"]:
        require(row["user_id"] in ids["users"], f"like: usuario {row['user_id']} inexistente")
        require(row["post_id"] in ids["forum_posts"], f"like: post {row['post_id']} inexistente")
    for row in rows["library_items"]:
        require(row["uploaded_by"] in ids["users"], f"archivo {row['id']}: uploader inexistente")

    # One quiz per lesson at most (idx_quizzes_lesson_unique).
    lesson_quizzes = [row["lesson_id"] for row in rows["quizzes"] if row["lesson_id"]]
    require(len(lesson_quizzes) == len(set(lesson_quizzes)), "dos quizzes para la misma lección")

    # Dangling [[id]] refs would silently render as "no encontrado".
    known = ids["library_items"] | ids["lessons"] | ids["quizzes"]
    for table, field in (("lessons", "content_text"), ("quizzes", "description"), ("forum_posts", "body")):
        for row in rows[table]:
            for ref in WIKI_REF.findall(row[field]):
                require(ref in known, f"{table} {row['id']}: [[{ref}]] no existe")

    if problems:
        for problem in sorted(set(problems)):
            log(f"  ERROR {problem}")
        raise SystemExit(f"{len(set(problems))} problema(s) de consistencia — zip no generado")


def write_zip(rows, uploads, media_lock):
    manifest = {
        "exportedAt": day_offset(140, 12, 0),
        "tables": {table: len(table_rows) for table, table_rows in rows.items()},
        "uploads": len(uploads),
        "note": "Contenido educativo de ejemplo para RADIX. Medios: Wikimedia Commons.",
    }

    with zipfile.ZipFile(OUT_ZIP, "w", zipfile.ZIP_DEFLATED) as zf:
        zf.writestr("manifest.json", json.dumps(manifest, indent=2, ensure_ascii=False) + "\n")
        # Fuera de data/ y uploads/: el importador lo ignora, está para quien
        # abra el zip a mano.
        zf.writestr("CREDITOS.md", credits_markdown(media_lock))
        for table in TABLES:
            zf.writestr(f"data/{table}.json",
                        json.dumps(rows[table], indent=2, ensure_ascii=False) + "\n")
        for stored_name, local in uploads:
            zf.write(local, f"uploads/{stored_name}")
    return manifest


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--refresh", action="store_true",
                        help="re-resolve Commons media and YouTube videos instead of using the lock files")
    args = parser.parse_args()

    log("1/4 resolviendo medios de Wikimedia Commons...")
    media_lock = resolve_media(content.MEDIA, args.refresh)

    log("2/4 resolviendo videos de YouTube...")
    video_queries = {lesson["id"]: lesson["video"]
                     for course in content.COURSES for lesson in course["lessons"]
                     if lesson.get("video")}
    video_lock = resolve_videos(video_queries, args.refresh)

    log("3/4 descargando archivos y armando filas...")
    uploads = []
    rows = build_rows(media_lock, video_lock, uploads)
    validate(rows)

    log("4/4 escribiendo zip...")
    manifest = write_zip(rows, uploads, media_lock)

    log("")
    log(f"OK  {OUT_ZIP}  ({OUT_ZIP.stat().st_size / 1_048_576:.1f} MB)")
    for table in TABLES:
        log(f"    {table:<24} {manifest['tables'][table]:>5}")
    log(f"    {'archivos':<24} {manifest['uploads']:>5}")
    log(f"    {'TOTAL filas':<24} {sum(manifest['tables'].values()):>5}")
    log(f"    credenciales: cualquier email del seed / contraseña {SEED_PASSWORD}")


if __name__ == "__main__":
    sys.exit(main())
