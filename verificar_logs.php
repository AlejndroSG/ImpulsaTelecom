<?php
// Script para verificar los logs de recordatorios
$logFile = __DIR__ . '/backend/logs/recordatorios_' . date('Y-m-d') . '.log';

if (file_exists($logFile)) {
    echo "Contenido del archivo de log (últimas 30 líneas):\n";
    $contenido = file_get_contents($logFile);
    $lineas = explode("\n", $contenido);
    
    $total_lineas = count($lineas);
    $inicio = max(0, $total_lineas - 30);
    
    for ($i = $inicio; $i < $total_lineas; $i++) {
        if (!empty($lineas[$i])) {
            echo $lineas[$i] . "\n";
        }
    }
} else {
    echo "Archivo de log no encontrado: $logFile";
}
