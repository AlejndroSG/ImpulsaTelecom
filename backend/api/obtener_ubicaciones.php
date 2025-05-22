<?php
header('Content-Type: application/json');

// Manejo dinámico de origen para evitar problemas CORS
$allowed_origins = ['http://localhost:5173', 'http://localhost:3000', 'http://localhost'];
$origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';

if (in_array($origin, $allowed_origins)) {
    header('Access-Control-Allow-Origin: ' . $origin);
} else {
    // Si no es un origen permitido, usamos el primero como predeterminado
    header('Access-Control-Allow-Origin: http://localhost:5173');
}

header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Requested-With');

// Manejar preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Activar registro de errores
ini_set('display_errors', 1);
error_reporting(E_ALL);

// Incluir archivos necesarios
require_once __DIR__ . '/../modelos/bd.php';
// El modelo Usuario.php no es necesario para este script, lo eliminamos
session_start();

// Verificar que el usuario ha iniciado sesión y tiene permisos suficientes (admin o supervisor)
if (!isset($_SESSION['NIF']) || !isset($_SESSION['tipo_usuario']) || ($_SESSION['tipo_usuario'] !== 'admin' && $_SESSION['tipo_usuario'] !== 'supervisor')) {
    echo json_encode([
        'success' => false, 
        'message' => 'Acceso denegado. Se requieren permisos de administrador o supervisor',
        'session_data' => [
            'NIF' => $_SESSION['NIF'] ?? 'no_definido',
            'tipo_usuario' => $_SESSION['tipo_usuario'] ?? 'no_definido'
        ]
    ]);
    exit;
}

// Información de depuración de la sesión - no la mostramos, continuamos con el proceso
$debug_info = [
    'NIF' => $_SESSION['NIF'] ?? 'no disponible',
    'tipo_usuario' => $_SESSION['tipo_usuario'] ?? 'no disponible',
    'session_id' => session_id(),
    'cookies' => $_COOKIE
];

// Conectar a la base de datos
$db = new db();
$conn = $db->getConn();

// Obtener la última localización de cada usuario desde la tabla de registros
// Utilizamos la función MAX para obtener el registro más reciente de cada usuario


// Obtener las ubicaciones más recientes de todos los usuarios
// Usamos un enfoque diferente para evitar problemas con only_full_group_by
$query = "SELECT u.NIF AS id_usuario, u.nombre,
            r.latitud, r.longitud, DATE_FORMAT(r.fecha, '%d/%m/%Y %H:%i:%s') as fecha_actualizacion
         FROM usuarios u
         LEFT JOIN (
            -- Usamos una subconsulta con ORDER BY y LIMIT para cada usuario
            SELECT NIF, latitud, longitud, fecha
            FROM registros
            WHERE latitud IS NOT NULL AND longitud IS NOT NULL
            ORDER BY fecha DESC
            LIMIT 100000
         ) r ON u.NIF = r.NIF
         GROUP BY u.NIF";

try {
    $result = $conn->query($query);
    if ($result === false) {
        throw new Exception('Error al consultar ubicaciones: ' . $conn->error);
    }
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage(),
        'query' => $query
    ]);
    exit;
}

// Obtener los usuarios que NO tienen ubicación registrada
// Simplificamos para usar solo los campos esenciales
$queryUsuariosSinUbicacion = "SELECT u.NIF AS id_usuario, u.nombre
                              FROM usuarios u
                              WHERE u.NIF NOT IN (
                                SELECT DISTINCT NIF FROM registros 
                                WHERE latitud IS NOT NULL AND longitud IS NOT NULL
                              )";

try {
    $resultSinUbicacion = $conn->query($queryUsuariosSinUbicacion);
    if ($resultSinUbicacion === false) {
        throw new Exception('Error al consultar usuarios sin ubicación: ' . $conn->error);
    }
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage(),
        'query' => $queryUsuariosSinUbicacion
    ]);
    exit;
}

$ubicaciones = [];
if ($result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        // Ya no procesamos avatar_ruta porque no lo incluimos en la consulta
        $ubicaciones[] = $row;
    }
}

$usuariosSinUbicacion = [];
if ($resultSinUbicacion->num_rows > 0) {
    while ($row = $resultSinUbicacion->fetch_assoc()) {
        // Ya no procesamos avatar_ruta porque no lo incluimos en la consulta
        $usuariosSinUbicacion[] = $row;
    }
}

// Añadir información sobre la consulta para depuración
$debug = [
    'session' => $debug_info,
    'headers' => getallheaders(),
    'origin' => $origin,
    'modo_debug' => true,
    'query' => $query,
    'query_sin_ubicacion' => $queryUsuariosSinUbicacion
];

echo json_encode([
    'success' => true, 
    'ubicaciones' => $ubicaciones,
    'usuarios_sin_ubicacion' => $usuariosSinUbicacion,
    'total' => count($ubicaciones),
    'sin_ubicacion' => count($usuariosSinUbicacion),
    'debug' => $debug,
    'message' => 'Datos obtenidos de la tabla de registros'
]);

$conn->close();
?>
