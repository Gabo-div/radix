#!/usr/bin/env python3
"""Renderiza un HTML de docs/ a PDF con Chromium headless.

Uso:
    python3 docs/tools/html2pdf.py docs/PAPER.html [-o docs/PAPER.pdf] [--title "..."]

El tamano de pagina, los margenes y la numeracion del pie los define el propio
HTML con reglas @page: este script solo invoca Chromium y limpia la metadata.
Para los informes a una columna generados desde markdown usar md2pdf.py.

Requisitos del sistema: chromium, poppler (pdfinfo).
"""

import argparse, pathlib, re, subprocess


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
    ap.add_argument("--title", help="titulo en la metadata del PDF")
    args = ap.parse_args()

    src = args.input.resolve()
    out = (args.output or args.input.with_suffix(".pdf")).resolve()

    if args.title:
        html = src.read_text()
        if re.search(r"<title>.*?</title>", html, re.S):
            src.write_text(re.sub(r"<title>.*?</title>", f"<title>{args.title}</title>", html, count=1, flags=re.S))

    subprocess.run(["chromium", "--headless", "--disable-gpu", "--no-sandbox",
                    "--virtual-time-budget=10000", "--no-pdf-header-footer",
                    f"--print-to-pdf={out}", src.as_uri()], check=True, capture_output=True)

    strip_metadata(out)
    pages = re.search(r"Pages:\s+(\d+)", subprocess.run(
        ["pdfinfo", str(out)], capture_output=True, text=True).stdout).group(1)
    print(f"{out}: {pages} paginas")


if __name__ == "__main__":
    main()
