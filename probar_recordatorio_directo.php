<?php
// Script de prueba directa para enviar recordatorio a Maru00eda sin pasar por el frontend

echo "=== PRUEBA DIRECTA DEL SCRIPT DE RECORDATORIOS ===\n";
echo "Fecha y hora: " . date('Y-m-d H:i:s') . "\n\n";

// Incluir archivos necesarios
require_once __DIR__ . '/backend/modelos/bd.php';
require_once __DIR__ . '/backend/config/smtp_config.php';

// Verificar configuracin SMTP
echo "Verificando configuraciu00f3n SMTP:\n";
if (defined('SMTP_HOST') && defined('SMTP_USUARIO') && defined('SMTP_PASSWORD')) {
    echo "Servidor SMTP: " . SMTP_HOST . "\n";
    echo "Usuario SMTP: " . SMTP_USUARIO . "\n";
    echo "Nombre remitente: " . (defined('SMTP_NOMBRE') ? SMTP_NOMBRE : 'No definido') . "\n";
} else {
    echo "ERROR: Configuraciu00f3n SMTP incompleta o no disponible\n";
}

// Incluir PHPMailer
require_once __DIR__ . '/backend/vendor/phpmailer/phpmailer/src/Exception.php';
require_once __DIR__ . '/backend/vendor/phpmailer/phpmailer/src/PHPMailer.php';
require_once __DIR__ . '/backend/vendor/phpmailer/phpmailer/src/SMTP.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

// Definir funciu00f3n para enviar correo de prueba directamente
function enviarCorreoPrueba($destinatario, $asunto, $mensaje, $nombreDestinatario = '') {
    // Obtener configuraciu00f3n SMTP desde las constantes
    $smtp_host = SMTP_HOST;
    $smtp_port = SMTP_PORT;
    $smtp_usuario = SMTP_USUARIO;
    $smtp_password = SMTP_PASSWORD;
    $smtp_nombre = SMTP_NOMBRE;
    
    try {
        // Crear una nueva instancia de PHPMailer
        $mail = new PHPMailer(true);
        
        // Configuraciu00f3n del servidor
        $mail->isSMTP();                                    // Usar SMTP
        $mail->Host       = $smtp_host;                     // Servidor SMTP
        $mail->SMTPAuth   = true;                           // Habilitar autenticaciu00f3n SMTP
        $mail->Username   = $smtp_usuario;                  // Usuario SMTP
        $mail->Password   = $smtp_password;                 // Contraseu00f1a SMTP
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS; // Habilitar encriptaciu00f3n TLS
        $mail->Port       = $smtp_port;                     // Puerto TCP
        $mail->CharSet    = 'UTF-8';                        // Caracteres UTF-8
        
        // Depuraciu00f3n SMTP
        $mail->SMTPDebug = 2;                              // Mostrar diagnu00f3stico
        
        // Remitente y destinatarios
        $mail->setFrom($smtp_usuario, $smtp_nombre);
        $mail->addAddress($destinatario, $nombreDestinatario);
        $mail->addReplyTo('noreply@impulsatelecom.com', 'No responder');
        
        // Contenido del mensaje
        $mail->isHTML(true);
        $mail->Subject = $asunto;
        $mail->Body = $mensaje;
        $mail->AltBody = strip_tags(str_replace(['<br>', '<p>', '</p>'], ["\n", "\n", "\n"], $mensaje));
        
        // Capturar la salida de depuraciu00f3n
        ob_start();
        
        // Enviar el correo
        $enviado = $mail->send();
        
        // Obtener la salida de depuraciu00f3n
        $debug_output = ob_get_clean();
        
        echo "\nInformaciu00f3n de depuraciu00f3n SMTP:\n";
        echo $debug_output;
        
        return $enviado;
    } catch (Exception $e) {
        echo "Error al enviar correo: " . $e->getMessage() . "\n";
        return false;
    }
}

// Conectar a la base de datos
$db = new db();
$conn = $db->getConn();

// Obtener datos de Maru00eda
$query = "SELECT u.NIF, u.nombre, u.apellidos, u.email, h.hora_inicio 
         FROM usuarios u 
         JOIN horarios h ON u.id_horario = h.id 
         WHERE u.NIF = '56789012C'";

$resultado = $conn->query($query);

if (!$resultado || $resultado->num_rows == 0) {
    echo "ERROR: No se encontru00f3 a Maru00eda en la base de datos\n";
    exit;
}

$maria = $resultado->fetch_assoc();

echo "\nEnviando correo de prueba a Maru00eda:\n";
echo "Nombre: {$maria['nombre']} {$maria['apellidos']}\n";
echo "Email: {$maria['email']}\n";
echo "Hora de entrada: {$maria['hora_inicio']}\n";

// Crear mensaje de prueba
$asunto = "PRUEBA: Recordatorio de fichaje";
$mensaje = "<h3>Hola {$maria['nombre']},</h3>";
$mensaje .= "<p>Este es un correo de <strong>PRUEBA</strong> del sistema de recordatorios.</p>";
$mensaje .= "<p>Si recibes este correo, significa que el sistema SMTP estu00e1 configurado correctamente.</p>";
$mensaje .= "<p>Hora actual: " . date('H:i:s') . "</p>";

// Enviar correo de prueba
echo "\nEnviando correo de prueba...\n";
$resultado_envio = enviarCorreoPrueba($maria['email'], $asunto, $mensaje, "{$maria['nombre']} {$maria['apellidos']}");

if ($resultado_envio) {
    echo "\nu00a1CORREO DE PRUEBA ENVIADO CON u00c9XITO!\n";
    echo "Si no recibes este correo en unos minutos, verifica tu carpeta de spam\n";
} else {
    echo "\nERROR al enviar el correo de prueba\n";
}

echo "\n\nINFORMACIu00d3N ADICIONAL PARA DIAGNu00d3STICO:\n";
echo "1. El correo de prueba es enviado directamente por este script, no por el sistema de recordatorios\n";
echo "2. Si recibes este correo pero no los recordatorios automu00e1ticos, el problema estu00e1 en cu00f3mo se ejecuta el sistema de recordatorios\n";
echo "3. Si no recibes este correo, hay un problema con la configuraciu00f3n SMTP\n";

// Cerrar conexiu00f3n
$conn->close();
