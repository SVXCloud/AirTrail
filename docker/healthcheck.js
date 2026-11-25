import { normalizeBasePath } from '../scripts/subpath/base-path.js';

const port = process.env.PORT ?? '3000';
const response = await fetch(
  `http://127.0.0.1:${port}${normalizeBasePath(process.env.BASE_PATH)}/api/ping`,
);

if (!response.ok) {
  process.exit(1);
}

const body = await response.text();
process.exit(body.trim() === 'pong' ? 0 : 1);
