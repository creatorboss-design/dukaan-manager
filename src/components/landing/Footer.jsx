export default function Footer() {
  return (
    <footer className="bg-ink border-t border-white/10 py-10 px-4">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2 text-white font-display font-bold">
          🔧 Dukaan Manager
        </div>
        <p className="text-blue-100/50 text-xs text-center">
          Built for mobile repair shops · Free forever · Works offline
        </p>
      </div>
    </footer>
  );
}
