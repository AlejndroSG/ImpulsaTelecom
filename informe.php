<?php
// Activar reporte de errores
ini_set('display_errors', 1);
error_reporting(E_ALL);

// Control de sesión
session_start();

// Verificar si el usuario ha iniciado sesión
if (!isset($_SESSION['usuario'])) {
    // Redirigir al script de informes de demostración (sin requerir sesión)
    header("Location: informe_demo.php");
    exit();
}

// Incluir archivos necesarios
require_once 'backend/config/database.php';
require_once 'backend/modelos/Usuario.php';
require_once 'backend/modelos/Fichaje.php';

// Obtener parámetros
$nif = isset($_GET['nif']) ? $_GET['nif'] : '';
$mes = isset($_GET['mes']) ? intval($_GET['mes']) : date('n'); // Mes actual por defecto
$anio = isset($_GET['anio']) ? intval($_GET['anio']) : date('Y'); // Año actual por defecto

// Validar parámetros
if (empty($nif)) {
    die("Error: NIF no especificado");
}

// Conectar a la base de datos
$database = new Database();
$conn = $database->getConnection();

// Obtener información del usuario
$usuario = null;
$query = "SELECT NIF, nombre, apellidos, correo, dpto, tipo_usuario FROM usuarios WHERE NIF = ?";
$stmt = $conn->prepare($query);
$stmt->bind_param("s", $nif);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows > 0) {
    $usuario = $result->fetch_assoc();
} else {
    die("Error: Usuario no encontrado");
}

// Formatear mes y año para consulta SQL
$mesPadded = str_pad($mes, 2, '0', STR_PAD_LEFT);
$fechaInicio = "{$anio}-{$mesPadded}-01";
$fechaFin = date('Y-m-t', strtotime($fechaInicio)); // Último día del mes

// Obtener fichajes del mes
$fichajes = [];
$query = "SELECT idRegistro, fecha, hora_entrada, hora_salida, comentario 
          FROM registros 
          WHERE NIF = ? AND fecha BETWEEN ? AND ?
          ORDER BY fecha, hora_entrada";

$stmt = $conn->prepare($query);
$stmt->bind_param("sss", $nif, $fechaInicio, $fechaFin);
$stmt->execute();
$result = $stmt->get_result();

while ($row = $result->fetch_assoc()) {
    $fichajes[] = $row;
}

// Calcular totales
$totalMinutos = 0;
$diasTrabajados = count($fichajes);

foreach ($fichajes as &$fichaje) {
    if (isset($fichaje['hora_entrada']) && isset($fichaje['hora_salida'])) {
        $entrada = strtotime($fichaje['hora_entrada']);
        $salida = strtotime($fichaje['hora_salida']);
        
        if ($entrada && $salida && $salida > $entrada) {
            $minutos = ($salida - $entrada) / 60;
            $totalMinutos += $minutos;
            
            // Agregar horas trabajadas al fichaje para mostrar
            $horas = floor($minutos / 60);
            $mins = $minutos % 60;
            $fichaje['horas_trabajadas'] = sprintf("%02d:%02d", $horas, $mins);
        } else {
            $fichaje['horas_trabajadas'] = "00:00";
        }
    } else {
        $fichaje['horas_trabajadas'] = "00:00";
    }
}

// Convertir minutos totales a horas y minutos
$totalHoras = floor($totalMinutos / 60);
$totalMins = $totalMinutos % 60;

// Nombre del mes
$nombresMeses = [
    1 => 'Enero', 2 => 'Febrero', 3 => 'Marzo', 4 => 'Abril',
    5 => 'Mayo', 6 => 'Junio', 7 => 'Julio', 8 => 'Agosto',
    9 => 'Septiembre', 10 => 'Octubre', 11 => 'Noviembre', 12 => 'Diciembre'
];
$nombreMes = isset($nombresMeses[$mes]) ? $nombresMeses[$mes] : '';

// Generar ID único para este reporte
$reporteId = uniqid();

// Guardar información del reporte para referencias futuras
try {
    $query = "INSERT INTO informes (nif_usuario, mes, anio, nombre_archivo, fecha_generacion) 
            VALUES (?, ?, ?, ?, NOW())";
    $nombreArchivo = "reporte_html_{$nif}_{$mes}_{$anio}_{$reporteId}";
    $stmt = $conn->prepare($query);
    $stmt->bind_param("siis", $nif, $mes, $anio, $nombreArchivo);
    $stmt->execute();
    $idInforme = $stmt->insert_id;
} catch (Exception $e) {
    // Silenciar errores de inserción para no interrumpir la generación del informe
    error_log("Error al registrar informe: " . $e->getMessage());
}

// HTTP headers
header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Cache-Control: post-check=0, pre-check=0", false);
header("Pragma: no-cache");
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Informe de Horas Trabajadas - <?php echo htmlspecialchars($usuario['nombre'] . ' ' . $usuario['apellidos']); ?> - <?php echo htmlspecialchars($nombreMes . ' ' . $anio); ?></title>
    <style>
        body {
            font-family: 'Segoe UI', Arial, sans-serif;
            margin: 0;
            padding: 20px;
            color: #333;
            background-color: #f9f9f9;
        }
        .report-container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 20px;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
            border-radius: 8px;
        }
        .report-header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
            border-bottom: 2px solid #f0f0f0;
            padding-bottom: 20px;
        }
        .logo-placeholder {
            width: 100px;
            height: 50px;
            background-color: #78bd00;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            border-radius: 4px;
        }
        .report-title {
            text-align: right;
        }
        h1 {
            color: #555;
            margin: 0 0 10px 0;
            font-size: 24px;
        }
        h2 {
            color: #666;
            margin: 20px 0 10px 0;
            font-size: 18px;
            border-bottom: 1px solid #eee;
            padding-bottom: 5px;
        }
        .employee-info {
            background-color: #f9f9f9;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 20px;
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
        }
        .info-item {
            margin-bottom: 8px;
        }
        .info-label {
            font-weight: bold;
            color: #555;
            display: block;
            font-size: 14px;
        }
        .info-value {
            color: #333;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        th, td {
            padding: 10px;
            border: 1px solid #ddd;
            text-align: left;
        }
        th {
            background-color: #f5f5f5;
            font-weight: bold;
            color: #555;
        }
        tr:nth-child(even) {
            background-color: #f9f9f9;
        }
        .summary {
            background-color: #f0f7ff;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
        }
        .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 12px;
            color: #999;
            border-top: 1px solid #eee;
            padding-top: 15px;
        }
        .print-download {
            display: flex;
            justify-content: center;
            gap: 15px;
            margin: 20px 0;
        }
        .btn {
            background-color: #78bd00;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 4px;
            cursor: pointer;
            font-weight: bold;
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            gap: 5px;
        }
        .btn:hover {
            background-color: #69a500;
        }
        .btn-secondary {
            background-color: #4a7aff;
        }
        .btn-secondary:hover {
            background-color: #3a6ae9;
        }
        @media print {
            body {
                padding: 0;
                background-color: white;
            }
            .report-container {
                box-shadow: none;
                max-width: 100%;
                padding: 0;
            }
            .print-download {
                display: none;
            }
            .no-print {
                display: none;
            }
        }
    </style>
</head>
<body>
    <div class="report-container">
        <div class="report-header">
            <div class="logo-placeholder">IT</div>
            <div class="report-title">
                <h1>INFORME DE HORAS TRABAJADAS</h1>
                <div><?php echo htmlspecialchars($nombreMes . ' ' . $anio); ?></div>
            </div>
        </div>
        
        <h2>DATOS DEL EMPLEADO</h2>
        <div class="employee-info">
            <div class="info-item">
                <span class="info-label">Nombre:</span>
                <span class="info-value"><?php echo htmlspecialchars($usuario['nombre'] . ' ' . $usuario['apellidos']); ?></span>
            </div>
            <div class="info-item">
                <span class="info-label">NIF:</span>
                <span class="info-value"><?php echo htmlspecialchars($usuario['NIF']); ?></span>
            </div>
            <div class="info-item">
                <span class="info-label">Departamento:</span>
                <span class="info-value"><?php echo htmlspecialchars($usuario['dpto'] ?? 'No asignado'); ?></span>
            </div>
            <div class="info-item">
                <span class="info-label">Correo:</span>
                <span class="info-value"><?php echo htmlspecialchars($usuario['correo'] ?? 'No disponible'); ?></span>
            </div>
        </div>
        
        <h2>REGISTROS DE FICHAJES</h2>
        <?php if (count($fichajes) > 0): ?>
            <table>
                <thead>
                    <tr>
                        <th>Fecha</th>
                        <th>Entrada</th>
                        <th>Salida</th>
                        <th>Horas</th>
                        <th>Comentario</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($fichajes as $fichaje): ?>
                        <tr>
                            <td><?php echo date('d/m/Y', strtotime($fichaje['fecha'])); ?></td>
                            <td><?php echo $fichaje['hora_entrada'] ?? '-'; ?></td>
                            <td><?php echo $fichaje['hora_salida'] ?? '-'; ?></td>
                            <td><?php echo $fichaje['horas_trabajadas']; ?></td>
                            <td><?php 
                                $comentario = isset($fichaje['comentario']) ? $fichaje['comentario'] : '';
                                if (strlen($comentario) > 25) {
                                    $comentario = substr($comentario, 0, 22) . '...';
                                }
                                echo htmlspecialchars($comentario);
                            ?></td>
                        </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        <?php else: ?>
            <p>No hay registros para este período.</p>
        <?php endif; ?>
        
        <h2>RESUMEN</h2>
        <div class="summary">
            <div class="info-item">
                <span class="info-label">Total días trabajados:</span>
                <span class="info-value"><?php echo $diasTrabajados; ?></span>
            </div>
            <div class="info-item">
                <span class="info-label">Total horas trabajadas:</span>
                <span class="info-value"><?php echo sprintf("%d horas y %d minutos", $totalHoras, $totalMins); ?></span>
            </div>
        </div>
        
        <div class="print-download no-print">
            <button class="btn" onclick="window.print()">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="6 9 6 2 18 2 18 9"></polyline>
                    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                    <rect x="6" y="14" width="12" height="8"></rect>
                </svg>
                Imprimir Informe
            </button>
            <a href="frontend" class="btn btn-secondary">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                    <polyline points="9 22 9 12 15 12 15 22"></polyline>
                </svg>
                Volver al Dashboard
            </a>
        </div>
        
        <div class="footer">
            <p>Este documento es un informe oficial de horas trabajadas generado por Impulsa Telecom.</p>
            <p>Fecha de generación: <?php echo date('d/m/Y H:i:s'); ?></p>
            <p>ID del informe: <?php echo $reporteId; ?></p>
        </div>
    </div>
</body>
</html>
