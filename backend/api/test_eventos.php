<?php
require_once __DIR__ . '/../modelos/Evento.php';

// Configuración de cabeceras para mostrar errores
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Crear instancia del modelo de Evento
$modeloEvento = new Evento();

// Obtener eventos para un usuario de prueba (puedes cambiar el NIF por uno válido de tu base de datos)
$NIF_usuario = 'TEST123'; // Cambia esto por un NIF válido

// Obtener conexión a la base de datos
$conn = $modeloEvento->getConnection();

// Eliminar tablas existentes para recrearlas con la misma colación
try {
    $conn->exec("DROP TABLE IF EXISTS eventos");
    echo "<p>Tabla 'eventos' eliminada correctamente.</p>";
} catch (Exception $e) {
    echo "<p>Error al eliminar tabla 'eventos': " . $e->getMessage() . "</p>";
}

try {
    $conn->exec("DROP TABLE IF EXISTS usuarios");
    echo "<p>Tabla 'usuarios' eliminada correctamente.</p>";
} catch (Exception $e) {
    echo "<p>Error al eliminar tabla 'usuarios': " . $e->getMessage() . "</p>";
}

// Crear tabla usuarios con colación utf8mb4_general_ci
try {
    $createTableQuery = "CREATE TABLE IF NOT EXISTS usuarios (
        id INT(11) NOT NULL AUTO_INCREMENT,
        NIF VARCHAR(20) NOT NULL,
        nombre VARCHAR(100),
        apellidos VARCHAR(100),
        email VARCHAR(100),
        PRIMARY KEY (id),
        UNIQUE KEY (NIF)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci";
    
    $conn->exec($createTableQuery);
    echo "<p>Tabla 'usuarios' creada correctamente.</p>";
} catch (Exception $e) {
    echo "<p>Error al crear tabla 'usuarios': " . $e->getMessage() . "</p>";
    exit;
}

// Crear tabla eventos con colación utf8mb4_general_ci
try {
    $createTableQuery = "CREATE TABLE IF NOT EXISTS eventos (
        id INT(11) NOT NULL AUTO_INCREMENT,
        titulo VARCHAR(255) NOT NULL,
        descripcion TEXT,
        fecha_inicio DATETIME NOT NULL,
        fecha_fin DATETIME,
        NIF_usuario VARCHAR(20) NOT NULL,
        id_departamento INT(11),
        tipo VARCHAR(50) DEFAULT 'evento',
        color VARCHAR(20) DEFAULT '#3788d8',
        dia_completo CHAR(1) DEFAULT '0',
        PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci";
    
    $conn->exec($createTableQuery);
    echo "<p>Tabla 'eventos' creada correctamente.</p>";
} catch (Exception $e) {
    echo "<p>Error al crear tabla 'eventos': " . $e->getMessage() . "</p>";
    exit;
}

// Insertar usuario de prueba
try {
    $insertUsuario = "INSERT INTO usuarios (NIF, nombre, apellidos, email) VALUES (:NIF, 'Usuario', 'Prueba', 'test@example.com')";
    $stmt = $conn->prepare($insertUsuario);
    $stmt->bindValue(':NIF', $NIF_usuario);
    $stmt->execute();
    echo "<p>Usuario de prueba creado correctamente.</p>";
} catch (Exception $e) {
    echo "<p>Error al crear usuario de prueba: " . $e->getMessage() . "</p>";
}

// Crear evento de prueba
try {
    $datosEvento = [
        'titulo' => 'Evento de prueba',
        'descripcion' => 'Este es un evento de prueba para verificar el formato de fechas',
        'fecha_inicio' => date('Y-m-d H:i:s'),
        'fecha_fin' => date('Y-m-d H:i:s', strtotime('+1 hour')),
        'NIF_usuario' => $NIF_usuario,
        'tipo' => 'evento',
        'color' => '#3788d8',
        'dia_completo' => '0'
    ];
    
    $resultado = $modeloEvento->crear($datosEvento);
    
    if ($resultado['success']) {
        echo "<p>Evento de prueba creado correctamente.</p>";
    } else {
        echo "<p>Error al crear evento de prueba: " . $resultado['message'] . "</p>";
    }
} catch (Exception $e) {
    echo "<p>Error al crear evento de prueba: " . $e->getMessage() . "</p>";
}

// Obtener eventos
$resultado = $modeloEvento->obtenerEventosPorUsuario($NIF_usuario);

// Mostrar resultados
echo "<h2>Resultados de la prueba:</h2>";
echo "<pre>" . json_encode($resultado, JSON_PRETTY_PRINT) . "</pre>";

// Mostrar eventos en formato legible
if ($resultado['success'] && !empty($resultado['eventos'])) {
    echo "<h3>Eventos encontrados:</h3>";
    echo "<ul>";
    foreach ($resultado['eventos'] as $evento) {
        echo "<li>";
        echo "<strong>Título:</strong> " . htmlspecialchars($evento['titulo']) . "<br>";
        echo "<strong>Descripción:</strong> " . htmlspecialchars($evento['descripcion']) . "<br>";
        echo "<strong>Fecha inicio:</strong> " . htmlspecialchars($evento['fecha_inicio']) . "<br>";
        echo "<strong>Fecha fin:</strong> " . htmlspecialchars($evento['fecha_fin']) . "<br>";
        echo "<strong>Usuario:</strong> " . htmlspecialchars($evento['NIF_usuario']) . "<br>";
        echo "</li>";
    }
    echo "</ul>";
} else {
    echo "<p>No se encontraron eventos o hubo un error: " . ($resultado['message'] ?? 'No hay eventos') . "</p>";
}

// Mostrar información para el calendario
echo "<h3>Instrucciones para el calendario:</h3>";
echo "<p>Para probar el calendario, accede a la siguiente URL:</p>";
echo "<p><a href='http://localhost/ImpulsaTelecom/frontend/'>http://localhost/ImpulsaTelecom/frontend/</a></p>";
echo "<p>Asegúrate de que el servidor de desarrollo esté en ejecución con: <code>npm run dev</code> en la carpeta frontend.</p>";
echo "<p>Inicia sesión con el usuario de prueba NIF: $NIF_usuario</p>";
