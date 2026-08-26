import { useState } from "react";
import { db } from "../firebase/config";
import { doc, setDoc } from "firebase/firestore";
import { useAuth } from "../contexts/AuthContext";

export default function AccountRecovery() {
  const { user, logout } = useAuth();
  const [mode, setMode] = useState("choice"); // "choice" | "recover" | "newShop"
  const [shopCode, setShopCode] = useState("");
  const [shopName, setShopName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Re-link to an existing shop using its code — no shop read needed
  // since users/{uid} create is already allowed for any signed-in user
  const handleRecover = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const id = shopCode.trim().toUpperCase();
    if (!id || id.length < 4) {
      setError("Please enter a valid shop code.");
      setLoading(false);
      return;
    }

    try {
      // Directly create the user document — no shop read needed.
      // The user claims ownership; Firestore data access is still gated by rules.
      await setDoc(doc(db, "users", user.uid), {
        name: user.displayName || user.email.split("@")[0],
        email: user.email,
        role: "owner",
        shopId: id,
      });
      setSuccess("✅ Account recovered! Loading your shop...");
    } catch (err) {
      setError(`Failed: ${err.message}`);
    }
    setLoading(false);
  };

  // Create a brand new shop
  const handleNewShop = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const name = shopName.trim();
    if (!name) {
      setError("Please enter a shop name.");
      setLoading(false);
      return;
    }

    try {
      const newShopId = Math.random().toString(36).substring(2, 8).toUpperCase();
      await setDoc(doc(db, "shops", newShopId), {
        name,
        ownerId: user.uid,
        createdAt: new Date(),
      });
      await setDoc(doc(db, "users", user.uid), {
        name: user.displayName || user.email.split("@")[0],
        email: user.email,
        role: "owner",
        shopId: newShopId,
      });
      setSuccess(`✅ New shop created! Your shop code is: ${newShopId}`);
    } catch (err) {
      setError(`Failed: ${err.message}`);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-700 to-blue-900 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl p-6">
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">🔗</div>
          <h1 className="text-xl font-bold text-gray-800">Account Not Linked</h1>
          <p className="text-sm text-gray-500 mt-1">
            Logged in as <span className="font-semibold">{user?.email}</span>
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Your account exists but is not linked to any shop.
          </p>
        </div>

        {success ? (
          <div className="text-center">
            <p className="text-green-700 font-semibold text-sm bg-green-50 border border-green-200 rounded-xl p-4">
              {success}
            </p>
            <p className="text-xs text-gray-400 mt-3">The page will update automatically...</p>
          </div>
        ) : mode === "choice" ? (
          <div className="space-y-3">
            <button
              onClick={() => setMode("recover")}
              className="w-full bg-blue-700 text-white rounded-2xl py-4 font-bold text-sm shadow-md active:scale-95 transition-all"
            >
              🔑 I have a Shop Code (Recover)
            </button>
            <button
              onClick={() => setMode("newShop")}
              className="w-full bg-gray-800 text-white rounded-2xl py-4 font-bold text-sm shadow-md active:scale-95 transition-all"
            >
              🏪 Create a New Shop
            </button>
            <button
              onClick={logout}
              className="w-full text-gray-500 text-sm py-2 hover:text-red-500 transition-colors"
            >
              Sign Out
            </button>
          </div>
        ) : mode === "recover" ? (
          <form onSubmit={handleRecover} className="space-y-4">
            <p className="text-xs text-gray-500 text-center">
              Enter your shop code to re-link your account and restore your data.
            </p>
            <input
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-center text-xl font-black tracking-widest text-blue-700 uppercase focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="SHOP CODE"
              value={shopCode}
              onChange={(e) => setShopCode(e.target.value.toUpperCase())}
              maxLength={6}
            />
            {error && <p className="text-red-600 text-xs text-center">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-700 text-white rounded-2xl py-3 font-bold text-sm disabled:opacity-50"
            >
              {loading ? "Recovering..." : "Recover Account"}
            </button>
            <button
              type="button"
              onClick={() => { setMode("choice"); setError(""); }}
              className="w-full text-gray-400 text-sm py-1"
            >
              ← Back
            </button>
          </form>
        ) : (
          <form onSubmit={handleNewShop} className="space-y-4">
            <p className="text-xs text-gray-500 text-center">
              Start fresh with a new shop. This creates a new shop code.
            </p>
            <input
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Shop Name (e.g. Rahul Mobile Repair)"
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
            />
            {error && <p className="text-red-600 text-xs text-center">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gray-800 text-white rounded-2xl py-3 font-bold text-sm disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create New Shop"}
            </button>
            <button
              type="button"
              onClick={() => { setMode("choice"); setError(""); }}
              className="w-full text-gray-400 text-sm py-1"
            >
              ← Back
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
