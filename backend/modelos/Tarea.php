<?php
require_once "bd.php";

class Tarea extends db {
    private $tableName = "tareas";
    
    public function __construct() {
        parent::__construct();
        $this->crearTablasiNoExiste();
    }
    
    /**
     * Crea la tabla de tareas si no existe
     */
    private function crearTablasiNoExiste() {
        $sql = "CREATE TABLE IF NOT EXISTS $this->tableName (
            id INT AUTO_INCREMENT PRIMARY KEY,
            titulo VARCHAR(255) NOT NULL,
            descripcion TEXT,
            estado ENUM('pendiente', 'en_progreso', 'completada', 'cancelada') DEFAULT 'pendiente',
            prioridad ENUM('baja', 'media', 'alta') DEFAULT 'media',
            fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
            fecha_vencimiento DATE NULL,
            fecha_completada DATETIME NULL,
            NIF_creador VARCHAR(15) NOT NULL,
            NIF_asignado VARCHAR(15) NOT NULL,
            departamento VARCHAR(100) NULL,
            FOREIGN KEY (NIF_creador) REFERENCES usuarios(NIF),
            FOREIGN KEY (NIF_asignado) REFERENCES usuarios(NIF),
            INDEX idx_nif_asignado (NIF_asignado),
            INDEX idx_departamento (departamento),
            INDEX idx_estado (estado),
            INDEX idx_fecha_vencimiento (fecha_vencimiento)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci";
        
        try {
            $this->getConn()->query($sql);
        } catch (Exception $e) {
            error_log("Error al crear la tabla de tareas: " . $e->getMessage());
        }
    }
    
    /**
     * Obtiene el nombre de la tabla
     */
    public function getTableName() {
        return $this->tableName;
    }
    
    /**
     * Crea una nueva tarea
     * 
     * @param string $titulo Título de la tarea
     * @param string $descripcion Descripción de la tarea
     * @param string $estado Estado de la tarea
     * @param string $prioridad Prioridad de la tarea
     * @param string $fecha_vencimiento Fecha de vencimiento (formato Y-m-d)
     * @param string $NIF_creador NIF del usuario que crea la tarea
     * @param string $NIF_asignado NIF del usuario al que se asigna la tarea
     * @param string $departamento Departamento al que pertenece la tarea
     * @return array Resultado de la operación
     */
    public function crearTarea($titulo, $descripcion, $estado, $prioridad, $fecha_vencimiento, $NIF_creador, $NIF_asignado, $departamento = null) {
        try {
            $sql = "INSERT INTO $this->tableName (titulo, descripcion, estado, prioridad, fecha_vencimiento, NIF_creador, NIF_asignado, departamento) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
            
            $stmt = $this->getConn()->prepare($sql);
            $stmt->bind_param("ssssssss", $titulo, $descripcion, $estado, $prioridad, $fecha_vencimiento, $NIF_creador, $NIF_asignado, $departamento);
            
            if ($stmt->execute()) {
                $id = $stmt->insert_id;
                return ["success" => true, "message" => "Tarea creada con éxito", "id" => $id];
            } else {
                return ["success" => false, "message" => "Error al crear la tarea: " . $stmt->error];
            }
        } catch (Exception $e) {
            error_log("Error al crear tarea: " . $e->getMessage());
            return ["success" => false, "message" => "Error al crear la tarea"];
        }
    }
    
    /**
     * Actualiza una tarea existente
     * 
     * @param int $id ID de la tarea
     * @param array $datos Datos a actualizar
     * @return array Resultado de la operación
     */
    public function actualizarTarea($id, $datos) {
        try {
            // Construir la consulta dinámicamente basada en los campos proporcionados
            $setClauses = [];
            $paramTypes = "";
            $paramValues = [];
            
            // Mapeo de campos permitidos para actualizar
            $camposPermitidos = [
                'titulo' => 's',
                'descripcion' => 's',
                'estado' => 's',
                'prioridad' => 's',
                'fecha_vencimiento' => 's',
                'fecha_completada' => 's',
                'NIF_asignado' => 's',
                'departamento' => 's'
            ];
            
            // Si el estado cambia a 'completada', establecer la fecha de completado
            if (isset($datos['estado']) && $datos['estado'] === 'completada' && !isset($datos['fecha_completada'])) {
                $datos['fecha_completada'] = date('Y-m-d H:i:s');
            }
            
            // Construir las cláusulas SET y los parámetros
            foreach ($datos as $campo => $valor) {
                if (array_key_exists($campo, $camposPermitidos)) {
                    $setClauses[] = "$campo = ?";
                    $paramTypes .= $camposPermitidos[$campo];
                    $paramValues[] = $valor;
                }
            }
            
            // Si no hay campos para actualizar, retornar
            if (empty($setClauses)) {
                return ["success" => false, "message" => "No se proporcionaron campos válidos para actualizar"];
            }
            
            // Añadir el ID a los parámetros
            $paramTypes .= "i";
            $paramValues[] = $id;
            
            // Construir la consulta SQL
            $sql = "UPDATE $this->tableName SET " . implode(", ", $setClauses) . " WHERE id = ?";
            
            // Preparar y ejecutar la consulta
            $stmt = $this->getConn()->prepare($sql);
            
            // Bind de parámetros dinámicamente
            $stmt->bind_param($paramTypes, ...$paramValues);
            
            if ($stmt->execute()) {
                return ["success" => true, "message" => "Tarea actualizada con éxito"];
            } else {
                return ["success" => false, "message" => "Error al actualizar la tarea: " . $stmt->error];
            }
        } catch (Exception $e) {
            error_log("Error al actualizar tarea: " . $e->getMessage());
            return ["success" => false, "message" => "Error al actualizar la tarea"];
        }
    }
    
    /**
     * Elimina una tarea
     * 
     * @param int $id ID de la tarea
     * @return array Resultado de la operación
     */
    public function eliminarTarea($id) {
        try {
            $sql = "DELETE FROM $this->tableName WHERE id = ?";
            $stmt = $this->getConn()->prepare($sql);
            $stmt->bind_param("i", $id);
            
            if ($stmt->execute()) {
                return ["success" => true, "message" => "Tarea eliminada con éxito"];
            } else {
                return ["success" => false, "message" => "Error al eliminar la tarea: " . $stmt->error];
            }
        } catch (Exception $e) {
            error_log("Error al eliminar tarea: " . $e->getMessage());
            return ["success" => false, "message" => "Error al eliminar la tarea"];
        }
    }
    
    /**
     * Obtiene una tarea por su ID
     * 
     * @param int $id ID de la tarea
     * @return array|null Datos de la tarea o null si no existe
     */
    public function obtenerTareaPorId($id) {
        try {
            $sql = "SELECT t.*, 
                    u_creador.nombre as nombre_creador, u_creador.apellidos as apellidos_creador,
                    u_asignado.nombre as nombre_asignado, u_asignado.apellidos as apellidos_asignado
                    FROM $this->tableName t
                    LEFT JOIN usuarios u_creador ON t.NIF_creador = u_creador.NIF
                    LEFT JOIN usuarios u_asignado ON t.NIF_asignado = u_asignado.NIF
                    WHERE t.id = ?";
            
            $stmt = $this->getConn()->prepare($sql);
            $stmt->bind_param("i", $id);
            $stmt->execute();
            $result = $stmt->get_result();
            
            if ($result->num_rows > 0) {
                return $result->fetch_assoc();
            } else {
                return null;
            }
        } catch (Exception $e) {
            error_log("Error al obtener tarea por ID: " . $e->getMessage());
            return null;
        }
    }
    
    /**
     * Obtiene las tareas de un usuario específico
     * 
     * @param string $NIF NIF del usuario
     * @param array $filtros Filtros opcionales (estado, prioridad, etc.)
     * @return array Lista de tareas
     */
    public function obtenerTareasPorUsuario($NIF, $filtros = []) {
        try {
            $condiciones = ["t.NIF_asignado = ?"];
            $paramTypes = "s";
            $paramValues = [$NIF];
            
            // Aplicar filtros adicionales
            if (!empty($filtros)) {
                if (isset($filtros['estado']) && !empty($filtros['estado'])) {
                    $condiciones[] = "t.estado = ?";
                    $paramTypes .= "s";
                    $paramValues[] = $filtros['estado'];
                }
                
                if (isset($filtros['prioridad']) && !empty($filtros['prioridad'])) {
                    $condiciones[] = "t.prioridad = ?";
                    $paramTypes .= "s";
                    $paramValues[] = $filtros['prioridad'];
                }
                
                if (isset($filtros['fecha_desde']) && !empty($filtros['fecha_desde'])) {
                    $condiciones[] = "t.fecha_vencimiento >= ?";
                    $paramTypes .= "s";
                    $paramValues[] = $filtros['fecha_desde'];
                }
                
                if (isset($filtros['fecha_hasta']) && !empty($filtros['fecha_hasta'])) {
                    $condiciones[] = "t.fecha_vencimiento <= ?";
                    $paramTypes .= "s";
                    $paramValues[] = $filtros['fecha_hasta'];
                }
            }
            
            $whereClause = implode(" AND ", $condiciones);
            
            $sql = "SELECT t.*, 
                    u_creador.nombre as nombre_creador, u_creador.apellidos as apellidos_creador,
                    u_asignado.nombre as nombre_asignado, u_asignado.apellidos as apellidos_asignado
                    FROM $this->tableName t
                    LEFT JOIN usuarios u_creador ON t.NIF_creador = u_creador.NIF
                    LEFT JOIN usuarios u_asignado ON t.NIF_asignado = u_asignado.NIF
                    WHERE $whereClause
                    ORDER BY 
                        CASE t.prioridad 
                            WHEN 'alta' THEN 1 
                            WHEN 'media' THEN 2 
                            WHEN 'baja' THEN 3 
                        END,
                        CASE 
                            WHEN t.fecha_vencimiento IS NULL THEN 1
                            ELSE 0
                        END,
                        t.fecha_vencimiento ASC,
                        t.fecha_creacion DESC";
            
            $stmt = $this->getConn()->prepare($sql);
            $stmt->bind_param($paramTypes, ...$paramValues);
            $stmt->execute();
            $result = $stmt->get_result();
            
            $tareas = [];
            while ($row = $result->fetch_assoc()) {
                $tareas[] = $row;
            }
            
            return $tareas;
        } catch (Exception $e) {
            error_log("Error al obtener tareas por usuario: " . $e->getMessage());
            return [];
        }
    }
    
    /**
     * Obtiene las tareas del departamento de un usuario
     * 
     * @param string $departamento Nombre del departamento
     * @param array $filtros Filtros opcionales (estado, prioridad, etc.)
     * @return array Lista de tareas
     */
    public function obtenerTareasPorDepartamento($departamento, $filtros = []) {
        try {
            $condiciones = ["t.departamento = ?"];
            $paramTypes = "s";
            $paramValues = [$departamento];
            
            // Aplicar filtros adicionales
            if (!empty($filtros)) {
                if (isset($filtros['estado']) && !empty($filtros['estado'])) {
                    $condiciones[] = "t.estado = ?";
                    $paramTypes .= "s";
                    $paramValues[] = $filtros['estado'];
                }
                
                if (isset($filtros['prioridad']) && !empty($filtros['prioridad'])) {
                    $condiciones[] = "t.prioridad = ?";
                    $paramTypes .= "s";
                    $paramValues[] = $filtros['prioridad'];
                }
                
                if (isset($filtros['fecha_desde']) && !empty($filtros['fecha_desde'])) {
                    $condiciones[] = "t.fecha_vencimiento >= ?";
                    $paramTypes .= "s";
                    $paramValues[] = $filtros['fecha_desde'];
                }
                
                if (isset($filtros['fecha_hasta']) && !empty($filtros['fecha_hasta'])) {
                    $condiciones[] = "t.fecha_vencimiento <= ?";
                    $paramTypes .= "s";
                    $paramValues[] = $filtros['fecha_hasta'];
                }
                
                if (isset($filtros['NIF_asignado']) && !empty($filtros['NIF_asignado'])) {
                    $condiciones[] = "t.NIF_asignado = ?";
                    $paramTypes .= "s";
                    $paramValues[] = $filtros['NIF_asignado'];
                }
            }
            
            $whereClause = implode(" AND ", $condiciones);
            
            $sql = "SELECT t.*, 
                    u_creador.nombre as nombre_creador, u_creador.apellidos as apellidos_creador,
                    u_asignado.nombre as nombre_asignado, u_asignado.apellidos as apellidos_asignado
                    FROM $this->tableName t
                    LEFT JOIN usuarios u_creador ON t.NIF_creador = u_creador.NIF
                    LEFT JOIN usuarios u_asignado ON t.NIF_asignado = u_asignado.NIF
                    WHERE $whereClause
                    ORDER BY 
                        CASE t.prioridad 
                            WHEN 'alta' THEN 1 
                            WHEN 'media' THEN 2 
                            WHEN 'baja' THEN 3 
                        END,
                        CASE 
                            WHEN t.fecha_vencimiento IS NULL THEN 1
                            ELSE 0
                        END,
                        t.fecha_vencimiento ASC,
                        t.fecha_creacion DESC";
            
            $stmt = $this->getConn()->prepare($sql);
            $stmt->bind_param($paramTypes, ...$paramValues);
            $stmt->execute();
            $result = $stmt->get_result();
            
            $tareas = [];
            while ($row = $result->fetch_assoc()) {
                $tareas[] = $row;
            }
            
            return $tareas;
        } catch (Exception $e) {
            error_log("Error al obtener tareas por departamento: " . $e->getMessage());
            return [];
        }
    }
    
    /**
     * Obtiene las estadísticas de tareas de un usuario
     * 
     * @param string $NIF NIF del usuario
     * @return array Estadísticas de tareas
     */
    public function obtenerEstadisticasTareas($NIF) {
        try {
            // Validar que la conexión esté disponible
            if (!$this->getConn()) {
                error_log("Error de conexión a la base de datos en obtenerEstadisticasTareas");
                return [
                    'total' => 0,
                    'pendientes' => 0,
                    'en_progreso' => 0,
                    'completadas' => 0,
                    'canceladas' => 0,
                    'prioridad_alta' => 0,
                    'prioridad_media' => 0,
                    'prioridad_baja' => 0,
                    'vencidas' => 0
                ];
            }
            
            // Validar el parámetro NIF
            if (empty($NIF)) {
                error_log("NIF no válido en obtenerEstadisticasTareas");
                return [
                    'total' => 0,
                    'pendientes' => 0,
                    'en_progreso' => 0,
                    'completadas' => 0,
                    'canceladas' => 0,
                    'prioridad_alta' => 0,
                    'prioridad_media' => 0,
                    'prioridad_baja' => 0,
                    'vencidas' => 0
                ];
            }
            
            $sql = "SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN estado = 'pendiente' THEN 1 ELSE 0 END) as pendientes,
                    SUM(CASE WHEN estado = 'en_progreso' THEN 1 ELSE 0 END) as en_progreso,
                    SUM(CASE WHEN estado = 'completada' THEN 1 ELSE 0 END) as completadas,
                    SUM(CASE WHEN estado = 'cancelada' THEN 1 ELSE 0 END) as canceladas,
                    SUM(CASE WHEN prioridad = 'alta' THEN 1 ELSE 0 END) as prioridad_alta,
                    SUM(CASE WHEN prioridad = 'media' THEN 1 ELSE 0 END) as prioridad_media,
                    SUM(CASE WHEN prioridad = 'baja' THEN 1 ELSE 0 END) as prioridad_baja,
                    SUM(CASE WHEN fecha_vencimiento < CURDATE() AND estado NOT IN ('completada', 'cancelada') THEN 1 ELSE 0 END) as vencidas
                    FROM $this->tableName
                    WHERE NIF_asignado = ?";
            
            $stmt = $this->getConn()->prepare($sql);
            if (!$stmt) {
                error_log("Error al preparar la consulta: " . $this->getConn()->error);
                return [
                    'total' => 0,
                    'pendientes' => 0,
                    'en_progreso' => 0,
                    'completadas' => 0,
                    'canceladas' => 0,
                    'prioridad_alta' => 0,
                    'prioridad_media' => 0,
                    'prioridad_baja' => 0,
                    'vencidas' => 0
                ];
            }
            
            $stmt->bind_param("s", $NIF);
            if (!$stmt->execute()) {
                error_log("Error al ejecutar la consulta: " . $stmt->error);
                return [
                    'total' => 0,
                    'pendientes' => 0,
                    'en_progreso' => 0,
                    'completadas' => 0,
                    'canceladas' => 0,
                    'prioridad_alta' => 0,
                    'prioridad_media' => 0,
                    'prioridad_baja' => 0,
                    'vencidas' => 0
                ];
            }
            
            $result = $stmt->get_result();
            if (!$result) {
                error_log("Error al obtener resultados: " . $stmt->error);
                return [
                    'total' => 0,
                    'pendientes' => 0,
                    'en_progreso' => 0,
                    'completadas' => 0,
                    'canceladas' => 0,
                    'prioridad_alta' => 0,
                    'prioridad_media' => 0,
                    'prioridad_baja' => 0,
                    'vencidas' => 0
                ];
            }
            
            if ($result->num_rows > 0) {
                $estadisticas = $result->fetch_assoc();
                
                // Asegurar que todos los campos numéricos sean enteros
                foreach ($estadisticas as $key => $value) {
                    $estadisticas[$key] = (int)$value;
                }
                
                return $estadisticas;
            } else {
                return [
                    'total' => 0,
                    'pendientes' => 0,
                    'en_progreso' => 0,
                    'completadas' => 0,
                    'canceladas' => 0,
                    'prioridad_alta' => 0,
                    'prioridad_media' => 0,
                    'prioridad_baja' => 0,
                    'vencidas' => 0
                ];
            }
        } catch (Exception $e) {
            error_log("Error al obtener estadísticas de tareas: " . $e->getMessage());
            // Devolver un objeto de estadísticas vacío en lugar de lanzar la excepción
            return [
                'total' => 0,
                'pendientes' => 0,
                'en_progreso' => 0,
                'completadas' => 0,
                'canceladas' => 0,
                'prioridad_alta' => 0,
                'prioridad_media' => 0,
                'prioridad_baja' => 0,
                'vencidas' => 0
            ];
        }
    }
}
?>
