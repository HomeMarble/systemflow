/* هوم ماربل — المرحلة الثانية: المصنع والمشتريات والمستودع والقياسات والتركيبات وفحص الجودة
   ملف إضافي بالكامل يتصل بالمرحلة الأولى عبر نقاط الربط (window.HM_EXT) دون تعديل أي ميزة قائمة. */
(function () {
  let C = null; // أدوات المرحلة الأولى المشتركة
  const P = { items: [], logs: [], qc: [], suppliers: [], inv: [], moves: [], res: [], prs: [], visits: [], jobs: [], staff: [], urls: {}, missing: false, f: {} };

  // ---------- ثوابت ----------
  const P2_ROLES = { purchasing: "المشتريات", warehouse: "أمين المستودع", cutting_supervisor: "مشرف القص", assembly_supervisor: "مشرف التجميع", polishing_supervisor: "مشرف التلميع", quality_inspector: "مراقب الجودة", measurement_tech: "فني القياسات", installer: "فريق التركيبات" };
  const P1_ROLES = ["admin", "executive", "sales", "factory_manager", "accountant"];
  const STAGES = ["queued", "cutting", "assembly", "polishing", "quality", "ready", "installed"];
  const STAGE = {
    queued: ["بانتظار البدء", "b-gray", "#9a8b8c"], cutting: ["القص", "b-blue", "#3d7bd6"], assembly: ["التجميع", "b-yellow", "#e6b422"],
    polishing: ["التلميع", "b-orange", "#ef9a3c"], quality: ["فحص الجودة", "b-brand", "#7e1416"], ready: ["جاهز ومعتمد", "b-green", "#5aa58a"], installed: ["تم التركيب", "b-green", "#2f9e5b"],
  };
  const NEXT = { queued: "cutting", cutting: "assembly", assembly: "polishing", polishing: "quality" };
  const SSTATE = { waiting: ["بالانتظار", "b-gray"], in_progress: ["جاري العمل", "b-blue"], paused: ["متوقف", "b-red"] };
  const PR_ST = { draft: ["مسودة", "b-gray"], requested: ["بانتظار الاعتماد", "b-yellow"], approved: ["معتمد", "b-blue"], ordered: ["أُرسل للمورد", "b-orange"], partial: ["توريد جزئي", "b-orange"], received: ["تم التوريد", "b-green"], cancelled: ["ملغي", "b-red"] };
  const V_ST = { scheduled: ["مجدولة", "b-yellow"], on_the_way: ["في الطريق", "b-blue"], in_progress: ["جاري القياس", "b-orange"], done: ["تم القياس", "b-green"], postponed: ["مؤجلة", "b-gray"], cancelled: ["ملغاة", "b-red"] };
  const J_ST = { scheduled: ["مجدول", "b-yellow"], on_the_way: ["في الطريق", "b-blue"], in_progress: ["جاري التركيب", "b-orange"], completed: ["تم التسليم", "b-green"], postponed: ["مؤجل", "b-gray"], cancelled: ["ملغي", "b-red"] };
  const QC_LIST = [["dims", "مطابقة المقاسات للتصميم"], ["color", "اللون والعروق ومطابقة العينة"], ["finish", "جودة التلميع والتشطيب"], ["edges", "الحواف والزوايا خالية من الكسر"], ["assembly", "سلامة التجميع واللصق"], ["packing", "التغليف والحماية للنقل"]];
  const MV = { in: ["وارد", "b-green"], out: ["صرف", "b-red"], adjust: ["تسوية", "b-blue"] };
  const AUDIT_T = { suppliers: "الموردون", inventory_items: "أصناف المخزون", inventory_movements: "حركات المخزون", inventory_reservations: "حجز المواد", purchase_requests: "طلبات الشراء", order_items: "بنود التصنيع", quality_checks: "فحص الجودة", measurement_visits: "زيارات القياس", installation_jobs: "التركيبات" };

  // ---------- مساعدات ----------
  const has = (...r) => C.has(...r);
  const esc = (v) => C.esc(v);
  const money = (n) => C.money(n);
  const d = (t) => C.d(t);
  const dt = (t) => (t ? new Date(t).toLocaleString("en-GB", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—");
  const num = (n) => Number(n || 0).toLocaleString("en-US", { maximumFractionDigits: 3 });
  const ic = (n, s) => window.icon(n, s);
  const bdg = (map, k) => { const s = map[k] || [k, "b-gray"]; return `<span class="badge ${s[1]}">${s[0]}</span>`; };
  const today = () => new Date().toLocaleDateString("en-CA");
  const isP2Only = () => !C.S.roles.some((r) => P1_ROLES.includes(r));
  const R = {
    mgr: () => has("admin", "executive"),
    fmgr: () => has("admin", "executive", "factory_manager"),
    factory: () => has("admin", "executive", "factory_manager", "cutting_supervisor", "assembly_supervisor", "polishing_supervisor", "quality_inspector"),
    qc: () => has("admin", "executive", "factory_manager", "quality_inspector"),
    prView: () => has("admin", "executive", "factory_manager", "purchasing", "warehouse", "accountant"),
    prNew: () => has("admin", "executive", "purchasing", "warehouse", "factory_manager", "accountant", "sales"),
    prEdit: () => has("admin", "executive", "purchasing", "factory_manager", "accountant", "warehouse"),
    prApprove: () => has("admin", "executive", "factory_manager", "accountant"),
    prReceive: () => has("admin", "executive", "factory_manager", "purchasing", "warehouse"),
    sup: () => has("admin", "executive", "purchasing", "factory_manager", "warehouse"),
    supView: () => has("admin", "executive", "purchasing", "factory_manager", "warehouse", "accountant"),
    invView: () => has("admin", "executive", "factory_manager", "warehouse", "purchasing", "sales", "accountant"),
    invEdit: () => has("admin", "executive", "warehouse", "factory_manager", "purchasing"),
    invMove: () => has("admin", "executive", "warehouse", "factory_manager"),
    resNew: () => has("admin", "executive", "warehouse", "factory_manager", "sales"),
    visView: () => has("admin", "executive", "sales", "factory_manager", "measurement_tech"),
    visNew: () => has("admin", "executive", "sales", "factory_manager", "measurement_tech"),
    visOffice: () => has("admin", "executive", "sales", "factory_manager"),
    jobView: () => has("admin", "executive", "sales", "factory_manager", "installer"),
    jobNew: () => has("admin", "executive", "sales", "factory_manager"),
  };
  const canMoveFrom = (st) => R.fmgr() || (has("cutting_supervisor") && (st === "queued" || st === "cutting")) || (has("assembly_supervisor") && st === "assembly") || (has("polishing_supervisor") && st === "polishing");
  const canVisit = (v) => R.visOffice() || (has("measurement_tech") && (!v.technician_id || v.technician_id === C.S.user.id));
  const canJob = (j) => R.jobNew() || (has("installer") && (!j.team_lead_id || j.team_lead_id === C.S.user.id || (j.member_ids || []).includes(C.S.user.id)));

  const order = (id) => C.S.orders.find((o) => o.id === id) || {};
  const custName = (id) => C.cust(id).name || "—";
  const staffName = (id) => { if (!id) return "—"; const s = P.staff.find((x) => x.id === id) || C.S.profiles.find((x) => x.id === id); return (s && (s.full_name || s.email)) || "—"; };
  const staffWith = (...roles) => P.staff.filter((s) => (s.roles || []).some((r) => roles.includes(r)));
  const supName = (id) => (P.suppliers.find((s) => s.id === id) || {}).name || "—";
  const invItem = (id) => P.inv.find((i) => i.id === id) || {};
  const reserved = (id) => P.res.filter((r) => r.item_id === id && r.status === "active").reduce((a, b) => a + Number(b.qty), 0);
  const avail = (id) => Number(invItem(id).qty_on_hand || 0) - reserved(id);
  const isLow = (i) => i.is_active !== false && avail(i.id) <= Number(i.min_qty || 0);
  const orderLabel = (id) => { const o = order(id); return o.id ? `#${o.order_no} — ${custName(o.customer_id)}` : "—"; };
  const orderOpts = (sel, filter) => `<option value="">— بدون —</option>` + C.S.orders.filter(filter || (() => true)).map((o) => `<option value="${o.id}" ${sel === o.id ? "selected" : ""}>#${o.order_no} — ${esc(custName(o.customer_id))} — ${esc(o.work_type)}</option>`).join("");
  const staffOpts = (list, sel) => `<option value="">— غير مسند —</option>` + list.map((s) => `<option value="${s.id}" ${sel === s.id ? "selected" : ""}>${esc(s.full_name || s.email)}</option>`).join("");
  const opts = (map, sel) => Object.keys(map).map((k) => `<option value="${k}" ${sel === k ? "selected" : ""}>${map[k][0]}</option>`).join("");
  const field = (label, html, cls) => `<div class="field ${cls || ""}"><label>${label}</label>${html}</div>`;
  const inp = (name, val, attrs) => `<input class="input" name="${name}" value="${esc(val == null ? "" : val)}" ${attrs || ""}>`;
  const area = (name, val) => `<textarea class="input" name="${name}">${esc(val || "")}</textarea>`;
  const saveBtns = (label) => `<button class="btn btn-primary" id="p2save">${label || "حفظ"}</button><button class="btn btn-line" data-close>إلغاء</button>`;
  const emptyRow = (cols, msg) => `<tr><td colspan="${cols}" class="empty">${msg || "لا توجد بيانات"}</td></tr>`;
  const kpi = (lbl, val, unit, icn, foot) => `<div class="card"><div class="kpi"><div><div class="lbl">${lbl}</div><div class="val">${val}</div><div class="unit">${unit || ""}</div></div><div class="ico">${ic(icn, 26)}</div></div>${foot ? `<div class="kpi-foot">${foot}</div>` : ""}</div>`;
  const missingBanner = () => (P.missing ? `<div class="p2-warn">${ic("alert", 18)} لم يتم تفعيل جداول المرحلة الثانية في قاعدة البيانات بعد — يرجى تشغيل ملف <b>database/phase2_migration.sql</b> مرة واحدة من محرر SQL.</div>` : "");
  const noAccess = () => '<div class="empty">لا تملك صلاحية الوصول لهذه الصفحة</div>';
  const toLocalInput = (t) => { if (!t) return ""; const x = new Date(t); const z = new Date(x.getTime() - x.getTimezoneOffset() * 60000); return z.toISOString().slice(0, 16); };

  async function run(promise, okMsg) {
    try {
      const r = await promise;
      if (r && r.error) { C.toast(C.errMsg(r.error), "err"); return null; }
      if (okMsg) C.toast(okMsg, "ok");
      return r || {};
    } catch (er) { C.toast(C.errMsg(er), "err"); return null; }
  }
  async function done(msg) { C.closeModal(); if (msg) C.toast(msg, "ok"); await C.refresh(); }
  function modalForm(title, body, label, onSave, wide) {
    const ov = C.modal(title, `<form id="p2f" onsubmit="return false">${body}</form>`, saveBtns(label));
    if (wide) ov.querySelector(".modal").classList.add("modal-wide");
    const btn = ov.querySelector("#p2save");
    btn.onclick = async () => {
      const f = ov.querySelector("#p2f"); if (!f.reportValidity()) return;
      btn.disabled = true;
      try { await onSave(C.formData(f), f, ov); } catch (er) { C.toast(C.errMsg(er), "err"); }
      btn.disabled = false;
    };
    return ov;
  }

  // ---------- الصور (Supabase Storage — Bucket خاص hm-files) ----------
  async function upload(files, folder) {
    const out = [];
    for (const file of Array.from(files || [])) {
      if (!file || !file.size) continue;
      if (file.size > 10 * 1024 * 1024) { C.toast(`الملف ${file.name} أكبر من 10MB`, "err"); continue; }
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
      const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const r = await C.sb.storage.from("hm-files").upload(path, file, { contentType: file.type || "image/jpeg", upsert: false });
      if (r.error) { C.toast("تعذّر رفع " + file.name + ": " + C.errMsg(r.error), "err"); continue; }
      out.push(path);
    }
    return out;
  }
  const photos = (paths, delAct) => (paths && paths.length ? `<div class="p2-photos">${paths.map((p) => `<div class="p2-ph"><img data-sp="${esc(p)}" alt="صورة">${delAct ? `<button type="button" class="p2-ph-del" data-act="${delAct}" data-path="${esc(p)}" title="حذف">×</button>` : ""}</div>`).join("")}</div>` : '<div class="p2-muted">لا توجد صور</div>');
  async function hydratePhotos(root) {
    const imgs = Array.from((root || document).querySelectorAll("img[data-sp]"));
    if (!imgs.length) return;
    const need = [...new Set(imgs.map((i) => i.dataset.sp).filter((p) => !P.urls[p]))];
    if (need.length) {
      try {
        const r = await C.sb.storage.from("hm-files").createSignedUrls(need, 3600);
        (r.data || []).forEach((x) => { if (x.signedUrl) P.urls[x.path] = x.signedUrl; });
      } catch (er) { console.error(er); }
    }
    imgs.forEach((i) => { const u = P.urls[i.dataset.sp]; if (u) { i.src = u; i.onclick = () => window.open(u, "_blank"); } });
  }

  // ---------- تحميل البيانات ----------
  async function load() {
    const q = await Promise.all([
      C.sb.from("order_items").select("*").order("sort"),
      C.sb.from("production_logs").select("*").order("created_at", { ascending: false }).limit(600),
      C.sb.from("quality_checks").select("*").order("created_at", { ascending: false }).limit(400),
      C.sb.from("suppliers").select("*").order("name"),
      C.sb.from("inventory_items").select("*").order("name"),
      C.sb.from("inventory_movements").select("*").order("created_at", { ascending: false }).limit(600),
      C.sb.from("inventory_reservations").select("*").order("created_at", { ascending: false }),
      C.sb.from("purchase_requests").select("*").order("pr_no", { ascending: false }),
      C.sb.from("measurement_visits").select("*").order("scheduled_at", { ascending: true }),
      C.sb.from("installation_jobs").select("*").order("scheduled_date", { ascending: true }),
    ]);
    P.missing = q.some((r) => r.error && /does not exist|schema cache|relation|Could not find/i.test(r.error.message || ""));
    [P.items, P.logs, P.qc, P.suppliers, P.inv, P.moves, P.res, P.prs, P.visits, P.jobs] = q.map((r) => r.data || []);
    const st = await C.sb.rpc("hm_staff_directory");
    P.staff = (st && st.data) || C.S.profiles.map((p) => ({ id: p.id, full_name: p.full_name, email: p.email, roles: C.S.allRoles.filter((r) => r.user_id === p.id).map((r) => r.role) }));
  }

  // =====================================================================
  //  نقاط الربط مع المرحلة الأولى
  // =====================================================================
  function nav(n) {
    if (isP2Only()) n.splice(1);
    const add = [];
    if (R.factory()) add.push(["factory", "المصنع والإنتاج", "factory"]);
    if (R.qc()) add.push(["quality", "فحص الجودة", "qc"]);
    if (R.invView()) add.push(["inventory", "المستودع والمخزون", "box"]);
    if (R.prView()) add.push(["purchases", "طلبات الشراء", "cart"]);
    if (R.supView()) add.push(["suppliers", "الموردون", "supplier"]);
    if (R.visView()) add.push(["measurements", "زيارات القياس", "ruler"]);
    if (R.jobView()) add.push(["installations", "التركيبات", "wrench"]);
    if (!add.length) return;
    const at = n.findIndex((x) => x[0] === "sep");
    const block = [["sep"]].concat(add);
    if (at === -1) n.push(...block); else n.splice(at, 0, ...block);
  }

  function myVisits() { return P.visits.filter((v) => R.visOffice() || v.technician_id === C.S.user.id || !v.technician_id); }
  function myJobs() { return P.jobs.filter((j) => R.jobNew() || j.team_lead_id === C.S.user.id || (j.member_ids || []).includes(C.S.user.id)); }
  const openPR = (p) => !["received", "cancelled"].includes(p.status);
  const lateItem = (i) => i.due_date && i.due_date < today() && !["ready", "installed"].includes(i.stage);
  const needJob = () => C.S.orders.filter((o) => o.status === "ready_install" && !P.jobs.some((j) => j.order_id === o.id && j.status !== "cancelled"));
  const unscheduledMeas = () => C.S.documents.filter((x) => x.kind === "measurement" && x.status !== "done" && !P.visits.some((v) => v.document_id === x.id));

  function alerts(a) {
    if (P.missing) return;
    const t = today();
    if (R.invView()) { const n = P.inv.filter(isLow).length; if (n) a.push(["a-red", "box", "أصناف وصلت للحد الأدنى بالمخزون", n, "inventory"]); }
    if (R.prApprove()) { const n = P.prs.filter((p) => p.status === "requested").length; if (n) a.push(["a-orange", "cart", "طلبات شراء بانتظار الاعتماد", n, "purchases"]); }
    if (has("purchasing")) { const n = P.prs.filter((p) => p.status === "approved").length; if (n) a.push(["a-blue", "truck", "طلبات شراء معتمدة لإرسالها للمورد", n, "purchases"]); }
    if (R.prReceive()) { const n = P.prs.filter((p) => ["ordered", "partial"].includes(p.status) && p.expected_date && p.expected_date <= t).length; if (n) a.push(["a-orange", "truck", "توريدات مستحقة الاستلام", n, "purchases"]); }
    if (R.qc()) { const n = P.items.filter((i) => i.stage === "quality").length; if (n) a.push(["a-blue", "qc", "منتجات بانتظار فحص الجودة", n, "quality"]); }
    if (R.fmgr()) { const n = P.items.filter(lateItem).length; if (n) a.push(["a-red", "factory", "منتجات متأخرة عن موعد التسليم", n, "factory"]); }
    const stg = has("cutting_supervisor") ? ["queued", "cutting"] : has("assembly_supervisor") ? ["assembly"] : has("polishing_supervisor") ? ["polishing"] : null;
    if (stg && !R.fmgr()) { const n = P.items.filter((i) => stg.includes(i.stage)).length; if (n) a.push(["a-blue", "factory", "منتجات في مرحلتك", n, "factory"]); }
    if (R.visView()) { const n = myVisits().filter((v) => v.scheduled_at && v.scheduled_at.slice(0, 10) === t && !["done", "cancelled"].includes(v.status)).length; if (n) a.push(["a-orange", "ruler", "زيارات قياس اليوم", n, "measurements"]); }
    if (R.visOffice()) { const n = unscheduledMeas().length; if (n) a.push(["a-orange", "calendar", "طلبات قياس بانتظار جدولة زيارة", n, "measurements"]); }
    if (R.jobView()) { const n = myJobs().filter((j) => j.scheduled_date === t && !["completed", "cancelled"].includes(j.status)).length; if (n) a.push(["a-orange", "wrench", "تركيبات اليوم", n, "installations"]); }
    if (R.jobNew()) { const n = needJob().length; if (n) a.push(["a-blue", "wrench", "طلبات جاهزة بحاجة لجدولة تركيب", n, "installations"]); }
  }

  function search(q, res) {
    P.suppliers.forEach((s) => { if ((s.name + " " + (s.phone || "")).toLowerCase().includes(q)) res.push([R.supView() ? "#/suppliers" : "#/", s.name, "مورد"]); });
    P.inv.forEach((i) => { if ((i.name + " " + (i.sku || "")).toLowerCase().includes(q)) res.push([`#/inventory-item/${i.id}`, i.name, `صنف · متاح ${num(avail(i.id))} ${i.unit || ""}`]); });
    P.prs.forEach((p) => { if ((p.pr_no + " " + supName(p.supplier_id)).toLowerCase().includes(q)) res.push([`#/purchase/${p.id}`, `طلب شراء #${p.pr_no}`, supName(p.supplier_id)]); });
    P.visits.forEach((v) => { if ((String(v.visit_no) + " " + custName(v.customer_id)).toLowerCase().includes(q)) res.push([`#/visit/${v.id}`, `زيارة قياس #${v.visit_no}`, custName(v.customer_id)]); });
    P.jobs.forEach((j) => { if ((String(j.job_no) + " " + custName(j.customer_id)).toLowerCase().includes(q)) res.push([`#/job/${j.id}`, `تركيب #${j.job_no}`, custName(j.customer_id)]); });
  }

  function stageBars(items) {
    const tot = items.length || 1;
    return STAGES.map((s) => { const n = items.filter((i) => i.stage === s).length; return `<div class="hbar"><span>${STAGE[s][0]}</span><div class="track"><div class="fill" style="width:${Math.round((n / tot) * 100)}%;background:${STAGE[s][2]}"></div></div><b>${n}</b></div>`; }).join("");
  }

  function dashboard() {
    if (P.missing) return `<div class="mt">${missingBanner()}</div>`;
    const active = P.items.filter((i) => !["ready", "installed"].includes(i.stage));
    const qcN = P.items.filter((i) => i.stage === "quality").length;
    const low = P.inv.filter(isLow);
    const open = P.prs.filter(openPR);
    const stockVal = P.inv.reduce((a, i) => a + Number(i.qty_on_hand) * Number(i.unit_cost), 0);
    const up = P.jobs.filter((j) => !["completed", "cancelled"].includes(j.status) && (j.scheduled_date || "") >= today()).slice(0, 6);
    const passN = P.qc.filter((x) => x.result === "pass").length;
    const passRate = P.qc.length ? Math.round((passN / P.qc.length) * 100) : 0;
    return `<h2 class="p2-section-title">${ic("factory", 22)} المصنع والمستودع والتركيبات</h2>
    <div class="grid g4">
      ${kpi("منتجات قيد التصنيع", active.length, "منتج", "factory", `<span style="color:var(--red)">${P.items.filter(lateItem).length}</span> متأخر عن الموعد`)}
      ${kpi("بانتظار فحص الجودة", qcN, "منتج", "qc", `<span class="up">${passRate}%</span> نسبة القبول في الفحوصات`)}
      ${kpi("قيمة المخزون", money(stockVal), "ريال سعودي", "box", `<span style="color:var(--red)">${low.length}</span> صنف عند الحد الأدنى`)}
      ${kpi("مشتريات مفتوحة", money(open.reduce((a, p) => a + Number(p.total_cost), 0)), "ريال سعودي", "cart", `${open.length} طلب شراء · ${P.prs.filter((p) => p.status === "requested").length} بانتظار الاعتماد`)}
    </div>
    <div class="grid g3 mt">
      <div class="card"><div class="card-head"><h3>مراحل التصنيع</h3><a href="#/factory">المصنع</a></div>${stageBars(P.items)}</div>
      <div class="card"><div class="card-head"><h3>أصناف تحتاج طلب شراء</h3><a href="#/inventory">المستودع</a></div>${low.length ? `<div class="tbl-wrap"><table><thead><tr><th>الصنف</th><th>المتاح</th><th>الحد الأدنى</th></tr></thead><tbody>${low.slice(0, 6).map((i) => `<tr class="click" data-href="#/inventory-item/${i.id}"><td>${esc(i.name)}</td><td style="color:var(--red);font-weight:700">${num(avail(i.id))}</td><td>${num(i.min_qty)}</td></tr>`).join("")}</tbody></table></div>` : '<div class="empty">المخزون في الحدود الآمنة 👌</div>'}</div>
      <div class="card"><div class="card-head"><h3>التركيبات القادمة</h3><a href="#/installations">عرض الكل</a></div>${up.length ? `<div class="tbl-wrap"><table><thead><tr><th>التاريخ</th><th>العميل</th><th>الحالة</th></tr></thead><tbody>${up.map((j) => `<tr class="click" data-href="#/job/${j.id}"><td>${d(j.scheduled_date)}</td><td>${esc(custName(j.customer_id))}</td><td>${bdg(J_ST, j.status)}</td></tr>`).join("")}</tbody></table></div>` : '<div class="empty">لا توجد تركيبات مجدولة</div>'}</div>
    </div>`;
  }

  function home() {
    if (!isP2Only()) return "";
    const tiles = [];
    if (R.factory()) tiles.push(["go:factory", "المصنع والإنتاج", "factory"]);
    if (R.qc()) tiles.push(["go:quality", "فحص الجودة", "qc"]);
    if (R.invView()) tiles.push(["go:inventory", "المستودع", "box"]);
    if (R.invMove()) tiles.push(["p2-move-new", "حركة مخزون", "stack"]);
    if (R.prNew()) tiles.push(["p2-pr-new", "طلب شراء", "cart"]);
    if (R.prView()) tiles.push(["go:purchases", "طلبات الشراء", "truck"]);
    if (R.supView()) tiles.push(["go:suppliers", "الموردون", "supplier"]);
    if (R.visView()) tiles.push(["go:measurements", "زياراتي للقياس", "ruler"]);
    if (R.jobView()) tiles.push(["go:installations", "مهام التركيب", "wrench"]);
    const al = []; alerts(al);
    const vis = R.visView() ? myVisits().filter((v) => !["done", "cancelled"].includes(v.status)).slice(0, 6) : [];
    const jobs = R.jobView() ? myJobs().filter((j) => !["completed", "cancelled"].includes(j.status)).slice(0, 6) : [];
    const stg = has("cutting_supervisor") ? ["queued", "cutting"] : has("assembly_supervisor") ? ["assembly"] : has("polishing_supervisor") ? ["polishing"] : has("quality_inspector") ? ["quality"] : null;
    const mine = stg ? P.items.filter((i) => stg.includes(i.stage)) : [];
    return `<div class="page-head"><div><h1>الرئيسية</h1><div class="sub">مرحباً ${esc((C.S.profile && C.S.profile.full_name) || "")} — ${C.S.roles.map((r) => C.ROLE_LABEL[r] || r).join("، ")}</div></div></div>
      ${missingBanner()}
      <div class="tiles">${tiles.map((x) => `<div class="tile" data-act="${x[0]}">${ic(x[2], 36)}${x[1]}</div>`).join("")}</div>
      <div class="grid g2 mt">
        <div class="card"><div class="card-head"><h3>${ic("bell")} مهامي</h3></div>${al.length ? `<div class="alerts">${al.map((a) => `<div class="alert ${a[0]}" data-go="${a[4]}">${ic(a[1], 18)}${a[2]}<span class="n">${a[3]}</span></div>`).join("")}</div>` : '<div class="empty">لا توجد مهام معلّقة 👌</div>'}</div>
        ${stg ? `<div class="card"><div class="card-head"><h3>${ic("factory")} منتجات في مرحلتي</h3><a href="#/${stg[0] === "quality" ? "quality" : "factory"}">عرض</a></div>${itemsMini(mine)}</div>` : ""}
        ${R.visView() ? `<div class="card"><div class="card-head"><h3>${ic("ruler")} زيارات القياس</h3><a href="#/measurements">عرض الكل</a></div>${visitsTable(vis, true)}</div>` : ""}
        ${R.jobView() ? `<div class="card"><div class="card-head"><h3>${ic("wrench")} مهام التركيب</h3><a href="#/installations">عرض الكل</a></div>${jobsTable(jobs, true)}</div>` : ""}
      </div>`;
  }

  function itemsMini(list) {
    if (!list.length) return '<div class="empty">لا توجد منتجات</div>';
    return `<div class="tbl-wrap"><table><thead><tr><th>المنتج</th><th>الطلب</th><th>المرحلة</th><th>الحالة</th></tr></thead><tbody>${list.slice(0, 8).map((i) => `<tr class="click" data-href="#/factory-order/${i.order_id}"><td><b>${esc(i.name)}</b> × ${num(i.qty)}</td><td>${esc(orderLabel(i.order_id))}</td><td>${bdg(STAGE, i.stage)}</td><td>${bdg(SSTATE, i.stage_state)}</td></tr>`).join("")}</tbody></table></div>`;
  }

  function customerSection(c) {
    if (P.missing) return "";
    const vis = P.visits.filter((v) => v.customer_id === c.id);
    const jobs = P.jobs.filter((j) => j.customer_id === c.id);
    const prs = P.prs.filter((p) => p.customer_id === c.id);
    const items = P.items.filter((i) => C.S.orders.some((o) => o.id === i.order_id && o.customer_id === c.id));
    if (!vis.length && !jobs.length && !prs.length && !items.length && !R.visNew()) return "";
    return `<div class="card mt"><div class="card-head"><h3>${ic("factory")} التشغيل: المصنع والقياسات والتركيبات</h3>${R.visNew() ? `<button class="btn btn-ghost btn-sm" data-act="p2-visit-new" data-cust="${c.id}">+ زيارة قياس</button>` : ""}</div>
      <div class="grid g2">
        <div><h4 class="p2-h4">حالة المنتجات في المصنع</h4>${itemsMini(items)}</div>
        <div><h4 class="p2-h4">زيارات القياس</h4>${visitsTable(vis, true)}</div>
        <div><h4 class="p2-h4">التركيبات والتسليم</h4>${jobsTable(jobs, true)}</div>
        ${R.prView() ? `<div><h4 class="p2-h4">مشتريات مرتبطة بالعميل</h4>${prTable(prs, true)}</div>` : ""}
      </div></div>`;
  }

  function orderSection(o) {
    if (P.missing) return `<div class="mt">${missingBanner()}</div>`;
    const items = P.items.filter((i) => i.order_id === o.id);
    const ready = items.filter((i) => ["ready", "installed"].includes(i.stage)).length;
    const pct = items.length ? Math.round((ready / items.length) * 100) : 0;
    const res = P.res.filter((r) => r.order_id === o.id);
    const prs = P.prs.filter((p) => p.order_id === o.id);
    const vis = P.visits.filter((v) => v.order_id === o.id);
    const jobs = P.jobs.filter((j) => j.order_id === o.id);
    const canImport = !items.length && (C.canSell() || R.fmgr());
    return `<div class="card mt"><div class="card-head"><h3>${ic("factory")} المصنع — حالة كل منتج داخل الفاتورة</h3><div class="filters">
        ${canImport ? `<button class="btn btn-ghost btn-sm" data-act="p2-import" data-order="${o.id}">${ic("orders", 16)} استيراد البنود من الفاتورة/العقد</button>` : ""}
        ${R.factory() ? `<a class="btn btn-line btn-sm" href="#/factory-order/${o.id}">${ic("factory", 16)} شاشة المصنع للطلب</a>` : ""}</div></div>
        ${items.length ? `<div style="font-size:13px;margin-bottom:10px">الجاهز والمعتمد من الجودة: <b>${ready}</b> من <b>${items.length}</b> (${pct}%)<div class="progress"><div style="width:${pct}%"></div></div></div>${itemsTable(items, false)}` : `<div class="empty">لم تُسجّل بنود تصنيع بعد${o.sent_to_factory_at ? "" : " — تُنشأ تلقائياً عند إرسال الطلب للمصنع"}</div>`}
      </div>
      <div class="grid g2 mt">
        <div class="card"><div class="card-head"><h3>${ic("box")} المواد المحجوزة</h3>${R.resNew() ? `<button class="btn btn-ghost btn-sm" data-act="p2-res-new" data-order="${o.id}">+ حجز مادة</button>` : ""}</div>${resTable(res, false)}</div>
        <div class="card"><div class="card-head"><h3>${ic("cart")} طلبات الشراء المرتبطة</h3>${R.prNew() ? `<button class="btn btn-ghost btn-sm" data-act="p2-pr-new" data-order="${o.id}">+ طلب شراء</button>` : ""}</div>${prTable(prs, false)}</div>
        <div class="card"><div class="card-head"><h3>${ic("ruler")} زيارات القياس</h3>${R.visNew() ? `<button class="btn btn-ghost btn-sm" data-act="p2-visit-new" data-cust="${o.customer_id}" data-order="${o.id}">+ زيارة</button>` : ""}</div>${visitsTable(vis, false)}</div>
        <div class="card"><div class="card-head"><h3>${ic("wrench")} التركيب والتسليم</h3>${R.jobNew() ? `<button class="btn btn-ghost btn-sm" data-act="p2-job-new" data-order="${o.id}">+ جدولة تركيب</button>` : ""}</div>${jobsTable(jobs, false)}</div>
      </div>`;
  }

  function docSection(x) {
    if (P.missing || x.kind !== "measurement") return "";
    const vis = P.visits.filter((v) => v.document_id === x.id);
    return `<div class="card mt"><div class="card-head"><h3>${ic("ruler")} زيارات القياس الميدانية لهذا الطلب</h3>${R.visNew() ? `<button class="btn btn-primary btn-sm" data-act="p2-visit-new" data-doc="${x.id}" data-cust="${x.customer_id}" data-order="${x.order_id || ""}">+ جدولة زيارة / إسناد فني</button>` : ""}</div>${visitsTable(vis, false)}</div>`;
  }

  // ---------- جداول مشتركة ----------
  function itemsTable(list, actions) {
    if (!list.length) return '<div class="empty">لا توجد منتجات</div>';
    return `<div class="tbl-wrap"><table><thead><tr><th>#</th><th>المنتج</th><th>الكمية</th><th>الخامة / المقاس</th><th>المرحلة</th><th>الحالة</th><th>المسؤول</th><th>موعد التسليم</th>${actions ? "<th></th>" : ""}</tr></thead><tbody>${list.map((i, n) => `<tr><td>${n + 1}</td><td><b>${esc(i.name)}</b>${i.rework_count ? ` <span class="badge b-red" title="مرات الإرجاع من الجودة">إعادة ×${i.rework_count}</span>` : ""}</td><td>${num(i.qty)} ${esc(i.unit || "")}</td><td>${esc([i.material, i.dimensions].filter(Boolean).join(" · ") || "—")}</td><td>${bdg(STAGE, i.stage)}</td><td>${["ready", "installed"].includes(i.stage) ? "—" : bdg(SSTATE, i.stage_state)}</td><td>${esc(staffName(i.assigned_to))}</td><td ${lateItem(i) ? 'style="color:var(--red);font-weight:700"' : ""}>${d(i.due_date)}</td>${actions ? `<td class="p2-actions">${itemActions(i)}</td>` : ""}</tr>`).join("")}</tbody></table></div>`;
  }

  function itemActions(i) {
    const b = [];
    if (NEXT[i.stage] && canMoveFrom(i.stage)) {
      if (i.stage !== "queued" && i.stage_state !== "in_progress") b.push(`<button class="btn btn-sm btn-ghost" data-act="p2-state" data-id="${i.id}" data-state="in_progress" title="بدء العمل">${ic("play", 14)}</button>`);
      if (i.stage_state === "in_progress") b.push(`<button class="btn btn-sm btn-line" data-act="p2-state" data-id="${i.id}" data-state="paused" title="إيقاف مؤقت">${ic("pause", 14)}</button>`);
      b.push(`<button class="btn btn-sm btn-success" data-act="p2-next" data-id="${i.id}" title="نقل للمرحلة التالية">${STAGE[NEXT[i.stage]][0]} ${ic("arrowLeft", 14)}</button>`);
    }
    if (i.stage === "quality" && R.qc()) b.push(`<button class="btn btn-sm btn-primary" data-act="p2-qc" data-id="${i.id}">${ic("qc", 14)} فحص</button>`);
    if (R.fmgr()) {
      b.push(`<button class="btn btn-sm btn-ghost" data-act="p2-item-edit" data-id="${i.id}" title="تعديل">${ic("edit", 14)}</button>`);
      if (i.stage !== "queued") b.push(`<button class="btn btn-sm btn-line" data-act="p2-item-back" data-id="${i.id}" title="إرجاع لمرحلة سابقة">${ic("undo", 14)}</button>`);
    }
    b.push(`<button class="btn btn-sm btn-line" data-act="p2-item-log" data-id="${i.id}" title="سجل الإنتاج">${ic("log", 14)}</button>`);
    return b.join("");
  }

  function resTable(list, showOrder) {
    if (!list.length) return '<div class="empty">لا توجد مواد محجوزة</div>';
    return `<div class="tbl-wrap"><table><thead><tr><th>الصنف</th>${showOrder ? "<th>الطلب</th>" : ""}<th>الكمية</th><th>الحالة</th><th>التاريخ</th><th></th></tr></thead><tbody>${list.map((r) => { const it = invItem(r.item_id); return `<tr><td><a href="#/inventory-item/${it.id}">${esc(it.name || "—")}</a></td>${showOrder ? `<td><a href="#/order/${r.order_id}">${esc(orderLabel(r.order_id))}</a></td>` : ""}<td>${num(r.qty)} ${esc(it.unit || "")}</td><td>${bdg({ active: ["محجوز", "b-yellow"], consumed: ["تم الصرف", "b-green"], released: ["ملغي", "b-gray"] }, r.status)}</td><td>${d(r.created_at)}</td><td class="p2-actions">${r.status === "active" && R.invMove() ? `<button class="btn btn-sm btn-success" data-act="p2-res-consume" data-id="${r.id}">صرف</button><button class="btn btn-sm btn-line" data-act="p2-res-release" data-id="${r.id}">إلغاء الحجز</button>` : ""}</td></tr>`; }).join("")}</tbody></table></div>`;
  }

  function prTable(list, compact) {
    if (!list.length) return '<div class="empty">لا توجد طلبات شراء</div>';
    return `<div class="tbl-wrap"><table><thead><tr><th>الرقم</th><th>المورد</th>${compact ? "" : "<th>الطلب / العميل</th><th>الأولوية</th>"}<th>التكلفة</th><th>الحالة</th><th>التوريد المتوقع</th></tr></thead><tbody>${list.map((p) => `<tr class="click" data-href="#/purchase/${p.id}"><td>${p.pr_no}</td><td>${esc(supName(p.supplier_id))}</td>${compact ? "" : `<td>${p.order_id ? esc(orderLabel(p.order_id)) : p.customer_id ? esc(custName(p.customer_id)) : "مخزون عام"}</td><td>${p.priority === "urgent" ? '<span class="badge b-red">عاجل</span>' : '<span class="badge b-gray">عادي</span>'}</td>`}<td>${money(p.total_cost)}</td><td>${bdg(PR_ST, p.status)}</td><td>${d(p.expected_date)}</td></tr>`).join("")}</tbody></table></div>`;
  }

  function visitsTable(list, compact) {
    if (!list.length) return '<div class="empty">لا توجد زيارات</div>';
    return `<div class="tbl-wrap"><table><thead><tr><th>الرقم</th><th>الموعد</th>${compact ? "" : "<th>العميل</th><th>العنوان</th>"}<th>الفني</th><th>الحالة</th></tr></thead><tbody>${list.map((v) => `<tr class="click" data-href="#/visit/${v.id}"><td>${v.visit_no}</td><td>${dt(v.scheduled_at)}</td>${compact ? "" : `<td>${esc(custName(v.customer_id))}</td><td>${esc(v.address || C.cust(v.customer_id).address || "—")}</td>`}<td>${esc(staffName(v.technician_id))}</td><td>${bdg(V_ST, v.status)}</td></tr>`).join("")}</tbody></table></div>`;
  }

  function jobsTable(list, compact) {
    if (!list.length) return '<div class="empty">لا توجد مهام تركيب</div>';
    return `<div class="tbl-wrap"><table><thead><tr><th>الرقم</th><th>التاريخ</th>${compact ? "" : "<th>العميل</th><th>الطلب</th><th>الفترة</th>"}<th>قائد الفريق</th><th>الحالة</th></tr></thead><tbody>${list.map((j) => `<tr class="click" data-href="#/job/${j.id}"><td>${j.job_no}</td><td>${d(j.scheduled_date)}</td>${compact ? "" : `<td>${esc(custName(j.customer_id))}</td><td>#${order(j.order_id).order_no || "—"}</td><td>${esc(j.time_slot || "—")}</td>`}<td>${esc(staffName(j.team_lead_id))}</td><td>${bdg(J_ST, j.status)}</td></tr>`).join("")}</tbody></table></div>`;
  }

  // =====================================================================
  //  الصفحات: المصنع وفحص الجودة
  // =====================================================================
  function pageFactory() {
    if (!R.factory()) return noAccess();
    const f = P.f.factory || { q: "", order: "" };
    const q = (f.q || "").toLowerCase();
    const items = P.items.filter((i) => {
      const o = order(i.order_id);
      return (!f.order || i.order_id === f.order) && (!q || (i.name + " " + (o.order_no || "") + " " + custName(o.customer_id)).toLowerCase().includes(q));
    });
    const cols = STAGES.filter((s) => s !== "installed");
    const factOrders = C.S.orders.filter((o) => P.items.some((i) => i.order_id === o.id) || o.status === "manufacturing");
    const noItems = C.S.orders.filter((o) => o.status === "manufacturing" && !P.items.some((i) => i.order_id === o.id));
    return `<div class="page-head"><div><h1>المصنع والإنتاج</h1><div class="sub">واجهة مدير المصنع ومشرفي القص والتجميع والتلميع — حالة كل منتج لحظياً</div></div>
      <div class="filters"><input class="input" id="p2-fq" data-p2f="factory.q" placeholder="بحث بالمنتج أو رقم الطلب أو العميل" value="${esc(f.q || "")}">
      <select class="input" id="p2-fo" data-p2f="factory.order"><option value="">كل الطلبات</option>${factOrders.map((o) => `<option value="${o.id}" ${f.order === o.id ? "selected" : ""}>#${o.order_no} — ${esc(custName(o.customer_id))}</option>`).join("")}</select></div></div>
      ${missingBanner()}
      ${noItems.length && (R.fmgr() || C.canSell()) ? `<div class="p2-info">${ic("alert", 18)} يوجد ${noItems.length} طلب في التصنيع بدون بنود: ${noItems.map((o) => `<button class="btn btn-sm btn-ghost" data-act="p2-import" data-order="${o.id}">استيراد بنود #${o.order_no}</button>`).join(" ")}</div>` : ""}
      <div class="grid g4">${["cutting", "assembly", "polishing", "quality"].map((s) => kpi(STAGE[s][0], items.filter((i) => i.stage === s).length, "منتج", s === "quality" ? "qc" : "factory", `${items.filter((i) => i.stage === s && i.stage_state === "in_progress").length} جاري العمل`)).join("")}</div>
      <div class="p2-board mt">${cols.map((s) => { const list = items.filter((i) => i.stage === s); return `<section class="p2-col"><header style="border-top-color:${STAGE[s][2]}"><b>${STAGE[s][0]}</b><span>${list.length}</span></header><div class="p2-col-body">${list.map((i) => `<article class="p2-card ${lateItem(i) ? "late" : ""}">
        <div class="p2-card-top"><b>${esc(i.name)}</b><span>× ${num(i.qty)}</span></div>
        <a href="#/factory-order/${i.order_id}" class="p2-card-sub">${esc(orderLabel(i.order_id))}</a>
        <div class="p2-card-meta">${["ready", "installed"].includes(i.stage) ? "" : bdg(SSTATE, i.stage_state)}${i.rework_count ? `<span class="badge b-red">إعادة ×${i.rework_count}</span>` : ""}${i.due_date ? `<span class="p2-muted">${ic("calendar", 13)} ${d(i.due_date)}</span>` : ""}</div>
        <div class="p2-actions">${itemActions(i)}</div></article>`).join("") || '<div class="p2-muted" style="text-align:center;padding:14px">—</div>'}</div></section>`; }).join("")}</div>
      <div class="card mt"><div class="card-head"><h3>الطلبات في المصنع</h3></div>${factOrders.length ? `<div class="tbl-wrap"><table><thead><tr><th>رقم الطلب</th><th>العميل</th><th>نوع العمل</th><th>المنتجات</th><th>الجاهز</th><th>التقدم</th><th>الحالة</th></tr></thead><tbody>${factOrders.map((o) => { const it = P.items.filter((i) => i.order_id === o.id); const r = it.filter((i) => ["ready", "installed"].includes(i.stage)).length; const p = it.length ? Math.round((r / it.length) * 100) : 0; return `<tr class="click" data-href="#/factory-order/${o.id}"><td>${o.order_no}</td><td>${esc(custName(o.customer_id))}</td><td>${esc(o.work_type)}</td><td>${it.length}</td><td>${r}</td><td style="min-width:120px"><div class="progress"><div style="width:${p}%"></div></div></td><td>${C.badge(o.status)}</td></tr>`; }).join("")}</tbody></table></div>` : '<div class="empty">لا توجد طلبات في المصنع</div>'}</div>`;
  }

  function pageFactoryOrder(id) {
    if (!R.factory() && !C.canSell()) return noAccess();
    const o = order(id); if (!o.id) return '<div class="empty">الطلب غير موجود</div>';
    const items = P.items.filter((i) => i.order_id === id);
    const r = items.filter((i) => ["ready", "installed"].includes(i.stage)).length;
    const pct = items.length ? Math.round((r / items.length) * 100) : 0;
    const qc = P.qc.filter((x) => x.order_id === id);
    const logs = P.logs.filter((l) => l.order_id === id).slice(0, 40);
    return `<div class="page-head"><div><h1>المصنع — طلب #${o.order_no}</h1><div class="sub"><a href="#/order/${o.id}">${esc(custName(o.customer_id))} · ${esc(o.work_type)}</a> · ${C.badge(o.status)}</div></div>
      <div class="filters">${R.fmgr() ? `<button class="btn btn-primary" data-act="p2-item-new" data-order="${o.id}">${ic("plus", 18)} بند تصنيع</button>` : ""}${!items.length && (R.fmgr() || C.canSell()) ? `<button class="btn btn-ghost" data-act="p2-import" data-order="${o.id}">استيراد من الفاتورة</button>` : ""}<button class="btn btn-line" data-act="p2-print-job-card" data-order="${o.id}">${ic("print", 18)} بطاقة تشغيل</button></div></div>
      <div class="card"><div class="card-head"><h3>حالة كل منتج داخل الفاتورة</h3><span class="badge b-green">${r} / ${items.length} جاهز</span></div>
        <div class="p2-stepper">${STAGES.map((s) => `<div class="p2-step"><i style="background:${STAGE[s][2]}">${items.filter((i) => i.stage === s).length}</i><span>${STAGE[s][0]}</span></div>`).join("")}</div>
        <div style="font-size:13px;margin:10px 0">نسبة الجاهزية ${pct}%<div class="progress"><div style="width:${pct}%"></div></div></div>
        ${itemsTable(items, true)}${o.description ? `<p class="p2-muted mt" style="white-space:pre-wrap">${esc(o.description)}</p>` : ""}</div>
      <div class="grid g2 mt">
        <div class="card"><div class="card-head"><h3>${ic("qc")} نتائج فحص الجودة</h3></div>${qcTable(qc)}</div>
        <div class="card"><div class="card-head"><h3>${ic("log")} سجل الإنتاج</h3></div>${logsList(logs)}</div>
      </div>
      <div class="card mt"><div class="card-head"><h3>${ic("box")} المواد المحجوزة للطلب</h3>${R.resNew() ? `<button class="btn btn-ghost btn-sm" data-act="p2-res-new" data-order="${o.id}">+ حجز مادة</button>` : ""}</div>${resTable(P.res.filter((x) => x.order_id === id), false)}</div>`;
  }

  function logsList(logs) {
    if (!logs.length) return '<div class="empty">لا توجد حركات</div>';
    return `<ul class="p2-timeline">${logs.map((l) => { const it = P.items.find((i) => i.id === l.item_id) || {}; return `<li><b>${esc(it.name || "منتج")}</b> ${l.from_stage && l.from_stage !== l.to_stage ? `${STAGE[l.from_stage] ? STAGE[l.from_stage][0] : l.from_stage} ← ` : ""}${STAGE[l.to_stage] ? STAGE[l.to_stage][0] : l.to_stage || ""}${l.to_state && l.to_state !== l.from_state && !["ready", "installed"].includes(l.to_stage) ? ` · ${(SSTATE[l.to_state] || [l.to_state])[0]}` : ""}${l.note ? `<div class="p2-muted">${esc(l.note)}</div>` : ""}<small>${dt(l.created_at)} · ${esc(staffName(l.user_id))}</small></li>`; }).join("")}</ul>`;
  }

  function qcTable(list) {
    if (!list.length) return '<div class="empty">لا توجد فحوصات</div>';
    return `<div class="tbl-wrap"><table><thead><tr><th>التاريخ</th><th>المنتج</th><th>الطلب</th><th>النتيجة</th><th>البنود المحققة</th><th>الملاحظات</th><th>المراقب</th><th>الصور</th></tr></thead><tbody>${list.map((x) => { const it = P.items.find((i) => i.id === x.item_id) || {}; const ck = x.checklist || {}; const okN = QC_LIST.filter((c) => ck[c[0]]).length; return `<tr><td>${dt(x.created_at)}</td><td>${esc(it.name || "—")}</td><td><a href="#/factory-order/${x.order_id}">#${order(x.order_id).order_no || "—"}</a></td><td>${x.result === "pass" ? '<span class="badge b-green">مقبول</span>' : `<span class="badge b-red">مرفوض ← ${STAGE[x.rework_stage] ? STAGE[x.rework_stage][0] : ""}</span>`}</td><td>${okN}/${QC_LIST.length}</td><td style="white-space:normal;min-width:160px">${esc(x.notes || "—")}</td><td>${esc(staffName(x.inspector_id))}</td><td>${(x.photos || []).length ? `<button class="btn btn-sm btn-line" data-act="p2-qc-photos" data-id="${x.id}">${ic("camera", 14)} ${(x.photos || []).length}</button>` : "—"}</td></tr>`; }).join("")}</tbody></table></div>`;
  }

  function pageQuality() {
    if (!R.qc()) return noAccess();
    const pending = P.items.filter((i) => i.stage === "quality");
    const pass = P.qc.filter((x) => x.result === "pass").length;
    const rate = P.qc.length ? Math.round((pass / P.qc.length) * 100) : 0;
    const month = new Date().toISOString().slice(0, 7);
    return `<div class="page-head"><div><h1>فحص الجودة والمعاينة</h1><div class="sub">لا يُعتمد أي منتج كجاهز إلا بعد اجتياز الفحص — المرفوض يعود لمرحلة الإصلاح تلقائياً</div></div></div>
      ${missingBanner()}
      <div class="grid g4">${kpi("بانتظار الفحص", pending.length, "منتج", "qc")}${kpi("فحوصات هذا الشهر", P.qc.filter((x) => (x.created_at || "").slice(0, 7) === month).length, "فحص", "clipboard")}${kpi("نسبة القبول", rate + "%", "من إجمالي الفحوصات", "check")}${kpi("مرفوض / إعادة عمل", P.qc.length - pass, "فحص", "undo")}</div>
      <div class="card mt"><div class="card-head"><h3>منتجات بانتظار الفحص</h3></div>${pending.length ? `<div class="tbl-wrap"><table><thead><tr><th>المنتج</th><th>الطلب</th><th>الخامة / المقاس</th><th>مرات الإعادة</th><th>وصل للفحص</th><th></th></tr></thead><tbody>${pending.map((i) => `<tr><td><b>${esc(i.name)}</b> × ${num(i.qty)}</td><td><a href="#/factory-order/${i.order_id}">${esc(orderLabel(i.order_id))}</a></td><td>${esc([i.material, i.dimensions].filter(Boolean).join(" · ") || "—")}</td><td>${i.rework_count || 0}</td><td>${dt(i.stage_changed_at)}</td><td><button class="btn btn-sm btn-primary" data-act="p2-qc" data-id="${i.id}">${ic("qc", 14)} فحص ومعاينة</button></td></tr>`).join("")}</tbody></table></div>` : '<div class="empty">لا توجد منتجات بانتظار الفحص 👌</div>'}</div>
      <div class="card mt"><div class="card-head"><h3>سجل الفحوصات</h3></div>${qcTable(P.qc.slice(0, 100))}</div>`;
  }

  function qcForm(itemId) {
    const it = P.items.find((i) => i.id === itemId); if (!it) return;
    modalForm(`فحص جودة — ${esc(it.name)}`, `
      <p class="p2-muted" style="margin-bottom:10px">${esc(orderLabel(it.order_id))} · ${esc([it.material, it.dimensions].filter(Boolean).join(" · "))}</p>
      <label class="p2-lbl">بنود المعاينة</label><div class="p2-checks">${QC_LIST.map((c) => `<label class="check"><input type="checkbox" name="ck_${c[0]}"> ${c[1]}</label>`).join("")}</div>
      <div class="grid2 mt">${field("النتيجة *", `<select class="input" name="result" required><option value="pass">مقبول — اعتماد الجاهزية</option><option value="fail">مرفوض — إعادة للإصلاح</option></select>`)}
      ${field("مرحلة الإصلاح (عند الرفض)", `<select class="input" name="rework_stage"><option value="polishing">التلميع</option><option value="assembly">التجميع</option><option value="cutting">القص</option></select>`)}</div>
      ${field("الملاحظات", area("notes", ""))}
      ${field("صور المعاينة", `<input type="file" class="input" name="files" accept="image/*" multiple>`)}`, "حفظ نتيجة الفحص", async (v, f) => {
      const checklist = {}; QC_LIST.forEach((c) => (checklist[c[0]] = !!f.querySelector(`[name=ck_${c[0]}]`).checked));
      if (v.result === "pass" && QC_LIST.some((c) => !checklist[c[0]])) return C.toast("لاعتماد الجاهزية يجب تحقق جميع بنود المعاينة", "err");
      if (v.result === "fail" && !String(v.notes || "").trim()) return C.toast("اكتب سبب الرفض في الملاحظات", "err");
      const ph = await upload(f.querySelector("[name=files]").files, `qc/${it.order_id}`);
      const r = await run(C.sb.from("quality_checks").insert({ item_id: it.id, result: v.result, rework_stage: v.result === "fail" ? v.rework_stage : null, checklist, notes: v.notes || null, photos: ph, inspector_id: C.S.user.id }));
      if (r) await done(v.result === "pass" ? "تم اعتماد جاهزية المنتج ✓" : "تم رفض المنتج وإعادته للإصلاح");
    });
  }

  function itemForm(it, orderId) {
    it = it || { order_id: orderId, qty: 1 };
    modalForm(it.id ? "تعديل بند تصنيع" : "بند تصنيع جديد", `
      ${field("الطلب *", `<select class="input" name="order_id" required>${orderOpts(it.order_id)}</select>`)}
      <div class="grid2">${field("اسم المنتج *", inp("name", it.name, "required"))}${field("الكمية", inp("qty", it.qty, 'type="number" step="0.01" min="0.01"'))}
      ${field("الوحدة", inp("unit", it.unit, 'placeholder="قطعة / م2 / م.ط"'))}${field("الخامة", inp("material", it.material, 'placeholder="رخام كرارا ..."'))}
      ${field("المقاسات", inp("dimensions", it.dimensions, 'placeholder="الطول × العرض × السماكة"'))}${field("موعد التسليم", inp("due_date", it.due_date, 'type="date"'))}
      ${field("المسؤول", `<select class="input" name="assigned_to">${staffOpts(staffWith("factory_manager", "cutting_supervisor", "assembly_supervisor", "polishing_supervisor", "quality_inspector"), it.assigned_to)}</select>`)}</div>
      ${field("ملاحظات التصنيع", area("notes", it.notes))}`, "حفظ", async (v) => {
      const row = { order_id: v.order_id, name: v.name, qty: Number(v.qty || 1), unit: v.unit || null, material: v.material || null, dimensions: v.dimensions || null, due_date: v.due_date || null, assigned_to: v.assigned_to || null, notes: v.notes || null };
      if (!row.order_id) return C.toast("اختر الطلب", "err");
      if (!it.id) row.sort = P.items.filter((i) => i.order_id === row.order_id).length + 1;
      const r = await run(it.id ? C.sb.from("order_items").update(row).eq("id", it.id) : C.sb.from("order_items").insert(row));
      if (r) await done("تم حفظ البند");
    });
    if (it.id && R.fmgr()) {
      const foot = document.querySelector("#modal-root .modal-foot");
      const del = document.createElement("button"); del.className = "btn btn-danger"; del.innerHTML = ic("trash", 16) + " حذف البند";
      del.onclick = async () => { if (!confirm("حذف هذا البند وسجله؟")) return; const r = await run(C.sb.from("order_items").delete().eq("id", it.id)); if (r) await done("تم حذف البند"); };
      foot.appendChild(del);
    }
  }

  async function moveItem(id, stage, state, note) {
    const r = await run(C.sb.rpc("hm_move_item", { _id: id, _stage: stage, _state: state, _note: note || null }));
    if (r) await done(stage ? `تم النقل إلى «${STAGE[stage][0]}»` : "تم تحديث الحالة");
  }

  function backForm(id) {
    const it = P.items.find((i) => i.id === id); if (!it) return;
    const prev = STAGES.slice(0, STAGES.indexOf(it.stage)).filter((s) => s !== "installed");
    modalForm(`إرجاع «${esc(it.name)}» لمرحلة سابقة`, `${field("المرحلة", `<select class="input" name="stage">${prev.map((s) => `<option value="${s}">${STAGE[s][0]}</option>`).join("")}</select>`)}${field("السبب *", area("note", ""))}`, "إرجاع", async (v) => {
      if (!String(v.note || "").trim()) return C.toast("اكتب سبب الإرجاع", "err");
      await moveItem(id, v.stage, "waiting", "إرجاع: " + v.note);
    });
  }

  function itemLog(id) {
    const it = P.items.find((i) => i.id === id); if (!it) return;
    C.modal(`سجل الإنتاج — ${esc(it.name)}`, `${logsList(P.logs.filter((l) => l.item_id === id))}${P.qc.some((x) => x.item_id === id) ? `<h4 class="p2-h4 mt">فحوصات الجودة</h4>${qcTable(P.qc.filter((x) => x.item_id === id))}` : ""}`);
    bindModalActs();
  }

  // =====================================================================
  //  المشتريات والموردون
  // =====================================================================
  function pagePurchases() {
    if (!R.prView()) return noAccess();
    const f = P.f.purchases || { st: "", q: "" };
    const q = (f.q || "").toLowerCase();
    const list = P.prs.filter((p) => (!f.st || p.status === f.st) && (!q || (p.pr_no + " " + supName(p.supplier_id) + " " + (p.order_id ? orderLabel(p.order_id) : "")).toLowerCase().includes(q)));
    const open = P.prs.filter(openPR);
    return `<div class="page-head"><div><h1>طلبات الشراء</h1><div class="sub">الموردون والتكلفة وحالة التوريد والارتباط بفاتورة العميل</div></div>
      <div class="filters"><input class="input" id="p2-pq" data-p2f="purchases.q" placeholder="بحث برقم الطلب أو المورد" value="${esc(f.q || "")}">
      <select class="input" id="p2-pst" data-p2f="purchases.st"><option value="">كل الحالات</option>${opts(PR_ST, f.st)}</select>
      ${R.prNew() ? `<button class="btn btn-primary" data-act="p2-pr-new">${ic("plus", 18)} طلب شراء</button>` : ""}</div></div>
      ${missingBanner()}
      <div class="grid g4">${kpi("بانتظار الاعتماد", P.prs.filter((p) => p.status === "requested").length, "طلب", "clipboard")}${kpi("قيد التوريد", P.prs.filter((p) => ["approved", "ordered", "partial"].includes(p.status)).length, "طلب", "truck")}${kpi("تكلفة المشتريات المفتوحة", money(open.reduce((a, p) => a + Number(p.total_cost), 0)), "ريال سعودي", "coins")}${kpi("مرتبطة بفواتير العملاء", P.prs.filter((p) => p.order_id).length, "طلب", "orders")}</div>
      <div class="card mt">${prTable(list, false)}</div>`;
  }

  function prLines(p) {
    const items = Array.isArray(p.items) ? p.items : [];
    if (!items.length) return '<div class="empty">لا توجد بنود</div>';
    return `<div class="tbl-wrap"><table><thead><tr><th>#</th><th>الصنف</th><th>الكمية</th><th>المستلم</th><th>المتبقي</th><th>تكلفة الوحدة</th><th>الإجمالي</th></tr></thead><tbody>${items.map((i, n) => { const rq = Number(i.received_qty || 0); const rem = Math.max(0, Number(i.qty) - rq); return `<tr><td>${n + 1}</td><td>${i.inventory_item_id ? `<a href="#/inventory-item/${i.inventory_item_id}">${esc(i.name)}</a>` : esc(i.name)}</td><td>${num(i.qty)} ${esc(i.unit || "")}</td><td>${num(rq)}</td><td ${rem ? 'style="color:var(--orange);font-weight:700"' : ""}>${num(rem)}</td><td>${money(i.unit_cost)}</td><td>${money(Number(i.qty) * Number(i.unit_cost))}</td></tr>`; }).join("")}</tbody></table></div>`;
  }

  function pagePurchase(id) {
    const p = P.prs.find((x) => x.id === id); if (!p) return '<div class="empty">طلب الشراء غير موجود</div>';
    if (!R.prView() && p.created_by !== C.S.user.id) return noAccess();
    const s = P.suppliers.find((x) => x.id === p.supplier_id) || {};
    const btn = [];
    if (p.status === "draft" && (R.prEdit() || p.created_by === C.S.user.id)) btn.push(`<button class="btn btn-ghost" data-act="p2-pr-status" data-id="${p.id}" data-status="requested">إرسال للاعتماد</button>`);
    if (p.status === "requested" && R.prApprove()) btn.push(`<button class="btn btn-success" data-act="p2-pr-status" data-id="${p.id}" data-status="approved">${ic("check", 18)} اعتماد</button>`);
    if (p.status === "approved" && R.prEdit()) btn.push(`<button class="btn btn-primary" data-act="p2-pr-status" data-id="${p.id}" data-status="ordered">${ic("truck", 18)} تم الإرسال للمورد</button>`);
    if (["approved", "ordered", "partial"].includes(p.status) && R.prReceive()) btn.push(`<button class="btn btn-success" data-act="p2-pr-receive" data-id="${p.id}">${ic("box", 18)} استلام التوريد</button>`);
    if (["draft", "requested"].includes(p.status) && R.prEdit()) btn.push(`<button class="btn btn-ghost" data-act="p2-pr-edit" data-id="${p.id}">${ic("edit", 18)} تعديل</button>`);
    if (["draft", "requested", "approved"].includes(p.status) && R.prApprove()) btn.push(`<button class="btn btn-line" data-act="p2-pr-status" data-id="${p.id}" data-status="cancelled">إلغاء الطلب</button>`);
    btn.push(`<button class="btn btn-line" data-act="p2-pr-print" data-id="${p.id}">${ic("print", 18)} أمر شراء PDF</button>`);
    if (R.mgr()) btn.push(`<button class="btn btn-danger" data-act="p2-pr-del" data-id="${p.id}">${ic("trash", 18)}</button>`);
    const steps = ["requested", "approved", "ordered", "received"];
    const cur = p.status === "partial" ? 2.5 : steps.indexOf(p.status);
    return `<div class="page-head"><div><h1>طلب شراء #${p.pr_no}</h1><div class="sub">${esc(s.name || "بدون مورد")} · ${bdg(PR_ST, p.status)} ${p.priority === "urgent" ? '<span class="badge b-red">عاجل</span>' : ""}</div></div><div class="filters">${btn.join("")}</div></div>
      ${p.status !== "cancelled" ? `<div class="p2-stepper card">${steps.map((x, n) => `<div class="p2-step ${n <= cur ? "on" : ""}"><i>${n + 1}</i><span>${PR_ST[x][0]}</span></div>`).join("")}</div>` : ""}
      <div class="grid g-wide mt">
        <div class="card"><div class="card-head"><h3>البنود</h3><b>${money(p.total_cost)} ر.س</b></div>${prLines(p)}${p.notes ? `<p class="mt" style="white-space:pre-wrap">${esc(p.notes)}</p>` : ""}</div>
        <div class="card"><div class="card-head"><h3>التفاصيل</h3></div><dl class="kv">
          <dt>المورد</dt><dd>${esc(s.name || "—")}</dd><dt>جوال المورد</dt><dd dir="ltr" style="text-align:right">${esc(s.phone || "—")}</dd>
          <dt>مرتبط بطلب</dt><dd>${p.order_id ? `<a href="#/order/${p.order_id}">${esc(orderLabel(p.order_id))}</a>` : "مخزون عام"}</dd>
          <dt>العميل</dt><dd>${p.customer_id ? `<a href="#/customer/${p.customer_id}">${esc(custName(p.customer_id))}</a>` : "—"}</dd>
          <dt>التوريد المتوقع</dt><dd>${d(p.expected_date)}</dd><dt>أنشأه</dt><dd>${esc(staffName(p.created_by))} · ${d(p.created_at)}</dd>
          <dt>اعتمده</dt><dd>${p.approved_by ? esc(staffName(p.approved_by)) + " · " + d(p.approved_at) : "—"}</dd>
          <dt>أُرسل للمورد</dt><dd>${d(p.ordered_at)}</dd><dt>تم التوريد</dt><dd>${d(p.received_at)}</dd></dl></div>
      </div>
      <div class="card mt"><div class="card-head"><h3>حركات الاستلام في المستودع</h3></div>${movesTable(P.moves.filter((m) => m.purchase_id === p.id), true)}</div>`;
  }

  function prForm(p, orderId, itemId, supId) {
    const pre = itemId ? invItem(itemId) : null;
    p = p || { order_id: orderId || "", status: "requested", priority: pre ? "urgent" : "normal", supplier_id: supId || (pre ? pre.supplier_id : ""), items: pre ? [{ inventory_item_id: pre.id, name: pre.name, unit: pre.unit, qty: Math.max(1, Number(pre.min_qty || 0) * 2 - avail(pre.id)), unit_cost: Number(pre.unit_cost || 0) }] : [] };
    let items = (Array.isArray(p.items) ? p.items : []).map((i) => Object.assign({}, i));
    if (!items.length) items.push({ inventory_item_id: "", name: "", qty: 1, unit_cost: 0 });
    const invOpts = (sel) => `<option value="">— صنف غير مخزني —</option>` + P.inv.map((i) => `<option value="${i.id}" ${sel === i.id ? "selected" : ""}>${esc(i.name)} (متاح ${num(avail(i.id))})</option>`).join("");
    const ov = modalForm(p.id ? `تعديل طلب شراء #${p.pr_no}` : "طلب شراء جديد", `
      <div class="grid2">${field("المورد", `<select class="input" name="supplier_id"><option value="">— اختر —</option>${P.suppliers.filter((s) => s.is_active !== false || s.id === p.supplier_id).map((s) => `<option value="${s.id}" ${p.supplier_id === s.id ? "selected" : ""}>${esc(s.name)}</option>`).join("")}</select>`)}
      ${field("مرتبط بفاتورة / طلب عميل", `<select class="input" name="order_id">${orderOpts(p.order_id)}</select>`)}
      ${field("الأولوية", `<select class="input" name="priority"><option value="normal">عادي</option><option value="urgent" ${p.priority === "urgent" ? "selected" : ""}>عاجل</option></select>`)}
      ${field("تاريخ التوريد المتوقع", inp("expected_date", p.expected_date, 'type="date"'))}</div>
      <label class="p2-lbl">البنود</label><div class="tbl-wrap items-tbl" style="margin:6px 0 10px"><table><thead><tr><th>صنف المخزون</th><th>الوصف</th><th style="width:85px">الكمية</th><th style="width:110px">تكلفة الوحدة</th><th style="width:40px"></th></tr></thead><tbody id="p2-pr-items"></tbody></table></div>
      <div style="display:flex;justify-content:space-between;align-items:center"><button type="button" class="btn btn-ghost btn-sm" id="p2-pr-add">+ بند</button><b>الإجمالي: <span id="p2-pr-tot">0</span> ر.س</b></div>
      ${p.id ? "" : `<label class="check mt"><input type="checkbox" name="as_draft"> حفظ كمسودة (بدون إرسال للاعتماد)</label>`}
      ${field("ملاحظات", area("notes", p.notes), "mt")}`, "حفظ طلب الشراء", async (v) => {
      const clean = items.filter((i) => String(i.name || "").trim() && Number(i.qty) > 0).map((i) => ({ inventory_item_id: i.inventory_item_id || null, name: i.name, unit: i.unit || (i.inventory_item_id ? invItem(i.inventory_item_id).unit : "") || "", qty: Number(i.qty), unit_cost: Number(i.unit_cost || 0), received_qty: Number(i.received_qty || 0) }));
      if (!clean.length) return C.toast("أضف بنداً واحداً على الأقل", "err");
      const row = { supplier_id: v.supplier_id || null, order_id: v.order_id || null, priority: v.priority, expected_date: v.expected_date || null, items: clean, notes: v.notes || null };
      if (!p.id) row.status = v.as_draft ? "draft" : "requested";
      if (row.order_id) row.customer_id = order(row.order_id).customer_id || null;
      const r = await run(p.id ? C.sb.from("purchase_requests").update(row).eq("id", p.id).select().single() : C.sb.from("purchase_requests").insert(row).select().single());
      if (r) { await done("تم حفظ طلب الشراء"); if (r.data && r.data.id) location.hash = "#/purchase/" + r.data.id; }
    }, true);
    const tb = ov.querySelector("#p2-pr-items");
    const tot = () => (ov.querySelector("#p2-pr-tot").textContent = money(items.reduce((a, i) => a + Number(i.qty || 0) * Number(i.unit_cost || 0), 0)));
    const draw = () => { tb.innerHTML = items.map((i, n) => `<tr><td><select class="input" data-i="${n}" data-k="inventory_item_id">${invOpts(i.inventory_item_id)}</select></td><td><input class="input" data-i="${n}" data-k="name" value="${esc(i.name)}"></td><td><input class="input" type="number" step="0.01" data-i="${n}" data-k="qty" value="${i.qty}"></td><td><input class="input" type="number" step="0.01" data-i="${n}" data-k="unit_cost" value="${i.unit_cost}"></td><td><button type="button" class="btn btn-danger btn-sm" data-rm="${n}">×</button></td></tr>`).join(""); tot(); };
    draw();
    ov.querySelector("#p2-pr-add").onclick = () => { items.push({ inventory_item_id: "", name: "", qty: 1, unit_cost: 0 }); draw(); };
    tb.addEventListener("input", (e) => { const t = e.target; if (t.dataset.i == null || t.dataset.k === "inventory_item_id") return; const it = items[t.dataset.i]; it[t.dataset.k] = ["qty", "unit_cost"].includes(t.dataset.k) ? Number(t.value) : t.value; tot(); });
    tb.addEventListener("change", (e) => { const t = e.target; if (t.dataset.k !== "inventory_item_id") return; const it = items[t.dataset.i]; const inv = invItem(t.value); it.inventory_item_id = t.value; if (inv.id) { it.name = inv.name; it.unit = inv.unit; if (!Number(it.unit_cost)) it.unit_cost = Number(inv.unit_cost || 0); } draw(); });
    tb.addEventListener("click", (e) => { const b = e.target.closest("[data-rm]"); if (b) { items.splice(+b.dataset.rm, 1); if (!items.length) items.push({ inventory_item_id: "", name: "", qty: 1, unit_cost: 0 }); draw(); } });
  }

  function receiveForm(id) {
    const p = P.prs.find((x) => x.id === id); if (!p) return;
    const items = Array.isArray(p.items) ? p.items : [];
    modalForm(`استلام توريد — طلب شراء #${p.pr_no}`, `<p class="p2-muted" style="margin-bottom:10px">الأصناف المرتبطة بالمخزون تُضاف تلقائياً لرصيد المستودع.</p>
      <div class="tbl-wrap"><table><thead><tr><th>الصنف</th><th>المطلوب</th><th>المستلم سابقاً</th><th style="width:120px">المستلم الآن</th></tr></thead><tbody>${items.map((i, n) => { const rem = Math.max(0, Number(i.qty) - Number(i.received_qty || 0)); return `<tr><td>${esc(i.name)}${i.inventory_item_id ? "" : ' <span class="badge b-gray">غير مخزني</span>'}</td><td>${num(i.qty)}</td><td>${num(i.received_qty || 0)}</td><td><input class="input" type="number" step="0.01" min="0" max="${rem}" name="rq_${n}" value="${rem}" ${rem ? "" : "disabled"}></td></tr>`; }).join("")}</tbody></table></div>`, "تأكيد الاستلام", async (v) => {
      const lines = items.map((_, n) => ({ i: n, qty: Number(v["rq_" + n] || 0) })).filter((l) => l.qty > 0);
      if (!lines.length) return C.toast("أدخل الكميات المستلمة", "err");
      const r = await run(C.sb.rpc("hm_receive_purchase", { _id: p.id, _lines: lines }));
      if (r) await done(r.data === "received" ? "تم استلام التوريد كاملاً وتحديث المخزون ✓" : "تم تسجيل استلام جزئي وتحديث المخزون");
    });
  }

  function pageSuppliers() {
    if (!R.supView()) return noAccess();
    const f = P.f.suppliers || { q: "" }; const q = (f.q || "").toLowerCase();
    const list = P.suppliers.filter((s) => !q || (s.name + " " + (s.phone || "") + " " + (s.category || "")).toLowerCase().includes(q));
    return `<div class="page-head"><div><h1>الموردون</h1><div class="sub">${P.suppliers.length} مورد مسجل</div></div>
      <div class="filters"><input class="input" id="p2-sq" data-p2f="suppliers.q" placeholder="بحث بالاسم أو الجوال أو الفئة" value="${esc(f.q || "")}">${R.sup() ? `<button class="btn btn-primary" data-act="p2-sup-new">${ic("plus", 18)} مورد جديد</button>` : ""}</div></div>
      ${missingBanner()}
      <div class="card"><div class="tbl-wrap"><table><thead><tr><th>المورد</th><th>المسؤول</th><th>الجوال</th><th>الفئة</th><th>طلبات الشراء</th><th>إجمالي المشتريات</th><th>مفتوحة</th><th>الحالة</th><th></th></tr></thead><tbody>
      ${list.map((s) => { const ps = P.prs.filter((p) => p.supplier_id === s.id && p.status !== "cancelled"); return `<tr><td><b>${esc(s.name)}</b></td><td>${esc(s.contact_person || "—")}</td><td dir="ltr" style="text-align:right">${esc(s.phone || "—")}</td><td>${esc(s.category || "—")}</td><td>${ps.length}</td><td>${money(ps.reduce((a, p) => a + Number(p.total_cost), 0))}</td><td>${ps.filter(openPR).length}</td><td>${s.is_active === false ? '<span class="badge b-gray">موقوف</span>' : '<span class="badge b-green">نشط</span>'}</td><td class="p2-actions">${R.sup() ? `<button class="btn btn-sm btn-ghost" data-act="p2-sup-edit" data-id="${s.id}">${ic("edit", 14)}</button>` : ""}${R.prNew() ? `<button class="btn btn-sm btn-line" data-act="p2-pr-new" data-sup="${s.id}">+ طلب شراء</button>` : ""}</td></tr>`; }).join("") || emptyRow(9, "لا يوجد موردون")}
      </tbody></table></div></div>`;
  }

  function supplierForm(s) {
    s = s || { is_active: true };
    modalForm(s.id ? "تعديل مورد" : "مورد جديد", `<div class="grid2">${field("اسم المورد *", inp("name", s.name, "required"))}${field("المسؤول", inp("contact_person", s.contact_person))}
      ${field("الجوال", inp("phone", s.phone, 'dir="ltr"'))}${field("البريد", inp("email", s.email, 'type="email" dir="ltr"'))}
      ${field("الفئة", inp("category", s.category, 'list="p2-scat" placeholder="رخام، إكسسوارات، خشب..."') + `<datalist id="p2-scat"><option>رخام وجرانيت</option><option>إكسسوارات ومغاسل</option><option>أخشاب</option><option>مواد لاصقة وكيماويات</option><option>أدوات ومعدات</option></datalist>`)}
      ${field("الحالة", `<select class="input" name="is_active"><option value="1">نشط</option><option value="0" ${s.is_active === false ? "selected" : ""}>موقوف</option></select>`)}</div>
      ${field("العنوان", inp("address", s.address))}${field("ملاحظات", area("notes", s.notes))}`, "حفظ", async (v) => {
      const row = { name: v.name, contact_person: v.contact_person || null, phone: v.phone || null, email: v.email || null, category: v.category || null, address: v.address || null, notes: v.notes || null, is_active: v.is_active === "1" };
      const r = await run(s.id ? C.sb.from("suppliers").update(row).eq("id", s.id) : C.sb.from("suppliers").insert(row));
      if (r) await done("تم حفظ المورد");
    });
  }

  // =====================================================================
  //  المستودع والمخزون
  // =====================================================================
  function movesTable(list, showItem) {
    if (!list.length) return '<div class="empty">لا توجد حركات</div>';
    return `<div class="tbl-wrap"><table><thead><tr><th>التاريخ</th>${showItem ? "<th>الصنف</th>" : ""}<th>النوع</th><th>الكمية</th><th>التكلفة</th><th>الطلب</th><th>البيان</th><th>المستخدم</th></tr></thead><tbody>${list.map((m) => { const it = invItem(m.item_id); const neg = m.kind === "out" || Number(m.qty) < 0; return `<tr><td>${dt(m.created_at)}</td>${showItem ? `<td><a href="#/inventory-item/${it.id}">${esc(it.name || "—")}</a></td>` : ""}<td>${bdg(MV, m.kind)}</td><td style="font-weight:700;color:${neg ? "var(--red)" : "var(--green)"}">${neg ? "−" : "+"}${num(Math.abs(Number(m.qty)))} ${esc(it.unit || "")}</td><td>${m.unit_cost ? money(m.unit_cost) : "—"}</td><td>${m.order_id ? `<a href="#/order/${m.order_id}">#${order(m.order_id).order_no || ""}</a>` : "—"}</td><td style="white-space:normal">${esc(m.note || "—")}</td><td>${esc(staffName(m.created_by))}</td></tr>`; }).join("")}</tbody></table></div>`;
  }

  function pageInventory() {
    if (!R.invView()) return noAccess();
    const f = P.f.inventory || { q: "", cat: "", low: false, tab: "items" };
    const q = (f.q || "").toLowerCase();
    const cats = [...new Set(P.inv.map((i) => i.category).filter(Boolean))];
    const list = P.inv.filter((i) => (!f.cat || i.category === f.cat) && (!f.low || isLow(i)) && (!q || (i.name + " " + (i.sku || "") + " " + (i.location || "")).toLowerCase().includes(q)));
    const val = P.inv.reduce((a, i) => a + Number(i.qty_on_hand) * Number(i.unit_cost), 0);
    const resVal = P.res.filter((r) => r.status === "active").reduce((a, r) => a + Number(r.qty) * Number(invItem(r.item_id).unit_cost || 0), 0);
    const tab = f.tab || "items";
    return `<div class="page-head"><div><h1>المستودع والمخزون</h1><div class="sub">الأصناف والكميات، المواد المحجوزة، والكمية المتاحة فعلياً</div></div>
      <div class="filters">${R.invMove() ? `<button class="btn btn-ghost" data-act="p2-move-new">${ic("stack", 18)} حركة مخزون</button>` : ""}${R.invEdit() ? `<button class="btn btn-primary" data-act="p2-inv-new">${ic("plus", 18)} صنف جديد</button>` : ""}</div></div>
      ${missingBanner()}
      <div class="grid g4">${kpi("عدد الأصناف", P.inv.filter((i) => i.is_active !== false).length, "صنف", "box")}${kpi("قيمة المخزون", money(val), "ريال سعودي", "coins")}${kpi("مواد محجوزة للطلبات", money(resVal), "ريال سعودي", "layers", `${P.res.filter((r) => r.status === "active").length} حجز نشط`)}${kpi("عند الحد الأدنى", P.inv.filter(isLow).length, "صنف", "alert", '<a data-p2low="1">عرضها فقط</a>')}</div>
      <div class="card mt"><div class="tabbar">${[["items", "الأصناف"], ["res", "المواد المحجوزة"], ["moves", "حركات المخزون"]].map((t) => `<button data-p2tab="inventory.${t[0]}" class="${tab === t[0] ? "on" : ""}">${t[1]}</button>`).join("")}</div>
      ${tab === "items" ? `<div class="filters" style="margin-bottom:12px"><input class="input" id="p2-iq" data-p2f="inventory.q" placeholder="بحث بالاسم أو الكود أو الموقع" value="${esc(f.q || "")}"><select class="input" id="p2-icat" data-p2f="inventory.cat"><option value="">كل الفئات</option>${cats.map((c) => `<option ${f.cat === c ? "selected" : ""}>${esc(c)}</option>`).join("")}</select><label class="check"><input type="checkbox" id="p2-ilow" data-p2f="inventory.low" ${f.low ? "checked" : ""}> الأصناف عند الحد الأدنى فقط</label></div>
      <div class="tbl-wrap"><table><thead><tr><th>الكود</th><th>الصنف</th><th>الفئة</th><th>الرصيد</th><th>المحجوز</th><th>المتاح فعلياً</th><th>الحد الأدنى</th><th>تكلفة الوحدة</th><th>القيمة</th><th>الموقع</th><th></th></tr></thead><tbody>
      ${list.map((i) => { const low = isLow(i); return `<tr class="${low ? "p2-low" : ""}"><td>${esc(i.sku || "—")}</td><td><a href="#/inventory-item/${i.id}"><b>${esc(i.name)}</b></a>${i.is_active === false ? ' <span class="badge b-gray">موقوف</span>' : ""}</td><td>${esc(i.category || "—")}</td><td>${num(i.qty_on_hand)} ${esc(i.unit)}</td><td>${num(reserved(i.id))}</td><td style="font-weight:800;color:${low ? "var(--red)" : "var(--green)"}">${num(avail(i.id))}</td><td>${num(i.min_qty)}</td><td>${money(i.unit_cost)}</td><td>${money(Number(i.qty_on_hand) * Number(i.unit_cost))}</td><td>${esc(i.location || "—")}</td>
        <td class="p2-actions">${R.invMove() ? `<button class="btn btn-sm btn-ghost" data-act="p2-move-new" data-item="${i.id}" title="حركة">${ic("stack", 14)}</button>` : ""}${R.resNew() ? `<button class="btn btn-sm btn-line" data-act="p2-res-new" data-item="${i.id}" title="حجز لطلب">حجز</button>` : ""}${R.prNew() ? `<button class="btn btn-sm ${low ? "btn-primary" : "btn-line"}" data-act="p2-pr-new" data-item="${i.id}">${ic("cart", 14)} طلب شراء</button>` : ""}</td></tr>`; }).join("") || emptyRow(11, "لا توجد أصناف")}
      </tbody></table></div>` : tab === "res" ? resTable(P.res.filter((r) => r.status === "active").concat(P.res.filter((r) => r.status !== "active").slice(0, 50)), true) : movesTable(P.moves.slice(0, 200), true)}</div>`;
  }

  function pageInvItem(id) {
    if (!R.invView()) return noAccess();
    const i = invItem(id); if (!i.id) return '<div class="empty">الصنف غير موجود</div>';
    const low = isLow(i);
    const prs = P.prs.filter((p) => (p.items || []).some((x) => x.inventory_item_id === id));
    return `<div class="page-head"><div><h1>${esc(i.name)}</h1><div class="sub">${esc(i.sku || "")} ${esc(i.category ? "· " + i.category : "")} ${low ? '<span class="badge b-red">وصل للحد الأدنى</span>' : '<span class="badge b-green">متوفر</span>'}</div></div>
      <div class="filters">${R.invMove() ? `<button class="btn btn-ghost" data-act="p2-move-new" data-item="${i.id}">${ic("stack", 18)} حركة</button>` : ""}${R.resNew() ? `<button class="btn btn-line" data-act="p2-res-new" data-item="${i.id}">حجز لطلب</button>` : ""}${R.prNew() ? `<button class="btn btn-primary" data-act="p2-pr-new" data-item="${i.id}">${ic("cart", 18)} طلب شراء</button>` : ""}${R.invEdit() ? `<button class="btn btn-ghost" data-act="p2-inv-edit" data-id="${i.id}">${ic("edit", 18)}</button>` : ""}</div></div>
      <div class="grid g4">${kpi("الرصيد الحالي", num(i.qty_on_hand), i.unit, "box")}${kpi("المحجوز", num(reserved(i.id)), i.unit, "layers")}${kpi("المتاح فعلياً", `<span style="color:${low ? "var(--red)" : "var(--green)"}">${num(avail(i.id))}</span>`, i.unit, "check")}${kpi("الحد الأدنى", num(i.min_qty), i.unit, "alert")}</div>
      <div class="grid g-wide mt"><div class="card"><div class="card-head"><h3>المواد المحجوزة</h3></div>${resTable(P.res.filter((r) => r.item_id === id), true)}</div>
        <div class="card"><div class="card-head"><h3>البيانات</h3></div><dl class="kv"><dt>المورد الافتراضي</dt><dd>${esc(supName(i.supplier_id))}</dd><dt>تكلفة الوحدة</dt><dd>${money(i.unit_cost)} ر.س</dd><dt>قيمة الرصيد</dt><dd>${money(Number(i.qty_on_hand) * Number(i.unit_cost))} ر.س</dd><dt>الموقع</dt><dd>${esc(i.location || "—")}</dd><dt>ملاحظات</dt><dd style="white-space:pre-wrap">${esc(i.notes || "—")}</dd></dl></div></div>
      <div class="card mt"><div class="card-head"><h3>طلبات الشراء للصنف</h3></div>${prTable(prs, true)}</div>
      <div class="card mt"><div class="card-head"><h3>حركات الصنف</h3></div>${movesTable(P.moves.filter((m) => m.item_id === id), false)}</div>`;
  }

  function invItemForm(i) {
    i = i || { unit: "قطعة", min_qty: 0, unit_cost: 0, is_active: true };
    modalForm(i.id ? "تعديل صنف" : "صنف جديد في المستودع", `<div class="grid2">${field("اسم الصنف *", inp("name", i.name, "required"))}${field("الكود (SKU)", inp("sku", i.sku, 'dir="ltr"'))}
      ${field("الفئة", inp("category", i.category, 'list="p2-icats"') + `<datalist id="p2-icats"><option>ألواح رخام</option><option>جرانيت</option><option>إكسسوارات</option><option>مغاسل</option><option>مواد لاصقة</option><option>أدوات</option></datalist>`)}
      ${field("الوحدة", inp("unit", i.unit, 'list="p2-units"') + `<datalist id="p2-units"><option>قطعة</option><option>م2</option><option>م.ط</option><option>لوح</option><option>كرتون</option><option>كجم</option><option>لتر</option></datalist>`)}
      ${field("الحد الأدنى للطلب", inp("min_qty", i.min_qty, 'type="number" step="0.01" min="0"'))}${field("تكلفة الوحدة (ر.س)", inp("unit_cost", i.unit_cost, 'type="number" step="0.01" min="0"'))}
      ${field("الموقع في المستودع", inp("location", i.location))}${field("المورد الافتراضي", `<select class="input" name="supplier_id"><option value="">—</option>${P.suppliers.map((s) => `<option value="${s.id}" ${i.supplier_id === s.id ? "selected" : ""}>${esc(s.name)}</option>`).join("")}</select>`)}
      ${!i.id && R.invMove() ? field("الرصيد الافتتاحي", inp("opening", 0, 'type="number" step="0.01" min="0"')) : ""}
      ${i.id ? field("الحالة", `<select class="input" name="is_active"><option value="1">نشط</option><option value="0" ${i.is_active === false ? "selected" : ""}>موقوف</option></select>`) : ""}</div>
      ${field("ملاحظات", area("notes", i.notes))}`, "حفظ", async (v) => {
      const row = { name: v.name, sku: v.sku || null, category: v.category || null, unit: v.unit || "قطعة", min_qty: Number(v.min_qty || 0), unit_cost: Number(v.unit_cost || 0), location: v.location || null, supplier_id: v.supplier_id || null, notes: v.notes || null };
      if (i.id) row.is_active = v.is_active === "1";
      const r = await run(i.id ? C.sb.from("inventory_items").update(row).eq("id", i.id).select().single() : C.sb.from("inventory_items").insert(row).select().single());
      if (!r) return;
      if (!i.id && Number(v.opening) > 0 && r.data) await run(C.sb.from("inventory_movements").insert({ item_id: r.data.id, kind: "in", qty: Number(v.opening), unit_cost: row.unit_cost || null, note: "رصيد افتتاحي" }));
      await done("تم حفظ الصنف");
    });
  }

  function moveForm(itemId) {
    if (!P.inv.length) return C.toast("أضف صنفاً للمستودع أولاً", "err");
    const ov = modalForm("حركة مخزون", `<div class="grid2">${field("الصنف *", `<select class="input" name="item_id" required>${P.inv.map((i) => `<option value="${i.id}" ${itemId === i.id ? "selected" : ""}>${esc(i.name)} — رصيد ${num(i.qty_on_hand)} ${esc(i.unit)}</option>`).join("")}</select>`)}
      ${field("نوع الحركة *", `<select class="input" name="kind"><option value="in">وارد (إضافة للمخزون)</option><option value="out">صرف (خروج من المخزون)</option><option value="adjust">تسوية جرد (الرصيد الفعلي)</option></select>`)}
      ${field('<span id="p2-qlbl">الكمية *</span>', inp("qty", "", 'type="number" step="0.01" min="0" required'))}${field("تكلفة الوحدة (للوارد)", inp("unit_cost", "", 'type="number" step="0.01" min="0"'))}
      ${field("مرتبط بطلب عميل", `<select class="input" name="order_id">${orderOpts("")}</select>`)}</div>${field("البيان", inp("note", ""))}`, "تسجيل الحركة", async (v) => {
      const it = invItem(v.item_id); let qty = Number(v.qty);
      if (v.kind === "adjust") { qty = qty - Number(it.qty_on_hand); if (!qty) return C.toast("الرصيد الفعلي مطابق — لا توجد فروقات", "err"); }
      else if (!(qty > 0)) return C.toast("أدخل كمية صحيحة", "err");
      if (v.kind === "out" && qty > avail(it.id) && !confirm(`الكمية تتجاوز المتاح فعلياً (${num(avail(it.id))}) وستؤثر على مواد محجوزة. متابعة؟`)) return;
      const r = await run(C.sb.from("inventory_movements").insert({ item_id: it.id, kind: v.kind, qty, unit_cost: v.kind === "in" && Number(v.unit_cost) > 0 ? Number(v.unit_cost) : null, order_id: v.order_id || null, note: v.note || (v.kind === "adjust" ? `تسوية جرد: الرصيد الفعلي ${v.qty}` : null) }));
      if (r) await done("تم تسجيل الحركة وتحديث الرصيد");
    });
    const k = ov.querySelector("[name=kind]");
    k.onchange = () => (ov.querySelector("#p2-qlbl").textContent = k.value === "adjust" ? "الرصيد الفعلي بعد الجرد *" : "الكمية *");
  }

  function resForm(orderId, itemId) {
    if (!P.inv.length) return C.toast("لا توجد أصناف في المستودع", "err");
    modalForm("حجز مواد لطلب عميل", `${field("الطلب *", `<select class="input" name="order_id" required>${orderOpts(orderId, (o) => o.status !== "completed" || o.id === orderId)}</select>`)}
      <div class="grid2">${field("الصنف *", `<select class="input" name="item_id" required>${P.inv.filter((i) => i.is_active !== false).map((i) => `<option value="${i.id}" ${itemId === i.id ? "selected" : ""}>${esc(i.name)} — متاح ${num(avail(i.id))} ${esc(i.unit)}</option>`).join("")}</select>`)}${field("الكمية *", inp("qty", "", 'type="number" step="0.01" min="0.01" required'))}</div>${field("ملاحظة", inp("note", ""))}`, "حجز", async (v) => {
      if (!v.order_id) return C.toast("اختر الطلب", "err");
      if (Number(v.qty) > avail(v.item_id)) return C.toast(`الكمية المتاحة فعلياً ${num(avail(v.item_id))} فقط — أنشئ طلب شراء`, "err");
      const r = await run(C.sb.from("inventory_reservations").insert({ order_id: v.order_id, item_id: v.item_id, qty: Number(v.qty), note: v.note || null }));
      if (r) await done("تم حجز المادة للطلب");
    });
  }

  // =====================================================================
  //  واجهة فني القياسات
  // =====================================================================
  function pageVisits() {
    if (!R.visView()) return noAccess();
    const f = P.f.measurements || { st: "open", day: "", tech: "" };
    const t = today();
    const list = myVisits().filter((v) => (f.st === "open" ? !["done", "cancelled"].includes(v.status) : !f.st || v.status === f.st) && (!f.day || (v.scheduled_at || "").slice(0, 10) === f.day) && (!f.tech || v.technician_id === f.tech));
    const pend = R.visOffice() ? unscheduledMeas() : [];
    const mine = myVisits();
    return `<div class="page-head"><div><h1>زيارات القياس</h1><div class="sub">جدول الزيارات، رفع المقاسات والصور والملاحظات</div></div>
      <div class="filters"><select class="input" data-p2f="measurements.st"><option value="open" ${f.st === "open" ? "selected" : ""}>المفتوحة</option><option value="" ${f.st === "" ? "selected" : ""}>كل الحالات</option>${opts(V_ST, f.st)}</select>
      <input type="date" class="input" data-p2f="measurements.day" value="${esc(f.day || "")}">
      ${R.visOffice() ? `<select class="input" data-p2f="measurements.tech"><option value="">كل الفنيين</option>${staffWith("measurement_tech").map((s) => `<option value="${s.id}" ${f.tech === s.id ? "selected" : ""}>${esc(s.full_name || s.email)}</option>`).join("")}</select>` : ""}
      ${R.visNew() ? `<button class="btn btn-primary" data-act="p2-visit-new">${ic("plus", 18)} زيارة قياس</button>` : ""}</div></div>
      ${missingBanner()}
      <div class="grid g4">${kpi("زيارات اليوم", mine.filter((v) => (v.scheduled_at || "").slice(0, 10) === t && v.status !== "cancelled").length, "زيارة", "calendar")}${kpi("مجدولة قادمة", mine.filter((v) => ["scheduled", "on_the_way"].includes(v.status)).length, "زيارة", "ruler")}${kpi("تم القياس هذا الشهر", mine.filter((v) => v.status === "done" && (v.completed_at || "").slice(0, 7) === t.slice(0, 7)).length, "زيارة", "check")}${kpi("بانتظار الجدولة", pend.length, "طلب قياس", "alert")}</div>
      ${pend.length ? `<div class="card mt"><div class="card-head"><h3>${ic("alert")} طلبات قياس (من المبيعات) بانتظار جدولة زيارة</h3></div><div class="tbl-wrap"><table><thead><tr><th>رقم الطلب</th><th>العميل</th><th>الموعد المقترح</th><th>التفاصيل</th><th></th></tr></thead><tbody>${pend.map((x) => `<tr><td><a href="#/doc/${x.id}">${x.doc_no}</a></td><td>${esc(custName(x.customer_id))}</td><td>${d(x.scheduled_date)}</td><td style="white-space:normal">${esc((x.details || x.title || "").slice(0, 80))}</td><td><button class="btn btn-sm btn-primary" data-act="p2-visit-new" data-doc="${x.id}" data-cust="${x.customer_id}" data-order="${x.order_id || ""}">جدولة وإسناد فني</button></td></tr>`).join("")}</tbody></table></div></div>` : ""}
      <div class="card mt">${visitsTable(list, false)}</div>`;
  }

  function measTable(m) {
    const rows = Array.isArray(m) ? m : [];
    if (!rows.length) return '<div class="empty">لم تُرفع مقاسات بعد</div>';
    return `<div class="tbl-wrap"><table><thead><tr><th>#</th><th>الموضع / القطعة</th><th>العرض (سم)</th><th>الطول (سم)</th><th>العمق/السماكة (سم)</th><th>العدد</th><th>ملاحظات</th></tr></thead><tbody>${rows.map((r, n) => `<tr><td>${n + 1}</td><td><b>${esc(r.label)}</b></td><td>${esc(r.width || "—")}</td><td>${esc(r.height || "—")}</td><td>${esc(r.depth || "—")}</td><td>${esc(r.qty || 1)}</td><td style="white-space:normal">${esc(r.notes || "")}</td></tr>`).join("")}</tbody></table></div>`;
  }

  function pageVisit(id) {
    const v = P.visits.find((x) => x.id === id); if (!v) return '<div class="empty">الزيارة غير موجودة</div>';
    if (!R.visView()) return noAccess();
    const c = C.cust(v.customer_id); const ed = canVisit(v);
    const st = (s, label, cls) => (ed && v.status !== s ? `<button class="btn ${cls || "btn-ghost"}" data-act="p2-visit-status" data-id="${v.id}" data-status="${s}">${label}</button>` : "");
    const open = !["done", "cancelled"].includes(v.status);
    return `<div class="page-head"><div><h1>زيارة قياس #${v.visit_no}</h1><div class="sub"><a href="#/customer/${c.id}">${esc(c.name || "")}</a>${v.order_id ? ` · <a href="#/order/${v.order_id}">طلب #${order(v.order_id).order_no || ""}</a>` : ""}${v.document_id ? ` · <a href="#/doc/${v.document_id}">طلب القياس</a>` : ""} · ${bdg(V_ST, v.status)}</div></div>
      <div class="filters">${open ? st("on_the_way", ic("truck", 18) + " في الطريق") + st("in_progress", ic("play", 18) + " بدء القياس") : ""}${ed ? `<button class="btn btn-primary" data-act="p2-visit-meas" data-id="${v.id}">${ic("ruler", 18)} رفع المقاسات</button>` : ""}${open ? st("done", ic("check", 18) + " تم القياس", "btn-success") + st("postponed", "تأجيل", "btn-line") : ""}${R.visOffice() ? `<button class="btn btn-ghost" data-act="p2-visit-edit" data-id="${v.id}">${ic("edit", 18)}</button>` : ""}<button class="btn btn-line" data-act="p2-visit-print" data-id="${v.id}">${ic("print", 18)} تقرير PDF</button>${R.mgr() ? `<button class="btn btn-danger" data-act="p2-visit-del" data-id="${v.id}">${ic("trash", 18)}</button>` : ""}</div></div>
      <div class="grid g-wide">
        <div class="card"><div class="card-head"><h3>${ic("ruler")} المقاسات</h3></div>${measTable(v.measurements)}${v.notes ? `<div class="mt"><b>ملاحظات الفني:</b><p style="white-space:pre-wrap">${esc(v.notes)}</p></div>` : ""}</div>
        <div class="card"><div class="card-head"><h3>بيانات الزيارة</h3></div><dl class="kv"><dt>الموعد</dt><dd>${dt(v.scheduled_at)}</dd><dt>الفني</dt><dd>${esc(staffName(v.technician_id))}</dd><dt>العنوان</dt><dd>${esc(v.address || c.address || "—")}</dd><dt>جوال التواصل</dt><dd dir="ltr" style="text-align:right">${esc(v.contact_phone || c.phone || "—")}</dd><dt>بدأ</dt><dd>${dt(v.started_at)}</dd><dt>انتهى</dt><dd>${dt(v.completed_at)}</dd></dl>
          ${(v.address || c.address) ? `<a class="btn btn-line btn-sm mt" target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(v.address || c.address)}">فتح الموقع على الخريطة</a>` : ""}</div>
      </div>
      <div class="card mt"><div class="card-head"><h3>${ic("camera")} صور الموقع</h3>${ed ? `<button class="btn btn-ghost btn-sm" data-act="p2-photos-add" data-table="measurement_visits" data-id="${v.id}" data-field="photos" data-folder="visits/${v.id}">${ic("upload", 16)} رفع صور</button>` : ""}</div>
        <div data-ph-table="measurement_visits" data-ph-id="${v.id}" data-ph-field="photos">${photos(v.photos, ed ? "p2-del-photo" : null)}</div></div>`;
  }

  function visitForm(v, pre) {
    pre = pre || {};
    const doc = pre.doc ? C.S.documents.find((x) => x.id === pre.doc) : null;
    v = v || { customer_id: pre.cust || (doc && doc.customer_id) || "", order_id: pre.order || (doc && doc.order_id) || "", document_id: pre.doc || "", technician_id: has("measurement_tech") && !R.visOffice() ? C.S.user.id : "", scheduled_at: doc && doc.scheduled_date ? doc.scheduled_date + "T10:00" : "" };
    if (!C.S.customers.length) return C.toast("لا يوجد عملاء", "err");
    const ov = modalForm(v.id ? `تعديل زيارة #${v.visit_no}` : "جدولة زيارة قياس", `
      <div class="grid2">${field("العميل *", `<select class="input" name="customer_id" required>${C.S.customers.map((c) => `<option value="${c.id}" ${v.customer_id === c.id ? "selected" : ""}>${esc(c.name)} — ${esc(c.phone || "")}</option>`).join("")}</select>`)}
      ${field("الطلب المرتبط", `<select class="input" name="order_id"></select>`)}
      ${field("طلب القياس (المبيعات)", `<select class="input" name="document_id"></select>`)}
      ${field("فني القياس", `<select class="input" name="technician_id">${staffOpts(staffWith("measurement_tech"), v.technician_id)}</select>`)}
      ${field("الموعد *", `<input class="input" type="datetime-local" name="scheduled_at" required value="${esc(v.scheduled_at && v.scheduled_at.length > 16 ? toLocalInput(v.scheduled_at) : v.scheduled_at || "")}">`)}
      ${field("جوال التواصل", inp("contact_phone", v.contact_phone, 'dir="ltr"'))}</div>
      ${field("العنوان / الموقع", inp("address", v.address))}${field("ملاحظات للفني", area("notes", v.notes))}`, "حفظ", async (x) => {
      const row = { customer_id: x.customer_id, order_id: x.order_id || null, document_id: x.document_id || null, technician_id: x.technician_id || null, scheduled_at: x.scheduled_at ? new Date(x.scheduled_at).toISOString() : null, contact_phone: x.contact_phone || null, address: x.address || null, notes: x.notes || null };
      const r = await run(v.id ? C.sb.from("measurement_visits").update(row).eq("id", v.id).select().single() : C.sb.from("measurement_visits").insert(row).select().single());
      if (r) { await done("تم حفظ الزيارة"); if (r.data && r.data.id) location.hash = "#/visit/" + r.data.id; }
    });
    const cs = ov.querySelector("[name=customer_id]"), os = ov.querySelector("[name=order_id]"), ds = ov.querySelector("[name=document_id]");
    const fill = () => {
      const cid = cs.value; const c = C.cust(cid);
      os.innerHTML = `<option value="">— بدون —</option>` + C.S.orders.filter((o) => o.customer_id === cid).map((o) => `<option value="${o.id}" ${v.order_id === o.id ? "selected" : ""}>#${o.order_no} — ${esc(o.work_type)}</option>`).join("");
      ds.innerHTML = `<option value="">— بدون —</option>` + C.S.documents.filter((x) => x.kind === "measurement" && x.customer_id === cid).map((x) => `<option value="${x.id}" ${v.document_id === x.id ? "selected" : ""}>#${x.doc_no} — ${esc(x.title)}</option>`).join("");
      const a = ov.querySelector("[name=address]"), p = ov.querySelector("[name=contact_phone]");
      if (!a.value) a.value = c.address || ""; if (!p.value) p.value = c.phone || "";
    };
    fill(); cs.addEventListener("change", () => { v.order_id = ""; v.document_id = ""; ov.querySelector("[name=address]").value = ""; ov.querySelector("[name=contact_phone]").value = ""; fill(); });
  }

  function measForm(id) {
    const v = P.visits.find((x) => x.id === id); if (!v) return;
    let rows = (Array.isArray(v.measurements) ? v.measurements : []).map((r) => Object.assign({}, r));
    if (!rows.length) rows.push({ label: "", width: "", height: "", depth: "", qty: 1, notes: "" });
    const ov = modalForm(`رفع المقاسات — زيارة #${v.visit_no}`, `<div class="tbl-wrap items-tbl"><table><thead><tr><th>الموضع / القطعة</th><th style="width:80px">العرض</th><th style="width:80px">الطول</th><th style="width:80px">العمق</th><th style="width:60px">العدد</th><th>ملاحظات</th><th style="width:40px"></th></tr></thead><tbody id="p2-mrows"></tbody></table></div>
      <button type="button" class="btn btn-ghost btn-sm mt" id="p2-madd">+ مقاس</button>
      ${field("ملاحظات الموقع (الكهرباء، السباكة، الجدران، المداخل...)", area("notes", v.notes), "mt")}
      ${field("صور الموقع", `<input type="file" class="input" name="files" accept="image/*" multiple>`)}
      ${["done", "cancelled"].includes(v.status) ? "" : `<label class="check"><input type="checkbox" name="finish" checked> إنهاء الزيارة (تم القياس) — يُغلق طلب القياس تلقائياً</label>`}`, "حفظ المقاسات", async (x, f) => {
      const clean = rows.filter((r) => String(r.label || "").trim());
      if (!clean.length) return C.toast("أدخل مقاساً واحداً على الأقل", "err");
      const ph = await upload(f.querySelector("[name=files]").files, `visits/${v.id}`);
      const row = { measurements: clean, notes: x.notes || null, photos: (v.photos || []).concat(ph) };
      if (x.finish) row.status = "done";
      const r = await run(C.sb.from("measurement_visits").update(row).eq("id", v.id));
      if (r) await done(x.finish ? "تم حفظ المقاسات وإنهاء الزيارة ✓" : "تم حفظ المقاسات");
    }, true);
    const tb = ov.querySelector("#p2-mrows");
    const draw = () => (tb.innerHTML = rows.map((r, n) => `<tr>${["label", "width", "height", "depth", "qty", "notes"].map((k) => `<td><input class="input" data-i="${n}" data-k="${k}" value="${esc(r[k] == null ? "" : r[k])}" ${["width", "height", "depth", "qty"].includes(k) ? 'type="number" step="0.1" min="0"' : ""}></td>`).join("")}<td><button type="button" class="btn btn-danger btn-sm" data-rm="${n}">×</button></td></tr>`).join(""));
    draw();
    ov.querySelector("#p2-madd").onclick = () => { rows.push({ label: "", width: "", height: "", depth: "", qty: 1, notes: "" }); draw(); };
    tb.addEventListener("input", (e) => { const t = e.target; if (t.dataset.i != null) rows[t.dataset.i][t.dataset.k] = t.value; });
    tb.addEventListener("click", (e) => { const b = e.target.closest("[data-rm]"); if (b) { rows.splice(+b.dataset.rm, 1); if (!rows.length) rows.push({ label: "", qty: 1 }); draw(); } });
  }

  // =====================================================================
  //  واجهة فريق التركيبات
  // =====================================================================
  function pageJobs() {
    if (!R.jobView()) return noAccess();
    const f = P.f.installations || { st: "open", from: "" };
    const t = today();
    const list = myJobs().filter((j) => (f.st === "open" ? !["completed", "cancelled"].includes(j.status) : !f.st || j.status === f.st) && (!f.from || (j.scheduled_date || "") >= f.from));
    const days = []; for (let i = 0; i < 7; i++) { const x = new Date(); x.setDate(x.getDate() + i); days.push(x.toLocaleDateString("en-CA")); }
    const need = R.jobNew() ? needJob() : [];
    return `<div class="page-head"><div><h1>التركيبات</h1><div class="sub">جدولة المواعيد، تحديث حالة التنفيذ، توثيق الصور وتسليم العميل</div></div>
      <div class="filters"><select class="input" data-p2f="installations.st"><option value="open" ${f.st === "open" ? "selected" : ""}>المفتوحة</option><option value="" ${f.st === "" ? "selected" : ""}>كل الحالات</option>${opts(J_ST, f.st)}</select><input type="date" class="input" data-p2f="installations.from" value="${esc(f.from || "")}" title="من تاريخ">
      ${R.jobNew() ? `<button class="btn btn-primary" data-act="p2-job-new">${ic("plus", 18)} جدولة تركيب</button>` : ""}</div></div>
      ${missingBanner()}
      <div class="p2-week">${days.map((dd) => { const js = myJobs().filter((j) => j.scheduled_date === dd && j.status !== "cancelled"); return `<div class="p2-day ${dd === t ? "on" : ""}"><header>${new Date(dd + "T12:00").toLocaleDateString("ar-SA-u-ca-gregory", { weekday: "long" })}<small>${dd.slice(5).replace("-", "/")}</small></header>${js.map((j) => `<a href="#/job/${j.id}" class="p2-chip">${esc(custName(j.customer_id))}${j.time_slot ? ` · ${esc(j.time_slot)}` : ""}<br>${bdg(J_ST, j.status)}</a>`).join("") || '<span class="p2-muted">—</span>'}</div>`; }).join("")}</div>
      ${need.length ? `<div class="card mt"><div class="card-head"><h3>${ic("alert")} طلبات جاهزة للتركيب بدون موعد</h3></div><div class="tbl-wrap"><table><thead><tr><th>رقم الطلب</th><th>العميل</th><th>نوع العمل</th><th></th></tr></thead><tbody>${need.map((o) => `<tr><td><a href="#/order/${o.id}">${o.order_no}</a></td><td>${esc(custName(o.customer_id))}</td><td>${esc(o.work_type)}</td><td><button class="btn btn-sm btn-primary" data-act="p2-job-new" data-order="${o.id}">جدولة تركيب</button></td></tr>`).join("")}</tbody></table></div></div>` : ""}
      <div class="card mt">${jobsTable(list, false)}</div>`;
  }

  function pageJob(id) {
    const j = P.jobs.find((x) => x.id === id); if (!j) return '<div class="empty">مهمة التركيب غير موجودة</div>';
    if (!R.jobView()) return noAccess();
    const o = order(j.order_id); const c = C.cust(j.customer_id || o.customer_id); const ed = canJob(j);
    const items = P.items.filter((i) => i.order_id === j.order_id);
    const notReady = items.filter((i) => !["ready", "installed"].includes(i.stage));
    const open = !["completed", "cancelled"].includes(j.status);
    const st = (s, label, cls, dis) => (ed && open && j.status !== s ? `<button class="btn ${cls || "btn-ghost"}" data-act="p2-job-status" data-id="${j.id}" data-status="${s}" ${dis ? "disabled" : ""}>${label}</button>` : "");
    return `<div class="page-head"><div><h1>تركيب #${j.job_no}</h1><div class="sub"><a href="#/customer/${c.id}">${esc(c.name || "")}</a> · <a href="#/order/${o.id}">طلب #${o.order_no || ""} — ${esc(o.work_type || "")}</a> · ${bdg(J_ST, j.status)}</div></div>
      <div class="filters">${st("on_the_way", ic("truck", 18) + " في الطريق")}${st("in_progress", ic("play", 18) + " بدء التركيب", "btn-ghost", notReady.length)}${ed && open ? `<button class="btn btn-success" data-act="p2-job-handover" data-id="${j.id}" ${notReady.length ? "disabled" : ""}>${ic("handshake", 18)} توثيق التسليم وإغلاق</button>` : ""}${st("postponed", "تأجيل", "btn-line")}${R.jobNew() ? `<button class="btn btn-ghost" data-act="p2-job-edit" data-id="${j.id}">${ic("edit", 18)}</button>` : ""}<button class="btn btn-line" data-act="p2-job-print" data-id="${j.id}">${ic("print", 18)} ${j.status === "completed" ? "محضر التسليم" : "أمر التركيب"} PDF</button>${R.mgr() ? `<button class="btn btn-danger" data-act="p2-job-del" data-id="${j.id}">${ic("trash", 18)}</button>` : ""}</div></div>
      ${notReady.length && open ? `<div class="p2-warn">${ic("alert", 18)} لا يمكن بدء أو إغلاق التركيب: ${notReady.length} منتج لم يُعتمد من فحص الجودة بعد.</div>` : ""}
      <div class="grid g-wide">
        <div class="card"><div class="card-head"><h3>منتجات الطلب وجاهزيتها</h3></div>${itemsTable(items, false)}</div>
        <div class="card"><div class="card-head"><h3>بيانات المهمة</h3></div><dl class="kv"><dt>التاريخ</dt><dd>${d(j.scheduled_date)} ${esc(j.time_slot || "")}</dd><dt>قائد الفريق</dt><dd>${esc(staffName(j.team_lead_id))}</dd><dt>أعضاء الفريق</dt><dd>${(j.member_ids || []).map((m) => esc(staffName(m))).join("، ") || "—"}</dd><dt>العنوان</dt><dd>${esc(j.address || c.address || "—")}</dd><dt>جوال العميل</dt><dd dir="ltr" style="text-align:right">${esc(c.phone || "—")}</dd><dt>بدأ</dt><dd>${dt(j.started_at)}</dd><dt>انتهى</dt><dd>${dt(j.completed_at)}</dd><dt>ملاحظات</dt><dd style="white-space:pre-wrap">${esc(j.notes || "—")}</dd><dt>مشاكل/ملاحظات التنفيذ</dt><dd style="white-space:pre-wrap">${esc(j.issues || "—")}</dd></dl>
          ${ed && open ? `<button class="btn btn-line btn-sm mt" data-act="p2-job-issues" data-id="${j.id}">${ic("edit", 14)} تحديث ملاحظات التنفيذ</button>` : ""}</div>
      </div>
      <div class="grid g2 mt">
        <div class="card"><div class="card-head"><h3>${ic("camera")} صور قبل التركيب</h3>${ed ? `<button class="btn btn-ghost btn-sm" data-act="p2-photos-add" data-table="installation_jobs" data-id="${j.id}" data-field="before_photos" data-folder="jobs/${j.id}">${ic("upload", 16)} رفع</button>` : ""}</div><div data-ph-table="installation_jobs" data-ph-id="${j.id}" data-ph-field="before_photos">${photos(j.before_photos, ed && open ? "p2-del-photo" : null)}</div></div>
        <div class="card"><div class="card-head"><h3>${ic("camera")} صور بعد التركيب</h3>${ed ? `<button class="btn btn-ghost btn-sm" data-act="p2-photos-add" data-table="installation_jobs" data-id="${j.id}" data-field="after_photos" data-folder="jobs/${j.id}">${ic("upload", 16)} رفع</button>` : ""}</div><div data-ph-table="installation_jobs" data-ph-id="${j.id}" data-ph-field="after_photos">${photos(j.after_photos, ed && open ? "p2-del-photo" : null)}</div></div>
      </div>
      ${j.status === "completed" ? `<div class="card mt"><div class="card-head"><h3>${ic("handshake")} محضر تسليم العميل</h3><span class="badge b-green">تم التسليم ${dt(j.handover_at)}</span></div><dl class="kv"><dt>المستلم</dt><dd>${esc(j.handover_name)}</dd><dt>جوال المستلم</dt><dd dir="ltr" style="text-align:right">${esc(j.handover_phone || "—")}</dd><dt>تقييم العميل</dt><dd>${j.customer_rating ? "★".repeat(j.customer_rating) + "☆".repeat(5 - j.customer_rating) : "—"}</dd><dt>ملاحظات التسليم</dt><dd style="white-space:pre-wrap">${esc(j.handover_notes || "—")}</dd></dl></div>` : ""}`;
  }

  function jobForm(j, orderId) {
    j = j || { order_id: orderId || "", member_ids: [] };
    const cand = C.S.orders.filter((o) => ["ready_install", "manufacturing", "completed"].includes(o.status) || o.id === j.order_id);
    if (!cand.length) return C.toast("لا توجد طلبات في التصنيع أو جاهزة للتركيب", "err");
    const inst = staffWith("installer");
    const ov = modalForm(j.id ? `تعديل تركيب #${j.job_no}` : "جدولة تركيب", `
      ${field("الطلب *", `<select class="input" name="order_id" required>${cand.map((o) => `<option value="${o.id}" ${j.order_id === o.id ? "selected" : ""}>#${o.order_no} — ${esc(custName(o.customer_id))} — ${C.STATUS[o.status] ? C.STATUS[o.status][0] : o.status}</option>`).join("")}</select>`)}
      <div class="grid2">${field("التاريخ *", inp("scheduled_date", j.scheduled_date, 'type="date" required'))}${field("الفترة", inp("time_slot", j.time_slot, 'list="p2-slots" placeholder="صباحية / مسائية"') + '<datalist id="p2-slots"><option>صباحية 8-12</option><option>ظهرية 12-4</option><option>مسائية 4-8</option></datalist>')}
      ${field("قائد الفريق", `<select class="input" name="team_lead_id">${staffOpts(inst, j.team_lead_id)}</select>`)}</div>
      <label class="p2-lbl">أعضاء الفريق</label><div class="p2-checks">${inst.map((s) => `<label class="check"><input type="checkbox" name="m_${s.id}" ${(j.member_ids || []).includes(s.id) ? "checked" : ""}> ${esc(s.full_name || s.email)}</label>`).join("") || '<span class="p2-muted">لا يوجد موظفون بدور «فريق التركيبات» — فعّلهم من صفحة المستخدمين والصلاحيات</span>'}</div>
      ${field("العنوان", inp("address", j.address), "mt")}${field("ملاحظات للفريق", area("notes", j.notes))}`, "حفظ", async (v) => {
      const row = { order_id: v.order_id, scheduled_date: v.scheduled_date || null, time_slot: v.time_slot || null, team_lead_id: v.team_lead_id || null, member_ids: inst.filter((s) => v["m_" + s.id]).map((s) => s.id), address: v.address || null, notes: v.notes || null, customer_id: order(v.order_id).customer_id || null };
      const r = await run(j.id ? C.sb.from("installation_jobs").update(row).eq("id", j.id).select().single() : C.sb.from("installation_jobs").insert(row).select().single());
      if (r) { await done("تم حفظ موعد التركيب"); if (r.data && r.data.id) location.hash = "#/job/" + r.data.id; }
    });
    const os = ov.querySelector("[name=order_id]"), ad = ov.querySelector("[name=address]");
    const fill = () => { if (!ad.value) ad.value = C.cust(order(os.value).customer_id).address || ""; };
    fill(); os.addEventListener("change", () => { ad.value = ""; fill(); });
  }

  function handoverForm(id) {
    const j = P.jobs.find((x) => x.id === id); if (!j) return;
    const c = C.cust(j.customer_id);
    modalForm(`توثيق تسليم العميل — تركيب #${j.job_no}`, `<div class="grid2">${field("اسم المستلم *", inp("handover_name", j.handover_name || c.name, "required"))}${field("جوال المستلم", inp("handover_phone", j.handover_phone || c.phone, 'dir="ltr"'))}
      ${field("تقييم العميل", `<select class="input" name="customer_rating"><option value="">—</option>${[5, 4, 3, 2, 1].map((n) => `<option value="${n}">${"★".repeat(n)} (${n})</option>`).join("")}</select>`)}</div>
      ${field("ملاحظات التسليم", area("handover_notes", j.handover_notes))}
      ${field(`صور بعد التركيب ${(j.after_photos || []).length ? `(مرفوع ${(j.after_photos || []).length})` : "*"}`, `<input type="file" class="input" name="files" accept="image/*" multiple>`)}
      <label class="check"><input type="checkbox" name="confirm" required> أقر بأن العميل استلم الأعمال وتمت المعاينة معه</label>`, "تأكيد التسليم وإغلاق المهمة", async (v, f) => {
      const ph = await upload(f.querySelector("[name=files]").files, `jobs/${j.id}`);
      const after = (j.after_photos || []).concat(ph);
      if (!after.length) return C.toast("ارفع صورة واحدة على الأقل بعد التركيب", "err");
      const r = await run(C.sb.from("installation_jobs").update({ status: "completed", handover_name: v.handover_name, handover_phone: v.handover_phone || null, customer_rating: v.customer_rating ? Number(v.customer_rating) : null, handover_notes: v.handover_notes || null, after_photos: after }).eq("id", j.id));
      if (r) await done("تم تسليم العميل وإغلاق الطلب ✓");
    });
  }

  // =====================================================================
  //  الطباعة / PDF
  // =====================================================================
  async function ensureUrls(paths) {
    const need = (paths || []).filter((p) => !P.urls[p]);
    if (need.length) { try { const r = await C.sb.storage.from("hm-files").createSignedUrls(need, 3600); (r.data || []).forEach((x) => { if (x.signedUrl) P.urls[x.path] = x.signedUrl; }); } catch (er) { console.error(er); } }
    return (paths || []).map((p) => P.urls[p]).filter(Boolean);
  }
  function printHTML(title, no, inner) {
    const w = window.open("", "_blank");
    if (!w) return C.toast("اسمح بالنوافذ المنبثقة للطباعة", "err");
    w.document.write(`<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>${esc(title)} ${esc(no)}</title><link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700;800&display=swap" rel="stylesheet">
    <style>body{font-family:Tajawal,sans-serif;color:#2a1a1b;margin:0;padding:36px 44px}header{display:flex;justify-content:space-between;align-items:center;border-bottom:3px solid #2a1a1b;padding-bottom:14px}.brand{text-align:center;color:#7e1416;font-size:15px}
    h1{color:#7e1416;font-size:26px;margin:22px 0 4px}h3{color:#4a1416;margin:20px 0 6px}.meta{display:grid;grid-template-columns:1fr 1fr;gap:6px 30px;background:#f6eceb;padding:14px 20px;border-radius:10px;margin:16px 0}.meta b{color:#4a1416}
    table{width:100%;border-collapse:collapse;margin-top:10px}th{background:#7e1416;color:#fff;padding:8px;text-align:right}td{border-bottom:1px solid #ece4e3;padding:8px}.total{margin-top:14px;text-align:left;font-size:19px;font-weight:800;color:#7e1416}
    .ph{display:flex;flex-wrap:wrap;gap:8px;margin-top:8px}.ph img{width:160px;height:120px;object-fit:cover;border-radius:6px;border:1px solid #ddd}.box{display:inline-block;width:14px;height:14px;border:1.5px solid #444;border-radius:3px}
    .sign{display:flex;justify-content:space-between;margin-top:60px}.sign div{border-top:1px solid #999;width:200px;text-align:center;padding-top:8px}footer{margin-top:40px;text-align:center;font-size:12px;color:#7b6b6c;border-top:1px solid #ece4e3;padding-top:8px}</style></head><body>
    <header><div class="brand">${window.logoSVG(170)}<div>Home Marble</div></div><div style="text-align:left"><div><b>الرقم:</b> ${esc(no)}</div><div><b>تاريخ الطباعة:</b> ${d(new Date())}</div></div></header>
    <h1>${esc(title)}</h1>${inner}<footer>هوم ماربل · الرياض – الخرج · نعزز جمال مساحتكم .. بالرخام والتصميم</footer>
    <script>window.onload=()=>setTimeout(()=>window.print(),700)<\/script></body></html>`);
    w.document.close();
  }
  function printJobCard(orderId) {
    const o = order(orderId); const items = P.items.filter((i) => i.order_id === orderId);
    printHTML("بطاقة تشغيل — المصنع", "#" + o.order_no, `<div class="meta"><div><b>العميل:</b> ${esc(custName(o.customer_id))}</div><div><b>نوع العمل:</b> ${esc(o.work_type)}</div><div><b>الفرع:</b> ${esc(C.branchName(o.branch_id))}</div><div><b>أُرسل للمصنع:</b> ${d(o.sent_to_factory_at)}</div></div>
      <table><thead><tr><th>#</th><th>المنتج</th><th>الكمية</th><th>الخامة</th><th>المقاسات</th><th>التسليم</th><th>قص</th><th>تجميع</th><th>تلميع</th><th>جودة</th></tr></thead><tbody>${items.map((i, n) => `<tr><td>${n + 1}</td><td>${esc(i.name)}${i.notes ? `<br><small>${esc(i.notes)}</small>` : ""}</td><td>${num(i.qty)} ${esc(i.unit || "")}</td><td>${esc(i.material || "")}</td><td>${esc(i.dimensions || "")}</td><td>${d(i.due_date)}</td>${["cutting", "assembly", "polishing", "quality"].map((s) => `<td>${STAGES.indexOf(i.stage) > STAGES.indexOf(s) ? "✔" : '<span class="box"></span>'}</td>`).join("")}</tr>`).join("")}</tbody></table>
      ${o.description ? `<h3>المواصفات</h3><div style="white-space:pre-wrap">${esc(o.description)}</div>` : ""}<div class="sign"><div>مدير المصنع</div><div>مراقب الجودة</div></div>`);
  }
  function printPR(p) {
    const s = P.suppliers.find((x) => x.id === p.supplier_id) || {};
    printHTML("أمر شراء", "#" + p.pr_no, `<div class="meta"><div><b>المورد:</b> ${esc(s.name || "—")}</div><div><b>جوال المورد:</b> ${esc(s.phone || "—")}</div><div><b>الحالة:</b> ${(PR_ST[p.status] || [p.status])[0]}</div><div><b>التوريد المتوقع:</b> ${d(p.expected_date)}</div>${p.order_id ? `<div><b>مرتبط بطلب العميل:</b> ${esc(orderLabel(p.order_id))}</div>` : ""}</div>
      <table><thead><tr><th>#</th><th>الصنف</th><th>الكمية</th><th>الوحدة</th><th>تكلفة الوحدة</th><th>الإجمالي</th></tr></thead><tbody>${(p.items || []).map((i, n) => `<tr><td>${n + 1}</td><td>${esc(i.name)}</td><td>${num(i.qty)}</td><td>${esc(i.unit || "")}</td><td>${money(i.unit_cost)}</td><td>${money(Number(i.qty) * Number(i.unit_cost))}</td></tr>`).join("")}</tbody></table>
      <div class="total">الإجمالي: ${money(p.total_cost)} ريال سعودي</div>${p.notes ? `<h3>ملاحظات</h3><div style="white-space:pre-wrap">${esc(p.notes)}</div>` : ""}<div class="sign"><div>المشتريات</div><div>الاعتماد: ${esc(staffName(p.approved_by))}</div></div>`);
  }
  async function printVisit(v) {
    const c = C.cust(v.customer_id); const urls = await ensureUrls(v.photos);
    printHTML("تقرير زيارة قياس", "#" + v.visit_no, `<div class="meta"><div><b>العميل:</b> ${esc(c.name || "")}</div><div><b>الجوال:</b> ${esc(v.contact_phone || c.phone || "—")}</div><div><b>العنوان:</b> ${esc(v.address || c.address || "—")}</div><div><b>الموعد:</b> ${dt(v.scheduled_at)}</div><div><b>الفني:</b> ${esc(staffName(v.technician_id))}</div><div><b>الحالة:</b> ${(V_ST[v.status] || [v.status])[0]}</div></div>
      <h3>المقاسات (سم)</h3><table><thead><tr><th>#</th><th>الموضع</th><th>العرض</th><th>الطول</th><th>العمق</th><th>العدد</th><th>ملاحظات</th></tr></thead><tbody>${(v.measurements || []).map((r, n) => `<tr><td>${n + 1}</td><td>${esc(r.label)}</td><td>${esc(r.width || "")}</td><td>${esc(r.height || "")}</td><td>${esc(r.depth || "")}</td><td>${esc(r.qty || 1)}</td><td>${esc(r.notes || "")}</td></tr>`).join("")}</tbody></table>
      ${v.notes ? `<h3>ملاحظات الموقع</h3><div style="white-space:pre-wrap">${esc(v.notes)}</div>` : ""}${urls.length ? `<h3>صور الموقع</h3><div class="ph">${urls.map((u) => `<img src="${u}">`).join("")}</div>` : ""}<div class="sign"><div>توقيع العميل</div><div>فني القياس</div></div>`);
  }
  async function printJob(j) {
    const o = order(j.order_id); const c = C.cust(j.customer_id || o.customer_id); const done_ = j.status === "completed";
    const urls = done_ ? await ensureUrls(j.after_photos) : [];
    printHTML(done_ ? "محضر تسليم أعمال" : "أمر تركيب", "#" + j.job_no, `<div class="meta"><div><b>العميل:</b> ${esc(c.name || "")}</div><div><b>الجوال:</b> ${esc(c.phone || "—")}</div><div><b>الطلب:</b> #${o.order_no || ""} — ${esc(o.work_type || "")}</div><div><b>العنوان:</b> ${esc(j.address || c.address || "—")}</div><div><b>الموعد:</b> ${d(j.scheduled_date)} ${esc(j.time_slot || "")}</div><div><b>قائد الفريق:</b> ${esc(staffName(j.team_lead_id))}</div></div>
      <h3>المنتجات</h3><table><thead><tr><th>#</th><th>المنتج</th><th>الكمية</th><th>الخامة / المقاس</th><th>الحالة</th></tr></thead><tbody>${P.items.filter((i) => i.order_id === j.order_id).map((i, n) => `<tr><td>${n + 1}</td><td>${esc(i.name)}</td><td>${num(i.qty)} ${esc(i.unit || "")}</td><td>${esc([i.material, i.dimensions].filter(Boolean).join(" · "))}</td><td>${STAGE[i.stage][0]}</td></tr>`).join("")}</tbody></table>
      ${done_ ? `<div class="meta"><div><b>المستلم:</b> ${esc(j.handover_name)}</div><div><b>جوال المستلم:</b> ${esc(j.handover_phone || "—")}</div><div><b>تاريخ التسليم:</b> ${dt(j.handover_at)}</div><div><b>التقييم:</b> ${j.customer_rating ? "★".repeat(j.customer_rating) : "—"}</div></div>${j.handover_notes ? `<div style="white-space:pre-wrap">${esc(j.handover_notes)}</div>` : ""}<p>يقر العميل باستلام الأعمال المذكورة أعلاه بحالة سليمة ومطابقة للمواصفات المتفق عليها.</p>${urls.length ? `<h3>صور بعد التركيب</h3><div class="ph">${urls.map((u) => `<img src="${u}">`).join("")}</div>` : ""}` : `${j.notes ? `<h3>ملاحظات</h3><div style="white-space:pre-wrap">${esc(j.notes)}</div>` : ""}`}
      <div class="sign"><div>توقيع العميل / المستلم</div><div>قائد فريق التركيب</div></div>`);
  }

  // =====================================================================
  //  الأحداث (Actions) والربط
  // =====================================================================
  function bindModalActs() {
    const root = document.querySelector("#modal-root");
    root.querySelectorAll("[data-act]").forEach((b) => (b.onclick = (e) => { e.stopPropagation(); action(b.dataset.act, b); }));
    root.querySelectorAll("a[href^='#/']").forEach((a) => a.addEventListener("click", () => C.closeModal()));
    hydratePhotos(root);
  }

  function pickFiles(cb) {
    const fi = document.createElement("input"); fi.type = "file"; fi.accept = "image/*"; fi.multiple = true;
    fi.onchange = () => cb(fi.files); fi.click();
  }

  function action(a, el) {
    if (!a || a.indexOf("p2-") !== 0) return false;
    doAction(a, el).catch((er) => C.toast(C.errMsg(er), "err"));
    return true;
  }

  async function doAction(a, el) {
    const ds = el.dataset, id = ds.id;
    const item = () => P.items.find((i) => i.id === id);
    switch (a) {
      case "p2-import": {
        const r = await run(C.sb.rpc("hm_import_items", { _order: ds.order }));
        if (r) await done(r.data ? `تم استيراد ${r.data} بند إلى المصنع` : "الطلب يحتوي على بنود بالفعل");
        return;
      }
      case "p2-item-new": return itemForm(null, ds.order);
      case "p2-item-edit": return itemForm(item());
      case "p2-item-back": return backForm(id);
      case "p2-item-log": return itemLog(id);
      case "p2-next": { const it = item(); if (!it) return; return moveItem(id, NEXT[it.stage], "waiting", null); }
      case "p2-state": return moveItem(id, null, ds.state, null);
      case "p2-qc": return qcForm(id);
      case "p2-qc-photos": { const x = P.qc.find((q) => q.id === id); if (!x) return; C.modal("صور فحص الجودة", photos(x.photos)); return bindModalActs(); }
      case "p2-print-job-card": return printJobCard(ds.order);
      case "p2-res-new": return resForm(ds.order, ds.item);
      case "p2-res-consume": { if (!confirm("صرف الكمية المحجوزة من المستودع للطلب؟")) return; const r = await run(C.sb.rpc("hm_consume_reservation", { _id: id })); if (r) await done("تم صرف المادة وخصمها من الرصيد"); return; }
      case "p2-res-release": { if (!confirm("إلغاء هذا الحجز وإتاحة الكمية؟")) return; const r = await run(C.sb.from("inventory_reservations").update({ status: "released" }).eq("id", id)); if (r) await done("تم إلغاء الحجز"); return; }
      case "p2-pr-new": return prForm(null, ds.order, ds.item, ds.sup);
      case "p2-pr-edit": return prForm(P.prs.find((p) => p.id === id));
      case "p2-pr-receive": return receiveForm(id);
      case "p2-pr-print": return printPR(P.prs.find((p) => p.id === id));
      case "p2-pr-status": {
        const s = ds.status; if (s === "cancelled" && !confirm("إلغاء طلب الشراء؟")) return;
        const r = await run(C.sb.from("purchase_requests").update({ status: s }).eq("id", id));
        if (r) await done({ requested: "تم إرسال الطلب للاعتماد", approved: "تم اعتماد طلب الشراء ✓", ordered: "تم تسجيل الإرسال للمورد", cancelled: "تم إلغاء الطلب" }[s]);
        return;
      }
      case "p2-pr-del": { if (!confirm("حذف طلب الشراء نهائياً؟")) return; const r = await run(C.sb.from("purchase_requests").delete().eq("id", id)); if (r) { await done("تم الحذف"); location.hash = "#/purchases"; } return; }
      case "p2-sup-new": return supplierForm();
      case "p2-sup-edit": return supplierForm(P.suppliers.find((s) => s.id === id));
      case "p2-inv-new": return invItemForm();
      case "p2-inv-edit": return invItemForm(invItem(id));
      case "p2-move-new": return moveForm(ds.item);
      case "p2-visit-new": return visitForm(null, { cust: ds.cust, order: ds.order, doc: ds.doc });
      case "p2-visit-edit": return visitForm(P.visits.find((v) => v.id === id));
      case "p2-visit-meas": return measForm(id);
      case "p2-visit-print": return printVisit(P.visits.find((v) => v.id === id));
      case "p2-visit-status": {
        const v = P.visits.find((x) => x.id === id);
        if (ds.status === "done" && !(v.measurements || []).length) return measForm(id);
        const r = await run(C.sb.from("measurement_visits").update({ status: ds.status }).eq("id", id));
        if (r) await done("تم تحديث حالة الزيارة"); return;
      }
      case "p2-visit-del": { if (!confirm("حذف الزيارة؟")) return; const r = await run(C.sb.from("measurement_visits").delete().eq("id", id)); if (r) { await done("تم الحذف"); location.hash = "#/measurements"; } return; }
      case "p2-job-new": return jobForm(null, ds.order);
      case "p2-job-edit": return jobForm(P.jobs.find((j) => j.id === id));
      case "p2-job-handover": return handoverForm(id);
      case "p2-job-print": return printJob(P.jobs.find((j) => j.id === id));
      case "p2-job-status": { const r = await run(C.sb.from("installation_jobs").update({ status: ds.status }).eq("id", id)); if (r) await done("تم تحديث حالة التركيب"); return; }
      case "p2-job-issues": {
        const j = P.jobs.find((x) => x.id === id);
        return modalForm("ملاحظات ومشاكل التنفيذ", field("الملاحظات", area("issues", j.issues)), "حفظ", async (v) => { const r = await run(C.sb.from("installation_jobs").update({ issues: v.issues || null }).eq("id", id)); if (r) await done("تم الحفظ"); });
      }
      case "p2-job-del": { if (!confirm("حذف مهمة التركيب؟")) return; const r = await run(C.sb.from("installation_jobs").delete().eq("id", id)); if (r) { await done("تم الحذف"); location.hash = "#/installations"; } return; }
      case "p2-photos-add": return pickFiles(async (files) => {
        C.toast("جاري رفع الصور...");
        const ph = await upload(files, ds.folder || ds.table);
        if (!ph.length) return;
        const rowList = ds.table === "measurement_visits" ? P.visits : P.jobs;
        const row = rowList.find((x) => x.id === id) || {};
        const r = await run(C.sb.from(ds.table).update({ [ds.field]: (row[ds.field] || []).concat(ph) }).eq("id", id));
        if (r) await done(`تم رفع ${ph.length} صورة`);
      });
      case "p2-del-photo": {
        const box = el.closest("[data-ph-table]"); if (!box || !confirm("حذف الصورة؟")) return;
        const t = box.dataset.phTable, rid = box.dataset.phId, fld = box.dataset.phField;
        const row = (t === "measurement_visits" ? P.visits : P.jobs).find((x) => x.id === rid) || {};
        const r = await run(C.sb.from(t).update({ [fld]: (row[fld] || []).filter((p) => p !== ds.path) }).eq("id", rid));
        if (r) { try { await C.sb.storage.from("hm-files").remove([ds.path]); } catch (er) { /* يكفي فك الارتباط */ } await done("تم حذف الصورة"); }
        return;
      }
    }
  }

  function bind() {
    const app = C.app;
    app.querySelectorAll("[data-p2f]").forEach((elm) => {
      const [pg, key] = elm.dataset.p2f.split(".");
      const isText = elm.tagName === "INPUT" && !["checkbox", "date"].includes(elm.type);
      const fn = () => {
        P.f[pg] = Object.assign({}, P.f[pg] || {}, { [key]: elm.type === "checkbox" ? elm.checked : elm.value });
        C.render(true);
        if (isText) { const n = app.querySelector(`[data-p2f="${elm.dataset.p2f}"]`); if (n) { n.focus(); n.setSelectionRange(n.value.length, n.value.length); } }
      };
      if (isText) elm.oninput = fn; else elm.onchange = fn;
    });
    app.querySelectorAll("[data-p2tab]").forEach((b) => (b.onclick = () => { const [pg, t] = b.dataset.p2tab.split("."); P.f[pg] = Object.assign({}, P.f[pg] || {}, { tab: t }); C.render(true); }));
    app.querySelectorAll("[data-p2low]").forEach((b) => (b.onclick = () => { P.f.inventory = Object.assign({}, P.f.inventory || {}, { low: true, tab: "items" }); C.render(true); }));
    hydratePhotos(app);
  }


  // ---------- تسجيل الإضافة ----------
  window.HM_EXT = window.HM_EXT || [];
  window.HM_EXT.push({
    name: "phase2",
    init(ctx) { C = ctx; Object.assign(C.ROLE_LABEL, P2_ROLES); },
    load,
    realtimeTables: () => ["order_items", "production_logs", "quality_checks", "suppliers", "inventory_items", "inventory_movements", "inventory_reservations", "purchase_requests", "measurement_visits", "installation_jobs"],
    nav, alerts, search, dashboard, home, customerSection, orderSection, docSection, action, bind,
    footer: () => "المرحلة الأولى + الثانية · المبيعات والمصنع والمستودع",
    auditLabels: () => AUDIT_T,
    auditDesc: (t, r) => (t === "purchase_requests" && r.pr_no ? "طلب شراء #" + r.pr_no : t === "measurement_visits" && r.visit_no ? "زيارة قياس #" + r.visit_no : t === "installation_jobs" && r.job_no ? "تركيب #" + r.job_no : t === "quality_checks" ? (r.result === "pass" ? "فحص جودة: مقبول" : "فحص جودة: مرفوض") : t === "inventory_movements" ? `${(MV[r.kind] || [r.kind])[0]} ${r.qty} — ${invItem(r.item_id).name || ""}` : t === "inventory_reservations" ? `حجز ${r.qty} — ${invItem(r.item_id).name || ""}` : ""),
    pages: { factory: pageFactory, "factory-order": pageFactoryOrder, quality: pageQuality, purchases: pagePurchases, purchase: pagePurchase, suppliers: pageSuppliers, inventory: pageInventory, "inventory-item": pageInvItem, measurements: pageVisits, visit: pageVisit, installations: pageJobs, job: pageJob },
  });
})();
