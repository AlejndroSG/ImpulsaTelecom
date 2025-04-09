<?php
// Configuración de errores - Mostrar todos los errores para depuración
error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);

// Iniciar sesión
session_start();

// Incluir configuración de base de datos
require_once __DIR__ . '/../config/database.php';

// Crear conexión a la base de datos
$database = new Database();
$conn = $database->getConnection();

// Verificar si hay un usuario en la sesión
echo "<h2>Información de sesión</h2>";
echo "Session ID: " . session_id() . "<br>";
echo "NIF en sesión: " . (isset($_SESSION['NIF']) ? $_SESSION['NIF'] : 'No hay NIF en sesión') . "<br>";

// Función para obtener el departamento de un usuario
function obtenerDepartamentoUsuario($NIF, $conn) {
    try {
        // Verificar que tenemos una conexión a la base de datos
        if (!$conn) {
            echo "Error: No hay conexión a la base de datos<br>";
            return null;
        }
        
        // Mostrar el NIF que estamos buscando
        echo "Buscando departamento para NIF: $NIF<br>";
        
        $query = "SELECT u.NIF, u.id_departamento, d.nombre as nombre_departamento 
                 FROM usuarios u 
                 LEFT JOIN departamentos d ON u.id_departamento = d.id 
                 WHERE u.NIF = :NIF";
        $stmt = $conn->prepare($query);
        $stmt->bindParam(':NIF', $NIF);
        $stmt->execute();
        
        $resultado = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($resultado) {
            echo "Resultado de la consulta: ";
            print_r($resultado);
            echo "<br>";
            
            if (isset($resultado['id_departamento'])) {
                return $resultado['id_departamento'];
            }
        }
        
        echo "No se encontró departamento para el usuario con NIF: $NIF<br>";
        return null;
    } catch (PDOException $e) {
        echo "Error al obtener departamento: " . $e->getMessage() . "<br>";
        return null;
    }
}

// Probar con el NIF de la sesión si existe
if (isset($_SESSION['NIF'])) {
    $NIF = $_SESSION['NIF'];
    echo "<h2>Prueba con NIF de sesión</h2>";
    $id_departamento = obtenerDepartamentoUsuario($NIF, $conn);
    echo "ID de departamento encontrado: " . ($id_departamento !== null ? $id_departamento : 'No encontrado') . "<br>";
} else {
    echo "<h2>No hay NIF en sesión</h2>";
}

// Mostrar todos los usuarios y sus departamentos para depuración
echo "<h2>Todos los usuarios y sus departamentos</h2>";
try {
    $query = "SELECT u.NIF, u.nombre, u.apellidos, u.id_departamento, d.nombre as nombre_departamento 
             FROM usuarios u 
             LEFT JOIN departamentos d ON u.id_departamento = d.id 
             ORDER BY u.nombre";
    $stmt = $conn->query($query);
    $usuarios = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "<table border='1'>";
    echo "<tr><th>NIF</th><th>Nombre</th><th>Apellidos</th><th>ID Departamento</th><th>Nombre Departamento</th></tr>";
    
    foreach ($usuarios as $usuario) {
        echo "<tr>";
        echo "<td>" . $usuario['NIF'] . "</td>";
        echo "<td>" . $usuario['nombre'] . "</td>";
        echo "<td>" . $usuario['apellidos'] . "</td>";
        echo "<td>" . ($usuario['id_departamento'] ?? 'NULL') . "</td>";
        echo "<td>" . ($usuario['nombre_departamento'] ?? 'Sin departamento') . "</td>";
        echo "</tr>";
    }
    
    echo "</table>";
} catch (PDOException $e) {
    echo "Error al obtener usuarios: " . $e->getMessage();
}

// Mostrar estructura de la tabla usuarios
echo "<h2>Estructura de la tabla usuarios</h2>";
try {
    $query = "DESCRIBE usuarios";
    $stmt = $conn->query($query);
    $columnas = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "<table border='1'>";
    echo "<tr><th>Field</th><th>Type</th><th>Null</th><th>Key</th><th>Default</th><th>Extra</th></tr>";
    
    foreach ($columnas as $columna) {
        echo "<tr>";
        echo "<td>" . $columna['Field'] . "</td>";
        echo "<td>" . $columna['Type'] . "</td>";
        echo "<td>" . $columna['Null'] . "</td>";
        echo "<td>" . $columna['Key'] . "</td>";
        echo "<td>" . ($columna['Default'] ?? 'NULL') . "</td>";
        echo "<td>" . $columna['Extra'] . "</td>";
        echo "</tr>";
    }
    
    echo "</table>";
} catch (PDOException $e) {
    echo "Error al obtener estructura de la tabla: " . $e->getMessage();
}
?>
