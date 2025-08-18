import { IExportable, FullExportData } from '../types/Export';
import { familyMemberStorage } from './FamilyMemberStorage';
import { eventStorage } from './EventStorage';
import { choreStorage } from './ChoreStorage';
import { pointsStorage } from './PointsStorage';

/**
 * Central service for coordinating data export and import across all storage services
 * Implements the Single Responsibility Principle by focusing only on coordination
 */
class DataExportService {
  private readonly exportableServices: IExportable[];

  constructor() {
    // Register all exportable services
    this.exportableServices = [
      familyMemberStorage,
      eventStorage,
      choreStorage,
      pointsStorage
    ];
  }

  /**
   * Export all data from all storage services into a single JSON payload
   * @returns Promise that resolves to the complete export data
   */
  async exportAllData(): Promise<FullExportData> {
    try {
      // Export data from all services in parallel for performance
      const serviceExports = await Promise.all(
        this.exportableServices.map(service => service.exportData())
      );

      const exportData: FullExportData = {
        app: {
          name: 'Family Calendar',
          version: '1.0.0',
          exportedAt: new Date()
        },
        services: serviceExports
      };

      return exportData;
    } catch (error) {
      throw new Error(`Failed to export data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Import data from a complete export payload into all storage services
   * @param exportData The complete export data to import
   * @returns Promise that resolves when all imports are complete
   */
  async importAllData(exportData: FullExportData): Promise<void> {
    try {
      // Validate the export data structure
      if (!exportData.app || !exportData.services) {
        throw new Error('Invalid export data format');
      }

      // Import data to each service
      const importPromises = exportData.services.map(serviceExport => {
        const service = this.exportableServices.find(s => s.getServiceName() === serviceExport.serviceName);
        
        if (!service) {
          console.warn(`No service found for ${serviceExport.serviceName}, skipping...`);
          return Promise.resolve();
        }

        return service.importData(serviceExport);
      });

      await Promise.all(importPromises);
    } catch (error) {
      throw new Error(`Failed to import data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Download the exported data as a JSON file
   * @param exportData The data to download
   * @param filename Optional filename (defaults to timestamp-based name)
   */
  downloadExportFile(exportData: FullExportData, filename?: string): void {
    try {
      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const defaultFilename = `family-calendar-export-${new Date().toISOString().split('T')[0]}.json`;
      const downloadFilename = filename || defaultFilename;

      // Create a temporary download link
      const link = document.createElement('a');
      link.href = url;
      link.download = downloadFilename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up the object URL
      URL.revokeObjectURL(url);
    } catch (error) {
      throw new Error(`Failed to download export file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check if there's any existing data in the database
   * @returns Promise that resolves to true if data exists, false otherwise
   */
  async hasExistingData(): Promise<boolean> {
    try {
      const summary = await this.getExportSummary();
      
      // Check if any service has data
      return Object.values(summary).some(count => count > 0);
    } catch (error) {
      // If we can't check, assume there might be data to be safe
      console.warn('Could not check for existing data:', error);
      return true;
    }
  }

  /**
   * Get a summary of what data would be exported
   * @returns Promise that resolves to a summary object
   */
  async getExportSummary(): Promise<Record<string, number>> {
    try {
      const summary: Record<string, number> = {};

      for (const service of this.exportableServices) {
        const exportData = await service.exportData();
        
        // Count items in each data category
        let totalItems = 0;
        for (const [key, items] of Object.entries(exportData.data)) {
          if (Array.isArray(items)) {
            totalItems += items.length;
            summary[key] = items.length;
          }
        }
        
        summary[`${service.getServiceName()}_total`] = totalItems;
      }

      return summary;
    } catch (error) {
      throw new Error(`Failed to get export summary: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate an export file before import
   * @param fileContent The content of the export file
   * @returns Validation result with any errors
   */
  validateExportFile(fileContent: string): { valid: boolean; errors: string[]; summary?: Record<string, number> } {
    const errors: string[] = [];

    try {
      const data = JSON.parse(fileContent) as FullExportData;

      // Check required structure
      if (!data.app) {
        errors.push('Missing app metadata');
      }

      if (!data.services || !Array.isArray(data.services)) {
        errors.push('Missing or invalid services data');
      } else {
        // Validate each service export
        const expectedServices = this.exportableServices.map(s => s.getServiceName());
        const foundServices = data.services.map(s => s.serviceName);
        
        for (const expectedService of expectedServices) {
          if (!foundServices.includes(expectedService)) {
            errors.push(`Missing data for service: ${expectedService}`);
          }
        }

        // Check for unknown services
        for (const foundService of foundServices) {
          if (!expectedServices.includes(foundService)) {
            errors.push(`Unknown service in export: ${foundService}`);
          }
        }
      }

      // Generate summary if valid
      let summary: Record<string, number> | undefined;
      if (errors.length === 0 && data.services) {
        summary = {};
        for (const serviceExport of data.services) {
          let serviceTotal = 0;
          for (const [key, items] of Object.entries(serviceExport.data)) {
            if (Array.isArray(items)) {
              summary[key] = items.length;
              serviceTotal += items.length;
            }
          }
          summary[`${serviceExport.serviceName}_total`] = serviceTotal;
        }
      }

      return {
        valid: errors.length === 0,
        errors,
        summary
      };
    } catch (error) {
      errors.push(`Invalid JSON format: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return {
        valid: false,
        errors
      };
    }
  }
}

// Export singleton instance
export const dataExportService = new DataExportService();
