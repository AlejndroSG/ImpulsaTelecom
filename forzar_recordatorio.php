<?php
// Script para forzar la ejecuciu00f3n directa del script de recordatorios y ver su resultado

// Definir el tiempo de inicio para medir rendimiento
$tiempo_inicio = microtime(true);

// Mostrar cabecera
echo "=== EJECUCIU00d3N FORZADA DEL SCRIPT DE RECORDATORIOS ===\n";
echo "Fecha y hora: " . date('Y-m-d H:i:s') . "\n\n";

// Definir rutas
$script_path = __DIR__ . '/backend/scripts/enviar_recordatorios.php';

// Verificar existencia del script
if (!file_exists($script_path)) {
    echo "ERROR: El script $script_path no existe\n";
    exit;
}

// Crear un buffer de salida para capturar logs
ob_start();

// Incluir el script
include_once $script_path;

// Capturar salida
$output = ob_get_clean();

// Mostrar tiempo de ejecuciu00f3n
$tiempo_total = microtime(true) - $tiempo_inicio;

// Mostrar resultado
echo "Ejecuciu00f3n completada en " . round($tiempo_total, 4) . " segundos\n\n";

// Verificar log de recordatorios para ver quu00e9 ha ocurrido
$log_path = __DIR__ . '/backend/logs/recordatorios_' . date('Y-m-d') . '.log';

if (file_exists($log_path)) {
    echo "=== u00daTIMAS ENTRADAS DEL LOG DE RECORDATORIOS ===\n";
    $log_content = file_get_contents($log_path);
    $log_lines = explode("\n", $log_content);
    
    // Mostrar las u00faltimas 15 lu00edneas del log
    $last_lines = array_slice($log_lines, -15);
    foreach ($last_lines as $line) {
        if (!empty(trim($line))) {
            echo $line . "\n";
        }
    }
} else {
    echo "No se encontru00f3 el archivo de log en $log_path\n";
}

// Verificar recordatorios enviados a Maru00eda despuu00e9s de la ejecuciu00f3n
echo "\n=== VERIFICANDO RECORDATORIOS ENVIADOS A MARu00cdA DESPUU00c9S DE LA EJECUCIU00d3N ===\n";

// Incluir archivo de conexiu00f3n a BD
require_once __DIR__ . '/backend/modelos/bd.php';

// Conectar a la base de datos
$db = new db();
$conn = $db->getConn();

// Consultar recordatorios enviados hoy a Maru00eda
$query = "SELECT * FROM recordatorios_enviados 
        WHERE NIF = '56789012C' 
        AND fecha = '" . date('Y-m-d') . "' 
        ORDER BY fecha_hora DESC LIMIT 5";

$resultado = $conn->query($query);

if (!$resultado || $resultado->num_rows == 0) {
    echo "Despuu00e9s de la ejecuciu00f3n, todavu00eda no hay recordatorios enviados a Maru00eda hoy\n";
} else {
    echo "Se encontraron los siguientes recordatorios enviados a Maru00eda hoy:\n";
    while ($recordatorio = $resultado->fetch_assoc()) {
        echo "ID: {$recordatorio['id']}\n";
        echo "Tipo: {$recordatorio['tipo_recordatorio']}\n";
        echo "Fichaje: {$recordatorio['tipo_fichaje']}\n";
        echo "Hora programada: {$recordatorio['hora_programada']}\n";
        echo "Enviado: {$recordatorio['fecha_hora']}\n\n";
    }
}

// Cerrar conexiu00f3n
$conn->close();
