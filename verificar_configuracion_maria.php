<?php
// Script para verificar la configuraciu00f3n actual de Maru00eda

// Incluir archivo de conexiu00f3n a BD
require_once __DIR__ . '/backend/modelos/bd.php';

// Conectar a la base de datos
$db = new db();
$conn = $db->getConn();

// Consultar configuraciu00f3n de Maru00eda
$query = "SELECT u.NIF, u.nombre, u.apellidos, u.email, u.id_horario, 
         h.id as horario_id, h.hora_inicio, h.hora_fin, h.tiempo_pausa_permitido 
         FROM usuarios u 
         JOIN horarios h ON u.id_horario = h.id 
         WHERE u.NIF = '56789012C'";

$resultado = $conn->query($query);

if (!$resultado || $resultado->num_rows == 0) {
    echo "No se encontraron datos para Maru00eda\n";
    exit;
}

$maria = $resultado->fetch_assoc();

echo "=== CONFIGURACIu00d3N ACTUAL DE MARu00cdA ===\n";
echo "NIF: {$maria['NIF']}\n";
echo "Nombre: {$maria['nombre']} {$maria['apellidos']}\n";
echo "Email: {$maria['email']}\n";
echo "ID de horario: {$maria['id_horario']}\n";
echo "Horario ID en tabla horarios: {$maria['horario_id']}\n";
echo "Hora de entrada: {$maria['hora_inicio']}\n";
echo "Hora de salida: {$maria['hora_fin']}\n";
echo "Tiempo de pausa permitido: {$maria['tiempo_pausa_permitido']} minutos\n";

// Verificar quu00e9 script se estu00e1 ejecutando realmente desde el frontend
echo "\n=== VERIFICANDO QUu00c9 SCRIPT SE EJECUTA DESDE EL FRONTEND ===\n";
$check_file = __DIR__ . '/backend/api/check_recordatorios.php';

if (file_exists($check_file)) {
    $contenido = file_get_contents($check_file);
    
    // Extraer quu00e9 script estu00e1 siendo incluido
    if (preg_match('/include_once\s+__DIR__\s*\.\s*[\'\"]\/\.\.\/(\S+)[\'\"]/i', $contenido, $matches)) {
        echo "El script de frontend estu00e1 llamando a: {$matches[1]}\n";
        
        // Verificar si este archivo existe
        $script_path = __DIR__ . '/backend/' . $matches[1];
        if (file_exists($script_path)) {
            echo "Este archivo existe: Su00cd\n";
            echo "Ruta completa: $script_path\n";
            
            // Verificar si tiene nuestras modificaciones
            $script_contenido = file_get_contents($script_path);
            if (strpos($script_contenido, 'JOIN horarios h ON u.id_horario = h.id') !== false) {
                echo "\nu00a1CONTIENE NUESTRAS MODIFICACIONES! El script estu00e1 actualizado correctamente.\n";
            } else {
                echo "\nu00a1ATENCIu00d3N! El script NO contiene nuestras modificaciones.\n";
                echo "Deberu00edas actualizar este script tambiu00e9n.\n";
            }
        } else {
            echo "Este archivo NO existe\n";
        }
    } else {
        echo "No se pudo determinar quu00e9 script se estu00e1 llamando\n";
    }
} else {
    echo "No se encontru00f3 el archivo check_recordatorios.php\n";
}

// Mostrar historial de recordatorios enviados hoy a Maru00eda
echo "\n=== RECORDATORIOS ENVIADOS HOY A MARu00cdA ===\n";
$query_recordatorios = "SELECT * FROM recordatorios_enviados 
                      WHERE NIF = '{$maria['NIF']}' 
                      AND fecha = '" . date('Y-m-d') . "' 
                      ORDER BY fecha_hora DESC";

$resultado_recordatorios = $conn->query($query_recordatorios);

if (!$resultado_recordatorios || $resultado_recordatorios->num_rows == 0) {
    echo "No se han enviado recordatorios a Maru00eda hoy\n";
} else {
    while ($recordatorio = $resultado_recordatorios->fetch_assoc()) {
        echo "ID: {$recordatorio['id']}\n";
        echo "Tipo: {$recordatorio['tipo_recordatorio']}\n";
        echo "Fichaje: {$recordatorio['tipo_fichaje']}\n";
        echo "Hora programada: {$recordatorio['hora_programada']}\n";
        echo "Enviado: {$recordatorio['fecha_hora']}\n\n";
    }
}

// Cerrar conexiu00f3n
$conn->close();
