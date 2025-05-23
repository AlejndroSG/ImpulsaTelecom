<?php

require_once __DIR__ . '/../config/database.php';

class Evento {
    private $conn;
    
    public function __construct() {
        $database = new Database();
        $this->conn = $database->getConnection();
    }
    
    /**
     * Crear un nuevo evento en el calendario
     */
    public function crear($datos) {
        // Validar datos requeridos
        if (!isset($datos['titulo']) || !isset($datos['fecha_inicio']) || !isset($datos['NIF_usuario'])) {
            return ['success' => false, 'message' => 'Faltan datos requeridos'];
        }
        
        try {
            // Validar y formatear las fechas
            $fecha_inicio = $this->validarFormatoFecha($datos['fecha_inicio']);
            $fecha_fin = isset($datos['fecha_fin']) ? $this->validarFormatoFecha($datos['fecha_fin']) : null;
            
            if ($fecha_inicio === false) {
                return ['success' => false, 'message' => 'Formato de fecha de inicio inválido'];
            }
            
            if (isset($datos['fecha_fin']) && $fecha_fin === false) {
                return ['success' => false, 'message' => 'Formato de fecha de fin inválido'];
            }
            
            // Preparar la consulta SQL
            $query = "INSERT INTO eventos (titulo, descripcion, fecha_inicio, fecha_fin, NIF_usuario, id_departamento, tipo, color, dia_completo) "
                   . "VALUES (:titulo, :descripcion, :fecha_inicio, :fecha_fin, :NIF_usuario, :id_departamento, :tipo, :color, :dia_completo)";
            
            $stmt = $this->conn->prepare($query);
            
            // Vincular parámetros
            $stmt->bindParam(':titulo', $datos['titulo']);
            $stmt->bindParam(':descripcion', $datos['descripcion']);
            $stmt->bindParam(':fecha_inicio', $fecha_inicio);
            $stmt->bindParam(':fecha_fin', $fecha_fin);
            $stmt->bindParam(':NIF_usuario', $datos['NIF_usuario']);
            
            // Parámetros opcionales
            $id_departamento = isset($datos['id_departamento']) ? $datos['id_departamento'] : null;
            $tipo = isset($datos['tipo']) ? $datos['tipo'] : 'evento';
            $color = isset($datos['color']) ? $datos['color'] : '#3788d8';
            $dia_completo = isset($datos['dia_completo']) ? $datos['dia_completo'] : '0';
            
            $stmt->bindParam(':id_departamento', $id_departamento);
            $stmt->bindParam(':tipo', $tipo);
            $stmt->bindParam(':color', $color);
            $stmt->bindParam(':dia_completo', $dia_completo);
            
            // Ejecutar la consulta
            $stmt->execute();
            
            // Obtener el ID del evento creado
            $id = $this->conn->lastInsertId();
            
            return [
                'success' => true, 
                'message' => 'Evento creado correctamente',
                'id' => $id
            ];
            
        } catch (PDOException $e) {
            error_log("Error al crear evento: " . $e->getMessage());
            return ['success' => false, 'message' => 'Error al crear evento: ' . $e->getMessage()];
        }
    }
    
    /**
     * Actualizar un evento existente
     */
    public function actualizar($id, $datos) {
        try {
            // Verificar que el evento existe
            $checkQuery = "SELECT id FROM eventos WHERE id = :id";
            $checkStmt = $this->conn->prepare($checkQuery);
            $checkStmt->bindParam(':id', $id);
            $checkStmt->execute();
            
            if ($checkStmt->rowCount() == 0) {
                return ['success' => false, 'message' => 'Evento no encontrado'];
            }
            
            // Construir la consulta de actualización dinámicamente
            $query = "UPDATE eventos SET ";
            $params = [];
            
            // Campos permitidos para actualizar
            $camposPermitidos = ['titulo', 'descripcion', 'fecha_inicio', 'fecha_fin', 'id_departamento'];
            
            foreach ($camposPermitidos as $campo) {
                if (isset($datos[$campo])) {
                    // Para las fechas, asegurarse de que estén en formato correcto
                    if ($campo === 'fecha_inicio' || $campo === 'fecha_fin') {
                        $datos[$campo] = $this->validarFormatoFecha($datos[$campo]);
                    }
                    $query .= "$campo = :$campo, ";
                    $params[$campo] = $datos[$campo];
                }
            }
            
            // Eliminar la última coma y espacio
            $query = rtrim($query, ', ');
            
            // Añadir la condición WHERE
            $query .= " WHERE id = :id";
            $params['id'] = $id;
            
            // Preparar y ejecutar la consulta
            $stmt = $this->conn->prepare($query);
            
            // Bind de parámetros
            foreach ($params as $param => $value) {
                $stmt->bindValue(":$param", $value);
            }
            
            // Ejecutar la consulta
            if (!$stmt->execute()) {
                error_log("Error al actualizar evento: " . implode(", ", $stmt->errorInfo()));
                return ['success' => false, 'message' => 'Error al actualizar el evento: ' . $stmt->errorInfo()[2]];
            }
            
            return ['success' => true, 'message' => 'Evento actualizado con éxito'];
            
        } catch (Exception $e) {
            error_log("Error al actualizar evento: " . $e->getMessage());
            return ['success' => false, 'message' => 'Error al actualizar evento: ' . $e->getMessage()];
        }
    }
    
    /**
     * Eliminar un evento
     */
    public function eliminar($id, $NIF_usuario) {
        try {
            // Verificar que el evento existe y pertenece al usuario
            $evento = $this->obtenerPorId($id);
            if (!$evento) {
                return ['success' => false, 'message' => 'Evento no encontrado'];
            }
            
            if ($evento['NIF_usuario'] !== $NIF_usuario) {
                return ['success' => false, 'message' => 'No tienes permiso para eliminar este evento'];
            }
            
            $query = "DELETE FROM eventos WHERE id = :id";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':id', $id);
            
            if ($stmt->execute()) {
                return ['success' => true, 'message' => 'Evento eliminado con éxito'];
            }
            
            return ['success' => false, 'message' => 'Error al eliminar el evento'];
            
        } catch (PDOException $e) {
            error_log("Error en eliminar evento: " . $e->getMessage());
            return ['success' => false, 'message' => 'Error en la base de datos: ' . $e->getMessage()];
        }
    }
    
    /**
     * Obtener un evento por su ID
     */
    public function obtenerPorId($id) {
        try {
            $query = "SELECT * FROM eventos WHERE id = :id";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':id', $id);
            $stmt->execute();
            
            return $stmt->fetch(PDO::FETCH_ASSOC);
            
        } catch (PDOException $e) {
            error_log("Error en obtenerPorId: " . $e->getMessage());
            return null;
        }
    }
    
    /**
     * Obtener eventos por usuario
     */
    public function obtenerEventosPorUsuario($NIF_usuario, $fecha_inicio = null, $fecha_fin = null) {
        try {
            // Preparar la consulta base
            $query = "SELECT e.* FROM eventos e WHERE e.NIF_usuario = :NIF_usuario ";
            
            // Añadir filtros de fecha si se proporcionan
            if ($fecha_inicio) {
                $fecha_inicio = $this->validarFormatoFecha($fecha_inicio);
                if ($fecha_inicio) {
                    $query .= "AND e.fecha_inicio >= :fecha_inicio ";
                }
            }
            
            if ($fecha_fin) {
                $fecha_fin = $this->validarFormatoFecha($fecha_fin);
                if ($fecha_fin) {
                    $query .= "AND e.fecha_inicio <= :fecha_fin ";
                }
            }
            
            $query .= "ORDER BY e.fecha_inicio DESC";
            
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':NIF_usuario', $NIF_usuario);
            
            if ($fecha_inicio) {
                $stmt->bindParam(':fecha_inicio', $fecha_inicio);
            }
            
            if ($fecha_fin) {
                $stmt->bindParam(':fecha_fin', $fecha_fin);
            }
            
            $stmt->execute();
            $eventos = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            return [
                'success' => true,
                'message' => 'Eventos obtenidos correctamente',
                'eventos' => $eventos
            ];
            
        } catch (PDOException $e) {
            error_log("Error al obtener eventos por usuario: " . $e->getMessage());
            return ['success' => false, 'message' => 'Error al obtener eventos: ' . $e->getMessage()];
        }
    }
    
    /**
     * Validar y formatear una fecha para guardarla en la base de datos
     */
    private function validarFormatoFecha($fecha) {
        // Si ya está en formato Y-m-d H:i:s, devolverla tal cual
        if (preg_match('/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/', $fecha)) {
            return $fecha;
        }
        
        // Si es una fecha ISO (yyyy-mm-ddThh:mm:ss.sssZ)
        if (preg_match('/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/', $fecha)) {
            $dateObj = new DateTime($fecha);
            return $dateObj->format('Y-m-d H:i:s');
        }
        
        // Si es solo fecha (yyyy-mm-dd)
        if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $fecha)) {
            return $fecha . ' 00:00:00';
        }
        
        // Intentar convertir desde otros formatos
        $timestamp = strtotime($fecha);
        if ($timestamp === false) {
            error_log("Error al convertir fecha: $fecha");
            return false;
        }
        
        return date('Y-m-d H:i:s', $timestamp);
    }
    
    /**
     * Verificar que un evento existe en la base de datos
     */
    public function verificarExistenciaEvento($eventoId) {
        try {
            $query = "SELECT COUNT(*) as existe FROM eventos WHERE id = :id";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':id', $eventoId);
            $stmt->execute();
            
            $resultado = $stmt->fetch(PDO::FETCH_ASSOC);
            return $resultado['existe'] > 0;
        } catch (Exception $e) {
            error_log("Error al verificar existencia de evento: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Verificar que un usuario es propietario de un evento
     */
    public function verificarPropietarioEvento($eventoId, $NIF) {
        try {
            $query = "SELECT COUNT(*) as es_propietario FROM eventos WHERE id = :id AND NIF_usuario = :NIF";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':id', $eventoId);
            $stmt->bindParam(':NIF', $NIF);
            $stmt->execute();
            
            $resultado = $stmt->fetch(PDO::FETCH_ASSOC);
            return $resultado['es_propietario'] > 0;
        } catch (Exception $e) {
            error_log("Error al verificar propietario de evento: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Eliminar un evento
     */
    public function eliminarEvento($eventoId) {
        try {
            $query = "DELETE FROM eventos WHERE id = :id";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':id', $eventoId);
            
            if ($stmt->execute()) {
                return [
                    'success' => true,
                    'message' => 'Evento eliminado correctamente'
                ];
            } else {
                return [
                    'success' => false,
                    'message' => 'Error al eliminar el evento: ' . implode(", ", $stmt->errorInfo())
                ];
            }
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => 'Error al eliminar el evento: ' . $e->getMessage()
            ];
        }
    }
    
    /**
     * Obtener todos los eventos disponibles
     * Si se proporciona un NIF, devuelve solo los eventos del usuario
     * Si es admin, puede ver todos los eventos
     */
    public function obtenerTodosEventos($NIF, $esAdmin = false) {
        try {
            // Base de la consulta SQL
            $query = "SELECT * FROM eventos";
            $params = [];
            
            // Si no es admin, filtrar por NIF o por eventos públicos
            if (!$esAdmin) {
                $query .= " WHERE NIF_usuario = :NIF";
                $params[':NIF'] = $NIF;
            }
            
            // Ordenar por fecha de inicio descendente (más recientes primero)
            $query .= " ORDER BY fecha_inicio DESC";
            
            $stmt = $this->conn->prepare($query);
            
            // Vincular parámetros si existen
            foreach ($params as $param => $valor) {
                $stmt->bindValue($param, $valor);
            }
            
            $stmt->execute();
            $eventos = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            return [
                'success' => true,
                'message' => 'Eventos obtenidos correctamente',
                'eventos' => $eventos
            ];
            
        } catch (PDOException $e) {
            error_log("Error al obtener eventos: " . $e->getMessage());
            return ['success' => false, 'message' => 'Error al obtener eventos: ' . $e->getMessage()];
        }
    }
}
?>
