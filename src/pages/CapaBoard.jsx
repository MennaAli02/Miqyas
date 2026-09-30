import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { useLanguage } from '../lib/i18n';
import { api } from '../lib/api';
import { CAPA_STATUSES } from '../lib/constants';
import { CAPA_STATUS_NAMES } from '../lib/i18n';
import { PageHeader, inputClass } from '../components/FormField';

export default function CapaBoard() {
  const { t, lang, pick, formatDate } = useLanguage();
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

  const handleStatusChange = async (capaId, newStatus) => {
    try {
      await api.updateCapaStatus(capaId, newStatus);
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading || !data) {
    return <div className="h-40 animate-pulse rounded-md bg-muted" />;
  }

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title={t.capaBoard} lede={t.capaLead} />

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4 items-start">
        {CAPA_STATUSES.map(colStatus => {
          const colCapas = data.capas.filter(c => c.status === colStatus);

          return (
            <section
              key={colStatus}
              className="rounded-md border border-card-border bg-card p-3 shadow-xs"
            >
              <div className="flex items-center justify-between border-b border-border pb-2 mb-2.5">
                <h2 className="text-sm font-semibold text-foreground">
                  {CAPA_STATUS_NAMES[lang]?.[colStatus] || colStatus}
                </h2>
                <span className="num text-xs font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                  {colCapas.length}
                </span>
              </div>

              <ul className="space-y-2.5">
                {colCapas.length === 0 ? (
                  <li className="py-6 text-center text-xs text-muted-foreground">
                    {t.empty}
                  </li>
                ) : (
                  colCapas.map(capa => {
                    const linkedNcr = data.ncrs.find(n => n.id === capa.ncrId);

                    return (
                      <li
                        key={capa.id}
                        className="rounded-md border border-border bg-background p-3 text-sm shadow-xs transition-shadow hover:shadow-sm"
                        data-testid={`card-board-${capa.id}`}
                      >
                        <div className="text-xs font-medium text-muted-foreground">
                          {capa.type === "preventive" ? t.preventive : t.corrective}
                        </div>
                        <p className="mt-1 font-medium text-foreground leading-snug">
                          {pick(capa.action)}
                        </p>

                        {linkedNcr && (
                          <div className="mt-2">
                            <Link
                              href={`/ncr/${linkedNcr.id}`}
                              className="num text-xs font-medium text-primary hover:underline inline-block"
                            >
                              {linkedNcr.ref}
                            </Link>
                          </div>
                        )}

                        <div className="mt-1.5 text-xs text-muted-foreground">
                          {capa.ownerName || "—"} · {formatDate(capa.dueDate)}
                        </div>

                        <select
                          className={`${inputClass} mt-2.5 py-1 text-xs`}
                          value={capa.status}
                          onChange={e => handleStatusChange(capa.id, e.target.value)}
                          data-testid={`select-capa-status-${capa.id}`}
                          aria-label={t.mark}
                        >
                          {CAPA_STATUSES.map(s => (
                            <option key={s} value={s}>
                              {CAPA_STATUS_NAMES[lang]?.[s] || s}
                            </option>
                          ))}
                        </select>
                      </li>
                    );
                  })
                )}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
