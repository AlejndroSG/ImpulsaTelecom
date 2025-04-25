<?php
// Script simple para listar todos los usuarios del sistema

// Incluir archivo de conexión a BD
require_once __DIR__ . '/backend/modelos/bd.php';

// Conectar a la base de datos
$db = new db();
$conn = $db->getConn();

// Consultar todos los usuarios (sin unir con tabla horarios)
$query = "SELECT NIF, nombre, apellidos, email FROM usuarios ORDER BY nombre, apellidos";

$resultado = $conn->query($query);

if (!$resultado) {
    echo "Error en la consulta: " . $conn->error . "\n";
    exit;
}

if ($resultado->num_rows == 0) {
    echo "No hay usuarios registrados en el sistema\n";
    exit;
}

echo "=== LISTA DE USUARIOS REGISTRADOS ===\n";
$count = 0;

while ($usuario = $resultado->fetch_assoc()) {
    $count++;
    echo "\n[$count] Usuario:\n";
    echo "NIF: {$usuario['NIF']}\n";
    echo "Nombre: {$usuario['nombre']} {$usuario['apellidos']}\n";
    echo "Email: {$usuario['email']}\n";
}

echo "\nTotal de usuarios: $count\n";
$conn->close();
