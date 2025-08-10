import { createSignal, onMount, For } from "solid-js";
import { useParams } from "@solidjs/router";
import { familyMemberStorage } from "../../services/FamilyMemberStorage";
import { choreStorage } from "../../services/ChoreStorage";
import CreateChoreDialog from "../../components/CreateChoreDialog";
import type { FamilyMember } from "../../types/FamilyMember";
import type { Chore } from "../../types/Chore";

export default function FamilyMemberChores() {
  const params = useParams();
  const [familyMember, setFamilyMember] = createSignal<FamilyMember | null>(null);
  const [chores, setChores] = createSignal<Chore[]>([]);
  const [loading, setLoading] = createSignal(true);
  const [showChoreDialog, setShowChoreDialog] = createSignal(false);

  const loadFamilyMember = async () => {
    try {
      const member = await familyMemberStorage.getFamilyMember(params.familyMemberId);
      setFamilyMember(member);
    } catch (error) {
      console.error("Failed to load family member:", error);
    }
  };

  const loadChores = async () => {
    try {
      // Get all chores for this family member (including completed non-recurring chores)
      const allChores = await choreStorage.queryChores({
        familyMemberId: params.familyMemberId,
        includeAllNonRecurring: true // Include all chores regardless of completion status
      });
      
      // For recurring chores, we only want to show the original chore once, not the virtual occurrences
      const uniqueChores = allChores.filter(chore => !chore.id.includes('_'));
      
      setChores(uniqueChores);
    } catch (error) {
      console.error("Failed to load chores:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatRecurrence = (chore: Chore): string => {
    if (!chore.recurring) return "";
    
    switch (chore.recurring.type) {
      case 'daily':
        return chore.recurring.interval === 1 ? 'Daily' : `Every ${chore.recurring.interval} days`;
      case 'weekly': {
        const weekly = chore.recurring as any; // Type assertion to access weekly properties
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const selectedDays = weekly.daysOfWeek?.map((day: number) => dayNames[day]).join(', ') || 'Weekly';
        const intervalText = weekly.interval === 1 ? '' : ` (every ${weekly.interval} weeks)`;
        return `${selectedDays}${intervalText}`;
      }
      case 'hourly':
        return chore.recurring.interval === 1 ? 'Hourly' : `Every ${chore.recurring.interval} hours`;
      default:
        return 'Recurring';
    }
  };

  const handleDeleteChore = async (chore: Chore) => {
    if (confirm(`Are you sure you want to delete "${chore.title}"?`)) {
      try {
        await choreStorage.deleteChore(chore.id);
        await loadChores(); // Reload the list
      } catch (error) {
        console.error("Failed to delete chore:", error);
      }
    }
  };

  const openChoreDialog = () => {
    setShowChoreDialog(true);
  };

  const closeChoreDialog = () => {
    setShowChoreDialog(false);
  };

  const handleChoreCreated = () => {
    loadChores(); // Reload chores after creating a new one
    closeChoreDialog();
  };

  onMount(() => {
    loadFamilyMember();
    loadChores();
  });

  return (
    <main class="p-4">
      <div class="max-w-4xl mx-auto">
        {/* Header */}
        <div class="flex justify-between items-center mb-6">
          <div class="flex items-center gap-4">
            <a href="/chores" class="btn btn-ghost btn-sm">
              <i class="fas fa-arrow-left mr-2"></i>
              Back to Chores
            </a>
            {familyMember() && (
              <div class="flex items-center gap-3">
                <div 
                  class="w-8 h-8 rounded-full"
                  style={{ "background-color": familyMember()!.color }}
                ></div>
                <h1 class="text-2xl font-bold">
                  {familyMember()!.name}'s Chores
                </h1>
                <div class="flex items-center gap-2 text-sm text-yellow-600 font-medium">
                  <i class="fas fa-star"></i>
                  <span>{familyMember()!.points || 0} points</span>
                </div>
              </div>
            )}
          </div>
          
          {/* Add Chore Button */}
          {familyMember() && (
            <button class="btn btn-primary" onClick={openChoreDialog}>
              <i class="fas fa-plus mr-2"></i>
              Add Chore for {familyMember()!.name}
            </button>
          )}
        </div>

        {/* Loading State */}
        {loading() && (
          <div class="flex justify-center items-center py-12">
            <div class="loading loading-spinner loading-lg"></div>
          </div>
        )}

        {/* Chores List */}
        {!loading() && (
          <div class="space-y-4">
            {chores().length > 0 ? (
              <For each={chores()}>
                {(chore) => (
                  <div 
                    class="card bg-base-100 shadow-sm border hover:shadow-md transition-shadow"
                    style={{ "border-left": `4px solid ${familyMember()?.color || '#ccc'}` }}
                  >
                    <div class="card-body py-4 px-6">
                      <div class="flex items-center justify-between">
                        <div class="flex items-center gap-3 flex-1">
                          {/* Icon */}
                          {chore.icon && (
                            <i 
                              class={`fas ${chore.icon} text-xl`} 
                              style={{ color: familyMember()?.color || '#666' }}
                            ></i>
                          )}
                          
                          {/* Title */}
                          <div class="flex-1">
                            <h3 class="font-semibold text-lg">{chore.title}</h3>
                            <div class="flex items-center justify-between text-sm mt-1">
                              {chore.recurring && (
                                <div class="flex items-center gap-2 opacity-70">
                                  <i class="fas fa-sync-alt"></i>
                                  <span>{formatRecurrence(chore)}</span>
                                </div>
                              )}
                              {chore.points && chore.points > 0 && (
                                <div class="flex items-center gap-1 text-yellow-600 font-medium">
                                  <i class="fas fa-star"></i>
                                  <span>{chore.points} points</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div class="flex items-center gap-2">
                          {/* Recurring indicator */}
                          {chore.recurring && (
                            <div class="tooltip" data-tip="Recurring chore">
                              <div class="badge badge-outline gap-1">
                                <i class="fas fa-sync-alt text-xs"></i>
                                Recurring
                              </div>
                            </div>
                          )}
                          
                          {/* Delete button */}
                          <button
                            class="btn btn-ghost btn-sm text-error hover:bg-error hover:text-error-content"
                            onClick={() => handleDeleteChore(chore)}
                            title="Delete chore"
                          >
                            <i class="fas fa-trash"></i>
                          </button>
                        </div>
                      </div>

                      {/* Created date */}
                      <div class="text-xs opacity-50 mt-2">
                        Created: {new Date(chore.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                )}
              </For>
            ) : (
              <div class="text-center py-12">
                <i class="fas fa-tasks text-4xl opacity-30 mb-4"></i>
                <h3 class="text-xl font-semibold mb-2">No Chores Found</h3>
                <p class="text-base-content/70">
                  {familyMember()?.name || 'This family member'} doesn't have any chores yet.
                </p>
                <button class="btn btn-primary mt-4" onClick={openChoreDialog}>
                  <i class="fas fa-plus mr-2"></i>
                  Add Chore
                </button>
              </div>
            )}
          </div>
        )}

        {/* Summary Stats */}
        {!loading() && chores().length > 0 && (
          <div class="stats shadow mt-8">
            <div class="stat">
              <div class="stat-title">Total Chores</div>
              <div class="stat-value text-primary">{chores().length}</div>
            </div>
            <div class="stat">
              <div class="stat-title">Recurring</div>
              <div class="stat-value text-secondary">
                {chores().filter(c => c.recurring).length}
              </div>
            </div>
            <div class="stat">
              <div class="stat-title">One-time</div>
              <div class="stat-value text-accent">
                {chores().filter(c => !c.recurring).length}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create Chore Dialog */}
      <CreateChoreDialog 
        show={showChoreDialog()} 
        onClose={closeChoreDialog}
        onSuccess={handleChoreCreated}
        familyMembers={familyMember() ? [familyMember()!] : []}
        preselectedFamilyMemberId={familyMember()?.id || undefined}
      />
    </main>
  );
}
