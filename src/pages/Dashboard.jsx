import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useCollection } from "../hooks/useFirestore";
import { useApp } from "../contexts/AppContext";
import { useAuth } from "../contexts/AuthContext";
import { t } from "../utils/translations";
import PageWrapper from "../components/layout/PageWrapper";
import { Wrench, Package, BookOpen, TrendingUp, AlertTriangle, Clock } from "lucide-react";

function StatCard({ icon: Icon, label, value, color, to }) {
  const content = (
    <div className={`bg-white rounded-2xl p-4 shadow-sm border-l-4 ${color} flex items-center gap-4`}>
      <div className={`p-3 rounded-xl bg-gray-50`}><Icon size={24} className="text-gray-600" /></div>
      <div>
        <p className="text-xs text-gray-500 font-medium">{label}</p>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
      </div>
    </div>
  );
  return to ? <Link to={to}>{content}</Link> : content;
}

export default function Dashboard() {
  const { lang, shopSettings } = useApp();
  const { user, userProfile, isOwner, profileError } = useAuth();

  const { data: repairs, error: repairsErr } = useCollection("repairs");
  const { data: inventory } = useCollection("inventory");
  const { data: cashbook } = useCollection("cashbook");
  const { data: inventorySales } = useCollection("inventory_sales");

  const today = new Date().toDateString();

  const stats = useMemo(() => {
    const activeJobs = repairs.filter((r) => r.status !== "Delivered");
    const readyJobs = repairs.filter((r) => r.status === "Ready");
    const todayJobs = repairs.filter((r) => r.createdAt?.toDate?.()?.toDateString() === today);
    const lowStock = inventory.filter((i) => i.quantity <= (i.lowStockThreshold || 2));

    const todayIncome = cashbook
      .filter((c) => c.type === "income" && c.createdAt?.toDate?.()?.toDateString() === today)
      .reduce((s, c) => s + Number(c.amount || 0), 0);

    return { activeJobs: activeJobs.length, readyJobs: readyJobs.length, todayJobs: todayJobs.length, lowStock: lowStock.length, todayIncome };
  }, [repairs, inventory, cashbook, today]);

  // Top issues
  const topIssues = useMemo(() => {
    const counts = {};
    repairs.forEach((r) => { if (r.issue) counts[r.issue] = (counts[r.issue] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [repairs]);

  // Best-selling inventory items
  const topSellingItems = useMemo(() => {
    const counts = {};
    inventorySales.forEach((s) => {
      counts[s.itemName] = (counts[s.itemName] || 0) + Number(s.quantitySold || 0);
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [inventorySales]);

  // Busiest days of the week (derived from repair createdAt timestamps)
  const busiestDays = useMemo(() => {
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const counts = [0, 0, 0, 0, 0, 0, 0];
    repairs.forEach((r) => {
      const date = r.createdAt?.toDate?.();
      if (date) counts[date.getDay()]++;
    });
    return dayNames.map((name, i) => ({ name, count: counts[i] })).sort((a, b) => b.count - a.count);
  }, [repairs]);

  return (
    <PageWrapper title={shopSettings.shopName}>
      <div className="py-4">
        <p className="text-gray-500 text-sm mb-4">
          Welcome, <span className="font-semibold text-gray-700">{userProfile?.name || "User"}</span> 👋
        </p>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <StatCard icon={Wrench} label="Active Jobs" value={stats.activeJobs} color="border-blue-500" to="/repairs" />
          <StatCard icon={Clock} label="Ready to Pickup" value={stats.readyJobs} color="border-green-500" to="/repairs" />
          <StatCard icon={Wrench} label={t("jobsToday", lang)} value={stats.todayJobs} color="border-purple-500" to="/repairs" />
          <StatCard icon={AlertTriangle} label={t("lowStock", lang)} value={stats.lowStock} color="border-amber-500" to="/inventory" />
        </div>

        {/* Only Owner sees Today's Income */}
        {isOwner && (
          <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
            <p className="text-sm text-gray-500 font-medium mb-1">Today&apos;s Income</p>
            <p className="text-3xl font-bold text-green-600">₹ {stats.todayIncome.toLocaleString("en-IN")}</p>
          </div>
        )}

        {/* Quick Actions */}
        <h2 className="text-base font-bold text-gray-800 mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3 mb-6">
          <Link to="/repairs?new=1" className="bg-blue-700 text-white rounded-2xl p-4 text-center shadow-md active:scale-95 transition-all">
            <div className="text-2xl mb-1">🔧</div>
            <div className="text-sm font-semibold">{t("newRepair", lang)}</div>
          </Link>
          <Link to="/inventory?sell=1" className="bg-green-600 text-white rounded-2xl p-4 text-center shadow-md active:scale-95 transition-all">
            <div className="text-2xl mb-1">📦</div>
            <div className="text-sm font-semibold">Quick Sell</div>
          </Link>
          <Link to="/cashbook?expense=1" className="bg-orange-500 text-white rounded-2xl p-4 text-center shadow-md active:scale-95 transition-all">
            <div className="text-2xl mb-1">💸</div>
            <div className="text-sm font-semibold">{t("addExpense", lang)}</div>
          </Link>
          <Link to="/phones?new=1" className="bg-purple-600 text-white rounded-2xl p-4 text-center shadow-md active:scale-95 transition-all">
            <div className="text-2xl mb-1">📱</div>
            <div className="text-sm font-semibold">Add Phone</div>
          </Link>
        </div>

        {/* Top Issues */}
        {topIssues.length > 0 && (
          <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
            <h2 className="text-base font-bold text-gray-800 mb-3 flex items-center gap-2">
              <TrendingUp size={18} /> {t("topIssues", lang)}
            </h2>
            {topIssues.map(([issue, count]) => (
              <div key={issue} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                <span className="text-sm text-gray-700">{issue}</span>
                <span className="text-sm font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">{count}</span>
              </div>
            ))}
          </div>
        )}

        {/* Best-Selling Items */}
        <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
          <h2 className="text-sm font-bold text-gray-800 mb-2 flex items-center gap-2">
            <Package size={16} /> 🏆 Best-Selling Items
          </h2>
          {topSellingItems.length === 0 ? (
            <p className="text-sm text-gray-400">No sales recorded yet.</p>
          ) : (
            topSellingItems.map(([name, qty]) => (
              <div key={name} className="flex justify-between text-sm py-1.5 border-b border-gray-50 last:border-0">
                <span className="text-gray-600">{name}</span>
                <span className="font-semibold text-gray-800">{qty} sold</span>
              </div>
            ))
          )}
        </div>

        {/* Busiest Days */}
        <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
          <h2 className="text-sm font-bold text-gray-800 mb-2 flex items-center gap-2">
            <BookOpen size={16} /> 📅 Busiest Days
          </h2>
          {repairs.length === 0 ? (
            <p className="text-sm text-gray-400">No repair data yet.</p>
          ) : (
            busiestDays.map((d) => (
              <div key={d.name} className="flex justify-between text-sm py-1.5 border-b border-gray-50 last:border-0">
                <span className="text-gray-600">{d.name}</span>
                <span className="font-semibold text-gray-800">{d.count} job{d.count !== 1 ? "s" : ""}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </PageWrapper>
  );
}
