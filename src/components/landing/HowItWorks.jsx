const STEPS = [
  { num: "01", title: "Install", desc: "Download for your device — takes under a minute, no account needed yet." },
  { num: "02", title: "Log in", desc: "Owner sets up the shop once; staff accounts take seconds to add." },
  { num: "03", title: "Start managing", desc: "Log your first repair or sale — everything else builds itself from there." },
];

export default function HowItWorks() {
  return (
    <section className="bg-ink py-16 px-4">
      <h2 className="font-display font-bold text-3xl text-white text-center mb-12">Get started in 3 steps</h2>
      <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-8">
        {STEPS.map((s) => (
          <div key={s.num} className="text-center">
            <p className="font-mono text-spark text-4xl font-bold mb-3">{s.num}</p>
            <h3 className="font-display font-bold text-white text-lg mb-2">{s.title}</h3>
            <p className="text-blue-100/70 text-sm">{s.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
