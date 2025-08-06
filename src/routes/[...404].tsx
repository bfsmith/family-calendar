import { A } from "@solidjs/router";

export default function NotFound() {
  return (
    <main class="text-center mx-auto text-base-content p-4">
      <h1 class="max-6-xs text-6xl text-primary font-thin uppercase my-16">Not Found</h1>
      <p class="mt-8">
        Visit{" "}
        <a href="https://solidjs.com" target="_blank" class="link link-primary">
          solidjs.com
        </a>{" "}
        to learn how to build Solid apps.
      </p>
      <p class="my-4">
        <A href="/" class="link link-primary">
          Home
        </A>
        {" - "}
        <A href="/about" class="link link-primary">
          About Page
        </A>
      </p>
    </main>
  );
}
