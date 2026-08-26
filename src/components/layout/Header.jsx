import { Globe, Settings, LogOut } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useApp } from "../../contexts/AppContext";
import { t } from "../../utils/translations";

export default function Header({ title }) {
  const { logout } = useAuth();
  const { lang, toggleLang, shopSettings } = useApp();
  const nav = useNavigate();

  const handleLogout = async () => {
    await logout();
    nav("/login");
  };

  return (
    <header className="fixed top-0 left-0 right-0 bg-blue-700 text-white z-40 shadow-md">
      <div className="flex items-center justify-between px-4 h-14">
        <div>
          <h1 className="font-bold text-base leading-tight">{title || shopSettings.shopName}</h1>
          <p className="text-blue-200 text-xs">{t("appName", lang)}</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={toggleLang} className="text-blue-200 hover:text-white" title="Toggle Language">
            <Globe size={20} />
          </button>
          <Link to="/settings" className="text-blue-200 hover:text-white"><Settings size={20} /></Link>
          <button onClick={handleLogout} className="text-blue-200 hover:text-white"><LogOut size={20} /></button>
        </div>
      </div>
    </header>
  );
}
