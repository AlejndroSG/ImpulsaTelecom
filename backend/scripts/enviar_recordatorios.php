<?php
// Script para enviar recordatorios de fichajes por correo electrónico

// Definir la ruta base
$baseDir = __DIR__ . '/../';

// Incluir archivos necesarios
require_once $baseDir . 'modelos/bd.php';

// Intentar incluir config.php si existe
@include_once $baseDir . 'config.php';

// Incluir configuración SMTP
@include_once $baseDir . 'config/smtp_config.php';

// Incluir PHPMailer
require_once $baseDir . 'vendor/autoload.php';
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;
use PHPMailer\PHPMailer\SMTP;

// Función para registrar acciones en un archivo de log
function escribirLog($mensaje) {
    $logFile = __DIR__ . '/../logs/recordatorios_' . date('Y-m-d') . '.log';
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
    // Obtener configuración SMTP desde las variables o usar los valores por defecto
    $smtp_host = defined('SMTP_HOST') ? SMTP_HOST : 'smtp.gmail.com';
    $smtp_port = defined('SMTP_PORT') ? SMTP_PORT : 587;
    $smtp_usuario = defined('SMTP_USUARIO') ? SMTP_USUARIO : 'tu-correo@gmail.com';
    $smtp_password = defined('SMTP_PASSWORD') ? SMTP_PASSWORD : 'tu-contraseña-o-clave-de-aplicacion';
    $smtp_nombre = defined('SMTP_NOMBRE') ? SMTP_NOMBRE : 'Impulsa Telecom';
    
    try {
        // Crear una nueva instancia de PHPMailer
        $mail = new PHPMailer(true); // true habilita excepciones
        
        // Configuración del servidor
        $mail->isSMTP();                                    // Usar SMTP
        $mail->Host       = $smtp_host;                     // Servidor SMTP
        $mail->SMTPAuth   = true;                           // Habilitar autenticación SMTP
        $mail->Username   = $smtp_usuario;                  // Usuario SMTP
        $mail->Password   = $smtp_password;                 // Contraseña SMTP
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS; // Habilitar encriptación TLS
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
                    <p>Este es un correo automático, por favor no responda a este mensaje.</p>
                    <p>&copy; Impulsa Telecom - 2025</p>
                </div>
            </div>
        </body>
        </html>
        HTML;
        
        // Establecer el cuerpo del mensaje en HTML
        $mail->Body = $plantilla;
        
        // Versión alternativa en texto plano (para clientes que no soportan HTML)
        $mail->AltBody = strip_tags(str_replace(['<br>', '<br/>', '<br />'], "\n", $mensaje));
        
        // Enviar el correo
        $mail->send();
        escribirLog("Correo enviado con éxito a: $destinatario, Asunto: $asunto");
        return true;
    } catch (Exception $e) {
        escribirLog("Error al enviar correo a: $destinatario, Asunto: $asunto - Error: " . $mail->ErrorInfo);
        return false;
    }
}

// Conectar a la base de datos
$db = new db();
$conn = $db->getConn();

// Obtener fecha y hora actual
$fechaActual = date('Y-m-d');
$horaActual = date('H:i:s');
$diaSemana = strtolower(date('l'));

// Mapear días de la semana en inglés a español para la consulta SQL
$diasSemana = [
    'monday' => 'lunes',
    'tuesday' => 'martes',
    'wednesday' => 'miercoles',
    'thursday' => 'jueves',
    'friday' => 'viernes',
    'saturday' => 'sabado',
    'sunday' => 'domingo'
];

$diaActual = $diasSemana[$diaSemana];

// Obtener usuarios con horarios asignados para el día actual
$query = "SELECT u.NIF, u.nombre, u.apellidos, u.email AS correo, h.* 
          FROM usuarios u 
          INNER JOIN horarios h ON u.id_horario = h.id 
          WHERE h.$diaActual = 1 
          AND u.activo = 1 
          AND u.id_horario IS NOT NULL";

try {
    $resultado = $conn->query($query);
    
    if (!$resultado) {
        escribirLog("Error en la consulta: " . $conn->error);
        exit();
    }
    
    escribirLog("Iniciando verificación de recordatorios. Hora actual: $horaActual");
    
    // Preparar tabla para rastrear recordatorios enviados
    $verificarTabla = "SHOW TABLES LIKE 'recordatorios_enviados'";
    $tablaExiste = $conn->query($verificarTabla)->num_rows > 0;
    
    if (!$tablaExiste) {
        $crearTabla = "CREATE TABLE recordatorios_enviados (
            id INT AUTO_INCREMENT PRIMARY KEY,
            NIF VARCHAR(20) NOT NULL,
            tipo_recordatorio ENUM('entrada', 'salida', 'inicio_pausa', 'fin_pausa') NOT NULL,
            fecha DATE NOT NULL,
            enviado TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX (NIF, tipo_recordatorio, fecha)
        )";
        
        if (!$conn->query($crearTabla)) {
            escribirLog("Error al crear tabla de recordatorios: " . $conn->error);
            exit();
        }
        
        escribirLog("Tabla recordatorios_enviados creada correctamente");
    }
    
    // Procesar cada usuario con horario asignado
    while ($usuario = $resultado->fetch_assoc()) {
        $nif = $usuario['NIF'];
        $nombre = $usuario['nombre'];
        $apellidos = $usuario['apellidos'];
        $correo = $usuario['correo'];
        $hora_inicio = $usuario['hora_inicio'];
        $hora_fin = $usuario['hora_fin'];
        $tiempo_pausa = $usuario['tiempo_pausa_permitido'];
        
        escribirLog("Verificando recordatorios para: $nombre $apellidos ($correo), Horario: $hora_inicio - $hora_fin");
        
        // Convertir horas a objetos DateTime para operar con ellas
        $fecha_base = new DateTime($fechaActual);
        $dt_inicio = clone $fecha_base;
        $dt_inicio->modify("$hora_inicio");
        
        $dt_fin = clone $fecha_base;
        $dt_fin->modify("$hora_fin");
        
        // Calcular horas de pausa (asumiendo que la pausa está a la mitad de la jornada)
        $duracion_jornada = $dt_inicio->diff($dt_fin)->h * 60 + $dt_inicio->diff($dt_fin)->i;
        $mitad_jornada = $duracion_jornada / 2;
        
        $dt_inicio_pausa = clone $dt_inicio;
        $dt_inicio_pausa->modify("+$mitad_jornada minutes");
        
        $dt_fin_pausa = clone $dt_inicio_pausa;
        $dt_fin_pausa->modify("+$tiempo_pausa minutes");
        
        // Restar 5 minutos para los recordatorios
        $dt_recordatorio_entrada = clone $dt_inicio;
        $dt_recordatorio_entrada->modify("-5 minutes");
        
        $dt_recordatorio_salida = clone $dt_fin;
        $dt_recordatorio_salida->modify("-5 minutes");
        
        $dt_recordatorio_inicio_pausa = clone $dt_inicio_pausa;
        $dt_recordatorio_inicio_pausa->modify("-5 minutes");
        
        $dt_recordatorio_fin_pausa = clone $dt_fin_pausa;
        $dt_recordatorio_fin_pausa->modify("-5 minutes");
        
        // Hora actual como DateTime
        $dt_actual = new DateTime("$fechaActual $horaActual");
        
        // Calcular diferencias en minutos entre la hora actual y cada recordatorio
        $diff_entrada = abs(($dt_actual->getTimestamp() - $dt_recordatorio_entrada->getTimestamp()) / 60);
        $diff_salida = abs(($dt_actual->getTimestamp() - $dt_recordatorio_salida->getTimestamp()) / 60);
        $diff_inicio_pausa = abs(($dt_actual->getTimestamp() - $dt_recordatorio_inicio_pausa->getTimestamp()) / 60);
        $diff_fin_pausa = abs(($dt_actual->getTimestamp() - $dt_recordatorio_fin_pausa->getTimestamp()) / 60);
        
        // Verificar recordatorios no enviados previamente hoy
        // Array de tipos de recordatorios para verificar
        $tipos_recordatorios = [
            'entrada' => ['diff' => $diff_entrada, 'dt' => $dt_recordatorio_entrada, 'referencia' => $dt_inicio, 'accion' => 'entrada al trabajo'],
            'salida' => ['diff' => $diff_salida, 'dt' => $dt_recordatorio_salida, 'referencia' => $dt_fin, 'accion' => 'salida del trabajo'],
            'inicio_pausa' => ['diff' => $diff_inicio_pausa, 'dt' => $dt_recordatorio_inicio_pausa, 'referencia' => $dt_inicio_pausa, 'accion' => 'inicio de pausa'],
            'fin_pausa' => ['diff' => $diff_fin_pausa, 'dt' => $dt_recordatorio_fin_pausa, 'referencia' => $dt_fin_pausa, 'accion' => 'fin de pausa']
        ];
        
        foreach ($tipos_recordatorios as $tipo => $datos) {
            // Verificar si el tipo de recordatorio está activado en la configuración
            $tipo_activado = true; // Por defecto activado
            
            // Verificar configuración si está definida
            if ($tipo == 'entrada' && defined('ACTIVAR_RECORDATORIO_ENTRADA')) {
                $tipo_activado = ACTIVAR_RECORDATORIO_ENTRADA;
            } else if ($tipo == 'salida' && defined('ACTIVAR_RECORDATORIO_SALIDA')) {
                $tipo_activado = ACTIVAR_RECORDATORIO_SALIDA;
            } else if ($tipo == 'inicio_pausa' && defined('ACTIVAR_RECORDATORIO_INICIO_PAUSA')) {
                $tipo_activado = ACTIVAR_RECORDATORIO_INICIO_PAUSA;
            } else if ($tipo == 'fin_pausa' && defined('ACTIVAR_RECORDATORIO_FIN_PAUSA')) {
                $tipo_activado = ACTIVAR_RECORDATORIO_FIN_PAUSA;
            }
            
            // Si no está activado este tipo, pasar al siguiente
            if (!$tipo_activado) {
                continue;
            }
            
            // Verificar si estamos cerca del momento de enviar el recordatorio (dentro de 2 minutos)
            $es_momento_recordatorio = $datos['diff'] <= 2;
            
            if ($es_momento_recordatorio) {
                // Verificar si ya se envió este recordatorio hoy
                $verificar_enviado = "SELECT id FROM recordatorios_enviados 
                                       WHERE NIF = '$nif' 
                                       AND tipo_recordatorio = '$tipo' 
                                       AND fecha = '$fechaActual'";
                $resultado_verificacion = $conn->query($verificar_enviado);
                
                if ($resultado_verificacion->num_rows == 0) {
                    // No se ha enviado todavía - Preparar mensaje
                    $hora_accion = $datos['referencia']->format('H:i');
                    $asunto = "Recordatorio: {$datos['accion']} a las $hora_accion";
                    
                    $mensaje = "<h3>Hola $nombre,</h3>";
                    $mensaje .= "<p>Te recordamos que {$datos['accion']} está programada para las <strong>$hora_accion</strong> (en aproximadamente 5 minutos).</p>";
                    
                    if ($tipo == 'entrada' || $tipo == 'fin_pausa') {
                        $mensaje .= "<p>No olvides registrar tu <strong>entrada</strong> en el sistema de fichajes.</p>";
                    } else if ($tipo == 'salida' || $tipo == 'inicio_pausa') {
                        $mensaje .= "<p>No olvides registrar tu <strong>salida</strong> en el sistema de fichajes.</p>";
                    }
                    
                    $mensaje .= "<p>Gracias por tu atención.</p>";
                    
                    // Enviar correo
                    if (enviarCorreo($correo, $asunto, $mensaje, "$nombre $apellidos")) {
                        // Registrar envío en la base de datos
                        $registrar_envio = "INSERT INTO recordatorios_enviados (NIF, tipo_recordatorio, fecha) 
                                           VALUES ('$nif', '$tipo', '$fechaActual')";
                        $conn->query($registrar_envio);
                        
                        escribirLog("Recordatorio de {$datos['accion']} enviado a $nombre $apellidos ($correo)");
                    }
                } else {
                    escribirLog("Recordatorio de {$datos['accion']} ya fue enviado hoy a $nombre $apellidos");
                }
            }
        }
    }
    
    escribirLog("Verificación de recordatorios finalizada");
    
} catch (Exception $e) {
    escribirLog("Error: " . $e->getMessage());
}

// Cerrar conexión
$conn->close();
