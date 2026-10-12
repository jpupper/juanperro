@echo off
setlocal enabledelayedexpansion

:: Cargar variables desde .env
set "ENV_FILE=%~dp0..\.env"
if exist "%ENV_FILE%" (
    for /f "tokens=*" %%a in ('powershell -Command "Get-Content '%ENV_FILE%' | Where-Object { $_ -match '=' -and -not $_.StartsWith('#') } | ForEach-Object { $_.Trim() }"') do (
        set "%%a"
    )
)

echo ===================================================
echo  Deploy COMPLETO - JUAN PERRO (FSC)
echo  Backend -^> VPS   Front -^> FTP (Ferozo)
echo ===================================================

echo.
echo [1/3] Subiendo el codigo local al repo de GitHub...
pushd "%~dp0.."
git add -A
git commit -m "deploy: %date% %time%" >nul 2>&1
git push origin main || echo [AVISO] Nada nuevo para pushear o fallo el push.
popd

echo.
echo [2/3] Desplegando el backend en el VPS (!VPS_HOST!) por SSH...
set "REPO_URL=https://!GITHUB_TOKEN!@github.com/!GITHUB_REPO!.git"

:: El primer deploy clona el repo en el VPS; los siguientes solo hacen fetch.
ssh -p !VPS_PORT! !VPS_USER!@!VPS_HOST! "mkdir -p juanperro && cd juanperro && (git remote set-url origin '!REPO_URL!' 2>/dev/null || (git init -q && git remote add origin '!REPO_URL!')) && git fetch -q origin main && git reset --hard origin/main && bash deploy_scripts/server_update.sh"


echo.
echo [3/3] Subiendo el front al FTP (!FTP_HOST!)...
node "%~dp0upload_ftp.js"
if %ERRORLEVEL% neq 0 (
    echo Error al subir archivos por FTP. Revisa la consola.
    pause
    exit /b
)

echo.
echo ===================================================
echo Deploy terminado. VPS y FTP actualizados.
echo Link publico: https://fullscreencode.com/juanperro/
echo ===================================================
pause
