import React from 'react';

interface SettingsPageProps {
  parentMode: boolean;
  setParentMode: (enabled: boolean) => void;
  editMode: boolean;
  setEditMode: (enabled: boolean) => void;
  selectedTemplate: string;
  setTemplate: (templateId: string) => void;
  templates: Array<{ id: string; name: string }>;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ 
  parentMode, 
  setParentMode, 
  editMode, 
  setEditMode, 
  selectedTemplate, 
  setTemplate,
  templates
}) => {
  return (
    <div className="p-4 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label htmlFor="parent-mode" className="text-sm font-medium">
            Parent Mode
          </label>
          <button
            id="parent-mode"
            onClick={() => setParentMode(!parentMode)}
            className={`w-12 h-6 rounded-full p-1 transition-colors ${
              parentMode ? 'bg-primary' : 'bg-gray-300'
            }`}
          >
            <div className={`bg-white w-4 h-4 rounded-full transition-transform ${
              parentMode ? 'translate-x-6' : ''
            }`} />
          </button>
        </div>
        
        <div className="flex items-center justify-between">
          <label htmlFor="edit-mode" className="text-sm font-medium">
            Edit Mode
          </label>
          <button
            id="edit-mode"
            onClick={() => setEditMode(!editMode)}
            className={`w-12 h-6 rounded-full p-1 transition-colors ${
              editMode ? 'bg-primary' : 'bg-gray-300'
            }`}
          >
            <div className={`bg-white w-4 h-4 rounded-full transition-transform ${
              editMode ? 'translate-x-6' : ''
            }`} />
          </button>
        </div>
        
        <div>
          <label htmlFor="template-select" className="text-sm font-medium block mb-2">
            Template Selection
          </label>
          <select
            id="template-select"
            value={selectedTemplate}
            onChange={(e) => setTemplate(e.target.value)}
            className="w-full p-2 border rounded-md"
          >
            {templates.map(template => (
              <option key={template.id} value={template.id}>
                {template.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;