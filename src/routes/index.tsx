import { A } from "@solidjs/router";

export default function Home() {
  return (
    <main class="max-w-6xl mx-auto text-base-content p-6">
      {/* Hero Section */}
      <div class="text-center mb-16">
        <h1 class="text-5xl md:text-6xl text-primary font-bold mb-6">
          <i class="fas fa-calendar mr-4"></i>
          Family Calendar
        </h1>
        <p class="text-xl text-base-content/80 max-w-3xl mx-auto mb-8">
          Organize your family life with a comprehensive calendar and chore management system. 
          Keep everyone on track with events, tasks, and point-based rewards.
        </p>
        <div class="flex flex-wrap gap-4 justify-center">
          <A href="/calendar" class="btn btn-primary btn-lg">
            <i class="fas fa-calendar-alt mr-2"></i>
            View Calendar
          </A>
          <A href="/chores" class="btn btn-outline btn-lg">
            <i class="fas fa-tasks mr-2"></i>
            Manage Chores
          </A>
        </div>
      </div>

      {/* Features Section */}
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
        {/* Family Members */}
        <div class="card bg-base-100 shadow-lg border border-base-300">
          <div class="card-body text-center">
            <div class="text-4xl text-primary mb-4">
              <i class="fas fa-users"></i>
            </div>
            <h3 class="card-title justify-center text-xl mb-2">Family Members</h3>
            <p class="text-base-content/70">
              Add your family members with unique colors. Track individual schedules and achievements.
            </p>
            <div class="card-actions justify-center mt-4">
              <A href="/family-members" class="btn btn-sm btn-outline">
                Manage Members
              </A>
            </div>
          </div>
        </div>

        {/* Calendar Events */}
        <div class="card bg-base-100 shadow-lg border border-base-300">
          <div class="card-body text-center">
            <div class="text-4xl text-secondary mb-4">
              <i class="fas fa-calendar-week"></i>
            </div>
            <h3 class="card-title justify-center text-xl mb-2">Events & Scheduling</h3>
            <p class="text-base-content/70">
              Create one-time and recurring events. View your family's schedule in an intuitive calendar layout.
            </p>
            <div class="card-actions justify-center mt-4">
              <A href="/calendar" class="btn btn-sm btn-outline">
                View Calendar
              </A>
            </div>
          </div>
        </div>

        {/* Chores & Points */}
        <div class="card bg-base-100 shadow-lg border border-base-300">
          <div class="card-body text-center">
            <div class="text-4xl text-accent mb-4">
              <i class="fas fa-star"></i>
            </div>
            <h3 class="card-title justify-center text-xl mb-2">Chores & Points</h3>
            <p class="text-base-content/70">
              Assign chores with point values. Track completion and reward family members for their contributions.
            </p>
            <div class="card-actions justify-center mt-4">
              <A href="/chores" class="btn btn-sm btn-outline">
                View Chores
              </A>
            </div>
          </div>
        </div>
      </div>

      {/* Key Features */}
      <div class="bg-base-200 rounded-2xl p-8 mb-16">
        <h2 class="text-3xl font-bold text-center mb-8">Key Features</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="flex items-start gap-4">
            <div class="text-2xl text-primary">
              <i class="fas fa-sync-alt"></i>
            </div>
            <div>
              <h4 class="font-semibold text-lg mb-2">Recurring Tasks</h4>
              <p class="text-base-content/70">
                Set up daily, weekly, or custom recurring events and chores that automatically appear on schedule.
              </p>
            </div>
          </div>

          <div class="flex items-start gap-4">
            <div class="text-2xl text-secondary">
              <i class="fas fa-mobile-alt"></i>
            </div>
            <div>
              <h4 class="font-semibold text-lg mb-2">Mobile Responsive</h4>
              <p class="text-base-content/70">
                Optimized for tablets and mobile devices, so you can manage your family schedule anywhere.
              </p>
            </div>
          </div>

          <div class="flex items-start gap-4">
            <div class="text-2xl text-accent">
              <i class="fas fa-chart-line"></i>
            </div>
            <div>
              <h4 class="font-semibold text-lg mb-2">Point Tracking</h4>
              <p class="text-base-content/70">
                Award points for completed chores with a complete transaction ledger for transparency.
              </p>
            </div>
          </div>

          <div class="flex items-start gap-4">
            <div class="text-2xl text-info">
              <i class="fas fa-database"></i>
            </div>
            <div>
              <h4 class="font-semibold text-lg mb-2">Local Storage</h4>
              <p class="text-base-content/70">
                All your data is stored locally in your browser - no accounts needed, complete privacy.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Getting Started */}
      <div class="text-center bg-primary/10 rounded-2xl p-8">
        <h2 class="text-3xl font-bold mb-4">Get Started</h2>
        <p class="text-lg text-base-content/80 mb-6 max-w-2xl mx-auto">
          Ready to organize your family life? Start by adding your family members, then create your first events and chores.
        </p>
        <A href="/family-members" class="btn btn-primary btn-lg">
          <i class="fas fa-plus mr-2"></i>
          Add Family Members
        </A>
      </div>
    </main>
  );
}
