import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { startServer } from '../electron/server.cjs';

test('serves the app and rejects invalid requests and directory traversal', async (t) => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'ui5-server-'));
  const root = path.join(directory, 'public');
  await fs.mkdir(root);
  await fs.writeFile(path.join(root, 'index.html'), '<h1>Application</h1>');
  await fs.writeFile(path.join(directory, 'secret.txt'), 'secret');
  const { server, url } = await startServer(root);
  t.after(async () => {
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    await fs.rm(directory, { recursive: true, force: true });
  });
  const response = await fetch(url);
  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type') ?? '', /text\/html/);
  assert.equal(await response.text(), '<h1>Application</h1>');
  assert.equal((await fetch(url, { method: 'HEAD' })).status, 200);
  assert.equal((await fetch(url, { method: 'POST' })).status, 405);
  assert.equal((await fetch(`${url}/missing.js`)).status, 404);
  assert.equal((await fetch(`${url}/%ZZ`)).status, 400);
  assert.equal((await fetch(`${url}/%2e%2e%2fsecret.txt`)).status, 403);
  assert.equal((await fetch(`${url}/..%5csecret.txt`)).status, 403);
  const invalidHostStatus = await new Promise<number | undefined>((resolve, reject) => {
    http.get(url, { headers: { Host: 'untrusted.example' } }, (result) => {
      result.resume();
      resolve(result.statusCode);
    }).on('error', reject);
  });
  assert.equal(invalidHostStatus, 403);
});
