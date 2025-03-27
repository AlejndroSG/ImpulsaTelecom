<?php
    // Incluir los archivos necesarios
    include_once "modelos/Fichaje.php";
    
    // Configuración de cabeceras para CORS y JSON
    $origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';
    $allowed_origins = [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:63975',  // Origen del proxy de Cascade
        'http://localhost:63975'
    ];
    
    if (in_array($origin, $allowed_origins)) {
        header("Access-Control-Allow-Origin: $origin");
    } else {
        // Si no se reconoce el origen, permitir localhost por defecto
        header('Access-Control-Allow-Origin: http://localhost:5173');
    }
    
    header("Access-Control-Allow-Credentials: true");
    header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Authorization");
    header("Content-Type: application/json; charset=UTF-8");
    
    // Si es una solicitud OPTIONS, terminar aquí (preflight CORS)
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        exit(0);
    }
    
    // Configurar cookies seguras (antes de iniciar sesión)
    ini_set('session.cookie_httponly', 1);
    ini_set('session.cookie_secure', 0); // Cambiado a 0 para desarrollo local sin HTTPS
    ini_set('session.use_only_cookies', 1);
    
    // Iniciar sesión
    session_start();
    
    // Función para obtener datos de la solicitud (GET o POST)
    function getRequestData() {
        $data = [];
        
        // Si hay datos en POST
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $json = file_get_contents('php://input');
            if (!empty($json)) {
                $data = json_decode($json, true);
                if (json_last_error() !== JSON_ERROR_NONE) {
                    $data = [];
                }
            }
            
            // Si no hay datos JSON, usar $_POST
            if (empty($data)) {
                $data = $_POST;
            }
        }
        
        // Si hay datos en GET
        if (empty($data) && !empty($_GET)) {
            $data = $_GET;
        }
        
        return $data;
    }
    
    // Obtener datos de la solicitud
    $requestData = getRequestData();
    
    // Obtener la acción solicitada
    $action = isset($_GET['action']) ? $_GET['action'] : '';
    
    // Si no hay acción, verificar en los datos de la solicitud
    if (empty($action) && isset($requestData['action'])) {
        $action = $requestData['action'];
    }
    
    // Instanciar modelos
    $fichaje = new Fichaje();
    
    // Manejar las diferentes acciones
    switch ($action) {
        case 'login':
            // Simulación de login para pruebas
            if (isset($requestData['nif']) && isset($requestData['password'])) {
                $nif = $requestData['nif'];
                
                // Guardamos el NIF en la sesión (simulación de login exitoso)
                $_SESSION['user_id'] = $nif;
                
                echo json_encode([
                    'success' => true,
                    'usuario' => [
                        'NIF' => $nif,
                        'nombre' => 'Usuario de Prueba',
                        'rol' => 'empleado'
                    ]
                ]);
            } else {
                echo json_encode([
                    'success' => false,
                    'error' => 'Faltan datos para el inicio de sesión'
                ]);
            }
            break;
            
        case 'logout':
            // Destruir la sesión
            session_unset();
            session_destroy();
            
            echo json_encode([
                'success' => true,
                'message' => 'Sesión cerrada correctamente'
            ]);
            break;
            
        case 'actual':
            // Verificar que el usuario esté autenticado o que se proporcionó un ID
            $id_usuario = isset($requestData['id_usuario']) ? $requestData['id_usuario'] : (isset($_SESSION['user_id']) ? $_SESSION['user_id'] : null);
            
            if ($id_usuario) {
                $result = $fichaje->getFichajeActual($id_usuario);
                echo json_encode($result);
            } else {
                echo json_encode([
                    'success' => false,
                    'error' => 'Usuario no autenticado'
                ]);
            }
            break;
            
        case 'historial':
            // Verificar que el usuario esté autenticado o que se proporcionó un ID
            $id_usuario = isset($requestData['id_usuario']) ? $requestData['id_usuario'] : (isset($_SESSION['user_id']) ? $_SESSION['user_id'] : null);
            
            if ($id_usuario) {
                $result = $fichaje->getHistorialByUsuario($id_usuario);
                echo json_encode($result);
            } else {
                echo json_encode([
                    'success' => false,
                    'error' => 'Usuario no autenticado'
                ]);
            }
            break;
            
        case 'entrada':
            // Verificar que el usuario esté autenticado o que se proporcionó un ID
            $id_usuario = isset($requestData['id_usuario']) ? $requestData['id_usuario'] : (isset($_SESSION['user_id']) ? $_SESSION['user_id'] : null);
            
            if ($id_usuario) {
                // Obtener fecha y hora actuales
                $fecha = date('Y-m-d');
                $hora = date('H:i:s');
                
                $result = $fichaje->registrarEntrada($id_usuario, $fecha, $hora);
                echo json_encode($result);
            } else {
                echo json_encode([
                    'success' => false,
                    'error' => 'Usuario no autenticado'
                ]);
            }
            break;
            
        case 'salida':
            // Verificar que el usuario esté autenticado o que se proporcionó un ID
            $id_usuario = isset($requestData['id_usuario']) ? $requestData['id_usuario'] : (isset($_SESSION['user_id']) ? $_SESSION['user_id'] : null);
            $id_fichaje = isset($requestData['id_fichaje']) ? $requestData['id_fichaje'] : null;
            
            if ($id_usuario && $id_fichaje) {
                // Obtener hora actual
                $hora = date('H:i:s');
                
                $result = $fichaje->registrarSalida($id_usuario, $id_fichaje, $hora);
                echo json_encode($result);
            } else {
                echo json_encode([
                    'success' => false,
                    'error' => 'Faltan datos para registrar la salida'
                ]);
            }
            break;
            
        case 'pausa':
            // Verificar que el usuario esté autenticado o que se proporcionó un ID
            $id_usuario = isset($requestData['id_usuario']) ? $requestData['id_usuario'] : (isset($_SESSION['user_id']) ? $_SESSION['user_id'] : null);
            $id_fichaje = isset($requestData['id_fichaje']) ? $requestData['id_fichaje'] : null;
            
            if ($id_usuario && $id_fichaje) {
                // Obtener hora actual
                $hora = date('H:i:s');
                
                $result = $fichaje->registrarPausa($id_usuario, $id_fichaje, $hora);
                echo json_encode($result);
            } else {
                echo json_encode([
                    'success' => false,
                    'error' => 'Faltan datos para registrar la pausa'
                ]);
            }
            break;
            
        case 'reanudar':
            // Verificar que el usuario esté autenticado o que se proporcionó un ID
            $id_usuario = isset($requestData['id_usuario']) ? $requestData['id_usuario'] : (isset($_SESSION['user_id']) ? $_SESSION['user_id'] : null);
            $id_fichaje = isset($requestData['id_fichaje']) ? $requestData['id_fichaje'] : null;
            
            if ($id_usuario && $id_fichaje) {
                // Obtener hora actual
                $hora = date('H:i:s');
                
                $result = $fichaje->reanudarTrabajo($id_usuario, $id_fichaje, $hora);
                echo json_encode($result);
            } else {
                echo json_encode([
                    'success' => false,
                    'error' => 'Faltan datos para reanudar el trabajo'
                ]);
            }
            break;
            
        case 'nuevo':
            // Verificar que el usuario esté autenticado o que se proporcionó un ID
            $id_usuario = isset($requestData['id_usuario']) ? $requestData['id_usuario'] : (isset($_SESSION['user_id']) ? $_SESSION['user_id'] : null);
            
            if ($id_usuario) {
                // Obtener fecha y hora actuales
                $fecha = date('Y-m-d');
                $hora = date('H:i:s');
                
                $result = $fichaje->registrarEntrada($id_usuario, $fecha, $hora);
                echo json_encode($result);
            } else {
                echo json_encode([
                    'success' => false,
                    'error' => 'Usuario no autenticado'
                ]);
            }
            break;
            
        default:
            echo json_encode([
                'success' => false,
                'error' => 'Acción no reconocida'
            ]);
            break;
    }
?>