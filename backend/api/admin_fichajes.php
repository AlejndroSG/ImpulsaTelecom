<?php
// Archivo: admin_fichajes.php
// Endpoint para la administraciu00f3n de fichajes

// Iniciar sesiu00f3n si no se ha hecho
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Obtener el origen de la solicitud
$origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';

// Lista de oru00edgenes permitidos
$allowed_origins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:63975',  // Origen del proxy de Cascade
    'http://localhost:63975',
    'https://asp-natural-annually.ngrok-free.app'  // Dominio de ngrok actual
];

// Verificar si el origen estu00e1 permitido
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

// Incluir archivos necesarios
require_once '../modelos/Fichaje.php';

// Verificar si el usuario está autenticado y es admin
function verificarAdmin() {
    if (!isset($_SESSION['NIF'])) {
        echo json_encode([
            'success' => false,
            'error' => 'Usuario no autenticado'
        ]);
        exit();
    }
    
    // Verificar si el usuario es administrador utilizando la conexión directa a la base de datos
    $fichaje = new Fichaje();
    $conn = $fichaje->getConn();
    
    $query = "SELECT * FROM usuarios WHERE NIF = ? AND tipo_Usu = 'admin'";
    $stmt = $conn->prepare($query);
    
    if ($stmt === false) {
        echo json_encode([
            'success' => false,
            'error' => 'Error en la consulta: ' . $conn->error
        ]);
        exit();
    }
    
    $stmt->bind_param("s", $_SESSION['NIF']);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        echo json_encode([
            'success' => false,
            'error' => 'Acceso denegado. Se requiere rol de administrador.'
        ]);
        exit();
    }
    
    $usuario = $result->fetch_assoc();
    return $usuario;
}

// Obtener datos de la solicitud
$request = json_decode(file_get_contents("php://input"), true);

// Si no hay datos en el cuerpo, intentar obtenerlos por GET
if (empty($request)) {
    $request = $_GET;
}

// Determinar acciu00f3n a realizar
$action = isset($request['action']) ? $request['action'] : (isset($_GET['action']) ? $_GET['action'] : '');

// Instanciar modelo de fichajes
$fichajeModel = new Fichaje();

// Responder segu00fan la acciu00f3n solicitada
switch ($action) {
    case 'getAll':
        // Verificar permisos de administrador
        verificarAdmin();
        
        // Preparar filtros
        $filtros = [];
        
        // Filtro por fecha
        if (isset($request['fecha_inicio'])) {
            $filtros['fecha_inicio'] = $request['fecha_inicio'];
        }
        if (isset($request['fecha_fin'])) {
            $filtros['fecha_fin'] = $request['fecha_fin'];
        }
        
        // Filtro por usuario
        if (isset($request['nif'])) {
            $filtros['nif'] = $request['nif'];
        }
        
        // Filtro por departamento
        if (isset($request['departamento'])) {
            $filtros['departamento'] = $request['departamento'];
        }
        
        // Filtro por estado
        if (isset($request['estado'])) {
            $filtros['estado'] = $request['estado'];
        }
        
        // Lu00edmite de resultados
        if (isset($request['limite'])) {
            $filtros['limite'] = intval($request['limite']);
        }
        
        // Registro para depuraciu00f3n
        error_log('Filtros aplicados: ' . json_encode($filtros));
        
        // Obtener todos los fichajes con filtros aplicados
        $result = $fichajeModel->getAllFichajes($filtros);
        
        // Registrar resultado para depuraciu00f3n
        error_log('Resultado de getAllFichajes: ' . json_encode($result));
        
        // Verificar si hay un error en la respuesta
        if (isset($result['success']) && $result['success'] === false) {
            $response = [
                'success' => false,
                'error' => $result['error'] ?? 'Error al obtener fichajes'
            ];
            error_log('Respuesta de error: ' . json_encode($response));
            echo json_encode($response);
        } else {
            // Devolver la respuesta formateada correctamente
            $response = [
                'success' => true,
                'fichajes' => $result['fichajes'] ?? [],
                'total' => $result['total'] ?? 0
            ];
            error_log('Total de fichajes: ' . ($result['total'] ?? 0));
            error_log('Primeros fichajes: ' . json_encode(array_slice($result['fichajes'] ?? [], 0, 2)));
            echo json_encode($response);
        }
        break;
    
    case 'getDepartamentos':
        // Verificar permisos de administrador
        verificarAdmin();
        
        // Obtener todos los departamentos para filtrado usando la conexión directa
        $fichaje = new Fichaje();
        $conn = $fichaje->getConn();
        
        $query = "SELECT DISTINCT departamento FROM usuarios WHERE departamento IS NOT NULL AND departamento != '' ORDER BY departamento";
        $result = $conn->query($query);
        
        if (!$result) {
            echo json_encode([
                'success' => false,
                'error' => 'Error al obtener departamentos: ' . $conn->error
            ]);
            break;
        }
        
        $departamentos = [];
        while ($row = $result->fetch_assoc()) {
            $departamentos[] = $row['departamento'];
        }
        
        echo json_encode([
            'success' => true,
            'departamentos' => $departamentos
        ]);
        break;
    
    default:
        echo json_encode([
            'success' => false,
            'error' => 'Acciu00f3n no vu00e1lida o no especificada'
        ]);
        break;
}
