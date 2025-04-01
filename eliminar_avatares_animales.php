<?php
// Incluir el archivo de conexiu00f3n a la base de datos
include_once 'backend/modelos/bd.php';

try {
    // Crear conexiu00f3n a la base de datos
    $database = new db();
    $conn = $database->getConn();
    
    // Eliminar avatares de la categoru00eda 'animales'
    $query = "DELETE FROM avatares WHERE categoria = 'animales'";
    
    if ($conn->query($query) === TRUE) {
        $affected = $conn->affected_rows;
        echo "Se han eliminado $affected avatares de la categoru00eda 'animales'.";
    } else {
        echo "Error al eliminar avatares: " . $conn->error;
    }
    
    // Cerrar conexiu00f3n
    $conn->close();
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
?>
