import AnimatedClock from "./AnimatedClock";

interface LoadingSpinnerProps {
  size?: "xs" | "sm" | "md" | "lg";
  variant?: "spinner" | "dots" | "ring" | "ball" | "bars" | "infinity" | "clock";
  color?: "primary" | "secondary" | "accent" | "neutral" | "info" | "success" | "warning" | "error";
  text?: string;
  fullScreen?: boolean;
  className?: string;
}

export default function LoadingSpinner(props: LoadingSpinnerProps) {
  const size = () => props.size || "md";
  const variant = () => props.variant || "clock";
  const color = () => props.color || "primary";
  
  const getClockSize = () => {
    switch (size()) {
      case "xs": return 24;
      case "sm": return 32;
      case "md": return 48;
      case "lg": return 80;
      default: return 48;
    }
  };
  
  const getLoadingClass = () => {
    let classes = "loading";
    
    // Add variant
    classes += ` loading-${variant()}`;
    
    // Add size
    classes += ` loading-${size()}`;
    
    // Add color
    classes += ` text-${color()}`;
    
    return classes;
  };

  const containerClass = () => {
    let classes = "flex flex-col items-center justify-center";
    
    if (props.fullScreen) {
      classes += " min-h-screen bg-base-100";
    }
    
    if (props.className) {
      classes += ` ${props.className}`;
    }
    
    return classes;
  };

  return (
    <div class={containerClass()}>
      {variant() === "clock" ? (
        <AnimatedClock 
          size={getClockSize()} 
          className={`text-${color()}`}
        />
      ) : (
        <div class={getLoadingClass()}></div>
      )}
      {props.text && (
        <p class="mt-4 text-base-content/70 text-center max-w-md">
          {props.text}
        </p>
      )}
    </div>
  );
}
