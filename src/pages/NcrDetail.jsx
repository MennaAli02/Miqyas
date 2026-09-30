import { useState, useEffect } from 'react';
import { useRoute, useLocation, Link } from 'wouter';
import { useLanguage } from '../lib/i18n';
import { api } from '../lib/api';
import {
  WORKFLOW_STAGES,
  ALLOWED_TRANSITIONS
} from '../lib/constants';
import {
  STATUS_NAMES,
  SEVERITY_NAMES,
  DEPARTMENT_NAMES,
  SOURCE_NAMES,
  DISPOSITION_NAMES,
  CAPA_STATUS_NAMES
} from '../lib/i18n';
import { SeverityBadge, StatusBadge } from '../components/StatusBadge';
import { FormField, inputClass } from '../components/FormField';
import { ArrowLeft, ArrowRight, Printer, Trash2, Upload } from '../components/Icons';

export default function NcrDetail() {
  const [, params] = useRoute("/ncr/:id");
  const [, setLocation] = useLocation();
  const id = params?.id;

  const { t, lang, pick, formatDate, actor, setActor } = useLanguage();
  const [detailData, setDetailData] = useState(null);
  const [loading, setLoading] = useState(true);

  const [handoverNote, setHandoverNote] = useState("");
  const [advanceError, setAdvanceError] = useState("");

  const [newCapa, setNewCapa] = useState({
    type: "corrective",
    action: "",
    ownerName: "",
    dueDate: ""
  });

  const [rcaForm, setRcaForm] = useState({
    ready: false,
    method: "five_why",
    whys: "",
    root: "",
    contributors: "",
    verification: ""
  });

  const loadDetail = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await api.getNcrDetail(id);
      setDetailData(res);
      setRcaForm({
        ready: true,
        method: res.ncr.rcaMethod || "five_why",
        whys: (res.ncr.whys || []).join("\n"),
        root: pick(res.ncr.rootCause),
        contributors: pick(res.ncr.contributors),
        verification: pick(res.ncr.verificationNote)
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetail();
  }, [id, lang]);

  if (loading || !detailData) {
    return <div className="h-40 animate-pulse rounded-md bg-muted" data-testid="status-loading" />;
  }

  const { ncr, clause, evidence, capas, events, suggestion } = detailData;

  const handleSaveRca = async () => {
    setAdvanceError("");
    try {
      await api.updateNcrRca(ncr.id, {
        lang,
        actor: actor || ncr.reporterName,
        rcaMethod: rcaForm.method,
        whys: rcaForm.whys
          .split("\n")
          .map(w => w.trim())
          .filter(Boolean),
        rootCause: rcaForm.root,
        contributors: rcaForm.contributors,
        verificationNote: rcaForm.verification
      });
      await loadDetail();
    } catch (err) {
      setAdvanceError(err instanceof Error ? err.message : "Error saving analysis");
    }
  };

  const handleAdvance = async targetStatus => {
    setAdvanceError("");
    if (!actor.trim()) {
      setAdvanceError(t.actorMissing);
      return;
    }

    try {
      // Auto save any pending RCA / verification inputs first
      if (rcaForm.root || rcaForm.verification) {
        await handleSaveRca();
      }

      await api.advanceNcr(ncr.id, {
        to: targetStatus,
        actor,
        note: handoverNote,
        lang
      });
      setHandoverNote("");
      await loadDetail();
    } catch (err) {
      setAdvanceError(err instanceof Error ? err.message : t.blocked);
    }
  };

  const handleAddCapa = async e => {
    e.preventDefault();
    if (!newCapa.action.trim()) return;

    try {
      await api.addCapaAction(ncr.id, {
        ...newCapa,
        lang,
        actor: actor || ncr.reporterName
      });
      setNewCapa({ type: "corrective", action: "", ownerName: "", dueDate: "" });
      await loadDetail();
    } catch (err) {
      setAdvanceError(err instanceof Error ? err.message : "Error adding action");
    }
  };

  const handleFileUpload = async file => {
    if (!file) return;
    if (file.size > 12 * 1024 * 1024) {
      setAdvanceError(t.fileTooBig);
      return;
    }

    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error("File read error"));
      reader.readAsDataURL(file);
    });

    try {
      await api.addEvidence(ncr.id, {
        dataUrl,
        name: file.name,
        actor: actor || ncr.reporterName
      });
      await loadDetail();
    } catch (err) {
      setAdvanceError(err instanceof Error ? err.message : "Error uploading evidence");
    }
  };

  const handleDelete = async () => {
    if (window.confirm(t.confirmRemove)) {
      await api.deleteNcr(ncr.id);
      setLocation("/register");
    }
  };

  const currentStageIndex = WORKFLOW_STAGES.indexOf(ncr.status);
  const allowedNextSteps = ALLOWED_TRANSITIONS[ncr.status] || [];

  return (
    <article className="mx-auto max-w-3xl pb-12">
      {/* Back button */}
      <Link
        href="/register"
        className="no-print inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline mb-3"
        data-testid="link-back"
      >
        {lang === "ar" ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
        <span>{t.back}</span>
      </Link>

      {/* Header */}
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-4">
        <div>
          <div className="num text-sm font-medium text-muted-foreground" data-testid="text-ref">
            {ncr.ref}
          </div>
          <h1 className="bi mt-1 text-2xl font-bold tracking-tight text-foreground text-balance">
            {pick(ncr.title)}
          </h1>
          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            <SeverityBadge value={ncr.severity} />
            <StatusBadge value={ncr.status} due={ncr.dueDate} />
          </div>
        </div>

        <div className="no-print flex items-center gap-2">
          <button
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
            onClick={() => window.print()}
            data-testid="button-print"
          >
            <Printer className="h-4 w-4" />
            <span>{t.print}</span>
          </button>
          <button
            className="inline-flex items-center gap-1.5 rounded-md border border-destructive/40 bg-card px-3 py-1.5 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
            onClick={handleDelete}
            data-testid="button-delete"
          >
            <Trash2 className="h-4 w-4" />
            <span>{t.remove}</span>
          </button>
        </div>
      </header>

      {/* Funnel pipeline ribbon */}
      <ol
        className="no-print mt-4 grid grid-cols-3 gap-1 sm:grid-cols-6"
        aria-label={t.funnel}
      >
        {WORKFLOW_STAGES.map((stage, idx) => {
          const isReached = idx <= currentStageIndex && ncr.status !== "rejected";
          return (
            <li
              key={stage}
              className={`rounded-sm px-1 sm:px-2 py-1 sm:py-1.5 text-center text-[11px] sm:text-xs font-medium transition-colors ${
                isReached
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {STATUS_NAMES[lang]?.[stage] || stage}
            </li>
          );
        })}
      </ol>

      {/* Details Grid */}
      <section className="mt-5 grid gap-3 rounded-md border border-card-border bg-card p-3.5 sm:p-4 text-sm grid-cols-2 sm:grid-cols-3 shadow-xs">
        <DetailItem label={t.reporter} value={ncr.reporterName} />
        <DetailItem label={t.date} value={formatDate(ncr.reportedAt)} />
        <DetailItem
          label={t.department}
          value={DEPARTMENT_NAMES[lang]?.[ncr.department] || ncr.department}
        />
        <DetailItem label={t.location} value={ncr.location || "—"} />
        <DetailItem
          label={t.source}
          value={SOURCE_NAMES[lang]?.[ncr.source] || ncr.source}
        />
        <DetailItem
          label={t.severity}
          value={SEVERITY_NAMES[lang]?.[ncr.severity] || ncr.severity}
        />
        <DetailItem label={t.owner} value={pick(ncr.ownerName)} />
        <DetailItem label={t.due} value={formatDate(ncr.dueDate)} />
        <DetailItem
          label={t.disposition}
          value={DISPOSITION_NAMES[lang]?.[ncr.disposition] || ncr.disposition}
        />
      </section>

      {/* Routing Advice Card */}
      <section className="mt-4 rounded-md border border-primary/30 bg-card p-4 shadow-xs">
        <h2 className="text-sm font-semibold text-primary">{t.routing}</h2>
        <p className="mt-1 text-sm text-foreground leading-relaxed" data-testid="text-routing">
          {pick(ncr.routingNote)}
        </p>
      </section>

      {/* Description */}
      <SectionCard title={t.description}>
        <p className="bi whitespace-pre-wrap text-sm leading-relaxed text-foreground">
          {pick(ncr.description)}
        </p>
      </SectionCard>

      {/* Violated Clause & Requirements */}
      <SectionCard title={t.clause}>
        {clause ? (
          <div>
            <div className="num text-sm font-medium text-primary">
              {clause.standard} · {clause.code}
            </div>
            <div className="text-sm font-medium text-foreground mt-0.5">
              {lang === "ar" ? clause.titleAr : clause.titleEn}
            </div>
            <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
              {lang === "ar" ? clause.textAr : clause.textEn}
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">—</p>
        )}

        {pick(ncr.requirement) && (
          <p className="mt-3 text-sm border-t border-border pt-2 text-foreground">
            <span className="text-muted-foreground font-medium">{t.requirement}: </span>
            {pick(ncr.requirement)}
          </p>
        )}
      </SectionCard>

      {/* Immediate Containment */}
      <SectionCard title={t.containment}>
        <p className="text-sm text-foreground">{pick(ncr.containment) || "—"}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {t.disposition}: {DISPOSITION_NAMES[lang]?.[ncr.disposition] || ncr.disposition}
        </p>
      </SectionCard>

      {/* Evidence Attachments */}
      <SectionCard title={t.evidence}>
        {evidence.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {evidence.map(file => (
              <figure
                key={file.id}
                className="overflow-hidden rounded-md border border-border bg-background shadow-xs"
              >
                {file.kind === "image" ? (
                  <img
                    src={file.dataUrl}
                    alt={file.caption || file.name}
                    className="h-44 w-full object-cover"
                  />
                ) : file.kind === "video" ? (
                  <video src={file.dataUrl} controls className="h-44 w-full bg-black" />
                ) : (
                  <div className="p-4 text-center">
                    <a
                      className="text-sm font-medium text-primary hover:underline break-all"
                      href={file.dataUrl}
                      download={file.name}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {file.name}
                    </a>
                  </div>
                )}
                <figcaption className="px-2.5 py-1.5 text-xs text-muted-foreground border-t border-border">
                  {file.caption || file.name}
                </figcaption>
              </figure>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground mb-3">—</p>
        )}

        <label className="no-print mt-3 inline-flex cursor-pointer items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5 text-sm font-medium hover:bg-muted transition-colors">
          <Upload className="h-4 w-4 text-muted-foreground" />
          <span>{t.attach}</span>
          <input
            type="file"
            accept="image/*,video/*,application/pdf"
            className="sr-only"
            data-testid="input-evidence"
            onChange={e => {
              const file = e.target.files?.[0];
              if (file) handleFileUpload(file);
              e.target.value = "";
            }}
          />
        </label>
      </SectionCard>

      {/* Root Cause Analysis (RCA) */}
      <SectionCard title={t.rca}>
        <div className="space-y-3">
          <FormField label={t.method}>
            <select
              className={inputClass}
              value={rcaForm.method}
              onChange={e => setRcaForm(prev => ({ ...prev, method: e.target.value }))}
              data-testid="select-rca-method"
            >
              <option value="five_why">{t.fiveWhy}</option>
              <option value="fishbone">{t.fishbone}</option>
            </select>
          </FormField>

          <FormField label={t.whys}>
            <textarea
              className={`${inputClass} min-h-24`}
              value={rcaForm.whys}
              onChange={e => setRcaForm(prev => ({ ...prev, whys: e.target.value }))}
              placeholder={lang === "ar" ? "أدخل كل 'لماذا' في سطر منفصل" : "Enter each why on a new line"}
              data-testid="input-whys"
            />
          </FormField>

          <FormField label={t.root}>
            <textarea
              className={`${inputClass} min-h-16`}
              value={rcaForm.root}
              onChange={e => setRcaForm(prev => ({ ...prev, root: e.target.value }))}
              placeholder={lang === "ar" ? "السبب الجذري النهائي" : "The root cause"}
              data-testid="input-root-cause"
            />
          </FormField>

          <FormField label={t.contributors}>
            <textarea
              className={`${inputClass} min-h-16`}
              value={rcaForm.contributors}
              onChange={e => setRcaForm(prev => ({ ...prev, contributors: e.target.value }))}
              placeholder={lang === "ar" ? "العوامل المساعدة والظروف المحيطة" : "Contributing factors"}
              data-testid="input-contributors"
            />
          </FormField>

          <button
            type="button"
            className="no-print rounded-md border border-border bg-card px-3 py-1.5 text-sm font-medium hover:bg-muted transition-colors"
            onClick={handleSaveRca}
            data-testid="button-save-rca"
          >
            {lang === "ar" ? "حفظ التحليل" : "Save analysis"}
          </button>
        </div>
      </SectionCard>

      {/* CAPA Actions Section */}
      <SectionCard title={t.capa}>
        {/* Suggested Action Box */}
        {suggestion && (
          <div className="mb-4 rounded-md border border-border/80 bg-muted/50 p-3 text-sm">
            <div className="text-xs font-medium text-muted-foreground">{t.suggestion}</div>
            <p className="mt-1 text-foreground leading-relaxed">{pick(suggestion)}</p>
            <button
              type="button"
              className="no-print mt-2 text-xs font-semibold text-primary hover:underline"
              data-testid="button-use-suggestion"
              onClick={() => setNewCapa(prev => ({ ...prev, action: pick(suggestion) }))}
            >
              {t.useSuggestion}
            </button>
          </div>
        )}

        {/* Existing Actions List */}
        <ul className="space-y-2.5 mb-4">
          {capas.length === 0 ? (
            <p className="text-xs text-muted-foreground">—</p>
          ) : (
            capas.map(c => (
              <li
                key={c.id}
                className="rounded-md border border-border bg-background p-3 text-sm shadow-xs"
                data-testid={`card-capa-${c.id}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    {c.type === "preventive" ? t.preventive : t.corrective}
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-sm bg-muted text-foreground">
                    {CAPA_STATUS_NAMES[lang]?.[c.status] || c.status}
                  </span>
                </div>
                <p className="mt-1.5 text-foreground font-medium">{pick(c.action)}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {c.ownerName || "—"} · {formatDate(c.dueDate)}
                </p>
              </li>
            ))
          )}
        </ul>

        {/* Inline Add Action Form */}
        <form onSubmit={handleAddCapa} className="no-print mt-3 grid gap-2.5 sm:grid-cols-2 border-t border-border pt-3">
          <select
            className={inputClass}
            value={newCapa.type}
            onChange={e => setNewCapa(prev => ({ ...prev, type: e.target.value }))}
            data-testid="select-new-capa-type"
          >
            <option value="corrective">{t.corrective}</option>
            <option value="preventive">{t.preventive}</option>
          </select>

          <input
            className={inputClass}
            placeholder={t.owner}
            value={newCapa.ownerName}
            onChange={e => setNewCapa(prev => ({ ...prev, ownerName: e.target.value }))}
            data-testid="input-new-capa-owner"
          />

          <textarea
            className={`${inputClass} sm:col-span-2 min-h-16`}
            placeholder={t.action}
            value={newCapa.action}
            onChange={e => setNewCapa(prev => ({ ...prev, action: e.target.value }))}
            data-testid="input-new-capa"
            required
          />

          <input
            type="date"
            className={inputClass}
            value={newCapa.dueDate}
            onChange={e => setNewCapa(prev => ({ ...prev, dueDate: e.target.value }))}
            data-testid="input-new-capa-due"
          />

          <button
            type="submit"
            className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
            data-testid="button-add-capa"
          >
            {t.addAction}
          </button>
        </form>
      </SectionCard>

      {/* Effectiveness Verification */}
      <SectionCard title={t.verification}>
        <textarea
          className={`${inputClass} min-h-20`}
          value={rcaForm.verification}
          onChange={e => setRcaForm(prev => ({ ...prev, verification: e.target.value }))}
          placeholder={lang === "ar" ? "سجل نتائج المتابعة والأدلة على عدم تكرار المشكلة..." : "Record follow-up results and evidence of non-recurrence..."}
          data-testid="input-verification"
        />
        <p className="mt-2 text-xs text-muted-foreground">{t.closeNeeds}</p>
        <button
          type="button"
          className="no-print mt-2 rounded-md border border-border bg-card px-3 py-1.5 text-sm font-medium hover:bg-muted transition-colors"
          onClick={handleSaveRca}
          data-testid="button-save-verification"
        >
          {lang === "ar" ? "حفظ التحقق" : "Save verification"}
        </button>
      </SectionCard>

      {/* Advance Step Action Controls */}
      <section className="no-print mt-4 rounded-md border border-card-border bg-card p-4 shadow-xs">
        <h2 className="text-sm font-semibold text-foreground">{t.next}</h2>

        {/* Mobile Actor input */}
        <div className="mb-2.5 sm:hidden">
          <FormField label={t.acting} hint={t.actingHint}>
            <input
              className={inputClass}
              value={actor}
              onChange={e => setActor(e.target.value)}
              data-testid="input-actor-mobile"
            />
          </FormField>
        </div>

        <FormField label={t.note}>
          <input
            className={inputClass}
            value={handoverNote}
            onChange={e => setHandoverNote(e.target.value)}
            placeholder={lang === "ar" ? "ملاحظة التسليم أو التوجيه..." : "Handover or transition note..."}
            data-testid="input-handover-note"
          />
        </FormField>

        {allowedNextSteps.length > 0 ? (
          <div className="mt-3.5 flex flex-wrap gap-2">
            {allowedNextSteps.map(step => (
              <button
                key={step}
                className="rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
                onClick={() => handleAdvance(step)}
                data-testid={`button-advance-${step}`}
              >
                {STATUS_NAMES[lang]?.[step] || step}
              </button>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-xs text-muted-foreground">
            {lang === "ar" ? "تم إغلاق هذا التقرير ولا توجد خطوات إضافية." : "This report is closed."}
          </p>
        )}

        {advanceError && (
          <p className="mt-3 text-sm text-destructive font-medium" data-testid="text-advance-error">
            {advanceError}
          </p>
        )}
      </section>

      {/* Audit Timeline */}
      <SectionCard title={t.timeline}>
        <ol className="space-y-2.5 text-sm">
          {events.map(ev => (
            <li key={ev.id} className="grid grid-cols-[6.5rem_1fr] gap-3 items-baseline">
              <span className="num text-xs text-muted-foreground">{formatDate(ev.at)}</span>
              <span className="text-foreground">
                {pick(ev.note)}{" "}
                <span className="text-muted-foreground text-xs">· {ev.actor}</span>
              </span>
            </li>
          ))}
        </ol>
      </SectionCard>
    </article>
  );
}

function DetailItem({ label, value }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground font-normal">{label}</div>
      <div className="text-sm font-medium text-foreground mt-0.5">{value}</div>
    </div>
  );
}

function SectionCard({ title, children }) {
  return (
    <section className="mt-4 rounded-md border border-card-border bg-card p-4 shadow-xs">
      <h2 className="mb-2.5 text-sm font-semibold text-foreground">{title}</h2>
      {children}
    </section>
  );
}
