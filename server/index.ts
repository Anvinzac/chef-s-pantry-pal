import express from 'express';
import cors from 'cors';
import db from './db.js';

const app = express();

// CORS: allow comma-separated origins via ALLOWED_ORIGINS env var, or all in dev.
const allowed = (process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
app.use(cors({
  origin: allowed.length === 0 ? true : (origin, cb) => {
    if (!origin || allowed.includes(origin)) return cb(null, true);
    cb(new Error(`CORS blocked: ${origin}`));
  },
}));
app.use(express.json({ limit: '5mb' }));

// Health check for Railway
app.get('/health', (_req, res) => res.json({ ok: true, ts: Date.now() }));

// ─── Users ───────────────────────────────────────────────
app.post('/api/users/login', async (req, res) => {
  try {
    const { name, role } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Name required' });
    const existing = await db.execute({ sql: 'SELECT * FROM users WHERE name = ?', args: [name.trim()] });
    if (existing.rows.length > 0) return res.json(existing.rows[0]);
    const id = `user-${Date.now()}`;
    await db.execute({ sql: 'INSERT INTO users (id, name, role) VALUES (?, ?, ?)', args: [id, name.trim(), role || 'chef'] });
    res.json({ id, name: name.trim(), role: role || 'chef' });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ─── Ingredients ─────────────────────────────────────────
app.get('/api/ingredients', async (_req, res) => {
  try {
    const result = await db.execute('SELECT * FROM ingredients ORDER BY category, name');
    res.json(result.rows.map(deserializeIngredient));
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.put('/api/ingredients', async (req, res) => {
  try {
    const ingredients = req.body;
    if (!Array.isArray(ingredients)) return res.status(400).json({ error: 'Array required' });

    const stmts = ingredients.map((ing: any) => ({
      sql: `INSERT INTO ingredients (id, name, emoji, unit, category, subcategory, reference_price, supplier, quick_quantities, last_ordered_quantity, last_order_date, order_frequency_days, next_reminder, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
        ON CONFLICT(id) DO UPDATE SET
          name=excluded.name, emoji=excluded.emoji, unit=excluded.unit, category=excluded.category, subcategory=excluded.subcategory,
          reference_price=excluded.reference_price, supplier=excluded.supplier, quick_quantities=excluded.quick_quantities,
          last_ordered_quantity=excluded.last_ordered_quantity, last_order_date=excluded.last_order_date,
          order_frequency_days=excluded.order_frequency_days, next_reminder=excluded.next_reminder, updated_at=datetime('now')`,
      args: [
        ing.id, ing.name, ing.emoji || '', ing.unit || 'kg', ing.category || '', ing.subcategory || null,
        ing.referencePrice ?? null, ing.supplier || null, JSON.stringify(ing.quickQuantities || []),
        ing.lastOrderedQuantity ?? null, ing.lastOrderDate || null, ing.orderFrequencyDays ?? null, ing.nextReminder || null,
      ],
    }));
    await db.batch(stmts);
    res.json({ ok: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.patch('/api/ingredients/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const result = await db.execute({ sql: 'SELECT * FROM ingredients WHERE id = ?', args: [id] });
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    const existing = result.rows[0] as any;
    const merged = { ...deserializeIngredient(existing), ...updates };
    await db.execute({
      sql: `UPDATE ingredients SET name=?, emoji=?, unit=?, category=?, subcategory=?, reference_price=?, supplier=?,
        quick_quantities=?, last_ordered_quantity=?, last_order_date=?, order_frequency_days=?, next_reminder=?, updated_at=datetime('now')
        WHERE id=?`,
      args: [
        merged.name, merged.emoji, merged.unit, merged.category, merged.subcategory || null,
        merged.referencePrice ?? null, merged.supplier || null, JSON.stringify(merged.quickQuantities || []),
        merged.lastOrderedQuantity ?? null, merged.lastOrderDate || null, merged.orderFrequencyDays ?? null, merged.nextReminder || null, id,
      ],
    });
    res.json({ ok: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/ingredients/:id', async (req, res) => {
  try {
    await db.execute({ sql: 'DELETE FROM ingredients WHERE id = ?', args: [req.params.id] });
    res.json({ ok: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ─── Orders ──────────────────────────────────────────────
app.post('/api/orders', async (req, res) => {
  try {
    const { totalCostK, items } = req.body;
    const orderId = `order-${Date.now()}`;
    const now = new Date().toISOString();
    const orderDate = now.split('T')[0];

    const stmts: any[] = [
      { sql: 'INSERT INTO orders (id, order_date, total_cost_k, created_at) VALUES (?, ?, ?, ?)', args: [orderId, orderDate, totalCostK ?? null, now] },
    ];
    (items || []).forEach((item: any, i: number) => {
      stmts.push({
        sql: `INSERT INTO order_items (id, order_id, ingredient_id, name, category, subcategory, quantity, unit, cost_k, reference_price, supplier, emoji, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          `${orderId}-item-${i}`, orderId, item.ingredientId, item.name,
          item.category || '', item.subcategory || null, item.quantity, item.unit,
          item.costK ?? null, item.referencePrice ?? null, item.supplier || null, item.emoji || null, now,
        ],
      });
    });
    await db.batch(stmts);
    res.json({ id: orderId });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.get('/api/orders', async (req, res) => {
  try {
    const { since, category } = req.query;
    let query = 'SELECT * FROM orders';
    const params: any[] = [];
    if (since) { query += ' WHERE order_date >= ?'; params.push(since); }
    query += ' ORDER BY order_date DESC, created_at DESC';

    const ordersResult = await db.execute({ sql: query, args: params });
    const orders = ordersResult.rows as any[];
    if (orders.length === 0) return res.json([]);

    const orderIds = orders.map((o: any) => o.id);
    const placeholders = orderIds.map(() => '?').join(',');
    let itemQuery = `SELECT * FROM order_items WHERE order_id IN (${placeholders})`;
    const itemParams = [...orderIds];
    if (category && category !== 'all') {
      itemQuery += ' AND category = ?';
      itemParams.push(category as string);
    }

    const itemsResult = await db.execute({ sql: itemQuery, args: itemParams });
    const items = itemsResult.rows as any[];

    const result = orders.map((o: any) => ({
      ...o,
      items: items.filter((i: any) => i.order_id === o.id),
    })).filter((o: any) => o.items.length > 0);

    res.json(result);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ─── Stock Reports ───────────────────────────────────────
app.get('/api/stock-reports', async (_req, res) => {
  try {
    const result = await db.execute('SELECT * FROM stock_reports WHERE resolved_at IS NULL ORDER BY reported_at DESC');
    res.json(result.rows);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.post('/api/stock-reports', async (req, res) => {
  try {
    const r = req.body;
    const id = `report-${Date.now()}`;
    await db.execute({
      sql: 'INSERT INTO stock_reports (id, ingredient_id, name, emoji, category, subcategory, unit) VALUES (?, ?, ?, ?, ?, ?, ?)',
      args: [id, r.ingredientId, r.name, r.emoji || '', r.category || '', r.subcategory || null, r.unit],
    });
    res.json({ id });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.patch('/api/stock-reports/:id/resolve', async (req, res) => {
  try {
    await db.execute({ sql: "UPDATE stock_reports SET resolved_at = datetime('now') WHERE id = ?", args: [req.params.id] });
    res.json({ ok: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ─── Stock Remaining ─────────────────────────────────────
app.get('/api/stock-remaining', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const result = await db.execute({ sql: 'SELECT * FROM stock_remaining WHERE reported_at >= ? ORDER BY reported_at DESC', args: [today] });
    res.json(result.rows);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.post('/api/stock-remaining', async (req, res) => {
  try {
    const r = req.body;
    const id = `remaining-${Date.now()}`;
    const today = new Date().toISOString().split('T')[0];
    await db.execute({ sql: 'DELETE FROM stock_remaining WHERE ingredient_id = ? AND reported_at >= ?', args: [r.ingredientId, today] });
    await db.execute({
      sql: 'INSERT INTO stock_remaining (id, ingredient_id, name, emoji, category, subcategory, unit, remaining_quantity) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      args: [id, r.ingredientId, r.name || '', r.emoji || '', r.category || '', r.subcategory || null, r.unit, r.quantity],
    });
    res.json({ id });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ─── Menu Dishes ─────────────────────────────────────────
app.get('/api/menu-dishes', async (_req, res) => {
  try {
    const result = await db.execute('SELECT * FROM menu_dishes ORDER BY sort_order');
    res.json(result.rows);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.post('/api/menu-dishes', async (req, res) => {
  try {
    const d = req.body;
    const id = d.id || `dish-${Date.now()}`;
    await db.execute({ sql: 'INSERT OR REPLACE INTO menu_dishes (id, name, category, sort_order) VALUES (?, ?, ?, ?)', args: [id, d.name, d.category, d.sortOrder ?? 0] });
    res.json({ id });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.patch('/api/menu-dishes/:id', async (req, res) => {
  try {
    const { name } = req.body;
    await db.execute({ sql: 'UPDATE menu_dishes SET name = ? WHERE id = ?', args: [name, req.params.id] });
    res.json({ ok: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/menu-dishes/:id', async (req, res) => {
  try {
    await db.execute({ sql: 'DELETE FROM menu_dishes WHERE id = ?', args: [req.params.id] });
    res.json({ ok: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ─── Daily Menus ─────────────────────────────────────────
app.get('/api/daily-menus/:date/:branchId', async (req, res) => {
  try {
    const result = await db.execute({ sql: 'SELECT * FROM daily_menus WHERE menu_date = ? AND branch_id = ?', args: [req.params.date, req.params.branchId] });
    if (result.rows.length === 0) return res.json(null);
    const row = result.rows[0] as any;
    res.json({ ...row, dishes: JSON.parse(row.dishes || '[]') });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.put('/api/daily-menus', async (req, res) => {
  try {
    const { date, branchId, dishes } = req.body;
    await db.execute({
      sql: `INSERT INTO daily_menus (menu_date, branch_id, dishes) VALUES (?, ?, ?)
        ON CONFLICT(menu_date, branch_id) DO UPDATE SET dishes = excluded.dishes, created_at = datetime('now')`,
      args: [date, branchId || 'pnt', JSON.stringify(dishes)],
    });
    res.json({ ok: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ─── Inventory ───────────────────────────────────────────
app.get('/api/inventory/:spaceId', async (req, res) => {
  try {
    const result = await db.execute({ sql: 'SELECT * FROM inventory WHERE space_id = ? ORDER BY code', args: [req.params.spaceId] });
    res.json(result.rows);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.put('/api/inventory/:spaceId', async (req, res) => {
  try {
    const { spaceId } = req.params;
    const rows = req.body;
    if (!Array.isArray(rows)) return res.status(400).json({ error: 'Array required' });

    const stmts = rows.map((r: any) => ({
      sql: `INSERT INTO inventory (id, space_id, code, name, quantity, unit, note, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
        ON CONFLICT(id) DO UPDATE SET code=excluded.code, name=excluded.name, quantity=excluded.quantity, unit=excluded.unit, note=excluded.note, updated_at=datetime('now')`,
      args: [r.id, spaceId, r.code, r.name, r.quantity, r.unit, r.note || ''],
    }));
    await db.batch(stmts);
    res.json({ ok: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/inventory/:id', async (req, res) => {
  try {
    await db.execute({ sql: 'DELETE FROM inventory WHERE id = ?', args: [req.params.id] });
    res.json({ ok: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
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

const PORT = Number(process.env.PORT) || 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🍳 Kitchen API running on port ${PORT}`);
});
