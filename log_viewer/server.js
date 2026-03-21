import express from 'express';
import multer from 'multer';
import { randomBytes } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, renameSync, statSync, unlinkSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { exec } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, 'data');
const DIST_DIR = join(__dirname, 'dist');
const PORT = process.env.PORT || 3000;
const MAX_AGE_MS = 60 * 60 * 1000;

if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });

function cleanOldFiles() {
  const now = Date.now();
  for (const file of readdirSync(DATA_DIR)) {
    const filePath = join(DATA_DIR, file);
    try {
      const stat = statSync(filePath);
      if (now - stat.mtimeMs > MAX_AGE_MS) unlinkSync(filePath);
    } catch { /* ignore */ }
  }
}

const upload = multer({ dest: DATA_DIR });
const app = express();

app.post('/api/upload', upload.single('file'), (req, res) => {
  cleanOldFiles();

  if (!req.file) {
    res.status(400).json({ error: 'No file provided. Use: curl -F "file=@yourfile.txt" ...' });
    return;
  }

  const id = randomBytes(8).toString('hex');
  const dest = join(DATA_DIR, `${id}.json`);
  renameSync(req.file.path, dest);

  const url = `http://localhost:${PORT}/?file=${id}`;
  exec(`open "${url}"`);

  res.json({ id, url });
});

app.get('/api/file/:id', (req, res) => {
  const filePath = join(DATA_DIR, `${req.params.id}.json`);
  if (!existsSync(filePath)) {
    res.status(404).json({ error: 'File not found or expired' });
    return;
  }
  const content = readFileSync(filePath, 'utf-8');
  res.type('text/plain').send(content);
});

app.use(express.static(DIST_DIR));
app.get('/{*splat}', (_req, res) => {
  res.sendFile(join(DIST_DIR, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Log Viewer server running at http://localhost:${PORT}`);
});
