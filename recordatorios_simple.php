<?php
// SCRIPT SIMPLIFICADO PARA RECORDATORIOS DE FICHAJES
// Solo envu00eda un recordatorio 5 minutos despuu00e9s de la hora de entrada/salida

// Configuraciu00f3n de la zona horaria
date_default_timezone_set('Europe/Madrid');

// Definir la ruta base
$baseDir = __DIR__ . '/';

// Incluir archivos necesarios
require_once $baseDir . 'backend/modelos/bd.php';

// Incluir configuraciu00f3n SMTP
require_once $baseDir . 'backend/config/smtp_config.php';

// Incluir PHPMailer
require_once $baseDir . 'backend/vendor/phpmailer/phpmailer/src/Exception.php';
require_once $baseDir . 'backend/vendor/phpmailer/phpmailer/src/PHPMailer.php';
require_once $baseDir . 'backend/vendor/phpmailer/phpmailer/src/SMTP.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

// Variables globales
$fecha_actual = date('Y-m-d');
$archivo_control = __DIR__ . "/backend/logs/recordatorios_enviados_$fecha_actual.json";

// Cargar recordatorios ya enviados hoy
$recordatorios_enviados = [];
if (file_exists($archivo_control)) {
    $contenido = file_get_contents($archivo_control);
    if (!empty($contenido)) {
        $recordatorios_enviados = json_decode($contenido, true) ?: [];
    }
}

// Funciu00f3n para registrar acciones en un archivo de log
function escribirLog($mensaje) {
    $logFile = __DIR__ . '/backend/logs/recordatorios_' . date('Y-m-d') . '.log';
    $logDir = dirname($logFile);
    
    // Verificar si el directorio existe, si no, crearlo
    if (!file_exists($logDir)) {
        mkdir($logDir, 0755, true);
    }
    
    // Formatear el mensaje con fecha y hora
    $mensaje_formateado = '[' . date('Y-m-d H:i:s') . '] ' . $mensaje . "\n";
    
    // Escribir en el archivo de log
    file_put_contents($logFile, $mensaje_formateado, FILE_APPEND);
}

// Funciu00f3n para enviar correo electru00f3nico
function enviarCorreo($destinatario, $asunto, $mensaje, $nombreDestinatario = '') {
    global $smtp_host, $smtp_port, $smtp_username, $smtp_password, $smtp_from_email, $smtp_from_name;
    
    try {
        $mail = new PHPMailer(true);
        
        // Configuraciu00f3n del servidor SMTP
        $mail->isSMTP();
        $mail->Host = $smtp_host;
        $mail->SMTPAuth = true;
        $mail->Username = $smtp_username;
        $mail->Password = $smtp_password;
        $mail->SMTPSecure = 'tls';
        $mail->Port = $smtp_port;
        $mail->CharSet = 'UTF-8';
        
        // Remitente y destinatario
        $mail->setFrom($smtp_from_email, $smtp_from_name);
        $mail->addAddress($destinatario, $nombreDestinatario);
        
        // Contenido del correo
        $mail->isHTML(true);
        $mail->Subject = $asunto;
        $mail->Body = $mensaje;
        
        return $mail->send();
    } catch (Exception $e) {
        escribirLog("Error al enviar correo: " . $e->getMessage());
        return false;
    }
}

// Funciu00f3n simplificada para verificar si se debe enviar un recordatorio
function verificarRecordatorio($nif, $tipo_fichaje, $hora_programada, $email, $nombre, $apellidos) {
    global $recordatorios_enviados, $archivo_control, $conn, $fecha_actual;
    
    // Clave u00fanica para este usuario, fecha y tipo de fichaje
    $clave_recordatorio = $nif . '_' . $tipo_fichaje . '_' . $fecha_actual;
    
    // Si ya se enviu00f3 un recordatorio hoy para este tipo, no enviar otro
    if (isset($recordatorios_enviados[$clave_recordatorio])) {
        escribirLog("No se envu00eda recordatorio a $nombre para $tipo_fichaje porque ya se enviu00f3 uno hoy");
        return;
    }
    
    // Convertir hora programada a objeto DateTime para comparaciones
    $hora_actual = new DateTime();
    $hora_fichaje = new DateTime($fecha_actual . ' ' . $hora_programada);
    
    // Au00f1adir 5 minutos exactos a la hora programada
    $hora_recordatorio = clone $hora_fichaje;
    $hora_recordatorio->modify('+5 minutes');
    
    // Calcular la diferencia en minutos entre la hora actual y la hora de recordatorio
    $diff = $hora_actual->diff($hora_recordatorio);
    $diff_minutos = $diff->h * 60 + $diff->i;
    
    // Si la diferencia es mayor a 3 minutos, no es momento de enviar el recordatorio
    // Esto da una ventana de 6 minutos para enviar el recordatorio (5 minutos despuu00e9s u00b1 3 minutos)
    if ($diff->invert == 0 && $diff_minutos > 3) {
        // Au00fan no es hora
        return;
    } 
    if ($diff->invert == 1 && $diff_minutos > 3) {
        // Ya pasu00f3 la hora
        return;
    }
    
    // Verificar si el usuario ya ha fichado
    $hora_fichaje_str = $hora_fichaje->format('H:i:s');
    $consulta_fichaje = "SELECT id FROM fichajes 
                        WHERE NIF = '$nif' 
                        AND tipo = '$tipo_fichaje' 
                        AND DATE(fecha_hora) = '$fecha_actual'
                        AND TIME(fecha_hora) BETWEEN '$hora_fichaje_str' AND ADDTIME('$hora_fichaje_str', '00:25:00')";
    
    $resultado_fichaje = $conn->query($consulta_fichaje);
    if ($resultado_fichaje && $resultado_fichaje->num_rows > 0) {
        escribirLog("No se envu00eda recordatorio a $nombre porque ya ha fichado $tipo_fichaje");
        return;
    }
    
    // Preparar mensaje
    $asunto = "Recordatorio de $tipo_fichaje";
    $mensaje = "<h3>Hola $nombre,</h3>";
    $mensaje .= "<p>Te recordamos que debes registrar tu $tipo_fichaje. La hora programada era " . substr($hora_programada, 0, 5) . " (hace 5 minutos).</p>";
    $mensaje .= "<p>Por favor, registra tu fichaje lo antes posible.</p>";
    
    // Enviar correo
    if (enviarCorreo($email, $asunto, $mensaje, "$nombre $apellidos")) {
        // Registrar el envu00edo del recordatorio
        $recordatorios_enviados[$clave_recordatorio] = date('Y-m-d H:i:s');
        file_put_contents($archivo_control, json_encode($recordatorios_enviados, JSON_PRETTY_PRINT));
        
        escribirLog("Recordatorio de $tipo_fichaje enviado a $nombre ($email)");
    } else {
        escribirLog("Error al enviar recordatorio de $tipo_fichaje a $nombre");
    }
}

// INICIO DEL SCRIPT
escribirLog("Iniciando verificaciu00f3n de recordatorios. Hora actual: " . date('H:i:s'));

// Conectar a la base de datos
$db = new db();
$conn = $db->getConn();

if (!$conn) {
    escribirLog("Error de conexiu00f3n a la base de datos");
    exit;
}

// Consulta para obtener usuarios con horario configurado
$consulta = "SELECT u.NIF, u.nombre, u.apellidos, u.email as correo, 
           h.hora_inicio as hora_entrada, h.hora_fin as hora_salida
           FROM usuarios u 
           JOIN horarios h ON u.id_horario = h.id";

try {
    $resultado = $conn->query($consulta);
    
    if (!$resultado) {
        escribirLog("Error en la consulta: " . $conn->error);
        exit;
    }
    
    // Procesar cada usuario
    while ($usuario = $resultado->fetch_assoc()) {
        $nif = $usuario['NIF'];
        $nombre = $usuario['nombre'];
        $apellidos = $usuario['apellidos'];
        $email = $usuario['correo'];
        $hora_entrada = $usuario['hora_entrada'];
        $hora_salida = $usuario['hora_salida'];
        
        escribirLog("Verificando recordatorios para: $nombre $apellidos ($email), Horario: $hora_entrada - $hora_salida");
        
        // Verificar recordatorio de entrada
        verificarRecordatorio($nif, 'entrada', $hora_entrada, $email, $nombre, $apellidos);
        
        // Verificar recordatorio de salida
        verificarRecordatorio($nif, 'salida', $hora_salida, $email, $nombre, $apellidos);
    }
    
    escribirLog("Verificaciu00f3n de recordatorios finalizada");
    
} catch (Exception $e) {
    escribirLog("Error: " . $e->getMessage());
} finally {
    // Cerrar conexiu00f3n
    $conn->close();
}
