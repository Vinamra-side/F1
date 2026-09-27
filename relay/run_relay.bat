@echo off
title F1 2020 Race Engineer - Telemetry Bridge
echo ======================================================================
echo    🏎️  F1 2020 RACE ENGINEER - TELEMETRY RELAY BRIDGE
echo ======================================================================
echo.
echo Make sure in F1 2020 Settings:
echo   1. Go to Options -^> Game Options -^> Telemetry Settings
echo   2. UDP Telemetry: ON
echo   3. UDP Broadcast: ON (or set UDP IP to 127.0.0.1)
echo   4. UDP Port: 20777
echo   5. UDP Send Rate: 20Hz or 60Hz
echo   6. UDP Format: 2020
echo.
echo Starting bridge...
echo.

set /p DRIVER="Enter your Driver Name (leave blank for auto-detect): "
set /p CLOUD_URL="Enter your Vercel URL (e.g. https://f1-engineer.vercel.app or leave blank for LAN only): "

if "%DRIVER%"=="" (
    if "%CLOUD_URL%"=="" (
        python f1_relay.py
    ) else (
        python f1_relay.py --cloud-url %CLOUD_URL%
    )
) else (
    if "%CLOUD_URL%"=="" (
        python f1_relay.py --driver-name "%DRIVER%"
    ) else (
        python f1_relay.py --driver-name "%DRIVER%" --cloud-url %CLOUD_URL%
    )
)

pause
