<?php
// Script para verificar si Maru00eda deberu00eda recibir recordatorio en este momento

// Incluir archivos necesarios
require_once __DIR__ . '/backend/modelos/bd.php';

// Conectar a la base de datos
$db = new db();
$conn = $db->getConn();

// Obtener la hora actual
date_default_timezone_set('Europe/Madrid');
$hora_actual = date('H:i:s');

// Verificar configuración de María
$query = "SELECT u.NIF, u.nombre, u.apellidos, u.email, h.hora_inicio, h.hora_fin 
         FROM usuarios u 
         JOIN horarios h ON u.id_horario = h.id 
         WHERE u.NIF = '56789012C' AND h.activo = 1";

$resultado = $conn->query($query);

if (!$resultado || $resultado->num_rows == 0) {
    echo "No se encontraron datos para María\n";
    exit;
}

$maria = $resultado->fetch_assoc();

echo "=== VERIFICACIÓN DE RECORDATORIO PARA MARÍA A LAS $hora_actual ===\n";
echo "Datos de María:\n";
echo "NIF: {$maria['NIF']}\n";
echo "Nombre: {$maria['nombre']} {$maria['apellidos']}\n";
echo "Email: {$maria['email']}\n";
echo "Hora de entrada configurada: {$maria['hora_inicio']}\n";

// Calcular hora de recordatorio (5 minutos después de la hora de entrada)
$fecha_actual = date('Y-m-d');
$dt_entrada = new DateTime("$fecha_actual {$maria['hora_inicio']}");
$dt_recordatorio = clone $dt_entrada;
$dt_recordatorio->modify("+5 minutes");
$hora_recordatorio = $dt_recordatorio->format('H:i:s');

// Hora actual como DateTime
$dt_actual = new DateTime("$fecha_actual $hora_actual");

// Calcular diferencia en minutos
$diff_minutos = abs(($dt_actual->getTimestamp() - $dt_recordatorio->getTimestamp()) / 60);

echo "Hora actual: $hora_actual\n";
echo "Hora de recordatorio calculada: $hora_recordatorio\n";
echo "Diferencia en minutos: " . round($diff_minutos, 2) . "\n";

// Verificar si estamos dentro del rango para enviar recordatorio (2 minutos)
$es_momento_recordatorio = $diff_minutos <= 2;
if ($es_momento_recordatorio) {
    echo "\n¡SÍ DEBERÍA RECIBIR RECORDATORIO AHORA! (diferencia <= 2 minutos)\n";
} else {
    echo "\nNO debería recibir recordatorio ahora (diferencia > 2 minutos)\n";
    
    // Si no es momento, calcular cuándo debería recibirlo
    if ($dt_actual < $dt_recordatorio) {
        $minutos_faltantes = ceil(($dt_recordatorio->getTimestamp() - $dt_actual->getTimestamp()) / 60);
        echo "Recibirá recordatorio en aproximadamente $minutos_faltantes minutos\n";
    } else {
        echo "El recordatorio debió enviarse hace " . ceil($diff_minutos) . " minutos\n";
    }
}

// Verificar si ya se ha enviado recordatorio recientemente
echo "\n=== VERIFICANDO RECORDATORIOS RECIENTES ===\n";
$hora_limite = date('Y-m-d H:i:s', strtotime('-60 minutes'));

$verificar_enviado = "SELECT id, fecha_hora, hora_programada FROM recordatorios_enviados 
                  WHERE NIF = '{$maria['NIF']}' 
                  AND tipo_recordatorio = 'entrada' 
                  AND fecha = '$fecha_actual' 
                  ORDER BY fecha_hora DESC LIMIT 1";
                  
$resultado_verificacion = $conn->query($verificar_enviado);

if ($resultado_verificacion && $resultado_verificacion->num_rows > 0) {
    $recordatorio = $resultado_verificacion->fetch_assoc();
    echo "Ya se ha enviado un recordatorio hoy:\n";
    echo "Hora programada: {$recordatorio['hora_programada']}\n";
    echo "Enviado: {$recordatorio['fecha_hora']}\n";
    
    // Verificar si fue hace menos de 1 hora
    $dt_envio = new DateTime($recordatorio['fecha_hora']);
    $dt_limite = new DateTime($hora_limite);
    
    if ($dt_envio > $dt_limite) {
        echo "\nEl recordatorio fue enviado hace menos de 1 hora, por lo que NO se enviará otro recordatorio\n";
    } else {
        echo "\nEl recordatorio fue enviado hace más de 1 hora, por lo que SÍ se podría enviar otro recordatorio si es el momento adecuado\n";
    }
} else {
    echo "No se han enviado recordatorios de entrada a María hoy\n";
}

echo "\n=== CONCLUSIÓN ===\n";
echo "La próxima vez que se ejecute check_recordatorios.php (verificación desde el frontend), los resultados deberían ser consistentes con esta simulación.\n";
echo "La próxima ejecución será en aproximadamente 1 minuto, a las " . date('H:i:s', strtotime('+1 minute')) . "\n";
