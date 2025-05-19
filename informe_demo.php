<?php
// Activar reporte de errores
ini_set('display_errors', 1);
error_reporting(E_ALL);

// Datos simulados para demostración
$usuario = [
    'NIF' => '12345678A',
    'nombre' => 'Usuario',
    'apellidos' => 'Demostración',
    'correo' => 'demo@impulsatelecom.com',
    'dpto' => 'Desarrollo',
    'tipo_usuario' => 'empleado'
];

// Fechas de demostración
$mes = date('n');
$anio = date('Y');
$nombresMeses = [
    1 => 'Enero', 2 => 'Febrero', 3 => 'Marzo', 4 => 'Abril',
    5 => 'Mayo', 6 => 'Junio', 7 => 'Julio', 8 => 'Agosto',
    9 => 'Septiembre', 10 => 'Octubre', 11 => 'Noviembre', 12 => 'Diciembre'
];
$nombreMes = isset($nombresMeses[$mes]) ? $nombresMeses[$mes] : '';

// Fichajes de demostración
$fichajes = [];
$mesPadded = str_pad($mes, 2, '0', STR_PAD_LEFT);
$fechaInicio = "{$anio}-{$mesPadded}-01";
$fechaFin = date('Y-m-t', strtotime($fechaInicio));

// Generar datos de ejemplo para el mes actual
$currentDay = new DateTime($fechaInicio);
$endDay = new DateTime($fechaFin);
$endDay->modify('+1 day');

$totalMinutos = 0;
$diasTrabajados = 0;

// Solo incluir días laborables (lunes a viernes)
while ($currentDay < $endDay) {
    $dayOfWeek = $currentDay->format('N');
    
    // Si es día laborable (1-5 = lunes a viernes)
    if ($dayOfWeek >= 1 && $dayOfWeek <= 5) {
        $entradaHora = rand(8, 9);
        $entradaMinuto = rand(0, 59);
        $duracionHoras = rand(7, 9);
        $duracionMinutos = rand(0, 59);
        
        $entrada = sprintf('%02d:%02d:00', $entradaHora, $entradaMinuto);
        
        $salidaTime = $entradaHora * 3600 + $entradaMinuto * 60 + $duracionHoras * 3600 + $duracionMinutos * 60;
        $salidaHora = floor($salidaTime / 3600) % 24;
        $salidaMinuto = floor(($salidaTime % 3600) / 60);
        $salida = sprintf('%02d:%02d:00', $salidaHora, $salidaMinuto);
        
        $minutosHoy = $duracionHoras * 60 + $duracionMinutos;
        $totalMinutos += $minutosHoy;
        $diasTrabajados++;
        
        $fichajes[] = [
            'idRegistro' => rand(1000, 9999),
            'fecha' => $currentDay->format('Y-m-d'),
            'hora_entrada' => $entrada,
            'hora_salida' => $salida,
            'comentario' => rand(0, 5) > 3 ? 'Comentario de ejemplo para el fichaje del día ' . $currentDay->format('d/m/Y') : '',
            'horas_trabajadas' => sprintf('%02d:%02d', $duracionHoras, $duracionMinutos)
        ];
    }
    
    $currentDay->modify('+1 day');
}

// Convertir minutos totales a horas y minutos
$totalHoras = floor($totalMinutos / 60);
$totalMins = $totalMinutos % 60;

// Generar ID único para este reporte
$reporteId = 'DEMO-' . uniqid();

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
    <title>DEMOSTRACIÓN - Informe de Horas Trabajadas - <?php echo htmlspecialchars($usuario['nombre'] . ' ' . $usuario['apellidos']); ?> - <?php echo htmlspecialchars($nombreMes . ' ' . $anio); ?></title>
    <style>
        body {
            font-family: 'Segoe UI', Arial, sans-serif;
            margin: 0;
            padding: 20px;
            color: #333;
            background-color: #f9f9f9;
        }
        .demo-banner {
            background-color: #ff6b6b;
            color: white;
            text-align: center;
            padding: 10px;
            margin-bottom: 20px;
            border-radius: 5px;
            font-weight: bold;
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
    <div class="demo-banner no-print">
        VERSIÓN DE DEMOSTRACIÓN - Los datos mostrados son ficticios
    </div>
    
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
            <p>Este documento es una demostración de informe de horas trabajadas de Impulsa Telecom.</p>
            <p>Los datos mostrados son ficticios y generados automáticamente para fines de demostración.</p>
            <p>Fecha de generación: <?php echo date('d/m/Y H:i:s'); ?></p>
            <p>ID del informe: <?php echo $reporteId; ?></p>
        </div>
    </div>
</body>
</html>
