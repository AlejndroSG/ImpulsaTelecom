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
header('Access-Control-Allow-Methods: POST, OPTIONS');
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

// Verificar que el usuario ha iniciado sesión
if (!isset($_SESSION['id_usuario'])) {
    echo json_encode(['success' => false, 'message' => 'No hay sesión activa']);
    exit;
}

// Obtener datos de la solicitud POST
$data = json_decode(file_get_contents('php://input'), true);

if (!$data || !isset($data['latitud']) || !isset($data['longitud'])) {
    echo json_encode(['success' => false, 'message' => 'Datos de ubicación incompletos']);
    exit;
}

// Conectar a la base de datos
$db = new BaseDatos();
$conn = $db->getConn();

// Verificar si la tabla de ubicaciones existe
$query = "SHOW TABLES LIKE 'ubicaciones_usuarios'";
$result = $conn->query($query);

if ($result->num_rows == 0) {
    // Crear la tabla si no existe
    $createTableQuery = "CREATE TABLE ubicaciones_usuarios (
        id INT AUTO_INCREMENT PRIMARY KEY,
        id_usuario INT NOT NULL,
        latitud DECIMAL(10, 8) NOT NULL,
        longitud DECIMAL(11, 8) NOT NULL,
        fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON DELETE CASCADE
    )";
    
    if (!$conn->query($createTableQuery)) {
        echo json_encode(['success' => false, 'message' => 'Error al crear la tabla de ubicaciones: ' . $conn->error]);
        exit;
    }
}

// Obtener el ID del usuario desde la sesión o desde los datos enviados
$id_usuario = isset($data['id_usuario']) ? $data['id_usuario'] : $_SESSION['id_usuario'];

// Verificar si ya existe un registro para este usuario
$checkQuery = "SELECT id FROM ubicaciones_usuarios WHERE id_usuario = ?";
$stmt = $conn->prepare($checkQuery);
$stmt->bind_param('i', $id_usuario);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows > 0) {
    // Actualizar el registro existente
    $updateQuery = "UPDATE ubicaciones_usuarios SET latitud = ?, longitud = ? WHERE id_usuario = ?";
    $stmt = $conn->prepare($updateQuery);
    $stmt->bind_param('ddi', $data['latitud'], $data['longitud'], $id_usuario);
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Ubicación actualizada correctamente']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Error al actualizar la ubicación: ' . $stmt->error]);
    }
} else {
    // Insertar un nuevo registro
    $insertQuery = "INSERT INTO ubicaciones_usuarios (id_usuario, latitud, longitud) VALUES (?, ?, ?)";
    $stmt = $conn->prepare($insertQuery);
    $stmt->bind_param('idd', $id_usuario, $data['latitud'], $data['longitud']);
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Ubicación guardada correctamente']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Error al guardar la ubicación: ' . $stmt->error]);
    }
}

$stmt->close();
$conn->close();
?>
