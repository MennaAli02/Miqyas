import { useLanguage, isOverdue } from '../lib/i18n';
import { STATUS_NAMES, SEVERITY_NAMES } from '../lib/i18n';

export function SeverityBadge({ value }) {
  const { lang } = useLanguage();
  const colorClass =
    value === "critical"
      ? "bg-destructive/10 text-destructive"
      : value === "major"
      ? "bg-[hsl(36_62%_40%/0.12)] text-[hsl(20_60%_28%)] dark:text-[hsl(36_70%_70%)]"
      : "bg-muted text-muted-foreground";

  return (
    <span
      className={`inline-flex items-center rounded-sm px-1.5 py-0.5 text-xs font-medium ${colorClass}`}
      data-testid={`status-severity-${value}`}
    >
      {SEVERITY_NAMES[lang]?.[value] || value}
    </span>
  );
}

export function StatusBadge({ value, due }) {
  const { lang } = useLanguage();
  const late = due ? isOverdue(due, value) : false;

  const dotClass =
    value === "closed"
      ? "bg-[hsl(152_32%_32%)]"
      : late
      ? "bg-destructive"
      : "bg-primary";

  return (
    <span className="inline-flex items-center gap-1.5 text-sm" data-testid={`status-${value}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dotClass}`} />
      <span>{STATUS_NAMES[lang]?.[value] || value}</span>
      {late && (
        <span className="text-xs font-medium text-destructive">
          {lang === "ar" ? "متأخر" : "late"}
        </span>
      )}
    </span>
  );
}
