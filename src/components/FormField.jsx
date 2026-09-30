export const inputClass =
  "bi w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground outline-none ring-ring focus:ring-2 transition-all";

export function FormField({ label, children, hint }) {
  return (
    <label className="block space-y-1.5">
      <span className="flex items-baseline justify-between gap-3 text-sm font-medium">
        <span>{label}</span>
        {hint && <span className="text-xs font-normal text-muted-foreground">{hint}</span>}
      </span>
      {children}
    </label>
  );
}

export function PageHeader({ title, lede, action }) {
  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-balance">{title}</h1>
        {lede && <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{lede}</p>}
      </div>
      {action && <div className="no-print shrink-0">{action}</div>}
    </div>
  );
}
