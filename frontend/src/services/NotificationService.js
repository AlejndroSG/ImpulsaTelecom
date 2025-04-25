/**
 * Servicio de notificaciones integrado en el frontend
 * Simplemente llama a un endpoint que verifica y envu00eda recordatorios
 */
import axios from 'axios';

// URL base (la misma que usa el resto de la aplicaciu00f3n)
const API_URL = 'http://localhost/ImpulsaTelecom/backend/api';

class NotificationService {
  constructor() {
    this.interval = null;
    this.isRunning = false;
  }

  /**
   * Inicia el servicio de notificaciones
   */
  start() {
    if (this.isRunning) return;
    
    console.log('\ud83d\udd14 Iniciando servicio de notificaciones...');
    
    // Verificar inmediatamente al inicio
    this.checkNotifications();
    
    // Configurar verificaciu00f3n cada 30 minutos (1800000 ms)
    // Esto evitaru00e1 que se envu00eden correos demasiado frecuentemente a los usuarios
    this.interval = setInterval(() => this.checkNotifications(), 1800000);
    this.isRunning = true;
    
    console.log('\u2705 Servicio de notificaciones iniciado correctamente');
  }

  /**
   * Detiene el servicio de notificaciones
   */
  stop() {
    if (!this.isRunning) return;
    
    clearInterval(this.interval);
    this.interval = null;
    this.isRunning = false;
    
    console.log('\ud83d\uded1 Servicio de notificaciones detenido');
  }

  /**
   * Verifica si hay notificaciones pendientes para enviar
   */
  async checkNotifications() {
    try {
      // Esta llamada es liviana, no genera parpadeos ni ventanas
      // Actualizado para usar el nuevo script que ejecuta recordatorios de forma más fiable
      const response = await axios.get(`${API_URL}/ejecutar_recordatorios.php`, {
        withCredentials: true
      });
      
      // Opcional: mostrar informaciu00f3n de depuraciu00f3n
      if (response.data && response.data.success) {
        const recordatorios = response.data.enviados || [];
        if (recordatorios.length > 0) {
          console.log(`\ud83d\udce7 ${recordatorios.length} recordatorios enviados:`, recordatorios);
        }
      }
    } catch (error) {
      // Ignorar errores - se registraru00e1n en los logs del backend
      // pero no interrumpiru00e1n el funcionamiento de la aplicaciu00f3n
    }
  }
}

// Exportar una u00fanica instancia del servicio
export default new NotificationService();
