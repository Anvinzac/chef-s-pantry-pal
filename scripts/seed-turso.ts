/**
 * Seed script: pushes ingredients.json data into Turso database.
 * Run with: npx tsx scripts/seed-turso.ts
 */
import 'dotenv/config';
import { createClient } from '@libsql/client';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const db = createClient({
  url: process.env.TURSO_DATABASE_URL || process.env.VITE_TURSO_DATABASE_URL || '',
  authToken: process.env.TURSO_AUTH_TOKEN || process.env.VITE_TURSO_AUTH_TOKEN || '',
});

const raw = readFileSync(join(__dirname, '..', 'src', 'data', 'ingredients.json'), 'utf-8');
const ingredients: any[] = JSON.parse(raw);

console.log(`Seeding ${ingredients.length} ingredients into Turso...`);

const stmts = ingredients.map((ing) => ({
  sql: `INSERT OR REPLACE INTO ingredients (id, name, emoji, unit, category, subcategory, reference_price, supplier, quick_quantities, last_ordered_quantity, last_order_date, order_frequency_days, next_reminder, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
  args: [
    ing.id, ing.name, ing.emoji || '', ing.unit || 'kg', ing.category || '', ing.subcategory || null,
    ing.referencePrice ?? null, ing.supplier || null, JSON.stringify(ing.quickQuantities || []),
    ing.lastOrderedQuantity ?? null, ing.lastOrderDate || null, ing.orderFrequencyDays ?? null, ing.nextReminder || null,
  ],
}));

// Turso batch limit is ~100 statements, so chunk them
const CHUNK = 80;
for (let i = 0; i < stmts.length; i += CHUNK) {
  const chunk = stmts.slice(i, i + CHUNK);
  await db.batch(chunk);
  console.log(`  ✓ ${Math.min(i + CHUNK, stmts.length)}/${stmts.length}`);
}

// Also seed a default user
await db.execute({
  sql: `INSERT OR IGNORE INTO users (id, name, role) VALUES (?, ?, ?)`,
  args: ['user-default', 'Bếp Trưởng', 'chef'],
});

console.log('✅ Done! Database seeded.');
