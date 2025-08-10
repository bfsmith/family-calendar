import { createSignal, For, createEffect } from "solid-js";
import { choreStorage } from "../services/ChoreStorage";
import LoadingSpinner from "./LoadingSpinner";
import type { FamilyMember } from "../types/FamilyMember";
import { CHORE_ICONS } from "../types/Chore";

interface CreateChoreDialogProps {
  show: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  familyMembers: FamilyMember[];
  preselectedFamilyMemberId?: string;
}

export default function CreateChoreDialog(props: CreateChoreDialogProps) {
  const [choreTitle, setChoreTitle] = createSignal("");
  const [selectedFamilyMemberId, setSelectedFamilyMemberId] = createSignal(props.preselectedFamilyMemberId || "");
  const [selectedIcon, setSelectedIcon] = createSignal("");
  const [recurrenceType, setRecurrenceType] = createSignal<"none" | "daily" | "weekly">("none");
  const [dailyInterval, setDailyInterval] = createSignal(1);
  const [weeklyInterval, setWeeklyInterval] = createSignal(1);
  const [weeklyDays, setWeeklyDays] = createSignal<number[]>([]);
  const [isSubmitting, setIsSubmitting] = createSignal(false);

  // Update selected family member when props change
  createEffect(() => {
    if (props.preselectedFamilyMemberId) {
      setSelectedFamilyMemberId(props.preselectedFamilyMemberId);
    }
  });

  const closeDialog = () => {
    setChoreTitle("");
    setSelectedFamilyMemberId(props.preselectedFamilyMemberId || "");
    setSelectedIcon("");
    setRecurrenceType("none");
    setDailyInterval(1);
    setWeeklyInterval(1);
    setWeeklyDays([]);
    setIsSubmitting(false);
    props.onClose();
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    
    if (!choreTitle().trim()) {
      alert("Please enter a chore title");
      return;
    }

    if (!selectedFamilyMemberId()) {
      alert("Please select a family member");
      return;
    }

    if (props.familyMembers.length === 0) {
      alert("No family members available. Please add a family member first.");
      return;
    }

    setIsSubmitting(true);
    
    try {
      const choreData: any = {
        title: choreTitle().trim(),
        familyMemberId: selectedFamilyMemberId(),
        icon: selectedIcon() || undefined
      };

      // Add recurrence if selected
      if (recurrenceType() === "daily") {
        choreData.recurring = {
          type: "daily",
          interval: dailyInterval()
        };
      } else if (recurrenceType() === "weekly") {
        if (weeklyDays().length === 0) {
          alert("Please select at least one day of the week");
          setIsSubmitting(false);
          return;
        }
        choreData.recurring = {
          type: "weekly",
          daysOfWeek: weeklyDays(),
          interval: weeklyInterval()
        };
      }

      await choreStorage.createChore(choreData);
      
      // Close dialog and reset form
      closeDialog();
      
      // Call success callback if provided
      props.onSuccess?.();
      
    } catch (error) {
      console.error("Failed to create chore:", error);
      alert("Failed to create chore. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getDefaultFamilyMemberId = () => {
    if (!selectedFamilyMemberId() && props.familyMembers.length > 0) {
      setSelectedFamilyMemberId(props.familyMembers[0].id);
    }
    return selectedFamilyMemberId();
  };

  const handleFamilyMemberChange = (familyMemberId: string) => {
    setSelectedFamilyMemberId(familyMemberId);
  };

  const toggleWeeklyDay = (day: number) => {
    const current = weeklyDays();
    if (current.includes(day)) {
      setWeeklyDays(current.filter(d => d !== day));
    } else {
      setWeeklyDays([...current, day].sort());
    }
  };

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Convert CHORE_ICONS object to array for easier iteration
  const iconOptions = Object.entries(CHORE_ICONS).map(([name, icon]) => ({ name, icon }));

  return (
    <div class={`modal ${props.show ? 'modal-open' : ''}`}>
      <div class="modal-box max-w-2xl">
        <h3 class="font-bold text-lg mb-4">Add New Chore</h3>
        
        <form onSubmit={handleSubmit}>
          <div class="form-control mb-4">
            <label class="label">
              <span class="label-text">Chore Title</span>
            </label>
            <input
              type="text"
              placeholder="Enter chore title"
              class="input input-bordered w-full"
              value={choreTitle()}
              onInput={(e) => setChoreTitle(e.currentTarget.value)}
              required
            />
          </div>

          <div class="form-control mb-4">
            <label class="label">
              <span class="label-text">Assign to Family Member</span>
            </label>
            <select
              class="select select-bordered w-full"
              value={getDefaultFamilyMemberId()}
              onChange={(e) => handleFamilyMemberChange(e.currentTarget.value)}
              required
            >
              <option value="">Select family member</option>
              <For each={props.familyMembers}>
                {(member) => (
                  <option value={member.id}>{member.name}</option>
                )}
              </For>
            </select>
          </div>

          <div class="form-control mb-4">
            <label class="label">
              <span class="label-text">Icon (Optional)</span>
            </label>
            <div class="grid grid-cols-6 sm:grid-cols-8 gap-2 p-4 border border-base-300 rounded-lg max-h-48 overflow-y-auto">
              <button
                type="button"
                class={`btn btn-sm ${!selectedIcon() ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setSelectedIcon("")}
                title="No icon"
              >
                None
              </button>
              <For each={iconOptions}>
                {(option) => (
                  <button
                    type="button"
                    class={`btn btn-sm ${selectedIcon() === option.icon ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => setSelectedIcon(option.icon)}
                    title={option.name}
                  >
                    <i class={`fas ${option.icon}`}></i>
                  </button>
                )}
              </For>
            </div>
            {selectedIcon() && (
              <div class="mt-2 text-sm text-base-content/70">
                Selected: <i class={`fas ${selectedIcon()} mr-1`}></i>{selectedIcon()}
              </div>
            )}
          </div>

          <div class="form-control mb-4">
            <label class="label">
              <span class="label-text">Recurrence</span>
            </label>
            <select
              class="select select-bordered w-full"
              value={recurrenceType()}
              onChange={(e) => setRecurrenceType(e.currentTarget.value as any)}
            >
              <option value="none">One-time chore</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </select>
          </div>

          {/* Daily recurrence options */}
          {recurrenceType() === "daily" && (
            <div class="form-control mb-4">
              <label class="label">
                <span class="label-text">Repeat every</span>
              </label>
              <div class="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="365"
                  class="input input-bordered w-20"
                  value={dailyInterval()}
                  onInput={(e) => setDailyInterval(parseInt(e.currentTarget.value) || 1)}
                />
                <span>day(s)</span>
              </div>
            </div>
          )}

          {/* Weekly recurrence options */}
          {recurrenceType() === "weekly" && (
            <>
              <div class="form-control mb-4">
                <label class="label">
                  <span class="label-text">Repeat every</span>
                </label>
                <div class="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="52"
                    class="input input-bordered w-20"
                    value={weeklyInterval()}
                    onInput={(e) => setWeeklyInterval(parseInt(e.currentTarget.value) || 1)}
                  />
                  <span>week(s)</span>
                </div>
              </div>

              <div class="form-control mb-4">
                <label class="label">
                  <span class="label-text">On these days</span>
                </label>
                <div class="flex gap-2 flex-wrap">
                  <For each={dayNames}>
                    {(day, index) => (
                      <button
                        type="button"
                        class={`btn btn-sm ${weeklyDays().includes(index()) ? 'btn-primary' : 'btn-outline'}`}
                        onClick={() => toggleWeeklyDay(index())}
                      >
                        {day}
                      </button>
                    )}
                  </For>
                </div>
              </div>
            </>
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
                <>
                  <i class="fas fa-plus mr-2"></i>
                  Create Chore
                </>
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
