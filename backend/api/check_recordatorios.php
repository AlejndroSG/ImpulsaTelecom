<?php
// API ligera para verificar y enviar recordatorios desde el frontend
// VERSIÓN MEJORADA: Utiliza exec() para garantizar una ejecución fiable

// Configurar CORS (usando la misma configuración que utilizan tus otros endpoints)
$origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';

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

// Función para registrar acciones en un archivo de log
function escribirLog($mensaje) {
    $logFile = __DIR__ . '/../logs/recordatorios_' . date('Y-m-d') . '.log';
    $logDir = dirname($logFile);
    
    // Crear directorio si no existe
    if (!file_exists($logDir)) {
        mkdir($logDir, 0777, true);
    }
    
    // Escribir mensaje de log con timestamp
    $timestamp = date('Y-m-d H:i:s');
    file_put_contents(
        $logFile, 
        "[$timestamp] $mensaje\n", 
        FILE_APPEND
    );
}

try {
    // Registrar inicio de la verificación
    escribirLog("Verificación de recordatorios solicitada desde el frontend (versión mejorada)");
    
    // Incluir archivo de conexión a la base de datos para diagnóstico
    require_once __DIR__ . '/../modelos/bd.php';

    // Obtener información de María para diagnóstico
    $db = new db();
    $conn = $db->getConn();
    $query = "SELECT u.NIF, u.nombre, u.email, h.hora_inicio, h.hora_fin 
             FROM usuarios u 
             JOIN horarios h ON u.id_horario = h.id 
             WHERE u.NIF = '56789012C'";
    $resultado = $conn->query($query);
    if ($resultado && $resultado->num_rows > 0) {
        $maria = $resultado->fetch_assoc();
        escribirLog("INFO DIAGNÓSTICO: María configurada con hora entrada {$maria['hora_inicio']} - salida {$maria['hora_fin']}");
    } else {
        escribirLog("INFO DIAGNÓSTICO: No se pudo obtener información de María");
    }
    
    // Ruta al script de recordatorios
    $script_path = realpath(__DIR__ . '/../scripts/enviar_recordatorios.php');
    
    // Verificar que el script existe
    if (!file_exists($script_path)) {
        throw new Exception("El script de recordatorios no existe en la ruta: $script_path");
    }
    
    // Ruta al PHP ejecutable (ruta fija para evitar errores)
    $php_executable = 'C:\xampp\php\php.exe'; // Ruta fija al ejecutable de PHP
    
    // Construir comando
    $command = escapeshellarg($php_executable) . ' ' . escapeshellarg($script_path);
    
    // Ejecutar el script en un proceso separado
    escribirLog("Ejecutando comando: $command");
    $output = [];
    $return_var = 0;
    exec($command, $output, $return_var);
    
    // Verificar el resultado
    if ($return_var !== 0) {
        escribirLog("Error al ejecutar el script. Código de retorno: $return_var");
        escribirLog("Salida: " . implode("\n", $output));
        throw new Exception("Error al ejecutar el script de recordatorios. Código: $return_var");
    } else {
        escribirLog("Script ejecutado correctamente");
        if (!empty($output)) {
            escribirLog("Salida del script: " . implode("\n", $output));
        }
    }
    
    // Verificar si se enviaron recordatorios a María
    $query_check = "SELECT id, fecha_hora FROM recordatorios_enviados 
                 WHERE NIF = '56789012C' 
                 AND fecha = '" . date('Y-m-d') . "' 
                 ORDER BY fecha_hora DESC LIMIT 1";
    $resultado_check = $conn->query($query_check);
    if ($resultado_check && $resultado_check->num_rows > 0) {
        $recordatorio = $resultado_check->fetch_assoc();
        escribirLog("RECORDATORIO ENVIADO A MARÍA ID: {$recordatorio['id']} - HORA: {$recordatorio['fecha_hora']}");
    }
    
    // Responder con éxito
    echo json_encode([
        'success' => true,
        'message' => 'Verificación de recordatorios completada'
    ]);
    
} catch (Exception $e) {
    // Registrar error
    escribirLog("Error en la verificación: " . $e->getMessage());
    
    // Responder con error
    echo json_encode([
        'success' => false,
        'error' => 'Error al verificar recordatorios: ' . $e->getMessage()
    ]);
}

// Asegurarnos de que todos los errores estén registrados
if (error_get_last()) {
    escribirLog("ERROR FINAL: " . print_r(error_get_last(), true));
}
