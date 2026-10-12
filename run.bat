@echo off
setlocal
title JUAN PERRO - Puerto 3260
set "PORT=3260"

echo ============================================
echo   JUAN - el perro del ecosistema (FSC)
echo ============================================
echo.

echo [1/3] Verificando Node.js...
node -v >nul 2>&1 || (echo [ERROR] Node.js no instalado. & pause & exit /b 1)

if not exist node_modules (
    echo [2/3] Falta node_modules: corriendo npm install...
    call npm install || (echo [ERROR] Fallo npm install. & pause & exit /b 1)
) else (
    echo [2/3] Dependencias OK.
)

if not exist .env (
    echo [AVISO] No hay .env: copiando .env.example...
    copy .env.example .env >nul
)

echo [3/3] Liberando SOLO el puerto %PORT%...
powershell -NoProfile -Command "$pids = Get-NetTCPConnection -LocalPort %PORT% -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique; foreach ($p in $pids) { Stop-Process -Id $p -Force -ErrorAction SilentlyContinue }"
ping -n 3 127.0.0.1 >nul

echo.
echo Servidor en marcha -> http://localhost:%PORT%/juanperro/
echo.
npm run dev
pause
