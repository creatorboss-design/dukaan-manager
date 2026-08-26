import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useCollection } from "../hooks/useFirestore";
import { useApp } from "../contexts/AppContext";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { t } from "../utils/translations";
import { generateInvoicePDF } from "../utils/generatePDF";
import PageWrapper from "../components/layout/PageWrapper";
import Modal from "../components/shared/Modal";
import BigButton from "../components/shared/BigButton";
import Input from "../components/shared/Input";
import Select from "../components/shared/Select";
import ConfirmDialog from "../components/shared/ConfirmDialog";
import Skeleton from "../components/shared/Skeleton";
import { Plus, Search, FileText, AlertCircle, Trash2 } from "lucide-react";
import { serverTimestamp } from "firebase/firestore";

const STATUSES = ["Received", "Diagnosing", "Parts Ordered", "Repairing", "Ready", "Delivered"];
const STATUS_ORDER = { Received: 0, Diagnosing: 1, "Parts Ordered": 2, Repairing: 3, Ready: 4, Delivered: 5 };

const COMMON_ISSUES = [
  "Screen Broken", "Battery Drain", "Not Charging", "Speaker Issue", "Mic Issue",
  "Camera Issue", "Software Problem", "Water Damage", "Power Button", "Volume Button",
  "Touch Not Working", "Network Issue", "SIM Slot", "Heating Issue", "Other"
];

const ISSUE_PRICES = {
  "Screen Broken": 800, "Battery Drain": 400, "Not Charging": 300, "Speaker Issue": 250,
  "Mic Issue": 250, "Camera Issue": 600, "Software Problem": 200, "Water Damage": 1000,
  "Power Button": 300, "Volume Button": 200, "Touch Not Working": 700, "Network Issue": 350,
  "SIM Slot": 400, "Heating Issue": 300,
};

function StatusBadge({ status }) {
  const colors = {
    Received: "bg-gray-100 text-gray-700",
    Diagnosing: "bg-purple-100 text-purple-700",
    "Parts Ordered": "bg-orange-100 text-orange-700",
    Repairing: "bg-blue-100 text-blue-700",
    Ready: "bg-green-100 text-green-700",
    Delivered: "bg-gray-200 text-gray-500",
  };
  return <span className={`px-2 py-1 rounded-full text-xs font-semibold ${colors[status] || colors.Received}`}>{status}</span>;
}

function RepairForm({ initial, onSave, onClose, lang, allRepairs }) {
  const { shopSettings } = useApp();
  const [form, setForm] = useState({
    customerName: "", phone: "", deviceModel: "", brand: "", issue: "",
    estimatedCost: "", advancePaid: "0", deliveryDate: "", warrantyDays: shopSettings.warrantyDays || 30,
    notes: "", status: "Received",
    ...initial,
  });

  const set = (k) => (e) => {
    const val = e.target.value;
    if (k === "issue") {
      setForm((f) => ({ ...f, issue: val, estimatedCost: ISSUE_PRICES[val] || f.estimatedCost }));
    } else {
      setForm((f) => ({ ...f, [k]: val }));
    }
  };

  // Repeat issue detector
  const repeatWarning = useMemo(() => {
    if (!form.phone || form.phone.length < 5) return null;
    const prev = allRepairs.filter((r) => r.phone === form.phone && r.issue === form.issue && r.id !== initial?.id);
    return prev.length > 0 ? `⚠ This customer had the same issue before (${prev.length}x)` : null;
  }, [form.phone, form.issue, allRepairs, initial?.id]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <form onSubmit={handleSubmit}>
      {repeatWarning && (
        <div className="bg-amber-50 border border-amber-300 text-amber-800 rounded-xl p-3 mb-3 flex gap-2 items-start">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span className="text-sm">{repeatWarning}</span>
        </div>
      )}
      <Input label={t("customerName", lang)} value={form.customerName} onChange={set("customerName")} required />
      <Input label={t("phone", lang)} type="tel" value={form.phone} onChange={set("phone")} required />
      <div className="grid grid-cols-2 gap-2">
        <Input label={t("brand", lang)} value={form.brand} onChange={set("brand")} placeholder="Samsung, Apple..." />
        <Input label={t("deviceModel", lang)} value={form.deviceModel} onChange={set("deviceModel")} required />
      </div>
      <Select label={t("issue", lang)} value={form.issue} onChange={set("issue")} options={COMMON_ISSUES} required />
      <div className="grid grid-cols-2 gap-2">
        <Input label={`${t("estimatedCost", lang)} (₹)`} type="number" value={form.estimatedCost} onChange={set("estimatedCost")} required min="0" />
        <Input label={`${t("advancePaid", lang)} (₹)`} type="number" value={form.advancePaid} onChange={set("advancePaid")} min="0" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Input label={t("deliveryDate", lang)} type="date" value={form.deliveryDate} onChange={set("deliveryDate")} />
        <Input label={`${t("warranty", lang)} (${t("days", lang)})`} type="number" value={form.warrantyDays} onChange={set("warrantyDays")} min="0" />
      </div>
      {initial && <Select label={t("status", lang)} value={form.status} onChange={set("status")} options={STATUSES} />}
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
        <textarea value={form.notes} onChange={set("notes")} rows={2}
          className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-400" />
      </div>
      <BigButton type="submit">{t("save", lang)}</BigButton>
    </form>
  );
}

function RepairCard({ repair, onEdit, onStatusChange, onDelete, isOwner, lang, shopSettings }) {
  const [expanding, setExpanding] = useState(false);
  const balance = (Number(repair.finalCost || repair.estimatedCost) - Number(repair.advancePaid || 0));

  // Build the WhatsApp notify link (wa.me opens whatsapp with prefilled message)
  const waLink = repair.phone
    ? (() => {
        const phone = repair.phone.replace(/[^0-9]/g, "");
        // Add country code if not present (assume India +91 if 10 digits)
        const e164 = phone.length === 10 ? `91${phone}` : phone;
        const msg = encodeURIComponent(
          `Hi ${repair.customerName}, your ${repair.brand ? repair.brand + " " : ""}${repair.deviceModel} is ready for pickup! Please visit our shop at your convenience. — ${shopSettings.shopName || "Dukaan Manager"}`
        );
        return `https://wa.me/${e164}?text=${msg}`;
      })()
    : null;

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 mb-3 border border-gray-100">
      <div className="flex justify-between items-start mb-2">
        <div>
          <p className="font-bold text-gray-800">{repair.customerName}</p>
          <p className="text-sm text-gray-500">{repair.phone}</p>
        </div>
        <StatusBadge status={repair.status} />
      </div>
      <p className="text-sm text-blue-700 font-medium">{repair.brand} {repair.deviceModel}</p>
      <p className="text-sm text-gray-600 mb-2">{repair.issue}</p>

      {/* Status pipeline — all 6 steps */}
      <div className="mt-2 mb-3">
        <div className="flex justify-between">
          {STATUSES.map((s) => (
            <button key={s} onClick={() => onStatusChange(repair.id, s)}
              className={`flex-1 h-1.5 mx-0.5 rounded-full transition-all duration-300 ${STATUS_ORDER[repair.status] >= STATUS_ORDER[s] ? "bg-blue-500" : "bg-gray-200"}`}
              title={s} />
          ))}
        </div>
        <p className="text-xs text-blue-600 mt-1 font-medium">{repair.status}</p>
      </div>

      <div className="flex justify-between items-center text-sm">
        {isOwner && <span className="text-gray-500">₹{repair.estimatedCost} {balance > 0 ? `• Due: ₹${balance}` : ""}</span>}
        <span className="text-gray-400 text-xs">#{repair.tokenNo || repair.id?.slice(0, 6).toUpperCase()}</span>
      </div>

      <div className="flex gap-2 mt-3">
        <button onClick={() => onEdit(repair)} className="flex-1 text-sm text-blue-600 border border-blue-200 rounded-xl py-2 hover:bg-blue-50">{t("edit", lang)}</button>
        <button onClick={() => generateInvoicePDF({ repair, shopSettings })} className="flex items-center gap-1 text-sm text-gray-600 border border-gray-200 rounded-xl py-2 px-3 hover:bg-gray-50">
          <FileText size={14} /> PDF
        </button>
        {repair.status === "Ready" && waLink && (
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-sm text-white bg-green-500 rounded-xl py-2 px-3 hover:bg-green-600 active:scale-95 transition-all"
            title="Notify customer via WhatsApp"
          >
            💬 Notify
          </a>
        )}
        <button onClick={() => onStatusChange(repair.id, "Delivered")}
          className={`text-sm rounded-xl py-2 px-3 ${repair.status === "Delivered" ? "bg-gray-100 text-gray-400" : "bg-green-600 text-white"}`}
          disabled={repair.status === "Delivered"}>
          ✓ Done
        </button>
        {isOwner && (
          <button onClick={() => onDelete(repair.id)} className="flex items-center justify-center border border-red-200 text-red-500 rounded-xl px-3 hover:bg-red-50 transition-colors">
            <Trash2 size={16} />
          </button>
        )}
      </div>
    </div>
  );
}

export default function Repairs() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { lang } = useApp();
  const { isOwner } = useAuth();
  const { showToast } = useToast();
  const { shopSettings } = useApp();
  const { data: repairs, loading, add, update, remove } = useCollection("repairs");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [modalOpen, setModalOpen] = useState(false);
  const [editRepair, setEditRepair] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => {
    if (searchParams.get("new") === "1") {
      setModalOpen(true);
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  const filtered = useMemo(() => {
    return repairs.filter((r) => {
      const matchSearch = !search || r.customerName?.toLowerCase().includes(search.toLowerCase()) ||
        r.phone?.includes(search) || r.deviceModel?.toLowerCase().includes(search.toLowerCase());
      const matchStatus = filterStatus === "All" || r.status === filterStatus;
      return matchSearch && matchStatus;
    }).sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  }, [repairs, search, filterStatus]);

  const handleSave = async (form) => {
    try {
      const formattedForm = {
        ...form,
        estimatedCost: Number(form.estimatedCost),
        advancePaid: form.advancePaid ? Number(form.advancePaid) : 0,
        warrantyDays: form.warrantyDays ? Number(form.warrantyDays) : 30,
      };
      if (editRepair) {
        await update(editRepair.id, formattedForm);
        showToast("Repair updated successfully", "success");
      } else {
        const tokenNo = `TKN${Date.now().toString().slice(-5)}`;
        await add({ ...formattedForm, tokenNo, status: "Received" });
        showToast("Repair added successfully", "success");
      }
      setModalOpen(false); setEditRepair(null);
    } catch (e) {
      showToast("Failed to save repair: " + e.message, "error");
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      const updates = { status };
      if (status === "Delivered") updates.deliveredAt = serverTimestamp();
      await update(id, updates);
      showToast(`Status updated to ${status}`, "success");
    } catch (e) {
      showToast("Failed to update status", "error");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await remove(deleteId);
      showToast("Repair deleted", "success");
    } catch (e) {
      showToast("Failed to delete", "error");
    }
    setDeleteId(null);
  };

  const handleEdit = (repair) => { setEditRepair(repair); setModalOpen(true); };

  return (
    <PageWrapper title={t("repairs", lang)}>
      <div className="py-4">
        {/* Search + Filter */}
        <div className="flex gap-2 mb-3">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("search", lang)}
              className="w-full pl-9 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white" />
          </div>
          <button onClick={() => { setEditRepair(null); setModalOpen(true); }}
            className="bg-blue-700 text-white rounded-xl px-4 flex items-center gap-1 font-medium shadow-md active:scale-95">
            <Plus size={18} />
          </button>
        </div>

        {/* Status filter pills */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          {["All", ...STATUSES].map((s) => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${filterStatus === s ? "bg-blue-700 text-white" : "bg-gray-100 text-gray-600"}`}>
              {s} {s !== "All" && `(${repairs.filter((r) => r.status === s).length})`}
            </button>
          ))}
        </div>

        {loading ? (
          <Skeleton count={5} />
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <div className="text-5xl mb-3">🔧</div>
            <p>{t("noData", lang)}</p>
          </div>
        ) : (
          filtered.map((r) => (
            <RepairCard key={r.id} repair={r} onEdit={handleEdit} onStatusChange={handleStatusChange} onDelete={setDeleteId}
              isOwner={isOwner} lang={lang} shopSettings={shopSettings} />
          ))
        )}
      </div>

      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setEditRepair(null); }}
        title={editRepair ? "Edit Repair" : t("newRepair", lang)}>
        <RepairForm initial={editRepair} onSave={handleSave} onClose={() => setModalOpen(false)} lang={lang} allRepairs={repairs} />
      </Modal>

      <ConfirmDialog 
        open={!!deleteId} 
        onClose={() => setDeleteId(null)} 
        onConfirm={handleDelete} 
        title="Delete Repair?" 
        message="Are you sure you want to delete this repair record? This action cannot be undone." 
      />
    </PageWrapper>
  );
}
