import { createSignal, onMount } from "solid-js";

import CreateEventDialog from "../components/CreateEventDialog";
import { familyMemberStorage } from "../services/FamilyMemberStorage";
import { eventStorage } from "../services/EventStorage";
import type { FamilyMember } from "../types/FamilyMember";
import type { Event } from "../types/Event";

export default function Calendar() {
  const [currentHour, setCurrentHour] = createSignal(0);
  const [currentMinute, setCurrentMinute] = createSignal(0);

  const [showEventDialog, setShowEventDialog] = createSignal(false);
  const [calendars, setCalendars] = createSignal<FamilyMember[]>([]);
  const [events, setEvents] = createSignal<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = createSignal<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = createSignal(false);
  const [eventToDelete, setEventToDelete] = createSignal<Event | null>(null);
  const [currentDate, setCurrentDate] = createSignal(new Date());
  const [visibleFamilyMembers, setVisibleFamilyMembers] = createSignal<Set<string>>(new Set());
  
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



  const openEventDialog = () => {
    setShowEventDialog(true);
  };

  const closeEventDialog = () => {
    setShowEventDialog(false);
  };

  const goToPreviousDay = () => {
    const current = currentDate();
    const previous = new Date(current);
    previous.setDate(current.getDate() - 1);
    setCurrentDate(previous);
    loadEvents(); // Reload events for the new date
  };

  const goToNextDay = () => {
    const current = currentDate();
    const next = new Date(current);
    next.setDate(current.getDate() + 1);
    setCurrentDate(next);
    loadEvents(); // Reload events for the new date
  };

  const formatDisplayDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    loadEvents(); // Reload events for today
  };

  // Helper function to determine if a color is light or dark
  const isLightColor = (hexColor: string) => {
    // Remove # if present
    const hex = hexColor.replace('#', '');
    
    // Convert to RGB
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    // Calculate luminance using the relative luminance formula
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    // Return true if light (luminance > 0.5)
    return luminance > 0.5;
  };

  // Helper function to get high-contrast text box styling
  const getTextBoxStyle = () => {
    return {
      "background-color": "rgba(0, 0, 0, 0.75)", // Semi-transparent black background
      color: "#ffffff", // White text for high contrast
      "border-radius": "4px",
      padding: "2px 6px",
      "backdrop-filter": "blur(2px)" // Subtle blur effect
    };
  };

  const loadCalendars = async () => {
    try {
      const allCalendars = await familyMemberStorage.getAllFamilyMembers();
      setCalendars(allCalendars);
      
      // Initialize visible family members from localStorage or show all by default
      const savedVisible = localStorage.getItem('visibleFamilyMembers');
      if (savedVisible) {
        try {
          const visibleIds = JSON.parse(savedVisible) as string[];
          setVisibleFamilyMembers(new Set(visibleIds));
        } catch (error) {
          console.error("Failed to parse saved family member visibility:", error);
          setVisibleFamilyMembers(new Set(allCalendars.map(cal => cal.id)));
        }
      } else {
        // Default to showing all family members
        setVisibleFamilyMembers(new Set(allCalendars.map(cal => cal.id)));
      }
    } catch (error) {
      console.error("Failed to load family members:", error);
    }
  };

  const toggleFamilyMemberVisibility = (familyMemberId: string) => {
    const current = visibleFamilyMembers();
    const newVisible = new Set(current);
    
    if (newVisible.has(familyMemberId)) {
      newVisible.delete(familyMemberId);
    } else {
      newVisible.add(familyMemberId);
    }
    
    setVisibleFamilyMembers(newVisible);
    // Save to localStorage
    localStorage.setItem('visibleFamilyMembers', JSON.stringify(Array.from(newVisible)));
  };

  const isMultipleFamilyMembers = () => calendars().length > 1;
  const getVisibleFamilyMembers = () => calendars().filter(cal => visibleFamilyMembers().has(cal.id));

  const loadEvents = async () => {
    try {
      // Get events for the current selected date
      const date = currentDate();
      const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
      
      const allEvents = await eventStorage.queryEvents({
        startDate: startOfDay,
        endDate: endOfDay
      });
      setEvents(allEvents);
    } catch (error) {
      console.error("Failed to load events:", error);
    }
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
        <div class="flex gap-2 items-center">
          {/* Family Member Filter Dropdown */}
          {isMultipleFamilyMembers() && (
            <div class="dropdown dropdown-end">
              <div tabindex="0" role="button" class="btn btn-outline btn-sm">
                <i class="fas fa-filter mr-2"></i>
                Filter ({getVisibleFamilyMembers().length}/{calendars().length})
              </div>
              <ul tabindex="0" class="dropdown-content menu bg-base-100 rounded-box z-[1] w-64 p-2 shadow-lg border border-base-300">
                <li class="menu-title">
                  <span>Show/Hide Family Members</span>
                </li>
                <div class="divider my-1"></div>
                {calendars().map((calendar) => (
                  <li>
                    <label class="cursor-pointer flex items-center gap-3 px-2 py-2">
                      <input 
                        type="checkbox" 
                        class="checkbox checkbox-sm"
                        checked={visibleFamilyMembers().has(calendar.id)}
                        onChange={() => toggleFamilyMemberVisibility(calendar.id)}
                      />
                      <div 
                        class="w-4 h-4 rounded-full flex-shrink-0"
                        style={{ "background-color": calendar.color }}
                      ></div>
                      <span class="flex-1">{calendar.name}</span>
                    </label>
                  </li>
                ))}
                <div class="divider my-1"></div>
                <li>
                  <button 
                    class="btn btn-xs btn-ghost"
                    onClick={() => {
                      const allIds = calendars().map(cal => cal.id);
                      setVisibleFamilyMembers(new Set(allIds));
                      localStorage.setItem('visibleFamilyMembers', JSON.stringify(allIds));
                    }}
                  >
                    Show All
                  </button>
                </li>
              </ul>
            </div>
          )}
          
          <button class="btn btn-primary" onClick={openEventDialog}>
            Add Event
          </button>
        </div>
      </div>

      {/* Date navigation */}
      <div class="flex flex-col sm:flex-row justify-center items-center mb-6 gap-4">
        <div class="flex items-center gap-3 w-full sm:w-auto">
          <button 
            class="btn btn-circle btn-outline flex-shrink-0"
            onClick={goToPreviousDay}
            title="Previous day"
          >
            <i class="fas fa-chevron-left"></i>
          </button>
          
          <div class="text-lg sm:text-xl font-semibold text-center flex-1 sm:flex-none sm:min-w-80 px-2">
            {formatDisplayDate(currentDate())}
          </div>
          
        <button 
          class="btn btn-sm btn-outline w-auto hidden md:block"
          onClick={goToToday}
          title="Go to today"
        >
          Today
        </button>
          
          <button 
            class="btn btn-circle btn-outline flex-shrink-0"
            onClick={goToNextDay}
            title="Next day"
          >
            <i class="fas fa-chevron-right"></i>
          </button>
        </div>
        
        <button 
          class="btn btn-sm btn-outline w-full md:hidden"
          onClick={goToToday}
          title="Go to today"
        >
          Today
        </button>
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
        {getVisibleFamilyMembers().length > 0 ? (
          getVisibleFamilyMembers().map((calendar) => {
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
                    .map((event) => {
                      const eventColor = event.color || calendar.color;
                      return (
                        <div
                          class="rounded-md p-1 min-h-7 text-xs font-medium shadow-sm border-l-4 cursor-pointer hover:shadow-md transition-shadow relative"
                          style={{
                            ...getEventStyle(event),
                            "background-color": eventColor + "40",
                            "border-left-color": eventColor
                          }}
                          title={`${event.title}\n${event.startTime.toLocaleTimeString()} - ${event.endTime.toLocaleTimeString()}`}
                          onClick={(e) => handleEventClick(event, e)}
                        >
                        <div class="flex items-center gap-1">
                          <div class="truncate font-semibold rounded" style={getTextBoxStyle()}>{event.title}</div>
                          {!event.allDay && (
                            <div class="text-xs whitespace-nowrap rounded" style={getTextBoxStyle()}>
                              {event.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}-{event.endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
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
                      );
                    })
                  }
                </div>
              </div>
            );
          })
        ) : calendars().length === 0 ? (
          <div class="flex-1 flex items-center justify-center text-base-content/50 py-20">
            <div class="text-center">
              <p class="text-lg mb-2">No family members found</p>
              <p class="text-sm">Go to <a href="/family-members" class="link link-primary">Family Members</a> to add your first family member</p>
            </div>
          </div>
        ) : (
          <div class="flex-1 flex items-center justify-center text-base-content/50 py-20">
            <div class="text-center">
              <p class="text-lg mb-2">All family members are hidden</p>
              <p class="text-sm">Use the filter button above to show family members</p>
            </div>
          </div>
        )}
      </div>



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
