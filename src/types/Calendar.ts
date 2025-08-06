export interface Calendar {
  id: string;
  name: string;
  color: string;
}

export interface CreateCalendarData {
  name: string;
  color: string;
}

export interface UpdateCalendarData extends Partial<CreateCalendarData> {
  id: string;
} 
