<?php

class Documento {
    private $db;
    
    public function __construct() {
        require_once 'bd.php';
        $connection = new db();
        $this->db = $connection->getConn();
    }
    
    /**
     * Obtiene la conexión a la base de datos
     * 
     * @return mysqli La conexión a la base de datos
     */
    public function getDb() {
        return $this->db;
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
     * 
     * @return array Lista de documentos
     */
    public function obtenerTodos() {
        // Usar LEFT JOIN en lugar de JOIN para obtener documentos incluso si no hay usuario asociado
        // Esto es importante si la relación de clave foránea no está funcionando correctamente
        $query = "SELECT d.*, u.nombre, u.apellidos 
                FROM documentos d
                LEFT JOIN usuarios u ON d.nif_usuario = u.NIF
                ORDER BY d.fecha_subida DESC";
                
        try {
            $result = $this->db->query($query);
            
            if (!$result) {
                error_log("Error en la consulta: " . $this->db->error);
                // Intentar con una consulta más simple sin el JOIN
                $query = "SELECT * FROM documentos ORDER BY fecha_subida DESC";
                $result = $this->db->query($query);
                
                if (!$result) {
                    error_log("Error en la consulta simplificada: " . $this->db->error);
                    return [];
                }
            }
            
            $documentos = [];
            while($row = $result->fetch_assoc()) {
                // Asegurar que todos los documentos tengan al menos nombres vacíos si el JOIN no funciona
                if (!isset($row['nombre'])) $row['nombre'] = '';
                if (!isset($row['apellidos'])) $row['apellidos'] = '';
                
                $documentos[] = $row;
            }
            
            return $documentos;
        } catch (Exception $e) {
            error_log("Excepción al obtener documentos: " . $e->getMessage());
            return [];
        }
    }
    
    /**
     * Obtiene documentos de un usuario específico por su NIF
     * 
     * @param string $nif NIF del usuario
     * @param bool $incluirPublicos Si se deben incluir documentos públicos de otros usuarios
     * @return array Lista de documentos del usuario
     */
    public function obtenerPorUsuario($nif, $incluirPublicos = false) {
        try {
            // Información de depuración
            error_log("Buscando documentos para NIF: {$nif}");
            
            // Buscar todos los documentos primero para depurar
            $query_debug = "SELECT * FROM documentos";
            $result_debug = $this->db->query($query_debug);
            
            if ($result_debug) {
                error_log("Total de documentos en la base de datos: " . $result_debug->num_rows);
                while($row = $result_debug->fetch_assoc()) {
                    error_log("Documento ID: " . $row['id'] . ", NIF Usuario: " . $row['nif_usuario'] . ", Título: " . $row['titulo']);
                }
            }
            
            // Solución 1: Comparación directa
            $query = "";
            if ($incluirPublicos) {
                $query = "SELECT d.*, u.nombre, u.apellidos 
                        FROM documentos d
                        LEFT JOIN usuarios u ON d.nif_usuario = u.NIF
                        WHERE d.nif_usuario = ? OR d.acceso_publico = 1
                        ORDER BY d.fecha_subida DESC";
            } else {
                $query = "SELECT d.*, u.nombre, u.apellidos 
                        FROM documentos d
                        LEFT JOIN usuarios u ON d.nif_usuario = u.NIF
                        WHERE d.nif_usuario = ?
                        ORDER BY d.fecha_subida DESC";
            }
            
            $stmt = $this->db->prepare($query);
            $stmt->bind_param("s", $nif);
            $stmt->execute();
            $result = $stmt->get_result();
            
            error_log("Consulta SQL ejecutada: " . str_replace('?', "'$nif'", $query));
            
            if (!$result) {
                error_log("Error en la consulta de documentos por usuario: " . $this->db->error);
                return [];
            }
            
            error_log("Documentos encontrados para NIF '$nif': " . $result->num_rows);
            
            // Si no encontramos resultados con la comparación directa, intentamos con LIKE
            if ($result->num_rows == 0) {
                error_log("Intentando búsqueda alternativa por similitud de NIF");
                
                // Limpiar el NIF de posibles guiones o espacios
                $nif_limpio = str_replace(['-', ' '], '', $nif);
                
                // Preparar el patrón para LIKE
                $nif_pattern = "%" . $nif_limpio . "%";
                
                if ($incluirPublicos) {
                    $query_alt = "SELECT d.*, u.nombre, u.apellidos 
                            FROM documentos d
                            LEFT JOIN usuarios u ON d.nif_usuario = u.NIF
                            WHERE d.nif_usuario LIKE ? OR d.acceso_publico = 1
                            ORDER BY d.fecha_subida DESC";
                } else {
                    $query_alt = "SELECT d.*, u.nombre, u.apellidos 
                            FROM documentos d
                            LEFT JOIN usuarios u ON d.nif_usuario = u.NIF
                            WHERE d.nif_usuario LIKE ?
                            ORDER BY d.fecha_subida DESC";
                }
                
                $stmt_alt = $this->db->prepare($query_alt);
                $stmt_alt->bind_param("s", $nif_pattern);
                $stmt_alt->execute();
                $result = $stmt_alt->get_result();
                
                error_log("Consulta alternativa SQL ejecutada: " . str_replace('?', "'$nif_pattern'", $query_alt));
                error_log("Documentos encontrados con búsqueda alternativa: " . $result->num_rows);
            }
            
            $documentos = [];
            while($row = $result->fetch_assoc()) {
                // Asegurar que todos los documentos tengan al menos nombres vacíos si el JOIN no funciona
                if (!isset($row['nombre'])) $row['nombre'] = '';
                if (!isset($row['apellidos'])) $row['apellidos'] = '';
                
                $documentos[] = $row;
            }
            
            return $documentos;
        } catch (Exception $e) {
            error_log("Excepción al obtener documentos por usuario: " . $e->getMessage());
            return [];
        }
    }
    
    /**
     * Obtiene un documento por su ID
     * 
     * @param int $id ID del documento
     * @return array|null Datos del documento o null si no existe
     */
    public function obtenerPorId($id) {
        try {
            $query = "SELECT d.*, u.nombre, u.apellidos 
                    FROM documentos d
                    LEFT JOIN usuarios u ON d.nif_usuario = u.NIF
                    WHERE d.id = ?";
                    
            $stmt = $this->db->prepare($query);
            $stmt->bind_param("i", $id);
            $stmt->execute();
            $result = $stmt->get_result();
            
            if (!$result || $result->num_rows === 0) {
                return null;
            }
            
            $documento = $result->fetch_assoc();
            // Asegurar que el documento tenga al menos nombres vacíos si el JOIN no funciona
            if (!isset($documento['nombre'])) $documento['nombre'] = '';
            if (!isset($documento['apellidos'])) $documento['apellidos'] = '';
            
            return $documento;
        } catch (Exception $e) {
            error_log("Excepción al obtener documento por ID: " . $e->getMessage());
            return null;
        }
    }
    
    /**
     * Verifica si un usuario tiene acceso a un documento
     * 
     * @param int $idDocumento ID del documento
     * @param string $nifUsuario NIF del usuario
     * @param bool $esAdmin Si el usuario es administrador
     * @return bool True si tiene acceso, False si no
     */
    public function verificarAcceso($idDocumento, $nifUsuario, $esAdmin = false) {
        // Administradores tienen acceso a todo
        if ($esAdmin) {
            return true;
        }
        
        try {
            // Obtener el documento
            $documento = $this->obtenerPorId($idDocumento);
            
            if (!$documento) {
                return false;
            }
            
            // Usuario puede acceder a sus propios documentos
            if ($documento['nif_usuario'] === $nifUsuario) {
                return true;
            }
            
            // Usuario puede acceder a documentos públicos
            if (isset($documento['acceso_publico']) && $documento['acceso_publico'] == 1) {
                return true;
            }
            
            // En cualquier otro caso, no tiene acceso
            return false;
        } catch (Exception $e) {
            error_log("Excepción al verificar acceso: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Subir un nuevo documento
     * 
     * @param array $datos Los datos del documento (titulo, descripcion, tipo_documento, etc.)
     * @param string $rutaArchivo La ruta donde se guardó el archivo
     * @return int|bool El ID del documento creado o false si falló
     */
    public function subir($datos, $rutaArchivo) {
        error_log("Intentando subir documento con datos: " . print_r($datos, true));
        
        // Extraer los datos necesarios
        $titulo = isset($datos['titulo']) ? $datos['titulo'] : 'Documento sin título';
        $descripcion = isset($datos['descripcion']) ? $datos['descripcion'] : '';
        $tipo_documento = isset($datos['tipo_documento']) ? $datos['tipo_documento'] : 'otro';
        $nif_usuario = isset($datos['nif_usuario']) ? $datos['nif_usuario'] : '';
        $nif_creador = isset($datos['nif_creador']) ? $datos['nif_creador'] : $nif_usuario;
        $acceso_publico = isset($datos['acceso_publico']) ? intval($datos['acceso_publico']) : 0;
        $fecha_expiracion = isset($datos['fecha_expiracion']) ? $datos['fecha_expiracion'] : null;
        $tamanio = isset($datos['tamanio']) ? intval($datos['tamanio']) : 0;
        
        // Validar que tenemos el NIF del usuario
        if (empty($nif_usuario)) {
            error_log("Error: No se proporcionó NIF de usuario para el documento");
            return false;
        }
        
        // Insertar en la base de datos
        return $this->guardar(
            $titulo,
            $descripcion,
            $rutaArchivo,
            $tipo_documento,
            $tamanio,
            $nif_usuario,
            $nif_creador,
            $acceso_publico,
            $fecha_expiracion
        );
    }
    
    // Nota: La función obtenerPorId() está definida anteriormente en el archivo
    
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
            $nifUsuario = $documento['nif_usuario'];
            
            // Eliminamos el registro de la BD
            $query = "DELETE FROM documentos WHERE id = ?";
            $stmt = $this->db->prepare($query);
            $stmt->bind_param("i", $id);
            
            $resultado = $stmt->execute();
            
            // Si se eliminó correctamente de la BD, eliminamos el archivo
            if($resultado && file_exists($rutaCompleta)) {
                unlink($rutaCompleta);
                
                // Verificar si la carpeta del usuario quedó vacía
                $carpetaUsuario = $_SERVER['DOCUMENT_ROOT'] . '/ImpulsaTelecom/uploads/documentos/' . $nifUsuario . '/';
                if (file_exists($carpetaUsuario)) {
                    // Contar cuántos archivos quedan en la carpeta
                    $archivos = scandir($carpetaUsuario);
                    $archivos = array_diff($archivos, array('.', '..'));
                    
                    // Si no quedan archivos, eliminamos la carpeta
                    if (empty($archivos)) {
                        rmdir($carpetaUsuario);
                    }
                }
            }
            
            return $resultado;
        }
        return false;
    }
    
    // La función verificarAcceso ya está definida anteriormente en el archivo (líneas 229-259)
    // Eliminar esta duplicación para evitar el error 'Cannot redeclare Documento::verificarAcceso()'
    
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
