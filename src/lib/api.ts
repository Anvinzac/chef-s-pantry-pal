import { execute, batch } from './turso';

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

export const api = {
  // ─── Users ───────────────────────────────────────────
  login: async (name: string, role = 'chef') => {
    const existing = await execute('SELECT * FROM users WHERE name = ?', [name.trim()]);
    if (existing.length > 0) return existing[0] as { id: string; name: string; role: string };
    const id = `user-${Date.now()}`;
    await execute('INSERT INTO users (id, name, role) VALUES (?, ?, ?)', [id, name.trim(), role]);
    return { id, name: name.trim(), role };
  },

  // ─── Ingredients ─────────────────────────────────────
  getIngredients: async () => {
    const rows = await execute('SELECT * FROM ingredients ORDER BY category, name');
    return rows.map(deserializeIngredient);
  },

  saveIngredients: async (ingredients: any[]) => {
    const stmts = ingredients.map((ing) => ({
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
    await batch(stmts);
    return { ok: true };
  },

  updateIngredient: async (id: string, updates: any) => {
    const rows = await execute('SELECT * FROM ingredients WHERE id = ?', [id]);
    if (rows.length === 0) throw new Error('Not found');
    const merged = { ...deserializeIngredient(rows[0]), ...updates };
    await execute(
      `UPDATE ingredients SET name=?, emoji=?, unit=?, category=?, subcategory=?, reference_price=?, supplier=?,
        quick_quantities=?, last_ordered_quantity=?, last_order_date=?, order_frequency_days=?, next_reminder=?, updated_at=datetime('now')
        WHERE id=?`,
      [
        merged.name, merged.emoji, merged.unit, merged.category, merged.subcategory || null,
        merged.referencePrice ?? null, merged.supplier || null, JSON.stringify(merged.quickQuantities || []),
        merged.lastOrderedQuantity ?? null, merged.lastOrderDate || null, merged.orderFrequencyDays ?? null, merged.nextReminder || null, id,
      ],
    );
    return { ok: true };
  },

  deleteIngredient: async (id: string) => {
    await execute('DELETE FROM ingredients WHERE id = ?', [id]);
    return { ok: true };
  },

  // ─── Orders ──────────────────────────────────────────
  saveOrder: async (totalCostK: number, items: any[]) => {
    const orderId = `order-${Date.now()}`;
    const now = new Date().toISOString();
    const orderDate = now.split('T')[0];

    const stmts: { sql: string; args: any[] }[] = [
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
    await batch(stmts);
    return { id: orderId };
  },

  getOrders: async (since?: string, category?: string) => {
    let query = 'SELECT * FROM orders';
    const params: any[] = [];
    if (since) { query += ' WHERE order_date >= ?'; params.push(since); }
    query += ' ORDER BY order_date DESC, created_at DESC';

    const orders = await execute(query, params);
    if (orders.length === 0) return [];

    const orderIds = orders.map((o: any) => o.id);
    const placeholders = orderIds.map(() => '?').join(',');
    let itemQuery = `SELECT * FROM order_items WHERE order_id IN (${placeholders})`;
    const itemParams = [...orderIds];
    if (category && category !== 'all') {
      itemQuery += ' AND category = ?';
      itemParams.push(category);
    }

    const items = await execute(itemQuery, itemParams);
    return orders.map((o: any) => ({
      ...o,
      items: items.filter((i: any) => i.order_id === o.id),
    })).filter((o: any) => o.items.length > 0);
  },

  // ─── Stock Reports ─────────────────────────────────────
  getStockReports: async () => {
    return execute('SELECT * FROM stock_reports WHERE resolved_at IS NULL ORDER BY reported_at DESC');
  },

  reportOutOfStock: async (data: any) => {
    const id = `report-${Date.now()}`;
    await execute(
      'INSERT INTO stock_reports (id, ingredient_id, name, emoji, category, subcategory, unit) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, data.ingredientId, data.name, data.emoji || '', data.category || '', data.subcategory || null, data.unit],
    );
    return { id };
  },

  resolveStockReport: async (id: string) => {
    await execute("UPDATE stock_reports SET resolved_at = datetime('now') WHERE id = ?", [id]);
    return { ok: true };
  },

  // ─── Stock Remaining ───────────────────────────────────
  getStockRemaining: async () => {
    const today = new Date().toISOString().split('T')[0];
    return execute('SELECT * FROM stock_remaining WHERE reported_at >= ? ORDER BY reported_at DESC', [today]);
  },

  reportRemaining: async (data: any) => {
    const id = `remaining-${Date.now()}`;
    const today = new Date().toISOString().split('T')[0];
    await execute('DELETE FROM stock_remaining WHERE ingredient_id = ? AND reported_at >= ?', [data.ingredientId, today]);
    await execute(
      'INSERT INTO stock_remaining (id, ingredient_id, name, emoji, category, subcategory, unit, remaining_quantity) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, data.ingredientId, data.name || '', data.emoji || '', data.category || '', data.subcategory || null, data.unit, data.quantity],
    );
    return { id };
  },

  // ─── Menu Dishes ───────────────────────────────────────
  getMenuDishes: async () => {
    return execute('SELECT * FROM menu_dishes ORDER BY sort_order');
  },

  createMenuDish: async (data: any) => {
    const id = data.id || `dish-${Date.now()}`;
    await execute('INSERT OR REPLACE INTO menu_dishes (id, name, category, sort_order) VALUES (?, ?, ?, ?)', [id, data.name, data.category, data.sortOrder ?? 0]);
    return { id };
  },

  updateMenuDish: async (id: string, name: string) => {
    await execute('UPDATE menu_dishes SET name = ? WHERE id = ?', [name, id]);
    return { ok: true };
  },

  deleteMenuDish: async (id: string) => {
    await execute('DELETE FROM menu_dishes WHERE id = ?', [id]);
    return { ok: true };
  },

  // ─── Daily Menus ───────────────────────────────────────
  getDailyMenu: async (date: string, branchId: string) => {
    const rows = await execute('SELECT * FROM daily_menus WHERE menu_date = ? AND branch_id = ?', [date, branchId]);
    if (rows.length === 0) return null;
    const row = rows[0] as any;
    return { ...row, dishes: JSON.parse(row.dishes || '[]') };
  },

  saveDailyMenu: async (date: string, branchId: string, dishes: any[]) => {
    await execute(
      `INSERT INTO daily_menus (menu_date, branch_id, dishes) VALUES (?, ?, ?)
        ON CONFLICT(menu_date, branch_id) DO UPDATE SET dishes = excluded.dishes, created_at = datetime('now')`,
      [date, branchId || 'pnt', JSON.stringify(dishes)],
    );
    return { ok: true };
  },

  // ─── Inventory ─────────────────────────────────────────
  getInventory: async (spaceId: string) => {
    return execute('SELECT * FROM inventory WHERE space_id = ? ORDER BY code', [spaceId]);
  },

  saveInventory: async (spaceId: string, rows: any[]) => {
    const stmts = rows.map((r: any) => ({
      sql: `INSERT INTO inventory (id, space_id, code, name, quantity, unit, note, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
        ON CONFLICT(id) DO UPDATE SET code=excluded.code, name=excluded.name, quantity=excluded.quantity, unit=excluded.unit, note=excluded.note, updated_at=datetime('now')`,
      args: [r.id, spaceId, r.code, r.name, r.quantity, r.unit, r.note || ''],
    }));
    await batch(stmts);
    return { ok: true };
  },

  deleteInventoryRow: async (id: string) => {
    await execute('DELETE FROM inventory WHERE id = ?', [id]);
    return { ok: true };
  },
};
