/* هوم ماربل — الإضافات: الدعم الفني • نسيت كلمة المرور عبر الدعم • دردشة الزوار • الدردشات بالكود
   استيراد العملاء من Excel • حفظ وتصدير واستعادة التقارير • النسخ الاحتياطي • سلة المحذوفات
   يعمل على نفس قاعدة بيانات Lovable Cloud الأصلية (config.js) — ملف إضافي عبر window.HM_EXT دون تعديل أي ميزة قائمة. */
(function () {
  let C = null;
  const E = { reqs: [], threads: [], rooms: [], members: [], deleted: [], reports: [], msgs: {}, room: {}, repCache: {}, localReport: null, missing: false, f: {}, drafts: {} };
  const P1_ROLES = ["admin", "executive", "sales", "factory_manager", "accountant"];
  const P2_ROLES = ["purchasing", "warehouse", "cutting_supervisor", "assembly_supervisor", "polishing_supervisor", "quality_inspector", "measurement_tech", "installer"];
  const THREAD_COLS = "id,thread_no,visitor_name,visitor_contact,subject,status,assigned_to,last_message_at,last_sender,staff_unread,visitor_unread,created_at";
  const MEMBER_COLS = "id,room_id,display_name,user_id,joined_at,last_seen_at";
  const BACKUP_ORDER = ["branches", "profiles", "user_roles", "customers", "orders", "documents", "suppliers", "inventory_items", "purchase_requests", "order_items", "inventory_reservations", "inventory_movements", "production_logs", "quality_checks", "measurement_visits", "installation_jobs", "support_password_requests", "support_threads", "support_messages", "chat_rooms", "chat_members", "chat_messages", "saved_reports"];
  const SELECT_COLS = { support_threads: THREAD_COLS, chat_members: MEMBER_COLS };
  const RESTRICTED = ["branches", "profiles", "user_roles"];
  const TABLE_AR = { branches: "الفروع", profiles: "الموظفون", user_roles: "الصلاحيات", customers: "العملاء", orders: "الطلبات", documents: "المستندات", suppliers: "الموردون", inventory_items: "أصناف المخزون", purchase_requests: "طلبات الشراء", order_items: "بنود التصنيع", inventory_reservations: "حجز المواد", inventory_movements: "حركات المخزون", production_logs: "سجل الإنتاج", quality_checks: "فحص الجودة", measurement_visits: "زيارات القياس", installation_jobs: "التركيبات", support_password_requests: "طلبات كلمات المرور", support_threads: "محادثات الدعم", support_messages: "رسائل الدعم", chat_rooms: "الدردشات", chat_members: "أعضاء الدردشات", chat_messages: "رسائل الدردشات", saved_reports: "التقارير المحفوظة", auth_password: "كلمات المرور" };
  const REQ_ST = { new: ["جديد", "b-red"], in_progress: ["جاري التواصل", "b-yellow"], done: ["تم", "b-green"], rejected: ["مرفوض", "b-gray"] };
  const CH = { whatsapp: "واتساب", phone: "اتصال هاتفي", email: "بريد إلكتروني" };

  // ---------- مساعدات ----------
  const LS = {
    get(k) { try { return JSON.parse(localStorage.getItem(k) || "null"); } catch (e) { return null; } },
    set(k, v) { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* تصفح خاص */ } },
  };
  const esc = (v) => String(v == null ? "" : v).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const ic = (n, s) => window.icon(n, s);
  const roles = () => (C && C.S && C.S.roles) || [];
  const has = (...r) => roles().some((x) => r.includes(x));
  const isMgr = () => has("admin", "executive");
  const isAdmin = () => has("admin");
  const isSupport = () => has("admin", "executive", "support");
  const isStaff = () => !!(C && C.S.user) && roles().length > 0;
  const hasP1 = () => roles().some((r) => P1_ROLES.includes(r));
  const hasP2 = () => roles().some((r) => P2_ROLES.includes(r));
  const route = () => ((C && C.S.route) || "").split("/");
  const tm = (t) => (t ? new Date(t).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : "");
  const dt = (t) => (t ? new Date(t).toLocaleString("en-GB", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—");
  const num = (n) => Number(n || 0).toLocaleString("en-US");
  const bdg = (map, k) => { const s = map[k] || [k, "b-gray"]; return `<span class="badge ${s[1]}">${s[0]}</span>`; };
  const field = (label, html, cls) => `<div class="field ${cls || ""}"><label>${label}</label>${html}</div>`;
  const noAccess = () => '<div class="empty">لا تملك صلاحية الوصول لهذه الصفحة</div>';
  const kpi = (lbl, val, unit, icn, foot) => `<div class="card"><div class="kpi"><div><div class="lbl">${lbl}</div><div class="val">${val}</div><div class="unit">${unit || ""}</div></div><div class="ico">${ic(icn, 26)}</div></div>${foot ? `<div class="kpi-foot">${foot}</div>` : ""}</div>`;
  const missingBanner = () => (E.missing ? `<div class="p2-warn">${ic("alert", 18)} لم يتم تفعيل جداول الإضافات بعد — شغّل ملف <b>database/extras_migration.sql</b> مرة واحدة على نفس قاعدة بيانات Lovable.</div>` : "");
  const stamp = () => { const d = new Date(); const p = (n) => String(n).padStart(2, "0"); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}`; };
  const normDigits = (s) => String(s == null ? "" : s).replace(/[٠-٩]/g, (x) => x.charCodeAt(0) - 1632).replace(/[۰-۹]/g, (x) => x.charCodeAt(0) - 1776);
  const normPhone = (s) => { let p = normDigits(s).replace(/[\s\-().]/g, ""); if (/^5\d{8}$/.test(p)) p = "0" + p; return p; };
  const normTxt = (s) => normDigits(s).toLowerCase().replace(/ـ/g, "").replace(/[أإآ]/g, "ا").replace(/ى/g, "ي").replace(/ة/g, "ه").replace(/\s+/g, " ").trim();
  const staffName = (id) => { const p = ((C && C.S.profiles) || []).find((x) => x.id === id); return (p && (p.full_name || p.email)) || "الدعم الفني"; };
  const isMissingErr = (r) => !!(r && r.error && /does not exist|schema cache|Could not find|relation/i.test(r.error.message || ""));
  const errText = (e) => (e && (e.message || e.error_description)) || "حدث خطأ غير متوقع";
  const sb = () => C.sb;
  const toast = (m, t) => C.toast(m, t);

  function waNumber(phone) {
    let p = normDigits(phone).replace(/[^\d+]/g, "").replace(/^\+/, "");
    if (p.startsWith("00")) p = p.slice(2);
    if (/^05\d{8}$/.test(p)) p = "966" + p.slice(1);
    return p;
  }
  const waLink = (phone, text) => `https://wa.me/${waNumber(phone)}${text ? "?text=" + encodeURIComponent(text) : ""}`;
  function contactLinks(value, text) {
    if (!value) return "";
    const v = String(value).trim();
    if (v.includes("@")) return `<a class="btn btn-sm btn-line" href="mailto:${esc(v)}?subject=${encodeURIComponent("هوم ماربل — الدعم الفني")}${text ? "&body=" + encodeURIComponent(text) : ""}">${ic("mail", 14)} بريد</a>`;
    return `<a class="btn btn-sm btn-success" target="_blank" rel="noopener" href="${esc(waLink(v, text))}">${ic("chat", 14)} واتساب</a><a class="btn btn-sm btn-line" href="tel:${esc(normDigits(v).replace(/[^\d+]/g, ""))}" title="اتصال">${ic("phone", 14)}</a>`;
  }
  function genPass() {
    const a = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
    const r = window.crypto && window.crypto.getRandomValues ? window.crypto.getRandomValues(new Uint32Array(10)) : Array.from({ length: 10 }, () => Math.floor(Math.random() * 1e9));
    let s = ""; for (let i = 0; i < 10; i++) s += a[r[i] % a.length];
    return s;
  }
  async function copyText(t) {
    try { await navigator.clipboard.writeText(t); toast("تم النسخ ✓", "ok"); }
    catch (e) { const ta = document.createElement("textarea"); ta.value = t; document.body.appendChild(ta); ta.select(); try { document.execCommand("copy"); toast("تم النسخ ✓", "ok"); } catch (er) { toast("انسخ النص يدوياً", "err"); } ta.remove(); }
  }
  async function rpc(fn, args) { const r = await sb().rpc(fn, args); if (r.error) throw r.error; return r.data; }
  async function run(promise, okMsg) {
    try { const r = await promise; if (r && r.error) { toast(errText(r.error), "err"); return null; } if (okMsg) toast(okMsg, "ok"); return r || {}; }
    catch (er) { toast(errText(er), "err"); return null; }
  }
  function modalForm(title, body, label, onSave, wide) {
    const ov = C.modal(title, `<form id="exmf" onsubmit="return false">${body}</form>`, `<button class="btn btn-primary" id="exsave">${label || "حفظ"}</button><button class="btn btn-line" data-close>إلغاء</button>`);
    if (wide) ov.querySelector(".modal").classList.add("modal-wide");
    const btn = ov.querySelector("#exsave");
    btn.onclick = async () => {
      const f = ov.querySelector("#exmf"); if (!f.reportValidity()) return;
      btn.disabled = true;
      try { await onSave(C.formData(f), f, ov); } catch (er) { toast(errText(er), "err"); }
      btn.disabled = false;
    };
    return ov;
  }
  function download(name, content, type) {
    const blob = content instanceof Blob ? content : new Blob([content], { type: type || "application/octet-stream" });
    if (!window.URL || !URL.createObjectURL) return;
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
  }
  function pickFile(accept, cb) {
    const fi = document.createElement("input"); fi.type = "file"; fi.accept = accept;
    fi.onchange = () => { if (fi.files && fi.files[0]) cb(fi.files[0]); };
    fi.click();
  }
  function readFile(file, mode) {
    return new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result); r.onerror = () => rej(r.error || new Error("تعذّرت قراءة الملف"));
      if (mode === "text") r.readAsText(file, "utf-8"); else r.readAsArrayBuffer(file);
    });
  }
  let xlsxPromise = null;
  function loadXLSX() {
    if (window.XLSX) return Promise.resolve(window.XLSX);
    if (xlsxPromise) return xlsxPromise;
    xlsxPromise = new Promise((res, rej) => {
      const s = document.createElement("script");
      s.src = "https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js";
      s.onload = () => (window.XLSX ? res(window.XLSX) : rej(new Error("تعذّر تحميل مكتبة Excel")));
      s.onerror = () => { xlsxPromise = null; rej(new Error("تعذّر تحميل مكتبة Excel — تحقق من الاتصال بالإنترنت")); };
      document.head.appendChild(s);
    });
    return xlsxPromise;
  }
  function makeWorkbook(sheets) {
    const X = window.XLSX; const wb = X.utils.book_new(); const used = new Set();
    sheets.forEach((sh, i) => {
      const base = String(sh.name || "ورقة " + (i + 1)).replace(/[\\/?*[\]:]/g, " ").slice(0, 26).trim() || "ورقة " + (i + 1);
      let n = base, k = 2; while (used.has(n)) n = base.slice(0, 24) + " " + k++;
      used.add(n);
      const ws = X.utils.aoa_to_sheet(sh.rows);
      ws["!cols"] = (sh.rows[0] || []).map((_, ci) => ({ wch: Math.min(45, Math.max(10, ...sh.rows.slice(0, 200).map((r) => String(r[ci] == null ? "" : r[ci]).length + 2))) }));
      X.utils.book_append_sheet(wb, ws, n);
    });
    wb.Workbook = { Views: [{ RTL: true }] };
    return wb;
  }

  // =====================================================================
  //  الزوار (بدون تسجيل دخول): نسيت كلمة المرور عبر الدعم • دردشة الدعم • الدخول بكود
  // =====================================================================
  const VKEY = "hm_visitor_thread";
  const RKEY = "hm_rooms";
  const V = { open: false, timer: null, last: null, msgs: [], status: "open", unread: 0, busy: false };
  const RM = { room: null, token: null, last: null, timer: null, busy: false, auto: false };

  // ---------- فقاعات الرسائل (مشتركة) ----------
  function bubble(m) {
    if (m.sys) return `<div class="ex-sys" data-mid="${esc(m.id || "")}">${esc(m.body)}<time>${tm(m.created_at)}</time></div>`;
    return `<div class="ex-b ${m.mine ? "mine" : ""} ${m.staff ? "staff" : ""}" data-mid="${esc(m.id || "")}"><div class="ex-bn">${esc(m.name || "")}</div><div class="ex-bt">${esc(m.body).replace(/\n/g, "<br>")}</div><time>${tm(m.created_at)}</time></div>`;
  }
  function paintMsgs(box, list, emptyText) {
    if (!box) return;
    box.innerHTML = list.length ? list.map(bubble).join("") : `<div class="ex-empty-chat">${emptyText || "لا توجد رسائل بعد"}</div>`;
    box.scrollTop = box.scrollHeight;
  }
  function appendMsgs(box, list) {
    if (!box || !list.length) return;
    const e = box.querySelector(".ex-empty-chat"); if (e) e.remove();
    const have = new Set(Array.from(box.querySelectorAll("[data-mid]")).map((x) => x.dataset.mid));
    const add = list.filter((m) => !have.has(String(m.id)));
    if (!add.length) return;
    box.insertAdjacentHTML("beforeend", add.map(bubble).join(""));
    box.scrollTop = box.scrollHeight;
  }
  const vMap = (m) => ({ id: m.id, created_at: m.created_at, body: m.body, sys: m.sender === "system", mine: m.sender === "visitor", staff: m.sender === "staff", name: m.sender === "visitor" ? "أنت" : m.staff_name || "الدعم الفني" });
  const rMap = (m) => ({ id: m.id, created_at: m.created_at, body: m.body, sys: m.name === "النظام", mine: !!m.mine, staff: !!m.is_staff, name: m.mine ? "أنت" : m.name });
  function sendOnEnter(form) {
    const ta = form.querySelector("textarea");
    if (ta) ta.addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); form.dispatchEvent(new Event("submit", { cancelable: true })); } });
  }

  // ---------- عناصر الزائر خارج #app حتى تبقى عند إعادة الرسم ----------
  function rootEl(id) {
    let r = document.getElementById(id);
    if (!r) { r = document.createElement("div"); r.id = id; document.body.appendChild(r); }
    return r;
  }
  function hideVisitorUI() {
    ["hm-visitor-root", "hm-room-root"].forEach((id) => { const r = document.getElementById(id); if (r) r.remove(); });
    clearInterval(V.timer); V.timer = null; clearInterval(RM.timer); RM.timer = null; RM.room = null;
  }

  // ---------- دردشة الدعم الفني للزائر ----------
  const vThread = () => LS.get(VKEY);
  function renderLauncher() {
    if (C && C.S.user && C.S.roles.length) return;
    const r = rootEl("hm-visitor-root");
    let b = r.querySelector("#ex-launch");
    if (!b) {
      b = document.createElement("button"); b.id = "ex-launch"; b.type = "button"; b.className = "ex-launch"; b.title = "الدعم الفني";
      b.onclick = () => { V.open = !V.open; if (V.open) V.unread = 0; drawWidget(); updateDot(); };
      r.appendChild(b);
    }
    updateDot();
    if (vThread()) startVisitorPoll();
  }
  function updateDot() {
    const b = document.getElementById("ex-launch"); if (!b) return;
    b.innerHTML = `${ic("chat", 24)}<span>الدعم الفني</span>${V.unread ? `<i class="ex-dot">${V.unread}</i>` : ""}`;
  }
  function openWidget() { renderLauncher(); V.open = true; V.unread = 0; drawWidget(); updateDot(); }

  function drawWidget() {
    const r = rootEl("hm-visitor-root");
    let w = r.querySelector(".ex-widget");
    if (!V.open) { if (w) w.remove(); return; }
    if (!w) { w = document.createElement("section"); w.className = "ex-widget"; r.appendChild(w); }
    const t = vThread();
    w.innerHTML = `<header><div class="ex-wh">${ic("chat", 20)}<div><b>الدعم الفني — هوم ماربل</b><small>${t ? "أنت متصل بفريق الدعم" : "نرد عليك هنا مباشرة"}</small></div></div><button type="button" class="ex-x" data-vx title="إغلاق">×</button></header>` +
      (t
        ? `<div class="ex-msgs" id="ex-vmsgs"></div>${V.status === "closed" ? '<div class="ex-closed">أُغلقت المحادثة من الدعم الفني — اكتب رسالة لإعادة فتحها</div>' : ""}
           <form class="ex-send" id="ex-vsend"><textarea class="input" name="body" rows="1" placeholder="اكتب رسالتك..." required maxlength="4000"></textarea><button class="btn btn-primary" type="submit" title="إرسال">${ic("send", 18)}</button></form>
           <div class="ex-wfoot">محادثة رقم #${esc(t.thread_no || "")} · <a data-vnew>بدء محادثة جديدة</a></div>`
        : `<form class="ex-wform" id="ex-vopen"><p>اكتب بياناتك ورسالتك، وسيرد عليك أحد موظفي الدعم الفني هنا.</p>
           ${field("الاسم *", '<input class="input" name="name" required maxlength="80">')}
           ${field("الجوال أو البريد (اختياري)", '<input class="input" name="contact" dir="ltr" maxlength="120">')}
           ${field("الموضوع", '<select class="input" name="subject"><option>استفسار عام</option><option>مشكلة في تسجيل الدخول</option><option>نسيت كلمة المرور</option><option>طلب / متابعة طلبية</option><option>أخرى</option></select>')}
           ${field("رسالتك *", '<textarea class="input" name="message" required rows="3" maxlength="4000"></textarea>')}
           <button class="btn btn-primary btn-block" type="submit">${ic("send", 18)} بدء المحادثة</button></form>`);
    w.querySelector("[data-vx]").onclick = () => { V.open = false; drawWidget(); };
    if (t) {
      paintMsgs(w.querySelector("#ex-vmsgs"), V.msgs.map(vMap), "جاري تحميل المحادثة...");
      const f = w.querySelector("#ex-vsend"); sendOnEnter(f);
      f.onsubmit = async (e) => {
        e.preventDefault();
        const ta = f.querySelector("textarea"); const body = ta.value.trim(); if (!body) return;
        ta.value = ""; ta.disabled = true;
        try { await rpc("hm_visitor_send", { _thread: t.thread_id, _token: t.token, _body: body }); await vFetch(); }
        catch (er) { ta.value = body; toast(errText(er), "err"); }
        ta.disabled = false; ta.focus();
      };
      w.querySelector("[data-vnew]").onclick = () => { if (!confirm("بدء محادثة جديدة؟ ستبقى المحادثة الحالية محفوظة لدى الدعم الفني.")) return; LS.set(VKEY, null); V.msgs = []; V.last = null; V.status = "open"; drawWidget(); };
      vFetch();
    } else {
      const f = w.querySelector("#ex-vopen");
      f.onsubmit = async (e) => {
        e.preventDefault(); if (!f.reportValidity()) return;
        const v = C.formData(f); const btn = f.querySelector("button[type=submit]"); btn.disabled = true;
        try {
          const d = await rpc("hm_visitor_open", { _name: v.name, _contact: v.contact || null, _subject: v.subject || null, _message: v.message });
          LS.set(VKEY, { thread_id: d.thread_id, token: d.token, thread_no: d.thread_no, name: v.name });
          V.msgs = []; V.last = null; V.status = "open";
          drawWidget(); startVisitorPoll();
        } catch (er) { toast(errText(er), "err"); }
        btn.disabled = false;
      };
    }
  }

  async function vFetch() {
    const t = vThread(); if (!t || V.busy || (C && C.S.user && C.S.roles.length)) return;
    V.busy = true;
    try {
      const d = await rpc("hm_visitor_fetch", { _thread: t.thread_id, _token: t.token, _after: V.last });
      const statusChanged = V.status !== d.status; V.status = d.status;
      const seen = new Set(V.msgs.map((m) => m.id));
      const add = (d.messages || []).filter((m) => !seen.has(m.id));
      if (add.length) {
        V.msgs = V.msgs.concat(add); V.last = V.msgs[V.msgs.length - 1].created_at;
        if (!V.open) { V.unread += add.filter((m) => m.sender === "staff").length; updateDot(); }
      }
      const box = document.getElementById("ex-vmsgs");
      if (statusChanged && V.open) drawWidget();
      else if (box) { if (!V.msgs.length) paintMsgs(box, [], "لا توجد رسائل بعد"); else if (box.querySelector(".ex-empty-chat")) paintMsgs(box, V.msgs.map(vMap)); else appendMsgs(box, add.map(vMap)); }
    } catch (er) {
      if (/غير موجودة/.test(errText(er))) { LS.set(VKEY, null); V.msgs = []; V.last = null; if (V.open) drawWidget(); }
    }
    V.busy = false;
  }
  function startVisitorPoll() {
    if (V.timer) return;
    V.timer = setInterval(() => { if (C && C.S.user && C.S.roles.length) { clearInterval(V.timer); V.timer = null; return; } if (!document.hidden) vFetch(); }, 4000);
  }

  // ---------- الدخول إلى دردشة بالكود ----------
  const savedRooms = () => LS.get(RKEY) || {};
  function saveRoom(info) { const m = savedRooms(); m[info.room_id] = { token: info.token, code: info.code, title: info.title, name: info.name }; LS.set(RKEY, m); }
  function forgetRoom(id) { const m = savedRooms(); delete m[id]; LS.set(RKEY, m); }
  function findSavedByCode(code) { const c = String(code || "").trim().toUpperCase(); if (!c) return null; const e = Object.entries(savedRooms()).find(([, v]) => v.code === c); return e ? Object.assign({ room_id: e[0] }, e[1]) : null; }

  async function joinRoom(code, name) {
    const info = await rpc("hm_room_join", { _code: String(code || "").trim().toUpperCase(), _name: name || null });
    saveRoom(info);
    return info;
  }

  function clearJoinHash() { if (location.hash.indexOf("#/join") === 0) history.replaceState(null, "", location.pathname + location.search); }
  function closeRoomOverlay() { const r = document.getElementById("hm-room-root"); if (r) r.remove(); clearInterval(RM.timer); RM.timer = null; RM.room = null; }
  function openJoin(code) {
    const saved = findSavedByCode(code);
    if (saved) return openVisitorRoom(saved);
    const r = rootEl("hm-room-root");
    r.innerHTML = `<div class="overlay"><div class="modal ex-joinbox"><div class="modal-head"><h3>${ic("key")} الدخول إلى دردشة بالكود</h3><button type="button" data-rx>${ic("x")}</button></div>
      <div class="modal-body"><p class="p2-muted" style="margin-bottom:12px">اكتب الكود الذي أرسله لك مدير هوم ماربل لتدخل الدردشة مباشرة.</p>
      <form id="ex-joinf" onsubmit="return false">${field("كود الدردشة *", `<input class="input ex-code-in" name="code" required maxlength="12" dir="ltr" autocomplete="off" value="${esc(String(code || "").toUpperCase())}" placeholder="مثال: K7Q2MX">`)}${field("اسمك *", '<input class="input" name="name" required maxlength="60">')}</form></div>
      <div class="modal-foot"><button class="btn btn-primary" id="ex-join-go">${ic("chat", 18)} دخول الدردشة</button><button class="btn btn-line" data-rx>إلغاء</button></div></div></div>`;
    r.querySelectorAll("[data-rx]").forEach((b) => (b.onclick = () => { closeRoomOverlay(); clearJoinHash(); }));
    const ci = r.querySelector("[name=code]"); ci.addEventListener("input", () => (ci.value = ci.value.toUpperCase().replace(/\s/g, "")));
    const go = r.querySelector("#ex-join-go");
    go.onclick = async () => {
      const f = r.querySelector("#ex-joinf"); if (!f.reportValidity()) return;
      const v = C.formData(f); go.disabled = true;
      try { const info = await joinRoom(v.code, v.name); openVisitorRoom(info); }
      catch (er) { toast(errText(er), "err"); }
      go.disabled = false;
    };
    r.querySelector("#ex-joinf").addEventListener("submit", (e) => { e.preventDefault(); if (!go.disabled) go.click(); });
    (code ? r.querySelector("[name=name]") : ci).focus();
  }

  function openVisitorRoom(info) {
    const r = rootEl("hm-room-root");
    clearInterval(RM.timer);
    RM.room = info.room_id; RM.token = info.token; RM.last = null;
    r.innerHTML = `<div class="ex-fullchat"><header><div class="ex-wh">${ic("chat", 22)}<div><b>${esc(info.title || "دردشة")}</b><small>كود الدردشة: <b dir="ltr">${esc(info.code || "")}</b> · <span id="ex-ronline"></span></small></div></div>
      <div class="ex-fc-act"><button type="button" class="btn btn-sm btn-line" data-rcopy>${ic("copy", 14)} نسخ الرابط</button><button type="button" class="btn btn-sm btn-danger" data-rleave>خروج</button></div></header>
      <div class="ex-msgs" id="ex-rmsgs"><div class="ex-empty-chat">جاري التحميل...</div></div>
      <div class="ex-closed" id="ex-rclosed" hidden>هذه الدردشة مغلقة من الإدارة</div>
      <form class="ex-send" id="ex-rsend"><textarea class="input" name="body" rows="1" placeholder="اكتب رسالتك..." required maxlength="4000"></textarea><button class="btn btn-primary" type="submit">${ic("send", 18)}</button></form></div>`;
    r.querySelector("[data-rleave]").onclick = () => { closeRoomOverlay(); clearJoinHash(); };
    r.querySelector("[data-rcopy]").onclick = () => copyText(location.href.split("#")[0] + "#/join/" + info.code);
    const f = r.querySelector("#ex-rsend"); sendOnEnter(f);
    f.onsubmit = async (e) => {
      e.preventDefault(); const ta = f.querySelector("textarea"); const body = ta.value.trim(); if (!body) return;
      ta.value = ""; ta.disabled = true;
      try { await rpc("hm_room_send", { _room: RM.room, _token: RM.token, _body: body }); await rFetch(); }
      catch (er) { ta.value = body; toast(errText(er), "err"); }
      ta.disabled = false; ta.focus();
    };
    rFetch();
    RM.timer = setInterval(() => { if (!document.hidden) rFetch(); }, 3000);
  }

  async function rFetch() {
    if (!RM.room || RM.busy) return;
    RM.busy = true;
    try {
      const d = await rpc("hm_room_fetch", { _room: RM.room, _token: RM.token, _after: RM.last });
      const box = document.getElementById("ex-rmsgs");
      const list = d.messages || [];
      if (RM.last === null) paintMsgs(box, list.map(rMap), "لا توجد رسائل بعد — ابدأ المحادثة");
      else appendMsgs(box, list.map(rMap));
      if (list.length) RM.last = list[list.length - 1].created_at;
      else if (RM.last === null) RM.last = new Date(0).toISOString();
      const on = document.getElementById("ex-ronline"); if (on) on.textContent = `${num(d.online)} متصل الآن من ${num(d.members)}`;
      const cl = document.getElementById("ex-rclosed"); if (cl) cl.hidden = !!d.active;
      const fm = document.getElementById("ex-rsend"); if (fm) fm.hidden = !d.active;
    } catch (er) {
      if (/لست عضواً|غير موجودة/.test(errText(er))) { forgetRoom(RM.room); closeRoomOverlay(); toast("انتهت عضويتك في هذه الدردشة — ادخل بالكود مرة أخرى", "err"); }
    }
    RM.busy = false;
  }

  // ---------- نسيت كلمة المرور: طلب عبر الدعم الفني ----------
  function injectPasswordRequest(card) {
    const form = card.querySelector("#authf");
    if (!form || card.querySelector("#ex-pwreq")) return;
    const box = document.createElement("div"); box.className = "ex-pwbox";
    box.innerHTML = `<div class="ex-pwhead">${ic("key", 22)}<div><b>طلب كلمة مرور جديدة من الدعم الفني</b><small>اكتب بريد حسابك الذي نسيت كلمة مروره، ورقم الجوال أو البريد الذي سيتواصل معك عليه الدعم الفني أو المدير بكلمة المرور الجديدة.</small></div></div>
      <form id="ex-pwreq" onsubmit="return false">
        ${field("البريد الإلكتروني لحسابك *", '<input class="input" type="email" name="email" required dir="ltr" autocomplete="email">')}
        <div class="grid2">${field("يتواصل معك الدعم عبر", `<select class="input" name="channel">${Object.keys(CH).map((k) => `<option value="${k}">${CH[k]}</option>`).join("")}</select>`)}
        ${field('<span id="ex-pwclbl">رقم الجوال للتواصل *</span>', '<input class="input" name="contact" required dir="ltr" maxlength="120" placeholder="05xxxxxxxx">')}</div>
        ${field("الاسم", '<input class="input" name="name" maxlength="80">')}
        ${field("ملاحظات (اختياري)", '<textarea class="input" name="notes" rows="2" maxlength="1000" style="min-height:60px"></textarea>')}
        <button class="btn btn-primary btn-block" type="button" id="ex-pwgo">${ic("send", 18)} إرسال الطلب للدعم الفني</button>
      </form>`;
    form.parentNode.insertBefore(box, form);
    const det = document.createElement("details"); det.className = "ex-alt";
    det.innerHTML = "<summary>أو استلم رابط إعادة التعيين على بريدك تلقائياً</summary>";
    form.parentNode.insertBefore(det, form); det.appendChild(form);
    const f = box.querySelector("#ex-pwreq");
    const ch = f.querySelector("[name=channel]"), ct = f.querySelector("[name=contact]");
    ch.onchange = () => {
      const mail = ch.value === "email";
      box.querySelector("#ex-pwclbl").textContent = mail ? "البريد الذي نتواصل معك عليه *" : "رقم الجوال للتواصل *";
      ct.type = mail ? "email" : "text"; ct.placeholder = mail ? "name@example.com" : "05xxxxxxxx";
    };
    f.querySelector("#ex-pwgo").onclick = async () => {
      if (!f.reportValidity()) return;
      const v = C.formData(f); const btn = f.querySelector("#ex-pwgo"); btn.disabled = true;
      try {
        const n = await rpc("hm_submit_password_request", { _email: v.email, _channel: v.channel, _contact: v.contact, _name: v.name || null, _notes: v.notes || null });
        box.innerHTML = `<div class="ex-done">${ic("check", 34)}<h3>تم استلام طلبك رقم #${esc(n)}</h3><p>سيتواصل معك الدعم الفني أو المدير عبر <b>${esc(CH[v.channel] || "")}</b> على <b dir="ltr">${esc(v.contact)}</b> ويرسل لك كلمة المرور الجديدة لحساب <b dir="ltr">${esc(v.email)}</b>.</p>
          <button type="button" class="btn btn-ghost btn-block" data-ex-open-chat>${ic("chat", 18)} متابعة مع الدعم الفني بالدردشة</button></div>`;
        box.querySelector("[data-ex-open-chat]").onclick = () => openWidget();
      } catch (er) { toast(errText(er), "err"); btn.disabled = false; }
    };
  }

  // ---------- ربط شاشة الدخول ----------
  function authRendered(mode) {
    const card = document.querySelector(".auth-card"); if (!card) return;
    if (!card.querySelector(".ex-visitor-tools")) {
      card.insertAdjacentHTML("beforeend", `<div class="ex-visitor-tools"><div class="ex-or"><span>للزوار</span></div>
        <button type="button" class="btn btn-ghost btn-block" data-ex-v="support">${ic("chat", 18)} تواصل مع الدعم الفني (دردشة)</button>
        <button type="button" class="btn btn-line btn-block" data-ex-v="join">${ic("key", 18)} الدخول إلى دردشة بالكود</button></div>`);
      card.querySelector('[data-ex-v="support"]').onclick = () => openWidget();
      card.querySelector('[data-ex-v="join"]').onclick = () => openJoin("");
    }
    if (mode === "reset") injectPasswordRequest(card);
    renderLauncher();
    const h = location.hash.replace(/^#\/?/, "");
    if (!RM.auto && h.indexOf("join") === 0) { RM.auto = true; openJoin(decodeURIComponent(h.split("/")[1] || "")); }
  }
  window.addEventListener("hashchange", () => {
    if (C && !C.S.user && location.hash.indexOf("#/join") === 0) openJoin(decodeURIComponent(location.hash.split("/")[2] || ""));
  });

  // =====================================================================
  //  الدعم الفني (للموظفين): طلبات كلمات المرور • محادثات الزوار
  // =====================================================================
  const me = () => (C && C.S.user && C.S.user.id) || null;
  const tMap = (t) => (m) => ({ id: m.id, created_at: m.created_at, body: m.body, sys: m.sender === "system", mine: m.sender === "staff" && m.staff_id === me(), staff: m.sender === "staff", name: m.sender === "visitor" ? (t && t.visitor_name) || "الزائر" : staffName(m.staff_id) });
  const QUICK = ["أهلاً بك في هوم ماربل، كيف أقدر أساعدك؟", "تم استلام طلبك وجاري المتابعة.", "تم إرسال كلمة المرور الجديدة على وسيلة التواصل التي أرسلتها.", "ممكن رقم الطلب أو رقم الجوال المسجل؟", "شكراً لتواصلك معنا 🌷"];
  const pwMessage = (r, pass) => `مرحباً ${r.full_name || ""}، معك الدعم الفني لهوم ماربل.\nتم تعيين كلمة مرور جديدة لحسابك:\nالبريد: ${r.account_email}\nكلمة المرور: ${pass}\nيرجى تسجيل الدخول وتغييرها من إعدادات حسابك.`;
  const helloMessage = (r) => `مرحباً ${r.full_name || ""}، معك الدعم الفني لهوم ماربل بخصوص طلب استعادة كلمة المرور لحساب ${r.account_email} (طلب رقم #${r.request_no}).`;

  function pageSupport() {
    if (!isSupport()) return noAccess();
    const tab = E.f.supTab || "pw";
    const st = E.f.reqSt == null ? "open" : E.f.reqSt;
    const q = normTxt(E.f.reqQ || "");
    const reqs = E.reqs.filter((r) => (st === "open" ? ["new", "in_progress"].includes(r.status) : !st || r.status === st) && (!q || normTxt(`${r.account_email} ${r.full_name || ""} ${r.contact_value} ${r.request_no}`).includes(q)));
    const tq = normTxt(E.f.thQ || "");
    const tst = E.f.thSt == null ? "open" : E.f.thSt;
    const threads = E.threads.filter((t) => (!tst || t.status === tst) && (!tq || normTxt(`${t.visitor_name} ${t.visitor_contact || ""} ${t.subject || ""} ${t.thread_no}`).includes(tq)));
    const unread = E.threads.filter((t) => t.staff_unread > 0).length;
    return `<div class="page-head"><div><h1>الدعم الفني</h1><div class="sub">طلبات نسيان كلمات المرور ومحادثات الزوار — تظهر لحظياً لكل موظفي الدعم</div></div>
      <div class="filters"><button class="btn btn-ghost" data-act="ex-pw-any">${ic("key", 18)} تعيين كلمة مرور لحساب</button></div></div>
      ${missingBanner()}
      <div class="grid g4">${kpi("طلبات جديدة", E.reqs.filter((r) => r.status === "new").length, "طلب كلمة مرور", "key")}${kpi("جاري التواصل", E.reqs.filter((r) => r.status === "in_progress").length, "طلب", "phone")}${kpi("محادثات مفتوحة", E.threads.filter((t) => t.status === "open").length, "محادثة", "chat")}${kpi("رسائل غير مقروءة", E.threads.reduce((a, t) => a + Number(t.staff_unread || 0), 0), `في ${unread} محادثة`, "bell")}</div>
      <div class="card mt"><div class="tabbar"><button data-exf-tab="supTab:pw" class="${tab === "pw" ? "on" : ""}">${ic("key", 16)} طلبات نسيان كلمة المرور</button><button data-exf-tab="supTab:chat" class="${tab === "chat" ? "on" : ""}">${ic("chat", 16)} محادثات الزوار ${unread ? `<span class="badge b-red">${unread}</span>` : ""}</button></div>
      ${tab === "pw" ? `<div class="filters" style="margin-bottom:12px"><input class="input" data-exf="reqQ" placeholder="بحث بالبريد أو الاسم أو رقم التواصل" value="${esc(E.f.reqQ || "")}"><select class="input" data-exf="reqSt"><option value="open" ${st === "open" ? "selected" : ""}>المفتوحة</option><option value="" ${st === "" ? "selected" : ""}>الكل</option>${Object.keys(REQ_ST).map((k) => `<option value="${k}" ${st === k ? "selected" : ""}>${REQ_ST[k][0]}</option>`).join("")}</select></div>
        <div class="tbl-wrap"><table><thead><tr><th>#</th><th>بريد الحساب</th><th>الاسم</th><th>التواصل عبر</th><th>رقم / بريد التواصل</th><th>التاريخ</th><th>الحالة</th><th>المسؤول</th><th></th></tr></thead><tbody>
        ${reqs.map((r) => `<tr><td>${r.request_no}</td><td dir="ltr" style="text-align:right"><b>${esc(r.account_email)}</b></td><td>${esc(r.full_name || "—")}</td><td>${esc(CH[r.contact_channel] || r.contact_channel)}</td><td dir="ltr" style="text-align:right">${esc(r.contact_value)}</td><td>${dt(r.created_at)}</td><td>${bdg(REQ_ST, r.status)}</td><td>${r.handled_by ? esc(staffName(r.handled_by)) : "—"}</td>
          <td class="p2-actions">${["new", "in_progress"].includes(r.status) ? `<button class="btn btn-sm btn-primary" data-act="ex-req-set" data-id="${r.id}">${ic("key", 14)} كلمة مرور جديدة</button>` : ""}${contactLinks(r.contact_value, helloMessage(r))}<button class="btn btn-sm btn-ghost" data-act="ex-req-view" data-id="${r.id}" title="التفاصيل">${ic("file", 14)}</button>${r.status !== "done" ? `<button class="btn btn-sm btn-success" data-act="ex-req-status" data-id="${r.id}" data-status="done" title="تم">${ic("check", 14)}</button>` : ""}${["new", "in_progress"].includes(r.status) ? `<button class="btn btn-sm btn-line" data-act="ex-req-status" data-id="${r.id}" data-status="rejected" title="رفض">${ic("x", 14)}</button>` : ""}</td></tr>`).join("") || '<tr><td colspan="9" class="empty">لا توجد طلبات</td></tr>'}
        </tbody></table></div>`
      : `<div class="filters" style="margin-bottom:12px"><input class="input" data-exf="thQ" placeholder="بحث باسم الزائر أو التواصل" value="${esc(E.f.thQ || "")}"><select class="input" data-exf="thSt"><option value="open" ${tst === "open" ? "selected" : ""}>المفتوحة</option><option value="closed" ${tst === "closed" ? "selected" : ""}>المغلقة</option><option value="" ${tst === "" ? "selected" : ""}>الكل</option></select></div>
        <div class="tbl-wrap"><table><thead><tr><th>#</th><th>الزائر</th><th>التواصل</th><th>الموضوع</th><th>آخر رسالة</th><th>من</th><th>غير مقروء</th><th>الحالة</th><th>الموظف</th></tr></thead><tbody>
        ${threads.map((t) => `<tr class="click ${t.staff_unread ? "ex-unread" : ""}" data-href="#/support-thread/${t.id}"><td>${t.thread_no}</td><td><b>${esc(t.visitor_name)}</b></td><td dir="ltr" style="text-align:right">${esc(t.visitor_contact || "—")}</td><td>${esc(t.subject || "—")}</td><td>${dt(t.last_message_at)}</td><td>${t.last_sender === "visitor" ? '<span class="badge b-orange">الزائر</span>' : '<span class="badge b-blue">الدعم</span>'}</td><td>${t.staff_unread ? `<span class="badge b-red">${t.staff_unread}</span>` : "—"}</td><td>${t.status === "open" ? '<span class="badge b-green">مفتوحة</span>' : '<span class="badge b-gray">مغلقة</span>'}</td><td>${t.assigned_to ? esc(staffName(t.assigned_to)) : "—"}</td></tr>`).join("") || '<tr><td colspan="9" class="empty">لا توجد محادثات</td></tr>'}
        </tbody></table></div>`}</div>`;
  }

  function pageThread(id) {
    if (!isSupport()) return noAccess();
    const t = E.threads.find((x) => x.id === id);
    if (!t) return '<div class="empty">المحادثة غير موجودة</div>';
    const c = E.msgs[id] || { list: [], loaded: false };
    return `<div class="page-head"><div><h1>محادثة #${t.thread_no} — ${esc(t.visitor_name)}</h1><div class="sub"><a href="#/support">${ic("chevron", 14)} الدعم الفني</a> · ${esc(t.subject || "بدون موضوع")} · ${t.status === "open" ? '<span class="badge b-green">مفتوحة</span>' : '<span class="badge b-gray">مغلقة</span>'}</div></div>
      <div class="filters">${contactLinks(t.visitor_contact, `مرحباً ${t.visitor_name}، معك الدعم الفني لهوم ماربل.`)}${t.status === "open" ? `<button class="btn btn-line" data-act="ex-thread-status" data-id="${t.id}" data-status="closed">${ic("check", 18)} إغلاق المحادثة</button>` : `<button class="btn btn-ghost" data-act="ex-thread-status" data-id="${t.id}" data-status="open">إعادة فتح</button>`}${isMgr() ? `<button class="btn btn-danger" data-act="ex-thread-del" data-id="${t.id}">${ic("trash", 18)}</button>` : ""}</div></div>
      <div class="grid g-wide">
        <div class="card ex-chatcard"><div class="ex-msgs ex-msgs-page" id="ex-tmsgs" data-loaded="${c.loaded ? 1 : 0}">${c.loaded ? (c.list.length ? c.list.map(tMap(t)).map(bubble).join("") : '<div class="ex-empty-chat">لا توجد رسائل</div>') : '<div class="ex-empty-chat">جاري تحميل الرسائل...</div>'}</div>
          <div class="ex-quick">${QUICK.map((qq, i) => `<button type="button" class="ex-chip" data-exquick="${i}">${esc(qq)}</button>`).join("")}</div>
          <form class="ex-send" id="ex-tsend"><textarea class="input" name="body" rows="2" placeholder="اكتب ردك للزائر... (Enter للإرسال)" required maxlength="4000" data-exdraft="thread-${t.id}"></textarea><button class="btn btn-primary" type="submit">${ic("send", 18)} إرسال</button></form></div>
        <div class="card"><div class="card-head"><h3>بيانات الزائر</h3></div><dl class="kv"><dt>الاسم</dt><dd>${esc(t.visitor_name)}</dd><dt>التواصل</dt><dd dir="ltr" style="text-align:right">${esc(t.visitor_contact || "—")}</dd><dt>الموضوع</dt><dd>${esc(t.subject || "—")}</dd><dt>بدأت</dt><dd>${dt(t.created_at)}</dd><dt>آخر رسالة</dt><dd>${dt(t.last_message_at)}</dd><dt>الموظف</dt><dd>${t.assigned_to ? esc(staffName(t.assigned_to)) : "—"}</dd></dl>
          <p class="p2-muted mt">الزائر يرى ردودك فوراً في نافذة الدردشة على شاشة الدخول، من أي جهاز أو بلد.</p></div>
      </div>`;
  }

  async function threadFetch(id, full) {
    const c = E.msgs[id] || (E.msgs[id] = { list: [], last: null, loaded: false });
    if (c.busy) return; c.busy = true;
    try {
      let q = sb().from("support_messages").select("*").eq("thread_id", id);
      if (c.last && !full && q.gt) q = q.gt("created_at", c.last);
      const r = await q.order("created_at", { ascending: true });
      if (r.error) throw r.error;
      const have = new Set(c.list.map((m) => m.id));
      const add = (r.data || []).filter((m) => !have.has(m.id));
      if (add.length) { c.list = c.list.concat(add); c.last = c.list[c.list.length - 1].created_at; }
      const t = E.threads.find((x) => x.id === id);
      const box = document.getElementById("ex-tmsgs");
      if (box && route()[1] === id) {
        if (box.dataset.loaded !== "1") { paintMsgs(box, c.list.map(tMap(t)), "لا توجد رسائل"); box.dataset.loaded = "1"; }
        else appendMsgs(box, add.map(tMap(t)));
      }
      c.loaded = true;
      if (t && Number(t.staff_unread) > 0) { t.staff_unread = 0; await sb().from("support_threads").update({ staff_unread: 0 }).eq("id", id); }
    } catch (er) { console.error("[extras] thread", er); }
    c.busy = false;
  }

  async function threadSend(id, body) {
    const r = await sb().from("support_messages").insert({ thread_id: id, sender: "staff", body });
    if (r.error) throw r.error;
    const t = E.threads.find((x) => x.id === id);
    if (t && t.status === "closed") { await sb().from("support_threads").update({ status: "open" }).eq("id", id); t.status = "open"; }
    await threadFetch(id);
  }

  // ---------- تعيين كلمة مرور جديدة ----------
  function setPasswordForm(req, email) {
    const r = req || { account_email: email || "", full_name: "", contact_value: "", request_no: "" };
    const ov = modalForm(req ? `كلمة مرور جديدة — طلب #${r.request_no}` : "تعيين كلمة مرور جديدة لحساب", `
      ${field("بريد الحساب *", `<input class="input" type="email" name="email" required dir="ltr" value="${esc(r.account_email)}" ${req ? "readonly" : ""}>`)}
      <div id="ex-acc" class="ex-acc p2-muted">${req ? "جاري التحقق من الحساب..." : "اكتب البريد ثم اضغط «تحقق»"}</div>
      ${req ? "" : '<button type="button" class="btn btn-ghost btn-sm" id="ex-acc-check">تحقق من الحساب</button>'}
      ${field("كلمة المرور الجديدة *", `<div class="ex-passrow"><input class="input" name="password" required minlength="6" dir="ltr" value="${genPass()}"><button type="button" class="btn btn-line btn-sm" id="ex-gen" title="توليد">${ic("refresh", 14)}</button><button type="button" class="btn btn-line btn-sm" id="ex-cp" title="نسخ">${ic("copy", 14)}</button></div>`, "mt")}
      ${req ? `<div class="p2-info">${ic("phone", 18)} بعد الحفظ ستظهر لك أزرار إرسال كلمة المرور للعميل عبر ${esc(CH[r.contact_channel] || "")}: <b dir="ltr">${esc(r.contact_value)}</b></div>` : ""}`, "تعيين كلمة المرور", async (v) => {
      const em = v.email.trim();
      await rpc("hm_support_set_password", { _email: em, _password: v.password, _request: req ? req.id : null });
      C.closeModal();
      showPasswordResult(Object.assign({}, r, { account_email: em }), v.password, req);
      await C.refresh();
    });
    const accBox = ov.querySelector("#ex-acc");
    const check = async () => {
      const em = ov.querySelector("[name=email]").value.trim(); if (!em) return;
      accBox.textContent = "جاري التحقق...";
      try {
        const a = await rpc("hm_lookup_account", { _email: em });
        accBox.className = "ex-acc " + (a.found ? "ok" : "bad");
        accBox.innerHTML = a.found ? `${ic("check", 16)} الحساب موجود: <b>${esc(a.full_name || a.email)}</b>${(a.roles || []).length ? " — " + a.roles.map((x) => esc(C.ROLE_LABEL[x] || x)).join("، ") : " — بانتظار التفعيل"}` : `${ic("alert", 16)} لا يوجد حساب بهذا البريد في النظام — تأكد من البريد مع العميل`;
      } catch (er) { accBox.className = "ex-acc bad"; accBox.textContent = errText(er); }
    };
    if (req) check(); else ov.querySelector("#ex-acc-check").onclick = check;
    ov.querySelector("#ex-gen").onclick = () => (ov.querySelector("[name=password]").value = genPass());
    ov.querySelector("#ex-cp").onclick = () => copyText(ov.querySelector("[name=password]").value);
  }

  function showPasswordResult(r, pass, req) {
    const msg = pwMessage(r, pass);
    const ov = C.modal("تم تعيين كلمة المرور الجديدة ✓", `<div class="ex-done">${ic("check", 34)}<p>حساب <b dir="ltr">${esc(r.account_email)}</b></p><div class="ex-bigpass" dir="ltr">${esc(pass)}</div></div>
      ${field("الرسالة للعميل", `<textarea class="input" rows="5" id="ex-pwmsg">${esc(msg)}</textarea>`)}
      <div class="filters">${r.contact_value ? contactLinks(r.contact_value, msg) : ""}<button type="button" class="btn btn-sm btn-ghost" id="ex-cpmsg">${ic("copy", 14)} نسخ الرسالة</button></div>`,
      req ? `<button class="btn btn-success" id="ex-delivered">${ic("check", 18)} تم إرسالها للعميل — إغلاق الطلب</button><button class="btn btn-line" data-close>لاحقاً</button>` : `<button class="btn btn-line" data-close>إغلاق</button>`);
    ov.querySelector("#ex-cpmsg").onclick = () => copyText(ov.querySelector("#ex-pwmsg").value);
    const dl = ov.querySelector("#ex-delivered");
    if (dl) dl.onclick = async () => {
      const x = await run(sb().from("support_password_requests").update({ status: "done", handled_by: me(), handled_at: new Date().toISOString(), resolution: (req.resolution ? req.resolution + "\n" : "") + "تم إرسال كلمة المرور الجديدة للعميل عبر " + (CH[req.contact_channel] || "") }).eq("id", req.id), "تم إغلاق الطلب ✓");
      if (x) { C.closeModal(); await C.refresh(); }
    };
  }

  function requestDetails(r) {
    C.modal(`طلب كلمة مرور #${r.request_no}`, `<dl class="kv"><dt>بريد الحساب</dt><dd dir="ltr" style="text-align:right">${esc(r.account_email)}</dd><dt>الاسم</dt><dd>${esc(r.full_name || "—")}</dd><dt>التواصل عبر</dt><dd>${esc(CH[r.contact_channel] || "")}</dd><dt>رقم / بريد التواصل</dt><dd dir="ltr" style="text-align:right">${esc(r.contact_value)}</dd><dt>ملاحظات العميل</dt><dd style="white-space:pre-wrap">${esc(r.notes || "—")}</dd><dt>التاريخ</dt><dd>${dt(r.created_at)}</dd><dt>الحالة</dt><dd>${bdg(REQ_ST, r.status)}</dd><dt>المسؤول</dt><dd>${r.handled_by ? esc(staffName(r.handled_by)) + " · " + dt(r.handled_at) : "—"}</dd><dt>سجل المعالجة</dt><dd style="white-space:pre-wrap">${esc(r.resolution || "—")}</dd></dl>
      <div class="filters mt">${contactLinks(r.contact_value, helloMessage(r))}</div>`);
  }

  // =====================================================================
  //  الدردشات بالكود (المدير / المدير التنفيذي يولّد الكود ويشاركه)
  // =====================================================================
  const joinLink = (code) => location.href.split("#")[0] + "#/join/" + code;
  const shareText = (title, code) => `انضم إلى دردشة هوم ماربل «${title}»\nالكود: ${code}\nالرابط: ${joinLink(code)}`;
  const roomActive = (r) => r.is_active && (!r.expires_at || new Date(r.expires_at) > new Date());

  function pageChats() {
    if (!isStaff()) return noAccess();
    const mine = Object.entries(savedRooms()).map(([id, v]) => Object.assign({ id }, v));
    const q = normTxt(E.f.roomQ || "");
    const rooms = E.rooms.filter((r) => !q || normTxt(`${r.code} ${r.title}`).includes(q));
    return `<div class="page-head"><div><h1>الدردشات</h1><div class="sub">${isMgr() ? "ولّد كود دردشة وشاركه مع الزوار أو العملاء أو الموظفين — من يكتب نفس الكود يدخل الدردشة فوراً" : "ادخل أي دردشة بالكود الذي أرسله لك المدير"}</div></div>
      ${isMgr() ? `<div class="filters"><button class="btn btn-primary" data-act="ex-room-new">${ic("plus", 18)} توليد كود دردشة جديدة</button></div>` : ""}</div>
      ${missingBanner()}
      <div class="grid g2">
        <div class="card"><div class="card-head"><h3>${ic("key")} الدخول بالكود</h3></div>
          <form id="ex-joinpage" class="ex-joinline" onsubmit="return false"><input class="input ex-code-in" name="code" required maxlength="12" dir="ltr" placeholder="اكتب الكود" autocomplete="off"><button class="btn btn-primary" type="submit">${ic("chat", 18)} دخول</button></form>
          <p class="p2-muted mt">الزوار بدون حساب يستطيعون الدخول من شاشة تسجيل الدخول ← «الدخول إلى دردشة بالكود»، أو من الرابط المرسل لهم.</p></div>
        <div class="card"><div class="card-head"><h3>${ic("chat")} دردشاتي</h3></div>${mine.length ? `<div class="tbl-wrap"><table><thead><tr><th>الدردشة</th><th>الكود</th><th></th></tr></thead><tbody>${mine.map((m) => `<tr><td><a href="#/room/${m.id}"><b>${esc(m.title || "دردشة")}</b></a></td><td dir="ltr" class="ex-code">${esc(m.code)}</td><td class="p2-actions"><a class="btn btn-sm btn-ghost" href="#/room/${m.id}">فتح</a><button class="btn btn-sm btn-line" data-act="ex-room-forget" data-id="${m.id}" title="إزالة من القائمة">${ic("x", 14)}</button></td></tr>`).join("")}</tbody></table></div>` : '<div class="empty">لم تنضم لأي دردشة بعد</div>'}</div>
      </div>
      ${isMgr() ? `<div class="card mt"><div class="card-head"><h3>إدارة الدردشات</h3><input class="input" style="max-width:240px" data-exf="roomQ" placeholder="بحث بالكود أو العنوان" value="${esc(E.f.roomQ || "")}"></div>
        <div class="tbl-wrap"><table><thead><tr><th>الكود</th><th>العنوان</th><th>الأعضاء</th><th>آخر رسالة</th><th>تنتهي</th><th>الحالة</th><th></th></tr></thead><tbody>
        ${rooms.map((r) => { const n = E.members.filter((m) => m.room_id === r.id).length; const act = roomActive(r); return `<tr><td dir="ltr" class="ex-code">${esc(r.code)}</td><td><a href="#/room/${r.id}"><b>${esc(r.title)}</b></a></td><td>${n}</td><td>${dt(r.last_message_at)}</td><td>${r.expires_at ? dt(r.expires_at) : "بدون انتهاء"}</td><td>${act ? '<span class="badge b-green">نشطة</span>' : '<span class="badge b-gray">مغلقة</span>'}</td>
          <td class="p2-actions"><a class="btn btn-sm btn-primary" href="#/room/${r.id}">${ic("chat", 14)} فتح</a><button class="btn btn-sm btn-line" data-act="ex-room-copy" data-code="${esc(r.code)}" data-title="${esc(r.title)}" title="نسخ الكود والرابط">${ic("copy", 14)}</button><a class="btn btn-sm btn-success" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent(shareText(r.title, r.code))}" title="مشاركة واتساب">${ic("chat", 14)}</a><button class="btn btn-sm btn-ghost" data-act="ex-room-toggle" data-id="${r.id}">${act ? "إغلاق" : "إعادة فتح"}</button><button class="btn btn-sm btn-danger" data-act="ex-room-del" data-id="${r.id}">${ic("trash", 14)}</button></td></tr>`; }).join("") || '<tr><td colspan="7" class="empty">لا توجد دردشات — ولّد كوداً جديداً</td></tr>'}
        </tbody></table></div></div>` : ""}`;
  }

  function roomInfo(id) {
    const r = E.rooms.find((x) => x.id === id);
    const s = savedRooms()[id];
    const c = E.room[id] || {};
    return { title: (c.info && c.info.title) || (r && r.title) || (s && s.title) || "دردشة", code: (c.info && c.info.code) || (r && r.code) || (s && s.code) || "", token: s ? s.token : null, row: r };
  }

  function pageRoom(id) {
    if (!isStaff()) return noAccess();
    const info = roomInfo(id);
    if (!info.token && !isMgr()) return `<div class="empty">لست عضواً في هذه الدردشة — <a href="#/chats">ادخل بالكود</a></div>`;
    const c = E.room[id] || { list: [], loaded: false, info: null };
    const act = c.info ? c.info.active : info.row ? roomActive(info.row) : true;
    return `<div class="page-head"><div><h1>${esc(info.title)}</h1><div class="sub"><a href="#/chats">${ic("chevron", 14)} الدردشات</a> · الكود: <b dir="ltr" class="ex-code">${esc(info.code)}</b> · <span id="ex-sronline">${c.info ? `${num(c.info.online)} متصل الآن من ${num(c.info.members)}` : ""}</span></div></div>
      <div class="filters"><button class="btn btn-line" data-act="ex-room-copy" data-code="${esc(info.code)}" data-title="${esc(info.title)}">${ic("copy", 18)} نسخ الكود والرابط</button><a class="btn btn-success" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent(shareText(info.title, info.code))}">${ic("chat", 18)} مشاركة واتساب</a>${isMgr() && info.row ? `<button class="btn btn-ghost" data-act="ex-room-toggle" data-id="${id}">${act ? "إغلاق الدردشة" : "إعادة فتح"}</button>` : ""}</div></div>
      <div class="card ex-chatcard"><div class="ex-msgs ex-msgs-page" id="ex-srmsgs" data-loaded="${c.loaded ? 1 : 0}">${c.loaded ? (c.list.length ? c.list.map(rMap).map(bubble).join("") : '<div class="ex-empty-chat">لا توجد رسائل بعد</div>') : '<div class="ex-empty-chat">جاري التحميل...</div>'}</div>
        ${act ? `<form class="ex-send" id="ex-srsend"><textarea class="input" name="body" rows="2" placeholder="اكتب رسالتك... (Enter للإرسال)" required maxlength="4000" data-exdraft="room-${id}"></textarea><button class="btn btn-primary" type="submit">${ic("send", 18)} إرسال</button></form>` : '<div class="ex-closed">هذه الدردشة مغلقة</div>'}</div>`;
  }

  async function staffRoomFetch(id) {
    const c = E.room[id] || (E.room[id] = { list: [], last: null, loaded: false, info: null });
    if (c.busy) return; c.busy = true;
    try {
      const info = roomInfo(id);
      const d = await rpc("hm_room_fetch", { _room: id, _token: info.token, _after: c.last });
      const prevActive = c.info ? c.info.active : null;
      c.info = { title: d.title, code: d.code, active: d.active, members: d.members, online: d.online };
      const list = d.messages || [];
      const have = new Set(c.list.map((m) => m.id));
      const add = list.filter((m) => !have.has(m.id));
      if (add.length) { c.list = c.list.concat(add); c.last = c.list[c.list.length - 1].created_at; }
      const box = document.getElementById("ex-srmsgs");
      if (box && route()[1] === id) {
        if (box.dataset.loaded !== "1") { paintMsgs(box, c.list.map(rMap), "لا توجد رسائل بعد"); box.dataset.loaded = "1"; }
        else appendMsgs(box, add.map(rMap));
        const on = document.getElementById("ex-sronline"); if (on) on.textContent = `${num(d.online)} متصل الآن من ${num(d.members)}`;
      }
      c.loaded = true;
      if (prevActive !== null && prevActive !== d.active && route()[1] === id) C.render(true);
    } catch (er) {
      if (/لست عضواً/.test(errText(er))) { forgetRoom(id); if (route()[1] === id) { toast("انتهت عضويتك في هذه الدردشة", "err"); location.hash = "#/chats"; } }
      else console.error("[extras] room", er);
    }
    c.busy = false;
  }

  function newRoomForm() {
    modalForm("توليد كود دردشة جديدة", `${field("عنوان الدردشة *", '<input class="input" name="title" required maxlength="80" placeholder="مثال: استفسارات العملاء — معرض الرياض">')}
      ${field("مدة صلاحية الكود", '<select class="input" name="hours"><option value="0">بدون انتهاء (حتى أغلقها)</option><option value="1">ساعة واحدة</option><option value="24" selected>24 ساعة</option><option value="72">3 أيام</option><option value="168">أسبوع</option><option value="720">شهر</option></select>')}
      <p class="p2-muted">سيتم توليد كود من 6 خانات. أي شخص يكتب نفس الكود (زائر أو موظف) يدخل الدردشة مباشرة ويرى الرسائل لحظياً.</p>`, "توليد الكود", async (v) => {
      const d = await rpc("hm_room_create", { _title: v.title, _hours: Number(v.hours || 0) });
      saveRoom({ room_id: d.id, token: d.token, code: d.code, title: d.title, name: (C.S.profile && C.S.profile.full_name) || "" });
      C.closeModal();
      const ov = C.modal("تم توليد الكود ✓", `<div class="ex-done">${ic("key", 34)}<p>شارك هذا الكود مع من تريد</p><div class="ex-bigpass" dir="ltr">${esc(d.code)}</div><p class="p2-muted" dir="ltr" style="word-break:break-all">${esc(joinLink(d.code))}</p></div>`,
        `<a class="btn btn-primary" href="#/room/${d.id}" id="ex-go-room">${ic("chat", 18)} فتح الدردشة</a><button class="btn btn-ghost" id="ex-cp-code">${ic("copy", 18)} نسخ</button><a class="btn btn-success" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent(shareText(d.title, d.code))}">${ic("chat", 18)} واتساب</a>`);
      ov.querySelector("#ex-cp-code").onclick = () => copyText(shareText(d.title, d.code));
      ov.querySelector("#ex-go-room").onclick = () => C.closeModal();
      await C.refresh();
    });
  }

  function pageJoin(code) {
    return `<div class="page-head"><div><h1>الدخول إلى دردشة بالكود</h1></div></div><div class="card" style="max-width:520px">
      <form id="ex-joinpage" class="ex-joinline" onsubmit="return false"><input class="input ex-code-in" name="code" required maxlength="12" dir="ltr" placeholder="اكتب الكود" value="${esc(String(code || "").toUpperCase())}" autocomplete="off"><button class="btn btn-primary" type="submit">${ic("chat", 18)} دخول</button></form></div>`;
  }

  // =====================================================================
  //  استيراد العملاء من Excel / CSV (آلاف العملاء دفعة واحدة)
  // =====================================================================
  const COL_ALIASES = {
    name: ["الاسم", "اسم العميل", "اسم", "العميل", "الاسم الكامل", "name", "customer", "customer name", "full name", "client"],
    phone: ["الجوال", "رقم الجوال", "الهاتف", "رقم الهاتف", "جوال", "موبايل", "رقم", "phone", "mobile", "tel", "telephone", "phone number", "whatsapp", "واتساب"],
    email: ["البريد", "البريد الإلكتروني", "الايميل", "ايميل", "email", "e-mail", "mail"],
    city: ["المدينة", "مدينة", "city"],
    address: ["العنوان", "عنوان", "الحي", "address", "location"],
    branch: ["الفرع", "المعرض", "فرع", "branch", "showroom"],
    notes: ["ملاحظات", "ملاحظة", "notes", "note", "comments"],
  };
  const FIELD_AR = { name: "الاسم *", phone: "الجوال", email: "البريد", city: "المدينة", address: "العنوان", branch: "الفرع", notes: "ملاحظات" };
  function guessCol(headers, key) {
    const al = COL_ALIASES[key].map(normTxt);
    let i = headers.findIndex((h) => al.includes(normTxt(h)));
    if (i < 0) i = headers.findIndex((h) => { const n = normTxt(h); return n && al.some((a) => a.length > 2 && n.includes(a)); });
    return i;
  }
  function parseCSV(text) {
    text = String(text || "").replace(/^\uFEFF/, "");
    const first = text.split(/\r?\n/)[0] || "";
    const sep = [",", ";", "\t"].sort((a, b) => first.split(b).length - first.split(a).length)[0];
    const rows = []; let row = [], cell = "", q = false;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (q) { if (ch === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += ch; }
      else if (ch === '"') q = true;
      else if (ch === sep) { row.push(cell); cell = ""; }
      else if (ch === "\n" || ch === "\r") { if (ch === "\r" && text[i + 1] === "\n") i++; row.push(cell); rows.push(row); row = []; cell = ""; }
      else cell += ch;
    }
    if (cell !== "" || row.length) { row.push(cell); rows.push(row); }
    return rows.filter((r) => r.some((c) => String(c).trim() !== ""));
  }
  async function readSheet(file) {
    const name = (file.name || "").toLowerCase();
    if (name.endsWith(".csv") || name.endsWith(".txt")) return parseCSV(await readFile(file, "text"));
    const X = await loadXLSX();
    const wb = X.read(await readFile(file), { type: "array" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    return X.utils.sheet_to_json(ws, { header: 1, defval: "", raw: false }).filter((r) => r.some((c) => String(c).trim() !== ""));
  }
  const csvOf = (rows) => "\uFEFF" + rows.map((r) => r.map((c) => `"${String(c == null ? "" : c).replace(/"/g, '""')}"`).join(",")).join("\r\n");

  async function downloadTemplate() {
    const rows = [["الاسم", "الجوال", "البريد", "المدينة", "العنوان", "الفرع", "ملاحظات"], ["محمد أحمد", "0500000001", "m@example.com", "الرياض", "حي النرجس", (C.S.branches[0] || {}).name || "معرض الرياض", "عميل جديد"], ["سارة علي", "0550000002", "", "الخرج", "", "", ""]];
    try { const X = await loadXLSX(); X.writeFile(makeWorkbook([{ name: "العملاء", rows }]), "قالب_استيراد_العملاء.xlsx"); }
    catch (er) { download("قالب_استيراد_العملاء.csv", csvOf(rows), "text/csv;charset=utf-8"); }
  }

  function importCustomers() {
    if (!C.canSell()) return toast("لا تملك صلاحية إضافة العملاء", "err");
    const ov = C.modal("استيراد العملاء من Excel", `<div class="ex-drop" id="ex-drop">${ic("upload", 40)}<b>اسحب ملف Excel أو CSV هنا أو اضغط للاختيار</b><small>يدعم .xlsx و .xls و .csv — حتى آلاف العملاء دفعة واحدة. الصف الأول يجب أن يحتوي عناوين الأعمدة.</small></div>
      <div class="filters mt"><button type="button" class="btn btn-ghost btn-sm" id="ex-tpl">${ic("download", 14)} تحميل قالب جاهز</button></div><div id="ex-imp-body"></div>`, `<button class="btn btn-line" data-close>إغلاق</button>`);
    ov.querySelector(".modal").classList.add("modal-wide");
    ov.querySelector("#ex-tpl").onclick = downloadTemplate;
    const drop = ov.querySelector("#ex-drop");
    const handle = async (file) => {
      drop.classList.add("busy"); drop.querySelector("b").textContent = "جاري قراءة الملف...";
      try {
        const rows = await readSheet(file);
        if (rows.length < 2) throw new Error("الملف فارغ أو لا يحتوي إلا على صف العناوين");
        drop.classList.remove("busy"); drop.querySelector("b").textContent = `✓ ${file.name} — ${num(rows.length - 1)} صف`;
        mapStep(ov, rows);
      } catch (er) { drop.classList.remove("busy"); drop.querySelector("b").textContent = "اسحب ملف Excel أو CSV هنا أو اضغط للاختيار"; toast(errText(er), "err"); }
    };
    drop.onclick = () => pickFile(".xlsx,.xls,.csv,.txt", handle);
    drop.addEventListener("dragover", (e) => { e.preventDefault(); drop.classList.add("over"); });
    drop.addEventListener("dragleave", () => drop.classList.remove("over"));
    drop.addEventListener("drop", (e) => { e.preventDefault(); drop.classList.remove("over"); const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]; if (f) handle(f); });
    E._importHandle = handle;
  }

  function mapStep(ov, rows) {
    const headers = rows[0].map((h) => String(h || "").trim());
    const map = {}; Object.keys(COL_ALIASES).forEach((k) => (map[k] = guessCol(headers, k)));
    if (map.name < 0) map.name = 0;
    const body = ov.querySelector("#ex-imp-body");
    const colSel = (k) => `<select class="input" data-map="${k}"><option value="-1">— تجاهل —</option>${headers.map((h, i) => `<option value="${i}" ${map[k] === i ? "selected" : ""}>${esc(h || "عمود " + (i + 1))}</option>`).join("")}</select>`;
    body.innerHTML = `<h4 class="p2-h4 mt">ربط الأعمدة (تم التعرف تلقائياً — يمكنك التعديل)</h4>
      <div class="ex-mapgrid">${Object.keys(FIELD_AR).map((k) => field(FIELD_AR[k], colSel(k))).join("")}</div>
      <div class="grid2">${field("الفرع الافتراضي (عند عدم تحديده)", `<select class="input" id="ex-defbranch"><option value="">—</option>${C.S.branches.map((b) => `<option value="${b.id}" ${C.S.profile && C.S.profile.branch_id === b.id ? "selected" : ""}>${esc(b.name)}</option>`).join("")}</select>`)}
      ${field("العملاء المكررون (نفس الجوال أو البريد)", '<select class="input" id="ex-dupmode"><option value="skip">تخطّي المكرر (موصى به)</option><option value="update">تحديث بيانات العميل الموجود</option><option value="add">إضافته كعميل جديد</option></select>')}</div>
      <div id="ex-preview"></div>`;
    const preview = () => {
      body.querySelectorAll("[data-map]").forEach((s) => (map[s.dataset.map] = Number(s.value)));
      const res = buildRows(rows, map, body.querySelector("#ex-defbranch").value, body.querySelector("#ex-dupmode").value);
      body.querySelector("#ex-preview").innerHTML = `<div class="grid g4 mt">${kpi("جديد سيُضاف", num(res.inserts.length), "عميل", "userPlus")}${kpi("موجود مسبقاً", num(res.dups), res.mode === "update" ? "سيُحدّث" : res.mode === "skip" ? "سيُتخطّى" : "سيُضاف", "users")}${kpi("مكرر داخل الملف", num(res.fileDups), "سيُتخطّى", "layers")}${kpi("صفوف بدون اسم", num(res.invalid), "ستُتجاهل", "alert")}</div>
        <div class="tbl-wrap mt"><table><thead><tr><th>#</th><th>الاسم</th><th>الجوال</th><th>البريد</th><th>المدينة</th><th>الفرع</th><th>الحالة</th></tr></thead><tbody>${res.preview.map((p, i) => `<tr><td>${i + 1}</td><td>${esc(p.r.name || "—")}</td><td dir="ltr" style="text-align:right">${esc(p.r.phone || "")}</td><td>${esc(p.r.email || "")}</td><td>${esc(p.r.city || "")}</td><td>${esc(C.branchName(p.r.branch_id))}</td><td>${p.tag}</td></tr>`).join("")}</tbody></table></div>
        ${res.preview.length < res.total ? `<p class="p2-muted">معاينة أول ${res.preview.length} صف من ${num(res.total)}</p>` : ""}
        <div class="ex-progress" id="ex-prog" hidden><div></div><span></span></div>
        <button type="button" class="btn btn-primary btn-block mt" id="ex-do-import" ${res.inserts.length || res.updates.length ? "" : "disabled"}>${ic("upload", 18)} استيراد ${num(res.inserts.length)} عميل جديد${res.updates.length ? ` وتحديث ${num(res.updates.length)}` : ""}</button>`;
      body.querySelector("#ex-do-import").onclick = () => doImport(ov, res);
    };
    body.querySelectorAll("select").forEach((s) => (s.onchange = preview));
    preview();
  }

  function buildRows(rows, map, defBranch, mode) {
    const get = (r, k) => (map[k] >= 0 ? String(r[map[k]] == null ? "" : r[map[k]]).trim() : "");
    const byPhone = new Map(), byEmail = new Map();
    C.S.customers.forEach((c) => { const p = normPhone(c.phone); if (p) byPhone.set(p, c); if (c.email) byEmail.set(String(c.email).toLowerCase().trim(), c); });
    const brMap = new Map(); C.S.branches.forEach((b) => { brMap.set(normTxt(b.name), b.id); if (b.city) brMap.set(normTxt(b.city), b.id); });
    const seen = new Set(); const inserts = [], updates = [], preview = [];
    let dups = 0, fileDups = 0, invalid = 0;
    rows.slice(1).forEach((r) => {
      const name = get(r, "name");
      const rec = { name, phone: normPhone(get(r, "phone")) || null, email: get(r, "email").toLowerCase() || null, city: get(r, "city") || null, address: get(r, "address") || null, notes: get(r, "notes") || null, branch_id: null };
      const bt = normTxt(get(r, "branch")); let bid = null;
      if (bt) { bid = brMap.get(bt) || null; if (!bid) { const hit = [...brMap.entries()].find(([k]) => k && (k.includes(bt) || bt.includes(k))); if (hit) bid = hit[1]; } }
      rec.branch_id = bid || defBranch || null;
      let tag;
      if (!name) { invalid++; tag = '<span class="badge b-gray">بدون اسم</span>'; }
      else {
        const key = rec.phone || rec.email || "n:" + normTxt(name);
        if (seen.has(key)) { fileDups++; tag = '<span class="badge b-gray">مكرر في الملف</span>'; }
        else {
          seen.add(key);
          const ex = (rec.phone && byPhone.get(rec.phone)) || (rec.email && byEmail.get(rec.email));
          if (ex && mode !== "add") {
            dups++;
            if (mode === "update") { const u = { id: ex.id }; ["name", "phone", "email", "city", "address", "notes", "branch_id"].forEach((k) => { if (rec[k]) u[k] = rec[k]; }); updates.push(u); tag = '<span class="badge b-blue">تحديث</span>'; }
            else tag = '<span class="badge b-yellow">موجود — تخطّي</span>';
          } else { if (ex) dups++; inserts.push(rec); tag = '<span class="badge b-green">جديد</span>'; }
        }
      }
      if (preview.length < 50) preview.push({ r: rec, tag });
    });
    return { inserts, updates, preview, dups, fileDups, invalid, mode, total: rows.length - 1 };
  }

  async function doImport(ov, res) {
    const btn = ov.querySelector("#ex-do-import"); btn.disabled = true;
    const prog = ov.querySelector("#ex-prog"); prog.hidden = false;
    const bar = prog.querySelector("div"), lbl = prog.querySelector("span");
    const total = res.inserts.length + res.updates.length; let done = 0, failed = 0; const errs = [];
    const step = () => { bar.style.width = Math.round((done / Math.max(1, total)) * 100) + "%"; lbl.textContent = `${num(done)} / ${num(total)}`; };
    step();
    const uid = C.S.user.id;
    for (let i = 0; i < res.inserts.length; i += 200) {
      const chunk = res.inserts.slice(i, i + 200).map((r) => Object.assign({}, r, { created_by: uid }));
      const r = await sb().from("customers").insert(chunk);
      if (r.error) {
        for (const one of chunk) { const x = await sb().from("customers").insert(one); if (x.error) { failed++; if (errs.length < 5) errs.push(`${one.name}: ${errText(x.error)}`); } done++; }
      } else done += chunk.length;
      step();
    }
    for (const u of res.updates) {
      const id = u.id; const row = Object.assign({}, u); delete row.id;
      const r = await sb().from("customers").update(row).eq("id", id);
      if (r.error) { failed++; if (errs.length < 5) errs.push(errText(r.error)); }
      done++; if (done % 25 === 0) step();
    }
    step();
    C.closeModal();
    toast(`تم استيراد ${num(total - failed)} عميل بنجاح ويظهرون الآن عند كل المستخدمين${failed ? ` — تعذّر ${failed}` : ""} ✓`, failed ? "err" : "ok");
    if (errs.length) setTimeout(() => toast(errs.join(" • "), "err"), 400);
    await C.refresh();
  }

  async function exportCustomers() {
    const rows = [["الاسم", "الجوال", "البريد", "المدينة", "العنوان", "الفرع", "عدد الطلبات", "ملاحظات", "تاريخ الإضافة"]].concat(
      C.S.customers.map((c) => [c.name, c.phone || "", c.email || "", c.city || "", c.address || "", C.branchName(c.branch_id), C.S.orders.filter((o) => o.customer_id === c.id).length, c.notes || "", (c.created_at || "").slice(0, 10)]));
    try { const X = await loadXLSX(); X.writeFile(makeWorkbook([{ name: "العملاء", rows }]), `عملاء_هوم_ماربل_${stamp()}.xlsx`); toast(`تم تصدير ${num(rows.length - 1)} عميل ✓`, "ok"); }
    catch (er) { download(`عملاء_هوم_ماربل_${stamp()}.csv`, csvOf(rows), "text/csv;charset=utf-8"); }
  }

  // =====================================================================
  //  التقارير: التقاط ما على الشاشة • تصدير Excel • حفظ واستعادة بصيغة .hmr
  // =====================================================================
  const HMR_FORMAT = "homemarble-report";
  const BK_FORMAT = "homemarble-backup";
  const safeName = (s) => String(s || "تقرير").replace(/[\\/:*?"<>|]/g, " ").trim();
  function cellText(td) { return String(td.textContent || "").replace(/\s+/g, " ").trim(); }
  function captureScreen() {
    const main = document.querySelector("main.content");
    if (!main) return null;
    const title = (main.querySelector(".page-head h1") || {}).textContent || "تقرير";
    const sub = (main.querySelector(".page-head .sub") || {}).textContent || "";
    const kpis = Array.from(main.querySelectorAll(".kpi")).map((k) => ({ label: ((k.querySelector(".lbl") || {}).textContent || "").trim(), value: ((k.querySelector(".val") || {}).textContent || "").trim(), unit: ((k.querySelector(".unit") || {}).textContent || "").trim() })).filter((k) => k.label);
    const tables = Array.from(main.querySelectorAll("table")).map((t, i) => {
      const card = t.closest(".card"); const h = card && card.querySelector(".card-head h3, h4");
      const heads = Array.from(t.querySelectorAll("thead th")).map(cellText);
      const body = Array.from(t.querySelectorAll("tbody tr")).filter((tr) => !tr.querySelector("td[colspan]"));
      const keep = heads.map((h2, ci) => h2 !== "" || body.some((tr) => tr.children[ci] && cellText(tr.children[ci])));
      const rows = body.map((tr) => Array.from(tr.children).map(cellText).filter((_, ci) => keep[ci] !== false));
      return { title: (h && h.textContent.trim()) || `جدول ${i + 1}`, headers: heads.filter((_, ci) => keep[ci] !== false), rows };
    }).filter((t) => t.headers.length && t.rows.length);
    return { format: HMR_FORMAT, version: 1, title: title.trim(), subtitle: sub.trim(), route: C.S.route, created_at: new Date().toISOString(), created_by: (C.S.profile && C.S.profile.full_name) || C.S.user.email, kpis, tables };
  }
  function reportSheets(rep) {
    const sheets = [];
    const info = [["التقرير", rep.title], ["الوصف", rep.subtitle || ""], ["تاريخ الحفظ", dt(rep.created_at)], ["بواسطة", rep.created_by || ""], ["الصفحة", "#/" + (rep.route || "")], []];
    (rep.kpis || []).forEach((k) => info.push([k.label, k.value, k.unit]));
    sheets.push({ name: "ملخص", rows: info });
    (rep.tables || []).forEach((t) => sheets.push({ name: t.title, rows: [t.headers].concat(t.rows) }));
    return sheets;
  }
  async function exportExcel(rep) {
    if (!rep) return;
    const X = await loadXLSX();
    X.writeFile(makeWorkbook(reportSheets(rep)), `${safeName(rep.title)}_${stamp()}.xlsx`);
  }
  function exportHMR(rep) {
    if (!rep) return;
    download(`${safeName(rep.title)}_${stamp()}.hmr`, JSON.stringify(rep, null, 1), "application/json");
  }
  function printReport(rep) {
    if (!rep) return;
    const w = window.open("", "_blank"); if (!w) return toast("اسمح بالنوافذ المنبثقة للطباعة", "err");
    w.document.write(`<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>${esc(rep.title)}</title><link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700;800&display=swap" rel="stylesheet"><style>body{font-family:Tajawal,sans-serif;color:#2a1a1b;padding:30px 40px}h1{color:#7e1416;margin:10px 0 0}.sub{color:#7b6b6c;margin-bottom:16px}.k{display:flex;flex-wrap:wrap;gap:10px;margin:14px 0}.k div{background:#f6eceb;border-radius:8px;padding:10px 14px}.k b{display:block;font-size:20px;color:#7e1416}h3{color:#4a1416;margin:22px 0 6px}table{width:100%;border-collapse:collapse;font-size:13px}th{background:#7e1416;color:#fff;padding:7px;text-align:right}td{border-bottom:1px solid #ece4e3;padding:6px}footer{margin-top:30px;font-size:12px;color:#7b6b6c;text-align:center}</style></head><body>
      ${window.logoSVG(150)}<h1>${esc(rep.title)}</h1><div class="sub">${esc(rep.subtitle || "")} · ${dt(rep.created_at)} · ${esc(rep.created_by || "")}</div>
      <div class="k">${(rep.kpis || []).map((k) => `<div>${esc(k.label)}<b>${esc(k.value)}</b>${esc(k.unit)}</div>`).join("")}</div>
      ${(rep.tables || []).map((t) => `<h3>${esc(t.title)}</h3><table><thead><tr>${t.headers.map((h) => `<th>${esc(h)}</th>`).join("")}</tr></thead><tbody>${t.rows.map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join("")}</tr>`).join("")}</tbody></table>`).join("")}
      <footer>هوم ماربل · تقرير محفوظ</footer><script>window.onload=()=>setTimeout(()=>window.print(),600)<\/script></body></html>`);
    w.document.close();
  }

  function reportMenu() {
    const rep = captureScreen();
    if (!rep) return;
    const nT = rep.tables.length, nR = rep.tables.reduce((a, t) => a + t.rows.length, 0);
    const ov = C.modal(`${ic("save")} حفظ / تصدير «${esc(rep.title)}»`, `<p class="p2-muted">سيتم التقاط ما على الشاشة الآن: ${rep.kpis.length} مؤشر · ${nT} جدول · ${num(nR)} صف. احفظه قبل أي حذف أو تعديل لتتمكن من مراجعته واستعادته لاحقاً.</p>
      <div class="ex-repgrid">
        <button type="button" class="ex-repbtn" data-r="excel">${ic("sheet", 30)}<b>تصدير Excel</b><small>ملف .xlsx بكل الجداول</small></button>
        <button type="button" class="ex-repbtn" data-r="hmr">${ic("download", 30)}<b>حفظ ملف تقرير (.hmr)</b><small>يمكن فتحه واستعادته لاحقاً للمراجعة</small></button>
        <button type="button" class="ex-repbtn" data-r="cloud">${ic("cloud", 30)}<b>حفظ في أرشيف التقارير</b><small>يظهر لكل الإدارة من أي مكان</small></button>
        <button type="button" class="ex-repbtn" data-r="print">${ic("print", 30)}<b>طباعة / PDF</b><small>نسخة مطبوعة من التقرير</small></button>
      </div>`, `<a class="btn btn-ghost" href="#/reports" data-close>${ic("archive", 16)} أرشيف التقارير والنسخ الاحتياطية</a><button class="btn btn-line" data-close>إغلاق</button>`);
    ov.querySelectorAll("[data-r]").forEach((b) => (b.onclick = async () => {
      const k = b.dataset.r;
      try {
        if (k === "excel") { await exportExcel(rep); toast("تم تصدير ملف Excel ✓", "ok"); }
        else if (k === "hmr") { exportHMR(rep); toast("تم حفظ ملف التقرير ✓", "ok"); }
        else if (k === "print") printReport(rep);
        else if (k === "cloud") { const r = await run(sb().from("saved_reports").insert({ title: rep.title + " — " + dt(rep.created_at), route: rep.route, payload: rep }), "تم الحفظ في أرشيف التقارير ✓"); if (r) { C.closeModal(); await C.refresh(); } }
      } catch (er) { toast(errText(er), "err"); }
    }));
  }

  async function openDataFile(file) {
    try {
      const data = JSON.parse(await readFile(file, "text"));
      if (data && data.format === HMR_FORMAT) { E.localReport = data; location.hash = "#/report-view/local"; return; }
      if (data && data.format === BK_FORMAT) return restoreBackupData(data, file.name);
      throw new Error("هذا الملف ليس تقرير أو نسخة احتياطية من هوم ماربل");
    } catch (er) { toast(/JSON|Unexpected/.test(errText(er)) ? "الملف تالف أو ليس بصيغة هوم ماربل" : errText(er), "err"); }
  }
  function openHMRFile() { pickFile(".hmr,.hmbak,.json", openDataFile); }

  function renderReportBody(rep) {
    return `<div class="grid g4">${(rep.kpis || []).map((k) => kpi(esc(k.label), esc(k.value), esc(k.unit), "chart")).join("")}</div>
      ${(rep.tables || []).map((t) => `<div class="card mt"><div class="card-head"><h3>${esc(t.title)}</h3><span class="badge b-gray">${num(t.rows.length)} صف</span></div><div class="tbl-wrap"><table><thead><tr>${t.headers.map((h) => `<th>${esc(h)}</th>`).join("")}</tr></thead><tbody>${t.rows.map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join("")}</tr>`).join("")}</tbody></table></div></div>`).join("") || '<div class="empty">لا توجد جداول في هذا التقرير</div>'}`;
  }

  function pageReportView(id) {
    if (!isStaff()) return noAccess();
    const rep = id === "local" ? E.localReport : E.repCache[id];
    if (!rep) {
      if (id !== "local" && !E.repCache["loading:" + id]) {
        E.repCache["loading:" + id] = true;
        sb().from("saved_reports").select("*").eq("id", id).maybeSingle().then((r) => { E.repCache[id] = r.data ? r.data.payload : { title: "التقرير غير موجود", tables: [], kpis: [] }; if (route()[1] === id) C.render(true); });
      }
      return id === "local" ? '<div class="empty">افتح ملف تقرير (.hmr) من <a href="#/reports">أرشيف التقارير</a></div>' : '<div class="empty">جاري تحميل التقرير...</div>';
    }
    return `<div class="page-head"><div><h1>${esc(rep.title)}</h1><div class="sub"><a href="#/reports">${ic("chevron", 14)} أرشيف التقارير</a> · نسخة محفوظة بتاريخ ${dt(rep.created_at)} · ${esc(rep.created_by || "")} ${id === "local" ? '<span class="badge b-blue">من ملف</span>' : '<span class="badge b-green">من الأرشيف</span>'}</div></div>
      <div class="filters"><button class="btn btn-ghost" data-act="ex-rep-excel" data-id="${esc(id)}">${ic("sheet", 18)} Excel</button><button class="btn btn-line" data-act="ex-rep-hmr" data-id="${esc(id)}">${ic("download", 18)} .hmr</button><button class="btn btn-line" data-act="ex-rep-print" data-id="${esc(id)}">${ic("print", 18)} طباعة</button>${rep.route ? `<a class="btn btn-line" href="#/${esc(rep.route)}">عرض البيانات الحالية</a>` : ""}</div></div>
      <div class="p2-info">${ic("archive", 18)} هذه نسخة ثابتة من التقرير كما كان وقت حفظه — للمراجعة والمقارنة، ولا تتأثر بأي حذف أو تعديل لاحق.</div>
      ${renderReportBody(rep)}`;
  }

  // =====================================================================
  //  النسخ الاحتياطي الكامل والاستعادة + سلة المحذوفات
  // =====================================================================
  async function fetchAll(table) {
    const out = []; const cols = SELECT_COLS[table] || "*";
    for (let from = 0; from < 500000; from += 1000) {
      const r = await sb().from(table).select(cols).range(from, from + 999);
      if (r.error) { if (isMissingErr(r)) return null; throw r.error; }
      out.push(...(r.data || []));
      if (!r.data || r.data.length < 1000) break;
    }
    return out;
  }
  async function makeBackup(kind) {
    if (!isMgr()) return toast("النسخ الاحتياطي من صلاحية المدير أو المدير التنفيذي", "err");
    const ov = C.modal("جاري إنشاء نسخة احتياطية...", `<div class="ex-progress"><div style="width:0%"></div><span>0%</span></div><p class="p2-muted mt" id="ex-bk-step"></p>`);
    const bar = ov.querySelector(".ex-progress div"), lbl = ov.querySelector(".ex-progress span"), st = ov.querySelector("#ex-bk-step");
    const data = {}; const counts = {};
    try {
      for (let i = 0; i < BACKUP_ORDER.length; i++) {
        const t = BACKUP_ORDER[i];
        st.textContent = "قراءة " + (TABLE_AR[t] || t) + "...";
        const rows = await fetchAll(t);
        if (rows) { data[t] = rows; counts[t] = rows.length; }
        const p = Math.round(((i + 1) / BACKUP_ORDER.length) * 100); bar.style.width = p + "%"; lbl.textContent = p + "%";
      }
      const bk = { format: BK_FORMAT, version: 1, created_at: new Date().toISOString(), created_by: (C.S.profile && C.S.profile.full_name) || C.S.user.email, source: (window.HM_CONFIG || {}).url || "", counts, data };
      if (kind === "excel") {
        const X = await loadXLSX();
        const sheets = Object.keys(data).filter((t) => data[t].length).map((t) => { const cols = [...new Set(data[t].flatMap((r) => Object.keys(r)))]; return { name: TABLE_AR[t] || t, rows: [cols].concat(data[t].map((r) => cols.map((c) => (r[c] != null && typeof r[c] === "object" ? JSON.stringify(r[c]) : r[c] == null ? "" : r[c])))) }; });
        X.writeFile(makeWorkbook(sheets.length ? sheets : [{ name: "فارغ", rows: [["لا توجد بيانات"]] }]), `نسخة_هوم_ماربل_${stamp()}.xlsx`);
      } else download(`نسخة_احتياطية_هوم_ماربل_${stamp()}.hmbak`, JSON.stringify(bk), "application/json");
      C.closeModal();
      toast(`تم إنشاء النسخة الاحتياطية: ${num(Object.values(counts).reduce((a, b) => a + b, 0))} سجل ✓`, "ok");
      return bk;
    } catch (er) { C.closeModal(); toast(errText(er), "err"); return null; }
  }

  function restoreBackupFile() {
    if (!isMgr()) return toast("الاستعادة من صلاحية المدير أو المدير التنفيذي", "err");
    pickFile(".hmbak,.json", openDataFile);
  }

  function restoreBackupData(bk, fname) {
    if (!isMgr()) return toast("الاستعادة من صلاحية المدير أو المدير التنفيذي", "err");
    const tables = BACKUP_ORDER.filter((t) => Array.isArray((bk.data || {})[t]) && bk.data[t].length);
    const ov = C.modal("استعادة نسخة احتياطية", `<dl class="kv"><dt>الملف</dt><dd>${esc(fname || "")}</dd><dt>تاريخ النسخة</dt><dd>${dt(bk.created_at)}</dd><dt>بواسطة</dt><dd>${esc(bk.created_by || "—")}</dd></dl>
      <div class="p2-info mt">${ic("alert", 18)} الاستعادة <b>تُعيد السجلات المحذوفة وترجع القيم القديمة</b> للسجلات الموجودة، ولا تحذف أي بيانات أُضيفت بعد تاريخ النسخة. التغيير يظهر فوراً عند كل المستخدمين.</div>
      <label class="p2-lbl">اختر ما تريد استعادته</label><div class="p2-checks">${tables.map((t) => `<label class="check"><input type="checkbox" data-bkt="${t}" ${RESTRICTED.includes(t) ? (isAdmin() ? "" : "disabled") : "checked"}> ${esc(TABLE_AR[t] || t)} <span class="p2-muted">(${num(bk.data[t].length)})</span></label>`).join("") || '<span class="p2-muted">النسخة فارغة</span>'}</div>
      ${isAdmin() ? "" : '<p class="p2-muted">استعادة الموظفين والصلاحيات والفروع من صلاحية مدير النظام فقط.</p>'}
      <div class="ex-progress mt" id="ex-rs-prog" hidden><div></div><span></span></div>`, `<button class="btn btn-primary" id="ex-rs-go">${ic("refresh", 18)} بدء الاستعادة</button><button class="btn btn-line" data-close>إلغاء</button>`);
    ov.querySelector(".modal").classList.add("modal-wide");
    ov.querySelector("#ex-rs-go").onclick = async () => {
      const sel = Array.from(ov.querySelectorAll("[data-bkt]:checked")).map((c) => c.dataset.bkt);
      if (!sel.length) return toast("اختر جدولاً واحداً على الأقل", "err");
      if (!confirm("تأكيد استعادة البيانات المحددة؟")) return;
      const btn = ov.querySelector("#ex-rs-go"); btn.disabled = true;
      const prog = ov.querySelector("#ex-rs-prog"); prog.hidden = false;
      const bar = prog.querySelector("div"), lbl = prog.querySelector("span");
      const totalRows = sel.reduce((a, t) => a + bk.data[t].length, 0); let doneRows = 0, ok = 0, fail = 0;
      try {
        for (const t of sel) {
          const rows = bk.data[t];
          for (let i = 0; i < rows.length; i += 300) {
            const res = await rpc("hm_restore_rows", { _table: t, _rows: rows.slice(i, i + 300) });
            ok += Number((res && res.ok) || 0); fail += Number((res && res.failed) || 0);
            doneRows += Math.min(300, rows.length - i);
            bar.style.width = Math.round((doneRows / totalRows) * 100) + "%"; lbl.textContent = `${TABLE_AR[t] || t} — ${num(doneRows)} / ${num(totalRows)}`;
          }
        }
        C.closeModal(); toast(`تمت الاستعادة: ${num(ok)} سجل${fail ? ` — تعذّر ${num(fail)}` : ""} ✓`, fail ? "err" : "ok");
        await C.refresh();
      } catch (er) { btn.disabled = false; toast(errText(er), "err"); }
    };
  }

  function recordLabel(d) {
    const r = d.record || {};
    return r.name || r.title || r.full_name || (r.order_no ? "طلب #" + r.order_no : "") || (r.doc_no ? "مستند #" + r.doc_no : "") || (r.pr_no ? "طلب شراء #" + r.pr_no : "") || (r.code ? "دردشة " + r.code : "") || r.account_email || r.visitor_name || (r.body ? String(r.body).slice(0, 40) : "") || (r.qty != null ? "كمية " + r.qty : "") || "سجل";
  }

  function pageReports() {
    if (!isStaff()) return noAccess();
    const tab = isMgr() ? E.f.repTab || "reports" : "reports";
    const dq = normTxt(E.f.delQ || "");
    const batches = {}; E.deleted.forEach((d) => { (batches[d.batch] = batches[d.batch] || []).push(d); });
    const order = BACKUP_ORDER.concat(Object.keys(TABLE_AR));
    const heads = Object.values(batches).map((list) => ({ top: list.slice().sort((a, b) => order.indexOf(a.table_name) - order.indexOf(b.table_name))[0], list }))
      .filter((b) => !dq || normTxt(`${recordLabel(b.top)} ${TABLE_AR[b.top.table_name] || ""} ${b.top.deleted_email || ""}`).includes(dq))
      .sort((a, b) => (a.top.deleted_at < b.top.deleted_at ? 1 : -1));
    const pendingBin = heads.filter((h) => !h.top.restored_at).length;
    const tabs = [["reports", "أرشيف التقارير", "archive"]].concat(isMgr() ? [["backup", "النسخ الاحتياطي والاستعادة", "cloud"], ["bin", "سلة المحذوفات", "trash"]] : []);
    return `<div class="page-head"><div><h1>${isMgr() ? "التقارير والنسخ الاحتياطي" : "أرشيف التقارير"}</h1><div class="sub">احفظ أي تقرير قبل الحذف أو التعديل، صدّره Excel، واستعده لاحقاً للمراجعة</div></div>
      <div class="filters"><button class="btn btn-ghost" data-act="ex-open-file">${ic("upload", 18)} فتح ملف تقرير / نسخة</button></div></div>
      ${missingBanner()}
      <div class="card"><div class="tabbar">${tabs.map((t) => `<button data-exf-tab="repTab:${t[0]}" class="${tab === t[0] ? "on" : ""}">${ic(t[2], 16)} ${t[1]}${t[0] === "bin" && pendingBin ? ` <span class="badge b-red">${pendingBin}</span>` : ""}</button>`).join("")}</div>
      ${tab === "reports" ? `<p class="p2-muted" style="margin-bottom:12px">من أي صفحة اضغط زر <b>${ic("save", 14)} حفظ / تصدير</b> في الشريط العلوي لحفظ ما على الشاشة (مؤشرات وجداول) هنا، أو تصديره Excel، أو حفظه كملف <b>.hmr</b> تفتحه لاحقاً.</p>
        <div class="tbl-wrap"><table><thead><tr><th>التقرير</th><th>الصفحة</th><th>بواسطة</th><th>التاريخ</th><th></th></tr></thead><tbody>${E.reports.map((r) => `<tr><td><a href="#/report-view/${r.id}"><b>${esc(r.title)}</b></a></td><td>${r.route ? `<a href="#/${esc(r.route)}">#/${esc(r.route)}</a>` : "—"}</td><td>${esc(staffName(r.created_by))}</td><td>${dt(r.created_at)}</td><td class="p2-actions"><a class="btn btn-sm btn-primary" href="#/report-view/${r.id}">عرض</a><button class="btn btn-sm btn-ghost" data-act="ex-rep-excel" data-id="${r.id}">${ic("sheet", 14)} Excel</button><button class="btn btn-sm btn-line" data-act="ex-rep-hmr" data-id="${r.id}">${ic("download", 14)}</button>${isMgr() || r.created_by === me() ? `<button class="btn btn-sm btn-danger" data-act="ex-rep-del" data-id="${r.id}">${ic("trash", 14)}</button>` : ""}</td></tr>`).join("") || '<tr><td colspan="5" class="empty">لا توجد تقارير محفوظة بعد</td></tr>'}</tbody></table></div>`
      : tab === "backup" ? `<div class="grid g2">
          <div class="ex-bkcard">${ic("download", 34)}<h3>تصدير نسخة احتياطية كاملة</h3><p>كل بيانات النظام (العملاء، الطلبات، المستندات، المصنع، المخزون، المشتريات، القياسات، التركيبات، الدعم الفني، الدردشات) في ملف واحد.</p><div class="filters"><button class="btn btn-primary" data-act="ex-bk-json">${ic("download", 18)} ملف استعادة (.hmbak)</button><button class="btn btn-ghost" data-act="ex-bk-excel">${ic("sheet", 18)} Excel للمراجعة</button></div></div>
          <div class="ex-bkcard">${ic("refresh", 34)}<h3>استعادة من نسخة احتياطية</h3><p>ارفع ملف <b>.hmbak</b> لإرجاع البيانات المحذوفة أو القيم القديمة. تختار الأقسام المراد استعادتها، ولا تُحذف أي بيانات حديثة.</p><button class="btn btn-ghost" data-act="ex-bk-restore">${ic("upload", 18)} اختيار ملف النسخة</button></div></div>
          <p class="p2-muted mt">ننصح بأخذ نسخة احتياطية أسبوعياً وقبل أي حذف جماعي. الملف يُحفظ على جهازك ويمكن فتحه من أي جهاز آخر.</p>`
      : `<div class="filters" style="margin-bottom:12px"><input class="input" data-exf="delQ" placeholder="بحث في المحذوفات" value="${esc(E.f.delQ || "")}"></div>
        <p class="p2-muted" style="margin-bottom:10px">كل ما يُحذف من النظام يُحفظ هنا تلقائياً. الاستعادة تُرجع السجل وكل ما حُذف معه في نفس العملية (مثلاً العميل مع طلباته ومستنداته).</p>
        <div class="tbl-wrap"><table><thead><tr><th>السجل</th><th>القسم</th><th>حُذف معه</th><th>حذفه</th><th>تاريخ الحذف</th><th>الحالة</th><th></th></tr></thead><tbody>${heads.map((b) => { const d = b.top; const others = b.list.length - 1; return `<tr><td><b>${esc(recordLabel(d))}</b></td><td>${esc(TABLE_AR[d.table_name] || d.table_name)}</td><td>${others ? `${others} سجل مرتبط` : "—"}</td><td>${esc(d.deleted_email || staffName(d.deleted_by))}</td><td>${dt(d.deleted_at)}</td><td>${d.restored_at ? `<span class="badge b-green">استُعيد ${dt(d.restored_at)}</span>` : '<span class="badge b-red">محذوف</span>'}</td><td class="p2-actions">${d.restored_at ? "" : `<button class="btn btn-sm btn-success" data-act="ex-del-restore" data-id="${d.id}">${ic("refresh", 14)} استعادة</button>`}<button class="btn btn-sm btn-line" data-act="ex-del-view" data-id="${d.id}">${ic("file", 14)}</button>${isAdmin() ? `<button class="btn btn-sm btn-danger" data-act="ex-del-purge" data-batch="${esc(d.batch)}" title="حذف نهائي">${ic("trash", 14)}</button>` : ""}</td></tr>`; }).join("") || '<tr><td colspan="7" class="empty">سلة المحذوفات فارغة</td></tr>'}</tbody></table></div>`}</div>`;
  }

  async function reportById(id) {
    if (id === "local") return E.localReport;
    if (E.repCache[id]) return E.repCache[id];
    const r = await sb().from("saved_reports").select("*").eq("id", id).maybeSingle();
    if (r.error || !r.data) throw r.error || new Error("التقرير غير موجود");
    E.repCache[id] = r.data.payload; return r.data.payload;
  }

  // =====================================================================
  //  الربط مع النظام (القائمة • التنبيهات • البحث • الرئيسية • الشريط العلوي • الأحداث)
  // =====================================================================
  function nav(n) {
    if (!isStaff()) return;
    const add = [];
    if (isSupport()) add.push(["support", "الدعم الفني", "headset"]);
    add.push(["chats", "الدردشات", "chat"]);
    add.push(["reports", isMgr() ? "التقارير والنسخ الاحتياطي" : "أرشيف التقارير", "archive"]);
    const block = [["sep"]].concat(add);
    const ui = n.findIndex((x) => x[0] === "users");
    if (ui > 0 && n[ui - 1][0] === "sep") n.splice(ui - 1, 0, ...block); else n.push(...block);
  }

  function alerts(a) {
    if (E.missing || !isSupport()) return;
    const nr = E.reqs.filter((r) => r.status === "new").length;
    if (nr) a.push(["a-red", "key", "طلبات نسيان كلمة مرور جديدة", nr, "support"]);
    const nt = E.threads.filter((t) => t.status === "open" && Number(t.staff_unread) > 0).length;
    if (nt) a.push(["a-orange", "chat", "محادثات زوار بانتظار الرد", nt, "support"]);
  }

  function search(q, res) {
    const nq = normTxt(q);
    E.reqs.forEach((r) => { if (normTxt(`${r.account_email} ${r.full_name || ""} ${r.contact_value}`).includes(nq)) res.push(["#/support", `طلب كلمة مرور #${r.request_no}`, r.account_email]); });
    E.threads.forEach((t) => { if (normTxt(`${t.visitor_name} ${t.visitor_contact || ""} ${t.thread_no}`).includes(nq)) res.push([`#/support-thread/${t.id}`, `محادثة دعم #${t.thread_no}`, t.visitor_name]); });
    E.rooms.forEach((r) => { if (normTxt(`${r.code} ${r.title}`).includes(nq)) res.push([`#/room/${r.id}`, `دردشة ${r.code}`, r.title]); });
    E.reports.forEach((r) => { if (normTxt(r.title).includes(nq)) res.push([`#/report-view/${r.id}`, "تقرير محفوظ", r.title]); });
  }

  function supportSummary() {
    const nr = E.reqs.filter((r) => r.status === "new");
    const th = E.threads.filter((t) => t.status === "open").slice(0, 6);
    return `<div class="grid g2 mt">
      <div class="card"><div class="card-head"><h3>${ic("key")} طلبات كلمات المرور الجديدة</h3><a href="#/support">عرض الكل</a></div>${nr.length ? `<div class="tbl-wrap"><table><thead><tr><th>البريد</th><th>التواصل</th><th>منذ</th></tr></thead><tbody>${nr.slice(0, 6).map((r) => `<tr class="click" data-href="#/support"><td dir="ltr" style="text-align:right">${esc(r.account_email)}</td><td dir="ltr" style="text-align:right">${esc(r.contact_value)}</td><td>${dt(r.created_at)}</td></tr>`).join("")}</tbody></table></div>` : '<div class="empty">لا توجد طلبات جديدة 👌</div>'}</div>
      <div class="card"><div class="card-head"><h3>${ic("chat")} محادثات الزوار المفتوحة</h3><a href="#/support">عرض الكل</a></div>${th.length ? `<div class="tbl-wrap"><table><thead><tr><th>الزائر</th><th>آخر رسالة</th><th>غير مقروء</th></tr></thead><tbody>${th.map((t) => `<tr class="click" data-href="#/support-thread/${t.id}"><td>${esc(t.visitor_name)}</td><td>${dt(t.last_message_at)}</td><td>${t.staff_unread ? `<span class="badge b-red">${t.staff_unread}</span>` : "—"}</td></tr>`).join("")}</tbody></table></div>` : '<div class="empty">لا توجد محادثات مفتوحة</div>'}</div></div>`;
  }

  // الرئيسية لموظف «الدعم الفني» فقط (بدون أدوار المرحلتين الأولى والثانية)
  function home() {
    if (hasP1() || hasP2() || !isSupport()) return "";
    const tiles = [["go:support", "الدعم الفني", "headset"], ["ex-pw-any", "تعيين كلمة مرور", "key"], ["go:chats", "الدردشات", "chat"], ["go:reports", "أرشيف التقارير", "archive"]];
    return `<div class="page-head"><div><h1>الرئيسية</h1><div class="sub">مرحباً ${esc((C.S.profile && C.S.profile.full_name) || "")} — الدعم الفني</div></div></div>
      ${missingBanner()}
      <div class="grid g4">${kpi("طلبات كلمات مرور جديدة", E.reqs.filter((r) => r.status === "new").length, "طلب", "key")}${kpi("جاري التواصل", E.reqs.filter((r) => r.status === "in_progress").length, "طلب", "phone")}${kpi("محادثات مفتوحة", E.threads.filter((t) => t.status === "open").length, "محادثة", "chat")}${kpi("بانتظار الرد", E.threads.filter((t) => t.status === "open" && t.staff_unread > 0).length, "محادثة", "bell")}</div>
      <div class="tiles mt">${tiles.map((x) => `<div class="tile" data-act="${x[0]}">${ic(x[2], 36)}${x[1]}</div>`).join("")}</div>
      ${supportSummary()}`;
  }

  function dashboard() {
    if (E.missing || !isSupport()) return "";
    return `<h2 class="p2-section-title">${ic("headset", 22)} الدعم الفني</h2>${supportSummary()}`;
  }

  function topbar() {
    if (!isStaff()) return "";
    const un = isSupport() ? E.reqs.filter((r) => r.status === "new").length + E.threads.filter((t) => t.status === "open" && t.staff_unread > 0).length : 0;
    return `<button type="button" class="btn btn-ghost btn-sm ex-top" data-act="ex-report" title="حفظ أو تصدير التقرير المعروض على الشاشة">${ic("save", 16)}<span>حفظ / تصدير</span></button>${isSupport() ? `<a class="ex-topicon" href="#/support" title="الدعم الفني">${ic("headset", 22)}${un ? `<span class="dot">${un}</span>` : ""}</a>` : ""}`;
  }

  function customersTools() {
    if (!C.canSell()) return "";
    return `<button class="btn btn-ghost" data-act="ex-import-customers" title="رفع شيت Excel أو CSV بأسماء العملاء">${ic("upload", 18)} استيراد Excel</button><button class="btn btn-line" data-act="ex-export-customers">${ic("sheet", 18)} تصدير</button>`;
  }

  function pendingRendered() {
    const card = document.querySelector(".pending .card");
    if (!card || card.querySelector(".ex-visitor-tools")) return;
    card.insertAdjacentHTML("beforeend", `<div class="ex-visitor-tools" style="margin-top:18px"><button type="button" class="btn btn-ghost btn-block" data-ex-v="support">${ic("chat", 18)} تواصل مع الدعم الفني</button><button type="button" class="btn btn-line btn-block" data-ex-v="join">${ic("key", 18)} الدخول إلى دردشة بالكود</button></div>`);
    card.querySelector('[data-ex-v="support"]').onclick = () => openWidget();
    card.querySelector('[data-ex-v="join"]').onclick = () => openJoin("");
    renderLauncher();
  }

  // ---------- الأحداث ----------
  function action(a, el) {
    if (!a || a.indexOf("ex-") !== 0) return false;
    doAction(a, el).catch((er) => toast(errText(er), "err"));
    return true;
  }

  async function doAction(a, el) {
    const ds = el.dataset, id = ds.id;
    switch (a) {
      case "ex-report": return reportMenu();
      case "ex-import-customers": return importCustomers();
      case "ex-export-customers": return exportCustomers();
      case "ex-pw-any": return setPasswordForm(null, "");
      case "ex-req-set": return setPasswordForm(E.reqs.find((r) => r.id === id));
      case "ex-req-view": { const r = E.reqs.find((x) => x.id === id); if (r) requestDetails(r); return; }
      case "ex-req-status": {
        const s = ds.status; if (s === "rejected" && !confirm("رفض هذا الطلب؟")) return;
        const r = await run(sb().from("support_password_requests").update({ status: s, handled_by: me(), handled_at: new Date().toISOString() }).eq("id", id), s === "done" ? "تم إغلاق الطلب ✓" : "تم تحديث الطلب");
        if (r) await C.refresh(); return;
      }
      case "ex-thread-status": { const r = await run(sb().from("support_threads").update({ status: ds.status }).eq("id", id), ds.status === "closed" ? "تم إغلاق المحادثة" : "تمت إعادة فتح المحادثة"); if (r) await C.refresh(); return; }
      case "ex-thread-del": { if (!confirm("حذف المحادثة وكل رسائلها؟ (تُحفظ في سلة المحذوفات)")) return; const r = await run(sb().from("support_threads").delete().eq("id", id), "تم الحذف"); if (r) { delete E.msgs[id]; await C.refresh(); location.hash = "#/support"; } return; }
      case "ex-room-new": return newRoomForm();
      case "ex-room-copy": return copyText(shareText(ds.title || "دردشة", ds.code));
      case "ex-room-toggle": {
        const r0 = E.rooms.find((x) => x.id === id); if (!r0) return;
        const act = roomActive(r0);
        const patch = act ? { is_active: false } : { is_active: true, expires_at: r0.expires_at && new Date(r0.expires_at) < new Date() ? null : r0.expires_at };
        const r = await run(sb().from("chat_rooms").update(patch).eq("id", id), act ? "تم إغلاق الدردشة" : "تمت إعادة فتح الدردشة");
        if (r) { if (E.room[id] && E.room[id].info) E.room[id].info.active = !act; await C.refresh(); } return;
      }
      case "ex-room-del": { if (!confirm("حذف الدردشة وكل رسائلها؟ (تُحفظ في سلة المحذوفات)")) return; const r = await run(sb().from("chat_rooms").delete().eq("id", id), "تم حذف الدردشة"); if (r) { forgetRoom(id); delete E.room[id]; await C.refresh(); if (route()[0] === "room") location.hash = "#/chats"; } return; }
      case "ex-room-forget": forgetRoom(id); return C.render(true);
      case "ex-open-file": return openHMRFile();
      case "ex-rep-excel": await exportExcel(await reportById(id)); return toast("تم تصدير ملف Excel ✓", "ok");
      case "ex-rep-hmr": exportHMR(await reportById(id)); return toast("تم حفظ ملف التقرير ✓", "ok");
      case "ex-rep-print": return printReport(await reportById(id));
      case "ex-rep-del": { if (!confirm("حذف التقرير من الأرشيف؟ (يُحفظ في سلة المحذوفات)")) return; const r = await run(sb().from("saved_reports").delete().eq("id", id), "تم الحذف"); if (r) await C.refresh(); return; }
      case "ex-bk-json": return makeBackup("json");
      case "ex-bk-excel": return makeBackup("excel");
      case "ex-bk-restore": return restoreBackupFile();
      case "ex-del-restore": {
        const d = E.deleted.find((x) => x.id === id); if (!d) return;
        const n = E.deleted.filter((x) => x.batch === d.batch && !x.restored_at).length;
        if (!confirm(`استعادة «${recordLabel(d)}»${n > 1 ? ` مع ${n - 1} سجل مرتبط` : ""}؟`)) return;
        const res = await rpc("hm_restore_deleted", { _id: id });
        toast(`تمت استعادة ${num(res && res.ok)} سجل${res && res.failed ? ` — تعذّر ${res.failed}` : ""} ✓ ويظهر الآن عند كل المستخدمين`, res && res.failed ? "err" : "ok");
        return C.refresh();
      }
      case "ex-del-view": {
        const d = E.deleted.find((x) => x.id === id); if (!d) return;
        const rows = Object.entries(d.record || {}).filter(([, v]) => v !== null && v !== "").map(([k, v]) => `<dt dir="ltr">${esc(k)}</dt><dd style="white-space:pre-wrap;word-break:break-word">${esc(typeof v === "object" ? JSON.stringify(v) : v)}</dd>`).join("");
        C.modal(`${esc(TABLE_AR[d.table_name] || d.table_name)} — ${esc(recordLabel(d))}`, `<dl class="kv">${rows}</dl>`);
        return;
      }
      case "ex-del-purge": { if (!confirm("حذف نهائي من سلة المحذوفات؟ لا يمكن التراجع.")) return; const r = await run(sb().from("deleted_records").delete().eq("batch", ds.batch), "تم الحذف النهائي"); if (r) await C.refresh(); return; }
    }
  }

  // ---------- الربط بعد كل رسم ----------
  let pageTimer = null;
  const autoJoined = {};
  function bind() {
    hideVisitorUI();
    clearInterval(pageTimer); pageTimer = null;
    const app = C.app;
    app.querySelectorAll("[data-exf]").forEach((elm) => {
      const key = elm.dataset.exf;
      const isText = elm.tagName === "INPUT" && !["checkbox", "date"].includes(elm.type);
      const fn = () => {
        E.f[key] = elm.type === "checkbox" ? elm.checked : elm.value;
        C.render(true);
        if (isText) { const n = app.querySelector(`[data-exf="${key}"]`); if (n) { n.focus(); n.setSelectionRange(n.value.length, n.value.length); } }
      };
      if (isText) elm.oninput = fn; else elm.onchange = fn;
    });
    app.querySelectorAll("[data-exf-tab]").forEach((b) => (b.onclick = () => { const [k, v] = b.dataset.exfTab.split(":"); E.f[k] = v; C.render(true); }));
    app.querySelectorAll("textarea[data-exdraft]").forEach((ta) => {
      const k = ta.dataset.exdraft;
      if (E.drafts[k]) ta.value = E.drafts[k];
      ta.addEventListener("input", () => (E.drafts[k] = ta.value));
      ta.addEventListener("focus", () => (E.drafts._focus = k));
      if (E.drafts._focus === k) { ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length); }
    });
    app.querySelectorAll(".ex-code-in").forEach((ci) => ci.addEventListener("input", () => (ci.value = ci.value.toUpperCase().replace(/\s/g, ""))));

    const [r, id] = route();
    const jf = app.querySelector("#ex-joinpage");
    if (jf) {
      const go = async () => {
        const code = (jf.querySelector("[name=code]").value || "").trim().toUpperCase(); if (!code) return;
        const saved = findSavedByCode(code); if (saved) { location.hash = "#/room/" + saved.room_id; return; }
        const own = E.rooms.find((x) => x.code === code); if (own && isMgr()) { location.hash = "#/room/" + own.id; return; }
        try { const info = await joinRoom(code, null); location.hash = "#/room/" + info.room_id; } catch (er) { toast(errText(er), "err"); }
      };
      jf.onsubmit = (e) => { e.preventDefault(); go(); };
      if (r === "join" && id && !autoJoined[id]) { autoJoined[id] = true; go(); }
    }
    if (r === "support-thread" && id && E.threads.some((t) => t.id === id)) {
      const c = E.msgs[id];
      threadFetch(id, !(c && c.loaded));
      const f = app.querySelector("#ex-tsend");
      if (f) {
        sendOnEnter(f);
        f.onsubmit = async (e) => {
          e.preventDefault(); const ta = f.querySelector("textarea"); const body = ta.value.trim(); if (!body) return;
          ta.disabled = true;
          try { await threadSend(id, body); ta.value = ""; E.drafts["thread-" + id] = ""; } catch (er) { toast(errText(er), "err"); }
          ta.disabled = false; ta.focus();
        };
        app.querySelectorAll("[data-exquick]").forEach((b) => (b.onclick = () => { const ta = f.querySelector("textarea"); ta.value = QUICK[+b.dataset.exquick]; E.drafts["thread-" + id] = ta.value; ta.focus(); }));
      }
      pageTimer = setInterval(() => { if (!document.hidden) threadFetch(id); }, 4000);
    }
    if (r === "room" && id) {
      staffRoomFetch(id);
      const f = app.querySelector("#ex-srsend");
      if (f) {
        sendOnEnter(f);
        f.onsubmit = async (e) => {
          e.preventDefault(); const ta = f.querySelector("textarea"); const body = ta.value.trim(); if (!body) return;
          ta.disabled = true;
          try { await rpc("hm_room_send", { _room: id, _token: roomInfo(id).token, _body: body }); ta.value = ""; E.drafts["room-" + id] = ""; await staffRoomFetch(id); } catch (er) { toast(errText(er), "err"); }
          ta.disabled = false; ta.focus();
        };
      }
      pageTimer = setInterval(() => { if (!document.hidden) staffRoomFetch(id); }, 3000);
    }
  }

  // ---------- تحميل البيانات ----------
  async function load() {
    let miss = false;
    const mark = (r) => { if (isMissingErr(r)) miss = true; return (r && r.data) || []; };
    try {
      const jobs = [];
      if (isSupport()) {
        jobs.push(sb().from("support_password_requests").select("*").order("created_at", { ascending: false }).limit(300).then((r) => { E.reqs = mark(r); }));
        jobs.push(sb().from("support_threads").select(THREAD_COLS).order("last_message_at", { ascending: false }).limit(300).then((r) => { E.threads = mark(r); }));
      }
      if (isMgr()) {
        jobs.push(sb().from("chat_rooms").select("*").order("created_at", { ascending: false }).limit(300).then((r) => { E.rooms = mark(r); }));
        jobs.push(sb().from("chat_members").select(MEMBER_COLS).limit(5000).then((r) => { E.members = mark(r); }));
        jobs.push(sb().from("deleted_records").select("*").order("deleted_at", { ascending: false }).limit(500).then((r) => { E.deleted = mark(r); }));
      }
      if (isStaff()) jobs.push(sb().from("saved_reports").select("id,title,route,created_by,created_at").order("created_at", { ascending: false }).limit(300).then((r) => { E.reports = mark(r); }));
      await Promise.all(jobs);
    } catch (er) { console.error("[extras] load", er); }
    E.missing = miss;
  }

  // مؤقت احتياطي: تحديث كل دقيقتين إن انقطع الاتصال اللحظي (لا يقاطع الكتابة أو النوافذ المفتوحة)
  function autoRefresh() {
    if (!C || !C.S.user || !C.S.roles.length || document.hidden) return;
    if (document.querySelector("#modal-root .overlay")) return;
    const a = document.activeElement;
    if (a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)) return;
    C.refresh().catch(() => {});
  }

  window.HM_EXT = window.HM_EXT || [];
  window.HM_EXT.push({
    name: "extras",
    init(ctx) { C = ctx; C.ROLE_LABEL.support = "الدعم الفني"; setInterval(autoRefresh, 120000); },
    load,
    realtimeTables: () => (E.missing || !isStaff() ? [] : (isSupport() ? ["support_password_requests", "support_messages"] : []).concat(isMgr() ? ["chat_rooms", "deleted_records"] : [], ["saved_reports"])),
    nav, alerts, search, home, dashboard, topbar, customersTools, authRendered, pendingRendered, action, bind,
    auditLabels: () => TABLE_AR,
    auditDesc: (t, r) => (t === "support_password_requests" ? "طلب كلمة مرور: " + (r.account_email || "") : t === "chat_rooms" ? `${r.title || "دردشة"} (${r.code || ""})` : t === "saved_reports" ? "تقرير: " + (r.title || "") : ""),
    pages: { support: pageSupport, "support-thread": pageThread, chats: pageChats, room: pageRoom, join: pageJoin, reports: pageReports, "report-view": pageReportView },
    _test: { E, captureScreen, buildRows, parseCSV, guessCol, restoreBackupData, openDataFile },
  });

})();
