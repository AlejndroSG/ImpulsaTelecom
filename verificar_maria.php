<?php
// Script para verificar datos de María y diagnóstico de recordatorios

// Incluir archivos necesarios
require_once __DIR__ . '/backend/modelos/bd.php';
require_once __DIR__ . '/backend/config/smtp_config.php';

// Función para registrar acciones en un archivo de log
function escribirLog($mensaje) {
    echo $mensaje . "\n";
}

// Conectar a la base de datos
$db = new db();
$conn = $db->getConn();

// 1. Verificar datos de María
echo "\n=== VERIFICANDO DATOS DE MARÍA ===\n";
$query = "SELECT u.NIF, u.nombre, u.apellidos, u.email as correo, 
         h.hora_entrada, h.hora_salida, h.inicio_pausa, h.fin_pausa 
         FROM usuarios u 
         LEFT JOIN horarios h ON u.NIF = h.NIF 
         WHERE u.nombre LIKE '%Maria%' OR u.nombre LIKE '%María%'";

$resultado = $conn->query($query);

if (!$resultado || $resultado->num_rows == 0) {
    echo "No se encontraron usuarios con el nombre María\n";
    exit;
}

// Obtener fecha y hora actual
$fechaActual = date('Y-m-d');
$horaActual = date('H:i:s');
echo "Fecha actual: $fechaActual, Hora actual: $horaActual\n";

// Procesar cada usuario (en caso de que haya más de una María)
while ($usuario = $resultado->fetch_assoc()) {
    $nif = $usuario['NIF'];
    $nombre = $usuario['nombre'];
    $apellidos = $usuario['apellidos'];
    $correo = $usuario['correo'];
    
    echo "\nDatos de usuario:\n";
    echo "NIF: $nif\n";
    echo "Nombre: $nombre $apellidos\n";
    echo "Correo: $correo\n";
    
    if (empty($usuario['hora_entrada']) || empty($usuario['hora_salida'])) {
        echo "PROBLEMA: No tiene horario configurado\n";
    } else {
        echo "Horario: {$usuario['hora_entrada']} - {$usuario['hora_salida']}";
        
        // Verificar si es turno partido
        $tiene_turno_partido = !empty($usuario['inicio_pausa']) && !empty($usuario['fin_pausa']);
        
        if ($tiene_turno_partido) {
            echo " (Pausa: {$usuario['inicio_pausa']} - {$usuario['fin_pausa']})";
        }
        
        echo "\n";
    }
    
    // 2. Verificar si ya hay recordatorios enviados hoy
    echo "\n=== VERIFICANDO RECORDATORIOS ENVIADOS HOY ===\n";
    $verificar_recordatorios = "SELECT * FROM recordatorios_enviados 
                             WHERE NIF = '$nif' 
                             AND fecha = '$fechaActual'
                             ORDER BY fecha_hora DESC";
                             
    $resultado_recordatorios = $conn->query($verificar_recordatorios);
    
    if (!$resultado_recordatorios || $resultado_recordatorios->num_rows == 0) {
        echo "No se han enviado recordatorios a $nombre $apellidos hoy\n";
    } else {
        echo "Recordatorios enviados hoy a $nombre $apellidos:\n";
        while ($recordatorio = $resultado_recordatorios->fetch_assoc()) {
            echo "- Tipo: {$recordatorio['tipo_recordatorio']}, ";
            echo "Fichaje: {$recordatorio['tipo_fichaje']}, ";
            echo "Hora programada: {$recordatorio['hora_programada']}, ";
            echo "Enviado: {$recordatorio['fecha_hora']}\n";
        }
    }
    
    // 3. Verificar si ya ha fichado hoy
    echo "\n=== VERIFICANDO FICHAJES HOY ===\n";
    $verificar_fichajes = "SELECT * FROM registros 
                         WHERE NIF = '$nif' 
                         AND fecha = '$fechaActual'";
                         
    $resultado_fichajes = $conn->query($verificar_fichajes);
    
    if (!$resultado_fichajes || $resultado_fichajes->num_rows == 0) {
        echo "No hay fichajes registrados para $nombre $apellidos hoy\n";
    } else {
        echo "Fichajes de $nombre $apellidos hoy:\n";
        while ($fichaje = $resultado_fichajes->fetch_assoc()) {
            echo "- ID: {$fichaje['idRegistro']}, ";
            echo "Entrada: {$fichaje['horaInicio']}, ";
            echo "Salida: " . ($fichaje['horaFin'] ? $fichaje['horaFin'] : 'No registrada') . "\n";
        }
    }
    
    // 4. Verificar si debería enviar recordatorio ahora
    echo "\n=== VERIFICANDO SI DEBERÍA ENVIAR RECORDATORIO AHORA ===\n";
    // Convertir tiempos a objetos DateTime para comparar
    $dt_inicio = new DateTime("$fechaActual {$usuario['hora_entrada']}");
    
    // Sumar 5 minutos para el recordatorio (para que llegue dentro del periodo de gracia de 10 min)
    $dt_recordatorio_entrada = clone $dt_inicio;
    $dt_recordatorio_entrada->modify("+5 minutes");
    
    // Hora actual como DateTime
    $dt_actual = new DateTime("$fechaActual $horaActual");
    
    // Calcular diferencia en minutos entre la hora actual y el recordatorio
    $diff_entrada = abs(($dt_actual->getTimestamp() - $dt_recordatorio_entrada->getTimestamp()) / 60);
    
    echo "Hora de entrada programada: " . $dt_inicio->format('H:i') . "\n";
    echo "Hora de recordatorio calculada: " . $dt_recordatorio_entrada->format('H:i') . "\n";
    echo "Diferencia con hora actual: " . round($diff_entrada, 2) . " minutos\n";
    
    $es_momento_recordatorio = $diff_entrada <= 2;
    if ($es_momento_recordatorio) {
        echo "DIAGNÓSTICO: Es momento de enviar recordatorio (diferencia <= 2 minutos)\n";
    } else {
        echo "DIAGNÓSTICO: No es momento de enviar recordatorio (diferencia > 2 minutos)\n";
    }
    
    // 5. Verificar configuración SMTP
    echo "\n=== VERIFICANDO CONFIGURACIÓN SMTP ===\n";
    if (defined('SMTP_HOST') && defined('SMTP_PORT') && defined('SMTP_USUARIO') && defined('SMTP_PASSWORD')) {
        echo "Configuración SMTP: OK\n";
        echo "Host: " . SMTP_HOST . "\n";
        echo "Puerto: " . SMTP_PORT . "\n";
        echo "Usuario: " . SMTP_USUARIO . "\n";
        echo "Nombre remitente: " . (defined('SMTP_NOMBRE') ? SMTP_NOMBRE : 'No definido') . "\n";
    } else {
        echo "PROBLEMA: Configuración SMTP incompleta\n";
    }
    
    // 6. Verificar configuración de recordatorios
    echo "\n=== VERIFICANDO CONFIGURACIÓN DE RECORDATORIOS ===\n";
    echo "ACTIVAR_RECORDATORIO_ENTRADA: " . (defined('ACTIVAR_RECORDATORIO_ENTRADA') ? (ACTIVAR_RECORDATORIO_ENTRADA ? 'TRUE' : 'FALSE') : 'No definido (por defecto TRUE)') . "\n";
    echo "ACTIVAR_RECORDATORIO_SALIDA: " . (defined('ACTIVAR_RECORDATORIO_SALIDA') ? (ACTIVAR_RECORDATORIO_SALIDA ? 'TRUE' : 'FALSE') : 'No definido (por defecto TRUE)') . "\n";
    echo "ACTIVAR_RECORDATORIO_INICIO_PAUSA: " . (defined('ACTIVAR_RECORDATORIO_INICIO_PAUSA') ? (ACTIVAR_RECORDATORIO_INICIO_PAUSA ? 'TRUE' : 'FALSE') : 'No definido (por defecto TRUE)') . "\n";
    echo "ACTIVAR_RECORDATORIO_FIN_PAUSA: " . (defined('ACTIVAR_RECORDATORIO_FIN_PAUSA') ? (ACTIVAR_RECORDATORIO_FIN_PAUSA ? 'TRUE' : 'FALSE') : 'No definido (por defecto TRUE)') . "\n";
}

// Cerrar conexión
$conn->close();
