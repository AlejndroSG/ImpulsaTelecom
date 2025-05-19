<?php
// Script de prueba para diagnosticar problemas con TCPDF

// Activar reporte de errores
ini_set('display_errors', 1);
error_reporting(E_ALL);

echo "<h1>Test de generación de PDF con TCPDF</h1>";

try {
    // Verificar si el autoloader de Composer está disponible
    if (file_exists('vendor/autoload.php')) {
        require_once 'vendor/autoload.php';
        echo "<p>✅ Autoloader de Composer encontrado</p>";
    } else {
        echo "<p>❌ Error: No se encontró el autoloader de Composer en vendor/autoload.php</p>";
        exit;
    }

    // Verificar si TCPDF está instalado correctamente
    if (class_exists('TCPDF')) {
        echo "<p>✅ Clase TCPDF encontrada</p>";
    } else {
        echo "<p>❌ Error: La clase TCPDF no está disponible. Asegúrate de que la instalación de TCPDF fue correcta.</p>";
        exit;
    }

    // Verificar permisos en el directorio de reportes
    $reportesDir = __DIR__ . '/backend/reportes';
    if (is_dir($reportesDir)) {
        echo "<p>✅ Directorio de reportes existe: $reportesDir</p>";
        
        if (is_writable($reportesDir)) {
            echo "<p>✅ Directorio de reportes tiene permisos de escritura</p>";
        } else {
            echo "<p>❌ Error: El directorio de reportes no tiene permisos de escritura</p>";
            // Intentar corregir permisos
            @chmod($reportesDir, 0755);
            echo "<p>🔄 Intentando corregir permisos...</p>";
            
            if (is_writable($reportesDir)) {
                echo "<p>✅ Permisos corregidos exitosamente</p>";
            } else {
                echo "<p>❌ No se pudieron corregir los permisos. Hazlo manualmente.</p>";
            }
        }
    } else {
        echo "<p>❌ Error: El directorio de reportes no existe</p>";
        // Intentar crear el directorio
        if (@mkdir($reportesDir, 0755, true)) {
            echo "<p>✅ Directorio de reportes creado exitosamente</p>";
        } else {
            echo "<p>❌ Error: No se pudo crear el directorio de reportes</p>";
        }
    }

    // Intentar generar un PDF de prueba
    echo "<h2>Generando PDF de prueba...</h2>";
    
    // Crear instancia de TCPDF
    $pdf = new TCPDF('P', 'mm', 'A4', true, 'UTF-8', false);
    
    // Configurar documento
    $pdf->SetCreator('Impulsa Telecom');
    $pdf->SetAuthor('Sistema de Prueba');
    $pdf->SetTitle('PDF de Prueba');
    
    // Eliminar cabeceras y pies de página por defecto
    $pdf->setPrintHeader(false);
    $pdf->setPrintFooter(false);
    
    // Establecer márgenes
    $pdf->SetMargins(15, 15, 15);
    
    // Establecer saltos de página automáticos
    $pdf->SetAutoPageBreak(true, 15);
    
    // Establecer tipo de fuente
    $pdf->SetFont('helvetica', '', 12);
    
    // Agregar página
    $pdf->AddPage();
    
    // Contenido
    $pdf->Cell(0, 10, 'PDF de prueba generado correctamente', 0, 1, 'C');
    $pdf->Cell(0, 10, 'Fecha: ' . date('Y-m-d H:i:s'), 0, 1, 'C');
    
    // Ruta del archivo
    $testFilePath = $reportesDir . '/test_' . time() . '.pdf';
    
    // Guardar PDF
    $pdf->Output($testFilePath, 'F');
    
    echo "<p>✅ PDF de prueba generado correctamente en: $testFilePath</p>";
    echo "<p><a href='backend/reportes/" . basename($testFilePath) . "' target='_blank'>Ver PDF generado</a></p>";
    
} catch (Exception $e) {
    echo "<p>❌ Error durante la prueba: " . $e->getMessage() . "</p>";
    echo "<p>Línea: " . $e->getLine() . "</p>";
    echo "<p>Archivo: " . $e->getFile() . "</p>";
    if (method_exists($e, 'getTraceAsString')) {
        echo "<h3>Stack Trace:</h3>";
        echo "<pre>" . $e->getTraceAsString() . "</pre>";
    }
}
?>
