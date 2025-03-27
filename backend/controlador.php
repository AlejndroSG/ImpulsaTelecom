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
        
        // Registrar en el log para depuración
        error_log("getRequestData() - Método HTTP: " . $_SERVER['REQUEST_METHOD']);
        
        // Si hay datos en POST
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            // Obtener el contenido JSON
            $json = file_get_contents('php://input');
            error_log("getRequestData() - Contenido JSON recibido: " . $json);
            
            if (!empty($json)) {
                $data = json_decode($json, true);
                if (json_last_error() !== JSON_ERROR_NONE) {
                    error_log("getRequestData() - Error al decodificar JSON: " . json_last_error_msg());
                    $data = [];
                } else {
                    error_log("getRequestData() - Datos JSON decodificados: " . json_encode($data));
                }
            }
            
            // Si no hay datos JSON, usar $_POST
            if (empty($data)) {
                error_log("getRequestData() - No hay datos JSON, usando $_POST");
                $data = $_POST;
                error_log("getRequestData() - Datos POST: " . json_encode($data));
            }
        }
        
        // Si hay datos en GET
        if (empty($data) && !empty($_GET)) {
            error_log("getRequestData() - Usando datos GET");
            $data = $_GET;
            error_log("getRequestData() - Datos GET: " . json_encode($data));
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
                // Obtener fecha y hora actuales si no se proporcionaron
                $fecha = isset($requestData['fecha']) ? $requestData['fecha'] : date('Y-m-d');
                $hora = isset($requestData['hora']) ? $requestData['hora'] : date('H:i:s');
                
                // Obtener latitud y longitud si están disponibles
                $latitud = isset($requestData['latitud']) ? floatval($requestData['latitud']) : null;
                $longitud = isset($requestData['longitud']) ? floatval($requestData['longitud']) : null;
                
                // Registrar en el log para depuración
                error_log("controlador.php - Datos recibidos: " . json_encode($requestData));
                error_log("controlador.php - Registrando entrada con coordenadas: latitud=$latitud, longitud=$longitud");
                
                // Verificar que las coordenadas sean válidas
                if ($latitud === 0 || $longitud === 0) {
                    error_log("controlador.php - Coordenadas con valor cero, posible error");
                }
                
                if ($latitud === null || $longitud === null) {
                    error_log("controlador.php - Coordenadas nulas, verificando datos originales");
                    error_log("controlador.php - latitud original: " . (isset($requestData['latitud']) ? $requestData['latitud'] : 'no definida'));
                    error_log("controlador.php - longitud original: " . (isset($requestData['longitud']) ? $requestData['longitud'] : 'no definida'));
                }
                
                $result = $fichaje->registrarEntrada($id_usuario, $fecha, $hora, $latitud, $longitud);
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
            
        case 'guardar_ubicacion':
            // Verificar que el usuario esté autenticado o que se proporcionó un ID
            $id_usuario = isset($requestData['id_usuario']) ? $requestData['id_usuario'] : (isset($_SESSION['user_id']) ? $_SESSION['user_id'] : null);
            $latitud = isset($requestData['latitud']) ? $requestData['latitud'] : null;
            $longitud = isset($requestData['longitud']) ? $requestData['longitud'] : null;
            
            if ($id_usuario && $latitud !== null && $longitud !== null) {
                // Verificar si existe la tabla de ubicaciones
                $query = "SHOW TABLES LIKE 'ubicaciones_usuarios'";
                $result = $fichaje->getConn()->query($query);
                
                if ($result->num_rows == 0) {
                    // Crear la tabla de ubicaciones
                    $createTable = "CREATE TABLE ubicaciones_usuarios (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        id_usuario VARCHAR(20) NOT NULL,
                        nombre VARCHAR(100),
                        latitud DECIMAL(10, 8) NOT NULL,
                        longitud DECIMAL(11, 8) NOT NULL,
                        fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                        INDEX (id_usuario)
                    )";
                    $fichaje->getConn()->query($createTable);
                }
                
                // Obtener el nombre del usuario
                $nombre = "Usuario";
                if (isset($requestData['nombre'])) {
                    $nombre = $requestData['nombre'];
                } else {
                    // Intentar obtener el nombre de la base de datos
                    $queryNombre = "SELECT nombre FROM usuarios WHERE NIF = ?";
                    $stmtNombre = $fichaje->getConn()->prepare($queryNombre);
                    if ($stmtNombre) {
                        $stmtNombre->bind_param("s", $id_usuario);
                        $stmtNombre->execute();
                        $resultNombre = $stmtNombre->get_result();
                        if ($resultNombre->num_rows > 0) {
                            $rowNombre = $resultNombre->fetch_assoc();
                            $nombre = $rowNombre['nombre'];
                        }
                    }
                }
                
                // Verificar si ya existe un registro para este usuario
                $queryCheck = "SELECT id FROM ubicaciones_usuarios WHERE id_usuario = ?";
                $stmtCheck = $fichaje->getConn()->prepare($queryCheck);
                $stmtCheck->bind_param("s", $id_usuario);
                $stmtCheck->execute();
                $resultCheck = $stmtCheck->get_result();
                
                if ($resultCheck->num_rows > 0) {
                    // Actualizar ubicación existente
                    $queryUpdate = "UPDATE ubicaciones_usuarios SET latitud = ?, longitud = ?, nombre = ? WHERE id_usuario = ?";
                    $stmtUpdate = $fichaje->getConn()->prepare($queryUpdate);
                    $stmtUpdate->bind_param("ddss", $latitud, $longitud, $nombre, $id_usuario);
                    
                    if ($stmtUpdate->execute()) {
                        echo json_encode([
                            'success' => true,
                            'message' => 'Ubicación actualizada correctamente'
                        ]);
                    } else {
                        echo json_encode([
                            'success' => false,
                            'error' => 'Error al actualizar la ubicación'
                        ]);
                    }
                } else {
                    // Insertar nueva ubicación
                    $queryInsert = "INSERT INTO ubicaciones_usuarios (id_usuario, nombre, latitud, longitud) VALUES (?, ?, ?, ?)";
                    $stmtInsert = $fichaje->getConn()->prepare($queryInsert);
                    $stmtInsert->bind_param("ssdd", $id_usuario, $nombre, $latitud, $longitud);
                    
                    if ($stmtInsert->execute()) {
                        echo json_encode([
                            'success' => true,
                            'message' => 'Ubicación guardada correctamente'
                        ]);
                    } else {
                        echo json_encode([
                            'success' => false,
                            'error' => 'Error al guardar la ubicación'
                        ]);
                    }
                }
            } else {
                echo json_encode([
                    'success' => false,
                    'error' => 'Faltan datos para guardar la ubicación'
                ]);
            }
            break;
            
        case 'obtener_ubicaciones':
            // Verificar que el usuario esté autenticado o que se proporcionó un ID
            $id_usuario = isset($requestData['id_usuario']) ? $requestData['id_usuario'] : (isset($_SESSION['user_id']) ? $_SESSION['user_id'] : null);
            
            if ($id_usuario) {
                // Verificar si existe la tabla de ubicaciones
                $query = "SHOW TABLES LIKE 'ubicaciones_usuarios'";
                $result = $fichaje->getConn()->query($query);
                
                if ($result->num_rows == 0) {
                    echo json_encode([
                        'success' => true,
                        'usuarios' => []
                    ]);
                    break;
                }
                
                // Obtener todas las ubicaciones excepto la del usuario actual
                $query = "SELECT id_usuario, nombre, latitud, longitud, fecha_actualizacion 
                          FROM ubicaciones_usuarios 
                          WHERE id_usuario != ? 
                          ORDER BY fecha_actualizacion DESC";
                $stmt = $fichaje->getConn()->prepare($query);
                $stmt->bind_param("s", $id_usuario);
                $stmt->execute();
                $result = $stmt->get_result();
                
                $usuarios = [];
                while ($row = $result->fetch_assoc()) {
                    $usuarios[] = $row;
                }
                
                echo json_encode([
                    'success' => true,
                    'usuarios' => $usuarios
                ]);
            } else {
                echo json_encode([
                    'success' => false,
                    'error' => 'Usuario no autenticado'
                ]);
            }
            break;
            
        case 'actualizar_ubicacion_fichaje':
            // Verificar que el usuario esté autenticado o que se proporcionó un ID
            $id_usuario = isset($requestData['id_usuario']) ? $requestData['id_usuario'] : (isset($_SESSION['user_id']) ? $_SESSION['user_id'] : null);
            $id_fichaje = isset($requestData['id_fichaje']) ? $requestData['id_fichaje'] : null;
            $latitud = isset($requestData['latitud']) ? $requestData['latitud'] : null;
            $longitud = isset($requestData['longitud']) ? $requestData['longitud'] : null;
            
            if ($id_usuario && $id_fichaje && $latitud !== null && $longitud !== null) {
                // Actualizar la ubicación del fichaje
                $query = "UPDATE registros SET latitud = ?, longitud = ? WHERE idRegistro = ? AND NIF = ?";
                $stmt = $fichaje->getConn()->prepare($query);
                $stmt->bind_param("ddis", $latitud, $longitud, $id_fichaje, $id_usuario);
                
                if ($stmt->execute()) {
                    echo json_encode([
                        'success' => true,
                        'message' => 'Ubicación de fichaje actualizada correctamente'
                    ]);
                } else {
                    echo json_encode([
                        'success' => false,
                        'error' => 'Error al actualizar la ubicación del fichaje'
                    ]);
                }
            } else {
                echo json_encode([
                    'success' => false,
                    'error' => 'Faltan datos para actualizar la ubicación del fichaje'
                ]);
            }
            break;
            
        case 'registrar_entrada':
            // Verificar datos requeridos
            if (!isset($requestData['id_usuario']) || !isset($requestData['fecha']) || !isset($requestData['hora'])) {
                echo json_encode(['success' => false, 'message' => 'Faltan datos requeridos']);
                exit;
            }
            
            // Obtener datos de geolocalización si están disponibles
            $latitud = isset($requestData['latitud']) ? $requestData['latitud'] : null;
            $longitud = isset($requestData['longitud']) ? $requestData['longitud'] : null;
            
            // Registrar entrada con geolocalización
            $resultado = $fichaje->registrarEntrada($requestData['id_usuario'], $requestData['fecha'], $requestData['hora'], $latitud, $longitud);
            
            echo json_encode($resultado);
            break;
            
        default:
            echo json_encode([
                'success' => false,
                'error' => 'Acción no reconocida'
            ]);
            break;
    }
?>