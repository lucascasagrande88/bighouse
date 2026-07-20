(function () {
  "use strict";

  var config = window.CHIMI_CONFIG || {};
  var LANDING_VERSION = "vidriera-dopamine-v4";
  var diagnosis = null;

  function getElement(id) {
    return document.getElementById(id);
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
    var payload = Object.assign({
      event: eventName,
      landing_version: LANDING_VERSION,
      copy_seed: diagnosis && typeof diagnosis.copySeed !== "undefined" ? diagnosis.copySeed : "unknown",
      copy_pack: diagnosis && diagnosis.copyPack ? diagnosis.copyPack : "unknown",
      page_path: window.location.pathname,
      timestamp: new Date().toISOString()
    }, details || {});
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(payload);
    if (typeof window.gtag === "function") {
      var gaPayload = Object.assign({}, payload);
      delete gaPayload.event;
      window.gtag("event", eventName, gaPayload);
    }
    if (typeof window.fbq === "function") {
      window.fbq("trackCustom", eventName, payload);
    }
  }

  function loadDiagnosis() {
    try {
      var saved = window.sessionStorage.getItem("chimiDiagnosis");
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      return null;
    }
  }

  function setText(id, text) {
    var element = getElement(id);
    if (element && text) {
      element.textContent = text;
    }
  }

  function updatePlan(plan) {
    var stack = getElement("priority-stack");
    if (!stack || !Array.isArray(plan) || !plan.length) {
      return;
    }
    stack.innerHTML = plan.map(function (item) {
      return '<article><span>' + item.number + '</span><div><h3>' + item.title + '</h3><p>' + item.text + '</p></div></article>';
    }).join("");
  }

  function configureWhatsApp() {
    var button = getElement("whatsapp-action");
    if (!button) {
      return;
    }
    var number = String(config.whatsappNumber || "5491134112537").replace(/\D/g, "");
    var message = config.whatsappMessage || "Hola Chimi, hice el diagnóstico de mi vidriera digital y quiero que mi negocio se note más y venda mejor.";
    if (diagnosis && diagnosis.profile) {
      message += " Mi perfil fue: " + diagnosis.profile + ".";
    }
    button.href = "https://wa.me/" + number + "?text=" + encodeURIComponent(message);
    button.addEventListener("click", function () {
      track("whatsapp_click", {
        quiz_profile: diagnosis && diagnosis.profile ? diagnosis.profile : "unknown"
      });
    });
  }

  diagnosis = loadDiagnosis();
  loadAnalytics();
  if (diagnosis) {
    setText("thanks-profile", "PERFIL DETECTADO · " + diagnosis.profile);
    setText("thanks-headline", diagnosis.headline);
    setText("thanks-verdict", diagnosis.verdict);
    updatePlan(diagnosis.plan);
  }

  configureWhatsApp();
  track("diagnosis_detail_view", {
    quiz_profile: diagnosis && diagnosis.profile ? diagnosis.profile : "unknown",
    quiz_score: diagnosis && typeof diagnosis.score !== "undefined" ? diagnosis.score : "unknown"
  });
}());
