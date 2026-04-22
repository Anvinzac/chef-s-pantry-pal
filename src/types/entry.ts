export interface Entry {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category: string;
  exception?: string;
  metadata: Record<string, any>;
  templateId?: string;
  inferredData?: {
    unit?: string;
    category?: string;
    confidence?: number;
    source?: 'template' | 'prediction' | 'user';
  };
  createdAt: string;
  updatedAt: string;
}