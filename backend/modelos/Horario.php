<?php
    include_once "bd.php";

class Horario {
    private $database;
    private $conn;
    private $table_name = "horarios";
    
    // Constructor con conexión a la base de datos
    public function __construct() {
        $this->database = new db();
        $this->conn = $this->database->getConn();
    }
    
    /**
     * Obtener todos los horarios
     * @return array Resultado de la operación
     */
    public function getHorarios() {
        // Se eliminó la condición WHERE activo = 1 para mostrar todos los horarios
        $query = "SELECT * FROM {$this->table_name} ORDER BY nombre ASC";
        
        $result = $this->conn->query($query);
        
        if ($result === false) {
            // Verificar si la tabla existe
            $check_table = "SHOW TABLES LIKE '{$this->table_name}'";
            $table_exists = $this->conn->query($check_table);
            
            if ($table_exists && $table_exists->num_rows == 0) {
                error_log("La tabla de horarios no existe");
                return [
                    'success' => false,
                    'error' => 'La tabla de horarios no existe en la base de datos'
                ];
            }
            
            error_log("Error al obtener horarios: " . $this->conn->error);
            return [
                'success' => false,
                'error' => 'Error al obtener horarios: ' . $this->conn->error
            ];
        }
        
        $horarios = [];
        while ($row = $result->fetch_assoc()) {
            $horarios[] = $row;
        }
        
        return [
            'success' => true,
            'horarios' => $horarios
        ];
    }
    
    /**
     * Obtener un horario por su ID
     * @param int $id ID del horario
     * @return array Resultado de la operación
     */
    public function getHorarioById($id) {
        $query = "SELECT * FROM {$this->table_name} WHERE id = ?";
        
        $stmt = $this->conn->prepare($query);
        
        if ($stmt === false) {
            error_log("Error en la preparación de la consulta: " . $this->conn->error);
            return [
                'success' => false,
                'error' => 'Error en la consulta: ' . $this->conn->error
            ];
        }
        
        $stmt->bind_param("i", $id);
        $stmt->execute();
        
        $result = $stmt->get_result();
        
        if ($result->num_rows > 0) {
            return [
                'success' => true,
                'horario' => $result->fetch_assoc()
            ];
        } else {
            return [
                'success' => false,
                'error' => 'Horario no encontrado'
            ];
        }
    }
    
    /**
     * Crear un nuevo horario
     * @param array $datos Datos del horario a crear
     * @return array Resultado de la operación
     */
    public function crear($datos) {
        // Validar datos requeridos
        if (!isset($datos['nombre']) || !isset($datos['hora_inicio']) || !isset($datos['hora_fin'])) {
            return [
                'success' => false,
                'error' => 'Faltan datos requeridos (nombre, hora_inicio, hora_fin)'
            ];
        }
        
        // Preparar la consulta
        $query = "INSERT INTO {$this->table_name} 
                  (nombre, descripcion, hora_inicio, hora_fin, lunes, martes, miercoles, jueves, viernes, sabado, domingo, tiempo_pausa_permitido) 
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        
        $stmt = $this->conn->prepare($query);
        
        if ($stmt === false) {
            error_log("Error en la preparación de la consulta: " . $this->conn->error);
            return [
                'success' => false,
                'error' => 'Error en la consulta: ' . $this->conn->error
            ];
        }
        
        // Establecer valores por defecto para campos opcionales
        $descripcion = isset($datos['descripcion']) ? $datos['descripcion'] : null;
        $lunes = isset($datos['lunes']) ? $datos['lunes'] : 1;
        $martes = isset($datos['martes']) ? $datos['martes'] : 1;
        $miercoles = isset($datos['miercoles']) ? $datos['miercoles'] : 1;
        $jueves = isset($datos['jueves']) ? $datos['jueves'] : 1;
        $viernes = isset($datos['viernes']) ? $datos['viernes'] : 1;
        $sabado = isset($datos['sabado']) ? $datos['sabado'] : 0;
        $domingo = isset($datos['domingo']) ? $datos['domingo'] : 0;
        $tiempo_pausa = isset($datos['tiempo_pausa_permitido']) ? $datos['tiempo_pausa_permitido'] : 60;
        
        // Vincular parámetros
        $stmt->bind_param("ssssiiiiiiis", 
            $datos['nombre'], 
            $descripcion, 
            $datos['hora_inicio'], 
            $datos['hora_fin'], 
            $lunes, 
            $martes, 
            $miercoles, 
            $jueves, 
            $viernes, 
            $sabado, 
            $domingo, 
            $tiempo_pausa
        );
        
        // Ejecutar la consulta
        if ($stmt->execute()) {
            $id = $this->conn->insert_id;
            return [
                'success' => true,
                'message' => 'Horario creado correctamente',
                'id' => $id
            ];
        } else {
            error_log("Error al crear horario: " . $stmt->error);
            return [
                'success' => false,
                'error' => 'Error al crear horario: ' . $stmt->error
            ];
        }
    }
    
    /**
     * Actualizar un horario existente
     * @param int $id ID del horario a actualizar
     * @param array $datos Datos del horario a actualizar
     * @return array Resultado de la operación
     */
    public function actualizar($id, $datos) {
        // Verificar que el horario existe
        $horario = $this->getHorarioById($id);
        if (!$horario['success']) {
            return $horario; // Devuelve el error de que no existe
        }
        
        // Construir la consulta dinámicamente basada en los campos proporcionados
        $campos = [];
        $tipos = "";
        $valores = [];
        
        // Mapeo de campos permitidos y sus tipos
        $campos_permitidos = [
            'nombre' => 's',
            'descripcion' => 's',
            'hora_inicio' => 's',
            'hora_fin' => 's',
            'lunes' => 'i',
            'martes' => 'i',
            'miercoles' => 'i',
            'jueves' => 'i',
            'viernes' => 'i',
            'sabado' => 'i',
            'domingo' => 'i',
            'tiempo_pausa_permitido' => 'i',
            'activo' => 'i'
        ];
        
        // Procesar cada campo proporcionado
        foreach ($datos as $campo => $valor) {
            if (array_key_exists($campo, $campos_permitidos)) {
                $campos[] = "{$campo} = ?";
                $tipos .= $campos_permitidos[$campo];
                $valores[] = $valor;
            }
        }
        
        // Si no hay campos para actualizar, devolver error
        if (empty($campos)) {
            return [
                'success' => false,
                'error' => 'No se proporcionaron campos válidos para actualizar'
            ];
        }
        
        // Añadir el ID al final para el WHERE
        $tipos .= "i";
        $valores[] = $id;
        
        // Construir la consulta final
        $query = "UPDATE {$this->table_name} SET " . implode(", ", $campos) . " WHERE id = ?";
        
        $stmt = $this->conn->prepare($query);
        
        if ($stmt === false) {
            error_log("Error en la preparación de la consulta: " . $this->conn->error);
            return [
                'success' => false,
                'error' => 'Error en la consulta: ' . $this->conn->error
            ];
        }
        
        // Vincular parámetros dinámicamente
        $stmt->bind_param($tipos, ...$valores);
        
        // Ejecutar la consulta
        if ($stmt->execute()) {
            return [
                'success' => true,
                'message' => 'Horario actualizado correctamente',
                'rows_affected' => $stmt->affected_rows
            ];
        } else {
            error_log("Error al actualizar horario: " . $stmt->error);
            return [
                'success' => false,
                'error' => 'Error al actualizar horario: ' . $stmt->error
            ];
        }
    }
    
    /**
     * Eliminar un horario (eliminación física o marcado como inactivo)
     * 
     * @param int $id ID del horario a eliminar
     * @return array Resultado de la operación
     */
    public function eliminar($id) {
        // Verificar que el horario existe
        $horario = $this->getHorarioById($id);
        if (!$horario['success']) {
            return [
                'success' => false,
                'error' => 'El horario no existe o ya ha sido eliminado'
            ];
        }
        
        // Primero intentamos eliminar físicamente (DELETE)
        $query = "DELETE FROM {$this->table_name} WHERE id = ?";
        $stmt = $this->conn->prepare($query);
        
        if ($stmt === false) {
            error_log("Error en la preparación de la consulta para eliminar: " . $this->conn->error);
            
            // Si falla, intentamos un soft delete
            $query_soft = "UPDATE {$this->table_name} SET activo = 0 WHERE id = ?";
            $stmt_soft = $this->conn->prepare($query_soft);
            
            if ($stmt_soft === false) {
                return [
                    'success' => false,
                    'error' => 'Error al eliminar el horario: ' . $this->conn->error
                ];
            }
            
            $stmt_soft->bind_param("i", $id);
            
            if ($stmt_soft->execute()) {
                return [
                    'success' => true,
                    'message' => 'Horario desactivado correctamente'
                ];
            } else {
                return [
                    'success' => false,
                    'error' => 'Error al desactivar el horario: ' . $stmt_soft->error
                ];
            }
        }
        
        // Ejecutar la eliminación física
        $stmt->bind_param("i", $id);
        
        if ($stmt->execute()) {
            return [
                'success' => true,
                'message' => 'Horario eliminado correctamente'
            ];
        } else {
            error_log("Error al eliminar horario: " . $stmt->error);
            return [
                'success' => false,
                'error' => 'Error al eliminar horario: ' . $stmt->error
            ];
        }
    }
    
    /**
     * Asignar un horario a un usuario
     * @param string $NIF NIF del usuario
     * @param int $id_horario ID del horario a asignar
     * @return array Resultado de la operación
     */
    public function asignarHorarioUsuario($NIF, $id_horario) {
        // Verificar que el horario existe
        if ($id_horario !== null) {
            $horario = $this->getHorarioById($id_horario);
            if (!$horario['success']) {
                return $horario; // Devuelve el error de que no existe
            }
        }
        
        // Actualizar el usuario con el nuevo horario
        $query = "UPDATE usuarios SET id_horario = ? WHERE NIF = ?";
        
        $stmt = $this->conn->prepare($query);
        
        if ($stmt === false) {
            error_log("Error en la preparación de la consulta: " . $this->conn->error);
            return [
                'success' => false,
                'error' => 'Error en la consulta: ' . $this->conn->error
            ];
        }
        
        $stmt->bind_param("is", $id_horario, $NIF);
        
        if ($stmt->execute()) {
            return [
                'success' => true,
                'message' => 'Horario asignado correctamente al usuario'
            ];
        } else {
            error_log("Error al asignar horario: " . $stmt->error);
            return [
                'success' => false,
                'error' => 'Error al asignar horario: ' . $stmt->error
            ];
        }
    }
    
    /**
     * Obtener el horario asignado a un usuario
     * @param string $NIF NIF del usuario
     * @return array Resultado de la operación
     */
    public function getHorarioUsuario($NIF) {
        $query = "SELECT h.* FROM {$this->table_name} h 
                  INNER JOIN usuarios u ON h.id = u.id_horario 
                  WHERE u.NIF = ? AND h.activo = 1";
        
        $stmt = $this->conn->prepare($query);
        
        if ($stmt === false) {
            error_log("Error en la preparación de la consulta: " . $this->conn->error);
            return [
                'success' => false,
                'error' => 'Error en la consulta: ' . $this->conn->error
            ];
        }
        
        $stmt->bind_param("s", $NIF);
        $stmt->execute();
        
        $result = $stmt->get_result();
        
        if ($result->num_rows > 0) {
            return [
                'success' => true,
                'horario' => $result->fetch_assoc()
            ];
        } else {
            return [
                'success' => false,
                'error' => 'Usuario sin horario asignado'
            ];
        }
    }
}