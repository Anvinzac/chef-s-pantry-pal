import 'dotenv/config';
import { createClient } from '@libsql/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ingredientsData = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'src', 'data', 'ingredients.json'), 'utf8'));

const tursoUrl = process.env.VITE_TURSO_DATABASE_URL || process.env.TURSO_DATABASE_URL || 'file:data/kitchen.db';
console.log(`Connecting to: ${tursoUrl}`);
console.log(`Has auth token: ${!!process.env.VITE_TURSO_AUTH_TOKEN}`);

const db = createClient({
  url: tursoUrl,
  authToken: process.env.VITE_TURSO_AUTH_TOKEN || process.env.TURSO_AUTH_TOKEN,
});

const ingredients = ingredientsData;
console.log(`Seeding ${ingredients.length} ingredients...`);

// Clear existing ingredients
await db.execute('DELETE FROM ingredients');
console.log('Cleared existing ingredients');

// Batch insert
const stmts = ingredients.map((ing) => ({
  sql: `INSERT INTO ingredients (id, name, emoji, unit, category, subcategory, reference_price, supplier, quick_quantities, last_ordered_quantity, last_order_date, order_frequency_days, next_reminder)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  args: [
    ing.id,
    ing.name,
    ing.emoji || '',
    ing.unit || 'kg',
    ing.category || '',
    ing.subcategory || null,
    ing.referencePrice ?? null,
    ing.supplier || null,
    JSON.stringify(ing.quickQuantities || []),
    ing.lastOrderedQuantity ?? null,
    ing.lastOrderDate || null,
    ing.orderFrequencyDays ?? null,
    ing.nextReminder || null,
  ],
}));

// Batch in chunks of 100 to avoid oversized requests
const chunkSize = 100;
for (let i = 0; i < stmts.length; i += chunkSize) {
  const chunk = stmts.slice(i, i + chunkSize);
  await db.batch(chunk);
  console.log(`Inserted ${Math.min(i + chunkSize, stmts.length)} / ${stmts.length}`);
}

// Verify
const result = await db.execute('SELECT COUNT(*) as cnt FROM ingredients');
console.log(`Done. DB now has ${result.rows[0].cnt} ingredients`);

// Show subcategory distribution
const subResult = await db.execute(
  'SELECT subcategory, COUNT(*) as cnt FROM ingredients WHERE category = ? GROUP BY subcategory ORDER BY cnt DESC',
  ['vegetables']
);
console.log('\nVegetable subcategory distribution:');
for (const row of subResult.rows) {
  console.log(`  ${row.subcategory || '(none)'}: ${row.cnt}`);
}
