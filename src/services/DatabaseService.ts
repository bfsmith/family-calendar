type UpgradeProcedure = (db: IDBDatabase) => void;

class DatabaseService {
  private static instance: DatabaseService;
  private dbName = 'FamilyCalendarDB';
  private version = 1;
  private db: IDBDatabase | null = null;
  private upgradeProcedures: UpgradeProcedure[] = [];
  private initPromise: Promise<void> | null = null;

  private constructor() {}

  static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  // Register an upgrade procedure that will be called during database initialization
  registerUpgradeProcedure(procedure: UpgradeProcedure): void {
    this.upgradeProcedures.push(procedure);
    console.log("Upgrade procedure registered");
  }

  // Initialize the database
  async init(): Promise<void> {
    // Return existing promise if already initializing
    if (this.initPromise) {
      return this.initPromise;
    }

    // Return immediately if already initialized
    if (this.db) {
      return Promise.resolve();
    }

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        this.initPromise = null;
        reject(new Error('Failed to open database'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        this.initPromise = null;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Execute all registered upgrade procedures
        this.upgradeProcedures.forEach(procedure => {
          try {
            procedure(db);
          } catch (error) {
            console.error('Error during database upgrade procedure:', error);
          }
        });
      };
    });

    return this.initPromise;
  }

  // Get the database instance
  getDatabase(): IDBDatabase {
    if (!this.db) {
      throw new Error('Database not initialized. Call init() first.');
    }
    return this.db;
  }

  // Check if database is initialized
  isInitialized(): boolean {
    return this.db !== null;
  }

  // Close the database connection
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.initPromise = null;
    }
  }
}

// Export singleton instance
export const databaseService = DatabaseService.getInstance(); 
