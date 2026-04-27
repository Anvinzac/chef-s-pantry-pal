import { TransformRequest, TransformResponse, FieldMapping } from '@/types/transformation';
import { Entry } from '@/types/entry';

export class TransformationEngine {
  async transform(request: TransformRequest): Promise<TransformResponse> {
    const startTime = Date.now();
    
    try {
      let transformedData: string;
      let fieldMappingsApplied = 0;
      
      // Apply field mappings if provided
      let processedData = request.data;
      if (request.fieldMappings && request.fieldMappings.length > 0) {
        processedData = this.applyFieldMappings(request.data, request.fieldMappings);
        fieldMappingsApplied = request.fieldMappings.length;
      }
      
      // Transform based on target format
      switch (request.targetFormat) {
        case 'json':
          transformedData = this.toJson(processedData);
          break;
        case 'csv':
          transformedData = this.toCsv(processedData);
          break;
        case 'xml':
          transformedData = this.toXml(processedData);
          break;
        default:
          throw new Error(`Unsupported format: ${request.targetFormat}`);
      }
      
      const processingTime = Date.now() - startTime;
      
      return {
        success: true,
        transformedData,
        format: request.targetFormat,
        metadata: {
          sourceTemplate: request.sourceTemplate,
          targetFormat: request.targetFormat,
          transformationTime: processingTime,
          fieldMappingsApplied,
        },
      };
    } catch (error) {
      console.error('Transformation failed:', error);
      return {
        success: false,
        transformedData: '',
        format: request.targetFormat,
        metadata: {
          sourceTemplate: request.sourceTemplate,
          targetFormat: request.targetFormat,
          transformationTime: Date.now() - startTime,
          fieldMappingsApplied: 0,
        },
      };
    }
  }
  
  private applyFieldMappings(data: Record<string, any>, mappings: FieldMapping[]): Record<string, any> {
    const result: Record<string, any> = { ...data };
    
    mappings.forEach(mapping => {
      const { sourceField, targetField, transformFunction } = mapping;
      
      if (sourceField in result) {
        let value = result[sourceField];
        
        // Apply transform function if specified
        if (transformFunction) {
          value = this.applyTransformFunction(value, transformFunction);
        }
        
        // Set the mapped value
        result[targetField] = value;
        
        // Remove original field if source and target are different
        if (sourceField !== targetField) {
          delete result[sourceField];
        }
      }
    });
    
    return result;
  }
  
  private applyTransformFunction(value: any, functionName: string): any {
    switch (functionName) {
      case 'toUpperCase':
        return typeof value === 'string' ? value.toUpperCase() : value;
      case 'toLowerCase':
        return typeof value === 'string' ? value.toLowerCase() : value;
      case 'trim':
        return typeof value === 'string' ? value.trim() : value;
      case 'number':
        return typeof value === 'string' ? parseFloat(value) : value;
      case 'string':
        return String(value);
      case 'dateFormat':
        return new Date(value).toISOString();
      case 'unitConversion':
        // Placeholder for unit conversion logic
        return value;
      default:
        return value;
    }
  }
  
  private toJson(data: any): string {
    return JSON.stringify(data, null, 2);
  }
  
  private toCsv(data: any): string {
    if (Array.isArray(data)) {
      if (data.length === 0) return '';
      
      const headers = Object.keys(data[0]);
      const csvRows = [headers.join(',')];
      
      data.forEach(item => {
        const row = headers.map(header => {
          const value = item[header];
          if (typeof value === 'string' && value.includes(',')) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return String(value);
        });
        csvRows.push(row.join(','));
      });
      
      return csvRows.join('\n');
    } else {
      // Handle single object
      const headers = Object.keys(data);
      const values = headers.map(header => {
        const value = data[header];
        if (typeof value === 'string' && value.includes(',')) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return String(value);
      });
      return [headers.join(','), values.join(',')].join('\n');
    }
  }
  
  private toXml(data: any): string {
    const xml = this.objectToXml(data, 'root');
    return `<?xml version="1.0" encoding="UTF-8"?>\n${xml}`;
  }
  
  private objectToXml(obj: any, rootName: string): string {
    let xml = `<${rootName}>`;
    
    if (Array.isArray(obj)) {
      obj.forEach(item => {
        xml += this.objectToXml(item, 'item');
      });
    } else if (typeof obj === 'object' && obj !== null) {
      Object.entries(obj).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          xml += `<${key}>`;
          value.forEach(item => {
            xml += this.objectToXml(item, 'item');
          });
          xml += `</${key}>`;
        } else if (typeof value === 'object' && value !== null) {
          xml += this.objectToXml(value, key);
        } else {
          xml += `<${key}>${this.escapeXml(String(value))}</${key}>`;
        }
      });
    } else {
      xml += this.escapeXml(String(obj));
    }
    
    xml += `</${rootName}>`;
    return xml;
  }
  
  private escapeXml(str: string): string {
    return str
      .replace(/&/g, '&')
      .replace(/</g, '<')
      .replace(/>/g, '>')
      .replace(/"/g, '"')
      .replace(/'/g, '&apos;');
  }
  
  // Transform Entry array to different formats
  async transformEntries(entries: Entry[], format: 'json' | 'csv' | 'xml'): Promise<string> {
    const request: TransformRequest = {
      sourceTemplate: 'entries',
      targetFormat: format,
      data: entries,
    };
    
    const response = await this.transform(request);
    return response.transformedData;
  }
}