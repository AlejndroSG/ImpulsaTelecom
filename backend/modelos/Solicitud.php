<?php
    include_once "bd.php";
    
    // Configuración de registro de errores
    ini_set('display_errors', 0);
    ini_set('log_errors', 1);
    ini_set('error_log', __DIR__ . '/../logs/solicitudes_error.log');

class Solicitud {
    private $database;
    private $conn;
    private $table_name = "solicitudes";
    
    // Constructor con conexión a la base de datos
    public function __construct() {
        $this->database = new db();
        $this->conn = $this->database->getConn();
        
        // Asegurarse de que la tabla existe
        $this->verificarTabla();
    }
    
    // Verificar y crear la tabla si no existe
    private function verificarTabla() {
        $query = "SHOW TABLES LIKE '{$this->table_name}'";
        $result = $this->conn->query($query);
        
        if ($result->num_rows == 0) {
            // Crear la tabla de solicitudes
            $createQuery = "CREATE TABLE {$this->table_name} (
                idSolicitud INT AUTO_INCREMENT PRIMARY KEY,
                NIF VARCHAR(15) NOT NULL,
                tipo ENUM('horaria', 'diaria') NOT NULL,
                fecha_inicio DATE NOT NULL,
                fecha_fin DATE NULL,
                hora_inicio TIME NULL,
                hora_fin TIME NULL,
                motivo TEXT,
                estado ENUM('pendiente', 'aprobada', 'rechazada') DEFAULT 'pendiente',
                fecha_solicitud TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                fecha_respuesta TIMESTAMP NULL,
                comentario_respuesta TEXT NULL,
                FOREIGN KEY (NIF) REFERENCES usuarios(NIF) ON DELETE CASCADE
            )";
            
            if ($this->conn->query($createQuery) === FALSE) {
                error_log("Error al crear la tabla {$this->table_name}: " . $this->conn->error);
            }
        }
        
        // Verificar si existe la tabla de notificaciones
        $query = "SHOW TABLES LIKE 'notificaciones'";
        $result = $this->conn->query($query);
        
        if ($result->num_rows == 0) {
            // Crear la tabla de notificaciones
            $createQuery = "CREATE TABLE notificaciones (
                idNotificacion INT AUTO_INCREMENT PRIMARY KEY,
                NIF VARCHAR(15) NOT NULL,
                tipo VARCHAR(50) NOT NULL,
                mensaje TEXT NOT NULL,
                leida BOOLEAN DEFAULT FALSE,
                fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                id_referencia INT NULL,
                FOREIGN KEY (NIF) REFERENCES usuarios(NIF) ON DELETE CASCADE
            )";
            
            if ($this->conn->query($createQuery) === FALSE) {
                error_log("Error al crear la tabla notificaciones: " . $this->conn->error);
            }
        }
    }
    
    // Obtener el nombre de la tabla
    public function getTableName() {
        return $this->table_name;
    }
    
    // Obtener la conexión
    public function getConn() {
        return $this->conn;
    }
    
    // Crear una nueva solicitud
    public function crearSolicitud($datos) {
        // Validar datos obligatorios
        if (!isset($datos['NIF']) || !isset($datos['tipo']) || !isset($datos['fecha_inicio'])) {
            return [
                'success' => false,
                'error' => 'Faltan datos obligatorios para crear la solicitud'
            ];
        }
        
        // Preparar la consulta según el tipo de solicitud
        if ($datos['tipo'] === 'horaria') {
            // Para solicitud horaria necesitamos hora_inicio y hora_fin
            if (!isset($datos['hora_inicio']) || !isset($datos['hora_fin'])) {
                return [
                    'success' => false,
                    'error' => 'Para solicitudes horarias se requiere hora de inicio y fin'
                ];
            }
            
            $query = "INSERT INTO {$this->table_name} 
                      (NIF, tipo, fecha_inicio, hora_inicio, hora_fin, motivo) 
                      VALUES (?, ?, ?, ?, ?, ?)";
            
            $stmt = $this->conn->prepare($query);
            
            if ($stmt === false) {
                error_log("Error en la preparación de la consulta: " . $this->conn->error);
                return [
                    'success' => false,
                    'error' => 'Error en la consulta: ' . $this->conn->error
                ];
            }
            
            $stmt->bind_param("ssssss", 
                $datos['NIF'], 
                $datos['tipo'], 
                $datos['fecha_inicio'], 
                $datos['hora_inicio'], 
                $datos['hora_fin'], 
                $datos['motivo']
            );
        } else { // tipo diaria
            // Para solicitud diaria necesitamos fecha_fin
            if (!isset($datos['fecha_fin'])) {
                return [
                    'success' => false,
                    'error' => 'Para solicitudes diarias se requiere fecha de fin'
                ];
            }
            
            $query = "INSERT INTO {$this->table_name} 
                      (NIF, tipo, fecha_inicio, fecha_fin, motivo) 
                      VALUES (?, ?, ?, ?, ?)";
            
            $stmt = $this->conn->prepare($query);
            
            if ($stmt === false) {
                error_log("Error en la preparación de la consulta: " . $this->conn->error);
                return [
                    'success' => false,
                    'error' => 'Error en la consulta: ' . $this->conn->error
                ];
            }
            
            $stmt->bind_param("sssss", 
                $datos['NIF'], 
                $datos['tipo'], 
                $datos['fecha_inicio'], 
                $datos['fecha_fin'], 
                $datos['motivo']
            );
        }
        
        if ($stmt->execute()) {
            $id_solicitud = $stmt->insert_id;
            
            // Crear notificación para el administrador
            $this->crearNotificacion([
                'NIF' => 'admin', // Asumiendo que hay un usuario admin
                'tipo' => 'nueva_solicitud',
                'mensaje' => "Nueva solicitud de ausencia de {$datos['NIF']}",
                'id_referencia' => $id_solicitud
            ]);
            
            return [
                'success' => true,
                'id_solicitud' => $id_solicitud,
                'message' => 'Solicitud creada correctamente'
            ];
        } else {
            error_log("Error al ejecutar la consulta: " . $stmt->error);
            return [
                'success' => false,
                'error' => 'Error al crear la solicitud: ' . $stmt->error
            ];
        }
    }
    
    // Obtener solicitudes de un usuario
    public function getSolicitudesUsuario($NIF) {
        $query = "SELECT * FROM {$this->table_name} WHERE NIF = ? ORDER BY fecha_solicitud DESC";
        
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
        
        $solicitudes = [];
        while ($row = $result->fetch_assoc()) {
            $solicitudes[] = $row;
        }
        
        return [
            'success' => true,
            'solicitudes' => $solicitudes
        ];
    }
    
    // Obtener todas las solicitudes (para administradores)
    public function getAllSolicitudes() {
        $query = "SELECT s.*, u.nombre FROM {$this->table_name} s 
                  JOIN usuarios u ON s.NIF = u.NIF 
                  ORDER BY fecha_solicitud DESC";
        
        $result = $this->conn->query($query);
        
        if ($result === false) {
            error_log("Error en la consulta: " . $this->conn->error);
            return [
                'success' => false,
                'error' => 'Error en la consulta: ' . $this->conn->error
            ];
        }
        
        $solicitudes = [];
        while ($row = $result->fetch_assoc()) {
            $solicitudes[] = $row;
        }
        
        return [
            'success' => true,
            'solicitudes' => $solicitudes
        ];
    }
    
    // Responder a una solicitud (aprobar o rechazar)
    public function responderSolicitud($id_solicitud, $estado, $comentario = '') {
        // Verificar que el estado sea válido
        if ($estado !== 'aprobada' && $estado !== 'rechazada') {
            return [
                'success' => false,
                'error' => 'Estado no válido. Debe ser "aprobada" o "rechazada"'
            ];
        }
        
        // Obtener la solicitud para conocer el usuario
        $query = "SELECT NIF FROM {$this->table_name} WHERE idSolicitud = ?";
        $stmt = $this->conn->prepare($query);
        
        if ($stmt === false) {
            error_log("Error en la preparación de la consulta: " . $this->conn->error);
            return [
                'success' => false,
                'error' => 'Error en la consulta: ' . $this->conn->error
            ];
        }
        
        $stmt->bind_param("i", $id_solicitud);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows === 0) {
            return [
                'success' => false,
                'error' => 'No se encontró la solicitud'
            ];
        }
        
        $row = $result->fetch_assoc();
        $NIF = $row['NIF'];
        
        // Actualizar el estado de la solicitud
        $query = "UPDATE {$this->table_name} 
                  SET estado = ?, comentario_respuesta = ?, fecha_respuesta = NOW() 
                  WHERE idSolicitud = ?";
        
        $stmt = $this->conn->prepare($query);
        
        if ($stmt === false) {
            error_log("Error en la preparación de la consulta: " . $this->conn->error);
            return [
                'success' => false,
                'error' => 'Error en la consulta: ' . $this->conn->error
            ];
        }
        
        $stmt->bind_param("ssi", $estado, $comentario, $id_solicitud);
        
        if ($stmt->execute()) {
            // Crear notificación para el usuario
            $mensaje = "Tu solicitud de ausencia ha sido {$estado}";
            if (!empty($comentario)) {
                $mensaje .= ". Comentario: {$comentario}";
            }
            
            $this->crearNotificacion([
                'NIF' => $NIF,
                'tipo' => 'respuesta_solicitud',
                'mensaje' => $mensaje,
                'id_referencia' => $id_solicitud
            ]);
            
            return [
                'success' => true,
                'message' => 'Solicitud actualizada correctamente'
            ];
        } else {
            error_log("Error al ejecutar la consulta: " . $stmt->error);
            return [
                'success' => false,
                'error' => 'Error al actualizar la solicitud: ' . $stmt->error
            ];
        }
    }
    
    // Crear una notificación
    public function crearNotificacion($datos) {
        // Validar datos obligatorios
        if (!isset($datos['NIF']) || !isset($datos['tipo']) || !isset($datos['mensaje'])) {
            return [
                'success' => false,
                'error' => 'Faltan datos obligatorios para crear la notificación'
            ];
        }
        
        $query = "INSERT INTO notificaciones 
                  (NIF, tipo, mensaje, id_referencia) 
                  VALUES (?, ?, ?, ?)";
        
        $stmt = $this->conn->prepare($query);
        
        if ($stmt === false) {
            error_log("Error en la preparación de la consulta: " . $this->conn->error);
            return [
                'success' => false,
                'error' => 'Error en la consulta: ' . $this->conn->error
            ];
        }
        
        $id_referencia = isset($datos['id_referencia']) ? $datos['id_referencia'] : null;
        
        $stmt->bind_param("sssi", 
            $datos['NIF'], 
            $datos['tipo'], 
            $datos['mensaje'], 
            $id_referencia
        );
        
        if ($stmt->execute()) {
            return [
                'success' => true,
                'id_notificacion' => $stmt->insert_id,
                'message' => 'Notificación creada correctamente'
            ];
        } else {
            error_log("Error al ejecutar la consulta: " . $stmt->error);
            return [
                'success' => false,
                'error' => 'Error al crear la notificación: ' . $stmt->error
            ];
        }
    }
    
    // Obtener notificaciones de un usuario
    public function getNotificacionesUsuario($NIF) {
        $query = "SELECT * FROM notificaciones WHERE NIF = ? ORDER BY fecha DESC";
        
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
        
        $notificaciones = [];
        while ($row = $result->fetch_assoc()) {
            $notificaciones[] = $row;
        }
        
        return [
            'success' => true,
            'notificaciones' => $notificaciones
        ];
    }
    
    // Marcar notificación como leída
    public function marcarNotificacionLeida($id_notificacion) {
        $query = "UPDATE notificaciones SET leida = TRUE WHERE idNotificacion = ?";
        
        $stmt = $this->conn->prepare($query);
        
        if ($stmt === false) {
            error_log("Error en la preparación de la consulta: " . $this->conn->error);
            return [
                'success' => false,
                'error' => 'Error en la consulta: ' . $this->conn->error
            ];
        }
        
        $stmt->bind_param("i", $id_notificacion);
        
        if ($stmt->execute()) {
            return [
                'success' => true,
                'message' => 'Notificación marcada como leída'
            ];
        } else {
            error_log("Error al ejecutar la consulta: " . $stmt->error);
            return [
                'success' => false,
                'error' => 'Error al actualizar la notificación: ' . $stmt->error
            ];
        }
    }
    
    // Contar notificaciones no leídas
    public function contarNotificacionesNoLeidas($NIF) {
        $query = "SELECT COUNT(*) as total FROM notificaciones WHERE NIF = ? AND leida = FALSE";
        
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
        $row = $result->fetch_assoc();
        
        return [
            'success' => true,
            'total' => $row['total']
        ];
    }
}