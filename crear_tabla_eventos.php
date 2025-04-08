<?php
// Script para crear la tabla de eventos

// Incluir la configuración de la base de datos
require_once __DIR__ . '/backend/config/database.php';

try {
    // Crear una instancia de la base de datos
    $database = new Database();
    $conn = $database->getConnection();
    
    // SQL para crear la tabla de eventos
    $sql = "CREATE TABLE IF NOT EXISTS `eventos` (
        `id` int(11) NOT NULL AUTO_INCREMENT,
        `titulo` varchar(255) NOT NULL,
        `descripcion` text,
        `fecha_inicio` datetime NOT NULL,
        `fecha_fin` datetime DEFAULT NULL,
        `tipo` varchar(50) DEFAULT 'evento',
        `color` varchar(20) DEFAULT '#3788d8',
        `NIF_usuario` varchar(15) NOT NULL,
        `id_departamento` int(11) DEFAULT NULL,
        `recurrente` tinyint(1) DEFAULT '0',
        `dia_completo` tinyint(1) DEFAULT '0',
        `fecha_creacion` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (`id`),
        KEY `NIF_usuario` (`NIF_usuario`),
        KEY `id_departamento` (`id_departamento`),
        CONSTRAINT `eventos_ibfk_1` FOREIGN KEY (`NIF_usuario`) REFERENCES `usuarios` (`NIF`) ON DELETE CASCADE,
        CONSTRAINT `eventos_ibfk_2` FOREIGN KEY (`id_departamento`) REFERENCES `departamentos` (`id`) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";
    
    // Ejecutar la consulta
    $conn->exec($sql);
    
    echo "¡Tabla 'eventos' creada correctamente!";
    
} catch(PDOException $e) {
    echo "Error al crear la tabla 'eventos': " . $e->getMessage();
}
