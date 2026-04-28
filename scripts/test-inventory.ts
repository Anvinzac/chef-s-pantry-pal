import 'dotenv/config';
import { createClient } from '@libsql/client';

const db = createClient({
  url: process.env.VITE_TURSO_DATABASE_URL || '',
  authToken: process.env.VITE_TURSO_AUTH_TOKEN || '',
});

async function main() {
  // Check all tables for row counts
  const tables = ['users', 'ingredients', 'inventory', 'orders', 'order_items', 'stock_reports', 'stock_remaining', 'menu_dishes', 'daily_menus'];
  for (const t of tables) {
    const r = await db.execute(`SELECT COUNT(*) as cnt FROM ${t}`);
    console.log(`${t}: ${r.rows[0].cnt} rows`);
  }

  // Check inventory specifically
  const inv = await db.execute('SELECT * FROM inventory LIMIT 5');
  console.log('\nInventory sample:', inv.rows);

  // Check what spaces exist
  const spaces = await db.execute('SELECT DISTINCT space_id, COUNT(*) as cnt FROM inventory GROUP BY space_id');
  console.log('\nInventory by space:', spaces.rows);
}

main().catch(console.error);
