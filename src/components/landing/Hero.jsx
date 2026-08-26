import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const TICKET_STATES = [
  { label: "Received", color: "bg-gray-400", progress: "20%" },
  { label: "Diagnosing", color: "bg-spark", progress: "45%" },
  { label: "Repairing", color: "bg-signal", progress: "70%" },
  { label: "Ready", color: "bg-circuit", progress: "100%" },
];

function LiveTicket() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      setStep(3); // Static Ready state
      return;
    }
    const id = setInterval(() => setStep((s) => (s + 1) % TICKET_STATES.length), 2200);
    return () => clearInterval(id);
  }, []);

  const current = TICKET_STATES[step];

  return (
    <div className="bg-white rounded-3xl p-6 shadow-2xl w-full max-w-sm mx-auto rotate-1 border border-gray-100">
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-xs text-gray-400 font-mono">TICKET #DM-0417</p>
          <p className="font-display font-bold text-ink text-lg">Redmi Note 12</p>
        </div>
        <span className={`${current.color} text-white text-xs font-bold px-3 py-1 rounded-full transition-colors duration-500`}>
          {current.label}
        </span>
      </div>
      <p className="text-sm text-gray-500 mb-1">Screen replacement</p>
      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mb-4">
        <div
          className="h-full bg-signal transition-all duration-700 ease-out"
          style={{ width: current.progress }}
        />
      </div>
      <div className="flex justify-between text-xs text-gray-400 font-mono">
        <span>Advance: ₹500</span>
        <span>Est: ₹1,800</span>
      </div>
    </div>
  );
}

export default function Hero() {
  return (
    <section className="bg-ink pt-16 pb-20 px-4 overflow-hidden relative">
      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
        <div>
          <p className="text-spark font-mono text-sm mb-3 tracking-wide">FOR MOBILE REPAIR SHOPS</p>
          <h1 className="font-display font-extrabold text-4xl md:text-5xl text-white leading-tight mb-5">
            Run your shop from your pocket.
          </h1>
          <p className="text-blue-100/80 text-lg mb-8 max-w-md">
            Track repairs, manage stock, log every sale, and keep your hisab straight —
            all in one free app that works even when the internet doesn't.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link 
              to="/download" 
              className="bg-white text-ink font-bold rounded-xl px-6 py-3.5 shadow-lg hover:bg-paper transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-spark focus:ring-offset-2 focus:ring-offset-ink"
            >
              Get the App — Free
            </Link>
            <a 
              href="#screenshots" 
              className="border border-white/30 text-white font-semibold rounded-xl px-6 py-3.5 hover:bg-white/10 transition-all focus:outline-none focus:ring-2 focus:ring-spark focus:ring-offset-2 focus:ring-offset-ink"
            >
              See it in action
            </a>
          </div>
        </div>
        <LiveTicket />
      </div>
    </section>
  );
}
