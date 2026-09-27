import { Capacitor } from "@capacitor/core";
import { Browser } from "@capacitor/browser";

/**
 * Opens a URL correctly depending on the platform:
 * - On native Android/iOS (running inside the Capacitor-wrapped app), uses
 *   the Capacitor Browser plugin, which opens a proper in-app browser tab
 *   (or hands off to an installed app like WhatsApp via the OS) instead of
 *   loading the URL inside the app's own WebView with no way back.
 * - On the regular website or the Electron desktop build, falls back to a
 *   normal window.open, which is the correct and already-working behavior
 *   there — this function is safe to use everywhere in the app.
 *
 * @param {string} url
 */
export async function openExternal(url) {
  if (!url) return;
  if (Capacitor.isNativePlatform()) {
    await Browser.open({ url });
  } else {
    window.open(url, "_blank", "noopener,noreferrer");
  }
}
