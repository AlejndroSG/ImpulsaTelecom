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

// Incluir el modelo de Horario
require_once "../modelos/Horario.php";
$modelo = new Horario();

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

// Obtener todos los horarios
if ($_SERVER['REQUEST_METHOD'] === 'GET' && !isset($_GET['id']) && !isset($_GET['usuario'])) {
    // Solo administradores pueden ver todos los horarios
    verificarAdmin();
    
    $resultado = $modelo->getHorarios();
    echo json_encode($resultado);
    exit();
}

// Obtener un horario específico por ID
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['id'])) {
    // Verificar autenticación (cualquier usuario autenticado puede ver un horario)
    verificarAutenticacion();
    
    $id = intval($_GET['id']);
    $resultado = $modelo->getHorarioById($id);
    echo json_encode($resultado);
    exit();
}

// Obtener el horario asignado a un usuario
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['usuario'])) {
    $usuario = verificarAutenticacion();
    
    // Si es admin, puede ver el horario de cualquier usuario
    // Si no es admin, solo puede ver su propio horario
    $NIF = $_GET['usuario'];
    if ($usuario['tipo_Usu'] !== 'admin' && $usuario['NIF'] !== $NIF) {
        echo json_encode([
            'success' => false,
            'error' => 'No tienes permiso para ver el horario de otro usuario',
            'code' => 403
        ]);
        exit();
    }
    
    $resultado = $modelo->getHorarioUsuario($NIF);
    echo json_encode($resultado);
    exit();
}

// Crear un nuevo horario
if ($_SERVER['REQUEST_METHOD'] === 'POST' && !isset($_GET['asignar'])) {
    // Solo administradores pueden crear horarios
    verificarAdmin();
    
    $datos = json_decode(file_get_contents('php://input'), true);
    
    if (!$datos) {
        echo json_encode([
            'success' => false,
            'error' => 'Datos inválidos'
        ]);
        exit();
    }
    
    $resultado = $modelo->crear($datos);
    echo json_encode($resultado);
    exit();
}

// Actualizar un horario existente
if ($_SERVER['REQUEST_METHOD'] === 'PUT' && isset($_GET['id'])) {
    // Solo administradores pueden actualizar horarios
    verificarAdmin();
    
    $id = intval($_GET['id']);
    $datos = json_decode(file_get_contents('php://input'), true);
    
    if (!$datos) {
        echo json_encode([
            'success' => false,
            'error' => 'Datos inválidos'
        ]);
        exit();
    }
    
    $resultado = $modelo->actualizar($id, $datos);
    echo json_encode($resultado);
    exit();
}

// Eliminar un horario
if ($_SERVER['REQUEST_METHOD'] === 'DELETE' && isset($_GET['id'])) {
    // Solo administradores pueden eliminar horarios
    verificarAdmin();
    
    $id = intval($_GET['id']);
    $resultado = $modelo->eliminar($id);
    echo json_encode($resultado);
    exit();
}

// Asignar horario a usuario
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_GET['asignar'])) {
    // Solo administradores pueden asignar horarios
    verificarAdmin();
    
    $datos = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($datos['NIF']) || !isset($datos['id_horario'])) {
        echo json_encode([
            'success' => false,
            'error' => 'Faltan datos requeridos (NIF, id_horario)'
        ]);
        exit();
    }
    
    $resultado = $modelo->asignarHorarioUsuario($datos['NIF'], $datos['id_horario']);
    echo json_encode($resultado);
    exit();
}

// Si llegamos aquí, la ruta no existe
echo json_encode([
    'success' => false,
    'error' => 'Ruta no encontrada',
    'code' => 404
]);