<?php
// Script para restaurar la hora original de entrada de Maru00eda

// Definir ruta del archivo con la hora original
$archivo = __DIR__ . '/hora_original_maria.txt';

// Verificar si el archivo existe
if (!file_exists($archivo)) {
    echo "No se encontru00f3 el archivo con la hora original\n";
    exit;
}

// Leer la hora original
$contenido = file_get_contents($archivo);
$partes = explode('|', $contenido);

if (count($partes) != 2) {
    echo "El formato del archivo con la hora original no es correcto\n";
    exit;
}

$hora_original = $partes[0];
$id_horario = $partes[1];

// Incluir archivo de conexiu00f3n a BD
require_once __DIR__ . '/backend/modelos/bd.php';

// Conectar a la base de datos
$db = new db();
$conn = $db->getConn();

// Obtener la hora actual configurada
$query_actual = "SELECT hora_inicio FROM horarios WHERE id = $id_horario";
$resultado_actual = $conn->query($query_actual);

if (!$resultado_actual || $resultado_actual->num_rows == 0) {
    echo "No se pudo obtener la hora actual\n";
    exit;
}

$hora_actual = $resultado_actual->fetch_assoc()['hora_inicio'];

echo "=== RESTAURANDO HORA DE ENTRADA DE MARu00cdA ===\n";
echo "Hora actual configurada: $hora_actual\n";
echo "Restaurando a la hora original: $hora_original\n";

// Actualizar la hora de entrada
$query_update = "UPDATE horarios SET hora_inicio = '$hora_original' WHERE id = $id_horario";

if ($conn->query($query_update)) {
    echo "\nu00a1HORA DE ENTRADA RESTAURADA CON u00c9XITO!\n";
    echo "La hora de entrada de Maru00eda ha sido restaurada a $hora_original\n";
    
    // Eliminar el archivo con la hora original
    unlink($archivo);
    echo "Archivo temporal eliminado\n";
} else {
    echo "ERROR al restaurar la hora: " . $conn->error . "\n";
}

// Cerrar conexiu00f3n
$conn->close();
