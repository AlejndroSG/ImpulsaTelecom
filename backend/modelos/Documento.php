<?php

class Documento {
    private $db;
    
    public function __construct() {
        require_once 'bd.php';
        $this->db = Database::connect();
    }
    
    /**
     * Crea la tabla de documentos si no existe
     */
    public function crearTablaDocumentos() {
        $query = "CREATE TABLE IF NOT EXISTS documentos (
            id INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
            titulo VARCHAR(255) NOT NULL,
            descripcion TEXT,
            ruta_archivo VARCHAR(255) NOT NULL,
            fecha_subida DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            tipo_documento VARCHAR(50) NOT NULL,
            tamanio INT(11) NOT NULL,
            nif_usuario VARCHAR(15) NOT NULL,
            creado_por VARCHAR(15) NOT NULL,
            acceso_publico TINYINT(1) NOT NULL DEFAULT 0,
            fecha_expiracion DATE NULL,
            FOREIGN KEY (nif_usuario) REFERENCES usuarios(NIF) ON DELETE CASCADE
        )";
        
        $this->db->query($query);
    }
    
    /**
     * Obtiene todos los documentos
     */
    public function obtenerTodos() {
        $query = "SELECT d.*, u.nombre, u.apellidos 
                FROM documentos d
                JOIN usuarios u ON d.nif_usuario = u.NIF
                ORDER BY d.fecha_subida DESC";
        $result = $this->db->query($query);
        
        $documentos = [];
        while($row = $result->fetch_assoc()) {
            $documentos[] = $row;
        }
        
        return $documentos;
    }
    
    /**
     * Obtiene los documentos de un usuario especu00edfico
     */
    public function obtenerPorUsuario($nif) {
        $query = "SELECT * FROM documentos WHERE nif_usuario = ? ORDER BY fecha_subida DESC";
        $stmt = $this->db->prepare($query);
        $stmt->bind_param("s", $nif);
        $stmt->execute();
        
        $result = $stmt->get_result();
        $documentos = [];
        while($row = $result->fetch_assoc()) {
            $documentos[] = $row;
        }
        
        return $documentos;
    }
    
    /**
     * Obtiene un documento por su ID
     */
    public function obtenerPorId($id) {
        $query = "SELECT * FROM documentos WHERE id = ?";
        $stmt = $this->db->prepare($query);
        $stmt->bind_param("i", $id);
        $stmt->execute();
        
        $result = $stmt->get_result();
        if($result->num_rows > 0) {
            return $result->fetch_assoc();
        }
        return null;
    }
    
    /**
     * Guarda un nuevo documento
     */
    public function guardar($titulo, $descripcion, $ruta_archivo, $tipo_documento, $tamanio, $nif_usuario, $nif_creador, $acceso_publico = 0, $fecha_expiracion = null) {
        $query = "INSERT INTO documentos (titulo, descripcion, ruta_archivo, tipo_documento, tamanio, nif_usuario, creado_por, acceso_publico, fecha_expiracion) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
                
        $stmt = $this->db->prepare($query);
        $stmt->bind_param("ssssissis", $titulo, $descripcion, $ruta_archivo, $tipo_documento, $tamanio, $nif_usuario, $nif_creador, $acceso_publico, $fecha_expiracion);
        
        if($stmt->execute()) {
            return $this->db->insert_id;
        }
        return false;
    }
    
    /**
     * Actualiza un documento existente
     */
    public function actualizar($id, $titulo, $descripcion, $acceso_publico = 0, $fecha_expiracion = null) {
        $query = "UPDATE documentos SET titulo = ?, descripcion = ?, acceso_publico = ?, fecha_expiracion = ? WHERE id = ?";
        $stmt = $this->db->prepare($query);
        $stmt->bind_param("ssisi", $titulo, $descripcion, $acceso_publico, $fecha_expiracion, $id);
        
        return $stmt->execute();
    }
    
    /**
     * Elimina un documento
     */
    public function eliminar($id) {
        // Primero obtenemos la ruta del archivo para eliminarlo
        $documento = $this->obtenerPorId($id);
        if($documento) {
            $rutaCompleta = $_SERVER['DOCUMENT_ROOT'] . '/ImpulsaTelecom' . $documento['ruta_archivo'];
            
            // Eliminamos el registro de la BD
            $query = "DELETE FROM documentos WHERE id = ?";
            $stmt = $this->db->prepare($query);
            $stmt->bind_param("i", $id);
            
            $resultado = $stmt->execute();
            
            // Si se eliminu00f3 correctamente de la BD, eliminamos el archivo
            if($resultado && file_exists($rutaCompleta)) {
                unlink($rutaCompleta);
            }
            
            return $resultado;
        }
        return false;
    }
    
    /**
     * Verifica si un usuario tiene acceso a un documento
     */
    public function verificarAcceso($id_documento, $nif_usuario, $es_admin = false) {
        $documento = $this->obtenerPorId($id_documento);
        
        if(!$documento) {
            return false;
        }
        
        // Si es administrador o si el documento pertenece al usuario o si es de acceso pu00fablico
        return $es_admin || $documento['nif_usuario'] === $nif_usuario || $documento['acceso_publico'] == 1;
    }
    
    /**
     * Obtiene documentos por tipo
     */
    public function obtenerPorTipo($tipo, $nif_usuario = null) {
        $query = "SELECT * FROM documentos WHERE tipo_documento = ?";
        
        // Si se especifica un usuario, filtramos por u00e9l
        if($nif_usuario) {
            $query .= " AND nif_usuario = ?";
            $stmt = $this->db->prepare($query);
            $stmt->bind_param("ss", $tipo, $nif_usuario);
        } else {
            $stmt = $this->db->prepare($query);
            $stmt->bind_param("s", $tipo);
        }
        
        $stmt->execute();
        $result = $stmt->get_result();
        
        $documentos = [];
        while($row = $result->fetch_assoc()) {
            $documentos[] = $row;
        }
        
        return $documentos;
    }
}
