import { createSignal, onMount, Show } from 'solid-js';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = createSignal<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = createSignal(false);
  const [isInstalled, setIsInstalled] = createSignal(false);

  onMount(() => {
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstallPrompt(true);
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Check if user has previously dismissed the prompt
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
      const dismissedTime = parseInt(dismissed);
      const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
      if (dismissedTime > oneDayAgo) {
        setShowInstallPrompt(false);
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  });

  const handleInstallClick = async () => {
    const prompt = deferredPrompt();
    if (!prompt) return;

    try {
      await prompt.prompt();
      const { outcome } = await prompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
        localStorage.setItem('pwa-install-dismissed', Date.now().toString());
      }
      
      setDeferredPrompt(null);
      setShowInstallPrompt(false);
    } catch (error) {
      console.error('Error showing install prompt:', error);
    }
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  return (
    <Show when={showInstallPrompt() && !isInstalled() && deferredPrompt()}>
      <div class="fixed bottom-4 left-4 right-4 md:left-auto md:max-w-sm z-50 animate-slide-up">
        <div class="bg-base-100 border border-base-300 rounded-lg shadow-lg p-4">
          <div class="flex items-start gap-3">
            <div class="text-primary text-2xl">
              <i class="fas fa-download"></i>
            </div>
            <div class="flex-1">
              <h3 class="font-semibold text-base-content mb-1">
                Install Family Calendar
              </h3>
              <p class="text-sm text-base-content/70 mb-3">
                Install the app for quick access and offline functionality
              </p>
              <div class="flex gap-2">
                <button 
                  class="btn btn-primary btn-sm flex-1"
                  onClick={handleInstallClick}
                >
                  <i class="fas fa-plus mr-1"></i>
                  Install
                </button>
                <button 
                  class="btn btn-ghost btn-sm"
                  onClick={handleDismiss}
                >
                  Later
                </button>
              </div>
            </div>
            <button 
              class="btn btn-ghost btn-xs text-base-content/50 hover:text-base-content"
              onClick={handleDismiss}
            >
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>
      </div>
    </Show>
  );
}
