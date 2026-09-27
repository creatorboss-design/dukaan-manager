import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";

// Routes considered "top-level" — if the back button is pressed while on
// one of these with nothing before it in our own tracked stack, we treat
// this as "the user wants to exit the app" rather than navigating anywhere
// (handled by the exit-confirmation logic in BackButtonHandler.jsx).
const TOP_LEVEL_ROUTES = ["/dashboard", "/login", "/"];

// Module-level (not React state) so it survives re-renders without causing
// extra ones, and so it can be read synchronously by the back-button
// listener the same way the modal stack in useModalBackStack.js is.
let pathStack = [];

/**
 * Call once near the root of the app (inside the Router). Tracks every
 * route the user visits, in order, so the back button can navigate to the
 * literal previous screen rather than relying on the browser's own history
 * stack, which this app's auth-redirect logic (`<Navigate replace />`)
 * makes unreliable to depend on directly.
 */
export function useTrackNavigationHistory() {
  const location = useLocation();
  const lastPath = useRef(null);

  useEffect(() => {
    const path = location.pathname;
    if (path === lastPath.current) return; // avoid duplicate consecutive entries
    lastPath.current = path;
    pathStack.push(path);
    // Cap the stack so it can't grow unbounded over a long session.
    if (pathStack.length > 30) pathStack = pathStack.slice(-30);
  }, [location.pathname]);
}

/**
 * Attempts to navigate back to the previous tracked screen.
 * @param {Function} navigate - from useNavigate()
 * @returns {boolean} - true if it navigated somewhere, false if there was
 *   nothing to go back to (caller should treat this as "at the top level").
 */
export function goToPreviousScreen(navigate) {
  // Drop the current entry (top of stack is always "where we are now").
  if (pathStack.length > 0) pathStack.pop();

  const previous = pathStack[pathStack.length - 1];
  if (!previous) return false;

  navigate(previous);
  return true;
}

export function isAtTopLevel() {
  const current = pathStack[pathStack.length - 1];
  return !current || TOP_LEVEL_ROUTES.includes(current) || pathStack.length <= 1;
}
