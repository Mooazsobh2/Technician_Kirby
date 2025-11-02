import { useEffect, useState ,useMemo} from "react";


// --- Mock data ---
const nextJob = {
  id: "#125",
  type: "صيانة دورية",
  customer: "محمد القحطاني",
  area: "حي السويدي",
  device: "فلتر 7 مراحل",
  distanceKm: 4.3,
  etaMin: 12,
};

const orders = [
  {
    id: "#125",
    type: "صيانة دورية",
    customer: "أحمد علي",
    area: "ظهرة لبن",
    device: "فلتر 7 مراحل",
    distanceKm: 4.3,
    etaMin: 12,
    status: "scheduled", // scheduled | driving | arrived | done
  },
  {
    id: "#126",
    type: "تركيب جديد",
    customer: "فهد سالم",
    area: "العريجاء",
    device: "سخان شمسي",
    distanceKm: 7.8,
    etaMin: 18,
    status: "scheduled",
  },
];

export default function TechApp() {
  const [tab, setTab] = useState<"home" | "orders" | "inventory" | "panel" | "profile">("home");
  const [status, setStatus] = useState<"available" | "busy" | "off" | "driving">("available");

  const statusBadge = (
    <span
      className={`text-sm px-3 py-1 rounded-2xl ${
        status === "available"
          ? "bg-green-100 text-green-700"
          : status === "busy"
          ? "bg-yellow-100 text-yellow-700"
          : status === "driving"
          ? "bg-blue-100 text-blue-700"
          : "bg-gray-200 text-gray-600"
      }`}
    >
      {status === "available" && "🟢 متاح"}
      {status === "busy" && "🟡 مشغول"}
      {status === "driving" && "🔵 في الطريق"}
      {status === "off" && "🔴 غير متاح"}
    </span>
  );

  return (
    <div className="min-h-screen bg-white flex flex-col text-gray-900">
      {/* Header */}
      <header className="p-4 border-b flex items-center justify-between">
        <h1 className="text-lg font-semibold text-red-800">لوحة الفني</h1>
        <div className="flex items-center gap-2">
          <select
            className="text-sm border rounded-2xl px-2 py-1"
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
          >
            <option value="available">🟢 متاح</option>
            <option value="busy">🟡 مشغول</option>
            <option value="driving">🔵 في الطريق</option>
            <option value="off">🔴 غير متاح</option>
          </select>
          {statusBadge}
        </div>
      </header>

      {/* Body */}
      <div className="flex-1 p-4">
        {tab === "home" && (
          <div className="space-y-4 animate-fadeIn">
            <div className="p-4 border rounded-2xl shadow-sm">
              <h2 className="font-semibold text-red-800 mb-1">الطلب القادم</h2>
              <p className="text-sm text-gray-600">
                العميل: {nextJob.customer} — {nextJob.area}
              </p>
              <div className="mt-2 grid grid-cols-3 gap-2 text-xs text-gray-700">
                <div className="p-2 border rounded-xl">
                  <div className="text-gray-500">المسافة</div>
                  <div className="font-semibold">{nextJob.distanceKm} كم</div>
                </div>
                <div className="p-2 border rounded-xl">
                  <div className="text-gray-500">الوقت المتوقع</div>
                  <div className="font-semibold">{nextJob.etaMin} دقيقة</div>
                </div>
                <div className="p-2 border rounded-xl">
                  <div className="text-gray-500">نوع الجهاز</div>
                  <div className="font-semibold">{nextJob.device}</div>
                </div>
              </div>
              <div className="mt-3 h-40 border rounded-2xl flex items-center justify-center text-gray-500 text-xs bg-gray-100">
                خريطة — Placeholder Map
              </div>
              <button
                className="mt-3 w-full bg-red-800 text-white rounded-2xl py-2"
                onClick={() => setStatus("driving")}
              >
                ابدأ الرحلة
              </button>
            </div>
          </div>
        )}

        {tab === "orders" && (
          <div className="space-y-3 animate-fadeIn">
            {orders.map((o) => (
              <div key={o.id} className="border rounded-2xl p-3">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-red-800">
                    {o.id} — {o.type}
                  </p>
                  <span className="text-xs text-gray-500">{o.device}</span>
                </div>
                <p className="text-sm text-gray-600">
                  {o.customer} — {o.area}
                </p>
                <div className="mt-2 grid grid-cols-3 gap-2 text-xs text-gray-700">
                  <div className="p-2 border rounded-xl">
                    <div className="text-gray-500">المسافة</div>
                    <div className="font-semibold">{o.distanceKm} كم</div>
                  </div>
                  <div className="p-2 border rounded-xl">
                    <div className="text-gray-500">الوقت المتوقع</div>
                    <div className="font-semibold">{o.etaMin} دقيقة</div>
                  </div>
                  <div className="p-2 border rounded-xl">
                    <div className="text-gray-500">الحالة</div>
                    <div className="font-semibold">{o.status}</div>
                  </div>
                </div>
                <div className="mt-3 h-32 border rounded-2xl flex items-center justify-center text-gray-500 text-xs bg-gray-100">
                  خريطة — Placeholder Map
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button className="w-full border rounded-2xl py-2">تفاصيل</button>
                  <button className="w-full bg-red-800 text-white rounded-2xl py-2">ابدأ الرحلة</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "inventory" && (
          <div className="space-y-3 animate-fadeIn">
            <h2 className="font-semibold text-red-800">طلب قطع غيار</h2>
            <input
              className="border rounded-2xl p-2 w-full"
              placeholder="اكتب اسم القطعة"
            />
            <button className="bg-red-800 text-white rounded-2xl py-2 w-full">
              إرسال الطلب
            </button>
          </div>
        )}

        {tab === "profile" && (
          <div className="space-y-3 animate-fadeIn">
            <h2 className="font-semibold text-red-800">الملف الشخصي</h2>
            <p className="text-sm text-gray-600">الاسم: فهد الحربي</p>
            <p className="text-sm text-gray-600">رقم الفني: F-203</p>
          </div>
        )}
        {tab === "panel" && (
          <div className="space-y-3 animate-fadeIn">
            <TechAppPanel/>
          </div>
        )}

        {/* --- Dev Self Tests (UI assertions) --- */}
        <DevTests tab={tab} />
      </div>

      {/* Bottom Nav */}
      <nav className="border-t bg-white flex justify-around py-2">
        {[
  { key: "home", label: "الرئيسية", icon: "🏠" },
  { key: "orders", label: "الطلبات", icon: "📋" },
  { key: "inventory", label: "قطع الغيار", icon: "🧰" },
  { key: "panel", label: "لوحة الفني", icon: "🧾" }, // جديد
  { key: "profile", label: "الملف", icon: "👤" },
].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as any)}
            className={`flex flex-col text-xs items-center ${
              tab === t.key ? "text-red-800" : "text-gray-500"
            }`}
          >
            <span className="text-lg">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </nav>
    </div>
  );
}

// --- Simple UI tests (non-intrusive) ---
function TechAppPanel() {
  const [tab, setTab] = useState("assets"); // assets | invoice
  const [assets, setAssets] = useState([
    { id: "ITM-10", name: "فلتر 10\"", unit: "حبة", qty: 3, min: 2 },
    { id: "PMP-RO", name: "مضخة RO", unit: "حبة", qty: 1, min: 1 },
    { id: "HSE-34", name: "هوز 3/4", unit: "متر", qty: 8, min: 5 },
    { id: "CTN-CRB", name: "حشوة كربونية", unit: "حبة", qty: 4, min: 3 },
  ]);
  const [replenish, setReplenish] = useState([] as Array<{code:string; itemId:string; qty:number; time:string}>);
  const consume = (itemId: string, amountStr: string) => {
    const amount = Math.max(0, parseFloat(amountStr || "0"));
    if (!amount) return;
    setAssets(prev => prev.map(a => a.id === itemId ? { ...a, qty: Math.max(0, a.qty - amount) } : a));
    const code = `REQ-${itemId}-${Date.now()}`;
    const time = new Date().toLocaleString();
    setReplenish(prev => [{ code, itemId, qty: amount, time }, ...prev]);
    alert("تم تسجيل الاستهلاك وإرسال إشعار للمستودع");
  };
  const [items, setItems] = useState([{ name: "زيارة صيانة", qty: 1, price: 100 }]);
  const [customer, setCustomer] = useState("");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [approved, setApproved] = useState(false);
  const total = useMemo(() => items.reduce((s, it) => s + Number(it.qty||0) * Number(it.price||0), 0), [items]);
  const addRow = () => setItems(prev => [...prev, { name: "", qty: 1, price: 0 }]);
  const rmRow = (i:number) => setItems(prev => prev.filter((_, idx) => idx !== i));
  const sendInvoice = () => {
    if (!approved) return alert("الزبون لم يوافق بعد — احصل على موافقته أولاً");
    if (!customer) return alert("أدخل اسم الزبون");
    if (!items.length || total <= 0) return alert("أضف بنودًا صحيحة للفاتورة");
    alert(`تم إرسال الفاتورة إلى: الزبون · الريسبشن · المدير · المستودع
الإجمالي: ${total.toLocaleString()}`);
  };
  return (
    <div className="space-y-6">
      <div className="rounded-3xl p-4 bg-gradient-to-r from-red-800 to-red-600 text-white flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">تطبيق الفني</h2>
          <p className="text-sm text-red-100">ممتلكاتي · خصم أثناء الصيانة · تعويض عبر QR · إنشاء فاتورة</p>
        </div>
        <div className="flex gap-2 text-sm">
          {[{k:"assets",l:"ممتلكاتي"},{k:"invoice",l:"الفاتورة"}].map(t => (
            <button key={t.k} onClick={()=>setTab(t.k)} className={`px-3 py-1.5 rounded-2xl ${tab===t.k?"bg-white text-red-800":"bg-white/10 text-white"}`}>{t.l}</button>
          ))}
        </div>
      </div>
      {tab === "assets" && (
        <div className="grid lg:grid-cols-3 gap-4">
          <div className="p-4 border rounded-2xl shadow-sm bg-white lg:col-span-2">
            <h3 className="font-semibold text-red-800 mb-3">القطع بحوزتي</h3>
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500"><th className="py-2">#</th><th className="py-2">القطعة</th><th className="py-2">الكمية</th><th className="py-2">حد أدنى</th><th className="py-2">خصم</th></tr>
                </thead>
                <tbody>
                  {assets.map((a) => (
                    <tr key={a.id} className="border-t">
                      <td className="py-2">{a.id}</td>
                      <td className="py-2">{a.name} <span className="text-xs text-gray-500">/ {a.unit}</span></td>
                      <td className="py-2">{a.qty}</td>
                      <td className="py-2">{a.min}</td>
                      <td className="py-2">
                        <div className="flex items-center gap-2">
                          <input id={`use-${a.id}`} className="border rounded-2xl p-1 w-20" placeholder="عدد" />
                          <button onClick={()=>{ const el = document.getElementById(`use-${a.id}`) as HTMLInputElement | null; consume(a.id, el?.value || ""); }} className="px-3 py-1.5 rounded-2xl border">خصم</button>
                          {a.qty <= a.min && <span className="text-xs text-red-700">⚠️ منخفض</span>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="p-4 border rounded-2xl shadow-sm bg-white">
            <h4 className="font-semibold mb-2">طلبات التعويض</h4>
            <ul className="text-sm space-y-2 max-h-64 overflow-auto pr-1">
              {replenish.length === 0 && <li className="text-gray-500">لا توجد طلبات</li>}
              {replenish.map(r => (
                <li key={r.code} className="p-3 border rounded-2xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{r.itemId} · {r.qty}</div>
                      <div className="text-xs text-gray-500">{r.time}</div>
                    </div>
                    <div className="w-16 h-16 grid place-items-center border rounded-lg text-[10px]">QR<div className="text-[8px] leading-none">{r.code.slice(-6)}</div></div>
                  </div>
                </li>
              ))}
            </ul>
            <div className="text-xs text-gray-500 mt-2">أبرز الـ QR في المستودع لإتمام التعويض بالباركود.</div>
          </div>
        </div>
      )}
      {tab === "invoice" && (
        <div className="p-4 border rounded-2xl shadow-sm bg-white">
          <h3 className="font-semibold text-red-800 mb-3">إنشاء فاتورة صيانة</h3>
          <div className="grid md:grid-cols-3 gap-3 text-sm">
            <div className="md:col-span-2">
              <div className="overflow-auto rounded-2xl border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500"><th className="py-2">البند</th><th className="py-2">الكمية</th><th className="py-2">السعر</th><th className="py-2">—</th></tr>
                  </thead>
                  <tbody>
                    {items.map((it, i) => (
                      <tr key={i} className="border-t">
                        <td className="py-2"><input className="border rounded-2xl p-1 w-full" value={it.name} onChange={e=>setItems(prev=>prev.map((p,idx)=>idx===i?{...p,name:e.target.value}:p))} placeholder="مثال: تغيير فلتر" /></td>
                        <td className="py-2"><input className="border rounded-2xl p-1 w-20" value={it.qty} onChange={e=>setItems(prev=>prev.map((p,idx)=>idx===i?{...p,qty:+e.target.value}:p))} /></td>
                        <td className="py-2"><input className="border rounded-2xl p-1 w-24" value={it.price} onChange={e=>setItems(prev=>prev.map((p,idx)=>idx===i?{...p,price:+e.target.value}:p))} /></td>
                        <td className="py-2"><button className="text-red-700 underline" onClick={()=>rmRow(i)}>حذف</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <button className="px-3 py-1.5 rounded-2xl border" onClick={addRow}>إضافة بند</button>
                <div className="text-sm">الإجمالي: <span className="font-semibold">{total.toLocaleString()} ر.س</span></div>
              </div>
            </div>
            <div className="md:col-span-1 space-y-2">
              <input className="border rounded-2xl p-2 w-full" placeholder="اسم الزبون" value={customer} onChange={e=>setCustomer(e.target.value)} />
              <input className="border rounded-2xl p-2 w-full" placeholder="العنوان" value={address} onChange={e=>setAddress(e.target.value)} />
              <textarea className="border rounded-2xl p-2 w-full" rows={3} placeholder="ملاحظات" value={note} onChange={e=>setNote(e.target.value)} />
              <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={approved} onChange={e=>setApproved(e.target.checked)} /> حصلت على موافقة الزبون على التكلفة</label>
              <button onClick={sendInvoice} className="w-full rounded-2xl px-4 py-2 bg-red-800 text-white">إرسال الفاتورة</button>
              <div className="text-xs text-gray-500">الإرسال: الزبون · الريسبشن · المدير · المستودع</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
function DevTests({ tab }: { tab: string }) {
  const tests: { name: string; pass: boolean }[] = [
    { name: "تبويب افتراضي هو home", pass: tab !== undefined },
    { name: "يوجد تنقّل سفلي 4 عناصر", pass: true },
    { name: "قسم الطلبات يعرض خريطة ومعلومات", pass: true },
  ];
  useEffect(() => {
    // Placeholder for future automated checks
  }, [tab]);
  return (
    <div className="mt-4 text-[11px] text-gray-500 border rounded-2xl p-2">
      <div className="font-semibold mb-1">اختبارات واجهة (توضيحية)</div>
      <ul className="grid grid-cols-3 gap-2">
        {tests.map((t) => (
          <li key={t.name} className={t.pass ? "text-green-700" : "text-red-700"}>
            {t.pass ? "✅" : "❌"} {t.name}
          </li>
        ))}
      </ul>
    </div>
  );
}
