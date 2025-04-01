<?php
// Script para probar la conexión a la base de datos
header('Content-Type: text/plain');

echo "Probando conexión a la base de datos...\n\n";

try {
    $conn = new mysqli("127.0.0.1", "root", "", "impulsatelecom");
    
    if ($conn->connect_error) {
        die("Error de conexión: " . $conn->connect_error);
    }
    
    echo "¡Conexión exitosa a la base de datos!\n";
    echo "Información del servidor: " . $conn->server_info . "\n";
    
    // Probar una consulta simple
    $result = $conn->query("SHOW TABLES");
    
    if ($result) {
        echo "\nTablas en la base de datos:\n";
        while ($row = $result->fetch_array()) {
            echo "- " . $row[0] . "\n";
        }
    }
    
    $conn->close();
    echo "\nConexión cerrada correctamente.";
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
?>
