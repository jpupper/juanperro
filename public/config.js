// ============================================================
// juanperro - config.js
// API y dependencias tecnicas -> VPS. Links para humanos -> dominio publico.
// ============================================================
(function () {
  // El front puede servirse desde dos lugares del FTP/dominio público:
  //   /carloskernel/juanperro/  -> espacio común (el lugar OFICIAL desde 12-Oct-2026)
  //   /juanperro/               -> ubicación vieja (hoy sólo redirige al espacio común)
  // y desde el VPS en /juanperro/. La API es SIEMPRE la del VPS.
  var path = window.location.pathname || '';
  var match = path.match(/^(.*?\/juanperro)(?:\/|$)/);
  var BASE = match ? match[1] : '/juanperro';
  var host = window.location.hostname
  var isLocal = host === 'localhost' || host === '127.0.0.1' || host.indexOf('localhost') !== -1;
  var isVps = host.indexOf('dattaweb.com') !== -1 || host.indexOf('vps-') === 0;

  // El backend vive en el VPS; el front se sirve desde el FTP de Ferozo.
  var API_URL = (isLocal || isVps)
    ? window.location.origin + BASE + '/api'
    : 'https://vps-4455523-x.dattaweb.com/juanperro/api';

  var PUBLIC_BASE = isLocal ? window.location.origin + BASE : 'https://fullscreencode.com' + BASE;

  window.CONFIG = {
    APP: 'juanperro',
    BASE: BASE || '/juanperro',
    isLocal: isLocal,
    isVps: isVps,
    API_URL: API_URL,
    BACKEND_ORIGIN: (isLocal || isVps) ? window.location.origin : 'https://vps-4455523-x.dattaweb.com',
    PUBLIC_BASE: PUBLIC_BASE,
    FSCAUTH_URL: 'https://fullscreencode.com/fscauth'
  };
})();
