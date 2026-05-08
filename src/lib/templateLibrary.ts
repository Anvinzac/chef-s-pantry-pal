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
          id: 'tofu',
          name: 'Đậu Hũ',
          items: [],
          metadata: { emoji: '🧈', color: 'hsl(45, 70%, 55%)' }
        },
        {
          id: 'takeaway',
          name: 'Mang Đi',
          items: [
            { id: 'takeaway-combo', name: 'Cơm phần', defaultUnit: 'suất', altUnits: ['phần'], tags: ['mang đi', 'cơm'] },
            { id: 'takeaway-drink', name: 'Trà đá', defaultUnit: 'ly', altUnits: ['cốc'], tags: ['mang đi', 'nước'] },
            { id: 'takeaway-pho', name: 'Phở mang về', defaultUnit: 'tô', altUnits: ['chén'], tags: ['mang đi', 'phở'] },
            { id: 'takeaway-banhmi', name: 'Bánh mì', defaultUnit: 'ổ', altUnits: ['cái'], tags: ['mang đi', 'bánh'] },
            { id: 'takeaway-springroll', name: 'Gỏi cuốn', defaultUnit: 'cái', altUnits: ['cuốn'], tags: ['mang đi', 'gỏi'] },
            { id: 'takeaway-coffee', name: 'Cà phê', defaultUnit: 'ly', altUnits: ['cốc'], tags: ['mang đi', 'cà phê'] },
            { id: 'takeaway-bun', name: 'Bún thịt nướng', defaultUnit: 'phần', altUnits: ['tô'], tags: ['mang đi', 'bún'] },
            { id: 'takeaway-che', name: 'Chè', defaultUnit: 'ly', altUnits: ['chén'], tags: ['mang đi', 'tráng miệng'] },
            { id: 'takeaway-nem', name: 'Nem rán', defaultUnit: 'cái', altUnits: ['miếng'], tags: ['mang đi', 'nem'] },
            { id: 'takeaway-xoi', name: 'Xôi', defaultUnit: 'phần', altUnits: ['gói'], tags: ['mang đi', 'xôi'] },
          ],
          metadata: { emoji: '🥡', color: 'hsl(30, 80%, 55%)' }
        },
        {
          id: 'gas',
          name: 'Gas',
          items: [],
          metadata: { emoji: '⛽', color: 'hsl(210, 65%, 50%)' }
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