<?php
// Configuraciu00f3n de la sesiu00f3n y cabeceras
ini_set('session.cookie_lifetime', '86400');    // 24 horas
ini_set('session.gc_maxlifetime', '86400');     // 24 horas
ini_set('session.use_strict_mode', '1');        // Modo estricto para seguridad

// Iniciar sesiu00f3n si no estu00e1 iniciada
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Configuraciu00f3n de cabeceras para CORS y JSON
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

// Manejar pre-flight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Incluir modelo de evento
require_once __DIR__ . '/../modelos/Evento.php';
require_once __DIR__ . '/../modelos/Tarea.php';
require_once __DIR__ . '/../modelos/Fichaje.php';

// Funciu00f3n para manejar errores
function handleError($message, $code = 500) {
    http_response_code($code);
    echo json_encode(['success' => false, 'message' => $message]);
    exit();
}

// Verificar si el usuario estu00e1 autenticado
function verificarAutenticacion() {
    // Iniciar la sesiu00f3n si no estu00e1 iniciada
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }
    
    if (!isset($_SESSION['NIF']) || empty($_SESSION['NIF'])) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Usuario no autenticado']);
        exit();
    }
    return $_SESSION['NIF'];
}

// Obtener el departamento del usuario actual
function obtenerDepartamentoUsuario($NIF) {
    global $conn;
    
    try {
        $query = "SELECT id_departamento FROM usuarios WHERE NIF = :NIF";
        $stmt = $conn->prepare($query);
        $stmt->bindParam(':NIF', $NIF);
        $stmt->execute();
        
        $resultado = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($resultado && isset($resultado['id_departamento'])) {
            return $resultado['id_departamento'];
        }
        
        return null;
    } catch (PDOException $e) {
        error_log("Error al obtener departamento: " . $e->getMessage());
        return null;
    }
}

try {
    // Instanciar los modelos
    $modeloEvento = new Evento();
    $modeloTarea = new Tarea();
    $modeloFichaje = new Fichaje();
    
    // Crear un nuevo evento
    if ($_SERVER['REQUEST_METHOD'] === 'POST' && !isset($_GET['id'])) {
        $NIF = verificarAutenticacion();
        $data = json_decode(file_get_contents('php://input'), true);
        
        // Asignar el NIF del usuario actual
        $data['NIF_usuario'] = $NIF;
        
        $resultado = $modeloEvento->crear($data);
        echo json_encode($resultado);
        exit();
    }
    
    // Actualizar un evento existente
    if (($_SERVER['REQUEST_METHOD'] === 'PUT' || $_SERVER['REQUEST_METHOD'] === 'POST') && isset($_GET['id'])) {
        $NIF = verificarAutenticacion();
        $id = $_GET['id'];
        
        // Obtener datos del body
        $data = json_decode(file_get_contents('php://input'), true);
        
        $resultado = $modeloEvento->actualizar($id, $data, $NIF);
        echo json_encode($resultado);
        exit();
    }
    
    // Eliminar un evento
    if ($_SERVER['REQUEST_METHOD'] === 'DELETE' && isset($_GET['id'])) {
        $NIF = verificarAutenticacion();
        $id = $_GET['id'];
        
        $resultado = $modeloEvento->eliminar($id, $NIF);
        echo json_encode($resultado);
        exit();
    }
    
    // Obtener eventos por usuario y rango de fechas
    if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['mis_eventos'])) {
        $NIF = verificarAutenticacion();
        
        // Fechas para filtrar (opcional)
        $fecha_inicio = isset($_GET['inicio']) ? $_GET['inicio'] : null;
        $fecha_fin = isset($_GET['fin']) ? $_GET['fin'] : null;
        
        // Obtener los eventos del usuario
        $eventos = $modeloEvento->obtenerEventosPorUsuario($NIF, $fecha_inicio, $fecha_fin);
        
        // Si se solicita incluir tareas y fichajes
        $incluirTodo = isset($_GET['incluir_todo']) && $_GET['incluir_todo'] === 'true';
        
        if ($incluirTodo) {
            // Obtener tareas como eventos
            $tareas = $modeloEvento->obtenerTareasComoEventos($NIF, $fecha_inicio, $fecha_fin);
            
            // Obtener fichajes como eventos
            $fichajes = $modeloEvento->obtenerFichajesComoEventos($NIF, $fecha_inicio, $fecha_fin);
            
            // Combinar todo en un solo array
            $resultado = [
                'success' => true,
                'eventos' => $eventos['success'] ? $eventos['eventos'] : [],
                'tareas' => $tareas['success'] ? $tareas['tareas'] : [],
                'fichajes' => $fichajes['success'] ? $fichajes['fichajes'] : []
            ];
        } else {
            $resultado = $eventos;
        }
        
        echo json_encode($resultado);
        exit();
    }
    
    // Obtener eventos por departamento y rango de fechas
    if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['departamento'])) {
        $NIF = verificarAutenticacion();
        
        // Obtener el departamento del usuario
        $id_departamento = obtenerDepartamentoUsuario($NIF);
        
        if (!$id_departamento) {
            echo json_encode(['success' => false, 'message' => 'No se pudo determinar el departamento del usuario']);
            exit();
        }
        
        // Fechas para filtrar (opcional)
        $fecha_inicio = isset($_GET['inicio']) ? $_GET['inicio'] : null;
        $fecha_fin = isset($_GET['fin']) ? $_GET['fin'] : null;
        
        $resultado = $modeloEvento->obtenerEventosPorDepartamento($id_departamento, $fecha_inicio, $fecha_fin);
        echo json_encode($resultado);
        exit();
    }
    
    // Si llegamos aquu00ed, la ruta no existe
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'Endpoint no encontrado']);
    
} catch (Exception $e) {
    error_log("Error en API calendario: " . $e->getMessage());
    handleError("Error interno del servidor: " . $e->getMessage());
}
?>
