// Minimal stand-in for the Brevo contacts API, used only by the end-to-end tests.
// It records what the website sends so tests can assert on it.
import http from 'node:http';

const port = Number(process.env.MOCK_BREVO_PORT || 4010);
let requests = [];
let nextId = 1;

const server = http.createServer(async (req, res) => {
  let raw = '';
  for await (const chunk of req) raw += chunk;
  const send = (status, body) => {
    res.writeHead(status, { 'content-type': 'application/json' });
    res.end(body === undefined ? '' : JSON.stringify(body));
  };

  if (req.url === '/__requests') return send(200, requests);
  if (req.url === '/__reset') {
    requests = [];
    return send(200, { ok: true });
  }

  const body = raw ? JSON.parse(raw) : null;
  requests.push({ method: req.method, path: req.url, apiKey: req.headers['api-key'] ?? null, body });

  if (req.headers['api-key'] !== 'test-key') return send(401, { code: 'unauthorized', message: 'Key not found' });
  if (req.method === 'POST' && (req.url === '/v3/contacts' || req.url === '/v3/contacts/doubleOptinConfirmation')) {
    const email = String(body?.email ?? '');
    if (email.startsWith('fail500')) return send(500, { code: 'internal_error', message: 'Simulated outage' });
    if (email.startsWith('invalid')) return send(400, { code: 'invalid_parameter', message: 'Invalid email address' });
    return send(201, { id: nextId++ });
  }
  return send(404, { code: 'not_found' });
});

server.listen(port, '127.0.0.1', () => console.log(`mock Brevo on http://127.0.0.1:${port}`));
