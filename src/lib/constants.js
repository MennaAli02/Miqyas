export const B = (ar, en) => ({ ar, en });

export const CLAUSES = [
  {
    id: 1,
    standard: "ISO 9001:2015",
    code: "8.7",
    titleAr: "التحكم في المخرجات غير المطابقة",
    titleEn: "Control of nonconforming outputs",
    textAr: "تعريف المخرجات غير المطابقة ومنع استخدامها أو تسليمها عن غير قصد.",
    textEn: "Identify nonconforming outputs and prevent their unintended use or delivery."
  },
  {
    id: 2,
    standard: "ISO 9001:2015",
    code: "10.2",
    titleAr: "عدم المطابقة والإجراء التصحيحي",
    titleEn: "Nonconformity and corrective action",
    textAr: "الاستجابة لعدم المطابقة والتحقق من السبب وتنفيذ الإجراء ومراجعة فعاليته.",
    textEn: "React to the nonconformity, determine causes, act, and review effectiveness."
  },
  {
    id: 3,
    standard: "ISO 9001:2015",
    code: "8.4",
    titleAr: "الرقابة على المنتجات والخدمات الموردة خارجياً",
    titleEn: "Control of externally provided products",
    textAr: "ضمان أن العمليات والمنتجات الموردة تطابق المتطلبات.",
    textEn: "Ensure externally provided processes and products conform to requirements."
  },
  {
    id: 4,
    standard: "ISO 9001:2015",
    code: "7.1.5",
    titleAr: "موارد المراقبة والقياس",
    titleEn: "Monitoring and measuring resources",
    textAr: "ضمان معايرة أدوات القياس والحفاظ عليها.",
    textEn: "Ensure measuring equipment is calibrated and maintained."
  },
  {
    id: 5,
    standard: "ISO 9001:2015",
    code: "9.2",
    titleAr: "التدقيق الداخلي",
    titleEn: "Internal audit",
    textAr: "إجراء تدقيق داخلي على فترات مخططة.",
    textEn: "Conduct internal audits at planned intervals."
  },
  {
    id: 6,
    standard: "ISO 9001:2015",
    code: "7.5",
    titleAr: "المعلومات الموثقة",
    titleEn: "Documented information",
    textAr: "التحكم في الوثائق والسجلات المطلوبة.",
    textEn: "Control the documents and records required."
  },
  {
    id: 7,
    standard: "ISO 15189:2022",
    code: "7.5",
    titleAr: "الأعمال غير المطابقة",
    titleEn: "Nonconforming work",
    textAr: "سياسة وإجراء عند عدم مطابقة أي جانب من عمل المختبر.",
    textEn: "Policy and procedure when any aspect of laboratory work is nonconforming."
  },
  {
    id: 8,
    standard: "ISO 13485:2016",
    code: "8.3",
    titleAr: "التحكم في المنتج غير المطابق",
    titleEn: "Control of nonconforming product",
    textAr: "ضمان تحديد المنتج غير المطابق ومنع استخدامه.",
    textEn: "Ensure nonconforming product is identified and prevented from use."
  }
];

export const OWNERS = {
  quality: ["مدير الجودة", "Quality Manager"],
  production: ["مشرف الإنتاج", "Production Supervisor"],
  laboratory: ["رئيس المختبر", "Lab Head"],
  clinical: ["المشرف السريري", "Clinical Lead"],
  procurement: ["مدير المشتريات", "Procurement Manager"],
  maintenance: ["مشرف الصيانة", "Maintenance Supervisor"],
  warehouse: ["مسؤول المستودع", "Warehouse Officer"]
};

export const ROUTING_NOTES = {
  critical: B("تصعيد فوري إلى الإدارة العليا وإشعار مدير الجودة خلال 24 ساعة.", "Escalate to top management and notify the Quality Manager within 24 hours."),
  major: B("إحالة إلى مدير الجودة لبدء التحقيق خلال 3 أيام عمل.", "Route to the Quality Manager to start investigation within 3 working days."),
  minor: B("معالجة ضمن القسم المعني ومراجعتها في اجتماع الجودة الدوري.", "Handle within the department and review at the periodic quality meeting.")
};

export const SUGGESTIONS = {
  critical: B("أوقف المصدر، نفّذ إجراءً تصحيحياً فورياً، ثم أضف إجراءً وقائياً لمنع التكرار.", "Stop the source, apply an immediate corrective action, then add a preventive action."),
  major: B("عالج السبب الجذري وحدّث الإجراء أو التدريب المرتبط به.", "Address the root cause and update the related procedure or training."),
  minor: B("صحّح الحالة وأضف تذكيراً أو فحصاً دورياً.", "Correct the case and add a reminder or periodic check.")
};

export const STATUSES = ["reported", "triage", "investigation", "capa", "verification", "closed", "rejected"];
export const WORKFLOW_STAGES = ["reported", "triage", "investigation", "capa", "verification", "closed"];
export const SEVERITIES = ["minor", "major", "critical"];
export const DEPARTMENTS = ["quality", "production", "laboratory", "clinical", "procurement", "maintenance", "warehouse"];
export const SOURCES = ["process", "internal_audit", "customer", "supplier", "incident", "management"];
export const DISPOSITIONS = ["quarantine", "rework", "scrap", "use_as_is", "return", "na"];
export const CAPA_STATUSES = ["open", "in_progress", "done", "verified"];

export const ALLOWED_TRANSITIONS = {
  reported: ["triage", "rejected"],
  triage: ["investigation", "rejected"],
  investigation: ["capa"],
  capa: ["verification"],
  verification: ["closed", "capa"],
  closed: [],
  rejected: ["reported"]
};

export const SLA_DAYS = {
  critical: 7,
  major: 14,
  minor: 30
};
