/**
 * Servicio de notificaciones simple para ImpulsaTelecom
 * Se ejecuta junto con el servidor de desarrollo y verifica los recordatorios
 * cada minuto sin ventanas emergentes ni parpadeos.
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Obtener la ruta base del proyecto
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, '..', '..');
const scriptPath = resolve(rootDir, 'backend', 'scripts', 'enviar_recordatorios.php');

// Buscar la ruta de PHP en el sistema
let phpPath = 'php'; // Por defecto

// En Windows, intentar usar la ruta típica de XAMPP
if (process.platform === 'win32') {
  const possiblePhpPaths = [
    'C:\\xampp\\php\\php.exe',
    'C:\\wamp64\\bin\\php\\php8.1.0\\php.exe',
    'C:\\wamp\\bin\\php\\php8.1.0\\php.exe'
  ];
  
  const fs = await import('fs');
  for (const path of possiblePhpPaths) {
    if (fs.existsSync(path)) {
      phpPath = path;
      break;
    }
  }
}

console.log('\x1b[36m%s\x1b[0m', '🔔 Iniciando servicio de recordatorios...');
console.log(`📂 Usando PHP: ${phpPath}`);
console.log(`📂 Script: ${scriptPath}`);

// Función para ejecutar el script PHP sin mostrar ventanas
function checkNotifications() {
  // Usar spawn en modo detached y sin stdio para evitar ventanas
  const options = { detached: true, stdio: 'ignore' };
  
  try {
    const process = spawn(phpPath, [scriptPath], options);
    
    // Desvincular el proceso para que se ejecute completamente en segundo plano
    process.unref();
    
    // No necesitamos capturar salida ni errores ya que se registran en los logs del backend
  } catch (error) {
    console.error('\x1b[31m%s\x1b[0m', `❌ Error al verificar recordatorios: ${error.message}`);
  }
}

// Ejecutar inmediatamente la primera verificación
checkNotifications();

// Configurar el intervalo para verificar cada minuto (60000 ms)
const intervalId = setInterval(checkNotifications, 60000);

// Manejar la finalización del proceso para limpiar
process.on('SIGINT', () => {
  clearInterval(intervalId);
  console.log('\x1b[33m%s\x1b[0m', '🛑 Servicio de recordatorios detenido');
  process.exit(0);
});

console.log('\x1b[32m%s\x1b[0m', '✅ Servicio de recordatorios iniciado correctamente (verificando cada minuto)');
console.log('\x1b[36m%s\x1b[0m', 'Los usuarios recibirán recordatorios según sus horarios configurados');
