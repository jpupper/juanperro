// ============================================================
// juanperro - API de JUAN (mascota compartida del ecosistema)
//   GET  {BASE}/api/estado            -> estado + ranking + historial
//   POST {BASE}/api/cuidar            -> { accion, cuidador }
//   GET  {BASE}/api/acciones          -> catalogo de acciones
// ============================================================
'use strict';

const express = require('express');
const router = express.Router();
const store = require('../models/juanStore');

function limpiarNombre(n) {
  return String(n || '').trim().replace(/[<>]/g, '').slice(0, 24);
}

router.get('/acciones', (req, res) => {
  const acciones = Object.keys(store.ACCIONES).map((k) => ({
    id: k,
    label: store.ACCIONES[k].label,
    efecto: store.ACCIONES[k].efecto
  }));
  res.json({ ok: true, app: 'juanperro', acciones: acciones });
});

router.get('/estado', async (req, res) => {
  try {
    const juan = await store.leerJuan();
    const [top, ultimos, total] = await Promise.all([
      store.ranking(8),
      store.historial(10),
      store.totalCuidados()
    ]);
    res.json({
      ok: true,
      app: 'juanperro',
      juan: store.serializar(juan),
      ranking: top,
      historial: ultimos,
      totalCuidados: total
    });
  } catch (err) {
    console.error('[API] error estado:', err.message);
    res.status(500).json({ ok: false, error: 'No se pudo leer el estado de Juan' });
  }
});

router.post('/cuidar', async (req, res) => {
  const accion = String((req.body && req.body.accion) || '').trim();
  const cuidador = limpiarNombre(req.body && req.body.cuidador) || 'Anonimo';
  try {
    const r = await store.cuidar(accion, cuidador);
    if (!r.ok) return res.status(400).json({ ok: false, error: r.error });
    const [top, ultimos, total] = await Promise.all([
      store.ranking(8),
      store.historial(10),
      store.totalCuidados()
    ]);
    res.json({
      ok: true,
      app: 'juanperro',
      label: r.label,
      juan: r.juan,
      ranking: top,
      historial: ultimos,
      totalCuidados: total
    });
  } catch (err) {
    console.error('[API] error cuidar:', err.message);
    res.status(500).json({ ok: false, error: 'No se pudo cuidar a Juan' });
  }
});

module.exports = router;
