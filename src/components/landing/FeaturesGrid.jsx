const FEATURES = [
  { emoji: "🔧", title: "Repair Tracker", desc: "Know exactly what stage every phone is at — no more \"let me check and call you back.\"" },
  { emoji: "📦", title: "Inventory", desc: "See what's running low before a customer asks for the one earphone you're out of." },
  { emoji: "📱", title: "Phone Ledger", desc: "Every second-hand phone logged by IMEI — never argue about \"we never sold you this\" again." },
  { emoji: "💰", title: "Hisab & Udhaar", desc: "Daily cash, credit customers, and supplier dues — all in one place, not three notebooks." },
  { emoji: "🧾", title: "PDF Invoices", desc: "A proper bill with your shop name on it, generated in one tap." },
  { emoji: "☁️", title: "Works Offline", desc: "Patchy shop wifi? Keep working. It syncs the moment you're back online." },
];

export default function FeaturesGrid() {
  return (
    <div className="max-w-6xl mx-auto grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {FEATURES.map((feature, idx) => (
        <div 
          key={idx} 
          className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all"
        >
          <div className="text-4xl mb-4 bg-gray-50 w-16 h-16 rounded-xl flex items-center justify-center">
            {feature.emoji}
          </div>
          <h3 className="text-xl font-bold text-ink mb-2">{feature.title}</h3>
          <p className="text-gray-500 text-sm leading-relaxed">{feature.desc}</p>
        </div>
      ))}
    </div>
  );
}
