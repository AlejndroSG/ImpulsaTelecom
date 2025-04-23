@echo off
echo ===============================================
echo    Detener Tarea Programada de Recordatorios
echo ===============================================
echo.

REM Verificar si la tarea existe
schtasks /Query /TN "ImpulsaTelecom\EnviarRecordatorios" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo La tarea programada "ImpulsaTelecom\EnviarRecordatorios" existe.
    echo Intentando eliminar la tarea...
    
    schtasks /Delete /TN "ImpulsaTelecom\EnviarRecordatorios" /F
    
    if %ERRORLEVEL% EQU 0 (
        echo Tarea programada eliminada correctamente.
    ) else (
        echo.
        echo ERROR: No se pudo eliminar la tarea programada.
        echo Es posible que necesites ejecutar este script como administrador.
        echo.
        echo Por favor, cierra esta ventana y ejecuta el script haciendo clic derecho
        echo y seleccionando "Ejecutar como administrador".
    )
) else (
    echo No se encontru00f3 la tarea programada "ImpulsaTelecom\EnviarRecordatorios".
    echo La tarea ya fue eliminada o nunca se creu00f3.
)

echo.
echo Presione cualquier tecla para salir...
pause >nul
