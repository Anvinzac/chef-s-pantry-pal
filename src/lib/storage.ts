import { Template } from '@/types/template';
import { Entry } from '@/types/entry';
import { AppInstance, InstanceSettings } from '@/types/instance';

export interface StorageInterface {
  // Template storage
  saveTemplate(template: Template): Promise<void>;
  getTemplate(templateId: string): Promise<Template | null>;
  listTemplates(): Promise<Template[]>;
  
  // Entry storage
  saveEntry(entry: Entry): Promise<void>;
  getEntry(entryId: string): Promise<Entry | null>;
  listEntries(instanceId?: string): Promise<Entry[]>;
  
  // Instance storage
  saveInstance(instance: AppInstance): Promise<void>;
  getInstance(instanceId: string): Promise<AppInstance | null>;
  listInstances(userId: string): Promise<AppInstance[]>;
  
  // Settings storage
  saveSettings(settings: InstanceSettings, instanceId: string): Promise<void>;
  getSettings(instanceId: string): Promise<InstanceSettings>;
}

export class LocalStorageService implements StorageInterface {
  private readonly TEMPLATE_KEY = 'templates';
  private readonly ENTRY_KEY = 'entries';
  private readonly INSTANCE_KEY = 'instances';
  private readonly SETTINGS_KEY = 'settings';
  
  async saveTemplate(template: Template): Promise<void> {
    const templates = await this.listTemplates();
    const updated = templates.filter(t => t.templateId !== template.templateId);
    updated.push(template);
    localStorage.setItem(this.TEMPLATE_KEY, JSON.stringify(updated));
  }
  
  async getTemplate(templateId: string): Promise<Template | null> {
    const templates = await this.listTemplates();
    return templates.find(t => t.templateId === templateId) || null;
  }
  
  async listTemplates(): Promise<Template[]> {
    try {
      const stored = localStorage.getItem(this.TEMPLATE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to load templates:', error);
      return [];
    }
  }
  
  async saveEntry(entry: Entry): Promise<void> {
    const entries = await this.listEntries();
    const updated = entries.filter(e => e.id !== entry.id);
    updated.push(entry);
    localStorage.setItem(this.ENTRY_KEY, JSON.stringify(updated));
  }
  
  async getEntry(entryId: string): Promise<Entry | null> {
    const entries = await this.listEntries();
    return entries.find(e => e.id === entryId) || null;
  }
  
  async listEntries(instanceId?: string): Promise<Entry[]> {
    try {
      const stored = localStorage.getItem(this.ENTRY_KEY);
      const entries = stored ? JSON.parse(stored) : [];
      if (instanceId) {
        return entries.filter(e => e.templateId === instanceId);
      }
      return entries;
    } catch (error) {
      console.error('Failed to load entries:', error);
      return [];
    }
  }
  
  async saveInstance(instance: AppInstance): Promise<void> {
    const instances = await this.listInstances('');
    const updated = instances.filter(i => i.id !== instance.id);
    updated.push(instance);
    localStorage.setItem(this.INSTANCE_KEY, JSON.stringify(updated));
  }
  
  async getInstance(instanceId: string): Promise<AppInstance | null> {
    const instances = await this.listInstances('');
    return instances.find(i => i.id === instanceId) || null;
  }
  
  async listInstances(userId: string): Promise<AppInstance[]> {
    try {
      const stored = localStorage.getItem(this.INSTANCE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to load instances:', error);
      return [];
    }
  }
  
  async saveSettings(settings: InstanceSettings, instanceId: string): Promise<void> {
    const key = `${this.SETTINGS_KEY}_${instanceId}`;
    localStorage.setItem(key, JSON.stringify(settings));
  }
  
  async getSettings(instanceId: string): Promise<InstanceSettings> {
    const key = `${this.SETTINGS_KEY}_${instanceId}`;
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : {
        parentMode: false,
        editMode: false,
        defaultTemplate: 'default-pantry-template',
        errorCaptureEnabled: false,
      };
    } catch ( error) {
      console.error('Failed to load settings:', error);
      return {
        parentMode: false,
        editMode: false,
        defaultTemplate: 'default-pantry-template',
        errorCaptureEnabled: false,
      };
    }
  }
}