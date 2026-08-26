import Header from "./Header";
import BottomNav from "./BottomNav";
import OfflineBanner from "../shared/OfflineBanner";

export default function PageWrapper({ children, title }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header title={title} />
      <OfflineBanner />
      <main className="pt-14 pb-20 px-4 max-w-2xl mx-auto">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
