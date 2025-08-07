import { createSignal, onMount, For } from "solid-js";
import { familyMemberStorage } from "../services/FamilyMemberStorage";
import CreateFamilyMemberDialog from "../components/CreateFamilyMemberDialog";
import type { FamilyMember } from "../types/FamilyMember";

export default function FamilyMembers() {
  const [familyMembers, setFamilyMembers] = createSignal<FamilyMember[]>([]);
  const [showCreateDialog, setShowCreateDialog] = createSignal(false);
  const [showDeleteDialog, setShowDeleteDialog] = createSignal(false);
  const [memberToDelete, setMemberToDelete] = createSignal<FamilyMember | null>(null);
  const [isLoading, setIsLoading] = createSignal(true);

  const loadFamilyMembers = async () => {
    try {
      setIsLoading(true);
      const members = await familyMemberStorage.getAllFamilyMembers();
      setFamilyMembers(members);
    } catch (error) {
      console.error("Failed to load family members:", error);
      alert("Failed to load family members. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const openCreateDialog = () => {
    setShowCreateDialog(true);
  };

  const closeCreateDialog = () => {
    setShowCreateDialog(false);
  };

  const handleFamilyMemberCreated = () => {
    loadFamilyMembers(); // Reload family members after creating a new one
  };

  const handleDeleteClick = (member: FamilyMember) => {
    setMemberToDelete(member);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    const member = memberToDelete();
    if (!member) return;

    try {
      await familyMemberStorage.deleteFamilyMember(member.id);
      setShowDeleteDialog(false);
      setMemberToDelete(null);
      loadFamilyMembers(); // Reload family members after deletion
    } catch (error) {
      console.error("Failed to delete family member:", error);
      alert("Failed to delete family member. Please try again.");
    }
  };

  const cancelDelete = () => {
    setShowDeleteDialog(false);
    setMemberToDelete(null);
  };

  onMount(() => {
    loadFamilyMembers();
  });

  return (
    <main class="p-4">
      <div class="flex justify-between items-center mb-6">
        <div>
          <h1 class="text-3xl font-bold text-primary">Family Members</h1>
          <p class="text-base-content/70 mt-2">Manage your family members and their calendar colors</p>
        </div>
        <button class="btn btn-primary" onClick={openCreateDialog}>
          <i class="fas fa-plus mr-2"></i>
          Add Family Member
        </button>
      </div>

      {isLoading() ? (
        <div class="flex justify-center items-center py-20">
          <div class="loading loading-spinner loading-lg text-primary"></div>
        </div>
      ) : familyMembers().length === 0 ? (
        <div class="text-center py-20">
          <div class="text-6xl mb-4">👨‍👩‍👧‍👦</div>
          <h2 class="text-2xl font-semibold text-base-content mb-2">No Family Members Yet</h2>
          <p class="text-base-content/70 mb-6">Add your first family member to get started with your family calendar</p>
          <button class="btn btn-primary btn-lg" onClick={openCreateDialog}>
            <i class="fas fa-plus mr-2"></i>
            Add Your First Family Member
          </button>
        </div>
      ) : (
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <For each={familyMembers()}>
            {(member) => (
              <div class="card bg-base-100 shadow-lg border border-base-300 hover:shadow-xl transition-shadow">
                <div class="card-body">
                  <div class="flex items-center gap-3 mb-4">
                    <div 
                      class="w-8 h-8 rounded-full flex-shrink-0"
                      style={{ "background-color": member.color }}
                    ></div>
                    <h2 class="card-title text-lg">{member.name}</h2>
                  </div>

                  <div class="card-actions justify-end">
                    <button 
                      class="btn btn-ghost btn-sm text-error hover:bg-error hover:text-error-content"
                      onClick={() => handleDeleteClick(member)}
                      title="Delete family member"
                    >
                      <i class="fas fa-trash"></i>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </For>
        </div>
      )}

      <CreateFamilyMemberDialog 
        show={showCreateDialog()} 
        onClose={closeCreateDialog}
        onSuccess={handleFamilyMemberCreated}
      />

      {/* Delete confirmation dialog */}
      <div class={`modal ${showDeleteDialog() ? 'modal-open' : ''}`}>
        <div class="modal-box">
          <h3 class="font-bold text-lg mb-4">Delete Family Member</h3>
          <p class="mb-4">
            Are you sure you want to delete <strong>{memberToDelete()?.name}</strong>? 
            This will also delete all events associated with this family member. 
            This action cannot be undone.
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
