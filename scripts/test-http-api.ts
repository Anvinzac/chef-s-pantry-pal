import 'dotenv/config';

const DB_URL = (process.env.VITE_TURSO_DATABASE_URL || '').replace('libsql://', 'https://');
const AUTH_TOKEN = process.env.VITE_TURSO_AUTH_TOKEN || '';

async function main() {
  const res = await fetch(`${DB_URL}/v3/pipeline`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${AUTH_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      requests: [
        { type: 'execute', stmt: { sql: 'SELECT id, name, category FROM ingredients LIMIT 3', args: [] } },
        { type: 'close' },
      ],
    }),
  });

  const data = await res.json();
  console.log('Status:', res.status);
  console.log('Full response:', JSON.stringify(data, null, 2));
}

main().catch(console.error);
