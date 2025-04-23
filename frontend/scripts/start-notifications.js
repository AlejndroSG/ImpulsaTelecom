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

// Ejecutar el script batch
const command = `"${batchScriptPath}"`;

exec(command, (error, stdout, stderr) => {
  if (error) {
    console.error('\x1b[31m%s\x1b[0m', '❌ Error al iniciar el servicio de notificaciones:');
    console.error(error.message);
    return;
  }
  
  if (stderr) {
    console.error('\x1b[33m%s\x1b[0m', '⚠️ Advertencia al iniciar notificaciones:');
    console.error(stderr);
    return;
  }
  
  console.log('\x1b[32m%s\x1b[0m', '✅ Servicio de notificaciones por email iniciado correctamente');
  console.log('\x1b[36m%s\x1b[0m', 'Los usuarios recibirán recordatorios según sus horarios configurados');
});
