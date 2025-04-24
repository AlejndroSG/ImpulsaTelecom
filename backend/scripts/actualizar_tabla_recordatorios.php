<?php
// Script para actualizar la estructura de la tabla recordatorios_enviados
header('Content-Type: text/plain; charset=UTF-8');

// Incluir la conexiu00f3n a base de datos
require_once __DIR__ . '/../modelos/bd.php';

echo "=================================================================\n";
echo "ACTUALIZANDO ESTRUCTURA DE LA TABLA DE RECORDATORIOS\n";
echo "=================================================================\n\n";

try {
    // Crear instancia de la conexiu00f3n
    $db = new db();
    $conn = $db->getConn();
    
    if (!$conn) {
        echo "ERROR: No se pudo conectar a la base de datos.\n";
        exit(1);
    }
    
    echo "Conexiu00f3n a la base de datos establecida correctamente.\n\n";
    
    // Verificar si la tabla existe
    $check_table = "SHOW TABLES LIKE 'recordatorios_enviados'";
    $result = $conn->query($check_table);
    
    if ($result->num_rows == 0) {
        echo "La tabla 'recordatorios_enviados' no existe. Creando la tabla...\n";
        
        // Crear la tabla si no existe
        $create_table = "CREATE TABLE recordatorios_enviados (
            id INT(11) NOT NULL AUTO_INCREMENT,
            NIF VARCHAR(15) NOT NULL,
            tipo_recordatorio VARCHAR(20) NOT NULL,
            tipo_fichaje VARCHAR(20) NOT NULL,
            fecha DATE NOT NULL,
            fecha_hora DATETIME DEFAULT CURRENT_TIMESTAMP,
            hora_programada TIME DEFAULT NULL,
            PRIMARY KEY (id)
        )";
        
        if ($conn->query($create_table)) {
            echo "Tabla 'recordatorios_enviados' creada correctamente con la nueva estructura.\n";
        } else {
            echo "ERROR al crear la tabla: " . $conn->error . "\n";
            exit(1);
        }
    } else {
        echo "La tabla 'recordatorios_enviados' ya existe. Verificando estructura...\n";
        
        // Verificar si las columnas ya existen
        $check_columns = "SHOW COLUMNS FROM recordatorios_enviados LIKE 'fecha_hora'";
        $result = $conn->query($check_columns);
        
        if ($result->num_rows == 0) {
            echo "Agregando columna 'fecha_hora'...\n";
            $add_column = "ALTER TABLE recordatorios_enviados ADD COLUMN fecha_hora DATETIME DEFAULT CURRENT_TIMESTAMP";
            
            if ($conn->query($add_column)) {
                echo "Columna 'fecha_hora' agregada correctamente.\n";
            } else {
                echo "ERROR al agregar columna 'fecha_hora': " . $conn->error . "\n";
            }
        } else {
            echo "La columna 'fecha_hora' ya existe.\n";
        }
        
        // Verificar si la columna hora_programada existe
        $check_columns = "SHOW COLUMNS FROM recordatorios_enviados LIKE 'hora_programada'";
        $result = $conn->query($check_columns);
        
        if ($result->num_rows == 0) {
            echo "Agregando columna 'hora_programada'...\n";
            $add_column = "ALTER TABLE recordatorios_enviados ADD COLUMN hora_programada TIME DEFAULT NULL";
            
            if ($conn->query($add_column)) {
                echo "Columna 'hora_programada' agregada correctamente.\n";
            } else {
                echo "ERROR al agregar columna 'hora_programada': " . $conn->error . "\n";
            }
        } else {
            echo "La columna 'hora_programada' ya existe.\n";
        }
    }
    
    echo "\nActualizaciu00f3n de la estructura de la base de datos completada.\n";
    echo "Ahora el sistema puede enviar mu00faltiples recordatorios del mismo tipo en un du00eda.\n";
    
    // Cerrar conexiu00f3n
    $conn->close();
    
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}

echo "\n=================================================================\n";
echo "PROCESu00ce COMPLETADO\n";
echo "=================================================================\n";
