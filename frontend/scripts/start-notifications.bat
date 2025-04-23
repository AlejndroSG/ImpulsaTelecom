@echo off
echo Iniciando servicio de notificaciones por email...

:: Ruta al script de configuraciu00f3n de la tarea programada
set SCRIPT_PATH=%~dp0..\..\backend\scripts\configurar_tarea_programada.bat

:: Verificar si el script existe
if not exist "%SCRIPT_PATH%" (
    echo Error: No se encontru00f3 el script de configuraciu00f3n de notificaciones
    echo Ruta esperada: %SCRIPT_PATH%
    exit /b 1
)

:: Ejecutar el script como administrador
powershell -Command "Start-Process '%SCRIPT_PATH%' -Verb RunAs -WindowStyle Hidden"

echo Servicio de notificaciones por email iniciado correctamente
echo Los usuarios recibiru00e1n recordatorios segu00fan sus horarios configurados
