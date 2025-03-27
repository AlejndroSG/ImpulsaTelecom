<?php
// Script para probar la inserciu00f3n directa en la tabla registros
require_once "backend/config.php";

// Configurar cabeceras para mostrar resultados como texto plano
header('Content-Type: text/plain; charset=utf-8');

// Conectar a la base de datos directamente
$conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);

if ($conn->connect_error) {
    die("Error de conexiu00f3n: " . $conn->connect_error);
}

echo "Conexiu00f3n exitosa a la base de datos.\n\n";

// Verificar si las columnas de latitud y longitud existen
$query = "SHOW COLUMNS FROM registros LIKE 'latitud'";
$result = $conn->query($query);

if ($result->num_rows == 0) {
    echo "La columna 'latitud' no existe. Creando columnas...\n";
    
    // Agregar columnas para localizaciu00f3n
    $alterQuery = "ALTER TABLE registros 
                   ADD COLUMN latitud DECIMAL(10, 8) NULL, 
                   ADD COLUMN longitud DECIMAL(11, 8) NULL";
    
    if ($conn->query($alterQuery) === TRUE) {
        echo "Columnas creadas correctamente.\n";
    } else {
        echo "Error al crear columnas: " . $conn->error . "\n";
    }
} else {
    echo "Las columnas de latitud y longitud ya existen.\n";
}

// Verificar si la columna localizacion existe
$query = "SHOW COLUMNS FROM registros LIKE 'localizacion'";
$result = $conn->query($query);

if ($result->num_rows == 0) {
    echo "La columna 'localizacion' no existe. Creando columna...\n";
    
    // Agregar columna de localizacion
    $alterQuery = "ALTER TABLE registros ADD COLUMN localizacion VARCHAR(255) NULL";
    
    if ($conn->query($alterQuery) === TRUE) {
        echo "Columna 'localizacion' creada correctamente.\n";
    } else {
        echo "Error al crear columna 'localizacion': " . $conn->error . "\n";
    }
} else {
    echo "La columna 'localizacion' ya existe.\n";
}

// Intentar insertar un registro de prueba directamente
echo "\nIntentando insertar un registro de prueba...\n";

$nif = "12345678A";
$fecha = date('Y-m-d');
$hora = date('H:i:s');
$latitud = 40.416775;
$longitud = -3.703790;
$localizacion = "$latitud, $longitud";

// Mostrar los datos que se van a insertar
echo "Datos a insertar:\n";
echo "NIF: $nif\n";
echo "Fecha: $fecha\n";
echo "Hora: $hora\n";
echo "Latitud: $latitud (" . gettype($latitud) . ")\n";
echo "Longitud: $longitud (" . gettype($longitud) . ")\n";
echo "Localizaciu00f3n: $localizacion (" . gettype($localizacion) . ")\n";

// Preparar la consulta SQL - Mu00e9todo 1: Usando bind_param
echo "\nMu00e9todo 1: Usando bind_param\n";
$query = "INSERT INTO registros 
          (NIF, fecha, horaInicio, latitud, longitud, localizacion, estado) 
          VALUES (?, ?, ?, ?, ?, ?, 'entrada')";

$stmt = $conn->prepare($query);

if ($stmt === false) {
    echo "Error en la preparaciu00f3n de la consulta: " . $conn->error . "\n";
} else {
    // Vincular paru00e1metros
    $stmt->bind_param("sssdds", $nif, $fecha, $hora, $latitud, $longitud, $localizacion);
    
    // Ejecutar la consulta
    if ($stmt->execute()) {
        $id_fichaje = $conn->insert_id;
        echo "Registro insertado correctamente con ID: $id_fichaje\n";
        
        // Verificar el registro insertado
        $query = "SELECT * FROM registros WHERE idRegistro = ?";
        $stmt = $conn->prepare($query);
        
        if ($stmt === false) {
            echo "Error en la preparaciu00f3n de la consulta de verificaciu00f3n: " . $conn->error . "\n";
        } else {
            $stmt->bind_param("i", $id_fichaje);
            $stmt->execute();
            $result = $stmt->get_result();
            
            if ($result->num_rows > 0) {
                $row = $result->fetch_assoc();
                echo "\nVerificaciu00f3n del registro insertado (Mu00e9todo 1):\n";
                echo "ID: " . $row['idRegistro'] . "\n";
                echo "NIF: " . $row['NIF'] . "\n";
                echo "Fecha: " . $row['fecha'] . "\n";
                echo "Hora Inicio: " . $row['horaInicio'] . "\n";
                echo "Latitud: " . (isset($row['latitud']) ? $row['latitud'] . ' (' . gettype($row['latitud']) . ')' : 'NULL') . "\n";
                echo "Longitud: " . (isset($row['longitud']) ? $row['longitud'] . ' (' . gettype($row['longitud']) . ')' : 'NULL') . "\n";
                echo "Localizaciu00f3n: " . (isset($row['localizacion']) ? $row['localizacion'] . ' (' . gettype($row['localizacion']) . ')' : 'NULL') . "\n";
                echo "Estado: " . $row['estado'] . "\n";
            } else {
                echo "No se encontru00f3 el registro con ID: $id_fichaje\n";
            }
        }
    } else {
        echo "Error al insertar registro: " . $stmt->error . "\n";
    }
}

// Mu00e9todo 2: Inserciu00f3n directa sin prepared statement
echo "\nMu00e9todo 2: Inserciu00f3n directa\n";

$nif = "87654321B";
$fecha = date('Y-m-d');
$hora = date('H:i:s');
$latitud = 41.385064;
$longitud = 2.173404;
$localizacion = "$latitud, $longitud";

$query = "INSERT INTO registros 
          (NIF, fecha, horaInicio, latitud, longitud, localizacion, estado) 
          VALUES ('$nif', '$fecha', '$hora', $latitud, $longitud, '$localizacion', 'entrada')";

echo "Consulta SQL: $query\n";

if ($conn->query($query) === TRUE) {
    $id_fichaje = $conn->insert_id;
    echo "Registro insertado correctamente con ID: $id_fichaje\n";
    
    // Verificar el registro insertado
    $query = "SELECT * FROM registros WHERE idRegistro = $id_fichaje";
    $result = $conn->query($query);
    
    if ($result->num_rows > 0) {
        $row = $result->fetch_assoc();
        echo "\nVerificaciu00f3n del registro insertado (Mu00e9todo 2):\n";
        echo "ID: " . $row['idRegistro'] . "\n";
        echo "NIF: " . $row['NIF'] . "\n";
        echo "Fecha: " . $row['fecha'] . "\n";
        echo "Hora Inicio: " . $row['horaInicio'] . "\n";
        echo "Latitud: " . (isset($row['latitud']) ? $row['latitud'] . ' (' . gettype($row['latitud']) . ')' : 'NULL') . "\n";
        echo "Longitud: " . (isset($row['longitud']) ? $row['longitud'] . ' (' . gettype($row['longitud']) . ')' : 'NULL') . "\n";
        echo "Localizaciu00f3n: " . (isset($row['localizacion']) ? $row['localizacion'] . ' (' . gettype($row['localizacion']) . ')' : 'NULL') . "\n";
        echo "Estado: " . $row['estado'] . "\n";
    } else {
        echo "No se encontru00f3 el registro con ID: $id_fichaje\n";
    }
} else {
    echo "Error al insertar registro: " . $conn->error . "\n";
}

$conn->close();
echo "\nPrueba completada.";
?>
