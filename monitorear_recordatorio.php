<?php
// Script para monitorear los logs y verificar cuando se envu00ede el recordatorio

// Definir ruta del archivo de log
$log_file = __DIR__ . '/backend/logs/recordatorios_' . date('Y-m-d') . '.log';
$ultima_linea = 0;

// Incluir archivo de conexiu00f3n a BD
require_once __DIR__ . '/backend/modelos/bd.php';

// Conectar a la base de datos
$db = new db();
$conn = $db->getConn();

// Obtener la informaciu00f3n de Maru00eda
$query = "SELECT u.NIF, u.nombre, u.apellidos, u.email, h.hora_inicio 
         FROM usuarios u 
         JOIN horarios h ON u.id_horario = h.id 
         WHERE u.NIF = '56789012C'";

$resultado = $conn->query($query);

if (!$resultado || $resultado->num_rows == 0) {
    echo "ERROR: No se pudo obtener la informaciu00f3n de Maru00eda\n";
    exit;
}

$maria = $resultado->fetch_assoc();
$hora_entrada = $maria['hora_inicio'];
$hora_recordatorio = date('H:i:s', strtotime("$hora_entrada +5 minutes"));

echo "=== MONITORIZANDO LOGS PARA EL RECORDATORIO DE MARu00cdA ===\n";
echo "Hora actual: " . date('H:i:s') . "\n";
echo "Hora de entrada configurada: $hora_entrada\n";
echo "Hora prevista para el recordatorio: $hora_recordatorio (u00b12 minutos)\n\n";

// Verificar si ya se enviaron recordatorios hoy
$query_check = "SELECT * FROM recordatorios_enviados 
              WHERE NIF = '{$maria['NIF']}' 
              AND fecha = '" . date('Y-m-d') . "' 
              AND DATE_FORMAT(fecha_hora, '%H:%i') > '" . date('H:i', strtotime('-10 minutes')) . "' 
              ORDER BY fecha_hora DESC";

$resultado_check = $conn->query($query_check);

if ($resultado_check && $resultado_check->num_rows > 0) {
    while ($recordatorio = $resultado_check->fetch_assoc()) {
        echo "u00a1YA SE ENVIu00d3 UN RECORDATORIO RECIENTEMENTE!\n";
        echo "Tipo: {$recordatorio['tipo_recordatorio']}\n";
        echo "Fichaje: {$recordatorio['tipo_fichaje']}\n";
        echo "Hora programada: {$recordatorio['hora_programada']}\n";
        echo "Enviado: {$recordatorio['fecha_hora']}\n\n";
    }
} else {
    echo "Au00fan no se han enviado recordatorios recientes a Maru00eda\n\n";
}

echo "Monitorizando logs en tiempo real. Presione Ctrl+C para salir...\n";
echo "------------------------------------------------------------\n";

// Monitorear el archivo de log en tiempo real
while (true) {
    // Verificar si el archivo existe
    if (file_exists($log_file)) {
        $log_content = file_get_contents($log_file);
        $log_lines = explode("\n", $log_content);
        
        // Mostrar solo las nuevas lu00edneas
        for ($i = $ultima_linea; $i < count($log_lines); $i++) {
            if (!empty(trim($log_lines[$i]))) {
                echo $log_lines[$i] . "\n";
                
                // Verificar si hay mensaje de recordatorio
                if (strpos($log_lines[$i], "Recordatorio de entrada al trabajo enviado a Mar") !== false) {
                    echo "\nu00a1RECORDATORIO ENVIADO A MARu00cdA! Verificando base de datos...\n";
                    
                    // Consultar recordatorios enviados
                    $query_sent = "SELECT * FROM recordatorios_enviados 
                                 WHERE NIF = '{$maria['NIF']}' 
                                 AND fecha = '" . date('Y-m-d') . "' 
                                 ORDER BY fecha_hora DESC LIMIT 1";
                    
                    $resultado_sent = $conn->query($query_sent);
                    
                    if ($resultado_sent && $resultado_sent->num_rows > 0) {
                        $recordatorio = $resultado_sent->fetch_assoc();
                        echo "Detalles del recordatorio enviado:\n";
                        echo "ID: {$recordatorio['id']}\n";
                        echo "Tipo: {$recordatorio['tipo_recordatorio']}\n";
                        echo "Fichaje: {$recordatorio['tipo_fichaje']}\n";
                        echo "Hora programada: {$recordatorio['hora_programada']}\n";
                        echo "Enviado: {$recordatorio['fecha_hora']}\n\n";
                    }
                }
            }
        }
        
        $ultima_linea = count($log_lines);
    }
    
    // Esperar 1 segundo antes de verificar nuevamente
    sleep(1);
}

// Cerrar conexiu00f3n
$conn->close();
