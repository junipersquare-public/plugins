#!/usr/bin/env python3
"""Assemble a Juniper Square report from its parts.

The stylesheet (assets/report.css: the report tokens, then the components) and the helpers
(assets/report.js) are inserted from this skill's folder, so they are never retyped. You supply only:
  --body  a file with the page markup: <main class="report"> ... </main>
  --data  a file with the data and render calls: const DATA = {...}; renderX(...);
Usage:
  python3 assemble.py --title "Fundraise update · Park Industries" \
      --body body.html --data data.js --out report.html [--fragment] [--fonts fonts.css]
--fragment  omit <!doctype>, <html>, <head> and <body> (for publishing as an Artifact page,
            which adds its own page skeleton). Without it, writes a full standalone HTML file.
--fonts     optional file of @font-face rules (licensed Moderat 400/500 and Charter 400), inserted
            before the stylesheet. Without it the fallback stacks apply.
Checks the parts and prints any problems; exits 1 if a check fails.
"""
import argparse, html, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)

def read(p):
    with open(p, encoding="utf-8") as f:
        return f.read()

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--title", required=True)
    ap.add_argument("--body", required=True)
    ap.add_argument("--data", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--fragment", action="store_true")
    ap.add_argument("--fonts")
    a = ap.parse_args()

    css = read(os.path.join(ROOT, "assets", "report.css"))
    js = read(os.path.join(ROOT, "assets", "report.js"))
    body = read(a.body).strip()
    data = read(a.data).strip()
    fonts = read(a.fonts).strip() if a.fonts else ""

    problems = []
    if not re.search(r'<main class="report"', body):
        problems.append('body must start with <main class="report">')
    if re.search(r"<style", body, re.I):
        problems.append("body contains <style>: no per-report CSS (use the stylesheet's classes)")
    if re.search(r"<script", body, re.I):
        problems.append("body contains <script>: put data and render calls in --data instead")
    bad_hex = re.findall(r'style="[^"]*#[0-9a-fA-F]{3,8}', body)
    if bad_hex:
        problems.append("inline style uses a hex colour: use a token such as var(--series-1)")
    old = sorted(set(re.findall(r"var\(--(brand-\d+|gold|ink|ink-weak|paper|hairline|neg|on-brand|ok-bg|ok-fg|watch-bg|watch-fg|risk-bg|risk-fg|neutral-bg|sans|serif)\)", body + data)))
    if old:
        problems.append("retired token names used: " + ", ".join("--" + o for o in old) + " (see the token map in SKILL.md)")
    if re.search(r"font-weight:\s*(300|600|700|800|900)|font:\s*(300|600|700)\b", body + data):
        problems.append("font weight outside 400/500")
    for word in ("Not on file", "Not recorded", "N/A", "Sample data"):
        if word in body or word in data:
            problems.append(f'found "{word}": omit missing values instead (design rule 6.3)')
    for tag in re.findall(r'<a\b[^>]*>', body):
        href = (re.search(r'href="([^"]*)"', tag) or [None, ""])[1]
        if not re.match(r"^https://[a-z0-9-]+\.junipersquare\.com/document/\d+$", href):
            problems.append(f"link not allowed: {href} (link only a URL the connector returned, today a document's staffViewUrl)")
        if 'class="open-link"' not in tag:
            problems.append("links use the quiet Open affordance: <a class=\"open-link\" …>Open</a> (openLink() in data.js)")
    if 'class="rh-brand"' not in body or "data-jsq-mark" not in body:
        problems.append('missing brand bar: <div class="rh-brand"><span class="mark" data-jsq-mark></span> …</div>')
    if re.search(r'<h1[^>]*class="title"[^>]*>\s*<a', body):
        problems.append("the title is never a link")
    if 'class="foot"' not in body:
        problems.append('missing footer: <footer class="foot">…</footer>')
    if "const DATA" not in data:
        problems.append("data file must declare const DATA = {...}")
    if re.search(r"<\s*/?\s*script", data, re.I):
        problems.append("data file must be plain JavaScript, without <script> tags")

    title = html.escape(a.title)
    font_block = f"<style>\n{fonts}\n</style>\n" if fonts else ""
    inner = (f"<title>{title}</title>\n{font_block}<style>\n{css}\n</style>\n"
             f"{body}\n<script>\n{js}\n</script>\n<script>\n{data}\n</script>\n")
    if a.fragment:
        out = inner
    else:
        out = ('<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n'
               '<meta name="viewport" content="width=device-width, initial-scale=1">\n'
               + inner.replace(f"{body}\n", "</head>\n<body>\n" + body + "\n", 1)
               + "</body>\n</html>\n")
    with open(a.out, "w", encoding="utf-8") as f:
        f.write(out)
    print(f"wrote {a.out} ({len(out):,} characters)")
    if problems:
        print("CHECKS FAILED:")
        for p in problems:
            print(" - " + p)
        sys.exit(1)
    print("checks passed")

if __name__ == "__main__":
    main()
