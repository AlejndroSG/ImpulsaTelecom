<?php
// Script para verificar y corregir los permisos de acceso a la base de datos
header('Content-Type: text/plain; charset=utf-8');

echo "Verificando permisos de acceso a la base de datos...\n\n";

try {
    // Intentar conectar con usuario root
    $conn = new mysqli("127.0.0.1", "root", "");
    
    if ($conn->connect_error) {
        die("Error de conexiu00f3n: " . $conn->connect_error);
    }
    
    echo "Conexiu00f3n exitosa a MariaDB.\n";
    echo "Versiu00f3n del servidor: " . $conn->server_info . "\n\n";
    
    // Verificar si la base de datos existe
    $result = $conn->query("SHOW DATABASES LIKE 'impulsatelecom'");
    
    if ($result->num_rows == 0) {
        echo "La base de datos 'impulsatelecom' no existe. Creu00e1ndola...\n";
        if ($conn->query("CREATE DATABASE impulsatelecom")) {
            echo "Base de datos creada correctamente.\n";
        } else {
            echo "Error al crear la base de datos: " . $conn->error . "\n";
        }
    } else {
        echo "La base de datos 'impulsatelecom' ya existe.\n";
    }
    
    // Corregir permisos de acceso para localhost y 127.0.0.1
    echo "\nCorrigiendo permisos de acceso para el usuario root...\n";
    
    // Otorgar todos los privilegios al usuario root desde localhost
    $grant_localhost = "GRANT ALL PRIVILEGES ON *.* TO 'root'@'localhost' IDENTIFIED BY '' WITH GRANT OPTION";
    if ($conn->query($grant_localhost)) {
        echo "Permisos otorgados para 'root'@'localhost'.\n";
    } else {
        echo "Error al otorgar permisos para 'root'@'localhost': " . $conn->error . "\n";
    }
    
    // Otorgar todos los privilegios al usuario root desde 127.0.0.1
    $grant_ip = "GRANT ALL PRIVILEGES ON *.* TO 'root'@'127.0.0.1' IDENTIFIED BY '' WITH GRANT OPTION";
    if ($conn->query($grant_ip)) {
        echo "Permisos otorgados para 'root'@'127.0.0.1'.\n";
    } else {
        echo "Error al otorgar permisos para 'root'@'127.0.0.1': " . $conn->error . "\n";
    }
    
    // Otorgar todos los privilegios al usuario root desde cualquier host
    $grant_any = "GRANT ALL PRIVILEGES ON *.* TO 'root'@'%' IDENTIFIED BY '' WITH GRANT OPTION";
    if ($conn->query($grant_any)) {
        echo "Permisos otorgados para 'root'@'%'.\n";
    } else {
        echo "Error al otorgar permisos para 'root'@'%': " . $conn->error . "\n";
    }
    
    // Aplicar los cambios
    if ($conn->query("FLUSH PRIVILEGES")) {
        echo "Privilegios actualizados correctamente.\n";
    } else {
        echo "Error al actualizar privilegios: " . $conn->error . "\n";
    }
    
    // Verificar usuarios y hosts permitidos
    echo "\nVerificando usuarios y hosts permitidos:\n";
    $result = $conn->query("SELECT User, Host FROM mysql.user WHERE User='root'");
    
    if ($result) {
        echo "Usuario | Host\n";
        echo "------------------\n";
        while ($row = $result->fetch_assoc()) {
            echo $row['User'] . " | " . $row['Host'] . "\n";
        }
    } else {
        echo "Error al verificar usuarios: " . $conn->error . "\n";
    }
    
    $conn->close();
    echo "\nVerificaciu00f3n y correcciu00f3n de permisos completada.";
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
?>
