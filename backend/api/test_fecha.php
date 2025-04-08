<?php
require_once __DIR__ . '/../modelos/Evento.php';

// Crear instancia del modelo de Evento
$modeloEvento = new Evento();

// Probar diferentes formatos de fecha
$fechas = [
    '2025-04-10',
    '2025-04-10T14:30',
    '2025-04-10 14:30',
    '10/04/2025',
    '10/04/2025 14:30'
];

// Llamar al método formatearFecha a través de una función de prueba
function formatearFecha($fecha) {
    $fechaObj = DateTime::createFromFormat('Y-m-d\TH:i', $fecha);
    if ($fechaObj) {
        return $fechaObj->format('Y-m-d H:i:s');
    }
    
    $fechaObj = DateTime::createFromFormat('Y-m-d', $fecha);
    if ($fechaObj) {
        return $fechaObj->format('Y-m-d H:i:s');
    }
    
    $timestamp = strtotime($fecha);
    if ($timestamp !== false) {
        return date('Y-m-d H:i:s', $timestamp);
    }
    
    return 'Formato no reconocido';
}

// Mostrar resultados
header('Content-Type: application/json');

$resultados = [];
foreach ($fechas as $fecha) {
    $resultados[$fecha] = formatearFecha($fecha);
}

echo json_encode([
    'success' => true,
    'resultados' => $resultados
]);
