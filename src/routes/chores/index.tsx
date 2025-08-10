import { createSignal, onMount, For, createMemo } from "solid-js";
import CreateChoreDialog from "../../components/CreateChoreDialog";
import { familyMemberStorage } from "../../services/FamilyMemberStorage";
import { choreStorage } from "../../services/ChoreStorage";
import type { FamilyMember } from "../../types/FamilyMember";
import type { Chore } from "../../types/Chore";

export default function Chores() {

  const [showChoreDialog, setShowChoreDialog] = createSignal(false);
  const [familyMembers, setFamilyMembers] = createSignal<FamilyMember[]>([]);
  const [chores, setChores] = createSignal<Chore[]>([]);
  const [selectedChoreId, setSelectedChoreId] = createSignal<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = createSignal(false);
  const [choreToDelete, setChoreToDelete] = createSignal<Chore | null>(null);
  const [currentDate, setCurrentDate] = createSignal(new Date());
  const [completedChores, setCompletedChores] = createSignal<Set<string>>(new Set());
  const [visibleFamilyMembers, setVisibleFamilyMembers] = createSignal<Set<string>>(new Set());

  const openChoreDialog = () => {
    setShowChoreDialog(true);
  };

  const closeChoreDialog = () => {
    setShowChoreDialog(false);
  };

  const goToPreviousDay = () => {
    const current = currentDate();
    const previous = new Date(current);
    previous.setDate(current.getDate() - 1);
    setCurrentDate(previous);
    loadChores(); // Reload chores for the new date
  };

  const goToNextDay = () => {
    const current = currentDate();
    const next = new Date(current);
    next.setDate(current.getDate() + 1);
    setCurrentDate(next);
    loadChores(); // Reload chores for the new date
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    loadChores(); // Reload chores for today
  };

  const formatDisplayDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const loadFamilyMembers = async () => {
    try {
      const allFamilyMembers = await familyMemberStorage.getAllFamilyMembers();
      setFamilyMembers(allFamilyMembers);
      
      // Initialize visible family members from localStorage or show all by default
      const savedVisible = localStorage.getItem('visibleFamilyMembersChores');
      if (savedVisible) {
        try {
          const visibleIds = JSON.parse(savedVisible) as string[];
          setVisibleFamilyMembers(new Set(visibleIds));
        } catch (error) {
          console.error("Failed to parse saved family member visibility:", error);
          setVisibleFamilyMembers(new Set(allFamilyMembers.map(fm => fm.id)));
        }
      } else {
        // Default to showing all family members
        setVisibleFamilyMembers(new Set(allFamilyMembers.map(fm => fm.id)));
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
    // Save to localStorage with different key for chores
    localStorage.setItem('visibleFamilyMembersChores', JSON.stringify(Array.from(newVisible)));
  };

  const isMultipleFamilyMembers = () => familyMembers().length > 1;
  const getVisibleFamilyMembers = () => familyMembers().filter(fm => visibleFamilyMembers().has(fm.id));

  const loadChores = async () => {
    try {
      // Get chores for the current selected date
      const date = currentDate();
      const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
      
      const allChores = await choreStorage.queryChores({
        startDate: startOfDay,
        endDate: endOfDay
      });
      setChores(allChores);
      
      // Load completion status for all chores
      await loadChoreCompletions();
    } catch (error) {
      console.error("Failed to load chores:", error);
    }
  };

  const loadChoreCompletions = async () => {
    try {
      const completed = new Set<string>();
      const date = currentDate();
      const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      
      for (const chore of chores()) {
        const originalChoreId = chore.id.includes('_') ? chore.id.split('_')[0] : chore.id;
        
        // Get all completions for this chore
        const completions = await choreStorage.getChoreCompletions(originalChoreId);
        
        // For recurring chores, match by exact occurrence time
        // For non-recurring chores, match by date only
        let isCompleted = false;
        
        if (chore.id.includes('_')) {
          // Recurring chore - extract the specific occurrence time from virtual ID
          const timestamp = parseInt(chore.id.split('_')[1]);
          const choreOccurrenceTime = new Date(timestamp);
          
          // Check if any completion matches the exact occurrence time
          isCompleted = completions.some(completion => {
            const completionTime = new Date(completion.occurrenceDate);
            return completionTime.getTime() === choreOccurrenceTime.getTime();
          });
        } else {
          // Non-recurring chore - match by date only
          isCompleted = completions.some(completion => {
            const completionDate = new Date(completion.occurrenceDate);
            const completionDateOnly = new Date(completionDate.getFullYear(), completionDate.getMonth(), completionDate.getDate());
            return completionDateOnly.getTime() === targetDate.getTime();
          });
        }
        
        if (isCompleted) {
          completed.add(chore.id);
        }
      }
      
      setCompletedChores(completed);
    } catch (error) {
      console.error("Failed to load chore completions:", error);
    }
  };

  const handleChoreCreated = () => {
    loadChores(); // Reload chores after creating a new one
  };

  const handleChoreClick = (chore: Chore, e: MouseEvent) => {
    e.stopPropagation(); // Prevent deselection
    
    // Check if the click was on the delete button or checkbox
    const target = e.target as HTMLElement;
    if (target.closest('.delete-button') || target.closest('.checkbox-button')) {
      return; // Let the specific button handle its own click
    }
    
    // Toggle completion when clicking anywhere else on the chore
    toggleChoreCompletion(chore);
  };

  const handleDeleteClick = (chore: Chore, e: MouseEvent) => {
    e.stopPropagation(); // Prevent chore selection
    setChoreToDelete(chore);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    const chore = choreToDelete();
    if (!chore) return;

    try {
      // Extract original chore ID if this is a recurring occurrence
      const originalChoreId = chore.id.includes('_') ? chore.id.split('_')[0] : chore.id;
      await choreStorage.deleteChore(originalChoreId);
      setShowDeleteDialog(false);
      setChoreToDelete(null);
      setSelectedChoreId(null);
      loadChores(); // Reload chores after deletion
    } catch (error) {
      console.error("Failed to delete chore:", error);
      alert("Failed to delete chore. Please try again.");
    }
  };

  const cancelDelete = () => {
    setShowDeleteDialog(false);
    setChoreToDelete(null);
  };

  // Helper function to get chores for a specific family member (as a reactive computed)
  const getChoresForFamilyMember = createMemo(() => {
    const choresByMember = new Map<string, Chore[]>();
    chores().forEach(chore => {
      if (!choresByMember.has(chore.familyMemberId)) {
        choresByMember.set(chore.familyMemberId, []);
      }
      choresByMember.get(chore.familyMemberId)!.push(chore);
    });
    return choresByMember;
  });

  // Helper function to calculate chore position (for time-based chores)
  const getChoreStyle = (chore: Chore) => {
    // For now, stack chores vertically since most chores aren't time-specific
    // You could enhance this to support time-based positioning for hourly chores
    return {
      position: "relative" as const,
      "margin-bottom": "8px"
    };
  };

  const toggleChoreCompletion = async (chore: Chore, e?: MouseEvent) => {
    if (e) e.stopPropagation();
    
    try {
      const originalChoreId = chore.id.includes('_') ? chore.id.split('_')[0] : chore.id;
      const isCurrentlyCompleted = completedChores().has(chore.id);
      
      if (isCurrentlyCompleted) {
        // Uncomplete the chore - remove from database and local state
        // For recurring chores, extract the specific occurrence time from the virtual ID
        let occurrenceDate: Date;
        if (chore.id.includes('_')) {
          // Virtual recurring chore - extract timestamp from ID
          const timestamp = parseInt(chore.id.split('_')[1]);
          occurrenceDate = new Date(timestamp);
        } else {
          // Non-recurring chore - use current date
          occurrenceDate = currentDate();
        }
        
        await choreStorage.removeChoreCompletion(originalChoreId, occurrenceDate);
        
        const newCompleted = new Set(completedChores());
        newCompleted.delete(chore.id);
        setCompletedChores(newCompleted);
        
        // Reload family members to get updated point balances
        await loadFamilyMembers();
      } else {
        // Mark as complete
        // For recurring chores, extract the specific occurrence time from the virtual ID
        let occurrenceDate: Date;
        if (chore.id.includes('_')) {
          // Virtual recurring chore - extract timestamp from ID
          const timestamp = parseInt(chore.id.split('_')[1]);
          occurrenceDate = new Date(timestamp);
        } else {
          // Non-recurring chore - use current date
          occurrenceDate = currentDate();
        }
        
        await choreStorage.markChoreComplete({
          choreId: originalChoreId,
          familyMemberId: chore.familyMemberId,
          occurrenceDate: occurrenceDate
        });
        
        // Update local state
        const newCompleted = new Set(completedChores());
        newCompleted.add(chore.id);
        setCompletedChores(newCompleted);
        
        // Reload family members to get updated point balances
        await loadFamilyMembers();
      }
      
    } catch (error) {
      console.error("Failed to toggle chore completion:", error);
    }
  };

  onMount(() => {
    // Load family members and chores on mount
    loadFamilyMembers();
    loadChores();
  });

  return (
    <main class="p-4" onClick={() => setSelectedChoreId(null)}>
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-3xl font-bold text-primary">Chores</h1>
        <div class="flex gap-2 items-center">
          {/* Family member management dropdown */}
          {familyMembers().length > 0 && (
            <div class="dropdown dropdown-end">
              <div tabindex="0" role="button" class="btn btn-outline btn-sm">
                <i class="fas fa-users mr-2"></i>
                Manage
              </div>
              <ul tabindex="0" class="dropdown-content menu bg-base-100 rounded-box z-[1] w-56 p-2 shadow-lg border border-base-300">
                <li class="menu-title">
                  <span>View Individual Chores</span>
                </li>
                <div class="divider my-1"></div>
                <For each={familyMembers()}>
                  {(member) => (
                    <li>
                      <a href={`/chores/${member.id}`} class="flex items-center gap-3 px-2 py-2">
                        <div 
                          class="w-4 h-4 rounded-full flex-shrink-0"
                          style={{ "background-color": member.color }}
                        ></div>
                        <span class="flex-1">{member.name}'s Chores</span>
                        <i class="fas fa-external-link-alt text-xs opacity-50"></i>
                      </a>
                    </li>
                  )}
                </For>
              </ul>
            </div>
          )}

          {/* Family Member Filter Dropdown */}
          {isMultipleFamilyMembers() && (
            <div class="dropdown dropdown-end">
              <div tabindex="0" role="button" class="btn btn-outline btn-sm">
                <i class="fas fa-filter mr-2"></i>
                Filter ({getVisibleFamilyMembers().length}/{familyMembers().length})
              </div>
              <ul tabindex="0" class="dropdown-content menu bg-base-100 rounded-box z-[1] w-64 p-2 shadow-lg border border-base-300">
                <li class="menu-title">
                  <span>Show/Hide Family Members</span>
                </li>
                <div class="divider my-1"></div>
                <For each={familyMembers()}>
                  {(member) => (
                    <li>
                      <label class="cursor-pointer flex items-center gap-3 px-2 py-2">
                        <input 
                          type="checkbox" 
                          class="checkbox checkbox-sm"
                          checked={visibleFamilyMembers().has(member.id)}
                          onChange={() => toggleFamilyMemberVisibility(member.id)}
                        />
                        <div 
                          class="w-4 h-4 rounded-full flex-shrink-0"
                          style={{ "background-color": member.color }}
                        ></div>
                        <span class="flex-1">{member.name}</span>
                      </label>
                    </li>
                  )}
                </For>
                <div class="divider my-1"></div>
                <li>
                  <button 
                    class="btn btn-xs btn-ghost"
                    onClick={() => {
                      const allIds = familyMembers().map(fm => fm.id);
                      setVisibleFamilyMembers(new Set(allIds));
                      localStorage.setItem('visibleFamilyMembersChores', JSON.stringify(allIds));
                    }}
                  >
                    Show All
                  </button>
                </li>
              </ul>
            </div>
          )}
          
          <button class="btn btn-primary" onClick={openChoreDialog}>
            <i class="fas fa-plus mr-2"></i>
            Add Chore
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
        
        {/* Family Member columns */}
        {getVisibleFamilyMembers().length > 0 ? (
          <For each={getVisibleFamilyMembers()}>
            {(member) => (
                <div class="flex-1 min-w-48 border-r border-base-300 last:border-r-0 relative">
                  <div 
                    class="h-12 border-b border-base-300 flex items-center justify-center text-sm font-medium text-base-content"
                    style={{ "background-color": member.color + "20" }}
                  >
                    <div 
                      class="w-3 h-3 rounded-full mr-2"
                      style={{ "background-color": member.color }}
                    ></div>
                    {member.name}
                    {(getChoresForFamilyMember().get(member.id) || []).length > 0 && (
                      <span class="ml-2 badge badge-xs badge-primary">
                        {(getChoresForFamilyMember().get(member.id) || []).length}
                      </span>
                    )}
                    <span class="ml-2 text-xs text-yellow-600 font-medium">
                      <i class="fas fa-star mr-1"></i>
                      {member.points || 0}
                    </span>
                  </div>
                  
                  {/* Chores container */}
                  <div class="relative p-2 min-h-96">
                    <For each={getChoresForFamilyMember().get(member.id) || []}>
                      {(chore) => (
                        <div
                          class="group rounded-md p-3 mb-2 text-sm font-medium shadow-sm border-l-4 cursor-pointer hover:shadow-md transition-shadow relative"
                          style={{
                            ...getChoreStyle(chore),
                            "background-color": member.color + "20",
                            "border-left-color": member.color,
                            "border": `1px solid ${member.color}40`
                          }}
                          title="Click to toggle completion"
                          onClick={(e) => handleChoreClick(chore, e)}
                        >
                          <div class="flex items-center gap-2 mb-2">
                            {chore.icon && (
                              <i class={`fas ${chore.icon} text-lg`} style={{ color: member.color }}></i>
                            )}
                            <div class="truncate font-semibold flex-1" style={{ color: member.color }}>
                              {chore.title}
                            </div>
                            <button
                              class={`checkbox-button w-6 h-6 border-2 rounded flex items-center justify-center transition-all group ${
                                completedChores().has(chore.id) 
                                  ? 'bg-green-500 border-green-500' 
                                  : 'hover:bg-gray-100 hover:border-gray-400'
                              }`}
                              style={{ 
                                "border-color": completedChores().has(chore.id) 
                                  ? '#10B981' 
                                  : member.color + "60" 
                              }}
                              onClick={(e) => toggleChoreCompletion(chore, e)}
                              title={completedChores().has(chore.id) ? "Click to uncomplete" : "Click to complete"}
                            >
                              <i 
                                class={`fas fa-check text-xs transition-opacity ${
                                  completedChores().has(chore.id) 
                                    ? 'opacity-100 text-white' 
                                    : 'opacity-0 group-hover:opacity-30'
                                }`} 
                                style={{ 
                                  color: completedChores().has(chore.id) 
                                    ? 'white' 
                                    : member.color 
                                }}
                              ></i>
                            </button>
                          </div>
                          
                          <div class="flex items-center justify-between text-xs opacity-70 mt-1">
                            <div style={{ color: member.color }}>
                              {chore.recurring && (
                                <>
                                  <i class="fas fa-repeat mr-1"></i>
                                  {chore.recurring.type === 'daily' ? `Every ${chore.recurring.interval} day(s)` :
                                   chore.recurring.type === 'weekly' ? `Weekly` :
                                   chore.recurring.type === 'hourly' ? `Hourly` : 'Recurring'}
                                </>
                              )}
                            </div>
                            {chore.points && chore.points > 0 && (
                              <div class="text-yellow-600 font-medium">
                                <i class="fas fa-star mr-1"></i>
                                {chore.points} pts
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </For>
                    
                    {(getChoresForFamilyMember().get(member.id) || []).length === 0 && (
                      <div class="text-center text-base-content/50 py-8">
                        <i class="fas fa-tasks text-2xl mb-2 opacity-50"></i>
                        <div class="text-sm">No chores for today</div>
                      </div>
                    )}
                  </div>
                </div>
            )}
          </For>
        ) : familyMembers().length === 0 ? (
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

      <CreateChoreDialog 
        show={showChoreDialog()} 
        onClose={closeChoreDialog}
        onSuccess={handleChoreCreated}
        familyMembers={familyMembers()}
      />

      {/* Delete confirmation dialog */}
      <div class={`modal ${showDeleteDialog() ? 'modal-open' : ''}`}>
        <div class="modal-box">
          <h3 class="font-bold text-lg mb-4">Delete Chore</h3>
          <p class="mb-4">
            Are you sure you want to delete "{choreToDelete()?.title}"? This action cannot be undone.
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
