<?php
// Configuración de SMTP para envío de recordatorios

// Datos de conexión al servidor SMTP
define('SMTP_HOST', 'smtp.gmail.com');       // Servidor SMTP (ej: smtp.gmail.com, smtp.office365.com)
define('SMTP_PORT', 587);                   // Puerto SMTP (normalmente 587 para TLS, 465 para SSL)
define('SMTP_USUARIO', 'elreibo30@gmail.com'); // Tu dirección de correo electrónico
define('SMTP_PASSWORD', 'crel reic yxdc cgxb'); // Contraseña o clave de aplicación
define('SMTP_NOMBRE', 'Impulsa Telecom');   // Nombre que aparecerá como remitente

// Otras configuraciones para los recordatorios
define('MINUTOS_ANTICIPACION', 5);          // Minutos de anticipación para enviar recordatorios
define('ACTIVAR_RECORDATORIO_ENTRADA', true);      // Activar/desactivar recordatorios de entrada
define('ACTIVAR_RECORDATORIO_SALIDA', true);       // Activar/desactivar recordatorios de salida
define('ACTIVAR_RECORDATORIO_INICIO_PAUSA', false); // Desactivados recordatorios de inicio de pausa
define('ACTIVAR_RECORDATORIO_FIN_PAUSA', false);    // Desactivados recordatorios de fin de pausa
