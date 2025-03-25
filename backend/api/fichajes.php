<?php
header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

require_once '../modelos/Fichaje.php';
$fichaje = new Fichaje();

if ($_GET['route'] === 'actual') {
    $id_usuario = $_GET['id_usuario'];
    $resultado = $fichaje->getFichajeActual($id_usuario);
    echo json_encode($resultado);
}
?>
