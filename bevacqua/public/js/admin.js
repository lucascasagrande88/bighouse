/* BEVACQUA · panel de administración */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const MONTHS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
  const DOWS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
  const pad = (n) => String(n).padStart(2, "0");
  const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parse = (s) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d, 12); };
  const addDays = (s, n) => { const d = parse(s); d.setDate(d.getDate() + n); return ymd(d); };
  const nice = (s) => { const d = parse(s); return `${DOWS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)}`; };
  const money = (n) => "$" + Number(n || 0).toLocaleString("es-AR");
  const slug = (s) => String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "x" + Date.now().toString(36);
  const COLORS = ["#2CF56D", "#FFFFFF", "#7FD3FF", "#FFC95C", "#FF8FB1", "#B49CFF"];

  let KEY = localStorage.getItem("bvcq-key") || "";
  let S = null; // { today, config, clients, pros, messages }
  const C = () => S.config;

  // ───────── api ─────────
  async function api(path, opts = {}) {
    const res = await fetch("/api/admin/" + path, { ...opts, headers: { "x-admin-key": KEY, ...(opts.body && !(opts.body instanceof ArrayBuffer) && !(opts.body instanceof Blob) ? { "content-type": "application/json" } : {}), ...(opts.headers || {}) } });
    const out = await res.json().catch(() => ({}));
    if (res.status === 401) { logout(); throw new Error("Sesión vencida"); }
    if (!res.ok) throw new Error(out.error || "Error " + res.status);
    return out;
  }
  const status = (txt, cls) => { const s = $("#status"); s.hidden = false; s.textContent = txt; s.className = "status " + cls; };
  let saveT;
  function save() {
    status("Guardando…", "saving");
    clearTimeout(saveT);
    saveT = setTimeout(async () => {
      try { await api("config", { method: "PUT", body: JSON.stringify(C()) }); status("Guardado ✓", "ok"); }
      catch (e) { status("Error al guardar: " + e.message, "err"); }
    }, 600);
  }

  // ───────── auth ─────────
  $("#loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    KEY = $("#pass").value;
    try { await api("login"); localStorage.setItem("bvcq-key", KEY); start(); }
    catch { $("#loginErr").textContent = "Contraseña incorrecta"; }
  });
  function logout() { localStorage.removeItem("bvcq-key"); KEY = ""; document.body.classList.remove("authed"); }
  $("#logout").addEventListener("click", logout);

  // ───────── tabs ─────────
  $$(".tab").forEach((t) => t.addEventListener("click", () => {
    $$(".tab").forEach((x) => x.classList.toggle("on", x === t));
    $$(".pane").forEach((p) => p.classList.toggle("on", p.dataset.pane === t.dataset.tab));
    document.body.classList.remove("nav-open");
    scrollTo(0, 0);
  }));
  $("#burger").addEventListener("click", () => document.body.classList.toggle("nav-open"));

  async function load() { S = await api("data"); }
  async function start() {
    document.body.classList.add("authed");
    try { await load(); } catch (e) { return; }
    renderAll();
  }
  function renderAll() {
    renderResumen(); renderAgenda(); renderTurnos(); renderPros(); renderPosts(); renderServices(); renderTextos(); renderMsgs(); badges();
  }
  function badges() {
    const b = (id, n) => { $(id).hidden = !n; $(id).textContent = n; };
    b("#bTurnos", S.clients.filter((c) => c.date === S.today && c.status === "confirmada").length);
    b("#bPros", S.pros.filter((p) => p.status === "pendiente").length);
    b("#bMsgs", S.messages.filter((m) => !m.read).length);
  }
  const locOf = (id) => C().locations.find((l) => l.id === id) || { name: id, color: "#888", short: id };

  // ───────── resumen ─────────
  function renderResumen() {
    const today = S.today;
    const d = C().days[today];
    $("#hoyTxt").textContent = `Hoy ${nice(today)} · ${d ? `estás en ${locOf(d.loc).name} (${d.start}–${d.end})` : "día cerrado en la agenda"}`;
    const upcoming = S.clients.filter((c) => c.date >= today && c.status === "confirmada").sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
    const todayN = upcoming.filter((c) => c.date === today).length;
    const weekEnd = addDays(today, 7);
    const week = upcoming.filter((c) => c.date <= weekEnd);
    const occ = activePros(today);
    $("#kpis").innerHTML = [
      ["Turnos hoy", todayN], ["Próx. 7 días", week.length], ["Facturación 7 días", money(week.reduce((a, c) => a + (c.price || 0), 0))],
      ["Puestos ocupados hoy", `${occ.length}/${C().studio.stations}`], ["Solicitudes pendientes", S.pros.filter((p) => p.status === "pendiente").length],
    ].map(([k, v]) => `<div class="card kpi"><small>${k}</small><b>${v}</b></div>`).join("");
    $("#nextTable").innerHTML = clientRows(upcoming.slice(0, 10));
    $("#pendTable").innerHTML = proRows(S.pros.filter((p) => p.status === "pendiente"));
  }
  const activePros = (day) => S.pros.filter((p) => p.status !== "rechazada" && p.status !== "cancelada" && p.start <= day && p.end >= day);

  // ───────── calendar helper ─────────
  function cal(el, month, cell, onPick, selected) {
    const y = month.getFullYear(), mo = month.getMonth();
    const lead = (new Date(y, mo, 1).getDay() + 6) % 7;
    const n = new Date(y, mo + 1, 0).getDate();
    let h = `<div class="cal-head"><h3>${MONTHS[mo]} ${y}</h3><div class="acts"><button class="btn sm" data-nav="-1">←</button><button class="btn sm" data-nav="0">Hoy</button><button class="btn sm" data-nav="1">→</button></div></div><div class="cal-grid">`;
    h += ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((d) => `<div class="dow">${d}</div>`).join("");
    for (let i = 0; i < lead; i++) h += `<div class="d empty"></div>`;
    for (let d = 1; d <= n; d++) {
      const s = `${y}-${pad(mo + 1)}-${pad(d)}`;
      const r = cell(s);
      h += `<button class="d ${r.cls || ""} ${s < S.today ? "past" : ""} ${s === selected ? "sel" : ""}" data-date="${s}"><span>${d}</span>${r.html || ""}</button>`;
    }
    el.innerHTML = h + "</div>";
    el.onclick = (e) => {
      const nav = e.target.closest("[data-nav]");
      if (nav) { const v = Number(nav.dataset.nav); if (v === 0) { const t = parse(S.today); month.setFullYear(t.getFullYear(), t.getMonth(), 1); } else month.setMonth(month.getMonth() + v); return onPick(null); }
      const b = e.target.closest("[data-date]");
      if (b) onPick(b.dataset.date);
    };
  }

  // ───────── agenda ─────────
  const aMonth = new Date(); aMonth.setDate(1);
  let aSel = null;
  function renderAgenda() {
    const counts = {};
    S.clients.forEach((c) => { if (c.status === "confirmada") counts[c.date] = (counts[c.date] || 0) + 1; });
    cal($("#aCal"), aMonth, (s) => {
      const d = C().days[s];
      if (!d) return { cls: "closed", html: `<span class="hrs">cerrado</span>${counts[s] ? `<span class="cnt">${counts[s]}</span>` : ""}` };
      const l = locOf(d.loc);
      return { html: `<span class="loc" style="background:${l.color || "#2CF56D"}">${esc(l.short || l.name)}</span><span class="hrs">${d.start}–${d.end}</span>${counts[s] ? `<span class="cnt">${counts[s]}</span>` : ""}` };
    }, (s) => { if (s) aSel = s; renderAgenda(); }, aSel);
    renderDayEditor();
    // range form
    const opts = `<option value="">Cerrado / no disponible</option>` + C().locations.map((l) => `<option value="${l.id}">${esc(l.name)}</option>`).join("");
    if ($("#rLoc").dataset.v !== opts) { $("#rLoc").innerHTML = opts; $("#rLoc").dataset.v = opts; $("#rLoc").value = C().locations[0]?.id || ""; }
    if (!$("#rDows").innerHTML) $("#rDows").innerHTML = [1, 2, 3, 4, 5, 6, 0].map((d) => `<label><input type="checkbox" value="${d}" ${d !== 0 ? "checked" : ""}>${DOWS[d]}</label>`).join("");
    if (!$("#rFrom").value) { $("#rFrom").value = S.today; $("#rTo").value = addDays(S.today, 13); }
    $("#slotStep").value = String(C().slotStep || 30);
  }
  function renderDayEditor() {
    const el = $("#dayEditor");
    if (!aSel) return;
    const d = C().days[aSel];
    const bookings = S.clients.filter((c) => c.date === aSel && c.status === "confirmada").sort((a, b) => a.time.localeCompare(b.time));
    el.innerHTML = `<h2 style="margin-top:0">${nice(aSel)}</h2>
      <label class="f" style="margin-bottom:14px">¿Dónde estás?<select id="deLoc"><option value="">Cerrado / no disponible</option>${C().locations.map((l) => `<option value="${l.id}" ${d?.loc === l.id ? "selected" : ""}>${esc(l.name)}</option>`).join("")}</select></label>
      <div class="row"><label class="f">Abre<input type="time" id="deStart" value="${d?.start || "10:00"}"></label><label class="f">Cierra<input type="time" id="deEnd" value="${d?.end || "19:00"}"></label></div>
      <h2>Turnos del día (${bookings.length})</h2>
      ${bookings.length ? bookings.map((b) => `<div class="list-item"><div><b>${b.time}</b> · ${esc(b.serviceName)}<br><small style="color:var(--muted)">${esc(b.name)} · ${esc(b.phone)}</small></div><a class="btn sm" href="https://wa.me/${b.phone.replace(/\D/g, "")}" target="_blank">WA</a></div>`).join("") : `<p class="sub" style="margin:0">Sin turnos.</p>`}
      ${bookings.length && !d ? `<p style="color:var(--amber)">⚠ Hay turnos en un día cerrado.</p>` : ""}`;
    const upd = () => {
      const loc = $("#deLoc").value;
      if (!loc) delete C().days[aSel];
      else C().days[aSel] = { loc, start: $("#deStart").value || "10:00", end: $("#deEnd").value || "19:00" };
      save(); renderAgenda();
    };
    $("#deLoc").onchange = upd; $("#deStart").onchange = upd; $("#deEnd").onchange = upd;
  }
  $("#rApply").addEventListener("click", () => {
    const from = $("#rFrom").value, to = $("#rTo").value;
    if (!from || !to || to < from) return alert("Revisá las fechas");
    const dows = $$("#rDows input:checked").map((i) => Number(i.value));
    const loc = $("#rLoc").value;
    let n = 0;
    for (let s = from; s <= to; s = addDays(s, 1)) {
      if (!dows.includes(parse(s).getDay())) continue;
      if (!loc) delete C().days[s];
      else C().days[s] = { loc, start: $("#rStart").value, end: $("#rEnd").value };
      n++;
    }
    save(); renderAgenda();
    status(`${n} días actualizados ✓`, "ok");
  });
  $("#slotStep").addEventListener("change", (e) => { C().slotStep = Number(e.target.value); save(); });

  // ───────── turnos ─────────
  function clientRows(list) {
    if (!list.length) return `<tr><td class="sub">No hay turnos.</td></tr>`;
    return `<tr><th>Fecha</th><th>Cliente</th><th>Servicio</th><th>Lugar</th><th>Estado</th><th></th></tr>` + list.map((c) => `<tr>
      <td><b>${nice(c.date)}</b><small>${c.time} hs · ${c.id}</small></td>
      <td>${esc(c.name)}<small><a href="https://wa.me/${esc(c.phone.replace(/\D/g, ""))}" target="_blank">${esc(c.phone)}</a>${c.email ? " · " + esc(c.email) : ""}</small>${c.notes ? `<small>“${esc(c.notes)}”</small>` : ""}</td>
      <td>${esc(c.serviceName)}<small>${money(c.price)} · ${c.duration} min</small></td>
      <td>${esc(c.locationName)}</td>
      <td><span class="pill ${c.status}">${c.status}</span></td>
      <td><div class="acts">
        ${c.status === "confirmada" ? `<button class="btn sm" data-cs="completada" data-id="${c.id}">✓ Hecho</button><button class="btn sm r" data-cs="cancelada" data-id="${c.id}">Cancelar</button>` : `<button class="btn sm" data-cs="confirmada" data-id="${c.id}">Reactivar</button>`}
        <button class="btn sm r" data-cdel="${c.id}" title="Eliminar">✕</button></div></td></tr>`).join("");
  }
  function filteredClients() {
    const f = $("#tFilter").value, loc = $("#tLoc").value, q = $("#tSearch").value.toLowerCase().trim();
    let l = [...S.clients];
    if (f === "prox") l = l.filter((c) => c.date >= S.today && c.status === "confirmada");
    if (f === "hoy") l = l.filter((c) => c.date === S.today);
    if (f === "pasados") l = l.filter((c) => c.date < S.today);
    if (f === "cancelada") l = l.filter((c) => c.status === "cancelada");
    if (loc) l = l.filter((c) => c.locationId === loc);
    if (q) l = l.filter((c) => [c.name, c.id, c.phone, c.email, c.serviceName].join(" ").toLowerCase().includes(q));
    return l.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time) * (f === "pasados" || f === "todos" ? -1 : 1));
  }
  function renderTurnos() {
    $("#tLoc").innerHTML = `<option value="">Todas las ciudades</option>` + C().locations.map((l) => `<option value="${l.id}">${esc(l.name)}</option>`).join("");
    $("#tTable").innerHTML = clientRows(filteredClients());
  }
  ["#tFilter", "#tLoc", "#tSearch"].forEach((s) => $(s).addEventListener("input", () => ($("#tTable").innerHTML = clientRows(filteredClients()))));
  $("#tCsv").addEventListener("click", () => {
    const rows = [["codigo", "fecha", "hora", "servicio", "precio", "lugar", "nombre", "telefono", "email", "estado", "notas"], ...filteredClients().map((c) => [c.id, c.date, c.time, c.serviceName, c.price, c.locationName, c.name, c.phone, c.email, c.status, c.notes])];
    const csv = rows.map((r) => r.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv" }));
    a.download = `turnos-bevacqua-${S.today}.csv`;
    a.click();
  });
  document.addEventListener("click", async (e) => {
    const cs = e.target.closest("[data-cs]");
    const cd = e.target.closest("[data-cdel]");
    const ps = e.target.closest("[data-ps]");
    const pd = e.target.closest("[data-pdel]");
    try {
      if (cs) { await api("booking", { method: "PATCH", body: JSON.stringify({ kind: "cliente", id: cs.dataset.id, status: cs.dataset.cs }) }); S.clients.find((c) => c.id === cs.dataset.id).status = cs.dataset.cs; }
      else if (cd) { if (!confirm("¿Eliminar este turno definitivamente?")) return; await api(`booking/cliente/${cd.dataset.cdel}`, { method: "DELETE" }); S.clients = S.clients.filter((c) => c.id !== cd.dataset.cdel); }
      else if (ps) { await api("booking", { method: "PATCH", body: JSON.stringify({ kind: "profesional", id: ps.dataset.id, status: ps.dataset.ps }) }); S.pros.find((p) => p.id === ps.dataset.id).status = ps.dataset.ps; }
      else if (pd) { if (!confirm("¿Eliminar esta reserva definitivamente?")) return; await api(`booking/profesional/${pd.dataset.pdel}`, { method: "DELETE" }); S.pros = S.pros.filter((p) => p.id !== pd.dataset.pdel); }
      else return;
      status("Actualizado ✓", "ok");
      renderResumen(); renderTurnos(); renderPros(); renderAgenda(); badges();
    } catch (err) { status(err.message, "err"); }
  });

  // ───────── pros ─────────
  const pMonth = new Date(); pMonth.setDate(1);
  const TYPES = { dia: "Día", semana: "Semana", mes: "Mes" };
  function proRows(list) {
    if (!list.length) return `<tr><td class="sub">Nada por acá.</td></tr>`;
    return `<tr><th>Período</th><th>Profesional</th><th>Puesto</th><th>Valor</th><th>Estado</th><th></th></tr>` + list.map((p) => `<tr>
      <td><b>${TYPES[p.type]}</b><small>${nice(p.start)} → ${nice(p.end)} · ${p.id}</small></td>
      <td>${esc(p.name)}<small><a href="https://wa.me/${esc(p.phone.replace(/\D/g, ""))}" target="_blank">${esc(p.phone)}</a>${p.specialty ? " · " + esc(p.specialty) : ""}${p.instagram ? " · " + esc(p.instagram) : ""}</small>${p.notes ? `<small>“${esc(p.notes)}”</small>` : ""}</td>
      <td>${pad(p.station)}</td><td>${money(p.price)}</td>
      <td><span class="pill ${p.status}">${p.status}</span></td>
      <td><div class="acts">
        ${p.status === "pendiente" ? `<button class="btn sm g" data-ps="aprobada" data-id="${p.id}">Aprobar</button><button class="btn sm r" data-ps="rechazada" data-id="${p.id}">Rechazar</button>` : ""}
        ${p.status === "aprobada" ? `<button class="btn sm r" data-ps="cancelada" data-id="${p.id}">Cancelar</button>` : ""}
        ${p.status === "rechazada" || p.status === "cancelada" ? `<button class="btn sm" data-ps="pendiente" data-id="${p.id}">Reabrir</button>` : ""}
        <button class="btn sm r" data-pdel="${p.id}">✕</button></div></td></tr>`).join("");
  }
  function renderPros() {
    const st = C().studio;
    cal($("#pCal"), pMonth, (s) => {
      const open = st.openDays.includes(parse(s).getDay()) && !st.blocked.includes(s);
      const act = activePros(s);
      const bars = Array.from({ length: st.stations }, (_, i) => {
        const p = act.find((x) => x.station === i + 1);
        return `<i class="${p ? (p.status === "pendiente" ? "p" : "x") : ""}" title="Puesto ${i + 1}${p ? ": " + esc(p.name) : ""}"></i>`;
      }).join("");
      return { cls: open ? "" : "closed", html: open ? `<span class="st">${bars}</span>` : `<span class="hrs">${st.blocked.includes(s) ? "bloqueado" : "cerrado"}</span><span class="st">${bars}</span>` };
    }, (s) => {
      if (s && s >= S.today && st.openDays.includes(parse(s).getDay())) {
        const i = st.blocked.indexOf(s);
        if (i >= 0) st.blocked.splice(i, 1); else st.blocked.push(s);
        save();
      }
      renderPros();
    });
    $("#sStations").value = st.stations; $("#sHours").value = st.hours; $("#sAddr").value = st.address;
    $("#sDay").value = st.prices.day; $("#sWeek").value = st.prices.week; $("#sMonth").value = st.prices.month;
    $("#sPerks").value = (st.perks || []).join("\n");
    $("#sDows").innerHTML = [1, 2, 3, 4, 5, 6, 0].map((d) => `<label><input type="checkbox" value="${d}" ${st.openDays.includes(d) ? "checked" : ""}>${DOWS[d]}</label>`).join("");
    const f = $("#prFilter").value;
    let l = [...S.pros];
    if (f === "activas") l = l.filter((p) => p.end >= S.today && p.status !== "rechazada" && p.status !== "cancelada");
    if (f === "pendiente") l = l.filter((p) => p.status === "pendiente");
    $("#prTable").innerHTML = proRows(l.sort((a, b) => a.start.localeCompare(b.start)));
  }
  $("#prFilter").addEventListener("change", renderPros);
  const bindStudio = (sel, fn) => $(sel).addEventListener("change", (e) => { fn(C().studio, e.target.value); save(); renderPros(); });
  bindStudio("#sStations", (s, v) => (s.stations = Math.max(1, Number(v) || 1)));
  bindStudio("#sHours", (s, v) => (s.hours = v));
  bindStudio("#sAddr", (s, v) => (s.address = v));
  bindStudio("#sDay", (s, v) => (s.prices.day = Number(v) || 0));
  bindStudio("#sWeek", (s, v) => (s.prices.week = Number(v) || 0));
  bindStudio("#sMonth", (s, v) => (s.prices.month = Number(v) || 0));
  bindStudio("#sPerks", (s, v) => (s.perks = v.split("\n").map((x) => x.trim()).filter(Boolean)));
  $("#sDows").addEventListener("change", () => { C().studio.openDays = $$("#sDows input:checked").map((i) => Number(i.value)); save(); renderPros(); });

  // ───────── contenido ─────────
  function renderPosts() {
    $("#posts").innerHTML = C().posts.map((p, i) => `<div class="post">
      <div class="m">${p.type === "video" ? `<video src="${esc(p.src)}" poster="${esc(p.poster || "")}" muted loop playsinline preload="none" onmouseenter="this.play()" onmouseleave="this.pause()"></video>` : `<img src="${esc(p.src)}" alt="" loading="lazy">`}<span class="pill ty">${p.type === "video" ? "▶ video" : "foto"}${i < 8 ? " · carrete" : ""}</span></div>
      <div class="b"><b>${esc(p.title || "Sin título")}</b><small style="color:var(--muted)">${esc(p.tag || "")} · ${esc(p.place || "")}</small>
      <div class="acts"><button class="btn sm" data-pe="${p.id}">Editar</button><button class="btn sm" data-pm="${p.id}" data-dir="-1" ${i === 0 ? "disabled" : ""}>↑</button><button class="btn sm" data-pm="${p.id}" data-dir="1" ${i === C().posts.length - 1 ? "disabled" : ""}>↓</button><button class="btn sm r" data-px="${p.id}">✕</button></div></div></div>`).join("") || `<p class="sub">Todavía no hay publicaciones.</p>`;
  }
  $("#posts").addEventListener("click", (e) => {
    const ed = e.target.closest("[data-pe]"), mv = e.target.closest("[data-pm]"), dl = e.target.closest("[data-px]");
    const posts = C().posts;
    if (ed) openPost(posts.find((p) => p.id === ed.dataset.pe));
    if (mv) { const i = posts.findIndex((p) => p.id === mv.dataset.pm); const j = i + Number(mv.dataset.dir); [posts[i], posts[j]] = [posts[j], posts[i]]; save(); renderPosts(); }
    if (dl && confirm("¿Eliminar esta publicación?")) { C().posts = posts.filter((p) => p.id !== dl.dataset.px); save(); renderPosts(); }
  });
  let editing = null;
  function openPost(p) {
    editing = p;
    $("#mTitle").value = p.title || ""; $("#mTag").value = p.tag || ""; $("#mPlace").value = p.place || "";
    $("#mSize").value = p.size || "normal"; $("#mText").value = p.text || ""; $("#mSrc").value = p.src || "";
    $("#mType").value = p.type || "image"; $("#mPoster").value = p.poster || "";
    $("#postModal").classList.add("on");
  }
  $("#mCancel").addEventListener("click", () => $("#postModal").classList.remove("on"));
  $("#mSave").addEventListener("click", () => {
    Object.assign(editing, { title: $("#mTitle").value, tag: $("#mTag").value, place: $("#mPlace").value, size: $("#mSize").value, text: $("#mText").value, src: $("#mSrc").value, type: $("#mType").value, poster: $("#mPoster").value });
    if (!C().posts.includes(editing)) C().posts.unshift(editing);
    save(); renderPosts();
    $("#postModal").classList.remove("on");
  });
  $("#addUrl").addEventListener("click", () => openPost({ id: "p" + Date.now().toString(36), type: "image", size: "normal" }));

  // uploads (chunked)
  const drop = $("#drop");
  drop.addEventListener("click", (e) => { if (e.target === drop || e.target.tagName === "B" || e.target.tagName === "BR") $("#file").click(); });
  $("#file").addEventListener("change", (e) => upload([...e.target.files]));
  drop.addEventListener("dragover", (e) => { e.preventDefault(); drop.classList.add("over"); });
  drop.addEventListener("dragleave", () => drop.classList.remove("over"));
  drop.addEventListener("drop", (e) => { e.preventDefault(); drop.classList.remove("over"); upload([...e.dataTransfer.files]); });

  async function posterFor(file) {
    // grab a frame from the video and upload it as cover
    return new Promise((resolve) => {
      const v = document.createElement("video");
      v.muted = true; v.playsInline = true; v.preload = "auto";
      v.src = URL.createObjectURL(file);
      v.addEventListener("loadeddata", () => { v.currentTime = Math.min(1, (v.duration || 2) / 3); }, { once: true });
      v.addEventListener("seeked", () => {
        const c = document.createElement("canvas");
        const w = Math.min(960, v.videoWidth || 960);
        c.width = w; c.height = Math.round(w * (v.videoHeight / v.videoWidth || 1.25));
        c.getContext("2d").drawImage(v, 0, 0, c.width, c.height);
        c.toBlob((b) => resolve(b), "image/jpeg", 0.8);
      }, { once: true });
      v.addEventListener("error", () => resolve(null), { once: true });
      setTimeout(() => resolve(null), 8000);
    });
  }
  async function sendFile(blob, name, type, onProg) {
    const init = await api("media", { method: "POST", body: JSON.stringify({ name, type, size: blob.size }) });
    for (let i = 0; i < init.parts; i++) {
      const part = blob.slice(i * init.chunk, (i + 1) * init.chunk);
      await api(`media/${init.id}/${i}`, { method: "PUT", body: part, headers: { "content-type": "application/octet-stream" } });
      onProg && onProg((i + 1) / init.parts);
    }
    return init.url;
  }
  async function upload(files) {
    if (!files.length) return;
    const prog = $("#prog"), bar = prog.querySelector("i");
    prog.style.display = "block";
    for (const [k, f] of files.entries()) {
      const isVideo = f.type.startsWith("video/");
      if (!isVideo && !f.type.startsWith("image/")) continue;
      $("#progTxt").textContent = `Subiendo ${k + 1}/${files.length}: ${f.name}`;
      try {
        let poster = "";
        if (isVideo) { const pb = await posterFor(f); if (pb) poster = await sendFile(pb, "poster.jpg", "image/jpeg"); }
        const url = await sendFile(f, f.name, f.type, (x) => (bar.style.width = Math.round(x * 100) + "%"));
        const post = { id: "p" + Date.now().toString(36), type: isVideo ? "video" : "image", src: url, poster, title: f.name.replace(/\.[^.]+$/, "").slice(0, 40), tag: "Experiencia", place: "", text: "", size: "normal" };
        C().posts.unshift(post);
        save(); renderPosts();
        if (k === files.length - 1) openPost(post);
      } catch (err) { status("Error subiendo " + f.name + ": " + err.message, "err"); }
    }
    $("#progTxt").textContent = "Listo ✓ Completá título y categoría.";
    setTimeout(() => { prog.style.display = "none"; bar.style.width = 0; }, 1200);
    $("#file").value = "";
  }

  // ───────── servicios ─────────
  function renderServices() {
    $("#svcList").innerHTML = C().services.map((s, i) => `<div class="card" style="margin-bottom:12px" data-svc="${i}">
      <div class="row"><label class="f">Nombre<input data-k="name" value="${esc(s.name)}"></label><label class="f">Duración (min)<input type="number" step="15" min="15" data-k="duration" value="${s.duration}"></label><label class="f">Precio $<input type="number" data-k="price" value="${s.price}"></label>
      <label class="f">Estado<select data-k="active"><option value="1" ${s.active ? "selected" : ""}>Visible</option><option value="0" ${!s.active ? "selected" : ""}>Oculto</option></select></label></div>
      <label class="f">Descripción<input data-k="desc" value="${esc(s.desc || "")}"></label>
      <p style="margin:12px 0 0"><button class="btn sm r" data-sdel="${i}">Eliminar servicio</button></p></div>`).join("");
  }
  $("#svcList").addEventListener("change", (e) => {
    const card = e.target.closest("[data-svc]"); const k = e.target.dataset.k;
    if (!card || !k) return;
    const s = C().services[Number(card.dataset.svc)];
    s[k] = k === "duration" || k === "price" ? Number(e.target.value) || 0 : k === "active" ? e.target.value === "1" : e.target.value;
    save();
  });
  $("#svcList").addEventListener("click", (e) => {
    const d = e.target.closest("[data-sdel]");
    if (d && confirm("¿Eliminar el servicio? Los turnos ya reservados se mantienen.")) { C().services.splice(Number(d.dataset.sdel), 1); save(); renderServices(); }
  });
  $("#addSvc").addEventListener("click", () => { C().services.push({ id: "s" + Date.now().toString(36), name: "Nuevo servicio", duration: 60, price: 0, desc: "", active: true }); save(); renderServices(); });

  // ───────── textos / ciudades ─────────
  function renderTextos() {
    $$("[data-cfg]").forEach((el) => { el.value = el.dataset.cfg.split(".").reduce((o, k) => o?.[k], C()) || ""; });
    $("#locList").innerHTML = C().locations.map((l, i) => `<div class="card row" data-loc="${i}" style="align-items:end">
      <label class="f">Ciudad<input data-k="name" value="${esc(l.name)}"></label><label class="f">Abreviatura<input data-k="short" maxlength="4" value="${esc(l.short || "")}"></label>
      <label class="f">Dirección<input data-k="address" value="${esc(l.address || "")}"></label><label class="f">Color en agenda<input type="color" data-k="color" value="${l.color || "#2CF56D"}" style="height:44px;padding:4px"></label>
      <div>${i > 0 ? `<button class="btn sm r" data-ldel="${i}">Eliminar</button>` : `<small style="color:var(--muted)">Ciudad principal (verde en la web)</small>`}</div></div>`).join("");
  }
  $$("[data-cfg]").forEach((el) => el.addEventListener("input", () => {
    const keys = el.dataset.cfg.split(".");
    keys.slice(0, -1).reduce((o, k) => o[k], C())[keys.at(-1)] = el.value;
    save();
  }));
  $("#locList").addEventListener("change", (e) => {
    const card = e.target.closest("[data-loc]"); const k = e.target.dataset.k;
    if (!card || !k) return;
    C().locations[Number(card.dataset.loc)][k] = e.target.value;
    save(); renderAgenda();
  });
  $("#locList").addEventListener("click", (e) => {
    const d = e.target.closest("[data-ldel]");
    if (!d) return;
    const l = C().locations[Number(d.dataset.ldel)];
    const used = Object.values(C().days).filter((x) => x.loc === l.id).length;
    if (!confirm(`¿Eliminar ${l.name}?${used ? ` Se cerrarán ${used} días de agenda asignados.` : ""}`)) return;
    for (const [k, v] of Object.entries(C().days)) if (v.loc === l.id) delete C().days[k];
    C().locations.splice(Number(d.dataset.ldel), 1);
    save(); renderTextos(); renderAgenda();
  });
  $("#addLoc").addEventListener("click", () => {
    const name = prompt("Nombre de la ciudad (ej: Córdoba, Punta del Este)");
    if (!name) return;
    let id = slug(name);
    while (C().locations.some((l) => l.id === id)) id += "-2";
    C().locations.push({ id, name, short: name.slice(0, 3).toUpperCase(), address: "", color: COLORS[C().locations.length % COLORS.length] });
    save(); renderTextos(); renderAgenda();
  });
  $("#resetCfg").addEventListener("click", async () => {
    if (!confirm("Esto vuelve textos, servicios, agenda y contenido a la versión original. Los turnos NO se borran. ¿Seguir?")) return;
    await api("reset", { method: "POST" }); await load(); renderAll(); status("Restaurado ✓", "ok");
  });

  // ───────── mensajes ─────────
  function renderMsgs() {
    $("#msgList").innerHTML = S.messages.map((m, i) => `<div class="card" style="margin-bottom:10px;${m.read ? "opacity:.6" : ""}">
      <div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap"><b>${esc(m.name)}</b><small style="color:var(--muted)">${new Date(m.createdAt).toLocaleString("es-AR")}</small></div>
      <p style="color:var(--muted);margin:4px 0 10px">${esc(m.contact)}</p><p style="white-space:pre-wrap;margin:0 0 12px">${esc(m.message)}</p>
      <div class="acts">${m.read ? "" : `<button class="btn sm" data-mr="${i}">Marcar leído</button>`}<button class="btn sm r" data-md="${i}">Eliminar</button></div></div>`).join("") || `<p class="sub">Sin mensajes.</p>`;
  }
  $("#msgList").addEventListener("click", async (e) => {
    const r = e.target.closest("[data-mr]"), d = e.target.closest("[data-md]");
    if (r) S.messages[Number(r.dataset.mr)].read = true;
    else if (d) S.messages.splice(Number(d.dataset.md), 1);
    else return;
    await api("messages", { method: "PUT", body: JSON.stringify(S.messages) });
    renderMsgs(); badges();
  });

  if (KEY) start();
})();
