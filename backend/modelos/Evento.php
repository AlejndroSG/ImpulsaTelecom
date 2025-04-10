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
    public function obtenerEventosPorDepartamento($dpto, $fecha_inicio = null, $fecha_fin = null) {
        try {
            // Validar y formatear las fechas si se proporcionan
            if ($fecha_inicio) {
                $fecha_inicio = $this->validarFormatoFecha($fecha_inicio);
                if (!$fecha_inicio) {
                    return ['success' => false, 'message' => 'Formato de fecha de inicio inválido'];
                }
            }
            
            if ($fecha_fin) {
                $fecha_fin = $this->validarFormatoFecha($fecha_fin);
                if (!$fecha_fin) {
                    return ['success' => false, 'message' => 'Formato de fecha de fin inválido'];
                }
            }

            // Consulta base
            $query = "SELECT e.*, u.nombre as nombre_usuario, u.apellidos as apellidos_usuario "
                   . "FROM eventos e "
                   . "JOIN usuarios u ON e.NIF_usuario = u.NIF "
                   . "WHERE 1=1 ";
            
            $params = [];
            
            // Filtrar por departamento si se proporciona
            if ($dpto) {
                $query .= "AND u.dpto = :dpto ";
                $params[':dpto'] = $dpto;
            }
            
            // Filtrar por rango de fechas si se proporcionan ambas fechas
            if ($fecha_inicio && $fecha_fin) {
                $query .= "AND ((e.fecha_inicio BETWEEN :fecha_inicio AND :fecha_fin) "
                       . "OR (e.fecha_fin BETWEEN :fecha_inicio AND :fecha_fin) "
                       . "OR (e.fecha_inicio <= :fecha_inicio AND (e.fecha_fin >= :fecha_fin OR e.fecha_fin IS NULL)))";
                $params[':fecha_inicio'] = $fecha_inicio;
                $params[':fecha_fin'] = $fecha_fin;
            }
            // Si solo se proporciona fecha de inicio
            else if ($fecha_inicio) {
                $query .= "AND (e.fecha_inicio >= :fecha_inicio OR e.fecha_fin >= :fecha_inicio)";
                $params[':fecha_inicio'] = $fecha_inicio;
            }
            // Si solo se proporciona fecha de fin
            else if ($fecha_fin) {
                $query .= "AND (e.fecha_inicio <= :fecha_fin)";
                $params[':fecha_fin'] = $fecha_fin;
            }
            
            $query .= " ORDER BY e.fecha_inicio ASC";
            
            // Registrar la consulta para depuración
            error_log("Consulta SQL: " . $query);
            error_log("Parámetros: " . json_encode($params));
            
            $stmt = $this->conn->prepare($query);
            
            // Bind de todos los parámetros
            foreach ($params as $param => $value) {
                $stmt->bindValue($param, $value);
            }
            
            $stmt->execute();
            $eventos = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Formatear las fechas para el frontend (ISO8601 con T)
            foreach ($eventos as &$evento) {
                if (isset($evento['fecha_inicio'])) {
                    $evento['fecha_inicio'] = date('Y-m-d\TH:i:s', strtotime($evento['fecha_inicio']));
                }
                if (isset($evento['fecha_fin']) && $evento['fecha_fin']) {
                    $evento['fecha_fin'] = date('Y-m-d\TH:i:s', strtotime($evento['fecha_fin']));
                }
            }
            
            return [
                'success' => true, 
                'eventos' => $eventos,
                'debug' => [
                    'count' => count($eventos),
                    'dpto' => $dpto,
                    'fecha_inicio' => $fecha_inicio,
                    'fecha_fin' => $fecha_fin,
                    'query' => $query,
                    'params' => $params
                ]
            ];
            
        } catch (PDOException $e) {
            error_log("Error en obtenerEventosPorDepartamento: " . $e->getMessage());
            return ['success' => false, 'message' => 'Error al obtener eventos: ' . $e->getMessage()];
        }
    }
    
    /**
     * Obtener eventos híbridos (personales + departamentales) para un usuario
     */
    public function obtenerEventosHibridos($NIF, $dpto = null, $fecha_inicio = null, $fecha_fin = null) {
        $debug = [];
        $debug['NIF'] = $NIF;
        $debug['dpto'] = $dpto;
        $debug['fecha_inicio'] = $fecha_inicio;
        $debug['fecha_fin'] = $fecha_fin;
        
        // Validar y formatear las fechas si se proporcionan
        if ($fecha_inicio) {
            $fecha_inicio = $this->validarFormatoFecha($fecha_inicio);
            if (!$fecha_inicio) {
                return ['success' => false, 'message' => 'Formato de fecha de inicio inválido', 'debug' => $debug];
            }
        }
        
        if ($fecha_fin) {
            $fecha_fin = $this->validarFormatoFecha($fecha_fin);
            if (!$fecha_fin) {
                return ['success' => false, 'message' => 'Formato de fecha de fin inválido', 'debug' => $debug];
            }
        }
        
        // Obtener eventos personales del usuario
        $resultadoPersonales = $this->obtenerEventosPersonales($NIF, $fecha_inicio, $fecha_fin);
        $debug['resultado_personales'] = $resultadoPersonales['debug'];
        
        // Verificar si se obtuvieron con éxito
        if (!$resultadoPersonales['success']) {
            return ['success' => false, 'message' => 'Error al obtener eventos personales', 'debug' => $debug];
        }
        
        $eventosPersonales = $resultadoPersonales['eventos'];
        $debug['num_eventos_personales'] = count($eventosPersonales);
        
        // Inicializar array de eventos híbridos con los eventos personales
        $eventosHibridos = $eventosPersonales;
        
        // Si se proporciona un departamento, obtener también los eventos departamentales
        if ($dpto) {
            $resultadoDepartamentales = $this->obtenerEventosDepartamentales($NIF, $dpto, $fecha_inicio, $fecha_fin);
            $debug['resultado_departamentales'] = $resultadoDepartamentales['debug'];
            
            // Verificar si se obtuvieron con éxito
            if (!$resultadoDepartamentales['success']) {
                return ['success' => false, 'message' => 'Error al obtener eventos departamentales', 'debug' => $debug];
            }
            
            $eventosDepartamentales = $resultadoDepartamentales['eventos'];
            $debug['num_eventos_departamentales'] = count($eventosDepartamentales);
            
            // Combinar eventos personales y departamentales
            $eventosHibridos = array_merge($eventosHibridos, $eventosDepartamentales);
        }
        
        // Incluir tareas como eventos si es necesario
        $incluirTareas = true; // Este valor podría ser un parámetro de entrada
        if ($incluirTareas) {
            $resultadoTareas = $this->obtenerTareasComoEventos($NIF, $fecha_inicio, $fecha_fin);
            $debug['resultado_tareas'] = $resultadoTareas['debug'];
            
            if ($resultadoTareas['success'] && !empty($resultadoTareas['tareas'])) {
                $eventosHibridos = array_merge($eventosHibridos, $resultadoTareas['tareas']);
                $debug['num_tareas'] = count($resultadoTareas['tareas']);
            } else {
                $debug['tareas_error'] = $resultadoTareas['message'] ?? 'No se encontraron tareas';
            }
        }
        
        // Incluir fichajes como eventos si es necesario
        $incluirFichajes = true; // Este valor podría ser un parámetro de entrada
        if ($incluirFichajes) {
            $resultadoFichajes = $this->obtenerFichajesComoEventos($NIF, $fecha_inicio, $fecha_fin);
            $debug['resultado_fichajes'] = $resultadoFichajes['debug'];
            
            if ($resultadoFichajes['success'] && !empty($resultadoFichajes['fichajes'])) {
                $eventosHibridos = array_merge($eventosHibridos, $resultadoFichajes['fichajes']);
                $debug['num_fichajes'] = count($resultadoFichajes['fichajes']);
            } else {
                $debug['fichajes_error'] = $resultadoFichajes['message'] ?? 'No se encontraron fichajes';
            }
        }
        
        // Asegurarnos de que todos los eventos tengan todas las propiedades necesarias
        foreach ($eventosHibridos as &$evento) {
            // Verificar y establecer propiedades obligatorias si no existen
            if (!isset($evento['id'])) {
                $evento['id'] = 'evento_' . uniqid();
            }
            if (!isset($evento['title']) && isset($evento['titulo'])) {
                $evento['title'] = $evento['titulo'];
            }
            if (!isset($evento['start']) && isset($evento['fecha_inicio'])) {
                $evento['start'] = $evento['fecha_inicio'];
            }
            if (!isset($evento['end']) && isset($evento['fecha_fin'])) {
                $evento['end'] = $evento['fecha_fin'] ?: $evento['start'];
            }
            if (!isset($evento['color'])) {
                $evento['color'] = '#6c757d'; // Color gris por defecto
            }
            if (!isset($evento['editable'])) {
                $evento['editable'] = false; // Por defecto, no editable
            }
            if (!isset($evento['eventType']) && isset($evento['tipo_evento'])) {
                $evento['eventType'] = $evento['tipo_evento'];
            }
        }
        
        $debug['num_eventos_hibridos'] = count($eventosHibridos);
        
        return [
            'success' => true,
            'eventos' => $eventosHibridos,
            'debug' => $debug
        ];
    }
    
    /**
     * Método auxiliar para obtener solo los eventos personales
     */
    private function obtenerEventosPersonales($NIF, $fecha_inicio = null, $fecha_fin = null) {
        $debug = [];
        try {
            $query = "SELECT e.*, u.nombre as nombre_usuario, u.apellidos as apellidos_usuario, 
                    'personal' as tipo_evento, 'personal' as eventType 
                    FROM eventos e 
                    JOIN usuarios u ON e.NIF_usuario = u.NIF 
                    WHERE e.NIF_usuario = ?";
            
            $params = [$NIF];
            
            // Construir cláusula WHERE para filtrar por fechas
            if ($fecha_inicio && $fecha_fin) {
                $query .= " AND ((e.fecha_inicio BETWEEN ? AND ?) 
                        OR (e.fecha_fin BETWEEN ? AND ?) 
                        OR (e.fecha_inicio <= ? AND (e.fecha_fin >= ? OR e.fecha_fin IS NULL)))";
                $params[] = $fecha_inicio;
                $params[] = $fecha_fin;
                $params[] = $fecha_inicio;
                $params[] = $fecha_fin;
                $params[] = $fecha_inicio;
                $params[] = $fecha_fin;
            } else if ($fecha_inicio) {
                $query .= " AND (e.fecha_inicio >= ? OR e.fecha_fin >= ?)";
                $params[] = $fecha_inicio;
                $params[] = $fecha_inicio;
            } else if ($fecha_fin) {
                $query .= " AND (e.fecha_inicio <= ?)";
                $params[] = $fecha_fin;
            }
            
            $debug['query'] = $query;
            $debug['params'] = $params;
            
            $stmt = $this->conn->prepare($query);
            
            if ($stmt === false) {
                $error = $this->conn->errorInfo();
                error_log("Error al preparar consulta de eventos personales: " . implode(", ", $error));
                return ['success' => false, 'message' => 'Error al preparar consulta de eventos personales', 'debug' => $debug];
            }
            
            if (!$stmt->execute($params)) {
                $error = $stmt->errorInfo();
                error_log("Error al ejecutar consulta de eventos personales: " . implode(", ", $error));
                return ['success' => false, 'message' => 'Error al consultar eventos personales', 'debug' => $debug];
            }
            
            $eventos = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Formatear las fechas para el frontend (ISO8601 con T)
            // y agregar propiedades necesarias para la interactividad del calendario
            foreach ($eventos as &$evento) {
                // Formatear fechas
                if (isset($evento['fecha_inicio'])) {
                    $evento['fecha_inicio'] = date('Y-m-d\TH:i:s', strtotime($evento['fecha_inicio']));
                }
                if (isset($evento['fecha_fin']) && $evento['fecha_fin']) {
                    $evento['fecha_fin'] = date('Y-m-d\TH:i:s', strtotime($evento['fecha_fin']));
                }
                
                // Agregar propiedades para la interactividad del calendario
                // El tipo de evento determina el color y comportamiento en el frontend
                $evento['id'] = 'evento_' . $evento['id'];
                $evento['title'] = $evento['titulo'];
                $evento['start'] = $evento['fecha_inicio'];
                $evento['end'] = $evento['fecha_fin'] ?? $evento['fecha_inicio']; // Si no hay fecha_fin, usar fecha_inicio
                
                // Usar el color específico del evento si existe, o asignar color según el tipo
                if (!empty($evento['color'])) {
                    // Mantener el color original del evento
                } else if (!empty($evento['tipo'])) {
                    // Asignar color según el tipo de evento (reunión, formación, etc.)
                    $coloresEventos = [
                        'evento' => '#3788d8',
                        'tarea' => '#f59e0b',
                        'reunion' => '#4f46e5',
                        'fichaje' => '#10b981',
                        'formacion' => '#f97316',
                        'proyecto' => '#ec4899',
                        'ausencia' => '#6b7280',
                        'personal' => '#3788d8',
                        'departamental' => '#8b5cf6'
                    ];
                    $evento['color'] = isset($coloresEventos[$evento['tipo']]) ? $coloresEventos[$evento['tipo']] : '#3788d8';
                } else {
                    $evento['color'] = '#3788d8'; // Color por defecto solo si no hay tipo ni color
                }
                
                $evento['editable'] = true; // Los eventos personales son editables
                $evento['eventType'] = 'personal'; // Tipo de evento para la lógica del frontend
                $evento['tipo_evento'] = 'personal';
            }
            
            return ['success' => true, 'eventos' => $eventos, 'debug' => $debug];
            
        } catch (Exception $e) {
            error_log("Error al obtener eventos personales: " . $e->getMessage());
            return ['success' => false, 'message' => 'Error: ' . $e->getMessage(), 'debug' => $debug];
        }
    }
    
    /**
     * Método auxiliar para obtener solo los eventos departamentales
     */
    private function obtenerEventosDepartamentales($NIF, $dpto, $fecha_inicio = null, $fecha_fin = null) {
        $debug = [];
        try {
            $query = "SELECT e.*, u.nombre as nombre_usuario, u.apellidos as apellidos_usuario, 
                    'departamental' as tipo_evento, 'departamental' as eventType 
                    FROM eventos e 
                    JOIN usuarios u ON e.NIF_usuario = u.NIF 
                    WHERE u.dpto = ? AND e.NIF_usuario != ?";
            
            $params = [$dpto, $NIF];
            
            // Construir cláusula WHERE para filtrar por fechas
            if ($fecha_inicio && $fecha_fin) {
                $query .= " AND ((e.fecha_inicio BETWEEN ? AND ?) 
                        OR (e.fecha_fin BETWEEN ? AND ?) 
                        OR (e.fecha_inicio <= ? AND (e.fecha_fin >= ? OR e.fecha_fin IS NULL)))";
                $params[] = $fecha_inicio;
                $params[] = $fecha_fin;
                $params[] = $fecha_inicio;
                $params[] = $fecha_fin;
                $params[] = $fecha_inicio;
                $params[] = $fecha_fin;
            } else if ($fecha_inicio) {
                $query .= " AND (e.fecha_inicio >= ? OR e.fecha_fin >= ?)";
                $params[] = $fecha_inicio;
                $params[] = $fecha_inicio;
            } else if ($fecha_fin) {
                $query .= " AND (e.fecha_inicio <= ?)";
                $params[] = $fecha_fin;
            }
            
            $debug['query'] = $query;
            $debug['params'] = $params;
            
            $stmt = $this->conn->prepare($query);
            
            if ($stmt === false) {
                $error = $this->conn->errorInfo();
                error_log("Error al preparar consulta de eventos departamentales: " . implode(", ", $error));
                return ['success' => false, 'message' => 'Error al preparar consulta de eventos departamentales', 'debug' => $debug];
            }
            
            if (!$stmt->execute($params)) {
                $error = $stmt->errorInfo();
                error_log("Error al ejecutar consulta de eventos departamentales: " . implode(", ", $error));
                return ['success' => false, 'message' => 'Error al consultar eventos departamentales', 'debug' => $debug];
            }
            
            $eventos = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Formatear las fechas para el frontend (ISO8601 con T)
            // y agregar propiedades necesarias para la interactividad del calendario
            foreach ($eventos as &$evento) {
                // Formatear fechas
                if (isset($evento['fecha_inicio'])) {
                    $evento['fecha_inicio'] = date('Y-m-d\TH:i:s', strtotime($evento['fecha_inicio']));
                }
                if (isset($evento['fecha_fin']) && $evento['fecha_fin']) {
                    $evento['fecha_fin'] = date('Y-m-d\TH:i:s', strtotime($evento['fecha_fin']));
                }
                
                // Agregar propiedades para la interactividad del calendario
                // El tipo de evento determina el color y comportamiento en el frontend
                $evento['id'] = 'evento_dpto_' . $evento['id'];
                $evento['title'] = $evento['titulo'];
                $evento['start'] = $evento['fecha_inicio'];
                $evento['end'] = $evento['fecha_fin'] ?? $evento['fecha_inicio']; // Si no hay fecha_fin, usar fecha_inicio
                
                // Usar el color específico del evento si existe, o asignar color según el tipo
                if (!empty($evento['color'])) {
                    // Mantener el color original del evento
                } else if (!empty($evento['tipo'])) {
                    // Asignar color según el tipo de evento (reunión, formación, etc.)
                    $coloresEventos = [
                        'evento' => '#3788d8',
                        'tarea' => '#f59e0b',
                        'reunion' => '#4f46e5',
                        'fichaje' => '#10b981',
                        'formacion' => '#f97316',
                        'proyecto' => '#ec4899',
                        'ausencia' => '#6b7280',
                        'personal' => '#3788d8',
                        'departamental' => '#8b5cf6'
                    ];
                    $evento['color'] = isset($coloresEventos[$evento['tipo']]) ? $coloresEventos[$evento['tipo']] : '#3788d8';
                } else {
                    $evento['color'] = '#3788d8'; // Color por defecto solo si no hay tipo ni color
                }
                
                $evento['editable'] = false; // Los eventos departamentales no son editables para el usuario actual
                $evento['eventType'] = 'departamental'; // Tipo de evento para la lógica del frontend
                $evento['tipo_evento'] = 'departamental';
            }
            
            return ['success' => true, 'eventos' => $eventos, 'debug' => $debug];
            
        } catch (Exception $e) {
            error_log("Error al obtener eventos departamentales: " . $e->getMessage());
            return ['success' => false, 'message' => 'Error: ' . $e->getMessage(), 'debug' => $debug];
        }
    }
    
    /**
     * Obtener las tareas del usuario como eventos para el calendario
     * @param string $NIF El NIF del usuario
     * @param string|null $fecha_inicio Fecha de inicio para filtrar
     * @param string|null $fecha_fin Fecha de fin para filtrar
     * @return array Array con las tareas como eventos
     */
    public function obtenerTareasComoEventos($NIF, $fecha_inicio = null, $fecha_fin = null) {
        $debug = [];
        $tareas = [];
        
        try {
            // Verificar si el modelo de Tarea está disponible
            if (!class_exists('Tarea')) {
                require_once __DIR__ . '/Tarea.php';
            }
            
            $modeloTarea = new Tarea();
            
            // Preparar los parámetros de filtrado para las tareas
            $filtros = [];
            if ($fecha_inicio) {
                $filtros['fecha_inicio'] = $fecha_inicio;
                $debug['fecha_inicio'] = $fecha_inicio;
            }
            if ($fecha_fin) {
                $filtros['fecha_fin'] = $fecha_fin;
                $debug['fecha_fin'] = $fecha_fin;
            }
            
            // Obtener las tareas del usuario
            $resultadoTareas = $modeloTarea->obtenerTareasPorUsuario($NIF, $filtros);
            $debug['resultado_raw'] = $resultadoTareas;
            
            if ($resultadoTareas['success'] && !empty($resultadoTareas['tareas'])) {
                // Convertir cada tarea a formato de evento para el calendario
                foreach ($resultadoTareas['tareas'] as $tarea) {
                    $evento = [
                        'id' => 'tarea_' . $tarea['id'],
                        'title' => $tarea['titulo'],
                        'description' => $tarea['descripcion'] ?? '',
                        'start' => date('Y-m-d\TH:i:s', strtotime($tarea['fecha_inicio'])),
                        'estado' => $tarea['estado'],
                        'prioridad' => $tarea['prioridad'],
                        'eventType' => 'tarea',
                        'editable' => true,
                        // Color según la prioridad de la tarea
                        'color' => $this->obtenerColorPorPrioridad($tarea['prioridad'])
                    ];
                    
                    // Si hay fecha de fin, agregarla
                    if (isset($tarea['fecha_fin']) && !empty($tarea['fecha_fin'])) {
                        $evento['end'] = date('Y-m-d\TH:i:s', strtotime($tarea['fecha_fin']));
                    } else {
                        // Si no hay fecha fin, usar la misma fecha de inicio
                        $evento['end'] = $evento['start'];
                    }
                    
                    $tareas[] = $evento;
                }
                
                $debug['tareas_convertidas'] = count($tareas);
                
                return [
                    'success' => true,
                    'tareas' => $tareas,
                    'debug' => $debug
                ];
            } else {
                $debug['error_api'] = $resultadoTareas['message'] ?? 'No se encontraron tareas';
                
                return [
                    'success' => true,
                    'tareas' => [],
                    'debug' => $debug
                ];
            }
            
        } catch (Exception $e) {
            $error = 'Error al obtener tareas como eventos: ' . $e->getMessage();
            error_log($error);
            $debug['error_exception'] = $error;
            
            return [
                'success' => false,
                'message' => $error,
                'tareas' => [],
                'debug' => $debug
            ];
        }
    }
    
    /**
     * Obtener color para una tarea según su prioridad
     */
    private function obtenerColorPorPrioridad($prioridad) {
        switch (strtolower($prioridad)) {
            case 'alta':
                return '#dc3545'; // Rojo
            case 'media':
                return '#ffc107'; // Amarillo
            case 'baja':
                return '#17a2b8'; // Azul claro
            default:
                return '#6c757d'; // Gris
        }
    }

    /**
     * Obtener fichajes del usuario convertidos a formato de eventos para el calendario
     */
    public function obtenerFichajesComoEventos($NIF, $fecha_inicio = null, $fecha_fin = null) {
        $debug = [];
        $fichajes = [];
        
        try {
            // Verificar si el modelo de Fichaje está disponible
            if (!class_exists('Fichaje')) {
                require_once __DIR__ . '/Fichaje.php';
            }
            
            $modeloFichaje = new Fichaje();
            
            // Preparar los parámetros para la consulta de fichajes
            $params = [];
            
            if ($fecha_inicio) {
                $fecha_inicio = $this->validarFormatoFecha($fecha_inicio);
                if (!$fecha_inicio) {
                    return ['success' => false, 'message' => 'Formato de fecha de inicio inválido para fichajes', 'fichajes' => [], 'debug' => $debug];
                }
                $params['fecha_inicio'] = $fecha_inicio;
                $debug['fecha_inicio'] = $fecha_inicio;
            }
            
            if ($fecha_fin) {
                $fecha_fin = $this->validarFormatoFecha($fecha_fin);
                if (!$fecha_fin) {
                    return ['success' => false, 'message' => 'Formato de fecha de fin inválido para fichajes', 'fichajes' => [], 'debug' => $debug];
                }
                $params['fecha_fin'] = $fecha_fin;
                $debug['fecha_fin'] = $fecha_fin;
            }
            
            // Obtener los fichajes del usuario usando el modelo de Fichaje
            $debug['params_consulta'] = ['NIF' => $NIF, 'params' => $params];
            
            try {
                // Consulta de fichajes (entradas y salidas) del usuario
                $queryFichajes = "SELECT f.id, f.NIF_usuario, f.tipo, f.fecha_hora, f.comentario, 
                         u.nombre, u.apellidos
                         FROM fichajes f 
                         JOIN usuarios u ON f.NIF_usuario = u.NIF 
                         WHERE f.NIF_usuario = ? ";
                
                $paramsFichajes = [$NIF];
                
                // Filtrar por rango de fechas
                if ($fecha_inicio) {
                    $queryFichajes .= " AND f.fecha_hora >= ? ";
                    $paramsFichajes[] = $fecha_inicio;
                }
                
                if ($fecha_fin) {
                    $queryFichajes .= " AND f.fecha_hora <= ? ";
                    $paramsFichajes[] = $fecha_fin;
                }
                
                $queryFichajes .= " ORDER BY f.fecha_hora DESC";
                
                $debug['query_fichajes'] = $queryFichajes;
                $debug['params_fichajes'] = $paramsFichajes;
                
                $stmtFichajes = $this->conn->prepare($queryFichajes);
                
                if ($stmtFichajes === false) {
                    $debug['error_prepare_fichajes'] = $this->conn->errorInfo()[2];
                    error_log("Error al preparar consulta de fichajes: " . $this->conn->errorInfo()[2]);
                    return ['success' => false, 'message' => 'Error al preparar consulta de fichajes', 'fichajes' => [], 'debug' => $debug];
                }
                
                foreach ($paramsFichajes as $key => $value) {
                    $stmtFichajes->bindValue($key+1, $value);
                }
                
                if (!$stmtFichajes->execute()) {
                    $debug['error_execute_fichajes'] = $stmtFichajes->errorInfo()[2];
                    error_log("Error al ejecutar consulta de fichajes: " . $stmtFichajes->errorInfo()[2]);
                    return ['success' => false, 'message' => 'Error al obtener fichajes', 'fichajes' => [], 'debug' => $debug];
                }
                
                $resultadoFichajes = $stmtFichajes->fetchAll(PDO::FETCH_ASSOC);
                $fichajes = [];
                $debug['fichajes_count'] = count($resultadoFichajes);
                
                // Convertir cada fichaje a formato de evento para el calendario
                foreach ($resultadoFichajes as $fichaje) {
                    $color = $fichaje['tipo'] === 'entrada' ? '#28a745' : '#dc3545'; // Verde para entradas, rojo para salidas
                    $titulo = $fichaje['tipo'] === 'entrada' ? 'Entrada' : 'Salida';
                    
                    $eventoFichaje = [
                        'id' => 'fichaje_' . $fichaje['id'],
                        'title' => $titulo,
                        'start' => date('Y-m-d\TH:i:s', strtotime($fichaje['fecha_hora'])),
                        'end' => date('Y-m-d\TH:i:s', strtotime($fichaje['fecha_hora'])),
                        'color' => $color,
                        'comentario' => $fichaje['comentario'] ?? '',
                        'tipo' => $fichaje['tipo'],
                        'eventType' => 'fichaje',
                        'editable' => false, // Los fichajes no se pueden editar directamente
                        'allDay' => false
                    ];
                    
                    $fichajes[] = $eventoFichaje;
                }
            } catch (Exception $e) {
                $debug['error_fichajes_excepcion'] = $e->getMessage();
                error_log("Excepción al procesar fichajes: " . $e->getMessage());
            }
            
            // También podríamos obtener registros de horas como eventos adicionales
            // Esto depende de la estructura de tu base de datos
            
            return [
                'success' => true,
                'fichajes' => $fichajes,
                'debug' => $debug
            ];
            
        } catch (Exception $e) {
            $error = 'Error al obtener fichajes como eventos: ' . $e->getMessage();
            error_log($error);
            
            return [
                'success' => false,
                'message' => $error,
                'fichajes' => [],
                'debug' => isset($debug) ? $debug : []
            ];
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
    
    /**
     * Guardar un evento (crear o actualizar)
     */
    public function guardarEvento($datos) {
        try {
            // Formatear datos para el modelo
            $eventoData = [
                'titulo' => $datos['titulo'],
                'descripcion' => $datos['descripcion'] ?? '',
                'fecha_inicio' => $datos['fecha_inicio'] ?? $datos['inicio'] ?? null, // Aceptar ambos formatos
                'fecha_fin' => $datos['fecha_fin'] ?? $datos['fin'] ?? null, // Aceptar ambos formatos
                'NIF_usuario' => $datos['NIF'], // Importante: El modelo espera 'NIF_usuario', no 'NIF'
                'id_departamento' => ($datos['tipo_evento'] === 'departamental') ? ($datos['departamento'] ?? null) : null,
                'tipo' => $datos['tipo'] ?? 'evento',
                'tipo_evento' => $datos['tipo_evento'] ?? 'personal', // Guardar si es personal o departamental
                'color' => $datos['color'] ?? '#3788d8',
                'dia_completo' => $datos['dia_completo'] ?? $datos['diaCompleto'] ?? false // Aceptar ambos formatos
            ];
            
            // Crear el evento en la base de datos
            $resultado = $this->crear($eventoData);
            
            if ($resultado['success']) {
                return [
                    'success' => true,
                    'message' => 'Evento guardado correctamente',
                    'id' => $resultado['id']
                ];
            } else {
                return [
                    'success' => false,
                    'message' => $resultado['message'] ?? 'Error al guardar el evento'
                ];
            }
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => 'Error al guardar el evento: ' . $e->getMessage()
            ];
        }
    }
    
    /**
     * Actualizar un evento existente
     */
    public function actualizarEvento($datos) {
        try {
            // Eliminar id de los datos para evitar errores
            $idEvento = $datos['id'];
            unset($datos['id']);
            
            // Comprobar si tenemos el campo tipo_evento
            if (isset($datos['tipo_evento']) && $datos['tipo_evento'] === 'departamental') {
                // Si es un evento departamental, asegurar que tiene id_departamento
                $datos['id_departamento'] = $datos['departamento'] ?? null;
            } else if (isset($datos['tipo_evento']) && $datos['tipo_evento'] === 'personal') {
                // Si es un evento personal, establecer id_departamento a NULL
                $datos['id_departamento'] = null;
            }
            
            $camposActualizados = [];
            $parametros = [];
            
            // Validar y mapear los campos disponibles
            $camposPermitidos = [
                'titulo' => 'titulo',
                'descripcion' => 'descripcion',
                'fecha_inicio' => 'fecha_inicio',
                'inicio' => 'fecha_inicio',
                'fecha_fin' => 'fecha_fin',
                'fin' => 'fecha_fin',
                'tipo' => 'tipo',
                'tipo_evento' => 'tipo_evento',
                'id_departamento' => 'id_departamento',
                'departamento' => 'id_departamento',
                'color' => 'color',
                'dia_completo' => 'dia_completo',
                'diaCompleto' => 'dia_completo'
            ];
            
            // Construir la consulta y los parámetros
            foreach ($camposPermitidos as $campoDatos => $campoDb) {
                
                // Verificar si el campo existe en los datos
                if (isset($datos[$campoDatos])) {
                    // Para las fechas, asegurarse de que estén en formato correcto
                    if ($campoDb === 'fecha_inicio' || $campoDb === 'fecha_fin') {
                        $datos[$campoDatos] = $this->validarFormatoFecha($datos[$campoDatos]);
                    }
                    $camposActualizados[] = "$campoDb = :$campoDb";
                    $parametros[$campoDb] = $datos[$campoDatos];
                }
            }
            
            // Si no hay campos para actualizar, devolver mensaje
            if (empty($camposActualizados)) {
                return ['success' => false, 'message' => 'No hay campos para actualizar'];
            }
            
            // Construir la consulta SQL
            $query = "UPDATE eventos SET ";
            
            // Completar la query con los campos a actualizar
            $query .= implode(", ", $camposActualizados);
            $query .= " WHERE id = :id";
            $parametros['id'] = $idEvento;
            
            // Preparar y ejecutar la consulta
            $stmt = $this->conn->prepare($query);
            
            foreach ($parametros as $campo => $valor) {
                $stmt->bindValue(":$campo", $valor);
            }
            
            // Ejecutar la consulta
            if ($stmt->execute()) {
                return [
                    'success' => true,
                    'message' => 'Evento actualizado correctamente'
                ];
            } else {
                return [
                    'success' => false,
                    'message' => 'Error al actualizar el evento: ' . implode(", ", $stmt->errorInfo())
                ];
            }
            
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => 'Error al actualizar el evento: ' . $e->getMessage()
            ];
        }
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
}
?>
