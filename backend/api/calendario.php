<?php
// Configuración de la sesión y cabeceras
ini_set('session.cookie_lifetime', '86400');    // 24 horas
ini_set('session.gc_maxlifetime', '86400');     // 24 horas
ini_set('session.use_strict_mode', '1');        // Modo estricto para seguridad

// Configuración de errores - Registrar pero no mostrar
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('display_startup_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/../logs/calendario_error.log');

// Iniciar sesión si no está iniciada
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Configuración de cabeceras para CORS y JSON
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

// Incluir modelo de evento
try {
    require_once __DIR__ . '/../modelos/Evento.php';
    require_once __DIR__ . '/../modelos/Tarea.php';
    require_once __DIR__ . '/../modelos/Fichaje.php';
} catch (Exception $e) {
    error_log("Error al incluir modelos: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error interno del servidor al cargar modelos']);
    exit();
}

// Función para manejar errores
function handleError($message, $code = 500) {
    error_log("API calendario error: " . $message);
    http_response_code($code);
    echo json_encode(['success' => false, 'message' => $message]);
    exit();
}

// Verificar si el usuario está autenticado
function verificarAutenticacion() {
    // Iniciar la sesión si no está iniciada
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }
    
    // Verificar si hay un usuario en la sesión
    if (isset($_SESSION['NIF']) && !empty($_SESSION['NIF'])) {
        return $_SESSION['NIF'];
    }
    
    // Si no hay sesión, verificar si se proporciona un token en la solicitud
    // Esta es una solución temporal para el problema de sesión
    if (isset($_GET['token']) && !empty($_GET['token'])) {
        // Aquí podrías validar el token contra la base de datos
        // Por ahora, simplemente aceptamos cualquier token para pruebas
        return 'usuario_temporal';
    }
    
    // Si no hay sesión ni token, verificar si hay un usuario en localStorage
    // que se envía como parte de la solicitud
    if (isset($_GET['user_id']) && !empty($_GET['user_id'])) {
        return $_GET['user_id'];
    }
    
    // Si llegamos aquí, no hay autenticación válida
    error_log("Usuario no autenticado en API calendario");
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Usuario no autenticado']);
    exit();
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
        try {
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
            
            // Agregar información de depuración
            $resultado['debug'] = [
                'NIF' => $NIF,
                'fecha_inicio' => $fecha_inicio,
                'fecha_fin' => $fecha_fin,
                'incluirTodo' => $incluirTodo,
                'session_active' => isset($_SESSION['NIF']),
                'session_id' => session_id(),
                'user_id' => isset($_GET['user_id']) ? $_GET['user_id'] : null
            ];
            
            echo json_encode($resultado);
            exit();
        } catch (Exception $e) {
            error_log("Error al obtener eventos del usuario: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error al obtener eventos: ' . $e->getMessage()]);
            exit();
        }
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
    
    // Si llegamos aquí, la ruta no existe
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'Endpoint no encontrado']);
    
} catch (Exception $e) {
    error_log("Error en API calendario: " . $e->getMessage());
    handleError("Error interno del servidor");
}
?>
