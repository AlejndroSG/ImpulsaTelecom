<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');

// Información del servidor
$serverInfo = [
    'server_software' => $_SERVER['SERVER_SOFTWARE'],
    'php_version' => phpversion(),
    'document_root' => $_SERVER['DOCUMENT_ROOT'],
    'script_filename' => $_SERVER['SCRIPT_FILENAME'],
    'http_host' => $_SERVER['HTTP_HOST'],
    'request_uri' => $_SERVER['REQUEST_URI'],
    'server_protocol' => $_SERVER['SERVER_PROTOCOL']
];

// Verificar conexión a la base de datos
$dbStatus = [];
try {
    include_once '../modelos/bd.php';
    $database = new db();
    $conn = $database->getConn();
    
    if ($conn->connect_error) {
        $dbStatus['connected'] = false;
        $dbStatus['error'] = $conn->connect_error;
    } else {
        $dbStatus['connected'] = true;
        
        // Verificar tabla avatares
        $result = $conn->query("SHOW TABLES LIKE 'avatares'");
        $dbStatus['table_avatares_exists'] = ($result && $result->num_rows > 0);
        
        if ($dbStatus['table_avatares_exists']) {
            // Contar avatares
            $result = $conn->query("SELECT COUNT(*) as total FROM avatares");
            $row = $result->fetch_assoc();
            $dbStatus['avatares_count'] = $row['total'];
            
            // Obtener muestra de avatares
            $result = $conn->query("SELECT id, nombre, ruta, categoria FROM avatares LIMIT 3");
            $avataresMuestra = [];
            while ($row = $result->fetch_assoc()) {
                $avataresMuestra[] = $row;
            }
            $dbStatus['avatares_muestra'] = $avataresMuestra;
        }
        
        // Verificar tabla usuarios
        $result = $conn->query("SHOW TABLES LIKE 'usuarios'");
        $dbStatus['table_usuarios_exists'] = ($result && $result->num_rows > 0);
        
        if ($dbStatus['table_usuarios_exists']) {
            // Verificar si existe la columna id_avatar
            $result = $conn->query("SHOW COLUMNS FROM usuarios LIKE 'id_avatar'");
            $dbStatus['column_id_avatar_exists'] = ($result && $result->num_rows > 0);
        }
    }
} catch (Exception $e) {
    $dbStatus['connected'] = false;
    $dbStatus['error'] = $e->getMessage();
}

// Verificar directorios de imágenes
$dirStatus = [];
$avatarDir = $_SERVER['DOCUMENT_ROOT'] . '/ImpulsaTelecom/frontend/src/img/avatares';
$dirStatus['avatar_dir_path'] = $avatarDir;
$dirStatus['avatar_dir_exists'] = is_dir($avatarDir);

if ($dirStatus['avatar_dir_exists']) {
    $avatarFiles = scandir($avatarDir);
    $dirStatus['avatar_files_count'] = count($avatarFiles) - 2; // Restar . y ..
    $dirStatus['avatar_files_sample'] = array_slice($avatarFiles, 2, 5); // Primeros 5 archivos
}

// Verificar si una imagen específica existe
if (isset($dbStatus['avatares_muestra']) && !empty($dbStatus['avatares_muestra'])) {
    $testImage = $dbStatus['avatares_muestra'][0]['ruta'];
    $testImagePath = $_SERVER['DOCUMENT_ROOT'] . '/ImpulsaTelecom/frontend' . $testImage;
    $dirStatus['test_image_path'] = $testImagePath;
    $dirStatus['test_image_exists'] = file_exists($testImagePath);
}

// Construir URL de prueba
$testUrl = 'http://' . $_SERVER['HTTP_HOST'] . '/ImpulsaTelecom/frontend/src/img/avatares/001-man.png';
$dirStatus['test_url'] = $testUrl;

// Resultado final
$result = [
    'timestamp' => date('Y-m-d H:i:s'),
    'server_info' => $serverInfo,
    'database_status' => $dbStatus,
    'directory_status' => $dirStatus
];

echo json_encode($result, JSON_PRETTY_PRINT);
?>
