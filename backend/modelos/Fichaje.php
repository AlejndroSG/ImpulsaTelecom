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
        // Implementación original
    }
    
    // Registrar pausa
    public function registrarPausa($id_usuario, $id_fichaje, $hora) {
        // Implementación original
    }
    
    // Reanudar trabajo después de una pausa
    public function reanudarTrabajo($id_usuario, $id_fichaje, $hora) {
        // Implementación original
    }
    
    // Registrar salida
    public function registrarSalida($id_usuario, $id_fichaje, $hora, $latitud = null, $longitud = null) {
        // Implementación original
    }
    
    // Obtener estadísticas de fichajes de un usuario
    public function getEstadisticas($id_usuario, $periodo = 'semana') {
        // Implementación original
    }
    
    // Obtener historial de fichajes de un usuario
    public function getHistorialByUsuario($id_usuario, $limite = null, $dias = null) {
        try {
            // Base de la consulta
            $query = "SELECT idRegistro, fecha, horaInicio, horaFin, horaPausa, horaReanudacion, tiempoPausa, 
                      latitud, longitud, localizacion, estado
                      FROM {$this->table_name} 
                      WHERE NIF = ?";
            
            // Parámetros y sus tipos para bind_param
            $params = [$id_usuario];
            $types = "s";
            
            // Filtrar por fecha si se especifica un número de días
            if ($dias !== null && $dias > 0) {
                $fecha_limite = date('Y-m-d', strtotime("-{$dias} days"));
                $query .= " AND fecha >= ?";
                $params[] = $fecha_limite;
                $types .= "s";
            }
            
            // Ordenar por fecha descendente (más reciente primero)
            $query .= " ORDER BY fecha DESC, horaInicio DESC";
            
            // Limitar resultados si se especifica
            if ($limite !== null && $limite > 0) {
                $query .= " LIMIT ?";
                $params[] = $limite;
                $types .= "i";
            }
            
            // Preparar y ejecutar la consulta
            $stmt = $this->conn->prepare($query);
            
            if ($stmt === false) {
                throw new Exception("Error en la preparación de la consulta: " . $this->conn->error);
            }
            
            // Vincular parámetros dinámicamente
            if (!empty($params)) {
                $stmt->bind_param($types, ...$params);
            }
            
            $stmt->execute();
            $result = $stmt->get_result();
            
            // Procesar resultados
            $registros = [];
            if ($result && $result->num_rows > 0) {
                while ($row = $result->fetch_assoc()) {
                    // Determinar estado si no está definido
                    if (empty($row['estado'])) {
                        if (!empty($row['horaFin'])) {
                            $row['estado'] = 'finalizado';
                        } elseif (!empty($row['horaPausa']) && empty($row['horaReanudacion'])) {
                            $row['estado'] = 'pausado';
                        } else {
                            $row['estado'] = 'trabajando';
                        }
                    }
                    
                    // Formatear fechas y horas para mejor legibilidad
                    $row['fechaHoraEntrada'] = $row['fecha'] . ' ' . $row['horaInicio'];
                    if (!empty($row['horaFin'])) {
                        $row['fechaHoraSalida'] = $row['fecha'] . ' ' . $row['horaFin'];
                    } else {
                        $row['fechaHoraSalida'] = null;
                    }
                    
                    // Obtener pausas asociadas
                    $pausas = [];
                    if (!empty($row['horaPausa'])) {
                        $pausa = [
                            'inicio' => $row['horaPausa'],
                            'fin' => $row['horaReanudacion'] ?? null
                        ];
                        $pausas[] = $pausa;
                    }
                    $row['pausas'] = $pausas;
                    
                    $registros[] = $row;
                }
            }
            
            // Si no hay registros y el usuario existe, devolver array vacío con éxito
            if (empty($registros)) {
                // Verificar que el usuario existe
                $query_user = "SELECT NIF FROM usuarios WHERE NIF = ? LIMIT 1";
                $stmt_user = $this->conn->prepare($query_user);
                $stmt_user->bind_param("s", $id_usuario);
                $stmt_user->execute();
                $result_user = $stmt_user->get_result();
                
                if ($result_user->num_rows === 0) {
                    return [
                        'success' => false,
                        'error' => 'Usuario no encontrado'
                    ];
                }
            }
            
            return [
                'success' => true,
                'registros' => $registros
            ];
            
        } catch (Exception $e) {
            error_log("Error al obtener historial: " . $e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }
    
    // Generar datos de historial de muestra para pruebas
    public function generarHistorialMuestra($id_usuario, $limite = null) {
        // Implementación original
    }
    
    // Obtener pausas asociadas a un fichaje
    public function getPausasByFichaje($id_fichaje) {
        // Implementación original
    }
    
    // Obtener datos para el gráfico de fichajes
    public function getHistorialGrafico($id_usuario, $dias = 7) {
        try {
            // Obtener fecha actual y fecha hace X días
            $fecha_actual = date('Y-m-d');
            $fecha_inicio = date('Y-m-d', strtotime("-$dias days"));
            
            // Consulta para obtener fichajes en un rango de fechas
            $query = "SELECT fecha, horaInicio, horaFin, horaPausa, horaReanudacion, tiempoPausa 
                      FROM registros 
                      WHERE NIF = ? AND fecha BETWEEN ? AND ? 
                      ORDER BY fecha ASC";
            
            $stmt = $this->conn->prepare($query);
            if ($stmt === false) {
                throw new Exception("Error en la preparación de la consulta: " . $this->conn->error);
            }
            
            $stmt->bind_param("sss", $id_usuario, $fecha_inicio, $fecha_actual);
            $stmt->execute();
            $result = $stmt->get_result();
            
            // Estructura para almacenar datos procesados
            $datos_grafico = [];
            $dias_semana = [];
            
            // Generar array con los últimos N días
            for ($i = $dias - 1; $i >= 0; $i--) {
                $fecha = date('Y-m-d', strtotime("-$i days"));
                $dia_semana = date('D', strtotime($fecha)); // Obtiene abreviatura del día (Mon, Tue, etc.)
                
                $dias_semana[$fecha] = [
                    'fecha' => $fecha,
                    'diaSemana' => $dia_semana,
                    'horasTrabajadas' => 0,
                    'horasPausadas' => 0,
                    'name' => $dia_semana // Para compatibilidad con el gráfico
                ];
            }
            
            // Procesar resultados
            if ($result && $result->num_rows > 0) {
                while ($row = $result->fetch_assoc()) {
                    $fecha = $row['fecha'];
                    
                    // Si la fecha está en nuestro rango de días
                    if (isset($dias_semana[$fecha])) {
                        // Calcular horas trabajadas si hay hora de fin
                        if (!empty($row['horaFin'])) {
                            $inicio = strtotime($row['fecha'] . ' ' . $row['horaInicio']);
                            $fin = strtotime($row['fecha'] . ' ' . $row['horaFin']);
                            
                            // Asegurarse que fin es posterior a inicio
                            if ($fin > $inicio) {
                                $diferencia = ($fin - $inicio) / 3600; // Convertir a horas
                                
                                // Restar tiempo de pausas
                                $tiempo_pausa = !empty($row['tiempoPausa']) ? $row['tiempoPausa'] / 60 : 0; // Convertir minutos a horas
                                
                                $dias_semana[$fecha]['horasTrabajadas'] += $diferencia - $tiempo_pausa;
                                $dias_semana[$fecha]['horasPausadas'] += $tiempo_pausa;
                            }
                        }
                        // Para registros sin hora de fin (día actual posiblemente)
                        elseif (!empty($row['horaInicio'])) {
                            $inicio = strtotime($row['fecha'] . ' ' . $row['horaInicio']);
                            $ahora = time();
                            
                            // Solo contar si es hoy
                            if ($fecha == date('Y-m-d')) {
                                $diferencia = ($ahora - $inicio) / 3600; // Convertir a horas
                                
                                // Si está en pausa
                                if (!empty($row['horaPausa']) && empty($row['horaReanudacion'])) {
                                    $inicio_pausa = strtotime($row['fecha'] . ' ' . $row['horaPausa']);
                                    $tiempo_pausa = ($ahora - $inicio_pausa) / 3600; // Horas de pausa actual
                                    
                                    // Restar la pausa actual del tiempo trabajado
                                    $diferencia -= $tiempo_pausa;
                                    $dias_semana[$fecha]['horasPausadas'] += $tiempo_pausa;
                                }
                                
                                // Añadir tiempo de pausas anteriores
                                $tiempo_pausa_previo = !empty($row['tiempoPausa']) ? $row['tiempoPausa'] / 60 : 0;
                                $dias_semana[$fecha]['horasTrabajadas'] += $diferencia - $tiempo_pausa_previo;
                                $dias_semana[$fecha]['horasPausadas'] += $tiempo_pausa_previo;
                            }
                        }
                    }
                }
            }
            
            // Convertir a array y redondear valores
            foreach ($dias_semana as &$dia) {
                // Redondear a 1 decimal
                $dia['horasTrabajadas'] = round($dia['horasTrabajadas'], 1);
                $dia['horasPausadas'] = round($dia['horasPausadas'], 1);
            }
            
            // Devolver solo los valores del array asociativo
            return [
                'success' => true,
                'datos' => array_values($dias_semana)
            ];
            
        } catch (Exception $e) {
            error_log("Error al obtener historial gráfico: " . $e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }
    
    // Verificar si un usuario tiene algún registro
    public function verificarSiTieneRegistros($id_usuario) {
        // Implementación original
    }
    
    // Generar datos de muestra para el gráfico de fichajes
    public function generarDatosGraficoMuestra($dias = 7) {
        // Implementación original
    }
    
    // Getter para la conexión a la base de datos
    public function getConn() {
        return $this->conn;
    }
    
    // Getter para el nombre de la tabla
    public function getTableName() {
        return $this->table_name;
    }
    
    // Obtener todos los fichajes (para administradores)
    public function getAllFichajes($filtros = []) {
        try {
            $condiciones = [];
            $params = [];
            $types = "";
            
            // Filtro por fechas
            if (!empty($filtros['fecha_inicio'])) {
                $condiciones[] = "fecha >= ?";
                $params[] = $filtros['fecha_inicio'];
                $types .= "s";
            }
            
            if (!empty($filtros['fecha_fin'])) {
                $condiciones[] = "fecha <= ?";
                $params[] = $filtros['fecha_fin'];
                $types .= "s";
            }
            
            // Filtro por NIF
            if (!empty($filtros['nif'])) {
                $condiciones[] = "r.NIF LIKE ?";
                $params[] = "%" . $filtros['nif'] . "%";
                $types .= "s";
            }
            
            // Filtro por departamento - desactivado hasta confirmar el nombre correcto de la columna
            if (!empty($filtros['departamento'])) {
                // Comentado hasta resolver el problema de la columna
                // $condiciones[] = "u.departamento = ?";
                // $params[] = $filtros['departamento'];
                // $types .= "s";
                error_log("Filtro de departamento desactivado temporalmente: " . $filtros['departamento']);
            }
            
            // Filtro por estado
            if (!empty($filtros['estado'])) {
                switch ($filtros['estado']) {
                    case 'trabajando':
                        $condiciones[] = "r.horaInicio IS NOT NULL AND r.horaFin IS NULL AND (r.horaPausa IS NULL OR r.horaReanudacion IS NOT NULL)";
                        break;
                    case 'pausado':
                        $condiciones[] = "r.horaPausa IS NOT NULL AND r.horaReanudacion IS NULL";
                        break;
                    case 'finalizado':
                        $condiciones[] = "r.horaFin IS NOT NULL";
                        break;
                }
            }
            
            // Construir cláusula WHERE
            $where = count($condiciones) > 0 ? " WHERE " . implode(" AND ", $condiciones) : "";
            
            // Añadir límite si se proporciona
            $limit = "";
            if (!empty($filtros['limite']) && is_numeric($filtros['limite'])) {
                $limit = " LIMIT " . intval($filtros['limite']);
            }
            
            // Construir consulta para obtener el total de registros
            $query_count = "SELECT COUNT(*) as total FROM {$this->table_name} r
                          LEFT JOIN usuarios u ON r.NIF = u.NIF" . $where;
                          
            // Construir consulta principal
            $query = "SELECT r.idRegistro, r.NIF, CONCAT(u.nombre, ' ', u.apellidos) as nombreCompleto,
                   u.tipo_Usu as departamento, r.fecha, r.horaInicio, r.horaFin, r.horaPausa, r.horaReanudacion,
                   r.tiempoPausa, r.latitud, r.longitud, r.localizacion, r.estado, u.id_avatar,
                   a.ruta as avatar_ruta,
                   CASE
                        WHEN r.horaFin IS NOT NULL THEN 'finalizado'
                        WHEN r.horaPausa IS NOT NULL AND r.horaReanudacion IS NULL THEN 'pausado'
                        WHEN r.horaInicio IS NOT NULL THEN 'trabajando'
                        ELSE 'pendiente'
                    END as estado,
                    CASE 
                        WHEN r.horaInicio IS NOT NULL AND r.horaFin IS NOT NULL THEN 
                            TIME_TO_SEC(TIMEDIFF(r.horaFin, r.horaInicio)) - IFNULL(r.tiempoPausa, 0)
                        WHEN r.horaInicio IS NOT NULL THEN 
                            TIME_TO_SEC(TIMEDIFF(NOW(), r.horaInicio)) - IFNULL(r.tiempoPausa, 0)
                        ELSE 0
                    END as tiempoTrabajado
             FROM {$this->table_name} r
             LEFT JOIN usuarios u ON r.NIF = u.NIF
             LEFT JOIN avatares a ON u.id_avatar = a.id" . $where . "
             ORDER BY r.fecha DESC, r.idRegistro DESC" . $limit;
            
            // Preparar consulta para contar registros
            $stmt_count = $this->conn->prepare($query_count);
            if ($stmt_count === false) {
                throw new Exception("Error en la preparación de la consulta de conteo: " . $this->conn->error);
            }
            
            // Vincular parámetros si hay condiciones
            if (count($params) > 0) {
                // Usar bind_param con tipos dinámicos y desempaquetar el array de parámetros
                if (method_exists($stmt_count, 'bind_param')) {
                    $stmt_count->bind_param($types, ...$params);
                } else {
                    // Alternativa manual para vincular parámetros
                    foreach ($params as $i => $param) {
                        $stmt_count->bindValue($i + 1, $param);
                    }
                }
            }
            
            // Ejecutar consulta de conteo
            $stmt_count->execute();
            $result_count = $stmt_count->get_result();
            $row_count = $result_count->fetch_assoc();
            $total_registros = $row_count['total'];
            
            // Preparar consulta principal
            $stmt = $this->conn->prepare($query);
            if ($stmt === false) {
                throw new Exception("Error en la preparación de la consulta principal: " . $this->conn->error);
            }
            
            // Vincular parámetros si hay condiciones
            if (count($params) > 0) {
                // Usar bind_param con tipos dinámicos y desempaquetar el array de parámetros
                if (method_exists($stmt, 'bind_param')) {
                    $stmt->bind_param($types, ...$params);
                } else {
                    // Alternativa manual para vincular parámetros
                    foreach ($params as $i => $param) {
                        $stmt->bindValue($i + 1, $param);
                    }
                }
            }
            
            // Ejecutar consulta principal
            $stmt->execute();
            $result = $stmt->get_result();
            
            // Procesar resultados
            $fichajes = [];
            while ($row = $result->fetch_assoc()) {
                $fichajes[] = $row;
            }
            
            return [
                'success' => true,
                'fichajes' => $fichajes,
                'total' => $total_registros
            ];
            
        } catch (Exception $e) {
            error_log("Error en getAllFichajes: " . $e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }
    
    // Función auxiliar para pasar parámetros por referencia
    public function refValues($arr) {
        $refs = array();
        foreach($arr as $key => $value) {
            $refs[$key] = &$arr[$key];
        }
        return $refs;
    }
    
    // Obtener el horario de un usuario
    public function getHorarioUsuario($id_usuario) {
        try {
            // Obtener horario del usuario desde la base de datos
            $query = "SELECT h.*, u.nombre, u.apellidos, u.email 
                      FROM usuarios u 
                      LEFT JOIN horarios h ON u.id_horario = h.id 
                      WHERE u.NIF = ? LIMIT 1";
            
            $stmt = $this->conn->prepare($query);
            if ($stmt === false) {
                throw new Exception("Error en la preparación de la consulta: " . $this->conn->error);
            }
            
            $stmt->bind_param("s", $id_usuario);
            $stmt->execute();
            $result = $stmt->get_result();
            
            // Si encontramos el usuario con su horario
            if ($result && $result->num_rows > 0) {
                $usuario = $result->fetch_assoc();
                
                // Si el usuario tiene un horario asignado
                if ($usuario['id']) {
                    // Construir una cadena que represente los días laborables basados en los campos de la tabla
                    $dias_laborables = '';
                    if($usuario['lunes']) $dias_laborables .= 'L,';
                    if($usuario['martes']) $dias_laborables .= 'M,';
                    if($usuario['miercoles']) $dias_laborables .= 'X,';
                    if($usuario['jueves']) $dias_laborables .= 'J,';
                    if($usuario['viernes']) $dias_laborables .= 'V,';
                    if($usuario['sabado']) $dias_laborables .= 'S,';
                    if($usuario['domingo']) $dias_laborables .= 'D,';
                    $dias_laborables = rtrim($dias_laborables, ',');
                    
                    return [
                        'success' => true,
                        'datos' => [
                            'nombre' => $usuario['nombre'],
                            'apellidos' => $usuario['apellidos'],
                            'email' => $usuario['email'],
                            'horario' => [
                                'entrada' => $usuario['hora_inicio'],
                                'salida' => $usuario['hora_fin'],
                                'dias_laborables' => $dias_laborables
                            ]
                        ]
                    ];
                }
            }
            
            // Si no encontramos el horario, generamos datos de muestra
            return $this->generarHorarioUsuarioMuestra($id_usuario);
            
        } catch (Exception $e) {
            error_log("Error al obtener horario de usuario: " . $e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }
    
    // Generar datos de horario de usuario de muestra
    public function generarHorarioUsuarioMuestra($id_usuario) {
        // Generar datos de muestra para el horario de usuario
        return [
            'success' => true,
            'horario' => [
                'horaEntrada' => '09:00',
                'horaSalida' => '18:00',
                'horasSemanales' => 40,
                'diasTrabajo' => [1, 2, 3, 4, 5], // Lunes a viernes
                'descansos' => [
                    [
                        'inicio' => '13:00',
                        'fin' => '14:00',
                        'descripcion' => 'Almuerzo'
                    ]
                ]
            ]
        ];
    }
    
    // Actualizar datos de un fichaje existente
    public function actualizarFichaje($idRegistro, $datos) {
        // Verificar que el fichaje existe
        $checkQuery = "SELECT * FROM registros WHERE idRegistro = ?";
        $checkStmt = $this->conn->prepare($checkQuery);
        
        if ($checkStmt === false) {
            return [
                'success' => false,
                'error' => 'Error en la consulta: ' . $this->conn->error
            ];
        }
        
        $checkStmt->bind_param("i", $idRegistro);
        $checkStmt->execute();
        $result = $checkStmt->get_result();
        
        if ($result->num_rows === 0) {
            return [
                'success' => false,
                'error' => 'No se encontró el fichaje con ID: ' . $idRegistro
            ];
        }
        
        // Construir la consulta de actualización dinámicamente
        $updateFields = [];
        $types = "";
        $values = [];
        
        // Mapeo de campos frontend->backend
        $fieldsMapping = [
            'fecha' => 'fecha',
            'horaInicio' => 'horaInicio',
            'horaFin' => 'horaFin',
            'estado' => 'estado'
        ];
        
        foreach ($fieldsMapping as $frontField => $dbField) {
            if (isset($datos[$frontField])) {
                $updateFields[] = "$dbField = ?";
                $types .= "s"; // Todos son strings
                $values[] = $datos[$frontField];
            }
        }
        
        // Si no hay campos para actualizar
        if (empty($updateFields)) {
            return [
                'success' => false,
                'error' => 'No se proporcionaron datos para actualizar'
            ];
        }
        
        // Agregar el ID al final de los parámetros
        $types .= "i";
        $values[] = $idRegistro;
        
        // Crear y ejecutar la consulta
        $updateQuery = "UPDATE registros SET " . implode(", ", $updateFields) . " WHERE idRegistro = ?";
        $updateStmt = $this->conn->prepare($updateQuery);
        
        if ($updateStmt === false) {
            return [
                'success' => false,
                'error' => 'Error en la consulta de actualización: ' . $this->conn->error
            ];
        }
        
        // Enlazar parámetros dinámicamente
        $updateStmt->bind_param($types, ...$values);
        
        if ($updateStmt->execute()) {
            // Registrar en log la actualización exitosa
            error_log("Fichaje actualizado con éxito. ID: $idRegistro, Datos: " . json_encode($datos));
            
            return [
                'success' => true,
                'message' => 'Fichaje actualizado correctamente'
            ];
        } else {
            error_log("Error al actualizar fichaje. ID: $idRegistro, Error: " . $updateStmt->error);
            
            return [
                'success' => false,
                'error' => 'Error al actualizar: ' . $updateStmt->error
            ];
        }
    }
    
    // Eliminar un fichaje
    public function eliminarFichaje($idRegistro) {
        // Verificar que el fichaje existe
        $checkQuery = "SELECT * FROM registros WHERE idRegistro = ?";
        $checkStmt = $this->conn->prepare($checkQuery);
        
        if ($checkStmt === false) {
            return [
                'success' => false,
                'error' => 'Error en la consulta: ' . $this->conn->error
            ];
        }
        
        $checkStmt->bind_param("i", $idRegistro);
        $checkStmt->execute();
        $result = $checkStmt->get_result();
        
        if ($result->num_rows === 0) {
            return [
                'success' => false,
                'error' => 'No se encontró el fichaje con ID: ' . $idRegistro
            ];
        }
        
        // Eliminar el fichaje
        $deleteQuery = "DELETE FROM registros WHERE idRegistro = ?";
        $deleteStmt = $this->conn->prepare($deleteQuery);
        
        if ($deleteStmt === false) {
            return [
                'success' => false,
                'error' => 'Error en la consulta de eliminación: ' . $this->conn->error
            ];
        }
        
        $deleteStmt->bind_param("i", $idRegistro);
        
        if ($deleteStmt->execute()) {
            // Registrar en log la eliminación exitosa
            error_log("Fichaje eliminado con éxito. ID: $idRegistro");
            
            return [
                'success' => true,
                'message' => 'Fichaje eliminado correctamente'
            ];
        } else {
            error_log("Error al eliminar fichaje. ID: $idRegistro, Error: " . $deleteStmt->error);
            
            return [
                'success' => false,
                'error' => 'Error al eliminar: ' . $deleteStmt->error
            ];
        }
    }
}
?>
