import { Link } from "react-router-dom";

const INCLUDED = [
  "Repair tracking & warranty log",
  "Inventory & spare parts",
  "Phone buy/sell ledger",
  "Cash book, udhaar & supplier tracker",
  "PDF invoices & CSV export",
  "Works offline, syncs automatically",
];

export default function FreeForever() {
  return (
    <section className="bg-paper py-16 px-4">
      <div className="max-w-md mx-auto bg-white rounded-3xl shadow-xl p-8 text-center border border-gray-100">
        <p className="font-mono text-signal text-sm mb-2">FOR YOUR SHOP</p>
        <h2 className="font-display font-extrabold text-4xl text-ink mb-1">Free.</h2>
        <p className="text-gray-500 mb-6">No catch, no trial period, no card required.</p>
        <ul className="text-left space-y-2 mb-8">
          {INCLUDED.map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm text-ink">
              <span className="text-circuit font-bold">✓</span> {item}
            </li>
          ))}
        </ul>
        <Link 
          to="/download" 
          className="block bg-ink text-white font-bold rounded-xl py-3.5 hover:bg-signal transition-colors focus:outline-none focus:ring-2 focus:ring-spark focus:ring-offset-2 focus:ring-offset-white"
        >
          Get the App
        </Link>
      </div>
    </section>
  );
}
