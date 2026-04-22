import { Template } from '@/types/template';
import { LocalStorageService } from '@/lib/storage';

export class TemplateLibrary {
  private storage: LocalStorageService;
  
  constructor() {
    this.storage = new LocalStorageService();
  }
  
  async createTemplate(template: Omit<Template, 'templateId' | 'createdAt' | 'updatedAt'>): Promise<Template> {
    const newTemplate: Template = {
      ...template,
      templateId: `template-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    await this.storage.saveTemplate(newTemplate);
    return newTemplate;
  }
  
  async updateTemplate(templateId: string, updates: Partial<Template>): Promise<Template | null> {
    const existing = await this.storage.getTemplate(templateId);
    if (!existing) return null;
    
    const updatedTemplate: Template = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    
    await this.storage.saveTemplate(updatedTemplate);
    return updatedTemplate;
  }
  
  async deleteTemplate(templateId: string): Promise<boolean> {
    const templates = await this.storage.listTemplates();
    const updated = templates.filter(t => t.templateId !== templateId);
    
    // Clear storage and save updated list
    localStorage.removeItem('templates');
    for (const template of updated) {
      await this.storage.saveTemplate(template);
    }
    
    return true;
  }
  
  async getTemplate(templateId: string): Promise<Template | null> {
    return await this.storage.getTemplate(templateId);
  }
  
  async listTemplates(): Promise<Template[]> {
    return await this.storage.listTemplates();
  }
  
  // Create default template for backward compatibility
  async createDefaultTemplate(): Promise<Template> {
    const defaultTemplate: Omit<Template, 'templateId' | 'createdAt' | 'updatedAt'> = {
      name: 'Default Pantry Template',
      scale: 'small',
      version: '1.0.0',
      categories: [
        {
          id: 'vegetables',
          name: 'Rau Củ',
          items: [],
          metadata: { emoji: '🥬', color: 'hsl(145, 65%, 42%)' }
        },
        {
          id: 'sauces',
          name: 'Nước Chấm',
          items: [],
          metadata: { emoji: '🫙', color: 'hsl(0, 72%, 55%)' }
        },
        {
          id: 'spices',
          name: 'Gia Vị',
          items: [],
          metadata: { emoji: '🧂', color: 'hsl(32, 90%, 52%)' }
        },
        {
          id: 'grains',
          name: 'Ngũ Cốc',
          items: [],
          metadata: { emoji: '🌾', color: 'hsl(42, 75%, 50%)' }
        },
        {
          id: 'oils',
          name: 'Dầu Mỡ',
          items: [],
          metadata: { emoji: '🫒', color: 'hsl(62, 55%, 42%)' }
        },
        {
          id: 'dairy',
          name: 'Sữa',
          items: [],
          metadata: { emoji: '🧀', color: 'hsl(48, 85%, 60%)' }
        }
      ],
      inferenceRules: [],
      metadata: {
        description: 'Default template for Chef\'s Pantry Pal',
        language: 'vi',
        region: 'vietnam'
      }
    };
    
    return await this.createTemplate(defaultTemplate);
  }
  
  // Initialize default template if none exists
  async initialize(): Promise<void> {
    const templates = await this.listTemplates();
    if (templates.length === 0) {
      await this.createDefaultTemplate();
    }
  }
}