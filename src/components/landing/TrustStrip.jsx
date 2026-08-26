const ITEMS = [
  { icon: "🆓", label: "100% Free" },
  { icon: "📶", label: "Works Offline" },
  { icon: "📱", label: "Any Device" },
  { icon: "🚫", label: "No Setup Fees" },
];

export default function TrustStrip() {
  return (
    <div className="bg-ink border-t border-white/10 py-4">
      <div className="max-w-4xl mx-auto flex flex-wrap justify-center gap-x-8 gap-y-2 px-4">
        {ITEMS.map((i) => (
          <span key={i.label} className="text-blue-100/70 text-sm font-medium flex items-center gap-2">
            <span>{i.icon}</span> {i.label}
          </span>
        ))}
      </div>
    </div>
  );
}
