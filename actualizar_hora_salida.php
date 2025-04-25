<?php
// Script para actualizar la hora de salida de María para probar el envío de recordatorios
require_once 'backend/modelos/bd.php';

// Conectar a la base de datos
$db = new db();
$conn = $db->getConn();

if (!$conn) {
    die("Error de conexión a la base de datos");
}

// Configurar la hora de salida para que sea 5 minutos antes de la hora actual
// Así recibiremos el recordatorio en unos minutos
$hora_actual = new DateTime();
$hora_actual->modify('+5 minutes'); // Añadir 5 minutos para recibir el recordatorio muy pronto
$nueva_hora_salida = $hora_actual->format('H:i:00');

// Encontrar el ID del horario de María (con NIF 56789012C)
$consulta_usuario = "SELECT id_horario FROM usuarios WHERE NIF = '56789012C'";
$resultado = $conn->query($consulta_usuario);

if ($resultado && $resultado->num_rows > 0) {
    $row = $resultado->fetch_assoc();
    $id_horario = $row['id_horario'];
    
    // Actualizar la hora de salida en la tabla horarios
    $actualizar_horario = "UPDATE horarios SET hora_fin = '$nueva_hora_salida' WHERE id = $id_horario";
    
    if ($conn->query($actualizar_horario)) {
        echo "<h2>Hora de salida actualizada con éxito</h2>";
        echo "<p>La hora de salida de María ha sido actualizada a: <strong>$nueva_hora_salida</strong></p>";
        echo "<p>Deberías recibir un recordatorio aproximadamente a las " . date('H:i:s', strtotime($nueva_hora_salida) + 300) . "</p>";
    } else {
        echo "<h2>Error al actualizar la hora de salida</h2>";
        echo "<p>Error: " . $conn->error . "</p>";
    }
} else {
    echo "<h2>Error</h2>";
    echo "<p>No se encontró el usuario María con NIF 56789012C</p>";
}

$conn->close();
?>

<p><a href="backend/logs/recordatorios_<?= date('Y-m-d') ?>.log" target="_blank">Ver logs de recordatorios</a></p>
