import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

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
  
  // By default, show all components (empty set means all visible)
  useEffect(() => {
    setVisibleComponents(new Set());
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

export const useComponentVisibility = (componentName?: string) => {
  const context = useContext(ComponentVisibilityContext);
  
  if (!context) {
    throw new Error('useComponentVisibility must be used within ComponentVisibilityProvider');
  }
  
  // If visibleComponents is empty, show all components by default
  const isVisible = componentName 
    ? context.visibleComponents.has(componentName) || context.visibleComponents.size === 0
    : true;
  
  return {
    isVisible,
    isEditMode: context.isEditMode,
    toggleVisibility: context.toggleVisibility,
    setEditMode: context.setEditMode,
  };
};