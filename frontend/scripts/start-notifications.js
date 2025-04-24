/**
 * Script para iniciar automáticamente las notificaciones por email
 * Este script se ejecuta al iniciar el servidor de desarrollo
 */

import { exec } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { existsSync } from 'fs';
import checkSmtpConfig from './check-smtp-config.js';

// Verificar configuración SMTP antes de iniciar notificaciones
checkSmtpConfig();

// Obtener __dirname equivalente en ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Ruta al script batch que inicia las notificaciones
const batchScriptPath = resolve(__dirname, 'start-notifications.bat');

// Verificar si el script existe
if (!existsSync(batchScriptPath)) {
  console.error('\x1b[31m%s\x1b[0m', 'Error: No se encontró el script de inicio de notificaciones');
  console.error(`Ruta esperada: ${batchScriptPath}`);
  process.exit(1);
}

console.log('\x1b[36m%s\x1b[0m', '🔔 Iniciando servicio de notificaciones por email...');

// Ejecutar directamente la configuración de la tarea programada con PowerShell y privilegios elevados
// Esto garantiza que se cree la tarea programada correctamente
const configScriptPath = resolve(__dirname, '..', '..', 'backend', 'scripts', 'configurar_tarea_programada.bat');

// Verificar si el script de configuración existe
if (!existsSync(configScriptPath)) {
  console.error('\x1b[31m%s\x1b[0m', 'Error: No se encontró el script de configuración de la tarea programada');
  console.error(`Ruta esperada: ${configScriptPath}`);
  // Intentar ejecutar el script batch original como plan B
  const command = `"${batchScriptPath}"`;
  exec(command);
  return;
}

console.log('\x1b[36m%s\x1b[0m', '🔄 Configurando tarea programada para recordatorios...');

// Usar PowerShell para ejecutar el script con privilegios elevados
const psCommand = `powershell -Command "Start-Process '${configScriptPath}' -Verb RunAs -WindowStyle Normal"`;

// Ejecutar el comando principal
exec(psCommand, (error, stdout, stderr) => {
  if (error) {
    console.error('\x1b[31m%s\x1b[0m', '❌ Error al configurar la tarea programada:');
    console.error(error.message);
    
    // Intentar ejecutar el script batch original como plan B
    console.log('\x1b[33m%s\x1b[0m', '⚠️ Intentando método alternativo...');
    const fallbackCommand = `"${batchScriptPath}"`;
    exec(fallbackCommand);
    return;
  }
  
  if (stderr) {
    console.error('\x1b[33m%s\x1b[0m', '⚠️ Advertencia al configurar la tarea programada:');
    console.error(stderr);
  }
  
  console.log('\x1b[32m%s\x1b[0m', '✅ Servicio de notificaciones por email iniciado correctamente');
  console.log('\x1b[36m%s\x1b[0m', 'Los usuarios recibirán recordatorios según sus horarios configurados');
  
  // Verificar que la tarea programada existe y está habilitada
  setTimeout(() => {
    exec('schtasks /Query /TN "ImpulsaTelecom\EnviarRecordatorios" /FO LIST', (err, out) => {
      if (err) {
        console.error('\x1b[31m%s\x1b[0m', '❌ No se pudo verificar la tarea programada. Es posible que necesites ejecutar como administrador.');
      } else {
        console.log('\x1b[32m%s\x1b[0m', '✓ Tarea programada configurada correctamente:');
        console.log(out);
      }
    });
  }, 1000);
});

// También ejecutar el script de recordatorios inmediatamente para que no haya que esperar al próximo minuto
const recordatoriosScript = resolve(__dirname, '..', '..', 'backend', 'scripts', 'enviar_recordatorios.php');
console.log('\x1b[36m%s\x1b[0m', '🔄 Ejecutando verificación inicial de recordatorios...');

// Buscar PHP en el sistema
exec('where php', (err, phpPath) => {
  if (err) {
    console.error('\x1b[31m%s\x1b[0m', '❌ No se pudo encontrar PHP en el sistema.');
    return;
  }
  
  const phpExe = phpPath.trim();
  exec(`"${phpExe}" "${recordatoriosScript}"`, (error, stdout, stderr) => {
    if (error) {
      console.error('\x1b[31m%s\x1b[0m', '❌ Error al ejecutar verificación inicial de recordatorios:');
      console.error(error.message);
      return;
    }
    
    console.log('\x1b[32m%s\x1b[0m', '✅ Verificación inicial de recordatorios completada');
  });
});
