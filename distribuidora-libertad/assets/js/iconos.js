/* Íconos de línea propios (24×24, trazo 1.75). Uso: LIB_IC.svg("nombre") */
(function () {
  var P = {
    /* rubros */
    corte: '<circle cx="9" cy="14" r="6"/><circle cx="9" cy="14" r="1.6"/><path d="M13.5 10.2 20 4.5l1.5 1.5-5.8 6.4M9 8v-.8M14.2 14h.8M3.8 14H3M9 20v.8"/>',
    manuales: '<path d="m14.5 6.5 3-3a3.5 3.5 0 0 1-4 5l-8.3 8.3a1.8 1.8 0 0 1-2.5-2.5L11 6a3.5 3.5 0 0 1 5-4z"/><path d="m13 15 5.5 5.5M16 12l5 5-2.5 2.5"/>',
    fijaciones: '<path d="M9 3h6l1.5 3h-9zM10 6v13l2 2 2-2V6"/><path d="M10 9.5l4-1.5M10 13l4-1.5M10 16.5l4-1.5"/>',
    electricidad: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.6 10.8c.7.5 1.1 1.3 1.1 2.2h5c0-.9.4-1.7 1.1-2.2A6 6 0 0 0 12 3z"/><path d="m12.7 6.5-2 3.5h2.6l-2 3.5"/>',
    plomeria: '<path d="M4 8h7a3 3 0 0 1 3 3v2M4 5v6M14 13h-3v3h6v-3h-3"/><path d="M14 16v1.5M14 20.5v.5"/><path d="M8 5h-3"/>',
    pintureria: '<rect x="3" y="3" width="15" height="6" rx="1.5"/><path d="M18 6h2.5v5H11v3"/><rect x="9.5" y="14" width="3" height="7" rx="1"/>',
    quimicos: '<circle cx="9" cy="13" r="6"/><circle cx="9" cy="13" r="2.2"/><path d="M15 13h6v3h-6M15 10V5l3-2v4"/>',
    riego: '<path d="M7 21v-4a3 3 0 0 1 3-3h4a3 3 0 0 0 3-3V9"/><path d="M14 9h6l-1 3h-4zM17 6v3M19 3.5 21 2M15 3.5 13 2M17 3V1.5"/><circle cx="7" cy="21" r=".5"/>',
    gas: '<path d="M12 21c4 0 6.5-2.6 6.5-6.2 0-3.4-2.6-5.4-3.6-8.3-.9 2-2 3-3 3.5.2-2.5-.8-5-3-7 .3 3-3.4 5.8-3.4 11.8C5.5 18.4 8 21 12 21z"/><path d="M12 21c-1.8 0-3-1.2-3-2.9 0-2 1.6-2.8 2.3-4.6 1 1.4 3.7 2.3 3.7 4.6 0 1.7-1.2 2.9-3 2.9z"/>',
    herrajes: '<circle cx="12" cy="16" r="5"/><circle cx="12" cy="16" r="1.5"/><path d="M5 4h14M12 4v7M8 4v3h8V4"/>',
    seguridad: '<rect x="4.5" y="10" width="15" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14.5v2.5"/>',
    mallas: '<path d="M3 3l18 18M9 3l12 12M15 3l6 6M3 9l12 12M3 15l6 6M21 3 3 21M15 3 3 15M9 3 3 9M21 9 9 21M21 15l-6 6"/>',
    general: '<path d="M3 9h18v10a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 19z"/><path d="M8.5 9V6a1.5 1.5 0 0 1 1.5-1.5h4A1.5 1.5 0 0 1 15.5 6v3M3 13.5h18M10.5 12v3h3v-3"/>',
    todo: '<rect x="3" y="3" width="7.5" height="7.5" rx="1.2"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="1.2"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="1.2"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.2"/>',
    /* valores */
    confianza: '<path d="M8 12.5 3.5 8 7 4.5l3 1.5 2-1 2 1 3-1.5L20.5 8 16 12.5"/><path d="m8 12.5 3 3a1.4 1.4 0 0 0 2-2M10 14l2.5 2.5a1.4 1.4 0 0 0 2-2l-1-1M12.5 16.5a1.4 1.4 0 0 0 2-2"/><path d="M16 12.5l-1.5 1.5"/>',
    respeto: '<path d="M12 20s-7.5-4.4-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.6-7.5 10-7.5 10z"/>',
    responsabilidad: '<path d="M12 3 4.5 6v5.5c0 4.5 3.2 8 7.5 9.5 4.3-1.5 7.5-5 7.5-9.5V6z"/><path d="m8.8 12 2.2 2.2 4.2-4.4"/>',
    palabra: '<path d="M4 5h16v11H9l-5 4z"/><path d="m8.5 10.5 2.2 2.2 4.8-4.7"/>',
    /* pasos */
    buscar: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m20 20-4.8-4.8"/>',
    lista: '<path d="M9 6h11M9 12h11M9 18h11"/><path d="m3.5 6 1 1 2-2M3.5 12l1 1 2-2M3.5 18l1 1 2-2"/>',
    enviar: '<path d="M21 3 10 14M21 3l-7 18-4-7-7-4z"/>',
    camion: '<path d="M2.5 6h11v10h-11zM13.5 9.5h4l3.5 3.5v3h-7.5"/><circle cx="6.5" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/>',
    /* ui */
    carrito: '<path d="M3 4h2l2.4 10.5a1.5 1.5 0 0 0 1.5 1.1h8.6a1.5 1.5 0 0 0 1.4-1.1L21 8H6.2"/><circle cx="9.5" cy="19.5" r="1.3"/><circle cx="17" cy="19.5" r="1.3"/>',
    mas: '<path d="M12 5v14M5 12h14"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    pin: '<path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/>',
    tel: '<path d="M5 3.5h3.5L10 8 7.8 9.4a11 11 0 0 0 6.8 6.8L16 14l4.5 1.5V19a1.5 1.5 0 0 1-1.6 1.5A16.5 16.5 0 0 1 3.5 5.1 1.5 1.5 0 0 1 5 3.5z"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="1.5"/><path d="m3.5 6 8.5 7 8.5-7"/>',
    reloj: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
    caja: '<path d="M3.5 7.5 12 3l8.5 4.5v9L12 21l-8.5-4.5z"/><path d="M3.5 7.5 12 12l8.5-4.5M12 12v9M7.8 5.2l8.4 4.6"/>',
    grilla: '<rect x="4" y="4" width="6.5" height="6.5" rx="1"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1"/>',
    filas: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    tienda: '<path d="M3.5 9 5 4h14l1.5 5M3.5 9h17M3.5 9a2.8 2.8 0 0 0 5.7 0 2.8 2.8 0 0 0 5.6 0 2.8 2.8 0 0 0 5.7 0M5 11.5V20h14v-8.5M10 20v-5h4v5"/>',
    casco: '<path d="M3 17h18M4.5 17a7.5 7.5 0 0 1 15 0M10 9.8V6.5h4v3.3M8 17v-3M16 17v-3"/>'
  };
  var WA = '<svg viewBox="0 0 32 32" fill="currentColor" aria-hidden="true"><path d="M16 3C9 3 3.3 8.6 3.3 15.6c0 2.3.6 4.5 1.8 6.4L3.2 29l7.2-1.9a12.7 12.7 0 0 0 5.6 1.4h.1c7 0 12.7-5.7 12.7-12.7C28.8 8.7 23 3 16 3zm0 23.2c-1.9 0-3.7-.5-5.3-1.4l-.4-.2-4.3 1.1 1.1-4.2-.2-.4a10.5 10.5 0 0 1-1.6-5.6C5.3 9.8 10.1 5.1 16 5.1c5.8 0 10.6 4.7 10.6 10.5S21.8 26.2 16 26.2zm5.8-7.9c-.3-.2-1.9-.9-2.2-1-.3-.1-.5-.2-.7.2-.2.3-.8 1-1 1.2-.2.2-.4.2-.7.1-.3-.2-1.3-.5-2.5-1.6-.9-.8-1.6-1.8-1.7-2.1-.2-.3 0-.5.1-.6l.5-.6.3-.5c.1-.2 0-.4 0-.6l-1-2.4c-.3-.6-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4-.3.3-1.2 1.1-1.2 2.8s1.2 3.2 1.4 3.5c.2.2 2.4 3.6 5.7 5 .8.4 1.4.6 1.9.7.8.3 1.5.2 2.1.1.6-.1 1.9-.8 2.2-1.5.3-.7.3-1.4.2-1.5-.1-.1-.3-.2-.6-.3z"/></svg>';
  window.LIB_IC = {
    svg: function (n, cls) {
      if (n === "wa") return WA;
      return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"' + (cls ? ' class="' + cls + '"' : '') + '>' + (P[n] || P.caja) + '</svg>';
    }
  };
})();
