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
$allowedOrigins = [
    'http://localhost:5173', 
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:63975',  // Origen del proxy de Cascade
    'http://localhost:63975',
    'https://asp-natural-annually.ngrok-free.app'  // Dominio de ngrok actual
];
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

// Incluir modelo de evento y base de datos
try {
    require_once __DIR__ . '/../config/database.php';
    require_once __DIR__ . '/../modelos/Evento.php';
    require_once __DIR__ . '/../modelos/Tarea.php';
    require_once __DIR__ . '/../modelos/Fichaje.php';
    
    // Obtener la conexión a la base de datos
    $database = new Database();
    $conn = $database->getConnection();
    
    if (!$conn) {
        throw new Exception("No se pudo establecer la conexión a la base de datos");
    }
} catch (Exception $e) {
    error_log("Error al incluir modelos o conectar a la base de datos: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error interno del servidor al cargar modelos o conectar a la base de datos']);
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
        // Por ahora, simplemente devolvemos un ID temporal para pruebas
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

// Determinar si el usuario es administrador
$es_admin = false;
if (isset($_SESSION['usuario_tipo']) && $_SESSION['usuario_tipo'] === 'admin') {
    $es_admin = true;
} else if (isset($_POST['user_type']) && $_POST['user_type'] === 'admin') {
    $es_admin = true;
} else if (isset($_GET['user_type']) && $_GET['user_type'] === 'admin') {
    $es_admin = true;
}

// Obtener el ID del usuario actual
$usuario_id = isset($_SESSION['usuario_id']) ? $_SESSION['usuario_id'] : (isset($_POST['user_id']) ? $_POST['user_id'] : $_GET['user_id']);
$usuario_nif = isset($_SESSION['usuario_nif']) ? $_SESSION['usuario_nif'] : (isset($_POST['user_nif']) ? $_POST['user_nif'] : (isset($_GET['user_nif']) ? $_GET['user_nif'] : null));

// Obtener el departamento del usuario actual
function obtenerDepartamentoUsuario($NIF) {
    global $conn;
    
    try {
        // Verificar que tenemos una conexión a la base de datos
        if (!$conn) {
            error_log("Error: No hay conexión a la base de datos en obtenerDepartamentoUsuario");
            return null;
        }
        
        // Consulta corregida para usar la columna 'dpto' en lugar de 'id_departamento'
        $query = "SELECT dpto FROM usuarios WHERE NIF = :NIF";
        $stmt = $conn->prepare($query);
        
        if (!$stmt) {
            error_log("Error al preparar consulta: " . implode(", ", $conn->errorInfo()));
            return null;
        }
        
        $stmt->bindParam(':NIF', $NIF);
        
        if (!$stmt->execute()) {
            error_log("Error al ejecutar consulta: " . implode(", ", $stmt->errorInfo()));
            return null;
        }
        
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($result && isset($result['dpto'])) {
            return $result['dpto'];
        }
        
        return null;
    } catch (Exception $e) {
        error_log("Error en obtenerDepartamentoUsuario: " . $e->getMessage());
        return null;
    }
}

try {
    // Inicializar modelos
    $modeloEvento = new Evento();
    $modeloTarea = new Tarea();
    $modeloFichaje = new Fichaje();
    
    // MANEJAR SOLICITUDES POST PARA GUARDAR EVENTOS
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        try {
            // Verificar autenticación
            $NIF = verificarAutenticacion();
            
            // Registrar información de depuración
            error_log("Procesando solicitud POST para guardar evento. NIF: $NIF");
            
            // Determinar el tipo de contenido y procesar los datos en consecuencia
            $contentType = isset($_SERVER['CONTENT_TYPE']) ? $_SERVER['CONTENT_TYPE'] : '';
            error_log("Content-Type recibido: $contentType");
            
            $datos = null;
            
            // Si es una solicitud multipart/form-data (FormData)
            if (strpos($contentType, 'multipart/form-data') !== false) {
                error_log("Procesando datos de FormData");
                
                // Verificar si tenemos datos en $_POST
                if (isset($_POST['accion'])) {
                    $datos = $_POST;
                    
                    // Si el evento viene como string JSON, decodificarlo
                    if (isset($_POST['evento']) && is_string($_POST['evento'])) {
                        $datos['evento'] = json_decode($_POST['evento'], true);
                    }
                }
            } 
            // Si es application/json
            else {
                // Obtener los datos del evento desde el cuerpo de la solicitud como JSON
                $datosJson = file_get_contents('php://input');
                error_log("Datos JSON recibidos: $datosJson");
                
                $datos = json_decode($datosJson, true);
            }
            
            if (!$datos) {
                $jsonError = json_last_error_msg();
                error_log("Error al decodificar JSON: $jsonError");
                handleError("Datos de evento inválidos o vacíos: $jsonError", 400);
            }
            
            // Comprobar si se trata de una solicitud para obtener todos los eventos
            if (isset($datos['accion']) && $datos['accion'] === 'obtener_todos_eventos') {
                // No validar campos de eventos para esta acción
                
                // Determinar si el usuario es administrador
                $esAdmin = (isset($datos['tipo_usuario']) && $datos['tipo_usuario'] === 'admin');
                
                // Obtener todos los eventos según el NIF y el rol
                $resultado = $modeloEvento->obtenerTodosEventos($NIF, $esAdmin);
                
                echo json_encode($resultado);
                exit();
            }
            
            // Validar datos básicos del evento para otras acciones
            if (!isset($datos['titulo']) || (!isset($datos['inicio']) && !isset($datos['fecha_inicio']))) {
                error_log("Faltan datos obligatorios. Datos recibidos: " . print_r($datos, true));
                handleError('Faltan datos obligatorios del evento (título o fecha de inicio)', 400);
            }
            
            // Asignar el creador del evento (usuario autenticado)
            $datos['NIF'] = $NIF;
            $datos['NIF_usuario'] = $NIF; // Agregar también como NIF_usuario para compatibilidad con la función crear
            error_log("Datos preparados para guardar: " . print_r($datos, true));
            
            // Guardar el evento
            $resultado = $modeloEvento->guardarEvento($datos);
            
            if ($resultado['success']) {
                echo json_encode($resultado);
            } else {
                error_log("Error al guardar evento: " . ($resultado['message'] ?? 'Error desconocido'));
                handleError($resultado['message'] ?? 'Error al guardar el evento', 500);
            }
            exit();
        } catch (Exception $e) {
            error_log("Excepción al procesar solicitud POST: " . $e->getMessage());
            handleError('Error al procesar la solicitud: ' . $e->getMessage(), 500);
        }
    }
    
    // MANEJAR SOLICITUDES PUT PARA ACTUALIZAR EVENTOS
    if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
        try {
            // Verificar autenticación
            $NIF = verificarAutenticacion();
            
            // Verificar que se proporciona un ID de evento
            if (!isset($_GET['id']) || empty($_GET['id'])) {
                handleError('No se proporcionó un ID de evento para actualizar', 400);
            }
            
            $eventoId = $_GET['id'];
            
            // Obtener los datos del evento desde el cuerpo de la solicitud
            $datosJson = file_get_contents('php://input');
            $datos = json_decode($datosJson, true);
            
            if (!$datos) {
                handleError('Datos de evento inválidos o vacíos', 400);
            }
            
            // Verificar que el usuario es el propietario del evento
            $esPropio = $modeloEvento->verificarPropietarioEvento($eventoId, $NIF);
            if (!$esPropio) {
                handleError('No tienes permiso para editar este evento', 403);
            }
            
            // Asignar ID y NIF a los datos
            $datos['id'] = $eventoId;
            $datos['NIF'] = $NIF;
            
            // Actualizar el evento
            $resultado = $modeloEvento->actualizarEvento($datos);
            
            if ($resultado['success']) {
                echo json_encode($resultado);
            } else {
                handleError($resultado['message'] ?? 'Error al actualizar el evento', 500);
            }
            exit();
        } catch (Exception $e) {
            handleError('Error al procesar la solicitud: ' . $e->getMessage(), 500);
        }
    }
    
    // MANEJAR SOLICITUDES DELETE PARA ELIMINAR EVENTOS
    if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
        try {
            // Verificar autenticación
            $NIF = verificarAutenticacion();
            
            // Verificar que se proporciona un ID de evento
            if (!isset($_GET['id']) || empty($_GET['id'])) {
                handleError('No se proporcionó un ID de evento para eliminar', 400);
            }
            
            $eventoId = $_GET['id'];
            
            // Verificar que el usuario es el propietario del evento
            $esPropio = $modeloEvento->verificarPropietarioEvento($eventoId, $NIF);
            if (!$esPropio) {
                handleError('No tienes permiso para eliminar este evento', 403);
            }
            
            // Eliminar el evento
            $resultado = $modeloEvento->eliminarEvento($eventoId);
            
            if ($resultado['success']) {
                echo json_encode($resultado);
            } else {
                handleError($resultado['message'] ?? 'Error al eliminar el evento', 500);
            }
            exit();
        } catch (Exception $e) {
            handleError('Error al procesar la solicitud: ' . $e->getMessage(), 500);
        }
    }
    
    // MANEJAR SOLICITUDES GET PARA OBTENER EVENTOS
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        try {
            // Obtener NIF del usuario
            $NIF = verificarAutenticacion();
            error_log("Procesando solicitud GET para obtener eventos. NIF: $NIF");
            
            // Determinar si el usuario es administrador
            $esAdmin = isset($_GET['user_type']) && $_GET['user_type'] === 'admin';
            
            // Obtener fechas de inicio y fin si se proporcionan
            $fechaInicio = isset($_GET['inicio']) ? $_GET['inicio'] : null;
            $fechaFin = isset($_GET['fin']) ? $_GET['fin'] : null;
            
            // Llamar a la función para obtener todos los eventos visibles para el usuario
            $resultado = $modeloEvento->obtenerTodosEventos($NIF, $esAdmin);
            
            if ($resultado['success']) {
                // Devolver los eventos en formato JSON
                echo json_encode($resultado);
            } else {
                handleError($resultado['message'] ?? 'Error al obtener eventos', 500);
            }
            exit();
        } catch (Exception $e) {
            error_log("Error en GET calendario: " . $e->getMessage());
            handleError('Error al procesar la solicitud GET: ' . $e->getMessage(), 500);
        }
    }

    // Acción para obtener todos los eventos (para administradores)
    if (isset($datos['accion']) && $datos['accion'] === 'obtener_todos_eventos') {
        $nif = isset($datos['nif']) ? $datos['nif'] : null;
        $tipo_usuario = isset($datos['tipo_usuario']) ? $datos['tipo_usuario'] : null;
        
        if (!$nif || $tipo_usuario !== 'admin') {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'No tiene permisos para acceder a todos los eventos']);
            exit;
        }
        
        $evento = new Evento($conn);
        $personales = $evento->obtenerEventosPersonales($nif);
        $departamentales = $evento->obtenerEventosDepartamentales($nif);
        $otrosEventos = $evento->obtenerEventosDeOtrosUsuarios();
        
        $todosEventos = [];
        
        if ($personales['success']) {
            $todosEventos = array_merge($todosEventos, $personales['eventos']);
        }
        
        if ($departamentales['success']) {
            $todosEventos = array_merge($todosEventos, $departamentales['eventos']);
        }
        
        if ($otrosEventos['success']) {
            $todosEventos = array_merge($todosEventos, $otrosEventos['eventos']);
        }
        
        echo json_encode([
            'success' => true,
            'eventos' => $todosEventos
        ]);
        exit();
    }
    
    // Obtener eventos del departamento
    if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['eventos_departamento'])) {
        try {
            $NIF = verificarAutenticacion();
            
            // Obtener el departamento del usuario
            $dpto = obtenerDepartamentoUsuario($NIF);
            
            if (!$dpto) {
                // Si no se puede obtener el departamento, intentar usar un valor por defecto
                try {
                    if (isset($_GET['departamento_fallback']) && !empty($_GET['departamento_fallback'])) {
                        $dpto = $_GET['departamento_fallback'];
                    } else {
                        echo json_encode(['success' => false, 'message' => 'No se pudo determinar el departamento del usuario']);
                        exit();
                    }
                } catch (Exception $e) {
                    error_log("Error al buscar departamento fallback: " . $e->getMessage());
                    echo json_encode(['success' => false, 'message' => 'No se pudo determinar el departamento del usuario y falló el fallback']);
                    exit();
                }
            }
            
            // Fechas para filtrar (opcional)
            $fecha_inicio = isset($_GET['inicio']) ? $_GET['inicio'] : null;
            $fecha_fin = isset($_GET['fin']) ? $_GET['fin'] : null;
            
            $resultado = $modeloEvento->obtenerEventosPorDepartamento($dpto, $fecha_inicio, $fecha_fin);
            
            // Agregar información de depuración
            $resultado['debug']['NIF'] = $NIF;
            $resultado['debug']['dpto'] = $dpto;
            $resultado['debug']['session_id'] = session_id();
            $resultado['debug']['session_active'] = isset($_SESSION['NIF']);
            
            echo json_encode($resultado);
            exit();
        } catch (Exception $e) {
            error_log("Error al obtener eventos de departamento: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error al obtener eventos de departamento: ' . $e->getMessage()]);
            exit();
        }
    }
    
    // Obtener eventos híbridos (personales + departamentales)
    if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['hibrido'])) {
        try {
            // Configurar respuesta de depuración
            $debug = [];
            $debug['request'] = $_GET;
            
            $NIF = verificarAutenticacion();
            $debug['NIF'] = $NIF;
            
            // Obtener el departamento del usuario (opcional)
            $dpto = null;
            if (isset($_GET['incluir_departamento']) && $_GET['incluir_departamento'] === 'true') {
                try {
                    $dpto = obtenerDepartamentoUsuario($NIF);
                    $debug['dpto_obtenido'] = $dpto;
                    
                    // Verificar si se pudo obtener el departamento
                    if (!$dpto) {
                        error_log("No se pudo obtener el departamento para el usuario $NIF");
                    }
                } catch (Exception $deptoError) {
                    $debug['error_dpto'] = $deptoError->getMessage();
                }
            }
            
            // Fechas para filtrar (opcional)
            $fecha_inicio = isset($_GET['inicio']) ? $_GET['inicio'] : null;
            $fecha_fin = isset($_GET['fin']) ? $_GET['fin'] : null;
            $debug['fecha_inicio'] = $fecha_inicio;
            $debug['fecha_fin'] = $fecha_fin;
            
            // Tipo de filtro (opcional: 'todos', 'personal', 'departamental')
            $tipo_filtro = isset($_GET['tipo']) ? $_GET['tipo'] : 'todos';
            $debug['tipo_filtro'] = $tipo_filtro;
            
            try {
                // Obtener eventos híbridos
                $resultado = $modeloEvento->obtenerEventosHibridos($NIF, $dpto, $fecha_inicio, $fecha_fin);
                
                // Si hay un error en la consulta, devolver el error
                if (!$resultado['success']) {
                    // Añadir información de depuración
                    $resultado['debug'] = array_merge($debug, isset($resultado['debug']) ? $resultado['debug'] : []);
                    echo json_encode($resultado);
                    exit();
                }
                
                // Filtrar por tipo si se especifica
                if ($resultado['success'] && $tipo_filtro !== 'todos' && isset($resultado['eventos'])) {
                    $eventos_filtrados = [];
                    foreach ($resultado['eventos'] as $evento) {
                        if (isset($evento['tipo_evento']) && $evento['tipo_evento'] === $tipo_filtro) {
                            $eventos_filtrados[] = $evento;
                        }
                    }
                    $resultado['eventos'] = $eventos_filtrados;
                    $resultado['debug']['count_filtrado'] = count($eventos_filtrados);
                    $resultado['debug']['tipo_filtro'] = $tipo_filtro;
                }
                
                // Incluir tareas y fichajes si están activados en los filtros
                $incluir_tareas = isset($_GET['incluir_tareas']) ? $_GET['incluir_tareas'] === 'true' : false;
                $incluir_fichajes = isset($_GET['incluir_fichajes']) ? $_GET['incluir_fichajes'] === 'true' : false;
                $debug['incluir_tareas'] = $incluir_tareas;
                $debug['incluir_fichajes'] = $incluir_fichajes;
                
                // Obtener tareas como eventos si se solicitan
                $resultado['tareas'] = [];
                if ($incluir_tareas) {
                    try {
                        $resultadoTareas = $modeloEvento->obtenerTareasComoEventos($NIF, $fecha_inicio, $fecha_fin);
                        if ($resultadoTareas['success'] && !empty($resultadoTareas['tareas'])) {
                            $resultado['tareas'] = $resultadoTareas['tareas'];
                        }
                    } catch (Exception $tareasError) {
                        $debug['error_tareas'] = $tareasError->getMessage();
                    }
                }
                
                // Obtener fichajes como eventos si se solicitan
                $resultado['fichajes'] = [];
                if ($incluir_fichajes) {
                    try {
                        $resultadoFichajes = $modeloEvento->obtenerFichajesComoEventos($NIF, $fecha_inicio, $fecha_fin);
                        if ($resultadoFichajes['success'] && !empty($resultadoFichajes['fichajes'])) {
                            $resultado['fichajes'] = $resultadoFichajes['fichajes'];
                        }
                    } catch (Exception $fichajesError) {
                        $debug['error_fichajes'] = $fichajesError->getMessage();
                    }
                }
                
                // Agregar información de depuración
                $resultado['debug'] = array_merge($debug, isset($resultado['debug']) ? $resultado['debug'] : []);
                $resultado['debug']['NIF'] = $NIF;
                $resultado['debug']['dpto'] = $dpto;
                $resultado['debug']['session_id'] = session_id();
                $resultado['debug']['session_active'] = isset($_SESSION['NIF']);
                
                echo json_encode($resultado);
                exit();
                
            } catch (Exception $eventosError) {
                $debug['error_eventos'] = $eventosError->getMessage();
                $debug['error_trace'] = $eventosError->getTraceAsString();
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Error al obtener eventos híbridos: ' . $eventosError->getMessage(), 'debug' => $debug]);
                exit();
            }
            
        } catch (Exception $e) {
            error_log("Error general al obtener eventos híbridos: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error al obtener eventos híbridos: ' . $e->getMessage(), 'debug' => isset($debug) ? $debug : []]);
            exit();
        }
    }
    
    // Si llegamos aquí, la ruta no existe
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'Endpoint no encontrado']);
    
} catch (Exception $e) {
    error_log("Error en API calendario: " . $e->getMessage());
    handleError("Error interno del servidor");
}
?>
