<?php
// Script para au00f1adir la columna permitir_pausas a la tabla usuarios
require_once "modelos/bd.php";

// Crear instancia de la conexiu00f3n a la base de datos
$db = new db();
$conn = $db->getConn();

// Verificar si la columna ya existe
$checkQuery = "SHOW COLUMNS FROM usuarios LIKE 'permitir_pausas'";
$result = $conn->query($checkQuery);

if ($result->num_rows > 0) {
    echo "<p>La columna 'permitir_pausas' ya existe en la tabla usuarios.</p>";
} else {
    // Au00f1adir la columna
    $alterQuery = "ALTER TABLE usuarios ADD COLUMN permitir_pausas TINYINT(1) NOT NULL DEFAULT 1";
    
    if ($conn->query($alterQuery) === TRUE) {
        echo "<p>La columna 'permitir_pausas' se ha au00f1adido correctamente a la tabla usuarios.</p>";
    } else {
        echo "<p>Error al au00f1adir la columna: " . $conn->error . "</p>";
    }
}

// Verificar si la columna telefono existe
$checkTelefonoQuery = "SHOW COLUMNS FROM usuarios LIKE 'telefono'";
$telefonoResult = $conn->query($checkTelefonoQuery);

if ($telefonoResult->num_rows > 0) {
    echo "<p>La columna 'telefono' ya existe en la tabla usuarios.</p>";
} else {
    // Au00f1adir la columna telefono si no existe
    $alterTelefonoQuery = "ALTER TABLE usuarios ADD COLUMN telefono VARCHAR(20) NULL";
    
    if ($conn->query($alterTelefonoQuery) === TRUE) {
        echo "<p>La columna 'telefono' se ha au00f1adido correctamente a la tabla usuarios.</p>";
    } else {
        echo "<p>Error al au00f1adir la columna telefono: " . $conn->error . "</p>";
    }
}

echo "<p><a href='../frontend/index.html'>Volver a la aplicaciu00f3n</a></p>";
?>
