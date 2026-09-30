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

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <button
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden transition-opacity"
          aria-label="Close"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed inset-y-0 start-0 z-50 flex flex-col border-e border-sidebar-border bg-sidebar text-sidebar-foreground transition-all duration-300 md:static md:flex shrink-0 ${
          isOpen
            ? "w-64 translate-x-0 shadow-2xl"
            : "-translate-x-full rtl:translate-x-full md:translate-x-0 rtl:md:translate-x-0"
        } ${
          isCollapsed ? "md:w-[72px]" : "md:w-60"
        }`}
      >
        {/* Brand header with Burger Icon on the right side */}
        <div className="border-b border-sidebar-border p-3.5 transition-all">
          {isCollapsed ? (
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

              <div className="flex items-center gap-1 shrink-0">
                {/* Burger icon on the right side */}
                <button
                  type="button"
                  onClick={onToggleCollapse}
                  className="p-1.5 rounded-md text-sidebar-foreground/75 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
                  title={lang === "ar" ? "طي القائمة" : "Collapse sidebar"}
                  data-testid="button-sidebar-toggle"
                  aria-label="Collapse sidebar"
                >
                  <Menu className="h-5 w-5" />
                </button>

                {/* Mobile close button */}
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-md text-sidebar-foreground/70 hover:text-sidebar-foreground md:hidden"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
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
                title={isCollapsed ? t[item.key] : undefined}
                data-testid={`link-nav-${item.key}`}
                className={`flex items-center rounded-md font-medium transition-colors ${
                  isCollapsed ? "justify-center p-2.5" : "gap-3 px-3 py-2 text-sm"
                } ${
                  isActive
                    ? "bg-sidebar-accent text-sidebar-foreground shadow-xs font-semibold"
                    : "text-sidebar-foreground/75 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0 opacity-85" />
                {!isCollapsed && (
                  <span className="truncate">{t[item.key]}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Informational footer */}
        {!isCollapsed ? (
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
