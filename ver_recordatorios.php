<?php
require_once 'backend/modelos/bd.php';

// Obtener los recordatorios enviados
$sql = "SELECT * FROM recordatorios_enviados WHERE fecha = '" . date('Y-m-d') . "' ORDER BY id DESC";
$result = $conn->query($sql);

echo "<h2>Recordatorios enviados hoy</h2>";
echo "<pre>";

if ($result && $result->num_rows > 0) {
    while($row = $result->fetch_assoc()) {
        echo "ID: " . $row['id'] . 
             " | NIF: " . $row['NIF'] . 
             " | Tipo: " . $row['tipo_recordatorio'] . 
             " | Fecha: " . $row['fecha'] .
             " | Hora programada: " . $row['hora_programada'] .
             " | Hora referencia: " . ($row['hora_referencia'] ?? 'N/A') . "\n";
    }
} else {
    echo "No hay recordatorios enviados hoy.\n";
}

// Mostrar estructura de la tabla
echo "\n<h2>Estructura de la tabla recordatorios_enviados</h2>";
$sql_estructura = "DESCRIBE recordatorios_enviados";
$result_estructura = $conn->query($sql_estructura);

if ($result_estructura && $result_estructura->num_rows > 0) {
    while($row = $result_estructura->fetch_assoc()) {
        echo $row['Field'] . " | " . $row['Type'] . " | " . ($row['Null'] == 'YES' ? 'NULL' : 'NOT NULL') . "\n";
    }
} else {
    echo "Error al obtener la estructura de la tabla.\n";
}

echo "</pre>";

// Verificar si la columna hora_referencia existe
$check_column = "SHOW COLUMNS FROM recordatorios_enviados LIKE 'hora_referencia'";
$column_exists = $conn->query($check_column);
echo "<h2>Verificación de columna hora_referencia</h2>";
echo "<pre>";
if ($column_exists) {
    echo "La consulta se ejecutó correctamente.\n";
    if ($column_exists->num_rows > 0) {
        echo "La columna hora_referencia EXISTE en la tabla.\n";
    } else {
        echo "La columna hora_referencia NO existe en la tabla.\n";
    }
} else {
    echo "Error al ejecutar la consulta: " . $conn->error . "\n";
}
echo "</pre>";
?>
