/* BEVACQUA · LOOK & MORE — front */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  // ───────── dates & formats ─────────
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
  const paras = (txt) => String(txt || "").split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean).map((p) => `<p>${esc(p)}</p>`).join("");

  let D = null; // public data
  let booted = false;
  let lenis = null;

  // ───────── ring logo: outer letters rotate, BVCQ stays put ─────────
  let ringN = 0;
  function ring(el, { center = true, speed = 24 } = {}) {
    const id = "rg" + ringN++;
    el.innerHTML = `<svg class="ring-svg" viewBox="0 0 600 600" aria-hidden="true">
      <defs><path id="${id}o" d="M300,300 m-252,0 a252,252 0 1,1 504,0 a252,252 0 1,1 -504,0"/><path id="${id}i" d="M300,300 m-206,0 a206,206 0 1,1 412,0 a206,206 0 1,1 -412,0"/></defs>
      <g class="ring-rot" style="animation-duration:${speed}s" font-family="Jost, Futura, sans-serif">
        <text fill="#2CF56D" font-size="40" font-weight="700" letter-spacing="6"><textPath href="#${id}o" textLength="1570" lengthAdjust="spacing">BEVACQUA • BEVACQUA • BEVACQUA • BEVACQUA •</textPath></text>
        <text fill="#fff" font-size="32" font-weight="300" letter-spacing="5"><textPath href="#${id}i" textLength="1285" lengthAdjust="spacing">LOOK &amp; MORE • LOOK &amp; MORE • LOOK &amp; MORE • LOOK &amp; MORE •</textPath></text>
      </g>
      ${center ? `<text x="300" y="340" fill="#2CF56D" font-family="Jost, Futura, sans-serif" font-size="112" font-weight="700" letter-spacing="18" text-anchor="middle">BVCQ</text>` : ""}
    </svg>`;
  }
  $$("[data-ring]").forEach((el) => ring(el, { speed: el.dataset.ring === "nav" ? 18 : 26 }));

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
    const state = { month: parse(opts.start || D.today) };
    state.month.setDate(1);
    const min = parse(opts.min); min.setDate(1);
    const max = parse(opts.max); max.setDate(1);
    function render() {
      const m = state.month;
      const y = m.getFullYear(), mo = m.getMonth();
      const lead = (new Date(y, mo, 1, 12).getDay() + 6) % 7;
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
    el.onclick = (e) => {
      const nav = e.target.closest("[data-nav]");
      if (nav) { state.month.setMonth(state.month.getMonth() + Number(nav.dataset.nav)); render(); return; }
      const b = e.target.closest("[data-date]");
      if (b) { opts.selected = b.dataset.date; render(); opts.onPick(b.dataset.date); }
    };
    render();
  }

  // ───────── agenda helpers ─────────
  const locOf = (id) => D.locations.find((l) => l.id === id) || { id, name: id, short: String(id).toUpperCase(), address: "" };
  const locImg = (id) => D.images?.["ciudad-" + id] || D.images?.turnos || "/img/turnos.jpg";
  const sortedDays = () => Object.keys(D.days).sort();
  function freeSlots(date, duration) {
    const day = D.days[date];
    if (!day) return [];
    const step = D.slotStep || 40;
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
  const minService = () => Math.min(40, ...D.services.map((s) => s.duration));
  // consecutive days in the same city become one "stop" (gaps of up to 3 days are bridged)
  function stops(locId) {
    const out = [];
    for (const d of sortedDays()) {
      const loc = D.days[d].loc;
      if (locId && loc !== locId) continue;
      const last = out[out.length - 1];
      if (last && last.loc === loc && (parse(d) - parse(last.end)) / 864e5 <= 3) last.end = d;
      else out.push({ loc, start: d, end: d });
    }
    return out;
  }
  const rangeTxt = (s) => (s.start === s.end ? short(s.start) : `${short(s.start)} — ${short(s.end)}`);

  // ───────── services helpers ─────────
  const svcById = (id) => D.services.find((s) => s.id === id);
  const svcFrom = (s) => (s.variants && s.variants.length ? Math.min(...s.variants.map((v) => v.price)) : s.price);
  const svcPriceTxt = (s) => (s.variants && s.variants.length) || s.from ? `Desde ${money(svcFrom(s))}` : money(s.price);
  const itemPrice = (it) => { const s = svcById(it.id); if (!s) return 0; const v = (s.variants || []).find((x) => x.label === it.variant); return v ? v.price : s.price; };
  const itemName = (it) => { const s = svcById(it.id); return s ? s.name + (it.variant ? ` (${it.variant})` : "") : ""; };
  const cats = () => { const out = []; D.services.forEach((s) => { const c = s.cat || "Servicios"; if (!out.includes(c)) out.push(c); }); return out; };

  // ───────── texts, images, contact ─────────
  function bindTexts() {
    $$("[data-bind]").forEach((el) => {
      const v = el.dataset.bind.split(".").reduce((o, k) => (o ? o[k] : undefined), D);
      if (v) el.textContent = v;
    });
    $$("[data-img]").forEach((el) => {
      const v = D.images?.[el.dataset.img];
      if (!v) return;
      if (el.tagName === "SOURCE") el.srcset = v; else el.src = v;
    });
    $("#expText").innerHTML = paras(D.brand.experiencia);
    $("#cwText").innerHTML = paras(D.brand.coworkingText);
    const claim = D.brand.coworkingClaim || "";
    $("#cwClaim").innerHTML = claim.split(". ").map((p, i, a) => (i === a.length - 1 ? `<em>${esc(p)}</em>` : esc(p) + ".")).join(" ");
    if (D.brand.manifesto) {
      const def = $("#manifesto").textContent.replace(/\s+/g, " ").trim();
      if (def !== D.brand.manifesto.trim()) $("#manifesto").textContent = D.brand.manifesto;
    }
    const c = D.contact;
    const digits = (x) => String(x || "").replace(/\D/g, "");
    $("#cWa").href = `https://wa.me/${digits(c.whatsapp)}`;
    $("#cIg").href = `https://instagram.com/${String(c.instagram || "").replace(/^@/, "")}`;
    $("#cIgUser").textContent = "@" + String(c.instagram || "").replace(/^@/, "");
    $("#cMsn").hidden = !c.messenger;
    if (c.messenger) $("#cMsn").href = `https://m.me/${c.messenger}`;
    const phone = c.phone || (c.whatsapp ? "+" + digits(c.whatsapp) : "");
    $("#cTel").hidden = !phone;
    $("#cTel").href = `tel:${phone.replace(/[^\d+]/g, "")}`;
    $("#cTelTxt").textContent = phone;
    $("#cMail").href = `mailto:${c.email}`;
    $("#cMailTxt").textContent = c.email;
    $("#year").textContent = new Date().getFullYear();
  }

  // ───────── content: reel + archive ─────────
  const mediaEl = (p, extra = "") =>
    p.type === "video"
      ? `<video src="${esc(p.src)}" ${p.poster ? `poster="${esc(p.poster)}"` : ""} muted loop playsinline preload="none" data-auto ${extra}></video>`
      : `<img src="${esc(p.src)}" alt="${esc(p.title)}" loading="lazy" ${extra}>`;

  function renderContent() {
    const track = $("#reelTrack");
    track.querySelectorAll(".reel-card").forEach((n) => n.remove());
    const tebi = document.createElement("figure");
    tebi.className = "reel-card tebi-card";
    tebi.innerHTML = `<img src="${esc(D.images?.tebi || "/img/tebi.jpg")}" alt="Esteban Bevacqua" loading="lazy"><div class="reel-meta"><h3>Esteban Bevacqua</h3><small>Tebi</small></div>`;
    track.appendChild(tebi);
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
    if (booted) ScrollTrigger.refresh();
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

  const vio = "IntersectionObserver" in window
    ? new IntersectionObserver((ents) => ents.forEach((en) => {
        const v = en.target;
        if (en.isIntersecting) { v.preload = "auto"; v.play().catch(() => {}); } else v.pause();
      }), { rootMargin: "200px" })
    : null;
  function observeVideos() { $$("video[data-auto]").forEach((v) => { if (!v._obs && vio) { vio.observe(v); v._obs = 1; } }); }

  // ───────── turnos landing ─────────
  function renderTurnosHero() {
    const today = D.today;
    const td = D.days[today];
    if (td) {
      $("#nowText").innerHTML = `Hoy Esteban está en <b>${esc(locOf(td.loc).name)}</b>`;
    } else {
      const next = stops().find((s) => s.end >= today);
      $("#nowText").innerHTML = next ? `Próxima parada: <b>${esc(locOf(next.loc).name)}</b> · ${short(next.start)}` : "Agenda en preparación";
    }
    $("#cityBtns").innerHTML = D.locations.map((l) => {
      const st = stops(l.id)[0];
      return `<button class="city-btn" data-city="${l.id}"><b>${esc(l.name)}</b><small>${st ? rangeTxt(st) : "Próximamente"}</small></button>`;
    }).join("");
    $("#qWhere").textContent = (td ? `Hoy: ${locOf(td.loc).name}. ` : "") + D.locations.map((l) => l.name).join(" / ") + ".";
    const firstFree = sortedDays().find((d) => freeSlots(d, minService()).length);
    if (firstFree) $("#qWhen").textContent = `Próximo turno libre: ${nice(firstFree)}.`;
  }
  $("#cityBtns").addEventListener("click", (e) => {
    const b = e.target.closest("[data-city]");
    if (!b) return;
    booking.pickCity(b.dataset.city);
    scrollToEl("#turnera", -40);
  });

  // ───────── client booking (turnera) ─────────
  const booking = (() => {
    const st = { step: 0, loc: null, items: [], date: null, time: null };
    const steps = $$("#bSteps li");
    const panes = $$("#turnera .step-pane");
    const totalDur = () => st.items.reduce((a, it) => a + (svcById(it.id)?.duration || 0), 0);
    const totalPrice = () => st.items.reduce((a, it) => a + itemPrice(it), 0);
    const hasFrom = () => st.items.some((it) => svcById(it.id)?.from);

    // shortest booking that still makes sense for a day: the selected services, or the shortest service
    const need = () => (st.items.length ? totalDur() : minService());

    function go(n) {
      st.step = n;
      panes.forEach((p) => p.classList.toggle("active", Number(p.dataset.pane) === n));
      steps.forEach((li, i) => { li.classList.toggle("active", i === n); li.classList.toggle("done", i < n && n < 5); });
      const em = (i, t) => (steps[i].querySelector("em").textContent = t || "");
      em(0, st.loc && locOf(st.loc).name);
      em(1, st.date && short(st.date));
      em(2, st.items.length ? (st.items.length === 1 ? itemName(st.items[0]) : `${st.items.length} servicios`) : "");
      em(3, st.time);
      keepInView("#turnera .booking");
      if (n === 0) renderLocs();
      if (n === 1) renderCal();
      if (n === 2) renderServices();
      if (n === 3) renderSlots();
      if (n === 4) renderSummary();
    }
    // destination cards with the dates Esteban is in each city
    function renderLocs() {
      $("#bLocs").innerHTML = D.locations.map((l) => {
        const sts = stops(l.id).slice(0, 3);
        const free = sortedDays().some((d) => D.days[d].loc === l.id && freeSlots(d, minService()).length);
        return `<button class="opt ${st.loc === l.id ? "on" : ""}" data-loc="${l.id}" ${free ? "" : "disabled style='opacity:.4'"}>
          <small>📍 ${esc(l.address || "")}</small><b>${esc(l.name)}</b>
          <ul class="dates">${sts.length ? sts.map((s) => `<li>${rangeTxt(s)}</li>`).join("") : "<li>Sin fechas por ahora</li>"}</ul></button>`;
      }).join("");
    }
    $("#bLocs").addEventListener("click", (e) => {
      const b = e.target.closest("[data-loc]");
      if (b) pickCity(b.dataset.loc);
    });
    function pickCity(id) {
      if (st.loc !== id) { st.date = null; st.time = null; }
      st.loc = id;
      go(1);
    }
    // the city's own calendar
    function renderCal() {
      const ds = sortedDays().filter((d) => D.days[d].loc === st.loc);
      const first = ds.find((d) => freeSlots(d, need()).length) || D.today;
      const sts = stops(st.loc).slice(0, 4);
      $("#bCalTitle").innerHTML = `${esc(locOf(st.loc).name)} <span class="serif">· ¿qué día?</span>`;
      $("#bDates").innerHTML = `Esteban en <b>${esc(locOf(st.loc).name)}</b>: ${sts.map(rangeTxt).join(" · ") || "sin fechas publicadas"}`;
      Calendar($("#bCal"), {
        start: st.date || first, min: D.today, max: ds[ds.length - 1] || D.today, selected: st.date,
        day(s) {
          const d = D.days[s];
          if (!d || d.loc !== st.loc) return {};
          const n = freeSlots(s, need()).length;
          if (!n) return { html: "<small>completo</small>" };
          return { cls: "loc-bue", click: true, html: `<small>${n} libres</small>` };
        },
        onPick(s) { st.date = s; st.time = null; setTimeout(() => go(2), 180); },
      });
    }
    // agendamas-style service picker
    function renderServices() {
      $("#bSvcNote").innerHTML = `${nice(st.date)} · <b>${esc(locOf(st.loc).name)}</b>. Podés sumar más de un servicio.`;
      $("#bServices").innerHTML = cats().map((c) => `<div class="svc-group"><h4>${esc(c)}</h4><div class="svc-cards">${
        D.services.filter((s) => (s.cat || "Servicios") === c).map((s) => {
          const sel = st.items.find((it) => it.id === s.id);
          const vars = s.variants || [];
          return `<div class="svc-card ${sel ? "sel" : ""}" data-svc="${s.id}">
            <span class="nm">${esc(s.name)}</span>
            <button class="svc-add" data-add="${s.id}" aria-label="${sel ? "Quitar" : "Agregar"} ${esc(s.name)}">${sel ? "✓" : "+"}</button>
            ${s.note ? `<span class="nt">${esc(s.note)}</span>` : ""}
            <span class="meta"><b>${sel && sel.variant ? money(itemPrice(sel)) : svcPriceTxt(s)}</b><i></i>~${dur(s.duration)}${sel && sel.variant ? `<i></i>${esc(sel.variant)}` : ""}</span>
            ${vars.length ? `<div class="svc-vars">${vars.map((v) => `<button class="svc-var ${sel && sel.variant === v.label ? "on" : ""}" data-var="${esc(v.label)}">${esc(v.label)} · ${money(v.price)}</button>`).join("")}</div>` : ""}
          </div>`;
        }).join("")}</div></div>`).join("");
      renderCart();
    }
    function renderCart() {
      const n = st.items.length;
      $("#bCart").hidden = !n;
      if (!n) return;
      $("#bCartCount").textContent = st.items.map(itemName).join(" + ");
      $("#bCartMeta").textContent = `${dur(totalDur())} · ${hasFrom() ? "desde " : ""}${money(totalPrice())}`;
    }
    $("#bServices").addEventListener("click", (e) => {
      const card = e.target.closest("[data-svc]");
      if (!card) return;
      const s = svcById(card.dataset.svc);
      const idx = st.items.findIndex((it) => it.id === s.id);
      const v = e.target.closest("[data-var]");
      if (v) {
        if (idx >= 0) st.items[idx].variant = v.dataset.var; else st.items.push({ id: s.id, variant: v.dataset.var });
        st.time = null;
        renderServices();
        return;
      }
      if (idx >= 0 && e.target.closest("[data-add]")) { st.items.splice(idx, 1); st.time = null; renderServices(); return; }
      if (s.variants && s.variants.length) { card.classList.toggle("open"); return; }
      if (idx < 0) { st.items.push({ id: s.id, variant: "" }); st.time = null; renderServices(); }
    });
    $("#bCartGo").addEventListener("click", () => {
      if (!st.loc) return go(0);
      if (!st.date) return go(1);
      go(3);
    });
    function renderSlots() {
      const sl = freeSlots(st.date, totalDur());
      $("#bSlots").innerHTML = sl.length
        ? sl.map((t) => `<button class="slot ${st.time === t ? "on" : ""}" data-time="${t}">${t}</button>`).join("")
        : `<p class="empty-msg">Ese día no queda lugar para ${dur(totalDur())}. <button class="btn" data-goto="1" style="margin-top:12px">Elegir otra fecha</button></p>`;
      $("#bSlotTitle").innerHTML = `${nice(st.date)} <span class="serif">· ${esc(locOf(st.loc).name)}</span>`;
    }
    $("#bSlots").addEventListener("click", (e) => {
      if (e.target.closest("[data-goto]")) { st.date = null; return go(1); }
      const b = e.target.closest("[data-time]");
      if (!b) return;
      st.time = b.dataset.time;
      go(4);
    });
    function renderSummary() {
      $("#bSummary").innerHTML = [
        ["Destino", locOf(st.loc).name], ["Fecha", nice(st.date)], ["Servicios", st.items.map(itemName).join(" + ")], ["Horario", st.time + " hs"],
        ["Duración", dur(totalDur())], ["Valor", (hasFrom() ? "desde " : "") + money(totalPrice())],
      ].map(([k, v]) => `<div><small>${k}</small><b>${esc(v)}</b></div>`).join("");
      $("#bErr").textContent = "";
    }
    $("#bForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const btn = $("#bForm [type=submit]");
      btn.disabled = true;
      $("#bErr").textContent = "";
      try {
        const res = await fetch("/api/book", {
          method: "POST", headers: { "content-type": "application/json" },
          body: JSON.stringify({ locationId: st.loc, items: st.items.map((it) => ({ serviceId: it.id, variant: it.variant })), date: st.date, time: st.time, name: $("#bName").value, phone: $("#bPhone").value, email: $("#bEmail").value, notes: $("#bNotes").value }),
        });
        const out = await res.json();
        if (!res.ok) throw new Error(out.error || "No se pudo reservar");
        D.busy.push({ date: st.date, time: st.time, duration: totalDur() });
        done(out.booking);
        renderTurnosHero();
      } catch (err) {
        $("#bErr").textContent = err.message;
        if (/disponible/.test(err.message)) await reload();
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
      const msg = encodeURIComponent(`Hola Esteban! Reservé un turno 🙌\n${b.serviceName}\n${nice(b.date)} ${b.time} hs (${b.locationName})\nCódigo: ${b.id}\nNombre: ${b.name}`);
      $("#bDone").innerHTML = `<div class="ticket">
        <div class="label">Turno confirmado</div>
        <div class="code">${b.id}</div>
        <div class="summary" style="border:0;padding:0">
          <div><small>Servicios</small><b>${esc(b.serviceName)}</b></div>
          <div><small>Fecha</small><b>${nice(b.date)}</b></div>
          <div><small>Horario</small><b>${b.time} hs</b></div>
          <div><small>Lugar</small><b>${esc(b.locationName)}</b></div>
          <div><small>Valor</small><b>${b.priceFrom ? "desde " : ""}${money(b.price)}</b></div>
        </div>
        <p style="color:var(--muted);max-width:520px">Guardá este código. Te esperamos en ${esc(b.address || b.locationName)}. ${esc(D.brand.serviciosNote || "")}. Si necesitás reprogramar, escribinos por WhatsApp con tu código.</p>
        <div class="step-actions">
          <a class="btn btn-green" href="https://wa.me/${String(D.contact.whatsapp).replace(/\D/g, "")}?text=${msg}" target="_blank" rel="noopener">Avisar por WhatsApp</a>
          <a class="btn" href="${ics(b)}" download="turno-bevacqua-${b.id}.ics">Agregar al calendario</a>
          <button class="btn" id="bAgain">Nuevo turno</button>
        </div></div>`;
      go(5);
      $("#bAgain").onclick = () => { Object.assign(st, { items: [], date: null, time: null }); $("#bForm").reset(); go(st.loc ? 1 : 0); };
      toast("¡Turno confirmado! Código " + b.id);
    }
    $("#turnera").addEventListener("click", (e) => {
      if (e.target.closest("[data-back]")) { e.preventDefault(); go(Math.max(0, st.step - 1)); }
      const li = e.target.closest("#bSteps li.done");
      if (li) go(Number(li.dataset.step));
    });
    return {
      init: () => go(0),
      refresh: () => go(st.step),
      pickCity: (id) => pickCity(id),
      addService(id) {
        const s = svcById(id);
        if (!s) return;
        if (!st.items.find((it) => it.id === id) && !(s.variants && s.variants.length)) st.items.push({ id, variant: "" });
        go(!st.loc ? 0 : !st.date ? 1 : 2);
        if (s.variants && s.variants.length) {
          const card = $(`#bServices [data-svc="${id}"]`);
          if (card) card.classList.add("open");
        }
      },
    };
  })();

  // ───────── servicios: price list ─────────
  function renderPriceList() {
    $("#priceList").innerHTML = cats().map((c) => {
      const list = D.services.filter((s) => (s.cat || "Servicios") === c);
      const single = list.length === 1 && list[0].name === c;
      const reserve = (id) => `<button class="reserve-link" data-reserve="${id}">Reservar →</button>`;
      const row = (label, price, note = "", tail = "") => `<div class="price-row"><span>${esc(label)}${note ? ` <small>(${esc(note)})</small>` : ""}</span><span class="dots"></span><span class="pr">${price}</span>${tail}</div>`;
      const body = list.map((s) => {
        const vars = s.variants || [];
        if (!vars.length) {
          const label = s.from ? (single ? "Desde" : `${s.name} · desde`) : s.name;
          return `<div class="price-svc">${row(label, money(s.price), s.note, single ? "" : reserve(s.id))}</div>`;
        }
        return `<div class="price-svc">${single ? "" : `<h4>${esc(s.name)} ${reserve(s.id)}</h4>`}${vars.map((v) => row(v.label, money(v.price))).join("")}</div>`;
      }).join("");
      return `<div class="price-cat" data-reveal><h3>${esc(c)}${single ? " " + reserve(list[0].id) : ""}</h3>${body}</div>`;
    }).join("");
  }
  $("#priceList").addEventListener("click", (e) => {
    const b = e.target.closest("[data-reserve]");
    if (!b) return;
    booking.addService(b.dataset.reserve);
    scrollToEl("#turnera", -40);
  });

  // ───────── coworking rental ─────────
  const PLAN = {
    hora: { len: 1, key: "hour", label: "Hora", unit: "por hora", desc: "Mínimo 1 hora · 1 puesto" },
    dia: { len: 1, key: "day", label: "Día", unit: "por día", desc: "Jornada completa · 1 puesto" },
    semana: { len: 7, key: "week", label: "Semana", unit: "por semana", desc: "7 días corridos · puesto fijo" },
    mes: { len: 30, key: "month", label: "Mes", unit: "por mes", desc: "30 días corridos · puesto fijo" },
  };
  const plans = () => (D.studio.plans || ["dia", "semana", "mes"]).filter((p) => PLAN[p]);
  const studioOpen = (s) => D.studio.openDays.includes(parse(s).getDay()) && !D.studio.blocked.includes(s);
  function collides(a, b) {
    if (!(a.start <= b.end && b.start <= a.end)) return false;
    if (a.tFrom && b.tFrom) return toMin(a.tFrom) < toMin(b.tTo) && toMin(b.tFrom) < toMin(a.tTo);
    return true;
  }
  function proFree(range) {
    const all = Array.from({ length: D.studio.stations }, (_, i) => i + 1);
    return all.filter((stn) => !D.proBusy.some((p) => p.station === stn && collides(p, range)));
  }
  // for the calendar: a station is "free" on a day unless a full-day/period rental takes it
  function proFreeDay(type, start) {
    const range = { start, end: addDays(start, PLAN[type].len - 1) };
    const all = Array.from({ length: D.studio.stations }, (_, i) => i + 1);
    return all.filter((stn) => !D.proBusy.some((p) => p.station === stn && collides(p, range) && !(type === "hora" && p.tFrom)));
  }

  const pro = (() => {
    const st = { step: 0, type: null, start: null, from: null, hours: 2, station: null };
    const steps = $$("#pSteps li");
    const panes = $$("#proBooking .step-pane");
    const range = () => {
      const r = { start: st.start, end: addDays(st.start, PLAN[st.type].len - 1) };
      if (st.type === "hora" && st.from) { r.tFrom = st.from; r.tTo = toHHMM(toMin(st.from) + st.hours * 60); }
      return r;
    };
    const price = () => (D.studio.prices[PLAN[st.type].key] || 0) * (st.type === "hora" ? st.hours : 1);
    function go(n) {
      st.step = n;
      panes.forEach((p) => p.classList.toggle("active", Number(p.dataset.pane) === n));
      steps[2].hidden = st.type !== "hora";
      steps.forEach((li, i) => { li.classList.toggle("active", i === n); li.classList.toggle("done", i < n && n < 5); });
      const em = (i, t) => (steps[i].querySelector("em").textContent = t || "");
      em(0, st.type && PLAN[st.type].label);
      em(1, st.start && short(st.start));
      em(2, st.from && `${st.from} · ${st.hours} h`);
      em(3, st.station && "Puesto " + st.station);
      $$(".price-card").forEach((c) => c.classList.toggle("on", c.dataset.type === st.type));
      keepInView("#proBooking");
      if (n === 0) renderTypes();
      if (n === 1) renderCal();
      if (n === 2) renderTime();
      if (n === 3) renderStations();
      if (n === 4) renderSummary();
    }
    function renderTop() {
      const s = D.studio;
      $("#proStations").textContent = s.stations;
      $("#perks").innerHTML = (s.perks || []).map((p) => `<li>${esc(p)}</li>`).join("") + `<li>🕘 ${esc(s.open)} — ${esc(s.close)}</li><li>📍 ${esc(s.address)}</li>`;
      $("#prices").innerHTML = plans().map((t) => `<button class="price-card" data-type="${t}"><small>Alquiler ${PLAN[t].unit}</small><b>${money(s.prices[PLAN[t].key])}</b><span>${PLAN[t].desc} →</span></button>`).join("");
    }
    function renderTypes() {
      $("#pTypes").innerHTML = plans().map((t) => `<button class="opt ${st.type === t ? "on" : ""}" data-type="${t}"><small>${PLAN[t].desc}</small><b>${PLAN[t].label}</b><span class="price">${money(D.studio.prices[PLAN[t].key])} <small>${PLAN[t].unit}</small></span></button>`).join("");
    }
    function pickType(t) { if (st.type !== t) { st.start = null; st.station = null; st.from = null; } st.type = t; go(1); }
    $("#pTypes").addEventListener("click", (e) => { const b = e.target.closest("[data-type]"); if (b) pickType(b.dataset.type); });
    $("#prices").addEventListener("click", (e) => { const b = e.target.closest("[data-type]"); if (b) { pickType(b.dataset.type); scrollToEl("#proBooking", -120); } });
    function renderCal() {
      $("#pDateTitle").innerHTML = st.type === "hora" || st.type === "dia" ? `¿Qué <span class="serif">día?</span>` : `¿Desde <span class="serif">qué día?</span>`;
      Calendar($("#pCal"), {
        start: st.start || D.today, min: D.today, max: addDays(D.today, 180), selected: st.start,
        day(s) {
          if (s < D.today) return {};
          if (!studioOpen(s)) return { html: "<small>cerrado</small>" };
          const free = proFreeDay(st.type, s);
          const dots = Array.from({ length: D.studio.stations }, (_, i) => `<i class="${free.includes(i + 1) ? "" : "x"}"></i>`).join("");
          if (!free.length) return { cls: "full", html: `<span class="dots">${dots}</span>` };
          return { click: true, html: `<span class="dots">${dots}</span>` };
        },
        onPick(s) { st.start = s; st.station = null; st.from = null; setTimeout(() => go(st.type === "hora" ? 2 : 3), 180); },
      });
    }
    function renderTime() {
      const open = toMin(D.studio.open), close = toMin(D.studio.close);
      const maxH = Math.max(1, Math.floor((close - (st.from ? toMin(st.from) : open)) / 60));
      st.hours = Math.min(Math.max(1, st.hours), Math.min(12, maxH));
      const chips = [];
      for (let t = open; t + 60 <= close; t += 60) {
        const hh = toHHMM(t);
        const past = st.start === D.today && t <= nowMinAR();
        const fits = t + st.hours * 60 <= close;
        const any = !past && fits && proFree({ start: st.start, end: st.start, tFrom: hh, tTo: toHHMM(t + st.hours * 60) }).length;
        chips.push(`<button class="slot ${st.from === hh ? "on" : ""}" data-from="${hh}" ${any ? "" : "disabled"}>${hh}</button>`);
      }
      $("#pFrom").innerHTML = chips.join("");
      if (st.from && $(`#pFrom [data-from="${st.from}"]`)?.disabled) st.from = null;
      $("#pHours").textContent = st.hours;
      $("#pHoursMinus").disabled = st.hours <= 1;
      $("#pHoursPlus").disabled = st.hours >= Math.min(12, maxH);
      $("#pHoursMeta").textContent = st.from ? `${st.from} a ${toHHMM(toMin(st.from) + st.hours * 60)} · ${money(price())}` : `${money(D.studio.prices.hour)} por hora`;
      $("#pTimeGo").disabled = !st.from;
    }
    $("#pFrom").addEventListener("click", (e) => { const b = e.target.closest("[data-from]"); if (b && !b.disabled) { st.from = b.dataset.from; renderTime(); } });
    $("#pHoursMinus").addEventListener("click", () => { st.hours--; renderTime(); });
    $("#pHoursPlus").addEventListener("click", () => { st.hours++; renderTime(); });
    $("#pTimeGo").addEventListener("click", () => { if (st.from) { st.station = null; go(3); } });
    function renderStations() {
      const r = range();
      const free = proFree(r);
      $("#pRange").textContent = st.type === "hora" ? `${nice(st.start)} · ${r.tFrom} a ${r.tTo} hs` : st.type === "dia" ? nice(st.start) : `Del ${nice(st.start)} al ${nice(r.end)}`;
      $("#pStations").innerHTML = Array.from({ length: D.studio.stations }, (_, i) => {
        const n = i + 1, ok = free.includes(n);
        return `<button class="station ${st.station === n ? "on" : ""}" data-st="${n}" ${ok ? "" : "disabled"}><small>Puesto</small><b>${pad(n)}</b><small>${ok ? "Disponible" : "Ocupado"}</small></button>`;
      }).join("");
    }
    $("#pStations").addEventListener("click", (e) => { const b = e.target.closest("[data-st]"); if (b && !b.disabled) { st.station = Number(b.dataset.st); go(4); } });
    function renderSummary() {
      const r = range();
      const rows = [["Alquiler", PLAN[st.type].label]];
      if (st.type === "hora") rows.push(["Día", nice(st.start)], ["Horario", `${r.tFrom} a ${r.tTo}`]);
      else rows.push(["Desde", nice(st.start)], ["Hasta", nice(r.end)]);
      rows.push(["Puesto", pad(st.station)], ["Valor", money(price())]);
      $("#pSummary").innerHTML = rows.map(([k, v]) => `<div><small>${k}</small><b>${esc(v)}</b></div>`).join("");
      $("#pErr").textContent = "";
    }
    $("#pForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const btn = $("#pForm [type=submit]");
      btn.disabled = true;
      try {
        const res = await fetch("/api/pro-book", {
          method: "POST", headers: { "content-type": "application/json" },
          body: JSON.stringify({ type: st.type, start: st.start, from: st.from, hours: st.hours, station: st.station, name: $("#pName").value, phone: $("#pPhone").value, specialty: $("#pSpec").value, instagram: $("#pIg").value, email: $("#pEmail").value, notes: $("#pNotes").value }),
        });
        const out = await res.json();
        if (!res.ok) throw new Error(out.error || "No se pudo enviar");
        const b = out.booking;
        D.proBusy.push({ start: b.start, end: b.end, station: b.station, status: b.status, tFrom: b.tFrom, tTo: b.tTo });
        const when = b.tFrom ? `${nice(b.start)} de ${b.tFrom} a ${b.tTo}` : b.start === b.end ? nice(b.start) : `${short(b.start)} — ${short(b.end)}`;
        const msg = encodeURIComponent(`¡Hola! Pedí un puesto en el coworking.\n${PLAN[b.type].label}: ${when} — Puesto ${b.station}\nCódigo: ${b.id}\n${b.name}`);
        $("#pDone").innerHTML = `<div class="ticket"><div class="label">Solicitud enviada · pendiente de aprobación</div><div class="code">${b.id}</div>
          <div class="summary" style="border:0;padding:0"><div><small>Alquiler</small><b>${PLAN[b.type].label}</b></div><div><small>Cuándo</small><b>${esc(when)}</b></div><div><small>Puesto</small><b>${pad(b.station)}</b></div><div><small>Valor</small><b>${money(b.price)}</b></div></div>
          <p style="color:var(--muted);max-width:540px">Reservamos el puesto mientras revisamos tu solicitud. Te confirmamos por WhatsApp en menos de 24 hs.</p>
          <div class="step-actions"><a class="btn btn-dark" href="https://wa.me/${String(D.contact.whatsapp).replace(/\D/g, "")}?text=${msg}" target="_blank" rel="noopener">Escribir por WhatsApp</a><button class="btn" id="pAgain">Nueva solicitud</button></div></div>`;
        go(5);
        $("#pAgain").onclick = () => { Object.assign(st, { type: null, start: null, from: null, station: null }); $("#pForm").reset(); go(0); };
        toast("Solicitud enviada · " + b.id);
      } catch (err) {
        $("#pErr").textContent = err.message;
        if (/disponible/.test(err.message)) await reload();
      } finally { btn.disabled = false; }
    });
    $("#proBooking").addEventListener("click", (e) => {
      if (e.target.closest("[data-back]")) {
        e.preventDefault();
        let n = st.step - 1;
        if (n === 2 && st.type !== "hora") n = 1;
        go(Math.max(0, n));
      }
      const li = e.target.closest("#pSteps li.done");
      if (li) go(Number(li.dataset.step));
    });
    return { init: () => { renderTop(); go(0); }, refresh: () => { renderTop(); go(st.step); } };
  })();

  // ───────── contact form ─────────
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

  // ───────── menu & scrolling ─────────
  $("#burger").addEventListener("click", () => document.body.classList.toggle("menu-open"));
  $$("#mobileMenu a").forEach((a) => a.addEventListener("click", () => document.body.classList.remove("menu-open")));

  function scrollToEl(sel, offset = -40) {
    const el = $(sel);
    if (!el) return;
    if (lenis) lenis.scrollTo(el, { offset, duration: 1.4 });
    else el.scrollIntoView({ behavior: "smooth" });
  }
  document.addEventListener("click", (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const h = a.getAttribute("href");
    if (h.length < 2 || !$(h)) return;
    e.preventDefault();
    scrollToEl(h, h === "#top" || h === "#turnos" ? 0 : -40);
  });
  function keepInView(sel) {
    const el = $(sel);
    if (!el || !booted) return;
    const top = el.getBoundingClientRect().top;
    if (top < 0 || top > innerHeight * 0.6) scrollToEl(sel, -100);
  }

  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ───────── loader: old TV switching on ─────────
  function tvNoise(canvas) {
    const ctx = canvas.getContext("2d");
    const img = ctx.createImageData(canvas.width, canvas.height);
    let raf;
    const frame = () => {
      const d = img.data;
      for (let i = 0; i < d.length; i += 4) { const v = (Math.random() * 255) | 0; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255; }
      ctx.putImageData(img, 0, 0);
      raf = requestAnimationFrame(frame);
    };
    frame();
    return () => cancelAnimationFrame(raf);
  }
  function intro() {
    const tv = $("#tv");
    if (!window.gsap || reduce) { tv.remove(); return Promise.resolve(); }
    document.body.classList.add("loading");
    const stopNoise = tvNoise($(".tv-noise"));
    return new Promise((resolve) => {
      const tl = gsap.timeline({
        onComplete: () => { stopNoise(); tv.remove(); document.body.classList.remove("loading"); resolve(); },
      });
      tl.to(".tv-line", { width: "100%", duration: 0.28, ease: "power3.in", delay: 0.25 })
        .to(".tv-line", { opacity: 0, duration: 0.15 }, "+=0.04")
        .to(".tv-screen", { opacity: 1, duration: 0.01 }, "<")
        .to(".tv-screen", { scaleY: 1, duration: 0.42, ease: "expo.out" }, "<")
        .to(".tv-screen", { filter: "brightness(1)", duration: 0.7, ease: "power2.out" }, "<")
        .fromTo(".tv-logo", { opacity: 0, scale: 1.08, filter: "drop-shadow(6px 0 0 rgba(255,0,60,.8)) drop-shadow(-6px 0 0 rgba(0,220,255,.8)) blur(2px)" },
          { opacity: 1, scale: 1, filter: "drop-shadow(0px 0 0 rgba(255,0,60,0)) drop-shadow(0px 0 0 rgba(0,220,255,0)) blur(0px)", duration: 0.9, ease: "power2.out" }, "-=0.35")
        .to(".tv-noise", { opacity: 0.12, duration: 0.8 }, "<")
        .to(".tv-logo", { opacity: 0.35, duration: 0.05, yoyo: true, repeat: 3 }, "-=0.2")
        .to(".tv-logo", { x: 6, duration: 0.05, yoyo: true, repeat: 1 }, "+=0.55")
        // the TV "zooms" into the site
        .to(".tv-screen", { scale: 1.35, opacity: 0, duration: 0.8, ease: "expo.in" }, "+=0.25")
        .to(tv, { backgroundColor: "rgba(0,0,0,0)", duration: 0.5 }, "-=0.35")
        .from(".hero-media", { scale: 1.2, duration: 1.8, ease: "expo.out" }, "-=0.3")
        .from(".ht-main > span", { yPercent: 105, duration: 1.2, stagger: 0.05, ease: "expo.out" }, "-=1.6")
        .from(".ht-sub > span", { yPercent: 110, duration: 0.9, stagger: 0.03, ease: "expo.out" }, "-=0.9")
        .from(".hero-top > *, .nav", { opacity: 0, y: 20, duration: 0.8, stagger: 0.08 }, "-=0.9");
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

    // horizontal reel (desktop) — created first so later triggers account for its pin spacing
    gsap.matchMedia().add("(min-width: 761px)", () => {
      const trackEl = $("#reelTrack");
      const dist = () => trackEl.scrollWidth - innerWidth;
      const tw = gsap.to(trackEl, {
        x: () => -dist(), ease: "none",
        scrollTrigger: { trigger: "#reel", start: "top top", end: () => "+=" + dist(), pin: true, scrub: 1, invalidateOnRefresh: true, anticipatePin: 1,
          onUpdate: (s) => gsap.set("#reelBar", { scaleX: s.progress }) },
      });
      $$(".reel-card").forEach((c) => {
        gsap.fromTo(c.querySelector("img, video"), { xPercent: -6 }, { xPercent: 6, ease: "none", scrollTrigger: { trigger: c, containerAnimation: tw, start: "left right", end: "right left", scrub: true } });
      });
    });

    // nav: solid background after the top + active section frame
    ScrollTrigger.create({ start: 60, onToggle: (s) => $("#nav").classList.toggle("solid", s.isActive) });
    ["experiencia", "turnos", "servicios", "coworking", "contacto"].forEach((id) => {
      const link = $(`.nav-links a[href="#${id}"]`);
      const end = id === "turnos" ? "#turnera" : `#${id}`;
      ScrollTrigger.create({ trigger: `#${id}`, endTrigger: end, start: "top 50%", end: "bottom 50%", onToggle: (s) => link.classList.toggle("on", s.isActive) });
    });

    // hero: frame closes in + title drift
    gsap.timeline({ scrollTrigger: { trigger: "#hero", start: "top top", end: "bottom top", scrub: true } })
      .to(".hero-media", { clipPath: "inset(6% 4% 10% 4% round 4px)", scale: 0.96, ease: "none" }, 0)
      .to(".hero-title", { yPercent: -40, ease: "none" }, 0)
      .to(".hero-top", { opacity: 0, ease: "none" }, 0);

    // marquee reacts to scroll velocity
    const track = $("#marquee");
    track.innerHTML += track.innerHTML;
    const mq = gsap.to(track, { xPercent: -50, duration: 28, ease: "none", repeat: -1 });
    ScrollTrigger.create({ onUpdate: (self) => { const v = self.getVelocity() / 300; gsap.to(mq, { timeScale: (self.direction || 1) * Math.max(1, Math.min(Math.abs(v), 5)), duration: 0.4, overwrite: true }); } });

    // manifesto word reveal
    gsap.to($$("#manifesto .w"), { opacity: 1, stagger: 0.1, ease: "none", scrollTrigger: { trigger: "#manifesto", start: "top 80%", end: "bottom 45%", scrub: true } });

    // fade-up reveals
    ScrollTrigger.batch("[data-reveal]", {
      start: "top 88%",
      onEnter: (els) => gsap.to(els, { opacity: 1, y: 0, duration: 1.1, stagger: 0.09, ease: "expo.out", overwrite: true }),
    });

    // parallax on every editorial image (moves inside its frame)
    $$("img[data-parallax]").forEach((img) => {
      const box = img.closest(".turnos-hero") || img.parentElement;
      gsap.fromTo(img, { yPercent: -14 }, { yPercent: 0, ease: "none", scrollTrigger: { trigger: box, start: "top bottom", end: "bottom top", scrub: true } });
    });
    gsap.fromTo(".th-title", { yPercent: 25 }, { yPercent: -10, ease: "none", scrollTrigger: { trigger: "#turnos", start: "top bottom", end: "bottom top", scrub: true } });

    gsap.from(".contact-big .line-mask > span", { yPercent: 110, duration: 1.3, ease: "expo.out", scrollTrigger: { trigger: ".contact-big", start: "top 85%" } });
    gsap.fromTo("#footerWord", { xPercent: 8 }, { xPercent: -6, ease: "none", scrollTrigger: { trigger: ".footer", start: "top bottom", end: "bottom bottom", scrub: true } });

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
    // images load lazily: recompute trigger positions as they arrive
    $$("img").forEach((i) => i.complete || i.addEventListener("load", () => ScrollTrigger.refresh(), { once: true }));
    ScrollTrigger.refresh();
  }

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
    renderTurnosHero();
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
      renderTurnosHero();
      renderPriceList();
      booking.init();
      pro.init();
    } catch (err) {
      console.error(err);
      $("#nowText").textContent = "No pudimos cargar la agenda. Escribinos por WhatsApp.";
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
