import type { RecurringPattern } from './Event';

// Base chore interface
export interface Chore {
  id: string;
  title: string;
  familyMemberId: string; // Associated family member ID
  icon?: string; // Font Awesome icon name (e.g., "fa-broom", "fa-dishes")
  recurring?: RecurringPattern; // Same recurrence patterns as events
  createdAt: Date;
  updatedAt: Date;
}

// Chore creation/update DTOs
export interface CreateChoreData {
  title: string;
  familyMemberId: string; // Required: must specify which family member
  icon?: string; // Optional: Font Awesome icon name
  recurring?: RecurringPattern; // Optional: recurrence pattern
}

export interface UpdateChoreData extends Partial<CreateChoreData> {
  id: string;
}

// Chore query/filter interface
export interface ChoreQuery {
  startDate?: Date;
  endDate?: Date;
  title?: string;
  familyMemberId?: string; // Filter by specific family member
  recurringOnly?: boolean;
  includeAllNonRecurring?: boolean; // Include all non-recurring chores regardless of completion status
  limit?: number;
  offset?: number;
}

// Chore completion tracking
export interface ChoreCompletion {
  id: string;
  choreId: string;
  familyMemberId: string; // Who completed it (might be different from assigned)
  completedAt: Date;
  occurrenceDate: Date; // For recurring chores, which occurrence was completed
}

export interface CreateChoreCompletionData {
  choreId: string;
  familyMemberId: string;
  occurrenceDate: Date;
}

// Helper functions for creating chores with different recurrence patterns
export const createDailyChore = (
  title: string,
  familyMemberId: string,
  interval: number = 1,
  icon?: string
): CreateChoreData => ({
  title,
  familyMemberId,
  icon,
  recurring: {
    type: 'daily',
    interval
  }
});

export const createWeeklyChore = (
  title: string,
  familyMemberId: string,
  daysOfWeek: number[],
  interval: number = 1,
  icon?: string
): CreateChoreData => ({
  title,
  familyMemberId,
  icon,
  recurring: {
    type: 'weekly',
    daysOfWeek,
    interval
  }
});

// Common chore icons
export const CHORE_ICONS = {
  cleaning: 'fa-broom',
  dishes: 'fa-utensils',
  laundry: 'fa-tshirt',
  trash: 'fa-trash',
  vacuum: 'fa-vacuum',
  bathroom: 'fa-toilet',
  kitchen: 'fa-kitchen-set',
  bedroom: 'fa-bed',
  garden: 'fa-seedling',
  car: 'fa-car',
  shopping: 'fa-shopping-cart',
  cooking: 'fa-chef-hat',
  pets: 'fa-dog',
  homework: 'fa-book',
  sports: 'fa-basketball',
  music: 'fa-music'
} as const;
