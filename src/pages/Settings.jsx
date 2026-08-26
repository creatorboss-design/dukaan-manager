import { useState } from "react";
import { Link } from "react-router-dom";
import { useApp } from "../contexts/AppContext";
import { useAuth } from "../contexts/AuthContext";
import { useCollection } from "../hooks/useFirestore";
import { exportToCSV } from "../utils/exportCSV";
import { t } from "../utils/translations";
import PageWrapper from "../components/layout/PageWrapper";
import Input from "../components/shared/Input";
import BigButton from "../components/shared/BigButton";
import { Download, Globe, Shield } from "lucide-react";

export default function Settings() {
  const { lang, toggleLang, shopSettings, saveSettings } = useApp();
  const { userProfile, isOwner } = useAuth();
  const { data: repairs } = useCollection("repairs");
  const { data: inventory } = useCollection("inventory");
  const { data: phones } = useCollection("phones");
  const { data: cashbook } = useCollection("cashbook");

  const [form, setForm] = useState({ ...shopSettings });
  const [saved, setSaved] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSave = async (e) => {
    e.preventDefault();
    const res = await saveSettings(form);
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } else {
      alert("Failed to save settings: " + res.error); // We'll upgrade this to a toast in Phase 3
    }
  };

  const exportAll = () => {
    exportToCSV(repairs, "repairs");
    setTimeout(() => exportToCSV(inventory, "inventory"), 500);
    setTimeout(() => exportToCSV(phones, "phones"), 1000);
    setTimeout(() => exportToCSV(cashbook, "cashbook"), 1500);
  };

  return (
    <PageWrapper title="Settings">
      <div className="py-4 space-y-4">
        {/* Shop Settings */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h2 className="font-bold text-gray-800 mb-3">🏪 Shop Details</h2>
          <form onSubmit={handleSave}>
            <Input label={t("shopName", lang)} value={form.shopName} onChange={set("shopName")} />
            <Input label={t("gst", lang)} value={form.gst} onChange={set("gst")} placeholder="Optional" />
            <Input label={t("branch", lang)} value={form.branch} onChange={set("branch")} />
            <Input label={`Default ${t("warranty", lang)} (${t("days", lang)})`} type="number" value={form.warrantyDays} onChange={set("warrantyDays")} />
            <BigButton type="submit" variant={saved ? "success" : "primary"}>
              {saved ? "✓ Saved!" : "Save Settings"}
            </BigButton>
          </form>
        </div>

        {/* Language */}
        <div className="bg-white rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Globe size={20} className="text-blue-600" />
            <div>
              <p className="font-semibold text-gray-800">Language</p>
              <p className="text-xs text-gray-400">Currently: {lang === "en" ? "English" : "हिंदी"}</p>
            </div>
          </div>
          <button onClick={toggleLang} className="bg-blue-50 text-blue-700 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-100">
            {lang === "en" ? "हिंदी" : "English"}
          </button>
        </div>

        {/* Role Info */}
        <div className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-3">
          <Shield size={20} className="text-blue-600" />
          <div>
            <p className="font-semibold text-gray-800">{userProfile?.name || "User"}</p>
            <p className="text-xs text-gray-400">Role: <span className="capitalize font-medium text-blue-600">{userProfile?.role || "staff"}</span></p>
          </div>
        </div>

        {/* Backup */}
        {isOwner && (
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <h2 className="font-bold text-gray-800 mb-3">💾 Data & Team</h2>
            <Link to="/team" className="w-full flex items-center justify-center gap-2 bg-blue-100 text-blue-800 rounded-xl py-3 font-semibold text-sm hover:bg-blue-200 mb-3">
              👥 Manage Staff Approvals
            </Link>
            <button onClick={exportAll} className="w-full flex items-center justify-center gap-2 bg-gray-800 text-white rounded-xl py-3 font-semibold text-sm hover:bg-gray-900">
              <Download size={18} /> Export All Data (CSV)
            </button>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <button onClick={() => exportToCSV(repairs, "repairs")} className="text-sm text-gray-600 border border-gray-200 rounded-xl py-2 hover:bg-gray-50">Repairs</button>
              <button onClick={() => exportToCSV(inventory, "inventory")} className="text-sm text-gray-600 border border-gray-200 rounded-xl py-2 hover:bg-gray-50">Inventory</button>
              <button onClick={() => exportToCSV(phones, "phones")} className="text-sm text-gray-600 border border-gray-200 rounded-xl py-2 hover:bg-gray-50">Phones</button>
              <button onClick={() => exportToCSV(cashbook, "cashbook")} className="text-sm text-gray-600 border border-gray-200 rounded-xl py-2 hover:bg-gray-50">Cash Book</button>
            </div>
          </div>
        )}

        {/* PWA Install Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
          <h2 className="font-bold text-blue-800 mb-2">📲 Install on Phone</h2>
          <p className="text-sm text-blue-700 mb-2"><strong>Android (Chrome):</strong> Tap menu → &quot;Add to Home Screen&quot;</p>
          <p className="text-sm text-blue-700"><strong>iPhone (Safari):</strong> Tap Share → &quot;Add to Home Screen&quot;</p>
        </div>

        <p className="text-center text-xs text-gray-400 pb-2">Dukaan Manager v1.0 • Powered by Firebase</p>
      </div>
    </PageWrapper>
  );
}
