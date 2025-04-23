<?php
// Script para probar el envío de correos
header('Content-Type: text/plain; charset=UTF-8');

// Función para escribir en el log
function escribir_log($mensaje) {
    echo $mensaje . "\n";
    
    // También guardar en archivo de log
    $directorio_logs = __DIR__ . '/../logs';
    if (!file_exists($directorio_logs)) {
        mkdir($directorio_logs, 0777, true);
    }
    
    $archivo_log = $directorio_logs . '/test_email_' . date('Y-m-d') . '.log';
    file_put_contents($archivo_log, date('Y-m-d H:i:s') . " - " . $mensaje . "\n", FILE_APPEND);
}

// Mensaje inicial
escribir_log("=== INICIANDO PRUEBA DE ENVÍO DE CORREO ===\n");

// Incluir la conexión a la base de datos para obtener un usuario aleatorio
require_once __DIR__ . "/../modelos/bd.php";

// Verificar que exista la clase bd
if (!class_exists('db')) {
    escribir_log("ERROR: No se encontró la clase de base de datos.\nVerifique que el archivo bd.php existe y contiene la clase 'db'.");
    exit(1);
}

try {
    $db = new db();
    $conn = $db->getConn();
    
    escribir_log("Conexión a la base de datos establecida.");
    
    // Obtener un usuario aleatorio que tenga correo electrónico
    $query = "SELECT NIF, nombre, apellidos, email as correo FROM usuarios WHERE email IS NOT NULL AND email != '' ORDER BY RAND() LIMIT 1";
    $resultado = $conn->query($query);
    
    if ($resultado && $resultado->num_rows > 0) {
        $usuario = $resultado->fetch_assoc();
        escribir_log("Usuario seleccionado para la prueba: {$usuario['nombre']} {$usuario['apellidos']} ({$usuario['correo']})");
        
        // Configuración del correo
        $para = $usuario['correo'];
        $asunto = "Prueba de sistema de recordatorios - " . date('H:i:s');
        
        // Crear mensaje HTML
        $mensaje_html = "
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset='UTF-8'>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px; }
                .header { background-color: #78bd00; color: white; padding: 10px; text-align: center; border-radius: 5px 5px 0 0; }
                .content { padding: 20px; }
                .footer { font-size: 12px; text-align: center; margin-top: 20px; color: #777; }
            </style>
        </head>
        <body>
            <div class='container'>
                <div class='header'>
                    <h2>Prueba del Sistema de Recordatorios</h2>
                </div>
                <div class='content'>
                    <p>Hola <strong>{$usuario['nombre']} {$usuario['apellidos']}</strong>,</p>
                    <p>Este es un correo de prueba del sistema de recordatorios de ImpulsaTelecom.</p>
                    <p>Si has recibido este correo, significa que el sistema de envío de correos está funcionando correctamente.</p>
                    <p>Fecha y hora del envío: <strong>" . date('d/m/Y H:i:s') . "</strong></p>
                    <p>No es necesario que respondas a este correo.</p>
                </div>
                <div class='footer'>
                    <p>Este es un mensaje automático, por favor no responda.</p>
                    <p>&copy; " . date('Y') . " ImpulsaTelecom. Todos los derechos reservados.</p>
                </div>
            </div>
        </body>
        </html>";
        
        // Cabeceras para correo HTML y UTF-8
        $cabeceras = "MIME-Version: 1.0" . "\r\n";
        $cabeceras .= "Content-type: text/html; charset=UTF-8" . "\r\n";
        $cabeceras .= "From: ImpulsaTelecom <noreply@impulsatelecom.com>" . "\r\n";
        $cabeceras .= "Reply-To: noreply@impulsatelecom.com" . "\r\n";
        $cabeceras .= "X-Mailer: PHP/" . phpversion();
        
        // Intentar enviar el correo
        escribir_log("Intentando enviar correo a {$usuario['correo']}...");
        
        if (mail($para, $asunto, $mensaje_html, $cabeceras)) {
            escribir_log("✅ ÉXITO: Correo enviado correctamente a {$usuario['correo']}");
            
            // Registrar el envío en la base de datos (opcional)
            $query_insert = "INSERT INTO recordatorios_enviados (NIF, tipo_recordatorio, fecha) VALUES (?, 'prueba', CURDATE())";
            $stmt = $conn->prepare($query_insert);
            
            if ($stmt) {
                $stmt->bind_param("s", $usuario['NIF']);
                $stmt->execute();
                escribir_log("Registro guardado en la base de datos.");
            } else {
                escribir_log("ADVERTENCIA: No se pudo registrar el envío en la base de datos. Puede que la tabla no exista aún.");
            }
        } else {
            escribir_log("❌ ERROR: No se pudo enviar el correo. Verifique la configuración de PHP mail().");
            
            // Información de depuración
            escribir_log("\nInformación de depuración:");
            escribir_log("- Función mail() disponible: " . (function_exists('mail') ? 'Sí' : 'No'));
            escribir_log("- Configuración php.ini para SMTP: " . ini_get('SMTP'));
            escribir_log("- Puerto SMTP: " . ini_get('smtp_port'));
            escribir_log("- sendmail_from: " . ini_get('sendmail_from'));
            escribir_log("- sendmail_path: " . ini_get('sendmail_path'));
        }
    } else {
        escribir_log("❌ ERROR: No se encontró ningún usuario con correo electrónico en la base de datos.");
    }
    
    $conn->close();
} catch (Exception $e) {
    escribir_log("❌ ERROR: " . $e->getMessage());
}

escribir_log("\n=== FIN DE LA PRUEBA DE ENVÍO DE CORREO ===\n");

// Instrucciones para el usuario
escribir_log("\nPara verificar si la prueba fue exitosa:");
escribir_log("1. Revise la bandeja de entrada del correo: " . (isset($usuario['correo']) ? $usuario['correo'] : 'No disponible'));
escribir_log("2. Revise también la carpeta de spam/correo no deseado");
escribir_log("3. Revise los logs en: " . (isset($directorio_logs) ? $directorio_logs : __DIR__ . '/../logs'));
escribir_log("\nSi el correo no llega, verifique la configuración de PHP mail() en php.ini");
