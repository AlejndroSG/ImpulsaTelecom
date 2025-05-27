<?php
// Script para depurar la creación de turnos
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Crear un archivo de log para depuración
$log_file = __DIR__ . '/debug_turnos.log';
file_put_contents($log_file, "Depuración iniciada: " . date('Y-m-d H:i:s') . "\n", FILE_APPEND);

// Incluir el modelo de Turno
require_once "modelos/Turno.php";
$modelo = new Turno();

// Datos de prueba para un turno
$datos_prueba = [
    'nif_usuario' => '12345678A',
    'id_horario' => 1,
    'orden' => 1,
    'dias_semana' => '1,2,3,4,5',
    'semanas_mes' => '1,2,3,4,5',
    'nombre' => 'Turno de Prueba'
];

// Log de los datos
file_put_contents($log_file, "Datos de prueba: " . json_encode($datos_prueba) . "\n", FILE_APPEND);

// Intentar crear el turno
try {
    $resultado = $modelo->crear($datos_prueba);
    file_put_contents($log_file, "Resultado: " . json_encode($resultado) . "\n", FILE_APPEND);
    echo "Resultado: " . json_encode($resultado) . "\n";
} catch (Exception $e) {
    $error = "Error al crear turno: " . $e->getMessage() . "\n";
    file_put_contents($log_file, $error, FILE_APPEND);
    echo $error;
}
?>
