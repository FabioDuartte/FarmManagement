@echo off
chcp 65001 >nul
echo ========================================
echo    FazendaControl - Compartilhar Online
echo ========================================
echo.

:: Verificar se ngrok está instalado
where ngrok >nul 2>&1
if %errorlevel% neq 0 (
    echo ERRO: ngrok não encontrado!
    echo.
    echo Por favor, instale o ngrok:
    echo   1. Acesse https://ngrok.com/download
    echo   2. Baixe e extraia o ngrok.exe
    echo   3. Cole o ngrok.exe nesta pasta
    echo.
    echo Ou use outro serviço como:
    echo   - localtunnel.com
    echo   - serveo.net
    echo.
    pause
    exit /b 1
)

:: Verificar se os servidores estão rodando
netstat -an | findstr ":3000" >nul
if %errorlevel% neq 0 (
    echo AVISO: Servidor web não está rodando!
    echo Execute iniciar.bat primeiro.
    echo.
    pause
    exit /b 1
)

echo Iniciando túnel ngrok...
echo.
start "" "ngrok" "http" "3000" "-host-header=localhost:3000"
timeout /t 5 /nobreak > nul

echo ========================================
echo    Abra o navegador e acesse:
echo    https://localhost:4040
echo ========================================
echo.
echo Copie a URL "Forwarding" para compartilhar.
echo.
pause
