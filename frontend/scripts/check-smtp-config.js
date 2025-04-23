/**
 * Script para verificar la configuraciu00f3n SMTP antes de iniciar las notificaciones
 */

import { exec } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { existsSync, readFileSync } from 'fs';

// Obtener __dirname equivalente en ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Ruta al archivo de configuraciu00f3n SMTP
const smtpConfigPath = resolve(__dirname, '..', '..', 'backend', 'config', 'smtp_config.php');

console.log('\x1b[36m%s\x1b[0m', 'ud83dudd0d Verificando configuraciu00f3n SMTP...');

// Verificar si el archivo de configuraciu00f3n existe
if (!existsSync(smtpConfigPath)) {
  console.error('\x1b[31m%s\x1b[0m', 'u274c Error: No se encontru00f3 el archivo de configuraciu00f3n SMTP');
  console.error(`Ruta esperada: ${smtpConfigPath}`);
  
  // Crear archivo de configuraciu00f3n con valores predeterminados
  console.log('\x1b[33m%s\x1b[0m', 'u26a0ufe0f Creando archivo de configuraciu00f3n SMTP con valores predeterminados...');
  
  // Ejecutar script para crear configuraciu00f3n
  const testEmailPath = resolve(__dirname, '..', '..', 'backend', 'scripts', 'test_email.php');
  
  if (existsSync(testEmailPath)) {
    console.log('\x1b[36m%s\x1b[0m', 'ud83dudce7 Ejecutando prueba de envu00edo de correo...');
    
    // Ejecutar prueba de envu00edo de correo
    exec(`php "${testEmailPath}"`, (error, stdout, stderr) => {
      if (error) {
        console.error('\x1b[31m%s\x1b[0m', 'u274c Error al ejecutar prueba de correo:');
        console.error(error.message);
        return;
      }
      
      console.log('\x1b[32m%s\x1b[0m', '\nResultado de la prueba de correo:');
      console.log(stdout);
      
      if (stderr) {
        console.error('\x1b[33m%s\x1b[0m', 'Advertencias:');
        console.error(stderr);
      }
    });
  }
} else {
  // Leer el archivo para verificar si tiene configuraciu00f3n vu00e1lida
  const configContent = readFileSync(smtpConfigPath, 'utf8');
  
  // Verificar si contiene valores por defecto o incorrectos
  if (configContent.includes('tu-correo@gmail.com') || 
      configContent.includes('tu-contraseu00f1a-o-clave-de-aplicacion')) {
    console.warn('\x1b[33m%s\x1b[0m', 'u26a0ufe0f Advertencia: La configuraciu00f3n SMTP contiene valores por defecto');
    console.warn('\x1b[33m%s\x1b[0m', 'Por favor, actualiza la configuraciu00f3n en: ' + smtpConfigPath);
  } else {
    console.log('\x1b[32m%s\x1b[0m', 'u2705 Configuraciu00f3n SMTP verificada correctamente');
  }
}

export default function checkSmtpConfig() {
  return { smtpConfigPath };
}
