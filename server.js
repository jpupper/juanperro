// ============================================================
// juanperro - server.js (estandar FSC)
// Backend: VPS (PM2 + nginx /juanperro -> localhost:3260)
// Frontend: FTP /public_html/juanperro/  (comparte la carpeta public)
// ============================================================
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const store = require('./models/juanStore');

const app = express();
const PORT = process.env.PORT || 3260;
const NODE_ENV = process.env.NODE_ENV || 'local';
const BASE_PATH = process.env.BASE_PATH || '/juanperro';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/juanperro';

// ------------------------------------------------------------
// CORS (se habilita DESDE EL SERVIDOR, lista blanca del ecosistema)
// ------------------------------------------------------------
const ORIGENES = [
  'https://fullscreencode.com',
  'https://www.fullscreencode.com',
  'https://artedigitaldata.com',
  'https://www.artedigitaldata.com',
  'https://vps-4455523-x.dattaweb.com',
  'http://localhost:' + PORT,
  'http://127.0.0.1:' + PORT
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true); // server->server / curl
    if (ORIGENES.indexOf(origin) !== -1) return callback(null, true);
    if (NODE_ENV === 'local') return callback(null, true); // pruebas locales
    return callback(null, false);
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  credentials: true
}));

// ------------------------------------------------------------
// CSP
// ------------------------------------------------------------
app.use((req, res, next) => {
  res.setHeader('Content-Security-Policy', [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vps-4455523-x.dattaweb.com https://fullscreencode.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' data: https://fonts.gstatic.com",
    "img-src 'self' data: blob: https://pub-*.r2.dev https://res.cloudinary.com",
    "connect-src 'self' https://fullscreencode.com https://vps-4455523-x.dattaweb.com https://*.r2.cloudflarestorage.com",
    "media-src 'self' https://pub-*.r2.dev",
    "worker-src 'self' blob:",
    "frame-ancestors 'self' https://fullscreencode.com"
  ].join('; '));
  next();
});

app.use(express.json({ limit: '1mb' }));

// ------------------------------------------------------------
// Estaticos del front (en el VPS via nginx; en el FTP los sirve Apache)
// ------------------------------------------------------------
const PUBLICO = path.join(__dirname, 'public');
app.use(BASE_PATH, express.static(PUBLICO, { extensions: ['html'] }));

// ------------------------------------------------------------
// API
// ------------------------------------------------------------
app.use(BASE_PATH + '/api/fsc', require('./routes/fscAssets'));
app.use(BASE_PATH + '/api', require('./routes/juan'));

// ------------------------------------------------------------
// Health check
// ------------------------------------------------------------
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'juanperro',
    version: '1.0.0',
    environment: NODE_ENV,
    mongo: store.estadoConexion().conectado ? 'conectado' : 'memoria'
  });
});

// ------------------------------------------------------------
// Raiz y fallback de la app
// ------------------------------------------------------------
app.get('/', (req, res) => res.redirect(BASE_PATH + '/'));
app.get(BASE_PATH + '/*', (req, res) => {
  res.sendFile(path.join(PUBLICO, 'index.html'));
});

// ------------------------------------------------------------
// Arranque resiliente: si Mongo no responde, la app igual levanta
// (los datos de Juan viven en memoria hasta que la DB vuelva).
// ------------------------------------------------------------
function startServer() {
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log('JUAN PERRO listo -> http://localhost:' + PORT + BASE_PATH + '/ [' + NODE_ENV + ']');
  });
  process.on('SIGTERM', () => { server.close(); process.exit(0); });
  process.on('SIGINT', () => { server.close(); process.exit(0); });
}

store.iniciar(MONGODB_URI, NODE_ENV).then(startServer).catch((err) => {
  console.error('Aviso DB:', err.message);
  startServer();
});
