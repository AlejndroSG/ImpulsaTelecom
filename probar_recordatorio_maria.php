<?php
// Script de prueba para verificar si el recordatorio se enviaría correctamente a María

// Definir la ruta base
$baseDir = __DIR__ . '/backend/';

// Incluir archivos necesarios
require_once $baseDir . 'modelos/bd.php';
require_once $baseDir . 'config/smtp_config.php';

// Conectar a la base de datos
$db = new db();
$conn = $db->getConn();

// Obtener los datos de María y su horario
echo "=== VERIFICANDO DATOS DE MARÍA CON NUEVO SCRIPT ===\n";
$query = "SELECT u.NIF, u.nombre, u.apellidos, u.email as correo, 
         h.hora_inicio as hora_entrada, h.hora_fin as hora_salida,
         h.tiempo_pausa_permitido
         FROM usuarios u 
         JOIN horarios h ON u.id_horario = h.id 
         WHERE u.NIF = '56789012C'";

$resultado = $conn->query($query);

if (!$resultado || $resultado->num_rows == 0) {
    echo "ERROR: No se pudo encontrar a María con la nueva consulta.\n";
    echo "Error: " . $conn->error . "\n";
    exit;
}

$maria = $resultado->fetch_assoc();
echo "Datos de María encontrados correctamente con la nueva consulta:\n";
echo "NIF: {$maria['NIF']}\n";
echo "Nombre: {$maria['nombre']} {$maria['apellidos']}\n";
echo "Email: {$maria['correo']}\n";
echo "Horario: {$maria['hora_entrada']} - {$maria['hora_salida']}\n";

echo "\n=== CALCULANDO SI DEBERÍA RECIBIR RECORDATORIO ===\n";

// Obtener fecha y hora actual
$fechaActual = date('Y-m-d');
$horaActual = date('H:i:s');

// Convertir tiempos a objetos DateTime para comparar
$dt_inicio = new DateTime("$fechaActual {$maria['hora_entrada']}");
$dt_recordatorio_entrada = clone $dt_inicio;
$dt_recordatorio_entrada->modify("+5 minutes");

// Hora actual como DateTime
$dt_actual = new DateTime("$fechaActual $horaActual");

// Calcular diferencia en minutos entre la hora actual y el recordatorio
$diff_entrada = abs(($dt_actual->getTimestamp() - $dt_recordatorio_entrada->getTimestamp()) / 60);

echo "Hora actual: $horaActual\n";
echo "Hora de entrada programada: " . $dt_inicio->format('H:i:s') . "\n";
echo "Hora para recordatorio: " . $dt_recordatorio_entrada->format('H:i:s') . "\n";
echo "Diferencia con hora actual: " . round($diff_entrada, 2) . " minutos\n";

// Verificar si es momento de enviar recordatorio (dentro de 2 minutos)
$es_momento_recordatorio = $diff_entrada <= 2;
if ($es_momento_recordatorio) {
    echo "RESULTADO: Es momento de enviar recordatorio (diferencia <= 2 minutos)\n";
} else {
    echo "RESULTADO: No es momento de enviar recordatorio (diferencia > 2 minutos)\n";
    echo "  El recordatorio se enviará cuando sean las " . $dt_recordatorio_entrada->format('H:i:s') . "\n";
}

// Verificar si ya se ha enviado un recordatorio recientemente
echo "\n=== VERIFICANDO RECORDATORIOS ENVIADOS RECIENTEMENTE ===\n";
$hora_limite = date('Y-m-d H:i:s', strtotime('-60 minutes')); // 1 hora atrás

$verificar_enviado = "SELECT id FROM recordatorios_enviados 
                  WHERE NIF = '{$maria['NIF']}' 
                  AND tipo_recordatorio = 'entrada' 
                  AND fecha_hora > '$hora_limite'";
                  
$resultado_verificacion = $conn->query($verificar_enviado);

if ($resultado_verificacion && $resultado_verificacion->num_rows > 0) {
    echo "RESULTADO: Ya se ha enviado un recordatorio de entrada a María en la última hora\n";
} else {
    echo "RESULTADO: No se ha enviado recordatorio de entrada a María en la última hora\n";
}

// Verificar si María ya ha fichado hoy
echo "\n=== VERIFICANDO SI YA HA FICHADO HOY ===\n";

$hora_referencia = clone $dt_inicio;
$hora_referencia->modify("-15 minutes");
$hora_referencia_str = $hora_referencia->format('H:i:s');

$verificar_fichaje = "SELECT idRegistro FROM registros 
                 WHERE NIF = '{$maria['NIF']}' 
                 AND fecha = '$fechaActual' 
                 AND horaInicio > '$hora_referencia_str'";

$resultado_fichaje = $conn->query($verificar_fichaje);
$ya_ficho = ($resultado_fichaje && $resultado_fichaje->num_rows > 0);

if ($ya_ficho) {
    echo "RESULTADO: María ya ha fichado su entrada hoy después de las $hora_referencia_str\n";
} else {
    echo "RESULTADO: María NO ha fichado su entrada hoy después de las $hora_referencia_str\n";
}

// Recomendación final
echo "\n=== CONCLUSIÓN ===\n";
if (!$es_momento_recordatorio) {
    echo "El recordatorio se enviará cuando sean las " . $dt_recordatorio_entrada->format('H:i:s') . "\n";
    echo "Recomendación: Ejecutar el script actualizado a esa hora para enviar el recordatorio\n";
} else if ($ya_ficho) {
    echo "María ya ha fichado, por lo que no recibirá recordatorio\n";
} else if ($resultado_verificacion && $resultado_verificacion->num_rows > 0) {
    echo "Ya se envió un recordatorio recientemente, no se enviará otro\n";
} else {
    echo "María debería recibir un recordatorio ahora si se ejecuta el script actualizado\n";
    echo "Recomendación: Ejecutar el script actualizado para enviar el recordatorio\n";
}

// Cerrar conexión
$conn->close();
