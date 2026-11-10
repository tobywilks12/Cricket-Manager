# Builds two outputs from the source files:
#   cricket-manager.html  single file (claude.ai artifact, or open locally)
#   dist/                 website + installable app (PWA), created at build time
# Every source file sits in the top folder (no subfolders), so uploading through GitHub's website is simple.
import os, re, hashlib, shutil
d = os.path.dirname(os.path.abspath(__file__)) + '/'
version = re.search(r"GAME_VERSION = '([^']+)'", open(d + 'app.js').read()).group(1)
css = open(d + 'style.css').read() + open(d + 'extra.css').read()
parts = ''.join(f'<script>{open(d + f).read()}</script>\n' for f in ['lz.js', 'data.js', 'data_wb.js', 'engine.js', 'engine_lo.js', 'career.js', 'career_wb.js', 'app.js'])
def page(pwa):
    head_pwa = '''<link rel="manifest" href="manifest.webmanifest">
<meta name="theme-color" content="#0f2a1e">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<link rel="apple-touch-icon" href="icon-192.png">
<link rel="icon" href="icon-192.png">''' if pwa else ''
    return f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Cricket Manager</title>
{head_pwa}
<link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@500&display=swap" rel="stylesheet">
<style>{css}</style>
</head>
<body>
<div id="app"></div>
{parts}</body>
</html>'''
open(d + 'cricket-manager.html', 'w').write(page(False))
dist = d + 'dist/'
os.makedirs(dist, exist_ok=True)
html = page(True)
open(dist + 'index.html', 'w').write(html)
build_id = version + '-' + hashlib.sha1(html.encode()).hexdigest()[:8]
open(dist + 'sw.js', 'w').write(open(d + 'sw-template.js').read().replace('__BUILD__', build_id))
for f in ['manifest.webmanifest', 'icon-192.png', 'icon-512.png', '_headers']:
    shutil.copy(d + f, dist + f)
print('built', build_id)
