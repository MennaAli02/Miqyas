import { useState, useEffect, useMemo } from 'react';
import { Link } from 'wouter';
import { useLanguage } from '../lib/i18n';
import { api } from '../lib/api';
import { STATUSES, SEVERITIES, DEPARTMENTS } from '../lib/constants';
import {
  STATUS_NAMES,
  SEVERITY_NAMES,
  DEPARTMENT_NAMES,
  SOURCE_NAMES
} from '../lib/i18n';
import { SeverityBadge, StatusBadge } from '../components/StatusBadge';
import { PageHeader, inputClass } from '../components/FormField';
import { Download } from '../components/Icons';

export default function Register() {
  const { t, lang, pick, formatDate } = useLanguage();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [deptFilter, setDeptFilter] = useState("all");

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

  const filtered = useMemo(() => {
    if (!data?.ncrs) return [];
    const q = search.trim().toLowerCase();
    return data.ncrs.filter(ncr => {
      if (statusFilter !== "all" && ncr.status !== statusFilter) return false;
      if (severityFilter !== "all" && ncr.severity !== severityFilter) return false;
      if (deptFilter !== "all" && ncr.department !== deptFilter) return false;
      if (q) {
        const text = `${ncr.ref} ${pick(ncr.title)} ${pick(ncr.description)} ${ncr.reporterName}`.toLowerCase();
        if (!text.includes(q)) return false;
      }
      return true;
    });
  }, [data, search, statusFilter, severityFilter, deptFilter, pick]);

  const exportCsv = () => {
    const headers = ["ref", "title", "reporter", "date", "department", "severity", "status", "due"];
    const rows = filtered.map(item =>
      [
        item.ref,
        pick(item.title),
        item.reporterName,
        item.reportedAt,
        item.department,
        item.severity,
        item.status,
        item.dueDate
      ]
        .map(val => `"${String(val || "").replaceAll('"', '""')}"`)
        .join(",")
    );

    const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ncr-register-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title={t.navRegister}
        lede={
          data
            ? lang === "ar"
              ? `${filtered.length} تقارير`
              : `${filtered.length} reports`
            : ""
        }
        action={
          <button
            className="rounded-md border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted transition-colors inline-flex items-center gap-2"
            onClick={exportCsv}
            data-testid="button-export"
          >
            <Download className="h-4 w-4" />
            <span>{t.export}</span>
          </button>
        }
      />

      {/* Filter toolbar */}
      <div className="no-print mb-4 grid gap-2 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <input
          className={inputClass}
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={t.search}
          data-testid="input-search"
        />

        <select
          className={inputClass}
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          data-testid="select-status"
          aria-label={t.filterStatus}
        >
          <option value="all">{t.filterStatus}: {t.all}</option>
          {STATUSES.map(s => (
            <option key={s} value={s}>
              {STATUS_NAMES[lang]?.[s] || s}
            </option>
          ))}
        </select>

        <select
          className={inputClass}
          value={severityFilter}
          onChange={e => setSeverityFilter(e.target.value)}
          data-testid="select-severity"
          aria-label={t.filterSeverity}
        >
          <option value="all">{t.filterSeverity}: {t.all}</option>
          {SEVERITIES.map(sev => (
            <option key={sev} value={sev}>
              {SEVERITY_NAMES[lang]?.[sev] || sev}
            </option>
          ))}
        </select>

        <select
          className={inputClass}
          value={deptFilter}
          onChange={e => setDeptFilter(e.target.value)}
          data-testid="select-department"
          aria-label={t.filterDept}
        >
          <option value="all">{t.filterDept}: {t.all}</option>
          {DEPARTMENTS.map(d => (
            <option key={d} value={d}>
              {DEPARTMENT_NAMES[lang]?.[d] || d}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="h-40 animate-pulse rounded-md bg-muted" />
      ) : filtered.length === 0 ? (
        <div className="rounded-md border border-card-border bg-card p-8 text-center text-sm text-muted-foreground" data-testid="text-empty">
          {t.empty}. {t.emptyHint}
        </div>
      ) : (
        <>
          {/* Mobile Cards View (< sm) */}
          <div className="block sm:hidden space-y-3">
            {filtered.map(ncr => (
              <div
                key={ncr.id}
                className="rounded-md border border-card-border bg-card p-3.5 shadow-xs space-y-2"
                data-testid={`row-ncr-mobile-${ncr.id}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <Link
                    href={`/ncr/${ncr.id}`}
                    className="num font-semibold text-primary hover:underline text-sm"
                  >
                    {ncr.ref}
                  </Link>
                  <div className="flex items-center gap-1.5">
                    <SeverityBadge value={ncr.severity} />
                    <StatusBadge value={ncr.status} due={ncr.dueDate} />
                  </div>
                </div>

                <div className="font-medium text-sm text-foreground leading-snug">
                  {pick(ncr.title)}
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border">
                  <span>
                    {DEPARTMENT_NAMES[lang]?.[ncr.department] || ncr.department} · {SOURCE_NAMES[lang]?.[ncr.source] || ncr.source}
                  </span>
                  <span className="num font-medium">
                    {t.due}: {formatDate(ncr.dueDate)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View (>= sm) */}
          <div className="hidden sm:block overflow-x-auto rounded-md border border-card-border bg-card shadow-xs">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="sticky top-0 bg-muted text-start text-xs text-muted-foreground">
                <tr>
                  {[t.ref, t.title, t.department, t.source, t.severity, t.status, t.due].map(col => (
                    <th key={col} className="px-3 py-2.5 font-medium text-start">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map(ncr => (
                  <tr
                    key={ncr.id}
                    className="hover:bg-muted/40 transition-colors"
                    data-testid={`row-ncr-${ncr.id}`}
                  >
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <Link
                        href={`/ncr/${ncr.id}`}
                        className="num font-medium text-primary hover:underline"
                        data-testid={`link-ncr-${ncr.id}`}
                      >
                        {ncr.ref}
                      </Link>
                    </td>
                    <td className="bi max-w-sm px-3 py-2.5 font-medium text-foreground">
                      {pick(ncr.title)}
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap text-muted-foreground">
                      {DEPARTMENT_NAMES[lang]?.[ncr.department] || ncr.department}
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap text-muted-foreground">
                      {SOURCE_NAMES[lang]?.[ncr.source] || ncr.source}
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <SeverityBadge value={ncr.severity} />
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <StatusBadge value={ncr.status} due={ncr.dueDate} />
                    </td>
                    <td className="num px-3 py-2.5 whitespace-nowrap text-muted-foreground">
                      {formatDate(ncr.dueDate)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
