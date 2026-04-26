import express from 'express';
import cors from 'cors';
import db from './db.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '5mb' }));

// ─── Users ───────────────────────────────────────────────
app.post('/api/users/login', (req, res) => {
  const { name, role } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'Name required' });
  const id = `user-${Date.now()}`;
  const existing = db.prepare('SELECT * FROM users WHERE name = ?').get(name.trim());
  if (existing) return res.json(existing);
  db.prepare('INSERT INTO users (id, name, role) VALUES (?, ?, ?)').run(id, name.trim(), role || 'chef');
  res.json({ id, name: name.trim(), role: role || 'chef' });
});

// ─── Ingredients ─────────────────────────────────────────
app.get('/api/ingredients', (_req, res) => {
  const rows = db.prepare('SELECT * FROM ingredients ORDER BY category, name').all();
  res.json(rows.map(deserializeIngredient));
});

app.put('/api/ingredients', (req, res) => {
  const ingredients = req.body;
  if (!Array.isArray(ingredients)) return res.status(400).json({ error: 'Array required' });

  const upsert = db.prepare(`
    INSERT INTO ingredients (id, name, emoji, unit, category, subcategory, reference_price, supplier, quick_quantities, last_ordered_quantity, last_order_date, order_frequency_days, next_reminder, updated_at)
    VALUES (@id, @name, @emoji, @unit, @category, @subcategory, @referencePrice, @supplier, @quickQuantities, @lastOrderedQuantity, @lastOrderDate, @orderFrequencyDays, @nextReminder, datetime('now'))
    ON CONFLICT(id) DO UPDATE SET
      name=@name, emoji=@emoji, unit=@unit, category=@category, subcategory=@subcategory,
      reference_price=@referencePrice, supplier=@supplier, quick_quantities=@quickQuantities,
      last_ordered_quantity=@lastOrderedQuantity, last_order_date=@lastOrderDate,
      order_frequency_days=@orderFrequencyDays, next_reminder=@nextReminder, updated_at=datetime('now')
  `);

  const tx = db.transaction(() => {
    for (const ing of ingredients) {
      upsert.run({
        id: ing.id,
        name: ing.name,
        emoji: ing.emoji || '',
        unit: ing.unit || 'kg',
        category: ing.category || '',
        subcategory: ing.subcategory || null,
        referencePrice: ing.referencePrice ?? null,
        supplier: ing.supplier || null,
        quickQuantities: JSON.stringify(ing.quickQuantities || []),
        lastOrderedQuantity: ing.lastOrderedQuantity ?? null,
        lastOrderDate: ing.lastOrderDate || null,
        orderFrequencyDays: ing.orderFrequencyDays ?? null,
        nextReminder: ing.nextReminder || null,
      });
    }
  });
  tx();
  res.json({ ok: true });
});

app.patch('/api/ingredients/:id', (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const existing = db.prepare('SELECT * FROM ingredients WHERE id = ?').get(id) as any;
  if (!existing) return res.status(404).json({ error: 'Not found' });

  const merged = { ...deserializeIngredient(existing), ...updates };
  db.prepare(`
    UPDATE ingredients SET name=?, emoji=?, unit=?, category=?, subcategory=?, reference_price=?, supplier=?,
    quick_quantities=?, last_ordered_quantity=?, last_order_date=?, order_frequency_days=?, next_reminder=?, updated_at=datetime('now')
    WHERE id=?
  `).run(
    merged.name, merged.emoji, merged.unit, merged.category, merged.subcategory || null,
    merged.referencePrice ?? null, merged.supplier || null,
    JSON.stringify(merged.quickQuantities || []),
    merged.lastOrderedQuantity ?? null, merged.lastOrderDate || null,
    merged.orderFrequencyDays ?? null, merged.nextReminder || null, id
  );
  res.json({ ok: true });
});

app.delete('/api/ingredients/:id', (req, res) => {
  db.prepare('DELETE FROM ingredients WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// ─── Orders ──────────────────────────────────────────────
app.post('/api/orders', (req, res) => {
  const { totalCostK, items } = req.body;
  const orderId = `order-${Date.now()}`;
  const now = new Date().toISOString();
  const orderDate = now.split('T')[0];

  db.prepare('INSERT INTO orders (id, order_date, total_cost_k, created_at) VALUES (?, ?, ?, ?)')
    .run(orderId, orderDate, totalCostK ?? null, now);

  const insertItem = db.prepare(`
    INSERT INTO order_items (id, order_id, ingredient_id, name, category, subcategory, quantity, unit, cost_k, reference_price, supplier, emoji, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const tx = db.transaction(() => {
    (items || []).forEach((item: any, i: number) => {
      insertItem.run(
        `${orderId}-item-${i}`, orderId, item.ingredientId, item.name,
        item.category || '', item.subcategory || null,
        item.quantity, item.unit, item.costK ?? null,
        item.referencePrice ?? null, item.supplier || null, item.emoji || null, now
      );
    });
  });
  tx();
  res.json({ id: orderId });
});

app.get('/api/orders', (req, res) => {
  const { since, category } = req.query;
  let query = 'SELECT * FROM orders';
  const params: any[] = [];
  if (since) { query += ' WHERE order_date >= ?'; params.push(since); }
  query += ' ORDER BY order_date DESC, created_at DESC';

  const orders = db.prepare(query).all(...params) as any[];
  const orderIds = orders.map(o => o.id);
  if (orderIds.length === 0) return res.json([]);

  const placeholders = orderIds.map(() => '?').join(',');
  let itemQuery = `SELECT * FROM order_items WHERE order_id IN (${placeholders})`;
  const itemParams = [...orderIds];
  if (category && category !== 'all') {
    itemQuery += ' AND category = ?';
    itemParams.push(category as string);
  }

  const items = db.prepare(itemQuery).all(...itemParams) as any[];

  const result = orders.map(o => ({
    ...o,
    items: items.filter(i => i.order_id === o.id),
  })).filter(o => o.items.length > 0);

  res.json(result);
});

// ─── Stock Reports ───────────────────────────────────────
app.get('/api/stock-reports', (_req, res) => {
  const rows = db.prepare('SELECT * FROM stock_reports WHERE resolved_at IS NULL ORDER BY reported_at DESC').all();
  res.json(rows);
});

app.post('/api/stock-reports', (req, res) => {
  const r = req.body;
  const id = `report-${Date.now()}`;
  db.prepare(`INSERT INTO stock_reports (id, ingredient_id, name, emoji, category, subcategory, unit)
    VALUES (?, ?, ?, ?, ?, ?, ?)`)
    .run(id, r.ingredientId, r.name, r.emoji || '', r.category || '', r.subcategory || null, r.unit);
  res.json({ id });
});

app.patch('/api/stock-reports/:id/resolve', (req, res) => {
  db.prepare("UPDATE stock_reports SET resolved_at = datetime('now') WHERE id = ?").run(req.params.id);
  res.json({ ok: true });
});

// ─── Stock Remaining ─────────────────────────────────────
app.get('/api/stock-remaining', (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const rows = db.prepare('SELECT * FROM stock_remaining WHERE reported_at >= ? ORDER BY reported_at DESC')
    .all(today);
  res.json(rows);
});

app.post('/api/stock-remaining', (req, res) => {
  const r = req.body;
  const id = `remaining-${Date.now()}`;
  const today = new Date().toISOString().split('T')[0];

  // Remove old report for same ingredient today
  db.prepare('DELETE FROM stock_remaining WHERE ingredient_id = ? AND reported_at >= ?')
    .run(r.ingredientId, today);

  db.prepare(`INSERT INTO stock_remaining (id, ingredient_id, name, emoji, category, subcategory, unit, remaining_quantity)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(id, r.ingredientId, r.name || '', r.emoji || '', r.category || '', r.subcategory || null, r.unit, r.quantity);
  res.json({ id });
});

// ─── Menu Dishes ─────────────────────────────────────────
app.get('/api/menu-dishes', (_req, res) => {
  const rows = db.prepare('SELECT * FROM menu_dishes ORDER BY sort_order').all();
  res.json(rows);
});

app.post('/api/menu-dishes', (req, res) => {
  const d = req.body;
  const id = d.id || `dish-${Date.now()}`;
  db.prepare('INSERT OR REPLACE INTO menu_dishes (id, name, category, sort_order) VALUES (?, ?, ?, ?)')
    .run(id, d.name, d.category, d.sortOrder ?? 0);
  res.json({ id });
});

app.patch('/api/menu-dishes/:id', (req, res) => {
  const { name } = req.body;
  db.prepare('UPDATE menu_dishes SET name = ? WHERE id = ?').run(name, req.params.id);
  res.json({ ok: true });
});

app.delete('/api/menu-dishes/:id', (req, res) => {
  db.prepare('DELETE FROM menu_dishes WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// ─── Daily Menus ─────────────────────────────────────────
app.get('/api/daily-menus/:date/:branchId', (req, res) => {
  const row = db.prepare('SELECT * FROM daily_menus WHERE menu_date = ? AND branch_id = ?')
    .get(req.params.date, req.params.branchId) as any;
  if (!row) return res.json(null);
  res.json({ ...row, dishes: JSON.parse(row.dishes || '[]') });
});

app.put('/api/daily-menus', (req, res) => {
  const { date, branchId, dishes } = req.body;
  db.prepare(`INSERT INTO daily_menus (menu_date, branch_id, dishes)
    VALUES (?, ?, ?) ON CONFLICT(menu_date, branch_id) DO UPDATE SET dishes = ?, created_at = datetime('now')`)
    .run(date, branchId || 'pnt', JSON.stringify(dishes), JSON.stringify(dishes));
  res.json({ ok: true });
});

// ─── Inventory ───────────────────────────────────────────
app.get('/api/inventory/:spaceId', (req, res) => {
  const rows = db.prepare('SELECT * FROM inventory WHERE space_id = ? ORDER BY code').all(req.params.spaceId);
  res.json(rows);
});

app.put('/api/inventory/:spaceId', (req, res) => {
  const { spaceId } = req.params;
  const rows = req.body;
  if (!Array.isArray(rows)) return res.status(400).json({ error: 'Array required' });

  const upsert = db.prepare(`
    INSERT INTO inventory (id, space_id, code, name, quantity, unit, note, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
    ON CONFLICT(id) DO UPDATE SET code=?, name=?, quantity=?, unit=?, note=?, updated_at=datetime('now')
  `);

  const tx = db.transaction(() => {
    for (const r of rows) {
      upsert.run(r.id, spaceId, r.code, r.name, r.quantity, r.unit, r.note || '',
        r.code, r.name, r.quantity, r.unit, r.note || '');
    }
  });
  tx();
  res.json({ ok: true });
});

app.delete('/api/inventory/:id', (req, res) => {
  db.prepare('DELETE FROM inventory WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// ─── Helper ──────────────────────────────────────────────
function deserializeIngredient(row: any) {
  return {
    id: row.id,
    name: row.name,
    emoji: row.emoji,
    unit: row.unit,
    category: row.category,
    subcategory: row.subcategory || undefined,
    referencePrice: row.reference_price ?? undefined,
    supplier: row.supplier || undefined,
    quickQuantities: JSON.parse(row.quick_quantities || '[]'),
    lastOrderedQuantity: row.last_ordered_quantity ?? undefined,
    lastOrderDate: row.last_order_date || undefined,
    orderFrequencyDays: row.order_frequency_days ?? undefined,
    nextReminder: row.next_reminder || undefined,
  };
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🍳 Kitchen API running on http://localhost:${PORT}`);
});
