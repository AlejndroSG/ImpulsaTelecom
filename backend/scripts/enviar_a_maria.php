<?php
// Script simplificado para enviar recordatorio directo a Maru00eda
header('Content-Type: text/plain; charset=UTF-8');

// Incluir configuraciu00f3n SMTP
require_once __DIR__ . '/../config/smtp_config.php';

// Incluir PHPMailer
require_once __DIR__ . '/../vendor/phpmailer/phpmailer/src/Exception.php';
require_once __DIR__ . '/../vendor/phpmailer/phpmailer/src/PHPMailer.php';
require_once __DIR__ . '/../vendor/phpmailer/phpmailer/src/SMTP.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

echo "=============================================\n";
echo "ENVIANDO RECORDATORIO DIRECTO A MARu00cdA\n";
echo "=============================================\n";

// Datos de Maru00eda
$nombre = "Maru00eda";
$email = "elreibo30@gmail.com";
$hora_salida = "16:00";

echo "Enviando recordatorio a: $email\n";
echo "Hora de salida configurada: $hora_salida\n";

try {
    // Crear instancia de PHPMailer
    $mail = new PHPMailer(true);
    
    // Configuraciu00f3n del servidor
    $mail->isSMTP();                            // Usar SMTP
    $mail->Host       = SMTP_HOST;              // Servidor SMTP
    $mail->SMTPAuth   = true;                   // Habilitar autenticaciu00f3n SMTP
    $mail->Username   = SMTP_USUARIO;           // Usuario SMTP
    $mail->Password   = SMTP_PASSWORD;          // Contraseu00f1a SMTP
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS; // Encriptaciu00f3n TLS
    $mail->Port       = SMTP_PORT;             // Puerto TCP
    $mail->CharSet    = 'UTF-8';                // Caracteres UTF-8
    
    // Activar modo debug detallado
    $mail->SMTPDebug = 2;                      // 0=apagado, 1=mensajes cliente, 2=cliente y servidor
    $mail->Debugoutput = 'echo';               // Mostrar en pantalla
    
    // Remitente y destinatario
    $mail->setFrom(SMTP_USUARIO, 'Impulsa Telecom');
    $mail->addAddress($email, $nombre);
    
    // Contenido del mensaje
    $mail->isHTML(true);
    $mail->Subject = "RECORDATORIO URGENTE: Hora de salida - $hora_salida";
    
    // Crear mensaje HTML
    $mensaje = "
    <div style='font-family: Arial, sans-serif; max-width: l600px;'>
        <div style='background-color: #78bd00; color: white; padding: 15px; text-align: center;'>
            <h2>Recordatorio de fichaje</h2>
        </div>
        <div style='padding: 20px; border: 1px solid #ddd;'>
            <h3>Hola $nombre,</h3>
            <p>Este es un recordatorio de que tu salida estaba programada para las <strong>$hora_salida</strong>.</p>
            <p>Ya han pasado 5 minutos desde tu hora de salida. Tienes 5 minutos mu00e1s de margen para registrar tu fichaje sin incidencias.</p>
            <p style='margin-top: 20px;'>Por favor, no olvides registrar tu salida en el sistema de fichajes.</p>
            <div style='margin: 20px 0; text-align: center;'>
                <a href='http://localhost/ImpulsaTelecom/frontend/' style='display: inline-block; background-color: #78bd00; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;'>
                    Ir al sistema de fichajes
                </a>
            </div>
            <p>Gracias por tu atenciu00f3n.</p>
        </div>
        <div style='font-size: 12px; text-align: center; margin-top: 20px; color: #777;'>
            <p>Este es un mensaje automu00e1tico, por favor no responda.</p>
        </div>
    </div>";
    
    $mail->Body = $mensaje;
    $mail->AltBody = "Recordatorio: Tu salida estaba programada para las $hora_salida. Por favor, registra tu salida en el sistema de fichajes.";
    
    // Enviar el correo
    echo "\nIntentando enviar el correo...\n";
    $mail->send();
    
    echo "\n✅ CORREO ENVIADO CORRECTAMENTE a $email\n";
    echo "\nVerifica tu bandeja de entrada o carpeta de spam.\n";
    
} catch (Exception $e) {
    echo "\n❌ ERROR AL ENVIAR: " . $mail->ErrorInfo . "\n";
    echo "Detalles del error: " . $e->getMessage() . "\n";
    
    echo "\nVerificando configuraciu00f3n SMTP:\n";
    echo "- Host: " . SMTP_HOST . "\n";
    echo "- Puerto: " . SMTP_PORT . "\n";
    echo "- Usuario: " . SMTP_USUARIO . "\n";
    echo "- Nombre: " . SMTP_NOMBRE . "\n";
}

echo "\n=============================================\n";
echo "FIN DEL PROCESO\n";
echo "=============================================\n";
