import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { useLanguage } from '../lib/i18n';
import { api } from '../lib/api';
import { WORKFLOW_STAGES } from '../lib/constants';
import { STATUS_NAMES, DEPARTMENT_NAMES } from '../lib/i18n';
import { SeverityBadge, StatusBadge } from '../components/StatusBadge';
import { PageHeader } from '../components/FormField';

export default function Dashboard() {
  const { t, lang, pick, formatDate, isOverdue } = useLanguage();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.getBootstrap();
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading || !data) {
    return <div className="h-40 animate-pulse rounded-md bg-muted" data-testid="status-loading" />;
  }

  const { stats, ncrs, clauses } = data;

  const kpis = [
    { label: t.open, value: stats.open, test: "text-kpi-open" },
    { label: t.overdue, value: stats.overdue, test: "text-kpi-overdue", warn: stats.overdue > 0 },
    { label: t.criticalOpen, value: stats.critical, test: "text-kpi-critical" },
    { label: t.closedMonth, value: stats.closedMonth, test: "text-kpi-closed" },
    { label: t.capaOpen, value: stats.capaOpen || 0, test: "text-kpi-capa" }
  ];

  const maxStatusCount = Math.max(1, ...WORKFLOW_STAGES.map(v => stats.byStatus[v] || 0));

  const hotClauses = Object.entries(stats.clauseHits)
    .map(([id, count]) => ({
      clause: clauses.find(c => String(c.id) === String(id)),
      count
    }))
    .filter(x => x.clause)
    .sort((a, b) => b.count - a.count)
    .slice(0, 4);

  const overdueNcrs = ncrs
    .filter(n => isOverdue(n.dueDate, n.status))
    .slice(0, 4);

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title={t.kpis} lede={t.demo} />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {kpis.map((kpi, idx) => (
          <div
            key={kpi.test}
            className={`rounded-md border bg-card p-3 sm:p-4 shadow-xs transition-shadow ${
              kpi.warn ? "border-destructive/40" : "border-card-border"
            } ${idx === 4 ? "col-span-2 sm:col-span-1" : ""}`}
          >
            <div className="text-xs text-muted-foreground">{kpi.label}</div>
            <div
              className={`num mt-1.5 sm:mt-2 text-xl sm:text-2xl font-semibold ${
                kpi.warn ? "text-destructive" : "text-foreground"
              }`}
              data-testid={kpi.test}
            >
              {kpi.value}
            </div>
          </div>
        ))}
      </div>

      {/* Funnel + Overdue */}
      <div className="mt-6 grid gap-4 lg:grid-cols-5">
        <section className="rounded-md border border-card-border bg-card p-3.5 sm:p-4 lg:col-span-2 shadow-xs">
          <h2 className="text-sm font-semibold text-foreground">{t.funnel}</h2>
          <ul className="mt-3 space-y-2.5">
            {WORKFLOW_STAGES.map(stage => {
              const count = stats.byStatus[stage] || 0;
              const pct = (count / maxStatusCount) * 100;
              return (
                <li key={stage} className="flex items-center gap-2 text-sm">
                  <span className="w-20 sm:w-24 shrink-0 text-xs text-muted-foreground truncate">
                    {STATUS_NAMES[lang]?.[stage] || stage}
                  </span>
                  <span className="h-1.5 flex-1 min-w-[50px] rounded-full bg-muted overflow-hidden">
                    <span
                      className="block h-1.5 rounded-full bg-primary transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </span>
                  <span className="num w-6 text-end text-xs font-medium text-foreground">
                    {count}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="rounded-md border border-card-border bg-card p-4 lg:col-span-3 shadow-xs">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">{t.overdueList}</h2>
            <Link
              href="/register"
              className="text-sm font-medium text-primary hover:underline"
              data-testid="link-see-register"
            >
              {t.seeAll}
            </Link>
          </div>
          {overdueNcrs.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">{t.noneOverdue}</p>
          ) : (
            <ul className="mt-3 divide-y divide-border">
              {overdueNcrs.map(ncr => (
                <li key={ncr.id} className="flex items-start justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <Link
                      href={`/ncr/${ncr.id}`}
                      className="num font-medium text-primary hover:underline"
                      data-testid={`link-ncr-${ncr.id}`}
                    >
                      {ncr.ref}
                    </Link>
                    <div className="truncate text-sm text-foreground">{pick(ncr.title)}</div>
                  </div>
                  <div className="shrink-0 text-end text-xs font-medium text-destructive">
                    {formatDate(ncr.dueDate)}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Recent reports + Repeating clauses */}
      <div className="mt-4 grid gap-4 lg:grid-cols-5">
        <section className="rounded-md border border-card-border bg-card p-4 lg:col-span-3 shadow-xs">
          <h2 className="text-sm font-semibold text-foreground">{t.recent}</h2>
          <ul className="mt-2 divide-y divide-border">
            {ncrs.slice(0, 5).map(ncr => (
              <li key={ncr.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/ncr/${ncr.id}`}
                      className="num font-medium text-primary hover:underline"
                      data-testid={`link-ncr-${ncr.id}`}
                    >
                      {ncr.ref}
                    </Link>
                    <SeverityBadge value={ncr.severity} />
                  </div>
                  <div className="bi text-sm font-medium text-foreground mt-0.5">
                    {pick(ncr.title)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {DEPARTMENT_NAMES[lang]?.[ncr.department] || ncr.department} · {formatDate(ncr.reportedAt)}
                  </div>
                </div>
                <StatusBadge value={ncr.status} due={ncr.dueDate} />
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-md border border-card-border bg-card p-4 lg:col-span-2 shadow-xs">
          <h2 className="text-sm font-semibold text-foreground">{t.hot}</h2>
          <ul className="mt-3 space-y-3">
            {hotClauses.map(item => (
              <li key={item.clause.id} className="flex items-start justify-between gap-3 text-sm">
                <div>
                  <div className="num font-medium text-foreground">{item.clause.code}</div>
                  <div className="text-xs text-muted-foreground">
                    {lang === "ar" ? item.clause.titleAr : item.clause.titleEn}
                  </div>
                </div>
                <span className="num font-semibold text-foreground">{item.count}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
