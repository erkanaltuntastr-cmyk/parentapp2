// Minimal Node static server alternative to `python -m http.server`
import http from 'node:http';
import { stat } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import path from 'node:path';
const port = 5173;
const root = process.cwd();

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.json': 'application/json; charset=utf-8',
  '.csv': 'text/csv; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2'
};

function setContentType(res, filePath){
  const ext = path.extname(filePath).toLowerCase();
  const type = mimeTypes[ext] || 'application/octet-stream';
  res.setHeader('Content-Type', type);
}

const server = http.createServer(async (req, res) => {
  const urlPath = req.url.split('?')[0];
  const filePath = path.join(root, urlPath === '/' ? 'index.html' : urlPath.replace(/^\//, ''));
  try {
    const st = await stat(filePath);
    if (st.isDirectory()) {
      const idx = path.join(filePath, 'index.html');
      setContentType(res, idx);
      return createReadStream(idx).pipe(res);
    }
    setContentType(res, filePath);
    createReadStream(filePath).pipe(res);
  } catch {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.end('Not found');
  }
});
server.listen(port, () => console.log(`Dev server on http://localhost:${port}`));
