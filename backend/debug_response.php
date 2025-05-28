<?php
// Archivo temporal para depurar respuestas del API

// Configurar encabezados CORS
header('Content-Type: application/json');

// IMPORTANTE: Configurar correctamente CORS para permitir peticiones desde el frontend
header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

// Responder a preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Conexión a la base de datos
require_once 'modelos/bd.php';
$connection = new db();
$db = $connection->getConn();

// Obtener documentos directamente para un NIF específico
$nif = '56789012C'; // NIF de María

// Obtener documentos
$query = "SELECT * FROM documentos WHERE nif_usuario = ?";
$stmt = $db->prepare($query);
$stmt->bind_param("s", $nif);
$stmt->execute();
$result = $stmt->get_result();

$documentos = [];
while ($row = $result->fetch_assoc()) {
    $documentos[] = $row;
}

// Crear la respuesta que el frontend espera
$response = [
    'documentos' => $documentos,
    'success' => true
];

// Agregar información de depuración
$response['debug'] = [
    'nif' => $nif,
    'total_documentos' => count($documentos),
    'timestamp' => date('Y-m-d H:i:s')
];

// Mostrar la respuesta
echo json_encode($response, JSON_PRETTY_PRINT);
?>
