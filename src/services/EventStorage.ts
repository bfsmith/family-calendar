import { Event, CreateEventData, UpdateEventData, EventQuery, EventInstance, HourlyRecurrence, WeeklyRecurrence } from '../types/Event';
import { databaseService } from './DatabaseService';

class EventStorageService {
  constructor() {
    // Register upgrade procedure for events
    databaseService.registerUpgradeProcedure(this.createEventStores.bind(this));
    console.log("EventStorageService registered");
  }

  // Initialize the database
  async init(): Promise<void> {
    return databaseService.init();
  }

  // Create event-related object stores
  private createEventStores(db: IDBDatabase): void {
    console.log("Creating event stores");
    // Create events store
    if (!db.objectStoreNames.contains('events')) {
      const eventStore = db.createObjectStore('events', { keyPath: 'id' });
      eventStore.createIndex('startTime', 'startTime', { unique: false });
      eventStore.createIndex('endTime', 'endTime', { unique: false });
      eventStore.createIndex('recurring', 'recurring.type', { unique: false });
      eventStore.createIndex('calendarId', 'calendarId', { unique: false });
    }

    // Create event instances store for recurring events
    if (!db.objectStoreNames.contains('eventInstances')) {
      const instanceStore = db.createObjectStore('eventInstances', { keyPath: 'id' });
      instanceStore.createIndex('eventId', 'eventId', { unique: false });
      instanceStore.createIndex('startTime', 'startTime', { unique: false });
      instanceStore.createIndex('endTime', 'endTime', { unique: false });
    }
  }

  // Generate unique ID
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }

  // Create a new event
  async createEvent(eventData: CreateEventData): Promise<Event> {
    if (!databaseService.isInitialized()) throw new Error('Database not initialized');

    const event: Event = {
      id: this.generateId(),
      title: eventData.title,
      startTime: eventData.startTime,
      endTime: eventData.endTime,
      allDay: eventData.allDay || false,
      recurring: eventData.recurring,
      calendarId: eventData.calendarId,
      color: eventData.color // Don't set default, let calendar color be used
    };

    return new Promise((resolve, reject) => {
      const db = databaseService.getDatabase();
      const transaction = db.transaction(['events'], 'readwrite');
      const store = transaction.objectStore('events');
      const request = store.add(event);

      request.onsuccess = () => {
        // If it's a recurring event, generate instances
        if (event.recurring) {
          this.generateEventInstances(event).catch(console.error);
        }
        resolve(event);
      };

      request.onerror = () => reject(new Error('Failed to create event'));
    });
  }

  // Get a single event by ID
  async getEvent(id: string): Promise<Event | null> {
    if (!databaseService.isInitialized()) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const db = databaseService.getDatabase();
      const transaction = db.transaction(['events'], 'readonly');
      const store = transaction.objectStore('events');
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(new Error('Failed to get event'));
    });
  }

  // Update an existing event
  async updateEvent(updateData: UpdateEventData): Promise<Event> {
    if (!databaseService.isInitialized()) throw new Error('Database not initialized');

    const existingEvent = await this.getEvent(updateData.id);
    if (!existingEvent) throw new Error('Event not found');

    const updatedEvent: Event = {
      ...existingEvent,
      ...updateData,
      id: updateData.id // Ensure ID doesn't change
    };

    return new Promise((resolve, reject) => {
      const db = databaseService.getDatabase();
      const transaction = db.transaction(['events'], 'readwrite');
      const store = transaction.objectStore('events');
      const request = store.put(updatedEvent);

      request.onsuccess = () => {
        // Regenerate instances if recurring pattern changed
        if (updatedEvent.recurring) {
          this.deleteEventInstances(updateData.id).then(() => {
            this.generateEventInstances(updatedEvent).catch(console.error);
          }).catch(console.error);
        }
        resolve(updatedEvent);
      };

      request.onerror = () => reject(new Error('Failed to update event'));
    });
  }

  // Delete an event
  async deleteEvent(id: string): Promise<void> {
    if (!databaseService.isInitialized()) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const db = databaseService.getDatabase();
      const transaction = db.transaction(['events', 'eventInstances'], 'readwrite');
      const eventStore = transaction.objectStore('events');
      const instanceStore = transaction.objectStore('eventInstances');

      // Delete the event
      const eventRequest = eventStore.delete(id);
      
      // Delete associated instances
      const instanceIndex = instanceStore.index('eventId');
      const instanceRequest = instanceIndex.openCursor(IDBKeyRange.only(id));
      
      instanceRequest.onsuccess = () => {
        const cursor = instanceRequest.result;
        if (cursor) {
          instanceStore.delete(cursor.primaryKey);
          cursor.continue();
        }
      };

      eventRequest.onsuccess = () => resolve();
      eventRequest.onerror = () => reject(new Error('Failed to delete event'));
    });
  }

  // Query events with filters and dynamic recurring event calculation
  async queryEvents(query: EventQuery = {}): Promise<Event[]> {
    if (!databaseService.isInitialized()) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const db = databaseService.getDatabase();
      const transaction = db.transaction(['events'], 'readonly');
      const store = transaction.objectStore('events');
      const request = store.getAll();

      request.onsuccess = () => {
        let allEvents = request.result as Event[];
        let eventsInRange: Event[] = [];

        // Apply basic filters first
        if (query.title) {
          allEvents = allEvents.filter(event => 
            event.title.toLowerCase().includes(query.title!.toLowerCase())
          );
        }
        if (query.calendarId) {
          allEvents = allEvents.filter(event => event.calendarId === query.calendarId);
        }
        if (query.recurringOnly) {
          allEvents = allEvents.filter(event => event.recurring !== undefined);
        }

        // For each event, check if it occurs in the requested time range
        for (const event of allEvents) {
          if (event.recurring && query.startDate && query.endDate) {
            // For recurring events, generate virtual occurrences in the time range
            const occurrences = this.calculateEventOccurrencesInRange(event, query.startDate, query.endDate);
            eventsInRange.push(...occurrences);
          } else {
            // For non-recurring events, apply date filters normally
            let includeEvent = true;
            
            if (query.startDate && event.endTime < query.startDate) {
              includeEvent = false;
            }
            if (query.endDate && event.startTime > query.endDate) {
              includeEvent = false;
            }
            
            if (includeEvent) {
              eventsInRange.push(event);
            }
          }
        }

        // Apply pagination
        if (query.offset) {
          eventsInRange = eventsInRange.slice(query.offset);
        }
        if (query.limit) {
          eventsInRange = eventsInRange.slice(0, query.limit);
        }

        resolve(eventsInRange);
      };

      request.onerror = () => reject(new Error('Failed to query events'));
    });
  }

  // Calculate event occurrences within a specific date range for recurring events
  private calculateEventOccurrencesInRange(event: Event, startDate: Date, endDate: Date): Event[] {
    if (!event.recurring) return [];

    const occurrences: Event[] = [];
    
    switch (event.recurring.type) {
      case 'daily':
        occurrences.push(...this.calculateDailyOccurrences(event, startDate, endDate));
        break;
      case 'weekly':
        occurrences.push(...this.calculateWeeklyOccurrences(event, startDate, endDate));
        break;
      case 'hourly':
        occurrences.push(...this.calculateHourlyOccurrences(event, startDate, endDate));
        break;
    }

    return occurrences;
  }

  private calculateDailyOccurrences(event: Event, startDate: Date, endDate: Date): Event[] {
    const occurrences: Event[] = [];
    const { interval } = event.recurring as DailyRecurrence;
    
    // Start from the event's original date or the query start date, whichever is later
    let currentDate = new Date(Math.max(event.startTime.getTime(), startDate.getTime()));
    currentDate.setHours(0, 0, 0, 0); // Start at beginning of day
    
    // Calculate days since the original event to maintain proper interval
    const originalDate = new Date(event.startTime);
    originalDate.setHours(0, 0, 0, 0);
    const daysSinceOriginal = Math.floor((currentDate.getTime() - originalDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Adjust to the next valid occurrence based on interval
    const remainder = daysSinceOriginal % interval;
    if (remainder !== 0) {
      currentDate.setDate(currentDate.getDate() + (interval - remainder));
    }

    while (currentDate <= endDate) {
      const occurrenceStart = new Date(currentDate);
      occurrenceStart.setHours(event.startTime.getHours(), event.startTime.getMinutes(), 0, 0);
      
      const occurrenceEnd = new Date(currentDate);
      occurrenceEnd.setHours(event.endTime.getHours(), event.endTime.getMinutes(), 0, 0);
      
      // Only include if the occurrence overlaps with our query range
      if (occurrenceEnd >= startDate && occurrenceStart <= endDate) {
        occurrences.push({
          ...event,
          startTime: occurrenceStart,
          endTime: occurrenceEnd,
          id: `${event.id}_${occurrenceStart.getTime()}` // Unique ID for this occurrence
        });
      }
      
      currentDate.setDate(currentDate.getDate() + interval);
    }

    return occurrences;
  }

  private calculateWeeklyOccurrences(event: Event, startDate: Date, endDate: Date): Event[] {
    const occurrences: Event[] = [];
    const { daysOfWeek, interval } = event.recurring as WeeklyRecurrence;
    
    // Start from the beginning of the week containing the start date
    let currentDate = new Date(startDate);
    currentDate.setDate(currentDate.getDate() - currentDate.getDay()); // Go to Sunday
    currentDate.setHours(0, 0, 0, 0);
    
    // Find the first valid week based on the original event date and interval
    const originalDate = new Date(event.startTime);
    const originalWeekStart = new Date(originalDate);
    originalWeekStart.setDate(originalDate.getDate() - originalDate.getDay());
    originalWeekStart.setHours(0, 0, 0, 0);
    
    const weeksSinceOriginal = Math.floor((currentDate.getTime() - originalWeekStart.getTime()) / (1000 * 60 * 60 * 24 * 7));
    const remainder = weeksSinceOriginal % interval;
    if (remainder !== 0) {
      currentDate.setDate(currentDate.getDate() + (interval - remainder) * 7);
    }

    while (currentDate <= endDate) {
      // Check each day of the week for this interval
      for (const dayOfWeek of daysOfWeek) {
        const occurrenceDate = new Date(currentDate);
        occurrenceDate.setDate(currentDate.getDate() + dayOfWeek);
        
        // Skip if this day is outside our query range
        if (occurrenceDate < startDate || occurrenceDate > endDate) continue;
        
        const occurrenceStart = new Date(occurrenceDate);
        occurrenceStart.setHours(event.startTime.getHours(), event.startTime.getMinutes(), 0, 0);
        
        const occurrenceEnd = new Date(occurrenceDate);
        occurrenceEnd.setHours(event.endTime.getHours(), event.endTime.getMinutes(), 0, 0);
        
        occurrences.push({
          ...event,
          startTime: occurrenceStart,
          endTime: occurrenceEnd,
          id: `${event.id}_${occurrenceStart.getTime()}` // Unique ID for this occurrence
        });
      }
      
      // Move to next interval
      currentDate.setDate(currentDate.getDate() + interval * 7);
    }

    return occurrences;
  }

  private calculateHourlyOccurrences(event: Event, startDate: Date, endDate: Date): Event[] {
    const occurrences: Event[] = [];
    const { startHour, endHour, interval, daysOfWeek } = event.recurring as HourlyRecurrence;
    
    let currentDate = new Date(startDate);
    currentDate.setHours(0, 0, 0, 0);

    while (currentDate <= endDate) {
      const dayOfWeek = currentDate.getDay();
      
      // Skip this day if it's not in the allowed days of week
      if (daysOfWeek && !daysOfWeek.includes(dayOfWeek)) {
        currentDate.setDate(currentDate.getDate() + 1);
        continue;
      }
      
      // Generate occurrences for each hour in the range
      for (let hour = startHour; hour < endHour; hour += interval) {
        const occurrenceStart = new Date(currentDate);
        occurrenceStart.setHours(hour, event.startTime.getMinutes(), 0, 0);
        
        const occurrenceEnd = new Date(occurrenceStart);
        occurrenceEnd.setTime(occurrenceStart.getTime() + (event.endTime.getTime() - event.startTime.getTime()));
        
        // Only include if the occurrence overlaps with our query range
        if (occurrenceEnd >= startDate && occurrenceStart <= endDate) {
          occurrences.push({
            ...event,
            startTime: occurrenceStart,
            endTime: occurrenceEnd,
            id: `${event.id}_${occurrenceStart.getTime()}` // Unique ID for this occurrence
          });
        }
      }
      
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return occurrences;
  }

  // Get events for a specific date range (for calendar view)
  async getEventsForDateRange(startDate: Date, endDate: Date): Promise<EventInstance[]> {
    if (!databaseService.isInitialized()) throw new Error('Database not initialized');

    // Use the new dynamic query system which handles recurring events automatically
    const events = await this.queryEvents({ startDate, endDate });
    const instances: EventInstance[] = [];

    for (const event of events) {
      // Convert each event (including dynamically generated recurring occurrences) to an EventInstance
      instances.push({
        eventId: event.id.includes('_') ? event.id.split('_')[0] : event.id, // Extract original event ID
        startTime: event.startTime,
        endTime: event.endTime,
        isRecurring: !!event.recurring || event.id.includes('_') // True if original has recurrence or this is a generated occurrence
      });
    }

    return instances.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  }

  // Generate instances for recurring events
  private async generateEventInstances(event: Event): Promise<void> {
    if (!event.recurring || !databaseService.isInitialized()) return;

    const instances = this.calculateRecurringInstances(event);
    
    const db = databaseService.getDatabase();
    const transaction = db.transaction(['eventInstances'], 'readwrite');
    const store = transaction.objectStore('eventInstances');

    // Clear existing instances for this event
    await this.deleteEventInstances(event.id);

    // Add new instances
    for (const instance of instances) {
      store.add(instance);
    }
  }

  // Calculate recurring event instances
  private calculateRecurringInstances(event: Event): EventInstance[] {
    if (!event.recurring) return [];

    const instances: EventInstance[] = [];
    const startDate = new Date(event.startTime);
    const endDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year from now

    switch (event.recurring.type) {
      case 'hourly':
        instances.push(...this.calculateHourlyInstances(event, startDate, endDate));
        break;
      case 'daily':
        instances.push(...this.calculateDailyInstances(event, startDate, endDate));
        break;
      case 'weekly':
        instances.push(...this.calculateWeeklyInstances(event, startDate, endDate));
        break;
    }

    return instances;
  }

  private calculateHourlyInstances(event: Event, startDate: Date, endDate: Date): EventInstance[] {
    const instances: EventInstance[] = [];
    const { startHour, endHour, interval, daysOfWeek } = event.recurring! as HourlyRecurrence;
    
    let currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const dayOfWeek = currentDate.getDay();
      
      if (!daysOfWeek || daysOfWeek.includes(dayOfWeek)) {
        for (let hour = startHour; hour < endHour; hour += interval) {
          const instanceStart = new Date(currentDate);
          instanceStart.setHours(hour, 0, 0, 0);
          
          const instanceEnd = new Date(instanceStart);
          instanceEnd.setHours(hour + 1, 0, 0, 0);
          
          if (instanceStart >= startDate && instanceStart <= endDate) {
            instances.push({
              eventId: event.id,
              startTime: instanceStart,
              endTime: instanceEnd,
              isRecurring: true,
              originalEventId: event.id
            });
          }
        }
      }
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return instances;
  }

  private calculateDailyInstances(event: Event, startDate: Date, endDate: Date): EventInstance[] {
    const instances: EventInstance[] = [];
    const { interval } = event.recurring!;
    
    let currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const instanceStart = new Date(currentDate);
      instanceStart.setHours(
        event.startTime.getHours(),
        event.startTime.getMinutes(),
        0,
        0
      );
      
      const instanceEnd = new Date(currentDate);
      instanceEnd.setHours(
        event.endTime.getHours(),
        event.endTime.getMinutes(),
        0,
        0
      );
      
      instances.push({
        eventId: event.id,
        startTime: instanceStart,
        endTime: instanceEnd,
        isRecurring: true,
        originalEventId: event.id
      });
      
      currentDate.setDate(currentDate.getDate() + interval);
    }
    
    return instances;
  }

  private calculateWeeklyInstances(event: Event, startDate: Date, endDate: Date): EventInstance[] {
    const instances: EventInstance[] = [];
    const { daysOfWeek, interval } = event.recurring! as WeeklyRecurrence;
    
    let currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      for (const dayOfWeek of daysOfWeek) {
        const targetDate = new Date(currentDate);
        const daysToAdd = (dayOfWeek - currentDate.getDay() + 7) % 7;
        targetDate.setDate(currentDate.getDate() + daysToAdd);
        
        if (targetDate >= startDate && targetDate <= endDate) {
          const instanceStart = new Date(targetDate);
          instanceStart.setHours(
            event.startTime.getHours(),
            event.startTime.getMinutes(),
            0,
            0
          );
          
          const instanceEnd = new Date(targetDate);
          instanceEnd.setHours(
            event.endTime.getHours(),
            event.endTime.getMinutes(),
            0,
            0
          );
          
          instances.push({
            eventId: event.id,
            startTime: instanceStart,
            endTime: instanceEnd,
            isRecurring: true,
            originalEventId: event.id
          });
        }
      }
      
      currentDate.setDate(currentDate.getDate() + (7 * interval));
    }
    
    return instances;
  }

  // Get event instances for a specific event and date range
  private async getEventInstances(eventId: string, startDate: Date, endDate: Date): Promise<EventInstance[]> {
    if (!databaseService.isInitialized()) return [];

    return new Promise((resolve, reject) => {
      const db = databaseService.getDatabase();
      const transaction = db.transaction(['eventInstances'], 'readonly');
      const store = transaction.objectStore('eventInstances');
      const index = store.index('eventId');
      const request = index.getAll(IDBKeyRange.only(eventId));

      request.onsuccess = () => {
        const instances = request.result as EventInstance[];
        const filteredInstances = instances.filter(instance => 
          instance.startTime >= startDate && instance.startTime <= endDate
        );
        resolve(filteredInstances);
      };

      request.onerror = () => reject(new Error('Failed to get event instances'));
    });
  }

  // Delete all instances for a specific event
  private async deleteEventInstances(eventId: string): Promise<void> {
    if (!databaseService.isInitialized()) return;

    return new Promise((resolve, reject) => {
      const db = databaseService.getDatabase();
      const transaction = db.transaction(['eventInstances'], 'readwrite');
      const store = transaction.objectStore('eventInstances');
      const index = store.index('eventId');
      const request = index.openCursor(IDBKeyRange.only(eventId));

      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          store.delete(cursor.primaryKey);
          cursor.continue();
        } else {
          resolve();
        }
      };

      request.onerror = () => reject(new Error('Failed to delete event instances'));
    });
  }

  // Clear all data (for testing/reset)
  async clearAll(): Promise<void> {
    if (!databaseService.isInitialized()) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const db = databaseService.getDatabase();
      const transaction = db.transaction(['events', 'eventInstances'], 'readwrite');
      const eventStore = transaction.objectStore('events');
      const instanceStore = transaction.objectStore('eventInstances');

      const eventRequest = eventStore.clear();
      const instanceRequest = instanceStore.clear();

      Promise.all([
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
export const eventStorage = new EventStorageService(); 
