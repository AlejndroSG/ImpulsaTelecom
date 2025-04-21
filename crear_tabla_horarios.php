<?php
// Script para crear la tabla de horarios y modificar la tabla de usuarios

// Incluir la conexión a la base de datos
require_once "backend/modelos/bd.php";

try {
    // Crear instancia de la base de datos
    $db = new db();
    $conn = $db->getConn();
    
    // Verificar la conexión
    if ($conn->connect_error) {
        die("Error de conexión: " . $conn->connect_error);
    }
    
    echo "<h2>Creando tabla de horarios y modificando tabla de usuarios...</h2>";
    
    // Crear tabla de horarios
    $sql_crear_tabla = "CREATE TABLE IF NOT EXISTS `horarios` (
      `id` int(11) NOT NULL AUTO_INCREMENT,
      `nombre` varchar(100) NOT NULL,
      `descripcion` text DEFAULT NULL,
      `hora_inicio` time NOT NULL,
      `hora_fin` time NOT NULL,
      `lunes` tinyint(1) NOT NULL DEFAULT 1,
      `martes` tinyint(1) NOT NULL DEFAULT 1,
      `miercoles` tinyint(1) NOT NULL DEFAULT 1,
      `jueves` tinyint(1) NOT NULL DEFAULT 1,
      `viernes` tinyint(1) NOT NULL DEFAULT 1,
      `sabado` tinyint(1) NOT NULL DEFAULT 0,
      `domingo` tinyint(1) NOT NULL DEFAULT 0,
      `tiempo_pausa_permitido` int(11) DEFAULT 60 COMMENT 'Tiempo de pausa permitido en minutos',
      `activo` tinyint(1) NOT NULL DEFAULT 1,
      `fecha_creacion` timestamp NOT NULL DEFAULT current_timestamp(),
      `fecha_modificacion` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
      PRIMARY KEY (`id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci";
    
    if ($conn->query($sql_crear_tabla) === TRUE) {
        echo "<p>Tabla 'horarios' creada correctamente.</p>";
    } else {
        echo "<p>Error al crear la tabla 'horarios': " . $conn->error . "</p>";
    }
    
    // Verificar si la columna id_horario ya existe en la tabla usuarios
    $result = $conn->query("SHOW COLUMNS FROM usuarios LIKE 'id_horario'");
    if ($result->num_rows == 0) {
        // Añadir columna id_horario a la tabla usuarios
        $sql_modificar_usuarios = "ALTER TABLE `usuarios` ADD COLUMN `id_horario` int(11) DEFAULT NULL";
        
        if ($conn->query($sql_modificar_usuarios) === TRUE) {
            echo "<p>Columna 'id_horario' añadida a la tabla 'usuarios' correctamente.</p>";
        } else {
            echo "<p>Error al añadir la columna 'id_horario': " . $conn->error . "</p>";
        }
        
        // Añadir clave foránea
        $sql_foreign_key = "ALTER TABLE `usuarios` ADD CONSTRAINT `fk_usuarios_horarios` FOREIGN KEY (`id_horario`) REFERENCES `horarios` (`id`) ON DELETE SET NULL";
        
        if ($conn->query($sql_foreign_key) === TRUE) {
            echo "<p>Clave foránea añadida correctamente.</p>";
        } else {
            echo "<p>Error al añadir la clave foránea: " . $conn->error . "</p>";
        }
    } else {
        echo "<p>La columna 'id_horario' ya existe en la tabla 'usuarios'.</p>";
    }
    
    // Insertar horarios de ejemplo
    $sql_insertar_horarios = "INSERT INTO `horarios` (`nombre`, `descripcion`, `hora_inicio`, `hora_fin`, `lunes`, `martes`, `miercoles`, `jueves`, `viernes`, `sabado`, `domingo`, `tiempo_pausa_permitido`) VALUES
    ('Jornada Completa', 'Horario estándar de oficina de lunes a viernes', '09:00:00', '18:00:00', 1, 1, 1, 1, 1, 0, 0, 60),
    ('Media Jornada Mañana', 'Horario de media jornada por la mañana', '09:00:00', '13:00:00', 1, 1, 1, 1, 1, 0, 0, 30),
    ('Media Jornada Tarde', 'Horario de media jornada por la tarde', '14:00:00', '18:00:00', 1, 1, 1, 1, 1, 0, 0, 30),
    ('Jornada Intensiva', 'Horario intensivo sin pausa para comida', '08:00:00', '15:00:00', 1, 1, 1, 1, 1, 0, 0, 30),
    ('Fin de Semana', 'Horario para trabajadores de fin de semana', '10:00:00', '19:00:00', 0, 0, 0, 0, 0, 1, 1, 60)";
    
    if ($conn->query($sql_insertar_horarios) === TRUE) {
        echo "<p>Horarios de ejemplo insertados correctamente.</p>";
    } else {
        echo "<p>Error al insertar horarios de ejemplo: " . $conn->error . "</p>";
    }
    
    echo "<h3>Proceso completado.</h3>";
    echo "<p><a href='index.html'>Volver al inicio</a></p>";
    
} catch (Exception $e) {
    echo "<h2>Error:</h2>";
    echo "<p>" . $e->getMessage() . "</p>";
}