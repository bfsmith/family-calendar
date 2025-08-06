import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { Suspense, onMount, createSignal, Show } from "solid-js";
import Nav from "~/components/Nav";
import LoadingSpinner from "~/components/LoadingSpinner";
import { init } from "~/services/init";
import "./app.css";

export default function App() {
  const [isDbInitialized, setIsAppInitialized] = createSignal(false);
  const [initError, setInitError] = createSignal<string | null>(null);

  onMount(async () => {
    try {
      await init();
      console.log("Database initialized successfully");
      setIsAppInitialized(true);
    } catch (error) {
      console.error("Failed to initialize database:", error);
      setInitError(error instanceof Error ? error.message : "Failed to initialize database");
    }
  });

  return (
    <Show
      when={isDbInitialized()}
      fallback={
        <div class="min-h-screen flex items-center justify-center bg-base-100">
          <div class="text-center">
            <Show
              when={!initError()}
              fallback={
                <div class="max-w-md mx-auto text-center">
                  <div class="text-error text-6xl mb-4">⚠️</div>
                  <h2 class="text-2xl font-bold text-error mb-2">Initialization Error</h2>
                  <p class="text-base-content/70 mb-4">{initError()}</p>
                  <button 
                    class="btn btn-primary" 
                    onClick={() => window.location.reload()}
                  >
                    Retry
                  </button>
                </div>
              }
            >
              <LoadingSpinner
                size="lg"
                variant="clock"
                color="primary"
                text="Initializing Family Calendar... Setting up your calendar database."
                className="max-w-md mx-auto"
              />
            </Show>
          </div>
        </div>
      }
    >
      <Router
        root={props => (
          <>
            <Nav />
            <Suspense>{props.children}</Suspense>
          </>
        )}
      >
        <FileRoutes />
      </Router>
    </Show>
  );
}
