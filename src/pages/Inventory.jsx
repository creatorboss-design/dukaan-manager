import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { runTransaction, doc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/config";
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
import { Plus, Search, AlertTriangle, Download, Trash2 } from "lucide-react";
import BarcodeScanner from "../components/inventory/BarcodeScanner";

const CATEGORIES = ["Accessory", "Spare Part"];

function ItemForm({ initial, onSave, lang }) {
  const [form, setForm] = useState({
    itemName: "", category: "Accessory", quantity: "", costPrice: "", sellingPrice: "",
    lowStockThreshold: "2", barcode: "", ...initial,
  });
  const [scanning, setScanning] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(form); }}>
      <Input label="Item Name" value={form.itemName} onChange={set("itemName")} required />
      <Select label={t("category", lang)} value={form.category} onChange={set("category")} options={CATEGORIES} />
      <div className="grid grid-cols-2 gap-2">
        <Input label={t("quantity", lang)} type="number" value={form.quantity} onChange={set("quantity")} required min="0" />
        <Input label="Low Stock Alert" type="number" value={form.lowStockThreshold} onChange={set("lowStockThreshold")} min="0" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Input label="Cost Price (₹)" type="number" value={form.costPrice} onChange={set("costPrice")} min="0" />
        <Input label="Selling Price (₹)" type="number" value={form.sellingPrice} onChange={set("sellingPrice")} required min="0" />
      </div>
      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <Input label="Barcode / SKU" value={form.barcode} onChange={set("barcode")} placeholder="Optional" />
        </div>
        <button
          type="button"
          onClick={() => setScanning(true)}
          className="mb-3 border border-gray-200 rounded-xl px-3 py-3 text-gray-600 hover:bg-gray-50 active:scale-95 transition-all text-sm"
        >
          📷 Scan
        </button>
      </div>
      {scanning && (
        <BarcodeScanner
          onScan={(code) => { set("barcode")({ target: { value: code } }); setScanning(false); }}
          onClose={() => setScanning(false)}
        />
      )}
      <BigButton type="submit">{t("save", lang)}</BigButton>
    </form>
  );
}

function SellForm({ item, onSell, onClose, lang }) {
  const [qty, setQty] = useState("1");
  const [price, setPrice] = useState(item.sellingPrice || "");
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSell({ qty: Number(qty), price: Number(price), customerName, phone }); }}>
      <p className="text-sm text-gray-500 mb-3">Selling: <span className="font-bold text-gray-800">{item.itemName}</span> (Stock: {item.quantity})</p>
      <div className="grid grid-cols-2 gap-2">
        <Input label="Quantity" type="number" value={qty} onChange={(e) => setQty(e.target.value)} required min="1" max={item.quantity} />
        <Input label="Sale Price (₹)" type="number" value={price} onChange={(e) => setPrice(e.target.value)} required min="0" />
      </div>
      <Input label="Customer Name (optional)" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
      <Input label="Phone (optional)" value={phone} onChange={(e) => setPhone(e.target.value)} />
      <BigButton type="submit" variant="success">{t("sell", lang)}</BigButton>
    </form>
  );
}

export default function Inventory() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { lang } = useApp();
  const { isOwner, userProfile } = useAuth();
  const shopId = userProfile?.shopId;
  const { showToast } = useToast();
  const { data: items, loading, add, update, remove } = useCollection("inventory");
  const { add: addSale } = useCollection("inventory_sales");
  const { add: addCash } = useCollection("cashbook");
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("All");
  const [modal, setModal] = useState(null); // "add" | "edit" | "sell"
  const [selected, setSelected] = useState(null);
  const [scanToSell, setScanToSell] = useState(false);
  const [scanToast, setScanToast] = useState("");
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => {
    if (searchParams.get("sell") === "1") {
      setModal("sell"); setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  const filtered = useMemo(() => items.filter((i) => {
    const matchSearch = !search || i.itemName?.toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === "All" || i.category === catFilter;
    return matchSearch && matchCat;
  }), [items, search, catFilter]);

  const lowStock = items.filter((i) => Number(i.quantity) <= Number(i.lowStockThreshold || 2));

  const handleSave = async (form) => {
    try {
      const formattedForm = {
        ...form,
        quantity: Number(form.quantity),
        sellingPrice: Number(form.sellingPrice),
        costPrice: form.costPrice ? Number(form.costPrice) : 0,
        lowStockThreshold: form.lowStockThreshold ? Number(form.lowStockThreshold) : 2,
      };
      if (selected) {
        await update(selected.id, formattedForm);
        showToast("Item updated", "success");
      } else {
        await add(formattedForm);
        showToast("Item added to inventory", "success");
      }
      setModal(null); setSelected(null);
    } catch (e) {
      showToast("Failed to save item", "error");
    }
  };

  const handleSell = async ({ qty, price, customerName, phone }) => {
    if (!shopId) { showToast("Shop not found", "error"); return; }
    // Use shop-scoped paths to comply with Firestore security rules
    const itemRef = doc(db, "shops", shopId, "inventory", selected.id);
    try {
      await runTransaction(db, async (tx) => {
        const snap = await tx.get(itemRef);
        if (!snap.exists()) throw new Error("Item no longer exists");
        const currentQty = Number(snap.data().quantity);
        if (currentQty < qty) throw new Error(`Only ${currentQty} left in stock`);

        tx.update(itemRef, { quantity: currentQty - qty });
        tx.set(doc(collection(db, "shops", shopId, "inventory_sales")), {
          inventoryId: selected.id, itemName: selected.itemName,
          quantitySold: qty, salePrice: price, customerName, phone,
          createdAt: serverTimestamp(),
        });
        tx.set(doc(collection(db, "shops", shopId, "cashbook")), {
          type: "income", category: "Accessory Sale",
          amount: price * qty, description: `${qty}x ${selected.itemName}`,
          createdAt: serverTimestamp(),
        });
      });
      setModal(null); setSelected(null);
      showToast(`Sold ${qty}x ${selected.itemName}`, "success");
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await remove(deleteId);
      showToast("Item deleted", "success");
    } catch (e) {
      showToast("Failed to delete item", "error");
    }
    setDeleteId(null);
  };

  const handleScanToSell = (code) => {
    setScanToSell(false);
    const match = items.find((i) => i.barcode && i.barcode === code);
    if (match) {
      setSelected(match);
      setModal("sell");
    } else {
      setScanToast(`No item found with barcode: ${code}`);
      setTimeout(() => setScanToast(""), 3500);
    }
  };

  return (
    <PageWrapper title={t("inventory", lang)}>
      <div className="py-4">
        {lowStock.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 mb-4 flex items-center gap-2">
            <AlertTriangle size={18} className="text-amber-500 shrink-0" />
            <p className="text-sm text-amber-800"><span className="font-bold">{lowStock.length}</span> items low on stock!</p>
          </div>
        )}

        <div className="flex gap-2 mb-3">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("search", lang)}
              className="w-full pl-9 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white" />
          </div>
          <button onClick={() => { setSelected(null); setModal("add"); }}
            className="bg-blue-700 text-white rounded-xl px-4 flex items-center gap-1 font-medium shadow-md active:scale-95">
            <Plus size={18} />
          </button>
          <button
            onClick={() => setScanToSell(true)}
            className="border border-gray-200 rounded-xl px-3 text-gray-600 hover:bg-gray-50 active:scale-95 transition-all"
            title="Scan to Sell"
          >
            📷
          </button>
          <button onClick={() => exportToCSV(items, "inventory")} className="border border-gray-200 rounded-xl px-3 text-gray-500 hover:bg-gray-50">
            <Download size={18} />
          </button>
        </div>

        {/* Scan-to-sell toast */}
        {scanToast && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-3 text-sm text-red-700 font-medium">
            {scanToast}
          </div>
        )}

        <div className="flex gap-2 mb-4">
          {["All", ...CATEGORIES].map((c) => (
            <button key={c} onClick={() => setCatFilter(c)}
              className={`px-3 py-1 rounded-full text-xs font-medium ${catFilter === c ? "bg-blue-700 text-white" : "bg-gray-100 text-gray-600"}`}>{c}</button>
          ))}
        </div>

        {loading ? (
          <Skeleton count={5} />
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400"><div className="text-5xl mb-3">📦</div><p>{t("noData", lang)}</p></div>
        ) : (
          <div className="space-y-2">
            {filtered.map((item) => (
              <div key={item.id} className={`bg-white rounded-2xl p-4 shadow-sm border ${Number(item.quantity) <= Number(item.lowStockThreshold || 2) ? "border-amber-300" : "border-gray-100"}`}>
                <div className="flex justify-between items-start mb-1">
                  <div>
                    <p className="font-bold text-gray-800">{item.itemName}</p>
                    <p className="text-xs text-gray-400">{item.category} {item.barcode ? `• ${item.barcode}` : ""}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-xl font-bold ${Number(item.quantity) <= Number(item.lowStockThreshold || 2) ? "text-red-500" : "text-gray-800"}`}>{item.quantity}</p>
                    <p className="text-xs text-gray-400">in stock</p>
                  </div>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <div>
                    {isOwner && <p className="text-xs text-gray-500">Cost: ₹{item.costPrice} •</p>}
                    <p className="text-sm font-semibold text-green-600">₹{item.sellingPrice}</p>
                  </div>
                  <div className="flex gap-2">
                    {isOwner && (
                      <button onClick={() => setDeleteId(item.id)} className="text-sm text-red-500 border border-red-200 rounded-xl py-1.5 px-2 hover:bg-red-50">
                        <Trash2 size={16} />
                      </button>
                    )}
                    <button onClick={() => { setSelected(item); setModal("edit"); }}
                      className="text-sm text-blue-600 border border-blue-200 rounded-xl py-1.5 px-3 hover:bg-blue-50">{t("edit", lang)}</button>
                    <button onClick={() => { setSelected(item); setModal("sell"); }}
                      className="text-sm text-white bg-green-600 rounded-xl py-1.5 px-3 hover:bg-green-700">{t("sell", lang)}</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={modal === "add" || modal === "edit"} onClose={() => { setModal(null); setSelected(null); }}
        title={modal === "edit" ? "Edit Item" : t("addItem", lang)}>
        <ItemForm initial={selected} onSave={handleSave} lang={lang} />
      </Modal>
      <Modal open={modal === "sell" && !!selected} onClose={() => { setModal(null); setSelected(null); }} title="Sell Item">
        {selected && <SellForm item={selected} onSell={handleSell} onClose={() => setModal(null)} lang={lang} />}
      </Modal>
      {scanToSell && (
        <BarcodeScanner
          onScan={handleScanToSell}
          onClose={() => setScanToSell(false)}
        />
      )}
      <ConfirmDialog 
        open={!!deleteId} 
        onClose={() => setDeleteId(null)} 
        onConfirm={handleDelete} 
        title="Delete Item?" 
        message="Are you sure you want to delete this inventory item? This action cannot be undone." 
      />
    </PageWrapper>
  );
}
