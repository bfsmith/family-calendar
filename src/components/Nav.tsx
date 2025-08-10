import { useLocation } from "@solidjs/router";
import { A } from "@solidjs/router";
import ThemePicker from "./ThemePicker";

export default function Nav() {
  const location = useLocation();

  const active = (path: string) =>
    path == location.pathname ? "active" : "";

  return (
    <div class="navbar bg-primary text-primary-content">
      <div class="navbar-start">
        <ul class="menu menu-horizontal px-1">
          <li><A href="/" class={`${active("/")} text-xl`}><i class="fas fa-calendar"></i></A></li>
          <li><A href="/family-members" class={active("/family-members")}>Family Members</A></li>
          <li><A href="/calendar" class={active("/calendar")}>Calendar</A></li>
          <li><A href="/chores" class={active("/chores")}>Chores</A></li>
        </ul>
      </div>
      <div class="navbar-end">
        <ThemePicker />
      </div>
    </div>
  );
}
