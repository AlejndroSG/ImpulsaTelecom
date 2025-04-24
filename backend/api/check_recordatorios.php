<?php
// API ligera para verificar y enviar recordatorios desde el frontend

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
    
    // Crear directorio si no existe
    if (!file_exists($logDir)) {
        mkdir($logDir, 0777, true);
    }
    
    // Escribir mensaje de log con timestamp
    $timestamp = date('Y-m-d H:i:s');
    file_put_contents(
        $logFile, 
        "[$timestamp] $mensaje\n", 
        FILE_APPEND
    );
}

// Verificar y enviar recordatorios llamando al script principal
try {
    // Registrar inicio de la verificación
    escribirLog("Verificación de recordatorios solicitada desde el frontend");
    
    // Incluir el script de recordatorios completo
    include_once __DIR__ . '/../scripts/enviar_recordatorios.php';
    
    // Registrar finalización
    escribirLog("Verificación completada desde el frontend");
    
    // Responder con éxito
    echo json_encode([
        'success' => true,
        'message' => 'Verificación de recordatorios completada'
    ]);
    
} catch (Exception $e) {
    // Registrar error
    escribirLog("Error en la verificación: " . $e->getMessage());
    
    // Responder con error
    echo json_encode([
        'success' => false,
        'error' => 'Error al verificar recordatorios: ' . $e->getMessage()
    ]);
}
