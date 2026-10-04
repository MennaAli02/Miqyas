import { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'wouter';
import { useLanguage } from '../lib/i18n';
import { api } from '../lib/api';
import { PageHeader, inputClass } from '../components/FormField';

export default function Clauses() {
  const { t, lang } = useLanguage();
  const [, setLocation] = useLocation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

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

  const filteredClauses = useMemo(() => {
    const list = data?.clauses || [];
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter(c =>
      `${c.standard} ${c.code} ${c.titleAr} ${c.titleEn} ${c.textAr} ${c.textEn}`
        .toLowerCase()
        .includes(q)
    );
  }, [data, search]);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title={t.navClauses} lede={t.clausesLead} />

      <input
        className={`${inputClass} mb-4`}
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder={t.search}
        data-testid="input-clause-search"
      />

      {loading ? (
        <div className="h-32 animate-pulse rounded-md bg-muted" />
      ) : (
        <ul className="space-y-3">
          {filteredClauses.map(c => {
            const hits = Number(
              data?.stats?.clauseHits?.[c.id] ??
              data?.stats?.clauseHits?.[String(c.id)] ??
              0
            );

            return (
              <li
                key={c.id}
                className="rounded-md border border-card-border bg-card p-4 shadow-xs hover:shadow-sm transition-shadow"
                data-testid={`card-clause-${c.id}`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 sm:gap-3">
                  <div>
                    <div className="text-xs text-muted-foreground font-normal">{c.standard}</div>
                    <div className="num mt-0.5 font-bold text-primary">{c.code}</div>
                    <div className="text-sm font-semibold text-foreground mt-0.5">
                      {lang === "ar" ? c.titleAr : c.titleEn}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                      {lang === "ar" ? c.textAr : c.textEn}
                    </p>
                  </div>
                  <div className="num self-start sm:self-auto shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                    {hits} {t.count}
                  </div>
                </div>

                <button
                  type="button"
                  className="mt-3.5 text-sm font-medium text-primary hover:underline inline-flex items-center gap-1"
                  data-testid={`button-raise-${c.id}`}
                  onClick={() => setLocation(`/new?clause=${c.id}`)}
                >
                  {t.raise}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
