import { createSignal, onMount, Show } from 'solid-js';

export default function OfflineIndicator() {
  const [isOnline, setIsOnline] = createSignal(navigator.onLine);

  onMount(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  });

  return (
    <Show when={!isOnline()}>
      <div class="offline-indicator show">
        <div class="flex items-center justify-center gap-2">
          <i class="fas fa-wifi-slash"></i>
          <span>You're offline - some features may be limited</span>
        </div>
      </div>
    </Show>
  );
}
