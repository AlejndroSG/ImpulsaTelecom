<?php
    include_once "bd.php";

class Fichaje {
    private $database;
    private $conn;
    private $table_name = "registros";
    
    // Constructor con conexión a la base de datos
    public function __construct() {
        $this->database = new db();
        $this->conn = $this->database->getConn();
        
        // Asegurarse de que la tabla tenga las columnas necesarias para las pausas
        $this->verificarColumnasPausa();
        $this->verificarColumnasLocalizacion();
    }
    
    // Verificar y crear columnas para pausas si no existen
    private function verificarColumnasPausa() {
        // Verificar si la columna horaPausa existe
        $query = "SHOW COLUMNS FROM {$this->table_name} LIKE 'horaPausa'";
        $result = $this->conn->query($query);
        
        if ($result->num_rows == 0) {
            // Agregar columnas para pausas
            $alterQuery = "ALTER TABLE {$this->table_name} 
                           ADD COLUMN horaPausa TIME NULL, 
                           ADD COLUMN horaReanudacion TIME NULL, 
                           ADD COLUMN tiempoPausa INT DEFAULT 0";
            $this->conn->query($alterQuery);
        }
    }
    
    // Verificar y crear columnas para localización si no existen
    private function verificarColumnasLocalizacion() {
        // Verificar si la columna latitud existe
        $query = "SHOW COLUMNS FROM {$this->table_name} LIKE 'latitud'";
        $result = $this->conn->query($query);
        
        if ($result->num_rows == 0) {
            // Agregar columnas para localización
            $alterQuery = "ALTER TABLE {$this->table_name} 
                           ADD COLUMN latitud DECIMAL(10, 8) NULL, 
                           ADD COLUMN longitud DECIMAL(11, 8) NULL,
                           ADD COLUMN localizacion VARCHAR(255) NULL";
            $this->conn->query($alterQuery);
        } else {
            // Verificar si la columna localizacion existe
            $query = "SHOW COLUMNS FROM {$this->table_name} LIKE 'localizacion'";
            $result = $this->conn->query($query);
            
            if ($result->num_rows == 0) {
                // Agregar solo la columna de localizacion
                $alterQuery = "ALTER TABLE {$this->table_name} ADD COLUMN localizacion VARCHAR(255) NULL";
                $this->conn->query($alterQuery);
            }
        }
    }
    
    // Obtener el fichaje actual del usuario
    public function getFichajeActual($NIF) {
        // Consultar si hay un fichaje activo para hoy
        $fecha_actual = date('Y-m-d');
        $query = "SELECT * FROM registros WHERE NIF = ? AND fecha = ? ORDER BY idRegistro DESC LIMIT 1";
        
        $stmt = $this->conn->prepare($query);
        
        if ($stmt === false) {
            error_log("Error en la preparación de la consulta: " . $this->conn->error);
            return [
                'success' => false,
                'error' => 'Error en la consulta: ' . $this->conn->error
            ];
        }
        
        // Usar bind_param de MySQLi en lugar de bindParam de PDO
        $stmt->bind_param("ss", $NIF, $fecha_actual);
        $stmt->execute();
        
        $result = $stmt->get_result();
        
        if ($result->num_rows > 0) {
            $row = $result->fetch_assoc();
            $estado = $this->getEstadoFichaje($row['idRegistro']);
            
            // Asegurarse de que el estado sea correcto basado en la hora de fin y pausa
            if (!empty($row['horaFin'])) {
                $estado = 'finalizado';
            } elseif (!empty($row['horaPausa']) && empty($row['horaReanudacion'])) {
                $estado = 'pausado';
            } elseif (!empty($row['horaInicio'])) {
                $estado = 'trabajando';
            } else {
                $estado = 'pendiente';
            }
            
            return [
                'success' => true,
                'fichaje' => $row,
                'estado' => $estado
            ];
        }
        
        return [
            'success' => false,
            'error' => 'No se encontró un fichaje'
        ];
    }
    
    // Obtener el estado actual del fichaje
    private function getEstadoFichaje($id_fichaje) {
        // Verificar el estado del fichaje
        $query = "SELECT horaInicio, horaFin, horaPausa, horaReanudacion FROM registros 
                  WHERE idRegistro = ?";
        
        $stmt = $this->conn->prepare($query);
        
        if ($stmt === false) {
            error_log("Error en la preparación de la consulta de estado: " . $this->conn->error);
            return 'pendiente';
        }
        
        $stmt->bind_param("i", $id_fichaje);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows === 0) {
            return 'pendiente';
        }
        
        $row = $result->fetch_assoc();
        
        if (!empty($row['horaFin'])) {
            return 'finalizado';
        } elseif (!empty($row['horaPausa']) && empty($row['horaReanudacion'])) {
            return 'pausado';
        } elseif (!empty($row['horaInicio'])) {
            return 'trabajando';
        }
        
        return 'pendiente';
    }
    
    // Registrar entrada con geolocalización
    public function registrarEntrada($id_usuario, $fecha, $hora, $latitud = null, $longitud = null) {
        // Verificar si existen las columnas necesarias
        $this->verificarColumnasLocalizacion();
        
        // Registrar en el log para depuración
        error_log("Fichaje.php - Registrando entrada para usuario: $id_usuario, fecha: $fecha, hora: $hora");
        error_log("Fichaje.php - Coordenadas recibidas: latitud=$latitud, longitud=$longitud");
        
        // Verificar si ya hay un fichaje activo para el usuario
        $fichaje_actual = $this->getFichajeActual($id_usuario);
        
        if ($fichaje_actual['success'] && $fichaje_actual['estado'] === 'trabajando') {
            return [
                'success' => false,
                'error' => 'Ya existe un fichaje activo para hoy'
            ];
        }
        
        // Crear la cadena de localización si se proporcionaron coordenadas
        $localizacion = null;
        if ($latitud !== null && $longitud !== null) {
            $localizacion = "$latitud, $longitud";
            error_log("Fichaje.php - Cadena de localización creada: $localizacion");
        }
        
        // Insertar nuevo fichaje
        if ($latitud !== null && $longitud !== null) {
            $query = "INSERT INTO registros 
                      (NIF, fecha, horaInicio, latitud, longitud, localizacion, estado) 
                      VALUES (?, ?, ?, ?, ?, ?, 'entrada')";
            
            $stmt = $this->conn->prepare($query);
            
            if ($stmt === false) {
                error_log("Error en la preparación de la consulta de inserción: " . $this->conn->error);
                return [
                    'success' => false,
                    'error' => 'Error en la consulta de inserción: ' . $this->conn->error
                ];
            }
            
            error_log("Fichaje.php - Ejecutando consulta con geolocalización");
            $stmt->bind_param("sssdds", $id_usuario, $fecha, $hora, $latitud, $longitud, $localizacion);
        } else {
            // Sin geolocalización
            $query = "INSERT INTO registros 
                      (NIF, fecha, horaInicio, estado) 
                      VALUES (?, ?, ?, 'entrada')";
            
            $stmt = $this->conn->prepare($query);
            
            if ($stmt === false) {
                error_log("Error en la preparación de la consulta de inserción: " . $this->conn->error);
                return [
                    'success' => false,
                    'error' => 'Error en la consulta de inserción: ' . $this->conn->error
                ];
            }
            
            error_log("Fichaje.php - Ejecutando consulta sin geolocalización");
            $stmt->bind_param("sss", $id_usuario, $fecha, $hora);
        }
        
        if ($stmt->execute()) {
            $id_fichaje = $this->conn->insert_id;
            error_log("Fichaje.php - Entrada registrada correctamente con ID: $id_fichaje");
            
            return [
                'success' => true,
                'id_fichaje' => $id_fichaje,
                'message' => 'Entrada registrada correctamente'
            ];
        } else {
            error_log("Error al registrar entrada: " . $stmt->error);
            return [
                'success' => false,
                'error' => 'Error al registrar entrada: ' . $stmt->error
            ];
        }
    }
    
    // Registrar pausa
    public function registrarPausa($id_usuario, $id_fichaje, $hora) {
        // Verificar que el fichaje pertenece al usuario y esté en estado trabajando
        $query = "SELECT * FROM registros 
                  WHERE idRegistro = ? AND NIF = ? AND horaInicio IS NOT NULL AND horaFin IS NULL";
        
        $stmt = $this->conn->prepare($query);
        
        if ($stmt === false) {
            error_log("Error en la preparación de la consulta de verificación: " . $this->conn->error);
            return [
                'success' => false,
                'error' => 'Error en la consulta de verificación: ' . $this->conn->error
            ];
        }
        
        $stmt->bind_param("is", $id_fichaje, $id_usuario);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows === 0) {
            return [
                'success' => false,
                'error' => 'El fichaje no pertenece al usuario o no está en estado trabajando'
            ];
        }
        
        // Verificar que el fichaje no esté ya en pausa
        $row = $result->fetch_assoc();
        if (!empty($row['horaPausa']) && empty($row['horaReanudacion'])) {
            return [
                'success' => false,
                'error' => 'El fichaje ya está en pausa'
            ];
        }
        
        // Actualizar la hora de pausa
        $query = "UPDATE registros 
                  SET horaPausa = ? 
                  WHERE idRegistro = ?";
        
        $stmt = $this->conn->prepare($query);
        
        if ($stmt === false) {
            error_log("Error en la preparación de la consulta de actualización: " . $this->conn->error);
            return [
                'success' => false,
                'error' => 'Error en la consulta de actualización: ' . $this->conn->error
            ];
        }
        
        $stmt->bind_param("si", $hora, $id_fichaje);
        
        if ($stmt->execute()) {
            return [
                'success' => true,
                'message' => 'Pausa registrada correctamente',
                'estado' => 'pausado'
            ];
        }
        
        return [
            'success' => false,
            'error' => 'Error al registrar la pausa'
        ];
    }
    
    // Reanudar trabajo después de una pausa
    public function reanudarTrabajo($id_usuario, $id_fichaje, $hora) {
        // Verificar que el fichaje pertenece al usuario y esté en pausa
        $query = "SELECT * FROM registros 
                  WHERE idRegistro = ? AND NIF = ? AND horaPausa IS NOT NULL AND horaReanudacion IS NULL AND horaFin IS NULL";
        
        $stmt = $this->conn->prepare($query);
        
        if ($stmt === false) {
            error_log("Error en la preparación de la consulta de verificación: " . $this->conn->error);
            return [
                'success' => false,
                'error' => 'Error en la consulta de verificación: ' . $this->conn->error
            ];
        }
        
        $stmt->bind_param("is", $id_fichaje, $id_usuario);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows === 0) {
            return [
                'success' => false,
                'error' => 'El fichaje no pertenece al usuario o no está en pausa'
            ];
        }
        
        $row = $result->fetch_assoc();
        
        // Registrar información para depuración
        error_log("Fichaje.php - Reanudando trabajo para fichaje ID: $id_fichaje");
        error_log("Fichaje.php - Hora de pausa registrada: " . $row['horaPausa']);
        error_log("Fichaje.php - Hora de reanudación actual: $hora");
        
        // Calcular el tiempo de pausa en segundos
        $horaPausa = strtotime($row['horaPausa']);
        $horaReanudacion = strtotime($hora);
        $tiempoPausaActual = $horaReanudacion - $horaPausa;
        
        error_log("Fichaje.php - Tiempo de pausa calculado en segundos: $tiempoPausaActual");
        
        // Verificar que la hora de reanudación sea posterior a la hora de pausa
        if ($tiempoPausaActual <= 0) {
            error_log("Fichaje.php - ERROR: La hora de reanudación es anterior o igual a la hora de pausa");
            
            // Usar la hora actual del servidor para garantizar que sea posterior
            $hora = date('H:i:s');
            $horaReanudacion = strtotime($hora);
            $tiempoPausaActual = $horaReanudacion - $horaPausa;
            
            error_log("Fichaje.php - Corrigiendo con hora del servidor: $hora");
            error_log("Fichaje.php - Nuevo tiempo de pausa calculado: $tiempoPausaActual");
            
            // Si aún así es negativo, establecer un valor mínimo de 1 segundo
            if ($tiempoPausaActual <= 0) {
                $tiempoPausaActual = 1;
                error_log("Fichaje.php - Estableciendo tiempo mínimo de pausa: 1 segundo");
            }
        }
        
        // Sumar al tiempo de pausa acumulado
        $tiempoPausaTotal = $row['tiempoPausa'] + $tiempoPausaActual;
        
        // Actualizar la hora de reanudación y el tiempo de pausa acumulado
        $query = "UPDATE registros 
                  SET horaReanudacion = ?, tiempoPausa = ? 
                  WHERE idRegistro = ?";
        
        $stmt = $this->conn->prepare($query);
        
        if ($stmt === false) {
            error_log("Error en la preparación de la consulta de actualización: " . $this->conn->error);
            return [
                'success' => false,
                'error' => 'Error en la consulta de actualización: ' . $this->conn->error
            ];
        }
        
        $stmt->bind_param("sii", $hora, $tiempoPausaTotal, $id_fichaje);
        
        if ($stmt->execute()) {
            return [
                'success' => true,
                'message' => 'Trabajo reanudado correctamente',
                'estado' => 'trabajando',
                'tiempoPausa' => $tiempoPausaTotal
            ];
        }
        
        return [
            'success' => false,
            'error' => 'Error al reanudar el trabajo'
        ];
    }
    
    // Registrar salida
    public function registrarSalida($id_usuario, $id_fichaje, $hora, $latitud = null, $longitud = null) {
        // Verificar que el fichaje pertenece al usuario
        $query = "SELECT * FROM registros 
                  WHERE idRegistro = ? AND NIF = ?";
        
        $stmt = $this->conn->prepare($query);
        
        if ($stmt === false) {
            error_log("Error en la preparación de la consulta de verificación: " . $this->conn->error);
            return [
                'success' => false,
                'error' => 'Error en la consulta de verificación: ' . $this->conn->error
            ];
        }
        
        $stmt->bind_param("is", $id_fichaje, $id_usuario);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows === 0) {
            return [
                'success' => false,
                'error' => 'El fichaje no pertenece al usuario'
            ];
        }
        
        // Verificar que el fichaje no tiene ya una hora de salida
        $row = $result->fetch_assoc();
        if (!empty($row['horaFin'])) {
            return [
                'success' => false,
                'error' => 'El fichaje ya tiene registrada una salida'
            ];
        }
        
        // Si el fichaje está en pausa, calcular el tiempo de pausa final
        $tiempoPausaTotal = $row['tiempoPausa'];
        if (!empty($row['horaPausa']) && empty($row['horaReanudacion'])) {
            // Calcular el tiempo de la pausa actual
            $horaPausa = strtotime($row['horaPausa']);
            $horaSalida = strtotime($hora);
            $tiempoPausaActual = $horaSalida - $horaPausa;
            
            // Sumar al tiempo de pausa acumulado
            $tiempoPausaTotal += $tiempoPausaActual;
        }
        
        // Registrar en el log para depuración de coordenadas
        error_log("Fichaje.php - Registrando salida para usuario: $id_usuario, fichaje: $id_fichaje");
        error_log("Fichaje.php - Coordenadas recibidas para salida: latitud=$latitud, longitud=$longitud");
        
        // Crear la cadena de localización si se proporcionaron coordenadas
        $localizacion = null;
        if ($latitud !== null && $longitud !== null) {
            $localizacion = "$latitud, $longitud";
            error_log("Fichaje.php - Cadena de localización creada para salida: $localizacion");
        }
        
        // Construir la consulta SQL basada en si hay coordenadas o no
        if ($latitud !== null && $longitud !== null) {
            // Actualizar con coordenadas
            $query = "UPDATE registros 
                      SET horaFin = ?, tiempoPausa = ?, latitud = ?, longitud = ?, localizacion = ? 
                      WHERE idRegistro = ?";
            
            $stmt = $this->conn->prepare($query);
            
            if ($stmt === false) {
                error_log("Error en la preparación de la consulta de actualización: " . $this->conn->error);
                return [
                    'success' => false,
                    'error' => 'Error en la consulta de actualización: ' . $this->conn->error
                ];
            }
            
            $stmt->bind_param("siddsi", $hora, $tiempoPausaTotal, $latitud, $longitud, $localizacion, $id_fichaje);
        } else {
            // Actualizar sin coordenadas
            $query = "UPDATE registros 
                      SET horaFin = ?, tiempoPausa = ? 
                      WHERE idRegistro = ?";
            
            $stmt = $this->conn->prepare($query);
            
            if ($stmt === false) {
                error_log("Error en la preparación de la consulta de actualización: " . $this->conn->error);
                return [
                    'success' => false,
                    'error' => 'Error en la consulta de actualización: ' . $this->conn->error
                ];
            }
            
            $stmt->bind_param("sii", $hora, $tiempoPausaTotal, $id_fichaje);
        }
        
        if ($stmt->execute()) {
            return [
                'success' => true,
                'message' => 'Salida registrada correctamente',
                'estado' => 'finalizado',
                'tiempoPausa' => $tiempoPausaTotal
            ];
        }
        
        return [
            'success' => false,
            'error' => 'Error al registrar la salida'
        ];
    }
    
    // Obtener estadísticas de fichajes de un usuario
    public function getEstadisticas($id_usuario, $periodo = 'semana') {
        // Crear un archivo de log específico para estadísticas
        $logFile = __DIR__ . '/../../logs/estadisticas.log';
        $logDir = dirname($logFile);
        
        // Crear directorio de logs si no existe
        if (!file_exists($logDir)) {
            mkdir($logDir, 0777, true);
        }
        
        // Escribir en el archivo de log
        $logMessage = date('Y-m-d H:i:s') . " - Obteniendo estadísticas para usuario: $id_usuario, período: $periodo\n";
        file_put_contents($logFile, $logMessage, FILE_APPEND);
        
        // Determinar el rango de fechas según el período
        $fechaFin = date('Y-m-d');
        $fechaInicio = '';
        
        switch ($periodo) {
            case 'semana':
                $fechaInicio = date('Y-m-d', strtotime('-7 days'));
                break;
            case 'mes':
                $fechaInicio = date('Y-m-d', strtotime('-30 days'));
                break;
            case 'trimestre':
                $fechaInicio = date('Y-m-d', strtotime('-90 days'));
                break;
            case 'año':
                $fechaInicio = date('Y-m-d', strtotime('-365 days'));
                break;
            default:
                $fechaInicio = date('Y-m-d', strtotime('-7 days'));
        }
        
        $logMessage = date('Y-m-d H:i:s') . " - Rango de fechas: $fechaInicio a $fechaFin\n";
        file_put_contents($logFile, $logMessage, FILE_APPEND);
        
        // Consulta para obtener los registros en el período especificado
        $query = "SELECT fecha, horaInicio, horaFin, tiempoPausa FROM {$this->table_name} 
                  WHERE NIF = ? AND fecha BETWEEN ? AND ? 
                  ORDER BY fecha ASC, horaInicio ASC";
        
        $stmt = $this->conn->prepare($query);
        
        if ($stmt === false) {
            $errorMsg = date('Y-m-d H:i:s') . " - Error en la preparación de la consulta: " . $this->conn->error . "\n";
            file_put_contents($logFile, $errorMsg, FILE_APPEND);
            return null;
        }
        
        $stmt->bind_param("sss", $id_usuario, $fechaInicio, $fechaFin);
        $stmt->execute();
        $result = $stmt->get_result();
        
        // Registrar número de registros encontrados
        $numRegistros = $result->num_rows;
        $logMessage = date('Y-m-d H:i:s') . " - Número de registros encontrados: $numRegistros\n";
        file_put_contents($logFile, $logMessage, FILE_APPEND);
        
        // Inicializar variables para estadísticas
        $totalDias = 0;
        $totalHoras = 0;
        $datosPorDia = [];
        $diasTrabajados = [];
        
        // Procesar resultados
        while ($row = $result->fetch_assoc()) {
            $fecha = $row['fecha'];
            $logMessage = date('Y-m-d H:i:s') . " - Procesando registro: fecha=$fecha, inicio={$row['horaInicio']}, fin={$row['horaFin']}\n";
            file_put_contents($logFile, $logMessage, FILE_APPEND);
            
            // Si es un nuevo día de trabajo
            if (!isset($diasTrabajados[$fecha])) {
                $diasTrabajados[$fecha] = [
                    'horasTrabajadas' => 0,
                    'registros' => 0
                ];
                $totalDias++;
            }
            
            // Calcular horas trabajadas en este registro
            $horasTrabajadas = 0;
            
            if (!empty($row['horaInicio']) && !empty($row['horaFin'])) {
                $inicio = strtotime($row['horaInicio']);
                $fin = strtotime($row['horaFin']);
                $tiempoPausa = intval($row['tiempoPausa']);
                
                // Tiempo total menos tiempo de pausa (en segundos)
                $tiempoTrabajado = ($fin - $inicio) - $tiempoPausa;
                $horasTrabajadas = $tiempoTrabajado / 3600; // Convertir a horas
                $logMessage = date('Y-m-d H:i:s') . " - Horas trabajadas en este registro: $horasTrabajadas\n";
                file_put_contents($logFile, $logMessage, FILE_APPEND);
            }
            
            // Acumular horas trabajadas
            $diasTrabajados[$fecha]['horasTrabajadas'] += $horasTrabajadas;
            $diasTrabajados[$fecha]['registros']++;
            $totalHoras += $horasTrabajadas;
        }
        
        // Preparar datos para gráficas
        foreach ($diasTrabajados as $fecha => $datos) {
            $datosPorDia[] = [
                'fecha' => $fecha,
                'horasTrabajadas' => round($datos['horasTrabajadas'], 2),
                'registros' => $datos['registros']
            ];
        }
        
        // Calcular promedios
        $promedioHorasDiarias = $totalDias > 0 ? round($totalHoras / $totalDias, 2) : 0;
        
        // Registrar resumen de estadísticas
        $logMessage = date('Y-m-d H:i:s') . " - Resumen de estadísticas: totalHoras=$totalHoras, totalDias=$totalDias\n";
        file_put_contents($logFile, $logMessage, FILE_APPEND);
        
        // Devolver estadísticas
        return [
            'totalHoras' => round($totalHoras, 2),
            'totalDias' => $totalDias,
            'promedioHorasDiarias' => $promedioHorasDiarias,
            'datosPorDia' => $datosPorDia
        ];
    }
    
    // Obtener historial de fichajes de un usuario
    public function getHistorialByUsuario($id_usuario) {
        $query = "SELECT * FROM registros 
                  WHERE NIF = ? 
                  ORDER BY fecha DESC, horaInicio DESC";
        
        $stmt = $this->conn->prepare($query);
        
        if ($stmt === false) {
            error_log("Error en la preparación de la consulta de historial: " . $this->conn->error);
            return [
                'success' => false,
                'error' => 'Error en la consulta de historial: ' . $this->conn->error
            ];
        }
        
        $stmt->bind_param("s", $id_usuario);
        $stmt->execute();
        $result = $stmt->get_result();
        
        $registros = [];
        while ($row = $result->fetch_assoc()) {
            $registros[] = $row;
        }
        
        return [
            'success' => true,
            'registros' => $registros
        ];
    }
    
    // Getter para la conexión a la base de datos
    public function getConn() {
        return $this->conn;
    }
    
    // Getter para el nombre de la tabla
    public function getTableName() {
        return $this->table_name;
    }
}
?>
