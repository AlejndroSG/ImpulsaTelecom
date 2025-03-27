<?php
// Script para verificar la estructura de la tabla registros
require_once "backend/config.php";

// Configurar cabeceras para mostrar resultados como texto plano
header('Content-Type: text/plain; charset=utf-8');

// Conectar a la base de datos directamente
$servername = DB_HOST;
$username = DB_USER;
$password = DB_PASS;
$dbname = DB_NAME;

echo "Intentando conectar a la base de datos...\n";
echo "Servidor: $servername\n";
echo "Usuario: $username\n";
echo "Base de datos: $dbname\n\n";

$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
    die("Error de conexiu00f3n: " . $conn->connect_error);
}

echo "Conexiu00f3n exitosa a la base de datos.\n\n";

// Obtener la estructura de la tabla registros
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

// Verificar si hay triggers en la tabla
$query = "SHOW TRIGGERS LIKE 'registros'";
$result = $conn->query($query);

echo "\nTriggers en la tabla 'registros':\n";

if ($result && $result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        echo "Nombre: " . $row['Trigger'] . "\n";
        echo "Evento: " . $row['Event'] . "\n";
        echo "Tabla: " . $row['Table'] . "\n";
        echo "Sentencia: " . $row['Statement'] . "\n";
        echo "Tiempo: " . $row['Timing'] . "\n";
        echo "Creado: " . $row['Created'] . "\n";
        echo "sql_mode: " . $row['sql_mode'] . "\n";
        echo "Definer: " . $row['Definer'] . "\n";
        echo "character_set_client: " . $row['character_set_client'] . "\n";
        echo "collation_connection: " . $row['collation_connection'] . "\n";
        echo "Database Collation: " . $row['Database Collation'] . "\n\n";
    }
} else {
    echo "No hay triggers definidos para esta tabla.\n";
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
echo "Latitud: $latitud\n";
echo "Longitud: $longitud\n";
echo "Localizaciu00f3n: $localizacion\n";

// Preparar la consulta SQL
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
                echo "Latitud: " . (isset($row['latitud']) ? $row['latitud'] : 'NULL') . "\n";
                echo "Longitud: " . (isset($row['longitud']) ? $row['longitud'] : 'NULL') . "\n";
                echo "Localizaciu00f3n: " . (isset($row['localizacion']) ? $row['localizacion'] : 'NULL') . "\n";
                echo "Estado: " . $row['estado'] . "\n";
            } else {
                echo "No se encontru00f3 el registro con ID: $id_fichaje\n";
            }
        }
    } else {
        echo "Error al insertar registro: " . $stmt->error . "\n";
    }
}

$conn->close();
echo "\nVerificaciu00f3n completada.";
?>
