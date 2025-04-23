<?php
// Script para enviar un correo de prueba a Maru00eda con la funcionalidad de fichaje ru00e1pido
header('Content-Type: text/plain; charset=UTF-8');

// Definir la ruta base
$baseDir = __DIR__ . '/../';

// Incluir archivos necesarios
require_once $baseDir . 'modelos/bd.php';

// Incluir configuraciu00f3n SMTP
@include_once $baseDir . 'config/smtp_config.php';

// Incluir PHPMailer
require_once $baseDir . 'vendor/autoload.php';
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;
use PHPMailer\PHPMailer\SMTP;

// Funciu00f3n para registrar acciones en un archivo de log
function escribirLog($mensaje) {
    echo $mensaje . "\n";
    
    $logFile = __DIR__ . '/../logs/prueba_maria_' . date('Y-m-d') . '.log';
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

function enviarCorreo($destinatario, $asunto, $mensaje, $nombreDestinatario = '') {
    // Obtener configuraciu00f3n SMTP desde las variables o usar los valores por defecto
    $smtp_host = defined('SMTP_HOST') ? SMTP_HOST : 'smtp.gmail.com';
    $smtp_port = defined('SMTP_PORT') ? SMTP_PORT : 587;
    $smtp_usuario = defined('SMTP_USUARIO') ? SMTP_USUARIO : 'tu-correo@gmail.com';
    $smtp_password = defined('SMTP_PASSWORD') ? SMTP_PASSWORD : 'tu-contraseu00f1a-o-clave-de-aplicacion';
    $smtp_nombre = defined('SMTP_NOMBRE') ? SMTP_NOMBRE : 'Impulsa Telecom';
    
    try {
        // Crear una nueva instancia de PHPMailer
        $mail = new PHPMailer(true); // true habilita excepciones
        
        // Configuraciu00f3n del servidor
        $mail->isSMTP();                                    // Usar SMTP
        $mail->Host       = $smtp_host;                     // Servidor SMTP
        $mail->SMTPAuth   = true;                           // Habilitar autenticaciu00f3n SMTP
        $mail->Username   = $smtp_usuario;                  // Usuario SMTP
        $mail->Password   = $smtp_password;                 // Contraseu00f1a SMTP
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS; // Habilitar encriptaciu00f3n TLS
        $mail->Port       = $smtp_port;                     // Puerto TCP
        $mail->CharSet    = 'UTF-8';                        // Caracteres UTF-8
        
        // Remitente y destinatarios
        $mail->setFrom($smtp_usuario, $smtp_nombre);
        $mail->addAddress($destinatario, $nombreDestinatario);
        $mail->addReplyTo('noreply@impulsatelecom.com', 'No responder');
        
        // Contenido del mensaje
        $mail->isHTML(true);
        $mail->Subject = $asunto;
        
        // Plantilla HTML para el correo
        $plantilla = <<<HTML
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>$asunto</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    margin: 0;
                    padding: 0;
                }
                .container {
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                    background-color: #f9f9f9;
                }
                .header {
                    background-color: #78bd00;
                    color: white;
                    padding: 15px;
                    text-align: center;
                }
                .content {
                    padding: 20px;
                    background-color: white;
                    border-radius: 5px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }
                .footer {
                    text-align: center;
                    margin-top: 20px;
                    font-size: 12px;
                    color: #888;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h2>Impulsa Telecom</h2>
                </div>
                <div class="content">
                    $mensaje
                </div>
                <div class="footer">
                    <p>Este es un correo automu00e1tico, por favor no responda a este mensaje.</p>
                    <p>&copy; Impulsa Telecom - 2025</p>
                </div>
            </div>
        </body>
        </html>
        HTML;
        
        // Establecer el cuerpo del mensaje en HTML
        $mail->Body = $plantilla;
        
        // Versiu00f3n alternativa en texto plano (para clientes que no soportan HTML)
        $mail->AltBody = strip_tags(str_replace(['<br>', '<br/>', '<br />'], "\n", $mensaje));
        
        // Enviar el correo
        $mail->send();
        escribirLog("Correo enviado con u00e9xito a: $destinatario, Asunto: $asunto");
        return true;
    } catch (Exception $e) {
        escribirLog("Error al enviar correo a: $destinatario, Asunto: $asunto - Error: " . $mail->ErrorInfo);
        return false;
    }
}

// Conectar a la base de datos
$db = new db();
$conn = $db->getConn();

// Buscar usuario Maru00eda
escribirLog("Buscando usuario Maru00eda en la base de datos...");
$query = "SELECT NIF, nombre, apellidos, email as correo FROM usuarios WHERE nombre LIKE '%Maru00eda%' OR nombre LIKE '%Maria%' LIMIT 1";
$resultado = $conn->query($query);

if ($resultado && $resultado->num_rows > 0) {
    $usuario = $resultado->fetch_assoc();
    escribirLog("Usuario encontrado: {$usuario['nombre']} {$usuario['apellidos']} ({$usuario['correo']})");
    
    // Generar un token u00fanico para la acciu00f3n de fichaje
    $nif = $usuario['NIF'];
    $fechaActual = date('Y-m-d');
    $tipo = 'entrada'; // Podemos usar 'entrada' o 'salida' para la prueba
    $token = md5($nif . $fechaActual . $tipo . time());
    
    // Guardar el token en la base de datos
    $tipo_fichaje = 'entrada'; // Podemos usar 'entrada' o 'salida' para la prueba
    $guardar_token = "INSERT INTO tokens_fichaje (token, NIF, tipo_fichaje, fecha_creacion, usado) 
                      VALUES ('$token', '$nif', '$tipo_fichaje', NOW(), 0)";
    
    if ($conn->query($guardar_token)) {
        escribirLog("Token generado y guardado correctamente: $token");
        
        // URL base del sistema
        $url_base = "http://localhost/ImpulsaTelecom";
        
        // URL para el fichaje ru00e1pido
        $url_fichaje = "$url_base/backend/api/fichaje_rapido.php?token=$token";
        
        // Preparar el mensaje
        $asunto = "Prueba de fichaje ru00e1pido - " . date('H:i:s');
        $mensaje = "<h3>Hola {$usuario['nombre']},</h3>";
        $mensaje .= "<p>Este es un correo de prueba para demostrar la nueva funcionalidad de fichaje ru00e1pido.</p>";
        $mensaje .= "<p>Ahora puedes registrar tu <strong>$tipo_fichaje</strong> directamente desde el correo electru00f3nico.</p>";
        
        $mensaje .= "<div style='margin: 20px 0;'>
            <a href='$url_fichaje' style='display: inline-block; background-color: #78bd00; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;'>
                Registrar $tipo_fichaje ahora
            </a>
            <p style='font-size: 12px; margin-top: 10px;'>O copia y pega este enlace en tu navegador: $url_fichaje</p>
        </div>";
        
        $mensaje .= "<p>Esta es una nueva funcionalidad que te permite registrar tu fichaje con un solo clic, sin necesidad de iniciar sesiu00f3n en la plataforma.</p>";
        $mensaje .= "<p>Gracias por tu atenciu00f3n.</p>";
        
        // Enviar el correo
        if (enviarCorreo($usuario['correo'], $asunto, $mensaje, "{$usuario['nombre']} {$usuario['apellidos']}")) {
            escribirLog("\nu2705 Correo de prueba enviado correctamente a {$usuario['nombre']} {$usuario['apellidos']} ({$usuario['correo']})");
            escribirLog("\nURL de fichaje ru00e1pido: $url_fichaje");
        } else {
            escribirLog("\nu274c Error al enviar el correo de prueba");
        }
    } else {
        escribirLog("Error al guardar el token: " . $conn->error);
    }
} else {
    escribirLog("\nu274c No se encontru00f3 ningu00fan usuario con el nombre Maru00eda");
    
    // Listar usuarios disponibles
    $query_usuarios = "SELECT nombre, apellidos, email FROM usuarios WHERE email IS NOT NULL AND email != '' LIMIT 10";
    $resultado_usuarios = $conn->query($query_usuarios);
    
    if ($resultado_usuarios && $resultado_usuarios->num_rows > 0) {
        escribirLog("\nUsuarios disponibles con correo electru00f3nico:");
        while ($usuario = $resultado_usuarios->fetch_assoc()) {
            escribirLog("- {$usuario['nombre']} {$usuario['apellidos']} ({$usuario['email']})");
        }
    }
}

// Cerrar conexiu00f3n
$conn->close();
