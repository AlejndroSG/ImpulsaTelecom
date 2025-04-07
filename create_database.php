<?php
// Script para crear la base de datos y ejecutar el archivo SQL

// Configuración de errores
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Parámetros de conexión
$host = 'localhost';
$username = 'root';
$password = '';

try {
    // Conectar a MySQL sin especificar una base de datos
    $pdo = new PDO("mysql:host=$host", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Verificar si la base de datos ya existe
    $stmt = $pdo->query("SHOW DATABASES LIKE 'ImpulsaTelecom'");
    $dbExists = $stmt->rowCount() > 0;
    
    if (!$dbExists) {
        // Crear la base de datos si no existe
        $pdo->exec("CREATE DATABASE IF NOT EXISTS ImpulsaTelecom CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci");
        echo "Base de datos 'ImpulsaTelecom' creada correctamente.<br>";
        
        // Seleccionar la base de datos
        $pdo->exec("USE ImpulsaTelecom");
        
        // Leer el archivo SQL
        $sqlFile = __DIR__ . '/ImpulsaTelecom (3).sql';
        if (file_exists($sqlFile)) {
            $sql = file_get_contents($sqlFile);
            
            // Eliminar la parte de creación de la base de datos y otras instrucciones que puedan causar problemas
            $sql = preg_replace('/CREATE DATABASE.*?;/is', '', $sql);
            $sql = preg_replace('/USE.*?;/is', '', $sql);
            
            // Dividir el SQL en instrucciones individuales
            $queries = preg_split('/;\r?\n/s', $sql);
            
            // Ejecutar cada consulta por separado
            foreach ($queries as $query) {
                $query = trim($query);
                if (!empty($query)) {
                    try {
                        $pdo->exec($query);
                    } catch (PDOException $e) {
                        echo "Error en consulta: " . $e->getMessage() . "<br>";
                        echo "Consulta: " . $query . "<br><br>";
                    }
                }
            }
            echo "Archivo SQL importado correctamente.<br>";
        } else {
            echo "El archivo SQL no existe.<br>";
        }
    } else {
        echo "La base de datos 'ImpulsaTelecom' ya existe.<br>";
    }
    
    echo "<p>Estado de la base de datos:</p>";
    $tables = $pdo->query("SHOW TABLES FROM ImpulsaTelecom")->fetchAll(PDO::FETCH_COLUMN);
    if (count($tables) > 0) {
        echo "<p>Tablas encontradas: " . implode(", ", $tables) . "</p>";
    } else {
        echo "<p>No se encontraron tablas en la base de datos.</p>";
    }
    
    echo "<p><a href='/ImpulsaTelecom/frontend/'>Ir a la aplicación</a></p>";
    
} catch (PDOException $e) {
    die("<p>Error: " . $e->getMessage() . "</p>");
}
