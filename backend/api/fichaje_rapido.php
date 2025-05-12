<?php
/**
 * API para procesar fichajes ru00e1pidos desde los enlaces en los correos electru00f3nicos
 */

// Cabeceras para permitir CORS
$origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';
$allowed_origins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:63975',
    'http://localhost:63975',
    'https://asp-natural-annually.ngrok-free.app'  // Dominio ngrok actual
];

if (in_array($origin, $allowed_origins)) {
    header("Access-Control-Allow-Origin: $origin");
} else {
    header("Access-Control-Allow-Origin: http://localhost:5173");
}
header("Content-Type: text/html; charset=UTF-8");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Definir la ruta base
$baseDir = __DIR__ . '/../';

// Incluir archivos necesarios
require_once $baseDir . 'modelos/bd.php';
require_once $baseDir . 'modelos/Fichaje.php';

// Funciu00f3n para obtener la IP real del cliente
function obtenerIP() {
    if (!empty($_SERVER['HTTP_CLIENT_IP'])) {
        return $_SERVER['HTTP_CLIENT_IP'];
    } elseif (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
        return $_SERVER['HTTP_X_FORWARDED_FOR'];
    } else {
        return $_SERVER['REMOTE_ADDR'];
    }
}

// Funciu00f3n para registrar en el log
function escribirLog($mensaje) {
    $logFile = $GLOBALS['baseDir'] . 'logs/fichaje_rapido_' . date('Y-m-d') . '.log';
    $logDir = dirname($logFile);
    
    // Crear directorio si no existe
    if (!file_exists($logDir)) {
        mkdir($logDir, 0777, true);
    }
    
    // Escribir mensaje de log con timestamp
    $timestamp = date('Y-m-d H:i:s');
    file_put_contents(
        $logFile, 
        "[$timestamp] $mensaje\n", 
        FILE_APPEND
    );
}

// Verificar si se proporcionu00f3 un token
if (!isset($_GET['token']) || empty($_GET['token'])) {
    // No se proporcionu00f3 token
    http_response_code(400);
    
    // Mostrar mensaje de error
    echo "<html><body><h1>Error</h1><p>No se proporcionu00f3 un token vu00e1lido</p></body></html>";
    exit;
}

$token = $_GET['token'];
$ip_cliente = obtenerIP();

escribirLog("Solicitud de fichaje ru00e1pido con token: $token desde IP: $ip_cliente");

// Conectar a la base de datos
$db = new db();
$conn = $db->getConn();

// Verificar si el token existe y no ha sido usado
$query = "SELECT t.*, u.nombre, u.apellidos 
          FROM tokens_fichaje t
          INNER JOIN usuarios u ON t.NIF = u.NIF
          WHERE t.token = ? AND t.usado = 0";

$stmt = $conn->prepare($query);

if ($stmt === false) {
    escribirLog("Error en la preparaciu00f3n de la consulta: " . $conn->error);
    http_response_code(500);
    echo "<html><body><h1>Error</h1><p>Error interno del servidor</p></body></html>";
    exit;
}

$stmt->bind_param("s", $token);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    // Token no vu00e1lido o ya usado
    escribirLog("Token no vu00e1lido o ya usado: $token");
    http_response_code(400);
    
    // Mostrar mensaje de error
    echo "<html>
    <head>
        <meta charset=\"UTF-8\">
        <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">
        <title>Error - Fichaje no vu00e1lido</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                margin: 0;
                padding: 20px;
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
                background-color: #f5f5f5;
            }
            .container {
                max-width: 600px;
                padding: 30px;
                background-color: white;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                text-align: center;
            }
            .error-icon {
                font-size: 60px;
                color: #e74c3c;
                margin-bottom: 20px;
            }
            h1 {
                color: #e74c3c;
                margin-bottom: 20px;
            }
            .btn {
                display: inline-block;
                background-color: #78bd00;
                color: white;
                padding: 10px 20px;
                text-decoration: none;
                border-radius: 5px;
                font-weight: bold;
                margin-top: 20px;
            }
        </style>
    </head>
    <body>
        <div class=\"container\">
            <div class=\"error-icon\">&#9888;</div>
            <h1>Enlace no vu00e1lido</h1>
            <p>El enlace que has utilizado no es vu00e1lido o ya ha sido usado anteriormente.</p>
            <p>Por favor, accede a la plataforma para registrar tu fichaje manualmente.</p>
            <a href=\"/ImpulsaTelecom/frontend\" class=\"btn\">Ir a la plataforma</a>
        </div>
    </body>
    </html>";
    exit;
}

// Obtener los datos del token
$token_data = $result->fetch_assoc();
$nif = $token_data['NIF'];
$tipo_fichaje = $token_data['tipo_fichaje'];
$nombre_completo = $token_data['nombre'] . ' ' . $token_data['apellidos'];

// Crear instancia del modelo de Fichaje
$fichaje_model = new Fichaje();

// Obtener fecha y hora actual
$fecha_actual = date('Y-m-d');
$hora_actual = date('H:i:s');

// Procesar el fichaje segu00fan el tipo
$resultado_fichaje = array();

if ($tipo_fichaje === 'entrada') {
    // Registrar entrada
    $resultado_fichaje = $fichaje_model->registrarEntrada($nif, $fecha_actual, $hora_actual);
    escribirLog("Registrando entrada para $nombre_completo ($nif)");
} else if ($tipo_fichaje === 'salida') {
    // Obtener el fichaje actual para registrar salida
    $fichaje_actual = $fichaje_model->getFichajeActual($nif);
    
    if (isset($fichaje_actual['success']) && $fichaje_actual['success']) {
        $id_fichaje = $fichaje_actual['fichaje']['idRegistro'];
        $resultado_fichaje = $fichaje_model->registrarSalida($nif, $id_fichaje, $hora_actual);
        escribirLog("Registrando salida para $nombre_completo ($nif), ID fichaje: $id_fichaje");
    } else {
        $resultado_fichaje = array(
            'success' => false,
            'error' => 'No se encontru00f3 un fichaje activo para registrar la salida'
        );
        escribirLog("Error: No se encontru00f3 fichaje activo para $nombre_completo ($nif)");
    }
}

// Marcar el token como usado
$actualizar_token = "UPDATE tokens_fichaje 
                    SET usado = 1, fecha_uso = NOW(), ip_uso = ? 
                    WHERE token = ?";
$stmt_update = $conn->prepare($actualizar_token);
$stmt_update->bind_param("ss", $ip_cliente, $token);
$stmt_update->execute();

// Determinar si la operaciu00f3n fue exitosa
if (isset($resultado_fichaje['success'])) {
    $exito = $resultado_fichaje['success'];
} else {
    $exito = false;
}

// Preparar el mensaje
if ($exito) {
    $mensaje = "Tu " . $tipo_fichaje . " ha sido registrada correctamente.";
    $color_titulo = '#78bd00';
    $icono = '&#10004;';
    $color_icono = '#78bd00';
    $titulo_mensaje = 'Fichaje Registrado';
} else {
    if (isset($resultado_fichaje['error'])) {
        $mensaje = "No se pudo registrar tu " . $tipo_fichaje . ": " . $resultado_fichaje['error'];
    } else {
        $mensaje = "No se pudo registrar tu " . $tipo_fichaje . ": Error desconocido";
    }
    $color_titulo = '#e74c3c';
    $icono = '&#9888;';
    $color_icono = '#e74c3c';
    $titulo_mensaje = 'Error en el Fichaje';
}

// Generar HTML de respuesta
echo "<!DOCTYPE html>
<html>
<head>
    <meta charset=\"UTF-8\">
    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">
    <title>Fichaje " . $tipo_fichaje . " - ImpulsaTelecom</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 20px;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 600px;
            padding: 30px;
            background-color: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            text-align: center;
        }
        .icon {
            font-size: 60px;
            color: " . $color_icono . ";
            margin-bottom: 20px;
        }
        h1 {
            color: " . $color_titulo . ";
            margin-bottom: 20px;
        }
        .details {
            background-color: #f9f9f9;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
            text-align: left;
        }
        .btn {
            display: inline-block;
            background-color: #78bd00;
            color: white;
            padding: 10px 20px;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div class=\"container\">
        <div class=\"icon\">" . $icono . "</div>
        <h1>" . $titulo_mensaje . "</h1>
        <p>" . $mensaje . "</p>
        
        <div class=\"details\">
            <p><strong>Usuario:</strong> " . $nombre_completo . "</p>
            <p><strong>Tipo:</strong> " . $tipo_fichaje . "</p>
            <p><strong>Fecha:</strong> " . $fecha_actual . "</p>
            <p><strong>Hora:</strong> " . $hora_actual . "</p>
        </div>
        
        <a href=\"/ImpulsaTelecom/frontend\" class=\"btn\">Ir a la plataforma</a>
    </div>
</body>
</html>";

// Cerrar conexiu00f3n
$conn->close();
