import { useMemo, useState, useEffect, useRef, memo } from "react";

/**
 * Unified Add‑ons Screens (Admin ▸ TellMarket ▸ HR ▸ Accounting ▸ CCTV ▸ Reception)
 * الهوية: أحمر داكن + Slate — تصميم موجّه للأجهزة اللوحية.
 *
 * 🔧 Fixes
 * - Removed stray character at BOF that caused: SyntaxError: Unexpected token (1:0).
 * - Closed all JSX trees properly; no stray parentheses/braces.
 * - Normalized Tailwind classes (bg-white/text-white/items-center).
 * - Completed missing components (ReceptionPanel, CCTVPanel) and App wiring.
 * - Kept dev self‑tests; added extra cases.
 */

/***********************
 * بيانات وهمية مشتركة
 ***********************/
const sampleLeads = [
  { id: "L-101", name: "أحمد عبد الله", phone: "0501234567", area: "حي الروضة", note: "سأل عن فلتر RO" },
  { id: "L-102", name: "سارة الشمري", phone: "0559876543", area: "حي العليا", note: "مهتمة بالسخان الشمسي" },
  { id: "L-103", name: "مازن تركي", phone: "0532221188", area: "الياسمين", note: "عميل سابق — يحتاج صيانة" },
];

const sampleEngineers = [
  { id: "E-1", name: "م. خالد", area: "الروضة", status: "available" },
  { id: "E-2", name: "م. سليم", area: "العليا", status: "busy" },
  { id: "E-3", name: "م. نورة", area: "الياسمين", status: "offline" },
];

const kpis = [
  { label: "مكالمات اليوم", value: 36 },
  { label: "مواعيد محجوزة", value: 12 },
  { label: "نسبة التحويل", value: "33%" },
];

// كاميرات وهمية
const sampleCameras = [
  { id: "C-01", name: "مدخل رئيسي", area: "الاستقبال", status: "online" },
  { id: "C-02", name: "ممر المستودع", area: "المستودع", status: "online" },
  { id: "C-03", name: "المخارج الخلفية", area: "الساحة", status: "offline" },
  { id: "C-04", name: "ورشة الصيانة", area: "الصيانة", status: "online" },
  { id: "C-05", name: "موقف السيارات", area: "الخارج", status: "online" },
];

// أقساط/تركيبات/بنزين — بيانات وهمية مفصّلة
const sampleInstallments = [
  { id: "INS-1001", customer: "خالد الشمري", product: "فلتر RO 6 مراحل", start: "2025-06-15", end: "2026-06-15", monthly: 180, paidMonths: 4, totalMonths: 12 },
  { id: "INS-1002", customer: "نورة الدوسري", product: "سخان شمسي 200L", start: "2025-08-01", end: "2026-08-01", monthly: 320, paidMonths: 2, totalMonths: 12 },
  { id: "INS-1003", customer: "أبو يزيد", product: "جامبو صناعي", start: "2025-04-10", end: "2026-04-10", monthly: 550, paidMonths: 6, totalMonths: 12 },
];

const sampleInstallations = [
  { id: "JOB-3001", date: "2025-10-20", customer: "أم محمد", address: "حي النرجس، شارع 12", device: "سخان شمسي 200L", engineer: "م. سليم" },
  { id: "JOB-3002", date: "2025-10-22", customer: "أبو وليد", address: "حي الروابي، مقابل مسجد السلام", device: "فلتر RO 5 مراحل", engineer: "م. خالد" },
  { id: "JOB-3003", date: "2025-10-27", customer: "مؤسسة صفاء الماء", address: "المنطقة الصناعية، مستودع 7", device: "جامبو 20", engineer: "م. نورة" },
];

const sampleFuel = [
  { engineer: "م. خالد", date: "2025-10-29", liters: 9.8, distanceKm: 74, routes: ["المقر → حي الروضة", "الروضة → النرجس", "النرجس → المقر"] },
  { engineer: "م. سليم", date: "2025-10-29", liters: 12.4, distanceKm: 96, routes: ["المقر → العليا", "العليا → الياسمين", "الياسمين → المقر"] },
  { engineer: "م. نورة", date: "2025-10-29", liters: 7.1, distanceKm: 58, routes: ["المقر → الصناعية", "الصناعية → المستودع", "المستودع → المقر"] },
];

/***********************
 * عناصر مساعدة
 ***********************/
const Badge = memo(function Badge({ children, color = "gray" }: { children: any; color?: "green"|"red"|"yellow"|"gray"|"blue" }) {
  const map: Record<string, string> = {
    green: "bg-green-100 text-green-700",
    red: "bg-red-100 text-red-700",
    yellow: "bg-yellow-100 text-yellow-700",
    gray: "bg-gray-100 text-gray-700",
    blue: "bg-blue-100 text-blue-700",
  };
  return <span className={`px-2 py-0.5 rounded-full text-xs ${map[color]}`}>{children}</span>;
});

function SectionCard({ title, desc, onEnter }: { title: string; desc?: string; onEnter?: () => void }) {
  return (
    <div className="p-4 border rounded-2xl shadow-sm text-center border-slate-200">
      <h3 className="font-semibold mb-1">{title}</h3>
      {desc && <p className="text-sm text-gray-500">{desc}</p>}
      <button onClick={onEnter} className="mt-3 px-4 py-2 rounded-2xl w-full border bg-white hover:bg-slate-50">دخول</button>
    </div>
  );
}

/***********************
 * لوحة المدير (ملخص)
 ***********************/
const AdminUI = ({ goTo }: { goTo: (s: string) => void }) => (
  <div className="space-y-6">
    <div className="grid md:grid-cols-6 gap-4">
      <SectionCard title="قسم المحاسبة" desc="إدارة الفواتير والتحصيلات" onEnter={() => goTo("accounting")} />
      <SectionCard title="قسم الموارد البشرية" desc="الموظفين والتوظيف والإجازات" onEnter={() => goTo("hr")} />
      <SectionCard title="قسم الريسبشن" desc="تذاكر الصيانة وخدمة العملاء" onEnter={() => goTo("reception")} />
      <SectionCard title="المستودع" desc="الكميات والمواد المتوفرة" onEnter={() => goTo("warehouse")} />
      <SectionCard title="Tell Market" desc="حملات الاتصال وحجز فحوص المياه" onEnter={() => goTo("tellmarket")} />
      <SectionCard title="الكاميرات" desc="مراقبة البث المباشر والأرشيف" onEnter={() => goTo("cctv")} />
    </div>

    <div className="grid md:grid-cols-3 gap-4">
      <div className="p-4 border rounded-2xl shadow-sm border-slate-200">
        <h3 className="text-sm font-semibold mb-2">إحصائيات عامة</h3>
        <ul className="text-sm space-y-1">
          <li>عدد الطلبات اليوم: <span className="font-bold">23</span></li>
          <li>عدد الفنيين في الميدان: <span className="font-bold">8</span></li>
          <li>إجمالي المبيعات هذا الشهر: <span className="font-bold">52,400</span></li>
        </ul>
      </div>
      <div className="p-4 border rounded-2xl shadow-sm border-slate-200">
        <h3 className="text-sm font-semibold mb-2">المخزون الحرج</h3>
        <ul className="text-sm space-y-1">
          <li>فلاتر 10” — <span className="text-red-600">منخفض</span></li>
          <li>مضخات RO — <span className="text-green-600">كافٍ</span></li>
          <li>حشوات كربونية — <span className="text-amber-600">قريبة للنفاد</span></li>
        </ul>
      </div>
      <div className="p-4 border rounded-2xl shadow-sm border-slate-200">
        <h3 className="text-sm font-semibold mb-2">أحدث الطلبات</h3>
        <ul className="text-sm space-y-1">
          <li>#123 — تركيب جديد — <span className="text-amber-700">قيد التنفيذ</span></li>
          <li>#124 — صيانة دورية — <span className="text-green-700">مكتمل</span></li>
          <li>#125 — فحص — <span className="text-gray-600">مجدول</span></li>
        </ul>
      </div>
    </div>

    <div className="p-4 border rounded-2xl shadow-sm border-slate-200">
      <h3 className="text-sm font-semibold mb-2">تتبع الفنيين — عرض تجريبي</h3>
      <div className="h-72 border border-dashed rounded-2xl flex items-center justify-center text-gray-500 text-sm">
        خريطة توضح موقع الفنيين والزبائن — Placeholder Map
      </div>
      <div className="flex justify-between mt-3 text-xs text-gray-500">
        <span>الفني: أحمد (متاح)</span>
        <span>الفني: خالد (في الطريق)</span>
        <span>الفني: سامي (منجز)</span>
      </div>
    </div>
  </div>
);

/***********************************
 * Tell Market — (Tablet‑first UI)
 ***********************************/
function EngineerChip({ eng, selected, onSelect }: { eng: any; selected?: boolean; onSelect?: (e: any) => void }) {
  const color = eng.status === "available" ? "bg-green-100 text-green-700" : eng.status === "busy" ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-600";
  return (
    <button onClick={() => onSelect?.(eng)} className={`w-full text-right px-3 py-3 rounded-2xl border ${selected ? "border-red-700" : "border-slate-200"} flex items-center justify-between`}>
      <div>
        <div className="font-medium">{eng.name}</div>
        <div className="text-xs text-gray-500">منطقة: {eng.area}</div>
      </div>
      <span className={`text-xs px-2 py-0.5 rounded-full ${color}`}>
        {eng.status === "available" ? "متاح" : eng.status === "busy" ? "مشغول" : "غير متصل"}
      </span>
    </button>
  );
}

const TellMarketUI = () => {
  const [leadIdx, setLeadIdx] = useState(0);
  const lead = sampleLeads[leadIdx];
  const [outcome, setOutcome] = useState(""); // bought / no / accept
  const [selectedEngineer, setSelectedEngineer] = useState<any | null>(null);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  const outcomeLabel = useMemo(() => ({ bought: "عميل سابق — صيانة", no: "غير مهتم", accept: "موافقة على فحص" })[outcome] || "", [outcome]);

  return (
    <div className="space-y-6">
      {/* شريط علوي بالهوية */}
      <div className="rounded-3xl p-4 bg-gradient-to-r from-red-800 to-red-600 text-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">Tell Market — لوحة الاتصال</h2>
            <p className="text-sm text-red-100">إدارة المكالمات، نتائجها، وحجز مواعيد الفحص للمهندسين المرتبطين</p>
          </div>
          <div className="flex gap-3">
            {kpis.map((k) => (
              <div key={k.label} className="px-3 py-2 rounded-2xl bg-white/10 text-sm">
                <div className="text-red-100">{k.label}</div>
                <div className="font-semibold">{k.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* تخطيط لوحي: قائمة عملاء يسار، مساحة المكالمة يمين */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* قائمة الداتا */}
        <div className="lg:col-span-1 p-4 border rounded-2xl shadow-sm border-slate-200 bg-white">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">القائمة المخصصة لي</h3>
            <Badge color="blue">{sampleLeads.length} عميل</Badge>
          </div>
          <ul className="space-y-2 text-sm">
            {sampleLeads.map((l, i) => (
              <li key={l.id}>
                <button onClick={() => setLeadIdx(i)} className={`w-full text-right p-3 rounded-2xl border ${leadIdx === i ? "border-red-700 bg-red-50" : "border-slate-200"}`}>
                  <div className="font-medium">{l.name}</div>
                  <div className="text-xs text-gray-500">{l.phone} · {l.area}</div>
                  {l.note && <div className="text-xs text-slate-500 mt-1">{l.note}</div>}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* مساحة المكالمة والإجراءات */}
        <div className="lg:col-span-2 p-4 border rounded-2xl shadow-sm border-slate-200 bg-white">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
            <div>
              <h3 className="font-semibold">مكالمة مع: <span className="text-red-800">{lead.name}</span></h3>
              <p className="text-sm text-gray-500">{lead.phone} · {lead.area}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setOutcome("bought")} className={`px-3 py-2 rounded-2xl border text-sm ${outcome === "bought" ? "bg-red-800 text-white border-red-800" : ""}`}>عميل سابق</button>
              <button onClick={() => setOutcome("no")} className={`px-3 py-2 rounded-2xl border text-sm ${outcome === "no" ? "bg-red-800 text-white border-red-800" : ""}`}>غير مهتم</button>
              <button onClick={() => setOutcome("accept")} className={`px-3 py-2 rounded-2xl border text-sm ${outcome === "accept" ? "bg-red-800 text-white border-red-800" : ""}`}>وافق على فحص</button>
            </div>
          </div>

          {/* عند القبول: جدولة و اختيار مهندس */}
          <div className="mt-4 grid md:grid-cols-5 gap-4">
            <div className="md:col-span-3">
              <div className="p-3 rounded-2xl border border-slate-200">
                <div className="text-sm font-semibold mb-2">جدولة فحص مجاني</div>
                <div className="grid sm:grid-cols-2 gap-2">
                  <input className="border rounded-2xl p-2" placeholder="تاريخ" value={date} onChange={(e) => setDate(e.target.value)} />
                  <input className="border rounded-2xl p-2" placeholder="وقت" value={time} onChange={(e) => setTime(e.target.value)} />
                </div>
                <div className="mt-3 text-xs text-gray-500">سيتم إرسال تأكيد للعميل عبر رسالة نصية/واتساب.</div>
              </div>

              <div className="mt-4 p-3 rounded-2xl border border-slate-200">
                <div className="text-sm font-semibold mb-2">خريطة ارتباط (وهمي)</div>
                <div className="h-48 border-dashed border rounded-2xl flex items-center justify-center text-gray-500 text-sm">مسار من موقع العميل ← إلى المهندس المختار</div>
              </div>
            </div>
            <div className="md:col-span-2">
              <div className="p-3 rounded-2xl border border-slate-200">
                <div className="text-sm font-semibold mb-2">مهندسو الفحص المرتبطون بي</div>
                <div className="space-y-2">
                  {sampleEngineers.map((e) => (
                    <EngineerChip key={e.id} eng={e} selected={selectedEngineer?.id === e.id} onSelect={setSelectedEngineer} />
                  ))}
                </div>
                <button disabled={outcome !== "accept" || !selectedEngineer || !date || !time} className={`mt-3 w-full rounded-2xl px-4 py-3 text-white ${outcome !== "accept" || !selectedEngineer || !date || !time ? "bg-red-300" : "bg-red-800 hover:bg-red-700"}`}>
                  حجز الموعد للمهندس المختار
                </button>
                {outcomeLabel && <div className="mt-2 text-xs text-gray-500">نتيجة المكالمة: <span className="font-medium text-red-800">{outcomeLabel}</span></div>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* جدول مخرجات اليوم */}
      <div className="p-4 border rounded-2xl shadow-sm border-slate-200 bg-white">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">مخرجات اليوم</h3>
          <div className="text-xs text-gray-500">قابلة للتصدير PDF</div>
        </div>
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500">
                <th className="py-2">العميل</th>
                <th className="py-2">الهاتف</th>
                <th className="py-2">المنطقة</th>
                <th className="py-2">النتيجة</th>
                <th className="py-2">المهندس</th>
                <th className="py-2">موعد الفحص</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t">
                <td className="py-2">{lead.name}</td>
                <td className="py-2">{lead.phone}</td>
                <td className="py-2">{lead.area}</td>
                <td className="py-2">{outcomeLabel || "—"}</td>
                <td className="py-2">{selectedEngineer?.name || "—"}</td>
                <td className="py-2">{date && time ? `${date} ${time}` : "—"}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

/***********************************
 * HR — لوحة الموارد البشرية (مستقلة)
 ***********************************/
const sampleApplicants = [
  { id: "A-201", name: "فهد الرشيد", role: "فني صيانة", phone: "0501122334", status: "new", interview: "—" },
  { id: "A-202", name: "ليان المطيري", role: "مهندس فحص", phone: "0556677889", status: "review", interview: "غدًا 4:00 م" },
  { id: "A-203", name: "سالم العمري", role: "موظف ريسبشن", phone: "0539988776", status: "new", interview: "—" },
];

const sampleEmployees = [
  { id: "E-901", name: "أحمد السالم", role: "فني", area: "النسيم", status: "نشط" },
  { id: "E-902", name: "نورة الحربي", role: "مهندس فحص", area: "العليا", status: "إجازة" },
  { id: "E-903", name: "هيفاء السبيعي", role: "ريسبشن", area: "المقر", status: "نشط" },
];

function StatusPill({ s }: { s: string }) {
  const map: Record<string, string> = { new: "جديد", review: "مراجعة", scheduled: "مجدول", accepted: "مقبول", rejected: "مرفوض" };
  const color = s === "accepted" ? "bg-green-100 text-green-700" : s === "rejected" ? "bg-red-100 text-red-700" : s === "scheduled" ? "bg-blue-100 text-blue-700" : s === "review" ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-700";
  return <span className={`px-2 py-0.5 rounded-full text-xs ${color}`}>{map[s] || s}</span>;
}


/***********************************
 * HR — لوحة الموارد البشرية (محدّثة)
 ***********************************/
const HRPanel = () => {
  // تبويب افتراضي يبقى "applicants" للحفاظ على السلوك السابق
  const [tab, setTab] = useState<
    | "applicants" | "employees" | "attendance" | "leaves" | "payroll"
    | "biometrics" | "timeAnalysis" | "delays" | "deductions"
    | "discipline" | "leavesApproval" | "leavesEntry" | "branchesReport"
  >("applicants");

  const [idx, setIdx] = useState(0);
  const a = sampleApplicants[idx];

  /*** بيانات وهمية إضافية لتبويبات جديدة ***/
  // 1) سحب بصمات (Raw biometrics)
  const biometricPulls = [
    { id: "BM-1001", employee: "أحمد السالم", date: "2025-10-29", in: "08:03", out: "—", device: "قارئ-مدخل1" },
    { id: "BM-1002", employee: "هيفاء السبيعي", date: "2025-10-29", in: "08:58", out: "—", device: "قارئ-مدخل1" },
    { id: "BM-1003", employee: "نورة الحربي", date: "2025-10-29", in: "—", out: "—", device: "إجازة" },
  ];

  // 2) تحليل الدوام (Aggregates)
  const scheduledStart = "08:00";
  const scheduledEnd = "17:00";
  const timeAnalysis = [
    { name: "أحمد السالم", firstIn: "08:03", lastOut: "—", lateMins: 3, overtimeMins: 0, status: "OnDuty" },
    { name: "هيفاء السبيعي", firstIn: "08:58", lastOut: "—", lateMins: 58, overtimeMins: 0, status: "Late" },
    { name: "نورة الحربي", firstIn: "—", lastOut: "—", lateMins: 0, overtimeMins: 0, status: "Leave" },
  ];

  // 3) التأخيرات
  const delaysList = [
    { name: "هيفاء السبيعي", date: "2025-10-29", lateMins: 58, justification: "ازدحام" },
    { name: "أحمد السالم", date: "2025-10-27", lateMins: 9, justification: "" },
  ];

  // 4) الخصومات والإنذارات
  const [pendingDeductions, setPendingDeductions] = useState([
    { id: "DD-5001", name: "هيفاء السبيعي", reason: "تأخير متكرر", amount: 50, type: "خصم", status: "مسودة" },
    { id: "DD-5002", name: "أحمد السالم", reason: "عدم ختم خروج", amount: 0, type: "إنذار", status: "مسودة" },
  ]);

  // 5) العقوبات/الضبوط
  const [disciplineRecords, setDisciplineRecords] = useState([
    { id: "DC-7001", name: "موظف ريسبشن", date: "2025-10-25", action: "لفت نظر", note: "سوء تواصل" },
  ]);

  // 6) موافقة الإجازات وإرسال للمدير
  const [leaveApprovals, setLeaveApprovals] = useState([
    { id: "LV-8001", name: "هيفاء السبيعي", type: "سنوية", from: "2025-11-10", to: "2025-11-14", status: "بانتظار HR" },
    { id: "LV-8002", name: "م. خالد", type: "طارئة", from: "2025-11-02", to: "2025-11-03", status: "بانتظار HR" },
  ]);

  // 7) إدخال الإجازات المعتمدة
  const [approvedLeaves, setApprovedLeaves] = useState([
    { id: "AP-9001", name: "نورة الحربي", type: "سنوية", from: "2025-10-29", to: "2025-10-30" },
  ]);

  // 8) تقرير يومي للفروع / إعداد قرارات
  const branches = ["المقر الرئيسي", "فرع الصناعية", "فرع العليا"];
  const [selectedBranch, setSelectedBranch] = useState(branches[0]);
  const branchDaily = [
    { branch: "المقر الرئيسي", date: "2025-10-29", present: 14, absent: 2, late: 3, notes: "يوم عمل اعتيادي" },
    { branch: "فرع الصناعية", date: "2025-10-29", present: 6, absent: 1, late: 1, notes: "ضغط عمل متوسط" },
    { branch: "فرع العليا", date: "2025-10-29", present: 4, absent: 0, late: 0, notes: "سير طبيعي" },
  ];

  // أدوات مصغّرة
  const pillForStatus = (s: string) =>
    s === "مسودة" ? <Badge color="gray">مسودة</Badge> :
    s === "بانتظار HR" ? <Badge color="yellow">بانتظار HR</Badge> :
    s === "أُرسل للمدير" ? <Badge color="blue">أُرسل للمدير</Badge> :
    s === "مقبول" ? <Badge color="green">مقبول</Badge> :
    s === "مرفوض" ? <Badge color="red">مرفوض</Badge> : <Badge color="gray">{s}</Badge>;

  return (
    <div className="space-y-6">
      {/* رأس الهوية + التبوّبات */}
      <div className="rounded-3xl p-4 bg-gradient-to-r from-red-800 to-red-600 text-white">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">الموارد البشرية — HR</h2>
            <p className="text-sm text-red-100">التوظيف · الموظفون · البصمات/الدوام · التأخيرات · الخصومات/العقوبات · الإجازات · الرواتب · تقارير الفروع</p>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {[
            { key: "applicants", label: "المتقدّمون" },
            { key: "employees", label: "الموظفون" },
            { key: "biometrics", label: "سحب البصمات" },
            { key: "timeAnalysis", label: "تحليل الدوام" },
            { key: "deductions", label: "الخصومات/الإنذارات" },
            { key: "discipline", label: "العقوبات/الضبوط" },
            { key: "leavesApproval", label: "إجازات (اعتماد/مدير)" },
            { key: "leavesEntry", label: "إدخال الإجازات" },
            { key: "attendance", label: "الحضور" },
            { key: "leaves", label: "الإجازات (عرض)" },
            { key: "payroll", label: "الرواتب" },
            { key: "branchesReport", label: "تقرير الفروع" },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key as any)}
              className={`px-3 py-1.5 rounded-2xl text-sm ${tab === t.key ? "bg-white text-red-800" : "bg-white/10 text-white"}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* المتقدّمون (كما هو) */}
      {tab === "applicants" && (
        <div className="grid lg:grid-cols-3 gap-4">
          <div className="lg:col-span-1 p-4 border rounded-2xl shadow-sm border-slate-200 bg-white">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">قائمة المتقدّمين</h3>
              <Badge color="blue">{sampleApplicants.length} ملف</Badge>
            </div>
            <ul className="space-y-2 text-sm">
              {sampleApplicants.map((c, i) => (
                <li key={c.id}>
                  <button onClick={() => setIdx(i)} className={`w-full text-right p-3 rounded-2xl border ${idx === i ? "border-red-700 bg-red-50" : "border-slate-200"}`}>
                    <div className="flex items-center justify-between">
                      <div className="font-medium">{c.name}</div>
                      <StatusPill s={c.status} />
                    </div>
                    <div className="text-xs text-gray-500">{c.role} · {c.phone}</div>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-2 p-4 border rounded-2xl shadow-sm border-slate-200 bg-white">
            <h3 className="font-semibold text-red-800 mb-2">{a.name} — {a.role}</h3>
            <div className="text-sm text-gray-600 mb-4">الهاتف: {a.phone} · الحالة: <StatusPill s={a.status} /> · المقابلة: {a.interview}</div>

            <div className="grid md:grid-cols-2 gap-3 mb-4">
              <div className="p-3 border rounded-2xl">
                <div className="text-sm font-semibold mb-2">جدولة مقابلة</div>
                <div className="grid grid-cols-2 gap-2">
                  <input type="date" className="border rounded-2xl p-2" />
                  <input type="time" className="border rounded-2xl p-2" />
                </div>
                <button className="mt-3 w-full rounded-2xl px-4 py-2 bg-red-800 text-white">حفظ الموعد</button>
              </div>
              <div className="p-3 border rounded-2xl">
                <div className="text-sm font-semibold mb-2">قرار بعد المقابلة</div>
                <div className="flex gap-2">
                  <button className="rounded-2xl px-3 py-2 border">رفض</button>
                  <button className="rounded-2xl px-3 py-2 border">قيد المراجعة</button>
                  <button className="rounded-2xl px-3 py-2 bg-red-800 text-white">اعتماد وإرسال للمدير</button>
                </div>
              </div>
            </div>

            <div className="p-3 border rounded-2xl">
              <div className="text-sm font-semibold mb-2">قائمة التحقق للتعيين (Onboarding)</div>
              <ul className="text-sm space-y-2">
                <li><input type="checkbox" className="mr-2" /> هوية/إقامة</li>
                <li><input type="checkbox" className="mr-2" /> شهادات وخبرات</li>
                <li><input type="checkbox" className="mr-2" /> فحص طبي</li>
                <li><input type="checkbox" className="mr-2" /> توقيع عقد العمل</li>
              </ul>
              <button className="mt-3 rounded-2xl px-4 py-2 border">تحويل إلى موظف</button>
            </div>
          </div>
        </div>
      )}

      {/* الموظفون (كما هو) */}
      {tab === "employees" && (
        <div className="p-4 border rounded-2xl shadow-sm border-slate-200 bg-white">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">دليل الموظفين</h3>
            <input className="border rounded-2xl p-2 text-sm" placeholder="بحث بالاسم/الدور/المنطقة" />
          </div>
          <div className="grid md:grid-cols-3 gap-3">
            {sampleEmployees.map((e) => (
              <div key={e.id} className="p-3 border rounded-2xl">
                <div className="font-medium">{e.name}</div>
                <div className="text-sm text-gray-600">{e.role} · {e.area}</div>
                <div className="text-xs mt-1"><Badge color={e.status === "نشط" ? "green" : "yellow"}>{e.status}</Badge></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 1) سحب البصمات */}
      {tab === "biometrics" && (
        <div className="p-4 border rounded-2xl shadow-sm bg-white">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">سحب بصمات — اليوم</h3>
            <div className="text-xs text-gray-500">قارئات متعددة | تصدير CSV/PDF لاحقاً</div>
          </div>
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500">
                  <th className="py-2">#</th><th className="py-2">الموظف</th><th className="py-2">التاريخ</th><th className="py-2">دخول</th><th className="py-2">خروج</th><th className="py-2">الجهاز</th>
                </tr>
              </thead>
              <tbody>
                {biometricPulls.map(r => (
                  <tr key={r.id} className="border-t">
                    <td className="py-2">{r.id}</td><td className="py-2">{r.employee}</td><td className="py-2">{r.date}</td><td className="py-2">{r.in}</td><td className="py-2">{r.out}</td><td className="py-2">{r.device}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2) تحليل الدوام */}
      {tab === "timeAnalysis" && (
        <div className="p-4 border rounded-2xl shadow-sm bg-white">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">تحليل الدوام</h3>
            <div className="text-xs text-gray-500">المجدول: {scheduledStart}–{scheduledEnd}</div>
          </div>
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500">
                  <th className="py-2">الموظف</th><th className="py-2">أول دخول</th><th className="py-2">آخر خروج</th><th className="py-2">تأخير (دقائق)</th><th className="py-2">ساعات إضافية (دقائق)</th><th className="py-2">الحالة</th>
                </tr>
              </thead>
              <tbody>
                {timeAnalysis.map(r => (
                  <tr key={r.name} className="border-t">
                    <td className="py-2">{r.name}</td><td className="py-2">{r.firstIn}</td><td className="py-2">{r.lastOut}</td>
                    <td className="py-2">{r.lateMins}</td><td className="py-2">{r.overtimeMins}</td>
                    <td className="py-2">{r.status === "Late" ? <Badge color="yellow">متأخر</Badge> : r.status === "Leave" ? <Badge color="blue">إجازة</Badge> : <Badge color="green">على رأس العمل</Badge>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}



      {/* 4) الخصومات والإنذارات */}
      {tab === "deductions" && (
        <div className="grid md:grid-cols-3 gap-4">
          <div className="md:col-span-2 p-4 border rounded-2xl shadow-sm bg-white">
            <h3 className="font-semibold mb-3">قائمة الخصومات/الإنذارات (مسودات)</h3>
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-left text-gray-500"><th className="py-2">#</th><th className="py-2">الموظف</th><th className="py-2">السبب</th><th className="py-2">النوع</th><th className="py-2">القيمة</th><th className="py-2">الحالة</th><th className="py-2">إجراء</th></tr></thead>
                <tbody>
                  {pendingDeductions.map(r => (
                    <tr key={r.id} className="border-t">
                      <td className="py-2">{r.id}</td><td className="py-2">{r.name}</td><td className="py-2">{r.reason}</td>
                      <td className="py-2">{r.type}</td><td className="py-2">{r.amount || "—"}</td><td className="py-2">{pillForStatus(r.status)}</td>
                      <td className="py-2">
                        <button className="px-2 py-1 rounded-xl border text-xs mr-1" onClick={()=>{
                          setPendingDeductions(prev=>prev.map(p=>p.id===r.id?{...p,status:"أُرسل للمدير"}:p));
                        }}>إرسال للمدير</button>
                        <button className="px-2 py-1 rounded-xl border text-xs" onClick={()=>{
                          setPendingDeductions(prev=>prev.filter(p=>p.id!==r.id));
                        }}>حذف</button>
                      </td>
                    </tr>
                  ))}
                  {!pendingDeductions.length && <tr><td colSpan={7} className="text-center text-xs text-gray-500 py-6">لا توجد مسودات</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
          <div className="p-4 border rounded-2xl shadow-sm bg-white">
            <h4 className="font-semibold mb-2">إضافة خصم/إنذار</h4>
            <div className="grid grid-cols-1 gap-2 text-sm">
              <input className="border rounded-2xl p-2" id="dd-name" placeholder="اسم الموظف" />
              <select className="border rounded-2xl p-2" id="dd-type"><option>خصم</option><option>إنذار</option></select>
              <input className="border rounded-2xl p-2" id="dd-reason" placeholder="السبب" />
              <input className="border rounded-2xl p-2" id="dd-amount" placeholder="القيمة (اختياري)" />
              <button className="rounded-2xl px-4 py-2 bg-red-800 text-white"
                onClick={()=>{
                  const name = (document.getElementById("dd-name") as HTMLInputElement).value || "موظف مجهول";
                  const type = (document.getElementById("dd-type") as HTMLSelectElement).value;
                  const reason = (document.getElementById("dd-reason") as HTMLInputElement).value || "—";
                  const amount = Number((document.getElementById("dd-amount") as HTMLInputElement).value)||0;
                  const id = `DD-${Math.floor(Math.random()*9000)+1000}`;
                  setPendingDeductions(prev=>[{ id, name, reason, amount, type, status:"مسودة" }, ...prev]);
                }}
              >حفظ كمسودة</button>
            </div>
          </div>
        </div>
      )}

      {/* 5) العقوبات/الضبوط */}
      {tab === "discipline" && (
        <div className="grid md:grid-cols-3 gap-4">
          <div className="md:col-span-2 p-4 border rounded-2xl shadow-sm bg-white">
            <h3 className="font-semibold mb-3">سجل العقوبات/الضبوط</h3>
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-left text-gray-500"><th className="py-2">#</th><th className="py-2">الموظف</th><th className="py-2">التاريخ</th><th className="py-2">الإجراء</th><th className="py-2">ملاحظة</th></tr></thead>
                <tbody>
                  {disciplineRecords.map(r => (
                    <tr key={r.id} className="border-t">
                      <td className="py-2">{r.id}</td><td className="py-2">{r.name}</td><td className="py-2">{r.date}</td><td className="py-2">{r.action}</td><td className="py-2">{r.note}</td>
                    </tr>
                  ))}
                  {!disciplineRecords.length && <tr><td colSpan={5} className="text-center text-xs text-gray-500 py-6">لا يوجد سجلات</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
          <div className="p-4 border rounded-2xl shadow-sm bg-white">
            <h4 className="font-semibold mb-2">تسجيل ضبط/عقوبة</h4>
            <div className="grid grid-cols-1 gap-2 text-sm">
              <input className="border rounded-2xl p-2" id="dc-name" placeholder="اسم الموظف" />
              <input className="border rounded-2xl p-2" id="dc-date" type="date" />
              <input className="border rounded-2xl p-2" id="dc-action" placeholder="نوع الإجراء (لفت نظر/إنذار/خصم...)" />
              <input className="border rounded-2xl p-2" id="dc-note" placeholder="ملاحظة" />
              <button className="rounded-2xl px-4 py-2 bg-red-800 text-white"
                onClick={()=>{
                  const id = `DC-${Math.floor(Math.random()*9000)+1000}`;
                  const name = (document.getElementById("dc-name") as HTMLInputElement).value || "—";
                  const date = (document.getElementById("dc-date") as HTMLInputElement).value || new Date().toISOString().slice(0,10);
                  const action = (document.getElementById("dc-action") as HTMLInputElement).value || "إجراء";
                  const note = (document.getElementById("dc-note") as HTMLInputElement).value || "";
                  setDisciplineRecords(prev=>[{ id, name, date, action, note }, ...prev]);
                }}
              >حفظ</button>
            </div>
          </div>
        </div>
      )}

      {/* 6) الإجازات — موافقة وإرسال للمدير */}
      {tab === "leavesApproval" && (
        <div className="p-4 border rounded-2xl shadow-sm bg-white">
          <h3 className="font-semibold mb-3">طلبات الإجازة — اعتماد HR ثم إرسال للمدير</h3>
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-gray-500"><th className="py-2">#</th><th className="py-2">الموظف</th><th className="py-2">النوع</th><th className="py-2">من</th><th className="py-2">إلى</th><th className="py-2">الحالة</th><th className="py-2">إجراء</th></tr></thead>
              <tbody>
                {leaveApprovals.map(r => (
                  <tr key={r.id} className="border-t">
                    <td className="py-2">{r.id}</td><td className="py-2">{r.name}</td><td className="py-2">{r.type}</td>
                    <td className="py-2">{r.from}</td><td className="py-2">{r.to}</td><td className="py-2">{pillForStatus(r.status)}</td>
                    <td className="py-2">
                      <button className="px-2 py-1 rounded-xl border text-xs mr-1" onClick={()=>{
                        setLeaveApprovals(prev=>prev.map(p=>p.id===r.id?{...p,status:"أُرسل للمدير"}:p));
                      }}>إرسال للمدير</button>
                      <button className="px-2 py-1 rounded-xl border text-xs mr-1" onClick={()=>{
                        setLeaveApprovals(prev=>prev.map(p=>p.id===r.id?{...p,status:"مقبول"}:p));
                      }}>اعتماد HR</button>
                      <button className="px-2 py-1 rounded-xl border text-xs" onClick={()=>{
                        setLeaveApprovals(prev=>prev.map(p=>p.id===r.id?{...p,status:"مرفوض"}:p));
                      }}>رفض</button>
                    </td>
                  </tr>
                ))}
                {!leaveApprovals.length && <tr><td colSpan={7} className="text-center text-xs text-gray-500 py-6">لا توجد طلبات</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 7) إدخال الإجازات الموافقة */}
      {tab === "leavesEntry" && (
        <div className="grid md:grid-cols-3 gap-4">
          <div className="md:col-span-2 p-4 border rounded-2xl shadow-sm bg-white">
            <h3 className="font-semibold mb-3">الإجازات المعتمدة (إدخال/تحرير)</h3>
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-left text-gray-500"><th className="py-2">#</th><th className="py-2">الموظف</th><th className="py-2">النوع</th><th className="py-2">من</th><th className="py-2">إلى</th></tr></thead>
                <tbody>
                  {approvedLeaves.map(l => (
                    <tr key={l.id} className="border-t">
                      <td className="py-2">{l.id}</td><td className="py-2">{l.name}</td><td className="py-2">{l.type}</td><td className="py-2">{l.from}</td><td className="py-2">{l.to}</td>
                    </tr>
                  ))}
                  {!approvedLeaves.length && <tr><td colSpan={5} className="text-center text-xs text-gray-500 py-6">لا توجد إجازات</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
          <div className="p-4 border rounded-2xl shadow-sm bg-white">
            <h4 className="font-semibold mb-2">إضافة إجازة معتمدة</h4>
            <div className="grid grid-cols-1 gap-2 text-sm">
              <input id="ap-name" className="border rounded-2xl p-2" placeholder="اسم الموظف" />
              <select id="ap-type" className="border rounded-2xl p-2"><option>سنوية</option><option>طارئة</option><option>بدون راتب</option></select>
              <input id="ap-from" type="date" className="border rounded-2xl p-2" />
              <input id="ap-to" type="date" className="border rounded-2xl p-2" />
              <button className="rounded-2xl px-4 py-2 bg-red-800 text-white"
                onClick={()=>{
                  const id = `AP-${Math.floor(Math.random()*9000)+1000}`;
                  const name = (document.getElementById("ap-name") as HTMLInputElement).value || "—";
                  const type = (document.getElementById("ap-type") as HTMLSelectElement).value;
                  const from = (document.getElementById("ap-from") as HTMLInputElement).value || new Date().toISOString().slice(0,10);
                  const to = (document.getElementById("ap-to") as HTMLInputElement).value || from;
                  setApprovedLeaves(prev=>[{ id, name, type, from, to }, ...prev]);
                }}
              >حفظ</button>
            </div>
          </div>
        </div>
      )}

      {/* الحضور (كما كان) */}
      {tab === "attendance" && (
        <div className="p-4 border rounded-2xl shadow-sm border-slate-200 bg-white">
          <h3 className="font-semibold mb-3">الحضور اليومي</h3>
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500">
                  <th className="py-2">الموظف</th>
                  <th className="py-2">الدور</th>
                  <th className="py-2">بداية الدوام</th>
                  <th className="py-2">نهاية الدوام</th>
                  <th className="py-2">ملاحظات</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t">
                  <td className="py-2">أحمد السالم</td>
                  <td className="py-2">فني</td>
                  <td className="py-2">08:03</td>
                  <td className="py-2">—</td>
                  <td className="py-2">جولة صباحية</td>
                </tr>
                <tr className="border-t">
                  <td className="py-2">نورة الحربي</td>
                  <td className="py-2">مهندس فحص</td>
                  <td className="py-2">—</td>
                  <td className="py-2">—</td>
                  <td className="py-2">إجازة</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* الإجازات (عرض مختصر كما كان) */}
      {tab === "leaves" && (
        <div className="p-4 border rounded-2xl shadow-sm border-slate-200 bg-white">
          <h3 className="font-semibold mb-3">طلبات الإجازة (عرض)</h3>
          <ul className="space-y-2 text-sm">
            <li className="p-3 border rounded-2xl flex items-center justify-between">
              <div>
                <div className="font-medium">هيفاء السبيعي</div>
                <div className="text-xs text-gray-500">من 10-11 إلى 14-11 · سنوية</div>
              </div>
              <div className="flex gap-2">
                <button className="rounded-2xl px-3 py-1.5 border">رفض</button>
                <button className="rounded-2xl px-3 py-1.5 bg-red-800 text-white">اعتماد</button>
              </div>
            </li>
          </ul>
        </div>
      )}

      {/* الرواتب (كما كان) */}
      {tab === "payroll" && (
        <div className="p-4 border rounded-2xl shadow-sm border-slate-200 bg-white">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">الرواتب — معاينة شهرية</h3>
            <select className="border rounded-2xl p-2 text-sm">
              <option>نوفمبر 2025</option>
              <option>أكتوبر 2025</option>
            </select>
          </div>
          <div className="grid md:grid-cols-3 gap-3 text-sm">
            <div className="p-3 border rounded-2xl">
              <div className="text-gray-500">عدد الموظفين</div>
              <div className="text-xl font-semibold">32</div>
            </div>
            <div className="p-3 border rounded-2xl">
              <div className="text-gray-500">إجمالي الرواتب</div>
              <div className="text-xl font-semibold">182,000</div>
            </div>
            <div className="p-3 border rounded-2xl">
              <div className="text-gray-500">حوافز الفنيين</div>
              <div className="text-xl font-semibold">18,500</div>
            </div>
          </div>
          <button className="mt-4 rounded-2xl px-4 py-2 bg-red-800 text-white">توليد ملف الرواتب (PDF)</button>
        </div>
      )}

      {/* 8) تقرير يومي للفروع — إعداد قرارات */}
      {tab === "branchesReport" && (
        <div className="p-4 border rounded-2xl shadow-sm bg-white">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">تقرير يومي للفروع</h3>
            <div className="flex items-center gap-2">
              <select className="border rounded-2xl p-2 text-sm" value={selectedBranch} onChange={(e)=>setSelectedBranch(e.target.value)}>
                {branches.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
              <button className="px-3 py-2 rounded-2xl border text-sm">تصدير PDF</button>
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-3 text-sm">
            {branchDaily.filter(b=>b.branch===selectedBranch).map(b => (
              <div key={b.branch} className="md:col-span-3 p-3 border rounded-2xl">
                <div className="text-gray-600">{b.branch} — {b.date}</div>
                <div className="mt-2 grid grid-cols-4 gap-2">
                  <div className="p-2 border rounded-xl text-center"><div className="text-gray-500">حاضر</div><div className="text-xl font-semibold">{b.present}</div></div>
                  <div className="p-2 border rounded-xl text-center"><div className="text-gray-500">غياب</div><div className="text-xl font-semibold">{b.absent}</div></div>
                  <div className="p-2 border rounded-xl text-center"><div className="text-gray-500">تأخير</div><div className="text-xl font-semibold">{b.late}</div></div>
                  <div className="p-2 border rounded-xl text-center"><div className="text-gray-500">ملاحظات</div><div className="font-medium">{b.notes}</div></div>
                </div>
                <div className="mt-3">
                  <div className="text-sm font-semibold mb-1">إعداد قرارات اليوم</div>
                  <div className="grid md:grid-cols-2 gap-2">
                    <input className="border rounded-2xl p-2" placeholder="قرار 1 (مثال: تكثيف الرقابة على البصمة)" />
                    <input className="border rounded-2xl p-2" placeholder="قرار 2 (مثال: تدوير مهام الاستقبال)" />
                  </div>
                  <button className="mt-2 px-4 py-2 rounded-2xl bg-red-800 text-white">حفظ القرارات</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/***********************************
 * Accounting — لوحة المحاسبة
 ***********************************/
/***********************************
 * Accounting — لوحة المحاسبة (موسّعة)
 ***********************************/
function AccountingPanel() {
  // تبويبات مالية رئيسية (كما هي) + تبويبات تشغيلية جديدة
  const [tab, setTab] = useState<
    | "sales" | "receivables" | "expenses" | "payables" | "cashbank" | "reports" | "settings"
    | "ops_receipts_intake"        // 1) استلام إيصالات الصيانة/العقود/الأقساط
    | "ops_cashbox_in"             // 2) إدخال المبالغ للصندوق
    | "ops_cashbox_report"         // 3) طباعة كشف الصندوق
    | "ops_installments_collected" // 4) إدخال أقساط محصّلة + نسخة للريسبشن
    | "ops_install_sheet_audit"    // 5) تدقيق ورقة التركيبات
    | "ops_contracts_entry"        // 6) إدخال العقود (التراكيب)
    | "ops_reception_audit"        // 7) تشييك إدخالات/إخراجات الريسبشن
    | "ops_warehouse_follow"       // 8) متابعة حركة المستودع
    | "ops_new_staff_cards"        // 9) إدخال بطاقة الموظفين الجدد
    | "ops_bank_recon"             // 10) مطابقة حركة البنوك
    | "ops_purchase_invoices"      // 11) إدخال فواتير المشتريات
    | "ops_ledger_check"           // 12) دفاتر الأقساط + الصيانات المنتهية
    | "ops_biometrics_check"       // 13) تشييك البصمات (الدوام)
    | "ops_statutory_deductions"   // 14) خصم التأمينات + سيريتل
    | "ops_commissions"            // 15) العمولات
    | "ops_advances"               // 16) السلف
    | "ops_owner_file_match"       // 17) مطابقة ملف صاحب الشركة
  >("sales");

  // نماذج بيانات وهمية سريعة
  const receiptTypes = ["صيانة", "عقد تركيب", "قسط"] as const;
  const payMethods = ["نقدي", "تحويل", "نقاط بيع", "شيك", "QR"] as const;

  return (
    <div className="space-y-6">
      {/* رأس اللوحة + تبويبات مالية رئيسية */}
      <div className="rounded-3xl p-4 bg-gradient-to-r from-red-800 to-red-600 text-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">المحاسبة</h2>
            <p className="text-sm text-red-100">فواتير · تحصيلات · مصروفات · صندوق/بنك · تقارير</p>
          </div>
          <div className="flex flex-wrap gap-2 text-sm">
            {[
              {key:"sales",label:"فواتير المبيعات"},
              {key:"receivables",label:"التحصيلات والعملاء"},
              {key:"expenses",label:"المصروفات"},
              {key:"payables",label:"الموردون"},
              {key:"cashbank",label:"الصندوق والبنك"},
              {key:"reports",label:"التقارير"},
              {key:"settings",label:"الإعدادات"},
            ].map(t => (
              <button key={t.key} onClick={()=>setTab(t.key as any)} className={`px-3 py-1.5 rounded-2xl ${tab===t.key?"bg-white text-red-800":"bg-white/10 text-white"}`}>{t.label}</button>
            ))}
          </div>
        </div>

        {/* شريط المهام التشغيلية (الـ 17 بند) */}
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          {[
            {k:"ops_receipts_intake",l:"استلام إيصالات (صيانة/عقود/أقساط)"},
            {k:"ops_cashbox_in",l:"إدخال للصندوق"},
            {k:"ops_cashbox_report",l:"كشف الصندوق"},
            {k:"ops_installments_collected",l:"تحصيل أقساط → ريسبشن"},
            {k:"ops_install_sheet_audit",l:"تدقيق ورقة التركيبات"},
            {k:"ops_contracts_entry",l:"إدخال عقود التراكيب"},
            {k:"ops_reception_audit",l:"تشييك مدخلات الريسبشن"},
            {k:"ops_warehouse_follow",l:"متابعة المستودع"},
            {k:"ops_new_staff_cards",l:"بطاقات موظفين جدد"},
            {k:"ops_bank_recon",l:"مطابقة البنوك"},
            {k:"ops_purchase_invoices",l:"فواتير مشتريات"},
            {k:"ops_ledger_check",l:"دفاتر أقساط/صيانات منتهية"},
            {k:"ops_biometrics_check",l:"تشييك البصمات"},
            {k:"ops_statutory_deductions",l:"خصم تأمينات + سيريتل"},
            {k:"ops_commissions",l:"العمولات"},
            {k:"ops_advances",l:"السلف"},
            {k:"ops_owner_file_match",l:"مطابقة ملف المالك"},
          ].map(t => (
            <button key={t.k} onClick={()=>setTab(t.k as any)} className={`px-3 py-1.5 rounded-2xl border ${tab===t.k?"bg-white text-red-800 border-white":"bg-white/10 text-white border-white/30"}`}>{t.l}</button>
          ))}
        </div>
      </div>

      {/* --- التبويبات المالية الأصلية (كما هي) --- */}
      {tab === "sales" && (
        <div className="grid lg:grid-cols-3 gap-4">
          <div className="p-4 border rounded-2xl shadow-sm bg-white lg:col-span-2">
            <h3 className="font-semibold text-red-800 mb-3">فواتير المبيعات</h3>
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500">
                    <th className="py-2">#</th>
                    <th className="py-2">العميل</th>
                    <th className="py-2">الوصف</th>
                    <th className="py-2">الإجمالي</th>
                    <th className="py-2">الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t"><td className="py-2">INV-1001</td><td className="py-2">شركة دار الماء</td><td className="py-2">تركيب فلتر RO</td><td className="py-2">2,300</td><td className="py-2"><Badge color="yellow">غير مدفوع</Badge></td></tr>
                  <tr className="border-t"><td className="py-2">INV-1002</td><td className="py-2">أحمد علي</td><td className="py-2">صيانة دورية</td><td className="py-2">180</td><td className="py-2"><Badge color="green">مدفوع</Badge></td></tr>
                </tbody>
              </table>
            </div>
          </div>
          <div className="p-4 border rounded-2xl shadow-sm bg-white">
            <h4 className="font-semibold mb-2">إجراءات سريعة</h4>
            <div className="space-y-2">
              <button className="w-full rounded-2xl px-4 py-2 bg-red-800 text-white">إصدار فاتورة جديدة</button>
              <button className="w-full rounded-2xl px-4 py-2 border">فاتورة سريعة (POS/QR)</button>
              <button className="w-full rounded-2xl px-4 py-2 border">مسودة عرض سعر ← تحويل لفاتورة</button>
            </div>
          </div>
        </div>
      )}

      {tab === "receivables" && (
        <div className="grid lg:grid-cols-3 gap-4">
          <div className="p-4 border rounded-2xl shadow-sm bg-white lg:col-span-2">
            <h3 className="font-semibold text-red-800 mb-3">التحصيلات وكشف حساب العملاء</h3>
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500">
                    <th className="py-2">العميل</th>
                    <th className="py-2">الرصيد</th>
                    <th className="py-2">أقدم فاتورة</th>
                    <th className="py-2">أعمار الديون</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t"><td className="py-2">شركة دار الماء</td><td className="py-2">3,100</td><td className="py-2">40 يوم</td><td className="py-2">0-30: 0 · 31-60: 3,100</td></tr>
                  <tr className="border-t"><td className="py-2">أحمد علي</td><td className="py-2">0</td><td className="py-2">—</td><td className="py-2">—</td></tr>
                </tbody>
              </table>
            </div>
          </div>
          <div className="p-4 border rounded-2xl shadow-sm bg-white">
            <h4 className="font-semibold mb-2">تسجيل تحصيل</h4>
            <div className="grid grid-cols-1 gap-2 text-sm">
              <input className="border rounded-2xl p-2" placeholder="اسم العميل" />
              <input className="border rounded-2xl p-2" placeholder="المبلغ" />
              <select className="border rounded-2xl p-2">{payMethods.map(m => <option key={m}>{m}</option>)}</select>
              <button className="rounded-2xl px-4 py-2 bg-red-800 text-white">حفظ التحصيل</button>
            </div>
          </div>
        </div>
      )}

      {tab === "expenses" && (
        <div className="grid lg:grid-cols-3 gap-4">
          <div className="p-4 border rounded-2xl shadow-sm bg-white lg:col-span-2">
            <h3 className="font-semibold text-red-800 mb-3">المصروفات التشغيلية</h3>
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500">
                    <th className="py-2">التاريخ</th>
                    <th className="py-2">البند</th>
                    <th className="py-2">الوصف</th>
                    <th className="py-2">المبلغ</th>
                    <th className="py-2">مركز التكلفة</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t"><td className="py-2">2025-10-25</td><td className="py-2">وقود سيارات</td><td className="py-2">جولات فنيين</td><td className="py-2">950</td><td className="py-2">الصيانة</td></tr>
                  <tr className="border-t"><td className="py-2">2025-10-24</td><td className="py-2">مطبوعات</td><td className="py-2">نشرات تسويقية</td><td className="py-2">320</td><td className="py-2">التسويق</td></tr>
                </tbody>
              </table>
            </div>
          </div>
          <div className="p-4 border rounded-2xl shadow-sm bg-white">
            <h4 className="font-semibold mb-2">إضافة مصروف</h4>
            <div className="grid grid-cols-1 gap-2 text-sm">
              <input className="border rounded-2xl p-2" placeholder="البند" />
              <input className="border rounded-2xl p-2" placeholder="الوصف" />
              <input className="border rounded-2xl p-2" placeholder="المبلغ" />
              <select className="border rounded-2xl p-2"><option>الصيانة</option><option>التركيب</option><option>التسويق</option><option>إداري</option></select>
              <button className="rounded-2xl px-4 py-2 bg-red-800 text-white">حفظ المصروف</button>
            </div>
          </div>
        </div>
      )}

      {tab === "payables" && (
        <div className="grid lg:grid-cols-3 gap-4">
          <div className="p-4 border rounded-2xl shadow-sm bg-white lg:col-span-2">
            <h3 className="font-semibold text-red-800 mb-3">الموردون وحساباتهم</h3>
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500">
                    <th className="py-2">المورد</th>
                    <th className="py-2">الرصيد</th>
                    <th className="py-2">آخر فاتورة</th>
                    <th className="py-2">طريقة السداد</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t"><td className="py-2">مورد فلاتر الخليج</td><td className="py-2">12,450</td><td className="py-2">2025-10-20</td><td className="py-2">تحويل</td></tr>
                  <tr className="border-t"><td className="py-2">مصنع مضخات RO</td><td className="py-2">7,800</td><td className="py-2">2025-10-18</td><td className="py-2">شيك</td></tr>
                </tbody>
              </table>
            </div>
          </div>
          <div className="p-4 border rounded-2xl shadow-sm bg-white">
            <h4 className="font-semibold mb-2">تسديد لمورد</h4>
            <div className="grid grid-cols-1 gap-2 text-sm">
              <input className="border rounded-2xl p-2" placeholder="اسم المورد" />
              <input className="border rounded-2xl p-2" placeholder="المبلغ" />
              <select className="border rounded-2xl p-2"><option>تحويل</option><option>شيك</option><option>نقدي</option></select>
              <button className="rounded-2xl px-4 py-2 bg-red-800 text-white">تسجيل السداد</button>
            </div>
          </div>
        </div>
      )}

      {tab === "cashbank" && (
        <div className="grid lg:grid-cols-3 gap-4">
          <div className="p-4 border rounded-2xl shadow-sm bg-white lg:col-span-2">
            <h3 className="font-semibold text-red-800 mb-3">الصندوق والبنك</h3>
            <div className="grid md:grid-cols-2 gap-3 text-sm">
              <div className="p-3 border rounded-2xl"><div className="text-gray-500">رصيد الصندوق</div><div className="text-xl font-semibold">4,650</div></div>
              <div className="p-3 border rounded-2xl"><div className="text-gray-500">رصيد البنك</div><div className="text-xl font-semibold">92,300</div></div>
            </div>
            <div className="mt-3 overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500"><th className="py-2">التاريخ</th><th className="py-2">الوصف</th><th className="py-2">مدين</th><th className="py-2">دائن</th></tr>
                </thead>
                <tbody>
                  <tr className="border-t"><td className="py-2">2025-10-27</td><td className="py-2">تحصيل نقدي</td><td className="py-2">1,200</td><td className="py-2">—</td></tr>
                  <tr className="border-t"><td className="py-2">2025-10-26</td><td className="py-2">سداد مورد</td><td className="py-2">—</td><td className="py-2">2,000</td></tr>
                </tbody>
              </table>
            </div>
          </div>
          <div className="p-4 border rounded-2xl shadow-sm bg-white">
            <h4 className="font-semibold mb-2">قيود يومية سريعة</h4>
            <div className="grid grid-cols-1 gap-2 text-sm">
              <input className="border rounded-2xl p-2" placeholder="الوصف" />
              <div className="grid grid-cols-2 gap-2">
                <input className="border rounded-2xl p-2" placeholder="مدين" />
                <input className="border rounded-2xl p-2" placeholder="دائن" />
              </div>
              <button className="rounded-2xl px-4 py-2 bg-red-800 text-white">إضافة القيد</button>
            </div>
          </div>
        </div>
      )}

      {tab === "reports" && (
        <div className="p-4 border rounded-2xl shadow-sm bg-white">
          <h3 className="font-semibold text-red-800 mb-3">التقارير المالية</h3>
          <ul className="text-sm space-y-2">
            <li>قائمة الدخل (يومي/شهري/ربعي)</li>
            <li>الميزانية العمومية</li>
            <li>تقارير أعمار الديون للعملاء</li>
            <li>تقارير المصروفات حسب مراكز التكلفة</li>
            <li>تقرير أداء الفنيين (إيراد/زيارة/متوسط تذكرة)</li>
          </ul>
          <button className="mt-3 rounded-2xl px-4 py-2 border">تصدير PDF/Excel</button>
        </div>
      )}

      {tab === "settings" && (
        <div className="p-4 border rounded-2xl shadow-sm bg-white">
          <h3 className="font-semibold text-red-800 mb-3">الإعدادات</h3>
          <div className="grid md:grid-cols-3 gap-3 text-sm">
            <div className="p-3 border rounded-2xl">
              <div className="font-medium mb-1">الضرائب</div>
              <p className="text-gray-600">تعريف نسبة الضريبة وضريبة الشراء</p>
              <button className="mt-2 rounded-2xl px-3 py-1.5 border">تعديل</button>
            </div>
            <div className="p-3 border rounded-2xl">
              <div className="font-medium mb-1">طرق الدفع</div>
              <p className="text-gray-600">نقدي، تحويل، نقاط بيع، QR</p>
              <button className="mt-2 rounded-2xl px-3 py-1.5 border">تعديل</button>
            </div>
            <div className="p-3 border rounded-2xl">
              <div className="font-medium mb-1">مراكز التكلفة</div>
              <p className="text-gray-600">صيانة، تركيب، تسويق، إداري</p>
              <button className="mt-2 rounded-2xl px-3 py-1.5 border">تعديل</button>
            </div>
          </div>
        </div>
      )}

      {/* --- تبويبات المهام التشغيلية الجديدة --- */}

      {/* 1) استلام إيصالات الصيانة/العقود/الأقساط */}
      {tab === "ops_receipts_intake" && (
        <div className="grid md:grid-cols-3 gap-4">
          <div className="md:col-span-2 p-4 border rounded-2xl bg-white">
            <h3 className="font-semibold mb-3">استلام إيصالات من الفنيين/المندوبين</h3>
            <div className="grid sm:grid-cols-2 gap-2 text-sm">
              <select className="border rounded-2xl p-2">{receiptTypes.map(t=><option key={t}>{t}</option>)}</select>
              <input className="border rounded-2xl p-2" placeholder="رقم الإيصال/العقد" />
              <input className="border rounded-2xl p-2" placeholder="اسم العميل" />
              <input className="border rounded-2xl p-2" placeholder="المبلغ" />
              <select className="border rounded-2xl p-2">{payMethods.map(m=><option key={m}>{m}</option>)}</select>
              <input className="border rounded-2xl p-2" placeholder="المستلم (فني/مندوب)" />
              <textarea className="border rounded-2xl p-2 sm:col-span-2" rows={3} placeholder="ملاحظات" />
              <button className="sm:col-span-2 rounded-2xl px-4 py-2 bg-red-800 text-white">تثبيت الاستلام → إدخال للصندوق</button>
            </div>
          </div>
          <div className="p-4 border rounded-2xl bg-white">
            <h4 className="font-semibold mb-2">أحدث إيصالات مستلمة</h4>
            <ul className="text-sm space-y-2">
              <li className="p-2 border rounded-2xl">RC-2201 · صيانة · 180 · نقدي</li>
              <li className="p-2 border rounded-2xl">RC-2202 · قسط · 320 · تحويل</li>
            </ul>
          </div>
        </div>
      )}

      {/* 2) إدخال المبالغ للصندوق */}
      {tab === "ops_cashbox_in" && (
        <div className="p-4 border rounded-2xl bg-white">
          <h3 className="font-semibold mb-3">إدخال مبلغ للصندوق (قبض)</h3>
          <div className="grid md:grid-cols-4 gap-2 text-sm">
            <input className="border rounded-2xl p-2" placeholder="المرجع (إيصال/فاتورة)" />
            <input className="border rounded-2xl p-2" placeholder="الوصف" />
            <input className="border rounded-2xl p-2" placeholder="المبلغ" />
            <select className="border rounded-2xl p-2">{payMethods.map(m=><option key={m}>{m}</option>)}</select>
            <button className="md:col-span-4 rounded-2xl px-4 py-2 bg-red-800 text-white">حفظ وإضافة للقيد</button>
          </div>
        </div>
      )}

      {/* 3) طباعة كشف الصندوق */}
      {tab === "ops_cashbox_report" && (
        <div className="p-4 border rounded-2xl bg-white">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">كشف الصندوق — قبض/صرف</h3>
            <button className="px-3 py-1.5 rounded-2xl border">طباعة PDF</button>
          </div>
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-gray-500"><th className="py-2">التاريخ</th><th className="py-2">الوصف</th><th className="py-2">قبض</th><th className="py-2">صرف</th></tr></thead>
              <tbody>
                <tr className="border-t"><td className="py-2">2025-10-29</td><td className="py-2">تحصيل أقساط</td><td className="py-2">1,500</td><td className="py-2">—</td></tr>
                <tr className="border-t"><td className="py-2">2025-10-29</td><td className="py-2">سداد مورد</td><td className="py-2">—</td><td className="py-2">2,000</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4) إدخال الأقساط المحصلة + نسخة للريسبشن */}
      {tab === "ops_installments_collected" && (
        <div className="grid md:grid-cols-3 gap-4">
          <div className="md:col-span-2 p-4 border rounded-2xl bg-white">
            <h3 className="font-semibold mb-3">تسجيل قسط محصّل</h3>
            <div className="grid sm:grid-cols-2 gap-2 text-sm">
              <input className="border rounded-2xl p-2" placeholder="رقم العقد/القسط" />
              <input className="border rounded-2xl p-2" placeholder="اسم العميل" />
              <input className="border rounded-2xl p-2" placeholder="المبلغ" />
              <select className="border rounded-2xl p-2">{payMethods.map(m=><option key={m}>{m}</option>)}</select>
              <button className="sm:col-span-2 rounded-2xl px-4 py-2 bg-red-800 text-white">حفظ القسط + طباعة نسخة للريسبشن</button>
            </div>
          </div>
          <div className="p-4 border rounded-2xl bg-white">
            <h4 className="font-semibold mb-2">آخر أقساط مسجلة</h4>
            <ul className="text-sm space-y-2">
              <li className="p-2 border rounded-2xl">INS-1001 · 180 · نقدي</li>
              <li className="p-2 border rounded-2xl">INS-1002 · 320 · تحويل</li>
            </ul>
          </div>
        </div>
      )}

      {/* 5) تدقيق ورقة التركيبات */}
      {tab === "ops_install_sheet_audit" && (
        <div className="p-4 border rounded-2xl bg-white">
          <h3 className="font-semibold mb-3">تدقيق ورقة التركيبات</h3>
          <div className="grid sm:grid-cols-3 gap-2 text-sm">
            <input className="border rounded-2xl p-2" placeholder="رقم الورقة" />
            <input className="border rounded-2xl p-2" placeholder="الفني المسؤول" />
            <input className="border rounded-2xl p-2" placeholder="العميل/العقد" />
            <textarea className="sm:col-span-3 border rounded-2xl p-2" rows={3} placeholder="الملاحظات/الفروقات" />
            <button className="sm:col-span-3 rounded-2xl px-4 py-2 bg-red-800 text-white">اعتماد التدقيق</button>
          </div>
        </div>
      )}

      {/* 6) إدخال العقود (التراكيب) */}
      {tab === "ops_contracts_entry" && (
        <div className="p-4 border rounded-2xl bg-white">
          <h3 className="font-semibold mb-3">إدخال عقد تركيب</h3>
          <div className="grid md:grid-cols-4 gap-2 text-sm">
            <input className="border rounded-2xl p-2" placeholder="رقم العقد" />
            <input className="border rounded-2xl p-2" placeholder="العميل" />
            <input className="border rounded-2xl p-2" placeholder="الجهاز/الوصف" />
            <input className="border rounded-2xl p-2" placeholder="الإجمالي" />
            <button className="md:col-span-4 rounded-2xl px-4 py-2 bg-red-800 text-white">حفظ العقد → إنشاء قيود</button>
          </div>
        </div>
      )}

      {/* 7) تشييك عمل الريسبشن */}
      {tab === "ops_reception_audit" && (
        <div className="p-4 border rounded-2xl bg-white">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">تدقيق إدخالات/إخراجات الريسبشن</h3>
            <button className="px-3 py-1.5 rounded-2xl border">تقرير PDF</button>
          </div>
          <div className="text-sm text-gray-600">قائمة بالتذاكر/الإيصالات المتقاطعة مع المحاسبة والمستودع.</div>
          <div className="h-40 mt-3 border border-dashed rounded-2xl flex items-center justify-center text-gray-500 text-sm">مطابقة وهمية — لا توجد فروقات</div>
        </div>
      )}

      {/* 8) متابعة حركة المستودع */}
      {tab === "ops_warehouse_follow" && (
        <div className="p-4 border rounded-2xl bg-white">
          <h3 className="font-semibold mb-2">متابعة حركة المستودع</h3>
          <div className="text-sm text-gray-600">عرض إدخالات/إخراجات الفنيين وتأثيرها على التكلفة.</div>
          <div className="h-40 mt-3 border border-dashed rounded-2xl flex items-center justify-center text-gray-500 text-sm">مخطط تدفق (Placeholder)</div>
        </div>
      )}

      {/* 9) إدخال بطاقة الموظفين الجدد */}
      {tab === "ops_new_staff_cards" && (
        <div className="p-4 border rounded-2xl bg-white">
          <h3 className="font-semibold mb-3">بطاقة موظف جديد (مالية)</h3>
          <div className="grid md:grid-cols-4 gap-2 text-sm">
            <input className="border rounded-2xl p-2" placeholder="الاسم" />
            <input className="border rounded-2xl p-2" placeholder="الرقم الوظيفي" />
            <input className="border rounded-2xl p-2" placeholder="الراتب الأساسي" />
            <input className="border rounded-2xl p-2" placeholder="بدلات" />
            <button className="md:col-span-4 rounded-2xl px-4 py-2 bg-red-800 text-white">حفظ وربط بالرواتب</button>
          </div>
        </div>
      )}

      {/* 10) مطابقة البنوك */}
      {tab === "ops_bank_recon" && (
        <div className="grid md:grid-cols-3 gap-4">
          <div className="md:col-span-2 p-4 border rounded-2xl bg-white">
            <h3 className="font-semibold mb-3">مطابقة حركة البنوك</h3>
            <div className="grid sm:grid-cols-2 gap-2 text-sm">
              <input className="border rounded-2xl p-2" placeholder="رقم الحساب البنكي" />
              <input className="border rounded-2xl p-2" placeholder="الرصيد بدفتر الشركة" />
              <input className="border rounded-2xl p-2" placeholder="الرصيد بكشف البنك" />
              <input className="border rounded-2xl p-2" placeholder="فروقات قيد التسوية" />
              <button className="sm:col-span-2 rounded-2xl px-4 py-2 bg-red-800 text-white">مطابقة</button>
            </div>
          </div>
          <div className="p-4 border rounded-2xl bg-white">
            <h4 className="font-semibold mb-2">استيراد كشف (CSV)</h4>
            <button className="w-full rounded-2xl px-4 py-2 border">رفع ملف كشف بنك</button>
          </div>
        </div>
      )}

      {/* 11) إدخال فواتير المشتريات */}
      {tab === "ops_purchase_invoices" && (
        <div className="p-4 border rounded-2xl bg-white">
          <h3 className="font-semibold mb-3">إدخال فاتورة مشتريات</h3>
          <div className="grid md:grid-cols-4 gap-2 text-sm">
            <input className="border rounded-2xl p-2" placeholder="المورد" />
            <input className="border rounded-2xl p-2" placeholder="رقم الفاتورة" />
            <input className="border rounded-2xl p-2" placeholder="التاريخ" />
            <input className="border rounded-2xl p-2" placeholder="الإجمالي مع الضريبة" />
            <select className="border rounded-2xl p-2 md:col-span-2"><option>مركز تكلفة: الصيانة</option><option>التركيب</option><option>التسويق</option><option>إداري</option></select>
            <button className="md:col-span-2 rounded-2xl px-4 py-2 bg-red-800 text-white">حفظ وربط بالمستودع</button>
          </div>
        </div>
      )}

      {/* 12) دفاتر الأقساط + الصيانات المنتهية */}
      {tab === "ops_ledger_check" && (
        <div className="p-4 border rounded-2xl bg-white">
          <h3 className="font-semibold mb-2">دفاتر الأقساط/الصيانات — متابعة الاستحقاقات</h3>
          <div className="text-sm text-gray-600">تذكير تلقائي بالعقود/الصيانات المنتهية وإعادة الفوترة.</div>
          <div className="h-40 mt-3 border border-dashed rounded-2xl flex items-center justify-center text-gray-500 text-sm">قائمة استحقاقات (Placeholder)</div>
        </div>
      )}

      {/* 13) تشييك البصمات */}
      {tab === "ops_biometrics_check" && (
        <div className="p-4 border rounded-2xl bg-white">
          <h3 className="font-semibold mb-2">تشييك البصمات (ربط مع HR)</h3>
          <div className="text-sm text-gray-600">مطابقة حضور الموظفين مع الاستحقاقات المالية (حوافز/خصومات).</div>
          <div className="h-40 mt-3 border border-dashed rounded-2xl flex items-center justify-center text-gray-500 text-sm">حضور اليوم — لا فروقات</div>
        </div>
      )}

      {/* 14) خصم التأمينات + سيريتل */}
      {tab === "ops_statutory_deductions" && (
        <div className="p-4 border rounded-2xl bg-white">
          <h3 className="font-semibold mb-3">الاستقطاعات النظامية</h3>
          <div className="grid md:grid-cols-4 gap-2 text-sm">
            <input className="border rounded-2xl p-2" placeholder="نسبة التأمينات %" />
            <input className="border rounded-2xl p-2" placeholder="قيمة سيريتل/اتصالات" />
            <select className="border rounded-2xl p-2"><option>تطبيق على: الكل</option><option>فنيين</option><option>إداريين</option></select>
            <input className="border rounded-2xl p-2" placeholder="شهر/سنة (MM-YYYY)" />
            <button className="md:col-span-4 rounded-2xl px-4 py-2 bg-red-800 text-white">تطبيق على مسيّرات الرواتب</button>
          </div>
        </div>
      )}

      {/* 15) العمولات */}
      {tab === "ops_commissions" && (
        <div className="p-4 border rounded-2xl bg-white">
          <h3 className="font-semibold mb-3">حساب العمولات</h3>
          <div className="grid md:grid-cols-4 gap-2 text-sm">
            <input className="border rounded-2xl p-2" placeholder="اسم الموظف/المندوب" />
            <input className="border rounded-2xl p-2" placeholder="نسبة العمولة %" />
            <input className="border rounded-2xl p-2" placeholder="قيمة المبيعات/التحصيل" />
            <select className="border rounded-2xl p-2"><option>نوع العمولة: مبيعات</option><option>تحصيل</option></select>
            <button className="md:col-span-4 rounded-2xl px-4 py-2 bg-red-800 text-white">حساب وإضافة للراتب</button>
          </div>
        </div>
      )}

      {/* 16) السلف */}
      {tab === "ops_advances" && (
        <div className="grid md:grid-cols-3 gap-4">
          <div className="md:col-span-2 p-4 border rounded-2xl bg-white">
            <h3 className="font-semibold mb-3">تسجيل سلفة</h3>
            <div className="grid sm:grid-cols-2 gap-2 text-sm">
              <input className="border rounded-2xl p-2" placeholder="اسم الموظف" />
              <input className="border rounded-2xl p-2" placeholder="المبلغ" />
              <input className="border rounded-2xl p-2" placeholder="عدد الأشهر للسداد" />
              <button className="sm:col-span-2 rounded-2xl px-4 py-2 bg-red-800 text-white">حفظ وربط بالرواتب</button>
            </div>
          </div>
          <div className="p-4 border rounded-2xl bg-white">
            <h4 className="font-semibold mb-2">سلف معلّقة</h4>
            <ul className="text-sm space-y-2">
              <li className="p-2 border rounded-2xl">موظف ريسبشن · 1,000 · متبقي 3 أشهر</li>
            </ul>
          </div>
        </div>
      )}

      {/* 17) مطابقة ملف صاحب الشركة */}
      {tab === "ops_owner_file_match" && (
        <div className="p-4 border rounded-2xl bg-white">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">مطابقة ملف صاحب الشركة</h3>
            <button className="px-3 py-1.5 rounded-2xl border">تصدير المطابقة</button>
          </div>
          <div className="grid sm:grid-cols-3 gap-2 text-sm">
            <input className="border rounded-2xl p-2" placeholder="مرجع العملية (فاتورة/قيد)" />
            <input className="border rounded-2xl p-2" placeholder="القيمة" />
            <input className="border rounded-2xl p-2" placeholder="حالة الإدخال في ملف المالك" />
            <button className="sm:col-span-3 rounded-2xl px-4 py-2 bg-red-800 text-white">مطابقة وتحديث الملف</button>
          </div>
        </div>
      )}
    </div>
  );
}


// Warehouse Panel (مستودع) — Wireframe متكامل حسب السيناريو
// ----------------------
const WarehousePanel = () => {
  const [tab, setTab] = useState<"stock"|"technicians"|"recycled"|"alerts"|"purchases"|"archive">("stock");

  // بيانات وهمية محلية لتجنّب تعارض الأسماء مع المستند
  type Item = { sku:string; name:string; category:string; uom:string; barcode:string; min:number; qty:number; bin:string; price:number };
  type Tech = { id:string; name:string };
  type TechStock = { techId:string; items: Record<string, number> }; // sku -> qty
  type ConsumeEvent = { id:string; techId:string; sku:string; qty:number; date:string };
  type RecyclePart = { id:string; sku:string; name:string; state:"needs_repair"|"refurbished"; employeeFactor:number; note?:string };
  type PurchaseItem = { sku:string; name:string; qty:number };
  type PurchaseReq = { id:string; date:string; items:PurchaseItem[]; status:"draft"|"sent_manager"|"approved"|"sent_accounting"|"rejected" };
  type Log = { t:string; msg:string };

  const [items, setItems] = useState<Item[]>([
    { sku:"FL-10-RO", name:"فلتر 10\" RO", category:"فلاتر", uom:"قطعة", barcode:"100001", min:10, qty:22, bin:"A1", price:45 },
    { sku:"TK-RO-4G", name:"خزان RO 4G", category:"خزانات", uom:"قطعة", barcode:"100045", min:5, qty:6, bin:"B3", price:160 },
    { sku:"PM-CARB", name:"حشوة كربونية", category:"مستهلكات", uom:"قطعة", barcode:"100077", min:30, qty:28, bin:"C2", price:18 },
    { sku:"PMP-RO", name:"مضخة RO", category:"مضخات", uom:"قطعة", barcode:"100099", min:3, qty:4, bin:"D1", price:280 },
  ]);

  const [techs] = useState<Tech[]>([
    { id:"T-1", name:"م. خالد" }, { id:"T-2", name:"م. سليم" }, { id:"T-3", name:"م. نورة" },
  ]);

  // مخزون يد الفنيين
  const [techStocks, setTechStocks] = useState<TechStock[]>([
    { techId:"T-1", items: { "FL-10-RO":3, "TK-RO-4G":1, "PM-CARB":6 } },
    { techId:"T-2", items: { "FL-10-RO":2, "TK-RO-4G":2, "PM-CARB":4, "PMP-RO":1 } },
    { techId:"T-3", items: { "FL-10-RO":4, "PM-CARB":8 } },
  ]);

  // خصومات/استهلاك من تطبيق الفني (تصل كإشعار)
  const [consumes, setConsumes] = useState<ConsumeEvent[]>([
    { id:"EV-9001", techId:"T-1", sku:"FL-10-RO", qty:1, date:"2025-10-29 09:10" },
  ]);

  // القطع المسترجعة القابلة للإصلاح/بيع الموظفين
  const [recycled, setRecycled] = useState<RecyclePart[]>([
    { id:"RC-1001", sku:"PMP-RO", name:"مضخة RO", state:"needs_repair", employeeFactor:0.5, note:"صوت عالي" },
  ]);

  // طلبات شراء
  const [purchases, setPurchases] = useState<PurchaseReq[]>([
    { id:"PR-3001", date:"2025-10-28", status:"draft", items:[{ sku:"PM-CARB", name:"حشوة كربونية", qty:50 }] }
  ]);

  // أرشيف العمليات/المراسلات (يُمكن ارسالها للريسبشن)
  const [logs, setLogs] = useState<Log[]>([
    { t:"2025-10-29 09:11", msg:"استلام إشعار خصم 1× FL-10-RO من الفني T-1" },
  ]);

  // بحث بسيط + اختيار فني
  const [q, setQ] = useState("");
  const [selectedTech, setSelectedTech] = useState<string>("T-1");

  // ماسح باركود وهمي/إدخال يدوي للتسليم للفني
  const [barcodeInput, setBarcodeInput] = useState("");
  const [deliverQty, setDeliverQty] = useState<number>(1);

  // حساب الأصناف الحرجة
  const lowItems = useMemo(() => items.filter(i => i.qty <= i.min), [items]);

  // أدوات مساعدة
  const findItemBySku = (sku: string) => items.find(i => i.sku === sku);
  const skuFromBarcode = (bc: string) => items.find(i => i.barcode === bc)?.sku;

  // محاكاة حدث يأتينا من تطبيق الفني (خصم)
  const simulateConsumeFromTech = (techId: string, sku: string, qty: number) => {
    const id = `EV-${Math.floor(Math.random()*100000)}`;
    setConsumes(prev => [{ id, techId, sku, qty, date:new Date().toISOString().slice(0,16).replace("T"," ") }, ...prev]);
    // تحديث مخزون الفني
    setTechStocks(prev => prev.map(ts => ts.techId === techId ? { ...ts, items: { ...ts.items, [sku]: Math.max(0, (ts.items[sku]||0) - qty) } } : ts));
    // إشعار وأرشفة
    setLogs(prev => [{ t:new Date().toISOString().slice(0,19).replace("T"," "), msg:`إشعار خصم ${qty}× ${sku} من الفني ${techId}` }, ...prev]);
  };

  // تسليم من المستودع للفني عبر باركود/رقم
  const deliverToTech = (techId: string, sku: string, qty: number) => {
    if (!sku || qty <= 0) return;
    // خصم من المستودع
    setItems(prev => prev.map(it => it.sku === sku ? { ...it, qty: Math.max(0, it.qty - qty) } : it));
    // إضافة ليد الفني
    setTechStocks(prev => prev.map(ts => ts.techId === techId ? { ...ts, items: { ...ts.items, [sku]: (ts.items[sku]||0) + qty } } : ts));
    // لوج/أرشيف
    setLogs(prev => [{ t:new Date().toISOString().slice(0,19).replace("T"," "), msg:`تسليم ${qty}× ${sku} إلى الفني ${techId}` }, ...prev]);
    setBarcodeInput("");
    setDeliverQty(1);
  };

  // تحويل قطعة مسترجعة
  const updateRecycleState = (id:string, newState:RecyclePart["state"]) => {
    setRecycled(prev => prev.map(r => r.id === id ? { ...r, state:newState } : r));
    setLogs(prev => [{ t:new Date().toISOString().slice(0,19).replace("T"," "), msg:`تحديث حالة قطعة ${id} إلى ${newState}` }, ...prev]);
  };

  // نقل قطعة مُجدّدة إلى "مخزون الموظفين" (هنا: نزيد كمية الصنف كتمثيل مبسط)
  const moveRefurbishedToEmployeeStock = (part: RecyclePart) => {
    // في التطبيق الحقيقي: مخزون منفصل للموظفين. هنا سنضيف ملاحظة فقط.
    setLogs(prev => [{ t:new Date().toISOString().slice(0,19).replace("T"," "), msg:`قطعة ${part.id} أُضيفت لسلة بيع الموظفين بنسبة ${part.employeeFactor*100}%` }, ...prev]);
  };

  // إنشاء طلب شراء من القطع الحرجة
  const createPurchaseFromLows = () => {
    if (!lowItems.length) return;
    const id = `PR-${Math.floor(Math.random()*10000)}`;
    const req: PurchaseReq = {
      id, date:new Date().toISOString().slice(0,10), status:"draft",
      items: lowItems.map(li => ({ sku:li.sku, name:li.name, qty: Math.max(li.min*2 - li.qty, 1) }))
    };
    setPurchases(prev => [req, ...prev]);
    setLogs(prev => [{ t:new Date().toISOString().slice(0,19).replace("T"," "), msg:`إنشاء طلب شراء ${id} من الأصناف الحرجة` }, ...prev]);
    setTab("purchases");
  };

  // مسار موافقات طلب الشراء
  const advancePurchase = (id:string) => {
    setPurchases(prev => prev.map(pr => {
      if (pr.id !== id) return pr;
      const next: Record<PurchaseReq["status"], PurchaseReq["status"]> = {
        draft:"sent_manager",
        sent_manager:"approved",
        approved:"sent_accounting",
        sent_accounting:"sent_accounting",
        rejected:"rejected"
      };
      const newStatus = next[pr.status];
      setLogs(prevL => [{ t:new Date().toISOString().slice(0,19).replace("T"," "), msg:`تحديث حالة ${id} إلى ${newStatus}` }, ...prevL]);
      return { ...pr, status:newStatus };
    }));
  };

  // ضبط الحد الأدنى لقطعة
  const setMinFor = (sku:string, min:number) => {
    setItems(prev => prev.map(i => i.sku === sku ? { ...i, min: Math.max(0, min) } : i));
  };

  // غرامة على الفني عند استبدال قطعة سليمة + إنشاء فاتورة (وهمي)
  const penalizeTechForHealthyPart = (techId:string, sku:string) => {
    setLogs(prev => [
      { t:new Date().toISOString().slice(0,19).replace("T"," "), msg:`غرامة على الفني ${techId} لاستبدال قطعة سليمة (${sku})` },
      { t:new Date().toISOString().slice(0,19).replace("T"," "), msg:`إصدار فاتورة/إشعار للزبون بإرجاع القطعة ${sku}` },
      ...prev
    ]);
  };

  // جداول/قوائم مساعدة
  const itemsFiltered = items.filter(i => (i.sku + i.name + i.category + i.barcode).includes(q));

  return (
    <div className="space-y-6">
      {/* رأس اللوحة */}
      <div className="rounded-3xl p-4 bg-gradient-to-r from-red-800 to-red-600 text-white flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">المستودع</h2>
          <p className="text-sm text-red-100">إدارة المخزون · الفنيين · القطع المسترجعة · طلبات الشراء</p>
        </div>
        <div className="flex gap-2 text-sm">
          {[
            {key:"stock",label:"المخزون"},
            {key:"technicians",label:"مخزون الفنيين"},
            {key:"recycled",label:"قطع مسترجعة"},
            {key:"alerts",label:"تنبيهات"},
            {key:"purchases",label:"طلبات شراء"},
            {key:"archive",label:"الأرشيف"},
          ].map(t=>(
            <button key={t.key} onClick={()=>setTab(t.key as any)} className={`px-3 py-1.5 rounded-2xl ${tab===t.key ? "bg-white text-red-800" : "bg-white/10 text-white"}`}>{t.label}</button>
          ))}
        </div>
      </div>

      {/* المخزون (جدول + بطاقة عند النقر) */}
      {tab === "stock" && (
        <div className="space-y-4">
          <div className="p-4 border rounded-2xl bg-white">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">المخزون الرئيسي</h3>
              <div className="flex gap-2">
                <input value={q} onChange={(e)=>setQ(e.target.value)} className="border rounded-2xl p-2 text-sm" placeholder="بحث: SKU/اسم/تصنيف/باركود" />
                <button onClick={createPurchaseFromLows} className="px-3 py-2 rounded-2xl bg-red-800 text-white text-sm">إنشاء طلب شراء للأصناف الحرجة</button>
              </div>
            </div>

            <div className="overflow-auto border rounded-2xl">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500">
                    <th className="py-2 px-2">SKU</th>
                    <th className="py-2 px-2">الاسم</th>
                    <th className="py-2 px-2">التصنيف</th>
                    <th className="py-2 px-2">الموقع</th>
                    <th className="py-2 px-2">الكمية</th>
                    <th className="py-2 px-2">الحد الأدنى</th>
                    <th className="py-2 px-2">الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {itemsFiltered.map(it => (
                    <tr key={it.sku} className="border-t hover:bg-slate-50">
                      <td className="py-2 px-2">{it.sku}</td>
                      <td className="py-2 px-2">{it.name}</td>
                      <td className="py-2 px-2">{it.category}</td>
                      <td className="py-2 px-2">{it.bin}</td>
                      <td className="py-2 px-2">{it.qty}</td>
                      <td className="py-2 px-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            className="border rounded-xl px-2 py-1 w-20"
                            value={it.min}
                            onChange={(e)=>setMinFor(it.sku, Number(e.target.value))}
                          />
                          <span className="text-xs text-gray-500">قطعة</span>
                        </div>
                      </td>
                      <td className="py-2 px-2">
                        {it.qty <= it.min ? <Badge color="red">منخفض</Badge> : <Badge color="green">كافٍ</Badge>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-3 text-xs text-gray-500">* طباعة الباركود وقوائم الجرد ستكون من خلال زر طباعة في النسخة النهائية.</div>
          </div>
        </div>
      )}

      {/* مخزون الفنيين + طلبات التعويض */}
      {tab === "technicians" && (
        <div className="grid lg:grid-cols-3 gap-4">
          {/* لوحة الفنيين والتسليم بالباركود */}
          <div className="p-4 border rounded-2xl bg-white lg:col-span-2">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">مخزون الفنيين</h3>
              <div className="flex items-center gap-2">
                <select className="border rounded-2xl p-2 text-sm" value={selectedTech} onChange={(e)=>setSelectedTech(e.target.value)}>
                  {techs.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
            </div>

            <div className="overflow-auto border rounded-2xl">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500">
                    <th className="py-2 px-2">SKU</th>
                    <th className="py-2 px-2">الاسم</th>
                    <th className="py-2 px-2">المتاح لدى الفني</th>
                    <th className="py-2 px-2">حالة المخزون</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(it => {
                    const techQty = techStocks.find(ts => ts.techId === selectedTech)?.items[it.sku] || 0;
                    return (
                      <tr key={it.sku} className="border-t">
                        <td className="py-2 px-2">{it.sku}</td>
                        <td className="py-2 px-2">{it.name}</td>
                        <td className="py-2 px-2">{techQty}</td>
                        <td className="py-2 px-2">{techQty <= 1 ? <Badge color="yellow">قريب للنفاد</Badge> : <Badge color="green">جيد</Badge>}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-4 grid md:grid-cols-3 gap-3">
              <div className="p-3 border rounded-2xl">
                <div className="text-sm font-semibold mb-2">تسليم عبر باركود/رقم</div>
                <input className="border rounded-2xl p-2 w-full text-sm mb-2" placeholder="أدخل باركود أو SKU" value={barcodeInput} onChange={(e)=>setBarcodeInput(e.target.value)} />
                <div className="flex items-center gap-2">
                  <input type="number" className="border rounded-2xl p-2 w-24 text-sm" value={deliverQty} onChange={(e)=>setDeliverQty(Math.max(1, Number(e.target.value)||1))} />
                  <button
                    className="px-3 py-2 rounded-2xl bg-red-800 text-white text-sm"
                    onClick={()=>{
                      const sku = skuFromBarcode(barcodeInput) || barcodeInput.trim();
                      deliverToTech(selectedTech, sku, deliverQty);
                    }}
                  >تسليم للفني</button>
                </div>
                <div className="text-xs text-gray-500 mt-1">* يحاكي قارئ الباركود — اضبط التكامل لاحقًا.</div>
              </div>

              <div className="p-3 border rounded-2xl">
                <div className="text-sm font-semibold mb-2">محاكاة خصم من تطبيق الفني</div>
                <div className="flex items-center gap-2">
                  <select className="border rounded-2xl p-2 text-sm" value={selectedTech} onChange={(e)=>setSelectedTech(e.target.value)}>
                    {techs.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                  <select className="border rounded-2xl p-2 text-sm" id="sku-consume">
                    {items.map(i => <option key={i.sku} value={i.sku}>{i.sku}</option>)}
                  </select>
                  <button
                    className="px-3 py-2 rounded-2xl border text-sm"
                    onClick={()=>{
                      const skuSel = (document.getElementById("sku-consume") as HTMLSelectElement).value;
                      simulateConsumeFromTech(selectedTech, skuSel, 1);
                    }}
                  >خصم 1 قطعة</button>
                </div>
                <div className="text-xs text-gray-500 mt-1">* عند الخصم يصل إشعار للمستودع ويُسجّل لدى الريسبشن.</div>
              </div>

              <div className="p-3 border rounded-2xl">
                <div className="text-sm font-semibold mb-2">استبدال قطعة سليمة (غرامة/فاتورة)</div>
                <div className="flex items-center gap-2">
                  <select className="border rounded-2xl p-2 text-sm" id="sku-penalty">
                    {items.map(i => <option key={i.sku} value={i.sku}>{i.sku}</option>)}
                  </select>
                  <button
                    className="px-3 py-2 rounded-2xl border text-sm"
                    onClick={()=>{
                      const skuSel = (document.getElementById("sku-penalty") as HTMLSelectElement).value;
                      penalizeTechForHealthyPart(selectedTech, skuSel);
                    }}
                  >تسجيل غرامة + فاتورة</button>
                </div>
              </div>
            </div>
          </div>

          {/* “فواتير الفنيين/طلبات التعويض” = سجّل الاستهلاك/الإشعارات */}
          <div className="p-4 border rounded-2xl bg-white">
            <h4 className="font-semibold mb-2">فواتير الفنيين / طلبات التعويض (إشعارات خصم)</h4>
            <ul className="text-sm space-y-2 max-h-72 overflow-auto">
              {consumes.map(c => {
                const tName = techs.find(t => t.id === c.techId)?.name || c.techId;
                const iname = findItemBySku(c.sku)?.name || c.sku;
                return (
                  <li key={c.id} className="p-2 border rounded-2xl flex items-center justify-between">
                    <div>
                      <div className="font-medium">{tName}</div>
                      <div className="text-xs text-gray-500">{c.date} — خصم {c.qty}× {iname} ({c.sku})</div>
                    </div>
                    <button className="px-3 py-1.5 rounded-2xl bg-red-800 text-white text-xs"
                      onClick={()=>deliverToTech(c.techId, c.sku, c.qty)}
                    >تعويض الآن</button>
                  </li>
                );
              })}
              {!consumes.length && <li className="text-xs text-gray-500 text-center py-6">لا يوجد إشعارات حالية</li>}
            </ul>
          </div>
        </div>
      )}

      {/* القطع المسترجعة والقابلة للإصلاح */}
      {tab === "recycled" && (
        <div className="grid lg:grid-cols-3 gap-4">
          <div className="p-4 border rounded-2xl bg-white lg:col-span-2">
            <h3 className="font-semibold mb-3">سجل القطع المسترجعة</h3>
            <div className="overflow-auto border rounded-2xl">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500">
                    <th className="py-2 px-2">#</th>
                    <th className="py-2 px-2">SKU</th>
                    <th className="py-2 px-2">الاسم</th>
                    <th className="py-2 px-2">الحالة</th>
                    <th className="py-2 px-2">سعر الموظف</th>
                    <th className="py-2 px-2">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {recycled.map(r => {
                    const base = findItemBySku(r.sku)?.price || 0;
                    const empPrice = Math.round(base * r.employeeFactor);
                    return (
                      <tr key={r.id} className="border-t">
                        <td className="py-2 px-2">{r.id}</td>
                        <td className="py-2 px-2">{r.sku}</td>
                        <td className="py-2 px-2">{r.name}</td>
                        <td className="py-2 px-2">{r.state === "needs_repair" ? <Badge color="yellow">بحاجة لصيانة</Badge> : <Badge color="green">صالح</Badge>}</td>
                        <td className="py-2 px-2">{empPrice} (عامل: {r.employeeFactor * 100}%)</td>
                        <td className="py-2 px-2">
                          <div className="flex gap-2">
                            <button className="px-2 py-1 rounded-xl border text-xs" onClick={()=>updateRecycleState(r.id, "refurbished")}>اعتماد كصالح</button>
                            <button className="px-2 py-1 rounded-xl border text-xs" onClick={()=>moveRefurbishedToEmployeeStock(r)}>نقل لبيع الموظفين</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {!recycled.length && <tr><td colSpan={6} className="text-center text-xs text-gray-500 py-6">لا توجد قطع مسترجعة</td></tr>}
                </tbody>
              </table>
            </div>
          </div>

          <div className="p-4 border rounded-2xl bg-white">
            <h4 className="font-semibold mb-2">إدخال قطعة مسترجعة</h4>
            <div className="grid grid-cols-1 gap-2 text-sm">
              <select className="border rounded-2xl p-2" id="rc-sku">
                {items.map(i => <option key={i.sku} value={i.sku}>{i.sku} — {i.name}</option>)}
              </select>
              <input className="border rounded-2xl p-2" id="rc-name" placeholder="ملاحظة/وصف الحالة" />
              <select className="border rounded-2xl p-2" id="rc-state">
                <option value="needs_repair">تحتاج صيانة</option>
                <option value="refurbished">صالح</option>
              </select>
              <input className="border rounded-2xl p-2" id="rc-factor" placeholder="نسبة الموظف (0.5 = نصف السعر)" defaultValue="0.5" />
              <button className="rounded-2xl px-4 py-2 bg-red-800 text-white"
                onClick={()=>{
                  const sku = (document.getElementById("rc-sku") as HTMLSelectElement).value;
                  const name = findItemBySku(sku)?.name || sku;
                  const factor = Math.min(1, Math.max(0, Number((document.getElementById("rc-factor") as HTMLInputElement).value)||0.5));
                  const state = ((document.getElementById("rc-state") as HTMLSelectElement).value as "needs_repair"|"refurbished");
                  const note = (document.getElementById("rc-name") as HTMLInputElement).value;
                  const id = `RC-${Math.floor(Math.random()*10000)}`;
                  setRecycled(prev => [{ id, sku, name, state, employeeFactor:factor, note }, ...prev]);
                  setLogs(prev => [{ t:new Date().toISOString().slice(0,19).replace("T"," "), msg:`إضافة قطعة مسترجعة ${id} (${sku})` }, ...prev]);
                }}
              >حفظ</button>
            </div>
          </div>
        </div>
      )}

      {/* تنبيهات انخفاض المخزون */}
      {tab === "alerts" && (
        <div className="p-4 border rounded-2xl bg-white">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">الأصناف ذات المخزون المنخفض</h3>
            <button onClick={createPurchaseFromLows} className="px-3 py-2 rounded-2xl bg-red-800 text-white text-sm">إنشاء طلب شراء مقترح</button>
          </div>
          <div className="grid md:grid-cols-3 gap-3">
            {lowItems.map(li => (
              <div key={li.sku} className="p-3 border rounded-2xl">
                <div className="font-medium">{li.name}</div>
                <div className="text-xs text-gray-500">SKU: {li.sku} · الموقع: {li.bin}</div>
                <div className="mt-1 text-sm">الكمية: <span className="font-semibold">{li.qty}</span> / حد أدنى: {li.min}</div>
                <div className="mt-2"><Badge color="red">تنبيه: منخفض</Badge></div>
              </div>
            ))}
            {!lowItems.length && <div className="text-xs text-gray-500 p-3 border rounded-2xl text-center">لا توجد أصناف حرجة</div>}
          </div>
        </div>
      )}

      {/* طلبات الشراء + الموافقات */}
      {tab === "purchases" && (
        <div className="p-4 border rounded-2xl bg-white">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">طلبات الشراء</h3>
            <div className="text-xs text-gray-500">المسار: مستودع ← المدير ← المحاسبة</div>
          </div>
          <div className="overflow-auto border rounded-2xl">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500">
                  <th className="py-2 px-2">#</th>
                  <th className="py-2 px-2">التاريخ</th>
                  <th className="py-2 px-2">الأصناف</th>
                  <th className="py-2 px-2">الحالة</th>
                  <th className="py-2 px-2">إجراء</th>
                </tr>
              </thead>
              <tbody>
                {purchases.map(pr => (
                  <tr key={pr.id} className="border-t">
                    <td className="py-2 px-2">{pr.id}</td>
                    <td className="py-2 px-2">{pr.date}</td>
                    <td className="py-2 px-2">{pr.items.map(i=>`${i.sku}×${i.qty}`).join(" ، ")}</td>
                    <td className="py-2 px-2">
                      {pr.status === "draft" && <Badge color="gray">مسودة</Badge>}
                      {pr.status === "sent_manager" && <Badge color="blue">لدى المدير</Badge>}
                      {pr.status === "approved" && <Badge color="green">معتمد</Badge>}
                      {pr.status === "sent_accounting" && <Badge color="yellow">لدى المحاسبة</Badge>}
                      {pr.status === "rejected" && <Badge color="red">مرفوض</Badge>}
                    </td>
                    <td className="py-2 px-2">
                      {pr.status !== "sent_accounting" && pr.status !== "rejected" ? (
                        <button className="px-3 py-1.5 rounded-2xl border text-xs" onClick={()=>advancePurchase(pr.id)}>الانتقال للخطوة التالية</button>
                      ) : <span className="text-xs text-gray-500">—</span>}
                    </td>
                  </tr>
                ))}
                {!purchases.length && <tr><td colSpan={5} className="text-center text-xs text-gray-500 py-6">لا توجد طلبات</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* الأرشيف (يسجّل أيضًا للريسبشن لاحقًا) */}
      {tab === "archive" && (
        <div className="p-4 border rounded-2xl bg-white">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">أرشيف العمليات والمراسلات</h3>
            <button className="px-3 py-2 rounded-2xl border text-sm">تصدير PDF</button>
          </div>
          <ul className="text-sm space-y-2 max-h-80 overflow-auto">
            {logs.map((l, i) => (
              <li key={i} className="p-2 border rounded-2xl">
                <div className="text-xs text-gray-500">{l.t}</div>
                <div>{l.msg}</div>
              </li>
            ))}
            {!logs.length && <li className="text-center text-xs text-gray-500 py-6">الأرشيف فارغ</li>}
          </ul>
          <div className="text-xs text-gray-500 mt-3">
            * في التكامل الفعلي: تُرسل هذه الأحداث إلى لوحة الريسبشن (Append إلى سجلّه) وإلى المحاسبة عند اللزوم.
          </div>
        </div>
      )}
    </div>
  );
};

const CCTVPanel = () => {
  const [filter, setFilter] = useState("all"); // all | online | offline
  const filtered = sampleCameras.filter(c => filter === "all" ? true : c.status === filter);
  const onlineCount = sampleCameras.filter(c => c.status === "online").length;

  return (
    <div className="space-y-4">
      <div className="rounded-3xl p-4 bg-gradient-to-r from-red-800 to-red-600 text-white flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">لوحة الكاميرات</h2>
          <p className="text-sm text-red-100">مراقبة البث المباشر · حالة الاتصال · الوصول للأرشيف</p>
        </div>
        <div className="flex gap-2">
          <button onClick={()=>setFilter("all")} className={`px-3 py-1.5 rounded-2xl text-sm ${filter==="all"?"bg-white text-red-800":"bg-white/10 text-white"}`}>الكل ({sampleCameras.length})</button>
          <button onClick={()=>setFilter("online")} className={`px-3 py-1.5 rounded-2xl text-sm ${filter==="online"?"bg-white text-red-800":"bg-white/10 text-white"}`}>متصلة ({onlineCount})</button>
          <button onClick={()=>setFilter("offline")} className={`px-3 py-1.5 rounded-2xl text-sm ${filter==="offline"?"bg-white text-red-800":"bg-white/10 text-white"}`}>غير متصلة ({sampleCameras.length-onlineCount})</button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {filtered.map((cam) => (
          <div key={cam.id} className="border rounded-2xl p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="font-medium">{cam.name}</div>
              <Badge color={cam.status === "online" ? "green" : "red"}>{cam.status === "online" ? "متصلة" : "غير متصلة"}</Badge>
            </div>
            <div className="h-40 rounded-xl border border-dashed flex items-center justify-center text-sm text-gray-500 bg-slate-50">Live Placeholder</div>
            <div className="mt-3 flex items-center justify-between text-xs text-gray-600">
              <span>الموقع: {cam.area}</span>
              <div className="flex gap-2">
                <button className="px-2 py-1 rounded-xl border">أرشيف</button>
                <button className="px-2 py-1 rounded-xl border">تكبير</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 border rounded-2xl">
        <h3 className="text-sm font-semibold mb-2">آخر أحداث النظام</h3>
        <ul className="text-sm space-y-1">
          <li>08:10 — إعادة اتصال الكاميرا C-02</li>
          <li>07:55 — فقدان اتصال الكاميرا C-03</li>
        </ul>
      </div>
    </div>
  );
};

/***********************************
 * Reception — لوحة الريسبشن (مستقلة)
 * مهام: التذاكر/الشكاوى، الاستقبال، متابعة الفنيين، الأقساط، التركيبات، البنزين/المسارات
 ***********************************/
function ReceptionPanel() {
  const [tab, setTab] = useState("tickets"); // tickets | schedule | technicians | installments | installs | fuel
  const [filter, setFilter] = useState("");

  return (
    <div className="space-y-6">
      <div className="rounded-3xl p-4 bg-gradient-to-r from-red-800 to-red-600 text-white flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">الريسبشن</h2>
          <p className="text-sm text-red-100">تسجيل صيانات/شكاوى · المواعيد · متابعة الفنيين · الأقساط · التركيبات · البنزين</p>
        </div>
        <div className="flex gap-2 text-sm">
          {[
            { key: "tickets", label: "التذاكر" },
            { key: "schedule", label: "المواعيد" },
            { key: "technicians", label: "متابعة الفنيين" },
            { key: "installments", label: "الأقساط" },
            { key: "installs", label: "التركيبات" },
            { key: "fuel", label: "البنزين/المسارات" },
          ].map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)} className={`px-3 py-1.5 rounded-2xl ${tab === t.key ? "bg-white text-red-800" : "bg-white/10 text-white"}`}>{t.label}</button>
          ))}
        </div>
      </div>

      {/* التذاكر */}
      {tab === "tickets" && (
        <div className="grid lg:grid-cols-3 gap-4">
          <div className="p-4 border rounded-2xl shadow-sm bg-white lg:col-span-2">
            <h3 className="font-semibold mb-3">تسجيل صيانة / شكوى</h3>
            <div className="grid md:grid-cols-2 gap-2 text-sm">
              <input className="border rounded-2xl p-2" placeholder="اسم العميل" />
              <input className="border rounded-2xl p-2" placeholder="رقم الجوال" />
              <input className="border rounded-2xl p-2 md:col-span-2" placeholder="العنوان / الموقع" />
              <select className="border rounded-2xl p-2"><option>نوع الطلب: صيانة</option><option>شكوى</option><option>فحص</option></select>
              <select className="border rounded-2xl p-2"><option>الأولوية: عادي</option><option>مرتفع</option><option>حرج</option></select>
              <textarea className="border rounded-2xl p-2 md:col-span-2" rows={3} placeholder="وصف المشكلة" />
              <button className="rounded-2xl px-4 py-2 bg-red-800 text-white md:col-span-2">حفظ التذكرة وتعيين أقرب فني</button>
            </div>
          </div>
          <div className="p-4 border rounded-2xl shadow-sm bg-white">
            <h4 className="font-semibold mb-2">بحث سريع</h4>
            <input value={filter} onChange={(e)=>setFilter(e.target.value)} className="border rounded-2xl p-2 w-full text-sm" placeholder="ابحث بالاسم/الهاتف" />
            <ul className="mt-3 space-y-2 text-sm">
              {sampleLeads.filter(l => (l.name + l.phone).includes(filter)).map(l => (
                <li key={l.id} className="p-2 border rounded-2xl">
                  <div className="font-medium">{l.name}</div>
                  <div className="text-xs text-gray-500">{l.phone} · {l.area}</div>
                  <button className="mt-2 px-3 py-1.5 rounded-2xl border">فتح تذكرة</button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* المواعيد */}
      {tab === "schedule" && (
        <div className="p-4 border rounded-2xl shadow-sm bg-white">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">تقويم المواعيد</h3>
            <div className="text-xs text-gray-500">عرض أسبوعي</div>
          </div>
          <div className="h-72 border border-dashed rounded-2xl flex items-center justify-center text-gray-500 text-sm">Placeholder Calendar</div>
        </div>
      )}

      {/* متابعة الفنيين */}
      {tab === "technicians" && (
        <div className="grid md:grid-cols-3 gap-4">
          <div className="md:col-span-2 p-4 border rounded-2xl shadow-sm bg-white">
            <h3 className="font-semibold mb-2">الخريطة والمسارات (وهمي)</h3>
            <div className="h-72 border border-dashed rounded-2xl flex items-center justify-center text-gray-500 text-sm">خريطة توضح أقرب فني للعميل + تتبع حي</div>
          </div>
          <div className="p-4 border rounded-2xl shadow-sm bg-white">
            <h4 className="font-semibold mb-2">حالة الفنيين الآن</h4>
            <ul className="text-sm space-y-2">
              {sampleEngineers.map(e => (
                <li key={e.id} className="p-2 border rounded-2xl flex items-center justify-between">
                  <div>
                    <div className="font-medium">{e.name}</div>
                    <div className="text-xs text-gray-500">{e.area}</div>
                  </div>
                  <Badge color={e.status === "available" ? "green" : e.status === "busy" ? "yellow" : "gray"}>{e.status === "available" ? "متاح" : e.status === "busy" ? "مشغول" : "غير متصل"}</Badge>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* الأقساط */}
      {tab === "installments" && (
        <div className="p-4 border rounded-2xl shadow-sm bg-white">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">إدارة الأقساط</h3>
            <div className="text-xs text-gray-500">إنذارات قرب الاستحقاق (وهمي)</div>
          </div>
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500">
                  <th className="py-2">#</th>
                  <th className="py-2">العميل</th>
                  <th className="py-2">المنتج</th>
                  <th className="py-2">بداية</th>
                  <th className="py-2">نهاية</th>
                  <th className="py-2">القسط/شهر</th>
                  <th className="py-2">مدفوع</th>
                  <th className="py-2">متبقي</th>
                </tr>
              </thead>
              <tbody>
                {sampleInstallments.map(r => (
                  <tr key={r.id} className="border-t">
                    <td className="py-2">{r.id}</td>
                    <td className="py-2">{r.customer}</td>
                    <td className="py-2">{r.product}</td>
                    <td className="py-2">{r.start}</td>
                    <td className="py-2">{r.end}</td>
                    <td className="py-2">{r.monthly}</td>
                    <td className="py-2">{r.paidMonths}/{r.totalMonths}</td>
                    <td className="py-2">{r.totalMonths - r.paidMonths}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* التركيبات */}
      {tab === "installs" && (
        <div className="p-4 border rounded-2xl shadow-sm bg-white">
          <h3 className="font-semibold mb-3">سجل التركيبات</h3>
          <div className="grid md:grid-cols-3 gap-3 text-sm">
            {sampleInstallations.map(j => (
              <div key={j.id} className="p-3 border rounded-2xl">
                <div className="font-medium">{j.customer}</div>
                <div className="text-gray-600">{j.address}</div>
                <div className="text-xs text-gray-500">التاريخ: {j.date} · الجهاز: {j.device}</div>
                <div className="text-xs mt-1">الفني: {j.engineer}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* البنزين/المسارات */}
      {tab === "fuel" && (
        <div className="grid md:grid-cols-3 gap-4">
          <div className="md:col-span-2 p-4 border rounded-2xl shadow-sm bg-white">
            <h3 className="font-semibold mb-2">الخريطة والمسارات (وهمي)</h3>
            <div className="h-72 border border-dashed rounded-2xl flex items-center justify-center text-gray-500 text-sm">مسارات اليوم حسب الفني والمسافة المقطوعة</div>
          </div>
          <div className="p-4 border rounded-2xl shadow-sm bg-white">
            <h4 className="font-semibold mb-2">استهلاك البنزين</h4>
            <ul className="text-sm space-y-2">
              {sampleFuel.map(f => (
                <li key={f.engineer} className="p-2 border rounded-2xl">
                  <div className="font-medium">{f.engineer}</div>
                  <div className="text-xs text-gray-500">{f.date} · {f.distanceKm} كم · {f.liters} لتر</div>
                  <div className="text-xs mt-1">{f.routes.join(" · ")}</div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
function Sales_Department() {
  const [tab, setTab] = useState<"inbox" | "handoffs" | "agents" | "schedule" | "technicians" >("inbox");
  const [filter, setFilter] = useState("");

  // --- بيانات واردة من فريق التيل ماركت (وهمية) ---
  // تحتوي: اسم/هاتف/عنوان/موعد زيارة (ساعة) + إحداثيات العميل
  const [tmInbox, setTmInbox] = useState<Array<{
    id: string;
    name: string;
    phone: string;
    address: string;
    time: string;           // "14:30" مثلاً
    lat: number;
    lng: number;
    note?: string;
  }>>([
    { id: "TM-1001", name: "أحمد عبد الله", phone: "0501234567", address: "حي الروضة - شارع 12", time: "13:00", lat: 24.774265, lng: 46.738586, note: "فلتر RO يضعف التدفق" },
    { id: "TM-1002", name: "سارة الشمري", phone: "0559876543", address: "حي العليا - قرب المستشفى", time: "16:30", lat: 24.699, lng: 46.685, note: "رغبة بفحص + عروض سخان شمسي" },
    { id: "TM-1003", name: "مازن تركي", phone: "0532221188", address: "الياسمين - تقاطع 15", time: "11:15", lat: 24.832, lng: 46.646, note: "صيانة دورية" },
  ]);

  // --- فنيون (للاقتراح فقط) بإحداثيات (وهمي) ---
  const techniciansGeo = useMemo(() => ([
    { id: "T-01", name: "م. أحمد", status: "available", lat: 24.773, lng: 46.72 },
    { id: "T-02", name: "م. خالد", status: "available", lat: 24.71,  lng: 46.68 },
    { id: "T-03", name: "م. روان", status: "busy",      lat: 24.80,  lng: 46.66 },
    { id: "T-04", name: "م. سليم", status: "offline",   lat: 24.69,  lng: 46.64 },
  ]), []);

  // --- قائمة التحويلات التي أُرسلت للريسبشن (سجل تتبع) ---
  const [handoffs, setHandoffs] = useState<Array<{
    id: string;                // رقم طلب TM
    customer: string;
    phone: string;
    address: string;
    time: string;
    suggestedTechId: string;   // أقرب فني مقترح
    suggestedTechName: string;
    distanceKm: number;
    status: "sent_to_reception"; // للعرض فقط
  }>>([]);

  // حساب مسافة بسيطة (تقريب خطي لأغراض العرض)
  const distanceKm = (a: {lat:number;lng:number}, b: {lat:number;lng:number}) => {
    const dx = (a.lat - b.lat) * 111; // تقريب درجة العرض ≈ 111 كم
    const dy = (a.lng - b.lng) * 95;  // تقريب لخط الطول قرب الرياض
    return Math.sqrt(dx*dx + dy*dy);
  };

  // إيجاد أقرب فني متاح/مشغول (نتجنب offline قدر الإمكان)
  const findNearestTech = (lat: number, lng: number) => {
    const ranked = techniciansGeo
      .map(t => ({ ...t, d: distanceKm({lat,lng}, {lat: t.lat, lng: t.lng}) }))
      .sort((a, b) => {
        // أولوية: available ثم busy ثم others، ثم المسافة
        const pri = (s:string) => (s==="available"?0 : s==="busy"?1 : 2);
        const pa = pri(a.status), pb = pri(b.status);
        return pa === pb ? a.d - b.d : pa - pb;
      });
    return ranked[0];
  };

  // تحويل طلب للريسبشن + اقتراح أقرب فني (التعيين الفعلي سيتم في الريسبشن)
  const forwardToReception = (reqId: string) => {
    const req = tmInbox.find(r => r.id === reqId);
    if (!req) return;
    const nearest = findNearestTech(req.lat, req.lng);
    setHandoffs(prev => [
      {
        id: req.id,
        customer: req.name,
        phone: req.phone,
        address: req.address,
        time: req.time,
        suggestedTechId: nearest.id,
        suggestedTechName: nearest.name,
        distanceKm: Number(nearest.d.toFixed(1)),
        status: "sent_to_reception",
      },
      ...prev,
    ]);
    setTmInbox(prev => prev.filter(r => r.id !== reqId));
    alert(`تم تحويل الطلب (${req.id}) إلى الريسبشن مع اقتراح أقرب فني: ${nearest.name}`);
  };

  return (
    <div className="space-y-6">
      {/* رأس */}
      <div className="rounded-3xl p-4 bg-gradient-to-r from-red-800 to-red-600 text-white flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">إشراف Tell Market</h2>
          <p className="text-sm text-red-100">استلام طلبات الصيانة من فريق التيل ماركت وتحويلها للريسبشن (الذي يعيّن أقرب فني)</p>
        </div>
        <div className="flex gap-2 text-sm">
          {[
            { key: "inbox",        label: `وارد (${tmInbox.length})` },
            { key: "handoffs",     label: `تحويلات (${handoffs.length})` },
            { key: "agents",       label: "الموظفات" },
            { key: "schedule",     label: "المواعيد" },
            { key: "technicians",  label: "حالة الفنيين" },

          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key as any)}
              className={`px-3 py-1.5 rounded-2xl ${tab === t.key ? "bg-white text-red-800" : "bg-white/10 text-white"}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* وارد التيل ماركت */}
      {tab === "inbox" && (
        <div className="grid lg:grid-cols-3 gap-4">
          <div className="p-4 border rounded-2xl shadow-sm bg-white lg:col-span-2">
            <h3 className="font-semibold mb-3">طلبات صيانة واردة من التيل ماركت</h3>
            <div className="flex items-center gap-2 mb-3">
              <input
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="border rounded-2xl p-2 w-full text-sm"
                placeholder="بحث بالاسم/الهاتف/العنوان"
              />
            </div>
            <ul className="space-y-2 text-sm">
              {tmInbox
                .filter(r => (r.name + r.phone + r.address).includes(filter))
                .map(r => {
                  const nearest = findNearestTech(r.lat, r.lng);
                  return (
                    <li key={r.id} className="p-3 border rounded-2xl">
                      <div className="flex items-center justify-between">
                        <div className="font-medium">{r.id} — {r.name}</div>
                        <div className="text-xs text-gray-500">{r.phone}</div>
                      </div>
                      <div className="text-xs text-gray-600 mt-1">العنوان: {r.address}</div>
                      <div className="text-xs text-gray-600">موعد الزيارة (ساعة): {r.time}</div>
                      {r.note && <div className="text-xs text-gray-500 mt-1">ملاحظة: {r.note}</div>}
                      <div className="mt-2 grid sm:grid-cols-3 gap-2 text-xs">
                        <div className="p-2 border rounded-xl">
                          <div className="text-gray-500">أقرب فني (اقتراح)</div>
                          <div className="font-semibold">{nearest.name}</div>
                        </div>
                        <div className="p-2 border rounded-xl">
                          <div className="text-gray-500">المسافة التقديرية</div>
                          <div className="font-semibold">{nearest.d.toFixed(1)} كم</div>
                        </div>
                        <div className="p-2 border rounded-xl">
                          <div className="text-gray-500">الحالة</div>
                          <div className="font-semibold">{nearest.status === "available" ? "متاح" : nearest.status === "busy" ? "مشغول" : "غير متصل"}</div>
                        </div>
                      </div>
                      <div className="mt-3 h-32 border border-dashed rounded-2xl flex items-center justify-center text-gray-500 text-[12px] bg-gray-50">
                        خريطة (وهمي): مسار من الفني المقترح → العميل
                      </div>
                      <div className="mt-3 flex gap-2">
                        <button
                          onClick={() => forwardToReception(r.id)}
                          className="px-4 py-2 rounded-2xl bg-red-800 text-white"
                        >
                          تحويل للريسبشن
                        </button>
                        <button className="px-4 py-2 rounded-2xl border">تفاصيل</button>
                      </div>
                    </li>
                  );
                })}
              {tmInbox.length === 0 && (
                <li className="p-3 border rounded-2xl text-center text-gray-500">لا توجد طلبات حالياً</li>
              )}
            </ul>
          </div>

          {/* تذكير بالإجراء */}
          <div className="p-4 border rounded-2xl shadow-sm bg-white">
            <h4 className="font-semibold mb-2">معلومة</h4>
            <p className="text-sm text-gray-600">
              عند الضغط على <span className="font-semibold">تحويل للريسبشن</span> يتم إرسال الطلب لقسم الريسبشن مع اقتراح أقرب فني؛
              التعيين الفعلي يتم هناك حسب المسافة والحِمل.
            </p>
          </div>
        </div>
      )}

      {/* سجل التحويلات إلى الريسبشن */}
      {tab === "handoffs" && (
        <div className="p-4 border rounded-2xl shadow-sm bg-white">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">تحويلات الريسبشن</h3>
            <div className="text-xs text-gray-500">آخر التحويلات</div>
          </div>
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500">
                  <th className="py-2"># TM</th>
                  <th className="py-2">العميل</th>
                  <th className="py-2">الهاتف</th>
                  <th className="py-2">العنوان</th>
                  <th className="py-2">الساعة</th>
                  <th className="py-2">فني مقترح</th>
                  <th className="py-2">المسافة</th>
                  <th className="py-2">الحالة</th>
                </tr>
              </thead>
              <tbody>
                {handoffs.map(h => (
                  <tr key={h.id} className="border-t">
                    <td className="py-2">{h.id}</td>
                    <td className="py-2">{h.customer}</td>
                    <td className="py-2">{h.phone}</td>
                    <td className="py-2">{h.address}</td>
                    <td className="py-2">{h.time}</td>
                    <td className="py-2">{h.suggestedTechName}</td>
                    <td className="py-2">{h.distanceKm} كم</td>
                    <td className="py-2"><span className="text-amber-700">مرسَل للريسبشن</span></td>
                  </tr>
                ))}
                {handoffs.length === 0 && (
                  <tr><td colSpan={8} className="py-6 text-center text-gray-500">لم يتم تحويل أي طلب بعد</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* تبويب الموظفات (إشراف موجز) */}
      {tab === "agents" && (
        <div className="p-4 border rounded-2xl shadow-sm bg-white">
          <h3 className="font-semibold mb-3">أداء موظفات التيل ماركت (وهمي)</h3>
          <div className="grid md:grid-cols-3 gap-3 text-sm">
            {[
              { name: "نورة", calls: 42, accepts: 9, conv: "21%" },
              { name: "ليان", calls: 35, accepts: 7, conv: "20%" },
              { name: "غادة", calls: 38, accepts: 6, conv: "16%" },
            ].map(a => (
              <div key={a.name} className="p-3 border rounded-2xl">
                <div className="font-medium">{a.name}</div>
                <div className="text-gray-600">مكالمات: {a.calls}</div>
                <div className="text-gray-600">موافقات فحص: {a.accepts}</div>
                <div className="text-gray-600">التحويل: {a.conv}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* تبويباتك السابقة تبقى كما هي */}
      {tab === "schedule" && (
        <div className="p-4 border rounded-2xl shadow-sm bg-white">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">تقويم المواعيد</h3>
            <div className="text-xs text-gray-500">عرض أسبوعي</div>
          </div>
          <div className="h-72 border border-dashed rounded-2xl flex items-center justify-center text-gray-500 text-sm">Placeholder Calendar</div>
        </div>
      )}

      {tab === "technicians" && (
        <div className="grid md:grid-cols-3 gap-4">
          <div className="md:col-span-2 p-4 border rounded-2xl shadow-sm bg-white">
            <h3 className="font-semibold mb-2">الخريطة والمسارات (وهمي)</h3>
            <div className="h-72 border border-dashed rounded-2xl flex items-center justify-center text-gray-500 text-sm">خريطة توضح أقرب فني للعميل + تتبع حي</div>
          </div>
          <div className="p-4 border rounded-2xl shadow-sm bg-white">
            <h4 className="font-semibold mb-2">حالة الفنيين الآن</h4>
            <ul className="text-sm space-y-2">
              {techniciansGeo.map(e => (
                <li key={e.id} className="p-2 border rounded-2xl flex items-center justify-between">
                  <div>
                    <div className="font-medium">{e.name}</div>
                    <div className="text-xs text-gray-500">lat:{e.lat.toFixed(3)} · lng:{e.lng.toFixed(3)}</div>
                  </div>
                  <Badge color={e.status === "available" ? "green" : e.status === "busy" ? "yellow" : "gray"}>
                    {e.status === "available" ? "متاح" : e.status === "busy" ? "مشغول" : "غير متصل"}
                  </Badge>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}


    </div>
  );
}

/***********************
 * شريط اختبار (Test Bars)
 ***********************/
function DevTestBar({ section }: { section: string }) {
  const [msg, setMsg] = useState("\u2705 Self‑tests passed");
  useEffect(() => {
    if (typeof section === "undefined") setMsg("\u274C section undefined");
    else if (typeof section !== "string") setMsg("\u274C section not a string");
    else if (!["admin", "tellmarket", "hr", "accounting", "cctv", "reception"].includes(section)) setMsg("\u26A0\uFE0F unexpected section value");
    else setMsg("\u2705 Self‑tests passed");
  }, [section]);
  return <div className="mt-3 text-xs text-gray-500 text-center">{msg}</div>;
}

function DevSelfTests({ section }: { section: string }) {
  const initialChecked = useRef(false);
  const results: Array<{name:string; pass:boolean; note?:string}> = [];
  results.push({ name: "section هو نص", pass: typeof section === "string" });
  results.push({ name: "section ضمن القيم المسموحة", pass: ["admin", "tellmarket", "hr", "accounting", "cctv", "reception"].includes(section) });
  results.push({ name: "وجود مكوّنات اللوحات", pass: [AdminUI, TellMarketUI, HRPanel, AccountingPanel, CCTVPanel, ReceptionPanel].every(fn => typeof fn === "function") });
  if (!initialChecked.current) initialChecked.current = true;
  return (
    <div className="mt-2 border rounded-2xl p-2 text-xs text-gray-600">
      <div className="font-semibold mb-1">اختبارات إضافية</div>
      <ul className="space-y-1">
        {results.map((r) => (
          <li key={r.name} className={r.pass ? "text-green-700" : "text-red-700"}>
            {r.pass ? "✅" : "❌"} {r.name}{r.note ? ` — ${r.note}` : ""}
          </li>
        ))}
      </ul>
    </div>
  );
}

/***********************
 * التطبيق الجذري — App
 ***********************/
export default function App() {
  const [section, setSection] = useState("admin"); // admin | tellmarket | hr | accounting | cctv | reception

  return (
    <div className="min-h-screen p-6 md:p-10 bg-slate-50 text-gray-900">
      <div className="max-w-7xl mx-auto">
        {/* رأس بنمط الهوية */}
        <header className="mb-6">
          <div className="rounded-3xl p-5 bg-gradient-to-r from-red-800 to-red-600 text-white flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold">الواجهة الإدارية</h1>
              <p className="text-sm text-red-100">لوحات: المدير · Tell Market · HR · المحاسبة · CCTV · الريسبشن</p>
            </div>
            <nav className="flex flex-wrap gap-2">
              <button onClick={() => setSection("admin")} className={`px-4 py-2 rounded-2xl text-sm ${section === "admin" ? "bg-white text-red-800" : "bg-white/10 text-white"}`}>لوحة المدير</button>
              <button onClick={() => setSection("tellmarket")} className={`px-4 py-2 rounded-2xl text-sm ${section === "tellmarket" ? "bg-white text-red-800" : "bg-white/10 text-white"}`}>Tell Market</button>
              <button onClick={() => setSection("Sales_Department")} className={`px-4 py-2 rounded-2xl text-sm ${section === "Sales_Department" ? "bg-white text-red-800" : "bg-white/10 text-white"}`}>Sales_Department</button>
              <button onClick={() => setSection("hr")} className={`px-4 py-2 rounded-2xl text-sm ${section === "hr" ? "bg-white text-red-800" : "bg-white/10 text-white"}`}>HR</button>
              <button onClick={() => setSection("accounting")} className={`px-4 py-2 rounded-2xl text-sm ${section === "accounting" ? "bg-white text-red-800" : "bg-white/10 text-white"}`}>المحاسبة</button>
              <button onClick={() => setSection("warehouse")} className={`px-4 py-2 rounded-2xl text-sm ${section === "warehouse" ? "bg-white text-red-800" : "bg-white/10 text-white"}`}>المستودع</button>
              <button onClick={() => setSection("cctv")} className={`px-4 py-2 rounded-2xl text-sm ${section === "cctv" ? "bg-white text-red-800" : "bg-white/10 text-white"}`}>CCTV</button>
              <button onClick={() => setSection("reception")} className={`px-4 py-2 rounded-2xl text-sm ${section === "reception" ? "bg-white text-red-800" : "bg-white/10 text-white"}`}>الريسبشن</button>
            </nav>
          </div>
        </header>

        <main className="rounded-3xl p-4 md:p-6 border border-slate-200 bg-white mb-6">
          {section === "admin" ? (
            <AdminUI goTo={setSection} />
          ) : section === "tellmarket" ? (
            <TellMarketUI />
          ) : section === "hr" ? (
            <HRPanel />
          ): section === "Sales_Department" ? (
            <Sales_Department />
          ) 
          : section === "accounting" ? (
            <AccountingPanel />
          ) : section === "warehouse" ? (
            <WarehousePanel />
          ) : section === "cctv" ? (
            <CCTVPanel />
          )  : (
            <ReceptionPanel />
          )
          }
          <DevTestBar section={section} />
          <DevSelfTests section={section} />
        </main>

        <footer className="mt-2 text-xs text-gray-500 text-center">تصميم مبدئي (لوحي أولاً) — ألوان الهوية: أحمر داكن + Slate. جميع البيانات المعروضة وهمية لشرح الفكرة.</footer>
      </div>
    </div>
  );
}
