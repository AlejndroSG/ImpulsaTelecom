@echo off
echo ==================================================================
echo ===== INICIANDO APLICACION IMPULSA TELECOM CON RECORDATORIOS =====
echo ==================================================================
echo.

echo 1. Iniciando el servidor de desarrollo...

:: Iniciar el servidor de desarrollo en una nueva ventana
start cmd /c "cd frontend && npm run dev"

echo 2. Asegurando que el servicio de recordatorios este activo...

:: Esperar 5 segundos para dar tiempo a que el servidor de desarrollo inicie
timeout /t 5 /nobreak > nul

:: Ejecutar el script de recordatorios directamente con privilegios elevados
powershell -Command "Start-Process 'backend\scripts\configurar_tarea_programada.bat' -Verb RunAs -WindowStyle Normal"

:: Ejecutar una primera verificación de recordatorios
echo 3. Ejecutando verificacion inicial de recordatorios...
php backend\scripts\enviar_recordatorios.php

echo.
echo ==================================================================
echo Sistema iniciado correctamente. Puedes cerrar esta ventana.
echo Las notificaciones se ejecutaran cada minuto en segundo plano.
echo ==================================================================

pause
