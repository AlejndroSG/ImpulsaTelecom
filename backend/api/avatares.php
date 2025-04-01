<?php
// Obtener el origen de la solicitud
$origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';

// Lista de orígenes permitidos
$allowed_origins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:63975',  // Origen del proxy de Cascade
    'http://localhost:63975'
];

// Verificar si el origen está permitido
if (in_array($origin, $allowed_origins)) {
    header("Access-Control-Allow-Origin: $origin");
} else {
    // Si no se reconoce el origen, permitir localhost por defecto
    header('Access-Control-Allow-Origin: http://localhost:5173');
}

// Resto de cabeceras CORS
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');

// Manejar solicitud OPTIONS (pre-flight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Establecer tipo de contenido para respuestas no-OPTIONS
header('Content-Type: application/json');

include_once '../modelos/bd.php';

// Verificar si la base de datos existe
try {
    $database = new db();
    $conn = $database->getConn();
} catch (Exception $e) {
    echo json_encode(['error' => 'Error de conexión a la base de datos: ' . $e->getMessage()]);
    exit();
}

// Obtener todos los avatares
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (isset($_GET['id'])) {
        // Obtener un avatar específico por ID
        $id = $_GET['id'];
        $query = "SELECT * FROM avatares WHERE id = ? AND activo = 1";
        $stmt = $conn->prepare($query);
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows > 0) {
            $avatar = $result->fetch_assoc();
            // Asegurarse de que la ruta sea absoluta
            if (!preg_match('/^https?:\/\//', $avatar['ruta'])) {
                $avatar['ruta'] = 'http://' . $_SERVER['HTTP_HOST'] . '/ImpulsaTelecom/frontend' . $avatar['ruta'];
            }
            echo json_encode($avatar);
        } else {
            echo json_encode(['error' => 'Avatar no encontrado']);
        }
    } else {
        // Obtener todos los avatares
        $query = "SELECT * FROM avatares WHERE activo = 1 ORDER BY categoria, nombre";
        $result = $conn->query($query);
        
        $avatares = [];
        while ($row = $result->fetch_assoc()) {
            // Asegurarse de que la ruta sea absoluta
            if (!preg_match('/^https?:\/\//', $row['ruta'])) {
                $row['ruta'] = 'http://' . $_SERVER['HTTP_HOST'] . '/ImpulsaTelecom/frontend' . $row['ruta'];
            }
            $avatares[] = $row;
        }
        
        echo json_encode($avatares);
    }
}

// Actualizar el avatar de un usuario
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_GET['action']) && $_GET['action'] === 'update_user_avatar') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($data['usuario_id']) || !isset($data['avatar_id'])) {
        echo json_encode(['success' => false, 'message' => 'Datos incompletos']);
        exit();
    }
    
    $usuario_id = $data['usuario_id'];
    $avatar_id = $data['avatar_id'];
    
    // Actualizar el avatar en la tabla usuarios (usando el campo avatar según bd.php)
    $query = "UPDATE usuarios SET avatar = ? WHERE NIF = ?";
    $stmt = $conn->prepare($query);
    $stmt->bind_param("is", $avatar_id, $usuario_id);
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Avatar actualizado correctamente']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Error al actualizar el avatar: ' . $stmt->error]);
    }
}

$conn->close();
?>
