import { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { Capacitor } from "@capacitor/core";
import { App as CapacitorApp } from "@capacitor/app";
import { db } from "../firebase/config";

/**
 * Checks Firestore's app_config/latest_release document against the
 * currently installed app's own version (read from the native app's own
 * build.gradle-defined versionCode via @capacitor/app). Does nothing at all
 * on non-native platforms (regular website, Electron) — this feature is
 * specific to the Android sideload-distribution model.
 *
 * @returns {{ checking: boolean, updateAvailable: boolean, latest: object|null, currentVersionName: string|null }}
 */
export function useAppUpdateCheck() {
  const [state, setState] = useState({
    checking: true,
    updateAvailable: false,
    latest: null,
    currentVersionName: null,
  });

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      setState((s) => ({ ...s, checking: false }));
      return;
    }

    (async () => {
      try {
        const [info, snap] = await Promise.all([
          CapacitorApp.getInfo(),
          getDoc(doc(db, "app_config", "latest_release")),
        ]);

        if (!snap.exists()) {
          setState({ checking: false, updateAvailable: false, latest: null, currentVersionName: info.version });
          return;
        }

        const latest = snap.data();
        const currentVersionCode = Number(info.build); // "build" is Capacitor's name for Android's versionCode
        const updateAvailable = Number(latest.versionCode) > currentVersionCode;

        setState({ checking: false, updateAvailable, latest, currentVersionName: info.version });
      } catch (err) {
        // Fail silently and quietly — an update check failing (e.g. no
        // internet) should never block or interrupt normal app use.
        console.error("Update check failed:", err);
        setState((s) => ({ ...s, checking: false }));
      }
    })();
  }, []);

  return state;
}
