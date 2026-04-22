export interface Template {
  templateId: string;
  name: string;
  scale: 'small' | 'medium' | 'enterprise';
  version: string;
  createdAt: string;
  updatedAt: string;
  categories: TemplateCategory[];
  inferenceRules: InferenceRule[];
  metadata: Record<string, any>;
}

export interface TemplateCategory {
  id: string;
  name: string;
  items: TemplateItem[];
  metadata?: Record<string, any>;
}

export interface TemplateItem {
  id: string;
  name: string;
  defaultUnit: string;
  altUnits: string[];
  tags: string[];
  metadata?: Record<string, any>;
}

export interface InferenceRule {
  id: string;
  type: 'fuzzy' | 'semantic' | 'regex' | 'lookup';
  pattern: string;
  targetField: 'unit' | 'category' | 'metadata';
  replacement: string | Record<string, any>;
  confidence: number;
  metadata?: Record<string, any>;
}