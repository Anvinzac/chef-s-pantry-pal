export interface DayWeightEntry {
  date: string;
  categoryId: string;
  weight: number;
}

export interface CategorySetting {
  categoryId: string;
  deliveryOffset: number;
}

export interface Dismissal {
  ingredientId: string;
  dismissedOn: string;
}

export interface Recommendation {
  ingredient: import('./ingredient').Ingredient;
  lastPurchaseDate: string;
  orderFrequencyDays: number;
  remainingCycle: number;
  referencePrice?: number;
}

export interface RecommendationGroup {
  categoryId: string;
  categoryName: string;
  categoryEmoji: string;
  categoryColor: string;
  items: Recommendation[];
}
