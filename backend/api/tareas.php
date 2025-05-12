<?php
// Configurar cookies antes de cualquier salida
ini_set('session.cookie_lifetime', '86400');    // 24 horas
ini_set('session.gc_maxlifetime', '86400');     // 24 horas
ini_set('session.use_strict_mode', '1');        // Modo estricto para seguridad
ini_set('session.cookie_httponly', '1');        // Prevenir acceso JS a la cookie
ini_set('session.use_only_cookies', '1');       // Solo usar cookies para sesiones
ini_set('session.cookie_samesite', 'Lax');      // Configuración más compatible

// Iniciar la sesión antes de cualquier salida
session_start();

// Obtener el origen de la solicitud
$origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';

// Lista de orígenes permitidos
$allowed_origins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:63975',  // Origen del proxy de Cascade
    'http://localhost:63975',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
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

// Configuración crítica para prevenir salida HTML
ini_set('display_errors', '0');                 // No mostrar errores en el navegador
ini_set('html_errors', '0');                    // No formatear errores como HTML
error_reporting(E_ALL);                         // Reportar todos los errores

// Función para manejar errores y devolver respuesta JSON
function handleError($message, $code = 500) {
    if (!headers_sent()) {
        http_response_code($code);
        header('Content-Type: application/json; charset=UTF-8');
    }
    echo json_encode(['success' => false, 'message' => $message]);
    exit();
}

// Configurar manejador de errores personalizado
set_error_handler(function($errno, $errstr, $errfile, $errline) {
    error_log("Error PHP en $errfile:$errline: $errstr");
    handleError("Error interno del servidor");
});

// Configurar manejador de excepciones personalizado
set_exception_handler(function($exception) {
    error_log("Excepción no capturada: " . $exception->getMessage() . " en " . $exception->getFile() . ":" . $exception->getLine());
    handleError("Error interno del servidor");
});

// Asegurar que siempre se devuelva JSON incluso si hay un error fatal
register_shutdown_function(function() {
    $error = error_get_last();
    if ($error !== null && in_array($error['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR, E_USER_ERROR])) {
        error_log("Error fatal: " . $error['message'] . " en " . $error['file'] . ":" . $error['line']);
        
        // Solo enviar respuesta JSON si no se ha enviado nada todavía
        if (!headers_sent()) {
            http_response_code(500);
            header('Content-Type: application/json; charset=UTF-8');
            echo json_encode(['success' => false, 'message' => 'Error interno del servidor']);
        }
    }
});

try {
    // Incluir los modelos necesarios
    require_once "../modelos/Tarea.php";
    
    // Verificar conexión a la base de datos antes de continuar
    $modelo = new Tarea();
    $conn = $modelo->getConn();
    
    if (!$conn) {
        throw new Exception("Error de conexión a la base de datos");
    }
    
    // Verificar si el usuario está autenticado
    function verificarAutenticacion() {
        // La sesión ya se ha iniciado al principio del archivo
        if (!isset($_SESSION['NIF']) || empty($_SESSION['NIF'])) {
            // Registrar información de depuración
            error_log('Autenticación fallida: SESSION=' . json_encode($_SESSION));
            error_log('Cookies: ' . json_encode($_COOKIE));
            
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'Usuario no autenticado']);
            exit();
        }
        return $_SESSION['NIF'];
    }
    
    // Obtener información del departamento del usuario actual
    function obtenerDepartamentoUsuario($NIF) {
        global $modelo;
        try {
            $conn = $modelo->getConn();
            if (!$conn) {
                throw new Exception("Error de conexión a la base de datos");
            }
            
            $query = "SELECT dpto FROM usuarios WHERE NIF = ?";
            $stmt = $conn->prepare($query);
            if (!$stmt) {
                throw new Exception("Error al preparar la consulta: " . $conn->error);
            }
            
            $stmt->bind_param("s", $NIF);
            $stmt->execute();
            $result = $stmt->get_result();
            
            if ($result->num_rows > 0) {
                $row = $result->fetch_assoc();
                return $row['dpto'];
            }
            return null;
        } catch (Exception $e) {
            error_log("Error en obtenerDepartamentoUsuario: " . $e->getMessage());
            throw $e; // Re-lanzar para que sea manejada por el manejador global
        }
    }
    
    // Verificar si el usuario es administrador
    function esAdministrador() {
        return isset($_SESSION['tipo_usuario']) && $_SESSION['tipo_usuario'] === 'admin';
    }

    // Crear una nueva tarea
    if ($_SERVER['REQUEST_METHOD'] === 'POST' && !isset($_GET['id'])) {
        $NIF = verificarAutenticacion();
        $data = json_decode(file_get_contents('php://input'), true);
        
        // Validar datos requeridos
        if (!isset($data['titulo']) || empty($data['titulo'])) {
            echo json_encode(['success' => false, 'message' => 'El título es obligatorio']);
            exit();
        }
        
        // Establecer valores por defecto
        $descripcion = $data['descripcion'] ?? '';
        $estado = $data['estado'] ?? 'pendiente';
        $prioridad = $data['prioridad'] ?? 'media';
        $fecha_vencimiento = $data['fecha_vencimiento'] ?? null;
        
        // Determinar el usuario asignado (por defecto, el mismo creador)
        $NIF_asignado = $data['NIF_asignado'] ?? $NIF;
        
        // Si es administrador, puede asignar a cualquier usuario
        // Si no es administrador, solo puede asignarse a sí mismo o a nadie
        if (!esAdministrador() && $NIF_asignado !== $NIF) {
            $NIF_asignado = $NIF; // Si no es admin, solo puede asignarse a sí mismo
        }
        
        // Obtener el departamento del usuario
        $departamento = obtenerDepartamentoUsuario($NIF);
        
        // Crear la tarea
        $resultado = $modelo->crearTarea(
            $data['titulo'],
            $descripcion,
            $estado,
            $prioridad,
            $fecha_vencimiento,
            $NIF,  // Creador (usuario actual)
            $NIF_asignado,
            $departamento
        );
        
        echo json_encode($resultado);
        exit();
    }

    // Actualizar una tarea existente
    if (($_SERVER['REQUEST_METHOD'] === 'POST' || $_SERVER['REQUEST_METHOD'] === 'PUT') && isset($_GET['id'])) {
        $NIF = verificarAutenticacion();
        $id = $_GET['id'];
        $data = json_decode(file_get_contents('php://input'), true);
        
        // Verificar que la tarea existe y que el usuario tiene permisos
        $tarea = $modelo->obtenerTareaPorId($id);
        
        if (!$tarea) {
            echo json_encode(['success' => false, 'message' => 'Tarea no encontrada']);
            exit();
        }
        
        // Verificar permisos: solo el creador, el asignado o un administrador pueden modificar
        if ($tarea['NIF_creador'] !== $NIF && $tarea['NIF_asignado'] !== $NIF && !esAdministrador()) {
            echo json_encode(['success' => false, 'message' => 'No tienes permisos para modificar esta tarea']);
            exit();
        }
        
        // Si no es administrador, no puede cambiar el usuario asignado a otro que no sea él mismo
        if (!esAdministrador() && isset($data['NIF_asignado']) && $data['NIF_asignado'] !== $NIF && $data['NIF_asignado'] !== $tarea['NIF_asignado']) {
            unset($data['NIF_asignado']); // Eliminar este campo si no tiene permisos
        }
        
        // Actualizar la tarea
        $resultado = $modelo->actualizarTarea($id, $data);
        
        echo json_encode($resultado);
        exit();
    }

    // Eliminar una tarea
    if ($_SERVER['REQUEST_METHOD'] === 'DELETE' && isset($_GET['id'])) {
        $NIF = verificarAutenticacion();
        $id = $_GET['id'];
        
        // Verificar que la tarea existe y que el usuario tiene permisos
        $tarea = $modelo->obtenerTareaPorId($id);
        
        if (!$tarea) {
            echo json_encode(['success' => false, 'message' => 'Tarea no encontrada']);
            exit();
        }
        
        // Solo el creador o un administrador pueden eliminar
        if ($tarea['NIF_creador'] !== $NIF && !esAdministrador()) {
            echo json_encode(['success' => false, 'message' => 'No tienes permisos para eliminar esta tarea']);
            exit();
        }
        
        // Eliminar la tarea
        $resultado = $modelo->eliminarTarea($id);
        
        echo json_encode($resultado);
        exit();
    }

    // Obtener una tarea específica
    if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['id'])) {
        $NIF = verificarAutenticacion();
        $id = $_GET['id'];
        
        // Obtener la tarea
        $tarea = $modelo->obtenerTareaPorId($id);
        
        if (!$tarea) {
            echo json_encode(['success' => false, 'message' => 'Tarea no encontrada']);
            exit();
        }
        
        // Verificar permisos: solo pueden ver la tarea el creador, el asignado, usuarios del mismo departamento o un administrador
        $departamentoUsuario = obtenerDepartamentoUsuario($NIF);
        $esMismoDepartamento = $departamentoUsuario === $tarea['departamento'];
        
        if ($tarea['NIF_creador'] !== $NIF && $tarea['NIF_asignado'] !== $NIF && !$esMismoDepartamento && !esAdministrador()) {
            echo json_encode(['success' => false, 'message' => 'No tienes permisos para ver esta tarea']);
            exit();
        }
        
        echo json_encode(['success' => true, 'tarea' => $tarea]);
        exit();
    }

    // Obtener todas las tareas del usuario
    if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['mis_tareas'])) {
        $NIF = verificarAutenticacion();
        
        // Construir filtros desde parámetros GET
        $filtros = [];
        
        if (isset($_GET['estado'])) {
            $filtros['estado'] = $_GET['estado'];
        }
        
        if (isset($_GET['prioridad'])) {
            $filtros['prioridad'] = $_GET['prioridad'];
        }
        
        if (isset($_GET['fecha_desde'])) {
            $filtros['fecha_desde'] = $_GET['fecha_desde'];
        }
        
        if (isset($_GET['fecha_hasta'])) {
            $filtros['fecha_hasta'] = $_GET['fecha_hasta'];
        }
        
        // Obtener tareas del usuario
        $tareas = $modelo->obtenerTareasPorUsuario($NIF, $filtros);
        
        echo json_encode(['success' => true, 'tareas' => $tareas]);
        exit();
    }

    // Obtener tareas del departamento
    if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['departamento'])) {
        $NIF = verificarAutenticacion();
        
        // Obtener el departamento del usuario
        $departamento = obtenerDepartamentoUsuario($NIF);
        
        if (!$departamento) {
            echo json_encode(['success' => false, 'message' => 'No se pudo determinar el departamento del usuario']);
            exit();
        }
        
        // Construir filtros desde parámetros GET
        $filtros = [];
        
        if (isset($_GET['estado'])) {
            $filtros['estado'] = $_GET['estado'];
        }
        
        if (isset($_GET['prioridad'])) {
            $filtros['prioridad'] = $_GET['prioridad'];
        }
        
        if (isset($_GET['fecha_desde'])) {
            $filtros['fecha_desde'] = $_GET['fecha_desde'];
        }
        
        if (isset($_GET['fecha_hasta'])) {
            $filtros['fecha_hasta'] = $_GET['fecha_hasta'];
        }
        
        // Ya no filtramos por el usuario actual para mostrar todas las tareas del departamento
        // Si se proporciona un NIF específico, filtrar por ese usuario
        if (isset($_GET['NIF_asignado']) && !empty($_GET['NIF_asignado'])) {
            $filtros['NIF_asignado'] = $_GET['NIF_asignado'];
        }
        
        // Obtener tareas del departamento
        $tareas = $modelo->obtenerTareasPorDepartamento($departamento, $filtros);
        
        echo json_encode(['success' => true, 'tareas' => $tareas]);
        exit();
    }

    // Obtener estadísticas de tareas
    if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['estadisticas'])) {
        try {
            $NIF = verificarAutenticacion();
            
            // Verificar que el modelo esté inicializado correctamente
            if (!$modelo || !$modelo->getConn()) {
                error_log("Error de conexión al modelo de tareas en estadísticas");
                echo json_encode([
                    'success' => true, 
                    'estadisticas' => [
                        'total' => 0,
                        'pendientes' => 0,
                        'en_progreso' => 0,
                        'completadas' => 0,
                        'canceladas' => 0,
                        'prioridad_alta' => 0,
                        'prioridad_media' => 0,
                        'prioridad_baja' => 0,
                        'vencidas' => 0
                    ]
                ]);
                exit();
            }
            
            // Obtener estadísticas
            $estadisticas = $modelo->obtenerEstadisticasTareas($NIF);
            
            // Verificar que las estadísticas sean un array válido
            if (!is_array($estadisticas)) {
                error_log("Formato de estadísticas inválido");
                $estadisticas = [
                    'total' => 0,
                    'pendientes' => 0,
                    'en_progreso' => 0,
                    'completadas' => 0,
                    'canceladas' => 0,
                    'prioridad_alta' => 0,
                    'prioridad_media' => 0,
                    'prioridad_baja' => 0,
                    'vencidas' => 0
                ];
            }
            
            echo json_encode(['success' => true, 'estadisticas' => $estadisticas]);
            exit();
        } catch (Exception $e) {
            error_log("Error al obtener estadísticas: " . $e->getMessage());
            // Devolver estadísticas vacías en lugar de un error
            echo json_encode([
                'success' => true, 
                'estadisticas' => [
                    'total' => 0,
                    'pendientes' => 0,
                    'en_progreso' => 0,
                    'completadas' => 0,
                    'canceladas' => 0,
                    'prioridad_alta' => 0,
                    'prioridad_media' => 0,
                    'prioridad_baja' => 0,
                    'vencidas' => 0
                ]
            ]);
            exit();
        }
    }

    // Si llegamos aquí, la ruta no existe
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'Ruta no encontrada']);
    exit();
} catch (Exception $e) {
    error_log("Error general en tareas.php: " . $e->getMessage());
    handleError("Error interno del servidor: " . $e->getMessage(), 500);
}
?>
