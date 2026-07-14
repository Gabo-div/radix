#!/usr/bin/env python3
"""Genera un PDF de entrega a partir de un markdown en docs/.

Uso:
    python3 docs/tools/md2pdf.py docs/INFORME.md [-o docs/INFORME.pdf] [--title "..."] [--no-cover]

Produce: portada (docs/PORTADA.png) + índice clicable con números de página
reales + contenido con numeración en el pie. Todo sale de UN solo render de
Chromium: unir PDFs después con pdfunite rompe los named destinations de los
enlaces del índice — no lo hagas.

Convenciones del markdown de entrada:
  - Sin título de documento ni portada: el archivo empieza directo en `## 1. ...`.
  - Secciones con `##` y subsecciones con `###` (eso alimenta el índice).
  - Español, tablas GFM soportadas.

Requisitos del sistema: chromium, poppler (pdfinfo/pdftotext), python-markdown.
ffmpeg opcional (recomprime la portada PNG a JPEG; sin él se embebe el PNG tal
cual y el PDF pesa más).
"""

import argparse, base64, pathlib, re, subprocess, sys, tempfile

import markdown

REPO = pathlib.Path(__file__).resolve().parent.parent.parent
DEFAULT_COVER = REPO / "docs" / "PORTADA.png"

CSS = """
  @page { size: A4; margin: 22mm 18mm;
          @bottom-right { content: counter(page); font-family: Georgia, serif; font-size: 9pt; color: #444; } }
  @page cover { margin: 0; @bottom-right { content: none; } }
  .cover { page: cover; page-break-after: always; }
  .cover img { display: block; width: 210mm; height: 296.5mm; object-fit: fill; }
  * { box-sizing: border-box; }
  body { font-family: "Noto Serif", Georgia, "Times New Roman", serif;
         font-size: 10.5pt; line-height: 1.55; color: #1a1a1a; margin: 0; }
  h2 { font-size: 14pt; margin: 22pt 0 8pt; border-bottom: 1.5px solid #333; padding-bottom: 3pt; page-break-after: avoid; }
  h3 { font-size: 11.5pt; margin: 16pt 0 6pt; page-break-after: avoid; }
  p { margin: 6pt 0; text-align: justify; }
  table { border-collapse: collapse; width: 100%; margin: 8pt 0; font-size: 9.5pt; }
  th, td { border: 0.75pt solid #555; padding: 4pt 6pt; text-align: left; vertical-align: top; }
  th { background: #e8e8e8; font-weight: 700; }
  tr { page-break-inside: avoid; }
  td:first-child { white-space: nowrap; }
  code { font-family: "JetBrains Mono", "DejaVu Sans Mono", monospace; font-size: 8.8pt; background: #f2f2f2; padding: 0.5pt 2.5pt; border-radius: 2pt; }
  pre { background: #f2f2f2; padding: 8pt; border-radius: 3pt; overflow-x: hidden; page-break-inside: avoid; }
  pre code { background: none; padding: 0; }
  hr { border: none; border-top: 0.75pt solid #999; margin: 14pt 0; }
  ul, ol { margin: 6pt 0; padding-left: 18pt; }
  li { margin: 3pt 0; }
  img { max-width: 100%; }
  .toc { page-break-after: always; }
  .toc h2 { text-align: center; border: none; margin-bottom: 16pt; }
  .toc ol { list-style: none; padding: 0; margin: 0; }
  .toc li { margin: 5pt 0; display: flex; align-items: baseline; }
  .toc li.lvl3 { padding-left: 18pt; font-size: 9.8pt; }
  .toc .dots { flex: 1; border-bottom: 1pt dotted #888; margin: 0 4pt; min-width: 12pt; }
  .toc .pg { font-variant-numeric: tabular-nums; }
  .toc a { color: inherit; text-decoration: none; display: flex; align-items: baseline; width: 100%; }
"""


def cover_data_uri(cover_path):
    # JPEG pesa ~4x menos que el PNG original; ffmpeg si está, PNG crudo si no
    try:
        with tempfile.NamedTemporaryFile(suffix=".jpg") as tmp:
            subprocess.run(["ffmpeg", "-y", "-i", str(cover_path), "-q:v", "3", tmp.name],
                           check=True, capture_output=True)
            return "data:image/jpeg;base64," + base64.b64encode(
                pathlib.Path(tmp.name).read_bytes()).decode()
    except (FileNotFoundError, subprocess.CalledProcessError):
        mime = "image/png" if cover_path.suffix.lower() == ".png" else "image/jpeg"
        return f"data:{mime};base64," + base64.b64encode(cover_path.read_bytes()).decode()


def toc_html(headings, page_map):
    items = []
    for lvl, text, hid in headings:
        pg = page_map.get(text, "?")
        cls = ' class="lvl3"' if lvl == 3 else ""
        weight = "font-weight:700" if lvl == 2 else ""
        items.append(f'<li{cls}><a href="#{hid}"><span style="{weight}">{text}</span>'
                     f'<span class="dots"></span><span class="pg">{pg}</span></a></li>')
    return '<div class="toc"><h2>Índice</h2><ol>' + "".join(items) + "</ol></div>"


def render(inner, title, out_pdf, workdir):
    html_file = workdir / "render.html"
    html_file.write_text(
        f'<!DOCTYPE html><html lang="es"><head><meta charset="utf-8">'
        f'<title>{title}</title><style>{CSS}</style></head><body>{inner}</body></html>')
    subprocess.run(["chromium", "--headless", "--disable-gpu", "--no-sandbox",
                    f"--print-to-pdf={out_pdf}", "--no-pdf-header-footer",
                    str(html_file)], check=True, capture_output=True)


def npages(pdf):
    return int(re.search(r"Pages:\s+(\d+)", subprocess.run(
        ["pdfinfo", str(pdf)], capture_output=True, text=True).stdout).group(1))


def measure(pdf, headings):
    # en qué página cae cada encabezado, vía pdftotext página a página
    # (espacios normalizados: los títulos largos se parten en varias líneas)
    page_map = {}
    for p in range(1, npages(pdf) + 1):
        txt = subprocess.run(["pdftotext", "-f", str(p), "-l", str(p), str(pdf), "-"],
                             capture_output=True, text=True).stdout
        flat = " ".join(txt.split())
        for _, text, _h in headings:
            if text not in page_map and " ".join(text.split()) in flat:
                page_map[text] = p
    return page_map


def strip_metadata(pdf_path):
    # deja Creator/Producer en blanco preservando offsets (no reescribe el xref)
    data = pdf_path.read_bytes()
    pdfstr = rb"\(((?:[^()\\]|\\.|\((?:[^()\\]|\\.)*\))*)\)"
    for key in (b"/Creator", b"/Producer"):
        m = re.search(key + rb" " + pdfstr, data, re.DOTALL)
        if m:
            data = data[:m.start(1)] + b" " * (m.end(1) - m.start(1)) + data[m.end(1):]
    pdf_path.write_bytes(data)


def main():
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("input", type=pathlib.Path)
    ap.add_argument("-o", "--output", type=pathlib.Path)
    ap.add_argument("--title", help="título en la metadata del PDF (default: nombre del archivo)")
    ap.add_argument("--cover", type=pathlib.Path, default=DEFAULT_COVER)
    ap.add_argument("--no-cover", action="store_true")
    args = ap.parse_args()

    out = args.output or args.input.with_suffix(".pdf")
    title = args.title or args.input.stem.replace("_", " ").title()

    md = markdown.Markdown(extensions=["tables", "toc", "fenced_code"])
    body = md.convert(args.input.read_text())

    def walk(tokens):
        for t in tokens:
            if t["level"] in (2, 3):
                yield (t["level"], t["name"], t["id"])
            yield from walk(t["children"])
    headings = list(walk(md.toc_tokens))

    cover_div = "" if args.no_cover else \
        f'<div class="cover"><img src="{cover_data_uri(args.cover)}"></div>'
    cover_pages = 0 if args.no_cover else 1

    with tempfile.TemporaryDirectory() as td:
        workdir = pathlib.Path(td)
        tmp = workdir / "measure.pdf"
        # 1) cuerpo solo -> página de cada encabezado
        render(body, title, tmp, workdir)
        body_map = measure(tmp, headings)
        # 2) índice solo (números placeholder del mismo ancho) -> cuántas páginas ocupa
        render(toc_html(headings, {t: 99 for _, t, _h in headings}), title, tmp, workdir)
        toc_pages = npages(tmp)
        # 3) final: portada + índice + cuerpo, números con offset
        page_map = {t: p + toc_pages + cover_pages for t, p in body_map.items()}
        render(cover_div + toc_html(headings, page_map) + body, title, out, workdir)

    strip_metadata(out)
    missing = [t for _, t, _h in headings if t not in body_map]
    print(f"{out}: {npages(out)} páginas ({toc_pages} de índice)"
          + (f" — SIN PÁGINA EN ÍNDICE: {missing}" if missing else ""))


if __name__ == "__main__":
    main()
