const test = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const path = require('node:path');

let server;
let port;

function waitForServer(url, timeout = 5000) {
  const started = Date.now();
  return new Promise((resolve, reject) => {
    const tryConnect = () => {
      fetch(url)
        .then(() => resolve())
        .catch(() => {
          if (Date.now() - started > timeout) {
            reject(new Error(`Timed out waiting for ${url}`));
            return;
          }
          setTimeout(tryConnect, 100);
        });
    };
    tryConnect();
  });
}

test.before(async () => {
  port = 3100 + Math.floor(Math.random() * 1000);
  server = spawn(process.execPath, ['server.js'], {
    cwd: path.join(__dirname, '..'),
    env: { ...process.env, PORT: String(port) },
    stdio: ['ignore', 'pipe', 'pipe']
  });

  server.stdout.on('data', (chunk) => process.stdout.write(chunk));
  server.stderr.on('data', (chunk) => process.stderr.write(chunk));

  await waitForServer(`http://127.0.0.1:${port}/`);
});

test.after(() => {
  if (server && !server.killed) {
    server.kill('SIGTERM');
  }
});

test('POST /api/contact returns 200 for valid payload', async () => {
  const res = await fetch(`http://127.0.0.1:${port}/api/contact`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Awais',
      email: 'awais@example.com',
      subject: 'Test',
      message: 'This is a test message.'
    })
  });

  assert.equal(res.status, 200);
  const json = await res.json();
  assert.equal(json.success, true);
});
