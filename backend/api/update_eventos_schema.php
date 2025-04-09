<?php
// Script para actualizar el esquema de la tabla eventos

require_once __DIR__ . '/../config/database.php';

header('Content-Type: application/json');

try {
    $database = new Database();
    $conn = $database->getConnection();
    
    // Verificar si la columna tipo_evento ya existe
    $stmt = $conn->prepare("SHOW COLUMNS FROM eventos LIKE 'tipo_evento'");
    $stmt->execute();
    
    if ($stmt->rowCount() == 0) {
        // La columna no existe, agregarla
        $alterQuery = "ALTER TABLE eventos ADD COLUMN tipo_evento ENUM('personal', 'departamental') NOT NULL DEFAULT 'personal'"; 
        $conn->exec($alterQuery);
        
        echo json_encode([
            'success' => true,
            'message' => 'Tabla eventos actualizada con u00e9xito. Se ha agregado la columna tipo_evento.'
        ]);
    } else {
        echo json_encode([
            'success' => true,
            'message' => 'La columna tipo_evento ya existe en la tabla eventos.'
        ]);
    }
    
} catch (PDOException $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Error al actualizar la tabla eventos: ' . $e->getMessage()
    ]);
}
