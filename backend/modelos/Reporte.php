<?php
/**
 * Clase Reporte - Modelo para la generación y gestión de informes PDF
 */
class Reporte {
    private $conn;
    private $pdfDir;
    
    /**
     * Constructor de la clase
     */
    public function __construct() {
        $database = new Database();
        $this->conn = $database->getConnection();
        
        // Directorio para almacenar los PDFs generados
        $this->pdfDir = __DIR__ . '/../reportes/';
        
        // Crear el directorio si no existe
        if (!file_exists($this->pdfDir)) {
            mkdir($this->pdfDir, 0755, true);
        }
    }
    
    /**
     * Genera un informe PDF con las horas trabajadas por un empleado en un mes específico
     * 
     * @param string $nif NIF del empleado
     * @param int $mes Mes del informe (1-12)
     * @param int $anio Año del informe
     * @return array Resultado de la operación
     */
    public function generarReporteHoras($nif, $mes, $anio) {
        try {
            // Obtener información del usuario
            $usuario = $this->obtenerDatosUsuario($nif);
            if (!$usuario) {
                return ['success' => false, 'error' => 'Usuario no encontrado'];
            }
            
            // Obtener registros de fichajes del mes
            $fichajes = $this->obtenerFichajesMes($nif, $mes, $anio);
            
            // Calcular totales
            $totalHoras = $this->calcularTotalHoras($fichajes);
            
            // Generar nombre único para el archivo
            $timestamp = time();
            $nombreArchivo = "horas_{$nif}_{$mes}_{$anio}_{$timestamp}.pdf";
            $rutaCompleta = $this->pdfDir . $nombreArchivo;
            
            // Generar el PDF
            $this->crearPDF($usuario, $fichajes, $totalHoras, $mes, $anio, $rutaCompleta);
            
            // Registrar el informe en la base de datos
            $idReporte = $this->registrarInforme($nif, $mes, $anio, $nombreArchivo);
            
            // URL relativa para acceder al archivo
            $urlRelativa = "reportes/{$nombreArchivo}";
            
            return [
                'success' => true,
                'file_url' => $urlRelativa,
                'report_id' => $idReporte
            ];
        } catch (Exception $e) {
            // Registrar error en el log
            error_log("Error al generar reporte: " . $e->getMessage());
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }
    
    /**
     * Obtiene datos del usuario por NIF
     * 
     * @param string $nif NIF del usuario
     * @return array|false Datos del usuario o false si no existe
     */
    private function obtenerDatosUsuario($nif) {
        $query = "SELECT NIF, nombre, apellidos, correo, dpto, tipo_usuario 
                  FROM usuarios 
                  WHERE NIF = ?";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bind_param("s", $nif);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows > 0) {
            return $result->fetch_assoc();
        }
        
        return false;
    }
    
    /**
     * Obtiene los registros de fichajes de un usuario en un mes específico
     * 
     * @param string $nif NIF del usuario
     * @param int $mes Mes (1-12)
     * @param int $anio Año
     * @return array Registros de fichajes
     */
    private function obtenerFichajesMes($nif, $mes, $anio) {
        // Formatear el mes para consulta SQL (agregar ceros a la izquierda si es necesario)
        $mesPadded = str_pad($mes, 2, '0', STR_PAD_LEFT);
        
        // Construir las fechas de inicio y fin del mes
        $fechaInicio = "{$anio}-{$mesPadded}-01";
        $fechaFin = date('Y-m-t', strtotime($fechaInicio)); // Último día del mes
        
        $query = "SELECT idRegistro, fecha, hora_entrada, hora_salida, comentario 
                  FROM registros 
                  WHERE NIF = ? AND fecha BETWEEN ? AND ?
                  ORDER BY fecha, hora_entrada";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bind_param("sss", $nif, $fechaInicio, $fechaFin);
        $stmt->execute();
        $result = $stmt->get_result();
        
        $fichajes = [];
        while ($row = $result->fetch_assoc()) {
            $fichajes[] = $row;
        }
        
        return $fichajes;
    }
    
    /**
     * Calcula el total de horas trabajadas a partir de los fichajes
     * 
     * @param array $fichajes Registros de fichajes
     * @return array Totales calculados (horas, minutos, días trabajados)
     */
    private function calcularTotalHoras($fichajes) {
        $totalMinutos = 0;
        $diasTrabajados = count($fichajes);
        
        foreach ($fichajes as $fichaje) {
            if (isset($fichaje['hora_entrada']) && isset($fichaje['hora_salida'])) {
                $entrada = strtotime($fichaje['hora_entrada']);
                $salida = strtotime($fichaje['hora_salida']);
                
                if ($entrada && $salida && $salida > $entrada) {
                    $minutos = ($salida - $entrada) / 60;
                    $totalMinutos += $minutos;
                }
            }
        }
        
        // Convertir minutos totales a horas y minutos
        $horas = floor($totalMinutos / 60);
        $minutos = $totalMinutos % 60;
        
        return [
            'horas' => $horas,
            'minutos' => $minutos,
            'total_minutos' => $totalMinutos,
            'dias_trabajados' => $diasTrabajados
        ];
    }
    
    /**
     * Crea el archivo PDF del informe
     * 
     * @param array $usuario Datos del usuario
     * @param array $fichajes Registros de fichajes
     * @param array $totales Totales calculados
     * @param int $mes Número del mes
     * @param int $anio Año
     * @param string $rutaArchivo Ruta donde guardar el archivo
     */
    private function crearPDF($usuario, $fichajes, $totales, $mes, $anio, $rutaArchivo) {
        try {
            // Verificar si el autoloader de Composer está disponible
            if (file_exists(__DIR__ . '/../../vendor/autoload.php')) {
                require_once(__DIR__ . '/../../vendor/autoload.php');
            } elseif (file_exists(__DIR__ . '/../vendor/autoload.php')) {
                require_once(__DIR__ . '/../vendor/autoload.php');
            } else {
                throw new Exception('Autoloader de Composer no encontrado');
            }
            
            // Crear nueva instancia de PDF
            $pdf = new \TCPDF('P', 'mm', 'A4', true, 'UTF-8', false);
            
            // Configurar documento
            $pdf->SetCreator('Impulsa Telecom');
            $pdf->SetAuthor('Impulsa Telecom');
            $pdf->SetTitle('Informe de Horas Trabajadas');
            $pdf->SetSubject('Informe Mensual');
            $pdf->SetKeywords('Impulsa Telecom, Horas, Informe, Registro');
            
            // Definir información de la empresa
            $empresa = [
                'nombre' => 'IMPULSA TELECOM S.L.',
                'direccion' => 'Calle San Bernardo, 123',
                'codigo_postal' => '28015 Madrid',
                'telefono' => '91 456 78 90',
                'email' => 'info@impulsatelecom.com',
                'web' => 'www.impulsatelecom.com',
                'cif' => 'B12345678'
            ];
            
            // Eliminar cabeceras y pies de página por defecto
            $pdf->setPrintHeader(false);
            $pdf->setPrintFooter(false);
            
            // Establecer márgenes
            $pdf->SetMargins(15, 15, 15);
            
            // Establecer saltos de página automáticos
            $pdf->SetAutoPageBreak(true, 15);
            
            // Establecer tipo de fuente
            $pdf->SetFont('helvetica', '', 10);
            
            // Agregar página
            $pdf->AddPage();
            
            // Nombre del mes
            $nombresMeses = [
                1 => 'Enero', 2 => 'Febrero', 3 => 'Marzo', 4 => 'Abril',
                5 => 'Mayo', 6 => 'Junio', 7 => 'Julio', 8 => 'Agosto',
                9 => 'Septiembre', 10 => 'Octubre', 11 => 'Noviembre', 12 => 'Diciembre'
            ];
            $nombreMes = isset($nombresMeses[$mes]) ? $nombresMeses[$mes] : '';
            
            // Logo de la empresa
            if (file_exists(__DIR__ . '/../assets/logo.png')) {
                $pdf->Image(__DIR__ . '/../assets/logo.png', 15, 15, 40, 0, 'PNG');
            }
            
            // Información de la empresa (cabecera)
            $pdf->SetFont('helvetica', 'B', 10);
            $pdf->SetXY(120, 15);
            $pdf->Cell(75, 5, $empresa['nombre'], 0, 1, 'R');
            $pdf->SetFont('helvetica', '', 8);
            $pdf->SetXY(120, 20);
            $pdf->Cell(75, 5, $empresa['direccion'], 0, 1, 'R');
            $pdf->SetXY(120, 25);
            $pdf->Cell(75, 5, $empresa['codigo_postal'], 0, 1, 'R');
            $pdf->SetXY(120, 30);
            $pdf->Cell(75, 5, 'Tel: ' . $empresa['telefono'], 0, 1, 'R');
            $pdf->SetXY(120, 35);
            $pdf->Cell(75, 5, 'CIF: ' . $empresa['cif'], 0, 1, 'R');
            
            // Título del documento
            $pdf->SetFont('helvetica', 'B', 16);
            $pdf->SetXY(15, 50);
            $pdf->Cell(180, 10, 'INFORME DE HORAS TRABAJADAS', 0, 1, 'C');
            $pdf->SetFont('helvetica', 'B', 14);
            $pdf->Cell(180, 10, "{$nombreMes} {$anio}", 0, 1, 'C');
            
            // Línea horizontal decorativa
            $pdf->SetDrawColor(0, 102, 153);
            $pdf->SetLineWidth(0.5);
            $pdf->Line(15, 72, 195, 72);
            $pdf->SetLineWidth(0.2);
            $pdf->SetDrawColor(0, 0, 0);
            
            $pdf->Ln(5);
            
            // Información del empleado
            $pdf->SetFillColor(240, 248, 255);
            $pdf->SetFont('helvetica', 'B', 12);
            $pdf->Cell(180, 8, 'DATOS DEL EMPLEADO', 0, 1, 'L', true);
            
            $pdf->SetFont('helvetica', 'B', 10);
            $pdf->Cell(40, 7, 'Nombre:', 0, 0, 'L');
            $pdf->SetFont('helvetica', '', 10);
            $pdf->Cell(140, 7, $usuario['nombre'] . ' ' . ($usuario['apellidos'] ?? ''), 0, 1, 'L');
            
            $pdf->SetFont('helvetica', 'B', 10);
            $pdf->Cell(40, 7, 'NIF:', 0, 0, 'L');
            $pdf->SetFont('helvetica', '', 10);
            $pdf->Cell(60, 7, $usuario['NIF'], 0, 0, 'L');
            $pdf->SetFont('helvetica', 'B', 10);
            $pdf->Cell(40, 7, 'Departamento:', 0, 0, 'L');
            $pdf->SetFont('helvetica', '', 10);
            $pdf->Cell(40, 7, $usuario['dpto'] ?? 'No asignado', 0, 1, 'L');
            
            $pdf->SetFont('helvetica', 'B', 10);
            $pdf->Cell(40, 7, 'Correo:', 0, 0, 'L');
            $pdf->SetFont('helvetica', '', 10);
            $pdf->Cell(140, 7, $usuario['correo'] ?? 'No disponible', 0, 1, 'L');
            
            $pdf->SetFont('helvetica', 'B', 10);
            $pdf->Cell(40, 7, 'Puesto:', 0, 0, 'L');
            $pdf->SetFont('helvetica', '', 10);
            $pdf->Cell(140, 7, $this->obtenerPuestoUsuario($usuario['NIF']), 0, 1, 'L');
            
            $pdf->Ln(5);
            
            // Tabla de registros
            $pdf->SetFont('helvetica', 'B', 12);
            $pdf->SetFillColor(240, 248, 255);
            $pdf->Cell(180, 8, 'REGISTRO DETALLADO DE FICHAJES', 0, 1, 'L', true);
            
            // Encabezados de tabla
            $pdf->SetFont('helvetica', 'B', 9);
            $pdf->SetFillColor(0, 102, 153);
            $pdf->SetTextColor(255, 255, 255);
            
            $pdf->Cell(25, 7, 'FECHA', 1, 0, 'C', true);
            $pdf->Cell(20, 7, 'DÍA', 1, 0, 'C', true);
            $pdf->Cell(25, 7, 'ENTRADA', 1, 0, 'C', true);
            $pdf->Cell(25, 7, 'SALIDA', 1, 0, 'C', true);
            $pdf->Cell(25, 7, 'HORAS', 1, 0, 'C', true);
            $pdf->Cell(60, 7, 'OBSERVACIONES', 1, 1, 'C', true);
            
            // Filas de datos
            $pdf->SetFont('helvetica', '', 9);
            $pdf->SetTextColor(0, 0, 0);
            
            $diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
            $totalMinutosReales = 0;
            $totalDiasAsistidos = 0;
            $colorAlternado = false;
            
            if (!empty($fichajes)) {
                foreach ($fichajes as $fichaje) {
                    // Formatear fecha
                    $fechaObj = new DateTime($fichaje['fecha']);
                    $fecha = $fechaObj->format('d/m/Y');
                    $diaSemana = $diasSemana[$fechaObj->format('w')];
                    
                    // Calcular horas trabajadas en este fichaje
                    $horasTrabajadas = '';
                    $minutosReales = 0;
                    if (isset($fichaje['hora_entrada']) && isset($fichaje['hora_salida'])) {
                        $entrada = strtotime($fichaje['hora_entrada']);
                        $salida = strtotime($fichaje['hora_salida']);
                        
                        if ($entrada && $salida && $salida > $entrada) {
                            $minutosReales = ($salida - $entrada) / 60;
                            $horas = floor($minutosReales / 60);
                            $mins = $minutosReales % 60;
                            $horasTrabajadas = sprintf("%02d:%02d", $horas, $mins);
                            $totalMinutosReales += $minutosReales;
                            $totalDiasAsistidos++;
                        }
                    }
                    
                    // Colores alternados para filas
                    if ($colorAlternado) {
                        $pdf->SetFillColor(245, 245, 245);
                    } else {
                        $pdf->SetFillColor(255, 255, 255);
                    }
                    $colorAlternado = !$colorAlternado;
                    
                    // Formatear comentario
                    $comentario = isset($fichaje['comentario']) ? $fichaje['comentario'] : '';
                    if (strlen($comentario) > 32) {
                        $comentario = substr($comentario, 0, 29) . '...';
                    }
                    
                    $pdf->Cell(25, 6, $fecha, 1, 0, 'C', true);
                    $pdf->Cell(20, 6, $diaSemana, 1, 0, 'C', true);
                    $pdf->Cell(25, 6, $fichaje['hora_entrada'] ?? '-', 1, 0, 'C', true);
                    $pdf->Cell(25, 6, $fichaje['hora_salida'] ?? '-', 1, 0, 'C', true);
                    $pdf->Cell(25, 6, $horasTrabajadas, 1, 0, 'C', true);
                    $pdf->Cell(60, 6, $comentario, 1, 1, 'L', true);
                }
            } else {
                $pdf->SetFillColor(255, 255, 255);
                $pdf->Cell(180, 7, 'No hay registros para este período', 1, 1, 'C', true);
            }
            
            $pdf->Ln(5);
            
            // Resumen de horas - Versión mejorada
            $pdf->SetFillColor(240, 248, 255);
            $pdf->SetFont('helvetica', 'B', 12);
            $pdf->Cell(180, 8, 'RESUMEN DE ACTIVIDAD', 0, 1, 'L', true);
            
            // Crear tabla de resumen
            $pdf->SetFont('helvetica', 'B', 10);
            
            // Primera fila de la tabla de resumen
            $pdf->SetFillColor(0, 102, 153);
            $pdf->SetTextColor(255, 255, 255);
            $pdf->Cell(90, 7, 'CONCEPTO', 1, 0, 'C', true);
            $pdf->Cell(90, 7, 'VALOR', 1, 1, 'C', true);
            
            // Contenido de la tabla de resumen
            $pdf->SetTextColor(0, 0, 0);
            
            // Calcular horas totales reales (basadas en los registros procesados)
            $horasReales = floor($totalMinutosReales / 60);
            $minutosReales = $totalMinutosReales % 60;
            
            // Días laborables del mes
            $diasLaborables = $this->obtenerDiasLaborablesMes($mes, $anio);
            
            // Alternar colores en las filas
            $filas = [
                ['Total días trabajados', $totalDiasAsistidos . ' días'],
                ['Días laborables en el mes', $diasLaborables . ' días'],
                ['Asistencia', round(($totalDiasAsistidos / $diasLaborables) * 100, 2) . '%'],
                ['Total horas trabajadas', sprintf("%02d:%02d h", $horasReales, $minutosReales)],
                ['Media diaria', sprintf("%02d:%02d h", floor(($totalMinutosReales / $totalDiasAsistidos) / 60), ($totalMinutosReales / $totalDiasAsistidos) % 60)]
            ];
            
            $colorAlternado = false;
            foreach ($filas as $fila) {
                if ($colorAlternado) {
                    $pdf->SetFillColor(245, 245, 245);
                } else {
                    $pdf->SetFillColor(255, 255, 255);
                }
                $colorAlternado = !$colorAlternado;
                
                $pdf->SetFont('helvetica', 'B', 10);
                $pdf->Cell(90, 7, $fila[0], 1, 0, 'L', true);
                $pdf->SetFont('helvetica', '', 10);
                $pdf->Cell(90, 7, $fila[1], 1, 1, 'C', true);
            }
            
            // Agregar gráfico de barras simple
            $pdf->Ln(5);
            $pdf->SetFillColor(240, 248, 255);
            $pdf->SetFont('helvetica', 'B', 12);
            $pdf->Cell(180, 8, 'DISTRIBUCIÓN SEMANAL DE HORAS', 0, 1, 'L', true);
            
            // Calcular horas por semana
            $horasPorSemana = $this->calcularHorasPorSemana($fichajes);
            
            // Dibujar gráfico de barras
            $pdf->Ln(5);
            $maxHoras = max($horasPorSemana);
            $anchoGrafico = 180;
            $altoGrafico = 40;
            $altoMaxBarra = 30;
            $xInicio = 15;
            $yInicio = $pdf->GetY() + $altoGrafico;
            
            // Dibujar ejes
            $pdf->SetDrawColor(0, 0, 0);
            $pdf->Line($xInicio, $yInicio, $xInicio + $anchoGrafico, $yInicio); // Eje X
            $pdf->Line($xInicio, $yInicio, $xInicio, $yInicio - $altoGrafico); // Eje Y
            
            // Dibujar barras
            $anchoBarra = 30;
            $espacioEntreBarras = 10;
            $xActual = $xInicio + 20;
            
            foreach ($horasPorSemana as $semana => $horas) {
                $altoBarra = ($horas / $maxHoras) * $altoMaxBarra;
                $pdf->SetFillColor(0, 102, 153);
                $pdf->Rect($xActual, $yInicio - $altoBarra, $anchoBarra, $altoBarra, 'F');
                
                // Etiqueta de semana
                $pdf->SetXY($xActual, $yInicio + 2);
                $pdf->SetFont('helvetica', '', 8);
                $pdf->Cell($anchoBarra, 5, 'Semana ' . $semana, 0, 0, 'C');
                
                // Valor de horas
                $pdf->SetXY($xActual, $yInicio - $altoBarra - 5);
                $pdf->Cell($anchoBarra, 5, number_format($horas, 1) . 'h', 0, 0, 'C');
                
                $xActual += $anchoBarra + $espacioEntreBarras;
            }
            
            // Pie de página con información legal
            $pdf->SetY(265);
            $pdf->SetDrawColor(0, 102, 153);
            $pdf->SetLineWidth(0.5);
            $pdf->Line(15, $pdf->GetY(), 195, $pdf->GetY());
            $pdf->SetLineWidth(0.2);
            $pdf->SetDrawColor(0, 0, 0);
            
            $pdf->Ln(2);
            $pdf->SetFont('helvetica', 'I', 8);
            $pdf->Cell(180, 5, 'Este documento es un informe oficial de horas trabajadas emitido por ' . $empresa['nombre'], 0, 1, 'C');
            $pdf->Cell(180, 5, 'Documento generado el ' . date('d/m/Y') . ' a las ' . date('H:i:s'), 0, 1, 'C');
            $pdf->SetFont('helvetica', 'B', 8);
            $pdf->Cell(180, 5, $empresa['web'] . ' - ' . $empresa['email'], 0, 1, 'C');
            
            // Guardar PDF
            $pdf->Output($rutaArchivo, 'F');
            
            return true;
        } catch (Exception $e) {
            // Registrar el error en el log del sistema
            error_log("Error al generar PDF: " . $e->getMessage());
            throw $e; // Re-lanzar para manejarlo arriba
        }
    }
    
    /**
     * Registra el informe generado en la base de datos
     * 
     * @param string $nif NIF del empleado
     * @param int $mes Mes del informe
     * @param int $anio Año del informe
     * @param string $nombreArchivo Nombre del archivo generado
     * @return int ID del informe registrado
     */
    private function registrarInforme($nif, $mes, $anio, $nombreArchivo) {
        // Crear tabla si no existe
        $this->crearTablaInformes();
        
        $query = "INSERT INTO informes (nif_usuario, mes, anio, nombre_archivo, fecha_generacion) 
                  VALUES (?, ?, ?, ?, NOW())";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bind_param("siis", $nif, $mes, $anio, $nombreArchivo);
        $stmt->execute();
        
        return $stmt->insert_id;
    }
    
    /**
     * Obtiene un informe específico por su ID
     * 
     * @param int $id ID del informe
     * @return array|false Datos del informe o false si no existe
     */
    public function obtenerReporte($id) {
        $query = "SELECT i.*, u.nombre, u.apellidos 
                  FROM informes i 
                  LEFT JOIN usuarios u ON i.nif_usuario = u.NIF 
                  WHERE i.id = ?";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows > 0) {
            $informe = $result->fetch_assoc();
            // Agregar ruta completa al archivo
            $informe['ruta_archivo'] = $this->pdfDir . $informe['nombre_archivo'];
            return $informe;
        }
        
        return false;
    }
    
    /**
     * Obtiene el historial de informes generados
     * 
     * @param int $limite Límite de registros a devolver
     * @return array Lista de informes
     */
    public function obtenerHistorialReportes($limite = 50) {
        $query = "SELECT i.*, u.nombre, u.apellidos 
                  FROM informes i 
                  LEFT JOIN usuarios u ON i.nif_usuario = u.NIF 
                  ORDER BY i.fecha_generacion DESC 
                  LIMIT ?";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bind_param("i", $limite);
        $stmt->execute();
        $result = $stmt->get_result();
        
        $informes = [];
        while ($row = $result->fetch_assoc()) {
            // Convertir IDs de mes a nombres
            $nombresMeses = [
                1 => 'Enero', 2 => 'Febrero', 3 => 'Marzo', 4 => 'Abril',
                5 => 'Mayo', 6 => 'Junio', 7 => 'Julio', 8 => 'Agosto',
                9 => 'Septiembre', 10 => 'Octubre', 11 => 'Noviembre', 12 => 'Diciembre'
            ];
            
            $row['nombre_mes'] = isset($nombresMeses[$row['mes']]) ? $nombresMeses[$row['mes']] : '';
            $row['nombre_completo'] = $row['nombre'] . ' ' . ($row['apellidos'] ?? '');
            
            $informes[] = $row;
        }
        
        return $informes;
    }
    
    /**
     * Crea la tabla de informes si no existe
     */
    private function crearTablaInformes() {
        $query = "CREATE TABLE IF NOT EXISTS informes (
            id INT AUTO_INCREMENT PRIMARY KEY,
            nif_usuario VARCHAR(15) NOT NULL,
            mes INT NOT NULL,
            anio INT NOT NULL,
            nombre_archivo VARCHAR(255) NOT NULL,
            fecha_generacion DATETIME NOT NULL,
            FOREIGN KEY (nif_usuario) REFERENCES usuarios(NIF)
        )";
        
        $this->conn->query($query);
    }
}
?>
