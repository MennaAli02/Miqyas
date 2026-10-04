/**
 * src/lib/api.js
 *
 * API adapter — calls Supabase RPC functions when the backend is
 * configured (VITE_SUPABASE_URL is set), otherwise falls back to the
 * local-storage mock so the app still works during development.
 *
 * All function signatures are identical to the original mock version,
 * so the pages do not change at all.
 */

import {
  B,
  CLAUSES,
  OWNERS,
  ROUTING_NOTES,
  SUGGESTIONS,
  ALLOWED_TRANSITIONS,
  SLA_DAYS,
} from './constants';

// ---------------------------------------------------------------------------
// Detect whether we have a real Supabase backend configured
// ---------------------------------------------------------------------------
const BACKEND_ENABLED =
  typeof import.meta.env.VITE_SUPABASE_URL === 'string' &&
  import.meta.env.VITE_SUPABASE_URL.startsWith('https://');

// Lazy-load the Supabase client only when the backend is enabled
let _supabase = null;
async function getClient() {
  if (!_supabase) {
    const mod = await import('./supabase.js');
    _supabase = mod.supabase;
  }
  return _supabase;
}

// ---------------------------------------------------------------------------
// Helper: call an RPC function and throw on error
// ---------------------------------------------------------------------------
async function rpc(name, args) {
  const sb = await getClient();
  const { data, error } = await sb.rpc(name, args);
  if (error) throw new Error(error.message);
  return data;
}

// ===========================================================================
// LOCAL-STORAGE MOCK (used when BACKEND_ENABLED is false)
// ===========================================================================

const STORAGE_KEY = 'miqyas.standalone.v1';
const iso = d => d.toISOString().slice(0, 10);
const now = () => iso(new Date());
const addDays = (s, n) => {
  const d = new Date(s + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return iso(d);
};

const tx = (existing, val, lang = 'ar') => {
  if (typeof val === 'string') {
    return {
      ...(existing && typeof existing === 'object' ? existing : {}),
      [lang]: val,
    };
  }
  return val;
};

const hasValue = v => {
  if (!v) return false;
  if (typeof v === 'string') return v.trim().length > 0;
  return Object.values(v).some(x => String(x).trim().length > 0);
};

function seedDatabase() {
  const t0 = now();
  const mk = (id, d, st, sv, dep, src, cl, t, ds, ex) => ({
    id,
    ref: 'NCR-2026-' + String(id).padStart(4, '0'),
    title: t,
    description: ds,
    requirement: B('', ''),
    containment: B('', ''),
    disposition: 'quarantine',
    routingNote: ROUTING_NOTES[sv],
    ownerName: B(OWNERS[dep][0], OWNERS[dep][1]),
    dueDate: addDays(d, SLA_DAYS[sv] || 30),
    status: st,
    severity: sv,
    department: dep,
    location: '',
    source: src,
    reporterName: 'Demo',
    reportedAt: d,
    clauseId: cl,
    rcaMethod: 'five_why',
    whys: [],
    rootCause: '',
    contributors: '',
    verificationNote: '',
    ...ex,
  });

  const ncrs = [
    mk(1, addDays(t0, -40), 'closed', 'major', 'production', 'process', 4,
      B('عزم الربط أقل من المسموح على الخط 2', 'Torque below tolerance on line 2'),
      B('قيست البراغي أقل بـ 12% من المواصفة.', 'Bolts measured 12% below spec.'),
      { rootCause: B('مفتاح العزم غير معاير.', 'Torque wrench not calibrated.'),
        whys: ['Wrench drift', 'No calibration schedule'],
        verificationNote: B('لا تكرار خلال 3 أسابيع.', 'No recurrence in 3 weeks.'),
        containment: B('عزل الدفعة وإعادة الفحص.', 'Batch isolated and re-inspected.'),
        closedAt: addDays(t0, -30) }),
    mk(2, addDays(t0, -12), 'investigation', 'critical', 'procurement', 'supplier', 3,
      B('مورد سلّم درجة مادة خاطئة', 'Supplier delivered wrong material grade'),
      B('الدفعة 4471 وصلت بدرجة B بدل A.', 'Batch 4471 arrived as grade B instead of A.'), {}),
    mk(3, addDays(t0, -5), 'capa', 'minor', 'laboratory', 'internal_audit', 6,
      B('توقيع ناقص في سجل المعايرة', 'Missing signature on calibration record'),
      B('اكتُشف أثناء التدقيق الداخلي للمختبر.', 'Found during the lab internal audit.'),
      { rootCause: B('لا توجد خطوة مراجعة للسجل.', 'No record review step.'),
        whys: ['Form not signed', 'No review step'] }),
    mk(4, t0, 'reported', 'major', 'quality', 'incident', 2,
      B('تأخر إغلاق شكوى عميل', 'Customer complaint closed late'),
      B('تجاوز إغلاق الشكوى المدة المتفق عليها.', 'Complaint closure exceeded the agreed time.'), {}),
  ];

  const events = [];
  let evId = 1;
  ncrs.forEach(r => {
    events.push({ id: evId++, ncrId: r.id, at: r.reportedAt, actor: 'Demo',
      note: B('تم تسجيل عدم المطابقة', 'Non-conformance reported') });
  });
  events.push({ id: evId++, ncrId: 1, at: addDays(t0, -30), actor: 'Demo',
    note: B('أُغلقت بعد التحقق', 'Closed after verification') });

  const capas = [
    { id: 1, ncrId: 1, type: 'corrective',
      action: B('إعادة معايرة كل المفاتيح', 'Recalibrate all wrenches'),
      ownerName: 'Ahmed', dueDate: addDays(t0, -32), status: 'verified' },
    { id: 2, ncrId: 3, type: 'corrective',
      action: B('إضافة خطوة مراجعة وتوقيع للسجل', 'Add a review and sign-off step'),
      ownerName: 'Mona', dueDate: addDays(t0, 10), status: 'in_progress' },
  ];

  return { ncrs, capas, events, files: [], seq: { ncr: 5, capa: 3, ev: evId, file: 1 } };
}

let dbInstance = null;

function loadDb() {
  if (dbInstance) return dbInstance;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) dbInstance = JSON.parse(raw);
  } catch { /* ignore */ }
  if (!dbInstance || !Array.isArray(dbInstance.ncrs)) {
    dbInstance = seedDatabase();
    saveDb();
  }
  return dbInstance;
}

function saveDb() {
  if (!dbInstance) return;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(dbInstance)); } catch { /* ignore */ }
}

const countBy = (arr, fn) =>
  arr.reduce((acc, item) => {
    const key = fn(item);
    if (key !== undefined && key !== null) acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

// ===========================================================================
// SUPABASE API IMPLEMENTATIONS
// ===========================================================================

const supabaseApi = {
  async getBootstrap() {
    return rpc('get_bootstrap');
  },

  async getNcrDetail(id) {
    return rpc('get_ncr', { p_id: Number(id) });
  },

  async createNcr(body) {
    // Map camelCase body keys to the payload shape the SQL function expects
    return rpc('create_ncr', { payload: body });
  },

  async updateNcrRca(id, body) {
    return rpc('update_analysis', { p_id: Number(id), payload: body });
  },

  async advanceNcr(id, { to, actor, note, lang = 'ar' }) {
    return rpc('advance_ncr', { p_id: Number(id), p_to: to, p_note: note ?? null });
  },

  async addCapaAction(ncrId, body) {
    return rpc('add_capa', { p_ncr_id: Number(ncrId), payload: body });
  },

  async updateCapaStatus(capaId, status) {
    return rpc('set_capa_status', { p_id: Number(capaId), p_status: status });
  },

  async addEvidence(ncrId, { file, name, actor }) {
    const sb = await getClient();
    // 1. Upload the file to the private Storage bucket
    const safeName = name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const path = `${ncrId}/${crypto.randomUUID()}-${safeName}`;

    const { error: upErr } = await sb.storage.from('evidence').upload(path, file);
    if (upErr) throw new Error(upErr.message);

    // 2. Register the file in the database
    return rpc('add_evidence', { p_ncr_id: Number(ncrId), p_path: path, p_name: name });
  },

  async getEvidenceUrl(path) {
    const sb = await getClient();
    const { data, error } = await sb.storage
      .from('evidence')
      .createSignedUrl(path, 300); // 5-minute signed URL
    if (error) throw new Error(error.message);
    return data.signedUrl;
  },

  async deleteNcr(id) {
    return rpc('archive_ncr', { p_id: Number(id) });
  },

  async resetDatabase() {
    // Not available in the real backend — no-op
    console.warn('resetDatabase() is not supported with the Supabase backend.');
    return true;
  },
};

// ===========================================================================
// MOCK API IMPLEMENTATIONS (localStorage)
// ===========================================================================

const mockApi = {
  getBootstrap() {
    const db = loadDb();
    const ncrs = db.ncrs;
    const openNcrs = ncrs.filter(n => n.status !== 'closed' && n.status !== 'rejected');
    const ym = now().slice(0, 7);
    const closedCapas = db.capas.filter(c => c.status === 'done' || c.status === 'verified');
    const verifiedCapas = closedCapas.filter(c => c.status === 'verified');

    const stats = {
      open: openNcrs.length,
      overdue: openNcrs.filter(n => n.dueDate && n.dueDate < now()).length,
      critical: openNcrs.filter(n => n.severity === 'critical').length,
      closedMonth: ncrs.filter(n => n.status === 'closed' && (n.closedAt || n.reportedAt).slice(0, 7) === ym).length,
      byStatus: countBy(ncrs, n => n.status),
      byDept: countBy(ncrs, n => n.department),
      bySeverity: countBy(ncrs, n => n.severity),
      bySource: countBy(ncrs, n => n.source),
      byMonth: countBy(ncrs, n => n.reportedAt.slice(0, 7)),
      clauseHits: countBy(ncrs.filter(n => n.clauseId), n => n.clauseId),
      effectiveness: closedCapas.length ? Math.round((verifiedCapas.length / closedCapas.length) * 100) : 0,
      capaOpen: db.capas.filter(c => c.status === 'open' || c.status === 'in_progress').length,
    };

    return Promise.resolve({ stats, ncrs, capas: db.capas, clauses: CLAUSES });
  },

  getNcrDetail(id) {
    const db = loadDb();
    const ncr = db.ncrs.find(x => String(x.id) === String(id));
    if (!ncr) return Promise.reject(new Error('NCR not found'));
    const clause = CLAUSES.find(c => c.id === ncr.clauseId) || null;
    const evidence = db.files.filter(f => String(f.ncrId) === String(ncr.id));
    const capas = db.capas.filter(c => String(c.ncrId) === String(ncr.id));
    const events = db.events.filter(e => String(e.ncrId) === String(ncr.id)).sort((a, b) => a.id - b.id);
    const suggestion = SUGGESTIONS[ncr.severity];
    return Promise.resolve({ ncr, clause, evidence, capas, events, suggestion });
  },

  createNcr(body) {
    const db = loadDb();
    const id = db.seq.ncr++;
    const sv = body.severity || 'minor';
    const lang = body.lang || 'ar';
    const d = body.reportedAt || now();
    const dep = body.department || 'quality';
    const owner = OWNERS[dep] || OWNERS.quality;

    const ncr = {
      id,
      ref: 'NCR-' + d.slice(0, 4) + '-' + String(id).padStart(4, '0'),
      title: tx(null, body.title, lang),
      description: tx(null, body.description, lang),
      requirement: tx(null, body.requirement || '', lang),
      containment: tx(null, body.containment || '', lang),
      disposition: body.disposition || 'quarantine',
      routingNote: ROUTING_NOTES[sv] || ROUTING_NOTES.minor,
      ownerName: B(owner[0], owner[1]),
      dueDate: addDays(d, SLA_DAYS[sv] || 30),
      status: 'reported',
      severity: sv,
      department: dep,
      location: body.location || '',
      source: body.source || 'process',
      reporterName: body.reporterName || 'Demo',
      reportedAt: d,
      clauseId: body.clauseId || null,
      rcaMethod: body.rcaMethod || 'five_why',
      whys: body.whys || [],
      rootCause: tx(null, body.rootCause || '', lang),
      contributors: '',
      verificationNote: '',
    };

    db.ncrs.push(ncr);
    db.events.push({ id: db.seq.ev++, ncrId: id, at: now(), actor: body.reporterName || 'Demo',
      note: B('تم تسجيل عدم المطابقة', 'Non-conformance reported') });

    if (body.capaAction && body.capaAction.trim()) {
      db.capas.push({ id: db.seq.capa++, ncrId: id, type: body.capaType || 'corrective',
        action: tx(null, body.capaAction, lang), ownerName: body.capaOwner || '',
        dueDate: body.capaDue || ncr.dueDate, status: 'open' });
    }

    saveDb();
    return Promise.resolve(ncr);
  },

  updateNcrRca(id, body) {
    const db = loadDb();
    const ncr = db.ncrs.find(x => String(x.id) === String(id));
    if (!ncr) return Promise.reject(new Error('NCR not found'));
    const lang = body.lang || 'ar';
    ['rootCause', 'contributors', 'verificationNote'].forEach(k => {
      if (k in body) ncr[k] = tx(ncr[k], body[k], lang);
    });
    if (body.rcaMethod) ncr.rcaMethod = body.rcaMethod;
    if (body.whys) ncr.whys = body.whys;
    db.events.push({ id: db.seq.ev++, ncrId: ncr.id, at: now(), actor: body.actor || '—',
      note: B('تحديث تحليل السبب الجذري', 'Root cause analysis updated') });
    saveDb();
    return Promise.resolve(ncr);
  },

  advanceNcr(id, { to, actor, note, lang = 'ar' }) {
    const db = loadDb();
    const ncr = db.ncrs.find(x => String(x.id) === String(id));
    if (!ncr) return Promise.reject(new Error('NCR not found'));
    const allowed = ALLOWED_TRANSITIONS[ncr.status] || [];
    if (!allowed.includes(to)) {
      return Promise.reject(new Error(lang === 'ar' ? 'انتقال غير مسموح' : 'Transition not allowed'));
    }
    const ncrCapas = db.capas.filter(c => String(c.ncrId) === String(ncr.id));
    if (to === 'capa' && ncr.status === 'investigation' && !hasValue(ncr.rootCause)) {
      return Promise.reject(new Error(lang === 'ar' ? 'حدد السبب الجذري قبل الانتقال.' : 'Record the root cause first.'));
    }
    if (to === 'verification' && !ncrCapas.length) {
      return Promise.reject(new Error(lang === 'ar' ? 'أضف إجراءً تصحيحياً واحداً على الأقل.' : 'Add at least one corrective action.'));
    }
    if (to === 'verification' && ncrCapas.some(c => c.status === 'open')) {
      return Promise.reject(new Error(lang === 'ar' ? 'يجب البدء بجميع الإجراءات.' : 'All actions must be started.'));
    }
    if (to === 'closed' && !hasValue(ncr.verificationNote)) {
      return Promise.reject(new Error(lang === 'ar' ? 'أضف ملاحظة التحقق من الفعالية.' : 'Add an effectiveness verification note.'));
    }
    if (to === 'closed' && ncrCapas.some(c => c.status !== 'verified' && c.status !== 'done')) {
      return Promise.reject(new Error(lang === 'ar' ? 'يجب إنجاز جميع الإجراءات.' : 'All actions must be completed.'));
    }
    const prevStatus = ncr.status;
    ncr.status = to;
    if (to === 'closed') ncr.closedAt = now();
    const noteText = note && note.trim();
    const noteObj = noteText
      ? { ar: `${noteText} [${prevStatus} → ${to}]`, en: `${noteText} [${prevStatus} → ${to}]` }
      : { ar: `انتقال: ${prevStatus} → ${to}`, en: `Moved: ${prevStatus} → ${to}` };
    db.events.push({ id: db.seq.ev++, ncrId: ncr.id, at: now(), actor: actor || '—', note: noteObj });
    saveDb();
    return Promise.resolve(ncr);
  },

  addCapaAction(ncrId, body) {
    const db = loadDb();
    const ncr = db.ncrs.find(x => String(x.id) === String(ncrId));
    if (!ncr) return Promise.reject(new Error('NCR not found'));
    const lang = body.lang || 'ar';
    const capa = { id: db.seq.capa++, ncrId: ncr.id, type: body.type || 'corrective',
      action: tx(null, body.action, lang), ownerName: body.ownerName || '',
      dueDate: body.dueDate || ncr.dueDate, status: 'open' };
    db.capas.push(capa);
    db.events.push({ id: db.seq.ev++, ncrId: ncr.id, at: now(), actor: body.actor || '—',
      note: B('إضافة إجراء', 'Action added') });
    saveDb();
    return Promise.resolve(capa);
  },

  updateCapaStatus(capaId, status) {
    const db = loadDb();
    const capa = db.capas.find(c => String(c.id) === String(capaId));
    if (!capa) return Promise.reject(new Error('CAPA not found'));
    capa.status = status;
    saveDb();
    return Promise.resolve(capa);
  },

  addEvidence(ncrId, { dataUrl, name, actor }) {
    const db = loadDb();
    const u = dataUrl || '';
    const kind = u.startsWith('data:video') ? 'video' : u.startsWith('data:image') ? 'image' : 'file';
    const file = { id: db.seq.file++, ncrId: Number(ncrId), kind, name, caption: name, dataUrl: u };
    db.files.push(file);
    db.events.push({ id: db.seq.ev++, ncrId: Number(ncrId), at: now(), actor: actor || '—',
      note: B('إرفاق دليل', 'Evidence attached') });
    saveDb();
    return Promise.resolve({ id: file.id, kind: file.kind, name: file.name });
  },

  getEvidenceUrl(path) {
    // In mock mode, path is the full dataUrl
    return Promise.resolve(path);
  },

  deleteNcr(id) {
    const db = loadDb();
    const ncrId = Number(id);
    db.ncrs = db.ncrs.filter(q => q.id !== ncrId);
    db.capas = db.capas.filter(c => c.ncrId !== ncrId);
    db.events = db.events.filter(e => e.ncrId !== ncrId);
    db.files = db.files.filter(f => f.ncrId !== ncrId);
    saveDb();
    return Promise.resolve({ ok: true });
  },

  resetDatabase() {
    localStorage.removeItem(STORAGE_KEY);
    dbInstance = seedDatabase();
    saveDb();
    return Promise.resolve(true);
  },
};

// ===========================================================================
// EXPORTED API — routes to Supabase or mock depending on configuration
// ===========================================================================

export const api = BACKEND_ENABLED ? supabaseApi : mockApi;

// Expose reset globally for console debugging (mock only)
if (typeof window !== 'undefined') {
  window.miqyasReset = () => {
    if (BACKEND_ENABLED) {
      console.warn('resetDatabase() is not available with the Supabase backend.');
      return;
    }
    mockApi.resetDatabase().then(() => window.location.reload());
  };
}
