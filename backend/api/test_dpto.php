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

echo "<h1>Prueba de Departamentos (dpto)</h1>";

// Verificar la estructura de la tabla usuarios
echo "<h2>Estructura de la tabla usuarios</h2>";
try {
    $query = "DESCRIBE usuarios";
    $result = $conn->query($query);
    $columns = $result->fetchAll(PDO::FETCH_ASSOC);
    
    echo "<table border='1'>";
    echo "<tr><th>Campo</th><th>Tipo</th><th>Nulo</th><th>Clave</th><th>Predeterminado</th><th>Extra</th></tr>";
    
    $dpto_exists = false;
    foreach ($columns as $column) {
        echo "<tr>";
        echo "<td>{$column['Field']}</td>";
        echo "<td>{$column['Type']}</td>";
        echo "<td>{$column['Null']}</td>";
        echo "<td>{$column['Key']}</td>";
        echo "<td>{$column['Default']}</td>";
        echo "<td>{$column['Extra']}</td>";
        echo "</tr>";
        
        if ($column['Field'] === 'dpto') {
            $dpto_exists = true;
        }
    }
    echo "</table>";
    
    if ($dpto_exists) {
        echo "<p style='color:green'>La columna 'dpto' existe en la tabla usuarios.</p>";
    } else {
        echo "<p style='color:red'>La columna 'dpto' NO existe en la tabla usuarios. Este es el problema principal.</p>";
    }
} catch (PDOException $e) {
    echo "<p style='color:red'>Error al verificar estructura de la tabla: " . $e->getMessage() . "</p>";
}

// Listar usuarios con sus departamentos
echo "<h2>Usuarios y sus departamentos</h2>";
try {
    $query = "SELECT NIF, nombre, apellidos, dpto FROM usuarios ORDER BY nombre";
    $stmt = $conn->query($query);
    $usuarios = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (count($usuarios) > 0) {
        echo "<table border='1'>";
        echo "<tr><th>NIF</th><th>Nombre</th><th>Apellidos</th><th>Departamento</th></tr>";
        
        foreach ($usuarios as $usuario) {
            echo "<tr>";
            echo "<td>{$usuario['NIF']}</td>";
            echo "<td>{$usuario['nombre']}</td>";
            echo "<td>{$usuario['apellidos']}</td>";
            echo "<td>" . ($usuario['dpto'] ?? 'Sin departamento') . "</td>";
            echo "</tr>";
        }
        
        echo "</table>";
    } else {
        echo "<p>No hay usuarios en la base de datos.</p>";
    }
} catch (PDOException $e) {
    echo "<p style='color:red'>Error al listar usuarios: " . $e->getMessage() . "</p>";
}

// Valores u00fanicos de departamentos
echo "<h2>Departamentos existentes</h2>";
try {
    $query = "SELECT DISTINCT dpto FROM usuarios WHERE dpto IS NOT NULL ORDER BY dpto";
    $stmt = $conn->query($query);
    $departamentos = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (count($departamentos) > 0) {
        echo "<ul>";
        foreach ($departamentos as $depto) {
            echo "<li>{$depto['dpto']}</li>";
        }
        echo "</ul>";
    } else {
        echo "<p style='color:orange'>No hay departamentos asignados a ninguu00fan usuario.</p>";
    }
} catch (PDOException $e) {
    echo "<p style='color:red'>Error al listar departamentos: " . $e->getMessage() . "</p>";
}

// Formulario para asignar departamento a un usuario
echo "<h2>Asignar departamento a usuario</h2>";

// Procesar formulario
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['asignar_dpto'])) {
    $nif = $_POST['nif'];
    $dpto = $_POST['dpto'];
    
    try {
        $query = "UPDATE usuarios SET dpto = :dpto WHERE NIF = :nif";
        $stmt = $conn->prepare($query);
        $stmt->bindParam(':dpto', $dpto);
        $stmt->bindParam(':nif', $nif);
        
        if ($stmt->execute()) {
            echo "<p style='color:green'>Departamento asignado correctamente al usuario con NIF: $nif</p>";
        } else {
            echo "<p style='color:red'>Error al asignar departamento.</p>";
        }
    } catch (PDOException $e) {
        echo "<p style='color:red'>Error: " . $e->getMessage() . "</p>";
    }
}

// Mostrar formulario
echo "<form method='post' action='" . $_SERVER['PHP_SELF'] . "'>";
echo "<label for='nif'>Seleccionar usuario:</label>";
echo "<select name='nif' id='nif'>";

try {
    $query = "SELECT NIF, nombre, apellidos FROM usuarios ORDER BY nombre";
    $stmt = $conn->query($query);
    $usuarios = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($usuarios as $usuario) {
        echo "<option value='{$usuario['NIF']}'>{$usuario['nombre']} {$usuario['apellidos']} ({$usuario['NIF']})</option>";
    }
} catch (PDOException $e) {
    echo "<option value=''>Error al cargar usuarios</option>";
}

echo "</select>";
echo "<br><br>";
echo "<label for='dpto'>Departamento:</label>";
echo "<input type='text' name='dpto' id='dpto' required>";
echo "<br><br>";
echo "<button type='submit' name='asignar_dpto'>Asignar departamento</button>";
echo "</form>";

// Informaciu00f3n de sesiu00f3n actual
echo "<h2>Informaciu00f3n de sesiu00f3n</h2>";
echo "<pre>";
echo "Session ID: " . session_id() . "\n";
echo "Session Status: " . session_status() . " (1=disabled, 2=enabled but no session, 3=active)\n";

if (session_status() === PHP_SESSION_ACTIVE) {
    echo "\nContenido de la sesiu00f3n:\n";
    print_r($_SESSION);
} else {
    // Iniciar sesiu00f3n si no estu00e1 activa
    session_start();
    echo "\nSesiu00f3n iniciada. Contenido:\n";
    print_r($_SESSION);
}
echo "</pre>";
?>
