import { FamilyMember, CreateFamilyMemberData, UpdateFamilyMemberData } from '../types/FamilyMember';
import { databaseService } from './DatabaseService';

class FamilyMemberStorageService {
  constructor() {
    // Register upgrade procedure for family members
    databaseService.registerUpgradeProcedure(this.createFamilyMemberStores.bind(this));
    console.log("FamilyMemberStorageService registered");
  }

  // Initialize the database
  async init(): Promise<void> {
    return databaseService.init();
  }

  // Create family member-related object stores
  private createFamilyMemberStores(db: IDBDatabase): void {
    console.log("Creating family member stores");
    // Create family members store
    if (!db.objectStoreNames.contains('familyMembers')) {
      const familyMemberStore = db.createObjectStore('familyMembers', { keyPath: 'id' });
      familyMemberStore.createIndex('name', 'name', { unique: false });
    }
  }

  // Generate unique ID
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }

  // Create a new family member
  async createFamilyMember(familyMemberData: CreateFamilyMemberData): Promise<FamilyMember> {
    if (!databaseService.isInitialized()) throw new Error('Database not initialized');

    const familyMember: FamilyMember = {
      id: this.generateId(),
      name: familyMemberData.name,
      color: familyMemberData.color
    };

    return new Promise((resolve, reject) => {
      const db = databaseService.getDatabase();
      const transaction = db.transaction(['familyMembers'], 'readwrite');
      const store = transaction.objectStore('familyMembers');
      const request = store.add(familyMember);

      request.onsuccess = () => resolve(familyMember);
      request.onerror = () => reject(new Error('Failed to create family member'));
    });
  }

  // Get a single family member by ID
  async getFamilyMember(id: string): Promise<FamilyMember | null> {
    if (!databaseService.isInitialized()) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const db = databaseService.getDatabase();
      const transaction = db.transaction(['familyMembers'], 'readonly');
      const store = transaction.objectStore('familyMembers');
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(new Error('Failed to get family member'));
    });
  }

  // Get all family members
  async getAllFamilyMembers(): Promise<FamilyMember[]> {
    if (!databaseService.isInitialized()) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const db = databaseService.getDatabase();
      const transaction = db.transaction(['familyMembers'], 'readonly');
      const store = transaction.objectStore('familyMembers');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(new Error('Failed to get family members'));
    });
  }

  // Update an existing family member
  async updateFamilyMember(updateData: UpdateFamilyMemberData): Promise<FamilyMember> {
    if (!databaseService.isInitialized()) throw new Error('Database not initialized');

    const existingFamilyMember = await this.getFamilyMember(updateData.id);
    if (!existingFamilyMember) throw new Error('Family member not found');

    const updatedFamilyMember: FamilyMember = {
      ...existingFamilyMember,
      ...updateData,
      id: updateData.id // Ensure ID doesn't change
    };

    return new Promise((resolve, reject) => {
      const db = databaseService.getDatabase();
      const transaction = db.transaction(['familyMembers'], 'readwrite');
      const store = transaction.objectStore('familyMembers');
      const request = store.put(updatedFamilyMember);

      request.onsuccess = () => resolve(updatedFamilyMember);
      request.onerror = () => reject(new Error('Failed to update family member'));
    });
  }

  // Delete a family member and all its associated events
  async deleteFamilyMember(id: string): Promise<void> {
    if (!databaseService.isInitialized()) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const db = databaseService.getDatabase();
      const transaction = db.transaction(['familyMembers', 'events', 'eventInstances'], 'readwrite');
      const familyMemberStore = transaction.objectStore('familyMembers');
      const eventStore = transaction.objectStore('events');
      const instanceStore = transaction.objectStore('eventInstances');

      // Delete the family member
      const familyMemberRequest = familyMemberStore.delete(id);
      
      // Delete all events associated with this family member
      const eventIndex = eventStore.index('calendarId');
      const eventRequest = eventIndex.openCursor(IDBKeyRange.only(id));
      
      eventRequest.onsuccess = () => {
        const cursor = eventRequest.result;
        if (cursor) {
          const eventId = cursor.value.id;
          eventStore.delete(cursor.primaryKey);
          
          // Delete associated instances for this event
          const instanceIndex = instanceStore.index('eventId');
          const instanceRequest = instanceIndex.openCursor(IDBKeyRange.only(eventId));
          
          instanceRequest.onsuccess = () => {
            const instanceCursor = instanceRequest.result;
            if (instanceCursor) {
              instanceStore.delete(instanceCursor.primaryKey);
              instanceCursor.continue();
            }
          };
          
          cursor.continue();
        }
      };

      familyMemberRequest.onsuccess = () => resolve();
      familyMemberRequest.onerror = () => reject(new Error('Failed to delete family member'));
    });
  }

  // Check if family member name exists
  async familyMemberNameExists(name: string, excludeId?: string): Promise<boolean> {
    if (!databaseService.isInitialized()) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const db = databaseService.getDatabase();
      const transaction = db.transaction(['familyMembers'], 'readonly');
      const store = transaction.objectStore('familyMembers');
      const index = store.index('name');
      const request = index.getAll(IDBKeyRange.only(name));

      request.onsuccess = () => {
        const familyMembers = request.result as FamilyMember[];
        const exists = familyMembers.some(familyMember =>
          familyMember.name === name && (!excludeId || familyMember.id !== excludeId)
        );
        resolve(exists);
      };

      request.onerror = () => reject(new Error('Failed to check family member name'));
    });
  }
}

// Export singleton instance
export const familyMemberStorage = new FamilyMemberStorageService();
