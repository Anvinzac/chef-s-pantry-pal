import { Ingredient } from '@/types/ingredient';
import { Entry } from '@/types/entry';

export function migrateIngredientToEntry(ingredient: Ingredient, quantity: number = 0): Entry {
  return {
    id: ingredient.id,
    name: ingredient.name,
    quantity,
    unit: ingredient.unit,
    category: ingredient.category,
    exception: undefined, // New field
    metadata: {
      emoji: ingredient.emoji,
      referencePrice: ingredient.referencePrice,
      quickQuantities: ingredient.quickQuantities,
      lastOrderedQuantity: ingredient.lastOrderedQuantity,
      lastOrderDate: ingredient.lastOrderDate,
      orderFrequencyDays: ingredient.orderFrequencyDays,
      nextReminder: ingredient.nextReminder,
      subcategory: ingredient.subcategory,
    },
    templateId: 'default-pantry-template', // Default template
    inferredData: undefined,
    createdAt: ingredient.lastOrderDate || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function loadLegacyData(): Entry[] {
  try {
    const legacyIngredients = loadIngredients(); // Existing function
    const legacyOrders = loadCurrentOrder(); // Existing function
    
    // Merge legacy data into new Entry format
    return legacyOrders.map(order => {
      const ingredient = legacyIngredients.find(ing => ing.id === order.ingredientId);
      if (ingredient) {
        return migrateIngredientToEntry(ingredient, order.quantity);
      }
      return migrateIngredientToEntry({
        id: order.ingredientId,
        name: order.name,
        emoji: '📦',
        unit: order.unit,
        category: 'uncategorized',
        quickQuantities: [1, 2],
      }, order.quantity);
    });
  } catch (error) {
    console.warn('Failed to load legacy data:', error);
    return [];
  }
}

// Placeholder functions that would be imported from existing hooks
function loadIngredients(): Ingredient[] {
  // This would be imported from src/hooks/useOrder.ts
  return [];
}

function loadCurrentOrder(): any[] {
  // This would be imported from src/hooks/useOrder.ts  
  return [];
}