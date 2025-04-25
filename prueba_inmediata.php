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

// Actualizar temporalmente la hora de entrada de Maru00eda
$update = "UPDATE horarios SET hora_inicio = '$minutos_atras' WHERE id = $horario_id";

if ($conn->query($update)) {
    echo "\nu00a1HORARIO ACTUALIZADO CON u00c9XITO!\n";
    echo "Se estableciu00f3 la hora de entrada a $minutos_atras\n";
    echo "El recordatorio deberu00eda enviarse cuando se ejecute el script actualizado\n";
    echo "\nEjecutando el script actualizado...\n";
    
    // Ejecutar el script actualizado
    include __DIR__ . '/backend/scripts/recordatorios_multiple_actualizado.php';
    
    echo "\n\nIMPORTANTE: Restaurando el horario original...\n";
    
    // Restaurar el horario original
    $restore = "UPDATE horarios SET hora_inicio = '08:00:00' WHERE id = $horario_id";
    if ($conn->query($restore)) {
        echo "Horario restaurado correctamente a 08:00:00\n";
    } else {
        echo "ERROR al restaurar el horario: " . $conn->error . "\n";
    }
} else {
    echo "ERROR al actualizar el horario: " . $conn->error . "\n";
}

// Cerrar conexiu00f3n
$conn->close();

echo "\nRecomendaciones finales:\n";
echo "1. Reemplaza el script original con el actualizado:\n";
echo "   copy backend\scripts\recordatorios_multiple_actualizado.php backend\scripts\recordatorios_multiple.php /Y\n";
echo "2. Verifica el correo de Maru00eda (elreibo30@gmail.com) para confirmar que el recordatorio llegu00f3\n";
echo "3. Para mau00f1ana, el recordatorio deberu00eda enviarse automu00e1ticamente a las 08:05";
