import { createSignal, Show } from "solid-js";
import { dataExportService } from "../services/DataExportService";
import { FullExportData } from "../types/Export";

export default function Settings() {
  // Export state
  const [isExporting, setIsExporting] = createSignal(false);
  const [exportSummary, setExportSummary] = createSignal<Record<string, number> | null>(null);
  const [showExportSummary, setShowExportSummary] = createSignal(false);
  const [exportError, setExportError] = createSignal<string | null>(null);

  // Import state
  const [isImporting, setIsImporting] = createSignal(false);
  const [importFile, setImportFile] = createSignal<File | null>(null);
  const [importData, setImportData] = createSignal<FullExportData | null>(null);
  const [importSummary, setImportSummary] = createSignal<Record<string, number> | null>(null);
  const [currentDataSummary, setCurrentDataSummary] = createSignal<Record<string, number> | null>(null);
  const [hasExistingData, setHasExistingData] = createSignal(false);
  const [showImportValidation, setShowImportValidation] = createSignal(false);
  const [showImportConfirmation, setShowImportConfirmation] = createSignal(false);
  const [importError, setImportError] = createSignal<string | null>(null);
  const [importSuccess, setImportSuccess] = createSignal(false);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      setExportError(null);
      
      // Get export summary first
      const summary = await dataExportService.getExportSummary();
      setExportSummary(summary);
      setShowExportSummary(true);
      
    } catch (error) {
      console.error('Export failed:', error);
      setExportError(error instanceof Error ? error.message : 'Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  const confirmExport = async () => {
    try {
      setIsExporting(true);
      setExportError(null);
      
      // Perform the actual export
      const exportData = await dataExportService.exportAllData();
      
      // Download the file
      dataExportService.downloadExportFile(exportData);
      
      setShowExportSummary(false);
      
      // Show success message briefly
      setTimeout(() => {
        setExportSummary(null);
      }, 3000);
      
    } catch (error) {
      console.error('Export failed:', error);
      setExportError(error instanceof Error ? error.message : 'Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  const cancelExport = () => {
    setShowExportSummary(false);
    setExportSummary(null);
    setExportError(null);
  };

  // Import handlers
  const handleFileSelect = async (event: Event) => {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    
    if (!file) return;

    try {
      setImportError(null);
      setImportFile(file);
      
      // Validate file type
      if (!file.name.endsWith('.json')) {
        setImportError('Please select a JSON file');
        return;
      }

      // Read and validate file content
      const fileContent = await file.text();
      const validation = dataExportService.validateExportFile(fileContent);
      
      if (!validation.valid) {
        setImportError(`Invalid import file: ${validation.errors.join(', ')}`);
        return;
      }

      // Parse the data and show validation dialog
      const parsedData = JSON.parse(fileContent) as FullExportData;
      setImportData(parsedData);
      setImportSummary(validation.summary || {});
      setShowImportValidation(true);
      
    } catch (error) {
      console.error('File validation failed:', error);
      setImportError(error instanceof Error ? error.message : 'Failed to read file');
    }
  };

  const confirmImportValidation = async () => {
    try {
      setShowImportValidation(false);
      
      // Check for existing data
      const hasData = await dataExportService.hasExistingData();
      setHasExistingData(hasData);
      
      if (hasData) {
        // Get current data summary to show what will be lost
        const currentSummary = await dataExportService.getExportSummary();
        setCurrentDataSummary(currentSummary);
      }
      
      setShowImportConfirmation(true);
    } catch (error) {
      console.error('Error checking existing data:', error);
      // Show confirmation anyway with warning
      setHasExistingData(true);
      setShowImportConfirmation(true);
    }
  };

  const cancelImportValidation = () => {
    setShowImportValidation(false);
    setImportFile(null);
    setImportData(null);
    setImportSummary(null);
    // Reset file input
    const fileInput = document.getElementById('import-file-input') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const confirmImport = async () => {
    const data = importData();
    if (!data) return;

    try {
      setIsImporting(true);
      setImportError(null);
      setShowImportConfirmation(false);

      // Perform the import
      await dataExportService.importAllData(data);
      
      // Show success state
      setImportSuccess(true);
      
      // Reset state after delay
      setTimeout(() => {
        setImportSuccess(false);
        setImportFile(null);
        setImportData(null);
        setImportSummary(null);
        setCurrentDataSummary(null);
        setHasExistingData(false);
        // Reset file input
        const fileInput = document.getElementById('import-file-input') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      }, 3000);
      
    } catch (error) {
      console.error('Import failed:', error);
      setImportError(error instanceof Error ? error.message : 'Import failed');
      setShowImportConfirmation(false);
    } finally {
      setIsImporting(false);
    }
  };

  const cancelImport = () => {
    setShowImportConfirmation(false);
    setImportFile(null);
    setImportData(null);
    setImportSummary(null);
    setCurrentDataSummary(null);
    setHasExistingData(false);
    // Reset file input
    const fileInput = document.getElementById('import-file-input') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

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
              
              <Show when={importSuccess()} fallback={
                <div class="card-actions justify-center">
                  <input
                    id="import-file-input"
                    type="file"
                    accept=".json"
                    onChange={handleFileSelect}
                    class="file-input file-input-bordered file-input-success w-full max-w-xs mb-2"
                    disabled={isImporting()}
                  />
                  <Show when={importFile()}>
                    <p class="text-sm text-base-content/60">
                      Selected: {importFile()!.name}
                    </p>
                  </Show>
                </div>
              }>
                <div class="alert alert-success">
                  <i class="fas fa-check-circle"></i>
                  <span>Data imported successfully!</span>
                </div>
              </Show>
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
                <button 
                  class="btn btn-info" 
                  onClick={handleExport}
                  disabled={isExporting()}
                >
                  <Show when={isExporting()} fallback={<i class="fas fa-download mr-2"></i>}>
                    <span class="loading loading-spinner loading-sm mr-2"></span>
                  </Show>
                  {isExporting() ? 'Preparing Export...' : 'Export'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Export Error */}
        <Show when={exportError()}>
          <div class="alert alert-error mt-6">
            <i class="fas fa-exclamation-triangle"></i>
            <span>{exportError()}</span>
            <button 
              class="btn btn-ghost btn-sm"
              onClick={() => setExportError(null)}
            >
              <i class="fas fa-times"></i>
            </button>
          </div>
        </Show>

        {/* Import Error */}
        <Show when={importError()}>
          <div class="alert alert-error mt-6">
            <i class="fas fa-exclamation-triangle"></i>
            <span>{importError()}</span>
            <button 
              class="btn btn-ghost btn-sm"
              onClick={() => setImportError(null)}
            >
              <i class="fas fa-times"></i>
            </button>
          </div>
        </Show>

        {/* Export Summary Dialog */}
        <div class={`modal ${showExportSummary() ? 'modal-open' : ''}`}>
          <div class="modal-box max-w-2xl">
            <h3 class="font-bold text-lg mb-4">Export Summary</h3>
            
            <Show when={exportSummary()}>
              <div class="mb-6">
                <p class="mb-4 text-base-content/80">
                  The following data will be exported:
                </p>
                
                <div class="grid grid-cols-2 gap-4">
                  <Show when={exportSummary()!['familyMembers']}>
                    <div class="stat bg-base-200 rounded-lg">
                      <div class="stat-title">Family Members</div>
                      <div class="stat-value text-primary">{exportSummary()!['familyMembers']}</div>
                    </div>
                  </Show>
                  
                  <Show when={exportSummary()!['events']}>
                    <div class="stat bg-base-200 rounded-lg">
                      <div class="stat-title">Calendar Events</div>
                      <div class="stat-value text-secondary">{exportSummary()!['events']}</div>
                    </div>
                  </Show>
                  
                  <Show when={exportSummary()!['chores']}>
                    <div class="stat bg-base-200 rounded-lg">
                      <div class="stat-title">Chores</div>
                      <div class="stat-value text-accent">{exportSummary()!['chores']}</div>
                    </div>
                  </Show>
                  
                  <Show when={exportSummary()!['pointTransactions']}>
                    <div class="stat bg-base-200 rounded-lg">
                      <div class="stat-title">Point Transactions</div>
                      <div class="stat-value text-info">{exportSummary()!['pointTransactions']}</div>
                    </div>
                  </Show>
                </div>
                
                <div class="alert alert-info mt-4">
                  <i class="fas fa-info-circle"></i>
                  <span>
                    A JSON file will be downloaded to your device containing all your family calendar data.
                  </span>
                </div>
              </div>
            </Show>

            <div class="modal-action">
              <button class="btn btn-ghost" onClick={cancelExport}>
                Cancel
              </button>
              <button 
                class="btn btn-info" 
                onClick={confirmExport}
                disabled={isExporting()}
              >
                <Show when={isExporting()} fallback={<i class="fas fa-download mr-2"></i>}>
                  <span class="loading loading-spinner loading-sm mr-2"></span>
                </Show>
                {isExporting() ? 'Exporting...' : 'Download Export'}
              </button>
            </div>
          </div>
          <form method="dialog" class="modal-backdrop">
            <button type="button" onClick={cancelExport}>close</button>
          </form>
        </div>

        {/* Import Validation Dialog */}
        <div class={`modal ${showImportValidation() ? 'modal-open' : ''}`}>
          <div class="modal-box max-w-2xl">
            <h3 class="font-bold text-lg mb-4">Import File Validation</h3>
            
            <Show when={importSummary()}>
              <div class="mb-6">
                <p class="mb-4 text-base-content/80">
                  The following data was found in your import file:
                </p>
                
                <div class="grid grid-cols-2 gap-4">
                  <Show when={importSummary()!['familyMembers']}>
                    <div class="stat bg-base-200 rounded-lg">
                      <div class="stat-title">Family Members</div>
                      <div class="stat-value text-primary">{importSummary()!['familyMembers']}</div>
                    </div>
                  </Show>
                  
                  <Show when={importSummary()!['events']}>
                    <div class="stat bg-base-200 rounded-lg">
                      <div class="stat-title">Calendar Events</div>
                      <div class="stat-value text-secondary">{importSummary()!['events']}</div>
                    </div>
                  </Show>
                  
                  <Show when={importSummary()!['chores']}>
                    <div class="stat bg-base-200 rounded-lg">
                      <div class="stat-title">Chores</div>
                      <div class="stat-value text-accent">{importSummary()!['chores']}</div>
                    </div>
                  </Show>
                  
                  <Show when={importSummary()!['pointTransactions']}>
                    <div class="stat bg-base-200 rounded-lg">
                      <div class="stat-title">Point Transactions</div>
                      <div class="stat-value text-info">{importSummary()!['pointTransactions']}</div>
                    </div>
                  </Show>
                </div>
                
                <div class="alert alert-success mt-4">
                  <i class="fas fa-check-circle"></i>
                  <span>
                    Import file is valid and ready to import.
                  </span>
                </div>
              </div>
            </Show>

            <div class="modal-action">
              <button class="btn btn-ghost" onClick={cancelImportValidation}>
                Cancel
              </button>
              <button class="btn btn-success" onClick={confirmImportValidation}>
                <i class="fas fa-arrow-right mr-2"></i>
                Continue
              </button>
            </div>
          </div>
          <form method="dialog" class="modal-backdrop">
            <button type="button" onClick={cancelImportValidation}>close</button>
          </form>
        </div>

        {/* Import Confirmation Dialog */}
        <div class={`modal ${showImportConfirmation() ? 'modal-open' : ''}`}>
          <div class="modal-box max-w-3xl">
            <h3 class="font-bold text-lg mb-4 text-error">🚨 Confirm Data Import</h3>
            
            <div class="mb-6">
              <Show when={hasExistingData()} fallback={
                <div class="alert alert-info">
                  <i class="fas fa-info-circle"></i>
                  <div>
                    <h4 class="font-semibold">Ready to Import</h4>
                    <p class="text-sm">No existing data found. Your import data will be loaded into an empty database.</p>
                  </div>
                </div>
              }>
                <div class="alert alert-error">
                  <i class="fas fa-exclamation-triangle"></i>
                  <div>
                    <h4 class="font-semibold">This will PERMANENTLY DELETE ALL existing data!</h4>
                    <p class="text-sm">All current family members, events, chores, and points will be permanently deleted and replaced with the imported data.</p>
                  </div>
                </div>
                
                <Show when={currentDataSummary()}>
                  <div class="mt-4">
                    <h5 class="font-semibold text-base-content mb-2">Current data that will be LOST:</h5>
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-2 bg-base-200 p-4 rounded-lg">
                      <Show when={currentDataSummary()!['familyMembers']}>
                        <div class="text-center">
                          <div class="text-sm font-medium text-error">{currentDataSummary()!['familyMembers']}</div>
                          <div class="text-xs text-base-content/70">Family Members</div>
                        </div>
                      </Show>
                      
                      <Show when={currentDataSummary()!['events']}>
                        <div class="text-center">
                          <div class="text-sm font-medium text-error">{currentDataSummary()!['events']}</div>
                          <div class="text-xs text-base-content/70">Events</div>
                        </div>
                      </Show>
                      
                      <Show when={currentDataSummary()!['chores']}>
                        <div class="text-center">
                          <div class="text-sm font-medium text-error">{currentDataSummary()!['chores']}</div>
                          <div class="text-xs text-base-content/70">Chores</div>
                        </div>
                      </Show>
                      
                      <Show when={currentDataSummary()!['pointTransactions']}>
                        <div class="text-center">
                          <div class="text-sm font-medium text-error">{currentDataSummary()!['pointTransactions']}</div>
                          <div class="text-xs text-base-content/70">Point Records</div>
                        </div>
                      </Show>
                    </div>
                  </div>
                </Show>
              </Show>
              
              <div class="mt-4 p-4 bg-base-200 rounded-lg">
                <h5 class="font-semibold text-base-content mb-2">Data to be imported:</h5>
                <Show when={importSummary()}>
                  <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <Show when={importSummary()!['familyMembers']}>
                      <div class="text-center">
                        <div class="text-sm font-medium text-success">{importSummary()!['familyMembers']}</div>
                        <div class="text-xs text-base-content/70">Family Members</div>
                      </div>
                    </Show>
                    
                    <Show when={importSummary()!['events']}>
                      <div class="text-center">
                        <div class="text-sm font-medium text-success">{importSummary()!['events']}</div>
                        <div class="text-xs text-base-content/70">Events</div>
                      </div>
                    </Show>
                    
                    <Show when={importSummary()!['chores']}>
                      <div class="text-center">
                        <div class="text-sm font-medium text-success">{importSummary()!['chores']}</div>
                        <div class="text-xs text-base-content/70">Chores</div>
                      </div>
                    </Show>
                    
                    <Show when={importSummary()!['pointTransactions']}>
                      <div class="text-center">
                        <div class="text-sm font-medium text-success">{importSummary()!['pointTransactions']}</div>
                        <div class="text-xs text-base-content/70">Point Records</div>
                      </div>
                    </Show>
                  </div>
                </Show>
              </div>
              
              <Show when={hasExistingData()}>
                <div class="mt-4">
                  <p class="text-base-content/80 mb-2 font-semibold">Before proceeding:</p>
                  <ul class="list-disc list-inside text-sm text-base-content/70 space-y-1">
                    <li><strong>Export your current data</strong> as a backup if you want to keep it</li>
                    <li>Ensure the import file contains the correct data</li>
                    <li>This action <strong>CANNOT BE UNDONE</strong></li>
                  </ul>
                </div>
              </Show>
            </div>

            <div class="modal-action">
              <button class="btn btn-ghost" onClick={cancelImport}>
                Cancel
              </button>
              <button 
                class={`btn ${hasExistingData() ? 'btn-error' : 'btn-success'}`}
                onClick={confirmImport}
                disabled={isImporting()}
              >
                <Show when={isImporting()} fallback={<i class="fas fa-upload mr-2"></i>}>
                  <span class="loading loading-spinner loading-sm mr-2"></span>
                </Show>
                {isImporting() ? 'Importing...' : hasExistingData() ? 'DELETE & Import Data' : 'Import Data'}
              </button>
            </div>
          </div>
          <form method="dialog" class="modal-backdrop">
            <button type="button" onClick={cancelImport}>close</button>
          </form>
        </div>
      </div>
    </main>
  );
}
