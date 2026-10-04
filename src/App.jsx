import { useState, useCallback, useEffect } from 'react';
import { Route, Switch } from 'wouter';
import { LanguageProvider } from './lib/i18n';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import Dashboard from './pages/Dashboard';
import Register from './pages/Register';
import NewReport from './pages/NewReport';
import NcrDetail from './pages/NcrDetail';
import CapaBoard from './pages/CapaBoard';
import Trends from './pages/Trends';
import Clauses from './pages/Clauses';
import NotFound from './pages/NotFound';

// Only import auth helpers when the Supabase backend is configured
const BACKEND_ENABLED =
  typeof import.meta.env.VITE_SUPABASE_URL === 'string' &&
  import.meta.env.VITE_SUPABASE_URL.startsWith('https://');

function AppLayout() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      return localStorage.getItem('miqyas.sidebarCollapsed') === 'true';
    } catch {
      return false;
    }
  });
  const [dataKey, setDataKey] = useState(0);
  const [authReady, setAuthReady] = useState(!BACKEND_ENABLED);
  const [authError, setAuthError] = useState(null);

  // When the Supabase backend is configured, ensure a session exists
  // before rendering the app (so RPC calls have a valid JWT).
  useEffect(() => {
    if (!BACKEND_ENABLED) return;

    import('./lib/auth.js')
      .then(({ ensureSession }) => ensureSession())
      .then(() => setAuthReady(true))
      .catch(err => {
        console.error('Auth init failed:', err);
        setAuthError(err.message);
        setAuthReady(true); // still render, pages will show their own errors
      });
  }, []);

  const handleToggleMenu  = useCallback(() => setIsMenuOpen(prev => !prev), []);
  const handleCloseMenu   = useCallback(() => setIsMenuOpen(false), []);
  const handleToggleCollapse = useCallback(() => {
    setIsCollapsed(prev => {
      const next = !prev;
      try { localStorage.setItem('miqyas.sidebarCollapsed', String(next)); } catch {}
      return next;
    });
  }, []);
  const handleDataReset = useCallback(() => setDataKey(k => k + 1), []);

  // Show a minimal loading screen while auth initialises
  if (!authReady) {
    return (
      <div className="flex h-dvh items-center justify-center bg-background text-foreground">
        <div className="flex flex-col items-center gap-3 opacity-70">
          <svg className="h-10 w-10 animate-spin text-primary" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="60" strokeDashoffset="20" strokeLinecap="round"/>
          </svg>
          <span className="text-sm">جارٍ التحميل… / Loading…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-dvh overflow-hidden bg-background text-foreground">
      <Sidebar
        isOpen={isMenuOpen}
        onClose={handleCloseMenu}
        isCollapsed={isCollapsed}
        onToggleCollapse={handleToggleCollapse}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          onToggleMenu={handleToggleMenu}
          isMenuOpen={isMenuOpen}
          onDataReset={handleDataReset}
          isCollapsed={isCollapsed}
          onToggleCollapse={handleToggleCollapse}
        />

        <main
          key={dataKey}
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-4 sm:px-6 sm:py-5 md:px-8"
        >
          {authError && (
            <div className="mb-4 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              ⚠️ {authError}
            </div>
          )}
          <Switch>
            <Route path="/"          component={Dashboard} />
            <Route path="/register"  component={Register} />
            <Route path="/new"       component={NewReport} />
            <Route path="/ncr/:id"   component={NcrDetail} />
            <Route path="/capa"      component={CapaBoard} />
            <Route path="/trends"    component={Trends} />
            <Route path="/clauses"   component={Clauses} />
            <Route                   component={NotFound} />
          </Switch>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AppLayout />
    </LanguageProvider>
  );
}
