import { useState } from "react";
import { Download, X } from "lucide-react";
import { useAppUpdateCheck } from "../../hooks/useAppUpdateCheck";
import Modal from "./Modal";
import BigButton from "./BigButton";
import { downloadAndInstallUpdate } from "../../utils/appUpdate";
import { useToast } from "../../contexts/ToastContext";

export default function UpdateBanner() {
  const { updateAvailable, latest, currentVersionName } = useAppUpdateCheck();
  const [dismissed, setDismissed] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [progress, setProgress] = useState(0);
  const { showToast } = useToast();

  if (!updateAvailable || dismissed) return null;

  const handleUpdate = async () => {
    setInstalling(true);
    try {
      await downloadAndInstallUpdate(latest.apkUrl, (pct) => setProgress(pct));
      // If we get here, the native installer prompt has been handed the
      // file and shown to the user — there's nothing more for this screen
      // to do; the OS takes over from here.
    } catch (err) {
      console.error("Update failed:", err);
      showToast(err.message || "Update failed. Please try again.", "error");
      setInstalling(false);
    }
  };

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-40 bg-blue-700 text-white px-4 py-2.5 flex items-center justify-between shadow-md safe-area-pt">
        <button onClick={() => setModalOpen(true)} className="flex items-center gap-2 text-sm font-medium flex-1 text-left">
          <Download size={16} />
          Update available (v{latest.versionName}) — tap to update
        </button>
        <button onClick={() => setDismissed(true)} className="text-blue-200 hover:text-white p-1 ml-2">
          <X size={16} />
        </button>
      </div>

      <Modal open={modalOpen} onClose={() => !installing && setModalOpen(false)} title={`Update to v${latest.versionName}`}>
        <div>
          <p className="text-sm text-gray-500 mb-1">You're on v{currentVersionName}</p>
          {latest.releaseNotes && (
            <div className="bg-gray-50 rounded-xl p-3 my-3 text-sm text-gray-700 whitespace-pre-line">
              {latest.releaseNotes}
            </div>
          )}

          {installing ? (
            <div className="mt-4">
              <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                <div className="bg-blue-700 h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
              </div>
              <p className="text-xs text-gray-400 text-center mt-2">
                {progress < 100 ? `Downloading… ${progress}%` : "Opening installer…"}
              </p>
            </div>
          ) : (
            <BigButton onClick={handleUpdate} className="w-full mt-2">
              Update Now
            </BigButton>
          )}
        </div>
      </Modal>
    </>
  );
}
