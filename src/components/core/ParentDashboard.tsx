import React, { useState, useEffect } from 'react';
import { AppInstance } from '@/types/instance';
import { LocalStorageService } from '@/lib/storage';

interface ParentDashboardProps {
  onInstanceSelect: (instance: AppInstance) => void;
}

const ParentDashboard: React.FC<ParentDashboardProps> = ({ onInstanceSelect }) => {
  const [instances, setInstances] = useState<AppInstance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newInstanceName, setNewInstanceName] = useState('');
  
  const storage = new LocalStorageService();

  useEffect(() => {
    loadInstances();
  }, []);

  const loadInstances = async () => {
    setIsLoading(true);
    try {
      const allInstances = await storage.listInstances('');
      setInstances(allInstances);
    } catch (error) {
      console.error('Failed to load instances:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createInstance = async () => {
    if (!newInstanceName.trim()) return;
    
    const newInstance: AppInstance = {
      id: `instance-${Date.now()}`,
      name: newInstanceName.trim(),
      templateId: 'default-pantry-template',
      ownerId: 'current-user', // This would come from auth context
      members: [],
      settings: {
        parentMode: false,
        editMode: false,
        defaultTemplate: 'default-pantry-template',
        errorCaptureEnabled: false,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    try {
      await storage.saveInstance(newInstance);
      setInstances(prev => [...prev, newInstance]);
      setNewInstanceName('');
    } catch (error) {
      console.error('Failed to create instance:', error);
    }
  };

  const deleteInstance = async (instanceId: string) => {
    if (!window.confirm('Are you sure you want to delete this instance? This action cannot be undone.')) {
      return;
    }
    
    try {
      // In a real implementation, this would delete all associated data
      setInstances(prev => prev.filter(instance => instance.id !== instanceId));
    } catch (error) {
      console.error('Failed to delete instance:', error);
    }
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Parent Dashboard</h1>
      
      {/* Create New Instance */}
      <div className="mb-8 p-4 bg-muted rounded-lg">
        <h2 className="text-lg font-semibold mb-3">Create New Instance</h2>
        <div className="flex gap-2">
          <input
            type="text"
            value={newInstanceName}
            onChange={(e) => setNewInstanceName(e.target.value)}
            placeholder="Enter instance name"
            className="flex-1 p-2 border rounded"
          />
          <button
            onClick={createInstance}
            className="bg-primary text-primary-foreground px-4 py-2 rounded hover:bg-primary/90"
          >
            Create
          </button>
        </div>
      </div>
      
      {/* Instances List */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Your Instances</h2>
        
        {isLoading ? (
          <div className="text-center py-8">Loading instances...</div>
        ) : instances.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No instances found. Create your first instance above.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {instances.map(instance => (
              <div key={instance.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold">{instance.name}</h3>
                  <button
                    onClick={() => deleteInstance(instance.id)}
                    className="text-destructive hover:text-destructive/80 text-sm"
                  >
                    Delete
                  </button>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Created: {new Date(instance.createdAt).toLocaleDateString()}
                </p>
                <button
                  onClick={() => onInstanceSelect(instance)}
                  className="w-full bg-primary text-primary-foreground py-2 rounded hover:bg-primary/90"
                >
                  Open Instance
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ParentDashboard;