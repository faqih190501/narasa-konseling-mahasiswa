@echo off
SET "PATH=%USERPROFILE%\.local\node\node-v22.14.0-win-x64;%PATH%"
cd /d "%~dp0"
echo ====================================================================
echo   Menjalankan Sistem Chatbox Triase ^& Penjadwalan Konseling (Konsel.In)
echo   Buka Browser di: http://localhost:3000
echo ====================================================================
call npm.cmd run dev
pause

