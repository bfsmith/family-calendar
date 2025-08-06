import { createSignal, onMount } from "solid-js";

// All DaisyUI themes
const themes = [
  "light", "dark", "cupcake", "bumblebee", "emerald", "corporate", "synthwave", 
  "retro", "cyberpunk", "valentine", "halloween", "garden", "forest", "aqua", 
  "lofi", "pastel", "fantasy", "wireframe", "black", "luxury", "dracula", 
  "cmyk", "autumn", "business", "acid", "lemonade", "night", "coffee", "winter"
];

export default function ThemePicker() {
  const [currentTheme, setCurrentTheme] = createSignal("light");

  // Load saved theme from localStorage on mount
  onMount(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme && themes.includes(savedTheme)) {
      setCurrentTheme(savedTheme);
      document.documentElement.setAttribute("data-theme", savedTheme);
    } else {
      // Set default theme
      document.documentElement.setAttribute("data-theme", "light");
    }
  });

  const changeTheme = (theme: string) => {
    console.log("Changing theme to:", theme);
    setCurrentTheme(theme);
    
    // Apply theme to document element
    document.documentElement.setAttribute("data-theme", theme);
    
    localStorage.setItem("theme", theme);
    console.log("Current data-theme:", document.documentElement.getAttribute("data-theme"));
  };

  return (
    <div class="dropdown dropdown-end">
      <div tabindex="0" role="button" class="btn btn-ghost btn-circle">
        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z"/>
        </svg>
      </div>
      <ul tabindex="0" class="dropdown-content z-[1] menu menu-vertical  p-2 shadow bg-base-100 rounded-box w-80 max-h-96a overflow-y-auto2">
        <li class="menu-title">
          <span>Choose Theme</span>
        </li>
        {themes.map((theme) => (
          <li data-theme={theme}>
            <a 
              class={`flex items-center justify-between w-full ${currentTheme() === theme ? 'active' : ''}`}
              onClick={() => changeTheme(theme)}
            >
              <div class="flex items-center gap-2 min-w-0 flex-1">
                <div class="flex gap-1 flex-shrink-0">
                  <div class="w-2 h-2 rounded bg-primary"></div>
                  <div class="w-2 h-2 rounded bg-secondary"></div>
                  <div class="w-2 h-2 rounded bg-accent"></div>
                </div>
                <span class="capitalize truncate">{theme}</span>
              </div>
              {currentTheme() === theme && (
                <svg class="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                </svg>
              )}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
} 
