import { Calendar, CreateCalendarData, UpdateCalendarData } from '../types/Calendar';
import { databaseService } from './DatabaseService';

class CalendarStorageService {
  constructor() {
    // Register upgrade procedure for calendars
    databaseService.registerUpgradeProcedure(this.createCalendarStores.bind(this));
    console.log("CalendarStorageService registered");
  }

  // Initialize the database
  async init(): Promise<void> {
    return databaseService.init();
  }

  // Create calendar-related object stores
  private createCalendarStores(db: IDBDatabase): void {
    console.log("Creating calendar stores");
    // Create calendars store
    if (!db.objectStoreNames.contains('calendars')) {
      const calendarStore = db.createObjectStore('calendars', { keyPath: 'id' });
      calendarStore.createIndex('name', 'name', { unique: false });
    }
  }

  // Generate unique ID
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }

  // Create a new calendar
  async createCalendar(calendarData: CreateCalendarData): Promise<Calendar> {
    if (!databaseService.isInitialized()) throw new Error('Database not initialized');

    const calendar: Calendar = {
      id: this.generateId(),
      name: calendarData.name,
      color: calendarData.color
    };

    return new Promise((resolve, reject) => {
      const db = databaseService.getDatabase();
      const transaction = db.transaction(['calendars'], 'readwrite');
      const store = transaction.objectStore('calendars');
      const request = store.add(calendar);

      request.onsuccess = () => resolve(calendar);
      request.onerror = () => reject(new Error('Failed to create calendar'));
    });
  }

  // Get a single calendar by ID
  async getCalendar(id: string): Promise<Calendar | null> {
    if (!databaseService.isInitialized()) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const db = databaseService.getDatabase();
      const transaction = db.transaction(['calendars'], 'readonly');
      const store = transaction.objectStore('calendars');
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(new Error('Failed to get calendar'));
    });
  }

  // Get all calendars
  async getAllCalendars(): Promise<Calendar[]> {
    if (!databaseService.isInitialized()) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const db = databaseService.getDatabase();
      const transaction = db.transaction(['calendars'], 'readonly');
      const store = transaction.objectStore('calendars');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(new Error('Failed to get calendars'));
    });
  }

  // Update an existing calendar
  async updateCalendar(updateData: UpdateCalendarData): Promise<Calendar> {
    if (!databaseService.isInitialized()) throw new Error('Database not initialized');

    const existingCalendar = await this.getCalendar(updateData.id);
    if (!existingCalendar) throw new Error('Calendar not found');

    const updatedCalendar: Calendar = {
      ...existingCalendar,
      ...updateData,
      id: updateData.id // Ensure ID doesn't change
    };

    return new Promise((resolve, reject) => {
      const db = databaseService.getDatabase();
      const transaction = db.transaction(['calendars'], 'readwrite');
      const store = transaction.objectStore('calendars');
      const request = store.put(updatedCalendar);

      request.onsuccess = () => resolve(updatedCalendar);
      request.onerror = () => reject(new Error('Failed to update calendar'));
    });
  }

  // Delete a calendar and all its associated events
  async deleteCalendar(id: string): Promise<void> {
    if (!databaseService.isInitialized()) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const db = databaseService.getDatabase();
      const transaction = db.transaction(['calendars', 'events', 'eventInstances'], 'readwrite');
      const calendarStore = transaction.objectStore('calendars');
      const eventStore = transaction.objectStore('events');
      const instanceStore = transaction.objectStore('eventInstances');

      // Delete the calendar
      const calendarRequest = calendarStore.delete(id);
      
      // Delete all events associated with this calendar
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

      calendarRequest.onsuccess = () => resolve();
      calendarRequest.onerror = () => reject(new Error('Failed to delete calendar'));
    });
  }

  // Get calendar by name
  async getCalendarByName(name: string): Promise<Calendar | null> {
    if (!databaseService.isInitialized()) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const db = databaseService.getDatabase();
      const transaction = db.transaction(['calendars'], 'readonly');
      const store = transaction.objectStore('calendars');
      const index = store.index('name');
      const request = index.get(name);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(new Error('Failed to get calendar by name'));
    });
  }

  // Check if calendar name exists
  async calendarNameExists(name: string, excludeId?: string): Promise<boolean> {
    if (!databaseService.isInitialized()) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const db = databaseService.getDatabase();
      const transaction = db.transaction(['calendars'], 'readonly');
      const store = transaction.objectStore('calendars');
      const index = store.index('name');
      const request = index.getAll(IDBKeyRange.only(name));

      request.onsuccess = () => {
        const calendars = request.result as Calendar[];
        const exists = calendars.some(calendar => 
          calendar.name === name && (!excludeId || calendar.id !== excludeId)
        );
        resolve(exists);
      };

      request.onerror = () => reject(new Error('Failed to check calendar name'));
    });
  }

  // Create default calendars if none exist
  async createDefaultCalendars(): Promise<void> {
    const existingCalendars = await this.getAllCalendars();
    
    if (existingCalendars.length === 0) {
      const defaultCalendars: CreateCalendarData[] = [
        { name: 'Personal', color: 'primary' },
        { name: 'Work', color: 'secondary' },
        { name: 'Family', color: 'accent' }
      ];

      for (const calendarData of defaultCalendars) {
        await this.createCalendar(calendarData);
      }
    }
  }

  // Clear all calendars (for testing/reset)
  async clearAll(): Promise<void> {
    if (!databaseService.isInitialized()) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const db = databaseService.getDatabase();
      const transaction = db.transaction(['calendars', 'events', 'eventInstances'], 'readwrite');
      const calendarStore = transaction.objectStore('calendars');
      const eventStore = transaction.objectStore('events');
      const instanceStore = transaction.objectStore('eventInstances');

      const calendarRequest = calendarStore.clear();
      const eventRequest = eventStore.clear();
      const instanceRequest = instanceStore.clear();

      Promise.all([
        new Promise<void>((res, rej) => {
          calendarRequest.onsuccess = () => res();
          calendarRequest.onerror = () => rej(new Error('Failed to clear calendars'));
        }),
        new Promise<void>((res, rej) => {
          eventRequest.onsuccess = () => res();
          eventRequest.onerror = () => rej(new Error('Failed to clear events'));
        }),
        new Promise<void>((res, rej) => {
          instanceRequest.onsuccess = () => res();
          instanceRequest.onerror = () => rej(new Error('Failed to clear instances'));
        })
      ]).then(() => resolve()).catch(reject);
    });
  }
}

// Export singleton instance
export const calendarStorage = new CalendarStorageService(); 
