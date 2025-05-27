<?php
// Script para actualizar la tabla de turnos con soporte para semanas del mes
include_once "modelos/bd.php";

// Inicializar conexión a la base de datos
$db = new db();
$conn = $db->getConn();

// Añadir campos para las semanas del mes
$sql = "ALTER TABLE turnos 
        ADD COLUMN semanas_mes VARCHAR(20) DEFAULT '1,2,3,4,5' COMMENT 'Semanas del mes en las que aplica este turno'";

if ($conn->query($sql) === TRUE) {
    echo "Tabla turnos actualizada correctamente con soporte para semanas del mes\n";
} else {
    echo "Error al actualizar la tabla turnos: " . $conn->error . "\n";
}

$conn->close();
?>
