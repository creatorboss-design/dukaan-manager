// 4 screenshots of the actual running app, placed at public/screenshots/
// horizontal snap-scroll carousel — works on touch and mouse
// Images are lazy-loaded to keep initial page weight low

const SCREENSHOTS = [
  { src: "/screenshots/dashboard.png", label: "Dashboard" },
  { src: "/screenshots/repairs.png",   label: "Repair Tracking" },
  { src: "/screenshots/inventory.png", label: "Inventory" },
  { src: "/screenshots/cashbook.png",  label: "Cash Book" },
];

export default function ScreenshotsGallery() {
  return (
    <div className="py-6">
      <h2 className="text-xl font-extrabold text-white text-center mb-4">See It In Action</h2>
      <div className="flex justify-center gap-6 md:gap-8 flex-wrap">
        {SCREENSHOTS.map((s, idx) => (
          <div key={idx} className="relative mx-auto w-56">
            <div className="rounded-[2.2rem] border-[10px] border-ink bg-ink shadow-2xl overflow-hidden">
              <div className="w-full aspect-[9/19.5] bg-white overflow-hidden">
                <img 
                  src={s.src} 
                  alt={s.label} 
                  className="w-full h-full object-cover" 
                  loading="lazy" 
                />
              </div>
            </div>
            {/* notch */}
            <div className="absolute top-[10px] left-1/2 -translate-x-1/2 w-16 h-4 bg-ink rounded-b-xl" />
          </div>
        ))}
      </div>
    </div>
  );
}
