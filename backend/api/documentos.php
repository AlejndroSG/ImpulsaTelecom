<?php
session_start();
header('Content-Type: application/json');

// Manejo dinu00e1mico de CORS
$allowed_origins = [
    'http://localhost:5173',
    'http://localhost:3000'
];

$origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';

if (in_array($origin, $allowed_origins)) {
    header('Access-Control-Allow-Origin: ' . $origin);
}

header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With');

// Manejar preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Verificar autenticaciu00f3n
if (!isset($_SESSION['usuario'])) {
    echo json_encode(['error' => 'No autenticado']);
    exit();
}

require_once '../modelos/Documento.php';
$documento = new Documento();

// Asegurarse de que la tabla existe
$documento->crearTablaDocumentos();

// Crear directorio de documentos si no existe
$uploadDirectory = $_SERVER['DOCUMENT_ROOT'] . '/ImpulsaTelecom/uploads/documentos/';
if (!file_exists($uploadDirectory)) {
    mkdir($uploadDirectory, 0777, true);
}

// Obtener el usuario actual
$usuario_actual = $_SESSION['usuario'];
$es_admin = isset($usuario_actual['es_admin']) && $usuario_actual['es_admin'] == 1;
$nif_actual = $usuario_actual['NIF'];

// Determinar la acciu00f3n a realizar
$action = isset($_GET['action']) ? $_GET['action'] : '';

switch ($action) {
    case 'list':
        // Si es admin, puede ver todos los documentos, si no, solo los suyos o pu00fablicos
        if ($es_admin) {
            $documentos = $documento->obtenerTodos();
        } else {
            $documentos = $documento->obtenerPorUsuario($nif_actual);
        }
        echo json_encode(['documentos' => $documentos]);
        break;

    case 'get':
        $id = isset($_GET['id']) ? intval($_GET['id']) : 0;
        $doc = $documento->obtenerPorId($id);
        
        if (!$doc) {
            echo json_encode(['error' => 'Documento no encontrado']);
            exit();
        }
        
        // Verificar acceso
        if (!$documento->verificarAcceso($id, $nif_actual, $es_admin)) {
            echo json_encode(['error' => 'No tienes permiso para acceder a este documento']);
            exit();
        }
        
        echo json_encode(['documento' => $doc]);
        break;

    case 'user_docs':
        // Obtener documentos de un usuario especu00edfico (solo admin puede hacer esto para otros usuarios)
        $nif = isset($_GET['nif']) ? $_GET['nif'] : '';
        
        if (!$es_admin && $nif !== $nif_actual) {
            echo json_encode(['error' => 'No tienes permiso para ver documentos de otros usuarios']);
            exit();
        }
        
        $documentos = $documento->obtenerPorUsuario($nif);
        echo json_encode(['documentos' => $documentos]);
        break;

    case 'upload':
        // Solo administradores pueden subir documentos
        if (!$es_admin) {
            echo json_encode(['error' => 'No tienes permiso para subir documentos']);
            exit();
        }
        
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            echo json_encode(['error' => 'Mu00e9todo no permitido']);
            exit();
        }

        // Recibir datos del formulario
        $titulo = isset($_POST['titulo']) ? trim($_POST['titulo']) : '';
        $descripcion = isset($_POST['descripcion']) ? trim($_POST['descripcion']) : '';
        $nif_usuario = isset($_POST['nif_usuario']) ? trim($_POST['nif_usuario']) : '';
        $tipo_documento = isset($_POST['tipo_documento']) ? trim($_POST['tipo_documento']) : '';
        $acceso_publico = isset($_POST['acceso_publico']) ? intval($_POST['acceso_publico']) : 0;
        $fecha_expiracion = isset($_POST['fecha_expiracion']) && !empty($_POST['fecha_expiracion']) ? $_POST['fecha_expiracion'] : null;

        // Validaciones bu00e1sicas
        if (empty($titulo) || empty($nif_usuario) || empty($tipo_documento)) {
            echo json_encode(['error' => 'Faltan campos obligatorios']);
            exit();
        }

        // Manejar la subida del archivo
        if (!isset($_FILES['archivo']) || $_FILES['archivo']['error'] !== UPLOAD_ERR_OK) {
            echo json_encode(['error' => 'Error al subir el archivo', 'details' => $_FILES['archivo']['error']]);
            exit();
        }

        $archivo = $_FILES['archivo'];
        $nombreArchivo = $archivo['name'];
        $tipoArchivo = $archivo['type'];
        $tamanioArchivo = $archivo['size'];
        $tempPath = $archivo['tmp_name'];
        
        // Crear un nombre u00fanico para el archivo
        $extension = pathinfo($nombreArchivo, PATHINFO_EXTENSION);
        $nuevoNombre = uniqid() . '_' . $nif_usuario . '.' . $extension;
        $rutaDestino = $uploadDirectory . $nuevoNombre;
        
        // Mover el archivo subido a la ubicaciu00f3n final
        if (move_uploaded_file($tempPath, $rutaDestino)) {
            // Guardar la informaciu00f3n del documento en la base de datos
            $rutaRelativa = '/uploads/documentos/' . $nuevoNombre;
            $resultado = $documento->guardar(
                $titulo, 
                $descripcion, 
                $rutaRelativa, 
                $tipo_documento, 
                $tamanioArchivo, 
                $nif_usuario, 
                $nif_actual, 
                $acceso_publico, 
                $fecha_expiracion
            );
            
            if ($resultado) {
                echo json_encode([
                    'success' => true, 
                    'id' => $resultado, 
                    'mensaje' => 'Documento subido correctamente'
                ]);
            } else {
                // Si falla el registro en la BD, eliminar el archivo
                unlink($rutaDestino);
                echo json_encode(['error' => 'Error al guardar el documento en la base de datos']);
            }
        } else {
            echo json_encode(['error' => 'Error al mover el archivo subido']);
        }
        break;

    case 'delete':
        // Solo administradores pueden eliminar documentos
        if (!$es_admin) {
            echo json_encode(['error' => 'No tienes permiso para eliminar documentos']);
            exit();
        }
        
        if ($_SERVER['REQUEST_METHOD'] !== 'POST' && $_SERVER['REQUEST_METHOD'] !== 'DELETE') {
            echo json_encode(['error' => 'Mu00e9todo no permitido']);
            exit();
        }
        
        // Obtener ID del documento a eliminar
        $data = json_decode(file_get_contents('php://input'), true);
        $id = isset($data['id']) ? intval($data['id']) : (isset($_POST['id']) ? intval($_POST['id']) : 0);
        
        if ($id <= 0) {
            echo json_encode(['error' => 'ID de documento no vu00e1lido']);
            exit();
        }
        
        if ($documento->eliminar($id)) {
            echo json_encode(['success' => true, 'mensaje' => 'Documento eliminado correctamente']);
        } else {
            echo json_encode(['error' => 'Error al eliminar el documento']);
        }
        break;

    case 'download':
        $id = isset($_GET['id']) ? intval($_GET['id']) : 0;
        $doc = $documento->obtenerPorId($id);
        
        if (!$doc) {
            echo json_encode(['error' => 'Documento no encontrado']);
            exit();
        }
        
        // Verificar acceso
        if (!$documento->verificarAcceso($id, $nif_actual, $es_admin)) {
            echo json_encode(['error' => 'No tienes permiso para acceder a este documento']);
            exit();
        }
        
        // Ruta completa del archivo
        $rutaCompleta = $_SERVER['DOCUMENT_ROOT'] . '/ImpulsaTelecom' . $doc['ruta_archivo'];
        
        if (!file_exists($rutaCompleta)) {
            echo json_encode(['error' => 'El archivo no existe en el servidor']);
            exit();
        }
        
        // Preparar la descarga
        header('Content-Type: application/json');
        echo json_encode([
            'success' => true,
            'ruta' => $doc['ruta_archivo'],
            'titulo' => $doc['titulo']
        ]);
        break;

    case 'update':
        // Solo administradores pueden actualizar documentos
        if (!$es_admin) {
            echo json_encode(['error' => 'No tienes permiso para actualizar documentos']);
            exit();
        }
        
        if ($_SERVER['REQUEST_METHOD'] !== 'POST' && $_SERVER['REQUEST_METHOD'] !== 'PUT') {
            echo json_encode(['error' => 'Mu00e9todo no permitido']);
            exit();
        }
        
        // Obtener datos de la actualizaciu00f3n
        $data = json_decode(file_get_contents('php://input'), true);
        if (!$data && $_SERVER['REQUEST_METHOD'] === 'POST') {
            $data = $_POST;
        }
        
        $id = isset($data['id']) ? intval($data['id']) : 0;
        $titulo = isset($data['titulo']) ? trim($data['titulo']) : '';
        $descripcion = isset($data['descripcion']) ? trim($data['descripcion']) : '';
        $acceso_publico = isset($data['acceso_publico']) ? intval($data['acceso_publico']) : 0;
        $fecha_expiracion = isset($data['fecha_expiracion']) && !empty($data['fecha_expiracion']) ? $data['fecha_expiracion'] : null;
        
        if ($id <= 0 || empty($titulo)) {
            echo json_encode(['error' => 'Faltan campos obligatorios']);
            exit();
        }
        
        if ($documento->actualizar($id, $titulo, $descripcion, $acceso_publico, $fecha_expiracion)) {
            echo json_encode(['success' => true, 'mensaje' => 'Documento actualizado correctamente']);
        } else {
            echo json_encode(['error' => 'Error al actualizar el documento']);
        }
        break;

    default:
        echo json_encode(['error' => 'Acciu00f3n no vu00e1lida']);
        break;
}
