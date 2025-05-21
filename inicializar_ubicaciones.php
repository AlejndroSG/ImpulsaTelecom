<?php
// Script para inicializar la tabla de ubicaciones con datos de ejemplo
header('Content-Type: text/html; charset=utf-8');

// Incluir archivos necesarios
require_once __DIR__ . '/backend/modelos/bd.php';

// Conectar a la base de datos
$db = new db();
$conn = $db->getConn();

// Función para verificar si una tabla existe
function tablaExiste($conn, $tablaNombre) {
    $result = $conn->query("SHOW TABLES LIKE '$tablaNombre'");
    return $result->num_rows > 0;
}

// Crear la tabla de ubicaciones si no existe
if (!tablaExiste($conn, 'ubicaciones_usuarios')) {
    $createTableQuery = "CREATE TABLE ubicaciones_usuarios (
        id INT AUTO_INCREMENT PRIMARY KEY,
        id_usuario INT NOT NULL,
        latitud DECIMAL(10, 8) NOT NULL,
        longitud DECIMAL(11, 8) NOT NULL,
        fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON DELETE CASCADE
    )";
    
    if ($conn->query($createTableQuery)) {
        echo "<p>Tabla 'ubicaciones_usuarios' creada correctamente.</p>";
    } else {
        echo "<p>Error al crear la tabla 'ubicaciones_usuarios': " . $conn->error . "</p>";
        exit;
    }
} else {
    echo "<p>La tabla 'ubicaciones_usuarios' ya existe.</p>";
}

// Verificar si ya hay datos en la tabla
$checkDataQuery = "SELECT COUNT(*) as count FROM ubicaciones_usuarios";
$result = $conn->query($checkDataQuery);
$row = $result->fetch_assoc();

if ($row['count'] > 0) {
    echo "<p>Ya hay datos en la tabla de ubicaciones. No se agregarán nuevos datos de ejemplo.</p>";
    echo "<p>Datos existentes: " . $row['count'] . " registros.</p>";
} else {
    // Obtener los IDs de algunos usuarios para añadir ubicaciones de ejemplo
    $getUsersQuery = "SELECT id, nombre FROM usuarios LIMIT 10";
    $usersResult = $conn->query($getUsersQuery);
    
    if ($usersResult->num_rows > 0) {
        // Coordenadas de la oficina central (Madrid)
        $oficina_lat = 40.416775;
        $oficina_lng = -3.703790;
        
        $insertados = 0;
        $errores = 0;
        
        while ($user = $usersResult->fetch_assoc()) {
            // Generar ubicación aleatoria cerca de la oficina (+-0.01 grados ~ 1km)
            $lat = $oficina_lat + (rand(-100, 100) / 10000);
            $lng = $oficina_lng + (rand(-100, 100) / 10000);
            
            $insertQuery = "INSERT INTO ubicaciones_usuarios (id_usuario, latitud, longitud) VALUES (?, ?, ?)";
            $stmt = $conn->prepare($insertQuery);
            $stmt->bind_param("idd", $user['id'], $lat, $lng);
            
            if ($stmt->execute()) {
                $insertados++;
                echo "<p>Ubicación generada para usuario: " . $user['nombre'] . " (ID: " . $user['id'] . ")</p>";
            } else {
                $errores++;
                echo "<p>Error al generar ubicación para usuario " . $user['nombre'] . ": " . $stmt->error . "</p>";
            }
            
            $stmt->close();
        }
        
        echo "<p>Proceso completado. Se insertaron $insertados ubicaciones con $errores errores.</p>";
    } else {
        echo "<p>No se encontraron usuarios para agregar ubicaciones de ejemplo.</p>";
    }
}

// Mostrar datos actuales en la tabla
echo "<h2>Datos actuales en la tabla de ubicaciones</h2>";

$dataQuery = "SELECT u.id, u.nombre, ub.latitud, ub.longitud, ub.fecha_actualizacion \n" .
             "FROM ubicaciones_usuarios ub \n" .
             "JOIN usuarios u ON ub.id_usuario = u.id \n" .
             "ORDER BY ub.fecha_actualizacion DESC";

$dataResult = $conn->query($dataQuery);

if ($dataResult->num_rows > 0) {
    echo "<table border='1' cellpadding='5' cellspacing='0'>";
    echo "<tr><th>ID Usuario</th><th>Nombre</th><th>Latitud</th><th>Longitud</th><th>Fecha Actualización</th></tr>";
    
    while ($data = $dataResult->fetch_assoc()) {
        echo "<tr>";
        echo "<td>" . $data['id'] . "</td>";
        echo "<td>" . $data['nombre'] . "</td>";
        echo "<td>" . $data['latitud'] . "</td>";
        echo "<td>" . $data['longitud'] . "</td>";
        echo "<td>" . $data['fecha_actualizacion'] . "</td>";
        echo "</tr>";
    }
    
    echo "</table>";
} else {
    echo "<p>No hay datos en la tabla de ubicaciones.</p>";
}

$conn->close();

echo "<p><a href='frontend/index.html'>Volver a la aplicación</a></p>";
?>
