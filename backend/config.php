<?php
// Configuraciu00f3n de la base de datos
define('DB_HOST', '127.0.0.1');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'impulsatelecom');

// Otras configuraciones
define('TIMEZONE', 'Europe/Madrid');
date_default_timezone_set(TIMEZONE);

// Configuraciu00f3n de CORS
define('ALLOWED_ORIGINS', ['http://localhost:3000', 'http://localhost:5173']);
?>
