import { createContext, useContext, useState, useEffect, useMemo } from 'react';

export const TRANSLATIONS = {
  ar: {
    brand: "مقياس",
    product: "إدارة عدم المطابقة",
    openAccess: "بدون حساب",
    navHome: "المتابعة",
    navRegister: "السجل",
    navNew: "تقرير جديد",
    navCapa: "الإجراءات",
    navTrends: "الاتجاهات",
    navClauses: "البنود",
    newReport: "تبليغ",
    search: "بحث بالرقم أو الوصف",
    lang: "English",
    themeToDark: "مظهر داكن",
    themeToLight: "مظهر فاتح",
    acting: "أوقّع باسم",
    actingHint: "يظهر في السجل فقط. ليس كلمة مرور.",
    kpis: "هل نحن ضمن المدى؟",
    open: "مفتوح",
    overdue: "متأخر",
    criticalOpen: "حرج مفتوح",
    closedMonth: "أُغلق هذا الشهر",
    capaOpen: "إجراء مفتوح",
    funnel: "مسار العمل",
    recent: "آخر التقارير",
    hot: "بنود تتكرر",
    seeAll: "كل السجل",
    empty: "لا نتائج",
    emptyHint: "غيّر التصفية أو ابدأ تقريراً جديداً.",
    filterStatus: "الحالة",
    filterSeverity: "الشدة",
    filterDept: "القسم",
    all: "الكل",
    export: "تصدير CSV",
    ref: "الرقم",
    title: "العنوان",
    reporter: "المبلّغ",
    date: "التاريخ",
    department: "القسم",
    location: "الموقع",
    source: "المصدر",
    severity: "الشدة",
    status: "الحالة",
    owner: "المالك",
    due: "الاستحقاق",
    clause: "البند المخالف",
    description: "وصف الحالة",
    evidence: "الأدلة",
    requirement: "نص الاشتراط المخالَف",
    containment: "احتواء فوري",
    disposition: "التصرف",
    rca: "تحليل السبب الجذري",
    capa: "إجراء تصحيحي ووقائي",
    save: "حفظ التقرير",
    saving: "جارٍ الحفظ",
    required: "مطلوب",
    optional: "يمكن إكماله لاحقاً",
    attach: "إرفاق صورة أو فيديو أو ملف",
    attachHint: "حتى 12 م.ب. يُحفظ مع التقرير.",
    caption: "تعليق على الدليل",
    fiveWhy: "خمسة لماذا",
    root: "السبب الجذري",
    contributors: "عوامل مساعدة",
    action: "الإجراء",
    actionType: "نوع الإجراء",
    corrective: "تصحيحي",
    preventive: "وقائي",
    addAction: "إضافة إجراء",
    advance: "نقل الخطوة",
    print: "طباعة",
    remove: "حذف التقرير",
    confirmRemove: "حذف هذا التقرير؟ لا يمكن التراجع.",
    timeline: "السجل",
    routing: "التوجيه",
    suggestion: "اقتراح حسب البند",
    useSuggestion: "استخدام الاقتراح",
    verification: "التحقق من الفاعلية",
    blocked: "أكمل المطلوب قبل هذه الخطوة",
    back: "رجوع",
    noLogin: "لا يوجد اسم مستخدم ولا كلمة مرور. الاسم الذي تكتبه يُسجَّل على التقرير فقط.",
    formLead: "نموذج قصير. التحليل والإجراء يمكن إكمالهما بعد الحفظ.",
    stepGeneral: "بيانات عامة",
    stepCase: "الحالة والبند",
    stepLater: "السبب والإجراء",
    trendsLead: "أين يتكرر الانحراف، وأي إجراء أُثبت.",
    byDept: "حسب القسم",
    bySeverity: "حسب الشدة",
    bySource: "حسب المصدر",
    byMonth: "حسب شهر التبليغ",
    hotspot: "البنود الأكثر تكراراً",
    effect: "فاعلية الإجراءات المغلقة",
    clausesLead: "اربط الانحراف ببند مواصفة أو إجراء داخلي.",
    raise: "تبليغ على هذا البند",
    count: "مرات",
    overdueList: "يحتاج متابعة",
    noneOverdue: "لا تقارير متأخرة.",
    capaBoard: "لوحة الإجراءات",
    capaLead: "كل إجراء مربوط بتقريره. لا إجراء يتيم.",
    effectiveness: "دليل الفاعلية",
    mark: "تحديث الحالة",
    upload: "رفع",
    uploading: "جارٍ الرفع",
    saved: "تم الحفظ",
    whys: "سلسلة لماذا",
    method: "الأسلوب",
    fishbone: "عظم السمكة — عوامل",
    closeNeeds: "الإغلاق يطلب سبباً جذرياً وإجراءً وملاحظة تحقق.",
    next: "الخطوة التالية",
    note: "ملاحظة الانتقال",
    actorMissing: "اكتب الاسم الذي توقّع به",
    fileTooBig: "الملف أكبر من 12 م.ب",
    demo: "بيانات توضيحية جاهزة. أضف تقريرك من دون حساب.",
    resetData: "إعادة ضبط البيانات",
    resetConfirm: "هل أنت متأكد من إعادة ضبط كل البيانات إلى العينات الأصلية؟"
  },
  en: {
    brand: "Miqyas",
    product: "Non-conformance",
    openAccess: "No account",
    navHome: "Overview",
    navRegister: "Register",
    navNew: "New report",
    navCapa: "Actions",
    navTrends: "Trends",
    navClauses: "Clauses",
    newReport: "Report",
    search: "Search ref or text",
    lang: "العربية",
    themeToDark: "Dark theme",
    themeToLight: "Light theme",
    acting: "Sign as",
    actingHint: "Written on the record only. Not a password.",
    kpis: "Are we in range?",
    open: "Open",
    overdue: "Overdue",
    criticalOpen: "Critical open",
    closedMonth: "Closed this month",
    capaOpen: "Open actions",
    funnel: "Workflow",
    recent: "Latest reports",
    hot: "Repeating clauses",
    seeAll: "Full register",
    empty: "Nothing here",
    emptyHint: "Change the filter, or start a report.",
    filterStatus: "Status",
    filterSeverity: "Severity",
    filterDept: "Department",
    all: "All",
    export: "Export CSV",
    ref: "Reference",
    title: "Title",
    reporter: "Reporter",
    date: "Date",
    department: "Department",
    location: "Location",
    source: "Source",
    severity: "Severity",
    status: "Status",
    owner: "Owner",
    due: "Due",
    clause: "Violated clause",
    description: "What happened",
    evidence: "Evidence",
    requirement: "Requirement breached",
    containment: "Immediate containment",
    disposition: "Disposition",
    rca: "Root cause",
    capa: "Corrective and preventive action",
    save: "Save report",
    saving: "Saving",
    required: "Required",
    optional: "Can be finished later",
    attach: "Attach a photo, video, or file",
    attachHint: "Up to 12 MB. Stored with the report.",
    caption: "Caption",
    fiveWhy: "Five whys",
    root: "Root cause",
    contributors: "Contributing factors",
    action: "Action",
    actionType: "Action type",
    corrective: "Corrective",
    preventive: "Preventive",
    addAction: "Add action",
    advance: "Move step",
    print: "Print",
    remove: "Delete report",
    confirmRemove: "Delete this report? This cannot be undone.",
    timeline: "Record",
    routing: "Routing",
    suggestion: "Suggested from the clause",
    useSuggestion: "Use suggestion",
    verification: "Effectiveness check",
    blocked: "Finish the required fields before this step",
    back: "Back",
    noLogin: "No username and no password. The name you type is written on the report only.",
    formLead: "A short form. Cause and action can be finished after saving.",
    stepGeneral: "General",
    stepCase: "Case and clause",
    stepLater: "Cause and action",
    trendsLead: "Where the deviation repeats, and which action held.",
    byDept: "By department",
    bySeverity: "By severity",
    bySource: "By source",
    byMonth: "By month reported",
    hotspot: "Most repeated clauses",
    effect: "Effectiveness of closed actions",
    clausesLead: "Link the deviation to a standard or an internal procedure.",
    raise: "Report against this clause",
    count: "Times",
    overdueList: "Needs follow-up",
    noneOverdue: "No overdue reports.",
    capaBoard: "Action board",
    capaLead: "Every action stays tied to its report.",
    effectiveness: "Evidence of effectiveness",
    mark: "Update status",
    upload: "Upload",
    uploading: "Uploading",
    saved: "Saved",
    whys: "Why chain",
    method: "Method",
    fishbone: "Fishbone factors",
    closeNeeds: "Closure needs a root cause, an action, and a verification note.",
    next: "Next step",
    note: "Handover note",
    actorMissing: "Type the name you are signing with",
    fileTooBig: "File is larger than 12 MB",
    demo: "Sample cases are loaded. Add your own without an account.",
    resetData: "Reset data",
    resetConfirm: "Are you sure you want to reset all data to initial samples?"
  }
};

export const STATUS_NAMES = {
  ar: {
    reported: "مبلّغ",
    triage: "فرز",
    investigation: "تحقيق",
    capa: "إجراء",
    verification: "تحقق",
    closed: "مغلق",
    rejected: "مرفوض"
  },
  en: {
    reported: "Reported",
    triage: "Triage",
    investigation: "Investigation",
    capa: "Action",
    verification: "Verification",
    closed: "Closed",
    rejected: "Rejected"
  }
};

export const SEVERITY_NAMES = {
  ar: { minor: "ثانوي", major: "رئيسي", critical: "حرج" },
  en: { minor: "Minor", major: "Major", critical: "Critical" }
};

export const SOURCE_NAMES = {
  ar: {
    process: "عملية",
    internal_audit: "تدقيق داخلي",
    customer: "عميل",
    supplier: "مورد",
    incident: "حادث",
    management: "إدارة"
  },
  en: {
    process: "Process",
    internal_audit: "Internal audit",
    customer: "Customer",
    supplier: "Supplier",
    incident: "Incident",
    management: "Management"
  }
};

export const DEPARTMENT_NAMES = {
  ar: {
    quality: "الجودة",
    production: "الإنتاج",
    laboratory: "المختبر",
    clinical: "سريري",
    procurement: "المشتريات",
    maintenance: "الصيانة",
    warehouse: "المستودع"
  },
  en: {
    quality: "Quality",
    production: "Production",
    laboratory: "Laboratory",
    clinical: "Clinical",
    procurement: "Procurement",
    maintenance: "Maintenance",
    warehouse: "Warehouse"
  }
};

export const DISPOSITION_NAMES = {
  ar: {
    quarantine: "حجر",
    rework: "إعادة تشغيل",
    scrap: "إعدام",
    use_as_is: "استخدام بحالته",
    return: "إعادة للمورد",
    na: "لا ينطبق"
  },
  en: {
    quarantine: "Quarantine",
    rework: "Rework",
    scrap: "Scrap",
    use_as_is: "Use as-is",
    return: "Return",
    na: "Not applicable"
  }
};

export const CAPA_STATUS_NAMES = {
  ar: {
    open: "مفتوح",
    in_progress: "جارٍ",
    done: "منفَّذ",
    verified: "متحقق"
  },
  en: {
    open: "Open",
    in_progress: "In progress",
    done: "Done",
    verified: "Verified"
  }
};

const LanguageContext = createContext(null);

export function formatDate(isoStr, lang) {
  if (!isoStr) return "—";
  const d = new Date(isoStr.length === 10 ? `${isoStr}T00:00:00` : isoStr);
  return Number.isNaN(d.getTime())
    ? isoStr
    : d.toLocaleDateString(lang === "ar" ? "ar-EG" : "en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        numberingSystem: "latn"
      });
}

export function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function isOverdue(dueDate, status) {
  if (!dueDate || status === "closed" || status === "rejected") return false;
  return dueDate < todayIso();
}

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem("miqyas.lang") || "ar";
  });

  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem("miqyas.theme");
    if (saved) return saved;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  const [actor, setActor] = useState(() => {
    return localStorage.getItem("miqyas.actor") || "";
  });

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    document.title = lang === "ar" ? "مقياس · إدارة عدم المطابقة" : "Miqyas · Non-conformance";
    localStorage.setItem("miqyas.lang", lang);
  }, [lang]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("miqyas.theme", theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("miqyas.actor", actor);
  }, [actor]);

  const value = useMemo(() => ({
    lang,
    setLang,
    theme,
    toggleTheme: () => setTheme(curr => (curr === "dark" ? "light" : "dark")),
    t: TRANSLATIONS[lang] || TRANSLATIONS.ar,
    pick: val => {
      if (!val) return "";
      if (typeof val === "string") return val;
      return val[lang] || val.ar || val.en || "";
    },
    actor,
    setActor,
    formatDate: date => formatDate(date, lang),
    isOverdue
  }), [lang, theme, actor]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
