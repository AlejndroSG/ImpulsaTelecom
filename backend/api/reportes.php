<?php
// Activar la visualización de errores para depuración
ini_set('display_errors', 1);
error_reporting(E_ALL);

header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json");

// Para las solicitudes OPTIONS (pre-flight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Incluir archivos necesarios
require_once '../config/database.php';
require_once '../modelos/Reporte.php';
require_once '../modelos/Usuario.php';
require_once '../modelos/Fichaje.php';
require_once '../vendor/autoload.php'; // Asegúrate de tener TCPDF instalado vía Composer

// Control de sesión
session_start();

// Función para verificar si el usuario tiene permisos de administrador
function verificarAdmin() {
    if (!isset($_SESSION['usuario']) || $_SESSION['tipo_usuario'] !== 'admin') {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'No tiene permisos para acceder a esta funcionalidad']);
        exit();
    }
}

// Manejar solicitudes POST
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Decodificar el cuerpo de la solicitud JSON
    $datos = json_decode(file_get_contents("php://input"), true);
    
    // Verificar si se proporcionaron datos
    if (!$datos) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'No se proporcionaron datos']);
        exit();
    }
    
    // Determinar la acción a realizar
    $action = isset($datos['action']) ? $datos['action'] : '';
    
    switch ($action) {
        case 'generarPDF':
            // Verificar permisos de administrador
            verificarAdmin();
            
            // Verificar datos requeridos
            if (!isset($datos['nif']) || !isset($datos['mes']) || !isset($datos['anio'])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Faltan datos requeridos']);
                exit();
            }
            
            $nif = $datos['nif'];
            $mes = $datos['mes'];
            $anio = $datos['anio'];
            
            // Crear instancia del modelo de reportes
            $reporteModel = new Reporte();
            
            try {
                // Generar PDF con los datos proporcionados
                $resultado = $reporteModel->generarReporteHoras($nif, $mes, $anio);
                
                if ($resultado['success']) {
                    echo json_encode([
                        'success' => true, 
                        'message' => 'Reporte generado correctamente',
                        'file_url' => $resultado['file_url']
                    ]);
                } else {
                    http_response_code(500);
                    echo json_encode(['success' => false, 'error' => $resultado['error']]);
                }
            } catch (Exception $e) {
                http_response_code(500);
                echo json_encode(['success' => false, 'error' => 'Error al generar el reporte: ' . $e->getMessage()]);
            }
            break;
            
        case 'obtenerHistorial':
            // Verificar permisos de administrador
            verificarAdmin();
            
            // Crear instancia del modelo de reportes
            $reporteModel = new Reporte();
            
            try {
                // Obtener historial de reportes
                $historial = $reporteModel->obtenerHistorialReportes();
                
                echo json_encode([
                    'success' => true, 
                    'historial' => $historial
                ]);
            } catch (Exception $e) {
                http_response_code(500);
                echo json_encode(['success' => false, 'error' => 'Error al obtener el historial: ' . $e->getMessage()]);
            }
            break;
            
        default:
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Acción no reconocida']);
            break;
    }
} 
// Manejar solicitudes GET
else if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $action = isset($_GET['action']) ? $_GET['action'] : '';
    
    switch ($action) {
        case 'test-pdf':
            // Esta es una ruta de prueba para verificar que TCPDF funcione correctamente
            try {
                // Verificar autoloader
                $autoloaderPath = __DIR__ . '/../../vendor/autoload.php';
                if (file_exists($autoloaderPath)) {
                    require_once($autoloaderPath);
                    $message = "✅ Autoloader encontrado en: {$autoloaderPath}\n";
                } else {
                    $message = "❌ Error: Autoloader no encontrado en: {$autoloaderPath}\n";
                }
                
                // Verificar que la clase TCPDF esté disponible
                if (class_exists('TCPDF')) {
                    $message .= "✅ Clase TCPDF encontrada\n";
                    
                    // Crear directorio para reportes si no existe
                    $reportesDir = __DIR__ . '/../reportes';
                    if (!file_exists($reportesDir)) {
                        if (mkdir($reportesDir, 0755, true)) {
                            $message .= "✅ Directorio para reportes creado: {$reportesDir}\n";
                        } else {
                            $message .= "❌ Error: No se pudo crear el directorio: {$reportesDir}\n";
                        }
                    } else {
                        $message .= "✅ Directorio para reportes existe: {$reportesDir}\n";
                        
                        if (is_writable($reportesDir)) {
                            $message .= "✅ Directorio tiene permisos de escritura\n";
                        } else {
                            $message .= "❌ Error: El directorio no tiene permisos de escritura\n";
                        }
                    }
                    
                    // Generar PDF de prueba
                    $pdf = new TCPDF('P', 'mm', 'A4', true, 'UTF-8', false);
                    $pdf->SetCreator('Impulsa Telecom');
                    $pdf->SetAuthor('Test System');
                    $pdf->SetTitle('Test PDF');
                    $pdf->setPrintHeader(false);
                    $pdf->setPrintFooter(false);
                    $pdf->SetMargins(15, 15, 15);
                    $pdf->SetAutoPageBreak(true, 15);
                    $pdf->SetFont('helvetica', '', 12);
                    $pdf->AddPage();
                    $pdf->Cell(0, 10, 'PDF de prueba generado con éxito', 0, 1, 'C');
                    $pdf->Cell(0, 10, 'Fecha: ' . date('Y-m-d H:i:s'), 0, 1, 'C');
                    
                    // Guardar PDF
                    $testFile = $reportesDir . '/test_' . time() . '.pdf';
                    $pdf->Output($testFile, 'F');
                    
                    if (file_exists($testFile)) {
                        $message .= "✅ PDF de prueba generado exitosamente: {$testFile}\n";
                        $pdfUrl = 'http://localhost/ImpulsaTelecom/backend/reportes/' . basename($testFile);
                        $message .= "✅ URL del PDF: {$pdfUrl}\n";
                    } else {
                        $message .= "❌ Error: No se pudo guardar el PDF de prueba\n";
                    }
                } else {
                    $message .= "❌ Error: Clase TCPDF no encontrada\n";
                }
                
                echo json_encode([
                    'success' => true,
                    'message' => $message,
                    'time' => date('Y-m-d H:i:s')
                ]);
            } catch (Exception $e) {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'error' => 'Error durante la prueba: ' . $e->getMessage(),
                    'file' => $e->getFile(),
                    'line' => $e->getLine()
                ]);
            }
            break;
            
        case 'descargar':
            // Verificar permisos de administrador
            verificarAdmin();
            
            // Verificar datos requeridos
            if (!isset($_GET['id'])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'ID de reporte no proporcionado']);
                exit();
            }
            
            $id = $_GET['id'];
            
            // Crear instancia del modelo de reportes
            $reporteModel = new Reporte();
            
            try {
                // Obtener información del reporte
                $reporte = $reporteModel->obtenerReporte($id);
                
                if (!$reporte) {
                    http_response_code(404);
                    echo json_encode(['success' => false, 'error' => 'Reporte no encontrado']);
                    exit();
                }
                
                // Verificar si el archivo existe
                if (!file_exists($reporte['ruta_archivo'])) {
                    http_response_code(404);
                    echo json_encode(['success' => false, 'error' => 'El archivo no existe']);
                    exit();
                }
                
                // Servir el archivo para descarga
                header('Content-Type: application/pdf');
                header('Content-Disposition: attachment; filename="' . basename($reporte['ruta_archivo']) . '"');
                header('Content-Length: ' . filesize($reporte['ruta_archivo']));
                readfile($reporte['ruta_archivo']);
                exit();
            } catch (Exception $e) {
                http_response_code(500);
                echo json_encode(['success' => false, 'error' => 'Error al descargar el reporte: ' . $e->getMessage()]);
            }
            break;
            
        default:
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Acción no reconocida']);
            break;
    }
} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Método no permitido']);
}
?>
