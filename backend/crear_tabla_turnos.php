<?php
// Script para crear la tabla de turnos
include_once "modelos/bd.php";

// Inicializar conexión a la base de datos
$db = new db();
$conn = $db->getConn();

// Crear tabla de turnos si no existe
$sql = "CREATE TABLE IF NOT EXISTS turnos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nif_usuario VARCHAR(20) NOT NULL,
    id_horario INT NOT NULL,
    orden INT NOT NULL,
    dias_semana VARCHAR(50) DEFAULT '1,2,3,4,5', 
    nombre VARCHAR(100),
    activo TINYINT(1) DEFAULT 1,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_horario) REFERENCES horarios(id),
    INDEX (nif_usuario),
    UNIQUE KEY unique_turno (nif_usuario, id_horario, orden)
)";

if ($conn->query($sql) === TRUE) {
    echo "Tabla turnos creada correctamente\n";
} else {
    echo "Error al crear la tabla turnos: " . $conn->error . "\n";
}

$conn->close();
?>
