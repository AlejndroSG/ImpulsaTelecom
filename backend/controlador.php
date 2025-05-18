<?php
    // Incluir configuración CORS
    include_once "cors.php";
    
    // Incluir los archivos necesarios
    include_once "modelos/Fichaje.php";
    
    // Configurar tipo de contenido
    header("Content-Type: application/json; charset=UTF-8");
    
    // cors.php ya maneja las solicitudes OPTIONS, así que no necesitamos duplicarlo aquí
    
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
                // Obtener parámetros opcionales
                $limite = isset($requestData['limite']) ? intval($requestData['limite']) : null;
                $dias = isset($requestData['dias']) ? intval($requestData['dias']) : null;
                
                $result = $fichaje->getHistorialByUsuario($id_usuario, $limite, $dias);
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
                
                // Obtener latitud y longitud si están disponibles
                $latitud = isset($requestData['latitud']) ? floatval($requestData['latitud']) : null;
                $longitud = isset($requestData['longitud']) ? floatval($requestData['longitud']) : null;
                
                // Registrar en el log para depuración
                error_log("controlador.php - Datos recibidos para salida: " . json_encode($requestData));
                error_log("controlador.php - Registrando salida con coordenadas: latitud=$latitud, longitud=$longitud");
                
                // Verificar que las coordenadas sean válidas
                if ($latitud === 0 || $longitud === 0) {
                    error_log("controlador.php - Coordenadas con valor cero, posible error");
                }
                
                if ($latitud === null || $longitud === null) {
                    error_log("controlador.php - Coordenadas nulas, verificando datos originales");
                    error_log("controlador.php - latitud original: " . (isset($requestData['latitud']) ? $requestData['latitud'] : 'no definida'));
                    error_log("controlador.php - longitud original: " . (isset($requestData['longitud']) ? $requestData['longitud'] : 'no definida'));
                }
                
                $result = $fichaje->registrarSalida($id_usuario, $id_fichaje, $hora, $latitud, $longitud);
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
                // Guardar la ubicación del usuario
                $result = $fichaje->guardarUbicacion($id_usuario, $latitud, $longitud);
                echo json_encode($result);
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
                // Obtener las ubicaciones del usuario
                $result = $fichaje->getUbicacionesByUsuario($id_usuario);
                echo json_encode($result);
            } else {
                echo json_encode([
                    'success' => false,
                    'error' => 'Usuario no autenticado'
                ]);
            }
            break;

        case 'estadisticas':
            // Verificar que el usuario esté autenticado o que se proporcionó un ID
            $id_usuario = isset($requestData['id_usuario']) ? $requestData['id_usuario'] : (isset($_SESSION['user_id']) ? $_SESSION['user_id'] : null);
            $periodo = isset($requestData['periodo']) ? $requestData['periodo'] : 'semana';
            
            if ($id_usuario) {
                // Obtener estadísticas del usuario
                $fichaje = new Fichaje();
                $estadisticas = $fichaje->getEstadisticas($id_usuario, $periodo);
                
                echo json_encode([
                    'success' => true,
                    'estadisticas' => $estadisticas
                ]);
            } else {
                echo json_encode([
                    'success' => false,
                    'error' => 'Usuario no autenticado'
                ]);
            }
            break;
            
        case 'exportar_informe':
            // Verificar que el usuario esté autenticado o que se proporcionó un ID
            $id_usuario = isset($requestData['id_usuario']) ? $requestData['id_usuario'] : (isset($_SESSION['user_id']) ? $_SESSION['user_id'] : null);
            $fecha_inicio = isset($requestData['fecha_inicio']) ? $requestData['fecha_inicio'] : date('Y-m-d', strtotime('-7 days'));
            $fecha_fin = isset($requestData['fecha_fin']) ? $requestData['fecha_fin'] : date('Y-m-d');
            $formato = isset($requestData['formato']) ? $requestData['formato'] : 'pdf';
            
            if ($id_usuario) {
                // Exportar informe
                $fichaje = new Fichaje();
                $resultado = $fichaje->exportarInforme($id_usuario, $fecha_inicio, $fecha_fin, $formato);
                
                if ($resultado['success']) {
                    echo json_encode([
                        'success' => true,
                        'contenido' => base64_encode($resultado['contenido']),
                        'formato' => $formato
                    ]);
                } else {
                    echo json_encode([
                        'success' => false,
                        'error' => $resultado['error']
                    ]);
                }
            } else {
                echo json_encode([
                    'success' => false,
                    'error' => 'Usuario no autenticado'
                ]);
            }
            break;
            
        case 'get_user_data':
            // Verificar que el usuario esté autenticado o que se proporcionó un ID
            $id_usuario = isset($requestData['id_usuario']) ? $requestData['id_usuario'] : (isset($_SESSION['user_id']) ? $_SESSION['user_id'] : null);
            
            if ($id_usuario) {
                // Obtener datos del usuario
                $query = "SELECT nombre, apellidos, email, telefono, permitir_pausas FROM usuarios WHERE NIF = ? LIMIT 1";
                $stmt = $fichaje->getConn()->prepare($query);
                $stmt->bind_param("s", $id_usuario);
                $stmt->execute();
                $result = $stmt->get_result();
                
                if ($result->num_rows > 0) {
                    $usuario = $result->fetch_assoc();
                    echo json_encode([
                        'success' => true,
                        'usuario' => $usuario
                    ]);
                } else {
                    echo json_encode([
                        'success' => false,
                        'error' => 'Usuario no encontrado'
                    ]);
                }
            } else {
                echo json_encode([
                    'success' => false,
                    'error' => 'Usuario no autenticado'
                ]);
            }
            break;
            
        case 'update_user_data':
            // Verificar que el usuario esté autenticado o que se proporcionó un ID
            $id_usuario = isset($requestData['id_usuario']) ? $requestData['id_usuario'] : (isset($_SESSION['user_id']) ? $_SESSION['user_id'] : null);
            
            if ($id_usuario) {
                // Preparar datos para actualizar
                $nombre = isset($requestData['nombre']) ? $requestData['nombre'] : null;
                $apellidos = isset($requestData['apellidos']) ? $requestData['apellidos'] : null;
                $email = isset($requestData['email']) ? $requestData['email'] : null;
                $telefono = isset($requestData['telefono']) ? $requestData['telefono'] : null;
                $permitir_pausas = isset($requestData['permitir_pausas']) ? $requestData['permitir_pausas'] : 0;
                
                // Verificar si se está cambiando la contraseña
                $cambiarPassword = false;
                if (isset($requestData['currentPassword']) && isset($requestData['newPassword']) && !empty($requestData['currentPassword']) && !empty($requestData['newPassword'])) {
                    $currentPassword = $requestData['currentPassword'];
                    $newPassword = $requestData['newPassword'];
                    $cambiarPassword = true;
                    
                    // Verificar contraseña actual
                    $queryPassword = "SELECT password FROM usuarios WHERE NIF = ? LIMIT 1";
                    $stmtPassword = $fichaje->getConn()->prepare($queryPassword);
                    $stmtPassword->bind_param("s", $id_usuario);
                    $stmtPassword->execute();
                    $resultPassword = $stmtPassword->get_result();
                    
                    if ($resultPassword->num_rows > 0) {
                        $userData = $resultPassword->fetch_assoc();
                        if (!password_verify($currentPassword, $userData['password'])) {
                            echo json_encode([
                                'success' => false,
                                'error' => 'La contraseña actual es incorrecta'
                            ]);
                            exit;
                        }
                    }
                }
                
                // Actualizar datos del usuario
                $query = "UPDATE usuarios SET nombre = ?, apellidos = ?, email = ?, telefono = ?, permitir_pausas = ?";
                $params = [$nombre, $apellidos, $email, $telefono, $permitir_pausas];
                $types = "ssssi";
                
                // Añadir cambio de contraseña si es necesario
                if ($cambiarPassword) {
                    $hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);
                    $query .= ", password = ?";
                    $params[] = $hashedPassword;
                    $types .= "s";
                }
                
                $query .= " WHERE NIF = ?";
                $params[] = $id_usuario;
                $types .= "s";
                
                $stmt = $fichaje->getConn()->prepare($query);
                $stmt->bind_param($types, ...$params);
                
                if ($stmt->execute()) {
                    echo json_encode([
                        'success' => true,
                        'message' => 'Datos actualizados correctamente'
                    ]);
                } else {
                    echo json_encode([
                        'success' => false,
                        'error' => 'Error al actualizar los datos: ' . $stmt->error
                    ]);
                }
            } else {
                echo json_encode([
                    'success' => false,
                    'error' => 'Usuario no autenticado'
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
            
        case 'historial_grafico':
            // Verificar que el usuario esté autenticado o que se proporcionó un ID
            $id_usuario = isset($requestData['id_usuario']) ? $requestData['id_usuario'] : (isset($_SESSION['user_id']) ? $_SESSION['user_id'] : null);
            
            if ($id_usuario) {
                // Obtener parámetro opcional de días
                $dias = isset($requestData['dias']) ? intval($requestData['dias']) : 7;
                
                $result = $fichaje->getHistorialGrafico($id_usuario, $dias);
                echo json_encode($result);
            } else {
                echo json_encode([
                    'success' => false,
                    'error' => 'Usuario no autenticado'
                ]);
            }
            break;
            
        case 'horario_usuario':
            // Verificar que el usuario esté autenticado o que se proporcionó un ID
            $id_usuario = isset($requestData['id_usuario']) ? $requestData['id_usuario'] : (isset($_SESSION['user_id']) ? $_SESSION['user_id'] : null);
            
            if ($id_usuario) {
                $result = $fichaje->getHorarioUsuario($id_usuario);
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