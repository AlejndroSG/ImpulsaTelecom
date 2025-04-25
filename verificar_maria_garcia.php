<?php
// Script para verificar datos de Maru00eda Garcu00eda Martu00ednez y diagnu00f3stico de recordatorios

// Incluir archivos necesarios
require_once __DIR__ . '/backend/modelos/bd.php';
require_once __DIR__ . '/backend/config/smtp_config.php';

// Funciu00f3n para registrar acciones en un archivo de log
function escribirLog($mensaje) {
    echo $mensaje . "\n";
}

// Conectar a la base de datos
$db = new db();
$conn = $db->getConn();

// 1. Verificar estructura de la tabla de horarios
echo "\n=== VERIFICANDO ESTRUCTURA DE TABLA HORARIOS ===\n";
$query_estructura = "DESCRIBE horarios";
$result_estructura = $conn->query($query_estructura);

if (!$result_estructura) {
    echo "ERROR: No se puede obtener la estructura de la tabla horarios. Puede que no exista.\n";
    echo "Error: " . $conn->error . "\n";
} else {
    echo "Campos en la tabla horarios:\n";
    while ($row = $result_estructura->fetch_assoc()) {
        echo "- {$row['Field']} ({$row['Type']})\n";
    }
}

// 2. Verificar datos de Maru00eda Garcu00eda
echo "\n=== VERIFICANDO DATOS DE MARu00cdA GARCu00cdA ===\n";
$query = "SELECT * FROM usuarios WHERE NIF = '56789012C'";

$resultado = $conn->query($query);
if (!$resultado || $resultado->num_rows == 0) {
    echo "No se encontru00f3 a Maru00eda Garcu00eda en la tabla usuarios\n";
} else {
    $maria = $resultado->fetch_assoc();
    echo "Datos de usuario encontrados:\n";
    foreach ($maria as $campo => $valor) {
        echo "$campo: $valor\n";
    }
    
    // 3. Buscar su horario
    echo "\n=== VERIFICANDO HORARIO DE MARu00cdA GARCu00cdA ===\n";
    // Primero verificamos si existe la tabla
    $verificar_tabla = "SHOW TABLES LIKE 'horarios'";
    $resultado_tabla = $conn->query($verificar_tabla);
    
    if (!$resultado_tabla || $resultado_tabla->num_rows == 0) {
        echo "ERROR: La tabla 'horarios' no existe en la base de datos\n";
    } else {
        $query_horario = "SELECT * FROM horarios WHERE NIF = '{$maria['NIF']}'";
        $resultado_horario = $conn->query($query_horario);
        
        if (!$resultado_horario || $resultado_horario->num_rows == 0) {
            echo "ERROR: Maru00eda no tiene horario configurado en la tabla 'horarios'\n";
        } else {
            $horario = $resultado_horario->fetch_assoc();
            echo "Horario encontrado:\n";
            foreach ($horario as $campo => $valor) {
                echo "$campo: $valor\n";
            }
        }
    }
    
    // 4. Verificar horarios en otra tabla si existe
    echo "\n=== BUSCANDO HORARIOS EN OTRAS TABLAS ===\n";
    $verificar_tabla_alt = "SHOW TABLES LIKE '%horario%'";
    $resultado_tabla_alt = $conn->query($verificar_tabla_alt);
    
    if (!$resultado_tabla_alt || $resultado_tabla_alt->num_rows == 0) {
        echo "No se encontraron tablas alternativas para horarios\n";
    } else {
        echo "Tablas alternativas encontradas:\n";
        while ($tabla = $resultado_tabla_alt->fetch_array()) {
            echo "- {$tabla[0]}\n";
            
            // Verificar si Maru00eda tiene registro en esta tabla
            $query_alt = "SELECT * FROM {$tabla[0]} WHERE NIF = '{$maria['NIF']}'";
            $resultado_alt = $conn->query($query_alt);
            
            if (!$resultado_alt) {
                echo "  Error al consultar la tabla {$tabla[0]}: {$conn->error}\n";
            } else if ($resultado_alt->num_rows == 0) {
                echo "  Maru00eda no tiene registro en esta tabla\n";
            } else {
                echo "  Registro encontrado para Maru00eda en {$tabla[0]}:\n";
                $registro = $resultado_alt->fetch_assoc();
                foreach ($registro as $campo => $valor) {
                    echo "  $campo: $valor\n";
                }
            }
        }
    }
    
    // 5. Verificar si ya ha fichado hoy
    echo "\n=== VERIFICANDO FICHAJES HOY ===\n";
    $fechaActual = date('Y-m-d');
    $verificar_fichajes = "SELECT * FROM registros 
                         WHERE NIF = '{$maria['NIF']}' 
                         AND fecha = '$fechaActual'";
                         
    $resultado_fichajes = $conn->query($verificar_fichajes);
    
    if (!$resultado_fichajes) {
        echo "Error al consultar fichajes: {$conn->error}\n";
    } else if ($resultado_fichajes->num_rows == 0) {
        echo "No hay fichajes registrados para Maru00eda hoy\n";
    } else {
        echo "Fichajes de Maru00eda hoy:\n";
        while ($fichaje = $resultado_fichajes->fetch_assoc()) {
            echo "- ID: {$fichaje['idRegistro']}, ";
            echo "Entrada: {$fichaje['horaInicio']}, ";
            echo "Salida: " . ($fichaje['horaFin'] ? $fichaje['horaFin'] : 'No registrada') . "\n";
        }
    }
    
    // 6. Verificar recordatorios enviados
    echo "\n=== VERIFICANDO RECORDATORIOS ENVIADOS HOY ===\n";
    $verificar_recordatorios = "SELECT * FROM recordatorios_enviados 
                             WHERE NIF = '{$maria['NIF']}' 
                             AND fecha = '$fechaActual'
                             ORDER BY fecha_hora DESC";
                             
    $resultado_recordatorios = $conn->query($verificar_recordatorios);
    
    if (!$resultado_recordatorios) {
        echo "Error al consultar recordatorios: {$conn->error}\n";
    } else if ($resultado_recordatorios->num_rows == 0) {
        echo "No se han enviado recordatorios a Maru00eda hoy\n";
    } else {
        echo "Recordatorios enviados hoy a Maru00eda:\n";
        while ($recordatorio = $resultado_recordatorios->fetch_assoc()) {
            echo "- Tipo: {$recordatorio['tipo_recordatorio']}, ";
            echo "Fichaje: {$recordatorio['tipo_fichaje']}, ";
            echo "Hora programada: {$recordatorio['hora_programada']}, ";
            echo "Enviado: {$recordatorio['fecha_hora']}\n";
        }
    }
    
    // 7. Verificar logs de ejecuciu00f3n del script de recordatorios
    echo "\n=== VERIFICANDO LOGS DE EJECUCIu00d3N DEL SCRIPT ===\n";
    $archivo_log = __DIR__ . '/backend/logs/recordatorios_' . date('Y-m-d') . '.log';
    
    if (!file_exists($archivo_log)) {
        echo "El archivo de log no existe: $archivo_log\n";
    } else {
        $contenido_log = file_get_contents($archivo_log);
        if (str_contains($contenido_log, $maria['NIF']) || str_contains($contenido_log, $maria['nombre']) || str_contains($contenido_log, $maria['apellidos'])) {
            echo "Se encontraron menciones a Maru00eda en el log:\n";
            $lineas = explode("\n", $contenido_log);
            foreach ($lineas as $linea) {
                if (str_contains($linea, $maria['NIF']) || str_contains($linea, $maria['nombre']) || str_contains($linea, $maria['apellidos'])) {
                    echo $linea . "\n";
                }
            }
        } else {
            echo "No se encontraron menciones a Maru00eda en el log\n";
        }
    }
}

// Cerrar conexiu00f3n
$conn->close();
