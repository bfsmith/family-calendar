/**
 * Represents exportable data from a storage service
 */
export interface ExportData {
  /** The service name that exported this data */
  serviceName: string;
  /** The version of the export format */
  version: string;
  /** The actual data being exported */
  data: Record<string, any[]>;
  /** Timestamp when the data was exported */
  exportedAt: Date;
}

/**
 * Interface that all storage services must implement to support data export/import
 */
export interface IExportable {
  /**
   * Export all data from this storage service
   * @returns Promise that resolves to the exported data
   */
  exportData(): Promise<ExportData>;
  
  /**
   * Import data into this storage service
   * @param exportData The data to import
   * @returns Promise that resolves when import is complete
   */
  importData(exportData: ExportData): Promise<void>;
  
  /**
   * Get the service name for this storage service
   * @returns The unique service name
   */
  getServiceName(): string;
  
  /**
   * Get the current export format version
   * @returns The version string
   */
  getExportVersion(): string;
}

/**
 * Complete export payload containing data from all services
 */
export interface FullExportData {
  /** Application metadata */
  app: {
    name: string;
    version: string;
    exportedAt: Date;
  };
  /** Array of exported data from each service */
  services: ExportData[];
}
