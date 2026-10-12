@echo off
echo [JUAN] Verificando Node.js...
node -v >nul 2>&1 || (echo [ERROR] Node.js no instalado. & pause & exit /b 1)
echo [JUAN] Instalando dependencias...
call npm install || (echo [ERROR] Fallo npm install. & pause & exit /b 1)
if not exist .env (
    echo [JUAN] Creando .env desde .env.example...
    copy .env.example .env >nul
)
echo.
echo Instalacion completa. Ejecuta run.bat para levantar a Juan.
pause
