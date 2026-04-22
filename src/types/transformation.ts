export interface TransformRequest {
  sourceTemplate: string;
  targetFormat: 'json' | 'csv' | 'xml';
  data: Record<string, any>;
  fieldMappings?: FieldMapping[];
}

export interface TransformResponse {
  success: boolean;
  transformedData: string;
  format: string;
  metadata: {
    sourceTemplate: string;
    targetFormat: string;
    transformationTime: number;
    fieldMappingsApplied: number;
  };
}

export interface FieldMapping {
  sourceField: string;
  targetField: string;
  transformFunction?: string; // e.g., 'toUpperCase', 'dateFormat', 'unitConversion'
}

export interface TransformationResult {
  data: string;
  format: 'json' | 'csv' | 'xml';
  size: number;
  processingTime: number;
}