<?php
// Configurar cookies antes de cualquier salida
ini_set('session.cookie_lifetime', '86400');    // 24 horas
ini_set('session.gc_maxlifetime', '86400');     // 24 horas
ini_set('session.use_strict_mode', '1');        // Modo estricto para seguridad
ini_set('session.cookie_httponly', '1');        // Prevenir acceso JS a la cookie
ini_set('session.use_only_cookies', '1');       // Solo usar cookies para sesiones
ini_set('session.cookie_samesite', 'Lax');      // Configuraciu00f3n mu00e1s compatible

// Iniciar sesiu00f3n
session_start();

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

// Verificar si el usuario estu00e1 autenticado
if (!isset($_SESSION['NIF']) || empty($_SESSION['NIF'])) {
    echo json_encode(['success' => false, 'error' => 'Sesiu00f3n no iniciada', 'requireAuth' => true]);
    exit();
}

// Verificar si el usuario es administrador
if (!isset($_SESSION['tipo_usuario']) || $_SESSION['tipo_usuario'] !== 'admin') {
    echo json_encode(['success' => false, 'error' => 'Acceso denegado. Se requieren permisos de administrador.']);
    exit();
}

require_once "../modelos/bd.php";
$db = new db();
$conn = $db->getConn();

// Funciu00f3n para obtener la ruta del script de recordatorios
function getScriptPath() {
    return __DIR__ . "/../scripts/enviar_recordatorios.php";
}

// Funciu00f3n para ejecutar el script de recordatorios
function ejecutarScript() {
    $scriptPath = getScriptPath();
    
    if (!file_exists($scriptPath)) {
        return ['success' => false, 'error' => 'El script de recordatorios no existe'];
    }
    
    // Ejecutar script en segundo plano
    if (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') {
        // En Windows
        pclose(popen("start /B php \"$scriptPath\" > NUL", "r"));
    } else {
        // En Unix/Linux
        exec("php '$scriptPath' > /dev/null 2>&1 &");
    }
    
    return ['success' => true, 'message' => 'Script ejecutado correctamente'];
}

// Verificar tabla de configuraciu00f3n
function verificarTablaConfig($conn) {
    $verificarTabla = "SHOW TABLES LIKE 'recordatorios_config'";
    $tablaExiste = $conn->query($verificarTabla)->num_rows > 0;
    
    if (!$tablaExiste) {
        $crearTabla = "CREATE TABLE recordatorios_config (
            id INT AUTO_INCREMENT PRIMARY KEY,
            enviar_recordatorio_entrada TINYINT(1) DEFAULT 1,
            enviar_recordatorio_salida TINYINT(1) DEFAULT 1,
            enviar_recordatorio_inicio_pausa TINYINT(1) DEFAULT 1,
            enviar_recordatorio_fin_pausa TINYINT(1) DEFAULT 1,
            minutos_antes INT DEFAULT 5,
            actualizado TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )";
        
        if (!$conn->query($crearTabla)) {
            return false;
        }
        
        // Insertar configuraciu00f3n por defecto
        $insertar = "INSERT INTO recordatorios_config 
                     (enviar_recordatorio_entrada, enviar_recordatorio_salida, enviar_recordatorio_inicio_pausa, enviar_recordatorio_fin_pausa, minutos_antes) 
                     VALUES (1, 1, 1, 1, 5)";
        
        if (!$conn->query($insertar)) {
            return false;
        }
    }
    
    return true;
}

// Obtener configuraciu00f3n
function obtenerConfig($conn) {
    if (!verificarTablaConfig($conn)) {
        return ['success' => false, 'error' => 'Error al crear tabla de configuraciu00f3n'];
    }
    
    $query = "SELECT * FROM recordatorios_config ORDER BY id DESC LIMIT 1";
    $resultado = $conn->query($query);
    
    if (!$resultado) {
        return ['success' => false, 'error' => 'Error al obtener configuraciu00f3n: ' . $conn->error];
    }
    
    if ($resultado->num_rows === 0) {
        // Devolver configuraciu00f3n por defecto si no hay registros
        return [
            'success' => true, 
            'configuracion' => [
                'enviar_recordatorio_entrada' => true,
                'enviar_recordatorio_salida' => true,
                'enviar_recordatorio_inicio_pausa' => true,
                'enviar_recordatorio_fin_pausa' => true,
                'minutos_antes' => 5
            ]
        ];
    }
    
    $config = $resultado->fetch_assoc();
    
    // Convertir valores a booleanos para el frontend
    return [
        'success' => true,
        'configuracion' => [
            'enviar_recordatorio_entrada' => (bool)$config['enviar_recordatorio_entrada'],
            'enviar_recordatorio_salida' => (bool)$config['enviar_recordatorio_salida'],
            'enviar_recordatorio_inicio_pausa' => (bool)$config['enviar_recordatorio_inicio_pausa'],
            'enviar_recordatorio_fin_pausa' => (bool)$config['enviar_recordatorio_fin_pausa'],
            'minutos_antes' => (int)$config['minutos_antes']
        ]
    ];
}

// Guardar configuraciu00f3n
function guardarConfig($conn, $data) {
    if (!verificarTablaConfig($conn)) {
        return ['success' => false, 'error' => 'Error al crear tabla de configuraciu00f3n'];
    }
    
    // Validar datos
    $entrada = isset($data['enviar_recordatorio_entrada']) ? ($data['enviar_recordatorio_entrada'] ? 1 : 0) : 1;
    $salida = isset($data['enviar_recordatorio_salida']) ? ($data['enviar_recordatorio_salida'] ? 1 : 0) : 1;
    $inicio_pausa = isset($data['enviar_recordatorio_inicio_pausa']) ? ($data['enviar_recordatorio_inicio_pausa'] ? 1 : 0) : 1;
    $fin_pausa = isset($data['enviar_recordatorio_fin_pausa']) ? ($data['enviar_recordatorio_fin_pausa'] ? 1 : 0) : 1;
    $minutos = isset($data['minutos_antes']) ? (int)$data['minutos_antes'] : 5;
    
    // Asegurar valores vu00e1lidos para minutos
    if ($minutos < 1) $minutos = 1;
    if ($minutos > 60) $minutos = 60;
    
    // Actualizar configuraciu00f3n
    $query = "UPDATE recordatorios_config SET 
              enviar_recordatorio_entrada = ?,
              enviar_recordatorio_salida = ?,
              enviar_recordatorio_inicio_pausa = ?,
              enviar_recordatorio_fin_pausa = ?,
              minutos_antes = ?
              ORDER BY id DESC LIMIT 1";
    
    $stmt = $conn->prepare($query);
    $stmt->bind_param("iiiii", $entrada, $salida, $inicio_pausa, $fin_pausa, $minutos);
    
    if (!$stmt->execute()) {
        return ['success' => false, 'error' => 'Error al guardar configuraciu00f3n: ' . $stmt->error];
    }
    
    // Si no se actualizu00f3 ninguna fila, insertar una nueva
    if ($stmt->affected_rows === 0) {
        $insertar = "INSERT INTO recordatorios_config 
                     (enviar_recordatorio_entrada, enviar_recordatorio_salida, 
                      enviar_recordatorio_inicio_pausa, enviar_recordatorio_fin_pausa, minutos_antes) 
                     VALUES (?, ?, ?, ?, ?)";
        
        $stmt = $conn->prepare($insertar);
        $stmt->bind_param("iiiii", $entrada, $salida, $inicio_pausa, $fin_pausa, $minutos);
        
        if (!$stmt->execute()) {
            return ['success' => false, 'error' => 'Error al guardar configuraciu00f3n: ' . $stmt->error];
        }
    }
    
    return ['success' => true, 'message' => 'Configuraciu00f3n guardada correctamente'];
}

// Obtener recordatorios enviados
function obtenerRecordatorios($conn) {
    // Verificar si existe la tabla
    $verificarTabla = "SHOW TABLES LIKE 'recordatorios_enviados'";
    $tablaExiste = $conn->query($verificarTabla)->num_rows > 0;
    
    if (!$tablaExiste) {
        // Crear la tabla si no existe
        $crearTabla = "CREATE TABLE recordatorios_enviados (
            id INT AUTO_INCREMENT PRIMARY KEY,
            NIF VARCHAR(20) NOT NULL,
            tipo_recordatorio ENUM('entrada', 'salida', 'inicio_pausa', 'fin_pausa') NOT NULL,
            fecha DATE NOT NULL,
            enviado TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX (NIF, tipo_recordatorio, fecha)
        )";
        
        if (!$conn->query($crearTabla)) {
            return ['success' => false, 'error' => 'Error al crear tabla de recordatorios enviados: ' . $conn->error];
        }
    }
    
    // Obtener recordatorios con datos de usuario
    $query = "SELECT r.id, r.NIF, u.nombre, u.apellidos, r.tipo_recordatorio, r.fecha, r.enviado 
              FROM recordatorios_enviados r 
              LEFT JOIN usuarios u ON r.NIF = u.NIF 
              ORDER BY r.enviado DESC LIMIT 100";
    
    $resultado = $conn->query($query);
    
    if (!$resultado) {
        return ['success' => false, 'error' => 'Error al obtener recordatorios: ' . $conn->error];
    }
    
    $recordatorios = [];
    while ($row = $resultado->fetch_assoc()) {
        $recordatorios[] = $row;
    }
    
    return ['success' => true, 'recordatorios' => $recordatorios];
}

// Procesar la solicitud
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Obtener configuraciu00f3n
    if (isset($_GET['action']) && $_GET['action'] === 'getConfig') {
        echo json_encode(obtenerConfig($conn));
        exit();
    }
    
    // Obtener lista de recordatorios
    if (isset($_GET['action']) && $_GET['action'] === 'list') {
        echo json_encode(obtenerRecordatorios($conn));
        exit();
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Decodificar datos JSON
    $data = json_decode(file_get_contents('php://input'), true);
    
    // Guardar configuraciu00f3n
    if (isset($_GET['action']) && $_GET['action'] === 'saveConfig') {
        echo json_encode(guardarConfig($conn, $data));
        exit();
    }
    
    // Ejecutar script manualmente
    if (isset($_GET['action']) && $_GET['action'] === 'runNow') {
        echo json_encode(ejecutarScript());
        exit();
    }
}

// Si llegamos aquu00ed, la acciu00f3n solicitada no existe
echo json_encode(['success' => false, 'error' => 'Acciu00f3n no vu00e1lida o no especificada']);

// Cerrar conexiu00f3n
$conn->close();
