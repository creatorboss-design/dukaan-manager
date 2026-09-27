import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { App as CapacitorApp } from "@capacitor/app";
import { closeTopModal, hasOpenModal } from "../../hooks/useModalBackStack";
import { useTrackNavigationHistory, goToPreviousScreen, isAtTopLevel } from "../../hooks/useNavigationHistory";
import { useToast } from "../../contexts/ToastContext";

/**
 * Renders nothing — this component's only job is to wire the Android
 * hardware/gesture back button to sensible in-app behavior:
 *   1. If a modal is open, close it (handled by useModalBackStack).
 *   2. Otherwise, if there's a previous screen in our tracked history,
 *      navigate there.
 *   3. Otherwise (we're at a top-level screen like Dashboard with nothing
 *      before it), require a second back-press within 2 seconds to
 *      actually exit the app, showing a toast on the first press — this
 *      is standard Android app behavior and prevents an accidental single
 *      back-press from closing the app unexpectedly.
 * Does nothing at all on non-native platforms (regular website, Electron)
 * — the browser's own back button already works correctly there.
 */
export default function BackButtonHandler() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const lastExitPromptAt = useRef(0);

  useTrackNavigationHistory();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const listenerPromise = CapacitorApp.addListener("backButton", () => {
      if (hasOpenModal()) {
        closeTopModal();
        return;
      }

      if (!isAtTopLevel()) {
        const moved = goToPreviousScreen(navigate);
        if (moved) return;
      }

      const now = Date.now();
      if (now - lastExitPromptAt.current < 2000) {
        CapacitorApp.exitApp();
        return;
      }
      lastExitPromptAt.current = now;
      showToast("Press back again to exit", "info");
    });

    return () => {
      listenerPromise.then((listener) => listener.remove());
    };
  }, [navigate, showToast]);

  return null;
}
