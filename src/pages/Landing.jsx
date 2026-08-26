import Navbar from "../components/landing/Navbar";
import Hero from "../components/landing/Hero";
import TrustStrip from "../components/landing/TrustStrip";
import FeaturesGrid from "../components/landing/FeaturesGrid";
import ScreenshotsGallery from "../components/landing/ScreenshotsGallery";
import HowItWorks from "../components/landing/HowItWorks";
import FreeForever from "../components/landing/FreeForever";
import Footer from "../components/landing/Footer";

export default function Landing() {
  return (
    <div className="font-body bg-white">
      <Navbar />
      <Hero />
      <TrustStrip />
      <section id="features" className="bg-white py-16 px-4">
        <h2 className="font-display font-bold text-3xl text-ink text-center mb-2">
          Built for how repair shops actually work
        </h2>
        <p className="text-gray-500 text-center mb-10">
          Not a generic business tool — built around a repair counter.
        </p>
        <FeaturesGrid />
      </section>
      <section id="screenshots" className="bg-paper py-16 px-4">
        <h2 className="font-display font-bold text-3xl text-ink text-center mb-10">See It In Action</h2>
        <ScreenshotsGallery />
      </section>
      <HowItWorks />
      <FreeForever />
      <Footer />
    </div>
  );
}
