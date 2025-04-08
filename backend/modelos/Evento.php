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
            // Verificar si existen las tablas necesarias
            $tablas = ['eventos', 'usuarios'];
            foreach ($tablas as $tabla) {
                $checkQuery = "SHOW TABLES LIKE '$tabla'";
                $result = $this->conn->query($checkQuery);
                if ($result->rowCount() === 0) {
                    return ['success' => false, 'message' => "La tabla '$tabla' no existe"];
                }
            }
            
            // Preparar la consulta base
            $query = "SELECT e.*, u.nombre as nombre_usuario, u.apellidos as apellidos_usuario "
                   . "FROM eventos e "
                   . "LEFT JOIN usuarios u ON e.NIF_usuario = u.NIF "
                   . "WHERE e.NIF_usuario = :NIF_usuario ";
            
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
                    $query .= "AND e.fecha_fin <= :fecha_fin ";
                }
            }
            
            $query .= "ORDER BY e.fecha_inicio ASC";
            
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
            
            // Formatear las fechas para el frontend (ISO8601 con T)
            foreach ($eventos as &$evento) {
                if (isset($evento['fecha_inicio'])) {
                    $evento['fecha_inicio'] = date('Y-m-d\TH:i:s', strtotime($evento['fecha_inicio']));
                }
                if (isset($evento['fecha_fin'])) {
                    $evento['fecha_fin'] = date('Y-m-d\TH:i:s', strtotime($evento['fecha_fin']));
                }
            }
            
            return [
                'success' => true, 
                'eventos' => $eventos,
                'debug' => [
                    'count' => count($eventos)
                ]
            ];
            
        } catch (PDOException $e) {
            error_log("Error al obtener eventos: " . $e->getMessage());
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
            
            // Bind de todos los parámetros
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
     * Obtiene las tareas del usuario como eventos para el calendario
     * @param string $NIF El NIF del usuario
     * @param string|null $fecha_inicio Fecha de inicio para filtrar
     * @param string|null $fecha_fin Fecha de fin para filtrar
     * @return array Array con las tareas como eventos
     */
    public function obtenerTareasComoEventos($NIF, $fecha_inicio = null, $fecha_fin = null) {
        try {
            // Verificar si la tabla 'tareas' existe
            $tableCheckQuery = "SHOW TABLES LIKE 'tareas'";
            $tableResult = $this->conn->query($tableCheckQuery);
            
            if ($tableResult === false) {
                error_log("Error al verificar la tabla 'tareas': " . $this->conn->errorInfo()[2]);
                return ['success' => false, 'message' => 'Error al verificar la tabla de tareas', 'tareas' => []];
            }
            
            if ($tableResult->rowCount() === 0) {
                error_log("La tabla 'tareas' no existe en la base de datos");
                return ['success' => true, 'tareas' => []];
            }
            
            // Construir la consulta base
            $query = "SELECT id, titulo, descripcion, fecha_creacion, fecha_vencimiento, estado, prioridad, NIF_usuario 
                     FROM tareas 
                     WHERE NIF_usuario = :NIF";
            
            // Añadir filtro de fechas si se proporcionan
            $params = [':NIF' => $NIF];
            
            if ($fecha_inicio && $fecha_fin) {
                $query .= " AND (fecha_vencimiento BETWEEN :fecha_inicio AND :fecha_fin 
                           OR fecha_creacion BETWEEN :fecha_inicio AND :fecha_fin)";
                $params[':fecha_inicio'] = $fecha_inicio;
                $params[':fecha_fin'] = $fecha_fin;
            }
            
            // Preparar y ejecutar la consulta
            $stmt = $this->conn->prepare($query);
            
            if ($stmt === false) {
                error_log("Error en la preparación de la consulta de tareas: " . $this->conn->errorInfo()[2]);
                return ['success' => false, 'message' => 'Error al preparar la consulta de tareas', 'tareas' => []];
            }
            
            foreach ($params as $param => $value) {
                $stmt->bindValue($param, $value);
            }
            
            if (!$stmt->execute()) {
                error_log("Error al ejecutar la consulta de tareas: " . $stmt->errorInfo()[2]);
                return ['success' => false, 'message' => 'Error al obtener tareas', 'tareas' => []];
            }
            
            $tareas = $stmt->fetchAll(PDO::FETCH_ASSOC);
            $tareasComoEventos = [];
            
            // Convertir las tareas a formato de evento para el calendario
            foreach ($tareas as $tarea) {
                $color = '';
                
                // Asignar color según prioridad
                switch ($tarea['prioridad']) {
                    case 'alta':
                        $color = '#ff4d4d'; // Rojo
                        break;
                    case 'media':
                        $color = '#ffa64d'; // Naranja
                        break;
                    case 'baja':
                        $color = '#4da6ff'; // Azul
                        break;
                    default:
                        $color = '#808080'; // Gris por defecto
                }
                
                // Crear el evento a partir de la tarea
                $evento = [
                    'id' => 'tarea_' . $tarea['id'],
                    'title' => '[Tarea] ' . $tarea['titulo'],
                    'start' => $tarea['fecha_vencimiento'] ?: $tarea['fecha_creacion'],
                    'end' => $tarea['fecha_vencimiento'] ?: $tarea['fecha_creacion'],
                    'allDay' => true,
                    'backgroundColor' => $color,
                    'borderColor' => $color,
                    'description' => $tarea['descripcion'],
                    'estado' => $tarea['estado'],
                    'tipo' => 'tarea'
                ];
                
                $tareasComoEventos[] = $evento;
            }
            
            return ['success' => true, 'tareas' => $tareasComoEventos];
            
        } catch (PDOException $e) {
            error_log("Error PDO al obtener tareas como eventos: " . $e->getMessage());
            return ['success' => false, 'message' => 'Error de base de datos al obtener tareas', 'tareas' => []];
        } catch (Exception $e) {
            error_log("Error general al obtener tareas como eventos: " . $e->getMessage());
            return ['success' => false, 'message' => 'Error al obtener tareas', 'tareas' => []];
        }
    }
    
    /**
     * Obtiene los fichajes del usuario como eventos para el calendario
     * @param string $NIF El NIF del usuario
     * @param string|null $fecha_inicio Fecha de inicio para filtrar
     * @param string|null $fecha_fin Fecha de fin para filtrar
     * @return array Array con los fichajes como eventos
     */
    public function obtenerFichajesComoEventos($NIF, $fecha_inicio = null, $fecha_fin = null) {
        try {
            // Verificar si existe la tabla 'fichajes' o 'registros'
            $tableFichajes = false;
            $tablaRegistros = false;
            
            // Comprobar tabla fichajes
            $checkFichajes = "SHOW TABLES LIKE 'fichajes'";
            $resultFichajes = $this->conn->query($checkFichajes);
            if ($resultFichajes && $resultFichajes->rowCount() > 0) {
                $tableFichajes = true;
            }
            
            // Comprobar tabla registros
            $checkRegistros = "SHOW TABLES LIKE 'registros'";
            $resultRegistros = $this->conn->query($checkRegistros);
            if ($resultRegistros && $resultRegistros->rowCount() > 0) {
                $tablaRegistros = true;
            }
            
            // Si no existe ninguna de las tablas, devolver array vacío
            if (!$tableFichajes && !$tablaRegistros) {
                error_log("No existen las tablas 'fichajes' ni 'registros' en la base de datos");
                return ['success' => true, 'fichajes' => []];
            }
            
            $fichajes = [];
            
            // Consulta para tabla fichajes
            if ($tableFichajes) {
                $queryFichajes = "SELECT id, fecha_entrada, fecha_salida, NIF_usuario, latitud_entrada, longitud_entrada, 
                               latitud_salida, longitud_salida 
                               FROM fichajes 
                               WHERE NIF_usuario = :NIF";
                
                if ($fecha_inicio && $fecha_fin) {
                    $queryFichajes .= " AND (fecha_entrada BETWEEN :fecha_inicio AND :fecha_fin 
                                   OR fecha_salida BETWEEN :fecha_inicio AND :fecha_fin)";
                }
                
                $stmtFichajes = $this->conn->prepare($queryFichajes);
                
                if ($stmtFichajes) {
                    $stmtFichajes->bindValue(':NIF', $NIF);
                    
                    if ($fecha_inicio && $fecha_fin) {
                        $stmtFichajes->bindValue(':fecha_inicio', $fecha_inicio);
                        $stmtFichajes->bindValue(':fecha_fin', $fecha_fin);
                    }
                    
                    if ($stmtFichajes->execute()) {
                        $fichajes = array_merge($fichajes, $stmtFichajes->fetchAll(PDO::FETCH_ASSOC));
                    } else {
                        error_log("Error al ejecutar consulta de fichajes: " . implode(", ", $stmtFichajes->errorInfo()));
                    }
                } else {
                    error_log("Error al preparar consulta de fichajes: " . implode(", ", $this->conn->errorInfo()));
                }
            }
            
            // Consulta para tabla registros
            if ($tablaRegistros) {
                $queryRegistros = "SELECT id, fecha_entrada, fecha_salida, NIF_usuario, latitud_entrada, longitud_entrada, 
                                latitud_salida, longitud_salida 
                                FROM registros 
                                WHERE NIF_usuario = :NIF";
                
                if ($fecha_inicio && $fecha_fin) {
                    $queryRegistros .= " AND (fecha_entrada BETWEEN :fecha_inicio AND :fecha_fin 
                                    OR fecha_salida BETWEEN :fecha_inicio AND :fecha_fin)";
                }
                
                $stmtRegistros = $this->conn->prepare($queryRegistros);
                
                if ($stmtRegistros) {
                    $stmtRegistros->bindValue(':NIF', $NIF);
                    
                    if ($fecha_inicio && $fecha_fin) {
                        $stmtRegistros->bindValue(':fecha_inicio', $fecha_inicio);
                        $stmtRegistros->bindValue(':fecha_fin', $fecha_fin);
                    }
                    
                    if ($stmtRegistros->execute()) {
                        $fichajes = array_merge($fichajes, $stmtRegistros->fetchAll(PDO::FETCH_ASSOC));
                    } else {
                        error_log("Error al ejecutar consulta de registros: " . implode(", ", $stmtRegistros->errorInfo()));
                    }
                } else {
                    error_log("Error al preparar consulta de registros: " . implode(", ", $this->conn->errorInfo()));
                }
            }
            
            // Si no hay fichajes, devolver array vacío
            if (empty($fichajes)) {
                return ['success' => true, 'fichajes' => []];
            }
            
            $fichajesComoEventos = [];
            
            // Convertir los fichajes a formato de evento para el calendario
            foreach ($fichajes as $fichaje) {
                // Color para entrada
                $colorEntrada = '#4CAF50'; // Verde
                
                // Evento de entrada
                if (!empty($fichaje['fecha_entrada'])) {
                    $eventoEntrada = [
                        'id' => 'fichaje_entrada_' . $fichaje['id'],
                        'title' => 'Entrada',
                        'start' => $fichaje['fecha_entrada'],
                        'end' => $fichaje['fecha_entrada'],
                        'backgroundColor' => $colorEntrada,
                        'borderColor' => $colorEntrada,
                        'tipo' => 'fichaje_entrada'
                    ];
                    
                    // Añadir coordenadas si existen
                    if (!empty($fichaje['latitud_entrada']) && !empty($fichaje['longitud_entrada'])) {
                        $eventoEntrada['latitud'] = $fichaje['latitud_entrada'];
                        $eventoEntrada['longitud'] = $fichaje['longitud_entrada'];
                    }
                    
                    $fichajesComoEventos[] = $eventoEntrada;
                }
                
                // Color para salida
                $colorSalida = '#F44336'; // Rojo
                
                // Evento de salida
                if (!empty($fichaje['fecha_salida'])) {
                    $eventoSalida = [
                        'id' => 'fichaje_salida_' . $fichaje['id'],
                        'title' => 'Salida',
                        'start' => $fichaje['fecha_salida'],
                        'end' => $fichaje['fecha_salida'],
                        'backgroundColor' => $colorSalida,
                        'borderColor' => $colorSalida,
                        'tipo' => 'fichaje_salida'
                    ];
                    
                    // Añadir coordenadas si existen
                    if (!empty($fichaje['latitud_salida']) && !empty($fichaje['longitud_salida'])) {
                        $eventoSalida['latitud'] = $fichaje['latitud_salida'];
                        $eventoSalida['longitud'] = $fichaje['longitud_salida'];
                    }
                    
                    $fichajesComoEventos[] = $eventoSalida;
                }
            }
            
            return ['success' => true, 'fichajes' => $fichajesComoEventos];
            
        } catch (PDOException $e) {
            error_log("Error PDO al obtener fichajes como eventos: " . $e->getMessage());
            return ['success' => false, 'message' => 'Error de base de datos al obtener fichajes', 'fichajes' => []];
        } catch (Exception $e) {
            error_log("Error general al obtener fichajes como eventos: " . $e->getMessage());
            return ['success' => false, 'message' => 'Error al obtener fichajes', 'fichajes' => []];
        }
    }
    
    /**
     * Valida y formatea una fecha para asegurar que esté en el formato correcto para MySQL
     * @param string $fecha Fecha a validar y formatear
     * @return string|false Fecha formateada o false si es inválida
     */
    private function validarFormatoFecha($fecha) {
        if (empty($fecha)) {
            return false;
        }
        
        // Si la fecha ya está en formato ISO (YYYY-MM-DD HH:MM:SS)
        if (preg_match('/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/', $fecha)) {
            return $fecha;
        }
        
        // Si la fecha está en formato ISO con T (YYYY-MM-DDTHH:MM:SS)
        if (preg_match('/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/', $fecha)) {
            return str_replace('T', ' ', substr($fecha, 0, 19));
        }
        
        // Si la fecha está en formato español (DD/MM/YYYY HH:MM)
        if (preg_match('/^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}$/', $fecha)) {
            $partes = explode(' ', $fecha);
            $fechaParte = explode('/', $partes[0]);
            return $fechaParte[2] . '-' . $fechaParte[1] . '-' . $fechaParte[0] . ' ' . $partes[1] . ':00';
        }
        
        // Si la fecha está en formato español (DD/MM/YYYY)
        if (preg_match('/^\d{2}\/\d{2}\/\d{4}$/', $fecha)) {
            $fechaParte = explode('/', $fecha);
            return $fechaParte[2] . '-' . $fechaParte[1] . '-' . $fechaParte[0] . ' 00:00:00';
        }
        
        // Intentar convertir cualquier otro formato usando strtotime
        $timestamp = strtotime($fecha);
        if ($timestamp === false) {
            return false;
        }
        
        return date('Y-m-d H:i:s', $timestamp);
    }
    
    /**
     * Obtener la conexión a la base de datos
     * @return PDO Conexión a la base de datos
     */
    public function getConnection() {
        return $this->conn;
    }
}
?>
