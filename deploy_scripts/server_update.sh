#!/bin/bash
# ============================================================
# juanperro - actualizacion del backend en el VPS (corre DENTRO del VPS)
#   cd /root/juanperro && bash deploy_scripts/server_update.sh
# Hace: git pull -> npm install -> nginx (location si falta) -> PM2 -> health
# ============================================================
set -e

cd /root/juanperro

# 1. LIMPIEZA DE CRLF (los .sh y .env vienen de Windows)
sed -i 's/\r$//' .env 2>/dev/null || true
sed -i 's/\r$//' deploy_scripts/server_update.sh 2>/dev/null || true

# 2. CARGAR VARIABLES DESDE .ENV
if [ -f .env ]; then
    export $(grep -v '^#' .env | grep -E '^[A-Z_]+=' | xargs -d '\n')
else
    echo "ERROR CRITICO: No se encontro el archivo .env en el VPS."
    exit 1
fi

APP_NAME="juanperro"
PORT_APP="${PORT:-3260}"
BASE="${BASE_PATH:-/juanperro}"
REPO="${GITHUB_REPO:-jpupper/juanperro}"
DEMO=$(echo "$REPO" | cut -d/ -f1)
TOKEN=$(echo "${GITHUB_TOKEN:-}" | tr -d '\r')
REPO_URL="https://$TOKEN@github.com/$REPO.git"

echo "------------------------------------------------"
echo "DEPLOY: $APP_NAME (repo $REPO, puerto $PORT_APP, base $BASE)"
echo "------------------------------------------------"

# 3. GIT (clona la primera vez, despues actualiza)
if [ ! -d ".git" ]; then
    echo "Clonando repositorio por primera vez..."
    git init -q
    git remote add origin "$REPO_URL"
    git fetch -q origin main
    git checkout -f main
else
    echo "Actualizando repositorio..."
    git remote set-url origin "$REPO_URL"
    git fetch -q origin main
    git reset --hard origin/main
fi

# 4. DEPENDENCIAS
echo "Instalando dependencias de Node..."
npm install --no-fund --no-audit

# 5. NGINX: agrega el location si todavia no existe
CONF="/etc/nginx/sites-available/vps-4455523-x"
BLOCK="/root/juanperro/nginx_juanperro.conf"
if [ -f "$CONF" ] && ! grep -q "location $BASE" "$CONF"; then
    echo "Agregando location $BASE a nginx..."
    cp "$CONF" "/root/nginx-backups/vps-4455523-x.$(date +%Y%m%d%H%M%S).bak" 2>/dev/null || true
    # el bloque se inserta antes del primer 'listen 443'
    awk -v bloque="$BLOCK" '
        /listen 443/ && !hecho {
            while ((getline linea < bloque) > 0) print linea
            close(bloque)
            hecho = 1
        }
        { print }
    ' "$CONF" > "$CONF.nuevo" && mv "$CONF.nuevo" "$CONF"
    nginx -t && nginx -s reload
else
    echo "nginx: location $BASE ya presente (o conf ausente)."
fi

# 6. PM2
echo "Reiniciando instancia de PM2 ($APP_NAME)..."
pm2 delete "$APP_NAME" 2>/dev/null || true
pm2 start server.js --name "$APP_NAME" --update-env
pm2 save

# 7. VERIFICACION
echo "Verificando..."
sleep 2
curl -s -o /dev/null -w "local $BASE/ -> %{http_code}\n" "http://127.0.0.1:$PORT_APP$BASE/"
curl -s "http://127.0.0.1:$PORT_APP/health" || true
echo
echo "------------------------------------------------"
echo "DEPLOY FINALIZADO"
echo "------------------------------------------------"
pm2 list | grep -E "name|$APP_NAME" || pm2 list
