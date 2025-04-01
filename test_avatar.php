<?php
// Configurar cabeceras CORS
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');

// Conexión a la base de datos
include_once 'backend/modelos/bd.php';

try {
    $database = new db();
    $conn = $database->getConn();
    
    // Obtener un avatar de prueba
    $query = "SELECT * FROM avatares WHERE activo = 1 LIMIT 1";
    $result = $conn->query($query);
    
    if ($result->num_rows > 0) {
        $avatar = $result->fetch_assoc();
        
        // Construir diferentes versiones de la URL para diagnóstico
        $url1 = 'http://' . $_SERVER['HTTP_HOST'] . '/ImpulsaTelecom' . $avatar['ruta'];
        $url2 = 'http://' . $_SERVER['SERVER_NAME'] . '/ImpulsaTelecom' . $avatar['ruta'];
        $url3 = 'http://localhost/ImpulsaTelecom' . $avatar['ruta'];
        
        // Verificar si el archivo existe físicamente
        $file_path = __DIR__ . '/frontend' . $avatar['ruta'];
        $file_exists = file_exists($file_path);
        
        // Devolver información de diagnóstico
        echo json_encode([
            'success' => true,
            'avatar_id' => $avatar['id'],
            'ruta_original' => $avatar['ruta'],
            'url1' => $url1,
            'url2' => $url2,
            'url3' => $url3,
            'file_path' => $file_path,
            'file_exists' => $file_exists,
            'server_variables' => [
                'HTTP_HOST' => $_SERVER['HTTP_HOST'],
                'SERVER_NAME' => $_SERVER['SERVER_NAME'],
                'DOCUMENT_ROOT' => $_SERVER['DOCUMENT_ROOT']
            ]
        ]);
    } else {
        echo json_encode(['success' => false, 'message' => 'No se encontraron avatares']);
    }
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
}
?>
