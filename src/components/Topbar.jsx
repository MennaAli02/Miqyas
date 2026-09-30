import { Link } from 'wouter';
import { useLanguage } from '../lib/i18n';
import { Menu, X, Sun, Moon, RotateCcw } from './Icons';
import { api } from '../lib/api';

export function Topbar({ onToggleMenu, isMenuOpen, onDataReset }) {
  const { t, lang, setLang, theme, toggleTheme, actor, setActor } = useLanguage();

  const handleReset = async () => {
    if (window.confirm(t.resetConfirm)) {
      await api.resetDatabase();
      onDataReset?.();
    }
  };

  return (
    <header className="no-print flex shrink-0 items-center justify-between gap-2 border-b border-border bg-card/80 px-3 py-2.5 sm:px-5">
      <div className="flex items-center gap-2">
        <button
          className="rounded-md p-2 hover:bg-muted md:hidden transition-colors text-foreground"
          onClick={onToggleMenu}
          data-testid="button-menu"
          aria-label="Menu"
        >
          {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        <Link
          href="/new"
          className="rounded-md bg-primary px-3 py-1.5 text-xs sm:text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
          data-testid="button-new-report"
        >
          {t.newReport}
        </Link>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Sign as input */}
        <label className="hidden items-center gap-2 text-xs text-muted-foreground sm:flex">
          <span>{t.acting}</span>
          <input
            value={actor}
            onChange={e => setActor(e.target.value)}
            placeholder={lang === "ar" ? "اسمك" : "Your name"}
            className="w-28 sm:w-36 rounded-md border border-input bg-background px-2 py-1 text-xs sm:text-sm text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
            data-testid="input-actor"
          />
        </label>

        {/* Language switch */}
        <button
          className="rounded-md border border-border px-2 py-1 text-xs sm:text-sm font-medium hover:bg-muted transition-colors"
          onClick={() => setLang(lang === "ar" ? "en" : "ar")}
          data-testid="button-language"
        >
          {t.lang}
        </button>

        {/* Theme toggle */}
        <button
          className="rounded-md border border-border p-1.5 hover:bg-muted transition-colors text-foreground"
          onClick={toggleTheme}
          aria-label={theme === "dark" ? t.themeToLight : t.themeToDark}
          title={theme === "dark" ? t.themeToLight : t.themeToDark}
          data-testid="button-theme"
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        {/* Reset database button */}
        <button
          className="rounded-md border border-border p-1.5 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          onClick={handleReset}
          title={t.resetData}
          aria-label={t.resetData}
          data-testid="button-reset-data"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
