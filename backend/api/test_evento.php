<?php
// Archivo de prueba para depurar la creación de eventos
$origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';
$allowed_origins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:63975',
    'http://localhost:63975',
    'https://asp-natural-annually.ngrok-free.app'  // Dominio ngrok actual
];

if (in_array($origin, $allowed_origins)) {
    header("Access-Control-Allow-Origin: $origin");
} else {
    header("Access-Control-Allow-Origin: http://localhost:5173");
}
header('Content-Type: application/json');
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Registrar todos los datos recibidos
$input = file_get_contents('php://input');
error_log("Datos JSON recibidos en test_evento.php: " . $input);

// Simular la recepción de un evento
$datos = json_decode($input, true) ?: [];

// Agregar datos adicionales para pruebas si no hay JSON
if (empty($datos)) {
    $datos = [
        'titulo' => 'Evento de prueba',
        'descripcion' => 'Descripción de prueba',
        'fecha_inicio' => date('Y-m-d H:i:s'),
        'fecha_fin' => date('Y-m-d H:i:s', strtotime('+1 hour')),
        'tipo' => 'evento',
        'color' => '#3788d8',
        'dia_completo' => 0,
        'NIF' => '98765432B',
        'NIF_usuario' => '98765432B'
    ];
}

// Incluir los archivos necesarios
require_once __DIR__ . '/../modelos/Evento.php';

// Crear instancia del modelo
$modeloEvento = new Evento();

// Intentar guardar el evento
$resultado = $modeloEvento->guardarEvento($datos);

// Devolver resultado detallado
echo json_encode([
    'success' => isset($resultado['success']) ? $resultado['success'] : false,
    'message' => isset($resultado['message']) ? $resultado['message'] : 'Error desconocido',
    'datos_recibidos' => $datos,
    'resultado_completo' => $resultado,
    'fecha_inicio_formateada' => $modeloEvento->validarFormatoFecha($datos['fecha_inicio'] ?? $datos['inicio'] ?? null),
    'fecha_fin_formateada' => $modeloEvento->validarFormatoFecha($datos['fecha_fin'] ?? $datos['fin'] ?? null)
]);
