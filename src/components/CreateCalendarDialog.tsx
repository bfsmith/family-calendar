import { createSignal } from "solid-js";
import { calendarStorage } from "../services/CalendarStorage";
import LoadingSpinner from "./LoadingSpinner";

interface CreateCalendarDialogProps {
  show: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function CreateCalendarDialog(props: CreateCalendarDialogProps) {
  const [calendarName, setCalendarName] = createSignal("");
  const [calendarColor, setCalendarColor] = createSignal("#3b82f6");
  const [isSubmitting, setIsSubmitting] = createSignal(false);

  const closeDialog = () => {
    setCalendarName("");
    setCalendarColor("#3b82f6");
    setIsSubmitting(false);
    props.onClose();
  };



  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    
    if (!calendarName().trim()) {
      alert("Please enter a calendar name");
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Create the calendar
      await calendarStorage.createCalendar({
        name: calendarName().trim(),
        color: calendarColor()
      });
      
      // Close dialog and reset form
      closeDialog();
      
      // Call success callback if provided
      props.onSuccess?.();
      
    } catch (error) {
      console.error("Failed to create calendar:", error);
      alert("Failed to create calendar. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div class={`modal ${props.show ? 'modal-open' : ''}`}>
      <div class="modal-box">
        <h3 class="font-bold text-lg mb-4">Add New Calendar</h3>
        
        <form onSubmit={handleSubmit}>
          <div class="form-control mb-4">
            <label class="label">
              <span class="label-text">Calendar Name</span>
            </label>
            <input
              type="text"
              placeholder="Enter calendar name"
              class="input input-bordered w-full"
              value={calendarName()}
              onInput={(e) => setCalendarName(e.currentTarget.value)}
              required
            />
          </div>

          <div class="form-control mb-6">
            <label class="label">
              <span class="label-text">Color</span>
            </label>
            <input
              type="color"
              class="input input-bordered w-full h-12"
              value={calendarColor()}
              onInput={(e) => setCalendarColor(e.currentTarget.value)}
            />
          </div>

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
                    "Create Calendar"
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
