# Netlify runs this on every deploy. It publishes the ready-built game (index.html and its app files) from the main folder.
import os, shutil
os.makedirs('dist', exist_ok=True)
for f in ['index.html', 'sw.js', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png']:
    shutil.copy(f, os.path.join('dist', f))
with open(os.path.join('dist', '_headers'), 'w') as h:
    h.write('/sw.js\n  Cache-Control: no-cache\n/index.html\n  Cache-Control: no-cache\n')
print('Published Cricket Manager from index.html')
