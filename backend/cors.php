<?php
// Configuración de cabeceras CORS
$origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';
$allowed_origins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:63975',  // Origen del proxy de Cascade
    'http://localhost:63975',
    'https://asp-natural-annually.ngrok-free.app',  // Dominio de ngrok actual
    'http://localhost:3000', // Por si el frontend cambia a puerto 3000
    'http://127.0.0.1:3000'
];

if (in_array($origin, $allowed_origins)) {
    header("Access-Control-Allow-Origin: $origin");
} else {
    // Si no se reconoce el origen, permitir localhost por defecto
    header('Access-Control-Allow-Origin: http://localhost:5173');
}

header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Cache-Control, Accept');
header('Access-Control-Max-Age: 86400'); // Cachear las cabeceras preflight por 24 horas

// Manejar solicitudes preflight OPTIONS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    // Devolver una respuesta vacía para solicitudes preflight
    header('HTTP/1.1 204 No Content');
    exit();
}
?>
