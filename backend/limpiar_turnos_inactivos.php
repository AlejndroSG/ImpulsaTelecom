<?php
// Script para limpiar turnos inactivos

// Incluir el modelo de Turno
require_once "modelos/Turno.php";
$modelo = new Turno();

// Verificar si se ha proporcionado un NIF específico
$nif = isset($_GET['nif']) ? $_GET['nif'] : null;

// Ejecutar la limpieza
$resultado = $modelo->eliminarTurnosInactivos($nif);

// Mostrar resultado
header('Content-Type: application/json');
echo json_encode($resultado);
?>
