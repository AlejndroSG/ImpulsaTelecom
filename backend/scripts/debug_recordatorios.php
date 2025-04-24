<?php
// Script de depuraciu00f3n para forzar la verificaciu00f3n y envu00edo de recordatorios
header('Content-Type: text/plain; charset=UTF-8');

// Definir la ruta base
$baseDir = __DIR__ . '/../';

// Incluir archivos necesarios
require_once $baseDir . 'modelos/bd.php';

// Incluir configuraciu00f3n SMTP si existe
if (file_exists($baseDir . 'config/smtp_config.php')) {
    require_once $baseDir . 'config/smtp_config.php';
    echo "Configuraciu00f3n SMTP cargada correctamente.\n";
} else {
    echo "ADVERTENCIA: No se encontru00f3 el archivo de configuraciu00f3n SMTP.\n";
}

// Incluir PHPMailer
if (file_exists($baseDir . 'vendor/phpmailer/phpmailer/src/PHPMailer.php')) {
    require_once $baseDir . 'vendor/phpmailer/phpmailer/src/Exception.php';
    require_once $baseDir . 'vendor/phpmailer/phpmailer/src/PHPMailer.php';
    require_once $baseDir . 'vendor/phpmailer/phpmailer/src/SMTP.php';
    echo "Biblioteca PHPMailer cargada correctamente.\n";
} else {
    echo "ERROR: No se encontru00f3 PHPMailer. Verificando ruta alternativa...\n";
    
    if (file_exists($baseDir . 'vendor/autoload.php')) {
        require_once $baseDir . 'vendor/autoload.php';
        echo "Autoload cargado correctamente. PHPMailer deberu00eda estar disponible.\n";
    } else {
        echo "ERROR CRITICO: No se pudo cargar PHPMailer. El script puede fallar.\n";
    }
}

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

// Funciu00f3n para registrar mensajes
function escribirLog($mensaje, $tambiu00e9n_consola = true) {
    global $baseDir;
    
    $logFile = $baseDir . 'logs/debug_recordatorios_' . date('Y-m-d') . '.log';
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
    
    // Tambiu00e9n mostrar en consola si se solicita
    if ($tambiu00e9n_consola) {
        echo "[$timestamp] $mensaje\n";
    }
}

// Funciu00f3n para enviar correo usando PHPMailer
function enviarCorreoForced($destinatario, $asunto, $mensaje, $nombreDestinatario = '') {
    global $baseDir;
    
    // Obtener configuraciu00f3n SMTP desde las constantes o usar valores por defecto
    $smtp_host = defined('SMTP_HOST') ? SMTP_HOST : 'smtp.gmail.com';
    $smtp_port = defined('SMTP_PORT') ? SMTP_PORT : 587;
    $smtp_usuario = defined('SMTP_USUARIO') ? SMTP_USUARIO : 'elreibo30@gmail.com';
    $smtp_password = defined('SMTP_PASSWORD') ? SMTP_PASSWORD : 'crel reic yxdc cgxb';
    $smtp_nombre = defined('SMTP_NOMBRE') ? SMTP_NOMBRE : 'Impulsa Telecom';
    
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
        
        // Para modo debug
        $mail->SMTPDebug = 2;                               // Habilitar debug verbose (quitar en producciu00f3n)
        $mail->Debugoutput = function($str, $level) {
            escribirLog("[PHPMailer Debug] $str", true);
        };
        
        // Remitente y destinatarios
        $mail->setFrom($smtp_usuario, $smtp_nombre);
        $mail->addAddress($destinatario, $nombreDestinatario);
        $mail->addReplyTo('noreply@impulsatelecom.com', 'No responder');
        
        // Contenido del mensaje
        $mail->isHTML(true);
        $mail->Subject = $asunto;
        $mail->Body = $mensaje;
        $mail->AltBody = strip_tags(str_replace(['<br>', '<p>', '</p>'], ["\n", "\n", "\n"], $mensaje));
        
        // Intentar enviar el correo
        if ($mail->send()) {
            escribirLog("Correo enviado con u00e9xito a: $destinatario");
            return true;
        } else {
            escribirLog("Error al enviar correo: " . $mail->ErrorInfo);
            return false;
        }
    } catch (Exception $e) {
        escribirLog("Excepciu00f3n en el envu00edo de correo: " . $e->getMessage());
        return false;
    }
}

escribirLog("==============================================");
escribirLog("INICIANDO DEPURACIu00d3N DE RECORDATORIOS FORZADA");
escribirLog("==============================================");

// Obtener fecha y hora actual para comparar
$fechaActual = date('Y-m-d');
$horaActual = date('H:i:s');

escribirLog("Fecha actual: $fechaActual");
escribirLog("Hora actual: $horaActual");

try {
    // Conectar a la base de datos
    $db = new db();
    $conn = $db->getConn();
    
    if (!$conn) {
        escribirLog("ERROR: No se pudo conectar a la base de datos");
        exit;
    }
    
    escribirLog("Conexiu00f3n a la base de datos establecida");
    
    // Buscar Maru00eda en la base de datos
    $email_maria = 'elreibo30@gmail.com';
    $query = "SELECT u.*, h.hora_entrada, h.hora_salida, h.inicio_pausa, h.fin_pausa 
             FROM usuarios u 
             LEFT JOIN horarios h ON u.NIF = h.NIF 
             WHERE u.email = ?";
    
    $stmt = $conn->prepare($query);
    $stmt->bind_param("s", $email_maria);
    $stmt->execute();
    $resultado = $stmt->get_result();
    
    if ($resultado && $resultado->num_rows > 0) {
        $usuario = $resultado->fetch_assoc();
        escribirLog("Usuario encontrado: {$usuario['nombre']} {$usuario['apellidos']} ({$usuario['email']})");
        escribirLog("Horario configurado: Entrada {$usuario['hora_entrada']} - Salida {$usuario['hora_salida']}");
        
        // Verificar si ya se enviu00f3 recordatorio hoy
        $query_recordatorio = "SELECT * FROM recordatorios_enviados WHERE NIF = ? AND fecha = ? AND tipo_recordatorio = 'salida'";
        $stmt = $conn->prepare($query_recordatorio);
        $stmt->bind_param("ss", $usuario['NIF'], $fechaActual);
        $stmt->execute();
        $result_recordatorio = $stmt->get_result();
        
        if ($result_recordatorio && $result_recordatorio->num_rows > 0) {
            escribirLog("ADVERTENCIA: Ya se enviu00f3 un recordatorio de salida a este usuario hoy");
            $recordatorio = $result_recordatorio->fetch_assoc();
            escribirLog("Detalles del recordatorio previo: ID {$recordatorio['id']} - Tipo {$recordatorio['tipo_recordatorio']} - Fecha {$recordatorio['fecha']}");
        } else {
            escribirLog("No se ha enviado recordatorio de salida hoy a este usuario");
        }
        
        // Verificar si el usuario ya ha fichado la salida
        $query_fichaje = "SELECT * FROM registros WHERE NIF = ? AND fecha = ? AND horaFin IS NOT NULL";
        $stmt = $conn->prepare($query_fichaje);
        $stmt->bind_param("ss", $usuario['NIF'], $fechaActual);
        $stmt->execute();
        $result_fichaje = $stmt->get_result();
        
        if ($result_fichaje && $result_fichaje->num_rows > 0) {
            escribirLog("ADVERTENCIA: El usuario ya ha registrado su salida hoy");
            $fichaje = $result_fichaje->fetch_assoc();
            escribirLog("Detalles del fichaje: ID {$fichaje['idRegistro']} - Hora de salida {$fichaje['horaFin']}");
        } else {
            escribirLog("El usuario NO ha registrado su salida hoy");
        }
        
        // Calcular momento del recordatorio (5 minutos despuu00e9s de la hora de salida)
        $dt_salida = new DateTime("{$fechaActual} {$usuario['hora_salida']}");
        $dt_recordatorio_salida = clone $dt_salida;
        $dt_recordatorio_salida->modify("+5 minutes");
        
        $hora_recordatorio = $dt_recordatorio_salida->format('H:i:s');
        
        escribirLog("Hora de salida: {$usuario['hora_salida']}");
        escribirLog("Hora para recordatorio: {$hora_recordatorio}");
        escribirLog("Hora actual: {$horaActual}");
        
        // Verificar si es hora de enviar el recordatorio
        $dt_actual = new DateTime("{$fechaActual} {$horaActual}");
        $diff_minutos = ($dt_actual->getTimestamp() - $dt_recordatorio_salida->getTimestamp()) / 60;
        
        escribirLog("Diferencia en minutos desde la hora del recordatorio: {$diff_minutos}");
        
        // Para pruebas, forzamos el envu00edo del recordatorio independientemente de la hora
        escribirLog("FORZANDO ENVu00cdO DE RECORDATORIO DE PRUEBA");
        
        // Generar token u00fanico para fichaje ru00e1pido
        $token = md5($usuario['NIF'] . $fechaActual . 'salida' . time());
        
        // Guardar el token en la base de datos
        $query_token = "INSERT INTO tokens_fichaje (token, NIF, tipo_fichaje, fecha_creacion, usado) 
                        VALUES (?, ?, 'salida', NOW(), 0)";
        $stmt = $conn->prepare($query_token);
        $stmt->bind_param("ss", $token, $usuario['NIF']);
        $stmt->execute();
        
        // URL para fichaje ru00e1pido
        $url_base = 'http://localhost/ImpulsaTelecom';
        $url_fichaje = "{$url_base}/backend/api/fichaje_rapido.php?token={$token}";
        
        // Preparar mensaje
        $asunto = "URGENTE: Recordatorio de salida - {$dt_salida->format('H:i')}";
        
        $mensaje = "<h3>Hola {$usuario['nombre']},</h3>";
        $mensaje .= "<p>Te recordamos que tu salida estaba programada para las <strong>{$usuario['hora_salida']}</strong>.</p>";
        $mensaje .= "<p>Ya han pasado 5 minutos desde tu hora de salida programada. Tienes 5 minutos mu00e1s de margen para registrar tu fichaje sin incidencias.</p>";
        $mensaje .= "<p>No olvides registrar tu salida en el sistema de fichajes.</p>";
        
        $mensaje .= "<div style='margin: 20px 0;'>
            <a href='{$url_fichaje}' style='display: inline-block; background-color: #78bd00; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;'>
                Registrar salida ahora
            </a>
            <p style='font-size: 12px; margin-top: 10px;'>O copia y pega este enlace en tu navegador: {$url_fichaje}</p>
        </div>";
        
        $mensaje .= "<p>Gracias por tu atenciu00f3n.</p>";
        
        // Enviar correo
        if (enviarCorreoForced($usuario['email'], $asunto, $mensaje, "{$usuario['nombre']} {$usuario['apellidos']}")) {
            // Registrar el envu00edo
            $query_registro = "INSERT INTO recordatorios_enviados (NIF, tipo_recordatorio, tipo_fichaje, fecha) 
                              VALUES (?, 'salida', 'salida', ?)";
            $stmt = $conn->prepare($query_registro);
            $stmt->bind_param("ss", $usuario['NIF'], $fechaActual);
            $stmt->execute();
            
            escribirLog("CORREO DE RECORDATORIO ENVIADO Y REGISTRADO CON u00c9XITO");
        } else {
            escribirLog("ERROR al enviar el correo de recordatorio");
        }
    } else {
        escribirLog("ERROR: No se encontru00f3 a Maru00eda en la base de datos o no tiene horario asignado");
    }
    
    // Cerrar conexiu00f3n
    $conn->close();
    
} catch (Exception $e) {
    escribirLog("ERROR GENERAL: " . $e->getMessage());
}

escribirLog("==============================================");
escribirLog("FIN DE LA DEPURACIu00d3N DE RECORDATORIOS FORZADA");
escribirLog("==============================================");
escribirLog("Revisa el correo de Maru00eda (elreibo30@gmail.com) para verificar la recepciu00f3n del recordatorio");
