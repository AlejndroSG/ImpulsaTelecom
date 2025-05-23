<?php
/**
 * Clase Incidencia - Modelo para gestionar las incidencias reportadas por los usuarios
 */
class Incidencia {
    private $conn;
    
    /**
     * Constructor de la clase
     */
    public function __construct() {
        require_once __DIR__ . '/../config/database.php';
        $database = new Database();
        $this->conn = $database->getConnection();
    }
    
    /**
     * Crear una nueva incidencia
     * 
     * @param array $datos Datos de la incidencia a crear
     * @return array Resultado de la operaciu00f3n
     */
    public function crear($datos) {
        try {
            // Validar campos obligatorios
            if (empty($datos['titulo']) || empty($datos['descripcion']) || 
                empty($datos['tipo']) || empty($datos['NIF_usuario'])) {
                return [
                    'success' => false,
                    'message' => 'Faltan campos obligatorios para crear la incidencia'
                ];
            }
            
            // Preparar la consulta SQL
            $sql = "INSERT INTO reportes (titulo, descripcion, tipo, NIF_usuario, prioridad, archivos_adjuntos) "
                . "VALUES (:titulo, :descripcion, :tipo, :NIF_usuario, :prioridad, :archivos_adjuntos)";
            
            $stmt = $this->conn->prepare($sql);
            
            // Valores por defecto para campos opcionales
            $prioridad = isset($datos['prioridad']) ? $datos['prioridad'] : 'media';
            $archivos = isset($datos['archivos_adjuntos']) ? $datos['archivos_adjuntos'] : null;
            
            // Vincular paru00e1metros
            $stmt->bindParam(':titulo', $datos['titulo']);
            $stmt->bindParam(':descripcion', $datos['descripcion']);
            $stmt->bindParam(':tipo', $datos['tipo']);
            $stmt->bindParam(':NIF_usuario', $datos['NIF_usuario']);
            $stmt->bindParam(':prioridad', $prioridad);
            $stmt->bindParam(':archivos_adjuntos', $archivos);
            
            // Ejecutar la consulta
            if ($stmt->execute()) {
                $id = $this->conn->lastInsertId();
                return [
                    'success' => true,
                    'message' => 'Incidencia creada correctamente',
                    'id' => $id
                ];
            }
            
            return [
                'success' => false,
                'message' => 'Error al crear la incidencia'
            ];
            
        } catch (PDOException $e) {
            error_log("Error en crear incidencia: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Error en la base de datos: ' . $e->getMessage()
            ];
        }
    }
    
    /**
     * Obtener una incidencia por su ID
     * 
     * @param int $id ID de la incidencia
     * @return array|null Datos de la incidencia o null si no se encuentra
     */
    public function obtenerPorId($id) {
        try {
            $sql = "SELECT r.*, u.nombre, u.apellidos, u.correo "
                . "FROM reportes r "
                . "LEFT JOIN usuarios u ON r.NIF_usuario = u.NIF "
                . "WHERE r.id = :id";
            
            $stmt = $this->conn->prepare($sql);
            $stmt->bindParam(':id', $id);
            $stmt->execute();
            
            return $stmt->fetch(PDO::FETCH_ASSOC);
            
        } catch (PDOException $e) {
            error_log("Error en obtenerPorId: " . $e->getMessage());
            return null;
        }
    }
    
    /**
     * Obtener todas las incidencias de un usuario
     * 
     * @param string $NIF NIF del usuario
     * @return array Lista de incidencias del usuario
     */
    public function obtenerPorUsuario($NIF) {
        try {
            $sql = "SELECT r.*, u.nombre, u.apellidos "
                . "FROM reportes r "
                . "LEFT JOIN usuarios u ON r.NIF_usuario = u.NIF "
                . "WHERE r.NIF_usuario = :NIF "
                . "ORDER BY r.fecha_creacion DESC";
            
            $stmt = $this->conn->prepare($sql);
            $stmt->bindParam(':NIF', $NIF);
            $stmt->execute();
            
            return [
                'success' => true,
                'incidencias' => $stmt->fetchAll(PDO::FETCH_ASSOC)
            ];
            
        } catch (PDOException $e) {
            error_log("Error en obtenerPorUsuario: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Error al obtener las incidencias: ' . $e->getMessage()
            ];
        }
    }
    
    /**
     * Obtener todas las incidencias (para administradores)
     * 
     * @param array $filtros Filtros opcionales (estado, tipo, etc.)
     * @return array Lista de todas las incidencias
     */
    public function obtenerTodas($filtros = []) {
        try {
            $sql = "SELECT r.*, u.nombre, u.apellidos "
                . "FROM reportes r "
                . "LEFT JOIN usuarios u ON r.NIF_usuario = u.NIF";
            
            $where = [];
            $params = [];
            
            // Aplicar filtros si existen
            if (isset($filtros['estado']) && !empty($filtros['estado'])) {
                $where[] = "r.estado = :estado";
                $params[':estado'] = $filtros['estado'];
            }
            
            if (isset($filtros['tipo']) && !empty($filtros['tipo'])) {
                $where[] = "r.tipo = :tipo";
                $params[':tipo'] = $filtros['tipo'];
            }
            
            if (isset($filtros['prioridad']) && !empty($filtros['prioridad'])) {
                $where[] = "r.prioridad = :prioridad";
                $params[':prioridad'] = $filtros['prioridad'];
            }
            
            if (isset($filtros['leido']) && ($filtros['leido'] === '0' || $filtros['leido'] === '1')) {
                $where[] = "r.leido = :leido";
                $params[':leido'] = $filtros['leido'];
            }
            
            // Au00f1adir clu00e1usula WHERE si hay filtros
            if (!empty($where)) {
                $sql .= " WHERE " . implode(" AND ", $where);
            }
            
            // Ordenar por fecha de creaciu00f3n descendente (mu00e1s recientes primero)
            $sql .= " ORDER BY r.fecha_creacion DESC";
            
            $stmt = $this->conn->prepare($sql);
            
            // Vincular paru00e1metros si existen
            foreach ($params as $param => $valor) {
                $stmt->bindValue($param, $valor);
            }
            
            $stmt->execute();
            
            return [
                'success' => true,
                'incidencias' => $stmt->fetchAll(PDO::FETCH_ASSOC)
            ];
            
        } catch (PDOException $e) {
            error_log("Error en obtenerTodas: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Error al obtener las incidencias: ' . $e->getMessage()
            ];
        }
    }
    
    /**
     * Actualizar el estado de una incidencia
     * 
     * @param int $id ID de la incidencia
     * @param array $datos Datos a actualizar (estado, respuesta, etc.)
     * @return array Resultado de la operaciu00f3n
     */
    public function actualizar($id, $datos) {
        try {
            // Construir la consulta dinu00e1micamente segu00fan los campos a actualizar
            $campos = [];
            $params = [':id' => $id];
            
            if (isset($datos['estado'])) {
                $campos[] = "estado = :estado";
                $params[':estado'] = $datos['estado'];
            }
            
            if (isset($datos['respuesta'])) {
                $campos[] = "respuesta = :respuesta";
                $params[':respuesta'] = $datos['respuesta'];
            }
            
            if (isset($datos['prioridad'])) {
                $campos[] = "prioridad = :prioridad";
                $params[':prioridad'] = $datos['prioridad'];
            }
            
            if (isset($datos['leido'])) {
                $campos[] = "leido = :leido";
                $params[':leido'] = $datos['leido'];
            }
            
            // Si no hay campos para actualizar, retornar error
            if (empty($campos)) {
                return [
                    'success' => false,
                    'message' => 'No se proporcionaron campos para actualizar'
                ];
            }
            
            // Consulta SQL para actualizar
            $sql = "UPDATE reportes SET " . implode(", ", $campos) . " WHERE id = :id";
            
            $stmt = $this->conn->prepare($sql);
            
            // Vincular paru00e1metros
            foreach ($params as $param => $valor) {
                $stmt->bindValue($param, $valor);
            }
            
            // Ejecutar la consulta
            if ($stmt->execute()) {
                return [
                    'success' => true,
                    'message' => 'Incidencia actualizada correctamente'
                ];
            }
            
            return [
                'success' => false,
                'message' => 'Error al actualizar la incidencia'
            ];
            
        } catch (PDOException $e) {
            error_log("Error en actualizar incidencia: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Error en la base de datos: ' . $e->getMessage()
            ];
        }
    }
    
    /**
     * Eliminar una incidencia
     * 
     * @param int $id ID de la incidencia
     * @return array Resultado de la operaciu00f3n
     */
    public function eliminar($id) {
        try {
            $sql = "DELETE FROM reportes WHERE id = :id";
            $stmt = $this->conn->prepare($sql);
            $stmt->bindParam(':id', $id);
            
            if ($stmt->execute()) {
                return [
                    'success' => true,
                    'message' => 'Incidencia eliminada correctamente'
                ];
            }
            
            return [
                'success' => false,
                'message' => 'Error al eliminar la incidencia'
            ];
            
        } catch (PDOException $e) {
            error_log("Error en eliminar incidencia: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Error en la base de datos: ' . $e->getMessage()
            ];
        }
    }
    
    /**
     * Contar incidencias no leu00eddas (para notificaciones)
     * 
     * @return int Nu00famero de incidencias no leu00eddas
     */
    public function contarNoLeidas() {
        try {
            $sql = "SELECT COUNT(*) as total FROM reportes WHERE leido = 0";
            $stmt = $this->conn->prepare($sql);
            $stmt->execute();
            
            $resultado = $stmt->fetch(PDO::FETCH_ASSOC);
            return $resultado['total'];
            
        } catch (PDOException $e) {
            error_log("Error en contarNoLeidas: " . $e->getMessage());
            return 0;
        }
    }
}
?>
