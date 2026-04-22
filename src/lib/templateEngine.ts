import { Template } from '@/types/template';
import { Entry } from '@/types/entry';

export interface ReferenceDataset {
  items: Array<{
    name: string;
    category: string;
    unit: string;
    altUnits: string[];
    tags: string[];
  }>;
  categories: string[];
  units: string[];
}

export interface SearchIndex {
  // Simple in-memory index structure
  nameToItem: Map<string, any>;
  categoryToItems: Map<string, any[]>;
  unitToItems: Map<string, any[]>;
}

export interface MatchResult {
  name: string;
  category: string;
  unit: string;
  confidence: number;
  matchType: 'exact' | 'fuzzy' | 'semantic';
}

export interface TemplateEngine {
  loadTemplate(templateId: string): Promise<Template>;
  buildReferenceDataset(template: Template): ReferenceDataset;
  generateSearchIndex(dataset: ReferenceDataset): SearchIndex;
  findMatches(input: string, index: SearchIndex): MatchResult[];
}

// Simple implementation for Phase 1
export class SimpleTemplateEngine implements TemplateEngine {
  async loadTemplate(templateId: string): Promise<Template> {
    // In Phase 1, this would load from localStorage or a default template
    // For now, return a placeholder
    return {
      templateId,
      name: 'Default Pantry Template',
      scale: 'small',
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      categories: [],
      inferenceRules: [],
      metadata: {},
    };
  }

  buildReferenceDataset(template: Template): ReferenceDataset {
    const items: ReferenceDataset['items'] = [];
    const categories = new Set<string>();
    const units = new Set<string>();

    template.categories.forEach(category => {
      categories.add(category.name);
      category.items.forEach(item => {
        items.push({
          name: item.name,
          category: category.name,
          unit: item.defaultUnit,
          altUnits: item.altUnits,
          tags: item.tags,
        });
        units.add(item.defaultUnit);
        item.altUnits.forEach(unit => units.add(unit));
      });
    });

    return {
      items,
      categories: Array.from(categories),
      units: Array.from(units),
    };
  }

  generateSearchIndex(dataset: ReferenceDataset): SearchIndex {
    const nameToItem = new Map<string, any>();
    const categoryToItems = new Map<string, any[]>();
    const unitToItems = new Map<string, any[]>();

    dataset.items.forEach(item => {
      // Normalize name for matching
      const normalized = item.name.toLowerCase().trim();
      nameToItem.set(normalized, item);
      
      if (!categoryToItems.has(item.category)) {
        categoryToItems.set(item.category, []);
      }
      categoryToItems.get(item.category)!.push(item);
      
      if (!unitToItems.has(item.unit)) {
        unitToItems.set(item.unit, []);
      }
      unitToItems.get(item.unit)!.push(item);
      
      // Add alt units
      item.altUnits.forEach(unit => {
        if (!unitToItems.has(unit)) {
          unitToItems.set(unit, []);
        }
        unitToItems.get(unit)!.push(item);
      });
    });

    return {
      nameToItem,
      categoryToItems,
      unitToItems,
    };
  }

  findMatches(input: string, index: SearchIndex): MatchResult[] {
    const normalizedInput = input.toLowerCase().trim();
    const matches: MatchResult[] = [];

    // Exact match
    if (index.nameToItem.has(normalizedInput)) {
      const item = index.nameToItem.get(normalizedInput);
      matches.push({
        name: item.name,
        category: item.category,
        unit: item.unit,
        confidence: 1.0,
        matchType: 'exact',
      });
    }

    // Fuzzy match - simple substring matching for Phase 1
    if (matches.length === 0) {
      index.nameToItem.forEach((item, name) => {
        if (name.includes(normalizedInput) || normalizedInput.includes(name)) {
          matches.push({
            name: item.name,
            category: item.category,
            unit: item.unit,
            confidence: 0.8,
            matchType: 'fuzzy',
          });
        }
      });
    }

    return matches;
  }
}