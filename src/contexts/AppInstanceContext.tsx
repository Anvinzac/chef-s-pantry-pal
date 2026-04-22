import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppInstance, InstanceSettings } from '@/types/instance';
import { LocalStorageService } from '@/lib/storage';

interface AppInstanceContextType {
  currentInstance: AppInstance | null;
  setCurrentInstance: (instance: AppInstance | null) => void;
  instanceSettings: InstanceSettings;
  updateInstanceSettings: (settings: Partial<InstanceSettings>) => void;
  isLoading: boolean;
}

const AppInstanceContext = createContext<AppInstanceContextType>({
  currentInstance: null,
  setCurrentInstance: () => {},
  instanceSettings: {
    parentMode: false,
    editMode: false,
    defaultTemplate: 'default-pantry-template',
    errorCaptureEnabled: false,
  },
  updateInstanceSettings: () => {},
  isLoading: false,
});

export const AppInstanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentInstance, setCurrentInstance] = useState<AppInstance | null>(null);
  const [instanceSettings, setInstanceSettings] = useState<InstanceSettings>({
    parentMode: false,
    editMode: false,
    defaultTemplate: 'default-pantry-template',
    errorCaptureEnabled: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  
  const storage = new LocalStorageService();

  useEffect(() => {
    if (currentInstance) {
      loadInstanceSettings(currentInstance.id);
    }
  }, [currentInstance]);

  const loadInstanceSettings = async (instanceId: string) => {
    setIsLoading(true);
    try {
      const settings = await storage.getSettings(instanceId);
      setInstanceSettings(settings);
    } catch (error) {
      console.error('Failed to load instance settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateInstanceSettings = async (updates: Partial<InstanceSettings>) => {
    if (!currentInstance) return;
    
    const newSettings = { ...instanceSettings, ...updates };
    setInstanceSettings(newSettings);
    
    try {
      await storage.saveSettings(newSettings, currentInstance.id);
    } catch (error) {
      console.error('Failed to save instance settings:', error);
    }
  };

  return (
    <AppInstanceContext.Provider
      value={{
        currentInstance,
        setCurrentInstance,
        instanceSettings,
        updateInstanceSettings,
        isLoading,
      }}
    >
      {children}
    </AppInstanceContext.Provider>
  );
};

export const useAppInstance = () => {
  const context = useContext(AppInstanceContext);
  if (!context) {
    throw new Error('useAppInstance must be used within AppInstanceProvider');
  }
  return context;
};