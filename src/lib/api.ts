import { execute, batch } from './turso';

function deserializeIngredient(row: any) {
  return {
    id: row.id,
    name: row.name,
    emoji: row.emoji,
    unit: row.unit,
    category: row.category,
    subcategory: row.subcategory || undefined,
    rarity: row.rarity || undefined,
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
      sql: `INSERT INTO inventory (id, space_id, code, name, quantity, unit, note, supplier, sub_type, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
        ON CONFLICT(id) DO UPDATE SET code=excluded.code, name=excluded.name, quantity=excluded.quantity, unit=excluded.unit, note=excluded.note, supplier=excluded.supplier, sub_type=excluded.sub_type, updated_at=datetime('now')`,
      args: [r.id, spaceId, r.code, r.name, r.quantity, r.unit, r.note || '', r.supplier || '', r.sub_type || ''],
    }));
    await batch(stmts);
    return { ok: true };
  },

  deleteInventoryRow: async (id: string) => {
    await execute('DELETE FROM inventory WHERE id = ?', [id]);
    return { ok: true };
  },

  seedInventory: async () => {
    const rows = await execute('SELECT COUNT(*) as cnt FROM inventory');
    if ((rows[0] as any).cnt > 0) return { ok: true, seeded: false };

    const data: { sql: string; args: any[] }[] = [
      // K1 - Tủ Đông
      { sql: "INSERT INTO inventory (id, space_id, code, name, quantity, unit, note, supplier, sub_type, updated_at) VALUES (?, 'K1', 'K1-001', 'Thịt bò Úc', 5, 'kg', 'Đủ', '', '', datetime('now'))", args: ['k1-1'] },
      { sql: "INSERT INTO inventory (id, space_id, code, name, quantity, unit, note, supplier, sub_type, updated_at) VALUES (?, 'K1', 'K1-002', 'Tôm sú', 3, 'kg', 'Sắp hết', '', '', datetime('now'))", args: ['k1-2'] },
      { sql: "INSERT INTO inventory (id, space_id, code, name, quantity, unit, note, supplier, sub_type, updated_at) VALUES (?, 'K1', 'K1-003', 'Cá hồi phi-lê', 2, 'kg', 'Hết', '', '', datetime('now'))", args: ['k1-3'] },
      { sql: "INSERT INTO inventory (id, space_id, code, name, quantity, unit, note, supplier, sub_type, updated_at) VALUES (?, 'K1', 'K1-004', 'Gà nguyên con', 4, 'kg', 'Mới nhập', '', '', datetime('now'))", args: ['k1-4'] },
      { sql: "INSERT INTO inventory (id, space_id, code, name, quantity, unit, note, supplier, sub_type, updated_at) VALUES (?, 'K1', 'K1-005', 'Bơ lạt Anchor', 10, 'gói', 'Đủ', '', '', datetime('now'))", args: ['k1-5'] },
      { sql: "INSERT INTO inventory (id, space_id, code, name, quantity, unit, note, supplier, sub_type, updated_at) VALUES (?, 'K1', 'K1-006', 'Mực ống', 2, 'kg', 'Sắp hết', '', '', datetime('now'))", args: ['k1-6'] },
      { sql: "INSERT INTO inventory (id, space_id, code, name, quantity, unit, note, supplier, sub_type, updated_at) VALUES (?, 'K1', 'K1-007', 'Sườn heo', 6, 'kg', 'Hết', '', '', datetime('now'))", args: ['k1-7'] },
      { sql: "INSERT INTO inventory (id, space_id, code, name, quantity, unit, note, supplier, sub_type, updated_at) VALUES (?, 'K1', 'K1-008', 'Bánh phở khô', 20, 'gói', 'Mới nhập', '', '', datetime('now'))", args: ['k1-8'] },
      // K2 - Tủ Mát
      { sql: "INSERT INTO inventory (id, space_id, code, name, quantity, unit, note, supplier, sub_type, updated_at) VALUES (?, 'K2', 'K2-001', 'Trứng gà', 30, 'quả', 'Đủ', '', '', datetime('now'))", args: ['k2-1'] },
      { sql: "INSERT INTO inventory (id, space_id, code, name, quantity, unit, note, supplier, sub_type, updated_at) VALUES (?, 'K2', 'K2-002', 'Sữa tươi', 10, 'hộp', 'Sắp hết', '', '', datetime('now'))", args: ['k2-2'] },
      { sql: "INSERT INTO inventory (id, space_id, code, name, quantity, unit, note, supplier, sub_type, updated_at) VALUES (?, 'K2', 'K2-003', 'Phô mai lát', 5, 'gói', 'Hết', '', '', datetime('now'))", args: ['k2-3'] },
      { sql: "INSERT INTO inventory (id, space_id, code, name, quantity, unit, note, supplier, sub_type, updated_at) VALUES (?, 'K2', 'K2-004', 'Sữa đặc Ông Thọ', 6, 'hộp', 'Mới nhập', '', '', datetime('now'))", args: ['k2-4'] },
      { sql: "INSERT INTO inventory (id, space_id, code, name, quantity, unit, note, supplier, sub_type, updated_at) VALUES (?, 'K2', 'K2-005', 'Bơ tươi', 4, 'gói', 'Đủ', '', '', datetime('now'))", args: ['k2-5'] },
      { sql: "INSERT INTO inventory (id, space_id, code, name, quantity, unit, note, supplier, sub_type, updated_at) VALUES (?, 'K2', 'K2-006', 'Yaourt Vinamilk', 24, 'hộp', 'Sắp hết', '', '', datetime('now'))", args: ['k2-6'] },
      { sql: "INSERT INTO inventory (id, space_id, code, name, quantity, unit, note, supplier, sub_type, updated_at) VALUES (?, 'K2', 'K2-007', 'Thịt nguội', 3, 'gói', 'Hết', '', '', datetime('now'))", args: ['k2-7'] },
      { sql: "INSERT INTO inventory (id, space_id, code, name, quantity, unit, note, supplier, sub_type, updated_at) VALUES (?, 'K2', 'K2-008', 'Nước cam ép', 5, 'lít', 'Mới nhập', '', '', datetime('now'))", args: ['k2-8'] },
      // K3 - Kệ Gia Vị
      { sql: "INSERT INTO inventory (id, space_id, code, name, quantity, unit, note, supplier, sub_type, updated_at) VALUES (?, 'K3', 'K3-001', 'Nước mắm Nam Ngư', 4, 'chai', 'Đủ', '', '', datetime('now'))", args: ['k3-1'] },
      { sql: "INSERT INTO inventory (id, space_id, code, name, quantity, unit, note, supplier, sub_type, updated_at) VALUES (?, 'K3', 'K3-002', 'Muối iốt', 2, 'gói', 'Sắp hết', '', '', datetime('now'))", args: ['k3-2'] },
      { sql: "INSERT INTO inventory (id, space_id, code, name, quantity, unit, note, supplier, sub_type, updated_at) VALUES (?, 'K3', 'K3-003', 'Đường trắng', 5, 'kg', 'Hết', '', '', datetime('now'))", args: ['k3-3'] },
      { sql: "INSERT INTO inventory (id, space_id, code, name, quantity, unit, note, supplier, sub_type, updated_at) VALUES (?, 'K3', 'K3-004', 'Hạt nêm Knorr', 3, 'gói', 'Mới nhập', '', '', datetime('now'))", args: ['k3-4'] },
      { sql: "INSERT INTO inventory (id, space_id, code, name, quantity, unit, note, supplier, sub_type, updated_at) VALUES (?, 'K3', 'K3-005', 'Tiêu xay', 1, 'hộp', 'Đủ', '', '', datetime('now'))", args: ['k3-5'] },
      { sql: "INSERT INTO inventory (id, space_id, code, name, quantity, unit, note, supplier, sub_type, updated_at) VALUES (?, 'K3', 'K3-006', 'Bột ngọt Ajinomoto', 2, 'gói', 'Sắp hết', '', '', datetime('now'))", args: ['k3-6'] },
      { sql: "INSERT INTO inventory (id, space_id, code, name, quantity, unit, note, supplier, sub_type, updated_at) VALUES (?, 'K3', 'K3-007', 'Tương ớt Chin-su', 3, 'chai', 'Hết', '', '', datetime('now'))", args: ['k3-7'] },
      { sql: "INSERT INTO inventory (id, space_id, code, name, quantity, unit, note, supplier, sub_type, updated_at) VALUES (?, 'K3', 'K3-008', 'Dầu hào', 2, 'chai', 'Mới nhập', '', '', datetime('now'))", args: ['k3-8'] },
      // K4 - Kệ Khô
      { sql: "INSERT INTO inventory (id, space_id, code, name, quantity, unit, note, supplier, sub_type, updated_at) VALUES (?, 'K4', 'K4-001', 'Gạo Jasmine', 25, 'kg', 'Đủ', '', '', datetime('now'))", args: ['k4-1'] },
      { sql: "INSERT INTO inventory (id, space_id, code, name, quantity, unit, note, supplier, sub_type, updated_at) VALUES (?, 'K4', 'K4-002', 'Miến dong', 3, 'gói', 'Sắp hết', '', '', datetime('now'))", args: ['k4-2'] },
      { sql: "INSERT INTO inventory (id, space_id, code, name, quantity, unit, note, supplier, sub_type, updated_at) VALUES (?, 'K4', 'K4-003', 'Mì gói Hảo Hảo', 40, 'gói', 'Hết', '', '', datetime('now'))", args: ['k4-3'] },
      { sql: "INSERT INTO inventory (id, space_id, code, name, quantity, unit, note, supplier, sub_type, updated_at) VALUES (?, 'K4', 'K4-004', 'Đậu xanh cà', 5, 'kg', 'Mới nhập', '', '', datetime('now'))", args: ['k4-4'] },
      { sql: "INSERT INTO inventory (id, space_id, code, name, quantity, unit, note, supplier, sub_type, updated_at) VALUES (?, 'K4', 'K4-005', 'Nấm hương khô', 1, 'gói', 'Đủ', '', '', datetime('now'))", args: ['k4-5'] },
      { sql: "INSERT INTO inventory (id, space_id, code, name, quantity, unit, note, supplier, sub_type, updated_at) VALUES (?, 'K4', 'K4-006', 'Mộc nhĩ', 1, 'gói', 'Sắp hết', '', '', datetime('now'))", args: ['k4-6'] },
      { sql: "INSERT INTO inventory (id, space_id, code, name, quantity, unit, note, supplier, sub_type, updated_at) VALUES (?, 'K4', 'K4-007', 'Bắp nếp khô', 3, 'kg', 'Hết', '', '', datetime('now'))", args: ['k4-7'] },
      { sql: "INSERT INTO inventory (id, space_id, code, name, quantity, unit, note, supplier, sub_type, updated_at) VALUES (?, 'K4', 'K4-008', 'Đậu phộng', 4, 'kg', 'Mới nhập', '', '', datetime('now'))", args: ['k4-8'] },
      // K5 - Bàn Bếp Chính
      { sql: "INSERT INTO inventory (id, space_id, code, name, quantity, unit, note, supplier, sub_type, updated_at) VALUES (?, 'K5', 'K5-001', 'Rau thơm', 2, 'mớ', 'Đủ', '', '', datetime('now'))", args: ['k5-1'] },
      { sql: "INSERT INTO inventory (id, space_id, code, name, quantity, unit, note, supplier, sub_type, updated_at) VALUES (?, 'K5', 'K5-002', 'Hành tím', 1, 'kg', 'Sắp hết', '', '', datetime('now'))", args: ['k5-2'] },
      { sql: "INSERT INTO inventory (id, space_id, code, name, quantity, unit, note, supplier, sub_type, updated_at) VALUES (?, 'K5', 'K5-003', 'Tỏi tươi', 0.5, 'kg', 'Hết', '', '', datetime('now'))", args: ['k5-3'] },
      { sql: "INSERT INTO inventory (id, space_id, code, name, quantity, unit, note, supplier, sub_type, updated_at) VALUES (?, 'K5', 'K5-004', 'Ớt hiểm', 0.3, 'kg', 'Mới nhập', '', '', datetime('now'))", args: ['k5-4'] },
      { sql: "INSERT INTO inventory (id, space_id, code, name, quantity, unit, note, supplier, sub_type, updated_at) VALUES (?, 'K5', 'K5-005', 'Sả cây', 1, 'bó', 'Đủ', '', '', datetime('now'))", args: ['k5-5'] },
      { sql: "INSERT INTO inventory (id, space_id, code, name, quantity, unit, note, supplier, sub_type, updated_at) VALUES (?, 'K5', 'K5-006', 'Gừng tươi', 0.5, 'kg', 'Sắp hết', '', '', datetime('now'))", args: ['k5-6'] },
      { sql: "INSERT INTO inventory (id, space_id, code, name, quantity, unit, note, supplier, sub_type, updated_at) VALUES (?, 'K5', 'K5-007', 'Ngò rí', 3, 'mớ', 'Hết', '', '', datetime('now'))", args: ['k5-7'] },
      { sql: "INSERT INTO inventory (id, space_id, code, name, quantity, unit, note, supplier, sub_type, updated_at) VALUES (?, 'K5', 'K5-008', 'Hành lá', 2, 'mớ', 'Mới nhập', '', '', datetime('now'))", args: ['k5-8'] },
      // K6 - Kệ Nước/Chai
      { sql: "INSERT INTO inventory (id, space_id, code, name, quantity, unit, note, supplier, sub_type, updated_at) VALUES (?, 'K6', 'K6-001', 'Dầu ăn Neptune', 5, 'lít', 'Đủ', '', '', datetime('now'))", args: ['k6-1'] },
      { sql: "INSERT INTO inventory (id, space_id, code, name, quantity, unit, note, supplier, sub_type, updated_at) VALUES (?, 'K6', 'K6-002', 'Nước tương', 3, 'chai', 'Sắp hết', '', '', datetime('now'))", args: ['k6-2'] },
      { sql: "INSERT INTO inventory (id, space_id, code, name, quantity, unit, note, supplier, sub_type, updated_at) VALUES (?, 'K6', 'K6-003', 'Giấm gạo', 2, 'lít', 'Hết', '', '', datetime('now'))", args: ['k6-3'] },
      { sql: "INSERT INTO inventory (id, space_id, code, name, quantity, unit, note, supplier, sub_type, updated_at) VALUES (?, 'K6', 'K6-004', 'Dầu mè', 1, 'chai', 'Mới nhập', '', '', datetime('now'))", args: ['k6-4'] },
      { sql: "INSERT INTO inventory (id, space_id, code, name, quantity, unit, note, supplier, sub_type, updated_at) VALUES (?, 'K6', 'K6-005', 'Nước cốt dừa', 6, 'lon', 'Đủ', '', '', datetime('now'))", args: ['k6-5'] },
      { sql: "INSERT INTO inventory (id, space_id, code, name, quantity, unit, note, supplier, sub_type, updated_at) VALUES (?, 'K6', 'K6-006', 'Sriracha', 2, 'chai', 'Sắp hết', '', '', datetime('now'))", args: ['k6-6'] },
      { sql: "INSERT INTO inventory (id, space_id, code, name, quantity, unit, note, supplier, sub_type, updated_at) VALUES (?, 'K6', 'K6-007', 'Nước lọc 5L', 10, 'bình', 'Hết', '', '', datetime('now'))", args: ['k6-7'] },
      { sql: "INSERT INTO inventory (id, space_id, code, name, quantity, unit, note, supplier, sub_type, updated_at) VALUES (?, 'K6', 'K6-008', 'Rượu nấu ăn', 1, 'chai', 'Mới nhập', '', '', datetime('now'))", args: ['k6-8'] },
      // K7 - Kho Dưới
      { sql: "INSERT INTO inventory (id, space_id, code, name, quantity, unit, note, supplier, sub_type, updated_at) VALUES (?, 'K7', 'K7-001', 'Bột gạo', 5, 'kg', 'Đủ', '', '', datetime('now'))", args: ['k7-1'] },
      { sql: "INSERT INTO inventory (id, space_id, code, name, quantity, unit, note, supplier, sub_type, updated_at) VALUES (?, 'K7', 'K7-002', 'Bột mì', 5, 'kg', 'Sắp hết', '', '', datetime('now'))", args: ['k7-2'] },
      { sql: "INSERT INTO inventory (id, space_id, code, name, quantity, unit, note, supplier, sub_type, updated_at) VALUES (?, 'K7', 'K7-003', 'Bột chiên giòn', 2, 'gói', 'Hết', '', '', datetime('now'))", args: ['k7-3'] },
      { sql: "INSERT INTO inventory (id, space_id, code, name, quantity, unit, note, supplier, sub_type, updated_at) VALUES (?, 'K7', 'K7-004', 'Bột bắp', 1, 'gói', 'Mới nhập', '', '', datetime('now'))", args: ['k7-4'] },
      { sql: "INSERT INTO inventory (id, space_id, code, name, quantity, unit, note, supplier, sub_type, updated_at) VALUES (?, 'K7', 'K7-005', 'Đường nâu', 3, 'kg', 'Đủ', '', '', datetime('now'))", args: ['k7-5'] },
      { sql: "INSERT INTO inventory (id, space_id, code, name, quantity, unit, note, supplier, sub_type, updated_at) VALUES (?, 'K7', 'K7-006', 'Bánh tráng', 5, 'gói', 'Sắp hết', '', '', datetime('now'))", args: ['k7-6'] },
      { sql: "INSERT INTO inventory (id, space_id, code, name, quantity, unit, note, supplier, sub_type, updated_at) VALUES (?, 'K7', 'K7-007', 'Hủ tiếu khô', 4, 'gói', 'Hết', '', '', datetime('now'))", args: ['k7-7'] },
      { sql: "INSERT INTO inventory (id, space_id, code, name, quantity, unit, note, supplier, sub_type, updated_at) VALUES (?, 'K7', 'K7-008', 'Bún khô', 3, 'gói', 'Mới nhập', '', '', datetime('now'))", args: ['k7-8'] },
      // K8 - Khu Rửa
      { sql: "INSERT INTO inventory (id, space_id, code, name, quantity, unit, note, supplier, sub_type, updated_at) VALUES (?, 'K8', 'K8-001', 'Nước rửa chén', 4, 'chai', 'Đủ', '', '', datetime('now'))", args: ['k8-1'] },
      { sql: "INSERT INTO inventory (id, space_id, code, name, quantity, unit, note, supplier, sub_type, updated_at) VALUES (?, 'K8', 'K8-002', 'Giấy lau bếp', 10, 'cuộn', 'Sắp hết', '', '', datetime('now'))", args: ['k8-2'] },
      { sql: "INSERT INTO inventory (id, space_id, code, name, quantity, unit, note, supplier, sub_type, updated_at) VALUES (?, 'K8', 'K8-003', 'Túi nylon lớn', 5, 'cuộn', 'Hết', '', '', datetime('now'))", args: ['k8-3'] },
      { sql: "INSERT INTO inventory (id, space_id, code, name, quantity, unit, note, supplier, sub_type, updated_at) VALUES (?, 'K8', 'K8-004', 'Màng bọc thực phẩm', 3, 'cuộn', 'Mới nhập', '', '', datetime('now'))", args: ['k8-4'] },
      { sql: "INSERT INTO inventory (id, space_id, code, name, quantity, unit, note, supplier, sub_type, updated_at) VALUES (?, 'K8', 'K8-005', 'Nước tẩy Javel', 2, 'can', 'Đủ', '', '', datetime('now'))", args: ['k8-5'] },
      { sql: "INSERT INTO inventory (id, space_id, code, name, quantity, unit, note, supplier, sub_type, updated_at) VALUES (?, 'K8', 'K8-006', 'Miếng bọt biển', 10, 'cái', 'Sắp hết', '', '', datetime('now'))", args: ['k8-6'] },
      { sql: "INSERT INTO inventory (id, space_id, code, name, quantity, unit, note, supplier, sub_type, updated_at) VALUES (?, 'K8', 'K8-007', 'Găng tay cao su', 6, 'đôi', 'Hết', '', '', datetime('now'))", args: ['k8-7'] },
      { sql: "INSERT INTO inventory (id, space_id, code, name, quantity, unit, note, supplier, sub_type, updated_at) VALUES (?, 'K8', 'K8-008', 'Khăn lau', 20, 'cái', 'Mới nhập', '', '', datetime('now'))", args: ['k8-8'] },
      // K9 - Khu Gas/Bếp
      { sql: "INSERT INTO inventory (id, space_id, code, name, quantity, unit, note, supplier, sub_type, updated_at) VALUES (?, 'K9', 'K9-001', 'Chảo inox 30cm', 3, 'cái', 'Đủ', '', '', datetime('now'))", args: ['k9-1'] },
      { sql: "INSERT INTO inventory (id, space_id, code, name, quantity, unit, note, supplier, sub_type, updated_at) VALUES (?, 'K9', 'K9-002', 'Nồi inox 20L', 2, 'cái', 'Sắp hết', '', '', datetime('now'))", args: ['k9-2'] },
      { sql: "INSERT INTO inventory (id, space_id, code, name, quantity, unit, note, supplier, sub_type, updated_at) VALUES (?, 'K9', 'K9-003', 'Muôi inox', 5, 'cái', 'Hết', '', '', datetime('now'))", args: ['k9-3'] },
      { sql: "INSERT INTO inventory (id, space_id, code, name, quantity, unit, note, supplier, sub_type, updated_at) VALUES (?, 'K9', 'K9-004', 'Dao bếp', 4, 'cái', 'Mới nhập', '', '', datetime('now'))", args: ['k9-4'] },
      { sql: "INSERT INTO inventory (id, space_id, code, name, quantity, unit, note, supplier, sub_type, updated_at) VALUES (?, 'K9', 'K9-005', 'Thớt nhựa', 3, 'cái', 'Đủ', '', '', datetime('now'))", args: ['k9-5'] },
      { sql: "INSERT INTO inventory (id, space_id, code, name, quantity, unit, note, supplier, sub_type, updated_at) VALUES (?, 'K9', 'K9-006', 'Vỉ nướng inox', 2, 'cái', 'Sắp hết', '', '', datetime('now'))", args: ['k9-6'] },
      { sql: "INSERT INTO inventory (id, space_id, code, name, quantity, unit, note, supplier, sub_type, updated_at) VALUES (?, 'K9', 'K9-007', 'Rây lọc', 4, 'cái', 'Hết', '', '', datetime('now'))", args: ['k9-7'] },
      { sql: "INSERT INTO inventory (id, space_id, code, name, quantity, unit, note, supplier, sub_type, updated_at) VALUES (?, 'K9', 'K9-008', 'Clamp bếp', 2, 'cái', 'Mới nhập', '', '', datetime('now'))", args: ['k9-8'] },
    ];
    await batch(data);
    return { ok: true, seeded: true };
  },
};
