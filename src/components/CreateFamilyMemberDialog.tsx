import { createSignal } from "solid-js";
import { familyMemberStorage } from "../services/FamilyMemberStorage";
import LoadingSpinner from "./LoadingSpinner";

interface CreateFamilyMemberDialogProps {
  show: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function CreateFamilyMemberDialog(props: CreateFamilyMemberDialogProps) {
  const [memberName, setMemberName] = createSignal("");
  const [memberColor, setMemberColor] = createSignal("#3b82f6");
  const [isSubmitting, setIsSubmitting] = createSignal(false);

  const closeDialog = () => {
    setMemberName("");
    setMemberColor("#3b82f6");
    setIsSubmitting(false);
    props.onClose();
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    
    if (!memberName().trim()) {
      alert("Please enter a family member name");
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Create the family member
      await familyMemberStorage.createFamilyMember({
        name: memberName().trim(),
        color: memberColor()
      });
      
      // Close dialog and reset form
      closeDialog();
      
      // Call success callback if provided
      props.onSuccess?.();
      
    } catch (error) {
      console.error("Failed to create family member:", error);
      alert("Failed to create family member. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div class={`modal ${props.show ? 'modal-open' : ''}`}>
      <div class="modal-box">
        <h3 class="font-bold text-lg mb-4">Add Family Member</h3>
        
        <form onSubmit={handleSubmit}>
          <div class="form-control mb-4">
            <label class="label">
              <span class="label-text">Family Member Name</span>
            </label>
            <input
              type="text"
              placeholder="Enter family member name"
              class="input input-bordered w-full"
              value={memberName()}
              onInput={(e) => setMemberName(e.currentTarget.value)}
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
              value={memberColor()}
              onInput={(e) => setMemberColor(e.currentTarget.value)}
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
                "Add Family Member"
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
