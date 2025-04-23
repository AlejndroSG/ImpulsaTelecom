<?php
// Script para probar el envío de correos con PHPMailer
header('Content-Type: text/plain; charset=UTF-8');

// Directorio para logs
$logDir = __DIR__ . '/../logs';
if (!file_exists($logDir)) {
    mkdir($logDir, 0777, true);
}

// Archivo de log
$logFile = $logDir . '/test_email_' . date('Y-m-d') . '.log';

// Función para escribir en el log
function escribirLog($mensaje) {
    global $logFile;
    $tiempo = date('Y-m-d H:i:s');
    $mensajeLog = "[$tiempo] $mensaje\n";
    file_put_contents($logFile, $mensajeLog, FILE_APPEND);
    echo $mensajeLog; // Mostrar tambiu00e9n en consola
}

escribirLog("=== INICIANDO PRUEBA DE ENVÍO DE CORREO CON PHPMAILER ===\n");

// Verificar si PHPMailer ya está instalado
if (!file_exists(__DIR__ . '/../vendor/autoload.php')) {
    escribirLog("PHPMailer no está instalado. Para usar este script, necesitas instalar PHPMailer.");
    escribirLog("\nPara instalar PHPMailer, ejecuta estos comandos en tu consola:\n");
    escribirLog("cd " . __DIR__ . "/..");
    escribirLog("composer require phpmailer/phpmailer");
    escribirLog("\nSi no tienes Composer instalado, descu00e1rgalo de: https://getcomposer.org/download/");
    exit(1);
}

// Incluir PHPMailer
require_once __DIR__ . '/../vendor/autoload.php';
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;
use PHPMailer\PHPMailer\SMTP;

// Incluir conexiu00f3n a la base de datos
require_once __DIR__ . "/../modelos/bd.php";

try {
    // Conectar a la base de datos
    $db = new db();
    $conn = $db->getConn();
    escribirLog("Conexiu00f3n a la base de datos establecida.");
    
    // Enviar correo directamente a Maru00eda (elreibo30@gmail.com)
    escribirLog("Enviando correo directamente a Maru00eda (elreibo30@gmail.com)");
    $destinatario = 'elreibo30@gmail.com';
    $nombreDestinatario = 'Maru00eda Garcu00eda';
    
    // Opcional: buscar a Maru00eda en la base de datos
    $query = "SELECT NIF FROM usuarios WHERE email = 'elreibo30@gmail.com' OR nombre LIKE '%Mar%' LIMIT 1";
    $resultado = $conn->query($query);
    
    if ($resultado && $resultado->num_rows > 0) {
        $usuario = $resultado->fetch_assoc();
        escribirLog("Usuario encontrado en la base de datos con NIF: {$usuario['NIF']}");
    } else {
        escribirLog("No se encontru00f3 a Maru00eda en la base de datos, pero igual se enviaru00e1 el correo.");
        // Definir un NIF fijo para el registro en caso de que no se encuentre
        $usuario = ['NIF' => '12345678Z']; 
    }
    
    // Crear instancia de PHPMailer
    $mail = new PHPMailer(true); // true activa excepciones
    
    // IMPORTANTE: CONFIGURAR TUS DATOS REALES AQUÍ
    // ==========================================
    $smtp_host = 'smtp.gmail.com';    // Ejemplo: smtp.gmail.com, smtp.office365.com
    $smtp_port = 587;                     // Normalmente 587 (TLS) o 465 (SSL)
    $smtp_usuario = 'elreibo30@gmail.com'; // Tu dirección de correo completa
    $smtp_password = 'crel reic yxdc cgxb';     // Tu contraseña o contraseña de aplicación
    $smtp_nombre = 'ImpulsaTelecom';      // Nombre que aparecerá como remitente
    // ==========================================
    
    // Configuración del servidor
    $mail->SMTPDebug = SMTP::DEBUG_SERVER;              // Habilitar salida de depuración detallada
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
    $mail->Subject = "Prueba del sistema de recordatorios - " . date('H:i:s');
    
    // Contenido HTML del correo
    $mail->Body = "
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
                <p>Hola <strong>{$nombreDestinatario}</strong>,</p>
                <p>Este es un correo de prueba del sistema de recordatorios de ImpulsaTelecom.</p>
                <p>Si has recibido este correo, significa que el sistema de envu00edo de correos estu00e1 funcionando correctamente.</p>
                <p>Fecha y hora del envu00edo: <strong>" . date('d/m/Y H:i:s') . "</strong></p>
                <p>No es necesario que respondas a este correo.</p>
            </div>
            <div class='footer'>
                <p>Este es un mensaje automu00e1tico, por favor no responda.</p>
                <p>&copy; " . date('Y') . " ImpulsaTelecom. Todos los derechos reservados.</p>
            </div>
        </div>
    </body>
    </html>";
    
    // Versiu00f3n en texto plano del correo
    $mail->AltBody = "Hola {$nombreDestinatario},\n\n"
                   . "Este es un correo de prueba del sistema de recordatorios de ImpulsaTelecom.\n"
                   . "Si has recibido este correo, significa que el sistema de envu00edo de correos estu00e1 funcionando correctamente.\n\n"
                   . "Fecha y hora del envu00edo: " . date('d/m/Y H:i:s') . "\n\n"
                   . "Este es un mensaje automu00e1tico, por favor no responda.";
    
    // Intentar enviar el correo
    $mail->send();
    escribirLog("u2705 u00c9XITO: Correo enviado correctamente a {$destinatario}");
    
    // Si hay un ID de usuario, registrar el envu00edo
    if (isset($usuario['NIF'])) {
        // Verificar si existe la tabla recordatorios_enviados
        $verificarTabla = "SHOW TABLES LIKE 'recordatorios_enviados'";
        $tablaExiste = $conn->query($verificarTabla)->num_rows > 0;
        
        if (!$tablaExiste) {
            // Crear la tabla si no existe
            $crearTabla = "CREATE TABLE recordatorios_enviados (
                id INT AUTO_INCREMENT PRIMARY KEY,
                NIF VARCHAR(20) NOT NULL,
                tipo_recordatorio ENUM('entrada', 'salida', 'inicio_pausa', 'fin_pausa', 'prueba') NOT NULL,
                fecha DATE NOT NULL,
                enviado TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX (NIF, tipo_recordatorio, fecha)
            )";
            
            if (!$conn->query($crearTabla)) {
                escribirLog("ADVERTENCIA: No se pudo crear la tabla recordatorios_enviados: " . $conn->error);
            } else {
                escribirLog("Se creu00f3 la tabla recordatorios_enviados.");
            }
        }
        
        // Registrar el envu00edo en la base de datos
        $query_insert = "INSERT INTO recordatorios_enviados (NIF, tipo_recordatorio, fecha) VALUES (?, 'prueba', CURDATE())";
        $stmt = $conn->prepare($query_insert);
        
        if ($stmt) {
            $stmt->bind_param("s", $usuario['NIF']);
            $stmt->execute();
            escribirLog("El envu00edo ha sido registrado en la base de datos.");
        } else {
            escribirLog("ADVERTENCIA: No se pudo registrar el envu00edo en la base de datos: " . $conn->error);
        }
    }
} catch (Exception $e) {
    escribirLog("u274c ERROR: " . $mail->ErrorInfo);
    escribirLog("Mensaje de error detallado: " . $e->getMessage());
    
    // Instrucciones para solucionar problemas comunes
    escribirLog("\nProblemas comunes y sus soluciones:");
    escribirLog("- Si usas Gmail, asegu00farate de habilitar el acceso a aplicaciones menos seguras o usar contraseu00f1as de aplicaciu00f3n.");
    escribirLog("- Verifica que tu servidor no estu00e9 bloqueando las conexiones SMTP salientes.");
    escribirLog("- Comprueba que los datos de configuraciu00f3n (host, puerto, usuario, contraseu00f1a) sean correctos.");
    escribirLog("- Si usas Office 365, es posible que necesites configuraciones adicionales de seguridad.");
} finally {
    // Cerrar conexiu00f3n a la base de datos si estu00e1 abierta
    if (isset($conn)) {
        $conn->close();
    }
}

escribirLog("\n=== FIN DE LA PRUEBA DE ENVu00cdO DE CORREO CON PHPMAILER ===\n");

// Instrucciones para el usuario
escribirLog("\nPARA USAR ESTE SCRIPT:\n");
escribirLog("1. Instala PHPMailer ejecutando: composer require phpmailer/phpmailer");
escribirLog("2. Edita este archivo y modifica la secciu00f3n 'CONFIGURAR TUS DATOS REALES AQUu00cd'");
escribirLog("3. Ejecuta el script nuevamente");
escribirLog("\nSi necesitas mu00e1s ayuda, consulta la documentaciu00f3n oficial de PHPMailer:");
escribirLog("https://github.com/PHPMailer/PHPMailer");
