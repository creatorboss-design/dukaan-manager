import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useCollection } from "../hooks/useFirestore";
import { useApp } from "../contexts/AppContext";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { t } from "../utils/translations";
import { exportToCSV } from "../utils/exportCSV";
import PageWrapper from "../components/layout/PageWrapper";
import Modal from "../components/shared/Modal";
import BigButton from "../components/shared/BigButton";
import Input from "../components/shared/Input";
import Select from "../components/shared/Select";
import ConfirmDialog from "../components/shared/ConfirmDialog";
import Skeleton from "../components/shared/Skeleton";
import { Plus, Search, Download, Calculator, Trash2 } from "lucide-react";

const CONDITIONS = ["Excellent", "Good", "Fair", "Poor"];

// Exchange value estimator
const EXCHANGE_RATES = { Excellent: 0.65, Good: 0.5, Fair: 0.35, Poor: 0.2 };

function ExchangeCalc({ onClose }) {
  const [mrp, setMrp] = useState("");
  const [condition, setCondition] = useState("Good");
  const estimated = mrp ? Math.round(Number(mrp) * (EXCHANGE_RATES[condition] || 0.5)) : null;
  return (
    <div>
      <Input label="Original MRP / Market Price (₹)" type="number" value={mrp} onChange={(e) => setMrp(e.target.value)} />
      <Select label="Condition" value={condition} onChange={(e) => setCondition(e.target.value)} options={CONDITIONS} />
      {estimated && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mt-2 text-center">
          <p className="text-sm text-blue-600 mb-1">Estimated Exchange Value</p>
          <p className="text-3xl font-bold text-blue-800">₹ {estimated.toLocaleString("en-IN")}</p>
        </div>
      )}
      <button onClick={onClose} className="w-full mt-4 text-gray-500 text-sm">Close</button>
    </div>
  );
}

function PhoneForm({ initial, onSave, lang }) {
  const [form, setForm] = useState({
    brand: "", model: "", imei: "", condition: "Good", purchasePrice: "", sellerName: "",
    salePrice: "", buyerName: "", buyerPhone: "", warrantyDays: "30", notes: "",
    status: "In Stock", ...initial,
  });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(form); }}>
      <div className="grid grid-cols-2 gap-2">
        <Input label={t("brand", lang)} value={form.brand} onChange={set("brand")} required />
        <Input label="Model" value={form.model} onChange={set("model")} required />
      </div>
      <Input label={t("imei", lang)} value={form.imei} onChange={set("imei")} placeholder="15-digit IMEI" />
      <Select label={t("condition", lang)} value={form.condition} onChange={set("condition")} options={CONDITIONS} />
      <div className="bg-gray-50 rounded-xl p-3 mb-3">
        <p className="text-xs font-semibold text-gray-500 mb-2">PURCHASE</p>
        <div className="grid grid-cols-2 gap-2">
          <Input label="Purchase Price (₹)" type="number" value={form.purchasePrice} onChange={set("purchasePrice")} />
          <Input label="Seller Name" value={form.sellerName} onChange={set("sellerName")} />
        </div>
      </div>
      <div className="bg-gray-50 rounded-xl p-3 mb-3">
        <p className="text-xs font-semibold text-gray-500 mb-2">SALE (fill when sold)</p>
        <div className="grid grid-cols-2 gap-2">
          <Input label="Sale Price (₹)" type="number" value={form.salePrice} onChange={set("salePrice")} />
          <Input label="Buyer Name" value={form.buyerName} onChange={set("buyerName")} />
        </div>
        <Input label="Buyer Phone" value={form.buyerPhone} onChange={set("buyerPhone")} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Input label={`Warranty (days)`} type="number" value={form.warrantyDays} onChange={set("warrantyDays")} />
        <Select label="Status" value={form.status} onChange={set("status")} options={["In Stock", "Sold"]} />
      </div>
      <BigButton type="submit">{t("save", lang)}</BigButton>
    </form>
  );
}

export default function Phones() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { lang } = useApp();
  const { isOwner } = useAuth();
  const { showToast } = useToast();
  const { data: phones, loading, add, update, remove } = useCollection("phones");
  const { add: addCash } = useCollection("cashbook");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => {
    if (searchParams.get("new") === "1") { setModal("form"); setSearchParams({}); }
  }, [searchParams, setSearchParams]);

  const filtered = useMemo(() => phones.filter((p) => {
    const m = !search || `${p.brand} ${p.model} ${p.imei}`.toLowerCase().includes(search.toLowerCase());
    const s = statusFilter === "All" || p.status === statusFilter;
    return m && s;
  }), [phones, search, statusFilter]);

  const handleSave = async (form) => {
    try {
      if (selected) {
        await update(selected.id, form);
        if (form.status === "Sold" && form.salePrice && selected.status !== "Sold") {
          await addCash({ type: "income", category: "Phone Sale", amount: Number(form.salePrice), description: `${form.brand} ${form.model}` });
        }
        showToast("Phone updated", "success");
      } else {
        await add({ ...form });
        showToast("Phone added to inventory", "success");
      }
      setModal(null); setSelected(null);
    } catch (e) {
      showToast("Failed to save phone", "error");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await remove(deleteId);
      showToast("Phone deleted", "success");
    } catch (e) {
      showToast("Failed to delete phone", "error");
    }
    setDeleteId(null);
  };

  return (
    <PageWrapper title={t("phones", lang)}>
      <div className="py-4">
        <div className="flex gap-2 mb-3">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search brand, model, IMEI"
              className="w-full pl-9 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white" />
          </div>
          <button onClick={() => setModal("calc")} className="border border-gray-200 rounded-xl px-3 text-gray-500 hover:bg-gray-50">
            <Calculator size={18} />
          </button>
          <button onClick={() => exportToCSV(phones, "phones")} className="border border-gray-200 rounded-xl px-3 text-gray-500 hover:bg-gray-50">
            <Download size={18} />
          </button>
          <button onClick={() => { setSelected(null); setModal("form"); }}
            className="bg-blue-700 text-white rounded-xl px-4 flex items-center shadow-md active:scale-95"><Plus size={18} /></button>
        </div>

        <div className="flex gap-2 mb-4">
          {["All", "In Stock", "Sold"].map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1 rounded-full text-xs font-medium ${statusFilter === s ? "bg-blue-700 text-white" : "bg-gray-100 text-gray-600"}`}>{s}</button>
          ))}
        </div>

        <div className="space-y-2">
          {loading ? (
            <Skeleton count={4} />
          ) : filtered.map((p) => {
            const profit = p.salePrice && p.purchasePrice ? Number(p.salePrice) - Number(p.purchasePrice) : null;
            return (
              <div key={p.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <div className="flex justify-between items-start mb-1">
                  <div>
                    <p className="font-bold text-gray-800">{p.brand} {p.model}</p>
                    <p className="text-xs text-gray-400">{p.condition} {p.imei ? `• IMEI: ${p.imei}` : ""}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${p.status === "Sold" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>{p.status}</span>
                </div>
                {isOwner && (
                  <div className="text-sm text-gray-600 mb-2">
                    Buy: ₹{p.purchasePrice} {p.salePrice ? `→ Sell: ₹${p.salePrice}` : ""}
                    {profit !== null && <span className={`ml-2 font-semibold ${profit >= 0 ? "text-green-600" : "text-red-500"}`}>(₹{profit})</span>}
                  </div>
                )}
                <div className="flex gap-2 mt-2">
                  {isOwner && (
                    <button onClick={() => setDeleteId(p.id)} className="text-sm text-red-500 border border-red-200 rounded-xl py-1.5 px-2 hover:bg-red-50">
                      <Trash2 size={16} />
                    </button>
                  )}
                  <button onClick={() => { setSelected(p); setModal("form"); }}
                    className="text-sm text-blue-600 border border-blue-200 rounded-xl py-1.5 px-3 hover:bg-blue-50">{t("edit", lang)}</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Modal open={modal === "form"} onClose={() => { setModal(null); setSelected(null); }} title={selected ? "Edit Phone" : "Add Phone"}>
        <PhoneForm initial={selected} onSave={handleSave} lang={lang} />
      </Modal>
      <Modal open={modal === "calc"} onClose={() => setModal(null)} title="Exchange Calculator">
        <ExchangeCalc onClose={() => setModal(null)} />
      </Modal>

      <ConfirmDialog 
        open={!!deleteId} 
        onClose={() => setDeleteId(null)} 
        onConfirm={handleDelete} 
        title="Delete Phone?" 
        message="Are you sure you want to delete this phone record? This action cannot be undone." 
      />
    </PageWrapper>
  );
}
