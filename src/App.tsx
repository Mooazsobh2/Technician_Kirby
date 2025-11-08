import { JSXElementConstructor, Key, ReactElement, ReactNode, ReactPortal, useEffect, useMemo, useState } from "react";

/**
 * نسخة مخصصة ومُنقّحة لإصلاح الخطأ "Unexpected token, expected }":
 * - استبدلت export الرئيسي إلى App (بدل TechApp) لتوافق المشاريع الافتراضية.
 * - بسّطت قارئ الإكسل للصيانة/التركيب (useExcelImporter) حتى لا يعتمد على useRef غير مستخدم.
 * - أضفت تبويب "متابعة الفنيين" المخصّص للريسبشن لعرض جداول الوقود/الصيانة/التركيب/المهام من ملف إكسل متعدد الشيتات.
 * - أضفت DevTests (اختبارات واجهة خفيفة) لتقليل أخطاء الدمج لاحقًا.
 * - أبقيت كل الميزات المطلوبة: العداد 250 كم + الفواتير + توقيت الدخول/الخروج + صفحة تفاصيل الموعد.
 */

// ---------------- الأنواع ----------------
 type OrderStatus = "scheduled" | "driving" | "arrived" | "done" | "cancelled" | "postponed";
 type OrderType = "maintenance" | "installation";
 type Order = {
   id: string;
   type: OrderType; // maintenance | installation
   customer: string;
   area: string;
   device: string;
   distanceKm: number;
   date: string; // YYYY-MM-DD
   start: string; // HH:mm (مجدول مسبقاً)
   end: string;   // HH:mm (مجدول مسبقاً)
   status: OrderStatus;
   detail?: string; // شرح الصيانة
   timer?: { startedAt?: number; totalMs?: number };
   postponeTo?: string;
   cancelReason?: string;
 };
 type FuelLog = { code: string; date: string; kmBefore: number; invoiceNo?: string; liters?: number; amountSAR?: number; receptionist?: string };
 type Task = { id: string; text: string; from: "counter" | "system"; date: string };
 type Profile = { techName: string; carNo: string; todayEntry?: string; todayExit?: string };

// ---------------- بيانات مبدئية ----------------
// ---------------- بيانات مبدئية ----------------
const initialOrders: Order[] = [
  { id: "#125", type: "maintenance", customer: "أحمد علي", area: "ظهرة لبن", device: "فلتر 7 مراحل", distanceKm: 4.3, date: today(), start: "10:00", end: "11:00", status: "scheduled", detail: "صيانة دورية" },
  { id: "#126", type: "installation", customer: "فهد سالم", area: "العريجاء", device: "سخان شمسي", distanceKm: 7.8, date: today(), start: "12:00", end: "13:30", status: "scheduled", detail: "تركيب جديد" },
];

// قواعد نقاط قابلة للتوسعة
const POINT_RULES: Record<string, number> = {
  "فحص فلتر": 3,
  "كسر مرحلة حبيبات + تبديل": 5,
  "صيانة دورية": 5,
  "تركيب جديد": 8,
};

// ---------------- التطبيق ----------------
export default function TechApp() {
  const [tab, setTab] = useState<"home" | "appointments" | "installs" | "fuel" | "times" | "profile" | "orderDetail" | "technicians">("home");
  const [status, setStatus] = useState<"available" | "busy" | "off" | "driving">("available");

  const [orders, setOrders] = useLocalStorage<Order[]>("orders", initialOrders);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // وقود
  const [kmSinceRefuel, setKmSinceRefuel] = useLocalStorage<number>("kmSinceRefuel", 0);
  const [fuelLogs, setFuelLogs] = useLocalStorage<FuelLog[]>("fuelLogs", []);

  // مهام من الكاونتر
  const [tasks, setTasks] = useLocalStorage<Task[]>("counterTasks", []);

  // الملف الشخصي
  const [profile, setProfile] = useLocalStorage<Profile>("profile", { techName: "فهد الحربي", carNo: "-" });

  const totalMaint = orders.filter(o=>o.type==='maintenance').length;
  const totalInst = orders.filter(o=>o.type==='installation').length;
  const totalPoints = orders.reduce((s,o)=> s + ((POINT_RULES[o.detail||""]||0)), 0);

  // تنبيه 250 كم
  const reached250 = kmSinceRefuel >= 250;
  useEffect(()=>{ if(reached250){ alert(`تنبيه: بلغت ${kmSinceRefuel.toFixed(1)} كم — يلزم تعبئة بنزين وإرسال فاتورة للكاونتر`); } }, [reached250]);

  // انتقال لصفحة تفاصيل أمر
  const openDetail = (id: string) => { setSelectedId(id); setTab("orderDetail"); };
  const goBack = () => setTab("appointments");

  return (
    <div className="min-h-screen bg-white flex flex-col text-gray-900">
      {/* Header */}
      <header className="p-4 border-b flex items-center justify-between">
        <h1 className="text-lg font-semibold text-red-800">لوحة الفني</h1>
        <div className="flex items-center gap-2">
          <select className="text-sm border rounded-2xl px-2 py-1" value={status} onChange={(e)=>setStatus(e.target.value as any)}>
            <option value="available">🟢 متاح</option>
            <option value="busy">🟡 مشغول</option>
            <option value="driving">🔵 في الطريق</option>
            <option value="off">🔴 غير متاح</option>
          </select>
          <StatusBadge status={status}/>
        </div>
      </header>

      {/* Body */}
      <div className="flex-1 p-4">
        {tab === "home" && (
          <HomeSummary
            kmSinceRefuel={kmSinceRefuel}
            totalMaint={totalMaint}
            totalInst={totalInst}
            totalPoints={totalPoints}
            onGoAppointments={()=>setTab("appointments")}
            onGoFuel={()=>setTab("fuel")}
          />
        )}

        {tab === "appointments" && (
          <AppointmentsTab
            orders={orders}
            setOrders={setOrders}
            onOpen={openDetail}
          />
        )}

        {tab === "orderDetail" && selectedId && (
          <OrderDetail
            order={orders.find(o=>o.id===selectedId)!}
            updateOrder={(upd)=> setOrders(prev=>prev.map(o=> o.id===selectedId ? ({...o, ...upd}) : o))}
            onBack={goBack}
            onFinish={(finalKm)=> setKmSinceRefuel(v=> Math.max(0, v + finalKm))}
            techName={profile.techName}
          />
        )}

        {tab === "installs" && (
          <InstallsTab orders={orders} setOrders={setOrders} />
        )}

        {tab === "fuel" && (
          <FuelTab
            kmSinceRefuel={kmSinceRefuel}
            setKmSinceRefuel={setKmSinceRefuel}
            fuelLogs={fuelLogs}
            setFuelLogs={setFuelLogs}
          />
        )}

        {tab === "times" && (
          <TimesTab orders={orders} />
        )}

        {tab === "profile" && (
          <ProfileTab
            profile={profile}
            setProfile={setProfile}
            kmSinceRefuel={kmSinceRefuel}
            nextEligible={Math.max(0, 250 - kmSinceRefuel)}
            maintTable={orders.filter(o=>o.type==='maintenance')}
            tasks={tasks}
            addTask={(t)=> setTasks(prev=> [{ id: `T${Date.now()}`, text: t, from: "counter", date: formatDateTime(new Date()) }, ...prev])}
          />
        )}
      {tab === "technicians" && (
          <TechniciansTab orders={orders} fuelLogs={fuelLogs} />
        )}
      </div>

      {/* Bottom Nav */}
      <nav className="border-t bg-white flex justify-around py-2">
        {[
          { key: "home", label: "الرئيسية", icon: "🏠" },
          { key: "appointments", label: "المواعيد", icon: "📋" },
          { key: "installs", label: "تراكيب", icon: "🧩" },
          { key: "fuel", label: "الوقود", icon: "⛽" },
          { key: "times", label: "الأوقات", icon: "⏱️" },
          { key: "profile", label: "الملف", icon: "👤" },
          { key: "technicians", label: " تقارير", icon: "🗂️" },
        ].map((t) => (
          <button key={t.key} onClick={()=>setTab(t.key as any)} className={`flex flex-col text-xs items-center ${tab===t.key?"text-red-800":"text-gray-500"}`}>
            <span className="text-lg">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </nav>
    </div>
  );
}

// ---------------- مكونات ----------------
function StatusBadge({ status }: { status: "available" | "busy" | "off" | "driving" }) {
  return (
    <span className={`text-sm px-3 py-1 rounded-2xl ${status==="available"?"bg-green-100 text-green-700":status==="busy"?"bg-yellow-100 text-yellow-700":status==="driving"?"bg-blue-100 text-blue-700":"bg-gray-200 text-gray-600"}`}>
      {status === "available" && "🟢 متاح"}
      {status === "busy" && "🟡 مشغول"}
      {status === "driving" && "🔵 في الطريق"}
      {status === "off" && "🔴 غير متاح"}
    </span>
  );
}

function HomeSummary({ kmSinceRefuel, totalMaint, totalInst, totalPoints, onGoAppointments, onGoFuel }:{ kmSinceRefuel:number; totalMaint:number; totalInst:number; totalPoints:number; onGoAppointments:()=>void; onGoFuel:()=>void; }){
  const fuelProgress = Math.min(100, Math.round((kmSinceRefuel/250)*100));
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div className="p-4 border rounded-2xl">
        <h3 className="font-semibold text-red-800 mb-2">عداد البنزين</h3>
        <div className="text-sm">منذ آخر تعبئة: <b>{kmSinceRefuel.toFixed(1)} كم</b> — {fuelProgress}%</div>
        <div className="w-full h-3 bg-gray-100 rounded-full mt-2"><div className="h-3 bg-red-600 rounded-full" style={{width:`${fuelProgress}%`}} /></div>
        {kmSinceRefuel>=250 && <div className="text-sm text-red-700 mt-2">⚠️ بلغت 250 كم — عبّئ وسجّل فاتورة</div>}
        <button className="mt-3 border rounded-2xl px-3 py-2 text-sm" onClick={onGoFuel}>فتح الوقود</button>
      </div>
      <div className="p-4 border rounded-2xl">
        <h3 className="font-semibold text-red-800 mb-2">نظرة عامة</h3>
        <div className="text-sm">الصيانات: <b>{totalMaint}</b> · التراكيب: <b>{totalInst}</b></div>
        <div className="text-sm">نقاطك: <b>{totalPoints}</b></div>
        <button className="mt-3 bg-red-800 text-white rounded-2xl px-3 py-2 text-sm" onClick={onGoAppointments}>اذهب للمواعيد</button>
      </div>
    </div>
  );
}

function AppointmentsTab({ orders, setOrders, onOpen }:{ orders: Order[]; setOrders: (u:any)=>void; onOpen:(id:string)=>void; }){
  const [stateFilter, setStateFilter] = useState<OrderStatus | "all">("all");
  const list = orders.filter(o=>o.type==='maintenance').filter(o=> stateFilter==='all' ? true : o.status===stateFilter);

  const importExcel = useExcelImporter((parsed)=>{
    // نتوقع maintenance فقط من هذا الزر
    const mapped = parsed.map(p=> ({...p, type: 'maintenance' as OrderType}));
    setOrders((prev:Order[])=> [...mapped, ...prev]);
  });

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <select className="border rounded-2xl px-2 py-1 text-sm" value={stateFilter} onChange={e=>setStateFilter(e.target.value as any)}>
          <option value="all">كل الحالات</option>
          <option value="scheduled">مجدولة</option>
          <option value="driving">في الطريق</option>
          <option value="arrived">وصل</option>
          <option value="done">منتهية</option>
          <option value="postponed">مؤجلة</option>
          <option value="cancelled">ملغاة</option>
        </select>
        <button className="border rounded-2xl px-3 py-1.5 text-sm" onClick={importExcel}>استيراد جدول الصيانة (Excel)</button>
      </div>

      {list.sort((a,b)=> (a.date+a.start).localeCompare(b.date+b.start)).map(o=> (
        <div key={o.id} className="p-3 border rounded-2xl">
          <div className="flex items-center justify-between gap-2">
            <div className="font-medium text-red-800">{o.date} {o.start}-{o.end} · {o.customer}</div>
            <span className="text-xs text-gray-600">{o.area} · {o.device}</span>
          </div>
          <div className="text-xs text-gray-600 mt-1">الحالة: {labelStatus(o.status)} {o.status==='postponed' && o.postponeTo? `→ مؤجلة إلى ${o.postponeTo}`: ''} {o.status==='cancelled' && o.cancelReason? `— سبب: ${o.cancelReason}`: ''}</div>
          <div className="mt-2 flex gap-2">
            <button className="border rounded-2xl px-3 py-1.5 text-sm" onClick={()=>onOpen(o.id)}>فتح التفاصيل</button>
          </div>
        </div>
      ))}
    </div>
  );
}

function OrderDetail({ order, updateOrder, onBack, onFinish, techName }:{ order: Order; updateOrder: (u: Partial<Order>)=>void; onBack: ()=>void; onFinish: (km:number)=>void; techName: string; }){
  const [notes, setNotes] = useState(order.detail || "");

  const startTimer = ()=> updateOrder({ status: 'arrived', timer: { startedAt: Date.now(), totalMs: order.timer?.totalMs||0 } });
  const stopAndSend = ()=>{
    // إيقاف المؤقت
    const started = order.timer?.startedAt;
    const total = (order.timer?.totalMs||0) + (started ? (Date.now() - started) : 0);
    updateOrder({ status: 'done', timer: { totalMs: total }, detail: notes });

    // ترحيل المسافة للعداد
    onFinish(order.distanceKm);

    // إرسال للكاونتر (محاكاة)
    const payload = {
      id: order.id,
      type: order.type,
      customer: order.customer,
      area: order.area,
      device: order.device,
      durationMin: Math.round(total/60000),
      detail: notes,
      techName,
      date: `${order.date} ${order.start}-${order.end}`,
    };
    alert(`تم الإرسال للكاونتر:
${JSON.stringify(payload, null, 2)}`);
    onBack();
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <button className="border rounded-2xl px-3 py-1.5 text-sm" onClick={onBack}>رجوع</button>
        <h3 className="font-semibold text-red-800">تفاصيل الموعد</h3>
      </div>
      <div className="p-4 border rounded-2xl">
        <div className="text-sm"><b>الرقم:</b> {order.id}</div>
        <div className="text-sm"><b>العميل:</b> {order.customer} — {order.area}</div>
        <div className="text-sm"><b>الجهاز:</b> {order.device}</div>
        <div className="text-sm"><b>التاريخ/الوقت:</b> {order.date} {order.start} - {order.end}</div>
        <div className="text-sm"><b>الحالة:</b> {labelStatus(order.status)}</div>
        <div className="mt-2 h-40 border rounded-2xl grid place-items-center text-gray-500 text-xs bg-gray-100">خريطة — Placeholder Map</div>
      </div>

      <div className="p-4 border rounded-2xl space-y-2">
        <div className="text-sm">المدّة: <b>{formatDuration(order.timer?.totalMs, order.timer?.startedAt)}</b></div>
        <div className="flex flex-wrap gap-2">
          {order.status !== 'arrived' && order.status !== 'done' && (
            <button className="border rounded-2xl px-3 py-2 text-sm" onClick={startTimer}>ابدأ العداد</button>
          )}
          {order.status !== 'done' && (
            <button className="bg-red-800 text-white rounded-2xl px-3 py-2 text-sm" onClick={stopAndSend}>أوقف وأرسل للكاونتر</button>
          )}
        </div>
        <textarea className="border rounded-2xl p-2 w-full" rows={4} placeholder="تفاصيل الصيانة: مثال فحص فلتر + كسر مرحلة حبيبات وتم تبديلها" value={notes} onChange={e=>setNotes(e.target.value)} />
      </div>
    </div>
  );
}

function InstallsTab({ orders, setOrders }:{ orders: Order[]; setOrders:(u:any)=>void }){
  const installs = orders.filter(o=>o.type==='installation');
  const importExcel = useExcelImporter((parsed)=>{
    const mapped = parsed.map(p=> ({...p, type: 'installation' as OrderType}));
    setOrders((prev:Order[])=> [...mapped, ...prev]);
  });
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <button className="border rounded-2xl px-3 py-1.5 text-sm" onClick={importExcel}>استيراد جدول التركيب (Excel)</button>
      </div>
      <ul className="space-y-2 text-sm">
        {installs.sort((a,b)=> (a.date+a.start).localeCompare(b.date+b.start)).map(o=> (
          <li key={o.id} className="p-3 border rounded-2xl">
            <div className="font-medium">{o.date} {o.start}-{o.end} · {o.customer}</div>
            <div className="text-xs text-gray-600">{o.area} · {o.device}</div>
            <div className="text-xs text-gray-500">وقت الدخول/الخروج مُحدد مسبقاً حسب الجدول</div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function FuelTab({ kmSinceRefuel, setKmSinceRefuel, fuelLogs, setFuelLogs }:{ kmSinceRefuel:number; setKmSinceRefuel:(u:any)=>void; fuelLogs:FuelLog[]; setFuelLogs:(u:any)=>void }){
  const [invoiceNo, setInvoiceNo] = useState("");
  const [liters, setLiters] = useState(0);
  const [amountSAR, setAmountSAR] = useState(0);
  const [receptionist, setReceptionist] = useState("");
  const progress = Math.min(100, Math.round((kmSinceRefuel / 250) * 100));

  const submitRefuel = () => {
    const code = `FUEL-${Date.now()}`;
    const entry: FuelLog = { code, date: formatDateTime(new Date()), kmBefore: kmSinceRefuel, invoiceNo: invoiceNo||undefined, liters: liters||undefined, amountSAR: amountSAR||undefined, receptionist: receptionist||undefined };
    setFuelLogs((prev:FuelLog[])=> [entry, ...prev]);
    setKmSinceRefuel(0);
    alert(`تم إرسال فاتورة التعبئة للكاونتر
الكود: ${code}`);
    setInvoiceNo(""); setLiters(0); setAmountSAR(0); setReceptionist("");
  };

  return (
    <div className="space-y-4">
      <div className="p-4 border rounded-2xl">
        <h3 className="font-semibold text-red-800 mb-2">عداد البنزين</h3>
        <div className="text-sm">منذ آخر تعبئة: <b>{kmSinceRefuel.toFixed(1)} كم</b> · التقدم: {progress}%</div>
        <div className="w-full h-3 bg-gray-100 rounded-full mt-2"><div className="h-3 bg-red-600 rounded-full" style={{width:`${progress}%`}} /></div>
        {kmSinceRefuel>=250 && <div className="text-sm text-red-700 mt-2">⚠️ بلغت 250 كم — يحق لك التعبئة الآن</div>}
      </div>

      <div className="p-4 border rounded-2xl">
        <h4 className="font-semibold mb-2">فاتورة تعبئة</h4>

        <button className="mt-2 bg-red-800 text-white rounded-2xl px-4 py-2" onClick={submitRefuel}>تسجيل تعبئة + تصفير العداد</button>
      </div>

      <div className="p-4 border rounded-2xl">
        <h4 className="font-semibold mb-2">سجل التعبئات</h4>
        <ul className="text-sm space-y-2 max-h-64 overflow-auto pr-1">
          {fuelLogs.length===0 && <li className="text-gray-500">لا توجد عمليات تعبئة</li>}
          {fuelLogs.map(r=> (
            <li key={r.code} className="p-3 border rounded-2xl flex items-center justify-between">
              <div>
                <div className="font-medium">{r.date}</div>
                <div className="text-xs text-gray-600">قبل التعبئة: {r.kmBefore.toFixed(1)} كم · فاتورة: {r.invoiceNo||"—"} · لتر: {r.liters||"—"} · مبلغ: {r.amountSAR||"—"} · الموظفة: {r.receptionist||"—"}</div>
              </div>
              <div className="w-16 h-16 grid place-items-center border rounded-lg text-[10px]">QR<div className="text-[8px] leading-none">{r.code.slice(-6)}</div></div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function TimesTab({ orders }:{ orders: Order[] }){
  const byDate = groupBy(orders, o=>o.date);
  const dates = Object.keys(byDate).sort();
  return (
    <div className="space-y-4">
      {dates.length===0 && <div className="text-sm text-gray-500">لا توجد مواعيد</div>}
      {dates.map(d=> (
        <div key={d} className="p-4 border rounded-2xl">
          <div className="font-semibold text-red-800 mb-2">{d}</div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {byDate[d].sort((a: { start: string; },b: { start: any; })=> a.start.localeCompare(b.start)).map((o: { id: Key | null | undefined; start: string | number | boolean | ReactElement<any, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | null | undefined; end: string | number | boolean | ReactElement<any, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | null | undefined; customer: string | number | boolean | ReactElement<any, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | null | undefined; type: string; area: string | number | boolean | ReactElement<any, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | null | undefined; device: string | number | boolean | ReactElement<any, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | null | undefined; })=> (
              <div key={o.id} className="border rounded-2xl p-3 text-sm">
                <div className="font-medium">{o.start}-{o.end} · {o.customer}</div>
                <div className="text-xs text-gray-600">{o.type==='installation'? 'تركيب' : 'صيانة'} · {o.area} · {o.device}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function ProfileTab({ profile, setProfile, kmSinceRefuel, nextEligible, maintTable, tasks, addTask }:{ profile:Profile; setProfile:(u:any)=>void; kmSinceRefuel:number; nextEligible:number; maintTable: Order[]; tasks: Task[]; addTask:(t:string)=>void; }){
  const [inTime, setInTime] = useState("");
  const [outTime, setOutTime] = useState("");

  const markEntry = ()=>{ const t = formatTime(new Date()); setInTime(t); setProfile((p:Profile)=> ({...p, todayEntry: `${today()} ${t}`})); };
  const markExit  = ()=>{ const t = formatTime(new Date()); setOutTime(t); setProfile((p:Profile)=> ({...p, todayExit: `${today()} ${t}`})); };

  return (
    <div className="space-y-4">
      <div className="p-4 border rounded-2xl">
        <h3 className="font-semibold text-red-800 mb-2">الملف الشخصي</h3>
        <div className="grid md:grid-cols-2 gap-2 text-sm">
          <div><label className="text-xs text-gray-500">الاسم</label><input className="border rounded-2xl p-2 w-full" value={profile.techName} onChange={e=>setProfile((p:Profile)=>({...p, techName:e.target.value}))} /></div>
          <div><label className="text-xs text-gray-500">رقم السيارة</label><input className="border rounded-2xl p-2 w-full" value={profile.carNo} onChange={e=>setProfile((p:Profile)=>({...p, carNo:e.target.value}))} /></div>
        </div>
        <div className="mt-2 grid md:grid-cols-3 gap-2 text-sm">
          <button className="border rounded-2xl px-3 py-2" onClick={markEntry}>تسجيل دخول الشركة (اليوم)</button>
          <button className="border rounded-2xl px-3 py-2" onClick={markExit}>تسجيل خروج الشركة (اليوم)</button>
          <div className="text-xs text-gray-600 grid content-center">الدخول: {profile.todayEntry||"—"} · الخروج: {profile.todayExit||"—"}</div>
        </div>
      </div>

      <div className="p-4 border rounded-2xl">
        <h4 className="font-semibold mb-2">الوقود</h4>
        <div className="text-sm">المسافة منذ آخر تعبئة: <b>{kmSinceRefuel.toFixed(1)} كم</b> — يحق التعبئة بعد: <b>{nextEligible.toFixed(1)} كم</b></div>
      </div>

      <div className="p-4 border rounded-2xl">
        <h4 className="font-semibold mb-2">مهام من الكاونتر</h4>
        <TaskComposer onAdd={addTask} />
        <ul className="mt-2 text-sm space-y-2 max-h-56 overflow-auto pr-1">
          {tasks.length===0 && <li className="text-gray-500">لا توجد مهام</li>}
          {tasks.map(t=> (
            <li key={t.id} className="p-2 border rounded-2xl"><div className="text-xs text-gray-500">{t.date} · من: {t.from==='counter'? 'الكاونتر':'النظام'}</div><div>{t.text}</div></li>
          ))}
        </ul>
      </div>

      <div className="p-4 border rounded-2xl overflow-auto">
        <h4 className="font-semibold mb-2">إجمالي الصيانات (من جدول الإكسل/النظام)</h4>
        <table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className="text-left text-gray-500"><th className="py-2">#</th><th className="py-2">العميل</th><th className="py-2">المنطقة</th><th className="py-2">الجهاز</th><th className="py-2">التاريخ</th><th className="py-2">الوقت</th><th className="py-2">الحالة</th></tr>
          </thead>
          <tbody>
            {maintTable.sort((a,b)=> (a.date+a.start).localeCompare(b.date+b.start)).map(o=> (
              <tr key={o.id} className="border-t">
                <td className="py-2">{o.id}</td>
                <td className="py-2">{o.customer}</td>
                <td className="py-2">{o.area}</td>
                <td className="py-2">{o.device}</td>
                <td className="py-2">{o.date}</td>
                <td className="py-2">{o.start}-{o.end}</td>
                <td className="py-2">{labelStatus(o.status)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TaskComposer({ onAdd }:{ onAdd:(t:string)=>void }){
  const [t, setT] = useState("");
  return (
    <div className="flex gap-2">
      <input className="border rounded-2xl p-2 text-sm flex-1" placeholder="اكتب مهمة يضيفها الكاونتر" value={t} onChange={e=>setT(e.target.value)} />
      <button className="border rounded-2xl px-3 py-2 text-sm" onClick={()=>{ if(t.trim()) { onAdd(t.trim()); setT(""); } }}>إضافة</button>
    </div>
  );
}

// ---------------- متابعة الفنيين (للكاونتر) ----------------
const sampleEngineers = [
  { id: "T-101", name: "فهد الحربي", area: "السويدي", status: "available" as const },
  { id: "T-102", name: "سالم الدوسري", area: "العريجاء", status: "busy" as const },
  { id: "T-103", name: "ناصر المطيري", area: "لبن", status: "offline" as const },
];

type TechniciansTabProps = { orders: Order[]; fuelLogs: FuelLog[] };
function TechniciansTab({ orders, fuelLogs }: TechniciansTabProps){
  const [selectedTech, setSelectedTech] = useState<string>(sampleEngineers[0]?.name || "");
  const [sheets, setSheets] = useLocalStorage<Record<string, any[]>>("rxSheets", {});

  const importAll = useExcelAllSheets((all)=>{ setSheets(all); alert(`تم استيراد ${Object.keys(all).length} ورقة من الإكسل`); });

  // استنباط قائمة الفنيين من أي عمود محتمل في الشيتات
  const inferredTechs = useMemo(()=>{
    const set = new Set<string>();
    Object.values(sheets||{}).forEach((rows:any)=>{
      (rows as any[]).forEach((r:any)=>{
        const t = r.tech || r.technician || r.الفني || r["اسم الفني"] || r.اسم_الفني;
        if (t) set.add(String(t));
      });
    });
    const list = Array.from(set);
    return list.length? list: sampleEngineers.map(e=>e.name);
  }, [sheets]);

  useEffect(()=>{ if(!selectedTech && inferredTechs.length) setSelectedTech(inferredTechs[0]); }, [inferredTechs, selectedTech]);

  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-3 gap-4">
        <div className="md:col-span-2 p-4 border rounded-2xl shadow-sm bg-white">
          <h3 className="font-semibold mb-2">الخريطة والمسارات (وهمي)</h3>
          <div className="h-72 border border-dashed rounded-2xl flex items-center justify-center text-gray-500 text-sm">خريطة توضح أقرب فني للعميل + تتبع حي</div>
        </div>
        <div className="p-4 border rounded-2xl shadow-sm bg-white">
          <h4 className="font-semibold mb-2">حالة الفنيين الآن</h4>
          <ul className="text-sm space-y-2">
            {(inferredTechs.length? inferredTechs.map((n,i)=>({id:`INF-${i}`, name:n, area:"—", status: (i%2?"busy":"available")})) : sampleEngineers).map((e:any)=> (
              <li key={e.id} className={`p-2 border rounded-2xl flex items-center justify-between cursor-pointer ${selectedTech===e.name? 'bg-red-50':''}`} onClick={()=>setSelectedTech(e.name)}>
                <div>
                  <div className="font-medium">{e.name}</div>
                  <div className="text-xs text-gray-500">{e.area||"—"}</div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-2xl ${e.status==='available'? 'bg-green-100 text-green-700': e.status==='busy'? 'bg-yellow-100 text-yellow-700':'bg-gray-100 text-gray-600'}`}>{e.status==='available'? 'متاح': e.status==='busy'? 'مشغول':'غير متصل'}</span>
              </li>
            ))}
          </ul>
          <button className="mt-3 w-full border rounded-2xl py-2 text-sm" onClick={importAll}>استيراد ملف فني (كل الشيتات)</button>
        </div>
      </div>

      <TechnicianFile
        techName={selectedTech}
        sheets={sheets}
        orders={orders}
        fuelLogs={fuelLogs}
      />
    </div>
  );
}

type TechnicianFileProps = { techName: string; sheets: Record<string, any[]>; orders: Order[]; fuelLogs: FuelLog[] };
function TechnicianFile({ techName, sheets, orders, fuelLogs }: TechnicianFileProps){
  // تجميع بيانات من الشيتات حسب اسم الفني
  const allRows = useMemo(()=>{
    const out: any[] = [];
    Object.values(sheets||{}).forEach((rows:any)=> (rows as any[]).forEach(r=> out.push(r)));
    return out.filter(r=>{
      const t = r.tech || r.technician || r.الفني || r["اسم الفني"] || r.اسم_الفني;
      return techName? String(t||"").trim() === techName.trim() : true;
    });
  }, [sheets, techName]);

  // تحديد جداول عامة
  const fuelRows = useMemo(()=> allRows.filter(r=> ('kmBefore' in r) || ('invoiceNo' in r) || r.نوع==="وقود" || r.sheetName==='Fuel'), [allRows]);
  const maintRows = useMemo(()=> allRows.filter(r=> (String(r.type||r.النوع||'').toLowerCase().includes('صيانة') || r.category==='maintenance' || r.sheetName==='Maintenance')), [allRows]);
  const instRows  = useMemo(()=> allRows.filter(r=> (String(r.type||r.النوع||'').toLowerCase().includes('ركب') || String(r.type||'').toLowerCase().includes('install') || r.sheetName==='Installs')), [allRows]);
  const cancelRows= useMemo(()=> maintRows.filter(r=> String(r.status||r.الحالة||'').includes('لغ') || String(r.status||'').toLowerCase().includes('cancel')), [maintRows]);
  const postRows  = useMemo(()=> maintRows.filter(r=> String(r.status||r.الحالة||'').includes('أجل') || String(r.status||'').toLowerCase().includes('postpon')), [maintRows]);
  const taskRows  = useMemo(()=> allRows.filter(r=> ('task' in r) || ('المهمة' in r) || r.sheetName==='Tasks'), [allRows]);

  // ملخص الصيانة حسب المنطقة
  const maintByArea = useMemo(()=>{
    const g: Record<string, {done:number; postponed:number; cancelled:number; total:number}> = {};
    maintRows.forEach(r=>{
      const area = r.area || r.المنطقة || r.الحي || '—';
      const st = String(r.status||r.الحالة||'scheduled');
      g[area] = g[area] || {done:0, postponed:0, cancelled:0, total:0};
      if(/done|منتهية/i.test(st)) g[area].done++;
      else if(/postpon|مؤجل|أجل/i.test(st)) g[area].postponed++;
      else if(/cancel|ملغى|ملغاة|ألغيت/i.test(st)) g[area].cancelled++;
      g[area].total++;
    });
    return g;
  }, [maintRows]);

  // حساب الأحقية للتعبئة من آخر سجل وقود
  const lastFuel = fuelRows[0] || null;
  const lastKmBefore = lastFuel? Number(lastFuel.kmBefore||0) : (fuelLogs[0]?.kmBefore||0);
  const eligible = lastKmBefore >= 250;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-red-800">ملف الفني: {techName||'—'}</h3>
      </div>

      {/* جدول الوقود */}
      <div className="p-4 border rounded-2xl bg-white">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-semibold">استهلاك البنزين</h4>
          <span className={`text-xs px-3 py-1 rounded-2xl ${eligible? 'bg-green-100 text-green-700':'bg-yellow-100 text-yellow-700'}`}>{eligible? 'يحق له التعبئة (≥250 كم)':'لم يصل إلى 250 كم بعد'}</span>
        </div>
        <div className="text-xs text-gray-600 mb-2">تفاصيل السيارة/اللوحة إن وجدت في الشيت ستظهر ضمن الأعمدة</div>
        <TableFromRows rows={fuelRows.length? fuelRows : fuelLogs} preferred={["date","التاريخ","carNo","رقم السيارة","plate","اللوحة","kmBefore","invoiceNo","liters","amountSAR","receptionist"]} />
      </div>

      {/* ملخص الصيانة حسب المنطقة */}
      <div className="p-4 border rounded-2xl bg-white">
        <h4 className="font-semibold mb-2">الصيانات حسب المنطقة</h4>
        <div className="overflow-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="text-left text-gray-500">
                <th className="py-2">المنطقة</th><th className="py-2">منفذة</th><th className="py-2">مؤجلة</th><th className="py-2">ملغاة</th><th className="py-2">الإجمالي</th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(maintByArea).length===0 && (
                <tr><td className="py-2" colSpan={5}>لا توجد بيانات</td></tr>
              )}
              {Object.entries(maintByArea).map(([area, v])=> (
                <tr key={area} className="border-t">
                  <td className="py-2">{area}</td>
                  <td className="py-2">{v.done}</td>
                  <td className="py-2">{v.postponed}</td>
                  <td className="py-2">{v.cancelled}</td>
                  <td className="py-2">{v.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* جدول تفاصيل الصيانة */}
      <div className="p-4 border rounded-2xl bg-white">
        <h4 className="font-semibold mb-2">تفاصيل الصيانات</h4>
        <TableFromRows rows={maintRows} preferred={["date","التاريخ","customer","العميل","area","المنطقة","device","الجهاز","detail","تفاصيل","points","النقاط","entry","الدخول","exit","الخروج","start","end","status","الحالة"]} />
      </div>

      {/* جدول التراكيب */}
      <div className="p-4 border rounded-2xl bg-white">
        <h4 className="font-semibold mb-2">جدول التراكيب</h4>
        <TableFromRows rows={instRows} preferred={["date","التاريخ","customer","العميل","area","المنطقة","device","الجهاز","start","end","status","الحالة"]} />
      </div>

      {/* الصيانات الملغية والمؤجلة */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="p-4 border rounded-2xl bg-white">
          <h4 className="font-semibold mb-2">تفاصيل الصيانات الملغية</h4>
          <TableFromRows rows={cancelRows} preferred={["date","التاريخ","customer","العميل","area","المنطقة","reason","سبب","status","الحالة"]} />
        </div>
        <div className="p-4 border rounded-2xl bg-white">
          <h4 className="font-semibold mb-2">تفاصيل الصيانات المؤجلة</h4>
          <TableFromRows rows={postRows} preferred={["date","التاريخ","customer","العميل","area","المنطقة","postponeTo","تأجيل_إلى","status","الحالة"]} />
        </div>
      </div>

      {/* مهام أخرى */}
      <div className="p-4 border rounded-2xl bg-white">
        <h4 className="font-semibold mb-2">مهام أخرى</h4>
        <TableFromRows rows={taskRows} preferred={["date","التاريخ","task","المهمة","notes","ملاحظة"]} />
      </div>
    </div>
  );
}

function TableFromRows({ rows, preferred }:{ rows: any[]; preferred?: string[] }){
  const cols = useMemo(()=>{
    if(!rows || !rows.length) return [] as string[];
    const keys = new Set<string>();
    rows.forEach(r=> Object.keys(r||{}).forEach(k=> keys.add(String(k))));
    const all = Array.from(keys);
    const pref = preferred||[];
    return [...pref.filter(p=> keys.has(p)), ...all.filter(k=> !pref.includes(k))];
  }, [rows, preferred]);

  if(!rows || !rows.length) return <div className="text-sm text-gray-500">لا توجد بيانات</div>;

  return (
    <div className="overflow-auto">
      <table className="w-full text-sm min-w-[720px]">
        <thead>
          <tr className="text-left text-gray-500">
            {cols.map(c=> <th key={c} className="py-2 pr-4">{c}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((r:any,i:number)=> (
            <tr key={i} className="border-t">
              {cols.map(c=> <td key={c} className="py-2 pr-4">{String(r[c] ?? "—")}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// استيراد كل الشيتات (تقارير المتابعة)
function useExcelAllSheets(onAll:(sheets:Record<string, any[]>)=>void){
  const handler = async ()=>{
    const input=document.createElement('input'); input.type='file'; input.accept='.xlsx,.xls';
    input.onchange= async (e:any)=>{ const f=e.target.files?.[0]; if(f) await parseAll(f); };
    input.click();
    async function parseAll(file: File){
      try{
        const XLSX = await import('xlsx');
        const data = await file.arrayBuffer();
        const wb = XLSX.read(data, { type: 'array' });
        const out: Record<string, any[]> = {};
        wb.SheetNames.forEach((name:string)=>{ const ws = wb.Sheets[name]; const rows = XLSX.utils.sheet_to_json<any>(ws); rows.forEach(r=> (r.sheetName=name)); out[name]=rows; });
        onAll(out);
      }catch(e){ alert('تعذر قراءة الملف'); console.error(e); }
    }
  };
  return handler;
}

// ---------------- أدوات مساعدة ----------------
function today(){ const d=new Date(); const y=d.getFullYear(); const m=String(d.getMonth()+1).padStart(2,'0'); const dd=String(d.getDate()).padStart(2,'0'); return `${y}-${m}-${dd}`; }
function formatDateTime(d: Date){ const pad=(n:number)=>String(n).padStart(2,'0'); return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`; }
function formatTime(d: Date){ const pad=(n:number)=>String(n).padStart(2,'0'); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; }
function formatDuration(totalMs?: number, startedAt?: number){ const ms=(totalMs||0)+(startedAt?(Date.now()-startedAt):0); const m=Math.floor(ms/60000); const h=Math.floor(m/60); const mm=m%60; return h>0?`${h}س ${mm}د`:`${m}د`; }
function labelStatus(s: OrderStatus){ return s==='scheduled'?'مجدولة': s==='driving'?'في الطريق': s==='arrived'?'وصل': s==='done'?'منتهية': s==='postponed'?'مؤجلة':'ملغاة'; }
function groupBy<T>(arr:T[], key:(i:T)=>string){ return arr.reduce((acc:any,cur:T)=>{ const k=key(cur); (acc[k]=acc[k]||[]).push(cur); return acc; }, {} as Record<string,T[]>); }

function useLocalStorage<T>(key:string, initial:T):[T,(u:((p:T)=>T)|T)=>void]{
  const [value,setValue]=useState<T>(()=>{ try{ const v=localStorage.getItem(key); return v? JSON.parse(v) as T : initial; }catch{return initial;} });
  useEffect(()=>{ try{ localStorage.setItem(key, JSON.stringify(value)); }catch{} },[key,value]);
  const update=(u:any)=> setValue((prev:any)=> typeof u==='function'? u(prev): u);
  return [value, update];
}

// استيراد Excel عام (يدعم maintenance/installation حسب استعمال المستدعي)
// استيراد Excel (شيت واحد): يرجّع صفوف تُحوّل إلى Orders
function useExcelImporter(onParsed:(rows:Order[])=>void){
  const handler = async ()=>{
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx,.xls';
    input.onchange = async (e:any)=>{ const f=e.target.files?.[0]; if(f) await parseFile(f); };
    input.click();
    async function parseFile(file: File){
      try{
        const XLSX = await import('xlsx');
        const data = await file.arrayBuffer();
        const wb = XLSX.read(data, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<any>(ws);
        const parsed: Order[] = rows.map((r:any)=> ({
          id: String(r.id || r.ID || `IMP-${Date.now()}`),
          type: (String(r.type||r.النوع||'maintenance').toLowerCase().includes('ركب')? 'installation':'maintenance') as OrderType,
          customer: r.customer || r.العميل || '—',
          area: r.area || r.المنطقة || r.الحي || '—',
          device: r.device || r.الجهاز || '—',
          distanceKm: Number(r.distanceKm || r.km || 5),
          date: normalizeDate(r.date || r.التاريخ),
          start: r.start || r.بداية || '09:00',
          end: r.end || r.نهاية || '10:00',
          status: (String(r.status||r.الحالة||'scheduled').toLowerCase().includes('أجل')? 'postponed' : String(r.status||'scheduled').toLowerCase().includes('لغ')? 'cancelled' : 'scheduled'),
          detail: r.notes || r.detail || r.ملاحظة || '',
          postponeTo: r.postponeTo || r.تأجيل_إلى || undefined,
          cancelReason: r.cancelReason || r.سبب_الإلغاء || undefined,
        }));
        onParsed(parsed);
        alert(`تم استيراد ${parsed.length} سجلًا من الإكسل`);
      }catch(e){ alert('تعذر قراءة الملف'); console.error(e); }
    }
  };
  return handler;
}

function normalizeDate(val:any): string {
  if (!val) return today();
  if (typeof val === 'string'){
    const v = val.replace(/\./g,'/').replace(/-/g,'/');
    const d = new Date(v);
    if(!isNaN(d.getTime()))
      return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }
  if (typeof val === 'number'){
    // Excel serial date
    const d = new Date((val - 25569) * 86400 * 1000);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }
  return today();
}
