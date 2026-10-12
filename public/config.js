// ============================================================
// juanperro - config.js
// API y dependencias tecnicas -> VPS. Links para humanos -> dominio publico.
// ============================================================
(function () {
  var path = window.location.pathname || '';
  var BASE = path.indexOf('/juanperro') === 0 ? '/juanperro' : '';
  var host = window.location.hostname
  var isLocal = host === 'localhost' || host === '127.0.0.1' || host.indexOf('localhost') !== -1;
  var isVps = host.indexOf('dattaweb.com') !== -1 || host.indexOf('vps-') === 0;

  // El backend vive en el VPS; el front se sirve desde el FTP de Ferozo.
  var API_URL = (isLocal || isVps)
    ? window.location.origin + BASE + '/api'
    : 'https://vps-4455523-x.dattaweb.com/juanperro/api';

  var PUBLIC_BASE = isLocal ? window.location.origin + BASE : 'https://fullscreencode.com/juanperro';

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
