<?php
// Configuración de CORS
header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
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

$database = new db();
$conn = $database->getConn();

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
    $tableResult = $conn->query($checkTableQuery);
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
    $stmt = $conn->prepare($query);
    
    if ($stmt === false) {
        echo json_encode([
            'success' => false, 
            'message' => 'Error en la preparación de la consulta: ' . $conn->error,
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
            // Crear objeto de respuesta sin incluir la contraseña
            $usuarioResponse = [
                'id' => $usuario[$idField],
                'nombre' => $usuario['nombre'],
                'apellidos' => $usuario['apellidos'] ?? '',
                'correo' => $usuario[$emailField],
                'tipo_usuario' => $usuario['tipo_Usu'] ?? $usuario['tipo_usuario'] ?? 'empleado',
                'dpto' => $usuario['dpto'] ?? '',
                'centro' => $usuario['centro'] ?? '',
                'id_avatar' => $usuario[$avatarField] ?? null
            ];
            
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
    $tableResult = $conn->query($checkTableQuery);
    $columns = [];
    
    if ($tableResult) {
        while ($row = $tableResult->fetch_assoc()) {
            $columns[] = $row['Field'];
        }
    }
    
    // Determinar los nombres de columna correctos
    $idField = in_array('NIF', $columns) ? 'NIF' : 'id';
    $emailField = in_array('email', $columns) ? 'email' : 'correo';
    $passwordField = in_array('pswd', $columns) ? 'pswd' : 'password';
    $avatarField = 'id_avatar'; // Usar siempre id_avatar como nombre de columna
    
    // Iniciar transacción
    $conn->begin_transaction();
    
    try {
        // Preparar la consulta base según la estructura real de la base de datos
        $query = "UPDATE usuarios SET nombre = ?";
        $params = [$data['nombre']];
        $types = "s";
        
        // Añadir campos opcionales si están presentes y existen en la tabla
        if (isset($data['apellidos']) && in_array('apellidos', $columns)) {
            $query .= ", apellidos = ?";
            $params[] = $data['apellidos'];
            $types .= "s";
        }
        
        if (isset($data['email']) && in_array($emailField, $columns)) {
            $query .= ", $emailField = ?";
            $params[] = $data['email'];
            $types .= "s";
        }
        
        if (isset($data['dpto']) && in_array('dpto', $columns)) {
            $query .= ", dpto = ?";
            $params[] = $data['dpto'];
            $types .= "s";
        }
        
        if (isset($data['centro']) && in_array('centro', $columns)) {
            $query .= ", centro = ?";
            $params[] = $data['centro'];
            $types .= "s";
        }
        
        // Si se proporciona un avatar, actualizarlo
        if (isset($data['id_avatar']) && in_array($avatarField, $columns)) {
            $query .= ", $avatarField = ?";
            $params[] = $data['id_avatar'];
            $types .= "i";
        }
        
        // Si se proporciona una contraseña, actualizarla
        if (isset($data['password']) && !empty($data['password']) && in_array($passwordField, $columns)) {
            $hashedPassword = password_hash($data['password'], PASSWORD_DEFAULT);
            $query .= ", $passwordField = ?";
            $params[] = $hashedPassword;
            $types .= "s";
        }
        
        // Completar la consulta con la condición WHERE
        $query .= " WHERE $idField = ?";
        $params[] = $userId;
        $types .= "s";
        
        // Preparar y ejecutar la consulta
        $stmt = $conn->prepare($query);
        
        if ($stmt === false) {
            throw new Exception("Error en la preparación de la consulta: " . $conn->error);
        }
        
        $stmt->bind_param($types, ...$params);
        
        if (!$stmt->execute()) {
            throw new Exception("Error al ejecutar la consulta: " . $stmt->error);
        }
        
        // Verificar si se actualizó correctamente
        if ($stmt->affected_rows > 0 || $stmt->errno === 0) {
            $conn->commit();
            echo json_encode(['success' => true, 'message' => 'Usuario actualizado correctamente']);
        } else {
            throw new Exception("No se pudo actualizar el usuario");
        }
    } catch (Exception $e) {
        $conn->rollback();
        echo json_encode(['success' => false, 'message' => 'Error al actualizar: ' . $e->getMessage()]);
    }
    
    exit();
}

// Obtener información de un usuario
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['id'])) {
    $userId = $_GET['id'];
    
    // Verificar si la tabla tiene la estructura esperada
    $checkTableQuery = "SHOW COLUMNS FROM usuarios";
    $tableResult = $conn->query($checkTableQuery);
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
    $stmt = $conn->prepare($query);
    
    if ($stmt === false) {
        echo json_encode([
            'success' => false, 
            'message' => 'Error en la preparación de la consulta: ' . $conn->error,
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
            'id_avatar' => $usuario[$avatarField] ?? null
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
    $tableResult = $conn->query($checkTableQuery);
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
    
    $query .= " FROM usuarios";
    
    // Añadir condición de activo si existe la columna
    if (in_array('activo', $columns)) {
        $query .= " WHERE activo = 1";
    }
    
    // Ejecutar la consulta con manejo de errores
    $result = $conn->query($query);
    
    if ($result === false) {
        echo json_encode([
            'success' => false, 
            'message' => 'Error al ejecutar la consulta: ' . $conn->error,
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
            'id_avatar' => $row[$avatarField] ?? null
        ];
        
        $usuarios[] = $usuario;
    }
    
    echo json_encode(['success' => true, 'usuarios' => $usuarios]);
    exit();
}

$conn->close();
?>
