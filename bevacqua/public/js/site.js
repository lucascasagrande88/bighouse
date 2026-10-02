/* BEVACQUA · LOOK & MORE — front */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  // ───────── dates ─────────
  const MONTHS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
  const DOWS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
  const pad = (n) => String(n).padStart(2, "0");
  const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parse = (s) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d, 12); };
  const addDays = (s, n) => { const d = parse(s); d.setDate(d.getDate() + n); return ymd(d); };
  const toMin = (t) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
  const toHHMM = (m) => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
  const nice = (s, withDow = true) => { const d = parse(s); return `${withDow ? DOWS[d.getDay()] + " " : ""}${d.getDate()} de ${MONTHS[d.getMonth()]}`; };
  const short = (s) => { const d = parse(s); return `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)}`; };
  const money = (n) => "$" + Number(n || 0).toLocaleString("es-AR");
  const dur = (m) => (m >= 60 ? `${Math.floor(m / 60)} h${m % 60 ? " " + (m % 60) + " min" : ""}` : `${m} min`);
  const nowMinAR = () => { const d = new Date(Date.now() - 3 * 3600 * 1000); return d.getUTCHours() * 60 + d.getUTCMinutes(); };

  let D = null; // public data
  let booted = false;

  // ───────── ring logo ─────────
  let ringN = 0;
  function ring(el, { outer = "#2CF56D", inner = "#fff", center = true } = {}) {
    const id = "rg" + ringN++;
    el.innerHTML = `<svg viewBox="0 0 600 600" style="width:100%;height:100%;animation:spin 26s linear infinite">
      <defs><path id="${id}o" d="M300,300 m-250,0 a250,250 0 1,1 500,0 a250,250 0 1,1 -500,0"/><path id="${id}i" d="M300,300 m-205,0 a205,205 0 1,1 410,0 a205,205 0 1,1 -410,0"/></defs>
      <g font-family="Jost, Futura, sans-serif">
      <text fill="${outer}" font-size="38" font-weight="700" letter-spacing="6"><textPath href="#${id}o" textLength="1560" lengthAdjust="spacing">BEVACQUA • BEVACQUA • BEVACQUA • BEVACQUA •</textPath></text>
      <text fill="${inner}" font-size="31" font-weight="300" letter-spacing="5"><textPath href="#${id}i" textLength="1280" lengthAdjust="spacing">LOOK &amp; MORE • LOOK &amp; MORE • LOOK &amp; MORE • LOOK &amp; MORE •</textPath></text>
      ${center ? `<text x="300" y="338" fill="${outer}" font-size="108" font-weight="700" letter-spacing="20" text-anchor="middle">BVCQ</text>` : ""}
      </g></svg>`;
  }
  $$("[data-ring]").forEach((el) => ring(el, el.dataset.ring === "mini" ? { inner: "#fff", center: false } : {}));

  // ───────── toast ─────────
  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => t.classList.remove("show"), 3800);
  }

  // ───────── calendar component ─────────
  function Calendar(el, opts) {
    const state = { month: opts.start ? parse(opts.start) : new Date() };
    state.month.setDate(1);
    const min = parse(opts.min); min.setDate(1);
    const max = parse(opts.max); max.setDate(1);
    function render() {
      const m = state.month;
      const y = m.getFullYear(), mo = m.getMonth();
      const first = new Date(y, mo, 1, 12);
      const lead = (first.getDay() + 6) % 7; // monday first
      const days = new Date(y, mo + 1, 0).getDate();
      let html = `<div class="cal-head"><h4>${MONTHS[mo]} <span class="serif" style="color:var(--muted)">${y}</span></h4>
        <div class="cal-nav"><button data-nav="-1" aria-label="Mes anterior" ${m <= min ? "disabled" : ""}>←</button><button data-nav="1" aria-label="Mes siguiente" ${m >= max ? "disabled" : ""}>→</button></div></div>
        <div class="cal-grid">${["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((d) => `<div class="cal-dow">${d}</div>`).join("")}`;
      for (let i = 0; i < lead; i++) html += `<div class="cal-day empty"></div>`;
      for (let d = 1; d <= days; d++) {
        const s = `${y}-${pad(mo + 1)}-${pad(d)}`;
        const r = opts.day(s) || {};
        const cls = ["cal-day", r.cls || "", r.click ? "clickable" : "off", s === D.today ? "today" : "", s === opts.selected ? "sel" : ""].join(" ");
        html += r.click
          ? `<button class="${cls}" data-date="${s}" aria-label="${nice(s)}"><span>${d}</span>${r.html || ""}</button>`
          : `<div class="${cls}"><span>${d}</span>${r.html || ""}</div>`;
      }
      el.innerHTML = html + "</div>";
    }
    el.addEventListener("click", (e) => {
      const nav = e.target.closest("[data-nav]");
      if (nav) { state.month.setMonth(state.month.getMonth() + Number(nav.dataset.nav)); render(); return; }
      const b = e.target.closest("[data-date]");
      if (b) { opts.selected = b.dataset.date; render(); opts.onPick(b.dataset.date); }
    });
    render();
    return {
      render,
      go(s) { state.month = parse(s); state.month.setDate(1); render(); },
      select(s) { opts.selected = s; render(); },
    };
  }

  // ───────── availability helpers ─────────
  const locOf = (id) => D.locations.find((l) => l.id === id) || { id, name: id, short: id.toUpperCase(), address: "" };
  const locCls = (id) => (D.locations[0] && D.locations[0].id === id ? "loc-bue" : "loc-other");
  function freeSlots(date, duration) {
    const day = D.days[date];
    if (!day) return [];
    const step = D.slotStep || 30;
    const s = toMin(day.start), e = toMin(day.end);
    const taken = D.busy.filter((b) => b.date === date).map((b) => [toMin(b.time), toMin(b.time) + b.duration]);
    const out = [];
    for (let t = s; t + duration <= e; t += step) {
      if (date === D.today && t <= nowMinAR() + 60) continue;
      if (taken.some(([a, z]) => t < z && t + duration > a)) continue;
      out.push(toHHMM(t));
    }
    return out;
  }
  const minService = () => Math.min(...D.services.map((s) => s.duration), 60);
  const sortedDays = () => Object.keys(D.days).sort();
  function stops() {
    const out = [];
    for (const d of sortedDays()) {
      const loc = D.days[d].loc;
      const last = out[out.length - 1];
      if (last && last.loc === loc && (parse(d) - parse(last.end)) / 864e5 <= 3) last.end = d;
      else out.push({ loc, start: d, end: d });
    }
    return out;
  }
  const proType = (t) => ({ dia: { len: 1, key: "day", label: "Día", unit: "por día" }, semana: { len: 7, key: "week", label: "Semana", unit: "por semana" }, mes: { len: 30, key: "month", label: "Mes", unit: "por mes" } }[t]);
  function proFree(type, start) {
    const end = addDays(start, proType(type).len - 1);
    const all = Array.from({ length: D.studio.stations }, (_, i) => i + 1);
    return all.filter((st) => !D.proBusy.some((p) => p.station === st && p.start <= end && start <= p.end));
  }
  const studioOpen = (s) => D.studio.openDays.includes(parse(s).getDay()) && !D.studio.blocked.includes(s);

  // ───────── bindings ─────────
  function bindTexts() {
    $$("[data-bind]").forEach((el) => {
      const v = el.dataset.bind.split(".").reduce((o, k) => (o ? o[k] : undefined), D);
      if (v) el.textContent = v;
    });
    const c = D.contact;
    const wa = `https://wa.me/${c.whatsapp}`;
    $("#cWa").href = wa;
    $("#cIg").href = `https://instagram.com/${c.instagram}`;
    $("#cIgUser").textContent = "@" + c.instagram;
    $("#cMail").href = `mailto:${c.email}`;
    $("#cMailTxt").textContent = c.email;
    $("#year").textContent = new Date().getFullYear();
    if (D.brand.manifesto) {
      // keep the editorial italics on the first manifesto: only swap when admin changed it
      const def = $("#manifesto").textContent.replace(/\s+/g, " ").trim();
      if (def !== D.brand.manifesto.trim()) $("#manifesto").textContent = D.brand.manifesto;
    }
  }

  // ───────── content ─────────
  const mediaEl = (p, attrs = "") =>
    p.type === "video"
      ? `<video src="${esc(p.src)}" ${p.poster ? `poster="${esc(p.poster)}"` : ""} muted loop playsinline preload="none" data-auto ${attrs}></video>`
      : `<img src="${esc(p.src)}" alt="${esc(p.title)}" loading="lazy" ${attrs}>`;

  function renderContent() {
    const track = $("#reelTrack");
    track.querySelectorAll(".reel-card").forEach((n) => n.remove());
    D.posts.slice(0, 8).forEach((p, i) => {
      const a = document.createElement("article");
      a.className = "reel-card";
      a.dataset.post = p.id;
      a.dataset.cursor = p.type === "video" ? "PLAY" : "VER";
      a.innerHTML = `${mediaEl(p)}<span class="reel-tag">${esc(p.tag)}</span><span class="reel-idx">${pad(i + 1)}</span>
        <div class="reel-meta"><h3>${esc(p.title)}</h3><small>${esc(p.place || "")}</small></div>`;
      track.appendChild(a);
    });
    const tags = ["Todo", ...new Set(D.posts.map((p) => p.tag).filter(Boolean))];
    $("#filters").innerHTML = tags.map((t, i) => `<button class="chip ${i ? "" : "on"}" data-tag="${esc(t)}">${esc(t)}</button>`).join("");
    renderGrid("Todo");
  }
  function renderGrid(tag) {
    const list = tag === "Todo" ? D.posts : D.posts.filter((p) => p.tag === tag);
    $("#grid").innerHTML = list
      .map((p) => `<article class="tile ${p.size === "wide" ? "wide" : p.size === "tall" ? "tall" : ""}" data-post="${p.id}" data-cursor="${p.type === "video" ? "PLAY" : "VER"}">
        ${mediaEl(p)}<div class="tile-cap"><span>${esc(p.tag)}</span><b>${esc(p.title)}</b></div></article>`)
      .join("") || `<p class="empty-msg">Pronto, contenido nuevo.</p>`;
    observeVideos();
    if (window.ScrollTrigger) ScrollTrigger.refresh();
  }
  $("#filters").addEventListener("click", (e) => {
    const b = e.target.closest(".chip");
    if (!b) return;
    $$(".chip").forEach((c) => c.classList.toggle("on", c === b));
    renderGrid(b.dataset.tag);
  });

  // lightbox
  document.addEventListener("click", (e) => {
    const card = e.target.closest("[data-post]");
    if (!card) return;
    const p = D.posts.find((x) => x.id === card.dataset.post);
    if (!p) return;
    $("#lbMedia").innerHTML = p.type === "video" ? `<video src="${esc(p.src)}" poster="${esc(p.poster || "")}" autoplay loop playsinline controls muted></video>` : `<img src="${esc(p.src)}" alt="${esc(p.title)}">`;
    $("#lbTag").textContent = p.tag || "";
    $("#lbTitle").textContent = p.title || "";
    $("#lbText").textContent = p.text || "";
    $("#lbPlace").textContent = p.place ? "📍 " + p.place : "";
    $("#lightbox").classList.add("open");
    lenis && lenis.stop();
  });
  const closeLb = () => { $("#lightbox").classList.remove("open"); $("#lbMedia").innerHTML = ""; lenis && lenis.start(); };
  $("#lbClose").addEventListener("click", closeLb);
  $("#lbBook").addEventListener("click", closeLb);
  $("#lightbox").addEventListener("click", (e) => { if (e.target.id === "lightbox") closeLb(); });
  document.addEventListener("keydown", (e) => e.key === "Escape" && closeLb());

  // autoplay videos only when visible
  const vio = "IntersectionObserver" in window
    ? new IntersectionObserver((ents) => ents.forEach((en) => {
        const v = en.target;
        if (en.isIntersecting) { v.preload = "auto"; v.play().catch(() => {}); } else v.pause();
      }), { rootMargin: "200px" })
    : null;
  function observeVideos() { $$("video[data-auto]").forEach((v) => { if (!v._obs && vio) { vio.observe(v); v._obs = 1; } }); }

  // ───────── Esteban calendar ─────────
  let eCal;
  function renderEsteban() {
    const today = D.today;
    const todayDay = D.days[today];
    const st = stops();
    const nextStop = st.find((s) => s.end >= today);
    if (todayDay) {
      const loc = locOf(todayDay.loc);
      $("#nowText").innerHTML = `Hoy Esteban está en <b>${esc(loc.name)}</b>`;
      const n = freeSlots(today, minService()).length;
      $("#nowSub").textContent = `${todayDay.start} — ${todayDay.end} hs · ${loc.address} · ${n ? n + " horarios libres hoy" : "Hoy sin horarios libres"}`;
    } else if (nextStop) {
      const loc = locOf(nextStop.loc);
      $("#nowText").innerHTML = `Próxima parada: <b>${esc(loc.name)}</b>`;
      $("#nowSub").textContent = `Desde el ${nice(nextStop.start)} · ${loc.address}`;
    } else {
      $("#nowText").textContent = "Agenda en preparación";
      $("#nowSub").textContent = "Escribinos y te avisamos las próximas fechas.";
    }
    $("#qWhere").textContent = (todayDay ? `Hoy: ${locOf(todayDay.loc).name}. ` : "") + D.locations.map((l) => l.name).join(" / ") + ".";
    const firstFree = sortedDays().find((d) => freeSlots(d, minService()).length);
    if (firstFree) $("#qWhen").textContent = `Próximo turno libre: ${nice(firstFree)}.`;

    $("#stops").innerHTML = st.slice(0, 6).map((s, i) => {
      const loc = locOf(s.loc);
      const cur = s.start <= today && s.end >= today;
      return `<div class="stop ${cur ? "current" : ""}"><b>${esc(loc.name)}</b><span>${short(s.start)} — ${short(s.end)}${cur ? " · ahora" : ""}</span></div>`;
    }).join("") || `<p style="color:var(--muted)">Sin fechas publicadas.</p>`;

    $("#legend").innerHTML = D.locations.map((l) => `<span><i class="${locCls(l.id)}" style="background:${locCls(l.id) === "loc-bue" ? "var(--green)" : "rgba(255,255,255,.5)"}"></i>${esc(l.name)}</span>`).join("") + `<span><i style="border:1px solid var(--line)"></i>Sin agenda</span>`;

    const last = sortedDays().pop() || today;
    eCal = Calendar($("#estebanCal"), {
      start: today, min: today, max: last,
      day(s) {
        const d = D.days[s];
        if (!d || s < today) return {};
        return { cls: locCls(d.loc), click: true, html: `<small>${esc(locOf(d.loc).short || locOf(d.loc).name)}</small>` };
      },
      onPick(s) {
        const d = D.days[s];
        const loc = locOf(d.loc);
        const n = freeSlots(s, minService());
        const panel = $("#dayPanel");
        panel.innerHTML = `<div class="label">${nice(s)}</div>
          <h5>Esteban está en <b>${esc(loc.name)}</b></h5>
          <p>${d.start} — ${d.end} hs · ${esc(loc.address)}<br>${n.length ? `${n.length} horarios disponibles · desde las ${n[0]}` : "Sin horarios libres este día"}</p>
          ${n.length ? `<button class="btn btn-green" id="dayBook">Reservar este día →</button>` : ""}`;
        panel.classList.add("show");
        const btn = $("#dayBook");
        if (btn) btn.onclick = () => { booking.preset(d.loc, s); scrollToEl("#turnos"); };
      },
    });
  }

  // ───────── client booking ─────────
  const booking = (() => {
    const st = { step: 0, loc: null, service: null, date: null, time: null };
    let cal;
    const steps = $$("#bSteps li");
    const panes = $$("#turnos .step-pane");
    function go(n) {
      st.step = n;
      panes.forEach((p) => p.classList.toggle("active", Number(p.dataset.pane) === n));
      steps.forEach((li, i) => {
        li.classList.toggle("active", i === n);
        li.classList.toggle("done", i < n && n < 5);
      });
      const em = (i, t) => (steps[i].querySelector("em").textContent = t || "");
      em(0, st.loc && locOf(st.loc).name);
      em(1, st.service && st.service.name);
      em(2, st.date && short(st.date));
      em(3, st.time);
      keepInView("#turnos .booking");
      if (n === 0) renderLocs();
      if (n === 1) renderServices();
      if (n === 2) renderCal();
      if (n === 3) renderSlots();
      if (n === 4) renderSummary();
    }
    function renderLocs() {
      $("#bLocs").innerHTML = D.locations.map((l) => {
        const ds = sortedDays().filter((d) => D.days[d].loc === l.id);
        const free = ds.find((d) => freeSlots(d, minService()).length);
        return `<button class="opt ${st.loc === l.id ? "on" : ""}" data-loc="${l.id}" ${free ? "" : "disabled style='opacity:.4'"}>
          <small>📍 ${esc(l.address || "")}</small><b>${esc(l.name)}</b>
          <p>${free ? `Próximo turno: ${nice(free)}` : "Sin fechas por ahora"}</p></button>`;
      }).join("");
    }
    $("#bLocs").addEventListener("click", (e) => {
      const b = e.target.closest("[data-loc]");
      if (!b) return;
      if (st.loc !== b.dataset.loc) { st.date = null; st.time = null; }
      st.loc = b.dataset.loc;
      go(1);
    });
    function renderServices() {
      $("#bServices").innerHTML = D.services.map((s) => `<button class="opt ${st.service?.id === s.id ? "on" : ""}" data-svc="${s.id}">
        <small>${dur(s.duration)}</small><b>${esc(s.name)}</b><p>${esc(s.desc || "")}</p><span class="price">${money(s.price)}</span></button>`).join("");
    }
    $("#bServices").addEventListener("click", (e) => {
      const b = e.target.closest("[data-svc]");
      if (!b) return;
      st.service = D.services.find((s) => s.id === b.dataset.svc);
      st.time = null;
      if (st.date && freeSlots(st.date, st.service.duration).length) go(3);
      else { st.date = null; go(2); }
    });
    function renderCal() {
      const ds = sortedDays().filter((d) => D.days[d].loc === st.loc);
      const first = ds.find((d) => freeSlots(d, st.service.duration).length) || D.today;
      cal = Calendar($("#bCal"), {
        start: st.date || first, min: D.today, max: ds[ds.length - 1] || D.today, selected: st.date,
        day(s) {
          const d = D.days[s];
          if (!d || d.loc !== st.loc) return {};
          const n = freeSlots(s, st.service.duration).length;
          if (!n) return { cls: "", html: "<small>completo</small>" };
          return { cls: locCls(d.loc), click: true, html: `<small>${n} libres</small>` };
        },
        onPick(s) { st.date = s; st.time = null; setTimeout(() => go(3), 180); },
      });
    }
    function renderSlots() {
      const sl = freeSlots(st.date, st.service.duration);
      const d = D.days[st.date];
      $("#bSlots").innerHTML = sl.length
        ? sl.map((t) => `<button class="slot ${st.time === t ? "on" : ""}" data-time="${t}">${t}</button>`).join("")
        : `<p class="empty-msg">No quedan horarios este día. Probá otra fecha.</p>`;
      $("#bSlots").insertAdjacentHTML("beforebegin", "");
      $("#turnos [data-pane='3'] h3").innerHTML = `${nice(st.date)} <span class="serif">· ${esc(locOf(d.loc).name)}</span>`;
    }
    $("#bSlots").addEventListener("click", (e) => {
      const b = e.target.closest("[data-time]");
      if (!b) return;
      st.time = b.dataset.time;
      go(4);
    });
    function renderSummary() {
      const loc = locOf(st.loc);
      $("#bSummary").innerHTML = [
        ["Ubicación", loc.name], ["Servicio", st.service.name], ["Fecha", nice(st.date)], ["Horario", st.time + " hs"], ["Duración", dur(st.service.duration)], ["Valor", money(st.service.price)],
      ].map(([k, v]) => `<div><small>${k}</small><b>${esc(v)}</b></div>`).join("");
      $("#bErr").textContent = "";
    }
    $("#bForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const btn = e.submitter || $("#bForm [type=submit]");
      btn.disabled = true;
      $("#bErr").textContent = "";
      try {
        const res = await fetch("/api/book", {
          method: "POST", headers: { "content-type": "application/json" },
          body: JSON.stringify({ locationId: st.loc, serviceId: st.service.id, date: st.date, time: st.time, name: $("#bName").value, phone: $("#bPhone").value, email: $("#bEmail").value, notes: $("#bNotes").value }),
        });
        const out = await res.json();
        if (!res.ok) throw new Error(out.error || "No se pudo reservar");
        D.busy.push({ date: st.date, time: st.time, duration: st.service.duration });
        done(out.booking);
        renderEsteban();
      } catch (err) {
        $("#bErr").textContent = err.message;
        if (/disponible/.test(err.message)) { await reload(); }
      } finally { btn.disabled = false; }
    });
    function ics(b) {
      const [y, m, d] = b.date.split("-");
      const [h, mi] = b.time.split(":");
      const start = new Date(Date.UTC(+y, +m - 1, +d, +h + 3, +mi));
      const end = new Date(start.getTime() + b.duration * 60000);
      const f = (x) => x.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
      const txt = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Bevacqua//Turnos//ES", "BEGIN:VEVENT", `UID:${b.id}@bevacqua`, `DTSTAMP:${f(new Date())}`, `DTSTART:${f(start)}`, `DTEND:${f(end)}`,
        `SUMMARY:${b.serviceName} · Bevacqua Look & More`, `LOCATION:${b.locationName} — ${b.address}`, `DESCRIPTION:Código ${b.id}`, "END:VEVENT", "END:VCALENDAR"].join("\r\n");
      return URL.createObjectURL(new Blob([txt], { type: "text/calendar" }));
    }
    function done(b) {
      const msg = encodeURIComponent(`Hola Esteban! Reservé un turno 🙌\n${b.serviceName} — ${nice(b.date)} ${b.time} hs (${b.locationName})\nCódigo: ${b.id}\nNombre: ${b.name}`);
      $("#bDone").innerHTML = `<div class="ticket">
        <div class="label">Turno confirmado</div>
        <div class="code">${b.id}</div>
        <div class="summary" style="border:0;padding:0">
          <div><small>Servicio</small><b>${esc(b.serviceName)}</b></div>
          <div><small>Fecha</small><b>${nice(b.date)}</b></div>
          <div><small>Horario</small><b>${b.time} hs</b></div>
          <div><small>Lugar</small><b>${esc(b.locationName)}</b></div>
        </div>
        <p style="color:var(--muted);max-width:520px">Guardá este código. Te esperamos en ${esc(b.address || b.locationName)}. Si necesitás reprogramar, escribinos por WhatsApp con tu código.</p>
        <div class="step-actions">
          <a class="btn btn-green" href="https://wa.me/${D.contact.whatsapp}?text=${msg}" target="_blank" rel="noopener">Avisar por WhatsApp</a>
          <a class="btn" href="${ics(b)}" download="turno-bevacqua-${b.id}.ics">Agregar al calendario</a>
          <button class="btn" id="bAgain">Nuevo turno</button>
        </div></div>`;
      go(5);
      $("#bAgain").onclick = () => { Object.assign(st, { loc: null, service: null, date: null, time: null }); $("#bForm").reset(); go(0); };
      toast("¡Turno confirmado! Código " + b.id);
    }
    $("#turnos").addEventListener("click", (e) => {
      if (e.target.closest("[data-back]")) { e.preventDefault(); go(Math.max(0, st.step - 1)); }
      const li = e.target.closest("#bSteps li.done");
      if (li) go(Number(li.dataset.step));
    });
    return {
      init: () => go(0),
      refresh: () => go(st.step === 5 ? 5 : st.step),
      preset(loc, date) {
        st.loc = loc; st.date = date; st.time = null;
        if (st.service && freeSlots(date, st.service.duration).length) go(3);
        else go(1);
      },
    };
  })();

  // ───────── professional rental ─────────
  const pro = (() => {
    const st = { step: 0, type: null, start: null, station: null };
    const steps = $$("#pSteps li");
    const panes = $$("#proBooking .step-pane");
    function go(n) {
      st.step = n;
      panes.forEach((p) => p.classList.toggle("active", Number(p.dataset.pane) === n));
      steps.forEach((li, i) => { li.classList.toggle("active", i === n); li.classList.toggle("done", i < n && n < 4); });
      const em = (i, t) => (steps[i].querySelector("em").textContent = t || "");
      em(0, st.type && proType(st.type).label);
      em(1, st.start && short(st.start));
      em(2, st.station && "Puesto " + st.station);
      $$(".price-card").forEach((c) => c.classList.toggle("on", c.dataset.type === st.type));
      keepInView("#proBooking");
      if (n === 0) renderTypes();
      if (n === 1) renderCal();
      if (n === 2) renderStations();
      if (n === 3) renderSummary();
    }
    function renderTop() {
      $("#proStations").textContent = D.studio.stations;
      $("#perks").innerHTML = (D.studio.perks || []).map((p) => `<li>${esc(p)}</li>`).join("") + `<li>🕘 ${esc(D.studio.hours)}</li><li>📍 ${esc(D.studio.address)}</li>`;
      $("#prices").innerHTML = ["dia", "semana", "mes"].map((t) => {
        const pt = proType(t);
        return `<button class="price-card" data-type="${t}"><small>Alquiler por ${pt.label.toLowerCase()}</small><b>${money(D.studio.prices[pt.key])}</b><span>${t === "dia" ? "Jornada completa · 1 puesto" : t === "semana" ? "7 días corridos · 1 puesto fijo" : "30 días corridos · 1 puesto fijo"} →</span></button>`;
      }).join("");
    }
    function renderTypes() {
      $("#pTypes").innerHTML = ["dia", "semana", "mes"].map((t) => {
        const pt = proType(t);
        return `<button class="opt ${st.type === t ? "on" : ""}" data-type="${t}"><small>${pt.len} día${pt.len > 1 ? "s" : ""}</small><b>${pt.label}</b><span class="price">${money(D.studio.prices[pt.key])} <small>${pt.unit}</small></span></button>`;
      }).join("");
    }
    function pickType(t) { if (st.type !== t) { st.start = null; st.station = null; } st.type = t; go(1); }
    $("#pTypes").addEventListener("click", (e) => { const b = e.target.closest("[data-type]"); if (b) pickType(b.dataset.type); });
    $("#prices").addEventListener("click", (e) => { const b = e.target.closest("[data-type]"); if (b) { pickType(b.dataset.type); scrollToEl("#proBooking", -120); } });
    function renderCal() {
      $("#pDateTitle").innerHTML = st.type === "dia" ? `¿Qué <span class="serif">día?</span>` : `¿Desde <span class="serif">qué día?</span>`;
      Calendar($("#pCal"), {
        start: st.start || D.today, min: D.today, max: addDays(D.today, 180), selected: st.start,
        day(s) {
          if (s < D.today || !studioOpen(s)) return { html: s >= D.today ? "<small>cerrado</small>" : "" };
          const free = proFree(st.type, s);
          const dots = Array.from({ length: D.studio.stations }, (_, i) => `<i class="${free.includes(i + 1) ? "" : "x"}"></i>`).join("");
          if (!free.length) return { cls: "full", html: `<span class="dots">${dots}</span>` };
          return { click: true, html: `<span class="dots">${dots}</span>` };
        },
        onPick(s) { st.start = s; st.station = null; setTimeout(() => go(2), 180); },
      });
    }
    function renderStations() {
      const free = proFree(st.type, st.start);
      const end = addDays(st.start, proType(st.type).len - 1);
      $("#pRange").textContent = st.type === "dia" ? nice(st.start) : `Del ${nice(st.start)} al ${nice(end)}`;
      $("#pStations").innerHTML = Array.from({ length: D.studio.stations }, (_, i) => {
        const n = i + 1, ok = free.includes(n);
        return `<button class="station ${st.station === n ? "on" : ""}" data-st="${n}" ${ok ? "" : "disabled"}><small>Puesto</small><b>${pad(n)}</b><small>${ok ? "Disponible" : "Ocupado"}</small></button>`;
      }).join("");
    }
    $("#pStations").addEventListener("click", (e) => { const b = e.target.closest("[data-st]"); if (b && !b.disabled) { st.station = Number(b.dataset.st); go(3); } });
    function renderSummary() {
      const pt = proType(st.type);
      $("#pSummary").innerHTML = [["Alquiler", pt.label], ["Desde", nice(st.start)], ["Hasta", nice(addDays(st.start, pt.len - 1))], ["Puesto", pad(st.station)], ["Valor", money(D.studio.prices[pt.key])]]
        .map(([k, v]) => `<div><small>${k}</small><b>${esc(v)}</b></div>`).join("");
      $("#pErr").textContent = "";
    }
    $("#pForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const btn = $("#pForm [type=submit]");
      btn.disabled = true;
      try {
        const res = await fetch("/api/pro-book", {
          method: "POST", headers: { "content-type": "application/json" },
          body: JSON.stringify({ type: st.type, start: st.start, station: st.station, name: $("#pName").value, phone: $("#pPhone").value, specialty: $("#pSpec").value, instagram: $("#pIg").value, email: $("#pEmail").value, notes: $("#pNotes").value }),
        });
        const out = await res.json();
        if (!res.ok) throw new Error(out.error || "No se pudo enviar");
        const b = out.booking;
        D.proBusy.push({ start: b.start, end: b.end, station: b.station, status: b.status });
        const msg = encodeURIComponent(`Hola! Solicité un puesto en el estudio.\n${proType(b.type).label} desde ${nice(b.start)} — Puesto ${b.station}\nCódigo: ${b.id}\n${b.name}`);
        $("#pDone").innerHTML = `<div class="ticket"><div class="label">Solicitud enviada · pendiente de aprobación</div><div class="code">${b.id}</div>
          <div class="summary" style="border:0;padding:0"><div><small>Alquiler</small><b>${proType(b.type).label}</b></div><div><small>Período</small><b>${short(b.start)} — ${short(b.end)}</b></div><div><small>Puesto</small><b>${pad(b.station)}</b></div><div><small>Valor</small><b>${money(b.price)}</b></div></div>
          <p style="color:var(--muted);max-width:540px">Reservamos el puesto mientras revisamos tu solicitud. Te confirmamos por WhatsApp en menos de 24 hs.</p>
          <div class="step-actions"><a class="btn btn-dark" href="https://wa.me/${D.contact.whatsapp}?text=${msg}" target="_blank" rel="noopener">Escribir por WhatsApp</a><button class="btn" id="pAgain">Nueva solicitud</button></div></div>`;
        go(4);
        $("#pAgain").onclick = () => { Object.assign(st, { type: null, start: null, station: null }); $("#pForm").reset(); go(0); };
        toast("Solicitud enviada · " + b.id);
      } catch (err) {
        $("#pErr").textContent = err.message;
        if (/disponible/.test(err.message)) await reload();
      } finally { btn.disabled = false; }
    });
    $("#proBooking").addEventListener("click", (e) => {
      if (e.target.closest("[data-back]")) { e.preventDefault(); go(Math.max(0, st.step - 1)); }
      const li = e.target.closest("#pSteps li.done");
      if (li) go(Number(li.dataset.step));
    });
    return { init: () => { renderTop(); go(0); }, refresh: () => { renderTop(); go(st.step); } };
  })();

  // ───────── contact ─────────
  $("#cForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = $("#cForm button");
    btn.disabled = true;
    try {
      const res = await fetch("/api/contact", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: $("#cName").value, contact: $("#cContact").value, message: $("#cMsg").value }) });
      const out = await res.json();
      if (!res.ok) throw new Error(out.error);
      $("#cForm").reset();
      $("#cErr").textContent = "";
      toast("Mensaje enviado. Te respondemos pronto ✦");
    } catch (err) { $("#cErr").textContent = err.message || "No se pudo enviar"; }
    finally { btn.disabled = false; }
  });

  // ───────── menu ─────────
  $("#burger").addEventListener("click", () => document.body.classList.toggle("menu-open"));
  $$("#mobileMenu a").forEach((a) => a.addEventListener("click", () => document.body.classList.remove("menu-open")));

  // ───────── smooth scroll + animations ─────────
  let lenis = null;
  function scrollToEl(sel, offset = -40) {
    const el = $(sel);
    if (lenis) lenis.scrollTo(el, { offset, duration: 1.4 });
    else el.scrollIntoView({ behavior: "smooth" });
  }
  document.addEventListener("click", (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const h = a.getAttribute("href");
    if (h.length < 2 || !$(h)) return;
    e.preventDefault();
    scrollToEl(h, h === "#top" ? 0 : -40);
  });

  function keepInView(sel) {
    const el = $(sel);
    if (!el || !booted) return;
    const top = el.getBoundingClientRect().top;
    if (top < 0 || top > innerHeight * 0.6) scrollToEl(sel, -100);
  }

  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  function intro() {
    if (!window.gsap || reduce) { $(".loader").remove(); return Promise.resolve(); }
    return new Promise((resolve) => {
      const tl = gsap.timeline({ onComplete: () => { $(".loader").remove(); resolve(); } });
      tl.to(".loader-word span", { y: 0, duration: 0.9, stagger: 0.08, ease: "expo.out" })
        .to(".loader-bar i", { scaleX: 1, duration: 0.9, ease: "power2.inOut" }, 0.1)
        .to(".loader-word span", { y: "-110%", duration: 0.6, stagger: 0.05, ease: "expo.in" }, "+=0.15")
        .to(".loader", { clipPath: "inset(0 0 100% 0)", duration: 0.9, ease: "expo.inOut" }, "-=0.2")
        .from(".hero-media", { scale: 1.25, duration: 1.8, ease: "expo.out" }, "-=0.7")
        .from(".hero-title span", { yPercent: 105, duration: 1.2, stagger: 0.045, ease: "expo.out" }, "-=1.5")
        .from(".hero-top > *, .hero-badge", { opacity: 0, y: 20, duration: 0.8, stagger: 0.1 }, "-=0.9");
    });
  }

  function animations() {
    if (!window.gsap || !window.ScrollTrigger || reduce) {
      $$("[data-reveal]").forEach((el) => { el.style.opacity = 1; el.style.transform = "none"; });
      $$("#manifesto .w").forEach((w) => (w.style.opacity = 1));
      return;
    }
    gsap.registerPlugin(ScrollTrigger);
    if (window.Lenis) {
      lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add((t) => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    }

    // hero: frame closes in + title drift
    gsap.timeline({ scrollTrigger: { trigger: "#hero", start: "top top", end: "bottom top", scrub: true } })
      .to(".hero-media", { clipPath: "inset(6% 4% 10% 4% round 4px)", scale: 0.96, ease: "none" }, 0)
      .to(".hero-title", { yPercent: -40, ease: "none" }, 0)
      .to(".hero-top", { opacity: 0, ease: "none" }, 0);

    // marquee with scroll velocity
    const track = $("#marquee");
    track.innerHTML += track.innerHTML;
    const mq = gsap.to(track, { xPercent: -50, duration: 28, ease: "none", repeat: -1 });
    ScrollTrigger.create({ onUpdate: (self) => { const v = self.getVelocity() / 300; gsap.to(mq, { timeScale: (self.direction || 1) * Math.max(1, Math.min(Math.abs(v), 5)), duration: 0.4, overwrite: true }); } });

    // manifesto word reveal
    const words = $$("#manifesto .w");
    gsap.to(words, { opacity: 1, stagger: 0.1, ease: "none", scrollTrigger: { trigger: "#manifesto", start: "top 80%", end: "bottom 45%", scrub: true } });

    // reveals
    ScrollTrigger.batch("[data-reveal]", {
      start: "top 88%",
      onEnter: (els) => gsap.to(els, { opacity: 1, y: 0, duration: 1.1, stagger: 0.09, ease: "expo.out", overwrite: true }),
    });

    // contact big lines
    gsap.from(".contact-big .line-mask > span", { yPercent: 110, duration: 1.3, stagger: 0.12, ease: "expo.out", scrollTrigger: { trigger: ".contact-big", start: "top 85%" } });

    // footer word
    gsap.fromTo("#footerWord", { xPercent: 8 }, { xPercent: -6, ease: "none", scrollTrigger: { trigger: ".footer", start: "top bottom", end: "bottom bottom", scrub: true } });

    // parallax videos
    $$("[data-parallax]").forEach((v) => gsap.fromTo(v, { yPercent: -10 }, { yPercent: 0, ease: "none", scrollTrigger: { trigger: v.parentElement, start: "top bottom", end: "bottom top", scrub: true } }));

    // horizontal reel (desktop)
    const mm = gsap.matchMedia();
    mm.add("(min-width: 761px)", () => {
      const trackEl = $("#reelTrack");
      const dist = () => trackEl.scrollWidth - innerWidth;
      const tw = gsap.to(trackEl, {
        x: () => -dist(), ease: "none",
        scrollTrigger: { trigger: "#reel", start: "top top", end: () => "+=" + dist(), pin: true, scrub: 1, invalidateOnRefresh: true, anticipatePin: 1,
          onUpdate: (s) => gsap.set("#reelBar", { scaleX: s.progress }) },
      });
      $$(".reel-card").forEach((c) => {
        gsap.fromTo(c.querySelector("video, img"), { xPercent: -6 }, { xPercent: 6, ease: "none", scrollTrigger: { trigger: c, containerAnimation: tw, start: "left right", end: "right left", scrub: true } });
      });
    });

    // cursor
    if (matchMedia("(hover: hover)").matches) {
      const cur = $(".cursor");
      const xTo = gsap.quickTo(cur, "x", { duration: 0.35, ease: "power3" });
      const yTo = gsap.quickTo(cur, "y", { duration: 0.35, ease: "power3" });
      addEventListener("mousemove", (e) => { xTo(e.clientX); yTo(e.clientY); cur.classList.add("on"); });
      document.addEventListener("mouseover", (e) => {
        const t = e.target.closest("[data-cursor]");
        cur.classList.toggle("big", !!t);
        if (t) cur.querySelector("span").textContent = t.dataset.cursor;
      });
    }
  }

  // split manifesto into words (keeping italic spans)
  function splitWords(el) {
    const walk = (node) => {
      [...node.childNodes].forEach((n) => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) frag.appendChild(document.createTextNode(part));
            else { const s = document.createElement("span"); s.className = "w"; s.textContent = part; frag.appendChild(s); }
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) walk(n);
      });
    };
    walk(el);
  }

  // ───────── boot ─────────
  async function reload() {
    const res = await fetch("/api/public", { cache: "no-store" });
    if (!res.ok) throw new Error("API " + res.status);
    D = await res.json();
    renderEsteban();
    booking.refresh();
    pro.refresh();
  }

  async function boot() {
    const introP = intro();
    try {
      const res = await fetch("/api/public", { cache: "no-store" });
      if (!res.ok) throw new Error("API " + res.status);
      D = await res.json();
      bindTexts();
      renderContent();
      renderEsteban();
      booking.init();
      pro.init();
    } catch (err) {
      console.error(err);
      $("#nowText").textContent = "No pudimos cargar la agenda.";
      $("#nowSub").textContent = "Refrescá la página o escribinos por WhatsApp.";
    }
    splitWords($("#manifesto"));
    observeVideos();
    await introP;
    animations();
    booted = true;
    $(".hero-media video").play().catch(() => {});
  }
  boot();
})();
