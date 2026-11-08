import { useSyncExternalStore } from "react";

// An in-memory stand-in for the App Router, which needs a running Next.js app.
// It keeps a history stack, so tests can press the browser's Back and Forward.

const ORIGIN = "http://localhost";

let entries = [new URL("/", ORIGIN)];
let index = 0;
const listeners = new Set<() => void>();

function currentUrl() {
  return entries[index];
}

function notify() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export const mockRouter = {
  push(href: string) {
    entries = [...entries.slice(0, index + 1), new URL(href, currentUrl())];
    index += 1;
    notify();
  },
  replace(href: string) {
    entries[index] = new URL(href, currentUrl());
    notify();
  },
  back() {
    index = Math.max(index - 1, 0);
    notify();
  },
  forward() {
    index = Math.min(index + 1, entries.length - 1);
    notify();
  },
  /** The current URL's search string, such as "?step=phone". */
  get search() {
    return currentUrl().search;
  },
  /** Starts the next test on `href`, with no history. */
  reset(href = "/") {
    entries = [new URL(href, ORIGIN)];
    index = 0;
  },
};

export function useRouter() {
  return mockRouter;
}

export function usePathname() {
  return useSyncExternalStore(subscribe, () => currentUrl().pathname);
}

export function useSearchParams() {
  return useSyncExternalStore(subscribe, currentUrl).searchParams;
}
