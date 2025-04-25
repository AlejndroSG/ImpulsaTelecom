<?php
// Script para probar el envu00edo inmediato del recordatorio a Maru00eda

// Incluir archivos necesarios
require_once __DIR__ . '/backend/modelos/bd.php';

// Conectar a la base de datos
$db = new db();
$conn = $db->getConn();

// Obtener la hora actual 
date_default_timezone_set('Europe/Madrid');
$hora_actual = date('H:i:s');
$minutos_atras = date('H:i:s', strtotime('-3 minutes')); // 3 minutos antes para que coincida con el recordatorio (+5 min)

echo "=== PRUEBA FINAL DEL SISTEMA DE RECORDATORIOS ===\n";
echo "Hora actual: $hora_actual\n";
echo "Configurando horario de entrada de Maru00eda a: $minutos_atras\n";

// Primero, vamos a buscar el id del horario de Maru00eda
$query = "SELECT id_horario FROM usuarios WHERE NIF = '56789012C'";
$resultado = $conn->query($query);

if (!$resultado || $resultado->num_rows == 0) {
    echo "ERROR: No se pudo encontrar el horario de Maru00eda\n";
    exit;
}

$horario_id = $resultado->fetch_assoc()['id_horario'];
echo "ID de horario de Maru00eda: $horario_id\n";

// Guardar el horario original antes de modificarlo
$query_original = "SELECT hora_inicio FROM horarios WHERE id = $horario_id";
$resultado_original = $conn->query($query_original);
$hora_original = $resultado_original->fetch_assoc()['hora_inicio'];
echo "Horario original guardado: $hora_original\n";

// Actualizar temporalmente la hora de entrada de Maru00eda
$update = "UPDATE horarios SET hora_inicio = '$minutos_atras' WHERE id = $horario_id";

if ($conn->query($update)) {
    echo "\nu00a1HORARIO ACTUALIZADO CON u00c9XITO!\n";
    echo "Se estableciu00f3 la hora de entrada a $minutos_atras\n";
    echo "\nEjecutando el script actualizado...\n";
    
    // Ejecutamos un comando separado para el script actualizado
    $output = shell_exec('php "' . __DIR__ . '/backend/scripts/recordatorios_multiple_actualizado.php"');
    echo "\nResultado de la ejecuciu00f3n:\n$output\n";
    
    echo "\nIMPORTANTE: Restaurando el horario original...\n";
    
    // Restaurar el horario original
    $restore = "UPDATE horarios SET hora_inicio = '$hora_original' WHERE id = $horario_id";
    if ($conn->query($restore)) {
        echo "Horario restaurado correctamente a $hora_original\n";
    } else {
        echo "ERROR al restaurar el horario: " . $conn->error . "\n";
    }
    
    // Verificar si el recordatorio se enviu00f3
    echo "\n=== VERIFICANDO SI EL RECORDATORIO FUE ENVIADO ===\n";
    $query_recordatorio = "SELECT * FROM recordatorios_enviados 
                      WHERE NIF = '56789012C' 
                      AND fecha = '" . date('Y-m-d') . "' 
                      ORDER BY fecha_hora DESC LIMIT 1";
    
    $resultado_recordatorio = $conn->query($query_recordatorio);
    
    if ($resultado_recordatorio && $resultado_recordatorio->num_rows > 0) {
        $recordatorio = $resultado_recordatorio->fetch_assoc();
        echo "u00a1RECORDATORIO ENVIADO CON u00c9XITO!\n";
        echo "Tipo: {$recordatorio['tipo_recordatorio']}\n";
        echo "Hora programada: {$recordatorio['hora_programada']}\n";
        echo "Enviado: {$recordatorio['fecha_hora']}\n";
        echo "\nVERIFICA EL CORREO elreibo30@gmail.com PARA CONFIRMAR LA RECEPCIU00d3N\n";
    } else {
        echo "u00a1ALENCIU00d3N! No se detectu00f3 el envu00edo del recordatorio en la base de datos.\n";
        echo "Revisa los logs para mãs informaciu00f3n.\n";
    }
} else {
    echo "ERROR al actualizar el horario: " . $conn->error . "\n";
}

// Cerrar conexiu00f3n
$conn->close();

echo "\nPasos finales para completar la solucin:alu00f3:\n";
echo "1. Reemplaza el script original con el actualizado:\n";
echo "   copy backend\scripts\recordatorios_multiple_actualizado.php backend\scripts\recordatorios_multiple.php /Y\n";
echo "\nA partir de mau00f1ana, los recordatorios se enviaru00e1n automu00e1ticamente a Maru00eda y todos los usuarios";
