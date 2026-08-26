import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { AppProvider } from "./contexts/AppContext";
import { ToastProvider } from "./contexts/ToastContext";
import { ErrorBoundary } from "./components/shared/ErrorBoundary";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Repairs from "./pages/Repairs";
import Inventory from "./pages/Inventory";
import Phones from "./pages/Phones";
import CashBook from "./pages/CashBook";
import Customers from "./pages/Customers";
import Settings from "./pages/Settings";
import Download from "./pages/Download";

import PendingApproval from "./pages/PendingApproval";
import AccountRecovery from "./pages/AccountRecovery";
import Team from "./pages/Team";

function ProtectedRoute({ children }) {
  const { user, userProfile, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen bg-blue-700 flex items-center justify-center">
      <div className="text-white text-center">
        <div className="text-5xl mb-4">🔧</div>
        <p className="text-xl font-semibold">Dukaan Manager</p>
        <p className="text-blue-200 text-sm mt-1">Loading...</p>
      </div>
    </div>
  );
  if (!user) return <Navigate to="/login" />;
  // User is logged in but has no Firestore profile — show account recovery
  if (!userProfile) return <AccountRecovery />;
  if (userProfile?.role === "pending") return <PendingApproval />;
  return children;
}

// Shows Landing to logged-out visitors; redirects logged-in users straight to /dashboard.
// Shows the blue loading spinner while Firebase auth resolves (avoids blank screen).
function RootRoute() {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen bg-blue-700 flex items-center justify-center">
      <div className="text-white text-center">
        <div className="text-5xl mb-4">🔧</div>
        <p className="text-xl font-semibold">Dukaan Manager</p>
        <p className="text-blue-200 text-sm mt-1">Loading...</p>
      </div>
    </div>
  );
  return user ? <Navigate to="/dashboard" replace /> : <Landing />;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<RootRoute />} />
      <Route path="/install" element={<Navigate to="/" replace />} />
      <Route path="/download" element={<Download />} />
      <Route path="/login" element={<Login />} />

      {/* Protected */}
      <Route path="/dashboard"  element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/repairs"    element={<ProtectedRoute><Repairs /></ProtectedRoute>} />
      <Route path="/inventory"  element={<ProtectedRoute><Inventory /></ProtectedRoute>} />
      <Route path="/phones"     element={<ProtectedRoute><Phones /></ProtectedRoute>} />
      <Route path="/cashbook"   element={<ProtectedRoute><CashBook /></ProtectedRoute>} />
      <Route path="/customers"  element={<ProtectedRoute><Customers /></ProtectedRoute>} />
      <Route path="/settings"   element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      <Route path="/team"       element={<ProtectedRoute><Team /></ProtectedRoute>} />
    </Routes>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppProvider>
          <ToastProvider>
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          </ToastProvider>
        </AppProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
