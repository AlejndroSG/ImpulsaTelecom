<?php
// Script de prueba para insertar un registro con localización
include_once "backend/modelos/bd.php";

// Configurar cabeceras para mostrar resultados como texto plano
header('Content-Type: text/plain; charset=utf-8');

// Función para conectar a la base de datos
function conectarBD() {
    $db = new BaseDatos();
    return $db->getConn();
}

// Función para verificar y crear columnas para localización si no existen
function verificarColumnasLocalizacion($conn) {
    // Verificar si la columna latitud existe
    $query = "SHOW COLUMNS FROM registros LIKE 'latitud'";
    $result = $conn->query($query);
    
    if ($result->num_rows == 0) {
        // Agregar columnas para localización
        $alterQuery = "ALTER TABLE registros 
                       ADD COLUMN latitud DECIMAL(10, 8) NULL, 
                       ADD COLUMN longitud DECIMAL(11, 8) NULL,
                       ADD COLUMN localizacion VARCHAR(255) NULL";
        $conn->query($alterQuery);
        echo "Columnas de localización creadas.\n";
    } else {
        // Verificar si la columna localizacion existe
        $query = "SHOW COLUMNS FROM registros LIKE 'localizacion'";
        $result = $conn->query($query);
        
        if ($result->num_rows == 0) {
            // Agregar solo la columna de localizacion
            $alterQuery = "ALTER TABLE registros ADD COLUMN localizacion VARCHAR(255) NULL";
            $conn->query($alterQuery);
            echo "Columna 'localizacion' creada.\n";
        }
    }
    
    echo "Estructura de la tabla verificada.\n";
}

// Función para insertar un registro de prueba con localización
function insertarRegistroPrueba($conn) {
    // Datos de prueba
    $nif = "12345678A";
    $fecha = date('Y-m-d');
    $hora = date('H:i:s');
    $latitud = 40.416775;
    $longitud = -3.703790;
    $localizacion = "$latitud, $longitud";
    
    // Mostrar los datos que se van a insertar
    echo "Insertando registro de prueba con los siguientes datos:\n";
    echo "NIF: $nif\n";
    echo "Fecha: $fecha\n";
    echo "Hora: $hora\n";
    echo "Latitud: $latitud\n";
    echo "Longitud: $longitud\n";
    echo "Localización: $localizacion\n";
    
    // Preparar la consulta SQL
    $query = "INSERT INTO registros 
              (NIF, fecha, horaInicio, latitud, longitud, localizacion, estado) 
              VALUES (?, ?, ?, ?, ?, ?, 'entrada')";
    
    $stmt = $conn->prepare($query);
    
    if ($stmt === false) {
        echo "Error en la preparación de la consulta: " . $conn->error . "\n";
        return false;
    }
    
    // Vincular parámetros
    $stmt->bind_param("sssdds", $nif, $fecha, $hora, $latitud, $longitud, $localizacion);
    
    // Ejecutar la consulta
    if ($stmt->execute()) {
        $id_fichaje = $conn->insert_id;
        echo "Registro insertado correctamente con ID: $id_fichaje\n";
        return true;
    } else {
        echo "Error al insertar registro: " . $stmt->error . "\n";
        return false;
    }
}

// Función para verificar el registro insertado
function verificarRegistro($conn, $id) {
    $query = "SELECT * FROM registros WHERE idRegistro = ?";
    $stmt = $conn->prepare($query);
    
    if ($stmt === false) {
        echo "Error en la preparación de la consulta de verificación: " . $conn->error . "\n";
        return;
    }
    
    $stmt->bind_param("i", $id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows > 0) {
        $row = $result->fetch_assoc();
        echo "\nVerificación del registro insertado:\n";
        echo "ID: " . $row['idRegistro'] . "\n";
        echo "NIF: " . $row['NIF'] . "\n";
        echo "Fecha: " . $row['fecha'] . "\n";
        echo "Hora Inicio: " . $row['horaInicio'] . "\n";
        echo "Latitud: " . $row['latitud'] . "\n";
        echo "Longitud: " . $row['longitud'] . "\n";
        echo "Localización: " . $row['localizacion'] . "\n";
        echo "Estado: " . $row['estado'] . "\n";
    } else {
        echo "No se encontró el registro con ID: $id\n";
    }
}

// Ejecutar las pruebas
try {
    echo "Iniciando prueba de localización...\n\n";
    
    // Conectar a la base de datos
    $conn = conectarBD();
    echo "Conexión a la base de datos establecida.\n";
    
    // Verificar y crear columnas si es necesario
    verificarColumnasLocalizacion($conn);
    
    // Insertar registro de prueba
    if (insertarRegistroPrueba($conn)) {
        // Verificar el registro insertado
        $id_insertado = $conn->insert_id;
        verificarRegistro($conn, $id_insertado);
    }
    
    echo "\nPrueba completada.";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
