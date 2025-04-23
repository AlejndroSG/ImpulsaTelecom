@echo off
echo ===============================================
echo    Configuracion de Tarea Programada para
echo       Recordatorios de Fichajes
echo ===============================================
echo.

REM Obtener ruta completa del script PHP
set SCRIPT_PATH=%~dp0enviar_recordatorios.php
set LOG_PATH=%~dp0..\logs\cron_output.log

REM Obtener ruta de PHP
for /f "tokens=*" %%a in ('where php 2^>nul') do set PHP_PATH=%%a
if "%PHP_PATH%"=="" (
    echo ERROR: No se encontro PHP en la variable PATH.
    echo Por favor, especifique la ruta completa a php.exe:
    echo Ejemplo: C:\xampp\php\php.exe
    set /p PHP_PATH="Ruta a PHP: "
    if not exist "%PHP_PATH%" (
        echo El archivo especificado no existe.
        exit /b 1
    )
)

echo Ruta de PHP: %PHP_PATH%
echo Ruta del script: %SCRIPT_PATH%
echo Ruta del log: %LOG_PATH%
echo.

REM Crear directorio de logs si no existe
if not exist "%~dp0..\logs" mkdir "%~dp0..\logs"

echo Creando tarea programada...
echo.

REM Eliminar la tarea si ya existe
schtasks /Query /TN "ImpulsaTelecom\EnviarRecordatorios" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo Eliminando tarea existente...
    schtasks /Delete /TN "ImpulsaTelecom\EnviarRecordatorios" /F >nul
)

REM Crear nueva tarea programada para ejecutar cada minuto
echo Creando tarea programada para ejecutar cada minuto...
schtasks /Create /SC MINUTE /MO 1 /TN "ImpulsaTelecom\EnviarRecordatorios" /TR "\"%PHP_PATH%\" \"%SCRIPT_PATH%\" >> \"%LOG_PATH%\" 2>&1" /F

if %ERRORLEVEL% EQU 0 (
    echo.
    echo Tarea programada creada correctamente.
    echo La tarea se ejecutara cada minuto.
    echo Los logs se guardaran en: %LOG_PATH%
    echo.
    echo Para verificar que todo funciona correctamente:
    echo 1. Espere un minuto
    echo 2. Revise el archivo de log: %LOG_PATH%
    echo 3. Revise los emails enviados
) else (
    echo Error al crear la tarea programada. Cod: %ERRORLEVEL%
    echo.
    echo Posibles soluciones:
    echo - Ejecute este script como administrador
    echo - Configure manualmente la tarea desde el Programador de tareas de Windows
)

echo.
echo NOTA: Este script solo configura los recordatorios de entrada y salida.
echo Los recordatorios de pausa estan desactivados como solicito.
echo.
echo Presione cualquier tecla para salir...
pause >nul
