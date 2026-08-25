/* flota.studio — interacciones */
(function () {
  "use strict";

  /* Nav: estado al hacer scroll + toggle mobile */
  var nav = document.querySelector(".nav");
  var toggle = document.querySelector(".nav-toggle");
  var menu = document.querySelector(".nav-menu");

  function onScroll() {
    if (!nav) return;
    nav.classList.toggle("scrolled", window.scrollY > 24);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  if (toggle && menu) {
    toggle.addEventListener("click", function () {
      var open = menu.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      document.body.style.overflow = open ? "hidden" : "";
    });
    menu.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        menu.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
        document.body.style.overflow = "";
      });
    });
  }

  /* Reveal en scroll */
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var revealables = document.querySelectorAll(".reveal");
  if (reduce || !("IntersectionObserver" in window)) {
    revealables.forEach(function (el) { el.classList.add("in"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.14, rootMargin: "0px 0px -8% 0px" });
    revealables.forEach(function (el) { io.observe(el); });
  }

  /* Marquee: duplicar el contenido para loop continuo */
  document.querySelectorAll(".marquee-track").forEach(function (track) {
    track.innerHTML += track.innerHTML;
  });

  /* Año dinámico en footer */
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });
})();
