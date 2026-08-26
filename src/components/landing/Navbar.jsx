import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";

const NAV_LINKS = [
  { href: "#features",     label: "Features" },
  { href: "#screenshots",  label: "Screenshots" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-30 bg-ink/90 backdrop-blur-md border-b border-white/10 shadow-lg font-body">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">

        {/* Logo */}
        <Link
          to="/"
          className="flex items-center gap-2.5 text-white font-display font-extrabold text-lg shrink-0 hover:opacity-90 transition-opacity"
        >
          <span className="text-2xl">🔧</span>
          <span className="tracking-tight">Dukaan Manager</span>
        </Link>

        {/* Desktop: nav links + action buttons */}
        <div className="hidden md:flex items-center gap-6">
          {NAV_LINKS.map(({ href, label }) => (
            <a
              key={href}
              href={href}
              className="text-blue-200 hover:text-white text-sm font-medium transition-colors"
            >
              {label}
            </a>
          ))}

          <div className="h-4 w-px bg-white/20" />

          <Link
            to="/login"
            className="text-white text-sm font-semibold hover:text-blue-200 transition-colors"
          >
            Login
          </Link>

          <Link
            to="/download"
            id="navbar-download-btn"
            className="bg-white text-blue-800 rounded-xl px-5 py-2 text-sm font-bold shadow-md hover:bg-blue-50 active:scale-95 transition-all"
          >
            ⬇ Download
          </Link>
        </div>

        {/* Mobile: hamburger */}
        <button
          id="navbar-hamburger"
          onClick={() => setOpen((v) => !v)}
          className="md:hidden text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          aria-label="Toggle menu"
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <div className="md:hidden bg-blue-900 border-t border-white/10 px-4 py-3 flex flex-col gap-1">
          {NAV_LINKS.map(({ href, label }) => (
            <a
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className="text-blue-200 hover:text-white text-sm font-medium py-2 px-2 rounded-lg hover:bg-white/5 transition-colors"
            >
              {label}
            </a>
          ))}
          <div className="my-1 h-px bg-white/10" />
          <Link
            to="/login"
            onClick={() => setOpen(false)}
            className="text-white text-sm font-semibold py-2 px-2 rounded-lg hover:bg-white/5 transition-colors"
          >
            Login
          </Link>
          <Link
            to="/download"
            onClick={() => setOpen(false)}
            className="bg-white text-blue-800 rounded-xl py-3 text-sm font-bold text-center mt-1 hover:bg-blue-50 active:scale-95 transition-all"
          >
            ⬇ Download
          </Link>
        </div>
      )}
    </nav>
  );
}
