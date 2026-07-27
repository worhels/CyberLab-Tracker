@echo off
setlocal
cd /d "%~dp0"
title CyberLab Tracker
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\dev.ps1" -OpenBrowser
if errorlevel 1 (
    if exist "%~dp0.dev\clean-stop" exit /b 0
    echo.
    echo CyberLab could not start. Check .dev\logs for details.
    pause
)
endlocal
