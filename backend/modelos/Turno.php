<?php
include_once "bd.php";

class Turno {
    private $database;
    private $conn;
    private $table_name = "turnos";
    
    // Constructor con conexión a la base de datos
    public function __construct() {
        $this->database = new db();
        $this->conn = $this->database->getConn();
    }
    
    /**
     * Obtener todos los turnos de un usuario
     * @param string $nif NIF del usuario
     * @param bool $incluir_inactivos Si se deben incluir turnos inactivos
     * @return array Resultado de la operación
     */
    public function getTurnosByUsuario($nif, $incluir_inactivos = false) {
        // Construir la consulta base
        $query = "SELECT t.*, h.nombre as nombre_horario, h.hora_inicio, h.hora_fin 
                 FROM {$this->table_name} t
                 JOIN horarios h ON t.id_horario = h.id
                 WHERE t.nif_usuario = ?";
        
        // Si no se incluyen inactivos, filtrar solo activos
        if (!$incluir_inactivos) {
            $query .= " AND t.activo = 1";
        }
        
        // Ordenar por activo descendente (activos primero) y luego por orden
        $query .= " ORDER BY t.activo DESC, t.orden ASC";
                 
        $stmt = $this->conn->prepare($query);
        $stmt->bind_param("s", $nif);
        $stmt->execute();
        $result = $stmt->get_result();
        
        $turnos = [];
        while ($row = $result->fetch_assoc()) {
            $turnos[] = $row;
        }
        
        return [
            'success' => true,
            'turnos' => $turnos
        ];
    }
    
    /**
     * Crear un nuevo turno para un usuario
     * @param array $datos Datos del turno a crear
     * @return array Resultado de la operación
     */
    public function crear($datos) {
        // Validar datos requeridos
        if (!isset($datos['nif_usuario']) || !isset($datos['id_horario']) || !isset($datos['orden'])) {
            return [
                'success' => false,
                'error' => 'Faltan datos requeridos (nif_usuario, id_horario, orden)'
            ];
        }
        
        // Verificar que no haya solapamientos de horarios
        $solapamiento = $this->verificarSolapamientoHorarios($datos);
        if ($solapamiento['existe']) {
            return [
                'success' => false,
                'error' => 'El usuario ya tiene un turno asignado que coincide con este horario: ' . $solapamiento['detalle'],
                'horario_conflicto' => $solapamiento['horario']
            ];
        }
        
        // Preparar la consulta
        $query = "INSERT INTO {$this->table_name} 
                  (nif_usuario, id_horario, orden, dias_semana, nombre, semanas_mes) 
                  VALUES (?, ?, ?, ?, ?, ?)";
        
        $stmt = $this->conn->prepare($query);
        
        if ($stmt === false) {
            error_log("Error en la preparación de la consulta: " . $this->conn->error);
            return [
                'success' => false,
                'error' => 'Error en la consulta: ' . $this->conn->error
            ];
        }
        
        // Valores por defecto
        $dias_semana = isset($datos['dias_semana']) ? $datos['dias_semana'] : '1,2,3,4,5';
        $nombre = isset($datos['nombre']) ? $datos['nombre'] : 'Turno ' . $datos['orden'];
        $semanas_mes = isset($datos['semanas_mes']) ? $datos['semanas_mes'] : '1,2,3,4,5';
        
        $stmt->bind_param("siisss", 
            $datos['nif_usuario'], 
            $datos['id_horario'], 
            $datos['orden'],
            $dias_semana,
            $nombre,
            $semanas_mes
        );
        
        if ($stmt->execute()) {
            $id_turno = $stmt->insert_id;
            return [
                'success' => true,
                'message' => 'Turno creado correctamente',
                'id' => $id_turno
            ];
        } else {
            return [
                'success' => false,
                'error' => 'Error al crear el turno: ' . $stmt->error
            ];
        }
    }
    
    /**
     * Actualizar un turno existente
     * @param int $id ID del turno
     * @param array $datos Datos a actualizar
     * @return array Resultado de la operación
     */
    public function actualizar($id, $datos) {
        // Verificar que el turno existe
        $query = "SELECT * FROM {$this->table_name} WHERE id = ?";
        $stmt = $this->conn->prepare($query);
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows === 0) {
            return [
                'success' => false,
                'error' => 'Turno no encontrado'
            ];
        }
        
        // Si se está cambiando el horario, verificar solapamientos
        if (isset($datos['id_horario'])) {
            $turno_actual = $result->fetch_assoc();
            $datos_verificacion = $datos;
            
            // Completar datos que no están siendo actualizados
            if (!isset($datos['nif_usuario'])) {
                $datos_verificacion['nif_usuario'] = $turno_actual['nif_usuario'];
            }
            
            // Verificar solapamiento excluyendo el turno actual
            $solapamiento = $this->verificarSolapamientoHorarios($datos_verificacion, $id);
            if ($solapamiento['existe']) {
                return [
                    'success' => false,
                    'error' => 'El usuario ya tiene un turno asignado que coincide con este horario: ' . $solapamiento['detalle'],
                    'horario_conflicto' => $solapamiento['horario']
                ];
            }
        }
        
        // Construir la consulta de actualización
        $sets = [];
        $types = "";
        $params = [];
        
        // Campos actualizables
        $campos = [
            'id_horario' => 'i',
            'orden' => 'i',
            'dias_semana' => 's',
            'nombre' => 's',
            'semanas_mes' => 's',
            'activo' => 'i'
        ];
        
        foreach ($campos as $campo => $tipo) {
            if (isset($datos[$campo])) {
                $sets[] = "$campo = ?";
                $types .= $tipo;
                $params[] = $datos[$campo];
            }
        }
        
        if (empty($sets)) {
            return [
                'success' => false,
                'error' => 'No hay datos para actualizar'
            ];
        }
        
        $query = "UPDATE {$this->table_name} SET " . implode(", ", $sets) . " WHERE id = ?";
        $types .= "i";
        $params[] = $id;
        
        $stmt = $this->conn->prepare($query);
        
        if ($stmt === false) {
            error_log("Error en la preparación de la consulta: " . $this->conn->error);
            return [
                'success' => false,
                'error' => 'Error en la consulta: ' . $this->conn->error
            ];
        }
        
        $stmt->bind_param($types, ...$params);
        
        if ($stmt->execute()) {
            return [
                'success' => true,
                'message' => 'Turno actualizado correctamente'
            ];
        } else {
            return [
                'success' => false,
                'error' => 'Error al actualizar el turno: ' . $stmt->error
            ];
        }
    }
    
    /**
     * Desactivar un turno (en lugar de eliminarlo)
     * @param int $id ID del turno
     * @return array Resultado de la operación
     */
    public function desactivar($id) {
        // Primero verificamos que el turno existe
        $query_check = "SELECT id FROM {$this->table_name} WHERE id = ?";
        $stmt_check = $this->conn->prepare($query_check);
        
        if ($stmt_check === false) {
            error_log("Error en la preparación de la consulta de verificación: " . $this->conn->error);
            return [
                'success' => false,
                'error' => 'Error en la consulta: ' . $this->conn->error
            ];
        }
        
        $stmt_check->bind_param("i", $id);
        $stmt_check->execute();
        $result = $stmt_check->get_result();
        
        if ($result->num_rows === 0) {
            return [
                'success' => false,
                'error' => 'Turno no encontrado'
            ];
        }
        
        // Desactivar el turno (en lugar de eliminarlo)
        $query = "UPDATE {$this->table_name} SET activo = 0 WHERE id = ?";
        
        $stmt = $this->conn->prepare($query);
        
        if ($stmt === false) {
            error_log("Error en la preparación de la consulta: " . $this->conn->error);
            return [
                'success' => false,
                'error' => 'Error en la consulta: ' . $this->conn->error
            ];
        }
        
        $stmt->bind_param("i", $id);
        
        if ($stmt->execute()) {
            if ($stmt->affected_rows > 0) {
                return [
                    'success' => true,
                    'message' => 'Turno desactivado correctamente'
                ];
            } else {
                return [
                    'success' => false,
                    'error' => 'No se pudo desactivar el turno'
                ];
            }
        } else {
            return [
                'success' => false,
                'error' => 'Error al desactivar el turno: ' . $stmt->error
            ];
        }
    }
    
    /**
     * Eliminar un turno (eliminación permanente)
     * @param int $id ID del turno
     * @return array Resultado de la operación
     */
    public function eliminar($id) {
        // Primero verificamos que el turno existe
        $query_check = "SELECT id FROM {$this->table_name} WHERE id = ?";
        $stmt_check = $this->conn->prepare($query_check);
        
        if ($stmt_check === false) {
            error_log("Error en la preparación de la consulta de verificación: " . $this->conn->error);
            return [
                'success' => false,
                'error' => 'Error en la consulta: ' . $this->conn->error
            ];
        }
        
        $stmt_check->bind_param("i", $id);
        $stmt_check->execute();
        $result = $stmt_check->get_result();
        
        if ($result->num_rows === 0) {
            return [
                'success' => false,
                'error' => 'Turno no encontrado'
            ];
        }
        
        // Eliminar el turno completamente de la base de datos
        $query = "DELETE FROM {$this->table_name} WHERE id = ?";
        
        $stmt = $this->conn->prepare($query);
        
        if ($stmt === false) {
            error_log("Error en la preparación de la consulta: " . $this->conn->error);
            return [
                'success' => false,
                'error' => 'Error en la consulta: ' . $this->conn->error
            ];
        }
        
        $stmt->bind_param("i", $id);
        
        if ($stmt->execute()) {
            // Verificar si realmente se eliminó alguna fila
            if ($stmt->affected_rows > 0) {
                return [
                    'success' => true,
                    'message' => 'Turno eliminado completamente de la base de datos'
                ];
            } else {
                return [
                    'success' => false,
                    'error' => 'No se pudo eliminar el turno, posiblemente ya fue eliminado'
                ];
            }
        } else {
            return [
                'success' => false,
                'error' => 'Error al eliminar el turno: ' . $stmt->error
            ];
        }
    }
    
    /**
     * Obtener el turno actual de un usuario
     * @param string $nif NIF del usuario
     * @return array Resultado de la operación
     */
    public function getTurnoActual($nif) {
        // Obtenemos día de la semana actual (1-7, donde 1 es lunes)
        $dia_semana = date('N');
        $hora_actual = date('H:i:s');
        
        // Obtener número de semana en el mes (1-5)
        $dia_del_mes = date('j');
        $semana_del_mes = ceil($dia_del_mes / 7);
        
        $query = "SELECT t.*, h.nombre as nombre_horario, h.hora_inicio, h.hora_fin 
                 FROM {$this->table_name} t
                 JOIN horarios h ON t.id_horario = h.id
                 WHERE t.nif_usuario = ? AND t.activo = 1
                 AND FIND_IN_SET(?, t.dias_semana) > 0
                 AND FIND_IN_SET(?, t.semanas_mes) > 0
                 AND ? BETWEEN h.hora_inicio AND h.hora_fin
                 ORDER BY t.orden ASC
                 LIMIT 1";
        
        $stmt = $this->conn->prepare($query);
        
        if ($stmt === false) {
            error_log("Error en la preparación de la consulta: " . $this->conn->error);
            return [
                'success' => false,
                'error' => 'Error en la consulta: ' . $this->conn->error
            ];
        }
        
        $stmt->bind_param("siis", $nif, $dia_semana, $semana_del_mes, $hora_actual);
        $stmt->execute();
        
        $result = $stmt->get_result();
        
        if ($result->num_rows > 0) {
            return [
                'success' => true,
                'turno' => $result->fetch_assoc(),
                'en_turno' => true
            ];
        } else {
            // Si no hay turno actual, buscar el próximo turno
            $query = "SELECT t.*, h.nombre as nombre_horario, h.hora_inicio, h.hora_fin 
                     FROM {$this->table_name} t
                     JOIN horarios h ON t.id_horario = h.id
                     WHERE t.nif_usuario = ? AND t.activo = 1
                     AND FIND_IN_SET(?, t.semanas_mes) > 0
                     AND (
                         (FIND_IN_SET(?, t.dias_semana) > 0 AND h.hora_inicio > ?)
                         OR
                         (FIND_IN_SET(?, t.dias_semana) > 0)
                     )
                     ORDER BY 
                        CASE WHEN FIND_IN_SET(?, t.dias_semana) > 0 THEN 0 ELSE 1 END,
                        CASE WHEN FIND_IN_SET(?, t.dias_semana) > 0 THEN h.hora_inicio END ASC,
                        t.orden ASC
                     LIMIT 1";
            
            $prox_dia_semana = $dia_semana % 7 + 1; // Siguiente día
            
            $stmt = $this->conn->prepare($query);
            $stmt->bind_param("ississii", $nif, $semana_del_mes, $dia_semana, $hora_actual, $prox_dia_semana, $dia_semana, $dia_semana);
            $stmt->execute();
            
            $result = $stmt->get_result();
            
            if ($result->num_rows > 0) {
                return [
                    'success' => true,
                    'turno' => $result->fetch_assoc(),
                    'en_turno' => false
                ];
            } else {
                return [
                    'success' => false,
                    'error' => 'No se encontraron turnos para este usuario'
                ];
            }
        }
    }
    
    /**
     * Reactivar un turno inactivo
     * @param int $id ID del turno
     * @return array Resultado de la operación
     */
    public function reactivar($id) {
        // Verificar que el turno existe y está inactivo
        $query_check = "SELECT id FROM {$this->table_name} WHERE id = ? AND activo = 0";
        $stmt_check = $this->conn->prepare($query_check);
        
        if ($stmt_check === false) {
            error_log("Error en la preparación de la consulta de verificación: " . $this->conn->error);
            return [
                'success' => false,
                'error' => 'Error en la consulta: ' . $this->conn->error
            ];
        }
        
        $stmt_check->bind_param("i", $id);
        $stmt_check->execute();
        $result = $stmt_check->get_result();
        
        if ($result->num_rows === 0) {
            return [
                'success' => false,
                'error' => 'Turno no encontrado o ya está activo'
            ];
        }
        
        // Reactivar el turno
        $query = "UPDATE {$this->table_name} SET activo = 1 WHERE id = ?";
        
        $stmt = $this->conn->prepare($query);
        
        if ($stmt === false) {
            error_log("Error en la preparación de la consulta: " . $this->conn->error);
            return [
                'success' => false,
                'error' => 'Error en la consulta: ' . $this->conn->error
            ];
        }
        
        $stmt->bind_param("i", $id);
        
        if ($stmt->execute()) {
            if ($stmt->affected_rows > 0) {
                return [
                    'success' => true,
                    'message' => 'Turno reactivado correctamente'
                ];
            } else {
                return [
                    'success' => false,
                    'error' => 'No se pudo reactivar el turno'
                ];
            }
        } else {
            return [
                'success' => false,
                'error' => 'Error al reactivar el turno: ' . $stmt->error
            ];
        }
    }
    
    /**
     * Buscar turno inactivo similar
     * @param array $datos Datos del turno a buscar
     * @return array Resultado de la operación
     */
    public function buscarTurnoInactivoSimilar($datos) {
        if (!isset($datos['nif_usuario']) || !isset($datos['id_horario']) || 
            !isset($datos['dias_semana']) || !isset($datos['semanas_mes'])) {
            return [
                'success' => false,
                'error' => 'Faltan datos requeridos para buscar turno similar'
            ];
        }
        
        // Buscar turno inactivo con los mismos parámetros
        $query = "SELECT t.*, h.nombre as nombre_horario, h.hora_inicio, h.hora_fin 
                 FROM {$this->table_name} t
                 JOIN horarios h ON t.id_horario = h.id
                 WHERE t.nif_usuario = ? AND t.id_horario = ? 
                 AND t.dias_semana = ? AND t.semanas_mes = ? AND t.activo = 0";
        
        $stmt = $this->conn->prepare($query);
        
        if ($stmt === false) {
            error_log("Error en la preparación de la consulta: " . $this->conn->error);
            return [
                'success' => false,
                'error' => 'Error en la consulta: ' . $this->conn->error
            ];
        }
        
        $stmt->bind_param("ssss", 
            $datos['nif_usuario'], 
            $datos['id_horario'], 
            $datos['dias_semana'], 
            $datos['semanas_mes']
        );
        
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows > 0) {
            $turno = $result->fetch_assoc();
            return [
                'success' => true,
                'encontrado' => true,
                'turno' => $turno
            ];
        } else {
            return [
                'success' => true,
                'encontrado' => false
            ];
        }
    }
    
    /**
     * Eliminar turnos inactivos de un usuario
     * @param string $nif NIF del usuario
     * @return array Resultado de la operación
     */
    public function eliminarTurnosInactivos($nif = null) {
        // Construir la consulta de eliminación
        $query = "DELETE FROM {$this->table_name} WHERE activo = 0";
        $types = "";
        $params = [];
        
        // Si se proporciona un NIF, limitar la eliminación a ese usuario
        if ($nif !== null) {
            $query .= " AND nif_usuario = ?";
            $types .= "s";
            $params[] = $nif;
        }
        
        $stmt = $this->conn->prepare($query);
        
        if ($stmt === false) {
            error_log("Error en la preparación de la consulta: " . $this->conn->error);
            return [
                'success' => false,
                'error' => 'Error en la consulta: ' . $this->conn->error
            ];
        }
        
        // Vincular parámetros si hay alguno
        if (!empty($params)) {
            $stmt->bind_param($types, ...$params);
        }
        
        if ($stmt->execute()) {
            $filas_afectadas = $stmt->affected_rows;
            return [
                'success' => true,
                'message' => 'Se han eliminado ' . $filas_afectadas . ' turnos inactivos',
                'turnos_eliminados' => $filas_afectadas
            ];
        } else {
            return [
                'success' => false,
                'error' => 'Error al eliminar turnos inactivos: ' . $stmt->error
            ];
        }
    }
    
    /**
     * Verificar si hay solapamiento de horarios para un usuario
     * @param array $datos Datos del turno a verificar
     * @param int $turno_id_excluir ID del turno a excluir de la verificación (para actualizaciones)
     * @return array Resultado de la verificación
     */
    private function verificarSolapamientoHorarios($datos, $turno_id_excluir = null) {
        $nif_usuario = $datos['nif_usuario'];
        $id_horario = $datos['id_horario'];
        $dias_semana = isset($datos['dias_semana']) ? $datos['dias_semana'] : '1,2,3,4,5';
        $semanas_mes = isset($datos['semanas_mes']) ? $datos['semanas_mes'] : '1,2,3,4,5';
        
        // Obtener información del horario que se quiere asignar
        $query_horario = "SELECT * FROM horarios WHERE id = ?";
        $stmt_horario = $this->conn->prepare($query_horario);
        $stmt_horario->bind_param("i", $id_horario);
        $stmt_horario->execute();
        $result_horario = $stmt_horario->get_result();
        
        if ($result_horario->num_rows === 0) {
            return ['existe' => false]; // El horario no existe, se manejará en otra validación
        }
        
        $horario_nuevo = $result_horario->fetch_assoc();
        $hora_inicio_nuevo = $horario_nuevo['hora_inicio'];
        $hora_fin_nuevo = $horario_nuevo['hora_fin'];
        
        // Consulta para buscar turnos que puedan solaparse
        $query = "SELECT t.*, h.nombre as nombre_horario, h.hora_inicio, h.hora_fin 
                 FROM {$this->table_name} t
                 JOIN horarios h ON t.id_horario = h.id
                 WHERE t.nif_usuario = ? AND t.activo = 1";
        
        // Si estamos actualizando, excluir el turno actual
        if ($turno_id_excluir !== null) {
            $query .= " AND t.id != ?";
        }
        
        $stmt = $this->conn->prepare($query);
        
        if ($turno_id_excluir !== null) {
            $stmt->bind_param("si", $nif_usuario, $turno_id_excluir);
        } else {
            $stmt->bind_param("s", $nif_usuario);
        }
        
        $stmt->execute();
        $result = $stmt->get_result();
        
        while ($turno_existente = $result->fetch_assoc()) {
            // Verificar si hay solapamiento de días
            $dias_existente = explode(',', $turno_existente['dias_semana']);
            $dias_nuevo = explode(',', $dias_semana);
            $dias_comunes = array_intersect($dias_existente, $dias_nuevo);
            
            if (empty($dias_comunes)) {
                continue; // No hay días comunes, no puede haber solapamiento
            }
            
            // Verificar si hay solapamiento de semanas
            $semanas_existente = explode(',', $turno_existente['semanas_mes']);
            $semanas_nuevo = explode(',', $semanas_mes);
            $semanas_comunes = array_intersect($semanas_existente, $semanas_nuevo);
            
            if (empty($semanas_comunes)) {
                continue; // No hay semanas comunes, no puede haber solapamiento
            }
            
            // Verificar solapamiento de horas
            $hora_inicio_existente = $turno_existente['hora_inicio'];
            $hora_fin_existente = $turno_existente['hora_fin'];
            
            // Hay solapamiento si:
            // 1. La hora de inicio del nuevo está dentro del rango del existente
            // 2. La hora de fin del nuevo está dentro del rango del existente
            // 3. El nuevo turno engloba completamente al existente
            if (($hora_inicio_nuevo >= $hora_inicio_existente && $hora_inicio_nuevo < $hora_fin_existente) ||
                ($hora_fin_nuevo > $hora_inicio_existente && $hora_fin_nuevo <= $hora_fin_existente) ||
                ($hora_inicio_nuevo <= $hora_inicio_existente && $hora_fin_nuevo >= $hora_fin_existente)) {
                
                return [
                    'existe' => true,
                    'detalle' => "{$turno_existente['nombre_horario']} ({$hora_inicio_existente} - {$hora_fin_existente})",
                    'horario' => $turno_existente
                ];
            }
        }
        
        return ['existe' => false];
    }
}

?>
