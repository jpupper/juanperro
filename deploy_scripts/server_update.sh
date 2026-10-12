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
#    El server block de vps-4455523-x vive en el archivo de sites-enabled que
#    declara ese server_name (no esta en sites-available con ese nombre).
CONF=$(grep -rl "server_name vps-4455523-x.dattaweb.com" /etc/nginx/sites-enabled/ 2>/dev/null | head -1)
BLOCK="/root/juanperro/nginx_juanperro.conf"
if [ -z "$CONF" ]; then
    echo "AVISO nginx: no encontre el archivo con server_name vps-4455523-x.dattaweb.com."
elif grep -q "location $BASE" "$CONF"; then
    echo "nginx: location $BASE ya presente en $CONF."
else
    echo "Agregando location $BASE a $CONF..."
    mkdir -p /root/nginx-backups
    cp "$CONF" "/root/nginx-backups/$(basename $CONF).$(date +%Y%m%d%H%M%S).bak"
    # el bloque entra justo despues del server_name del server block del VPS
    awk -v bloque="$BLOCK" -v srv="server_name vps-4455523-x.dattaweb.com;" '
        { print }
        index($0, srv) && !hecho {
            while ((getline linea < bloque) > 0) print linea
            close(bloque)
            hecho = 1
        }
    ' "$CONF" > "$CONF.nuevo" && mv "$CONF.nuevo" "$CONF"
    if nginx -t; then nginx -s reload; else echo "ERROR nginx: revirtiendo"; cp "$CONF".*bak "$CONF" 2>/dev/null; exit 1; fi
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
