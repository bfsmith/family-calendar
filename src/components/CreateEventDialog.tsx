import { createSignal } from "solid-js";
import { eventStorage } from "../services/EventStorage";
import LoadingSpinner from "./LoadingSpinner";
import type { Calendar } from "../types/Calendar";

interface CreateEventDialogProps {
  show: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  calendars: Calendar[];
}

export default function CreateEventDialog(props: CreateEventDialogProps) {
  const [eventTitle, setEventTitle] = createSignal("");
  const [startTime, setStartTime] = createSignal("");
  const [endTime, setEndTime] = createSignal("");
  const [allDay, setAllDay] = createSignal(false);
  const [selectedCalendarId, setSelectedCalendarId] = createSignal("");
  const [eventColor, setEventColor] = createSignal("");
  const [recurrenceType, setRecurrenceType] = createSignal<"none" | "hourly" | "daily" | "weekly">("none");
  const [recurrenceInterval, setRecurrenceInterval] = createSignal(1);
  const [startHour, setStartHour] = createSignal(9);
  const [endHour, setEndHour] = createSignal(17);
  const [selectedDays, setSelectedDays] = createSignal<number[]>([]);
  const [isSubmitting, setIsSubmitting] = createSignal(false);

  const closeDialog = () => {
    setEventTitle("");
    setStartTime("");
    setEndTime("");
    setAllDay(false);
    setSelectedCalendarId("");
    setEventColor("");
    setRecurrenceType("none");
    setRecurrenceInterval(1);
    setStartHour(9);
    setEndHour(17);
    setSelectedDays([]);
    setIsSubmitting(false);
    props.onClose();
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    
    if (!eventTitle().trim()) {
      alert("Please enter an event title");
      return;
    }

    if (!selectedCalendarId()) {
      alert("Please select a calendar");
      return;
    }

    if (!allDay() && !startTime()) {
      alert("Please enter a start time");
      return;
    }

    if (!allDay() && !endTime()) {
      alert("Please enter an end time");
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Create start and end Date objects for today
      const today = new Date();
      const startDateTime = allDay() 
        ? new Date(today.getFullYear(), today.getMonth(), today.getDate())
        : new Date(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}T${startTime()}`);
      
      const endDateTime = allDay()
        ? new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
        : new Date(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}T${endTime()}`);

      // Validate that end time is after start time for non-recurring events
      if (!allDay() && recurrenceType() === "none" && endDateTime <= startDateTime) {
        alert("End time must be after start time");
        return;
      }

      // Create the event
      const selectedCalendar = props.calendars.find(cal => cal.id === selectedCalendarId());
      
      // Build recurring pattern if not "none"
      let recurringPattern = undefined;
      if (recurrenceType() !== "none") {
        if (recurrenceType() === "hourly") {
          recurringPattern = {
            type: "hourly" as const,
            startHour: startHour(),
            endHour: endHour(),
            interval: recurrenceInterval(),
            daysOfWeek: selectedDays().length > 0 ? selectedDays() : undefined
          };
        } else if (recurrenceType() === "daily") {
          recurringPattern = {
            type: "daily" as const,
            interval: recurrenceInterval()
          };
        } else if (recurrenceType() === "weekly") {
          recurringPattern = {
            type: "weekly" as const,
            daysOfWeek: selectedDays().length > 0 ? selectedDays() : [today.getDay()],
            interval: recurrenceInterval()
          };
        }
      }
      
      const eventData = {
        title: eventTitle().trim(),
        startTime: startDateTime,
        endTime: endDateTime,
        allDay: allDay(),
        calendarId: selectedCalendarId(),
        recurring: recurringPattern,
        // Only include color if it's different from the calendar color
        ...(eventColor() && eventColor() !== selectedCalendar?.color && { color: eventColor() })
      };
      
      await eventStorage.createEvent(eventData);
      
      // Close dialog and reset form
      closeDialog();
      
      // Call success callback if provided
      props.onSuccess?.();
      
    } catch (error) {
      console.error("Failed to create event:", error);
      alert("Failed to create event. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Set default calendar when calendars are available
  const getDefaultCalendarId = () => {
    if (!selectedCalendarId() && props.calendars.length > 0) {
      setSelectedCalendarId(props.calendars[0].id);
      // Set default color to first calendar's color if no color is set
      if (!eventColor()) {
        setEventColor(props.calendars[0].color);
      }
    }
    return selectedCalendarId();
  };

  // Get the color for the currently selected calendar
  const getSelectedCalendarColor = () => {
    const calendar = props.calendars.find(cal => cal.id === selectedCalendarId());
    return calendar?.color || "#3b82f6";
  };

  // Handle calendar selection change
  const handleCalendarChange = (calendarId: string) => {
    setSelectedCalendarId(calendarId);
    // Update event color to match selected calendar color
    const calendar = props.calendars.find(cal => cal.id === calendarId);
    if (calendar) {
      setEventColor(calendar.color);
    }
  };

  // Handle day selection for weekly recurrence
  const toggleDay = (dayIndex: number) => {
    const currentDays = selectedDays();
    if (currentDays.includes(dayIndex)) {
      setSelectedDays(currentDays.filter(day => day !== dayIndex));
    } else {
      setSelectedDays([...currentDays, dayIndex].sort());
    }
  };

  // Day names for display
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div class={`modal ${props.show ? 'modal-open' : ''}`}>
      <div class="modal-box max-w-2xl">
        <h3 class="font-bold text-lg mb-4">Create New Event</h3>
        
        <form onSubmit={handleSubmit}>
          <div class="form-control mb-4">
            <label class="label">
              <span class="label-text">Event Title</span>
            </label>
            <input
              type="text"
              placeholder="Enter event title"
              class="input input-bordered w-full"
              value={eventTitle()}
              onInput={(e) => setEventTitle(e.currentTarget.value)}
              required
            />
          </div>

          <div class="form-control mb-4">
            <label class="label">
              <span class="label-text">Calendar</span>
            </label>
            <select
              class="select select-bordered w-full"
              value={getDefaultCalendarId()}
              onChange={(e) => handleCalendarChange(e.currentTarget.value)}
              required
            >
              <option value="" disabled>Select a calendar</option>
              {props.calendars.map((calendar) => (
                <option value={calendar.id}>{calendar.name}</option>
              ))}
            </select>
          </div>

          <div class="form-control mb-4">
            <label class="cursor-pointer label">
              <span class="label-text">All Day Event</span>
              <input
                type="checkbox"
                class="checkbox"
                checked={allDay()}
                onChange={(e) => setAllDay(e.currentTarget.checked)}
              />
            </label>
          </div>

          {!allDay() && (
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div class="form-control">
                <label class="label">
                  <span class="label-text">Start Time</span>
                </label>
                <input
                  type="time"
                  class="input input-bordered w-full"
                  value={startTime()}
                  onInput={(e) => setStartTime(e.currentTarget.value)}
                  required
                />
              </div>

              <div class="form-control">
                <label class="label">
                  <span class="label-text">End Time</span>
                </label>
                <input
                  type="time"
                  class="input input-bordered w-full"
                  value={endTime()}
                  onInput={(e) => setEndTime(e.currentTarget.value)}
                  required
                />
              </div>
            </div>
          )}

          <div class="form-control mb-4">
            <label class="label">
              <span class="label-text">Recurrence</span>
            </label>
            <select
              class="select select-bordered w-full"
              value={recurrenceType()}
              onChange={(e) => setRecurrenceType(e.currentTarget.value as "none" | "hourly" | "daily" | "weekly")}
            >
              <option value="none">No Recurrence</option>
              <option value="hourly">Hourly</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </select>
          </div>

          {recurrenceType() !== "none" && (
            <div class="mb-4">
              <div class="form-control mb-3">
                <label class="label">
                  <span class="label-text">Repeat Every</span>
                </label>
                <div class="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="30"
                    class="input input-bordered w-20"
                    value={recurrenceInterval()}
                    onInput={(e) => setRecurrenceInterval(Number(e.currentTarget.value))}
                  />
                  <span class="text-sm text-base-content/70">
                    {recurrenceType() === "hourly" ? "hour(s)" : 
                     recurrenceType() === "daily" ? "day(s)" : "week(s)"}
                  </span>
                </div>
              </div>

              {recurrenceType() === "hourly" && (
                <div class="grid grid-cols-2 gap-4 mb-3">
                  <div class="form-control">
                    <label class="label">
                      <span class="label-text">Start Hour</span>
                    </label>
                    <select
                      class="select select-bordered w-full"
                      value={startHour()}
                      onChange={(e) => setStartHour(Number(e.currentTarget.value))}
                    >
                      {Array.from({ length: 24 }, (_, i) => (
                        <option value={i}>
                          {i === 0 ? "12 AM" : 
                           i < 12 ? `${i} AM` : 
                           i === 12 ? "12 PM" : `${i - 12} PM`}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div class="form-control">
                    <label class="label">
                      <span class="label-text">End Hour</span>
                    </label>
                    <select
                      class="select select-bordered w-full"
                      value={endHour()}
                      onChange={(e) => setEndHour(Number(e.currentTarget.value))}
                    >
                      {Array.from({ length: 24 }, (_, i) => (
                        <option value={i + 1}>
                          {i + 1 === 24 ? "12 AM" :
                           i + 1 < 12 ? `${i + 1} AM` : 
                           i + 1 === 12 ? "12 PM" : `${i + 1 - 12} PM`}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {(recurrenceType() === "weekly" || recurrenceType() === "hourly") && (
                <div class="form-control mb-3">
                  <label class="label">
                    <span class="label-text">
                      {recurrenceType() === "weekly" ? "On Days" : "On Days (optional)"}
                    </span>
                  </label>
                  <div class="flex flex-wrap gap-2">
                    {dayNames.map((dayName, index) => (
                      <button
                        type="button"
                        class={`btn btn-sm ${selectedDays().includes(index) ? 'btn-primary' : 'btn-outline'}`}
                        onClick={() => toggleDay(index)}
                      >
                        {dayName}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div class="modal-action">
            <button
              type="button"
              class="btn btn-ghost"
              onClick={closeDialog}
              disabled={isSubmitting()}
            >
              Cancel
            </button>
            <button
              type="submit"
              class="btn btn-primary"
              disabled={isSubmitting()}
            >
              {isSubmitting() ? (
                <div class="flex items-center gap-2">
                  <LoadingSpinner size="xs" variant="clock" color="primary" />
                  Creating...
                </div>
              ) : (
                "Create Event"
              )}
            </button>
          </div>
        </form>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button type="button" onClick={closeDialog}>close</button>
      </form>
    </div>
  );
}
