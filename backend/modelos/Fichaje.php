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
        // Verificar si el fichaje tiene hora de salida
        $query = "SELECT horaFin FROM registros 
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
        }
        
        return 'trabajando';
    }
    
    // Registrar entrada
    public function registrarEntrada($id_usuario, $fecha, $hora) {
        // Verificar si ya existe un fichaje activo
        $fichaje_actual = $this->getFichajeActual($id_usuario);
        
        if ($fichaje_actual['success'] && $fichaje_actual['estado'] === 'trabajando') {
            return [
                'success' => false,
                'error' => 'Ya existe un fichaje activo para hoy'
            ];
        }
        
        // Insertar nuevo fichaje
        $query = "INSERT INTO registros 
                  (NIF, fecha, horaInicio) 
                  VALUES (?, ?, ?)";
        
        $stmt = $this->conn->prepare($query);
        
        if ($stmt === false) {
            error_log("Error en la preparación de la consulta de inserción: " . $this->conn->error);
            return [
                'success' => false,
                'error' => 'Error en la consulta de inserción: ' . $this->conn->error
            ];
        }
        
        $stmt->bind_param("sss", $id_usuario, $fecha, $hora);
        
        if ($stmt->execute()) {
            $id_fichaje = $this->conn->insert_id;
            
            return [
                'success' => true,
                'message' => 'Entrada registrada correctamente',
                'id_fichaje' => $id_fichaje,
                'estado' => 'trabajando'
            ];
        }
        
        return [
            'success' => false,
            'error' => 'Error al registrar la entrada'
        ];
    }
    
    // Registrar salida
    public function registrarSalida($id_usuario, $id_fichaje, $hora) {
        // Verificar que el fichaje pertenece al usuario
        $query = "SELECT * FROM registros 
                  WHERE idRegistro = ? AND NIF = ?";
        
        $stmt = $this->conn->prepare($query);
        
        if ($stmt === false) {
            error_log("Error en la preparación de la consulta de verificación: " . $this->conn->error);
            return [
                'success' => false,
                'error' => 'Error en la consulta de verificación: ' . $this->conn->error
            ];
        }
        
        $stmt->bind_param("is", $id_fichaje, $id_usuario);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows === 0) {
            return [
                'success' => false,
                'error' => 'El fichaje no pertenece al usuario'
            ];
        }
        
        // Verificar que el fichaje no tiene ya una hora de salida
        $row = $result->fetch_assoc();
        if (!empty($row['horaFin'])) {
            return [
                'success' => false,
                'error' => 'El fichaje ya tiene registrada una salida'
            ];
        }
        
        // Actualizar la hora de salida
        $query = "UPDATE registros 
                  SET horaFin = ? 
                  WHERE idRegistro = ?";
        
        $stmt = $this->conn->prepare($query);
        
        if ($stmt === false) {
            error_log("Error en la preparación de la consulta de actualización: " . $this->conn->error);
            return [
                'success' => false,
                'error' => 'Error en la consulta de actualización: ' . $this->conn->error
            ];
        }
        
        $stmt->bind_param("si", $hora, $id_fichaje);
        
        if ($stmt->execute()) {
            return [
                'success' => true,
                'message' => 'Salida registrada correctamente',
                'estado' => 'finalizado'
            ];
        }
        
        return [
            'success' => false,
            'error' => 'Error al registrar la salida'
        ];
    }
    
    // Obtener historial de fichajes de un usuario
    public function getHistorialByUsuario($id_usuario) {
        $query = "SELECT * FROM registros 
                  WHERE NIF = ? 
                  ORDER BY fecha DESC, horaInicio DESC";
        
        $stmt = $this->conn->prepare($query);
        
        if ($stmt === false) {
            error_log("Error en la preparación de la consulta de historial: " . $this->conn->error);
            return [
                'success' => false,
                'error' => 'Error en la consulta de historial: ' . $this->conn->error
            ];
        }
        
        $stmt->bind_param("s", $id_usuario);
        $stmt->execute();
        $result = $stmt->get_result();
        
        $registros = [];
        while ($row = $result->fetch_assoc()) {
            $registros[] = $row;
        }
        
        return [
            'success' => true,
            'registros' => $registros
        ];
    }
}
?>
