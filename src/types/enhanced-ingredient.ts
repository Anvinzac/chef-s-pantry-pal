import { Ingredient } from '@/types/ingredient';
import { Entry } from '@/types/entry';

// Enhanced ingredient type that combines current model with new specification
export interface EnhancedIngredient extends Ingredient {
  // New fields from specification
  exception?: string;
  metadata: Record<string, any>;
  templateId?: string;
  inferredData?: {
    unit?: string;
    category?: string;
    confidence?: number;
    source?: 'template' | 'prediction' | 'user';
  };
  createdAt: string;
  updatedAt: string;
}

// Function to convert legacy Ingredient to EnhancedIngredient
export function enhanceIngredient(ingredient: Ingredient): EnhancedIngredient {
  return {
    ...ingredient,
    exception: undefined,
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
    templateId: 'default-pantry-template',
    inferredData: undefined,
    createdAt: ingredient.lastOrderDate || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

// Function to convert EnhancedIngredient to Entry (for transformation API)
export function ingredientToEntry(ingredient: EnhancedIngredient, quantity: number = 0): Entry {
  return {
    id: ingredient.id,
    name: ingredient.name,
    quantity,
    unit: ingredient.unit,
    category: ingredient.category,
    exception: ingredient.exception,
    metadata: ingredient.metadata,
    templateId: ingredient.templateId,
    inferredData: ingredient.inferredData,
    createdAt: ingredient.createdAt,
    updatedAt: ingredient.updatedAt,
  };
}