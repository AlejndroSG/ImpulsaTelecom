<?php
// Script mejorado para recordatorios de fichajes con soporte para turnos partidos
// Permite enviar mu00faltiples recordatorios del mismo tipo en un mismo du00eda
// Versioon actualizada para usar la estructura correcta de la tabla 'horarios'

// Definir la ruta base
$baseDir = __DIR__ . '/../';

// Incluir archivos necesarios
require_once $baseDir . 'modelos/bd.php';

// Incluir configuraciu00f3n SMTP
require_once $baseDir . 'config/smtp_config.php';

// Incluir PHPMailer
require_once $baseDir . 'vendor/phpmailer/phpmailer/src/Exception.php';
require_once $baseDir . 'vendor/phpmailer/phpmailer/src/PHPMailer.php';
require_once $baseDir . 'vendor/phpmailer/phpmailer/src/SMTP.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

// Funciu00f3n para registrar acciones en un archivo de log
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

// Funciu00f3n para enviar correo electru00f3nico
function enviarCorreo($destinatario, $asunto, $mensaje, $nombreDestinatario = '') {
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
        
        // Remitente y destinatarios
        $mail->setFrom($smtp_usuario, $smtp_nombre);
        $mail->addAddress($destinatario, $nombreDestinatario);
        $mail->addReplyTo('noreply@impulsatelecom.com', 'No responder');
        
        // Contenido del mensaje
        $mail->isHTML(true);
        $mail->Subject = $asunto;
        $mail->Body = $mensaje;
        $mail->AltBody = strip_tags(str_replace(['<br>', '<p>', '</p>'], ["\n", "\n", "\n"], $mensaje));
        
        // Enviar el correo
        $mail->send();
        return true;
    } catch (Exception $e) {
        escribirLog("Error al enviar correo: " . $e->getMessage());
        return false;
    }
}

// Iniciar verificaciu00f3n de recordatorios
escribirLog("Iniciando verificaciu00f3n de recordatorios. Hora actual: " . date('H:i:s'));

// Obtener fecha y hora actual
$fechaActual = date('Y-m-d');
$horaActual = date('H:i:s');

// Conectar a la base de datos
$db = new db();
$conn = $db->getConn();

// CONSULTA ACTUALIZADA: Obtener usuarios con horario configurado
// Ahora utilizamos el campo id_horario de usuarios para unir con la tabla horarios
// Y usamos los nombres de campos correctos de la tabla horarios
$query = "SELECT u.NIF, u.nombre, u.apellidos, u.email as correo, 
         h.hora_inicio as hora_entrada, h.hora_fin as hora_salida,
         h.tiempo_pausa_permitido
         FROM usuarios u 
         JOIN horarios h ON u.id_horario = h.id 
         WHERE u.email IS NOT NULL AND u.email != '' AND h.activo = 1";

try {
    $resultado = $conn->query($query);
    
    if (!$resultado) {
        escribirLog("Error en la consulta: " . $conn->error);
        exit;
    }
    
    // Procesar cada usuario
    while ($usuario = $resultado->fetch_assoc()) {
        $nif = $usuario['NIF'];
        $nombre = $usuario['nombre'];
        $apellidos = $usuario['apellidos'];
        $correo = $usuario['correo'];
        
        escribirLog("Verificando recordatorios para: $nombre $apellidos ($correo), Horario: {$usuario['hora_entrada']} - {$usuario['hora_salida']}");
        
        // Verificar si es turno partido (en la nueva estructura no tenemos campos específicos para pausas)
        // Por ahora, asumimos que no hay turnos partidos o los manejamos de otra manera
        $tiene_turno_partido = false;
        $tiempo_pausa = isset($usuario['tiempo_pausa_permitido']) ? intval($usuario['tiempo_pausa_permitido']) : 0;
        
        // Si tienen tiempo de pausa permitido, podemos asumir un horario de pausa a mitad de la jornada
        if ($tiempo_pausa > 0) {
            $tiene_turno_partido = true;
            
            // Calculamos mitad de jornada para la pausa
            $dt_inicio_temp = new DateTime("$fechaActual {$usuario['hora_entrada']}");
            $dt_fin_temp = new DateTime("$fechaActual {$usuario['hora_salida']}");
            
            // Calcular punto medio para la pausa
            $diff_segundos = $dt_fin_temp->getTimestamp() - $dt_inicio_temp->getTimestamp();
            $mitad_jornada = $dt_inicio_temp->getTimestamp() + ($diff_segundos / 2);
            
            // Crear horas de inicio y fin de pausa
            $inicio_pausa_dt = new DateTime("@$mitad_jornada");
            $inicio_pausa_dt->setTimezone(new DateTimeZone(date_default_timezone_get()));
            $usuario['inicio_pausa'] = $inicio_pausa_dt->format('H:i:s');
            
            // Fin de pausa = inicio + tiempo permitido (en minutos)
            $fin_pausa_dt = clone $inicio_pausa_dt;
            $fin_pausa_dt->modify("+$tiempo_pausa minutes");
            $usuario['fin_pausa'] = $fin_pausa_dt->format('H:i:s');
            
            escribirLog("  Pausa calculada: {$usuario['inicio_pausa']} - {$usuario['fin_pausa']} ($tiempo_pausa minutos)");
        }
        
        // Convertir tiempos a objetos DateTime para comparar
        $dt_inicio = new DateTime("$fechaActual {$usuario['hora_entrada']}");
        $dt_fin = new DateTime("$fechaActual {$usuario['hora_salida']}");
        
        // Valores para turno partido
        $dt_inicio_pausa = null;
        $dt_fin_pausa = null;
        
        if ($tiene_turno_partido) {
            $dt_inicio_pausa = new DateTime("$fechaActual {$usuario['inicio_pausa']}");
            $dt_fin_pausa = new DateTime("$fechaActual {$usuario['fin_pausa']}");
        }
        
        // Sumar 5 minutos para los recordatorios (para que lleguen dentro del periodo de gracia de 10 min)
        $dt_recordatorio_entrada = clone $dt_inicio;
        $dt_recordatorio_entrada->modify("+5 minutes");
        
        $dt_recordatorio_salida = clone $dt_fin;
        $dt_recordatorio_salida->modify("+5 minutes");
        
        // Para turno partido
        $dt_recordatorio_inicio_pausa = null;
        $dt_recordatorio_fin_pausa = null;
        
        if ($tiene_turno_partido) {
            $dt_recordatorio_inicio_pausa = clone $dt_inicio_pausa;
            $dt_recordatorio_inicio_pausa->modify("+5 minutes");
            
            $dt_recordatorio_fin_pausa = clone $dt_fin_pausa;
            $dt_recordatorio_fin_pausa->modify("+5 minutes");
        }
        
        // Hora actual como DateTime
        $dt_actual = new DateTime("$fechaActual $horaActual");
        
        // Calcular diferencias en minutos entre la hora actual y cada recordatorio
        $diff_entrada = abs(($dt_actual->getTimestamp() - $dt_recordatorio_entrada->getTimestamp()) / 60);
        $diff_salida = abs(($dt_actual->getTimestamp() - $dt_recordatorio_salida->getTimestamp()) / 60);
        
        // Para turno partido
        $diff_inicio_pausa = $tiene_turno_partido ? 
            abs(($dt_actual->getTimestamp() - $dt_recordatorio_inicio_pausa->getTimestamp()) / 60) : null;
        $diff_fin_pausa = $tiene_turno_partido ? 
            abs(($dt_actual->getTimestamp() - $dt_recordatorio_fin_pausa->getTimestamp()) / 60) : null;
        
        // Array de tipos de recordatorios para verificar
        $tipos_recordatorios = [
            'entrada' => [
                'diff' => $diff_entrada, 
                'dt' => $dt_recordatorio_entrada, 
                'referencia' => $dt_inicio, 
                'accion' => 'entrada al trabajo', 
                'tipo_fichaje' => 'entrada'
            ],
            'salida' => [
                'diff' => $diff_salida, 
                'dt' => $dt_recordatorio_salida, 
                'referencia' => $dt_fin, 
                'accion' => 'salida del trabajo', 
                'tipo_fichaje' => 'salida'
            ]
        ];
        
        // Au00f1adir recordatorios de turno partido si aplica
        if ($tiene_turno_partido) {
            $tipos_recordatorios['inicio_pausa'] = [
                'diff' => $diff_inicio_pausa, 
                'dt' => $dt_recordatorio_inicio_pausa, 
                'referencia' => $dt_inicio_pausa, 
                'accion' => 'inicio de pausa', 
                'tipo_fichaje' => 'salida'
            ];
            
            $tipos_recordatorios['fin_pausa'] = [
                'diff' => $diff_fin_pausa, 
                'dt' => $dt_recordatorio_fin_pausa, 
                'referencia' => $dt_fin_pausa, 
                'accion' => 'fin de pausa', 
                'tipo_fichaje' => 'entrada'
            ];
        }
        
        // Procesar cada tipo de recordatorio
        foreach ($tipos_recordatorios as $tipo => $datos) {
            // Verificar si el tipo de recordatorio estu00e1 activado en la configuraciu00f3n
            $tipo_activado = true; // Por defecto activado
            
            // Verificar configuraciu00f3n si estu00e1 definida
            if ($tipo == 'entrada' && defined('ACTIVAR_RECORDATORIO_ENTRADA')) {
                $tipo_activado = ACTIVAR_RECORDATORIO_ENTRADA;
            } else if ($tipo == 'salida' && defined('ACTIVAR_RECORDATORIO_SALIDA')) {
                $tipo_activado = ACTIVAR_RECORDATORIO_SALIDA;
            } else if ($tipo == 'inicio_pausa' && defined('ACTIVAR_RECORDATORIO_INICIO_PAUSA')) {
                $tipo_activado = ACTIVAR_RECORDATORIO_INICIO_PAUSA;
            } else if ($tipo == 'fin_pausa' && defined('ACTIVAR_RECORDATORIO_FIN_PAUSA')) {
                $tipo_activado = ACTIVAR_RECORDATORIO_FIN_PAUSA;
            }
            
            // Si no estu00e1 activado este tipo, pasar al siguiente
            if (!$tipo_activado) {
                continue;
            }
            
            // Verificar si estamos cerca del momento de enviar el recordatorio (dentro de 2 minutos)
            $es_momento_recordatorio = $datos['diff'] <= 2;
            
            if ($es_momento_recordatorio) {
                // En lugar de verificar si ya se enviu00f3 cualquier recordatorio hoy,
                // ahora verificamos si se enviu00f3 un recordatorio en la u00faltima hora para este mismo tipo
                $hora_limite = date('Y-m-d H:i:s', strtotime('-60 minutes')); // 1 hora atru00e1s
                
                $verificar_enviado = "SELECT id FROM recordatorios_enviados 
                                      WHERE NIF = '$nif' 
                                      AND tipo_recordatorio = '$tipo' 
                                      AND fecha_hora > '$hora_limite'";
                                      
                $resultado_verificacion = $conn->query($verificar_enviado);
                
                // Verificar si el usuario ya ha fichado este tipo de registro recientemente
                $tipo_fichaje = $datos['tipo_fichaje']; // 'entrada' o 'salida'
                
                // Obtener la hora de referencia para este fichaje (unos minutos antes del recordatorio)
                $hora_referencia = clone $datos['referencia'];
                $hora_referencia->modify("-15 minutes"); // Buscar fichajes desde 15 minutos antes de la hora programada
                $hora_referencia_str = $hora_referencia->format('H:i:s');
                
                $verificar_fichaje = "SELECT idRegistro FROM registros 
                                     WHERE NIF = '$nif' 
                                     AND fecha = '$fechaActual'";
                
                // Si es recordatorio de entrada, verificar si ya registru00f3 entrada reciente
                if ($tipo_fichaje == 'entrada') {
                    $verificar_fichaje .= " AND horaInicio > '$hora_referencia_str'";
                }
                // Si es recordatorio de salida, verificar si ya registru00f3 salida reciente
                else if ($tipo_fichaje == 'salida') {
                    $verificar_fichaje .= " AND horaFin > '$hora_referencia_str'";
                }
                
                $resultado_fichaje = $conn->query($verificar_fichaje);
                $ya_ficho = ($resultado_fichaje && $resultado_fichaje->num_rows > 0);
                
                // Solo enviar recordatorio si no se ha enviado uno reciente Y no ha fichado au00fan
                if ($resultado_verificacion->num_rows == 0 && !$ya_ficho) {
                    // No se ha enviado recientemente - Preparar mensaje
                    $hora_accion = $datos['referencia']->format('H:i');
                    $asunto = "Recordatorio: {$datos['accion']} a las $hora_accion";
                    
                    $mensaje = "<h3>Hola $nombre,</h3>";
                    $mensaje .= "<p>Te recordamos que {$datos['accion']} estaba programada para las <strong>$hora_accion</strong> (hace 5 minutos).</p>";
                    $mensaje .= "<p>Tienes 5 minutos mu00e1s de margen para registrar tu fichaje sin incidencias.</p>";
                    
                    // Generar un token u00fanico para la acciu00f3n de fichaje
                    $token = md5($nif . $fechaActual . $tipo . time());
                    
                    // Guardar el token en la base de datos para validarlo despuu00e9s
                    $guardar_token = "INSERT INTO tokens_fichaje (token, NIF, tipo_fichaje, fecha_creacion, usado) 
                                    VALUES ('$token', '$nif', '{$datos['tipo_fichaje']}', NOW(), 0)";
                    $conn->query($guardar_token);
                    
                    // URL base del sistema
                    $url_base = defined('URL_BASE') ? URL_BASE : 'http://localhost/ImpulsaTelecom';
                    
                    // URL para el fichaje ru00e1pido
                    $url_fichaje = "$url_base/backend/api/fichaje_rapido.php?token=$token";
                    
                    $mensaje .= "<p>No olvides registrar tu <strong>{$datos['tipo_fichaje']}</strong> en el sistema de fichajes.</p>";
                    
                    $mensaje .= "<div style='margin: 20px 0;'>
                        <a href='$url_fichaje' style='display: inline-block; background-color: #78bd00; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;'>
                            Registrar {$datos['tipo_fichaje']} ahora
                        </a>
                        <p style='font-size: 12px; margin-top: 10px;'>O copia y pega este enlace en tu navegador: $url_fichaje</p>
                    </div>";
                    
                    $mensaje .= "<p>Gracias por tu atenciu00f3n.</p>";
                    
                    // Enviar correo
                    if (enviarCorreo($correo, $asunto, $mensaje, "$nombre $apellidos")) {
                        // Registrar la hora exacta del envu00edo
                        $tipo_fichaje = $datos['tipo_fichaje'];
                        $fecha_hora_actual = date('Y-m-d H:i:s');
                        $registrar_envio = "INSERT INTO recordatorios_enviados 
                                          (NIF, tipo_recordatorio, tipo_fichaje, fecha, fecha_hora, hora_programada) 
                                          VALUES ('$nif', '$tipo', '$tipo_fichaje', '$fechaActual', 
                                                 '$fecha_hora_actual', '{$hora_accion}')";
                        $conn->query($registrar_envio);
                        
                        escribirLog("Recordatorio de {$datos['accion']} enviado a $nombre $apellidos ($correo)");
                    }
                } else if ($ya_ficho) {
                    escribirLog("No se envu00eda recordatorio de {$datos['accion']} a $nombre $apellidos porque ya ha registrado su {$datos['tipo_fichaje']} recientemente");
                } else {
                    escribirLog("Recordatorio de {$datos['accion']} ya fue enviado recientemente a $nombre $apellidos");
                }
            }
        }
    }
    
    escribirLog("Verificaciu00f3n de recordatorios finalizada");
    
} catch (Exception $e) {
    escribirLog("Error: " . $e->getMessage());
}

// Cerrar conexiu00f3n
$conn->close();
