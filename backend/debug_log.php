<?php
// Este archivo nos servirá para depurar las llamadas a la API

// Guardar información de la petición actual
$debugInfo = [
    'time' => date('Y-m-d H:i:s'),
    'method' => $_SERVER['REQUEST_METHOD'],
    'query_string' => $_SERVER['QUERY_STRING'] ?? '',
    'raw_input' => file_get_contents('php://input'),
    'get_params' => $_GET,
    'post_params' => $_POST,
    'headers' => getallheaders(),
];

// Guardar en un archivo de log
$logFile = 'debug_log.txt';
file_put_contents($logFile, json_encode($debugInfo, JSON_PRETTY_PRINT) . "\n\n", FILE_APPEND);

// Continuar con la ejecución normal
include_once 'controlador.php';
?>
