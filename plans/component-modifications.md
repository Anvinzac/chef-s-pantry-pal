# Component Modification Plan

## 1. UI Component System Requirements

### Component Visibility System (Section 7)
Every UI component must:
- Have a unique `name` property
- Support optional `description` metadata
- Be hidden by default
- Be toggleable via floating button
- Support Edit Mode activation

### Edit Mode Features (Section 8)
- Show component names as overlays
- Display data bindings visually
- Enable debug overlays
- Controlled via Settings page

## 2. Current Component Analysis

### 2.1 UI Components (`src/components/ui/`)
**Current State**: Standard shadcn-ui components
**Required Changes**:
- Add `componentName` prop to all components
- Implement visibility control system
- Add Edit Mode overlay support

### 2.2 Chef Domain Components (`src/components/chef/`)
**Current State**: Business-specific components for pantry management
**Required Changes**:
- Standardize component naming
- Add metadata support
- Implement predictive input integration
- Add exception handling display

## 3. Component Modification Strategy

### 3.1 Core UI Components Enhancement

#### Base Component Wrapper
Create a `withComponentVisibility` HOC or custom hook:

```typescript
interface ComponentVisibilityProps {
  componentName: string;
  description?: string;
  children: React.ReactNode;
}

const withComponentVisibility = (Component: React.ComponentType<any>, name: string, description?: string) => {
  return (props: any) => {
    const { isVisible, isEditMode } = useComponentVisibility(name);
    
    if (!isVisible) return null;
    
    return (
      <div className={isEditMode ? 'relative' : ''}>
        {isEditMode && (
          <div className="absolute top-0 left-0 bg-yellow-400 text-black text-xs p-1 rounded">
            {name}
          </div>
        )}
        <Component {...props} componentName={name} componentDescription={description} />
      </div>
    );
  };
};
```

#### Enhanced Component Structure
All components should follow this pattern:

```typescript
interface EnhancedComponentProps {
  componentName?: string;
  componentDescription?: string;
  // ... existing props
}

const EnhancedComponent: React.FC<EnhancedComponentProps> = ({ 
  componentName, 
  componentDescription,
  ...props 
}) => {
  const { isVisible, isEditMode } = useComponentVisibility(componentName || 'Unknown');
  
  if (!isVisible) return null;
  
  return (
    <div className="relative">
      {isEditMode && componentName && (
        <ComponentDebugOverlay 
          name={componentName} 
          description={componentDescription}
          bindings={/* extract data bindings */}
        />
      )}
      {/* Original component implementation */}
    </div>
  );
};
```

### 3.2 Specific Component Modifications

#### IngredientCard Component (`src/components/chef/IngredientCard.tsx`)
**Current Issues**:
- No component naming
- No exception display
- No predictive data visualization

**Required Changes**:
1. Add `componentName="IngredientCard"` prop
2. Add exception display column (Section 6.2)
3. Display inferred data as chips (Section 6.3)
4. Implement auto-dismiss after 5 seconds inactivity (Section 6.3)

**Enhanced Structure**:
```typescript
// Add exception prop
interface IngredientCardProps {
  // ... existing props
  exception?: string;
  inferredData?: {
    unit?: string;
    category?: string;
    metadata?: Record<string, any>;
    confidence?: number;
  };
}

// Display chips for inferred data
{inferredData && (
  <div className="flex gap-1 mt-2">
    {inferredData.unit && (
      <Chip 
        label={`Unit: ${inferredData.unit}`} 
        confidence={inferredData.confidence}
        onEdit={() => /* handle edit */}
      />
    )}
    {inferredData.category && (
      <Chip 
        label={`Category: ${inferredData.category}`} 
        confidence={inferredData.confidence}
        onEdit={() => /* handle edit */}
      />
    )}
  </div>
)}
```

#### AddIngredientModal Component (`src/components/chef/AddIngredientModal.tsx`)
**Current Issues**:
- Manual input required for all fields
- No predictive suggestions
- No template-based defaults

**Required Changes**:
1. Add predictive input for ingredient name
2. Auto-suggest unit and category based on name
3. Display confidence scores for predictions
4. Add exception field input

**Enhanced Input Flow**:
```typescript
// Predictive input integration
const [predictedUnit, setPredictedUnit] = useState<string | null>(null);
const [predictedCategory, setPredictedCategory] = useState<string | null>(null);
const [confidence, setConfidence] = useState<number>(0);

useEffect(() => {
  if (name.trim()) {
    const predictions = predictIngredient(name.trim());
    setPredictedUnit(predictions.unit);
    setPredictedCategory(predictions.category);
    setConfidence(predictions.confidence);
  }
}, [name]);
```

#### OrderBar Component (`src/components/chef/OrderBar.tsx`)
**Current Issues**:
- No exception handling display
- No component visibility control

**Required Changes**:
1. Add component naming and visibility
2. Display order exceptions
3. Add Edit Mode debug overlays

### 3.3 New Components Required

#### Floating Visibility Toggle Button
```typescript
// src/components/core/VisibilityToggleButton.tsx
const VisibilityToggleButton = () => {
  const { toggleVisibility, visibleComponents } = useComponentVisibility();
  
  return (
    <button 
      className="fixed bottom-4 right-4 bg-primary text-primary-foreground rounded-full p-3 shadow-lg z-50"
      onClick={() => /* open visibility control panel */}
    >
      <EyeIcon />
    </button>
  );
};
```

#### Component Debug Overlay
```typescript
// src/components/core/ComponentDebugOverlay.tsx
interface ComponentDebugOverlayProps {
  name: string;
  description?: string;
  bindings?: Record<string, any>;
}

const ComponentDebugOverlay: React.FC<ComponentDebugOverlayProps> = ({ 
  name, 
  description, 
  bindings 
}) => {
  return (
    <div className="absolute top-0 left-0 bg-yellow-400 text-black text-xs p-2 rounded shadow-lg z-10">
      <div className="font-bold">{name}</div>
      {description && <div className="italic">{description}</div>}
      {bindings && (
        <div className="mt-1">
          <div className="font-semibold">Bindings:</div>
          {Object.entries(bindings).map(([key, value]) => (
            <div key={key} className="text-xs">
              {key}: {JSON.stringify(value)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
```

#### Settings Page Components
```typescript
// src/components/core/SettingsPage.tsx
const SettingsPage = () => {
  const { parentMode, setParentMode, editMode, setEditMode, selectedTemplate, setTemplate } = useSettings();
  
  return (
    <div className="p-4">
      <Toggle 
        label="Parent Mode" 
        checked={parentMode} 
        onCheckedChange={setParentMode}
      />
      <Toggle 
        label="Edit Mode" 
        checked={editMode} 
        onCheckedChange={setEditMode}
      />
      <Select 
        label="Template Selection"
        value={selectedTemplate}
        onValueChange={setTemplate}
      />
    </div>
  );
};
```

### 3.4 Component Visibility System Implementation

#### Visibility Context
```typescript
// src/contexts/ComponentVisibilityContext.tsx
interface ComponentVisibilityContextType {
  visibleComponents: Set<string>;
  isEditMode: boolean;
  toggleVisibility: (componentName: string) => void;
  setEditMode: (enabled: boolean) => void;
}

const ComponentVisibilityContext = createContext<ComponentVisibilityContextType>({
  visibleComponents: new Set(),
  isEditMode: false,
  toggleVisibility: () => {},
  setEditMode: () => {},
});

export const ComponentVisibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [visibleComponents, setVisibleComponents] = useState<Set<string>>(new Set());
  const [isEditMode, setIsEditMode] = useState(false);
  
  const toggleVisibility = useCallback((componentName: string) => {
    setVisibleComponents(prev => {
      const newSet = new Set(prev);
      if (newSet.has(componentName)) {
        newSet.delete(componentName);
      } else {
        newSet.add(componentName);
      }
      return newSet;
    });
  }, []);
  
  // By default, show all components
  useEffect(() => {
    // Get all component names from template or configuration
    const allComponents = getAllComponentNames();
    setVisibleComponents(new Set(allComponents));
  }, []);
  
  return (
    <ComponentVisibilityContext.Provider 
      value={{ 
        visibleComponents, 
        isEditMode, 
        toggleVisibility, 
        setEditMode: setIsEditMode 
      }}
    >
      {children}
    </ComponentVisibilityContext.Provider>
  );
};
```

#### Visibility Hook
```typescript
// src/hooks/useComponentVisibility.ts
export const useComponentVisibility = (componentName?: string) => {
  const context = useContext(ComponentVisibilityContext);
  
  if (!context) {
    throw new Error('useComponentVisibility must be used within ComponentVisibilityProvider');
  }
  
  const isVisible = componentName 
    ? context.visibleComponents.has(componentName) 
    : true;
  
  return {
    isVisible,
    isEditMode: context.isEditMode,
    toggleVisibility: context.toggleVisibility,
    setEditMode: context.setEditMode,
  };
};
```

## 4. Implementation Priority

### High Priority Components
1. **IngredientCard** - Core user interaction component
2. **AddIngredientModal** - Primary data input component
3. **Visibility System** - Foundation for all other components

### Medium Priority Components
1. **OrderBar** - Secondary interaction component
2. **CategoryBar/SubcategoryBar** - Navigation components
3. **Settings Page** - Configuration interface

### Low Priority Components
1. **MenuPlanner** - Advanced feature component
2. **History/StockReport** - Reporting components
3. **UI Library Components** - Base components (can be enhanced incrementally)

## 5. Integration with Existing Architecture

### App.tsx Integration
```typescript
// Enhanced App.tsx structure
const App = () => (
  <QueryClientProvider client={queryClient}>
    <ComponentVisibilityProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <AppRoutes />
            <VisibilityToggleButton />
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ComponentVisibilityProvider>
  </QueryClientProvider>
);
```

### Component Migration Strategy
1. **Phase 1**: Implement visibility system foundation
2. **Phase 2**: Migrate core components (IngredientCard, AddIngredientModal)
3. **Phase 3**: Migrate remaining components incrementally
4. **Phase 4**: Add Edit Mode debug overlays

## 6. Testing Strategy

### Component Visibility Testing
- Verify components are hidden when visibility is toggled off
- Verify Edit Mode overlays display correctly
- Test floating toggle button functionality

### Predictive Input Testing
- Verify unit/category predictions based on ingredient names
- Test confidence scoring accuracy
- Validate exception handling display

### Performance Testing
- Ensure component rendering doesn't impact <100ms UI response requirement
- Test auto-dismiss functionality after 5 seconds inactivity