<?php
// Script simple para probar la inserciu00f3n directa en la tabla registros

// Configurar cabeceras para mostrar resultados como texto plano
header('Content-Type: text/plain; charset=utf-8');

// Configurar conexiu00f3n a la base de datos
$servername = "localhost";
$username = "root"; // Usuario por defecto de XAMPP
$password = "";    // Contraseu00f1a por defecto de XAMPP (vaci00eda)
$dbname = "impulsatelecom"; // Nombre correcto de la base de datos

echo "Intentando conectar a la base de datos...\n";
echo "Servidor: $servername\n";
echo "Usuario: $username\n";
echo "Base de datos: $dbname\n\n";

// Crear conexiu00f3n
$conn = new mysqli($servername, $username, $password, $dbname);

// Verificar conexiu00f3n
if ($conn->connect_error) {
    die("Error de conexiu00f3n: " . $conn->connect_error);
}

echo "Conexiu00f3n exitosa a la base de datos.\n\n";

// Mostrar la estructura de la tabla registros
$query = "DESCRIBE registros";
$result = $conn->query($query);

if (!$result) {
    die("Error al obtener la estructura de la tabla: " . $conn->error);
}

echo "Estructura de la tabla 'registros':\n\n";
echo "Campo | Tipo | Nulo | Clave | Predeterminado | Extra\n";
echo "--------------------------------------------------\n";

while ($row = $result->fetch_assoc()) {
    echo $row['Field'] . " | " . $row['Type'] . " | " . $row['Null'] . " | " . $row['Key'] . " | " . $row['Default'] . " | " . $row['Extra'] . "\n";
}

// Verificar si las columnas de latitud y longitud existen
$query = "SHOW COLUMNS FROM registros LIKE 'latitud'";
$result = $conn->query($query);

if ($result->num_rows == 0) {
    echo "\nLa columna 'latitud' no existe. Creando columnas...\n";
    
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
    echo "\nLas columnas de latitud y longitud ya existen.\n";
}

// Verificar si la columna localizacion existe
$query = "SHOW COLUMNS FROM registros LIKE 'localizacion'";
$result = $conn->query($query);

if ($result->num_rows == 0) {
    echo "\nLa columna 'localizacion' no existe. Creando columna...\n";
    
    // Agregar columna de localizacion
    $alterQuery = "ALTER TABLE registros ADD COLUMN localizacion VARCHAR(255) NULL";
    
    if ($conn->query($alterQuery) === TRUE) {
        echo "Columna 'localizacion' creada correctamente.\n";
    } else {
        echo "Error al crear columna 'localizacion': " . $conn->error . "\n";
    }
} else {
    echo "\nLa columna 'localizacion' ya existe.\n";
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

// Mu00e9todo 1: Usando bind_param
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
                echo "\nVerificaciu00f3n del registro insertado:\n";
                echo "ID: " . $row['idRegistro'] . "\n";
                echo "NIF: " . $row['NIF'] . "\n";
                echo "Fecha: " . $row['fecha'] . "\n";
                echo "Hora Inicio: " . $row['horaInicio'] . "\n";
                echo "Latitud: " . (isset($row['latitud']) && $row['latitud'] !== null ? $row['latitud'] . ' (' . gettype($row['latitud']) . ')' : 'NULL') . "\n";
                echo "Longitud: " . (isset($row['longitud']) && $row['longitud'] !== null ? $row['longitud'] . ' (' . gettype($row['longitud']) . ')' : 'NULL') . "\n";
                echo "Localizaciu00f3n: " . (isset($row['localizacion']) && $row['localizacion'] !== null ? $row['localizacion'] . ' (' . gettype($row['localizacion']) . ')' : 'NULL') . "\n";
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
        echo "Latitud: " . (isset($row['latitud']) && $row['latitud'] !== null ? $row['latitud'] . ' (' . gettype($row['latitud']) . ')' : 'NULL') . "\n";
        echo "Longitud: " . (isset($row['longitud']) && $row['longitud'] !== null ? $row['longitud'] . ' (' . gettype($row['longitud']) . ')' : 'NULL') . "\n";
        echo "Localizaciu00f3n: " . (isset($row['localizacion']) && $row['localizacion'] !== null ? $row['localizacion'] . ' (' . gettype($row['localizacion']) . ')' : 'NULL') . "\n";
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
