<?php
// Obtener el origen de la solicitud
$allowedOrigins = ['http://localhost:5173', 'http://localhost:3000', 'http://localhost'];
$origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';

// Verificar si el origen está permitido
if (in_array($origin, $allowedOrigins)) {
    header("Access-Control-Allow-Origin: $origin");
    header("Access-Control-Allow-Credentials: true");
} else {
    // Si no está en la lista, usar un comodín (esto solo funcionará para solicitudes sin credenciales)
    header("Access-Control-Allow-Origin: *");
}

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Responder a las solicitudes OPTIONS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Incluir archivos necesarios
require_once '../modelos/Incidencia.php';
require_once '../utils/autenticacion.php';

// Instanciar modelo de incidencia
$incidencia = new Incidencia();

// Obtener datos de la solicitud
$data = json_decode(file_get_contents("php://input"), true);

// Verificar autenticación
$auth = new Autenticacion();
$usuario = $auth->verificarToken();

if (!$usuario) {
    echo json_encode([
        'success' => false,
        'message' => 'No autenticado'
    ]);
    exit;
}

// Procesar solicitud según el método HTTP
switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        // Verificar si se solicita una incidencia específica por ID
        if (isset($_GET['id'])) {
            $resultado = $incidencia->obtenerPorId($_GET['id']);
            
            // Verificar si el usuario es administrador o es el propietario de la incidencia
            if ($resultado && ($usuario['rol'] === 'admin' || $resultado['NIF_usuario'] === $usuario['NIF'])) {
                // Si es admin y la incidencia no ha sido leída, marcarla como leída
                if ($usuario['rol'] === 'admin' && $resultado['leido'] == 0) {
                    $incidencia->actualizar($resultado['id'], ['leido' => 1]);
                    $resultado['leido'] = 1; // Actualizar el resultado antes de enviarlo
                }
                
                echo json_encode([
                    'success' => true,
                    'incidencia' => $resultado
                ]);
            } else {
                echo json_encode([
                    'success' => false,
                    'message' => 'No tiene permisos para ver esta incidencia o no existe'
                ]);
            }
        } 
        // Verificar si se solicita el conteo de incidencias no leídas (para admin)
        else if (isset($_GET['no_leidas']) && $usuario['rol'] === 'admin') {
            $total = $incidencia->contarNoLeidas();
            echo json_encode([
                'success' => true,
                'total_no_leidas' => $total
            ]);
        }
        // Si no hay ID específico, devolver todas o filtradas
        else {
            // Si es admin, puede ver todas las incidencias
            if ($usuario['rol'] === 'admin') {
                // Extraer filtros de los parámetros GET
                $filtros = [];
                
                if (isset($_GET['estado'])) $filtros['estado'] = $_GET['estado'];
                if (isset($_GET['tipo'])) $filtros['tipo'] = $_GET['tipo'];
                if (isset($_GET['prioridad'])) $filtros['prioridad'] = $_GET['prioridad'];
                if (isset($_GET['leido'])) $filtros['leido'] = $_GET['leido'];
                
                $resultado = $incidencia->obtenerTodas($filtros);
                echo json_encode($resultado);
            } 
            // Si es usuario normal, solo puede ver sus propias incidencias
            else {
                $resultado = $incidencia->obtenerPorUsuario($usuario['NIF']);
                echo json_encode($resultado);
            }
        }
        break;
        
    case 'POST':
        // Verificar datos mínimos requeridos
        if (!isset($data['titulo']) || !isset($data['descripcion']) || !isset($data['tipo'])) {
            echo json_encode([
                'success' => false,
                'message' => 'Faltan datos requeridos'
            ]);
            break;
        }
        
        // Añadir el NIF del usuario autenticado
        $data['NIF_usuario'] = $usuario['NIF'];
        
        // Crear la incidencia
        $resultado = $incidencia->crear($data);
        echo json_encode($resultado);
        break;
        
    case 'PUT':
        // Verificar si se proporcionó un ID
        if (!isset($_GET['id'])) {
            echo json_encode([
                'success' => false,
                'message' => 'Se requiere un ID para actualizar la incidencia'
            ]);
            break;
        }
        
        $id = $_GET['id'];
        $incidenciaExistente = $incidencia->obtenerPorId($id);
        
        // Verificar que la incidencia existe
        if (!$incidenciaExistente) {
            echo json_encode([
                'success' => false,
                'message' => 'La incidencia no existe'
            ]);
            break;
        }
        
        // Verificar permisos (solo admin puede actualizar, o el usuario puede actualizar sus propias incidencias)
        if ($usuario['rol'] !== 'admin' && $incidenciaExistente['NIF_usuario'] !== $usuario['NIF']) {
            echo json_encode([
                'success' => false,
                'message' => 'No tiene permisos para actualizar esta incidencia'
            ]);
            break;
        }
        
        // Actualizar la incidencia
        $resultado = $incidencia->actualizar($id, $data);
        echo json_encode($resultado);
        break;
        
    case 'DELETE':
        // Verificar si se proporcionó un ID
        if (!isset($_GET['id'])) {
            echo json_encode([
                'success' => false,
                'message' => 'Se requiere un ID para eliminar la incidencia'
            ]);
            break;
        }
        
        $id = $_GET['id'];
        $incidenciaExistente = $incidencia->obtenerPorId($id);
        
        // Verificar que la incidencia existe
        if (!$incidenciaExistente) {
            echo json_encode([
                'success' => false,
                'message' => 'La incidencia no existe'
            ]);
            break;
        }
        
        // Solo el administrador puede eliminar incidencias
        if ($usuario['rol'] !== 'admin') {
            echo json_encode([
                'success' => false,
                'message' => 'Solo los administradores pueden eliminar incidencias'
            ]);
            break;
        }
        
        // Eliminar la incidencia
        $resultado = $incidencia->eliminar($id);
        echo json_encode($resultado);
        break;
        
    default:
        echo json_encode([
            'success' => false,
            'message' => 'Método no soportado'
        ]);
}
?>
