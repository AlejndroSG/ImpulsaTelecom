<?php
// Este archivo ayuda a restaurar la sesión para solicitudes AJAX/Fetch desde diferentes puertos
session_start();

// Habilitar CORS para los orígenes permitidos
$allowed_origins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost'
];

$origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';

if (in_array($origin, $allowed_origins)) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
}

// Para solicitudes OPTIONS (preflight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Comprobar sesión
$session_status = [
    'active' => isset($_SESSION['usuario']),
    'user_info' => isset($_SESSION['usuario']) ? $_SESSION['usuario'] : null
];

// Si recibimos cualquier identificador de usuario en POST o GET, verificamos si podemos restaurar la sesión
if (!$session_status['active']) {
    // Variables para almacenar los diferentes identificadores posibles
    $usuario_id = null;
    $usuario_nif = null;
    $usuario_email = null;
    
    // Intentar obtener los identificadores de diferentes fuentes
    // 1. ID del usuario
    if (isset($_POST['usuario_id'])) {
        $usuario_id = $_POST['usuario_id'];
    } elseif (isset($_GET['usuario_id'])) {
        $usuario_id = $_GET['usuario_id'];
    }
    
    // 2. NIF del usuario
    if (isset($_POST['usuario_nif'])) {
        $usuario_nif = $_POST['usuario_nif'];
    } elseif (isset($_GET['usuario_nif'])) {
        $usuario_nif = $_GET['usuario_nif'];
    }
    
    // 3. Email del usuario
    if (isset($_POST['usuario_email'])) {
        $usuario_email = $_POST['usuario_email'];
    } elseif (isset($_GET['usuario_email'])) {
        $usuario_email = $_GET['usuario_email'];
    }
    
    // Cargar el modelo de usuario - usar ruta absoluta para evitar problemas
    $modelPath = __DIR__ . '/../modelos/Usuario.php';
    if (file_exists($modelPath)) {
        require_once $modelPath;
    } else {
        // Si no existe, verificar rutas alternativas comunes
        $alternativePaths = [
            __DIR__ . '/../../backend/modelos/Usuario.php',
            __DIR__ . '/../../../backend/modelos/Usuario.php',
            __DIR__ . '/../modelo/Usuario.php', // Posible variación de carpeta
            __DIR__ . '/../../modelo/Usuario.php'
        ];
        
        $found = false;
        foreach ($alternativePaths as $path) {
            if (file_exists($path)) {
                require_once $path;
                $found = true;
                error_log("Usuario.php encontrado en ruta alternativa: $path");
                break;
            }
        }
        
        if (!$found) {
            error_log("ERROR CRÍTICO: No se pudo encontrar Usuario.php en ninguna ruta conocida");
            // Usar un enfoque simplificado si no podemos cargar el modelo
            class Usuario {
                public function obtenerUsuarioPorId($id) {
                    return null;
                }
                public function obtenerUsuarioPorNif($nif) {
                    return null;
                }
                public function obtenerUsuarioPorEmail($email) {
                    return null;
                }
            }
        }
    }
    $usuario_model = new Usuario();
    $usuario_data = null;
    
    // Intentar obtener los datos del usuario con los identificadores disponibles, en orden de prioridad
    if ($usuario_id) {
        $usuario_data = $usuario_model->obtenerUsuarioPorId($usuario_id);
    }
    
    if (!$usuario_data && $usuario_nif) {
        $usuario_data = $usuario_model->obtenerUsuarioPorNif($usuario_nif);
    }
    
    if (!$usuario_data && $usuario_email) {
        $usuario_data = $usuario_model->obtenerUsuarioPorEmail($usuario_email);
    }
    
    // Si encontramos datos del usuario, restaurar la sesión
    if ($usuario_data) {
        $_SESSION['usuario'] = $usuario_data;
        $session_status = [
            'active' => true,
            'user_info' => $usuario_data,
            'restored' => true,
            'restored_via' => $usuario_id ? 'id' : ($usuario_nif ? 'nif' : 'email')
        ];
        
        // Log para depuración
        error_log("Sesión restaurada para usuario mediante " . $session_status['restored_via']);
    }
}

// Para fines de depuración, si se solicita
if (isset($_GET['debug_session'])) {
    header('Content-Type: application/json');
    echo json_encode($session_status);
    exit();
}
