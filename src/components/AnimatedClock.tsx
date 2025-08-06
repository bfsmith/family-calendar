import { createSignal, onMount, onCleanup } from "solid-js";

interface AnimatedClockProps {
  size?: number;
  className?: string;
}

export default function AnimatedClock(props: AnimatedClockProps) {
  const [time, setTime] = createSignal(new Date());
  let intervalId: number | undefined;

  const size = () => props.size || 80;

  onMount(() => {
    // Update time every 66.67ms to simulate 1 hour every 4 seconds
    // 4 seconds = 4000ms for 12 hours, so each hour = 333.33ms
    // For smooth animation, update every 66.67ms (5 times per simulated hour)
    intervalId = setInterval(() => {
      setTime(prevTime => {
        const newTime = new Date(prevTime);
        // Add 12 minutes each update (1/5 of an hour)
        newTime.setMinutes(newTime.getMinutes() + 12);
        return newTime;
      });
    }, 66.67) as unknown as number;
  });

  onCleanup(() => {
    if (intervalId) {
      clearInterval(intervalId);
    }
  });

  const getHourAngle = () => {
    const hours = time().getHours() % 12;
    const minutes = time().getMinutes();
    // Hour hand moves 30 degrees per hour + 0.5 degrees per minute
    return (hours * 30) + (minutes * 0.5);
  };

  const getMinuteAngle = () => {
    const minutes = time().getMinutes();
    // Minute hand moves 6 degrees per minute
    return minutes * 6;
  };

  const centerX = () => size() / 2;
  const centerY = () => size() / 2;
  const hourHandLength = () => size() * 0.25;
  const minuteHandLength = () => size() * 0.35;

  return (
    <div class={`inline-block ${props.className || ""}`}>
      <svg
        width={size()}
        height={size()}
        viewBox={`0 0 ${size()} ${size()}`}
        class="animate-pulse"
      >
        {/* Clock face */}
        <circle
          cx={centerX()}
          cy={centerY()}
          r={size() / 2 - 4}
          fill="currentColor"
          fill-opacity="0.1"
          stroke="currentColor"
          stroke-width="2"
          class="text-primary"
        />
        
        {/* Hour markers */}
        {Array.from({ length: 12 }, (_, i) => {
          const angle = (i * 30) * (Math.PI / 180);
          const outerRadius = size() / 2 - 8;
          const innerRadius = size() / 2 - 16;
          const x1 = centerX() + Math.sin(angle) * innerRadius;
          const y1 = centerY() - Math.cos(angle) * innerRadius;
          const x2 = centerX() + Math.sin(angle) * outerRadius;
          const y2 = centerY() - Math.cos(angle) * outerRadius;
          
          return (
            <line
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="currentColor"
              stroke-width="2"
              class="text-primary opacity-60"
            />
          );
        })}

        {/* Minute hand */}
        <line
          x1={centerX()}
          y1={centerY()}
          x2={centerX() + Math.sin(getMinuteAngle() * (Math.PI / 180)) * minuteHandLength()}
          y2={centerY() - Math.cos(getMinuteAngle() * (Math.PI / 180)) * minuteHandLength()}
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          class="text-primary transition-transform duration-75 ease-linear"
        />

        {/* Hour hand */}
        <line
          x1={centerX()}
          y1={centerY()}
          x2={centerX() + Math.sin(getHourAngle() * (Math.PI / 180)) * hourHandLength()}
          y2={centerY() - Math.cos(getHourAngle() * (Math.PI / 180)) * hourHandLength()}
          stroke="currentColor"
          stroke-width="3"
          stroke-linecap="round"
          class="text-primary transition-transform duration-75 ease-linear"
        />

        {/* Center dot */}
        <circle
          cx={centerX()}
          cy={centerY()}
          r="3"
          fill="currentColor"
          class="text-primary"
        />
      </svg>
    </div>
  );
}
