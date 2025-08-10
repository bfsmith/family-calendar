import { PointTransaction, CreatePointTransactionData } from '../types/Chore';
import { databaseService } from './DatabaseService';

class PointsStorageService {
  constructor() {
    // Register upgrade procedure for points
    databaseService.registerUpgradeProcedure(this.createPointsStores.bind(this));
    console.log("PointsStorageService registered");
  }

  // Initialize the database
  async init(): Promise<void> {
    return databaseService.init();
  }

  // Create points-related object stores
  private createPointsStores(db: IDBDatabase): void {
    console.log("Creating points stores");
    
    // Create point transactions store
    if (!db.objectStoreNames.contains('pointTransactions')) {
      const transactionStore = db.createObjectStore('pointTransactions', { keyPath: 'id' });
      transactionStore.createIndex('familyMemberId', 'familyMemberId', { unique: false });
      transactionStore.createIndex('choreId', 'choreId', { unique: false });
      transactionStore.createIndex('createdAt', 'createdAt', { unique: false });
      transactionStore.createIndex('transactionType', 'transactionType', { unique: false });
    }
  }

  // Generate unique ID
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }

  // Create a point transaction
  async createPointTransaction(transactionData: CreatePointTransactionData): Promise<PointTransaction> {
    if (!databaseService.isInitialized()) throw new Error('Database not initialized');

    const transaction: PointTransaction = {
      id: this.generateId(),
      familyMemberId: transactionData.familyMemberId,
      points: transactionData.points,
      choreId: transactionData.choreId,
      choreTitle: transactionData.choreTitle,
      transactionType: transactionData.transactionType,
      createdAt: new Date(),
      occurrenceDate: transactionData.occurrenceDate
    };

    return new Promise((resolve, reject) => {
      const db = databaseService.getDatabase();
      const dbTransaction = db.transaction(['pointTransactions'], 'readwrite');
      const store = dbTransaction.objectStore('pointTransactions');
      const request = store.add(transaction);

      request.onsuccess = () => resolve(transaction);
      request.onerror = () => reject(new Error('Failed to create point transaction'));
    });
  }

  // Get all point transactions for a family member
  async getFamilyMemberTransactions(familyMemberId: string): Promise<PointTransaction[]> {
    if (!databaseService.isInitialized()) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const db = databaseService.getDatabase();
      const transaction = db.transaction(['pointTransactions'], 'readonly');
      const store = transaction.objectStore('pointTransactions');
      const index = store.index('familyMemberId');
      const request = index.getAll(IDBKeyRange.only(familyMemberId));

      request.onsuccess = () => {
        const transactions = request.result as PointTransaction[];
        // Sort by creation date, newest first
        transactions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        resolve(transactions);
      };

      request.onerror = () => reject(new Error('Failed to get point transactions'));
    });
  }

  // Get all point transactions for a specific chore
  async getChoreTransactions(choreId: string): Promise<PointTransaction[]> {
    if (!databaseService.isInitialized()) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const db = databaseService.getDatabase();
      const transaction = db.transaction(['pointTransactions'], 'readonly');
      const store = transaction.objectStore('pointTransactions');
      const index = store.index('choreId');
      const request = index.getAll(IDBKeyRange.only(choreId));

      request.onsuccess = () => {
        const transactions = request.result as PointTransaction[];
        // Sort by creation date, newest first
        transactions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        resolve(transactions);
      };

      request.onerror = () => reject(new Error('Failed to get chore point transactions'));
    });
  }

  // Calculate current point balance for a family member
  async calculatePointBalance(familyMemberId: string): Promise<number> {
    const transactions = await this.getFamilyMemberTransactions(familyMemberId);
    return transactions.reduce((total, transaction) => total + transaction.points, 0);
  }

  // Get all transactions (for admin/debugging purposes)
  async getAllTransactions(): Promise<PointTransaction[]> {
    if (!databaseService.isInitialized()) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const db = databaseService.getDatabase();
      const transaction = db.transaction(['pointTransactions'], 'readonly');
      const store = transaction.objectStore('pointTransactions');
      const request = store.getAll();

      request.onsuccess = () => {
        const transactions = request.result as PointTransaction[];
        // Sort by creation date, newest first
        transactions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        resolve(transactions);
      };

      request.onerror = () => reject(new Error('Failed to get all transactions'));
    });
  }
}

// Export singleton instance
export const pointsStorage = new PointsStorageService();
