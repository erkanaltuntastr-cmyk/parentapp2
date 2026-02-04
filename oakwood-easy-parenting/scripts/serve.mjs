// Minimal Node static server alternative to `python -m http.server`
import http from 'node:http';
import { stat } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import path from 'node:path';
const port = 5173;
const root = process.cwd();

const server = http.createServer(async (req, res) => {
  const urlPath = req.url.split('?')[0];
  const filePath = path.join(root, urlPath === '/' ? 'index.html' : urlPath.replace(/^\//, ''));
  try {
    const st = await stat(filePath);
    if (st.isDirectory()) {
      const idx = path.join(filePath, 'index.html');
      return createReadStream(idx).pipe(res);
    }
    createReadStream(filePath).pipe(res);
  } catch {
    res.statusCode = 404;
    res.end('Not found');
  }
});
server.listen(port, () => console.log(`Dev server on http://localhost:${port}`));
