<?php
// Script para restablecer completamente los usuarios de MySQL y sus permisos
header('Content-Type: text/plain; charset=utf-8');

echo "=== Script de restablecimiento de usuarios de MySQL ===\n\n";

// Intenta conectar con varios mu00e9todos
$connections = [
    ['127.0.0.1', 'root', ''],
    ['localhost', 'root', ''],
    ['', 'root', ''],
    // Puedes agregar mu00e1s opciones aquu00ed
];

$conn = null;
foreach ($connections as $connParams) {
    list($host, $user, $pass) = $connParams;
    echo "Intentando conectar a MySQL con host: '$host'...\n";
    try {
        $tempConn = @new mysqli($host, $user, $pass);
        if (!$tempConn->connect_error) {
            $conn = $tempConn;
            echo "\u00a1Conexiu00f3n exitosa a MySQL con host: '$host'!\n\n";
            break;
        }
    } catch (Exception $e) {
        echo "Error: " . $e->getMessage() . "\n";
    }
}

if (!$conn) {
    die("\nNo se pudo conectar a MySQL con ninguna de las opciones. Por favor, verifica que el servidor MySQL estu00e9 en ejecuciu00f3n.\n");
}

// 1. Eliminar usuarios existentes excepto el root actual conectado
echo "Eliminando usuarios antiguos...\n";
try {
    // Primero identifiquemos cuu00e1l es el usuario y host actual con el que hemos conectado
    $result = $conn->query("SELECT CURRENT_USER() as current_user");
    $row = $result->fetch_assoc();
    $currentUser = $row['current_user'];
    echo "Usuario actual conectado: $currentUser\n";
    
    // Consultar los usuarios existentes
    $result = $conn->query("SELECT User, Host FROM mysql.user");
    echo "Usuarios actuales en el sistema:\n";
    while ($row = $result->fetch_assoc()) {
        echo "- {$row['User']}@{$row['Host']}\n";
        
        // No eliminar el usuario con el que estamos conectados
        $userHost = "{$row['User']}@{$row['Host']}";
        if ($userHost != $currentUser && $row['User'] == 'root') {
            $dropUser = "DROP USER IF EXISTS '{$row['User']}'@'{$row['Host']}'";
            if ($conn->query($dropUser)) {
                echo "  Usuario eliminado.\n";
            } else {
                echo "  Error al eliminar usuario: " . $conn->error . "\n";
            }
        }
    }
} catch (Exception $e) {
    echo "Error al eliminar usuarios: " . $e->getMessage() . "\n";
}

// 2. Crear nuevos usuarios root con todos los permisos
echo "\nCreando nuevos usuarios root...\n";
try {
    $hosts = ['localhost', '127.0.0.1', '%'];
    
    foreach ($hosts as $host) {
        // Crear el usuario
        $createUser = "CREATE USER IF NOT EXISTS 'root'@'$host' IDENTIFIED BY ''";
        if ($conn->query($createUser)) {
            echo "Usuario 'root'@'$host' creado.\n";
            
            // Otorgar permisos
            $grantAll = "GRANT ALL PRIVILEGES ON *.* TO 'root'@'$host' WITH GRANT OPTION";
            if ($conn->query($grantAll)) {
                echo "Permisos otorgados a 'root'@'$host'.\n";
            } else {
                echo "Error al otorgar permisos a 'root'@'$host': " . $conn->error . "\n";
            }
        } else {
            echo "Error al crear usuario 'root'@'$host': " . $conn->error . "\n";
        }
    }
    
    // Aplicar cambios
    if ($conn->query("FLUSH PRIVILEGES")) {
        echo "\nPrivilegios actualizados correctamente.\n";
    } else {
        echo "\nError al actualizar privilegios: " . $conn->error . "\n";
    }
} catch (Exception $e) {
    echo "Error al crear usuarios: " . $e->getMessage() . "\n";
}

// 3. Verificar si la base de datos impulsatelecom existe
echo "\nVerificando base de datos impulsatelecom...\n";
try {
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
} catch (Exception $e) {
    echo "Error al verificar base de datos: " . $e->getMessage() . "\n";
}

// 4. Mostrar informaciu00f3n de la conexiu00f3n actual
echo "\nInformaciu00f3n del servidor MySQL:\n";
echo "- Versiu00f3n: " . $conn->server_info . "\n";
echo "- Host: " . $conn->host_info . "\n";

// 5. Mostrar usuarios actualizados
echo "\nUsuarios actualizados en el sistema:\n";
try {
    $result = $conn->query("SELECT User, Host FROM mysql.user WHERE User='root'");
    
    if ($result) {
        while ($row = $result->fetch_assoc()) {
            echo "- {$row['User']}@{$row['Host']}\n";
        }
    } else {
        echo "Error al consultar usuarios: " . $conn->error . "\n";
    }
} catch (Exception $e) {
    echo "Error al consultar usuarios: " . $e->getMessage() . "\n";
}

$conn->close();
echo "\n=== Proceso de restablecimiento de usuarios completado ===\n";
echo "\nAhora debes reiniciar el servicio de MySQL/MariaDB en XAMPP para aplicar los cambios.";
?>
