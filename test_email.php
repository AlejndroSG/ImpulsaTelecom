<?php
// Script para probar el envu00edo de correos
require_once 'backend/config/smtp_config.php';
require_once 'backend/vendor/phpmailer/phpmailer/src/Exception.php';
require_once 'backend/vendor/phpmailer/phpmailer/src/PHPMailer.php';
require_once 'backend/vendor/phpmailer/phpmailer/src/SMTP.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

// Funciu00f3n para escribir en el log
function escribirLog($mensaje) {
    $logFile = __DIR__ . '/backend/logs/test_email_' . date('Y-m-d') . '.log';
    $timestamp = date('Y-m-d H:i:s');
    file_put_contents($logFile, "[$timestamp] $mensaje\n", FILE_APPEND);
    echo "$mensaje<br>";
}

// Probar que las constantes se han cargado correctamente
escribirLog("Verificando variables SMTP:");
escribirLog("SMTP_HOST: " . (defined('SMTP_HOST') ? SMTP_HOST : 'No definido'));
escribirLog("SMTP_PORT: " . (defined('SMTP_PORT') ? SMTP_PORT : 'No definido'));
escribirLog("SMTP_USUARIO: " . (defined('SMTP_USUARIO') ? SMTP_USUARIO : 'No definido'));
escribirLog("SMTP_NOMBRE: " . (defined('SMTP_NOMBRE') ? SMTP_NOMBRE : 'No definido'));

// Intentar enviar un correo de prueba
try {
    escribirLog("Preparando envu00edo de correo de prueba...");
    $mail = new PHPMailer(true);
    
    // Configuraciu00f3n del servidor SMTP
    $mail->isSMTP();
    $mail->Host = SMTP_HOST;
    $mail->SMTPAuth = true;
    $mail->Username = SMTP_USUARIO;
    $mail->Password = SMTP_PASSWORD;
    $mail->SMTPSecure = 'tls';
    $mail->Port = SMTP_PORT;
    $mail->CharSet = 'UTF-8';
    
    // Remitente y destinatario
    $mail->setFrom(SMTP_USUARIO, SMTP_NOMBRE);
    $mail->addAddress('elreibo30@gmail.com', 'Maru00eda Garcu00eda');
    
    // Contenido del correo
    $mail->isHTML(true);
    $mail->Subject = 'Prueba de recordatorio - '.date('H:i:s');
    $mail->Body = '<h3>Este es un correo de prueba</h3><p>Enviado desde el script de prueba a las '.date('H:i:s').'</p>';
    
    // Enviar el correo
    if ($mail->send()) {
        escribirLog("¡Correo enviado con u00e9xito!");
    } else {
        escribirLog("Error al enviar el correo: " . $mail->ErrorInfo);
    }
} catch (Exception $e) {
    escribirLog("Error en el proceso de envu00edo: " . $e->getMessage());
}

escribirLog("Fin de la prueba");
