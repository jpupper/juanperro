// ============================================================
// juanperro - smoke test (sin dependencias de test runner)
//   node tests/smoke.js [http://localhost:3260]
// ============================================================
'use strict';

const BASE = (process.argv[2] || 'http://localhost:3260').replace(/\/$/, '');
const APP = BASE + '/juanperro';

let fallos = 0;

function chequear(nombre, condicion, detalle) {
  if (condicion) {
    console.log('  ok  ' + nombre);
  } else {
    fallos++;
    console.log('  FALLA ' + nombre + (detalle ? ' -> ' + detalle : ''));
  }
}

async function json(ruta, opciones) {
  const r = await fetch(APP + ruta, opciones);
  let d = null;
  try { d = await r.json(); } catch (e) { d = null; }
  return { status: r.status, data: d };
}

(async function () {
  console.log('Smoke de juanperro contra ' + APP);

  const html = await fetch(APP + '/');
  const cuerpo = await html.text();
  chequear('GET / responde 200', html.status === 200, 'status=' + html.status);
  chequear('el HTML trae el perro', cuerpo.indexOf('juanSvg') !== -1);
  chequear('HTML sin <style> inline', cuerpo.indexOf('<style') === -1);
  chequear('HTML sin style="..." inline', cuerpo.indexOf('style="') === -1);

  const estado = await json('/api/estado');
  chequear('GET /api/estado 200', estado.status === 200, 'status=' + estado.status);
  chequear('estado trae a Juan', !!(estado.data && estado.data.juan && estado.data.juan.nombre === 'Juan'));
  chequear('estado trae ranking', !!(estado.data && Array.isArray(estado.data.ranking)));

  const malo = await json('/api/cuidar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accion: 'volar', cuidador: 'test' })
  });
  chequear('accion invalida -> 400', malo.status === 400, 'status=' + malo.status);

  const antes = (await json('/api/estado')).data.juan.felicidad;
  const bien = await json('/api/cuidar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accion: 'acariciar', cuidador: 'smoke-test' })
  });
  chequear('POST /api/cuidar 200', bien.status === 200, 'status=' + bien.status);
  chequear('los mimos suben la felicidad', bien.data && bien.data.juan.felicidad >= antes,
    'antes=' + antes + ' despues=' + (bien.data && bien.data.juan.felicidad));

  const assets = await json('/api/fsc/assets?username=smoke');
  chequear('fsc/assets sin credenciales -> 401', assets.status === 401, 'status=' + assets.status);

  console.log(fallos === 0 ? 'TODO OK' : fallos + ' FALLAS');
  process.exit(fallos === 0 ? 0 : 1);
})();
