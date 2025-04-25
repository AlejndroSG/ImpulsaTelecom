<?php
// Script para ser ejecutado por cronjob o tarea programada
// Independiente del frontend

// Registro de actividad
function registrarLog($mensaje) {
    $logFile = __DIR__ . '/backend/logs/recordatorios_' . date('Y-m-d') . '.log';
    $timestamp = date('Y-m-d H:i:s');
    file_put_contents(
        $logFile, 
        "[$timestamp] $mensaje\n", 
        FILE_APPEND
    );
}

// Inicio de la ejecuciu00f3n
registrarLog("Ejecuciu00f3n programada del script de recordatorios iniciada");

// Ruta al script de recordatorios
$script_path = realpath(__DIR__ . '/backend/scripts/enviar_recordatorios.php');

// Verificar que el script existe
if (!file_exists($script_path)) {
    registrarLog("ERROR: El script de recordatorios no existe en la ruta: $script_path");
    exit(1);
}

// Ruta al PHP ejecutable (usando el mismo PHP que estu00e1 ejecutando este script)
$php_executable = PHP_BINARY; // Obtiene la ruta completa al ejecutable de PHP

// Construir comando
$command = escapeshellarg($php_executable) . ' ' . escapeshellarg($script_path);

// Ejecutar el script en un proceso separado
registrarLog("Ejecutando comando: $command");
$output = [];
$return_var = 0;
exec($command, $output, $return_var);

// Verificar el resultado
if ($return_var !== 0) {
    registrarLog("Error al ejecutar el script. Cu00f3digo de retorno: $return_var");
    registrarLog("Salida: " . implode("\n", $output));
    exit(1);
} else {
    registrarLog("Script de recordatorios ejecutado correctamente");
    if (!empty($output)) {
        registrarLog("Salida del script: " . implode("\n", $output));
    }
}
