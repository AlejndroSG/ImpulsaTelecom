<?php
// Script para probar los endpoints del backend

// Establecer cabeceras para permitir la visualización en el navegador
header('Content-Type: text/html; charset=utf-8');

// Incluir las clases necesarias
require_once 'db.php';
require_once 'modelos/Fichaje.php';

// Inicializar conexión a la base de datos
$database = new Database();
$db = $database->getConnection();
$fichaje = new Fichaje($db);

// Usuario de prueba (debe existir en la base de datos)
$id_usuario = isset($_GET['id_usuario']) ? $_GET['id_usuario'] : '12345678A';

// Función para mostrar resultados de forma legible
function mostrarResultado($titulo, $resultado) {
    echo "<h3>$titulo</h3>";
    echo "<pre>";
    print_r($resultado);
    echo "</pre>";
    echo "<hr>";
}

echo "<h1>Prueba de Endpoints de Fichajes</h1>";

// Probar getHistorialByUsuario
echo "<h2>Probando getHistorialByUsuario</h2>";
$historial = $fichaje->getHistorialByUsuario($id_usuario, 5);
mostrarResultado("Historial de Fichajes (últimos 5)", $historial);

// Probar getHistorialGrafico
echo "<h2>Probando getHistorialGrafico</h2>";
$grafico = $fichaje->getHistorialGrafico($id_usuario);
mostrarResultado("Datos para Gráfico (últimos 7 días)", $grafico);

// Probar getHorarioUsuario
echo "<h2>Probando getHorarioUsuario</h2>";
$horario = $fichaje->getHorarioUsuario($id_usuario);
mostrarResultado("Datos de Horario del Usuario", $horario);

// Probar cambiar usuario
echo "<p>Para probar con otro usuario, añade <code>?id_usuario=OTRO_NIF</code> a la URL.</p>";
?>
