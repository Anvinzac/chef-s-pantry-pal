import { Template } from '@/types/template';
import { Entry } from '@/types/entry';
import { InferenceRule } from '@/types/template';
import { SimpleTemplateEngine, MatchResult } from '@/lib/templateEngine';

export interface PredictionResult {
  unit: string;
  category: string;
  metadata: Record<string, any>;
  confidence: number;
  source: 'template' | 'prediction' | 'inference_rule' | 'user';
  alternatives: Array<{
    unit: string;
    category: string;
    confidence: number;
  }>;
}

export interface PredictionEngine {
  predict(input: { name: string; quantity: number }, templateId: string): Promise<PredictionResult>;
  applyInferenceRules(input: string, rules: InferenceRule[]): any[];
}

export class SimplePredictionEngine implements PredictionEngine {
  private templateEngine: SimpleTemplateEngine;

  constructor() {
    this.templateEngine = new SimpleTemplateEngine();
  }

  async predict(input: { name: string; quantity: number }, templateId: string): Promise<PredictionResult> {
    try {
      // Load template
      const template = await this.templateEngine.loadTemplate(templateId);
      
      // Build reference dataset
      const dataset = this.templateEngine.buildReferenceDataset(template);
      
      // Generate search index
      const index = this.templateEngine.generateSearchIndex(dataset);
      
      // Find matches
      const matches = this.templateEngine.findMatches(input.name, index);
      
      if (matches.length > 0) {
        const bestMatch = matches[0];
        const alternatives = matches.slice(1).map(match => ({
          unit: match.unit,
          category: match.category,
          confidence: match.confidence,
        }));
        
        return {
          unit: bestMatch.unit,
          category: bestMatch.category,
          metadata: {},
          confidence: bestMatch.confidence,
          source: 'template',
          alternatives,
        };
      }
      
      // Apply inference rules if no template match
      if (template.inferenceRules.length > 0) {
        const inferenceResults = this.applyInferenceRules(input.name, template.inferenceRules);
        if (inferenceResults.length > 0) {
          const bestInference = inferenceResults[0];
          return {
            unit: bestInference.unit || 'piece',
            category: bestInference.category || 'uncategorized',
            metadata: bestInference.metadata || {},
            confidence: bestInference.confidence || 0.7,
            source: 'inference_rule',
            alternatives: inferenceResults.slice(1).map(result => ({
              unit: result.unit || 'piece',
              category: result.category || 'uncategorized',
              confidence: result.confidence || 0.5,
            })),
          };
        }
      }
      
      // Default fallback
      return {
        unit: 'piece',
        category: 'uncategorized',
        metadata: {},
        confidence: 0.3,
        source: 'prediction',
        alternatives: [],
      };
      
    } catch (error) {
      console.error('Prediction failed:', error);
      // Fallback to basic prediction
      return {
        unit: this.guessUnitFromName(input.name),
        category: this.guessCategoryFromName(input.name),
        metadata: {},
        confidence: 0.4,
        source: 'prediction',
        alternatives: [],
      };
    }
  }

  applyInferenceRules(input: string, rules: InferenceRule[]): any[] {
    const results: any[] = [];
    
    for (const rule of rules) {
      let match = false;
      let confidence = rule.confidence;
      
      switch (rule.type) {
        case 'regex':
          const regex = new RegExp(rule.pattern, 'i');
          match = regex.test(input);
          break;
        case 'fuzzy':
        case 'lookup':
          // Simple substring matching for Phase 1
          match = input.toLowerCase().includes(rule.pattern.toLowerCase());
          if (match) {
            // Adjust confidence based on match quality
            const similarity = rule.pattern.length / input.length;
            confidence = Math.min(confidence, similarity);
          }
          break;
        case 'semantic':
          // Placeholder for semantic matching (Phase 2+)
          match = input.toLowerCase().includes(rule.pattern.toLowerCase());
          break;
      }
      
      if (match) {
        let result: any = {};
        if (typeof rule.replacement === 'string') {
          if (rule.targetField === 'unit') {
            result.unit = rule.replacement;
          } else if (rule.targetField === 'category') {
            result.category = rule.replacement;
          }
        } else {
          result = { ...rule.replacement };
        }
        result.confidence = confidence;
        results.push(result);
      }
    }
    
    // Sort by confidence (highest first)
    return results.sort((a, b) => (b.confidence || 0) - (a.confidence || 0));
  }

  private guessUnitFromName(name: string): string {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('kg') || lowerName.includes('kilo')) return 'kg';
    if (lowerName.includes('g') || lowerName.includes('gram')) return 'g';
    if (lowerName.includes('liter') || lowerName.includes('l')) return 'liter';
    if (lowerName.includes('ml') || lowerName.includes('milli')) return 'ml';
    if (lowerName.includes('piece') || lowerName.includes('pc')) return 'piece';
    if (lowerName.includes('pack') || lowerName.includes('package')) return 'pack';
    if (lowerName.includes('bottle')) return 'bottle';
    if (lowerName.includes('box')) return 'box';
    if (lowerName.includes('bag')) return 'bag';
    if (lowerName.includes('can')) return 'can';
    if (lowerName.includes('dozen')) return 'dozen';
    return 'piece';
  }

  private guessCategoryFromName(name: string): string {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('vegetable') || lowerName.includes('rau') || lowerName.includes('carrot') || lowerName.includes('potato')) {
      return 'vegetables';
    }
    if (lowerName.includes('sauce') || lowerName.includes('nuoc') || lowerName.includes('sauce')) {
      return 'sauces';
    }
    if (lowerName.includes('spice') || lowerName.includes('gia vi') || lowerName.includes('salt') || lowerName.includes('pepper')) {
      return 'spices';
    }
    if (lowerName.includes('grain') || lowerName.includes('ngu coc') || lowerName.includes('rice') || lowerName.includes('wheat')) {
      return 'grains';
    }
    if (lowerName.includes('oil') || lowerName.includes('dau mo') || lowerName.includes('oil') || lowerName.includes('butter')) {
      return 'oils';
    }
    if (lowerName.includes('dairy') || lowerName.includes('sua') || lowerName.includes('milk') || lowerName.includes('cheese')) {
      return 'dairy';
    }
    return 'uncategorized';
  }
}