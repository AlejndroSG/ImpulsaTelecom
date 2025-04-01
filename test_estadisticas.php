<?php
include_once "backend/modelos/Fichaje.php";

// Configuración de cabeceras para mostrar texto plano
header("Content-Type: text/plain; charset=UTF-8");

// Crear instancia de Fichaje
$fichaje = new Fichaje();

// Mostrar la tabla que se está utilizando
echo "Tabla utilizada: {$fichaje->getTableName()}\n\n";

// Obtener usuarios de la base de datos para pruebas
$conn = $fichaje->getConn();
$query = "SELECT DISTINCT NIF FROM registros LIMIT 5";
$result = $conn->query($query);

$usuarios = [];
if ($result && $result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        $usuarios[] = $row['NIF'];
    }
}

if (empty($usuarios)) {
    echo "No se encontraron usuarios en la base de datos. Usando ID de prueba.\n";
    $usuarios = ['12345678A'];
}

echo "=== TEST DE ESTADÍSTICAS ===\n\n";
echo "Usuarios encontrados para pruebas: " . implode(", ", $usuarios) . "\n\n";

// Obtener estadísticas para el primer usuario encontrado
$id_usuario = $usuarios[0];
$periodos = ['semana', 'mes', 'trimestre', 'año'];

$output = "";

foreach ($periodos as $periodo) {
    $output .= "Obteniendo estadísticas para usuario: $id_usuario, período: $periodo\n";
    $estadisticas = $fichaje->getEstadisticas($id_usuario, $periodo);
    
    if ($estadisticas) {
        $output .= "  - Total horas: {$estadisticas['totalHoras']}\n";
        $output .= "  - Total días: {$estadisticas['totalDias']}\n";
        $output .= "  - Promedio diario: {$estadisticas['promedioHorasDiarias']}\n";
        $output .= "  - Datos por día: " . count($estadisticas['datosPorDia']) . " registros\n";
        
        // Mostrar algunos datos por día
        if (!empty($estadisticas['datosPorDia'])) {
            $output .= "  - Ejemplo de datos por día:\n";
            foreach (array_slice($estadisticas['datosPorDia'], 0, 3) as $dato) {
                $output .= "      * Fecha: {$dato['fecha']}, Horas: {$dato['horasTrabajadas']}\n";
            }
        }
    } else {
        $output .= "  - No se pudieron obtener estadísticas\n";
    }
    
    $output .= "\n";
}

// Mostrar contenido del archivo de log
$output .= "=== CONTENIDO DEL ARCHIVO DE LOG ===\n\n";
$logFile = __DIR__ . '/logs/estadisticas.log';

if (file_exists($logFile)) {
    $logContent = file_get_contents($logFile);
    $output .= $logContent;
} else {
    $output .= "El archivo de log no existe todavía.\n";
}

// Mostrar en pantalla
echo $output;

// Guardar en un archivo para poder revisarlo después
$resultFile = __DIR__ . '/logs/test_results.txt';
$resultDir = dirname($resultFile);

// Crear directorio si no existe
if (!file_exists($resultDir)) {
    mkdir($resultDir, 0777, true);
}

file_put_contents($resultFile, $output);
echo "\n\nLos resultados también se han guardado en: $resultFile";
