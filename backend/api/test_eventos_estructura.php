<?php
// Configuraciu00f3n de errores - Mostrar todos los errores para depuraciu00f3n
error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);

// Incluir configuraciu00f3n de base de datos
require_once __DIR__ . '/../config/database.php';

// Crear conexiu00f3n a la base de datos
$database = new Database();
$conn = $database->getConnection();

echo "<h1>Estructura de la tabla eventos</h1>";

// Verificar la estructura de la tabla eventos
try {
    $query = "DESCRIBE eventos";
    $result = $conn->query($query);
    $columns = $result->fetchAll(PDO::FETCH_ASSOC);
    
    echo "<table border='1'>";
    echo "<tr><th>Campo</th><th>Tipo</th><th>Nulo</th><th>Clave</th><th>Predeterminado</th><th>Extra</th></tr>";
    
    foreach ($columns as $column) {
        echo "<tr>";
        echo "<td>{$column['Field']}</td>";
        echo "<td>{$column['Type']}</td>";
        echo "<td>{$column['Null']}</td>";
        echo "<td>{$column['Key']}</td>";
        echo "<td>{$column['Default']}</td>";
        echo "<td>{$column['Extra']}</td>";
        echo "</tr>";
    }
    echo "</table>";
    
} catch (PDOException $e) {
    echo "<p style='color:red'>Error al verificar estructura de la tabla: " . $e->getMessage() . "</p>";
}

// Mostrar algunos eventos de ejemplo
echo "<h2>Eventos de ejemplo</h2>";
try {
    $query = "SELECT * FROM eventos LIMIT 5";
    $stmt = $conn->query($query);
    $eventos = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (count($eventos) > 0) {
        echo "<pre>";
        print_r($eventos);
        echo "</pre>";
    } else {
        echo "<p>No hay eventos en la base de datos.</p>";
    }
} catch (PDOException $e) {
    echo "<p style='color:red'>Error al obtener eventos: " . $e->getMessage() . "</p>";
}

// Mostrar la consulta SQL que estamos intentando ejecutar
echo "<h2>Consulta SQL con problemas</h2>";

$dpto = "Ejemplo"; // Reemplazar con un valor real de departamento
$fecha_inicio = "2023-01-01";
$fecha_fin = "2023-12-31";

$query = "SELECT e.*, u.nombre as nombre_usuario, u.apellidos as apellidos_usuario, u.dpto as dpto_usuario "
       . "FROM eventos e "
       . "JOIN usuarios u ON e.NIF_usuario = u.NIF "
       . "WHERE u.dpto = :dpto ";

$query .= "AND ((e.fecha_inicio BETWEEN :fecha_inicio AND :fecha_fin) "
        . "OR (e.fecha_fin BETWEEN :fecha_inicio AND :fecha_fin) "
        . "OR (e.fecha_inicio <= :fecha_inicio AND (e.fecha_fin >= :fecha_fin OR e.fecha_fin IS NULL)))";

echo "<pre>$query</pre>";

// Mostrar los paru00e1metros
echo "<p>Paru00e1metros: :dpto = $dpto, :fecha_inicio = $fecha_inicio, :fecha_fin = $fecha_fin</p>";

// Intentar ejecutar la consulta para ver el error exacto
try {
    $stmt = $conn->prepare($query);
    $stmt->bindValue(':dpto', $dpto);
    $stmt->bindValue(':fecha_inicio', $fecha_inicio);
    $stmt->bindValue(':fecha_fin', $fecha_fin);
    $stmt->execute();
    
    echo "<p style='color:green'>La consulta se ejecutu00f3 correctamente.</p>";
} catch (PDOException $e) {
    echo "<p style='color:red'>Error al ejecutar la consulta: " . $e->getMessage() . "</p>";
}
?>
