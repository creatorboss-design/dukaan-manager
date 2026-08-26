import { useAuth } from "../contexts/AuthContext";

export default function PendingApproval() {
  const { logout } = useAuth();

  return (
    <div className="min-h-screen bg-blue-700 flex flex-col items-center justify-center p-6 text-center text-white">
      <div className="text-6xl mb-4">⏳</div>
      <h1 className="text-2xl font-bold mb-2">Account Pending Approval</h1>
      <p className="text-blue-200 mb-2 max-w-sm">
        Your account has been created successfully, but it needs to be approved
        by the shop owner before you can access the dashboard.
      </p>
      <p className="text-blue-300 text-sm mb-8 max-w-sm">
        ✅ This page will update <strong>automatically</strong> as soon as the
        owner approves you — no refresh needed.
      </p>
      <button
        onClick={logout}
        className="bg-white text-blue-800 rounded-xl px-6 py-3 font-semibold shadow-lg active:scale-95 transition-all"
      >
        Sign Out
      </button>
    </div>
  );
}
