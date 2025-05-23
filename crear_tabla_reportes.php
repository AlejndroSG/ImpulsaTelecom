<?php
// Script para crear la tabla de reportes en la base de datos

// Incluir configuración de base de datos
require_once __DIR__ . '/backend/config/database.php';

try {
    // Crear conexión a la base de datos
    $conn = Database::getConnection();
    
    // Consulta SQL para crear la tabla reportes si no existe
    $sql = "CREATE TABLE IF NOT EXISTS reportes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        titulo VARCHAR(255) NOT NULL,
        descripcion TEXT NOT NULL,
        tipo ENUM('error', 'mejora', 'consulta', 'urgente') NOT NULL,
        estado ENUM('pendiente', 'en_progreso', 'resuelto', 'cerrado') NOT NULL DEFAULT 'pendiente',
        fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        fecha_actualizacion DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
        NIF_usuario VARCHAR(15) NOT NULL,
        prioridad ENUM('baja', 'media', 'alta', 'critica') NOT NULL DEFAULT 'media',
        archivos_adjuntos TEXT NULL,
        respuesta TEXT NULL,
        leido BOOLEAN NOT NULL DEFAULT 0,
        FOREIGN KEY (NIF_usuario) REFERENCES usuarios(NIF)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";
    
    // Ejecutar la consulta
    $conn->exec($sql);
    
    echo "Tabla 'reportes' creada exitosamente o ya existía.\n";
    
    // Crear índices para mejorar el rendimiento
    $conn->exec("CREATE INDEX IF NOT EXISTS idx_reportes_nif ON reportes(NIF_usuario);");
    $conn->exec("CREATE INDEX IF NOT EXISTS idx_reportes_estado ON reportes(estado);");
    $conn->exec("CREATE INDEX IF NOT EXISTS idx_reportes_leido ON reportes(leido);");
    
    echo "Índices creados exitosamente.\n";
    
    echo "Configuración de la tabla 'reportes' completada.\n";
    
} catch(PDOException $e) {
    echo "Error al crear la tabla 'reportes': " . $e->getMessage() . "\n";
}
?>
