import { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { useLanguage } from '../lib/i18n';
import {
  MiqyasLogo,
  FileText,
  ListTodo,
  PlusCircle,
  BarChart3,
  BookOpen,
  FolderArchive,
  Menu,
  X
} from './Icons';

const NAV_ITEMS = [
  { href: "/", key: "navHome", icon: FileText },
  { href: "/register", key: "navRegister", icon: FolderArchive },
  { href: "/new", key: "navNew", icon: PlusCircle },
  { href: "/capa", key: "navCapa", icon: ListTodo },
  { href: "/trends", key: "navTrends", icon: BarChart3 },
  { href: "/clauses", key: "navClauses", icon: BookOpen }
];

export function Sidebar({ isOpen, onClose, isCollapsed, onToggleCollapse }) {
  const { t, lang } = useLanguage();
  const [location] = useLocation();

  // Detect whether the screen is desktop (>= 768px)
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 768;
    }
    return true;
  });

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Collapse mode is strictly for desktop layout
  const isReallyCollapsed = isCollapsed && isDesktop;

  // On mobile, the button in the drawer closes the drawer completely.
  // On desktop, it toggles collapse/expand of the sidebar rail.
  const handleToggleOrClose = () => {
    if (!isDesktop || isOpen) {
      onClose();
    } else {
      onToggleCollapse();
    }
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden transition-opacity"
          aria-label="Close"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed inset-y-0 start-0 z-50 flex flex-col border-e border-sidebar-border bg-sidebar text-sidebar-foreground transition-all duration-300 md:static md:flex shrink-0 ${
          isOpen
            ? "w-64 translate-x-0 rtl:translate-x-0 shadow-2xl"
            : "-translate-x-full rtl:translate-x-full md:translate-x-0 rtl:md:translate-x-0"
        } ${
          isReallyCollapsed ? "md:w-[72px]" : "md:w-60"
        }`}
      >
        {/* Brand header */}
        <div className="border-b border-sidebar-border p-3.5 transition-all">
          {isReallyCollapsed ? (
            /* Collapsed Desktop View (72px rail) */
            <div className="flex flex-col items-center gap-3">
              <Link href="/" onClick={onClose} title={t.brand}>
                <MiqyasLogo className="h-7 w-7 text-sidebar-primary shrink-0" />
              </Link>
              <button
                type="button"
                onClick={onToggleCollapse}
                className="p-1.5 rounded-md text-sidebar-foreground/75 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
                title={lang === "ar" ? "توسيع القائمة" : "Expand sidebar"}
                data-testid="button-sidebar-toggle"
                aria-label="Expand sidebar"
              >
                <Menu className="h-5 w-5" />
              </button>
            </div>
          ) : (
            /* Expanded View (Full Drawer on Mobile, or Full Sidebar on Desktop) */
            <div className="flex items-center justify-between gap-2">
              <Link
                href="/"
                className="flex items-center gap-2.5 min-w-0"
                onClick={onClose}
                title={t.brand}
              >
                <MiqyasLogo className="h-7 w-7 text-sidebar-primary shrink-0" />
                <div className="min-w-0 transition-opacity duration-200">
                  <div className="text-sm font-semibold leading-tight text-sidebar-foreground">
                    {t.brand}
                  </div>
                  <div className="truncate text-[11px] text-sidebar-foreground/60">
                    {t.product}
                  </div>
                </div>
              </Link>

              {/* Button on the right: Closes drawer on mobile, Toggles collapse on desktop */}
              <button
                type="button"
                onClick={handleToggleOrClose}
                className="p-1.5 rounded-md text-sidebar-foreground/75 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors shrink-0"
                title={
                  !isDesktop
                    ? (lang === "ar" ? "إغلاق القائمة" : "Close menu")
                    : (lang === "ar" ? "طي القائمة" : "Collapse sidebar")
                }
                data-testid="button-sidebar-toggle"
                aria-label={!isDesktop ? "Close menu" : "Collapse sidebar"}
              >
                {!isDesktop ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          )}
        </div>

        {/* Navigation links */}
        <nav className="flex flex-1 flex-col gap-1 px-2.5 py-3 overflow-y-auto" aria-label="Main">
          {NAV_ITEMS.map(item => {
            const isActive =
              location === item.href ||
              (item.href !== "/" && location.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                title={isReallyCollapsed ? t[item.key] : undefined}
                data-testid={`link-nav-${item.key}`}
                className={`flex items-center rounded-md font-medium transition-colors ${
                  isReallyCollapsed ? "justify-center p-2.5" : "gap-3 px-3 py-2 text-sm"
                } ${
                  isActive
                    ? "bg-sidebar-accent text-sidebar-foreground shadow-xs font-semibold"
                    : "text-sidebar-foreground/75 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0 opacity-85" />
                {!isReallyCollapsed && (
                  <span className="truncate">{t[item.key]}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Informational footer */}
        {!isReallyCollapsed ? (
          <div className="border-t border-sidebar-border p-4 text-xs text-sidebar-foreground/80 transition-all duration-200">
            <div className="font-medium text-sidebar-foreground">{t.openAccess}</div>
            <p className="mt-1 leading-relaxed text-sidebar-foreground/70">
              {t.noLogin}
            </p>
          </div>
        ) : (
          <div
            className="border-t border-sidebar-border p-3 text-center text-xs text-sidebar-foreground/70 flex justify-center"
            title={`${t.openAccess}: ${t.noLogin}`}
          >
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-sidebar-primary" />
          </div>
        )}
      </aside>
    </>
  );
}
