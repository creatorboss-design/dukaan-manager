import { NavLink } from "react-router-dom";
import { LayoutDashboard, Wrench, Package, BookOpen, Users, Settings } from "lucide-react";
import { useApp } from "../../contexts/AppContext";
import { useAuth } from "../../contexts/AuthContext";
import { t } from "../../utils/translations";

export default function BottomNav() {
  const { lang } = useApp();
  const { isOwner } = useAuth();
  
  const links = [
    { to: "/dashboard", icon: LayoutDashboard, key: "dashboard" },
    { to: "/repairs", icon: Wrench, key: "repairs" },
    { to: "/inventory", icon: Package, key: "inventory" },
    { to: "/cashbook", icon: BookOpen, key: "cashbook" },
  ];
  
  if (isOwner) links.push({ to: "/team", icon: Users, key: "team" });
  links.push({ to: "/settings", icon: Settings, key: "settings" });

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)] flex justify-around items-center h-16 z-40 safe-area-pb">
      {links.map(({ to, icon: Icon, key }) => (
        <NavLink key={to} to={to} end={to === "/dashboard"}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center gap-1 w-full h-full text-xs transition-all duration-200 ${isActive ? "text-blue-700" : "text-gray-400 hover:text-gray-600"}`}>
          {({ isActive }) => (
            <>
              <Icon size={22} strokeWidth={isActive ? 2.5 : 2} className={isActive ? "text-blue-700 drop-shadow-sm" : ""} />
              <span className="text-[10px] leading-tight font-semibold">{key === 'team' ? 'Team' : key === 'settings' ? 'Settings' : t(key, lang)}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
