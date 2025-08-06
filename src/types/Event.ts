// Base event interface
export interface Event {
  id: string;
  title: string;
  startTime: Date;
  endTime: Date;
  allDay?: boolean;
  recurring?: RecurringPattern;
  calendarId: string; // Associated calendar ID
  color?: string; // Theme color for the event (can override calendar color)
}

// Recurring pattern types
export type RecurringFrequency = 'none' | 'hourly' | 'daily' | 'weekly';

// Hourly recurrence (between specific hours of the day)
export interface HourlyRecurrence {
  type: 'hourly';
  startHour: number; // 0-23
  endHour: number; // 0-23
  interval: number; // Every X hours (e.g., 2 for every 2 hours)
  daysOfWeek?: number[]; // 0-6 (Sunday-Saturday), optional
}

// Daily recurrence
export interface DailyRecurrence {
  type: 'daily';
  interval: number; // Every X days (e.g., 1 for every day, 2 for every other day)
}

// Weekly recurrence
export interface WeeklyRecurrence {
  type: 'weekly';
  daysOfWeek: number[]; // 0-6 (Sunday-Saturday)
  interval: number; // Every X weeks (e.g., 1 for every week, 2 for every other week)
}


// Union type for all recurring patterns
export type RecurringPattern =
  | HourlyRecurrence
  | DailyRecurrence
  | WeeklyRecurrence;

// Event creation/update DTOs
export interface CreateEventData {
  title: string;
  startTime: Date;
  endTime: Date;
  allDay?: boolean;
  recurring?: RecurringPattern;
  calendarId: string; // Required: must specify which calendar
  color?: string; // Optional: can override calendar color
}

export interface UpdateEventData extends Partial<CreateEventData> {
  id: string;
}

// Event instance (for recurring events)
export interface EventInstance {
  eventId: string;
  startTime: Date;
  endTime: Date;
  isRecurring: boolean;
  originalEventId?: string; // For recurring event instances
}

// Event query/filter interface
export interface EventQuery {
  startDate?: Date;
  endDate?: Date;
  title?: string;
  calendarId?: string; // Filter by specific calendar
  recurringOnly?: boolean;
  limit?: number;
  offset?: number;
}

// Example usage and helper functions
export const createHourlyEvent = (
  title: string,
  calendarId: string,
  startHour: number,
  endHour: number,
  interval: number = 1,
  daysOfWeek?: number[]
): CreateEventData => ({
  title,
  calendarId,
  startTime: new Date(), // Will be adjusted based on recurrence
  endTime: new Date(), // Will be adjusted based on recurrence
  recurring: {
    type: 'hourly',
    startHour,
    endHour,
    interval,
    daysOfWeek
  }
});

export const createDailyEvent = (
  title: string,
  calendarId: string,
  startTime: Date,
  endTime: Date,
  interval: number = 1
): CreateEventData => ({
  title,
  calendarId,
  startTime,
  endTime,
  recurring: {
    type: 'daily',
    interval
  }
});

export const createWeeklyEvent = (
  title: string,
  calendarId: string,
  startTime: Date,
  endTime: Date,
  daysOfWeek: number[],
  interval: number = 1
): CreateEventData => ({
  title,
  calendarId,
  startTime,
  endTime,
  recurring: {
    type: 'weekly',
    daysOfWeek,
    interval
  }
}); 
