<?php
// Script para actualizar la hora de entrada de Maru00eda para probar el sistema de recordatorios

// Incluir archivo de conexiu00f3n a BD
require_once __DIR__ . '/backend/modelos/bd.php';

// Conectar a la base de datos
$db = new db();
$conn = $db->getConn();

// Hora actual
$hora_actual = date('H:i:s');

// Establecer la hora de entrada específica a las 10:21:00
// Para forzar el envío automático del recordatorio
$nueva_hora_entrada = '10:21:00';

// Guardar la hora de entrada original para restaurarla despuu00e9s
$query_original = "SELECT u.id_horario, h.hora_inicio 
                 FROM usuarios u 
                 JOIN horarios h ON u.id_horario = h.id 
                 WHERE u.NIF = '56789012C'";

$resultado_original = $conn->query($query_original);

if (!$resultado_original || $resultado_original->num_rows == 0) {
    echo "ERROR: No se pudo obtener la hora original\n";
    exit;
}

$datos = $resultado_original->fetch_assoc();
$id_horario = $datos['id_horario'];
$hora_original = $datos['hora_inicio'];

echo "=== ACTUALIZANDO HORA DE ENTRADA DE MARu00cdA ===\n";
echo "Hora actual: $hora_actual\n";
echo "Hora de entrada original: $hora_original\n";
echo "Nueva hora de entrada: $nueva_hora_entrada\n";

// Actualizar la hora de entrada
$query_update = "UPDATE horarios 
               SET hora_inicio = '$nueva_hora_entrada' 
               WHERE id = $id_horario";

if ($conn->query($query_update)) {
    echo "\nu00a1HORA DE ENTRADA ACTUALIZADA CON u00c9XITO!\n";
    echo "La hora de entrada de Maru00eda ahora es $nueva_hora_entrada\n";
    
    // Configurar nueva hora para María exactamente a las 10:21:00 para forzar recordatorio
    $nueva_hora = '10:21:00';
    $nueva_hora_mostrar = $nueva_hora;
    
    echo "\nINFORMACIu00d3N IMPORTANTE:\n";
    echo "1. El recordatorio se enviaru00e1 a las $nueva_hora_mostrar (u00b12 minutos)\n";
    echo "2. El sistema verificaru00e1 automau00e1ticamente cada minuto si es hora de enviarlo\n";
    echo "3. No necesitas hacer nada, solo esperar y monitorear los logs\n";
    
    // Guardar la configuración original para restaurarla después
    $archivo = fopen(__DIR__ . '/hora_original_maria.txt', 'w');
    fwrite($archivo, "$hora_original|$id_horario");
    fclose($archivo);
    
    echo "\nLa hora original se ha guardado y se puede restaurar despuu00e9s con restaurar_hora_maria.php\n";
} else {
    echo "ERROR al actualizar la hora: " . $conn->error . "\n";
}

// Cerrar conexiu00f3n
$conn->close();
