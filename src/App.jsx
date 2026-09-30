import { useState, useCallback } from 'react';
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

function AppLayout() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      return localStorage.getItem("miqyas.sidebarCollapsed") === "true";
    } catch {
      return false;
    }
  });
  const [dataKey, setDataKey] = useState(0);

  const handleToggleMenu = useCallback(() => {
    setIsMenuOpen(prev => !prev);
  }, []);

  const handleCloseMenu = useCallback(() => {
    setIsMenuOpen(false);
  }, []);

  const handleToggleCollapse = useCallback(() => {
    setIsCollapsed(prev => {
      const next = !prev;
      try {
        localStorage.setItem("miqyas.sidebarCollapsed", String(next));
      } catch {}
      return next;
    });
  }, []);

  const handleDataReset = useCallback(() => {
    setDataKey(k => k + 1);
  }, []);

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
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/register" component={Register} />
            <Route path="/new" component={NewReport} />
            <Route path="/ncr/:id" component={NcrDetail} />
            <Route path="/capa" component={CapaBoard} />
            <Route path="/trends" component={Trends} />
            <Route path="/clauses" component={Clauses} />
            <Route component={NotFound} />
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
