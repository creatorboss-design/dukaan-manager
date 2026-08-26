import { createContext, useContext, useEffect, useState } from "react";
import { db } from "../firebase/config";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useAuth } from "./AuthContext";

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const { userProfile } = useAuth();
  const shopId = userProfile?.shopId;

  const [lang, setLang] = useState(localStorage.getItem("lang") || "en");
  const [shopSettings, setShopSettings] = useState({
    shopName: "My Repair Shop",
    gst: "",
    branch: "Main",
    logo: "",
    warrantyDays: 30,
  });

  const toggleLang = () => {
    const next = lang === "en" ? "hi" : "en";
    setLang(next);
    localStorage.setItem("lang", next);
  };

  const saveSettings = async (settings) => {
    if (!shopId) return { ok: false, error: "Shop ID missing" };
    try {
      // We map shopName to name for the shops doc
      const updateData = { ...settings, name: settings.shopName };
      await updateDoc(doc(db, "shops", shopId), updateData);
      setShopSettings((prev) => ({ ...prev, ...settings }));
      return { ok: true };
    } catch (err) {
      console.error("Failed to save settings:", err);
      return { ok: false, error: err.message };
    }
  };

  useEffect(() => {
    if (!shopId) return;

    getDoc(doc(db, "shops", shopId)).then((snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setShopSettings((prev) => ({
          ...prev,
          ...data,
          shopName: data.name || prev.shopName,
        }));
      }
    });
  }, [shopId]);

  return (
    <AppContext.Provider value={{ lang, toggleLang, shopSettings, saveSettings }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
