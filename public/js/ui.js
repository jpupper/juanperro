// ============================================================
// juanperro - js/ui.js  (helpers de DOM; nada de markup inline)
// ============================================================
(function () {
  'use strict';

  function qs(sel, raiz) { return (raiz || document).querySelector(sel); }
  function qsa(sel, raiz) { return Array.prototype.slice.call((raiz || document).querySelectorAll(sel)); }

  function vaciar(nodo) {
    while (nodo && nodo.firstChild) nodo.removeChild(nodo.firstChild);
  }

  function crear(tag, clase, texto) {
    var n = document.createElement(tag);
    if (clase) n.className = clase;
    if (texto !== undefined && texto !== null) n.textContent = String(texto);
    return n;
  }

  function texto(id, valor) {
    var n = document.getElementById(id);
    if (n) n.textContent = String(valor);
  }

  function hace(iso) {
    var t = new Date(iso).getTime();
    if (!t) return '';
    var seg = Math.max(1, Math.round((Date.now() - t) / 1000));
    if (seg < 60) return 'hace ' + seg + ' s';
    var min = Math.round(seg / 60);
    if (min < 60) return 'hace ' + min + ' min';
    var hs = Math.round(min / 60);
    if (hs < 24) return 'hace ' + hs + ' h';
    return 'hace ' + Math.round(hs / 24) + ' d';
  }

  function escaparHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }

  window.UI = {
    qs: qs, qsa: qsa, vaciar: vaciar, crear: crear, texto: texto, hace: hace, escaparHtml: escaparHtml
  };
})();
