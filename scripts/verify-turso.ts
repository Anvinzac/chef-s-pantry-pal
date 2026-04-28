import 'dotenv/config';
import { createClient } from '@libsql/client';

const db = createClient({
  url: process.env.VITE_TURSO_DATABASE_URL || '',
  authToken: process.env.VITE_TURSO_AUTH_TOKEN || '',
});

async function main() {
  const count = await db.execute('SELECT COUNT(*) as cnt FROM ingredients');
  console.log('Total ingredients:', count.rows[0]);

  const byCat = await db.execute('SELECT category, COUNT(*) as cnt FROM ingredients GROUP BY category ORDER BY category');
  console.log('\nBy category:');
  for (const row of byCat.rows) {
    console.log(`  ${row.category}: ${row.cnt}`);
  }

  const sample = await db.execute('SELECT id, name, emoji, category, subcategory FROM ingredients LIMIT 5');
  console.log('\nSample rows:');
  for (const row of sample.rows) {
    console.log(`  ${row.emoji} ${row.name} [${row.category}/${row.subcategory}]`);
  }

  const tables = await db.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name");
  console.log('\nTables:', tables.rows.map((r: any) => r.name));
}

main().catch(console.error);
