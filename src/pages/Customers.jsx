import { useState, useMemo } from "react";
import { useCollection } from "../hooks/useFirestore";
import { useApp } from "../contexts/AppContext";
import { t } from "../utils/translations";
import PageWrapper from "../components/layout/PageWrapper";
import Modal from "../components/shared/Modal";
import { Search, ShieldCheck, ShieldX } from "lucide-react";

function WarrantyStatus({ repair }) {
  if (!repair.warrantyDays || !repair.deliveredAt) return null;
  const deliveredDate = repair.deliveredAt?.toDate?.() || new Date();
  const expiryDate = new Date(deliveredDate);
  expiryDate.setDate(expiryDate.getDate() + Number(repair.warrantyDays));
  const valid = expiryDate > new Date();
  return (
    <div className={`flex items-center gap-1 text-xs ${valid ? "text-green-600" : "text-red-500"}`}>
      {valid ? <ShieldCheck size={14} /> : <ShieldX size={14} />}
      {valid ? `Warranty valid till ${expiryDate.toLocaleDateString("en-IN")}` : "Warranty expired"}
    </div>
  );
}

export default function Customers() {
  const { lang } = useApp();
  const { data: repairs } = useCollection("repairs");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);

  // Build customer profiles from repairs
  const customers = useMemo(() => {
    const map = {};
    repairs.forEach((r) => {
      if (!r.phone) return;
      if (!map[r.phone]) map[r.phone] = { phone: r.phone, name: r.customerName, repairs: [] };
      map[r.phone].repairs.push(r);
    });
    return Object.values(map);
  }, [repairs]);

  const filtered = useMemo(() => customers.filter((c) =>
    !search || c.name?.toLowerCase().includes(search.toLowerCase()) || c.phone?.includes(search)
  ), [customers, search]);

  const customerRepairs = useMemo(() =>
    selected ? repairs.filter((r) => r.phone === selected.phone).sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)) : []
  , [selected, repairs]);

  return (
    <PageWrapper title={t("customers", lang)}>
      <div className="py-4">
        <div className="relative mb-4">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("search", lang)}
            className="w-full pl-9 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white" />
        </div>

        <p className="text-xs text-gray-400 mb-3">{customers.length} customers</p>

        <div className="space-y-2">
          {filtered.map((c) => {
            const lastRepair = c.repairs.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))[0];
            return (
              <button key={c.phone} onClick={() => setSelected(c)} className="w-full bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-left hover:border-blue-200 transition-colors">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold text-gray-800">{c.name}</p>
                    <p className="text-sm text-gray-400">{c.phone}</p>
                  </div>
                  <span className="bg-blue-50 text-blue-600 text-xs font-semibold px-2 py-1 rounded-full">{c.repairs.length} jobs</span>
                </div>
                {lastRepair && <p className="text-xs text-gray-400 mt-1">Last: {lastRepair.issue} • {lastRepair.status}</p>}
              </button>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <div className="text-5xl mb-3">👥</div>
            <p>Customers appear here automatically from repairs</p>
          </div>
        )}
      </div>

      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected?.name || "Customer"}>
        {selected && (
          <div>
            <p className="text-sm text-gray-500 mb-1">📞 {selected.phone}</p>
            <p className="text-sm text-blue-600 font-medium mb-4">{selected.repairs.length} total repairs</p>
            <h3 className="font-bold text-gray-800 mb-2">{t("repairHistory", lang)}</h3>
            <div className="space-y-2">
              {customerRepairs.map((r) => (
                <div key={r.id} className="bg-gray-50 rounded-xl p-3">
                  <div className="flex justify-between mb-1">
                    <p className="font-semibold text-gray-800 text-sm">{r.deviceModel}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${r.status === "Delivered" ? "bg-gray-100 text-gray-500" : "bg-blue-100 text-blue-700"}`}>{r.status}</span>
                  </div>
                  <p className="text-xs text-gray-600">{r.issue} • ₹{r.estimatedCost}</p>
                  <WarrantyStatus repair={r} />
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </PageWrapper>
  );
}
