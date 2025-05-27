<?php
// Configurar cookies antes de cualquier salida
ini_set('session.cookie_lifetime', '86400');    // 24 horas
ini_set('session.gc_maxlifetime', '86400');     // 24 horas
ini_set('session.use_strict_mode', '1');        // Modo estricto para seguridad
ini_set('session.cookie_httponly', '1');        // Prevenir acceso JS a la cookie
ini_set('session.use_only_cookies', '1');       // Solo usar cookies para sesiones
ini_set('session.cookie_samesite', 'Lax');      // Configuración más compatible

// Iniciar sesión
session_start();

// Obtener el origen de la solicitud
$origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';

// Lista de orígenes permitidos
$allowed_origins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:63975',  // Origen del proxy de Cascade
    'http://localhost:63975',
    'https://asp-natural-annually.ngrok-free.app'  // Dominio de ngrok actual
];

// Verificar si el origen está permitido
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

require_once "../modelos/bd.php";
$modelo = new db();

// Inicio de sesión
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_GET['action']) && $_GET['action'] === 'login') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($data['email']) || !isset($data['password'])) {
        echo json_encode(['success' => false, 'message' => 'Datos incompletos']);
        exit();
    }
    
    $email = $data['email'];
    $password = $data['password'];
    
    // Verificar si la tabla tiene la estructura esperada
    $checkTableQuery = "SHOW COLUMNS FROM usuarios";
    $tableResult = $modelo->getConn()->query($checkTableQuery);
    $columns = [];
    
    if ($tableResult) {
        while ($row = $tableResult->fetch_assoc()) {
            $columns[] = $row['Field'];
        }
    }
    
    // Determinar los nombres de columna correctos
    $emailField = in_array('email', $columns) ? 'email' : 'correo';
    $passwordField = in_array('pswd', $columns) ? 'pswd' : 'password';
    $idField = in_array('NIF', $columns) ? 'NIF' : 'id';
    $avatarField = 'id_avatar'; // Usar siempre id_avatar como nombre de columna
    
    // Construir la consulta con los nombres de columna correctos
    $query = "SELECT u.*, a.id as avatar_id, a.ruta, a.categoria, a.color_fondo FROM usuarios u 
              LEFT JOIN avatares a ON u.$avatarField = a.id 
              WHERE u.$emailField = ?";
    
    // Añadir condición de activo si existe la columna
    if (in_array('activo', $columns)) {
        $query .= " AND u.activo = 1";
    }
    
    // Preparar y ejecutar la consulta con manejo de errores
    $stmt = $modelo->getConn()->prepare($query);
    
    if ($stmt === false) {
        echo json_encode([
            'success' => false, 
            'message' => 'Error en la preparación de la consulta: ' . $modelo->getConn()->error,
            'query' => $query,
            'columns' => $columns
        ]);
        exit();
    }
    
    $stmt->bind_param("s", $email);
    
    if (!$stmt->execute()) {
        echo json_encode([
            'success' => false, 
            'message' => 'Error al ejecutar la consulta: ' . $stmt->error
        ]);
        exit();
    }
    
    $result = $stmt->get_result();
    
    if ($result->num_rows > 0) {
        $usuario = $result->fetch_assoc();
        
        // Verificar contraseña (usando el campo correcto)
        $storedPassword = $usuario[$passwordField] ?? '';
        
        if (password_verify($password, $storedPassword) || $password === $storedPassword) {
            // Generar un ID de sesión seguro
            session_regenerate_id(true);
            
            // Establecer variables de sesión
            $_SESSION['NIF'] = $usuario[$idField];
            $_SESSION['tipo_usuario'] = $usuario['tipo_Usu'] ?? $usuario['tipo_usuario'] ?? 'empleado';
            $_SESSION['avatar'] = $usuario[$avatarField] ?? null;
            $_SESSION['nombre'] = $usuario['nombre'];
            $_SESSION['apellidos'] = $usuario['apellidos'] ?? '';
            
            // Verificar que la sesión se ha iniciado correctamente
            if (!isset($_SESSION['NIF']) || empty($_SESSION['NIF'])) {
                echo json_encode(["error" => "Error al iniciar sesión"]);
                exit();
            }
            
            // Crear objeto de respuesta sin incluir la contraseña
            $usuarioResponse = [
                'id' => $usuario[$idField],
                'nombre' => $usuario['nombre'],
                'apellidos' => $usuario['apellidos'] ?? '',
                'correo' => $usuario[$emailField],
                'tipo_usuario' => $usuario['tipo_Usu'] ?? $usuario['tipo_usuario'] ?? 'empleado',
                'dpto' => $usuario['dpto'] ?? '',
                'centro' => $usuario['centro'] ?? '',
                'id_avatar' => $usuario[$avatarField] ?? null,
                'permitir_pausas' => isset($usuario['permitir_pausas']) ? (int)$usuario['permitir_pausas'] : 0
            ];
            
            // Log para debugging
            error_log('Valor de permitir_pausas en login: ' . (isset($usuario['permitir_pausas']) ? $usuario['permitir_pausas'] : 'no definido'));
            
            // Si tiene avatar, incluir la información
            if ($usuario[$avatarField]) {
                // Obtener el ID del avatar de la tabla avatares
                $avatarId = $usuario[$avatarField];
                
                $avatarData = [
                    'id' => $avatarId,
                    'ruta' => $usuario['ruta'],
                    'categoria' => $usuario['categoria'],
                    'color_fondo' => $usuario['color_fondo']
                ];
                
                // Asegurarse de que la ruta sea absoluta
                if (isset($avatarData['ruta']) && !preg_match('/^https?:\/\//', $avatarData['ruta'])) {
                    $avatarData['ruta'] = 'http://' . $_SERVER['HTTP_HOST'] . '/ImpulsaTelecom/frontend' . $avatarData['ruta'];
                }
                
                $usuarioResponse['avatar'] = $avatarData;
            }
            
            echo json_encode([
                'success' => true, 
                'usuario' => $usuarioResponse,
                'message' => 'Inicio de sesión exitoso'
            ]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Contraseña incorrecta']);
        }
    } else {
        echo json_encode(['success' => false, 'message' => 'Usuario no encontrado o inactivo']);
    }
    
    exit();
}

// Actualizar información de usuario
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_GET['action']) && $_GET['action'] === 'update' && isset($_GET['id'])) {
    $userId = $_GET['id'];
    $data = json_decode(file_get_contents('php://input'), true);
    
    // Validar que existan los campos mínimos
    if (!isset($data['nombre'])) {
        echo json_encode(['success' => false, 'message' => 'Datos incompletos']);
        exit();
    }
    
    // Verificar si la tabla tiene la estructura esperada
    $checkTableQuery = "SHOW COLUMNS FROM usuarios";
    $tableResult = $modelo->getConn()->query($checkTableQuery);
    $columns = [];
    
    if ($tableResult) {
        while ($row = $tableResult->fetch_assoc()) {
            $columns[] = $row['Field'];
        }
    }
    
    // Determinar los nombres de columna correctos
    $emailField = in_array('email', $columns) ? 'email' : 'correo';
    $passwordField = in_array('pswd', $columns) ? 'pswd' : 'password';
    $idField = in_array('NIF', $columns) ? 'NIF' : 'id';
    $avatarField = 'id_avatar'; // Usar siempre id_avatar como nombre de columna
    
    // Verificar si existe la columna permitir_pausas
    $permitirPausasField = in_array('permitir_pausas', $columns) ? 'permitir_pausas' : null;
    
    // Verificar si existe la columna telefono
    $telefonoField = in_array('telefono', $columns) ? 'telefono' : null;
    
    // Construir la consulta SQL base
    $updateFields = [
        "nombre = ?"
    ];
    
    $params = [
        $data['nombre']
    ];
    
    $types = "s"; // string
    
    // Añadir campo email/correo
    $updateFields[] = "$emailField = ?";
    $params[] = $data['correo'];
    $types .= "s"; // string
    
    // Añadir campo telefono si existe
    if ($telefonoField && isset($data['telefono'])) {
        $updateFields[] = "$telefonoField = ?";
        $params[] = $data['telefono'] ?? null;
        $types .= "s"; // string
    }
    
    // Añadir campo avatar
    $updateFields[] = "$avatarField = ?";
    $params[] = $data['id_avatar'] !== '' ? $data['id_avatar'] : null;
    $types .= "i"; // integer
    
    // Añadir campo permitir_pausas si existe
    if ($permitirPausasField && isset($data['permitir_pausas'])) {
        $updateFields[] = "$permitirPausasField = ?";
        $params[] = $data['permitir_pausas'] ? 1 : 0;
        $types .= "i"; // integer
    }
    
    // Añadir campo password si se proporciona una nueva contraseña
    if (isset($data['password']) && !empty($data['password'])) {
        $updateFields[] = "$passwordField = ?";
        // Hashear la contraseña para almacenarla de forma segura
        $hashedPassword = password_hash($data['password'], PASSWORD_DEFAULT);
        $params[] = $hashedPassword;
        $types .= "s"; // string
    }
    
    // Iniciar transacción
    $modelo->getConn()->begin_transaction();
    
    try {
        // Preparar la consulta base según la estructura real de la base de datos
        $query = "UPDATE usuarios SET " . implode(", ", $updateFields) . " WHERE $idField = ?";
        $params[] = $userId;
        $types .= "s";
        
        // Preparar y ejecutar la consulta
        $stmt = $modelo->getConn()->prepare($query);
        
        if ($stmt === false) {
            throw new Exception("Error en la preparación de la consulta: " . $modelo->getConn()->error);
        }
        
        $stmt->bind_param($types, ...$params);
        
        if (!$stmt->execute()) {
            throw new Exception("Error al ejecutar la consulta: " . $stmt->error);
        }
        
        // Verificar si se actualizó correctamente
        if ($stmt->affected_rows > 0 || $stmt->errno === 0) {
            $modelo->getConn()->commit();
            echo json_encode(['success' => true, 'message' => 'Usuario actualizado correctamente']);
        } else {
            throw new Exception("No se pudo actualizar el usuario");
        }
    } catch (Exception $e) {
        $modelo->getConn()->rollback();
        echo json_encode(['success' => false, 'message' => 'Error al actualizar: ' . $e->getMessage()]);
    }
    
    exit();
}

// Obtener información de un usuario
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['id'])) {
    $userId = $_GET['id'];
    
    // Verificar si la tabla tiene la estructura esperada
    $checkTableQuery = "SHOW COLUMNS FROM usuarios";
    $tableResult = $modelo->getConn()->query($checkTableQuery);
    $columns = [];
    
    if ($tableResult) {
        while ($row = $tableResult->fetch_assoc()) {
            $columns[] = $row['Field'];
        }
    }
    
    // Determinar los nombres de columna correctos
    $idField = in_array('NIF', $columns) ? 'NIF' : 'id';
    $emailField = in_array('email', $columns) ? 'email' : 'correo';
    $tipoUsuarioField = in_array('tipo_Usu', $columns) ? 'tipo_Usu' : 'tipo_usuario';
    $avatarField = 'id_avatar'; // Usar siempre id_avatar como nombre de columna
    
    // Construir la consulta con los nombres de columna correctos
    $query = "SELECT u.*, a.id as avatar_id, a.ruta, a.categoria, a.color_fondo FROM usuarios u 
              LEFT JOIN avatares a ON u.$avatarField = a.id 
              WHERE u.$idField = ?";
    
    // Añadir condición de activo si existe la columna
    if (in_array('activo', $columns)) {
        $query .= " AND u.activo = 1";
    }
    
    // Preparar y ejecutar la consulta con manejo de errores
    $stmt = $modelo->getConn()->prepare($query);
    
    if ($stmt === false) {
        echo json_encode([
            'success' => false, 
            'message' => 'Error en la preparación de la consulta: ' . $modelo->getConn()->error,
            'query' => $query
        ]);
        exit();
    }
    
    $stmt->bind_param("s", $userId);
    
    if (!$stmt->execute()) {
        echo json_encode([
            'success' => false, 
            'message' => 'Error al ejecutar la consulta: ' . $stmt->error
        ]);
        exit();
    }
    
    $result = $stmt->get_result();
    
    if ($result->num_rows > 0) {
        $usuario = $result->fetch_assoc();
        
        // Crear objeto de respuesta sin incluir la contraseña
        $usuarioResponse = [
            'id' => $usuario[$idField],
            'nombre' => $usuario['nombre'],
            'apellidos' => $usuario['apellidos'] ?? '',
            'correo' => $usuario[$emailField] ?? '',
            'tipo_usuario' => $usuario[$tipoUsuarioField] ?? 'empleado',
            'dpto' => $usuario['dpto'] ?? '',
            'centro' => $usuario['centro'] ?? '',
            'id_avatar' => $usuario[$avatarField] ?? null,
            'permitir_pausas' => isset($usuario['permitir_pausas']) ? (int)$usuario['permitir_pausas'] : 0
        ];
        
        // Si tiene avatar, incluir la información
        if ($usuario[$avatarField]) {
            $avatarData = [
                'id' => $usuario[$avatarField],
                'ruta' => $usuario['ruta'],
                'categoria' => $usuario['categoria'],
                'color_fondo' => $usuario['color_fondo']
            ];
            
            // Asegurarse de que la ruta sea absoluta
            if (isset($avatarData['ruta']) && !empty($avatarData['ruta']) && !preg_match('/^https?:\/\//', $avatarData['ruta'])) {
                $avatarData['ruta'] = 'http://' . $_SERVER['HTTP_HOST'] . '/ImpulsaTelecom/frontend' . $avatarData['ruta'];
            }
            
            $usuarioResponse['avatar'] = $avatarData;
        }
        
        echo json_encode(['success' => true, 'usuario' => $usuarioResponse]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Usuario no encontrado']);
    }
    
    exit();
}

// Obtener lista de usuarios
if ($_SERVER['REQUEST_METHOD'] === 'GET' && !isset($_GET['id'])) {
    // Verificar si la tabla tiene la estructura esperada
    $checkTableQuery = "SHOW COLUMNS FROM usuarios";
    $tableResult = $modelo->getConn()->query($checkTableQuery);
    $columns = [];
    
    if ($tableResult) {
        while ($row = $tableResult->fetch_assoc()) {
            $columns[] = $row['Field'];
        }
    }
    
    // Determinar los nombres de columna correctos
    $idField = in_array('NIF', $columns) ? 'NIF' : 'id';
    $emailField = in_array('email', $columns) ? 'email' : 'correo';
    $tipoUsuarioField = in_array('tipo_Usu', $columns) ? 'tipo_Usu' : 'tipo_usuario';
    $avatarField = 'id_avatar'; // Usar siempre id_avatar como nombre de columna
    
    // Construir la consulta con los nombres de columna correctos
    $query = "SELECT $idField, nombre";
    
    // Añadir campos opcionales si existen
    if (in_array('apellidos', $columns)) {
        $query .= ", apellidos";
    }
    
    if (in_array($emailField, $columns)) {
        $query .= ", $emailField";
    }
    
    if (in_array('dpto', $columns)) {
        $query .= ", dpto";
    }
    
    if (in_array('centro', $columns)) {
        $query .= ", centro";
    }
    
    if (in_array($tipoUsuarioField, $columns)) {
        $query .= ", $tipoUsuarioField";
    }
    
    if (in_array($avatarField, $columns)) {
        $query .= ", $avatarField";
    }
    
    // Añadir id_horario si existe la columna
    if (in_array('id_horario', $columns)) {
        $query .= ", id_horario";
    }
    
    // Añadir permitir_pausas si existe la columna
    if (in_array('permitir_pausas', $columns)) {
        $query .= ", permitir_pausas";
    }
    
    $query .= " FROM usuarios";
    
    // Añadir condición de activo si existe la columna
    if (in_array('activo', $columns)) {
        $query .= " WHERE activo = 1";
    }
    
    // Si se solicita incluir información de avatares
    $includeAvatars = isset($_GET['include_avatars']) && $_GET['include_avatars'] === 'true';
    
    // Ejecutar la consulta con manejo de errores
    $result = $modelo->getConn()->query($query);
    
    if ($result === false) {
        echo json_encode([
            'success' => false, 
            'message' => 'Error al ejecutar la consulta: ' . $modelo->getConn()->error,
            'query' => $query
        ]);
        exit();
    }
    
    $usuarios = [];
    while ($row = $result->fetch_assoc()) {
        $usuario = [
            'id' => $row[$idField],
            'nombre' => $row['nombre'],
            'apellidos' => $row['apellidos'] ?? '',
            'correo' => $row[$emailField] ?? '',
            'dpto' => $row['dpto'] ?? '',
            'centro' => $row['centro'] ?? '',
            'tipo_usuario' => $row[$tipoUsuarioField] ?? 'empleado',
            'id_avatar' => $row[$avatarField] ?? null,
            'id_horario' => $row['id_horario'] ?? null,
            'permitir_pausas' => isset($row['permitir_pausas']) ? (int)$row['permitir_pausas'] : 0
        ];
        
        // Si se ha solicitado incluir datos completos de avatares y el usuario tiene un avatar
        if ($includeAvatars && !empty($row[$avatarField])) {
            // Consultar información del avatar
            $avatarQuery = "SELECT * FROM avatares WHERE id = ?";
            $avatarStmt = $modelo->getConn()->prepare($avatarQuery);
            $avatarStmt->bind_param("i", $row[$avatarField]);
            $avatarStmt->execute();
            $avatarResult = $avatarStmt->get_result();
            
            if ($avatarResult && $avatarResult->num_rows > 0) {
                $avatarData = $avatarResult->fetch_assoc();
                
                // Asegurarse de que la ruta sea absoluta
                if (!empty($avatarData['ruta']) && !preg_match('/^https?:\/\//', $avatarData['ruta'])) {
                    $avatarData['ruta'] = 'http://' . $_SERVER['HTTP_HOST'] . '/ImpulsaTelecom/frontend' . $avatarData['ruta'];
                }
                
                $usuario['avatar'] = [
                    'id' => $avatarData['id'],
                    'ruta' => $avatarData['ruta'],
                    'categoria' => $avatarData['categoria'] ?? '',
                    'color_fondo' => $avatarData['color_fondo'] ?? '#f3f4f6'
                ];
            }
        }
        
        $usuarios[] = $usuario;
    }
    
    echo json_encode(['success' => true, 'usuarios' => $usuarios]);
    exit();
} 

// Crear nuevo usuario
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_GET['action']) && $_GET['action'] === 'create') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    // Validar que existan los campos mínimos
    if (!isset($data['nombre']) || !isset($data['correo']) || !isset($data['password']) || !isset($data['nif'])) {
        echo json_encode(['success' => false, 'message' => 'Datos incompletos']);
        exit();
    }
    
    // Verificar si la tabla tiene la estructura esperada
    $checkTableQuery = "SHOW COLUMNS FROM usuarios";
    $tableResult = $modelo->getConn()->query($checkTableQuery);
    $columns = [];
    
    if ($tableResult) {
        while ($row = $tableResult->fetch_assoc()) {
            $columns[] = $row['Field'];
        }
    }
    
    // Determinar los nombres de columna correctos
    $emailField = in_array('email', $columns) ? 'email' : 'correo';
    $passwordField = in_array('pswd', $columns) ? 'pswd' : 'password';
    $idField = in_array('NIF', $columns) ? 'NIF' : 'id';
    $tipoUsuarioField = in_array('tipo_Usu', $columns) ? 'tipo_Usu' : 'tipo_usuario';
    $avatarField = 'id_avatar'; // Usar siempre id_avatar como nombre de columna
    
    // Verificar si existe la columna permitir_pausas
    $permitirPausasField = in_array('permitir_pausas', $columns) ? 'permitir_pausas' : null;
    
    // Verificar si existe la columna telefono
    $telefonoField = in_array('telefono', $columns) ? 'telefono' : null;
    
    // Verificar si el usuario ya existe
    $checkQuery = "SELECT * FROM usuarios WHERE $idField = ?";
    $checkStmt = $modelo->getConn()->prepare($checkQuery);
    $checkStmt->bind_param("s", $data['nif']);
    $checkStmt->execute();
    $checkResult = $checkStmt->get_result();
    
    if ($checkResult->num_rows > 0) {
        // Verificar si el usuario está inactivo
        $existingUser = $checkResult->fetch_assoc();
        if (in_array('activo', $columns) && isset($existingUser['activo']) && $existingUser['activo'] == 0) {
            echo json_encode([
                'success' => false, 
                'message' => 'Usuario inactivo', 
                'userExists' => true, 
                'isInactive' => true,
                'userId' => $existingUser[$idField]
            ]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Ya existe un usuario con ese NIF']);
        }
        exit();
    }
    
    // Verificar si el correo ya está en uso
    $checkEmailQuery = "SELECT * FROM usuarios WHERE $emailField = ?";
    $checkEmailStmt = $modelo->getConn()->prepare($checkEmailQuery);
    $checkEmailStmt->bind_param("s", $data['correo']);
    $checkEmailStmt->execute();
    $checkEmailResult = $checkEmailStmt->get_result();
    
    if ($checkEmailResult->num_rows > 0) {
        echo json_encode(['success' => false, 'message' => 'El correo electrónico ya está en uso']);
        exit();
    }
    
    // Construir la consulta SQL para insertar
    $fields = [$idField, "nombre", $emailField, $passwordField];
    $values = ["?", "?", "?", "?"];
    $params = [$data['nif'], $data['nombre'], $data['correo']];
    
    // Hashear la contraseña para almacenarla de forma segura
    $hashedPassword = password_hash($data['password'], PASSWORD_DEFAULT);
    $params[] = $hashedPassword;
    
    $types = "ssss"; // string, string, string, string
    
    // Añadir campo apellidos si se proporciona
    if (isset($data['apellidos']) && in_array('apellidos', $columns)) {
        $fields[] = "apellidos";
        $values[] = "?";
        $params[] = $data['apellidos'];
        $types .= "s"; // string
    }
    
    // Añadir campo telefono si existe y se proporciona
    if ($telefonoField && isset($data['telefono'])) {
        $fields[] = $telefonoField;
        $values[] = "?";
        $params[] = $data['telefono'];
        $types .= "s"; // string
    }
    
    // Añadir campo dpto si se proporciona
    if (isset($data['dpto']) && in_array('dpto', $columns)) {
        $fields[] = "dpto";
        $values[] = "?";
        $params[] = $data['dpto'];
        $types .= "s"; // string
    }
    
    // Añadir campo tipo_usuario
    if (isset($data['tipo_usuario'])) {
        $fields[] = $tipoUsuarioField;
        $values[] = "?";
        $params[] = $data['tipo_usuario'];
        $types .= "s"; // string
    }
    
    // Añadir campo avatar si se proporciona
    if (isset($data['id_avatar'])) {
        $fields[] = $avatarField;
        $values[] = "?";
        $params[] = $data['id_avatar'] !== '' ? $data['id_avatar'] : null;
        $types .= "i"; // integer
    }
    
    // Añadir campo permitir_pausas si existe
    if ($permitirPausasField) {
        $fields[] = $permitirPausasField;
        $values[] = "?";
        $params[] = isset($data['permitir_pausas']) && $data['permitir_pausas'] ? 1 : 0;
        $types .= "i"; // integer
    }
    
    // Añadir campo activo si existe
    if (in_array('activo', $columns)) {
        $fields[] = "activo";
        $values[] = "?";
        $params[] = 1; // Por defecto, el usuario está activo
        $types .= "i"; // integer
    }
    
    // Iniciar transacción
    $modelo->getConn()->begin_transaction();
    
    try {
        // Preparar la consulta de inserción
        $query = "INSERT INTO usuarios (" . implode(", ", $fields) . ") VALUES (" . implode(", ", $values) . ")";
        
        // Preparar y ejecutar la consulta
        $stmt = $modelo->getConn()->prepare($query);
        
        if ($stmt === false) {
            throw new Exception("Error en la preparación de la consulta: " . $modelo->getConn()->error);
        }
        
        $stmt->bind_param($types, ...$params);
        
        if (!$stmt->execute()) {
            throw new Exception("Error al ejecutar la consulta: " . $stmt->error);
        }
        
        // Verificar si se insertó correctamente
        if ($stmt->affected_rows > 0) {
            $modelo->getConn()->commit();
            echo json_encode(['success' => true, 'message' => 'Usuario creado correctamente']);
        } else {
            throw new Exception("No se pudo crear el usuario");
        }
    } catch (Exception $e) {
        $modelo->getConn()->rollback();
        echo json_encode(['success' => false, 'message' => 'Error al crear usuario: ' . $e->getMessage()]);
    }
    
    exit();
}

// Eliminar usuario
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_GET['action']) && $_GET['action'] === 'delete' && isset($_GET['id'])) {
    $userId = $_GET['id'];
    
    // Verificar si la tabla tiene la estructura esperada
    $checkTableQuery = "SHOW COLUMNS FROM usuarios";
    $tableResult = $modelo->getConn()->query($checkTableQuery);
    $columns = [];
    
    if ($tableResult) {
        while ($row = $tableResult->fetch_assoc()) {
            $columns[] = $row['Field'];
        }
    }
    
    // Determinar el nombre de columna correcto para el ID
    $idField = in_array('NIF', $columns) ? 'NIF' : 'id';
    
    // Iniciar transacción
    $modelo->getConn()->begin_transaction();
    
    try {
        // Si existe la columna activo, hacer una eliminación lógica
        if (in_array('activo', $columns)) {
            $query = "UPDATE usuarios SET activo = 0 WHERE $idField = ?";
        } else {
            // Si no existe, hacer una eliminación física
            $query = "DELETE FROM usuarios WHERE $idField = ?";
        }
        
        // Preparar y ejecutar la consulta
        $stmt = $modelo->getConn()->prepare($query);
        
        if ($stmt === false) {
            throw new Exception("Error en la preparación de la consulta: " . $modelo->getConn()->error);
        }
        
        $stmt->bind_param("s", $userId);
        
        if (!$stmt->execute()) {
            throw new Exception("Error al ejecutar la consulta: " . $stmt->error);
        }
        
        // Verificar si se eliminó correctamente
        if ($stmt->affected_rows > 0) {
            $modelo->getConn()->commit();
            echo json_encode(['success' => true, 'message' => 'Usuario eliminado correctamente']);
        } else {
            throw new Exception("No se pudo eliminar el usuario o no existe");
        }
    } catch (Exception $e) {
        $modelo->getConn()->rollback();
        echo json_encode(['success' => false, 'message' => 'Error al eliminar usuario: ' . $e->getMessage()]);
    }
    
    exit();
}

// Reactivar usuario que estaba dado de baja
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_GET['action']) && $_GET['action'] === 'reactivate' && isset($_GET['id'])) {
    $userId = $_GET['id'];
    $data = json_decode(file_get_contents('php://input'), true);
    
    // Verificar si la tabla tiene la estructura esperada
    $checkTableQuery = "SHOW COLUMNS FROM usuarios";
    $tableResult = $modelo->getConn()->query($checkTableQuery);
    $columns = [];
    
    if ($tableResult) {
        while ($row = $tableResult->fetch_assoc()) {
            $columns[] = $row['Field'];
        }
    }
    
    // Determinar el nombre de columna correcto para el ID
    $idField = in_array('NIF', $columns) ? 'NIF' : 'id';
    
    // Verificar si existe la columna activo
    if (!in_array('activo', $columns)) {
        echo json_encode(['success' => false, 'message' => 'La tabla no tiene un campo de activación']);
        exit();
    }
    
    // Iniciar transacción
    $modelo->getConn()->begin_transaction();
    
    try {
        // Actualizar datos si se proporcionan
        $updateFields = [];
        $updateParams = [];
        $updateTypes = "";
        
        // Si se proporciona contraseña, actualizarla
        if (isset($data['password']) && !empty($data['password'])) {
            $hashedPassword = password_hash($data['password'], PASSWORD_DEFAULT);
            $passwordField = in_array('pswd', $columns) ? 'pswd' : 'password';
            $updateFields[] = "$passwordField = ?";
            $updateParams[] = $hashedPassword;
            $updateTypes .= "s";
        }
        
        // Actualizar otros campos si se proporcionan
        $fieldMappings = [
            'nombre' => 'nombre',
            'apellidos' => 'apellidos',
            'correo' => in_array('email', $columns) ? 'email' : 'correo',
            'telefono' => in_array('telefono', $columns) ? 'telefono' : null,
            'dpto' => 'dpto',
            'id_avatar' => 'id_avatar',
            'tipo_usuario' => in_array('tipo_Usu', $columns) ? 'tipo_Usu' : 'tipo_usuario',
            'permitir_pausas' => in_array('permitir_pausas', $columns) ? 'permitir_pausas' : null
        ];
        
        foreach ($fieldMappings as $key => $field) {
            if ($field && isset($data[$key])) {
                $type = ($key === 'permitir_pausas') ? "i" : "s";
                $value = ($key === 'permitir_pausas') ? ($data[$key] ? 1 : 0) : $data[$key];
                
                $updateFields[] = "$field = ?";
                $updateParams[] = $value;
                $updateTypes .= $type;
            }
        }
        
        // Siempre actualizar el campo activo a 1
        $updateFields[] = "activo = ?";
        $updateParams[] = 1;
        $updateTypes .= "i";
        
        // Preparar la consulta de actualización
        $updateQuery = "UPDATE usuarios SET " . implode(", ", $updateFields) . " WHERE $idField = ?";
        $updateParams[] = $userId;
        $updateTypes .= "s";
        
        // Preparar y ejecutar la consulta
        $stmt = $modelo->getConn()->prepare($updateQuery);
        
        if ($stmt === false) {
            throw new Exception("Error en la preparación de la consulta: " . $modelo->getConn()->error);
        }
        
        // Vincular parámetros dinámicamente
        $stmt->bind_param($updateTypes, ...$updateParams);
        
        if (!$stmt->execute()) {
            throw new Exception("Error al ejecutar la consulta: " . $stmt->error);
        }
        
        // Verificar si se actualizó correctamente
        if ($stmt->affected_rows > 0) {
            $modelo->getConn()->commit();
            echo json_encode(['success' => true, 'message' => 'Usuario reactivado correctamente']);
        } else {
            throw new Exception("No se pudo reactivar el usuario o no existe");
        }
    } catch (Exception $e) {
        $modelo->getConn()->rollback();
        echo json_encode(['success' => false, 'message' => 'Error al reactivar usuario: ' . $e->getMessage()]);
    }
    
    exit();
}

// Endpoint para verificar la sesión del usuario
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action']) && $_GET['action'] === 'verificar') {
    // Respuesta por defecto en caso de error
    $respuesta = [
        'success' => false,
        'message' => 'No hay sesión activa'
    ];
    
    error_log("--- INICIO VERIFICACIÓN DE SESIÓN ---");
    error_log("Datos de sesión: " . json_encode($_SESSION));
    
    if (isset($_SESSION['NIF']) && !empty($_SESSION['NIF'])) {
        $nif = $_SESSION['NIF'];
        error_log("NIF encontrado en sesión: $nif");
        
        // 1. Preparar consulta para obtener usuario
        $stmt = $modelo->getConn()->prepare("SELECT * FROM usuarios WHERE NIF = ?");
        if (!$stmt) {
            $respuesta['message'] = 'Error en la preparación de la consulta';
            echo json_encode($respuesta);
            exit();
        }
        
        // 2. Vincular parámetros y ejecutar
        $stmt->bind_param("s", $nif);
        if (!$stmt->execute()) {
            $respuesta['message'] = 'Error al ejecutar la consulta';
            echo json_encode($respuesta);
            exit();
        }
        
        // 3. Obtener resultado
        $result = $stmt->get_result();
        
        // 4. Si encontramos el usuario en la base de datos
        if ($result->num_rows > 0) {
            $usuario = $result->fetch_assoc();
            error_log("Usuario encontrado en DB: " . json_encode($usuario));
            
            // 5. Determinar campos correctos
            $checkTableQuery = "SHOW COLUMNS FROM usuarios";
            $tableResult = $modelo->getConn()->query($checkTableQuery);
            $columns = [];
            
            if ($tableResult) {
                while ($row = $tableResult->fetch_assoc()) {
                    $columns[] = $row['Field'];
                }
            }
            
            $emailField = in_array('email', $columns) ? 'email' : 'correo';
            $idField = in_array('NIF', $columns) ? 'NIF' : 'id';
            
            // 6. Crear objeto de usuario
            $usuarioResponse = [
                'id' => $usuario[$idField],
                'NIF' => $usuario[$idField], // Agregar NIF explícitamente
                'nombre' => $usuario['nombre'],
                'apellidos' => $usuario['apellidos'] ?? '',
                'correo' => $usuario[$emailField],
                'tipo_usuario' => $usuario['tipo_Usu'] ?? $usuario['tipo_usuario'] ?? 'empleado'
            ];
            
            // 7. Comprobar id
            if (empty($usuarioResponse['id'])) {
                $usuarioResponse['id'] = $nif;
            }
            
            error_log("Respuesta final: " . json_encode($usuarioResponse));
            
            // 8. Enviar respuesta exitosa
            echo json_encode([
                'success' => true,
                'message' => 'Sesión válida',
                'usuario' => $usuarioResponse
            ]);
        } else {
            // 9. Usuario no encontrado pero con sesión válida
            $usuarioResponse = [
                'id' => $nif,
                'NIF' => $nif,
                'nombre' => $_SESSION['nombre'] ?? 'Usuario',
                'tipo_usuario' => $_SESSION['tipo_usuario'] ?? 'empleado'
            ];
            
            echo json_encode([
                'success' => true,
                'message' => 'Sesión válida (usando datos de sesión)',
                'usuario' => $usuarioResponse
            ]);
        }
    } else {
        // 10. No hay sesión activa
        echo json_encode($respuesta);
    }
    
    error_log("--- FIN VERIFICACIÓN DE SESIÓN ---");
    exit();
}

$modelo->getConn()->close();
?>
