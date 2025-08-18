export default function Settings() {
  return (
    <main class="p-4">
      <div class="max-w-4xl mx-auto">
        <h1 class="text-3xl font-bold text-primary mb-8">Settings</h1>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Import Card */}
          <div class="card bg-base-100 shadow-lg border border-base-300 hover:shadow-xl transition-shadow">
            <div class="card-body text-center">
              <div class="text-4xl text-success mb-4">
                <i class="fas fa-file-import"></i>
              </div>
              <h2 class="card-title justify-center text-xl mb-2">Import Data</h2>
              <p class="text-base-content/70 mb-4">
                Import your family calendar data, events, chores, and family members from a backup file.
              </p>
              <div class="card-actions justify-center">
                <button class="btn btn-success">
                  <i class="fas fa-upload mr-2"></i>
                  Import
                </button>
              </div>
            </div>
          </div>

          {/* Export Card */}
          <div class="card bg-base-100 shadow-lg border border-base-300 hover:shadow-xl transition-shadow">
            <div class="card-body text-center">
              <div class="text-4xl text-info mb-4">
                <i class="fas fa-file-export"></i>
              </div>
              <h2 class="card-title justify-center text-xl mb-2">Export Data</h2>
              <p class="text-base-content/70 mb-4">
                Export all your family calendar data to create a backup file that can be imported later.
              </p>
              <div class="card-actions justify-center">
                <button class="btn btn-info">
                  <i class="fas fa-download mr-2"></i>
                  Export
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
