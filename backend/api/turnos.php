<?php
// Configurar cookies antes de cualquier salida
ini_set('session.cookie_lifetime', '86400');    // 24 horas
ini_set('session.gc_maxlifetime', '86400');     // 24 horas
ini_set('session.use_strict_mode', '1');        // Modo estricto para seguridad
ini_set('session.cookie_httponly', '1');        // Prevenir acceso JS a la cookie
ini_set('session.use_only_cookies', '1');       // Solo usar cookies para sesiones
ini_set('session.cookie_samesite', 'Lax');      // Configuración más compatible

// Iniciar sesión
session_start();

// Obtener el origen de la solicitud
$origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';

// Lista de orígenes permitidos
$allowed_origins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:63975',  // Origen del proxy de Cascade
    'http://localhost:63975',
    'https://asp-natural-annually.ngrok-free.app'  // Dominio de ngrok actual
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

// Incluir el modelo de Turno
require_once "../modelos/Turno.php";
$modelo = new Turno();

// Verificar si el usuario está autenticado
function verificarAutenticacion() {
    if (!isset($_SESSION['NIF']) || empty($_SESSION['NIF'])) {
        echo json_encode([
            'success' => false,
            'error' => 'No autenticado',
            'code' => 401
        ]);
        exit();
    }
    
    // Construir y devolver un array con la información del usuario desde las variables de sesión individuales
    return [
        'NIF' => $_SESSION['NIF'],
        'tipo_Usu' => $_SESSION['tipo_usuario'] ?? 'empleado',
        'nombre' => $_SESSION['nombre'] ?? '',
        'apellidos' => $_SESSION['apellidos'] ?? ''
    ];
}

// Verificar si el usuario es administrador
function verificarAdmin() {
    $usuario = verificarAutenticacion();
    if ($usuario['tipo_Usu'] !== 'admin') {
        echo json_encode([
            'success' => false,
            'error' => 'Acceso denegado. Se requieren permisos de administrador',
            'code' => 403
        ]);
        exit();
    }
    return $usuario;
}

// Obtener todos los turnos de un usuario
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['usuario'])) {
    $usuario = verificarAutenticacion();
    $nif = $_GET['usuario'];
    
    // Si no es admin y no es su propio perfil, denegar acceso
    if ($usuario['tipo_Usu'] !== 'admin' && $usuario['NIF'] !== $nif) {
        echo json_encode([
            'success' => false,
            'error' => 'No tienes permisos para ver los turnos de otro usuario',
            'code' => 403
        ]);
        exit();
    }
    
    // Comprobar si se deben incluir turnos inactivos (solo para admin)
    $incluir_inactivos = isset($_GET['incluir_inactivos']) && $_GET['incluir_inactivos'] === 'true' && $usuario['tipo_Usu'] === 'admin';
    
    $resultado = $modelo->getTurnosByUsuario($nif, $incluir_inactivos);
    echo json_encode($resultado);
    exit();
}

// Obtener el turno actual de un usuario
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['turno_actual'])) {
    $usuario = verificarAutenticacion();
    $nif = isset($_GET['usuario']) ? $_GET['usuario'] : $usuario['NIF'];
    
    // Si no es admin y no es su propio perfil, denegar acceso
    if ($usuario['tipo_Usu'] !== 'admin' && $usuario['NIF'] !== $nif) {
        echo json_encode([
            'success' => false,
            'error' => 'No tienes permisos para ver los turnos de otro usuario',
            'code' => 403
        ]);
        exit();
    }
    
    $resultado = $modelo->getTurnoActual($nif);
    echo json_encode($resultado);
    exit();
}

// Crear un nuevo turno (solo admin)
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_GET['action']) && $_GET['action'] === 'create') {
    verificarAdmin();
    
    // Capturar el cuerpo de la solicitud para depuración
    $raw_input = file_get_contents('php://input');
    error_log("Datos recibidos en API turnos (create): " . $raw_input);
    
    $data = json_decode($raw_input, true);
    
    if (!$data) {
        $error_msg = "Datos inválidos o formato JSON incorrecto";
        error_log("Error en API turnos (create): " . $error_msg . " - Input: " . $raw_input);
        echo json_encode([
            'success' => false,
            'error' => $error_msg,
            'raw_input' => $raw_input
        ]);
        exit();
    }
    
    // Verificar datos requeridos
    if (!isset($data['nif_usuario']) || !isset($data['id_horario']) || !isset($data['orden'])) {
        $error_msg = "Faltan datos requeridos para crear el turno";
        error_log("Error en API turnos (create): " . $error_msg . " - Data: " . json_encode($data));
        echo json_encode([
            'success' => false,
            'error' => $error_msg,
            'data_received' => $data
        ]);
        exit();
    }
    
    try {
        $resultado = $modelo->crear($data);
        echo json_encode($resultado);
    } catch (Exception $e) {
        error_log("Excepción en API turnos (create): " . $e->getMessage());
        echo json_encode([
            'success' => false,
            'error' => "Error del servidor: " . $e->getMessage()
        ]);
    }
    exit();
}

// Actualizar un turno (solo admin)
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_GET['action']) && $_GET['action'] === 'update' && isset($_GET['id'])) {
    verificarAdmin();
    
    $id = intval($_GET['id']);
    
    // Capturar el cuerpo de la solicitud para depuración
    $raw_input = file_get_contents('php://input');
    error_log("Datos recibidos en API turnos (update): " . $raw_input);
    
    $data = json_decode($raw_input, true);
    
    if (!$data) {
        $error_msg = "Datos inválidos o formato JSON incorrecto";
        error_log("Error en API turnos (update): " . $error_msg . " - Input: " . $raw_input);
        echo json_encode([
            'success' => false,
            'error' => $error_msg,
            'raw_input' => $raw_input
        ]);
        exit();
    }
    
    try {
        $resultado = $modelo->actualizar($id, $data);
        echo json_encode($resultado);
    } catch (Exception $e) {
        error_log("Excepción en API turnos (update): " . $e->getMessage());
        echo json_encode([
            'success' => false,
            'error' => "Error del servidor: " . $e->getMessage()
        ]);
    }
    exit();
}

// Desactivar un turno (solo admin)
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_GET['action']) && $_GET['action'] === 'desactivar') {
    verificarAdmin();
    
    if (!isset($_GET['id'])) {
        echo json_encode([
            'success' => false,
            'error' => 'ID de turno no proporcionado'
        ]);
        exit();
    }
    
    $id = intval($_GET['id']);
    $resultado = $modelo->desactivar($id);
    echo json_encode($resultado);
    exit();
}

// Reactivar un turno (solo admin)
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_GET['action']) && $_GET['action'] === 'reactivar') {
    verificarAdmin();
    
    if (!isset($_GET['id'])) {
        echo json_encode([
            'success' => false,
            'error' => 'ID de turno no proporcionado'
        ]);
        exit();
    }
    
    $id = intval($_GET['id']);
    $resultado = $modelo->reactivar($id);
    echo json_encode($resultado);
    exit();
}

// Buscar turno inactivo similar (solo admin)
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_GET['action']) && $_GET['action'] === 'buscar_similar') {
    verificarAdmin();
    
    // Capturar el cuerpo de la solicitud
    $raw_input = file_get_contents('php://input');
    $data = json_decode($raw_input, true);
    
    if (!$data) {
        echo json_encode([
            'success' => false,
            'error' => 'Datos inválidos'
        ]);
        exit();
    }
    
    $resultado = $modelo->buscarTurnoInactivoSimilar($data);
    echo json_encode($resultado);
    exit();
}

// Eliminar un turno permanentemente (solo admin)
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_GET['action']) && $_GET['action'] === 'delete' && isset($_GET['id'])) {
    verificarAdmin();
    
    $id = intval($_GET['id']);
    
    $resultado = $modelo->eliminar($id);
    echo json_encode($resultado);
    exit();
}

// Eliminar turnos inactivos (solo admin)
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_GET['action']) && $_GET['action'] === 'limpiar_inactivos') {
    verificarAdmin();
    
    // Opcionalmente filtrar por NIF
    $nif = isset($_GET['nif']) ? $_GET['nif'] : null;
    
    $resultado = $modelo->eliminarTurnosInactivos($nif);
    echo json_encode($resultado);
    exit();
}

// Si no se encuentra ninguna ruta
echo json_encode([
    'success' => false,
    'error' => 'Ruta no encontrada',
    'code' => 404
]);
?>
