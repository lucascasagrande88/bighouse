(function () {
  "use strict";

  var config = window.CHIMI_CONFIG || {};
  var LANDING_VERSION = "vidriera-dopamine-v4";
  var quizLive = document.getElementById("quiz-live");
  var leadCapture = document.getElementById("lead-capture");
  var leadForm = document.getElementById("lead-form");
  var progressFill = document.getElementById("progress-fill");
  var progressCurrent = document.getElementById("progress-current");
  var quizStatus = document.getElementById("quiz-status");
  var reducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------------------------------------------------------------- *
   * Copy packs: 5 packs coherentes. En cada carga se elige uno (o el que
   * fuerce ?copy_seed=0..4). Todos los títulos y CTAs principales responden
   * al mismo pack para que la landing no quede incoherente.
   * ---------------------------------------------------------------------- */
  var copyPacks = [
    {
      id: "vidriera",
      heroEyebrow: "SISTEMAS DE DISEÑO PARA VENDER MÁS",
      heroTitle: 'VIDRIERAS DIGITALES QUE HACEN QUE TU NEGOCIO <span class="hero-highlight">SE VEA</span>, SE ENTIENDA Y SE ELIJA.',
      heroLede: "Tu negocio ya tiene algo bueno. Nosotros hacemos que internet lo muestre como se merece: claro, profesional y listo para que te escriban.",
      heroCta: "VER QUÉ LE FALTA A MI VIDRIERA",
      heroSecondary: "ver cómo se ve una vidriera Chimi",
      headerCta: "diagnóstico gratis",
      proofSocial: "marcas y comercios ya usan un sistema Chimi para vender mejor.",
      closingKicker: "TU VIDRIERA DIGITAL PUEDE EMPEZAR HOY",
      closingTitle: 'AGREGALE CHIMI<br><span>A TU NEGOCIO.</span>',
      closingCta: "HACÉ EL DIAGNÓSTICO"
    },
    {
      id: "merece",
      heroEyebrow: "SISTEMAS DE DISEÑO PARA VENDER MÁS",
      heroTitle: 'TU NEGOCIO YA TIENE ALGO BUENO. HAGAMOS QUE INTERNET LO <span class="hero-highlight">MUESTRE</span> COMO SE MERECE.',
      heroLede: "No se trata de tener más redes. Se trata de tener una vidriera digital que frene, explique y haga que quieran entrar.",
      heroCta: "QUIERO QUE MI NEGOCIO SE NOTE",
      heroSecondary: "mirá el antes y el después",
      headerCta: "quiero que se note",
      proofSocial: "negocios ya se muestran mejor con un sistema Chimi.",
      closingKicker: "LO BUENO QUE HACÉS MERECE VERSE ASÍ",
      closingTitle: 'QUE INTERNET<br><span>LO MUESTRE BIEN.</span>',
      closingCta: "EMPEZAR MI DIAGNÓSTICO"
    },
    {
      id: "elegir",
      heroEyebrow: "SISTEMAS DE DISEÑO PARA VENDER MÁS",
      heroTitle: 'QUE TE VEAN NO ALCANZA. HAY QUE HACER QUE TE <span class="hero-highlight">ENTIENDAN</span> Y TE ELIJAN.',
      heroLede: "Frenar, explicar y convencer en segundos. Esa es la vidriera digital que armamos para que dejen de compararte sólo por precio.",
      heroCta: "QUIERO QUE ME ELIJAN",
      heroSecondary: "ver cómo se logra",
      headerCta: "diagnóstico gratis",
      proofSocial: "comercios ya hacen que los entiendan y los elijan con Chimi.",
      closingKicker: "DE QUE TE VEAN A QUE TE ELIJAN",
      closingTitle: 'QUE TE VEAN,<br><span>Y QUE TE ELIJAN.</span>',
      closingCta: "HACÉ EL DIAGNÓSTICO"
    },
    {
      id: "frena",
      heroEyebrow: "SISTEMAS DE DISEÑO PARA VENDER MÁS",
      heroTitle: 'TU LOCAL FRENA GENTE EN LA VEREDA. TU <span class="hero-highlight">VIDRIERA DIGITAL</span> TIENE QUE FRENARLA EN EL CELULAR.',
      heroLede: "Armamos la presencia que corta el scroll, explica qué hacés y lleva a la persona directo a escribirte.",
      heroCta: "QUIERO FRENAR MÁS GENTE",
      heroSecondary: "ver la vidriera en acción",
      headerCta: "diagnóstico gratis",
      proofSocial: "negocios ya frenan más gente con su vidriera Chimi.",
      closingKicker: "EL SCROLL PASA RÁPIDO. TU VIDRIERA LO FRENA",
      closingTitle: 'FRENÁ EL SCROLL.<br><span>GANÁ LA VENTA.</span>',
      closingCta: "EMPEZAR EL DIAGNÓSTICO"
    },
    {
      id: "profesional",
      heroEyebrow: "SISTEMAS DE DISEÑO PARA VENDER MÁS",
      heroTitle: 'MISMO NEGOCIO. MISMA CALIDAD. ONLINE SE TIENE QUE <span class="hero-highlight">VER</span> DIEZ VECES MEJOR.',
      heroLede: "Tu vidriera digital tiene que estar a la altura de lo que ya ofrecés. Clara, profesional y lista para convertir atención en consultas.",
      heroCta: "MOSTRAME CÓMO SE VE MEJOR",
      heroSecondary: "ver el antes y el después",
      headerCta: "diagnóstico gratis",
      proofSocial: "negocios ya se ven al nivel de lo que hacen, con Chimi.",
      closingKicker: "TU NEGOCIO ES BUENO. QUE SE VEA ASÍ",
      closingTitle: 'AGREGALE CHIMI<br><span>Y QUE SE NOTE.</span>',
      closingCta: "HACÉ EL DIAGNÓSTICO"
    }
  ];
  var RICH_COPY_KEYS = { heroTitle: true, closingTitle: true };
  var activeSeed = 0;
  var activePack = copyPacks[0];

  /* ---------------------------------------------------------------------- *
   * Quiz de vidriera digital
   * ---------------------------------------------------------------------- */
  var questions = [
    {
      id: "q1",
      focus: "orden",
      title: "Cuando pensás en tu presencia online esta semana, ¿cómo se organiza?",
      answers: [
        { label: "Publico cuando encuentro un rato.", score: 0 },
        { label: "Tengo ideas, pero no una ruta.", score: 1 },
        { label: "Hay calendario, aunque le falta fuerza.", score: 2 },
        { label: "Hay plan y quiero que rinda todavía más.", score: 3 }
      ]
    },
    {
      id: "q2",
      focus: "consultas",
      title: "¿Cómo llega hoy la mayoría de tus clientes?",
      answers: [
        { label: "Casi todo por recomendación de boca en boca.", score: 0 },
        { label: "Por redes, pero de forma irregular.", score: 1 },
        { label: "Tengo movimiento, me cuesta convertirlo en consulta.", score: 2 },
        { label: "Sé de dónde vienen y quiero escalar.", score: 3 }
      ]
    },
    {
      id: "q3",
      focus: "mensaje",
      title: "Cuando alguien conoce tu negocio por primera vez en internet...",
      answers: [
        { label: "No termina de entender qué me hace distinto.", score: 0 },
        { label: "Entiende, pero me compara por precio.", score: 1 },
        { label: "Se entiende, aunque falta que lo prefieran.", score: 2 },
        { label: "La propuesta está clara y quiero expandirla.", score: 3 }
      ]
    },
    {
      id: "q4",
      focus: "ruta",
      title: "¿Qué necesitás destrabar antes que nada?",
      answers: [
        { label: "Dejar de hacer todo a las apuradas.", score: 0 },
        { label: "Que la gente sepa cómo comprarme o escribirme.", score: 1 },
        { label: "Elegir una prioridad y no diez frentes abiertos.", score: 2 },
        { label: "Preparar una promo, un lanzamiento o una nueva etapa.", score: 3 }
      ]
    },
    {
      id: "q5",
      focus: "nivel",
      title: "Hoy, tu identidad y tu contenido...",
      answers: [
        { label: "No representan la calidad real del negocio.", score: 0 },
        { label: "A veces funcionan y otras se sienten desconectados.", score: 1 },
        { label: "Tienen tono, pero les falta consistencia.", score: 2 },
        { label: "Tienen identidad fuerte y están listos para crecer.", score: 3 }
      ]
    }
  ];

  var focusData = {
    orden: {
      title: "ordenar la vidriera digital",
      priority: "Definir una ruta de contenidos con temas, formatos y objetivos claros para que tu vidriera no dependa de la inspiración del día ni de un rato libre.",
      move: "Convertir posteos sueltos en una vidriera con dirección."
    },
    nivel: {
      title: "verse al nivel del negocio",
      priority: "Ajustar identidad, tono y piezas clave para que la primera impresión transmita la calidad, la confianza y el nivel que después cumplís en persona.",
      move: "Hacer que tu vidriera prometa lo mismo que ofrecés puertas adentro."
    },
    mensaje: {
      title: "decir mejor lo que hace",
      priority: "Ordenar el mensaje central, el diferencial y la forma de explicar tu oferta para que se entienda en segundos y no quedes atado a competir por precio.",
      move: "Pasar de explicar demasiado a que te elijan más fácil."
    },
    ruta: {
      title: "elegir una ruta clara",
      priority: "Elegir una prioridad comercial y convertirla en un recorrido: menos frentes abiertos y un camino directo hacia WhatsApp, la reserva o la venta.",
      move: "Alinear lo que mostrás con el próximo paso que querés que la gente dé."
    },
    consultas: {
      title: "mover más consultas",
      priority: "Detectar qué piezas atraen a la persona correcta, qué llamada a la acción necesita cada una y dónde hoy se corta el recorrido hacia la conversación de venta.",
      move: "Hacer que más de la atención que ya generás termine en una consulta real."
    }
  };

  var profiles = [
    {
      limit: 4,
      id: "vidriera-apagada",
      name: "VIDRIERA APAGADA",
      headline: "Tenés un negocio con motor. Tu vidriera digital todavía maneja con el freno de mano puesto.",
      verdict: "No falta valor: falta una vidriera que muestre ese valor con consistencia. Hoy cada publicación resuelve una urgencia y así es difícil que te frenen, te entiendan y te elijan.",
      fact: "Según el Instituto Internacional de “vemos qué subimos”, decidir el contenido a las 23:48 no cuenta como estrategia."
    },
    {
      limit: 8,
      id: "vidriera-intermitente",
      name: "VIDRIERA INTERMITENTE",
      headline: "Hay buenas señales, pero tu vidriera aparece y desaparece antes de hacerse memorable.",
      verdict: "Ya hay material: ideas, movimiento y una propuesta real. Lo que falta es conectar todo para que tu presencia no dependa de una racha de energía.",
      fact: "Dato inventado pero sospechosamente cierto: la gente confía más cuando una marca no cambia de personalidad cada martes."
    },
    {
      limit: 11,
      id: "buen-negocio-vidriera-floja",
      name: "BUEN NEGOCIO, VIDRIERA FLOJA",
      headline: "Tu negocio ya tiene con qué jugar en primera. La vidriera todavía no lo muestra así.",
      verdict: "La base está bastante bien. El riesgo no es no tener nada para decir: es desperdiciar esa base en piezas sueltas que no empujan hacia el mismo objetivo.",
      fact: "Los científicos de Chimi confirmaron que tener 47 ideas abiertas y ninguna prioridad es una forma muy elegante de cansarse."
    },
    {
      limit: 15,
      id: "vidriera-lista-acelerar",
      name: "VIDRIERA LISTA PARA ACELERAR",
      headline: "Tu vidriera ya se sostiene sola. El próximo nivel es transformar presencia en más consultas.",
      verdict: "Hay claridad, identidad y una base operativa. El foco ahora no es empezar de cero: es detectar qué palancas multiplican lo que ya funciona.",
      fact: "Cuando una vidriera tiene dirección, hasta el algoritmo parece dejar de hacerse el misterioso. No prometemos magia, sí menos azar."
    }
  ];

  var state = {
    started: false,
    completed: false,
    abandoned: false,
    current: 0,
    answers: [],
    diagnosis: null
  };

  function select(selector, scope) {
    return (scope || document).querySelector(selector);
  }

  function selectAll(selector, scope) {
    return Array.prototype.slice.call((scope || document).querySelectorAll(selector));
  }

  function escapeHTML(value) {
    var div = document.createElement("div");
    div.textContent = String(value || "");
    return div.innerHTML;
  }

  function getAttribution() {
    var params = new URLSearchParams(window.location.search);
    return {
      utm_source: params.get("utm_source") || "",
      utm_medium: params.get("utm_medium") || "",
      utm_campaign: params.get("utm_campaign") || "",
      utm_content: params.get("utm_content") || "",
      utm_term: params.get("utm_term") || "",
      referrer: document.referrer || "direct"
    };
  }

  /* ---------- Copy pack selection + apply ---------- */
  function resolveSeed() {
    var params = new URLSearchParams(window.location.search);
    var raw = params.get("copy_seed");
    if (raw !== null && raw !== "") {
      var forced = parseInt(raw, 10);
      if (!isNaN(forced) && forced >= 0 && forced < copyPacks.length) {
        return forced;
      }
    }
    return Math.floor(Math.random() * copyPacks.length);
  }

  function applyCopyPack(pack) {
    selectAll("[data-copy]").forEach(function (element) {
      var key = element.getAttribute("data-copy");
      if (!(key in pack)) {
        return;
      }
      if (RICH_COPY_KEYS[key]) {
        element.innerHTML = pack[key];
      } else {
        element.textContent = pack[key];
      }
    });
  }

  function loadAnalytics() {
    if (config.ga4MeasurementId) {
      window.dataLayer = window.dataLayer || [];
      window.gtag = window.gtag || function () {
        window.dataLayer.push(arguments);
      };
      window.gtag("js", new Date());
      window.gtag("config", config.ga4MeasurementId, { send_page_view: true });
      var gtagScript = document.createElement("script");
      gtagScript.async = true;
      gtagScript.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(config.ga4MeasurementId);
      document.head.appendChild(gtagScript);
    }

    if (config.metaPixelId) {
      window.fbq = window.fbq || function () {
        (window.fbq.q = window.fbq.q || []).push(arguments);
      };
      window.fbq("init", config.metaPixelId);
      window.fbq("track", "PageView");
      var pixelScript = document.createElement("script");
      pixelScript.async = true;
      pixelScript.src = "https://connect.facebook.net/en_US/fbevents.js";
      document.head.appendChild(pixelScript);
    }
  }

  function track(eventName, details) {
    var attribution = getAttribution();
    var payload = Object.assign({
      event: eventName,
      landing_version: LANDING_VERSION,
      copy_seed: activeSeed,
      copy_pack: activePack.id,
      page_path: window.location.pathname,
      page_title: document.title,
      timestamp: new Date().toISOString()
    }, attribution, details || {});

    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(payload);

    if (typeof window.gtag === "function") {
      var gaPayload = Object.assign({}, payload);
      delete gaPayload.event;
      window.gtag("event", eventName, gaPayload);
    }

    if (typeof window.fbq === "function") {
      if (eventName === "quiz_lead_submit") {
        window.fbq("track", "Lead", { content_name: "Chimichurri diagnóstico vidriera", copy_seed: activeSeed });
      } else {
        window.fbq("trackCustom", eventName, payload);
      }
    }
  }

  function setValue(id, value) {
    var field = document.getElementById(id);
    if (field) {
      field.value = value || "";
    }
  }

  function updateProgress(answered) {
    var safeAnswered = Math.max(0, Math.min(questions.length, answered));
    if (progressFill) {
      progressFill.style.width = String((safeAnswered / questions.length) * 100) + "%";
    }
    if (progressCurrent) {
      progressCurrent.textContent = String(safeAnswered).padStart(2, "0");
    }
  }

  function resetQuiz() {
    state.started = true;
    state.completed = false;
    state.abandoned = false;
    state.current = 0;
    state.answers = [];
    state.diagnosis = null;
    if (leadCapture) {
      leadCapture.hidden = true;
    }
    updateProgress(0);
  }

  function scrollToQuiz() {
    var target = document.getElementById("diagnostico");
    if (target) {
      target.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
    }
  }

  function startQuiz() {
    if (!state.started || state.completed) {
      resetQuiz();
    }
    if (leadCapture) {
      leadCapture.hidden = true;
    }
    renderQuestion(state.current);
    scrollToQuiz();
    track("quiz_start", { resumed: state.current > 0 });
  }

  function renderQuestion(index) {
    if (!quizLive || !questions[index]) {
      return;
    }

    var question = questions[index];
    if (quizStatus) {
      quizStatus.textContent = "PREGUNTA " + String(index + 1).padStart(2, "0") + " DE 05";
    }
    updateProgress(index);

    var answerMarkup = question.answers.map(function (answer, answerIndex) {
      return '<button class="answer-button" type="button" data-answer-index="' + answerIndex + '">' +
        escapeHTML(answer.label) + '<span aria-hidden="true">→</span></button>';
    }).join("");

    quizLive.innerHTML =
      '<div class="quiz-question">' +
      '<p class="question-kicker">PREGUNTA ' + String(index + 1).padStart(2, "0") + ' / 05</p>' +
      '<h3>' + escapeHTML(question.title) + '</h3>' +
      '<div class="answer-grid">' + answerMarkup + '</div>' +
      '</div>';

    selectAll(".answer-button", quizLive).forEach(function (button) {
      button.addEventListener("click", function () {
        chooseAnswer(index, Number(button.getAttribute("data-answer-index")), button);
      });
    });

    track("quiz_question_view", {
      question_number: index + 1,
      question_id: question.id,
      answered_count: state.answers.length
    });
  }

  function chooseAnswer(questionIndex, answerIndex, button) {
    if (button.classList.contains("is-picked")) {
      return;
    }

    var question = questions[questionIndex];
    var answer = question.answers[answerIndex];
    state.answers[questionIndex] = {
      question_id: question.id,
      question: question.title,
      focus: question.focus,
      label: answer.label,
      score: answer.score
    };
    button.classList.add("is-picked");
    selectAll(".answer-button", quizLive).forEach(function (item) {
      item.disabled = true;
    });

    track("quiz_answer", {
      question_number: questionIndex + 1,
      question_id: question.id,
      answer: answer.label,
      answer_score: answer.score
    });
    track("quiz_progress", {
      answered_count: questionIndex + 1,
      completion_percent: Math.round(((questionIndex + 1) / questions.length) * 100)
    });

    window.setTimeout(function () {
      state.current = questionIndex + 1;
      if (state.current < questions.length) {
        renderQuestion(state.current);
      } else {
        state.completed = true;
        state.diagnosis = getDiagnosis();
        renderResult(state.diagnosis);
      }
    }, reducedMotion ? 0 : 270);
  }

  function getLowestFocus() {
    var weakest = state.answers.slice().sort(function (a, b) {
      if (a.score === b.score) {
        return questions.findIndex(function (question) { return question.id === a.question_id; }) -
          questions.findIndex(function (question) { return question.id === b.question_id; });
      }
      return a.score - b.score;
    })[0];
    return weakest ? weakest.focus : "orden";
  }

  function getDiagnosis() {
    var score = state.answers.reduce(function (total, answer) {
      return total + answer.score;
    }, 0);
    var profile = profiles.filter(function (item) {
      return score <= item.limit;
    })[0] || profiles[profiles.length - 1];
    var focusKey = getLowestFocus();
    var focus = focusData[focusKey];
    var secondFocus = state.answers.slice().sort(function (a, b) {
      return a.score - b.score;
    })[1];
    var secondaryKey = secondFocus ? secondFocus.focus : "nivel";
    var secondary = focusData[secondaryKey];

    return {
      score: score,
      profile: profile.name,
      profileId: profile.id,
      headline: profile.headline,
      verdict: profile.verdict + " El primer foco está en " + focus.title + ".",
      fact: profile.fact,
      focusKey: focusKey,
      focusTitle: focus.title,
      secondaryKey: secondaryKey,
      answers: state.answers.slice(),
      plan: [
        {
          number: "01",
          title: "Prioridad inmediata",
          text: focus.priority
        },
        {
          number: "02",
          title: "Segundo ajuste",
          text: secondary.priority
        },
        {
          number: "03",
          title: "Primer movimiento",
          text: focus.move
        }
      ]
    };
  }

  function renderResult(diagnosis) {
    if (!quizLive) {
      return;
    }
    if (quizStatus) {
      quizStatus.textContent = "LECTURA LISTA";
    }
    updateProgress(questions.length);

    quizLive.innerHTML =
      '<div class="quiz-result">' +
      '<span class="result-band">TU RESULTADO GRATUITO</span>' +
      '<p class="result-profile">' + escapeHTML(diagnosis.profile) + ' · ' + diagnosis.score + '/15</p>' +
      '<h3 class="result-headline">' + escapeHTML(diagnosis.headline) + '</h3>' +
      '<p class="result-verdict">' + escapeHTML(diagnosis.verdict) + '</p>' +
      '<div class="result-fact"><span>DATO CIENTÍFICAMENTE INVENTADO</span><p>' + escapeHTML(diagnosis.fact) + '</p></div>' +
      '<button type="button" class="result-action" data-open-capture>QUIERO MI PLAN CONCRETO <b>→</b></button>' +
      '</div>';

    var captureButton = select("[data-open-capture]", quizLive);
    if (captureButton) {
      captureButton.addEventListener("click", showCapture);
    }

    track("quiz_result_view", {
      quiz_score: diagnosis.score,
      quiz_profile: diagnosis.profile,
      primary_focus: diagnosis.focusKey
    });
  }

  function populateLeadFields(diagnosis) {
    var details = diagnosis || state.diagnosis;
    if (!details) {
      return;
    }

    setValue("form-copy-seed", String(activeSeed));
    setValue("form-copy-pack", activePack.id);
    setValue("form-quiz-score", String(details.score));
    setValue("form-quiz-profile", details.profile);
    setValue("form-quiz-result", details.headline + " " + details.verdict);
    details.answers.forEach(function (answer, index) {
      setValue("form-quiz-q" + String(index + 1), answer.label);
    });

    var attribution = getAttribution();
    setValue("utm-source", attribution.utm_source);
    setValue("utm-medium", attribution.utm_medium);
    setValue("utm-campaign", attribution.utm_campaign);
    setValue("utm-content", attribution.utm_content);
    setValue("utm-term", attribution.utm_term);
    setValue("referrer", attribution.referrer);
  }

  function showCapture() {
    if (!state.diagnosis || !leadCapture) {
      return;
    }
    quizLive.innerHTML = "";
    leadCapture.hidden = false;
    if (quizStatus) {
      quizStatus.textContent = "PLAN A PUNTO DE DESBLOQUEARSE";
    }
    populateLeadFields(state.diagnosis);
    leadCapture.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "center" });
    track("quiz_lead_view", {
      quiz_score: state.diagnosis.score,
      quiz_profile: state.diagnosis.profile
    });
  }

  function saveDiagnosis() {
    if (!state.diagnosis) {
      return;
    }
    try {
      window.sessionStorage.setItem("chimiDiagnosis", JSON.stringify({
        createdAt: new Date().toISOString(),
        copySeed: activeSeed,
        copyPack: activePack.id,
        score: state.diagnosis.score,
        profile: state.diagnosis.profile,
        profileId: state.diagnosis.profileId,
        headline: state.diagnosis.headline,
        verdict: state.diagnosis.verdict,
        fact: state.diagnosis.fact,
        focusKey: state.diagnosis.focusKey,
        focusTitle: state.diagnosis.focusTitle,
        answers: state.diagnosis.answers,
        plan: state.diagnosis.plan
      }));
    } catch (error) {
      return;
    }
  }

  function setupLeadForm() {
    if (!leadForm) {
      return;
    }
    leadForm.addEventListener("submit", function () {
      var diagnosis = state.diagnosis || getDiagnosis();
      populateLeadFields(diagnosis);
      setValue("submitted-at", new Date().toISOString());
      saveDiagnosis();
      track("quiz_lead_submit", {
        quiz_score: diagnosis.score,
        quiz_profile: diagnosis.profile,
        primary_focus: diagnosis.focusKey
      });
    });
  }

  function setupStartButtons() {
    selectAll("[data-start-quiz]").forEach(function (element) {
      element.addEventListener("click", function (event) {
        event.preventDefault();
        startQuiz();
      });
    });
  }

  function isSafeLoomUrl(value) {
    try {
      var url = new URL(value);
      return url.protocol === "https:" && (url.hostname === "www.loom.com" || url.hostname === "loom.com") && url.pathname.indexOf("/embed/") === 0;
    } catch (error) {
      return false;
    }
  }

  function setupVideo() {
    var embed = document.getElementById("video-embed");
    if (!embed) {
      return;
    }
    var loomUrl = String(config.loomEmbedUrl || "").trim();
    var validEmbed = isSafeLoomUrl(loomUrl);
    if (validEmbed) {
      var separator = loomUrl.indexOf("?") === -1 ? "?" : "&";
      var src = loomUrl + separator + "hide_owner=true&hide_share=true&hide_title=true&hideEmbedTopBar=true";
      embed.innerHTML = '<iframe src="' + escapeHTML(src) + '" title="Video de Chimichurri" allowfullscreen allow="autoplay; fullscreen"></iframe>';
      track("video_embed_ready", { provider: "loom" });
    }

    selectAll("[data-video-play]").forEach(function (button) {
      button.addEventListener("click", function () {
        track("video_play_click", { provider: validEmbed ? "loom" : "placeholder" });
        if (!validEmbed) {
          startQuiz();
        }
      });
    });
  }

  function setupReveal() {
    var items = selectAll(".reveal");
    if (!("IntersectionObserver" in window)) {
      items.forEach(function (item) { item.classList.add("is-visible"); });
      return;
    }
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: .12 });
    items.forEach(function (item) { observer.observe(item); });
  }

  /* ---------- Vidriera antes/después activada por scroll ---------- */
  function setupVitrine() {
    var stage = document.querySelector("[data-vitrine-stage]");
    if (!stage) {
      return;
    }
    var frame = stage.querySelector(".vitrine-frame");
    var fill = stage.querySelector("[data-vitrine-fill]");
    if (!frame) {
      return;
    }
    if (reducedMotion) {
      frame.style.setProperty("--p", "0.5");
      if (fill) { fill.style.width = "50%"; }
      return;
    }

    var ticking = false;

    function update() {
      ticking = false;
      var rect = stage.getBoundingClientRect();
      var viewport = window.innerHeight || document.documentElement.clientHeight;
      var scrollable = rect.height - viewport;
      var progress = 0;
      if (scrollable > 0) {
        progress = (0 - rect.top) / scrollable;
      }
      progress = Math.max(0, Math.min(1, progress));
      frame.style.setProperty("--p", progress.toFixed(3));
      if (fill) {
        fill.style.width = (progress * 100).toFixed(1) + "%";
      }
    }

    function onScroll() {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(update);
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    update();
  }

  function setupAbandonmentTracking() {
    document.addEventListener("visibilitychange", function () {
      if (document.visibilityState === "hidden" && state.started && !state.completed && !state.abandoned) {
        state.abandoned = true;
        track("quiz_abandon", {
          answered_count: state.answers.length,
          last_question_number: state.current + 1
        });
      }
    });
  }

  /* ---------- Boot ---------- */
  // El JS corre: activamos la animación de entrada y cancelamos el failsafe
  // que revela todo el contenido igual si el script no hubiera cargado.
  document.documentElement.classList.add("chimi-anim");
  if (window.__chimiRevealFailsafe) {
    window.clearTimeout(window.__chimiRevealFailsafe);
  }

  activeSeed = resolveSeed();
  activePack = copyPacks[activeSeed];
  applyCopyPack(activePack);

  loadAnalytics();
  setupStartButtons();
  setupLeadForm();
  setupVideo();
  setupReveal();
  setupVitrine();
  setupAbandonmentTracking();

  track("funnel_page_view");
  track("copy_seed_view", { copy_seed: activeSeed, copy_pack: activePack.id });
}());
