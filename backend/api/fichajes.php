<?php
header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Origin: http://127.0.0.1:62212');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');
header('Content-Type: application/json');

// Si es una solicitud OPTIONS, terminar aquí
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once '../config/database.php';
require_once '../modelos/Fichaje.php';

$database = new Database();
$db = $database->getConnection();
$fichaje = new Fichaje($db);

$data = json_decode(file_get_contents("php://input"));

// Obtener el método de la solicitud
$method = $_SERVER['REQUEST_METHOD'];

// Ruta para manejar diferentes operaciones
$route = isset($_GET['route']) ? $_GET['route'] : '';

// Manejar solicitudes según el método HTTP
switch ($method) {
    case 'GET':
        if ($route === 'historial') {
            // Obtener historial de fichajes
            $id_usuario = isset($_GET['id_usuario']) ? $_GET['id_usuario'] : null;
            
            if ($id_usuario) {
                $result = $fichaje->getHistorialByUsuario($id_usuario);
                echo json_encode($result);
            } else {
                http_response_code(400);
                echo json_encode(array("message" => "Falta el ID de usuario"));
            }
        } elseif ($route === 'estadisticas') {
            // Obtener estadísticas de fichajes
            $id_usuario = isset($_GET['id_usuario']) ? $_GET['id_usuario'] : null;
            $periodo = isset($_GET['periodo']) ? $_GET['periodo'] : 'semana'; // semana, mes, año
            
            if ($id_usuario) {
                $result = $fichaje->getEstadisticas($id_usuario, $periodo);
                echo json_encode($result);
            } else {
                http_response_code(400);
                echo json_encode(array("message" => "Falta el ID de usuario"));
            }
        } elseif ($route === 'actual') {
            // Obtener fichaje actual
            $id_usuario = isset($_GET['id_usuario']) ? $_GET['id_usuario'] : null;
            
            if ($id_usuario) {
                $result = $fichaje->getFichajeActual($id_usuario);
                echo json_encode($result);
            } else {
                http_response_code(400);
                echo json_encode(array("message" => "Falta el ID de usuario"));
            }
        } else {
            http_response_code(404);
            echo json_encode(array("message" => "Ruta no encontrada"));
        }
        break;
        
    case 'POST':
        if ($route === 'entrada') {
            // Registrar entrada
            if (
                isset($data->id_usuario) &&
                isset($data->fecha) &&
                isset($data->hora)
            ) {
                $result = $fichaje->registrarEntrada(
                    $data->id_usuario,
                    $data->fecha,
                    $data->hora
                );
                
                if ($result['success']) {
                    http_response_code(201);
                    echo json_encode($result);
                } else {
                    http_response_code(503);
                    echo json_encode(array("message" => $result['message']));
                }
            } else {
                http_response_code(400);
                echo json_encode(array("message" => "Faltan datos obligatorios"));
            }
        } elseif ($route === 'salida') {
            // Registrar salida
            if (
                isset($data->id_usuario) &&
                isset($data->id_fichaje) &&
                isset($data->hora)
            ) {
                $result = $fichaje->registrarSalida(
                    $data->id_usuario,
                    $data->id_fichaje,
                    $data->hora
                );
                
                if ($result['success']) {
                    http_response_code(200);
                    echo json_encode($result);
                } else {
                    http_response_code(503);
                    echo json_encode(array("message" => $result['message']));
                }
            } else {
                http_response_code(400);
                echo json_encode(array("message" => "Faltan datos obligatorios"));
            }
        } elseif ($route === 'pausa') {
            // Registrar pausa
            if (
                isset($data->id_usuario) &&
                isset($data->id_fichaje) &&
                isset($data->tipo) && // 'inicio' o 'fin'
                isset($data->hora)
            ) {
                $result = $fichaje->registrarPausa(
                    $data->id_usuario,
                    $data->id_fichaje,
                    $data->tipo,
                    $data->hora
                );
                
                if ($result['success']) {
                    http_response_code(200);
                    echo json_encode($result);
                } else {
                    http_response_code(503);
                    echo json_encode(array("message" => $result['message']));
                }
            } else {
                http_response_code(400);
                echo json_encode(array("message" => "Faltan datos obligatorios"));
            }
        } else {
            http_response_code(404);
            echo json_encode(array("message" => "Ruta no encontrada"));
        }
        break;
        
    default:
        http_response_code(405);
        echo json_encode(array("message" => "Método no permitido"));
        break;
}
?>
