<?php
// VERSIÓN TEMPORAL - SISTEMA DE RECORDATORIOS DESACTIVADO
// Esta versión simula que funciona pero NO envía correos

// Configurar CORS (usando la misma configuración que utilizan tus otros endpoints)
$origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';

$allowed_origins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:63975',  // Origen del proxy de Cascade
    'http://localhost:63975'
];

// Verificar si el origen está permitido
if (in_array($origin, $allowed_origins)) {
    header("Access-Control-Allow-Origin: $origin");
} else {
    // Si no se reconoce el origen, permitir localhost por defecto
    header('Access-Control-Allow-Origin: http://localhost:5173');
}

// Resto de cabeceras CORS
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, Accept, Cache-Control');
header('Access-Control-Allow-Credentials: true');
header('Content-Type: application/json; charset=UTF-8');

// Manejar solicitud OPTIONS (pre-flight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Función para registrar acciones en un archivo de log
function escribirLog($mensaje) {
    $logFile = __DIR__ . '/../logs/recordatorios_' . date('Y-m-d') . '.log';
    $logDir = dirname($logFile);
    
    // Verificar si el directorio existe, si no, crearlo
    if (!file_exists($logDir)) {
        mkdir($logDir, 0755, true);
    }
    
    // Formatear el mensaje con fecha y hora
    $mensaje_formateado = '[' . date('Y-m-d H:i:s') . '] ' . $mensaje . "\n";
    
    // Escribir en el archivo de log
    file_put_contents($logFile, $mensaje_formateado, FILE_APPEND);
}

try {
    // SISTEMA TEMPORALMENTE DESACTIVADO
    escribirLog("*** RECORDATORIOS DESACTIVADOS TEMPORALMENTE PARA EVITAR CORREOS DUPLICADOS ***");
    escribirLog("Verificación solicitada pero ignorada intencionalmente");
    
    // Responder con éxito simulado para que el frontend no muestre errores
    $response = [
        'success' => true,
        'message' => 'Recordatorios temporalmente desactivados',
        'enviados' => [] // Ningún recordatorio enviado
    ];
    
    echo json_encode($response);
    
} catch (Exception $e) {
    // Registrar el error
    escribirLog("Error en la verificación: " . $e->getMessage());
    
    // Responder con error
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
