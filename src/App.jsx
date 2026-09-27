import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { AppProvider } from "./contexts/AppContext";
import { ToastProvider } from "./contexts/ToastContext";
import { ErrorBoundary } from "./components/shared/ErrorBoundary";
import BackButtonHandler from "./components/shared/BackButtonHandler";
import UpdateBanner from "./components/shared/UpdateBanner";

// Keep these two eager — they're needed immediately on first load / auth
// resolution, so lazy-loading them would add a flash-of-loading-spinner
// for the very first thing every user sees.
import Landing from "./pages/Landing";
import Login from "./pages/Login";

// Everything behind auth can load on-demand — a user only ever needs
// ONE of these on first load (whichever route they land on), not all nine.
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Repairs = lazy(() => import("./pages/Repairs"));
const Inventory = lazy(() => import("./pages/Inventory"));
const Phones = lazy(() => import("./pages/Phones"));
const CashBook = lazy(() => import("./pages/CashBook"));
const Customers = lazy(() => import("./pages/Customers"));
const Settings = lazy(() => import("./pages/Settings"));
const Download = lazy(() => import("./pages/Download"));
const PendingApproval = lazy(() => import("./pages/PendingApproval"));
const AccountRecovery = lazy(() => import("./pages/AccountRecovery"));
const Team = lazy(() => import("./pages/Team"));

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-blue-700 flex items-center justify-center">
      <div className="text-white text-center">
        <div className="text-5xl mb-4">🔧</div>
        <p className="text-xl font-semibold">Dukaan Manager</p>
        <p className="text-blue-200 text-sm mt-1">Loading...</p>
      </div>
    </div>
  );
}

function ProtectedRoute({ children }) {
  const { user, userProfile, loading } = useAuth();
  if (loading) return <LoadingScreen />;
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
  if (loading) return <LoadingScreen />;
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
      <Route path="/dashboard"  element={<ProtectedRoute><ErrorBoundary><Dashboard /></ErrorBoundary></ProtectedRoute>} />
      <Route path="/repairs"    element={<ProtectedRoute><ErrorBoundary><Repairs /></ErrorBoundary></ProtectedRoute>} />
      <Route path="/inventory"  element={<ProtectedRoute><ErrorBoundary><Inventory /></ErrorBoundary></ProtectedRoute>} />
      <Route path="/phones"     element={<ProtectedRoute><ErrorBoundary><Phones /></ErrorBoundary></ProtectedRoute>} />
      <Route path="/cashbook"   element={<ProtectedRoute><ErrorBoundary><CashBook /></ErrorBoundary></ProtectedRoute>} />
      <Route path="/customers"  element={<ProtectedRoute><ErrorBoundary><Customers /></ErrorBoundary></ProtectedRoute>} />
      <Route path="/settings"   element={<ProtectedRoute><ErrorBoundary><Settings /></ErrorBoundary></ProtectedRoute>} />
      <Route path="/team"       element={<ProtectedRoute><ErrorBoundary><Team /></ErrorBoundary></ProtectedRoute>} />
    </Routes>
  );
}

function RouteLoadingFallback() {
  return (
    <div className="min-h-screen bg-blue-700 flex items-center justify-center">
      <div className="text-white text-center">
        <div className="text-5xl mb-4">🔧</div>
        <p className="text-xl font-semibold">Dukaan Manager</p>
        <p className="text-blue-200 text-sm mt-1">Loading...</p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppProvider>
          <ToastProvider>
            <BrowserRouter>
              <BackButtonHandler />
              <UpdateBanner />
              <Suspense fallback={<RouteLoadingFallback />}>
                <AppRoutes />
              </Suspense>
            </BrowserRouter>
          </ToastProvider>
        </AppProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
