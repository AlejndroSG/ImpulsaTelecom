<?php
// Script para crear la tabla de tokens de fichaje

// Definir la ruta base
$baseDir = __DIR__ . '/../';

// Incluir archivos necesarios
require_once $baseDir . 'modelos/bd.php';

// Conectar a la base de datos
$db = new db();
$conn = $db->getConn();

// Verificar si la tabla ya existe
$verificarTabla = "SHOW TABLES LIKE 'tokens_fichaje'";
$tablaExiste = $conn->query($verificarTabla)->num_rows > 0;

if (!$tablaExiste) {
    // Crear la tabla de tokens
    $crearTabla = "CREATE TABLE tokens_fichaje (
        id INT AUTO_INCREMENT PRIMARY KEY,
        token VARCHAR(64) NOT NULL,
        NIF VARCHAR(20) NOT NULL,
        tipo_fichaje ENUM('entrada', 'salida') NOT NULL,
        fecha_creacion DATETIME NOT NULL,
        fecha_uso DATETIME NULL,
        usado TINYINT(1) DEFAULT 0,
        ip_uso VARCHAR(45) NULL,
        INDEX (token),
        INDEX (NIF)
    )";
    
    if ($conn->query($crearTabla)) {
        echo "Tabla tokens_fichaje creada correctamente\n";
    } else {
        echo "Error al crear la tabla tokens_fichaje: " . $conn->error . "\n";
    }
} else {
    echo "La tabla tokens_fichaje ya existe\n";
}

// Cerrar conexión
$conn->close();
