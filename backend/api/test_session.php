<?php
// Configuración de la sesión y cabeceras
ini_set('session.cookie_lifetime', '86400');    // 24 horas
ini_set('session.gc_maxlifetime', '86400');     // 24 horas
ini_set('session.use_strict_mode', '1');        // Modo estricto para seguridad

// Configuración de cabeceras para CORS
$allowedOrigins = ['http://localhost:5173', 'http://localhost:3000'];
$origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';

if (in_array($origin, $allowedOrigins)) {
    header("Access-Control-Allow-Origin: $origin");
    header("Access-Control-Allow-Credentials: true");
    header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With, cache-control");
    header("Content-Type: application/json; charset=UTF-8");
}

// Manejar pre-flight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Iniciar sesión si no está iniciada
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Verificar si hay una sesión activa
if (isset($_SESSION['NIF']) && !empty($_SESSION['NIF'])) {
    echo json_encode([
        'success' => true,
        'message' => 'Sesión activa',
        'session_data' => [
            'NIF' => $_SESSION['NIF'],
            'tipo_usuario' => $_SESSION['tipo_usuario'] ?? 'desconocido',
            'nombre' => $_SESSION['nombre'] ?? 'Usuario'
        ]
    ]);
} else {
    echo json_encode([
        'success' => false,
        'message' => 'No hay sesión activa',
        'session_id' => session_id(),
        'session_status' => session_status(),
        'php_session_path' => session_save_path(),
        'cookies' => $_COOKIE
    ]);
}
