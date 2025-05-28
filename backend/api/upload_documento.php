<?php
// Configuración básica para permitir CORS
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Manejar preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Directorio base para subidas
$uploadDirectory = $_SERVER['DOCUMENT_ROOT'] . '/ImpulsaTelecom/uploads/documentos/';
if (!file_exists($uploadDirectory)) {
    mkdir($uploadDirectory, 0777, true);
}

// Verificar que la solicitud es un POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['error' => 'Método no permitido']);
    exit();
}

// Registrar información de depuración
error_log("Recibida solicitud de subida de documento");
error_log("POST: " . print_r($_POST, true));
error_log("FILES: " . print_r($_FILES, true));

// Verificar que tenemos los datos necesarios
if (!isset($_POST['titulo']) || !isset($_POST['nif_usuario']) || !isset($_FILES['archivo'])) {
    echo json_encode(['error' => 'Faltan datos requeridos']);
    exit();
}

// Extraer datos del formulario
$titulo = $_POST['titulo'];
$descripcion = isset($_POST['descripcion']) ? $_POST['descripcion'] : '';
$tipo_documento = isset($_POST['tipo_documento']) ? $_POST['tipo_documento'] : 'otro';
$nif_usuario = $_POST['nif_usuario'];
$acceso_publico = isset($_POST['acceso_publico']) ? intval($_POST['acceso_publico']) : 0;
$fecha_expiracion = isset($_POST['fecha_expiracion']) && !empty($_POST['fecha_expiracion']) ? $_POST['fecha_expiracion'] : null;

// Procesar el archivo
$file = $_FILES['archivo'];
$fileName = $file['name'];
$fileTmpPath = $file['tmp_name'];
$fileSize = $file['size'];
$fileError = $file['error'];

// Verificar si hay errores en la subida
if ($fileError !== UPLOAD_ERR_OK) {
    $errorMessages = [
        UPLOAD_ERR_INI_SIZE => 'El archivo excede el tamaño máximo permitido por PHP',
        UPLOAD_ERR_FORM_SIZE => 'El archivo excede el tamaño máximo permitido por el formulario',
        UPLOAD_ERR_PARTIAL => 'El archivo se subió parcialmente',
        UPLOAD_ERR_NO_FILE => 'No se subió ningún archivo',
        UPLOAD_ERR_NO_TMP_DIR => 'Falta la carpeta temporal',
        UPLOAD_ERR_CANT_WRITE => 'Error al escribir el archivo en el disco',
        UPLOAD_ERR_EXTENSION => 'Una extensión de PHP detuvo la subida'
    ];
    
    $errorMessage = isset($errorMessages[$fileError]) ? $errorMessages[$fileError] : 'Error desconocido en la subida';
    echo json_encode(['error' => $errorMessage]);
    exit();
}

// Crear directorio para el usuario si no existe
$userDirectory = $uploadDirectory . $nif_usuario . '/';
if (!file_exists($userDirectory)) {
    mkdir($userDirectory, 0777, true);
}

// Generar nombre único para el archivo
$fileExtension = pathinfo($fileName, PATHINFO_EXTENSION);
$newFileName = uniqid() . '_' . preg_replace('/[^a-zA-Z0-9_.-]/', '_', $titulo) . '.' . $fileExtension;
$targetFilePath = $userDirectory . $newFileName;

// Intentar mover el archivo a la ubicación final
if (move_uploaded_file($fileTmpPath, $targetFilePath)) {
    // Ruta relativa para almacenar en la base de datos
    $relativePath = '/uploads/documentos/' . $nif_usuario . '/' . $newFileName;
    
    // Insertar en la base de datos (versión simplificada)
    try {
        // Conexión a la base de datos
        $db = new PDO('mysql:host=localhost;dbname=impulsatelecom', 'root', '');
        $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        
        // Preparar la consulta
        $query = "INSERT INTO documentos (titulo, descripcion, tipo_documento, ruta_archivo, fecha_subida, nif_usuario, acceso_publico, fecha_expiracion) 
                  VALUES (:titulo, :descripcion, :tipo_documento, :ruta_archivo, NOW(), :nif_usuario, :acceso_publico, :fecha_expiracion)";
        
        $stmt = $db->prepare($query);
        $stmt->bindParam(':titulo', $titulo);
        $stmt->bindParam(':descripcion', $descripcion);
        $stmt->bindParam(':tipo_documento', $tipo_documento);
        $stmt->bindParam(':ruta_archivo', $relativePath);
        $stmt->bindParam(':nif_usuario', $nif_usuario);
        $stmt->bindParam(':acceso_publico', $acceso_publico);
        $stmt->bindParam(':fecha_expiracion', $fecha_expiracion);
        
        // Ejecutar la consulta
        $stmt->execute();
        
        // Obtener el ID del documento insertado
        $documentoId = $db->lastInsertId();
        
        // Respuesta exitosa
        echo json_encode([
            'success' => true, 
            'message' => 'Documento subido correctamente',
            'documento_id' => $documentoId,
            'ruta' => $relativePath
        ]);
    } catch (PDOException $e) {
        error_log("Error de base de datos: " . $e->getMessage());
        
        // Si hay un error de base de datos pero el archivo se subió, eliminarlo
        if (file_exists($targetFilePath)) {
            unlink($targetFilePath);
        }
        
        echo json_encode(['error' => 'Error al guardar en la base de datos: ' . $e->getMessage()]);
    }
} else {
    echo json_encode(['error' => 'Error al mover el archivo subido']);
}
