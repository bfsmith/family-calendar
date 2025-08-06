import { A } from "@solidjs/router";
import Counter from "~/components/Counter";
import LoadingSpinner from "~/components/LoadingSpinner";

export default function Home() {
  return (
    <main class="text-center mx-auto text-base-content p-4">
      <h1 class="max-6-xs text-6xl text-primary font-thin uppercase my-16">Family Calendar</h1>
      <Counter />
      
      {/* Clock Spinner Examples */}
      <div class="my-12">
        <h2 class="text-3xl font-bold text-base-content mb-6">Animated Clock Loading Indicators</h2>
        <p class="text-base-content/70 mb-8 max-w-2xl mx-auto">
          Our custom animated clock spinner shows realistic time progression at 15x speed - 
          perfect for a calendar app! Each simulated hour passes in just 4 seconds.
        </p>
        
        <div class="grid grid-cols-2 md:grid-cols-4 gap-8 items-center justify-items-center">
          <div class="text-center">
            <LoadingSpinner size="xs" variant="clock" color="primary" />
            <p class="text-sm text-base-content/60 mt-2">Extra Small</p>
          </div>
          
          <div class="text-center">
            <LoadingSpinner size="sm" variant="clock" color="secondary" />
            <p class="text-sm text-base-content/60 mt-2">Small</p>
          </div>
          
          <div class="text-center">
            <LoadingSpinner size="md" variant="clock" color="accent" />
            <p class="text-sm text-base-content/60 mt-2">Medium</p>
          </div>
          
          <div class="text-center">
            <LoadingSpinner size="lg" variant="clock" color="info" />
            <p class="text-sm text-base-content/60 mt-2">Large</p>
          </div>
        </div>
        
        <div class="mt-8">
          <h3 class="text-lg font-semibold text-base-content mb-4">With Loading Text</h3>
          <LoadingSpinner 
            size="md" 
            variant="clock" 
            color="primary" 
            text="Loading your calendar data..."
            className="max-w-md mx-auto"
          />
        </div>
      </div>
      
      {/* Theme test elements */}
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 my-8">
        <div class="card bg-primary text-primary-content">
          <div class="card-body">
            <h2 class="card-title">Primary Card</h2>
            <p>This should change with theme</p>
          </div>
        </div>
        <div class="card bg-secondary text-secondary-content">
          <div class="card-body">
            <h2 class="card-title">Secondary Card</h2>
            <p>This should change with theme</p>
          </div>
        </div>
        <div class="card bg-accent text-accent-content">
          <div class="card-body">
            <h2 class="card-title">Accent Card</h2>
            <p>This should change with theme</p>
          </div>
        </div>
      </div>
      
      <p class="mt-8">
        Visit{" "}
        <a href="https://solidjs.com" target="_blank" class="link link-primary">
          solidjs.com
        </a>{" "}
        to learn how to build Solid apps.
      </p>
      <div class="my-8">
        <A href="/calendar" class="btn btn-primary btn-lg">
          View Calendar
        </A>
        <p class="text-sm text-base-content/60 mt-2">
          See the clock spinner in action during database initialization
        </p>
      </div>
      
      <p class="my-4">
        <span>Home</span>
        {" - "}
        <A href="/about" class="link link-primary">
          About Page
        </A>{" "}
        {" - "}
        <A href="/calendar" class="link link-primary">
          Calendar
        </A>
      </p>
    </main>
  );
}
