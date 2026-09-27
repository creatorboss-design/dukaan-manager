import { useState, useMemo } from "react";
import { formatINR } from "../utils/formatCurrency";
import { useCollection } from "../hooks/useFirestore";
import { useApp } from "../contexts/AppContext";
import { t } from "../utils/translations";
import PageWrapper from "../components/layout/PageWrapper";
import Modal from "../components/shared/Modal";
import { Search, ShieldCheck, ShieldX, Wrench, Package, Smartphone } from "lucide-react";

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

// Sorts any array of records by their createdAt Firestore timestamp, newest first.
// Records with no createdAt (shouldn't normally happen) sort last.
function byNewest(records) {
  return [...records].sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
}

export default function Customers() {
  const { lang } = useApp();
  const { data: repairs } = useCollection("repairs");
  const { data: inventorySales } = useCollection("inventory_sales");
  const { data: phones } = useCollection("phones");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);

  // Build a unified customer directory keyed by phone number, merging repair
  // customers, inventory-sale customers, and phone-sale buyers. A person who
  // shows up in more than one source (e.g. they got a repair AND bought a
  // phone) is combined into a single customer entry with a combined history.
  const customers = useMemo(() => {
    const map = {};

    const getOrCreate = (phone, name) => {
      if (!map[phone]) {
        map[phone] = { phone, name: name || "", repairs: [], sales: [], phoneSales: [] };
      } else if (!map[phone].name && name) {
        map[phone].name = name;
      }
      return map[phone];
    };

    repairs.forEach((r) => {
      if (!r.phone) return;
      getOrCreate(r.phone, r.customerName).repairs.push(r);
    });

    inventorySales.forEach((s) => {
      if (!s.phone) return;
      getOrCreate(s.phone, s.customerName).sales.push(s);
    });

    phones
      .filter((p) => p.status === "Sold" && p.buyerPhone)
      .forEach((p) => {
        getOrCreate(p.buyerPhone, p.buyerName).phoneSales.push(p);
      });

    return Object.values(map);
  }, [repairs, inventorySales, phones]);

  const filtered = useMemo(() => customers.filter((c) =>
    !search || c.name?.toLowerCase().includes(search.toLowerCase()) || c.phone?.includes(search)
  ), [customers, search]);

  // Total interaction count across all three sources, used for both the
  // list badge and sorting "most recent activity" for the selected customer.
  const totalInteractions = (c) => c.repairs.length + c.sales.length + c.phoneSales.length;

  const selectedRepairs = useMemo(() => selected ? byNewest(selected.repairs) : [], [selected]);
  const selectedSales = useMemo(() => selected ? byNewest(selected.sales) : [], [selected]);
  const selectedPhoneSales = useMemo(() => selected ? byNewest(selected.phoneSales) : [], [selected]);

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
            const lastRepair = c.repairs.length ? byNewest(c.repairs)[0] : null;
            return (
              <button key={c.phone} onClick={() => setSelected(c)} className="w-full bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-left hover:border-blue-200 transition-colors">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold text-gray-800">{c.name || "Unknown"}</p>
                    <p className="text-sm text-gray-400">{c.phone}</p>
                  </div>
                  <span className="bg-blue-50 text-blue-600 text-xs font-semibold px-2 py-1 rounded-full">{totalInteractions(c)} interactions</span>
                </div>
                <div className="flex gap-3 mt-1.5">
                  {c.repairs.length > 0 && (
                    <span className="flex items-center gap-1 text-xs text-gray-400"><Wrench size={12} /> {c.repairs.length}</span>
                  )}
                  {c.sales.length > 0 && (
                    <span className="flex items-center gap-1 text-xs text-gray-400"><Package size={12} /> {c.sales.length}</span>
                  )}
                  {c.phoneSales.length > 0 && (
                    <span className="flex items-center gap-1 text-xs text-gray-400"><Smartphone size={12} /> {c.phoneSales.length}</span>
                  )}
                </div>
                {lastRepair && <p className="text-xs text-gray-400 mt-1">Last repair: {lastRepair.issue} • {lastRepair.status}</p>}
              </button>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <div className="text-5xl mb-3">👥</div>
            <p>Customers appear here automatically from repairs, sales, and phone purchases</p>
          </div>
        )}
      </div>

      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected?.name || "Customer"}>
        {selected && (
          <div>
            <p className="text-sm text-gray-500 mb-1">📞 {selected.phone}</p>
            <p className="text-sm text-blue-600 font-medium mb-4">{totalInteractions(selected)} total interactions</p>

            {selectedRepairs.length > 0 && (
              <div className="mb-4">
                <h3 className="font-bold text-gray-800 mb-2 flex items-center gap-2"><Wrench size={16} /> {t("repairHistory", lang)}</h3>
                <div className="space-y-2">
                  {selectedRepairs.map((r) => (
                    <div key={r.id} className="bg-gray-50 rounded-xl p-3">
                      <div className="flex justify-between mb-1">
                        <p className="font-semibold text-gray-800 text-sm">{r.deviceModel}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${r.status === "Delivered" ? "bg-gray-100 text-gray-500" : "bg-blue-100 text-blue-700"}`}>{r.status}</span>
                      </div>
                      <p className="text-xs text-gray-600">{r.issue} • {formatINR(r.estimatedCost)}</p>
                      <WarrantyStatus repair={r} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedSales.length > 0 && (
              <div className="mb-4">
                <h3 className="font-bold text-gray-800 mb-2 flex items-center gap-2"><Package size={16} /> Purchase History</h3>
                <div className="space-y-2">
                  {selectedSales.map((s) => (
                    <div key={s.id} className="bg-gray-50 rounded-xl p-3">
                      <div className="flex justify-between mb-1">
                        <p className="font-semibold text-gray-800 text-sm">{s.itemName}</p>
                        <span className="text-xs text-gray-500">Qty {s.quantitySold}</span>
                      </div>
                      <p className="text-xs text-gray-600">{formatINR(s.salePrice)} each</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedPhoneSales.length > 0 && (
              <div>
                <h3 className="font-bold text-gray-800 mb-2 flex items-center gap-2"><Smartphone size={16} /> Phones Purchased</h3>
                <div className="space-y-2">
                  {selectedPhoneSales.map((p) => (
                    <div key={p.id} className="bg-gray-50 rounded-xl p-3">
                      <p className="font-semibold text-gray-800 text-sm">{p.brand} {p.model}</p>
                      <p className="text-xs text-gray-600">{formatINR(p.salePrice)} • {p.condition}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </PageWrapper>
  );
}
