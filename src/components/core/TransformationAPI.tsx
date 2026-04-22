import React, { useState } from 'react';
import { TransformationEngine } from '@/lib/transformationEngine';
import { TransformRequest, TransformResponse } from '@/types/transformation';
import { Entry } from '@/types/entry';

interface TransformationAPIProps {
  entries: Entry[];
  onTransformComplete: (result: TransformResponse) => void;
}

const TransformationAPI: React.FC<TransformationAPIProps> = ({ entries, onTransformComplete }) => {
  const [targetFormat, setTargetFormat] = useState<'json' | 'csv' | 'xml'>('json');
  const [isLoading, setIsLoading] = useState(false);
  const [fieldMappings, setFieldMappings] = useState<Array<{ source: string; target: string; transform?: string }>>([]);
  const [newMapping, setNewMapping] = useState({ source: '', target: '', transform: '' });
  
  const transformationEngine = new TransformationEngine();

  const addFieldMapping = () => {
    if (newMapping.source && newMapping.target) {
      setFieldMappings([...fieldMappings, newMapping]);
      setNewMapping({ source: '', target: '', transform: '' });
    }
  };

  const removeFieldMapping = (index: number) => {
    setFieldMappings(fieldMappings.filter((_, i) => i !== index));
  };

  const handleTransform = async () => {
    setIsLoading(true);
    
    try {
      const request: TransformRequest = {
        sourceTemplate: 'current-entries',
        targetFormat,
        data: entries,
        fieldMappings: fieldMappings.map(mapping => ({
          sourceField: mapping.source,
          targetField: mapping.target,
          transformFunction: mapping.transform || undefined,
        })),
      };
      
      const result = await transformationEngine.transform(request);
      onTransformComplete(result);
    } catch (error) {
      console.error('Transformation failed:', error);
      onTransformComplete({
        success: false,
        transformedData: '',
        format: targetFormat,
        metadata: {
          sourceTemplate: 'current-entries',
          targetFormat,
          transformationTime: 0,
          fieldMappingsApplied: 0,
        },
      });
    } finally {
      setIsLoading(false);
    }
  };

  const downloadResult = (data: string, format: string) => {
    const blob = new Blob([data], { type: getMimeType(format) });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transformed-data.${getFileExtension(format)}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getMimeType = (format: string): string => {
    switch (format) {
      case 'json': return 'application/json';
      case 'csv': return 'text/csv';
      case 'xml': return 'application/xml';
      default: return 'text/plain';
    }
  };

  const getFileExtension = (format: string): string => {
    switch (format) {
      case 'json': return 'json';
      case 'csv': return 'csv';
      case 'xml': return 'xml';
      default: return 'txt';
    }
  };

  return (
    <div className="p-4 border rounded-lg">
      <h3 className="text-lg font-semibold mb-4">Data Transformation API</h3>
      
      <div className="space-y-4">
        {/* Format Selection */}
        <div>
          <label className="block text-sm font-medium mb-2">Target Format</label>
          <select
            value={targetFormat}
            onChange={(e) => setTargetFormat(e.target.value as any)}
            className="p-2 border rounded w-full"
          >
            <option value="json">JSON</option>
            <option value="csv">CSV</option>
            <option value="xml">XML</option>
          </select>
        </div>
        
        {/* Field Mappings */}
        <div>
          <label className="block text-sm font-medium mb-2">Field Mappings</label>
          <div className="space-y-2">
            {fieldMappings.map((mapping, index) => (
              <div key={index} className="flex items-center gap-2">
                <span className="text-sm">{mapping.source} → {mapping.target}</span>
                {mapping.transform && <span className="text-xs text-muted-foreground">({mapping.transform})</span>}
                <button
                  onClick={() => removeFieldMapping(index)}
                  className="text-destructive text-xs"
                >
                  Remove
                </button>
              </div>
            ))}
            
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Source field"
                value={newMapping.source}
                onChange={(e) => setNewMapping({...newMapping, source: e.target.value})}
                className="p-1 border rounded text-sm"
              />
              <input
                type="text"
                placeholder="Target field"
                value={newMapping.target}
                onChange={(e) => setNewMapping({...newMapping, target: e.target.value})}
                className="p-1 border rounded text-sm"
              />
              <input
                type="text"
                placeholder="Transform function"
                value={newMapping.transform}
                onChange={(e) => setNewMapping({...newMapping, transform: e.target.value})}
                className="p-1 border rounded text-sm"
              />
              <button
                onClick={addFieldMapping}
                className="bg-primary text-primary-foreground px-2 py-1 rounded text-sm"
              >
                Add
              </button>
            </div>
          </div>
        </div>
        
        {/* Transform Button */}
        <button
          onClick={handleTransform}
          disabled={isLoading}
          className="w-full bg-primary text-primary-foreground py-2 rounded hover:bg-primary/90 disabled:opacity-50"
        >
          {isLoading ? 'Transforming...' : 'Transform Data'}
        </button>
      </div>
    </div>
  );
};

export default TransformationAPI;