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
        try {
            // Validar datos mu00ednimos requeridos
            if (!isset($datos['titulo']) || !isset($datos['fecha_inicio']) || !isset($datos['NIF_usuario'])) {
                return ['success' => false, 'message' => 'Faltan datos requeridos'];
            }
            
            // Preparar la consulta
            $query = "INSERT INTO eventos (titulo, descripcion, fecha_inicio, fecha_fin, tipo, color, NIF_usuario, id_departamento, recurrente, dia_completo) "
                   . "VALUES (:titulo, :descripcion, :fecha_inicio, :fecha_fin, :tipo, :color, :NIF_usuario, :id_departamento, :recurrente, :dia_completo)";
            
            $stmt = $this->conn->prepare($query);
            
            // Limpiar y asignar valores
            $titulo = htmlspecialchars(strip_tags($datos['titulo']));
            $descripcion = isset($datos['descripcion']) ? htmlspecialchars(strip_tags($datos['descripcion'])) : null;
            $fecha_inicio = $datos['fecha_inicio'];
            $fecha_fin = isset($datos['fecha_fin']) ? $datos['fecha_fin'] : null;
            $tipo = isset($datos['tipo']) ? htmlspecialchars(strip_tags($datos['tipo'])) : 'evento';
            $color = isset($datos['color']) ? htmlspecialchars(strip_tags($datos['color'])) : '#3788d8';
            $NIF_usuario = htmlspecialchars(strip_tags($datos['NIF_usuario']));
            $id_departamento = isset($datos['id_departamento']) ? htmlspecialchars(strip_tags($datos['id_departamento'])) : null;
            $recurrente = isset($datos['recurrente']) ? (int)$datos['recurrente'] : 0;
            $dia_completo = isset($datos['dia_completo']) ? (int)$datos['dia_completo'] : 0;
            
            // Bind de paru00e1metros
            $stmt->bindParam(':titulo', $titulo);
            $stmt->bindParam(':descripcion', $descripcion);
            $stmt->bindParam(':fecha_inicio', $fecha_inicio);
            $stmt->bindParam(':fecha_fin', $fecha_fin);
            $stmt->bindParam(':tipo', $tipo);
            $stmt->bindParam(':color', $color);
            $stmt->bindParam(':NIF_usuario', $NIF_usuario);
            $stmt->bindParam(':id_departamento', $id_departamento);
            $stmt->bindParam(':recurrente', $recurrente);
            $stmt->bindParam(':dia_completo', $dia_completo);
            
            // Ejecutar la consulta
            if ($stmt->execute()) {
                return [
                    'success' => true, 
                    'id' => $this->conn->lastInsertId(),
                    'message' => 'Evento creado con u00e9xito'
                ];
            }
            
            return ['success' => false, 'message' => 'Error al crear el evento'];
            
        } catch (PDOException $e) {
            error_log("Error en crear evento: " . $e->getMessage());
            return ['success' => false, 'message' => 'Error en la base de datos: ' . $e->getMessage()];
        }
    }
    
    /**
     * Actualizar un evento existente
     */
    public function actualizar($id, $datos, $NIF_usuario) {
        try {
            // Verificar que el evento existe y pertenece al usuario
            $evento = $this->obtenerPorId($id);
            if (!$evento) {
                return ['success' => false, 'message' => 'Evento no encontrado'];
            }
            
            if ($evento['NIF_usuario'] !== $NIF_usuario) {
                return ['success' => false, 'message' => 'No tienes permiso para editar este evento'];
            }
            
            // Construir la consulta dinu00e1micamente segu00fan los campos proporcionados
            $query = "UPDATE eventos SET ";
            $params = [];
            
            // Campos actualizables
            $campos = [
                'titulo', 'descripcion', 'fecha_inicio', 'fecha_fin', 
                'tipo', 'color', 'id_departamento', 'recurrente', 'dia_completo'
            ];
            
            foreach ($campos as $campo) {
                if (isset($datos[$campo])) {
                    $params[] = "$campo = :$campo";
                }
            }
            
            // Si no hay campos para actualizar, retornar u00e9xito
            if (empty($params)) {
                return ['success' => true, 'message' => 'No hay cambios para aplicar'];
            }
            
            $query .= implode(', ', $params);
            $query .= " WHERE id = :id";
            
            $stmt = $this->conn->prepare($query);
            
            // Bind de id
            $stmt->bindParam(':id', $id);
            
            // Bind de cada paru00e1metro presente
            foreach ($campos as $campo) {
                if (isset($datos[$campo])) {
                    // Sanitizar valor segu00fan el tipo
                    $valor = $datos[$campo];
                    if (in_array($campo, ['titulo', 'descripcion', 'tipo', 'color'])) {
                        $valor = htmlspecialchars(strip_tags($valor));
                    } elseif (in_array($campo, ['recurrente', 'dia_completo'])) {
                        $valor = (int)$valor;
                    }
                    $stmt->bindValue(":$campo", $valor);
                }
            }
            
            // Ejecutar la consulta
            if ($stmt->execute()) {
                return ['success' => true, 'message' => 'Evento actualizado con u00e9xito'];
            }
            
            return ['success' => false, 'message' => 'Error al actualizar el evento'];
            
        } catch (PDOException $e) {
            error_log("Error en actualizar evento: " . $e->getMessage());
            return ['success' => false, 'message' => 'Error en la base de datos: ' . $e->getMessage()];
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
                return ['success' => true, 'message' => 'Evento eliminado con u00e9xito'];
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
     * Obtener eventos por usuario y rango de fechas
     */
    public function obtenerEventosPorUsuario($NIF_usuario, $fecha_inicio = null, $fecha_fin = null) {
        try {
            $query = "SELECT e.*, d.nombre as nombre_departamento "
                   . "FROM eventos e "
                   . "LEFT JOIN departamentos d ON e.id_departamento = d.id "
                   . "WHERE e.NIF_usuario = :NIF_usuario ";
            
            $params = [':NIF_usuario' => $NIF_usuario];
            
            // Filtrar por rango de fechas si se proporcionan
            if ($fecha_inicio && $fecha_fin) {
                $query .= "AND ((e.fecha_inicio BETWEEN :fecha_inicio AND :fecha_fin) "
                       . "OR (e.fecha_fin BETWEEN :fecha_inicio AND :fecha_fin) "
                       . "OR (e.fecha_inicio <= :fecha_inicio AND e.fecha_fin >= :fecha_fin))";
                $params[':fecha_inicio'] = $fecha_inicio;
                $params[':fecha_fin'] = $fecha_fin;
            }
            
            $query .= " ORDER BY e.fecha_inicio ASC";
            
            $stmt = $this->conn->prepare($query);
            
            // Bind de todos los paru00e1metros
            foreach ($params as $param => $value) {
                $stmt->bindValue($param, $value);
            }
            
            $stmt->execute();
            $eventos = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            return ['success' => true, 'eventos' => $eventos];
            
        } catch (PDOException $e) {
            error_log("Error en obtenerEventosPorUsuario: " . $e->getMessage());
            return ['success' => false, 'message' => 'Error al obtener eventos: ' . $e->getMessage()];
        }
    }
    
    /**
     * Obtener eventos por departamento y rango de fechas
     */
    public function obtenerEventosPorDepartamento($id_departamento, $fecha_inicio = null, $fecha_fin = null) {
        try {
            $query = "SELECT e.*, u.nombre as nombre_usuario, u.apellidos as apellidos_usuario, d.nombre as nombre_departamento "
                   . "FROM eventos e "
                   . "JOIN usuarios u ON e.NIF_usuario = u.NIF "
                   . "LEFT JOIN departamentos d ON e.id_departamento = d.id "
                   . "WHERE e.id_departamento = :id_departamento ";
            
            $params = [':id_departamento' => $id_departamento];
            
            // Filtrar por rango de fechas si se proporcionan
            if ($fecha_inicio && $fecha_fin) {
                $query .= "AND ((e.fecha_inicio BETWEEN :fecha_inicio AND :fecha_fin) "
                       . "OR (e.fecha_fin BETWEEN :fecha_inicio AND :fecha_fin) "
                       . "OR (e.fecha_inicio <= :fecha_inicio AND e.fecha_fin >= :fecha_fin))";
                $params[':fecha_inicio'] = $fecha_inicio;
                $params[':fecha_fin'] = $fecha_fin;
            }
            
            $query .= " ORDER BY e.fecha_inicio ASC";
            
            $stmt = $this->conn->prepare($query);
            
            // Bind de todos los paru00e1metros
            foreach ($params as $param => $value) {
                $stmt->bindValue($param, $value);
            }
            
            $stmt->execute();
            $eventos = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            return ['success' => true, 'eventos' => $eventos];
            
        } catch (PDOException $e) {
            error_log("Error en obtenerEventosPorDepartamento: " . $e->getMessage());
            return ['success' => false, 'message' => 'Error al obtener eventos: ' . $e->getMessage()];
        }
    }
    
    /**
     * Obtener tareas con vencimiento como eventos de calendario
     */
    public function obtenerTareasComoEventos($NIF_usuario, $fecha_inicio = null, $fecha_fin = null) {
        try {
            $query = "SELECT t.id, t.titulo, t.descripcion, t.fecha_vencimiento as fecha_inicio, 
                            t.fecha_vencimiento as fecha_fin, 'tarea' as tipo, 
                            CASE 
                                WHEN t.prioridad = 'alta' THEN '#ef4444' 
                                WHEN t.prioridad = 'media' THEN '#3b82f6' 
                                ELSE '#94a3b8' 
                            END as color, 
                            t.NIF_asignado as NIF_usuario, t.id_departamento, 0 as recurrente, 0 as dia_completo,
                            t.estado 
                      FROM tareas t 
                      WHERE t.NIF_asignado = :NIF_usuario 
                      AND t.fecha_vencimiento IS NOT NULL ";
            
            $params = [':NIF_usuario' => $NIF_usuario];
            
            // Filtrar por rango de fechas si se proporcionan
            if ($fecha_inicio && $fecha_fin) {
                $query .= "AND t.fecha_vencimiento BETWEEN :fecha_inicio AND :fecha_fin ";
                $params[':fecha_inicio'] = $fecha_inicio;
                $params[':fecha_fin'] = $fecha_fin;
            }
            
            $query .= "ORDER BY t.fecha_vencimiento ASC";
            
            $stmt = $this->conn->prepare($query);
            
            // Bind de todos los paru00e1metros
            foreach ($params as $param => $value) {
                $stmt->bindValue($param, $value);
            }
            
            $stmt->execute();
            $tareas = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            return ['success' => true, 'tareas' => $tareas];
            
        } catch (PDOException $e) {
            error_log("Error en obtenerTareasComoEventos: " . $e->getMessage());
            return ['success' => false, 'message' => 'Error al obtener tareas: ' . $e->getMessage()];
        }
    }
    
    /**
     * Obtener fichajes como eventos de calendario
     */
    public function obtenerFichajesComoEventos($NIF_usuario, $fecha_inicio = null, $fecha_fin = null) {
        try {
            $query = "SELECT f.id, 
                            CONCAT('Fichaje: ', DATE_FORMAT(f.hora_entrada, '%H:%i'), ' - ', 
                                  CASE WHEN f.hora_salida IS NULL THEN 'En curso' 
                                  ELSE DATE_FORMAT(f.hora_salida, '%H:%i') END) as titulo, 
                            '' as descripcion, 
                            f.hora_entrada as fecha_inicio, 
                            COALESCE(f.hora_salida, CURRENT_TIMESTAMP) as fecha_fin, 
                            'fichaje' as tipo, 
                            '#10b981' as color, 
                            f.NIF as NIF_usuario, 
                            null as id_departamento, 
                            0 as recurrente, 
                            0 as dia_completo 
                      FROM fichajes f 
                      WHERE f.NIF = :NIF_usuario ";
            
            $params = [':NIF_usuario' => $NIF_usuario];
            
            // Filtrar por rango de fechas si se proporcionan
            if ($fecha_inicio && $fecha_fin) {
                $query .= "AND (DATE(f.hora_entrada) BETWEEN DATE(:fecha_inicio) AND DATE(:fecha_fin)) ";
                $params[':fecha_inicio'] = $fecha_inicio;
                $params[':fecha_fin'] = $fecha_fin;
            }
            
            $query .= "ORDER BY f.hora_entrada ASC";
            
            $stmt = $this->conn->prepare($query);
            
            // Bind de todos los paru00e1metros
            foreach ($params as $param => $value) {
                $stmt->bindValue($param, $value);
            }
            
            $stmt->execute();
            $fichajes = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            return ['success' => true, 'fichajes' => $fichajes];
            
        } catch (PDOException $e) {
            error_log("Error en obtenerFichajesComoEventos: " . $e->getMessage());
            return ['success' => false, 'message' => 'Error al obtener fichajes: ' . $e->getMessage()];
        }
    }
}
?>
