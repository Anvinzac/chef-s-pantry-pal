import { useState, useCallback, useEffect } from 'react';
import { Ingredient, OrderItem, UnitOfMeasurement, UNIT_LABELS, UNIT_FULL_LABELS } from '@/types/ingredient';
import { defaultIngredients } from '@/data/defaultIngredients';

const STORAGE_KEY_INGREDIENTS = 'chef-ingredients';
const STORAGE_KEY_ORDERS = 'chef-current-order';
const STORAGE_KEY_HISTORY = 'chef-order-history';

function loadIngredients(): Ingredient[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_INGREDIENTS);
    if (stored) return JSON.parse(stored);
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

export function useOrder() {
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
  }, []);

  const deleteIngredient = useCallback((id: string) => {
    setIngredients(prev => prev.filter(ing => ing.id !== id));
    setCurrentOrder(prev => prev.filter(o => o.ingredientId !== id));
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

  const getIngredientsByCategory = useCallback((categoryId: string) => {
    return ingredients.filter(ing => ing.category === categoryId);
  }, [ingredients]);

  return {
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
    getOrderText,
    getIngredientsByCategory,
  };
}
