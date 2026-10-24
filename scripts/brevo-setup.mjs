// One-time Brevo setup for the Loqelo waitlist.
// Creates (or finds) a "Loqelo waitlist" folder, the two contact lists and the
// contact attributes the website writes, then prints the environment variables
// to copy into Vercel. Safe to run more than once.
//
//   BREVO_API_KEY=xkeysib-... npm run brevo:setup
//
// The API key needs the "Contacts" permission. It is read from the environment
// (or .env.local) and never printed.
import fs from 'node:fs';

function readEnvLocal() {
  try {
    for (const line of fs.readFileSync('.env.local', 'utf8').split('\n')) {
      const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
    }
  } catch {
    /* no .env.local */
  }
}
readEnvLocal();

const apiKey = process.env.BREVO_API_KEY;
const base = (process.env.BREVO_API_BASE_URL || 'https://api.brevo.com/v3').replace(/\/+$/, '');
if (!apiKey) {
  console.error('Set BREVO_API_KEY first (Brevo → Settings → SMTP & API → API keys).');
  process.exit(1);
}

async function brevo(method, path, body) {
  const response = await fetch(`${base}${path}`, {
    method,
    headers: { 'api-key': apiKey, accept: 'application/json', 'content-type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : {};
  if (!response.ok) {
    const error = new Error(`${method} ${path} → ${response.status} ${data.code ?? ''} ${data.message ?? ''}`);
    error.status = response.status;
    error.data = data;
    throw error;
  }
  return data;
}

const FOLDER = 'Loqelo waitlist';
const LISTS = {
  BREVO_LIST_ID_CUSTOMERS: 'Loqelo waitlist – Customers',
  BREVO_LIST_ID_PROVIDERS: 'Loqelo waitlist – Service providers',
};
const ATTRIBUTES = [
  'CUSTOMER_COUNTRY',
  'CUSTOMER_COUNTRY_CODE',
  'CUSTOMER_TYPE',
  'PROVIDER_COUNTRY',
  'PROVIDER_COUNTRY_CODE',
  'PROVIDER_TYPE',
  'SIGNUP_LANGUAGE',
  'CONSENT_TIMESTAMP',
  'CONSENT_VERSION',
];

const folders = await brevo('GET', '/contacts/folders?limit=50&offset=0');
let folder = (folders.folders ?? []).find((f) => f.name === FOLDER);
if (!folder) folder = await brevo('POST', '/contacts/folders', { name: FOLDER });
console.log(`Folder "${FOLDER}": ${folder.id}`);

const existing = await brevo('GET', '/contacts/lists?limit=50&offset=0');
const ids = {};
for (const [envName, listName] of Object.entries(LISTS)) {
  let list = (existing.lists ?? []).find((l) => l.name === listName);
  if (!list) list = await brevo('POST', '/contacts/lists', { name: listName, folderId: folder.id });
  ids[envName] = list.id;
  console.log(`List "${listName}": ${list.id}`);
}

for (const name of ATTRIBUTES) {
  try {
    await brevo('POST', `/contacts/attributes/normal/${name}`, { type: 'text' });
    console.log(`Attribute ${name}: created`);
  } catch (error) {
    if (error.status === 400) console.log(`Attribute ${name}: already exists`);
    else throw error;
  }
}

console.log('\nAdd these to Vercel → Project → Settings → Environment Variables (and .env.local):\n');
for (const [envName, id] of Object.entries(ids)) console.log(`${envName}=${id}`);
