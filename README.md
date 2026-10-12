# JUAN — el perro del ecosistema (FSC)

App del ecosistema Fullscreen: **Juan es un perro y es uno solo**. Todos los que entran
(front del FTP, backend del VPS) cuidan al mismo perro y compiten por el ranking de cuidadores.

- **Producción (link para humanos):** https://fullscreencode.com/juanperro/
- **Backend interno (VPS/nginx):** https://vps-4455523-x.dattaweb.com/juanperro/api
- **Local:** http://localhost:3260/juanperro/
- **Puerto:** 3260 · **BASE_PATH:** `/juanperro` · **PM2:** `juanperro` · **Carpeta FTP:** `/juanperro/`
  (la regla 3 del `.htaccess` raíz sirve la carpeta tal cual: no hace falta tocar el `.htaccess`).
- **Repo:** https://github.com/jpupper/juanperro

## Qué hace

- Juan tiene 4 medidores (hambre, energía, felicidad, limpieza) que **decaen con el tiempo**
  (se calculan al leer, según `actualizado`).
- 5 acciones: alimentar, jugar, pasear, acariciar, bañar. Cada una mueve los medidores y suma XP
  (nivel = 1 + XP/10).
- El estado de ánimo (`animo`) sale de los medidores y maneja la pose del SVG: `feliz`, `hambriento`,
  `cansado`, `triste`, `sucio`, `tranquilo` (cola, lengua, baba, orejas, Zzz, manchas).
- Ranking de cuidadores y últimos 10 cuidados, persistidos en Mongo (`juan_estado`, `juan_cuidados`
  de la base `juanperro`).
- Fondo animado en canvas 2D (huellas) + botón FSC del ecosistema.

## API (`{BASE}/api`)

| Método | Ruta | Devuelve |
| :--- | :--- | :--- |
| GET | `/estado` | `{ ok, juan, ranking[8], historial[10], totalCuidados }` |
| POST | `/cuidar` | body `{ accion, cuidador }` → estado actualizado |
| GET | `/acciones` | catálogo de acciones y sus efectos |
| GET | `/fsc/assets?username=&userId=` | contrato del índice universal (401 sin credenciales) |
| GET | `/health` (raíz, sin BASE) | estado del servicio y de Mongo |

## Estructura

```text
juanperro/
├── .env / .env.example / .gitignore
├── server.js                 # Express + CORS/CSP + estáticos + health
├── models/juanStore.js       # estado de Juan (Mongo con fallback a memoria)
├── routes/juan.js            # API de la app
├── routes/fscAssets.js       # índice FSC fail-closed
├── public/                   # front (se sube al FTP)
│   ├── index.html            # SÓLO estructura (0 inline)
│   ├── styles.css            # base + design system FSC
│   ├── css/index.css         # estilos de la página
│   ├── config.js             # window.CONFIG (API_URL, PUBLIC_BASE, ...)
│   └── js/  ui.js · api.js · juan.js (poses) · fondo.js (canvas) · paginas/index.js
├── deploy_scripts/           # run_deploy.bat · server_update.sh · upload_ftp.js
├── nginx_juanperro.conf      # bloque location /juanperro
├── ecosystem.config.js       # PM2
├── install.bat · run.bat     # run.bat libera SÓLO el puerto 3260
└── tests/smoke.js
```

## Deploy

```bat
deploy_scripts\run_deploy.bat
```

1. commit + `git push` al repo,
2. SSH al VPS: `git fetch/reset` en `/root/juanperro` y `bash deploy_scripts/server_update.sh`
   (npm install → **agrega el `location /juanperro` a nginx si falta** → PM2 → health),
3. `node deploy_scripts/upload_ftp.js` (sube `public/` a `/public_html/juanperro/`, nunca `.htaccess`).

Única cosa que NO puede hacer el script: el `.env` del VPS (secretos). Bootstrap una sola vez:

```bash
sed 's/^NODE_ENV=local/NODE_ENV=production/' .env | base64 -w0 \
  | ssh -p 5752 root@149.50.139.152 "mkdir -p /root/juanperro && base64 -d > /root/juanperro/.env"
```

## Verificación hecha (12-Oct-2026)

- `https://fullscreencode.com/juanperro/` → 200 y `md5` idéntico al local.
- `https://vps-4455523-x.dattaweb.com/juanperro/` → 200 y `md5` idéntico (funciona desde los dos lados).
- POST `/cuidar` desde el origen del FTP con CORS OK (`Access-Control-Allow-Origin: https://fullscreencode.com`).
- Click real en el navegador: medidores, ranking, historial y pose de Juan actualizados; 0 errores de JS.
- Auditoría §0.2 del HTML: `<style` 0 · `<script>` sin `src` 0 · `on*=` 0 · `style="` 0.

## Pendiente / opcional

- Registrar la app en `lib/fsc-apps.js` de `fscauth` (índice del pasaporte universal) — requiere
  deploy de `fscauth`, así que queda a decisión del humano.
- Auth: hoy es anónima a propósito (cuidar a Juan no requiere cuenta). Si se quiere firmar el ranking
  con la identidad del ecosistema, va por `fscauth` (§0.6, nunca un login local).
