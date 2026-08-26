import { useState } from "react";
import Navbar from "../components/landing/Navbar";

// GitHub Releases base URL — update YOUR_GITHUB_USERNAME and repo name
// to match your actual repo once the CI pipeline (Section 7 of the plan)
// has run at least once and attached installer files to a Release.
// The exact filenames below come from what electron-forge make actually outputs —
// verify them from your first successful Release before pointing users here.
const RELEASE_BASE =
  "https://github.com/creatorboss-design/dukaan-manager/releases/latest/download";

const DESKTOP_DOWNLOADS = [
  {
    key: "windows",
    label: "Windows",
    icon: "💻",
    file: "dukaan-manager-Setup.exe",
    note: "Windows 10 & above · 64-bit",
    badge: "Free",
    badgeColor: "bg-green-500",
  },
  {
    key: "linux",
    label: "Linux",
    icon: "🐧",
    file: "dukaan-manager.deb",
    note: "Ubuntu, Debian & derivatives",
    badge: "Free",
    badgeColor: "bg-green-500",
  },
  {
    key: "android",
    label: "Android",
    icon: "🤖",
    file: "dukaan-manager.apk",
    note: "Android 8.0 & above",
    badge: "Free",
    badgeColor: "bg-green-500",
  },
];

export default function Download() {
  const [copied, setCopied] = useState(false);

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900">
      <Navbar />

      {/* Hero */}
      <div className="text-center pt-16 pb-10 px-6">
        <div className="inline-flex items-center gap-2 bg-white/10 text-blue-200 text-xs font-semibold rounded-full px-4 py-1.5 mb-6 border border-white/10">
          ✨ Native desktop app — fast, offline, no browser needed
        </div>
        <h1 className="text-4xl font-extrabold text-white mb-3 tracking-tight">
          Download Dukaan Manager
        </h1>
        <p className="text-blue-200 max-w-md mx-auto text-base leading-relaxed">
          Run your shop from a real desktop app. Works offline, syncs automatically when connected.
        </p>
      </div>

      {/* Desktop download cards */}
      <div className="max-w-4xl mx-auto px-4 pb-12">
        <div className="grid sm:grid-cols-3 gap-4">
          {DESKTOP_DOWNLOADS.map((d) => (
            <div
              key={d.key}
              className="group bg-white/10 backdrop-blur border border-white/10 rounded-2xl p-6 text-center hover:bg-white/15 hover:border-white/20 transition-all"
            >
              <div className="text-5xl mb-4">{d.icon}</div>
              <div className="flex items-center justify-center gap-2 mb-1">
                <h3 className="text-white font-bold text-lg">{d.label}</h3>
                <span className={`${d.badgeColor} text-white text-[10px] font-bold rounded-full px-2 py-0.5`}>
                  {d.badge}
                </span>
              </div>
              <p className="text-blue-300 text-xs mb-5">{d.note}</p>
              <a
                id={`download-${d.key}`}
                href={`${RELEASE_BASE}/${d.file}`}
                className="block bg-white text-blue-800 rounded-xl py-3 font-bold text-sm hover:bg-blue-50 active:scale-95 transition-all shadow-lg group-hover:shadow-xl"
              >
                Download .{d.file.split(".").pop().toUpperCase()}
              </a>
            </div>
          ))}
        </div>

        {/* Windows unsigned warning */}
        <div className="mt-5 bg-amber-500/10 border border-amber-400/20 rounded-2xl p-4 flex gap-3 items-start max-w-2xl mx-auto">
          <span className="text-amber-400 text-lg shrink-0">⚠</span>
          <p className="text-amber-200 text-xs leading-relaxed">
            <strong className="text-amber-300">Windows users:</strong> Windows SmartScreen may show
            "Windows protected your PC" on first run — this is normal for new apps.
            Click <em>More info</em> → <em>Run anyway</em> to install.
          </p>
        </div>

        {/* Share link */}
        <div className="mt-4 flex items-center justify-center gap-3 max-w-sm mx-auto">
          <div className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-blue-300 font-mono truncate">
            {typeof window !== "undefined" ? window.location.host + "/download" : ""}
          </div>
          <button
            onClick={copyLink}
            className="bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-xl px-3 py-2 border border-white/10 transition-colors shrink-0"
          >
            {copied ? "✓ Copied" : "Copy link"}
          </button>
        </div>
      </div>
    </div>
  );
}
