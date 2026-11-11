import React, { Suspense, lazy, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';
import { Navbar } from './components/Navbar';
import { SecretsModal } from './components/SecretsModal';
import { LandingPage } from './landing/LandingPage';
import { PrivacyPage, TermsPage, NotFoundPage } from './landing/LegalPages';

// App pages are code-split so the public landing page at "/" doesn't pull in
// the whole builder bundle (React Flow etc.) on first load.
const AuthPage = lazy(() => import('./pages/AuthPage').then((m) => ({ default: m.AuthPage })));
const DashboardPage = lazy(() => import('./pages/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const WorkflowBuilderPage = lazy(() => import('./pages/WorkflowBuilderPage').then((m) => ({ default: m.WorkflowBuilderPage })));

function RouteFallback() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center" role="status" aria-label="Loading page">
      <div className="w-8 h-8 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
    </div>
  );
}

function ProtectedRoute({ children }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

const PUBLIC_MARKETING_ROUTES = new Set(['/', '/privacy', '/terms']);

// Public marketing & legal pages bring their own layout/navigation, while the
// authenticated product shell renders the in-app Navbar and SecretsModal.
function AppShell() {
  const { checkAuth } = useAuthStore();
  const [secretsOpen, setSecretsOpen] = useState(false);
  const location = useLocation();
  const isPublicMarketing = PUBLIC_MARKETING_ROUTES.has(location.pathname);
  const isAppRoute = ['/login', '/dashboard', '/builder'].includes(location.pathname);

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <div className="min-h-screen bg-dark-900 text-slate-100 font-sans flex flex-col">
      {!isPublicMarketing && isAppRoute && <Navbar onOpenSecrets={() => setSecretsOpen(true)} />}

      <div className="flex-1">
        <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/login" element={<AuthPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/builder"
            element={
              <ProtectedRoute>
                <WorkflowBuilderPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
        </Suspense>
      </div>

      {!isPublicMarketing && isAppRoute && <SecretsModal isOpen={secretsOpen} onClose={() => setSecretsOpen(false)} />}
    </div>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}

export default App;
