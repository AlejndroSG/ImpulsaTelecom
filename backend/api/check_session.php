<?php
// Incluir el helper de sesión que maneja CORS y restaura la sesión si es necesario
require_once 'session_helper.php';
header('Content-Type: application/json');

// Verificar el estado de la sesión
$session_info = [
    'session_active' => isset($_SESSION['usuario']),
    'session_id' => session_id(),
    'user_info' => isset($_SESSION['usuario']) ? [
        'id' => isset($_SESSION['usuario']['id']) ? $_SESSION['usuario']['id'] : null,
        'NIF' => isset($_SESSION['usuario']['NIF']) ? $_SESSION['usuario']['NIF'] : null,
        'nombre' => isset($_SESSION['usuario']['nombre']) ? $_SESSION['usuario']['nombre'] : null,
        'apellidos' => isset($_SESSION['usuario']['apellidos']) ? $_SESSION['usuario']['apellidos'] : null,
        'tipo_usuario' => isset($_SESSION['usuario']['tipo_usuario']) ? $_SESSION['usuario']['tipo_usuario'] : null
    ] : null,
    'post_data' => $_POST,
    'get_data' => $_GET,
    'server' => [
        'REMOTE_ADDR' => $_SERVER['REMOTE_ADDR'],
        'HTTP_USER_AGENT' => isset($_SERVER['HTTP_USER_AGENT']) ? $_SERVER['HTTP_USER_AGENT'] : null,
        'REQUEST_METHOD' => $_SERVER['REQUEST_METHOD'],
        'QUERY_STRING' => isset($_SERVER['QUERY_STRING']) ? $_SERVER['QUERY_STRING'] : null,
        'HTTP_COOKIE' => isset($_SERVER['HTTP_COOKIE']) ? $_SERVER['HTTP_COOKIE'] : null
    ]
];

// Devolver información de la sesión
echo json_encode($session_info, JSON_PRETTY_PRINT);
