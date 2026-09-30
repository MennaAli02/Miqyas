import { useState, useEffect } from 'react';
import { useLanguage } from '../lib/i18n';
import { api } from '../lib/api';
import { DEPARTMENT_NAMES, SEVERITY_NAMES, SOURCE_NAMES } from '../lib/i18n';
import { PageHeader } from '../components/FormField';
import { TrendBarChart } from '../components/Charts';

export default function Trends() {
  const { t, lang } = useLanguage();
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
    return <div className="h-40 animate-pulse rounded-md bg-muted" />;
  }

  const { stats, clauses } = data;

  const deptRows = Object.entries(stats.byDept || {}).map(([key, val]) => ({
    name: DEPARTMENT_NAMES[lang]?.[key] || key,
    n: val
  }));

  const severityRows = Object.entries(stats.bySeverity || {}).map(([key, val]) => ({
    name: SEVERITY_NAMES[lang]?.[key] || key,
    n: val
  }));

  const sourceRows = Object.entries(stats.bySource || {}).map(([key, val]) => ({
    name: SOURCE_NAMES[lang]?.[key] || key,
    n: val
  }));

  const monthRows = Object.entries(stats.byMonth || {})
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, val]) => ({
      name: key,
      n: val
    }));

  const hotspotClauses = Object.entries(stats.clauseHits || {})
    .map(([id, val]) => ({
      clause: clauses.find(c => String(c.id) === String(id)),
      count: Number(val)
    }))
    .filter(x => x.clause)
    .sort((a, b) => b.count - a.count);

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title={t.navTrends} lede={t.trendsLead} />

      {/* Effectiveness KPI Card */}
      <div className="mb-4 rounded-md border border-card-border bg-card p-4 shadow-xs">
        <div className="text-sm font-medium text-muted-foreground">{t.effect}</div>
        <div className="num mt-1 text-2xl font-bold text-foreground" data-testid="text-effectiveness">
          {stats.effectiveness}%
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid gap-4 lg:grid-cols-2">
        <TrendBarChart title={t.byDept} rows={deptRows} />
        <TrendBarChart title={t.bySeverity} rows={severityRows} />
        <TrendBarChart title={t.bySource} rows={sourceRows} />
        <TrendBarChart title={t.byMonth} rows={monthRows} />
      </div>

      {/* Repeating Clauses Table */}
      <section className="mt-4 rounded-md border border-card-border bg-card p-4 shadow-xs">
        <h2 className="text-sm font-semibold text-foreground">{t.hotspot}</h2>
        <div className="overflow-x-auto">
          <table className="mt-2 w-full text-sm">
            <thead className="text-xs text-muted-foreground border-b border-border pb-1">
              <tr>
                <th className="py-2 text-start font-medium">{t.clause}</th>
                <th className="py-2 text-end font-medium">{t.count}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {hotspotClauses.length === 0 ? (
                <tr>
                  <td colSpan={2} className="py-4 text-center text-xs text-muted-foreground">
                    {t.empty}
                  </td>
                </tr>
              ) : (
                hotspotClauses.map(item => (
                  <tr key={item.clause.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-2.5 font-medium text-foreground">
                      <span className="num font-semibold text-primary">{item.clause.code}</span>
                      {" — "}
                      <span>{lang === "ar" ? item.clause.titleAr : item.clause.titleEn}</span>
                    </td>
                    <td className="num py-2.5 text-end font-semibold text-foreground">
                      {item.count}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
