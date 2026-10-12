// ============================================================
// FSC - indice universal de assets de juanperro (fail-closed)
//   GET {BASE}/api/fsc/assets?username=X&userId=Y
//   Sin credenciales -> 401. Con credenciales -> 200 { ok, app, groups[] }
// Los binarios NO viven aca: van a Cloudflare R2 (regla 0.5).
// ============================================================
'use strict';

const express = require('express');
const router = express.Router();

const PUBLIC_BASE = process.env.FSC_PUBLIC_ORIGIN || 'https://fullscreencode.com';
const FSCAUTH_URL = process.env.FSCAUTH_URL || 'https://vps-4455523-x.dattaweb.com/fscauth';

async function autorizado(req, username) {
  const internal = process.env.FSC_INTERNAL_KEY || '';
  const key = req.headers['x-fsc-internal'];
  if (internal && key && key === internal) return true;

  const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token) return false;
  try {
    const r = await fetch(FSCAUTH_URL.replace(/\/$/, '') + '/api/auth/verify', {
      headers: { Authorization: 'Bearer ' + token }
    });
    const d = await r.json();
    if (!d || d.loggedIn !== true || !d.user) return false;
    const u = d.user;
    if (String(u.username || '').toLowerCase() === String(username || '').toLowerCase()) return true;
    return u.role === 'ADMIN' || u.role === 'SYSTEM';
  } catch (e) {
    return false;
  }
}

router.get('/assets', async (req, res) => {
  const username = String(req.query.username || '').trim();
  const userId = String(req.query.userId || '').trim();
  if (!username && !userId) return res.status(400).json({ ok: false, error: 'falta username/userId' });
  if (!(await autorizado(req, username))) return res.status(401).json({ ok: false, error: 'No autorizado' });

  // juanperro no guarda piezas por usuario: solo publica su pagina en el pasaporte.
  res.json({
    ok: true,
    app: 'juanperro',
    username: username || null,
    total: 1,
    groups: [{
      type: 'juanperro_page',
      label: 'Juan, el perro del ecosistema',
      count: 1,
      items: [{
        id: 'juanperro',
        title: 'Cuidar a Juan',
        url: PUBLIC_BASE + '/juanperro/',
        meta: { descripcion: 'Mascota compartida FSC' }
      }]
    }]
  });
});

module.exports = router;
