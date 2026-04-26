const BASE = import.meta.env.VITE_API_URL || '';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);
  return res.json();
}

export const api = {
  // Users
  login: (name: string, role = 'chef') =>
    request<{ id: string; name: string; role: string }>('/api/users/login', {
      method: 'POST', body: JSON.stringify({ name, role }),
    }),

  // Ingredients
  getIngredients: () => request<any[]>('/api/ingredients'),
  saveIngredients: (ingredients: any[]) =>
    request('/api/ingredients', { method: 'PUT', body: JSON.stringify(ingredients) }),
  updateIngredient: (id: string, updates: any) =>
    request(`/api/ingredients/${id}`, { method: 'PATCH', body: JSON.stringify(updates) }),
  deleteIngredient: (id: string) =>
    request(`/api/ingredients/${id}`, { method: 'DELETE' }),

  // Orders
  saveOrder: (totalCostK: number, items: any[]) =>
    request<{ id: string }>('/api/orders', {
      method: 'POST', body: JSON.stringify({ totalCostK, items }),
    }),
  getOrders: (since?: string, category?: string) => {
    const params = new URLSearchParams();
    if (since) params.set('since', since);
    if (category) params.set('category', category);
    const qs = params.toString();
    return request<any[]>(`/api/orders${qs ? `?${qs}` : ''}`);
  },

  // Stock Reports
  getStockReports: () => request<any[]>('/api/stock-reports'),
  reportOutOfStock: (data: any) =>
    request('/api/stock-reports', { method: 'POST', body: JSON.stringify(data) }),
  resolveStockReport: (id: string) =>
    request(`/api/stock-reports/${id}/resolve`, { method: 'PATCH' }),

  // Stock Remaining
  getStockRemaining: () => request<any[]>('/api/stock-remaining'),
  reportRemaining: (data: any) =>
    request('/api/stock-remaining', { method: 'POST', body: JSON.stringify(data) }),

  // Menu Dishes
  getMenuDishes: () => request<any[]>('/api/menu-dishes'),
  createMenuDish: (data: any) =>
    request('/api/menu-dishes', { method: 'POST', body: JSON.stringify(data) }),
  updateMenuDish: (id: string, name: string) =>
    request(`/api/menu-dishes/${id}`, { method: 'PATCH', body: JSON.stringify({ name }) }),
  deleteMenuDish: (id: string) =>
    request(`/api/menu-dishes/${id}`, { method: 'DELETE' }),

  // Daily Menus
  getDailyMenu: (date: string, branchId: string) =>
    request<any>(`/api/daily-menus/${date}/${branchId}`),
  saveDailyMenu: (date: string, branchId: string, dishes: any[]) =>
    request('/api/daily-menus', { method: 'PUT', body: JSON.stringify({ date, branchId, dishes }) }),

  // Inventory
  getInventory: (spaceId: string) => request<any[]>(`/api/inventory/${spaceId}`),
  saveInventory: (spaceId: string, rows: any[]) =>
    request(`/api/inventory/${spaceId}`, { method: 'PUT', body: JSON.stringify(rows) }),
  deleteInventoryRow: (id: string) =>
    request(`/api/inventory/${id}`, { method: 'DELETE' }),
};
