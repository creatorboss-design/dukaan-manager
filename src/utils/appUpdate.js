import { Filesystem, Directory } from "@capacitor/filesystem";
import { FileTransfer } from "@capacitor/file-transfer";
import { AppInstallPlugin } from "@m430/capacitor-app-install";

/**
 * Downloads the APK at `url` into the app's private cache directory, then
 * hands it to Android's package installer. Because the new APK is signed
 * with the same key as the currently installed app and has a higher
 * versionCode (both are things YOU are responsible for on every release —
 * see the note at the top of this spec), Android shows this as a normal
 * "Update" prompt and preserves all existing app data — no uninstall step.
 *
 * @param {string} url - the apkUrl from the app_config/latest_release Firestore doc
 * @param {(percent: number) => void} onProgress - called with 0-100 as the download proceeds
 */
export async function downloadAndInstallUpdate(url, onProgress) {
  const { granted } = await AppInstallPlugin.canInstallUnknownApps();
  if (!granted) {
    await AppInstallPlugin.openInstallUnknownAppsSettings();
    throw new Error("Please enable \"Install unknown apps\" for Dukaan Manager, then try Update again.");
  }

  const fileName = "dukaan-manager-update.apk";
  const fileInfo = await Filesystem.getUri({ directory: Directory.Cache, path: fileName });

  const removeListener = await FileTransfer.addListener("progress", (progress) => {
    if (progress.contentLength > 0) {
      onProgress(Math.round((progress.bytes / progress.contentLength) * 100));
    }
  });

  try {
    await FileTransfer.downloadFile({ url, path: fileInfo.uri, progress: true });
  } finally {
    removeListener.remove();
  }

  onProgress(100);

  const result = await AppInstallPlugin.installApk({ filePath: fileInfo.uri });
  if (!result.completed) {
    throw new Error(result.message || "Could not start the installer.");
  }
}
