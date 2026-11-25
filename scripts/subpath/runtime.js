import {
  copyFile,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  symlink,
  writeFile,
} from 'node:fs/promises';
import { constants, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, extname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import {
  normalizeBasePath,
  rewriteDiscoveryUrl,
  templateBase,
} from './base-path.js';

const textFiles = new Set([
  '.css',
  '.html',
  '.js',
  '.json',
  '.map',
  '.webmanifest',
  '.xml',
]);

async function relocate(source, destination, base) {
  await mkdir(destination, { recursive: true });
  for (const entry of await readdir(source, { withFileTypes: true })) {
    const from = join(source, entry.name);
    const to = join(
      destination,
      entry.name === templateBase.slice(1) ? base.slice(1) : entry.name,
    );
    if (entry.isDirectory()) {
      await relocate(from, to, base);
    } else if (textFiles.has(extname(entry.name))) {
      const content = await readFile(from, 'utf8');
      const relocated = content
        .replaceAll(templateBase, base)
        // Kit's manifest.appPath is relative, without the leading slash.
        .replaceAll(
          templateBase.slice(1) + '/',
          base ? base.slice(1) + '/' : '',
        );
      await writeFile(to, relocated);
    } else {
      await copyFile(from, to, constants.COPYFILE_FICLONE);
    }
  }
}

const base = normalizeBasePath(process.env.BASE_PATH);
const app = resolve(process.argv[2] ?? 'build');
const templated = process.env.AIRTRAIL_BUILD_IS_TEMPLATE === '1';
let entry = join(app, 'index.js');

if (templated) {
  const runtime = await mkdtemp(join(tmpdir(), 'airtrail-'));
  const project = dirname(app);
  try {
    await symlink(join(project, 'node_modules'), join(runtime, 'node_modules'));
    await symlink(join(project, 'package.json'), join(runtime, 'package.json'));
    const output = join(runtime, 'build');
    await relocate(app, output, base);
    entry = join(output, 'index.js');
  } catch (error) {
    await rm(runtime, { recursive: true, force: true });
    throw error;
  }
  process.on('exit', () => {
    // The OS may terminate the process before asynchronous exit work can run.
    rmSync(runtime, { recursive: true, force: true });
  });
}

const { server } = await import(pathToFileURL(entry).href);
if (base) {
  server.server.prependListener('request', (request) =>
    rewriteDiscoveryUrl(request, base),
  );
}
