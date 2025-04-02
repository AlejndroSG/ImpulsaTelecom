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

echo "=== TEST DE PERÍODO ANUAL ===\n\n";
echo "Usuarios encontrados para pruebas: " . implode(", ", $usuarios) . "\n\n";

// Obtener estadísticas para el primer usuario encontrado
$id_usuario = $usuarios[0];

// Probar ambas variantes del período anual
$variantes = ['año', 'anio'];

foreach ($variantes as $variante) {
    echo "\nProbando período: $variante\n";
    echo "---------------------------\n";
    
    // Obtener estadísticas
    $estadisticas = $fichaje->getEstadisticas($id_usuario, $variante);
    
    if ($estadisticas) {
        echo "  - Total horas: {$estadisticas['totalHoras']}\n";
        echo "  - Total días: {$estadisticas['totalDias']}\n";
        echo "  - Promedio diario: {$estadisticas['promedioHorasDiarias']}\n";
        echo "  - Datos por día: " . count($estadisticas['datosPorDia']) . " registros\n";
        
        // Mostrar algunos datos por día
        if (!empty($estadisticas['datosPorDia'])) {
            echo "  - Ejemplo de datos por día:\n";
            foreach (array_slice($estadisticas['datosPorDia'], 0, 3) as $dato) {
                echo "      * Fecha: {$dato['fecha']}, Horas: {$dato['horasTrabajadas']}\n";
            }
        }
    } else {
        echo "  - No se pudieron obtener estadísticas\n";
    }
}

// Mostrar contenido del archivo de log
echo "\n=== CONTENIDO DEL ARCHIVO DE LOG ===\n\n";
$logFile = __DIR__ . '/logs/estadisticas.log';

if (file_exists($logFile)) {
    // Leer las últimas 50 líneas del log para no mostrar todo
    $logContent = shell_exec("tail -n 50 $logFile");
    echo $logContent;
} else {
    echo "El archivo de log no existe todavía.\n";
}

echo "\n\nPrueba completada.";
