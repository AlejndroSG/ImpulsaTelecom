<?php
// Script para listar todos los usuarios del sistema

// Incluir archivo de conexiu00f3n a BD
require_once __DIR__ . '/backend/modelos/bd.php';

// Conectar a la base de datos
$db = new db();
$conn = $db->getConn();

// Consultar todos los usuarios
$query = "SELECT u.NIF, u.nombre, u.apellidos, u.email, h.hora_entrada, h.hora_salida 
         FROM usuarios u 
         LEFT JOIN horarios h ON u.NIF = h.NIF 
         ORDER BY u.nombre, u.apellidos";

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
    
    if (!empty($usuario['hora_entrada']) && !empty($usuario['hora_salida'])) {
        echo "Horario: {$usuario['hora_entrada']} - {$usuario['hora_salida']}\n";
    } else {
        echo "Horario: No configurado\n";
    }
}

echo "\nTotal de usuarios: $count\n";
$conn->close();
