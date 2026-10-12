// ============================================================
// juanperro - js/api.js  (habla con el backend del VPS desde el FTP)
// ============================================================
(function () {
  'use strict';

  function apiBase() {
    var cfg = window.CONFIG || {};
    var base = cfg.API_URL;
    if (!base) base = 'https://vps-4455523-x.dattaweb.com/juanperro/api';
    return String(base).replace(/\/+$/, '');
  }

  function pedir(ruta, opciones) {
    opciones = opciones || {};
    var url = apiBase() + ruta;
    var conf = {
      method: opciones.method || 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'omit'
    };
    if (opciones.body) conf.body = JSON.stringify(opciones.body);
    return fetch(url, conf).then(function (r) {
      return r.json().catch(function () { return { ok: false, error: 'respuesta_ilegible' }; })
        .then(function (d) {
          if (!r.ok) {
            var err = new Error((d && d.error) || ('HTTP ' + r.status));
            err.status = r.status;
            err.data = d;
            throw err;
          }
          return d;
        });
    });
  }

  window.JuanAPI = {
    base: apiBase,
    estado: function () { return pedir('/estado'); },
    cuidar: function (accion, cuidador) {
      return pedir('/cuidar', { method: 'POST', body: { accion: accion, cuidador: cuidador } });
    },
    acciones: function () { return pedir('/acciones'); }
  };
})();
