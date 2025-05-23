<?php
// Configuraciu00f3n de la base de datos - ajusta estos valores si es necesario
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'impulsatelecom');

// Crear conexiu00f3n
$conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);

// Verificar conexiu00f3n
if ($conn->connect_error) {
    die("Error de conexiu00f3n: " . $conn->connect_error);
}

// SQL para crear la tabla documentos
$sql = "CREATE TABLE IF NOT EXISTS `documentos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `titulo` varchar(255) NOT NULL,
  `descripcion` text,
  `ruta_archivo` varchar(255) NOT NULL,
  `tipo_documento` varchar(50) NOT NULL,
  `tamanio` int(11) NOT NULL,
  `nif_usuario` varchar(15) NOT NULL,
  `creado_por` varchar(15) NOT NULL,
  `fecha_subida` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `acceso_publico` tinyint(1) NOT NULL DEFAULT '0',
  `fecha_expiracion` date DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_nif_usuario` (`nif_usuario`),
  KEY `idx_tipo_documento` (`tipo_documento`),
  KEY `idx_creado_por` (`creado_por`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";  

// Ejecutar query
if ($conn->query($sql) === TRUE) {
    echo "<div style='background-color: #d4edda; color: #155724; padding: 15px; border-radius: 4px; margin: 20px;'>"
       . "<h3>\u00a1u00c9xito!</h3>"
       . "<p>La tabla 'documentos' ha sido creada correctamente en la base de datos.</p>"
       . "</div>";
} else {
    echo "<div style='background-color: #f8d7da; color: #721c24; padding: 15px; border-radius: 4px; margin: 20px;'>"
       . "<h3>Error</h3>"
       . "<p>Error al crear la tabla: " . $conn->error . "</p>"
       . "</div>";
}

// Crear el directorio para almacenar documentos si no existe
$dirDocumentos = __DIR__ . '/backend/uploads/documentos';
if (!file_exists($dirDocumentos)) {
    if (mkdir($dirDocumentos, 0755, true)) {
        echo "<div style='background-color: #d4edda; color: #155724; padding: 15px; border-radius: 4px; margin: 20px;'>"
           . "<p>El directorio para documentos ha sido creado correctamente.</p>"
           . "</div>";
    } else {
        echo "<div style='background-color: #fff3cd; color: #856404; padding: 15px; border-radius: 4px; margin: 20px;'>"
           . "<p>No se pudo crear el directorio para documentos. Por favor, crea manualmente el directorio: /backend/uploads/documentos</p>"
           . "</div>";
    }
} else {
    echo "<div style='background-color: #d1ecf1; color: #0c5460; padding: 15px; border-radius: 4px; margin: 20px;'>"
       . "<p>El directorio para documentos ya existe.</p>"
       . "</div>";
}

// Cerrar conexiu00f3n
$conn->close();

echo "<div style='background-color: #e2e3e5; color: #383d41; padding: 15px; border-radius: 4px; margin: 20px;'>"
   . "<h3>Pru00f3ximos pasos:</h3>"
   . "<ol>"
   . "<li>Accede al panel de administraciu00f3n -> Documentos</li>"
   . "<li>Comienza a subir documentos para tus empleados</li>"
   . "<li>Los empleados podru00e1n ver sus documentos en la secciu00f3n 'Documentaciu00f3n Legal' -> 'Mis Documentos Personales'</li>"
   . "</ol>"
   . "</div>";
?>

<style>
body {
    font-family: Arial, sans-serif;
    line-height: 1.6;
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
}
h1 {
    color: #333;
    text-align: center;
}
</style>
