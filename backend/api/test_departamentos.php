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

echo "<h1>Prueba de Departamentos</h1>";

// Verificar si existe la tabla departamentos
echo "<h2>Verificando tabla departamentos</h2>";
try {
    $query = "SHOW TABLES LIKE 'departamentos'";
    $result = $conn->query($query);
    
    if ($result->rowCount() > 0) {
        echo "<p style='color:green'>La tabla 'departamentos' existe.</p>";
    } else {
        echo "<p style='color:red'>La tabla 'departamentos' NO existe. Este es el problema principal.</p>";
        
        // Crear la tabla si no existe
        echo "<h3>Creando tabla departamentos</h3>";
        $createQuery = "CREATE TABLE IF NOT EXISTS departamentos (
            id INT AUTO_INCREMENT PRIMARY KEY,
            nombre VARCHAR(100) NOT NULL,
            descripcion TEXT,
            fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )";
        
        if ($conn->exec($createQuery) !== false) {
            echo "<p style='color:green'>Tabla 'departamentos' creada con u00e9xito.</p>";
        } else {
            echo "<p style='color:red'>Error al crear la tabla 'departamentos'.</p>";
        }
    }
} catch (PDOException $e) {
    echo "<p style='color:red'>Error al verificar tabla: " . $e->getMessage() . "</p>";
}

// Listar departamentos existentes
echo "<h2>Departamentos existentes</h2>";
try {
    $query = "SELECT * FROM departamentos ORDER BY id";
    $stmt = $conn->query($query);
    $departamentos = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (count($departamentos) > 0) {
        echo "<table border='1'>";
        echo "<tr><th>ID</th><th>Nombre</th><th>Descripciu00f3n</th><th>Fecha Creaciu00f3n</th></tr>";
        
        foreach ($departamentos as $depto) {
            echo "<tr>";
            echo "<td>" . $depto['id'] . "</td>";
            echo "<td>" . $depto['nombre'] . "</td>";
            echo "<td>" . ($depto['descripcion'] ?? '') . "</td>";
            echo "<td>" . $depto['fecha_creacion'] . "</td>";
            echo "</tr>";
        }
        
        echo "</table>";
    } else {
        echo "<p style='color:orange'>No hay departamentos en la base de datos. Vamos a crear algunos departamentos de ejemplo.</p>";
        
        // Crear departamentos de ejemplo
        $departamentosEjemplo = [
            ['nombre' => 'Administraciu00f3n', 'descripcion' => 'Departamento de administraciu00f3n y finanzas'],
            ['nombre' => 'Ventas', 'descripcion' => 'Departamento de ventas y marketing'],
            ['nombre' => 'Soporte Tu00e9cnico', 'descripcion' => 'Departamento de soporte tu00e9cnico y atenciu00f3n al cliente'],
            ['nombre' => 'Desarrollo', 'descripcion' => 'Departamento de desarrollo de software']
        ];
        
        $insertQuery = "INSERT INTO departamentos (nombre, descripcion) VALUES (:nombre, :descripcion)";
        $stmt = $conn->prepare($insertQuery);
        
        $exito = true;
        foreach ($departamentosEjemplo as $depto) {
            $stmt->bindParam(':nombre', $depto['nombre']);
            $stmt->bindParam(':descripcion', $depto['descripcion']);
            
            if (!$stmt->execute()) {
                $exito = false;
                echo "<p style='color:red'>Error al insertar departamento: " . $depto['nombre'] . "</p>";
            }
        }
        
        if ($exito) {
            echo "<p style='color:green'>Departamentos de ejemplo creados con u00e9xito.</p>";
            echo "<p>Recarga esta pu00e1gina para ver los departamentos creados.</p>";
        }
    }
} catch (PDOException $e) {
    echo "<p style='color:red'>Error al listar departamentos: " . $e->getMessage() . "</p>";
}

// Verificar la relaciu00f3n entre usuarios y departamentos
echo "<h2>Relaciu00f3n Usuarios-Departamentos</h2>";
try {
    // Verificar si la tabla usuarios tiene la columna id_departamento
    $query = "SHOW COLUMNS FROM usuarios LIKE 'id_departamento'";
    $result = $conn->query($query);
    
    if ($result->rowCount() > 0) {
        echo "<p style='color:green'>La tabla 'usuarios' tiene la columna 'id_departamento'.</p>";
    } else {
        echo "<p style='color:red'>La tabla 'usuarios' NO tiene la columna 'id_departamento'. Este es otro problema.</p>";
        
        // Agregar la columna si no existe
        echo "<h3>Agregando columna id_departamento a la tabla usuarios</h3>";
        $alterQuery = "ALTER TABLE usuarios ADD COLUMN id_departamento INT, ADD CONSTRAINT fk_usuario_departamento FOREIGN KEY (id_departamento) REFERENCES departamentos(id)";
        
        if ($conn->exec($alterQuery) !== false) {
            echo "<p style='color:green'>Columna 'id_departamento' agregada a la tabla 'usuarios'.</p>";
        } else {
            echo "<p style='color:red'>Error al agregar la columna 'id_departamento' a la tabla 'usuarios'.</p>";
        }
    }
    
    // Mostrar usuarios con sus departamentos
    $query = "SELECT u.NIF, u.nombre, u.apellidos, u.id_departamento, d.nombre as nombre_departamento 
             FROM usuarios u 
             LEFT JOIN departamentos d ON u.id_departamento = d.id 
             ORDER BY u.nombre";
    $stmt = $conn->query($query);
    $usuarios = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (count($usuarios) > 0) {
        echo "<table border='1'>";
        echo "<tr><th>NIF</th><th>Nombre</th><th>Apellidos</th><th>ID Departamento</th><th>Departamento</th><th>Acciu00f3n</th></tr>";
        
        foreach ($usuarios as $usuario) {
            echo "<tr>";
            echo "<td>" . $usuario['NIF'] . "</td>";
            echo "<td>" . $usuario['nombre'] . "</td>";
            echo "<td>" . $usuario['apellidos'] . "</td>";
            echo "<td>" . ($usuario['id_departamento'] ?? 'NULL') . "</td>";
            echo "<td>" . ($usuario['nombre_departamento'] ?? 'Sin departamento') . "</td>";
            echo "<td>";
            if (empty($usuario['id_departamento'])) {
                echo "<form method='post' action='" . $_SERVER['PHP_SELF'] . "'>";
                echo "<input type='hidden' name='nif' value='" . $usuario['NIF'] . "'>";
                echo "<select name='departamento'>";
                
                // Obtener departamentos para el select
                $deptos = $conn->query("SELECT id, nombre FROM departamentos ORDER BY nombre")->fetchAll(PDO::FETCH_ASSOC);
                foreach ($deptos as $d) {
                    echo "<option value='" . $d['id'] . "'>" . $d['nombre'] . "</option>";
                }
                
                echo "</select>";
                echo "<button type='submit' name='asignar_departamento'>Asignar</button>";
                echo "</form>";
            } else {
                echo "<form method='post' action='" . $_SERVER['PHP_SELF'] . "'>";
                echo "<input type='hidden' name='nif' value='" . $usuario['NIF'] . "'>";
                echo "<button type='submit' name='quitar_departamento'>Quitar departamento</button>";
                echo "</form>";
            }
            echo "</td>";
            echo "</tr>";
        }
        
        echo "</table>";
    } else {
        echo "<p>No hay usuarios en la base de datos.</p>";
    }
    
    // Procesar formulario para asignar departamento
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        if (isset($_POST['asignar_departamento']) && isset($_POST['nif']) && isset($_POST['departamento'])) {
            $nif = $_POST['nif'];
            $departamento = $_POST['departamento'];
            
            $updateQuery = "UPDATE usuarios SET id_departamento = :departamento WHERE NIF = :nif";
            $stmt = $conn->prepare($updateQuery);
            $stmt->bindParam(':departamento', $departamento);
            $stmt->bindParam(':nif', $nif);
            
            if ($stmt->execute()) {
                echo "<p style='color:green'>Departamento asignado correctamente al usuario con NIF: $nif</p>";
                echo "<script>window.location.href = window.location.pathname;</script>";
            } else {
                echo "<p style='color:red'>Error al asignar departamento al usuario.</p>";
            }
        }
        
        if (isset($_POST['quitar_departamento']) && isset($_POST['nif'])) {
            $nif = $_POST['nif'];
            
            $updateQuery = "UPDATE usuarios SET id_departamento = NULL WHERE NIF = :nif";
            $stmt = $conn->prepare($updateQuery);
            $stmt->bindParam(':nif', $nif);
            
            if ($stmt->execute()) {
                echo "<p style='color:green'>Departamento eliminado correctamente del usuario con NIF: $nif</p>";
                echo "<script>window.location.href = window.location.pathname;</script>";
            } else {
                echo "<p style='color:red'>Error al quitar departamento del usuario.</p>";
            }
        }
    }
    
} catch (PDOException $e) {
    echo "<p style='color:red'>Error al verificar relaciu00f3n usuarios-departamentos: " . $e->getMessage() . "</p>";
}
?>
