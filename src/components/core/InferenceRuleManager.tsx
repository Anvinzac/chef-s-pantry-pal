import React, { useState } from 'react';
import { InferenceRule } from '@/types/template';

interface InferenceRuleManagerProps {
  rules: InferenceRule[];
  onRulesChange: (rules: InferenceRule[]) => void;
}

const InferenceRuleManager: React.FC<InferenceRuleManagerProps> = ({ rules, onRulesChange }) => {
  const [newRule, setNewRule] = useState<Omit<InferenceRule, 'id'>>({
    type: 'fuzzy',
    pattern: '',
    targetField: 'category',
    replacement: '',
    confidence: 0.8,
    metadata: {},
  });

  const addRule = () => {
    if (!newRule.pattern.trim() || !newRule.replacement) return;
    
    const rule: InferenceRule = {
      ...newRule,
      id: `rule-${Date.now()}`,
    };
    
    onRulesChange([...rules, rule]);
    setNewRule({
      type: 'fuzzy',
      pattern: '',
      targetField: 'category',
      replacement: '',
      confidence: 0.8,
      metadata: {},
    });
  };

  const removeRule = (id: string) => {
    onRulesChange(rules.filter(rule => rule.id !== id));
  };

  const updateRule = (id: string, updates: Partial<InferenceRule>) => {
    onRulesChange(rules.map(rule => 
      rule.id === id ? { ...rule, ...updates } : rule
    ));
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Inference Rules</h3>
      
      {/* New Rule Form */}
      <div className="bg-muted p-4 rounded-lg space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <select
            value={newRule.type}
            onChange={(e) => setNewRule({...newRule, type: e.target.value as any})}
            className="p-2 border rounded"
          >
            <option value="fuzzy">Fuzzy Match</option>
            <option value="semantic">Semantic Match</option>
            <option value="regex">Regex Pattern</option>
            <option value="lookup">Lookup Table</option>
          </select>
          
          <input
            type="text"
            placeholder="Pattern"
            value={newRule.pattern}
            onChange={(e) => setNewRule({...newRule, pattern: e.target.value})}
            className="p-2 border rounded"
          />
        </div>
        
        <div className="grid grid-cols-3 gap-3">
          <select
            value={newRule.targetField}
            onChange={(e) => setNewRule({...newRule, targetField: e.target.value as any})}
            className="p-2 border rounded"
          >
            <option value="unit">Unit</option>
            <option value="category">Category</option>
            <option value="metadata">Metadata</option>
          </select>
          
          <input
            type="text"
            placeholder="Replacement"
            value={newRule.replacement as string}
            onChange={(e) => setNewRule({...newRule, replacement: e.target.value})}
            className="p-2 border rounded"
          />
          
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0"
              max="1"
              step="0.1"
              value={newRule.confidence}
              onChange={(e) => setNewRule({...newRule, confidence: parseFloat(e.target.value)})}
              className="p-2 border rounded w-20"
            />
            <span className="text-sm">Confidence</span>
          </div>
        </div>
        
        <button
          onClick={addRule}
          className="bg-primary text-primary-foreground px-4 py-2 rounded hover:bg-primary/90"
        >
          Add Rule
        </button>
      </div>
      
      {/* Existing Rules List */}
      <div className="space-y-2">
        {rules.map(rule => (
          <div key={rule.id} className="bg-card p-3 rounded border flex items-center justify-between">
            <div className="flex-1">
              <div className="text-sm font-medium">
                {rule.type} → {rule.targetField}
              </div>
              <div className="text-xs text-muted-foreground">
                Pattern: "{rule.pattern}" → "{rule.replacement}"
              </div>
              <div className="text-xs text-muted-foreground">
                Confidence: {rule.confidence}
              </div>
            </div>
            <button
              onClick={() => removeRule(rule.id)}
              className="text-destructive hover:text-destructive/80 ml-4"
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default InferenceRuleManager;