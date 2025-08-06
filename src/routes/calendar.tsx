import { createSignal, onMount } from "solid-js";
import CreateCalendarDialog from "../components/CreateCalendarDialog";
import CreateEventDialog from "../components/CreateEventDialog";
import { calendarStorage } from "../services/CalendarStorage";
import { eventStorage } from "../services/EventStorage";
import type { Calendar } from "../types/Calendar";
import type { Event } from "../types/Event";

export default function Calendar() {
  const [currentHour, setCurrentHour] = createSignal(0);
  const [currentMinute, setCurrentMinute] = createSignal(0);
  const [showCalendarDialog, setShowCalendarDialog] = createSignal(false);
  const [showEventDialog, setShowEventDialog] = createSignal(false);
  const [calendars, setCalendars] = createSignal<Calendar[]>([]);
  const [events, setEvents] = createSignal<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = createSignal<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = createSignal(false);
  const [eventToDelete, setEventToDelete] = createSignal<Event | null>(null);
  
  // Generate hours from 6 AM to 12 AM (midnight)
  const hours = Array.from({ length: 19 }, (_, i) => i + 6);
  
  const formatHour = (hour: number) => {
    if (hour === 12) return "12 PM";
    if (hour === 24) return "12 AM";
    if (hour > 12) return `${hour - 12} PM`;
    return `${hour} AM`;
  };

  const isCurrentHour = (hour: number) => {
    const now = new Date();
    const currentHour24 = now.getHours();
    return hour === currentHour24;
  };

  const getCurrentTimePosition = () => {
    const now = new Date();
    const minutes = now.getMinutes();
    return (minutes / 60) * 100; // Percentage within the hour
  };

  const openCalendarDialog = () => {
    setShowCalendarDialog(true);
  };

  const closeCalendarDialog = () => {
    setShowCalendarDialog(false);
  };

  const openEventDialog = () => {
    setShowEventDialog(true);
  };

  const closeEventDialog = () => {
    setShowEventDialog(false);
  };

  const loadCalendars = async () => {
    try {
      const allCalendars = await calendarStorage.getAllCalendars();
      setCalendars(allCalendars);
    } catch (error) {
      console.error("Failed to load calendars:", error);
    }
  };

  const loadEvents = async () => {
    try {
      // Get today's events (you can modify this to show different date ranges)
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
      
      const allEvents = await eventStorage.queryEvents({
        startDate: startOfDay,
        endDate: endOfDay
      });
      setEvents(allEvents);
    } catch (error) {
      console.error("Failed to load events:", error);
    }
  };

  const handleCalendarCreated = () => {
    loadCalendars(); // Reload calendars after creating a new one
  };

  const handleEventCreated = () => {
    loadEvents(); // Reload events after creating a new one
  };

  const handleEventClick = (event: Event, e: MouseEvent) => {
    e.stopPropagation(); // Prevent deselection
    setSelectedEventId(event.id);
  };

  const handleDeleteClick = (event: Event, e: MouseEvent) => {
    e.stopPropagation(); // Prevent event selection
    setEventToDelete(event);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    const event = eventToDelete();
    if (!event) return;

    try {
      await eventStorage.deleteEvent(event.id);
      setShowDeleteDialog(false);
      setEventToDelete(null);
      setSelectedEventId(null);
      loadEvents(); // Reload events after deletion
    } catch (error) {
      console.error("Failed to delete event:", error);
      alert("Failed to delete event. Please try again.");
    }
  };

  const cancelDelete = () => {
    setShowDeleteDialog(false);
    setEventToDelete(null);
  };

  // Helper function to get events for a specific calendar
  const getEventsForCalendar = (calendarId: string) => {
    return events().filter(event => event.calendarId === calendarId);
  };

  // Helper function to calculate event position and height
  const getEventStyle = (event: Event) => {
    const startHour = event.startTime.getHours();
    const startMinute = event.startTime.getMinutes();
    const endHour = event.endTime.getHours();
    const endMinute = event.endTime.getMinutes();
    
    // Calculate position from 6 AM (index 0)
    const startOffset = (startHour - 6) + (startMinute / 60);
    const endOffset = (endHour - 6) + (endMinute / 60);
    
    // Each hour slot is 64px (h-16 = 4rem = 64px)
    const pixelsPerHour = 64;
    const top = startOffset * pixelsPerHour;
    const height = (endOffset - startOffset) * pixelsPerHour;
    
    return {
      top: `${top}px`,
      height: `${Math.max(height, 20)}px`, // Minimum height of 20px
      position: "absolute" as const,
      left: "4px",
      right: "4px",
      "z-index": "20"
    };
  };

  // Helper function to check if event is within visible hours (6 AM - 12 AM)
  const isEventVisible = (event: Event) => {
    const startHour = event.startTime.getHours();
    const endHour = event.endTime.getHours();
    return (startHour >= 6 && startHour <= 24) || (endHour >= 6 && endHour <= 24);
  };

  onMount(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentHour(now.getHours());
      setCurrentMinute(now.getMinutes());
    };
    
    updateTime();
    const interval = setInterval(updateTime, 60000); // Update every minute
    
    // Load calendars and events on mount
    loadCalendars();
    loadEvents();
    
    return () => clearInterval(interval);
  });

  return (
    <main class="p-4" onClick={() => setSelectedEventId(null)}>
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-3xl font-bold text-primary">Calendar</h1>
        <div class="flex gap-2">
          <button class="btn btn-primary" onClick={openEventDialog}>
            Add Event
          </button>
          <button class="btn btn-secondary" onClick={openCalendarDialog}>
            Add Calendar
          </button>
        </div>
      </div>
      
      <div class="flex overflow-x-auto">
        {/* Time column */}
        <div class="w-20 flex-shrink-0 border-r border-base-300">
          <div class="h-12 border-b border-base-300 flex items-center justify-center text-sm font-medium text-base-content">
            Time
          </div>
          {hours.map((hour) => (
            <div 
              class="h-16 border-b border-base-300 flex items-center justify-center text-xs text-base-content/70"
            >
              {formatHour(hour)}
            </div>
          ))}
        </div>
        
        {/* Calendar columns */}
        {calendars().length > 0 ? (
          calendars().map((calendar) => {
            const calendarEvents = getEventsForCalendar(calendar.id);
            return (
              <div class="flex-1 min-w-48 border-r border-base-300 last:border-r-0 relative">
                <div 
                  class="h-12 border-b border-base-300 flex items-center justify-center text-sm font-medium text-base-content"
                  style={{ "background-color": calendar.color + "20" }}
                >
                  <div 
                    class="w-3 h-3 rounded-full mr-2"
                    style={{ "background-color": calendar.color }}
                  ></div>
                  {calendar.name}
                  {calendarEvents.length > 0 && (
                    <span class="ml-2 badge badge-xs badge-primary">
                      {calendarEvents.length}
                    </span>
                  )}
                </div>
                
                {/* Time slots container */}
                <div class="relative">
                  {hours.map((hour) => (
                    <div 
                      class={`h-16 border-b border-base-300 hover:bg-base-200/50 cursor-pointer transition-colors relative`}
                      style={{ "background-color": calendar.color + "05" }}
                    >
                      {/* Current time indicator */}
                      {isCurrentHour(hour) && (
                        <div 
                          class="absolute left-0 right-0 border-t-2 z-30"
                          style={{ 
                            top: `${getCurrentTimePosition()}%`,
                            "border-color": calendar.color,
                            "background-color": calendar.color + "20"
                          }}
                        >
                          <div 
                            class="w-3 h-3 rounded-full -mt-1.5 ml-2"
                            style={{ "background-color": calendar.color }}
                          ></div>
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {/* Events overlay */}
                  {calendarEvents
                    .filter(event => isEventVisible(event))
                    .map((event) => (
                      <div
                        class="rounded-md p-1 min-h-6 text-xs font-medium shadow-sm border-l-4 cursor-pointer hover:shadow-md transition-shadow relative"
                        style={{
                          ...getEventStyle(event),
                          "background-color": (event.color || calendar.color) + "40",
                          "border-left-color": event.color || calendar.color,
                          color: "white",
                          "text-shadow": "0 1px 2px rgba(0,0,0,0.5)"
                        }}
                        title={`${event.title}\n${event.startTime.toLocaleTimeString()} - ${event.endTime.toLocaleTimeString()}`}
                        onClick={(e) => handleEventClick(event, e)}
                      >
                        <div class="flex items-center gap-1">
                          <div class="truncate font-semibold">{event.title}</div>
                          {!event.allDay && (
                            <>
                              <div class="">|</div>
                              <div class="text-xs opacity-90 whitespace-nowrap">
                                {event.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}-{event.endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </>
                          )}
                        </div>
                        
                        {/* Delete button - only show when event is selected */}
                        {selectedEventId() === event.id && (
                          <button
                            class="absolute top-0 right-0 p-1 mr-1 mt-1 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-colors cursor-pointer"
                            onClick={(e) => handleDeleteClick(event, e)}
                            title="Delete event"
                          >
                            <i class="fas fa-trash text-white text-xs"></i>
                          </button>
                        )}
                      </div>
                    ))
                  }
                </div>
              </div>
            );
          })
        ) : (
          <div class="flex-1 flex items-center justify-center text-base-content/50 py-20">
            <div class="text-center">
              <p class="text-lg mb-2">No calendars found</p>
              <p class="text-sm">Click "Add Calendar" to create your first calendar</p>
            </div>
          </div>
        )}
      </div>

      <CreateCalendarDialog 
        show={showCalendarDialog()} 
        onClose={closeCalendarDialog}
        onSuccess={handleCalendarCreated}
      />

      <CreateEventDialog 
        show={showEventDialog()} 
        onClose={closeEventDialog}
        onSuccess={handleEventCreated}
        calendars={calendars()}
      />

      {/* Delete confirmation dialog */}
      <div class={`modal ${showDeleteDialog() ? 'modal-open' : ''}`}>
        <div class="modal-box">
          <h3 class="font-bold text-lg mb-4">Delete Event</h3>
          <p class="mb-4">
            Are you sure you want to delete "{eventToDelete()?.title}"? This action cannot be undone.
          </p>
          <div class="modal-action">
            <button class="btn btn-ghost" onClick={cancelDelete}>
              Cancel
            </button>
            <button class="btn btn-error" onClick={confirmDelete}>
              <i class="fas fa-trash mr-2"></i>
              Delete
            </button>
          </div>
        </div>
        <form method="dialog" class="modal-backdrop">
          <button type="button" onClick={cancelDelete}>close</button>
        </form>
      </div>
    </main>
  );
} 
