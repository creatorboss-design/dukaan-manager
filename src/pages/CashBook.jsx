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
import { Plus, Download, TrendingUp, TrendingDown, Users, Truck, Trash2 } from "lucide-react";

const EXPENSE_CATEGORIES = ["Parts", "Rent", "Electricity", "Salary", "Tools", "Transport", "Other"];
const INCOME_CATEGORIES = ["Repair", "Accessory Sale", "Phone Sale", "Other"];

function EntryForm({ onSave, lang, initial }) {
  const [form, setForm] = useState({ type: "expense", category: "Parts", amount: "", description: "", date: new Date().toISOString().split("T")[0], ...initial });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const cats = form.type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave({ ...form, amount: Number(form.amount) }); }}>
      <div className="flex gap-2 mb-3">
        {["income", "expense"].map((tp) => (
          <button key={tp} type="button" onClick={() => setForm((f) => ({ ...f, type: tp, category: tp === "income" ? "Repair" : "Parts" }))}
            className={`flex-1 py-3 rounded-xl font-semibold text-sm ${form.type === tp ? (tp === "income" ? "bg-green-600 text-white" : "bg-red-500 text-white") : "bg-gray-100 text-gray-600"}`}>
            {tp === "income" ? "💰 Income" : "💸 Expense"}
          </button>
        ))}
      </div>
      <Select label={t("category", lang)} value={form.category} onChange={set("category")} options={cats} />
      <Input label={`${t("amount", lang)} (₹)`} type="number" value={form.amount} onChange={set("amount")} required min="0" />
      <Input label={t("description", lang)} value={form.description} onChange={set("description")} placeholder="Details..." />
      <Input label="Date" type="date" value={form.date} onChange={set("date")} />
      <BigButton type="submit">{t("save", lang)}</BigButton>
    </form>
  );
}

function CreditForm({ onSave, lang }) {
  const [form, setForm] = useState({ customerName: "", phone: "", amountOwed: "", dueDate: "", notes: "" });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave({ ...form, amountOwed: Number(form.amountOwed), paidStatus: false }); }}>
      <Input label={t("customerName", lang)} value={form.customerName} onChange={set("customerName")} required />
      <Input label={t("phone", lang)} value={form.phone} onChange={set("phone")} />
      <Input label="Amount Owed (₹)" type="number" value={form.amountOwed} onChange={set("amountOwed")} required />
      <Input label="Due Date" type="date" value={form.dueDate} onChange={set("dueDate")} />
      <Input label="Notes" value={form.notes} onChange={set("notes")} />
      <BigButton type="submit">{t("save", lang)}</BigButton>
    </form>
  );
}

function SupplierForm({ onSave, lang }) {
  const [form, setForm] = useState({ name: "", contact: "", pendingPayment: "0", notes: "" });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave({ ...form, pendingPayment: Number(form.pendingPayment) }); }}>
      <Input label="Supplier Name" value={form.name} onChange={set("name")} required />
      <Input label={t("contact", lang)} value={form.contact} onChange={set("contact")} />
      <Input label="Pending Payment (₹)" type="number" value={form.pendingPayment} onChange={set("pendingPayment")} />
      <Input label="Notes" value={form.notes} onChange={set("notes")} />
      <BigButton type="submit">{t("save", lang)}</BigButton>
    </form>
  );
}

export default function CashBook() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { lang } = useApp();
  const { isOwner } = useAuth();
  const { showToast } = useToast();
  const { data: entries, loading, add, update, remove } = useCollection("cashbook");
  const { data: credits, add: addCredit, update: updateCredit, remove: removeCredit } = useCollection("credit_tracker");
  const { data: suppliers, add: addSupplier, update: updateSupplier, remove: removeSupplier } = useCollection("suppliers");
  const [modal, setModal] = useState(null);
  const [tab, setTab] = useState("hisab");
  const [period, setPeriod] = useState("today");
  const [deleteData, setDeleteData] = useState(null); // { id: string, type: 'entry' | 'credit' | 'supplier' }
  const [expandedId, setExpandedId] = useState(null);

  const toggleExpand = (id) => setExpandedId(p => p === id ? null : id);

  useEffect(() => {
    if (searchParams.get("expense") === "1") { setModal("entry"); setSearchParams({}); }
  }, [searchParams, setSearchParams]);

  const filtered = useMemo(() => {
    const now = new Date();
    return entries.filter((e) => {
      const d = e.createdAt?.toDate?.() || (e.date ? new Date(e.date) : null);
      if (!d) return period === "all";
      if (period === "today") return d.toDateString() === now.toDateString();
      if (period === "week") return (now - d) / (1000 * 60 * 60 * 24) <= 7;
      if (period === "month") return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      return true;
    });
  }, [entries, period]);

  const totals = useMemo(() => {
    const income = filtered.filter((e) => e.type === "income").reduce((s, e) => s + Number(e.amount || 0), 0);
    const expense = filtered.filter((e) => e.type === "expense").reduce((s, e) => s + Number(e.amount || 0), 0);
    return { income, expense, profit: income - expense };
  }, [filtered]);

  const totalUdhaar = credits.filter((c) => !c.paidStatus).reduce((s, c) => s + Number(c.amountOwed || 0), 0);

  const handleDelete = async () => {
    if (!deleteData) return;
    try {
      if (deleteData.type === "entry") await remove(deleteData.id);
      if (deleteData.type === "credit") await removeCredit(deleteData.id);
      if (deleteData.type === "supplier") await removeSupplier(deleteData.id);
      showToast("Deleted successfully", "success");
    } catch (e) {
      showToast("Failed to delete", "error");
    }
    setDeleteData(null);
  };

  const handleMarkPaid = async (id) => {
    try {
      await updateCredit(id, { paidStatus: true });
      showToast("Marked as paid", "success");
    } catch (e) {
      showToast("Failed to mark paid", "error");
    }
  };

  return (
    <PageWrapper title={t("cashbook", lang)}>
      <div className="py-4">
        {/* Tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto">
          {[["hisab", "💰 Hisab"], ["udhaar", "🤝 Udhaar"], ["suppliers", "🚚 Suppliers"]].map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${tab === key ? "bg-blue-700 text-white" : "bg-gray-100 text-gray-600"}`}>
              {label}
            </button>
          ))}
        </div>

        {tab === "hisab" && (
          <>
            {/* Period filter */}
            <div className="flex gap-2 mb-4">
              {[["today", t("today", lang)], ["week", t("thisWeek", lang)], ["month", t("thisMonth", lang)], ["all", "All"]].map(([key, label]) => (
                <button key={key} onClick={() => setPeriod(key)}
                  className={`px-3 py-1 rounded-full text-xs font-medium ${period === key ? "bg-blue-700 text-white" : "bg-gray-100 text-gray-600"}`}>{label}</button>
              ))}
            </div>

            {/* Summary cards */}
            {isOwner && (
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="bg-green-50 rounded-2xl p-3 text-center border border-green-100">
                  <p className="text-xs text-green-600 font-medium">Income</p>
                  <p className="text-lg font-bold text-green-700">₹{totals.income.toLocaleString("en-IN")}</p>
                </div>
                <div className="bg-red-50 rounded-2xl p-3 text-center border border-red-100">
                  <p className="text-xs text-red-600 font-medium">Expense</p>
                  <p className="text-lg font-bold text-red-700">₹{totals.expense.toLocaleString("en-IN")}</p>
                </div>
                <div className={`rounded-2xl p-3 text-center border ${totals.profit >= 0 ? "bg-blue-50 border-blue-100" : "bg-amber-50 border-amber-100"}`}>
                  <p className={`text-xs font-medium ${totals.profit >= 0 ? "text-blue-600" : "text-amber-600"}`}>Profit</p>
                  <p className={`text-lg font-bold ${totals.profit >= 0 ? "text-blue-700" : "text-amber-700"}`}>₹{totals.profit.toLocaleString("en-IN")}</p>
                </div>
              </div>
            )}

            <div className="flex gap-2 mb-3">
              <button onClick={() => setModal("entry")} className="flex-1 bg-blue-700 text-white rounded-xl py-3 font-semibold text-sm flex items-center justify-center gap-2 shadow-md">
                <Plus size={16} /> Add Entry
              </button>
              <button onClick={() => exportToCSV(entries, "cashbook")} className="border border-gray-200 rounded-xl px-3 text-gray-500 hover:bg-gray-50">
                <Download size={18} />
              </button>
            </div>

            <div className="space-y-2">
              {loading ? (
                <Skeleton count={4} />
              ) : filtered.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)).map((e) => (
                <div key={e.id} onClick={() => toggleExpand(e.id)} className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 flex flex-col gap-2 cursor-pointer transition-colors hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${e.type === "income" ? "bg-green-100" : "bg-red-100"}`}>
                      {e.type === "income" ? <TrendingUp size={16} className="text-green-600" /> : <TrendingDown size={16} className="text-red-600" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-800">{e.category}</p>
                      <p className="text-xs text-gray-400">{e.date || (e.createdAt?.toDate?.()?.toLocaleDateString("en-IN") || "")}</p>
                    </div>
                    <p className={`font-bold mr-3 ${e.type === "income" ? "text-green-600" : "text-red-500"}`}>
                      {e.type === "income" ? "+" : "-"}₹{Number(e.amount).toLocaleString("en-IN")}
                    </p>
                    {isOwner && (
                      <button onClick={(ev) => { ev.stopPropagation(); setDeleteData({ id: e.id, type: "entry" }); }} className="text-gray-400 hover:text-red-500 p-1">
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                  {expandedId === e.id && e.description && (
                    <div className="mt-1 pt-2 border-t border-gray-100 text-sm text-gray-600">
                      <strong>Notes:</strong> {e.description}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {tab === "udhaar" && (
          <>
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 mb-4">
              <p className="text-sm text-amber-800">Total Outstanding: <span className="font-bold">₹{totalUdhaar.toLocaleString("en-IN")}</span></p>
            </div>
            <button onClick={() => setModal("credit")} className="w-full bg-blue-700 text-white rounded-xl py-3 font-semibold text-sm flex items-center justify-center gap-2 shadow-md mb-3">
              <Plus size={16} /> Add Udhaar Entry
            </button>
            <div className="space-y-2">
              {credits.map((c) => (
                <div key={c.id} onClick={() => toggleExpand(c.id)} className={`bg-white rounded-xl p-3 shadow-sm border cursor-pointer hover:bg-gray-50 transition-colors ${c.paidStatus ? "border-green-200 opacity-60" : "border-amber-200"}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-gray-800">{c.customerName}</p>
                      <p className="text-xs text-gray-400">{c.phone} {c.dueDate ? `• Due: ${c.dueDate}` : ""}</p>
                    </div>
                    <div className="flex items-center">
                      <p className={`font-bold mr-3 ${c.paidStatus ? "text-green-600" : "text-red-500"}`}>₹{Number(c.amountOwed).toLocaleString("en-IN")}</p>
                      {isOwner && (
                        <button onClick={(ev) => { ev.stopPropagation(); setDeleteData({ id: c.id, type: "credit" }); }} className="text-gray-400 hover:text-red-500 p-1">
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                  {expandedId === c.id && c.notes && (
                    <div className="mt-2 pt-2 border-t border-gray-100 text-sm text-gray-600">
                      <strong>Notes:</strong> {c.notes}
                    </div>
                  )}
                  {!c.paidStatus && isOwner && (
                    <button onClick={(ev) => { ev.stopPropagation(); handleMarkPaid(c.id); }}
                      className="mt-2 text-xs text-green-600 border border-green-300 rounded-lg px-3 py-1.5 hover:bg-green-50">{t("markPaid", lang)}</button>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {tab === "suppliers" && (
          <>
            <button onClick={() => setModal("supplier")} className="w-full bg-blue-700 text-white rounded-xl py-3 font-semibold text-sm flex items-center justify-center gap-2 shadow-md mb-3">
              <Plus size={16} /> Add Supplier
            </button>
            <div className="space-y-2">
              {suppliers.map((s) => (
                <div key={s.id} onClick={() => toggleExpand(s.id)} className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-gray-800">{s.name}</p>
                      <p className="text-xs text-gray-400">{s.contact}</p>
                    </div>
                    <div className="flex items-center">
                      {Number(s.pendingPayment) > 0 && (
                        <p className="text-sm font-bold text-orange-600 mr-3">Due: ₹{Number(s.pendingPayment).toLocaleString("en-IN")}</p>
                      )}
                      {isOwner && (
                        <button onClick={(ev) => { ev.stopPropagation(); setDeleteData({ id: s.id, type: "supplier" }); }} className="text-gray-400 hover:text-red-500 p-1">
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                  {expandedId === s.id && s.notes && (
                    <div className="mt-2 pt-2 border-t border-gray-100 text-sm text-gray-600">
                      <strong>Notes:</strong> {s.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <Modal open={modal === "entry"} onClose={() => setModal(null)} title="Add Cash Entry">
        <EntryForm onSave={async (form) => { try { await add(form); setModal(null); showToast("Entry saved", "success"); } catch (e) { showToast("Failed to save", "error"); } }} lang={lang} />
      </Modal>
      <Modal open={modal === "credit"} onClose={() => setModal(null)} title={t("udhaarKhata", lang)}>
        <CreditForm onSave={async (form) => { try { await addCredit(form); setModal(null); showToast("Credit saved", "success"); } catch (e) { showToast("Failed to save", "error"); } }} lang={lang} />
      </Modal>
      <Modal open={modal === "supplier"} onClose={() => setModal(null)} title="Add Supplier">
        <SupplierForm onSave={async (form) => { try { await addSupplier(form); setModal(null); showToast("Supplier saved", "success"); } catch (e) { showToast("Failed to save", "error"); } }} lang={lang} />
      </Modal>

      <ConfirmDialog 
        open={!!deleteData} 
        onClose={() => setDeleteData(null)} 
        onConfirm={handleDelete} 
        title="Confirm Deletion" 
        message="Are you sure you want to delete this record? This action cannot be undone." 
      />
    </PageWrapper>
  );
}
