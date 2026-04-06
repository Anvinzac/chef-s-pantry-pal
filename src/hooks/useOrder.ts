import { createContext, createElement, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Ingredient, OrderItem, UnitOfMeasurement, UNIT_LABELS, UNIT_FULL_LABELS } from '@/types/ingredient';
import { defaultIngredients } from '@/data/defaultIngredients';

const STORAGE_KEY_INGREDIENTS = 'chef-ingredients';
const STORAGE_KEY_ORDERS = 'chef-current-order';
const STORAGE_KEY_HISTORY = 'chef-order-history';
const DATA_VERSION_KEY = 'chef-data-version';
const CURRENT_DATA_VERSION = 4;

function loadIngredients(): Ingredient[] {
  try {
    const version = localStorage.getItem(DATA_VERSION_KEY);
    if (version && parseInt(version) === CURRENT_DATA_VERSION) {
      const stored = localStorage.getItem(STORAGE_KEY_INGREDIENTS);
      if (stored) return JSON.parse(stored);
    } else {
      localStorage.removeItem(STORAGE_KEY_INGREDIENTS);
      localStorage.removeItem(STORAGE_KEY_ORDERS);
      localStorage.removeItem(STORAGE_KEY_HISTORY);
      localStorage.setItem(DATA_VERSION_KEY, String(CURRENT_DATA_VERSION));
    }
  } catch {}
  return defaultIngredients;
}

function loadCurrentOrder(): OrderItem[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_ORDERS);
    if (stored) return JSON.parse(stored);
  } catch {}
  return [];
}

function syncCurrentOrderWithIngredients(order: OrderItem[], ingredients: Ingredient[]) {
  return order
    .map((item) => {
      const ingredient = ingredients.find((entry) => entry.id === item.ingredientId);
      if (!ingredient) return null;
      return {
        ...item,
        name: ingredient.name,
        unit: ingredient.unit,
      };
    })
    .filter((item): item is OrderItem => item !== null);
}

interface UseOrderValue {
  ingredients: Ingredient[];
  currentOrder: OrderItem[];
  expandedOrder: boolean;
  setExpandedOrder: React.Dispatch<React.SetStateAction<boolean>>;
  addToOrder: (ingredient: Ingredient, quantity: number) => void;
  removeFromOrder: (ingredientId: string) => void;
  clearOrder: () => void;
  addIngredient: (ingredient: Omit<Ingredient, 'id'>) => void;
  updateIngredient: (id: string, updates: Partial<Ingredient>) => void;
  deleteIngredient: (id: string) => void;
  replaceIngredients: (nextIngredients: Ingredient[]) => void;
  resetIngredients: () => void;
  getOrderText: (onlyNew?: boolean) => string;
  getIngredientsByCategory: (categoryId: string, subcategoryId?: string | null) => Ingredient[];
}

const OrderContext = createContext<UseOrderValue | undefined>(undefined);

export function OrderProvider({ children }: { children: ReactNode }) {
  const [ingredients, setIngredients] = useState<Ingredient[]>(loadIngredients);
  const [currentOrder, setCurrentOrder] = useState<OrderItem[]>(loadCurrentOrder);
  const [expandedOrder, setExpandedOrder] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_INGREDIENTS, JSON.stringify(ingredients));
  }, [ingredients]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(currentOrder));
  }, [currentOrder]);

  const addToOrder = useCallback((ingredient: Ingredient, quantity: number) => {
    setCurrentOrder(prev => {
      const existing = prev.findIndex(o => o.ingredientId === ingredient.id);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = { ...updated[existing], quantity, timestamp: new Date().toISOString() };
        return updated;
      }
      return [...prev, {
        ingredientId: ingredient.id,
        name: ingredient.name,
        quantity,
        unit: ingredient.unit,
        timestamp: new Date().toISOString(),
      }];
    });

    // Update last ordered quantity on ingredient
    setIngredients(prev => prev.map(ing =>
      ing.id === ingredient.id
        ? { ...ing, lastOrderedQuantity: quantity, lastOrderDate: new Date().toISOString() }
        : ing
    ));
  }, []);

  const removeFromOrder = useCallback((ingredientId: string) => {
    setCurrentOrder(prev => prev.filter(o => o.ingredientId !== ingredientId));
  }, []);

  const clearOrder = useCallback(() => {
    setCurrentOrder([]);
  }, []);

  const addIngredient = useCallback((ingredient: Omit<Ingredient, 'id'>) => {
    const id = `custom-${Date.now()}`;
    setIngredients(prev => [...prev, { ...ingredient, id }]);
  }, []);

  const updateIngredient = useCallback((id: string, updates: Partial<Ingredient>) => {
    setIngredients(prev => prev.map(ing => ing.id === id ? { ...ing, ...updates } : ing));
    setCurrentOrder(prev => prev.map(item => {
      if (item.ingredientId !== id) return item;
      return {
        ...item,
        name: typeof updates.name === 'string' ? updates.name : item.name,
        unit: (updates.unit as UnitOfMeasurement | undefined) ?? item.unit,
      };
    }));
  }, []);

  const deleteIngredient = useCallback((id: string) => {
    setIngredients(prev => prev.filter(ing => ing.id !== id));
    setCurrentOrder(prev => prev.filter(o => o.ingredientId !== id));
  }, []);

  const replaceIngredients = useCallback((nextIngredients: Ingredient[]) => {
    setIngredients(nextIngredients);
    setCurrentOrder(prev => syncCurrentOrderWithIngredients(prev, nextIngredients));
  }, []);

  const resetIngredients = useCallback(() => {
    setIngredients(defaultIngredients);
    setCurrentOrder(prev => syncCurrentOrderWithIngredients(prev, defaultIngredients));
  }, []);

  const getOrderText = useCallback((onlyNew = true) => {
    const items = onlyNew
      ? currentOrder.filter(o => {
          const ts = new Date(o.timestamp).getTime();
          const fiveMinAgo = Date.now() - 5 * 60 * 1000;
          return ts > fiveMinAgo;
        })
      : currentOrder;

    return items.map(item => {
      const unitLabel = UNIT_FULL_LABELS[item.unit] || item.unit;
      if (item.unit === 'piece' || item.unit === 'dozen' || item.unit === 'pair') {
        return `${item.quantity} ${unitLabel}${item.quantity > 1 ? 's' : ''} of ${item.name}`;
      }
      return `${item.quantity}${UNIT_LABELS[item.unit]} ${item.name}`;
    }).join('\n');
  }, [currentOrder]);

  const getIngredientsByCategory = useCallback((categoryId: string, subcategoryId?: string | null) => {
    return ingredients.filter(ing => {
      if (ing.category !== categoryId) return false;
      if (subcategoryId) return ing.subcategory === subcategoryId;
      return true;
    });
  }, [ingredients]);

  const value = useMemo(() => ({
    ingredients,
    currentOrder,
    expandedOrder,
    setExpandedOrder,
    addToOrder,
    removeFromOrder,
    clearOrder,
    addIngredient,
    updateIngredient,
    deleteIngredient,
    replaceIngredients,
    resetIngredients,
    getOrderText,
    getIngredientsByCategory,
  }), [
    ingredients,
    currentOrder,
    expandedOrder,
    setExpandedOrder,
    addToOrder,
    removeFromOrder,
    clearOrder,
    addIngredient,
    updateIngredient,
    deleteIngredient,
    replaceIngredients,
    resetIngredients,
    getOrderText,
    getIngredientsByCategory,
  ]);

  return createElement(OrderContext.Provider, { value }, children);
}

export function useOrder() {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrder must be used within OrderProvider');
  }
  return context;
}
