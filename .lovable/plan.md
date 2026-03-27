

## Multi-Restaurant Tenancy

### The Short Answer
**No redesign needed.** The app already supports branch switching. We add a `restaurants` table, link users and branches to restaurants, and scope all data by `restaurant_id`. Each user sees only their restaurant's data automatically after login.

### Architecture

```text
restaurants
  ├── La Vegetarian (quanchay)
  │     ├── branches: Phạm Ngọc Thạch, Chi nhánh 2
  │     ├── users: truong@quanchay.la, phi@quanchay.la
  │     └── orders, menus, stock → all scoped
  └── ViNha (vinha)
        ├── branches: (default branch)
        ├── users: vu@vinha.bep, dan@vinha.bep
        └── orders, menus, stock → all scoped
```

**Note:** We use ONE database with tenant isolation via `restaurant_id` columns and RLS policies. Lovable Cloud doesn't support multiple separate databases, but row-level security achieves the same isolation.

### Database Changes

1. **New `restaurants` table** — `id`, `name`, `slug`
2. **Add `restaurant_id`** column to: `branches`, `orders`, `order_items`, `stock_reports`, `stock_remaining`, `daily_menus`, `menu_dishes`
3. **Add `restaurant_id`** to `user_roles` (links each user to their restaurant)
4. **Create a `get_user_restaurant()` security definer function** — returns the restaurant_id for the current user
5. **Update RLS policies** on all tables to filter by `restaurant_id = get_user_restaurant()`
6. **Seed data**: Create 2 restaurants, reassign existing branches to La Vegetarian, create a default branch for ViNha, seed menu_dishes for both

### Accounts

| Email | Password | Restaurant | Role |
|---|---|---|---|
| truong@quanchay.la | chef123456 | La Vegetarian | chef |
| phi@quanchay.la | chef123456 | La Vegetarian | kitchen_member |
| vu@vinha.bep | 59030PVT | ViNha | chef |
| dan@vinha.bep | 59030PVT | ViNha | kitchen_member |

Accounts will be created via the `seed-accounts` edge function (updated with the new accounts).

### App Code Changes

1. **`useAuth.tsx`** — fetch and expose `restaurantId` from `user_roles`
2. **All data hooks** (`useOrder`, `useMenuDishes`, `useStockReports`, `useStockRemaining`, `useMenuPlanner`, `useOrderHistory`) — include `restaurant_id` filter in queries and inserts
3. **`Index.tsx`** — show restaurant name in header
4. **Demo mode** — default to La Vegetarian data for guests
5. **Login page** — no changes needed (restaurant is determined by user account)

### What Stays the Same
- All existing screens and UI components
- Swipe navigation
- Branch switching within a restaurant
- Order flow, menu planner, stock reporting
- Demo mode (shows one restaurant's sample data)

