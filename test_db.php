<?php
// Configuración de la base de datos
$host = 'localhost';
$db_name = 'impulsatelecom';
$username = 'root';
$password = '';
$conn = null;

// Configuración de cabeceras para mostrar texto plano
header("Content-Type: text/plain; charset=UTF-8");

try {
    // Crear conexión a la base de datos
    $conn = new mysqli($host, $username, $password, $db_name);
    
    // Verificar conexión
    if ($conn->connect_error) {
        die("Error de conexión: " . $conn->connect_error);
    }
    
    echo "Conexión a la base de datos exitosa!\n\n";
    
    // Columnas conocidas de la tabla registros
    $columns = [
        'idRegistro', 'NIF', 'fecha', 'horaInicio', 'horaFin', 
        'horaPausa', 'horaReanudacion', 'tiempoPausa', 
        'latitud', 'longitud', 'localizacion', 'estado'
    ];
    
    echo "Columnas en la tabla 'registros': " . implode(", ", $columns) . "\n\n";
    
    // Consultar registros para verificar datos
    $query = "SELECT * FROM registros ORDER BY fecha DESC, horaInicio DESC LIMIT 10";
    $result = $conn->query($query);
    
    if ($result === false) {
        echo "Error en la consulta: " . $conn->error;
    } else {
        echo "Últimos 10 registros en la base de datos:\n";
        echo "----------------------------------------\n";
        
        if ($result->num_rows > 0) {
            while ($row = $result->fetch_assoc()) {
                echo "ID: {$row['idRegistro']}, Usuario: {$row['NIF']}, Fecha: {$row['fecha']}\n";
                echo "Hora inicio: {$row['horaInicio']}, Hora fin: {$row['horaFin']}\n";
                echo "Tiempo pausa: {$row['tiempoPausa']} segundos\n";
                echo "Estado: {$row['estado']}\n";
                echo "----------------------------------------\n";
            }
        } else {
            echo "No se encontraron registros en la base de datos.\n";
        }
    }
    
    // Ahora ejecutamos el script de estadísticas para ver los logs
    echo "\n\n=== EJECUTANDO SCRIPT DE ESTADÍSTICAS ===\n";
    
    // Incluir el script de Fichaje
    include_once "backend/modelos/Fichaje.php";
    
    // Crear instancia de Fichaje
    $fichaje = new Fichaje();
    
    // Obtener un usuario de la base de datos
    $user_query = "SELECT DISTINCT NIF FROM registros LIMIT 1";
    $user_result = $conn->query($user_query);
    $id_usuario = null;
    
    if ($user_result && $user_result->num_rows > 0) {
        $user_row = $user_result->fetch_assoc();
        $id_usuario = $user_row['NIF'];
        echo "Usuario seleccionado para prueba: {$id_usuario}\n";
    } else {
        echo "No se encontraron usuarios. Usando ID de prueba.\n";
        $id_usuario = '98765432B'; // ID de prueba
    }
    
    // Obtener estadísticas para el período 'semana'
    echo "Obteniendo estadísticas para el usuario {$id_usuario}, período: semana\n";
    $estadisticas = $fichaje->getEstadisticas($id_usuario, 'semana');
    
    if ($estadisticas) {
        echo "Estadísticas obtenidas correctamente:\n";
        echo "  - Total horas: {$estadisticas['totalHoras']}\n";
        echo "  - Total días: {$estadisticas['totalDias']}\n";
        echo "  - Promedio diario: {$estadisticas['promedioHorasDiarias']}\n";
        echo "  - Datos por día: " . count($estadisticas['datosPorDia']) . " registros\n";
        
        // Mostrar algunos datos por día
        if (!empty($estadisticas['datosPorDia'])) {
            echo "  - Ejemplo de datos por día:\n";
            foreach (array_slice($estadisticas['datosPorDia'], 0, 3) as $dato) {
                echo "      * Fecha: {$dato['fecha']}, Horas: {$dato['horasTrabajadas']}\n";
            }
        }
    } else {
        echo "No se pudieron obtener estadísticas\n";
    }
    
    // Guardar la salida en un archivo de log
    $logFile = __DIR__ . '/logs/db_test.log';
    $logDir = dirname($logFile);
    
    // Crear directorio si no existe
    if (!file_exists($logDir)) {
        mkdir($logDir, 0777, true);
    }
    
    // Guardar información en el log
    $logContent = "Test de conexión a la base de datos: " . date('Y-m-d H:i:s') . "\n";
    $logContent .= "Consulta ejecutada: $query\n";
    $logContent .= "Número de registros encontrados: " . ($result ? $result->num_rows : 0) . "\n";
    
    // Comprobar si existe el archivo de logs de estadísticas
    $statsLogFile = __DIR__ . '/logs/estadisticas.log';
    if (file_exists($statsLogFile)) {
        $statsLogContent = file_get_contents($statsLogFile);
        $logContent .= "\n=== CONTENIDO DEL ARCHIVO DE LOG DE ESTADÍSTICAS ===\n\n";
        $logContent .= $statsLogContent;
    }
    
    file_put_contents($logFile, $logContent);
    echo "\nLog guardado en: $logFile";
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
} finally {
    // Cerrar conexión
    if ($conn) {
        $conn->close();
    }
}
