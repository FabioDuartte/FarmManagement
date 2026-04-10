@echo off
chcp 65001 >nul
echo ========================================
echo    FazendaControl - Sistema de Gestão Rural
echo ========================================
echo.

:: Obter IP da rede local
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /i "ipv4" ^| findstr /v "127"') do (
    set "IP_LOCAL=%%a"
)
set "IP_LOCAL=%IP_LOCAL: =%"

:: Iniciar servidor backend
echo [1/2] Iniciando API (servidor de dados)...
cd /d "%~dp0server"
start "FazendaControl-API" cmd /k "title FazendaControl-API && npm start"

:: Aguardar
timeout /t 3 /nobreak > nul

:: Iniciar frontend
echo [2/2] Iniciando Interface Web...
cd /d "%~dp0client"
start "FazendaControl-Web" cmd /k "title FazendaControl-Web && npm run dev"

:: Mostrar informações
cls
echo ========================================
echo    FazendaControl - Sistema Iniciado!
echo ========================================
echo.
echo Acesse pelo COMPUTADOR:
echo   http://localhost:3000
echo.
if defined IP_LOCAL (
    echo Acesse por OUTROS DISPOSITIVOS na rede:
    echo   http://%IP_LOCAL%:3000
    echo.
)
echo Para TESTAR FORA DA REDE, use ngrok:
echo   1. Instale o ngrok em: ngrok.com
echo   2. Execute: ngrok http 3000
echo   3. Compartilhe a URL gerada
echo.
echo Pressione qualquer tecla para sair...
pause >nul
