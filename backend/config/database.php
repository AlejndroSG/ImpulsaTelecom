<?php
/**
 * Configuración de la conexión a la base de datos
 */

// Configuración de errores
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/../logs/database_error.log');

class Database {
    // Parámetros de conexión
    private $host = 'localhost';
    private $dbname = 'ImpulsaTelecom'; 
    private $username = 'root';
    private $password = '';
    private $charset = 'utf8mb4';
    private $conn;
    
    /**
     * Constructor que inicializa la conexión a la base de datos
     */
    public function __construct() {
        $this->conn = null;
        
        try {
            // Opciones de PDO
            $options = [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
            ];
            
            // String de conexión DSN
            $dsn = "mysql:host={$this->host};dbname={$this->dbname};charset={$this->charset}";
            
            // Crear conexión PDO
            $this->conn = new PDO($dsn, $this->username, $this->password, $options);
            
        } catch (PDOException $e) {
            // Registrar el error pero no mostrarlo
            error_log("Error de conexión a la base de datos: " . $e->getMessage());
            
            // Si estamos en una API, devolver un error JSON
            if (isset($_SERVER['REQUEST_URI']) && strpos($_SERVER['REQUEST_URI'], '/api/') !== false) {
                header('Content-Type: application/json');
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Error de conexión a la base de datos: ' . $e->getMessage()]);
                exit();
            }
        }
    }
    
    /**
     * Obtiene la conexión a la base de datos
     * @return PDO Objeto de conexión PDO
     */
    public function getConnection() {
        return $this->conn;
    }
    
    /**
     * Verifica si una tabla existe en la base de datos
     * @param string $tabla Nombre de la tabla a verificar
     * @return bool True si la tabla existe, false en caso contrario
     */
    public function tablaExiste($tabla) {
        try {
            $stmt = $this->conn->prepare("SHOW TABLES LIKE :tabla");
            $stmt->execute(['tabla' => $tabla]);
            return $stmt->rowCount() > 0;
        } catch (PDOException $e) {
            error_log("Error al verificar si existe la tabla $tabla: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Verifica si una columna existe en una tabla
     * @param string $tabla Nombre de la tabla
     * @param string $columna Nombre de la columna a verificar
     * @return bool True si la columna existe, false en caso contrario
     */
    public function columnaExiste($tabla, $columna) {
        try {
            $stmt = $this->conn->prepare("SHOW COLUMNS FROM $tabla LIKE :columna");
            $stmt->execute(['columna' => $columna]);
            return $stmt->rowCount() > 0;
        } catch (PDOException $e) {
            error_log("Error al verificar si existe la columna $columna en la tabla $tabla: " . $e->getMessage());
            return false;
        }
    }
}

// Crear una instancia de la clase Database
$db = new Database();

// Verificar conexión ejecutando una consulta simple
$db->getConnection()->query("SELECT 1");
