import { createSignal } from "solid-js";

export default function Counter() {
  const [count, setCount] = createSignal(0);
  return (
    <button
      class="btn btn-outline w-[200px] rounded-full px-[2rem] py-[1rem]" 
      onClick={() => setCount(count() + 1)}
    >
      Clicks: {count()}
    </button>
  );
}
