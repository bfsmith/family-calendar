import { Chore, CreateChoreData, UpdateChoreData, ChoreQuery, ChoreCompletion, CreateChoreCompletionData } from '../types/Chore';
import { databaseService } from './DatabaseService';

class ChoreStorageService {
  constructor() {
    // Register upgrade procedure for chores
    databaseService.registerUpgradeProcedure(this.createChoreStores.bind(this));
    console.log("ChoreStorageService registered");
  }

  // Initialize the database
  async init(): Promise<void> {
    return databaseService.init();
  }

  // Create chore-related object stores
  private createChoreStores(db: IDBDatabase): void {
    console.log("Creating chore stores");
    
    // Create chores store
    if (!db.objectStoreNames.contains('chores')) {
      const choreStore = db.createObjectStore('chores', { keyPath: 'id' });
      choreStore.createIndex('familyMemberId', 'familyMemberId', { unique: false });
      choreStore.createIndex('title', 'title', { unique: false });
      choreStore.createIndex('createdAt', 'createdAt', { unique: false });
    }

    // Create chore completions store
    if (!db.objectStoreNames.contains('choreCompletions')) {
      const completionStore = db.createObjectStore('choreCompletions', { keyPath: 'id' });
      completionStore.createIndex('choreId', 'choreId', { unique: false });
      completionStore.createIndex('familyMemberId', 'familyMemberId', { unique: false });
      completionStore.createIndex('completedAt', 'completedAt', { unique: false });
      completionStore.createIndex('occurrenceDate', 'occurrenceDate', { unique: false });
    }
  }

  // Generate unique ID
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }

  // Create a new chore
  async createChore(choreData: CreateChoreData): Promise<Chore> {
    if (!databaseService.isInitialized()) throw new Error('Database not initialized');

    const now = new Date();
    const chore: Chore = {
      id: this.generateId(),
      title: choreData.title,
      familyMemberId: choreData.familyMemberId,
      icon: choreData.icon,
      recurring: choreData.recurring,
      createdAt: now,
      updatedAt: now
    };

    return new Promise((resolve, reject) => {
      const db = databaseService.getDatabase();
      const transaction = db.transaction(['chores'], 'readwrite');
      const store = transaction.objectStore('chores');
      const request = store.add(chore);

      request.onsuccess = () => resolve(chore);
      request.onerror = () => reject(new Error('Failed to create chore'));
    });
  }

  // Get a single chore by ID
  async getChore(id: string): Promise<Chore | null> {
    if (!databaseService.isInitialized()) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const db = databaseService.getDatabase();
      const transaction = db.transaction(['chores'], 'readonly');
      const store = transaction.objectStore('chores');
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(new Error('Failed to get chore'));
    });
  }

  // Get all chores
  async getAllChores(): Promise<Chore[]> {
    if (!databaseService.isInitialized()) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const db = databaseService.getDatabase();
      const transaction = db.transaction(['chores'], 'readonly');
      const store = transaction.objectStore('chores');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(new Error('Failed to get chores'));
    });
  }

  // Update an existing chore
  async updateChore(updateData: UpdateChoreData): Promise<Chore> {
    if (!databaseService.isInitialized()) throw new Error('Database not initialized');

    const existingChore = await this.getChore(updateData.id);
    if (!existingChore) throw new Error('Chore not found');

    const updatedChore: Chore = {
      ...existingChore,
      ...updateData,
      id: updateData.id, // Ensure ID doesn't change
      updatedAt: new Date()
    };

    return new Promise((resolve, reject) => {
      const db = databaseService.getDatabase();
      const transaction = db.transaction(['chores'], 'readwrite');
      const store = transaction.objectStore('chores');
      const request = store.put(updatedChore);

      request.onsuccess = () => resolve(updatedChore);
      request.onerror = () => reject(new Error('Failed to update chore'));
    });
  }

  // Delete a chore and all its completions
  async deleteChore(id: string): Promise<void> {
    if (!databaseService.isInitialized()) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const db = databaseService.getDatabase();
      const transaction = db.transaction(['chores', 'choreCompletions'], 'readwrite');
      const choreStore = transaction.objectStore('chores');
      const completionStore = transaction.objectStore('choreCompletions');

      // Delete the chore
      const choreRequest = choreStore.delete(id);
      
      // Delete all completions associated with this chore
      const completionIndex = completionStore.index('choreId');
      const completionRequest = completionIndex.openCursor(IDBKeyRange.only(id));
      
      completionRequest.onsuccess = () => {
        const cursor = completionRequest.result;
        if (cursor) {
          completionStore.delete(cursor.primaryKey);
          cursor.continue();
        }
      };

      choreRequest.onsuccess = () => resolve();
      choreRequest.onerror = () => reject(new Error('Failed to delete chore'));
    });
  }

  // Helper method to handle non-recurring chore logic
  private async handleNonRecurringChore(chore: Chore, query: ChoreQuery): Promise<Chore[]> {
    // If includeAllNonRecurring is true, always include the chore regardless of completion
    if (query.includeAllNonRecurring) {
      return [chore];
    }

    // Get all completions for this chore
    const completions = await this.getChoreCompletions(chore.id);
    
    if (completions.length === 0) {
      // Not completed yet - include it in results
      return [chore];
    } else {
      // Completed - only include it if the query date range includes the completion date
      if (query.startDate && query.endDate) {
        const hasCompletionInRange = completions.some(completion => {
          const completionDate = new Date(completion.occurrenceDate);
          const completionDateOnly = new Date(completionDate.getFullYear(), completionDate.getMonth(), completionDate.getDate());
          const startDateOnly = new Date(query.startDate!.getFullYear(), query.startDate!.getMonth(), query.startDate!.getDate());
          const endDateOnly = new Date(query.endDate!.getFullYear(), query.endDate!.getMonth(), query.endDate!.getDate());
          
          return completionDateOnly >= startDateOnly && completionDateOnly < endDateOnly;
        });
        
        return hasCompletionInRange ? [chore] : [];
      }
      // If no date range specified, don't include completed chores
      return [];
    }
  }

  // Query chores with filters and dynamic recurring chore calculation
      async queryChores(query: ChoreQuery = {}): Promise<Chore[]> {
      if (!databaseService.isInitialized()) throw new Error('Database not initialized');

    return new Promise(async (resolve, reject) => {
      const db = databaseService.getDatabase();
      const transaction = db.transaction(['chores'], 'readonly');
      const store = transaction.objectStore('chores');
      const request = store.getAll();

      request.onsuccess = async () => {
        try {
        let allChores = request.result as Chore[];
        let choresInRange: Chore[] = [];

        // Apply basic filters first
        if (query.title) {
          allChores = allChores.filter(chore => 
            chore.title.toLowerCase().includes(query.title!.toLowerCase())
          );
        }
        if (query.familyMemberId) {
          allChores = allChores.filter(chore => chore.familyMemberId === query.familyMemberId);
        }
        if (query.recurringOnly) {
          allChores = allChores.filter(chore => chore.recurring !== undefined);
        }

        // For each chore, check if it occurs in the requested time range
        const chorePromises = allChores.map(async (chore) => {
          if (chore.recurring) {
            if (query.startDate && query.endDate) {
              // For recurring chores with date range, generate virtual occurrences in the time range
              const occurrences = this.calculateChoreOccurrencesInRange(chore, query.startDate, query.endDate);
              return occurrences;
            } else {
              // For recurring chores without date range, return the original chore
              return [chore];
            }
          } else {
            // For non-recurring chores, check completion status
            return await this.handleNonRecurringChore(chore, query);
          }
        });
        
        const choreResults = await Promise.all(chorePromises);
        choresInRange = choreResults.flat();

        // Apply pagination
        if (query.offset) {
          choresInRange = choresInRange.slice(query.offset);
        }
        if (query.limit) {
          choresInRange = choresInRange.slice(0, query.limit);
        }

          resolve(choresInRange);
        } catch (error) {
          reject(error);
        }
      };

      request.onerror = () => reject(new Error('Failed to query chores'));
    });
  }

  // Calculate chore occurrences within a specific date range for recurring chores
  private calculateChoreOccurrencesInRange(chore: Chore, startDate: Date, endDate: Date): Chore[] {
    if (!chore.recurring) return [];

    switch (chore.recurring.type) {
      case 'daily':
        return [...this.calculateDailyChoreOccurrences(chore, startDate, endDate)];
        break;
      case 'weekly':
        return [...this.calculateWeeklyChoreOccurrences(chore, startDate, endDate)];
        break;
      case 'hourly':
        // Hourly chores might not make as much sense, but we can support them
        return [...this.calculateHourlyChoreOccurrences(chore, startDate, endDate)];
        break;
    }

    return [];
  }

  private calculateDailyChoreOccurrences(chore: Chore, startDate: Date, endDate: Date): Chore[] {
    const occurrences: Chore[] = [];
    const { interval } = chore.recurring as any;
    
    // Start from the chore's creation date or the query start date, whichever is later
    let currentDate = new Date(Math.max(chore.createdAt.getTime(), startDate.getTime()));
    currentDate.setHours(0, 0, 0, 0);
    
    // Calculate days since the original chore to maintain proper interval
    const originalDate = new Date(chore.createdAt);
    originalDate.setHours(0, 0, 0, 0);
    const daysSinceOriginal = Math.floor((currentDate.getTime() - originalDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Adjust to the next valid occurrence based on interval
    const remainder = daysSinceOriginal % interval;
    if (remainder !== 0) {
      currentDate.setDate(currentDate.getDate() + (interval - remainder));
    }

    while (currentDate < endDate) {
      const occurrenceDate = new Date(currentDate);
      
      occurrences.push({
        ...chore,
        id: `${chore.id}_${occurrenceDate.getTime()}`, // Unique ID for this occurrence
        createdAt: occurrenceDate,
        updatedAt: occurrenceDate
      });
      
      currentDate.setDate(currentDate.getDate() + interval);
    }

    return occurrences;
  }

  private calculateWeeklyChoreOccurrences(chore: Chore, startDate: Date, endDate: Date): Chore[] {
    const occurrences: Chore[] = [];
    const { daysOfWeek, interval } = chore.recurring as any;
    
    // Start from the beginning of the week containing the start date
    let currentDate = new Date(startDate);
    currentDate.setDate(currentDate.getDate() - currentDate.getDay()); // Go to Sunday
    currentDate.setHours(0, 0, 0, 0);
    
    // Find the first valid week based on the original chore date and interval
    const originalDate = new Date(chore.createdAt);
    const originalWeekStart = new Date(originalDate);
    originalWeekStart.setDate(originalDate.getDate() - originalDate.getDay());
    originalWeekStart.setHours(0, 0, 0, 0);
    
    const weeksSinceOriginal = Math.floor((currentDate.getTime() - originalWeekStart.getTime()) / (1000 * 60 * 60 * 24 * 7));
    const remainder = weeksSinceOriginal % interval;
    if (remainder !== 0) {
      currentDate.setDate(currentDate.getDate() + (interval - remainder) * 7);
    }

    while (currentDate < endDate) {
      // Check each day of the week for this interval
      for (const dayOfWeek of daysOfWeek) {
        const occurrenceDate = new Date(currentDate);
        occurrenceDate.setDate(currentDate.getDate() + dayOfWeek);
        
        // Skip if this day is outside our query range
        if (occurrenceDate < startDate || occurrenceDate >= endDate) continue;
        
        occurrences.push({
          ...chore,
          id: `${chore.id}_${occurrenceDate.getTime()}`, // Unique ID for this occurrence
          createdAt: occurrenceDate,
          updatedAt: occurrenceDate
        });
      }
      
      // Move to next interval
      currentDate.setDate(currentDate.getDate() + interval * 7);
    }

    return occurrences;
  }

  private calculateHourlyChoreOccurrences(chore: Chore, startDate: Date, endDate: Date): Chore[] {
    const occurrences: Chore[] = [];
    const { startHour, endHour, interval, daysOfWeek } = chore.recurring as any;
    
    let currentDate = new Date(startDate);
    currentDate.setHours(0, 0, 0, 0);

    while (currentDate < endDate) {
      const dayOfWeek = currentDate.getDay();
      
      // Skip this day if it's not in the allowed days of week
      if (daysOfWeek && !daysOfWeek.includes(dayOfWeek)) {
        currentDate.setDate(currentDate.getDate() + 1);
        continue;
      }
      
      // Generate occurrences for each hour in the range
      for (let hour = startHour; hour < endHour; hour += interval) {
        const occurrenceDate = new Date(currentDate);
        occurrenceDate.setHours(hour, 0, 0, 0);
        
        // Only include if the occurrence is within our query range
        if (occurrenceDate >= startDate && occurrenceDate < endDate) {
          occurrences.push({
            ...chore,
            id: `${chore.id}_${occurrenceDate.getTime()}`, // Unique ID for this occurrence
            createdAt: occurrenceDate,
            updatedAt: occurrenceDate
          });
        }
      }
      
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return occurrences;
  }

  // Chore completion methods
  async markChoreComplete(completionData: CreateChoreCompletionData): Promise<ChoreCompletion> {
    if (!databaseService.isInitialized()) throw new Error('Database not initialized');

    const completion: ChoreCompletion = {
      id: this.generateId(),
      choreId: completionData.choreId,
      familyMemberId: completionData.familyMemberId,
      completedAt: new Date(),
      occurrenceDate: completionData.occurrenceDate
    };

    return new Promise((resolve, reject) => {
      const db = databaseService.getDatabase();
      const transaction = db.transaction(['choreCompletions'], 'readwrite');
      const store = transaction.objectStore('choreCompletions');
      const request = store.add(completion);

      request.onsuccess = () => resolve(completion);
      request.onerror = () => reject(new Error('Failed to mark chore complete'));
    });
  }

  async getChoreCompletions(choreId: string, startDate?: Date, endDate?: Date): Promise<ChoreCompletion[]> {
    if (!databaseService.isInitialized()) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const db = databaseService.getDatabase();
      const transaction = db.transaction(['choreCompletions'], 'readonly');
      const store = transaction.objectStore('choreCompletions');
      const index = store.index('choreId');
      const request = index.getAll(IDBKeyRange.only(choreId));

      request.onsuccess = () => {
        let completions = request.result as ChoreCompletion[];
        
        // Apply date filters if provided
        if (startDate) {
          completions = completions.filter(c => c.occurrenceDate >= startDate);
        }
        if (endDate) {
          completions = completions.filter(c => c.occurrenceDate < endDate);
        }
        
        resolve(completions);
      };

      request.onerror = () => reject(new Error('Failed to get chore completions'));
    });
  }

  async isChoreCompleted(choreId: string, occurrenceDate: Date): Promise<boolean> {
    const completions = await this.getChoreCompletions(choreId, occurrenceDate, occurrenceDate);
    return completions.length > 0;
  }

  // Remove chore completion for a specific occurrence
  async removeChoreCompletion(choreId: string, occurrenceDate: Date): Promise<void> {
    if (!databaseService.isInitialized()) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const db = databaseService.getDatabase();
      const transaction = db.transaction(['choreCompletions'], 'readwrite');
      const store = transaction.objectStore('choreCompletions');
      const index = store.index('choreId');
      const request = index.getAll(IDBKeyRange.only(choreId));

      request.onsuccess = () => {
        const completions = request.result as ChoreCompletion[];
        
        // Find completions that match the exact occurrence date/time
        const toDelete = completions.filter(completion => {
          const completionTime = new Date(completion.occurrenceDate);
          return completionTime.getTime() === occurrenceDate.getTime();
        });

        // Delete matching completions
        let deletePromises = toDelete.map(completion => {
          return new Promise<void>((deleteResolve, deleteReject) => {
            const deleteRequest = store.delete(completion.id);
            deleteRequest.onsuccess = () => deleteResolve();
            deleteRequest.onerror = () => deleteReject(new Error('Failed to delete completion'));
          });
        });

        Promise.all(deletePromises)
          .then(() => resolve())
          .catch(reject);
      };

      request.onerror = () => reject(new Error('Failed to get chore completions for deletion'));
    });
  }
}

// Export singleton instance
export const choreStorage = new ChoreStorageService();
