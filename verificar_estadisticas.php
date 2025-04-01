<?php
// Script para verificar que las estadu00edsticas se obtienen correctamente de la base de datos
header("Content-Type: text/plain; charset=UTF-8");

// Incluir la clase Fichaje
include_once "backend/modelos/Fichaje.php";

// Crear archivo de log
$logFile = __DIR__ . '/logs/verificacion_estadisticas_juan.log';
$logDir = dirname($logFile);

// Crear directorio si no existe
if (!file_exists($logDir)) {
    mkdir($logDir, 0777, true);
}

// Usuario especu00edfico: Juan
$usuarioTest = '12345678A'; // Asumimos que este es el NIF de Juan

// Iniciar el log
$log = "=== VERIFICACIU00d3N DE ESTADu00cdSTICAS PARA JUAN (NIF: $usuarioTest) ===\n";
$log .= "Fecha y hora: " . date('Y-m-d H:i:s') . "\n\n";

// Crear instancia de Fichaje
$fichaje = new Fichaje();
$log .= "Tabla utilizada: {$fichaje->getTableName()}\n";

// Obtener conexiu00f3n a la base de datos
$conn = $fichaje->getConn();

// Verificar si el usuario existe
$query = "SELECT COUNT(*) as total FROM {$fichaje->getTableName()} WHERE NIF = ?";
$stmt = $conn->prepare($query);
$stmt->bind_param("s", $usuarioTest);
$stmt->execute();
$result = $stmt->get_result();
$row = $result->fetch_assoc();
$totalRegistros = $row['total'];

$log .= "Total de registros para el usuario: $totalRegistros\n";

if ($totalRegistros == 0) {
    // Si no hay registros para el usuario especificado, buscar otros usuarios
    $log .= "\nNo se encontraron registros para el usuario con NIF: $usuarioTest\n";
    $log .= "Buscando otros usuarios en la base de datos...\n";
    
    $query = "SELECT DISTINCT NIF FROM {$fichaje->getTableName()} LIMIT 5";
    $result = $conn->query($query);
    
    $usuarios = [];
    while ($row = $result->fetch_assoc()) {
        $usuarios[] = $row['NIF'];
    }
    
    if (!empty($usuarios)) {
        $usuarioTest = $usuarios[0]; // Usar el primer usuario encontrado
        $log .= "Usando usuario alternativo con NIF: $usuarioTest\n";
    } else {
        $log .= "No se encontraron usuarios con registros en la base de datos.\n";
        file_put_contents($logFile, $log);
        echo $log;
        echo "\n\nLog guardado en: $logFile";
        exit;
    }
}

// Obtener registros del usuario
$log .= "\nREGISTROS DEL USUARIO: $usuarioTest\n";
$query = "SELECT fecha, horaInicio, horaFin, tiempoPausa FROM {$fichaje->getTableName()} 
          WHERE NIF = ? 
          ORDER BY fecha DESC, horaInicio DESC LIMIT 10";
$stmt = $conn->prepare($query);
$stmt->bind_param("s", $usuarioTest);
$stmt->execute();
$result = $stmt->get_result();

$log .= "u00daltimos 10 registros del usuario $usuarioTest:\n";
$registrosUsuario = [];

while ($row = $result->fetch_assoc()) {
    $registrosUsuario[] = $row;
    $log .= "  - Fecha: {$row['fecha']}, Inicio: {$row['horaInicio']}, Fin: {$row['horaFin']}, Pausa: {$row['tiempoPausa']}s\n";
}

// Obtener estadu00edsticas para este usuario
$log .= "\nESTADu00cdSTICAS DEL USUARIO: $usuarioTest\n";

foreach (['semana', 'mes', 'trimestre', 'au00f1o'] as $periodo) {
    $log .= "\nPeru00edodo: $periodo\n";
    $estadisticas = $fichaje->getEstadisticas($usuarioTest, $periodo);
    
    if ($estadisticas) {
        $log .= "  - Total horas: {$estadisticas['totalHoras']}\n";
        $log .= "  - Total du00edas: {$estadisticas['totalDias']}\n";
        $log .= "  - Promedio diario: {$estadisticas['promedioHorasDiarias']}\n";
        $log .= "  - Datos por du00eda: " . count($estadisticas['datosPorDia']) . " registros\n";
        
        // Mostrar datos por du00eda
        if (!empty($estadisticas['datosPorDia'])) {
            $log .= "  - Datos detallados por du00eda:\n";
            foreach ($estadisticas['datosPorDia'] as $dato) {
                $log .= "      * Fecha: {$dato['fecha']}, Horas: {$dato['horasTrabajadas']}\n";
            }
        }
    } else {
        $log .= "  - No se pudieron obtener estadu00edsticas\n";
    }
}

// Verificar cu00e1lculos manuales vs. resultados del mu00e9todo
$log .= "\nVERIFICACIU00d3N DE Cu00c1LCULOS\n";

// Calcular horas trabajadas manualmente para cada du00eda
if (!empty($registrosUsuario)) {
    foreach ($registrosUsuario as $index => $registroTest) {
        if ($index >= 3) break; // Limitar a los primeros 3 registros para no hacer el log muy largo
        
        $fechaTest = $registroTest['fecha'];
        
        $log .= "\nVerificando cu00e1lculos para la fecha: $fechaTest\n";
        
        // Obtener todos los registros de ese du00eda
        $query = "SELECT fecha, horaInicio, horaFin, tiempoPausa FROM {$fichaje->getTableName()} 
                  WHERE NIF = ? AND fecha = ?";
        $stmt = $conn->prepare($query);
        $stmt->bind_param("ss", $usuarioTest, $fechaTest);
        $stmt->execute();
        $result = $stmt->get_result();
        
        $horasTotalesDia = 0;
        
        while ($row = $result->fetch_assoc()) {
            if (!empty($row['horaInicio']) && !empty($row['horaFin'])) {
                $inicio = strtotime($row['horaInicio']);
                $fin = strtotime($row['horaFin']);
                $tiempoPausa = intval($row['tiempoPausa']);
                
                // Tiempo total menos tiempo de pausa (en segundos)
                $tiempoTrabajado = ($fin - $inicio) - $tiempoPausa;
                $horasTrabajadas = $tiempoTrabajado / 3600; // Convertir a horas
                
                $horasTotalesDia += $horasTrabajadas;
                
                $log .= "  - Registro: Inicio={$row['horaInicio']}, Fin={$row['horaFin']}, Pausa={$row['tiempoPausa']}s\n";
                $log .= "    Cu00e1lculo manual: ($fin - $inicio) - $tiempoPausa = $tiempoTrabajado segundos = $horasTrabajadas horas\n";
            }
        }
        
        $log .= "  - Total horas calculadas manualmente para $fechaTest: " . round($horasTotalesDia, 2) . "\n";
        
        // Comparar con el resultado del mu00e9todo getEstadisticas
        $estadisticasDia = $fichaje->getEstadisticas($usuarioTest, 'semana');
        $horasMetodo = 0;
        
        if ($estadisticasDia && !empty($estadisticasDia['datosPorDia'])) {
            foreach ($estadisticasDia['datosPorDia'] as $dato) {
                if ($dato['fecha'] == $fechaTest) {
                    $horasMetodo = $dato['horasTrabajadas'];
                    break;
                }
            }
            
            $log .= "  - Horas segu00fan mu00e9todo getEstadisticas: $horasMetodo\n";
            $log .= "  - Coinciden los cu00e1lculos: " . (abs($horasTotalesDia - $horasMetodo) < 0.01 ? "Su00cd" : "NO") . "\n";
        } else {
            $log .= "  - No se encontraron datos para esta fecha en el mu00e9todo getEstadisticas\n";
        }
    }
}

// Guardar el log
file_put_contents($logFile, $log);

// Mostrar en pantalla
echo $log;
echo "\n\nLog guardado en: $logFile";
