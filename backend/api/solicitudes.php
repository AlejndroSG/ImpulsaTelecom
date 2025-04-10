<?php
// Obtener el origen de la solicitud
$origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';

// Lista de orígenes permitidos
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
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');

// Incluir el modelo de Solicitud
include_once '../modelos/Solicitud.php';

// Verificar si la solicitud es OPTIONS (preflight CORS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Verificar si se recibió una acción
if (!isset($_GET['action'])) {
    echo json_encode(['success' => false, 'message' => 'No se especificó una acción']);
    exit();
}

// Obtener datos de la solicitud
$data = json_decode(file_get_contents('php://input'), true);

// Crear instancia del modelo
$solicitudModel = new Solicitud();

// Procesar la acción solicitada
$action = $_GET['action'];

switch ($action) {
    case 'crear':
        // Validar datos necesarios
        if (!isset($data['NIF']) || !isset($data['tipo']) || !isset($data['fecha_inicio'])) {
            echo json_encode(['success' => false, 'message' => 'Faltan datos obligatorios']);
            exit();
        }
        
        // Crear la solicitud
        $resultado = $solicitudModel->crearSolicitud($data);
        echo json_encode($resultado);
        break;
        
    case 'usuario':
        // Validar datos necesarios
        if (!isset($data['NIF'])) {
            echo json_encode(['success' => false, 'message' => 'Falta el NIF del usuario']);
            exit();
        }
        
        // Obtener solicitudes del usuario
        $resultado = $solicitudModel->getSolicitudesUsuario($data['NIF']);
        echo json_encode($resultado);
        break;
        
    case 'todas':
        // Obtener todas las solicitudes (para administradores)
        $resultado = $solicitudModel->getAllSolicitudes();
        echo json_encode($resultado);
        break;
        
    case 'responder':
        // Validar datos necesarios
        if (!isset($data['id_solicitud']) || !isset($data['estado'])) {
            echo json_encode(['success' => false, 'message' => 'Faltan datos obligatorios']);
            exit();
        }
        
        // Responder a la solicitud
        $comentario = isset($data['comentario']) ? $data['comentario'] : '';
        $resultado = $solicitudModel->responderSolicitud($data['id_solicitud'], $data['estado'], $comentario);
        echo json_encode($resultado);
        break;
        
    case 'notificaciones':
        // Validar datos necesarios
        if (!isset($data['NIF'])) {
            echo json_encode(['success' => false, 'message' => 'Falta el NIF del usuario']);
            exit();
        }
        
        // Obtener notificaciones del usuario
        $resultado = $solicitudModel->getNotificacionesUsuario($data['NIF']);
        echo json_encode($resultado);
        break;
        
    case 'marcar_leida':
        // Validar datos necesarios
        if (!isset($data['id_notificacion'])) {
            echo json_encode(['success' => false, 'message' => 'Falta el ID de la notificación']);
            exit();
        }
        
        // Marcar notificación como leída
        $resultado = $solicitudModel->marcarNotificacionLeida($data['id_notificacion']);
        echo json_encode($resultado);
        break;
        
    case 'contar_no_leidas':
        // Validar datos necesarios
        if (!isset($data['NIF'])) {
            echo json_encode(['success' => false, 'message' => 'Falta el NIF del usuario']);
            exit();
        }
        
        // Contar notificaciones no leídas
        $resultado = $solicitudModel->contarNotificacionesNoLeidas($data['NIF']);
        echo json_encode($resultado);
        break;
        
    default:
        echo json_encode(['success' => false, 'message' => 'Acción no reconocida']);
        break;
}