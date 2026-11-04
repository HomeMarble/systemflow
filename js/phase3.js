/* هوم ماربل — المرحلة الثالثة: المحاسبة والمالية • شؤون الموظفين وبوابة الموظفين والسياسات • الإشعارات والتواصل الداخلي
   رسائل واتساب المرتبطة بالطلبات والمواعيد • أدوات التسويق • المتجر الإلكتروني المرتبط بالمخزون • نظام الكوبونات
   التحديد المتعدد والحذف الجماعي (تحديد الكل) لكل جداول النظام • دليل التدريب والتسليم
   ملف إضافي عبر window.HM_EXT — لا يعدّل أي ميزة أو ملف قائم. يعمل على نفس قاعدة البيانات (config.js). */
(function () {
  let C = null;
  const T3 = { fin: [], emps: [], leaves: [], policies: [], ann: [], camps: [], products: [], sorders: [], coupons: [], inv: [], missing: false, ff: {}, mseg: {}, sel: {} };
  const TABLES = ["fin_entries", "hr_employees", "hr_leaves", "hr_policies", "announcements", "mkt_campaigns", "store_products", "store_orders", "coupons"];
  const AR = { fin_entries: "القيود المالية", hr_employees: "ملفات الموظفين", hr_leaves: "طلبات الإجازة", hr_policies: "السياسات الداخلية", announcements: "الإعلانات الداخلية", mkt_campaigns: "حملات التسويق", store_products: "منتجات المتجر", store_orders: "طلبات المتجر", coupons: "الكوبونات" };
  const sb = () => C.sb;
  const esc = (v) => C.esc(v);
  const ic = (n, s) => window.icon(n, s);
  const has = (...r) => C.has(...r);
  const isMgr = () => C.isMgr();
  const isFin = () => has("admin", "executive", "accountant");
  const isHR = () => has("admin", "executive", "accountant");
  const canStore = () => has("admin", "executive", "sales", "warehouse");
  const canSOrders = () => has("admin", "executive", "sales", "accountant");
  const canMkt = () => has("admin", "executive", "sales");
  const isStaff = () => !!(C && C.S.user && C.S.roles.length);
  const money = (n) => C.money(n);
  const today = () => new Date().toLocaleDateString("en-CA");
  const dt = (t) => (t ? new Date(t).toLocaleDateString("en-CA").replace(/-/g, "/") : "—");
  const base = () => location.href.split("#")[0];
  const couponLink = (code) => base() + "#/coupon/" + encodeURIComponent(code);
  const shopLink = (code) => base() + "#/shop" + (code ? "/" + encodeURIComponent(code) : "");
  const waNum = (p) => { let s = String(p || "").replace(/\D/g, ""); if (s.startsWith("00")) s = s.slice(2); if (s.startsWith("0")) s = "966" + s.slice(1); else if (s.length === 9 && s.startsWith("5")) s = "966" + s; return s; };
  const waLink = (p, text) => `https://wa.me/${waNum(p)}?text=${encodeURIComponent(text)}`;
  const noAccess = () => '<div class="empty">لا تملك صلاحية لهذه الصفحة</div>';
  const missingNote = () => (T3.missing ? `<div class="p2-warn" style="margin-bottom:14px">${ic("alert", 18)} لتفعيل المرحلة الثالثة شغّل ملف <b>database/0003_homemarble_phase3.sql</b> مرة واحدة من SQL Editor.</div>` : "");
  async function run(p, okMsg) { const r = await p; if (r.error) { C.toast(C.errMsg(r.error), "err"); return null; } if (okMsg) C.toast(okMsg, "ok"); return r.data === null ? true : r.data; }
  const done = async (msg) => { if (msg) C.toast(msg, "ok"); C.closeModal(); await C.refresh(); };
  const staffName = (id) => { const p = C.S.profiles.find((x) => x.id === id); return (p && (p.full_name || p.email)) || "—"; };
  const opt = (v, l, sel) => `<option value="${esc(v)}" ${String(sel) === String(v) ? "selected" : ""}>${esc(l)}</option>`;

  // ---------------------------------------------------------------- CSS
  function css() {
    if (document.getElementById("hm-p3-css")) return;
    const s = document.createElement("style"); s.id = "hm-p3-css";
    s.textContent = `
    .p3-bulk{display:flex;align-items:center;gap:8px;flex-wrap:wrap;background:var(--brand-soft);border:1px solid var(--brand-tint);border-radius:10px;padding:8px 12px;margin-bottom:10px;font-size:14px}
    .p3-bulk b{color:var(--brand-dark)}.p3-bulk .sp{flex:1}
    th.p3-ck,td.p3-ck{width:38px;text-align:center}.p3-ck input{width:18px;height:18px;accent-color:var(--brand);cursor:pointer}
    tr.p3-on td{background:var(--brand-soft)}
    .p3-kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:14px}
    .p3-k{background:var(--card);border-radius:var(--radius);box-shadow:var(--shadow);padding:16px}.p3-k .l{color:var(--muted);font-size:13px}.p3-k .v{font-size:24px;font-weight:800;color:var(--brand-dark)}
    .p3-k.g .v{color:var(--green)}.p3-k.r .v{color:var(--red)}
    .p3-shop{min-height:100vh;background:var(--bg)}
    .p3-shop-top{background:linear-gradient(160deg,var(--brand),var(--brand-deep));color:#fff;padding:18px 24px;display:flex;align-items:center;gap:16px;flex-wrap:wrap}
    .p3-shop-top h1{font-size:22px}.p3-shop-top .sp{flex:1}
    .p3-shop-body{max-width:1200px;margin:0 auto;padding:22px;display:grid;grid-template-columns:1fr 340px;gap:20px}
    .p3-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:14px}
    .p3-prod{background:var(--card);border-radius:var(--radius);box-shadow:var(--shadow);overflow:hidden;display:flex;flex-direction:column}
    .p3-prod .im{height:150px;background:var(--brand-soft) center/cover no-repeat;display:grid;place-items:center;color:var(--brand)}
    .p3-prod .bd{padding:12px;display:flex;flex-direction:column;gap:6px;flex:1}.p3-prod .pr{font-weight:800;color:var(--brand)}
    .p3-cart{position:sticky;top:16px;align-self:start}
    .p3-line{display:flex;justify-content:space-between;gap:8px;padding:6px 0;border-bottom:1px solid var(--line);font-size:14px}
    .p3-cats{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px}
    .p3-cats button{border:1px solid var(--line);background:var(--card);border-radius:20px;padding:5px 14px;cursor:pointer}.p3-cats button.on{background:var(--brand);color:#fff;border-color:var(--brand)}
    .p3-coupon{max-width:520px;margin:40px auto;background:var(--card);border-radius:20px;box-shadow:var(--shadow-lg);overflow:hidden;text-align:center}
    .p3-coupon .hd{background:linear-gradient(160deg,var(--brand),var(--brand-deep));color:#fff;padding:26px}
    .p3-coupon .big{font-size:46px;font-weight:800}.p3-coupon .code{display:inline-block;border:2px dashed var(--brand);color:var(--brand);font-size:26px;font-weight:800;letter-spacing:3px;padding:8px 22px;border-radius:12px;margin:16px 0;direction:ltr}
    .p3-coupon .bd{padding:22px;display:flex;flex-direction:column;gap:10px}
    .p3-ann{border-right:4px solid var(--brand);background:var(--card);border-radius:10px;padding:12px 14px;box-shadow:var(--shadow);margin-bottom:10px}
    .p3-ann small{color:var(--muted)}.p3-ann.pin{border-color:var(--orange)}
    .p3-guide h4{color:var(--brand-dark);margin:14px 0 6px}.p3-guide li{margin-right:18px;margin-bottom:4px}
    @media(max-width:900px){.p3-shop-body{grid-template-columns:1fr}.p3-cart{position:static}}
    `;
    document.head.appendChild(s);
  }

  // ---------------------------------------------------------------- data
  async function load() {
    if (!isStaff()) return;
    const q = await Promise.all([
      sb().from("fin_entries").select("*").order("entry_date", { ascending: false }).limit(2000),
      sb().from("hr_employees").select("*").order("emp_no"),
      sb().from("hr_leaves").select("*").order("created_at", { ascending: false }),
      sb().from("hr_policies").select("*").order("created_at"),
      sb().from("announcements").select("*").order("created_at", { ascending: false }).limit(200),
      sb().from("mkt_campaigns").select("*").order("created_at", { ascending: false }).limit(200),
      sb().from("store_products").select("*").order("category").order("name"),
      sb().from("store_orders").select("*").order("created_at", { ascending: false }).limit(500),
      sb().from("coupons").select("*").order("created_at", { ascending: false }),
      sb().from("inventory_items").select("id,name,unit,qty_on_hand,category"),
    ]);
    T3.missing = q.slice(0, 9).some((r) => r.error && /does not exist|schema cache|42P01|PGRST205/i.test((r.error.message || "") + (r.error.code || "")));
    [T3.fin, T3.emps, T3.leaves, T3.policies, T3.ann, T3.camps, T3.products, T3.sorders, T3.coupons, T3.inv] = q.map((r) => (r.error ? [] : r.data || []));
  }

  // ---------------------------------------------------------------- nav / hooks
  function nav(n) {
    if (!isStaff()) return;
    const add = [];
    if (isFin()) add.push(["finance", "المحاسبة والمالية", "coins"]);
    if (isHR()) add.push(["hr", "شؤون الموظفين", "users"]);
    add.push(["portal", "بوابة الموظف", "clipboard"]);
    add.push(["comms", "الإشعارات والتواصل", "bell"]);
    if (canMkt()) add.push(["marketing", "التسويق وواتساب", "send"]);
    if (canStore() || canSOrders()) add.push(["store", "المتجر الإلكتروني", "store"]);
    if (isMgr()) add.push(["coupons", "الكوبونات", "key"]);
    add.push(["guide", "دليل الاستخدام والتسليم", "file"]);
    n.push(["sep"], ...add);
  }
  const seenKey = () => "hm3_seen_" + (C.S.user && C.S.user.id);
  const seen = () => { try { return JSON.parse(localStorage.getItem(seenKey()) || "[]"); } catch (e) { return []; } };
  function alerts(a) {
    if (T3.missing || !isStaff()) return;
    const un = T3.ann.filter((x) => !seen().includes(x.id)).length; if (un) a.push(["a-blue", "bell", "إعلانات داخلية جديدة", un, "comms"]);
    if (isMgr()) { const n = T3.leaves.filter((l) => l.status === "pending").length; if (n) a.push(["a-orange", "calendar", "طلبات إجازة بانتظار الاعتماد", n, "hr"]); }
    if (canSOrders()) { const n = T3.sorders.filter((o) => o.status === "new").length; if (n) a.push(["a-red", "store", "طلبات جديدة من المتجر الإلكتروني", n, "store"]); }
  }
  function search(q, res) {
    T3.sorders.forEach((o) => { if ((o.order_no + " " + o.customer_name + " " + o.phone).toLowerCase().includes(q)) res.push(["#/store", `طلب متجر #${o.order_no}`, o.customer_name]); });
    T3.coupons.forEach((c) => { if ((c.code + " " + (c.title || "")).toLowerCase().includes(q)) res.push(["#/coupons", `كوبون ${c.code}`, c.title || ""]); });
    T3.emps.forEach((e) => { if ((e.full_name + " " + (e.phone || "")).toLowerCase().includes(q)) res.push(["#/hr", e.full_name, "موظف · " + (e.job_title || "")]); });
    T3.products.forEach((p) => { if (p.name.toLowerCase().includes(q)) res.push(["#/store", p.name, "منتج متجر · " + p.category]); });
  }

  // ---------------------------------------------------------------- المحاسبة والمالية
  const CATS_IN = ["دفعات عملاء", "مبيعات المتجر", "إيرادات أخرى"];
  const CATS_EX = ["رواتب", "مواد خام", "إيجارات", "كهرباء ومياه", "نقل ومواصلات", "صيانة", "تسويق", "مصروفات أخرى"];
  const METHOD = { cash: "نقداً", bank: "تحويل بنكي", card: "شبكة / بطاقة", cheque: "شيك" };
  const recBranch = (x) => { const o = C.S.orders.find((y) => y.id === x.order_id); return (o && o.branch_id) || C.cust(x.customer_id).branch_id; };
  function finData() {
    const f = T3.ff; const inR = (t) => (!f.from || t >= f.from) && (!f.to || t <= f.to);
    const receipts = C.S.documents.filter((x) => x.kind === "receipt" && inR((x.created_at || "").slice(0, 10)) && (!f.branch || recBranch(x) === f.branch));
    const entries = T3.fin.filter((e) => inR(e.entry_date) && (!f.branch || e.branch_id === f.branch));
    const recSum = receipts.reduce((a, b) => a + Number(b.amount), 0);
    const inc = entries.filter((e) => e.kind === "income").reduce((a, b) => a + Number(b.amount), 0) + recSum;
    const exp = entries.filter((e) => e.kind === "expense").reduce((a, b) => a + Number(b.amount), 0);
    return { receipts, entries, recSum, inc, exp };
  }
  function pageFinance() {
    if (!isFin()) return noAccess();
    const f = T3.ff; const { receipts, entries, recSum, inc, exp } = finData();
    const byCat = {}; entries.forEach((e) => { const k = (e.kind === "income" ? "إيراد · " : "مصروف · ") + e.category; byCat[k] = (byCat[k] || 0) + Number(e.amount); }); if (recSum) byCat["إيراد · سندات القبض"] = recSum;
    const byBr = C.S.branches.map((b) => { const r = receipts.filter((x) => recBranch(x) === b.id).reduce((a, x) => a + Number(x.amount), 0); const i = entries.filter((e) => e.branch_id === b.id && e.kind === "income").reduce((a, x) => a + Number(x.amount), 0); const ex = entries.filter((e) => e.branch_id === b.id && e.kind === "expense").reduce((a, x) => a + Number(x.amount), 0); return [b.name, r + i, ex]; });
    const invoices = C.S.documents.filter((x) => x.kind === "invoice");
    const paidInv = (inv) => C.S.documents.filter((r) => r.kind === "receipt" && inv.order_id && r.order_id === inv.order_id).reduce((a, b) => a + Number(b.amount), 0) + T3.fin.filter((e) => e.kind === "income" && e.invoice_id === inv.id).reduce((a, b) => a + Number(b.amount), 0);
    return `${missingNote()}<div class="page-head"><div><h1>المحاسبة والمالية</h1><div class="sub">الإيرادات والمصروفات وسندات القبض والصرف وربطها بالفواتير</div></div>
      <div class="filters"><select class="input" id="p3-fb"><option value="">كل الفروع</option>${C.S.branches.map((b) => opt(b.id, b.name, f.branch)).join("")}</select>
      <input type="date" class="input" id="p3-ff" value="${f.from || ""}"><input type="date" class="input" id="p3-ft" value="${f.to || ""}">
      <button class="btn btn-success" data-act="p3-fin-new" data-kind="income">${ic("plus", 18)} إيراد</button><button class="btn btn-primary" data-act="p3-fin-new" data-kind="expense">${ic("receipt", 18)} سند صرف</button><button class="btn btn-ghost" data-act="p3-fin-print">${ic("print", 18)} تقرير الفترة</button></div></div>
      <div class="p3-kpis"><div class="p3-k g"><div class="l">إجمالي الإيرادات</div><div class="v">${money(inc)}</div><small>منها سندات قبض ${money(recSum)}</small></div><div class="p3-k r"><div class="l">إجمالي المصروفات</div><div class="v">${money(exp)}</div></div><div class="p3-k"><div class="l">صافي الربح / الخسارة</div><div class="v" style="color:${inc - exp >= 0 ? "var(--green)" : "var(--red)"}">${money(inc - exp)}</div></div><div class="p3-k"><div class="l">عدد القيود في الفترة</div><div class="v">${entries.length + receipts.length}</div></div></div>
      <div class="grid g2 mt"><div class="card"><div class="card-head"><h3>${ic("chart")} حسب الفرع</h3></div><div class="tbl-wrap"><table><thead><tr><th>الفرع</th><th>الإيرادات</th><th>المصروفات</th><th>الصافي</th></tr></thead><tbody>${byBr.map((b) => `<tr><td>${esc(b[0])}</td><td>${money(b[1])}</td><td>${money(b[2])}</td><td><b>${money(b[1] - b[2])}</b></td></tr>`).join("")}</tbody></table></div></div>
      <div class="card"><div class="card-head"><h3>${ic("layers")} حسب البند</h3></div><div class="tbl-wrap"><table><thead><tr><th>البند</th><th>المبلغ</th></tr></thead><tbody>${Object.keys(byCat).map((k) => `<tr><td>${esc(k)}</td><td>${money(byCat[k])}</td></tr>`).join("") || '<tr><td colspan="2" class="empty">لا توجد بيانات</td></tr>'}</tbody></table></div></div></div>
      <div class="card mt"><div class="card-head"><h3>${ic("receipt")} القيود المالية (إيرادات وسندات صرف)</h3></div><div class="tbl-wrap"><table><thead><tr><th>الرقم</th><th>النوع</th><th>البند</th><th>المبلغ</th><th>التاريخ</th><th>الفرع</th><th>الجهة</th><th>مرتبط بـ</th><th></th></tr></thead><tbody>
      ${entries.map((e) => { const inv = C.S.documents.find((x) => x.id === e.invoice_id); const o = C.S.orders.find((x) => x.id === e.order_id); return `<tr data-p3row="fin_entries:${e.id}"><td>${e.entry_no}</td><td>${e.kind === "income" ? '<span class="badge b-green">إيراد</span>' : '<span class="badge b-red">صرف</span>'}</td><td>${esc(e.category)}</td><td><b>${money(e.amount)}</b></td><td>${dt(e.entry_date)}</td><td>${esc(C.branchName(e.branch_id))}</td><td>${esc(e.party || "—")}</td><td>${inv ? `<a href="#/doc/${inv.id}">فاتورة #${inv.doc_no}</a>` : o ? `<a href="#/order/${o.id}">طلب #${o.order_no}</a>` : "—"}</td><td class="p2-actions"><button class="btn btn-sm btn-ghost" data-act="p3-fin-voucher" data-id="${e.id}">${ic("print", 14)}</button><button class="btn btn-sm btn-ghost" data-act="p3-fin-edit" data-id="${e.id}">${ic("edit", 14)}</button><button class="btn btn-sm btn-danger" data-act="p3-del" data-t="fin_entries" data-id="${e.id}">${ic("trash", 14)}</button></td></tr>`; }).join("") || '<tr><td colspan="9" class="empty">لا توجد قيود في الفترة</td></tr>'}</tbody></table></div></div>
      <div class="card mt"><div class="card-head"><h3>${ic("orders")} ربط المدفوعات بالفواتير</h3></div><div class="tbl-wrap"><table><thead><tr><th>الفاتورة</th><th>العميل</th><th>قيمة الفاتورة</th><th>المدفوع</th><th>المتبقي</th><th>الحالة</th><th></th></tr></thead><tbody>
      ${invoices.map((x) => { const p = paidInv(x); const rem = Math.max(0, Number(x.amount) - p); return `<tr data-href="#/doc/${x.id}" class="click"><td>#${x.doc_no} ${esc(x.title)}</td><td>${esc(C.cust(x.customer_id).name)}</td><td>${money(x.amount)}</td><td style="color:var(--green)">${money(p)}</td><td style="color:var(--red)">${money(rem)}</td><td>${rem <= 0 ? '<span class="badge b-green">مسددة</span>' : p > 0 ? '<span class="badge b-yellow">مسددة جزئياً</span>' : '<span class="badge b-red">غير مسددة</span>'}</td><td>${rem > 0 ? `<button class="btn btn-sm btn-success" data-act="p3-fin-new" data-kind="income" data-inv="${x.id}">تسجيل دفعة</button>` : ""}</td></tr>`; }).join("") || '<tr><td colspan="7" class="empty">لا توجد فواتير</td></tr>'}</tbody></table></div></div>`;
  }
  function finForm(e, kind, invId) {
    e = e || { kind, entry_date: today(), method: "cash", invoice_id: invId || null };
    const inv = C.S.documents.find((x) => x.id === e.invoice_id);
    if (inv && !e.id) { e.customer_id = inv.customer_id; e.order_id = inv.order_id; e.category = "دفعات عملاء"; e.branch_id = recBranch(inv); e.party = C.cust(inv.customer_id).name; }
    const cats = e.kind === "income" ? CATS_IN : CATS_EX;
    const ov = C.modal(e.id ? `تعديل قيد #${e.entry_no}` : e.kind === "income" ? "تسجيل إيراد" : "سند صرف جديد", `<form id="p3f"><div class="grid2">
      <div class="field"><label>البند *</label><input class="input" name="category" list="p3-cats" required value="${esc(e.category || cats[0])}"><datalist id="p3-cats">${cats.map((c) => `<option value="${c}">`).join("")}</datalist></div>
      <div class="field"><label>المبلغ *</label><input class="input" type="number" step="0.01" min="0" name="amount" required value="${esc(e.amount)}"></div>
      <div class="field"><label>التاريخ</label><input class="input" type="date" name="entry_date" value="${esc(e.entry_date)}"></div>
      <div class="field"><label>طريقة الدفع</label><select class="input" name="method">${Object.keys(METHOD).map((k) => opt(k, METHOD[k], e.method)).join("")}</select></div>
      <div class="field"><label>الفرع</label><select class="input" name="branch_id"><option value="">—</option>${C.S.branches.map((b) => opt(b.id, b.name, e.branch_id)).join("")}</select></div>
      <div class="field"><label>${e.kind === "income" ? "المستلم منه" : "المصروف له"}</label><input class="input" name="party" value="${esc(e.party)}"></div>
      <div class="field"><label>الفاتورة المرتبطة</label><select class="input" name="invoice_id"><option value="">—</option>${C.S.documents.filter((x) => x.kind === "invoice").map((x) => opt(x.id, `#${x.doc_no} — ${C.cust(x.customer_id).name || ""}`, e.invoice_id)).join("")}</select></div>
      <div class="field"><label>الطلب المرتبط</label><select class="input" name="order_id"><option value="">—</option>${C.S.orders.map((o) => opt(o.id, `#${o.order_no} — ${C.cust(o.customer_id).name || ""}`, e.order_id)).join("")}</select></div>
      <div class="field"><label>رقم مرجعي</label><input class="input" name="reference" value="${esc(e.reference)}"></div></div>
      <div class="field"><label>ملاحظات</label><textarea class="input" name="notes">${esc(e.notes)}</textarea></div></form>`,
      `<button class="btn btn-primary" id="p3s">حفظ</button><button class="btn btn-line" data-close>إلغاء</button>`);
    ov.querySelector("#p3s").onclick = async () => {
      const f = ov.querySelector("#p3f"); if (!f.reportValidity()) return;
      const v = C.formData(f); ["branch_id", "invoice_id", "order_id"].forEach((k) => (v[k] = v[k] || null)); v.kind = e.kind;
      if (v.invoice_id && !v.customer_id) { const i = C.S.documents.find((x) => x.id === v.invoice_id); v.customer_id = i && i.customer_id; } else v.customer_id = e.customer_id || null;
      const r = await run(e.id ? sb().from("fin_entries").update(v).eq("id", e.id) : sb().from("fin_entries").insert(v)); if (r) done("تم حفظ القيد");
    };
  }
  function printHTML(title, inner) {
    const w = window.open("", "_blank"); if (!w) return C.toast("اسمح بالنوافذ المنبثقة للطباعة", "err");
    w.document.write(`<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>${esc(title)}</title><link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700;800&display=swap" rel="stylesheet"><style>body{font-family:Tajawal,sans-serif;color:#2a1a1b;padding:30px 40px}h1{color:#7e1416}table{width:100%;border-collapse:collapse;font-size:13px;margin-top:10px}th{background:#7e1416;color:#fff;padding:7px;text-align:right}td{border-bottom:1px solid #ece4e3;padding:6px}.k{display:flex;gap:10px;flex-wrap:wrap}.k div{background:#f6eceb;border-radius:8px;padding:10px 14px}.k b{display:block;font-size:20px;color:#7e1416}.sign{display:flex;justify-content:space-between;margin-top:60px}.sign div{border-top:1px solid #999;width:200px;text-align:center;padding-top:8px}footer{margin-top:40px;text-align:center;font-size:12px;color:#7b6b6c}</style></head><body>${window.logoSVG(160)}<h1>${esc(title)}</h1>${inner}<footer>هوم ماربل · الرياض – الخرج</footer><script>window.onload=()=>setTimeout(()=>window.print(),600)<\/script></body></html>`);
    w.document.close();
  }
  function printVoucher(e) {
    printHTML(`${e.kind === "income" ? "سند قبض / إيراد" : "سند صرف"} رقم ${e.entry_no}`, `<table><tr><th>التاريخ</th><td>${dt(e.entry_date)}</td><th>المبلغ</th><td><b>${money(e.amount)} ر.س</b></td></tr><tr><th>البند</th><td>${esc(e.category)}</td><th>طريقة الدفع</th><td>${METHOD[e.method] || esc(e.method)}</td></tr><tr><th>${e.kind === "income" ? "المستلم منه" : "المصروف له"}</th><td>${esc(e.party || "—")}</td><th>الفرع</th><td>${esc(C.branchName(e.branch_id))}</td></tr><tr><th>المرجع</th><td>${esc(e.reference || "—")}</td><th>ملاحظات</th><td>${esc(e.notes || "—")}</td></tr></table><div class="sign"><div>المحاسب</div><div>المستلم</div><div>الاعتماد</div></div>`);
  }
  function printFinReport() {
    const { receipts, entries, recSum, inc, exp } = finData(); const f = T3.ff;
    printHTML("التقرير المالي للفترة", `<p>الفترة: ${f.from || "البداية"} — ${f.to || "اليوم"} · الفرع: ${f.branch ? esc(C.branchName(f.branch)) : "كل الفروع"}</p><div class="k"><div>الإيرادات<b>${money(inc)}</b></div><div>منها سندات القبض<b>${money(recSum)}</b></div><div>المصروفات<b>${money(exp)}</b></div><div>الصافي<b>${money(inc - exp)}</b></div></div>
      <h3>القيود</h3><table><tr><th>الرقم</th><th>النوع</th><th>البند</th><th>المبلغ</th><th>التاريخ</th><th>الجهة</th></tr>${entries.map((e) => `<tr><td>${e.entry_no}</td><td>${e.kind === "income" ? "إيراد" : "صرف"}</td><td>${esc(e.category)}</td><td>${money(e.amount)}</td><td>${dt(e.entry_date)}</td><td>${esc(e.party || "")}</td></tr>`).join("")}</table>
      <h3>سندات القبض</h3><table><tr><th>الرقم</th><th>العميل</th><th>المبلغ</th><th>التاريخ</th></tr>${receipts.map((x) => `<tr><td>${x.doc_no}</td><td>${esc(C.cust(x.customer_id).name)}</td><td>${money(x.amount)}</td><td>${dt(x.created_at)}</td></tr>`).join("")}</table>`);
  }

  // ---------------------------------------------------------------- شؤون الموظفين
  const EMP_ST = { active: ["على رأس العمل", "b-green"], on_leave: ["في إجازة", "b-yellow"], ended: ["منتهي الخدمة", "b-gray"] };
  const LV_KIND = { annual: "سنوية", sick: "مرضية", emergency: "اضطرارية", unpaid: "بدون راتب" };
  const LV_ST = { pending: ["بانتظار الاعتماد", "b-yellow"], approved: ["معتمدة", "b-green"], rejected: ["مرفوضة", "b-red"] };
  const bdg = (m, k) => `<span class="badge ${(m[k] || [k, "b-gray"])[1]}">${(m[k] || [k])[0]}</span>`;
  const days = (l) => Math.round((new Date(l.to_date) - new Date(l.from_date)) / 864e5) + 1;
  function leavesTable(list, mgr) {
    return `<div class="tbl-wrap"><table><thead><tr><th>#</th>${mgr ? "<th>الموظف</th>" : ""}<th>النوع</th><th>من</th><th>إلى</th><th>الأيام</th><th>السبب</th><th>الحالة</th><th></th></tr></thead><tbody>${list.map((l) => `<tr data-p3row="hr_leaves:${l.id}"><td>${l.leave_no}</td>${mgr ? `<td>${esc(l.employee_name || staffName(l.user_id))}</td>` : ""}<td>${LV_KIND[l.kind] || esc(l.kind)}</td><td>${dt(l.from_date)}</td><td>${dt(l.to_date)}</td><td>${days(l)}</td><td>${esc(l.reason || "—")}</td><td>${bdg(LV_ST, l.status)}${l.decision_note ? `<div class="p2-muted" style="font-size:12px">${esc(l.decision_note)}</div>` : ""}</td><td class="p2-actions">${mgr && l.status === "pending" ? `<button class="btn btn-sm btn-success" data-act="p3-lv" data-st="approved" data-id="${l.id}">اعتماد</button><button class="btn btn-sm btn-line" data-act="p3-lv" data-st="rejected" data-id="${l.id}">رفض</button>` : ""}${mgr || l.status === "pending" ? `<button class="btn btn-sm btn-danger" data-act="p3-del" data-t="hr_leaves" data-id="${l.id}">${ic("trash", 14)}</button>` : ""}</td></tr>`).join("") || '<tr><td colspan="9" class="empty">لا توجد طلبات</td></tr>'}</tbody></table></div>`;
  }
  function pageHR() {
    if (!isHR()) return noAccess();
    const mgr = isMgr(); const pay = T3.emps.filter((e) => e.status !== "ended").reduce((a, b) => a + Number(b.salary), 0);
    return `${missingNote()}<div class="page-head"><div><h1>شؤون الموظفين</h1><div class="sub">ملفات الموظفين والإجازات والسياسات الداخلية</div></div>${mgr ? `<div class="filters"><button class="btn btn-primary" data-act="p3-emp-new">${ic("userPlus", 18)} موظف جديد</button><button class="btn btn-ghost" data-act="p3-pol-new">${ic("plus", 18)} سياسة داخلية</button></div>` : ""}</div>
      <div class="p3-kpis"><div class="p3-k"><div class="l">عدد الموظفين</div><div class="v">${T3.emps.filter((e) => e.status !== "ended").length}</div></div><div class="p3-k"><div class="l">في إجازة الآن</div><div class="v">${T3.leaves.filter((l) => l.status === "approved" && l.from_date <= today() && l.to_date >= today()).length}</div></div><div class="p3-k"><div class="l">طلبات بانتظار الاعتماد</div><div class="v">${T3.leaves.filter((l) => l.status === "pending").length}</div></div><div class="p3-k"><div class="l">إجمالي الرواتب الشهرية</div><div class="v">${money(pay)}</div></div></div>
      <div class="card mt"><div class="card-head"><h3>${ic("users")} ملفات الموظفين</h3></div><div class="tbl-wrap"><table><thead><tr><th>الرقم</th><th>الاسم</th><th>الوظيفة</th><th>القسم</th><th>الفرع</th><th>الجوال</th><th>تاريخ التعيين</th><th>الراتب</th><th>الحالة</th><th>حساب النظام</th><th></th></tr></thead><tbody>
      ${T3.emps.map((e) => `<tr data-p3row="hr_employees:${e.id}"><td>${e.emp_no}</td><td><b>${esc(e.full_name)}</b></td><td>${esc(e.job_title || "—")}</td><td>${esc(e.department || "—")}</td><td>${esc(C.branchName(e.branch_id))}</td><td dir="ltr" style="text-align:right">${esc(e.phone || "")}</td><td>${dt(e.hire_date)}</td><td>${money(e.salary)}</td><td>${bdg(EMP_ST, e.status)}</td><td>${e.user_id ? esc(staffName(e.user_id)) : "—"}</td><td class="p2-actions">${e.phone ? `<a class="btn btn-sm btn-success" target="_blank" rel="noopener" href="${waLink(e.phone, `مرحباً ${e.full_name}`)}">${ic("chat", 14)}</a>` : ""}${mgr ? `<button class="btn btn-sm btn-ghost" data-act="p3-emp-edit" data-id="${e.id}">${ic("edit", 14)}</button><button class="btn btn-sm btn-danger" data-act="p3-del" data-t="hr_employees" data-id="${e.id}">${ic("trash", 14)}</button>` : ""}</td></tr>`).join("") || '<tr><td colspan="11" class="empty">لا يوجد موظفون — أضف أول موظف</td></tr>'}</tbody></table></div></div>
      <div class="card mt"><div class="card-head"><h3>${ic("calendar")} طلبات الإجازة</h3></div>${leavesTable(T3.leaves, mgr)}</div>
      <div class="card mt"><div class="card-head"><h3>${ic("shield")} السياسات الداخلية</h3></div><div class="tbl-wrap"><table><thead><tr><th>العنوان</th><th>التصنيف</th><th>النص</th><th></th></tr></thead><tbody>${T3.policies.map((p) => `<tr data-p3row="hr_policies:${p.id}"><td><b>${esc(p.title)}</b></td><td>${esc(p.category)}</td><td style="white-space:pre-wrap">${esc(p.body)}</td><td class="p2-actions">${mgr ? `<button class="btn btn-sm btn-ghost" data-act="p3-pol-edit" data-id="${p.id}">${ic("edit", 14)}</button><button class="btn btn-sm btn-danger" data-act="p3-del" data-t="hr_policies" data-id="${p.id}">${ic("trash", 14)}</button>` : ""}</td></tr>`).join("") || '<tr><td colspan="4" class="empty">لا توجد سياسات</td></tr>'}</tbody></table></div></div>`;
  }
  function empForm(e) {
    e = e || { status: "active", hire_date: today() };
    const ov = C.modal(e.id ? "تعديل ملف موظف" : "موظف جديد", `<form id="p3f"><div class="grid2">
      <div class="field"><label>الاسم *</label><input class="input" name="full_name" required value="${esc(e.full_name)}"></div>
      <div class="field"><label>الوظيفة</label><input class="input" name="job_title" value="${esc(e.job_title)}"></div>
      <div class="field"><label>القسم</label><input class="input" name="department" list="p3-dep" value="${esc(e.department)}"><datalist id="p3-dep">${["المبيعات", "المصنع", "المستودع", "المشتريات", "المحاسبة", "التركيبات", "الإدارة", "الدعم الفني"].map((x) => `<option value="${x}">`).join("")}</datalist></div>
      <div class="field"><label>الفرع</label><select class="input" name="branch_id"><option value="">—</option>${C.S.branches.map((b) => opt(b.id, b.name, e.branch_id)).join("")}</select></div>
      <div class="field"><label>الجوال</label><input class="input" name="phone" dir="ltr" value="${esc(e.phone)}"></div>
      <div class="field"><label>البريد</label><input class="input" name="email" type="email" dir="ltr" value="${esc(e.email)}"></div>
      <div class="field"><label>رقم الهوية / الإقامة</label><input class="input" name="national_id" dir="ltr" value="${esc(e.national_id)}"></div>
      <div class="field"><label>تاريخ التعيين</label><input class="input" type="date" name="hire_date" value="${esc(e.hire_date)}"></div>
      <div class="field"><label>الراتب الشهري</label><input class="input" type="number" step="0.01" min="0" name="salary" value="${esc(e.salary || 0)}"></div>
      <div class="field"><label>الحالة</label><select class="input" name="status">${Object.keys(EMP_ST).map((k) => opt(k, EMP_ST[k][0], e.status)).join("")}</select></div>
      <div class="field"><label>ربط بحساب النظام (لبوابة الموظف)</label><select class="input" name="user_id"><option value="">—</option>${C.S.profiles.map((p) => opt(p.id, `${p.full_name || ""} — ${p.email || ""}`, e.user_id)).join("")}</select></div></div>
      <div class="field"><label>ملاحظات</label><textarea class="input" name="notes">${esc(e.notes)}</textarea></div></form>`,
      `<button class="btn btn-primary" id="p3s">حفظ</button><button class="btn btn-line" data-close>إلغاء</button>`);
    ov.querySelector("#p3s").onclick = async () => {
      const f = ov.querySelector("#p3f"); if (!f.reportValidity()) return;
      const v = C.formData(f); ["branch_id", "user_id", "hire_date"].forEach((k) => (v[k] = v[k] || null));
      const r = await run(e.id ? sb().from("hr_employees").update(v).eq("id", e.id) : sb().from("hr_employees").insert(v)); if (r) done("تم حفظ ملف الموظف");
    };
  }
  function polForm(p) {
    p = p || { category: "عام" };
    const ov = C.modal(p.id ? "تعديل سياسة" : "سياسة داخلية جديدة", `<form id="p3f"><div class="field"><label>العنوان *</label><input class="input" name="title" required value="${esc(p.title)}"></div><div class="field"><label>التصنيف</label><input class="input" name="category" value="${esc(p.category)}"></div><div class="field"><label>النص</label><textarea class="input" name="body" rows="7">${esc(p.body)}</textarea></div></form>`, `<button class="btn btn-primary" id="p3s">حفظ</button>`);
    ov.querySelector("#p3s").onclick = async () => { const f = ov.querySelector("#p3f"); if (!f.reportValidity()) return; const v = C.formData(f); const r = await run(p.id ? sb().from("hr_policies").update(v).eq("id", p.id) : sb().from("hr_policies").insert(v)); if (r) done("تم الحفظ"); };
  }

  // ---------------------------------------------------------------- بوابة الموظف
  function pagePortal() {
    const me = C.S.user.id; const emp = T3.emps.find((e) => e.user_id === me); const mine = T3.leaves.filter((l) => l.user_id === me);
    const used = mine.filter((l) => l.status === "approved" && l.kind === "annual" && l.from_date.slice(0, 4) === today().slice(0, 4)).reduce((a, l) => a + days(l), 0);
    return `${missingNote()}<div class="page-head"><div><h1>بوابة الموظف</h1><div class="sub">ملفك، إجازاتك، السياسات الداخلية، وآخر الإعلانات</div></div><div class="filters"><button class="btn btn-primary" data-act="p3-lv-new">${ic("calendar", 18)} طلب إجازة</button></div></div>
      <div class="grid g2"><div class="card"><div class="card-head"><h3>${ic("users")} ملفي</h3></div>${emp ? `<dl class="kv"><dt>الاسم</dt><dd>${esc(emp.full_name)}</dd><dt>الرقم الوظيفي</dt><dd>${emp.emp_no}</dd><dt>الوظيفة</dt><dd>${esc(emp.job_title || "—")}</dd><dt>القسم</dt><dd>${esc(emp.department || "—")}</dd><dt>الفرع</dt><dd>${esc(C.branchName(emp.branch_id))}</dd><dt>تاريخ التعيين</dt><dd>${dt(emp.hire_date)}</dd><dt>الحالة</dt><dd>${bdg(EMP_ST, emp.status)}</dd></dl>` : `<dl class="kv"><dt>الاسم</dt><dd>${esc((C.S.profile && C.S.profile.full_name) || "")}</dd><dt>البريد</dt><dd>${esc(C.S.user.email)}</dd><dt>الوظيفة</dt><dd>${C.S.roles.map((r) => esc(C.ROLE_LABEL[r] || r)).join("، ")}</dd></dl><p class="p2-muted" style="font-size:13px;margin-top:8px">لم يُربط ملفك الوظيفي بعد — تقوم الإدارة بذلك من «شؤون الموظفين».</p>`}
        <div class="mt" style="font-size:14px">الإجازات السنوية المستخدمة هذا العام: <b>${used}</b> يوم</div></div>
      <div class="card"><div class="card-head"><h3>${ic("bell")} آخر الإعلانات</h3><a href="#/comms">عرض الكل</a></div>${annList(T3.ann.slice(0, 4), false)}</div></div>
      <div class="card mt"><div class="card-head"><h3>${ic("calendar")} طلبات إجازتي</h3></div>${leavesTable(mine, false)}</div>
      <div class="card mt"><div class="card-head"><h3>${ic("shield")} السياسات الداخلية</h3></div>${T3.policies.map((p) => `<div class="p3-ann"><b>${esc(p.title)}</b> <span class="badge b-gray">${esc(p.category)}</span><div style="white-space:pre-wrap;margin-top:6px">${esc(p.body)}</div></div>`).join("") || '<div class="empty">لا توجد سياسات</div>'}</div>`;
  }
  function leaveForm() {
    const ov = C.modal("طلب إجازة", `<form id="p3f"><div class="grid2"><div class="field"><label>النوع</label><select class="input" name="kind">${Object.keys(LV_KIND).map((k) => opt(k, LV_KIND[k])).join("")}</select></div><div class="field"></div><div class="field"><label>من *</label><input class="input" type="date" name="from_date" required value="${today()}"></div><div class="field"><label>إلى *</label><input class="input" type="date" name="to_date" required value="${today()}"></div></div><div class="field"><label>السبب</label><textarea class="input" name="reason"></textarea></div></form>`, `<button class="btn btn-primary" id="p3s">إرسال الطلب</button>`);
    ov.querySelector("#p3s").onclick = async () => {
      const f = ov.querySelector("#p3f"); if (!f.reportValidity()) return; const v = C.formData(f);
      if (v.to_date < v.from_date) return C.toast("تاريخ النهاية قبل البداية", "err");
      v.user_id = C.S.user.id; v.employee_name = (C.S.profile && C.S.profile.full_name) || C.S.user.email;
      const r = await run(sb().from("hr_leaves").insert(v)); if (r) done("تم إرسال طلب الإجازة للإدارة");
    };
  }

  // ---------------------------------------------------------------- الإشعارات والتواصل الداخلي
  function annList(list, mgr) {
    return list.map((a) => `<div class="p3-ann ${a.pinned ? "pin" : ""}" data-p3row="announcements:${a.id}"><div style="display:flex;gap:8px;align-items:center"><b style="flex:1">${a.pinned ? "📌 " : ""}${esc(a.title)}</b>${mgr ? `<button class="btn btn-sm btn-danger" data-act="p3-del" data-t="announcements" data-id="${a.id}">${ic("trash", 14)}</button>` : ""}</div><div style="white-space:pre-wrap;margin:4px 0">${esc(a.body)}</div><small>${dt(a.created_at)} · ${esc(staffName(a.created_by))} · ${a.target_role ? "إلى: " + esc(C.ROLE_LABEL[a.target_role] || a.target_role) : "لكل الموظفين"}</small></div>`).join("") || '<div class="empty">لا توجد إعلانات</div>';
  }
  function pageComms() {
    const mgr = isMgr(); const list = T3.ann.slice().sort((a, b) => (b.pinned - a.pinned) || (a.created_at < b.created_at ? 1 : -1));
    const ids = T3.ann.map((a) => a.id); try { localStorage.setItem(seenKey(), JSON.stringify(ids)); } catch (e) {}
    const staff = C.S.profiles.filter((p) => C.S.allRoles.some((r) => r.user_id === p.id));
    return `${missingNote()}<div class="page-head"><div><h1>الإشعارات والتواصل الداخلي</h1><div class="sub">إعلانات الإدارة لكل الموظفين أو لوظيفة محددة — تظهر فوراً مع تنبيه في الجرس</div></div>${mgr ? `<div class="filters"><button class="btn btn-primary" data-act="p3-ann-new">${ic("plus", 18)} إعلان جديد</button></div>` : ""}</div>
      <div class="grid g-wide"><div class="card"><div class="card-head"><h3>${ic("bell")} الإعلانات</h3></div>${annList(list, mgr)}</div>
      <div class="card"><div class="card-head"><h3>${ic("users")} تواصل مباشر مع الزملاء</h3></div><div class="tbl-wrap"><table><tbody>${staff.map((p) => `<tr><td><b>${esc(p.full_name || "")}</b><div class="p2-muted" style="font-size:12px">${C.S.allRoles.filter((r) => r.user_id === p.id).map((r) => esc(C.ROLE_LABEL[r.role] || r.role)).join("، ")}</div></td><td><a class="btn btn-sm btn-ghost" href="mailto:${esc(p.email)}">${ic("mail", 14)}</a></td></tr>`).join("")}</tbody></table></div><p class="p2-muted" style="font-size:12px;margin-top:8px">للمحادثات الجماعية استخدم «الدردشات بالكود».</p></div></div>`;
  }
  function annForm() {
    const roles = Object.keys(C.ROLE_LABEL);
    const ov = C.modal("إعلان داخلي جديد", `<form id="p3f"><div class="field"><label>العنوان *</label><input class="input" name="title" required></div><div class="field"><label>النص</label><textarea class="input" name="body" rows="5"></textarea></div><div class="grid2"><div class="field"><label>يُرسل إلى</label><select class="input" name="target_role"><option value="">كل الموظفين</option>${roles.map((r) => opt(r, C.ROLE_LABEL[r])).join("")}</select></div><div class="field"><label><input type="checkbox" name="pinned" value="1"> تثبيت في الأعلى</label></div></div></form>`, `<button class="btn btn-primary" id="p3s">${ic("send", 16)} نشر</button>`);
    ov.querySelector("#p3s").onclick = async () => { const f = ov.querySelector("#p3f"); if (!f.reportValidity()) return; const v = C.formData(f); v.target_role = v.target_role || null; v.pinned = !!v.pinned; const r = await run(sb().from("announcements").insert(v)); if (r) done("تم نشر الإعلان"); };
  }

  // ---------------------------------------------------------------- واتساب المرتبط بالطلبات والمواعيد
  function orderSection(o) {
    const c = C.cust(o.customer_id); if (!c.phone) return "";
    const st = (C.STATUS[o.status] || [o.status])[0];
    const paid = C.paidFor(o.id); const rem = Math.max(0, Number(o.total_value) - paid);
    const T = [
      ["تحديث حالة الطلب", `مرحباً ${c.name}، معك هوم ماربل 🌷\nحالة طلبكم رقم #${o.order_no} (${o.work_type}): ${st}.\nشكراً لثقتكم.`],
      ["تذكير بالدفعة", `مرحباً ${c.name}، نذكركم بالدفعة المستحقة لطلب #${o.order_no}.\nالمدفوع: ${money(paid)} ر.س · المتبقي: ${money(rem)} ر.س.\nهوم ماربل`],
      ["جاهز للتركيب", `مرحباً ${c.name}، طلبكم #${o.order_no} جاهز للتركيب ✅\nسيتواصل معكم فريق التركيب لتحديد الموعد المناسب.\nهوم ماربل`],
      ["شكر بعد التسليم", `مرحباً ${c.name}، شكراً لاختياركم هوم ماربل 🌷\nيسعدنا تقييمكم لتجربتكم مع طلب #${o.order_no}.`],
    ];
    return `<div class="card mt"><div class="card-head"><h3>${ic("chat")} رسائل واتساب للعميل</h3><span class="p2-muted" dir="ltr">${esc(c.phone)}</span></div><div class="filters">${T.map((t) => `<a class="btn btn-sm btn-success" target="_blank" rel="noopener" href="${waLink(c.phone, t[1])}">${ic("chat", 14)} ${t[0]}</a>`).join("")}<button class="btn btn-sm btn-ghost" data-act="p3-wa-custom" data-phone="${esc(c.phone)}" data-name="${esc(c.name)}">رسالة مخصصة</button></div></div>`;
  }
  function docSection(x) {
    const c = C.cust(x.customer_id); if (!c.phone) return "";
    const kind = (C.DOC[x.kind] || [x.kind])[0];
    const msg = x.scheduled_date ? `مرحباً ${c.name}، نؤكد موعد ${kind} يوم ${dt(x.scheduled_date)}.\nهوم ماربل 🌷` : `مرحباً ${c.name}، مرفق لكم ${kind} رقم #${x.doc_no}${Number(x.amount) ? ` بقيمة ${money(x.amount)} ر.س` : ""}.\nهوم ماربل`;
    return `<div class="card mt"><div class="card-head"><h3>${ic("chat")} إرسال للعميل</h3></div><div class="filters"><a class="btn btn-sm btn-success" target="_blank" rel="noopener" href="${waLink(c.phone, msg)}">${ic("chat", 14)} ${x.scheduled_date ? "تأكيد الموعد بواتساب" : "إرسال بواتساب"}</a>${c.email ? `<a class="btn btn-sm btn-ghost" href="mailto:${esc(c.email)}?subject=${encodeURIComponent(kind + " #" + x.doc_no)}&body=${encodeURIComponent(msg)}">${ic("mail", 14)} بالبريد</a>` : ""}</div></div>`;
  }
  function customerSection(c) {
    if (!c.phone) return "";
    return `<div class="card mt"><div class="card-head"><h3>${ic("chat")} تواصل سريع</h3></div><div class="filters"><a class="btn btn-sm btn-success" target="_blank" rel="noopener" href="${waLink(c.phone, `مرحباً ${c.name}، معك هوم ماربل 🌷`)}">${ic("chat", 14)} واتساب</a><a class="btn btn-sm btn-ghost" href="tel:${esc(c.phone)}">${ic("phone", 14)} اتصال</a>${isMgr() && T3.coupons.length ? `<button class="btn btn-sm btn-line" data-act="p3-send-coupon" data-phone="${esc(c.phone)}" data-name="${esc(c.name)}">${ic("key", 14)} إرسال كوبون</button>` : ""}</div></div>`;
  }

  // ---------------------------------------------------------------- التسويق
  const SEG = { all: "كل العملاء", branch: "عملاء فرع", city: "عملاء مدينة", noorders: "عملاء بدون طلبات", open: "عملاء لديهم طلبات جارية", completed: "عملاء أكملوا طلبات", store: "عملاء المتجر الإلكتروني" };
  function segList() {
    const m = T3.mseg; const s = m.seg || "all";
    if (s === "store") { const seenP = {}; return T3.sorders.filter((o) => { const k = waNum(o.phone); if (seenP[k]) return false; seenP[k] = 1; return true; }).map((o) => ({ name: o.customer_name, phone: o.phone, email: o.email })); }
    return C.S.customers.filter((c) => {
      const os = C.S.orders.filter((o) => o.customer_id === c.id);
      if (s === "branch") return !m.val || c.branch_id === m.val;
      if (s === "city") return !m.val || (c.city || "").trim() === m.val;
      if (s === "noorders") return !os.length;
      if (s === "open") return os.some((o) => o.status !== "completed");
      if (s === "completed") return os.some((o) => o.status === "completed");
      return true;
    });
  }
  const fill = (tpl, c, code) => tpl.replace(/\{الاسم\}|\{name\}/g, c.name || "").replace(/\{الكوبون\}/g, code || "").replace(/\{الرابط\}/g, code ? couponLink(code) : shopLink());
  function pageMarketing() {
    if (!canMkt()) return noAccess();
    const m = T3.mseg; const s = m.seg || "all"; const list = segList();
    const cities = [...new Set(C.S.customers.map((c) => (c.city || "").trim()).filter(Boolean))];
    const tpl = m.msg || "مرحباً {الاسم} 🌷\nعروض هوم ماربل الجديدة بانتظارك.\nتصفح المتجر: {الرابط}";
    const code = m.coupon || ""; const ch = m.ch || "whatsapp";
    const withC = list.filter((c) => (ch === "whatsapp" ? c.phone : c.email));
    return `${missingNote()}<div class="page-head"><div><h1>التسويق وواتساب</h1><div class="sub">رسائل جماعية مخصصة لشرائح العملاء عبر واتساب أو البريد مع إرفاق كوبون أو رابط المتجر</div></div></div>
      <div class="grid g-wide"><div class="card"><div class="card-head"><h3>${ic("send")} حملة جديدة</h3></div>
        <div class="grid2"><div class="field"><label>الشريحة</label><select class="input" id="p3-seg">${Object.keys(SEG).map((k) => opt(k, SEG[k], s)).join("")}</select></div>
        <div class="field"><label>&nbsp;</label>${s === "branch" ? `<select class="input" id="p3-segv"><option value="">—</option>${C.S.branches.map((b) => opt(b.id, b.name, m.val)).join("")}</select>` : s === "city" ? `<select class="input" id="p3-segv"><option value="">—</option>${cities.map((c) => opt(c, c, m.val)).join("")}</select>` : ""}</div>
        <div class="field"><label>القناة</label><select class="input" id="p3-ch">${opt("whatsapp", "واتساب", ch)}${opt("email", "البريد الإلكتروني", ch)}</select></div>
        <div class="field"><label>إرفاق كوبون</label><select class="input" id="p3-cp" ${isMgr() ? "" : "disabled"}><option value="">بدون</option>${T3.coupons.filter((c) => c.active).map((c) => opt(c.code, `${c.code} — ${c.discount_type === "percent" ? c.discount_value + "%" : money(c.discount_value) + " ر.س"}`, code)).join("")}</select></div></div>
        <div class="field"><label>نص الرسالة — استخدم {الاسم} و{الكوبون} و{الرابط}</label><textarea class="input" id="p3-msg" rows="5">${esc(tpl)}</textarea></div>
        <div class="filters"><b>${withC.length}</b> مستلم ${ch === "whatsapp" ? "لديه جوال" : "لديه بريد"}${ch === "email" && withC.length ? `<a class="btn btn-primary" id="p3-mail-all" href="mailto:?bcc=${encodeURIComponent(withC.map((c) => c.email).join(","))}&subject=${encodeURIComponent("هوم ماربل")}&body=${encodeURIComponent(fill(tpl, { name: "" }, code))}">${ic("mail", 16)} فتح رسالة بريد للجميع (BCC)</a>` : ""}<button class="btn btn-ghost" data-act="p3-camp-save">${ic("save", 16)} حفظ الحملة في السجل</button></div>
        <div class="tbl-wrap mt"><table><thead><tr><th>العميل</th><th>${ch === "whatsapp" ? "الجوال" : "البريد"}</th><th></th></tr></thead><tbody>${withC.slice(0, 500).map((c) => `<tr><td>${esc(c.name)}</td><td dir="ltr" style="text-align:right">${esc(ch === "whatsapp" ? c.phone : c.email)}</td><td>${ch === "whatsapp" ? `<a class="btn btn-sm btn-success" target="_blank" rel="noopener" data-p3-sent href="${waLink(c.phone, fill(tpl, c, code))}">${ic("chat", 14)} إرسال</a>` : `<a class="btn btn-sm btn-ghost" href="mailto:${esc(c.email)}?subject=${encodeURIComponent("هوم ماربل")}&body=${encodeURIComponent(fill(tpl, c, code))}">${ic("mail", 14)} إرسال</a>`}</td></tr>`).join("") || '<tr><td colspan="3" class="empty">لا يوجد مستلمون</td></tr>'}</tbody></table></div></div>
      <div class="card"><div class="card-head"><h3>${ic("log")} سجل الحملات</h3></div><div class="tbl-wrap"><table><thead><tr><th>الحملة</th><th>القناة</th><th>المستلمون</th><th>التاريخ</th></tr></thead><tbody>${T3.camps.map((c) => `<tr data-p3row="mkt_campaigns:${c.id}"><td><b>${esc(c.title)}</b><div class="p2-muted" style="font-size:12px">${esc(c.segment || "")}${c.coupon_code ? " · " + esc(c.coupon_code) : ""}</div></td><td>${c.channel === "email" ? "بريد" : "واتساب"}</td><td>${c.recipients}</td><td>${dt(c.created_at)}</td></tr>`).join("") || '<tr><td colspan="4" class="empty">لا توجد حملات</td></tr>'}</tbody></table></div></div></div>`;
  }

  // ---------------------------------------------------------------- المتجر (الإدارة)
  const SO_ST = { new: ["جديد", "b-red"], confirmed: ["مؤكد", "b-blue"], converted: ["تحوّل لطلب", "b-green"], cancelled: ["ملغي", "b-gray"] };
  const invAvail = (id) => { const i = T3.inv.find((x) => x.id === id); return i ? Number(i.qty_on_hand) : null; };
  function pageStore() {
    if (!canStore() && !canSOrders()) return noAccess();
    return `${missingNote()}<div class="page-head"><div><h1>المتجر الإلكتروني</h1><div class="sub">منتجات مرتبطة بالمخزون + طلبات العملاء من الموقع</div></div><div class="filters"><a class="btn btn-ghost" href="#/shop">${ic("store", 18)} معاينة المتجر</a><button class="btn btn-line" data-act="p3-copy" data-text="${esc(shopLink())}">${ic("copy", 18)} نسخ رابط المتجر</button>${canStore() ? `<button class="btn btn-primary" data-act="p3-prod-new">${ic("plus", 18)} منتج جديد</button>` : ""}</div></div>
      ${canSOrders() ? `<div class="card"><div class="card-head"><h3>${ic("cart")} طلبات المتجر</h3></div><div class="tbl-wrap"><table><thead><tr><th>الرقم</th><th>العميل</th><th>الجوال</th><th>المنتجات</th><th>الإجمالي</th><th>الخصم</th><th>الصافي</th><th>الكوبون</th><th>الحالة</th><th>التاريخ</th><th></th></tr></thead><tbody>
      ${T3.sorders.map((o) => `<tr data-p3row="store_orders:${o.id}"><td>${o.order_no}</td><td><b>${esc(o.customer_name)}</b><div class="p2-muted" style="font-size:12px">${esc(o.city || "")} ${esc(o.address || "")}</div></td><td dir="ltr" style="text-align:right">${esc(o.phone)}</td><td style="font-size:13px">${(o.items || []).map((i) => `${esc(i.name)} × ${i.qty}`).join("<br>")}</td><td>${money(o.subtotal)}</td><td>${money(o.discount)}</td><td><b>${money(o.total)}</b></td><td dir="ltr">${esc(o.coupon_code || "—")}</td><td>${bdg(SO_ST, o.status)}</td><td>${dt(o.created_at)}</td><td class="p2-actions"><a class="btn btn-sm btn-success" target="_blank" rel="noopener" href="${waLink(o.phone, `مرحباً ${o.customer_name}، معك هوم ماربل بخصوص طلبك من المتجر رقم #${o.order_no} بقيمة ${money(o.total)} ر.س.`)}">${ic("chat", 14)}</a>${o.status === "new" ? `<button class="btn btn-sm btn-ghost" data-act="p3-so-st" data-st="confirmed" data-id="${o.id}">تأكيد</button>` : ""}${!o.order_id && o.status !== "cancelled" && C.canSell() ? `<button class="btn btn-sm btn-primary" data-act="p3-so-convert" data-id="${o.id}">تحويل لطلب</button>` : o.order_id ? `<a class="btn btn-sm btn-line" href="#/order/${o.order_id}">الطلب</a>` : ""}${o.status !== "cancelled" && !o.order_id ? `<button class="btn btn-sm btn-line" data-act="p3-so-st" data-st="cancelled" data-id="${o.id}">إلغاء</button>` : ""}</td></tr>`).join("") || '<tr><td colspan="11" class="empty">لا توجد طلبات من المتجر بعد</td></tr>'}</tbody></table></div></div>` : ""}
      <div class="card mt"><div class="card-head"><h3>${ic("box")} المنتجات</h3></div><div class="tbl-wrap"><table><thead><tr><th>المنتج</th><th>نوع المنتج</th><th>السعر</th><th>صنف المخزون</th><th>المتوفر</th><th>منشور</th><th></th></tr></thead><tbody>
      ${T3.products.map((p) => { const i = T3.inv.find((x) => x.id === p.inventory_item_id); const a = invAvail(p.inventory_item_id); return `<tr data-p3row="store_products:${p.id}"><td><b>${esc(p.name)}</b></td><td>${esc(p.category)}</td><td>${money(p.price)} / ${esc(p.unit)}</td><td>${i ? esc(i.name) : "—"}</td><td>${a == null ? "غير مرتبط" : a <= 0 ? '<span class="badge b-red">نفد</span>' : a}</td><td>${p.published ? '<span class="badge b-green">منشور</span>' : '<span class="badge b-gray">مخفي</span>'}</td><td class="p2-actions">${canStore() ? `<button class="btn btn-sm btn-ghost" data-act="p3-prod-edit" data-id="${p.id}">${ic("edit", 14)}</button><button class="btn btn-sm btn-line" data-act="p3-prod-pub" data-id="${p.id}">${p.published ? "إخفاء" : "نشر"}</button>` : ""}${isMgr() ? `<button class="btn btn-sm btn-danger" data-act="p3-del" data-t="store_products" data-id="${p.id}">${ic("trash", 14)}</button>` : ""}</td></tr>`; }).join("") || '<tr><td colspan="7" class="empty">لا توجد منتجات — أضف أول منتج</td></tr>'}</tbody></table></div></div>`;
  }
  function prodForm(p) {
    p = p || { published: true, unit: "قطعة", category: "رخام" };
    const cats = [...new Set(T3.products.map((x) => x.category).concat(["رخام", "جرانيت", "مطابخ", "مغاسل", "درج", "أرضيات"]))];
    const ov = C.modal(p.id ? "تعديل منتج" : "منتج جديد في المتجر", `<form id="p3f"><div class="grid2">
      <div class="field"><label>اسم المنتج *</label><input class="input" name="name" required value="${esc(p.name)}"></div>
      <div class="field"><label>نوع المنتج *</label><input class="input" name="category" list="p3-pc" required value="${esc(p.category)}"><datalist id="p3-pc">${cats.map((c) => `<option value="${esc(c)}">`).join("")}</datalist></div>
      <div class="field"><label>السعر *</label><input class="input" type="number" min="0" step="0.01" name="price" required value="${esc(p.price)}"></div>
      <div class="field"><label>الوحدة</label><input class="input" name="unit" value="${esc(p.unit)}"></div>
      <div class="field"><label>ربط بصنف المخزون (يظهر المتاح فعلياً)</label><select class="input" name="inventory_item_id"><option value="">بدون ربط</option>${T3.inv.map((i) => opt(i.id, `${i.name} (${i.qty_on_hand} ${i.unit || ""})`, p.inventory_item_id)).join("")}</select></div>
      <div class="field"><label>رابط صورة</label><input class="input" name="image_url" dir="ltr" value="${esc(p.image_url)}"></div></div>
      <div class="field"><label>الوصف</label><textarea class="input" name="description">${esc(p.description)}</textarea></div>
      <label><input type="checkbox" name="published" value="1" ${p.published ? "checked" : ""}> منشور في المتجر</label></form>`, `<button class="btn btn-primary" id="p3s">حفظ</button>`);
    ov.querySelector("#p3s").onclick = async () => { const f = ov.querySelector("#p3f"); if (!f.reportValidity()) return; const v = C.formData(f); v.published = !!v.published; v.inventory_item_id = v.inventory_item_id || null; const r = await run(p.id ? sb().from("store_products").update(v).eq("id", p.id) : sb().from("store_products").insert(v)); if (r) done("تم حفظ المنتج"); };
  }
  async function convertStoreOrder(o) {
    if (!confirm(`تحويل طلب المتجر #${o.order_no} إلى عميل وطلب في النظام؟`)) return;
    let c = C.S.customers.find((x) => x.phone && waNum(x.phone) === waNum(o.phone));
    if (!c) { const r = await sb().from("customers").insert({ name: o.customer_name, phone: o.phone, email: o.email, city: o.city, address: o.address, notes: "عميل من المتجر الإلكتروني", branch_id: (C.S.profile && C.S.profile.branch_id) || null, created_by: C.S.user.id }).select().single(); if (r.error) return C.toast(C.errMsg(r.error), "err"); c = r.data; }
    const desc = (o.items || []).map((i) => `${i.name} × ${i.qty} = ${money(i.total)}`).join("\n") + (o.discount ? `\nخصم (${o.coupon_code}): ${money(o.discount)}` : "") + (o.notes ? `\n${o.notes}` : "");
    const r2 = await sb().from("orders").insert({ customer_id: c.id, branch_id: c.branch_id || null, work_type: `طلب متجر #${o.order_no}`, description: desc, total_value: o.total, required_deposit: 0, created_by: C.S.user.id }).select().single();
    if (r2.error) return C.toast(C.errMsg(r2.error), "err");
    await sb().from("store_orders").update({ status: "converted", customer_id: c.id, order_id: r2.data.id }).eq("id", o.id);
    C.toast("تم إنشاء العميل والطلب ✓", "ok"); await C.refresh(); location.hash = "#/order/" + r2.data.id;
  }

  // ---------------------------------------------------------------- الكوبونات (المدير والمدير التنفيذي فقط)
  const discTxt = (c) => (c.discount_type === "percent" ? `${Number(c.discount_value)}%` : `${money(c.discount_value)} ر.س`);
  const scopeTxt = (c) => (c.scope === "all" ? "كل المنتجات" : c.scope === "category" ? "نوع: " + (c.category || "") : "منتج: " + (c.product_name || ((T3.products.find((p) => p.id === c.product_id) || {}).name) || ""));
  const cpValid = (c) => c.active && c.valid_from <= today() && (!c.valid_to || c.valid_to >= today()) && (c.max_uses == null || c.used_count < c.max_uses);
  const shareMsg = (c) => `🎁 كوبون خصم من هوم ماربل\nالكود: ${c.code}\nالخصم: ${discTxt(c)} على ${scopeTxt(c)}\n${c.valid_to ? "صالح حتى " + dt(c.valid_to) + "\n" : ""}استخدمه من هنا: ${couponLink(c.code)}`;
  function pageCoupons() {
    if (!isMgr()) return noAccess();
    return `${missingNote()}<div class="page-head"><div><h1>الكوبونات</h1><div class="sub">توليد كوبونات عشوائية أو مخصصة بنسبة الخصم والمنتج ونوع المنتج وفترة الصلاحية — مع التحويل التلقائي لواتساب أو البريد</div></div><div class="filters"><button class="btn btn-primary" data-act="p3-cp-new" data-mode="random">${ic("refresh", 18)} توليد كوبون عشوائي</button><button class="btn btn-ghost" data-act="p3-cp-new" data-mode="manual">${ic("edit", 18)} كتابة كوبون</button></div></div>
      <div class="p3-kpis"><div class="p3-k"><div class="l">إجمالي الكوبونات</div><div class="v">${T3.coupons.length}</div></div><div class="p3-k g"><div class="l">الصالحة الآن</div><div class="v">${T3.coupons.filter(cpValid).length}</div></div><div class="p3-k"><div class="l">مرات الاستخدام</div><div class="v">${T3.coupons.reduce((a, c) => a + c.used_count, 0)}</div></div><div class="p3-k r"><div class="l">إجمالي الخصومات بالمتجر</div><div class="v">${money(T3.sorders.reduce((a, o) => a + Number(o.discount), 0))}</div></div></div>
      <div class="card mt"><div class="tbl-wrap"><table><thead><tr><th>الكود</th><th>العنوان</th><th>الخصم</th><th>ينطبق على</th><th>الصلاحية</th><th>الاستخدام</th><th>التحويل التلقائي</th><th>الحالة</th><th></th></tr></thead><tbody>
      ${T3.coupons.map((c) => `<tr data-p3row="coupons:${c.id}"><td dir="ltr" class="ex-code">${esc(c.code)}</td><td>${esc(c.title || "—")}</td><td><b>${discTxt(c)}</b></td><td>${esc(scopeTxt(c))}</td><td style="font-size:13px">${dt(c.valid_from)} ← ${c.valid_to ? dt(c.valid_to) : "مفتوح"}</td><td>${c.used_count}${c.max_uses != null ? " / " + c.max_uses : ""}</td><td style="font-size:13px">${c.whatsapp_number ? `${ic("chat", 14)} <span dir="ltr">${esc(c.whatsapp_number)}</span>` : ""}${c.contact_email ? `<div>${ic("mail", 14)} ${esc(c.contact_email)}</div>` : ""}${c.auto_redirect && c.auto_redirect !== "none" ? `<div class="badge b-blue">تلقائي: ${c.auto_redirect === "email" ? "بريد" : "واتساب"}</div>` : ""}${!c.whatsapp_number && !c.contact_email ? "—" : ""}</td><td>${cpValid(c) ? '<span class="badge b-green">صالح</span>' : c.active ? '<span class="badge b-gray">منتهي</span>' : '<span class="badge b-red">موقوف</span>'}</td>
        <td class="p2-actions"><button class="btn btn-sm btn-line" data-act="p3-copy" data-text="${esc(couponLink(c.code))}" title="نسخ الرابط">${ic("copy", 14)}</button><a class="btn btn-sm btn-success" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent(shareMsg(c))}" title="مشاركة واتساب">${ic("chat", 14)}</a><a class="btn btn-sm btn-ghost" href="mailto:?subject=${encodeURIComponent("كوبون خصم هوم ماربل")}&body=${encodeURIComponent(shareMsg(c))}" title="مشاركة بالبريد">${ic("mail", 14)}</a><a class="btn btn-sm btn-ghost" href="#/coupon/${encodeURIComponent(c.code)}" title="معاينة">${ic("store", 14)}</a><button class="btn btn-sm btn-ghost" data-act="p3-cp-edit" data-id="${c.id}">${ic("edit", 14)}</button><button class="btn btn-sm btn-line" data-act="p3-cp-toggle" data-id="${c.id}">${c.active ? "إيقاف" : "تفعيل"}</button><button class="btn btn-sm btn-danger" data-act="p3-del" data-t="coupons" data-id="${c.id}">${ic("trash", 14)}</button></td></tr>`).join("") || '<tr><td colspan="9" class="empty">لا توجد كوبونات — ولّد أول كوبون</td></tr>'}</tbody></table></div></div>`;
  }
  async function couponForm(c, mode) {
    let code = c ? c.code : "";
    if (!c && mode === "random") { const r = await sb().rpc("hm_coupon_generate", { _len: 8 }); if (r.error) return C.toast(C.errMsg(r.error), "err"); code = r.data; }
    c = c || { discount_type: "percent", scope: "all", valid_from: today(), active: true, auto_redirect: "none" };
    const cats = [...new Set(T3.products.map((p) => p.category))];
    const ov = C.modal(c.id ? "تعديل كوبون" : mode === "random" ? "كوبون عشوائي جديد" : "كتابة كوبون جديد", `<form id="p3f"><div class="grid2">
      <div class="field"><label>كود الكوبون *</label><div style="display:flex;gap:6px"><input class="input ex-code-in" name="code" required dir="ltr" value="${esc(code)}" ${c.id ? "" : 'placeholder="مثال: SUMMER25"'} style="text-transform:uppercase">${c.id ? "" : `<button type="button" class="btn btn-ghost" id="p3-regen" title="توليد عشوائي">${ic("refresh", 16)}</button>`}</div></div>
      <div class="field"><label>العنوان (اختياري)</label><input class="input" name="title" value="${esc(c.title)}" placeholder="عرض الصيف"></div>
      <div class="field"><label>نوع الخصم</label><select class="input" name="discount_type">${opt("percent", "نسبة مئوية %", c.discount_type)}${opt("fixed", "مبلغ ثابت (ر.س)", c.discount_type)}</select></div>
      <div class="field"><label>قيمة الخصم *</label><input class="input" type="number" min="0.01" step="0.01" name="discount_value" required value="${esc(c.discount_value)}"></div>
      <div class="field"><label>ينطبق على</label><select class="input" name="scope" id="p3-scope">${opt("all", "كل المنتجات", c.scope)}${opt("category", "نوع منتج محدد", c.scope)}${opt("product", "منتج محدد", c.scope)}</select></div>
      <div class="field" id="p3-sc-cat"><label>نوع المنتج</label><input class="input" name="category" list="p3-cc" value="${esc(c.category)}"><datalist id="p3-cc">${cats.map((x) => `<option value="${esc(x)}">`).join("")}</datalist></div>
      <div class="field" id="p3-sc-prod"><label>المنتج</label><select class="input" name="product_id"><option value="">—</option>${T3.products.map((p) => opt(p.id, `${p.name} (${p.category})`, c.product_id)).join("")}</select></div>
      <div class="field"><label>يبدأ من</label><input class="input" type="date" name="valid_from" value="${esc(c.valid_from)}"></div>
      <div class="field"><label>ينتهي في (فترة الصلاحية)</label><input class="input" type="date" name="valid_to" value="${esc(c.valid_to)}"></div>
      <div class="field"><label>الحد الأقصى للاستخدام (فارغ = بلا حد)</label><input class="input" type="number" min="1" name="max_uses" value="${esc(c.max_uses)}"></div></div>
      <div class="p2-section-title" style="margin:10px 0 6px;font-weight:700;color:var(--brand-dark)">${ic("send", 16)} التحويل التلقائي للزوار</div>
      <div class="grid2"><div class="field"><label>رقم واتساب الذي يُصنع عليه رابط التحويل</label><input class="input" name="whatsapp_number" dir="ltr" placeholder="9665xxxxxxxx" value="${esc(c.whatsapp_number)}"></div>
      <div class="field"><label>أو البريد الإلكتروني</label><input class="input" type="email" name="contact_email" dir="ltr" value="${esc(c.contact_email)}"></div>
      <div class="field"><label>عند فتح الزائر لرابط الكوبون</label><select class="input" name="auto_redirect">${opt("none", "يعرض الكوبون مع أزرار التواصل", c.auto_redirect)}${opt("whatsapp", "تحويل تلقائي إلى واتساب", c.auto_redirect)}${opt("email", "تحويل تلقائي إلى البريد", c.auto_redirect)}</select></div>
      <div class="field"><label>ملاحظة داخلية</label><input class="input" name="note" value="${esc(c.note)}"></div></div></form>`,
      `<button class="btn btn-primary" id="p3s">${ic("save", 16)} حفظ الكوبون</button><button class="btn btn-line" data-close>إلغاء</button>`);
    const sc = ov.querySelector("#p3-scope"); const syncSc = () => { ov.querySelector("#p3-sc-cat").style.display = sc.value === "category" ? "" : "none"; ov.querySelector("#p3-sc-prod").style.display = sc.value === "product" ? "" : "none"; }; sc.onchange = syncSc; syncSc();
    const rg = ov.querySelector("#p3-regen"); if (rg) rg.onclick = async () => { const r = await sb().rpc("hm_coupon_generate", { _len: 8 }); if (r.error) return C.toast(C.errMsg(r.error), "err"); ov.querySelector("[name=code]").value = r.data; };
    ov.querySelector("#p3s").onclick = async () => {
      const f = ov.querySelector("#p3f"); if (!f.reportValidity()) return; const v = C.formData(f);
      v.code = v.code.toUpperCase().replace(/\s/g, ""); if (!/^[A-Z0-9_-]{3,30}$/.test(v.code)) return C.toast("الكود: حروف إنجليزية وأرقام فقط (3–30)", "err");
      if (v.discount_type === "percent" && Number(v.discount_value) > 100) return C.toast("النسبة لا تتجاوز 100%", "err");
      if (v.scope === "category" && !v.category) return C.toast("حدد نوع المنتج", "err");
      if (v.scope === "product" && !v.product_id) return C.toast("حدد المنتج", "err");
      if (v.auto_redirect === "whatsapp" && !v.whatsapp_number) return C.toast("اكتب رقم واتساب للتحويل التلقائي", "err");
      if (v.auto_redirect === "email" && !v.contact_email) return C.toast("اكتب البريد للتحويل التلقائي", "err");
      if (v.valid_to && v.valid_to < v.valid_from) return C.toast("تاريخ الانتهاء قبل البداية", "err");
      ["product_id", "category", "valid_to", "max_uses", "whatsapp_number", "contact_email", "title", "note"].forEach((k) => (v[k] = v[k] || null));
      if (v.scope !== "product") v.product_id = null; if (v.scope !== "category") v.category = null;
      if (v.whatsapp_number) v.whatsapp_number = waNum(v.whatsapp_number);
      const r = await run(c.id ? sb().from("coupons").update(v).eq("id", c.id).select().single() : sb().from("coupons").insert(v).select().single());
      if (!r) return; await done("تم حفظ الكوبون");
      const saved = r === true ? v : r;
      C.modal("الكوبون جاهز للمشاركة", `<div style="text-align:center"><div class="ex-code" style="font-size:26px;direction:ltr">${esc(saved.code)}</div><p class="mt">${esc(discTxt(saved))} على ${esc(scopeTxt(saved))}</p><input class="input mt" dir="ltr" readonly value="${esc(couponLink(saved.code))}"></div>`,
        `<button class="btn btn-ghost" data-act-copy="${esc(couponLink(saved.code))}">${ic("copy", 16)} نسخ الرابط</button><a class="btn btn-success" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent(shareMsg(saved))}">${ic("chat", 16)} مشاركة واتساب</a><a class="btn btn-ghost" href="mailto:?subject=${encodeURIComponent("كوبون خصم هوم ماربل")}&body=${encodeURIComponent(shareMsg(saved))}">${ic("mail", 16)} بالبريد</a>`);
      const cb = document.querySelector("[data-act-copy]"); if (cb) cb.onclick = () => copy(cb.dataset.actCopy);
    };
  }
  function copy(t) { (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(() => C.toast("تم النسخ", "ok")).catch(() => { prompt("انسخ:", t); }); }

  // ---------------------------------------------------------------- الصفحات العامة للزوار: المتجر + الكوبون
  const SH = { products: null, cat: "", cart: {}, coupon: null, couponCode: "", done: null, err: "" };
  try { SH.cart = JSON.parse(localStorage.getItem("hm3_cart") || "{}"); } catch (e) {}
  const saveCart = () => { try { localStorage.setItem("hm3_cart", JSON.stringify(SH.cart)); } catch (e) {} };
  function calc() {
    const lines = Object.keys(SH.cart).map((id) => { const p = (SH.products || []).find((x) => x.id === id); return p ? { p, q: SH.cart[id] } : null; }).filter(Boolean);
    const sub = lines.reduce((a, l) => a + l.q * Number(l.p.price), 0); let disc = 0; const c = SH.coupon;
    if (c && c.valid) { const elig = lines.filter((l) => c.scope === "all" || (c.scope === "product" && c.product_id === l.p.id) || (c.scope === "category" && c.category === l.p.category)).reduce((a, l) => a + l.q * Number(l.p.price), 0); disc = c.discount_type === "percent" ? Math.round(elig * Number(c.discount_value)) / 100 : Math.min(Number(c.discount_value), elig); }
    return { lines, sub, disc, total: sub - disc };
  }
  function shopInner() {
    if (SH.products == null) return '<div class="boot" style="height:300px"><div class="spinner"></div></div>';
    if (SH.done) return `<div class="p3-coupon"><div class="hd">${ic("check", 40)}<h2>تم استلام طلبك رقم #${SH.done.order_no}</h2></div><div class="bd"><p>الإجمالي: <b>${money(SH.done.subtotal)}</b> ر.س · الخصم: <b>${money(SH.done.discount)}</b> · الصافي: <b>${money(SH.done.total)} ر.س</b></p><p>سيتواصل معك فريق هوم ماربل لتأكيد الطلب والتوصيل.</p>${SH.coupon && SH.coupon.whatsapp_number ? `<a class="btn btn-success btn-block" target="_blank" rel="noopener" href="${waLink(SH.coupon.whatsapp_number, `مرحباً، قمت بطلب رقم #${SH.done.order_no} من متجر هوم ماربل باستخدام الكوبون ${SH.coupon.code}`)}">${ic("chat", 18)} متابعة الطلب عبر واتساب</a>` : ""}<button class="btn btn-ghost btn-block" data-p3-shop="again">متابعة التسوق</button></div></div>`;
    const cats = [...new Set(SH.products.map((p) => p.category))];
    const list = SH.products.filter((p) => !SH.cat || p.category === SH.cat);
    const k = calc(); const c = SH.coupon;
    return `<div class="p3-shop-body"><div><div class="p3-cats"><button data-p3-cat="" class="${SH.cat ? "" : "on"}">الكل</button>${cats.map((x) => `<button data-p3-cat="${esc(x)}" class="${SH.cat === x ? "on" : ""}">${esc(x)}</button>`).join("")}</div>
      <div class="p3-grid">${list.map((p) => { const out = p.linked && Number(p.available) <= 0; return `<div class="p3-prod"><div class="im" style="${p.image_url ? `background-image:url('${esc(p.image_url)}')` : ""}">${p.image_url ? "" : ic("layers", 44)}</div><div class="bd"><b>${esc(p.name)}</b><span class="badge b-gray" style="align-self:flex-start">${esc(p.category)}</span>${p.description ? `<small class="p2-muted">${esc(p.description)}</small>` : ""}<div class="pr">${money(p.price)} ر.س / ${esc(p.unit)}</div><small>${p.linked ? (out ? '<span style="color:var(--red)">غير متوفر حالياً</span>' : `متوفر: ${Number(p.available)}`) : "متوفر عند الطلب"}</small><button class="btn btn-primary btn-sm" data-p3-add="${p.id}" ${out ? "disabled" : ""}>${ic("cart", 16)} أضف للسلة</button></div></div>`; }).join("") || '<div class="empty">لا توجد منتجات</div>'}</div></div>
      <div class="card p3-cart"><div class="card-head"><h3>${ic("cart")} سلة المشتريات</h3></div>
        ${k.lines.map((l) => `<div class="p3-line"><span>${esc(l.p.name)}</span><span style="display:flex;gap:4px;align-items:center"><button class="btn btn-sm btn-line" data-p3-q="${l.p.id}" data-d="-1">−</button>${l.q}<button class="btn btn-sm btn-line" data-p3-q="${l.p.id}" data-d="1">+</button></span><b>${money(l.q * l.p.price)}</b></div>`).join("") || '<div class="empty">السلة فارغة</div>'}
        <div class="field mt"><label>كوبون الخصم</label><div style="display:flex;gap:6px"><input class="input" id="p3-cpin" dir="ltr" value="${esc(SH.couponCode)}" style="text-transform:uppercase"><button class="btn btn-ghost" data-p3-shop="coupon">تطبيق</button></div>${c ? (c.valid ? `<small style="color:var(--green)">✓ ${esc(c.code)}: خصم ${esc(discTxt(c))} على ${esc(scopeTxt(c))}</small>` : '<small style="color:var(--red)">الكوبون غير صالح أو منتهي</small>') : ""}</div>
        <div class="p3-line"><span>الإجمالي</span><b>${money(k.sub)}</b></div>${k.disc ? `<div class="p3-line" style="color:var(--green)"><span>الخصم</span><b>− ${money(k.disc)}</b></div>` : ""}<div class="p3-line" style="font-size:17px"><span>الصافي</span><b>${money(k.total)} ر.س</b></div>
        ${k.lines.length ? `<form id="p3-co" class="mt"><div class="field"><label>الاسم *</label><input class="input" name="name" required></div><div class="field"><label>الجوال *</label><input class="input" name="phone" required dir="ltr"></div><div class="field"><label>البريد</label><input class="input" name="email" type="email" dir="ltr"></div><div class="field"><label>المدينة</label><input class="input" name="city"></div><div class="field"><label>العنوان</label><input class="input" name="address"></div><div class="field"><label>ملاحظات</label><textarea class="input" name="notes"></textarea></div><button class="btn btn-primary btn-block">${ic("check", 18)} تأكيد الطلب</button></form>` : ""}</div></div>`;
  }
  function shopPage(code) { if (code && !SH.couponCode) { SH.couponCode = code.toUpperCase(); SH.pendingCoupon = true; } return `<div id="p3-shopbox">${shopInner()}</div>`; }
  async function shopEnsure() {
    if (SH.products == null) { const r = await sb().rpc("hm_store_catalog"); SH.products = r.error ? [] : r.data || []; if (r.error) console.error(r.error); }
    if (SH.pendingCoupon) { SH.pendingCoupon = false; await applyCoupon(SH.couponCode, true); }
    shopRefresh();
  }
  async function applyCoupon(code, silent) { if (!code) { SH.coupon = null; return; } const r = await sb().rpc("hm_coupon_public", { _code: code }); SH.coupon = r.data && r.data.found ? r.data : { valid: false }; if (!silent && SH.coupon.valid) C.toast("تم تطبيق الكوبون", "ok"); }
  function shopRefresh() { const b = document.getElementById("p3-shopbox"); if (!b) return; b.innerHTML = shopInner(); shopBind(b); }
  function shopBind(b) {
    b.querySelectorAll("[data-p3-cat]").forEach((x) => (x.onclick = () => { SH.cat = x.dataset.p3Cat; shopRefresh(); }));
    b.querySelectorAll("[data-p3-add]").forEach((x) => (x.onclick = () => { SH.cart[x.dataset.p3Add] = (SH.cart[x.dataset.p3Add] || 0) + 1; saveCart(); shopRefresh(); }));
    b.querySelectorAll("[data-p3-q]").forEach((x) => (x.onclick = () => { const id = x.dataset.p3Q; SH.cart[id] = (SH.cart[id] || 0) + Number(x.dataset.d); if (SH.cart[id] <= 0) delete SH.cart[id]; saveCart(); shopRefresh(); }));
    const cb = b.querySelector('[data-p3-shop="coupon"]'); if (cb) cb.onclick = async () => { SH.couponCode = (b.querySelector("#p3-cpin").value || "").trim().toUpperCase(); await applyCoupon(SH.couponCode); shopRefresh(); };
    const ag = b.querySelector('[data-p3-shop="again"]'); if (ag) ag.onclick = () => { SH.done = null; SH.products = null; shopEnsure(); };
    const co = b.querySelector("#p3-co"); if (co) co.onsubmit = async (e) => {
      e.preventDefault(); const v = C.formData(co); const btn = co.querySelector("button"); btn.disabled = true;
      const items = Object.keys(SH.cart).map((id) => ({ id, qty: SH.cart[id] }));
      const r = await sb().rpc("hm_store_place_order", { _name: v.name, _phone: v.phone, _email: v.email || null, _city: v.city || null, _address: v.address || null, _notes: v.notes || null, _items: items, _coupon: SH.coupon && SH.coupon.valid ? SH.coupon.code : null });
      if (r.error) { btn.disabled = false; return C.toast(C.errMsg(r.error), "err"); }
      SH.done = r.data; SH.cart = {}; saveCart(); shopRefresh();
    };
  }
  function couponPage(code) { return `<div id="p3-cpbox" data-code="${esc(code || "")}"><div class="boot" style="height:300px"><div class="spinner"></div></div></div>`; }
  async function couponFill() {
    const b = document.getElementById("p3-cpbox"); if (!b) return; const code = b.dataset.code;
    const r = await sb().rpc("hm_coupon_public", { _code: code }); const c = r.data || {};
    if (!c.found) { b.innerHTML = `<div class="p3-coupon"><div class="hd"><h2>الكوبون غير موجود</h2></div><div class="bd"><a class="btn btn-primary" href="#/shop">تصفح المتجر</a></div></div>`; return; }
    const claim = `مرحباً هوم ماربل 🌷\nأرغب في الاستفادة من كوبون الخصم ${c.code} (${discTxt(c)} على ${scopeTxt(c)}).`;
    const wa = c.whatsapp_number ? waLink(c.whatsapp_number, claim) : null;
    const ml = c.contact_email ? `mailto:${c.contact_email}?subject=${encodeURIComponent("كوبون " + c.code)}&body=${encodeURIComponent(claim)}` : null;
    b.innerHTML = `<div class="p3-coupon"><div class="hd">${window.logoSVG(120)}<div class="big">${esc(discTxt(c))}</div><div>خصم على ${esc(scopeTxt(c))}</div></div><div class="bd">
      <div><span class="code">${esc(c.code)}</span></div>${c.title ? `<b>${esc(c.title)}</b>` : ""}
      <div class="p2-muted">${c.valid ? `صالح ${c.valid_to ? "حتى " + dt(c.valid_to) : "بدون تاريخ انتهاء"}` : '<span style="color:var(--red)">هذا الكوبون منتهي الصلاحية أو غير مفعّل</span>'}</div>
      ${c.valid ? `<div id="p3-auto"></div>${wa ? `<a class="btn btn-success btn-block" target="_blank" rel="noopener" href="${wa}">${ic("chat", 18)} احصل على الخصم عبر واتساب</a>` : ""}${ml ? `<a class="btn btn-ghost btn-block" href="${ml}">${ic("mail", 18)} احصل على الخصم عبر البريد</a>` : ""}<a class="btn btn-primary btn-block" href="#/shop/${encodeURIComponent(c.code)}">${ic("store", 18)} استخدمه في المتجر الإلكتروني</a><button class="btn btn-line btn-block" data-p3-cpcopy>${ic("copy", 18)} نسخ الكود</button>` : `<a class="btn btn-primary btn-block" href="#/shop">تصفح المتجر</a>`}</div></div>`;
    const cc = b.querySelector("[data-p3-cpcopy]"); if (cc) cc.onclick = () => copy(c.code);
    const target = c.valid && !(C.S.user && C.S.roles.length) ? (c.auto_redirect === "whatsapp" ? wa : c.auto_redirect === "email" ? ml : null) : null;
    if (target) { let n = 3; const box = b.querySelector("#p3-auto"); const tick = () => { if (!document.getElementById("p3-auto")) return; if (n <= 0) { location.href = target; return; } box.innerHTML = `<div class="p2-warn">سيتم تحويلك تلقائياً إلى ${c.auto_redirect === "email" ? "البريد" : "واتساب"} خلال ${n} ثوانٍ…</div>`; n--; setTimeout(tick, 1000); }; tick(); }
  }
  const PUBLIC = ["shop", "coupon"];
  function publicShell(inner) { return `<div class="p3-shop"><div class="p3-shop-top">${window.logoSVG(110)}<h1>متجر هوم ماربل</h1><div class="sp"></div><a class="btn btn-ghost btn-sm" href="#/shop" style="background:rgba(255,255,255,.12);color:inherit">${ic("store", 16)} المتجر</a><button class="btn btn-ghost btn-sm" id="p3-login" style="background:rgba(255,255,255,.12);color:inherit">${ic("users", 16)} دخول الموظفين</button></div>${inner}</div>`; }
  function renderPublic() {
    const [r, id] = location.hash.replace(/^#\/?/, "").split("/"); if (!PUBLIC.includes(r)) return false;
    C.app.innerHTML = publicShell(r === "shop" ? shopPage(decodeURIComponent(id || "")) : couponPage(decodeURIComponent(id || "")));
    document.getElementById("p3-login").onclick = () => { location.hash = "#/"; location.reload(); };
    if (r === "shop") shopEnsure(); else couponFill();
    return true;
  }
  function authRendered() {
    if (renderPublic()) return;
    const card = document.querySelector(".auth-card"); if (!card || card.querySelector(".p3-vis")) return;
    card.insertAdjacentHTML("beforeend", `<div class="p3-vis" style="margin-top:10px"><a class="btn btn-ghost btn-block" href="#/shop">${ic("store", 18)} المتجر الإلكتروني</a></div>`);
  }
  window.addEventListener("hashchange", () => { if (C && !C.S.user) renderPublic(); });

  // ---------------------------------------------------------------- دليل الاستخدام والتسليم
  function pageGuide() {
    const G = [
      ["المبيعات", ["أضف العميل ← عرض السعر ← التصميم ← العقد ← طلب القياس.", "سجّل سند القبض للدفعة المقدمة ثم أرسل الطلب للمصنع بعد اكتمال الضوابط.", "استخدم أزرار واتساب في صفحة الطلب لإبلاغ العميل بالحالة والمواعيد."]],
      ["المحاسبة", ["من «المحاسبة والمالية» سجّل الإيرادات وسندات الصرف واربطها بالفاتورة أو الطلب.", "اختر الفترة والفرع واطبع التقرير المالي.", "قسم «ربط المدفوعات بالفواتير» يوضح المسدد والمتبقي لكل فاتورة."]],
      ["الإدارة", ["«شؤون الموظفين»: ملفات الموظفين واعتماد الإجازات والسياسات.", "«الإشعارات والتواصل»: انشر إعلاناً لكل الموظفين أو لوظيفة محددة.", "«الكوبونات»: ولّد كوبوناً عشوائياً أو اكتبه بنفسك، وحدد الخصم والمنتج أو نوع المنتج والصلاحية ورقم واتساب للتحويل التلقائي."]],
      ["المتجر الإلكتروني", ["أضف المنتجات واربطها بأصناف المخزون ليظهر المتاح فعلياً للزوار.", "طلبات الزوار تظهر في «المتجر الإلكتروني» مع تنبيه، ويمكن تحويلها لعميل وطلب بضغطة.", "انسخ رابط المتجر أو رابط الكوبون وشاركه مع العملاء."]],
      ["كل الموظفين", ["«بوابة الموظف»: ملفك وطلبات إجازتك والسياسات والإعلانات.", "في أي جدول: علّم مربع الاختيار لتحديد عنصر أو «تحديد الكل» ثم «حذف المحدد» (حسب صلاحيتك)، وكل المحذوفات تُحفظ في سلة المحذوفات.", "زر «حفظ التقرير» أعلى كل صفحة للتصدير إلى Excel أو PDF."]],
    ];
    const CHECK = ["تشغيل ملفات قاعدة البيانات 0001 و0002 و0003 بالترتيب", "تسليم كل موظف بريده وكلمة مروره (ملف الحسابات) وتغييرها بعد الاستلام", "تفعيل وظيفة كل موظف جديد من «المستخدمون والصلاحيات»", "إضافة منتجات المتجر وربطها بالمخزون ونشر رابط المتجر", "تجربة دورة كاملة: عميل ← طلب ← مصنع ← جودة ← تركيب ← تحصيل", "أخذ نسخة احتياطية كاملة من «التقارير والنسخ الاحتياطي»"];
    return `<div class="page-head"><div><h1>دليل الاستخدام والتدريب والتسليم</h1><div class="sub">شرح مختصر لكل قسم وقائمة التسليم النهائي</div></div><div class="filters"><button class="btn btn-ghost" onclick="window.print()">${ic("print", 18)} طباعة</button></div></div>
      <div class="grid g2">${G.map((g) => `<div class="card p3-guide"><h4>${esc(g[0])}</h4><ul>${g[1].map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>`).join("")}<div class="card p3-guide"><h4>قائمة التسليم النهائي</h4><ul>${CHECK.map((x) => `<li>☐ ${esc(x)}</li>`).join("")}</ul></div></div>`;
  }

  // ---------------------------------------------------------------- لوحة المدير
  function dashboard() {
    if (T3.missing || !isFin()) return "";
    const m = today().slice(0, 7);
    const rec = C.S.documents.filter((x) => x.kind === "receipt" && (x.created_at || "").slice(0, 7) === m).reduce((a, b) => a + Number(b.amount), 0);
    const inc = T3.fin.filter((e) => e.kind === "income" && e.entry_date.slice(0, 7) === m).reduce((a, b) => a + Number(b.amount), 0) + rec;
    const exp = T3.fin.filter((e) => e.kind === "expense" && e.entry_date.slice(0, 7) === m).reduce((a, b) => a + Number(b.amount), 0);
    return `<div class="card mt"><div class="card-head"><h3>${ic("coins")} المرحلة الثالثة — هذا الشهر</h3><a href="#/finance">المحاسبة</a></div><div class="p3-kpis"><div class="p3-k g"><div class="l">الإيرادات</div><div class="v">${money(inc)}</div></div><div class="p3-k r"><div class="l">المصروفات</div><div class="v">${money(exp)}</div></div><div class="p3-k"><div class="l">الصافي</div><div class="v">${money(inc - exp)}</div></div><div class="p3-k"><div class="l">طلبات المتجر الجديدة</div><div class="v">${T3.sorders.filter((o) => o.status === "new").length}</div></div><div class="p3-k"><div class="l">الموظفون</div><div class="v">${T3.emps.filter((e) => e.status !== "ended").length}</div></div></div></div>`;
  }

  // =====================================================================
  //  التحديد المتعدد والحذف الجماعي لكل جداول النظام
  // =====================================================================
  const HREF_T = { customer: "customers", order: "orders", doc: "documents", "inventory-item": "inventory_items", job: "installation_jobs", purchase: "purchase_requests", visit: "measurement_visits", "support-thread": "support_threads" };
  const BTN_T = { "del-customer": "customers", "del-order": "orders", "del-doc": "documents", "ex-room-del": "chat_rooms", "ex-rep-del": "saved_reports", "ex-thread-del": "support_threads" };
  const P2_DEL = { inventory_items: ["admin", "executive", "factory_manager", "warehouse"], purchase_requests: ["admin", "executive", "factory_manager", "purchasing"], measurement_visits: ["admin", "executive", "factory_manager", "sales"], installation_jobs: ["admin", "executive", "factory_manager"] };
  function canDel(t) {
    if (isMgr()) return true;
    if (t === "fin_entries") return has("accountant");
    if (t === "hr_leaves") return true;
    return !!(P2_DEL[t] && has(...P2_DEL[t]));
  }
  function rowKey(tr) {
    if (tr.dataset.p3row) { const [t, id] = tr.dataset.p3row.split(":"); return { t, col: "id", id }; }
    const h = tr.getAttribute("data-href");
    if (h) { const m = h.replace(/^#\/?/, "").split("/"); if (HREF_T[m[0]] && m[1]) return { t: HREF_T[m[0]], col: "id", id: m[1] }; }
    for (const x of tr.querySelectorAll("[data-act]")) {
      const a = x.dataset.act;
      if (BTN_T[a] && x.dataset.id) return { t: BTN_T[a], col: "id", id: x.dataset.id };
      if (a === "ex-del-purge" && x.dataset.batch) return { t: "deleted_records", col: "batch", id: x.dataset.batch };
    }
    return null;
  }
  function bulkEnhance() {
    const main = document.querySelector(".content"); if (!main) return;
    const route = C.S.route;
    main.querySelectorAll("table").forEach((tbl, ti) => {
      if (tbl.dataset.p3bulk) return;
      const rows = [...tbl.querySelectorAll("tbody > tr")];
      const keys = rows.map((tr) => { const k = rowKey(tr); return k && canDel(k.t) ? k : null; });
      if (!keys.some(Boolean)) return;
      tbl.dataset.p3bulk = "1";
      const sk = route + "#" + ti; const sel = (T3.sel[sk] = T3.sel[sk] || {});
      const id = (k) => k.t + "|" + k.col + "|" + k.id;
      const hr = tbl.querySelector("thead tr"); if (hr) hr.insertAdjacentHTML("afterbegin", `<th class="p3-ck"><input type="checkbox" title="تحديد الكل" data-p3all></th>`);
      rows.forEach((tr, i) => {
        const k = keys[i]; const td = document.createElement("td"); td.className = "p3-ck";
        if (k) { td.innerHTML = `<input type="checkbox" data-p3one="${esc(id(k))}" ${sel[id(k)] ? "checked" : ""}>`; if (sel[id(k)]) tr.classList.add("p3-on"); td.onclick = (e) => e.stopPropagation(); }
        else { const only = tr.children.length === 1 && tr.firstElementChild.hasAttribute("colspan"); if (only) { const c = tr.firstElementChild; c.colSpan = (c.colSpan || 1) + 1; return; } }
        tr.insertBefore(td, tr.firstChild);
      });
      const wrap = tbl.closest(".tbl-wrap") || tbl;
      const bar = document.createElement("div"); bar.className = "p3-bulk"; wrap.parentNode.insertBefore(bar, wrap);
      const valid = new Set(keys.filter(Boolean).map(id)); Object.keys(sel).forEach((x) => { if (!valid.has(x)) delete sel[x]; });
      const upd = () => {
        const n = Object.keys(sel).length; const all = valid.size && n === valid.size;
        const ha = tbl.querySelector("[data-p3all]"); if (ha) { ha.checked = !!all; ha.indeterminate = n > 0 && !all; }
        bar.innerHTML = `${ic("check", 16)} <span>المحدد: <b>${n}</b> من ${valid.size}</span><button class="btn btn-sm btn-line" data-b="all">${all ? "إلغاء تحديد الكل" : "تحديد الكل"}</button><span class="sp"></span>${n ? `<button class="btn btn-sm btn-ghost" data-b="none">إلغاء التحديد</button><button class="btn btn-sm btn-danger" data-b="del">${ic("trash", 14)} حذف المحدد (${n})</button>` : ""}`;
        bar.querySelector('[data-b="all"]').onclick = () => setAll(!all);
        const nb = bar.querySelector('[data-b="none"]'); if (nb) nb.onclick = () => setAll(false);
        const db = bar.querySelector('[data-b="del"]'); if (db) db.onclick = () => bulkDelete(sel);
      };
      const setAll = (on) => { tbl.querySelectorAll("[data-p3one]").forEach((cb) => { cb.checked = on; cb.closest("tr").classList.toggle("p3-on", on); if (on) sel[cb.dataset.p3one] = 1; else delete sel[cb.dataset.p3one]; }); upd(); };
      tbl.querySelectorAll("[data-p3one]").forEach((cb) => (cb.onchange = () => { if (cb.checked) sel[cb.dataset.p3one] = 1; else delete sel[cb.dataset.p3one]; cb.closest("tr").classList.toggle("p3-on", cb.checked); upd(); }));
      const ha = tbl.querySelector("[data-p3all]"); if (ha) { ha.onclick = (e) => e.stopPropagation(); ha.onchange = () => setAll(ha.checked); }
      upd();
    });
  }
  async function bulkDelete(sel) {
    const ids = Object.keys(sel); if (!ids.length) return;
    const purge = ids.some((x) => x.startsWith("deleted_records|"));
    if (!confirm(purge ? `حذف نهائي لـ ${ids.length} عنصر من سلة المحذوفات؟ لا يمكن التراجع.` : `حذف ${ids.length} عنصر محدد؟ (تُحفظ في سلة المحذوفات ويمكن استعادتها)`)) return;
    const g = {}; ids.forEach((x) => { const [t, col, id] = x.split("|"); const k = t + "|" + col; (g[k] = g[k] || []).push(id); });
    const order = ["documents", "orders", "customers"]; const keys = Object.keys(g).sort((a, b) => order.indexOf(a.split("|")[0]) - order.indexOf(b.split("|")[0]));
    let ok = 0, bad = 0;
    for (const k of keys) {
      const [t, col] = k.split("|"); const list = g[k];
      for (let i = 0; i < list.length; i += 100) {
        const chunk = list.slice(i, i + 100);
        const r = await sb().from(t).delete().in(col, chunk).select("id");
        if (r.error) { bad += chunk.length; console.error(r.error); C.toast(C.errMsg(r.error), "err"); } else { const n = (r.data || []).length; ok += n; bad += Math.max(0, chunk.length - n); }
      }
    }
    ids.forEach((x) => delete sel[x]);
    C.toast(bad ? `تم حذف ${ok} — تعذّر ${bad} (صلاحية أو سجل مرتبط)` : `تم حذف ${ok} عنصر ✓`, bad ? "err" : "ok");
    const r0 = C.S.route.split("/")[0];
    await C.refresh();
    if (["customer", "order", "doc"].includes(r0)) location.hash = "#/";
  }

  // ---------------------------------------------------------------- bind + actions
  function bind(route) {
    const r = (route || "").split("/")[0];
    const id = (route || "").split("/")[1];
    const $ = (s) => document.querySelector(s);
    if (r === "finance") ["p3-fb", "p3-ff", "p3-ft"].forEach((x) => { const e = $("#" + x); if (e) e.onchange = () => { T3.ff = { branch: $("#p3-fb").value, from: $("#p3-ff").value, to: $("#p3-ft").value }; C.render(true); }; });
    if (r === "marketing") {
      const sg = $("#p3-seg"); if (sg) sg.onchange = () => { T3.mseg.seg = sg.value; T3.mseg.val = ""; C.render(true); };
      const sv = $("#p3-segv"); if (sv) sv.onchange = () => { T3.mseg.val = sv.value; C.render(true); };
      const ch = $("#p3-ch"); if (ch) ch.onchange = () => { T3.mseg.ch = ch.value; C.render(true); };
      const cp = $("#p3-cp"); if (cp) cp.onchange = () => { T3.mseg.coupon = cp.value; const m = $("#p3-msg"); T3.mseg.msg = m.value; if (cp.value && !/\{الكوبون\}/.test(m.value)) T3.mseg.msg = m.value + "\nكوبون الخصم: {الكوبون}\n{الرابط}"; C.render(true); };
      const ms = $("#p3-msg"); if (ms) ms.onchange = () => { T3.mseg.msg = ms.value; C.render(true); };
    }
    if (r === "shop") { const b = document.getElementById("p3-shopbox"); if (b) { if (id && !SH.couponCode) { SH.couponCode = decodeURIComponent(id).toUpperCase(); SH.pendingCoupon = true; } shopBind(b); if (SH.products == null || SH.pendingCoupon) shopEnsure(); } }
    if (r === "coupon") couponFill();
    if (r === "comms") { /* seen updated on render */ }
    bulkEnhance();
  }
  async function action(a, el) {
    if (!a || !a.startsWith("p3-")) return false;
    const ds = el.dataset; const find = (list) => list.find((x) => x.id === ds.id);
    switch (a) {
      case "p3-del": { if (!confirm("حذف هذا العنصر؟ (يُحفظ في سلة المحذوفات)")) return true; const r = await run(sb().from(ds.t).delete().eq("id", ds.id)); if (r) await done("تم الحذف"); return true; }
      case "p3-copy": copy(ds.text); return true;
      case "p3-fin-new": finForm(null, ds.kind, ds.inv); return true;
      case "p3-fin-edit": finForm(find(T3.fin)); return true;
      case "p3-fin-voucher": printVoucher(find(T3.fin)); return true;
      case "p3-fin-print": printFinReport(); return true;
      case "p3-emp-new": empForm(); return true;
      case "p3-emp-edit": empForm(find(T3.emps)); return true;
      case "p3-pol-new": polForm(); return true;
      case "p3-pol-edit": polForm(find(T3.policies)); return true;
      case "p3-lv-new": leaveForm(); return true;
      case "p3-lv": { const note = ds.st === "rejected" ? prompt("سبب الرفض (اختياري)") : ""; if (note === null) return true; const r = await run(sb().from("hr_leaves").update({ status: ds.st, decided_by: C.S.user.id, decided_at: new Date().toISOString(), decision_note: note || null }).eq("id", ds.id)); if (r) await done(ds.st === "approved" ? "تم اعتماد الإجازة" : "تم رفض الإجازة"); return true; }
      case "p3-ann-new": annForm(); return true;
      case "p3-wa-custom": { const t = prompt("نص الرسالة", `مرحباً ${ds.name}، `); if (t) window.open(waLink(ds.phone, t), "_blank"); return true; }
      case "p3-send-coupon": { const list = T3.coupons.filter(cpValid); if (!list.length) { C.toast("لا توجد كوبونات صالحة", "err"); return true; } const ov = C.modal("إرسال كوبون للعميل", `<div class="field"><label>الكوبون</label><select class="input" id="p3-scp">${list.map((c) => opt(c.code, `${c.code} — ${discTxt(c)}`)).join("")}</select></div>`, `<button class="btn btn-success" id="p3s">${ic("chat", 16)} إرسال واتساب</button>`); ov.querySelector("#p3s").onclick = () => { const c = list.find((x) => x.code === ov.querySelector("#p3-scp").value); window.open(waLink(ds.phone, `مرحباً ${ds.name} 🌷\n` + shareMsg(c)), "_blank"); C.closeModal(); }; return true; }
      case "p3-camp-save": { const m = T3.mseg; const msg = (document.querySelector("#p3-msg") || {}).value || ""; const n = segList().filter((c) => ((m.ch || "whatsapp") === "whatsapp" ? c.phone : c.email)).length; const title = prompt("اسم الحملة", "حملة " + today()); if (!title) return true; const r = await run(sb().from("mkt_campaigns").insert({ title, channel: m.ch || "whatsapp", segment: SEG[m.seg || "all"], message: msg, coupon_code: m.coupon || null, recipients: n })); if (r) await done("تم حفظ الحملة"); return true; }
      case "p3-prod-new": prodForm(); return true;
      case "p3-prod-edit": prodForm(find(T3.products)); return true;
      case "p3-prod-pub": { const p = find(T3.products); const r = await run(sb().from("store_products").update({ published: !p.published }).eq("id", p.id)); if (r) await done(p.published ? "تم إخفاء المنتج" : "تم نشر المنتج"); return true; }
      case "p3-so-st": { const r = await run(sb().from("store_orders").update({ status: ds.st }).eq("id", ds.id)); if (r) await done("تم التحديث"); return true; }
      case "p3-so-convert": convertStoreOrder(find(T3.sorders)); return true;
      case "p3-cp-new": couponForm(null, ds.mode); return true;
      case "p3-cp-edit": couponForm(find(T3.coupons)); return true;
      case "p3-cp-toggle": { const c = find(T3.coupons); const r = await run(sb().from("coupons").update({ active: !c.active }).eq("id", c.id)); if (r) await done(c.active ? "تم إيقاف الكوبون" : "تم تفعيل الكوبون"); return true; }
    }
    return false;
  }

  window.HM_EXT = window.HM_EXT || [];
  window.HM_EXT.push({
    init(ctx) { C = ctx; css(); },
    load,
    realtimeTables: () => (T3.missing ? [] : TABLES),
    nav, alerts, search, dashboard, orderSection, docSection, customerSection, authRendered, action, bind,
    auditLabels: () => AR,
    auditDesc: (t, r) => (AR[t] ? r.code || r.full_name || r.customer_name || r.category || r.title || "" : ""),
    pages: { finance: pageFinance, hr: pageHR, portal: pagePortal, comms: pageComms, marketing: pageMarketing, store: pageStore, coupons: pageCoupons, guide: pageGuide, shop: (code) => shopPage(decodeURIComponent(code || "")), coupon: (code) => couponPage(decodeURIComponent(code || "")) },
  });
})();
