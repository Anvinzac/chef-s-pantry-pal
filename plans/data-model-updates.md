# Data Model Updates Plan

## 1. Current Data Model Analysis

### Current Ingredient Model (`src/types/ingredient.ts`)
```typescript
export interface Ingredient {
  id: string;
  name: string;
  emoji: string;
  unit: UnitOfMeasurement;
  category: string;
  subcategory?: string;
  referencePrice?: number;
  quickQuantities: number[];
  lastOrderedQuantity?: number;
  lastOrderDate?: string;
  orderFrequencyDays?: number;
  nextReminder?: string;
}
```

### Current Order Model
```typescript
export interface OrderItem {
  ingredientId: string;
  name: string;
  quantity: number;
  unit: UnitOfMeasurement;
  timestamp: string;
}
```

### Gaps vs Specification Requirements (Section 12)
**Required Entry Schema**:
```json
{
  "id": "string",
  "name": "string", 
  "quantity": "number",
  "unit": "string",
  "category": "string",
  "exception": "string",
  "metadata": {}
}
```

**Key Missing Elements**:
1. `exception` field
2. Standardized `metadata` structure
3. Template-based categorization
4. Inference rule support

## 2. Required Data Model Updates

### 2.1 Core Entry Schema Implementation

#### Enhanced Ingredient Model
```typescript
// src/types/entry.ts
export interface Entry {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category: string;
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
```

#### Enhanced Order Item Model
```typescript
export interface OrderItem extends Entry {
  ingredientId: string;
  timestamp: string;
  status: 'pending' | 'ordered' | 'delivered' | 'cancelled';
  instanceId?: string; // For parent-child architecture
}
```

### 2.2 JSON Template Library Schema (Section 3)

#### Template Schema
```typescript
// src/types/template.ts
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
```

### 2.3 Multi-Tenant Data Model (Section 9)

#### Instance Model
```typescript
// src/types/instance.ts
export interface AppInstance {
  id: string;
  name: string;
  templateId: string;
  ownerId: string;
  members: InstanceMember[];
  settings: InstanceSettings;
  createdAt: string;
  updatedAt: string;
}

export interface InstanceMember {
  userId: string;
  role: 'admin' | 'chef' | 'kitchen_staff' | 'viewer';
  permissions: string[];
  joinedAt: string;
}

export interface InstanceSettings {
  parentMode: boolean;
  editMode: boolean;
  defaultTemplate: string;
  errorCaptureEnabled: boolean;
}
```

### 2.4 Transformation API Data Models (Section 10)

#### Transformation Request/Response
```typescript
// src/types/transformation.ts
export interface TransformRequest {
  sourceTemplate: string;
  targetFormat: 'json' | 'csv' | 'xml';
  data: Record<string, any>;
  fieldMappings?: FieldMapping[];
}

export interface TransformResponse {
  success: boolean;
  transformedData: string;
  format: string;
  metadata: {
    sourceTemplate: string;
    targetFormat: string;
    transformationTime: number;
    fieldMappingsApplied: number;
  };
}

export interface FieldMapping {
  sourceField: string;
  targetField: string;
  transformFunction?: string; // e.g., 'toUpperCase', 'dateFormat', 'unitConversion'
}
```

## 3. Data Migration Strategy

### 3.1 Backward Compatibility Layer

#### Migration Function
```typescript
// src/lib/dataMigration.ts
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
```

#### Legacy Data Handler
```typescript
// Handle existing localStorage data
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
```

### 3.2 Storage Layer Updates

#### Enhanced Storage Interface
```typescript
// src/lib/storage.ts
export interface StorageInterface {
  // Template storage
  saveTemplate(template: Template): Promise<void>;
  getTemplate(templateId: string): Promise<Template | null>;
  listTemplates(): Promise<Template[]>;
  
  // Entry storage
  saveEntry(entry: Entry): Promise<void>;
  getEntry(entryId: string): Promise<Entry | null>;
  listEntries(instanceId?: string): Promise<Entry[]>;
  
  // Instance storage
  saveInstance(instance: AppInstance): Promise<void>;
  getInstance(instanceId: string): Promise<AppInstance | null>;
  listInstances(userId: string): Promise<AppInstance[]>;
  
  // Settings storage
  saveSettings(settings: InstanceSettings, instanceId: string): Promise<void>;
  getSettings(instanceId: string): Promise<InstanceSettings>;
}
```

#### LocalStorage Implementation
```typescript
// Enhanced localStorage implementation
class LocalStorageService implements StorageInterface {
  private readonly TEMPLATE_KEY = 'templates';
  private readonly ENTRY_KEY = 'entries';
  private readonly INSTANCE_KEY = 'instances';
  private readonly SETTINGS_KEY = 'settings';
  
  async saveTemplate(template: Template): Promise<void> {
    const templates = await this.listTemplates();
    const updated = templates.filter(t => t.templateId !== template.templateId);
    updated.push(template);
    localStorage.setItem(this.TEMPLATE_KEY, JSON.stringify(updated));
  }
  
  async getTemplate(templateId: string): Promise<Template | null> {
    const templates = await this.listTemplates();
    return templates.find(t => t.templateId === templateId) || null;
  }
  
  // ... other methods
}
```

## 4. Data Flow Implementation

### 4.1 Template Engine Data Flow

#### Template Loading Sequence
```
1. User selects template → Settings
2. Template Engine loads template from storage
3. Build reference dataset from template categories/items
4. Generate searchable index for prediction engine
5. Cache template for offline access
```

#### Template Engine Interface
```typescript
// src/lib/templateEngine.ts
export interface TemplateEngine {
  loadTemplate(templateId: string): Promise<Template>;
  buildReferenceDataset(template: Template): ReferenceDataset;
  generateSearchIndex(dataset: ReferenceDataset): SearchIndex;
  findMatches(input: string, index: SearchIndex): MatchResult[];
}

interface ReferenceDataset {
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

interface MatchResult {
  name: string;
  category: string;
  unit: string;
  confidence: number;
  matchType: 'exact' | 'fuzzy' | 'semantic';
}
```

### 4.2 Predictive Input Engine Data Flow

#### Prediction Sequence
```
1. User inputs name and quantity
2. Predictive Engine queries template reference dataset
3. Apply inference rules
4. Return inferred unit, category, metadata with confidence scores
5. Store as Entry with inferredData field
```

#### Prediction Engine Interface
```typescript
// src/lib/predictionEngine.ts
export interface PredictionEngine {
  predict(input: { name: string; quantity: number }, templateId: string): Promise<PredictionResult>;
  applyInferenceRules(input: string, rules: InferenceRule[]): InferenceResult[];
}

export interface PredictionResult {
  unit: string;
  category: string;
  metadata: Record<string, any>;
  confidence: number;
  source: 'template' | 'prediction' | 'inference_rule';
  alternatives: Array<{
    unit: string;
    category: string;
    confidence: number;
  }>;
}
```

## 5. Database Schema Considerations

### 5.1 Supabase Schema Updates

#### Templates Table
```sql
CREATE TABLE templates (
  id UUID PRIMARY KEY,
  template_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  scale TEXT NOT NULL CHECK (scale IN ('small', 'medium', 'enterprise')),
  version TEXT NOT NULL,
  data JSONB NOT NULL, -- Complete template JSON
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Entries Table
```sql
CREATE TABLE entries (
  id UUID PRIMARY KEY,
  entry_id TEXT UNIQUE NOT NULL,
  instance_id UUID REFERENCES instances(id),
  name TEXT NOT NULL,
  quantity NUMERIC NOT NULL,
  unit TEXT NOT NULL,
  category TEXT NOT NULL,
  exception TEXT,
  metadata JSONB,
  inferred_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_entries_instance ON entries(instance_id);
CREATE INDEX idx_entries_name ON entries USING gin(name gin_trgm_ops);
CREATE INDEX idx_entries_category ON entries(category);
```

#### Instances Table
```sql
CREATE TABLE instances (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  template_id UUID REFERENCES templates(id),
  owner_id UUID REFERENCES auth.users(id),
  settings JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 5.2 Row Level Security (RLS) Policies

#### Instance-based Data Isolation
```sql
-- Entries RLS
ALTER TABLE entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access entries in their instances" 
ON entries FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM instances 
    WHERE instances.id = entries.instance_id 
    AND (
      instances.owner_id = auth.uid() 
      OR EXISTS (
        SELECT 1 FROM instance_members 
        WHERE instance_members.instance_id = instances.id 
        AND instance_members.user_id = auth.uid()
      )
    )
  )
);
```

## 6. Implementation Priority

### Phase 1: Core Data Models (High Priority)
1. Implement `Entry` interface matching specification
2. Create template schema with versioning
3. Implement data migration from legacy format
4. Add exception field to all entry operations

### Phase 2: Template System (Medium Priority)
1. Implement template engine with offline support
2. Build reference dataset generation
3. Create searchable index system
4. Add inference rule support

### Phase 3: Multi-Tenant Architecture (High Priority)
1. Implement instance model
2. Add instance-based data isolation
3. Create RLS policies for Supabase
4. Implement instance management APIs

### Phase 4: Transformation API (Medium Priority)
1. Implement field mapping system
2. Add format conversion logic
3. Create transformation endpoints
4. Add audit logging for transformations

## 7. Validation and Testing Strategy

### Data Model Validation
- Validate all entries conform to specification schema
- Test template loading and validation
- Verify inference rule application
- Ensure backward compatibility with legacy data

### Performance Validation
- Test template loading < 100ms requirement
- Validate prediction engine < 50ms latency
- Verify storage operations meet performance requirements
- Test offline template availability

### Security Validation
- Verify data isolation between instances
- Test RLS policies prevent cross-instance access
- Validate audit logging captures all data changes
- Ensure template access controls work correctly