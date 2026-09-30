import { useState, useEffect } from 'react';
import { useLocation, useSearch } from 'wouter';
import { useLanguage, todayIso } from '../lib/i18n';
import { api } from '../lib/api';
import {
  SEVERITIES,
  DEPARTMENTS,
  SOURCES,
  DISPOSITIONS,
  CLAUSES
} from '../lib/constants';
import {
  SEVERITY_NAMES,
  DEPARTMENT_NAMES,
  SOURCE_NAMES,
  DISPOSITION_NAMES
} from '../lib/i18n';
import { FormField, PageHeader, inputClass } from '../components/FormField';

export default function NewReport() {
  const { t, lang, actor } = useLanguage();
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const queryParams = new URLSearchParams(searchString);
  const initialClauseId = queryParams.get("clause") || "";

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [clauses, setClauses] = useState(CLAUSES);

  const [form, setForm] = useState({
    reporterName: actor || "",
    reportedAt: todayIso(),
    department: "quality",
    location: "",
    source: "process",
    severity: "minor",
    title: "",
    description: "",
    clauseId: initialClauseId,
    requirement: "",
    containment: "",
    disposition: "quarantine",
    rcaMethod: "five_why",
    why1: "",
    rootCause: "",
    capaType: "corrective",
    capaAction: "",
    capaOwner: "",
    capaDue: ""
  });

  useEffect(() => {
    if (initialClauseId) {
      setForm(prev => ({ ...prev, clauseId: initialClauseId }));
    }
  }, [initialClauseId]);

  useEffect(() => {
    if (actor && !form.reporterName) {
      setForm(prev => ({ ...prev, reporterName: actor }));
    }
  }, [actor]);

  const updateField = (name, value) => {
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError("");

    if (!form.reporterName.trim() || !form.title.trim() || !form.description.trim()) {
      setError(t.required);
      return;
    }

    setSaving(true);
    try {
      const created = await api.createNcr({
        ...form,
        clauseId: form.clauseId ? Number(form.clauseId) : null,
        whys: form.why1.trim() ? [form.why1.trim()] : [],
        lang
      });
      setLocation(`/ncr/${created.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error creating report");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-3xl">
      <PageHeader title={t.navNew} lede={t.formLead} />

      <p className="mb-5 rounded-md border border-border bg-card px-3 py-2 text-sm text-muted-foreground shadow-xs">
        {t.noLogin}
      </p>

      {/* Step 1: General Info */}
      <section className="space-y-3 rounded-md border border-card-border bg-card p-4 shadow-xs">
        <h2 className="text-sm font-semibold text-foreground">{t.stepGeneral}</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField label={t.reporter} hint={t.required}>
            <input
              className={inputClass}
              value={form.reporterName}
              onChange={e => updateField("reporterName", e.target.value)}
              data-testid="input-reporter"
              required
            />
          </FormField>

          <FormField label={t.date}>
            <input
              type="date"
              className={inputClass}
              value={form.reportedAt}
              onChange={e => updateField("reportedAt", e.target.value)}
              data-testid="input-date"
            />
          </FormField>

          <FormField label={t.department}>
            <select
              className={inputClass}
              value={form.department}
              onChange={e => updateField("department", e.target.value)}
              data-testid="select-form-department"
            >
              {DEPARTMENTS.map(d => (
                <option key={d} value={d}>
                  {DEPARTMENT_NAMES[lang]?.[d] || d}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label={t.location}>
            <input
              className={inputClass}
              value={form.location}
              onChange={e => updateField("location", e.target.value)}
              data-testid="input-location"
            />
          </FormField>

          <FormField label={t.source}>
            <select
              className={inputClass}
              value={form.source}
              onChange={e => updateField("source", e.target.value)}
              data-testid="select-source"
            >
              {SOURCES.map(s => (
                <option key={s} value={s}>
                  {SOURCE_NAMES[lang]?.[s] || s}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label={t.severity}>
            <select
              className={inputClass}
              value={form.severity}
              onChange={e => updateField("severity", e.target.value)}
              data-testid="select-form-severity"
            >
              {SEVERITIES.map(s => (
                <option key={s} value={s}>
                  {SEVERITY_NAMES[lang]?.[s] || s}
                </option>
              ))}
            </select>
          </FormField>
        </div>
      </section>

      {/* Step 2: Case & Clause */}
      <section className="mt-4 space-y-3 rounded-md border border-card-border bg-card p-4 shadow-xs">
        <h2 className="text-sm font-semibold text-foreground">{t.stepCase}</h2>

        <FormField label={t.title} hint={t.required}>
          <input
            className={inputClass}
            value={form.title}
            onChange={e => updateField("title", e.target.value)}
            data-testid="input-title"
            required
          />
        </FormField>

        <FormField label={t.description} hint={t.required}>
          <textarea
            className={`${inputClass} min-h-28`}
            value={form.description}
            onChange={e => updateField("description", e.target.value)}
            data-testid="input-description"
            required
          />
        </FormField>

        <FormField label={t.clause}>
          <select
            className={inputClass}
            value={form.clauseId}
            onChange={e => updateField("clauseId", e.target.value)}
            data-testid="select-clause"
          >
            <option value="">—</option>
            {clauses.map(c => (
              <option key={c.id} value={c.id}>
                {c.standard} · {c.code} — {lang === "ar" ? c.titleAr : c.titleEn}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label={t.requirement}>
          <textarea
            className={`${inputClass} min-h-20`}
            value={form.requirement}
            onChange={e => updateField("requirement", e.target.value)}
            data-testid="input-requirement"
          />
        </FormField>

        <div className="grid gap-3 sm:grid-cols-2">
          <FormField label={t.containment}>
            <textarea
              className={`${inputClass} min-h-20`}
              value={form.containment}
              onChange={e => updateField("containment", e.target.value)}
              data-testid="input-containment"
            />
          </FormField>

          <FormField label={t.disposition}>
            <select
              className={inputClass}
              value={form.disposition}
              onChange={e => updateField("disposition", e.target.value)}
              data-testid="select-disposition"
            >
              {DISPOSITIONS.map(disp => (
                <option key={disp} value={disp}>
                  {DISPOSITION_NAMES[lang]?.[disp] || disp}
                </option>
              ))}
            </select>
          </FormField>
        </div>

        <p className="text-xs text-muted-foreground">{t.attachHint}</p>
      </section>

      {/* Step 3: Optional RCA & CAPA */}
      <section className="mt-4 space-y-3 rounded-md border border-dashed border-border bg-card/60 p-4 shadow-xs">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-semibold text-foreground">{t.stepLater}</h2>
          <span className="text-xs text-muted-foreground">{t.optional}</span>
        </div>

        <FormField label={t.fiveWhy}>
          <input
            className={inputClass}
            value={form.why1}
            onChange={e => updateField("why1", e.target.value)}
            placeholder={lang === "ar" ? "لماذا حدث؟" : "Why did it happen?"}
            data-testid="input-why"
          />
        </FormField>

        <FormField label={t.root}>
          <textarea
            className={`${inputClass} min-h-16`}
            value={form.rootCause}
            onChange={e => updateField("rootCause", e.target.value)}
            data-testid="input-root"
          />
        </FormField>

        <div className="grid gap-3 sm:grid-cols-2">
          <FormField label={t.actionType}>
            <select
              className={inputClass}
              value={form.capaType}
              onChange={e => updateField("capaType", e.target.value)}
              data-testid="select-capa-type"
            >
              <option value="corrective">{t.corrective}</option>
              <option value="preventive">{t.preventive}</option>
            </select>
          </FormField>

          <FormField label={t.due}>
            <input
              type="date"
              className={inputClass}
              value={form.capaDue}
              onChange={e => updateField("capaDue", e.target.value)}
              data-testid="input-capa-due"
            />
          </FormField>
        </div>

        <FormField label={t.action}>
          <textarea
            className={`${inputClass} min-h-16`}
            value={form.capaAction}
            onChange={e => updateField("capaAction", e.target.value)}
            data-testid="input-capa-action"
          />
        </FormField>

        <FormField label={t.owner}>
          <input
            className={inputClass}
            value={form.capaOwner}
            onChange={e => updateField("capaOwner", e.target.value)}
            data-testid="input-capa-owner"
          />
        </FormField>
      </section>

      {error && (
        <p className="mt-3 text-sm text-destructive" data-testid="text-form-error">
          {error}
        </p>
      )}

      <div className="mt-5 flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60 transition-opacity"
          data-testid="button-submit"
        >
          {saving ? t.saving : t.save}
        </button>
        <span className="text-xs text-muted-foreground">{t.routing}</span>
      </div>
    </form>
  );
}
