import axios from 'axios';

const API_URL = 'http://localhost/ImpulsaTelecom/backend/api/Fichaje.php';

// Obtener fichaje actual del usuario
export const getFichajeActual = async (id_usuario) => {
  try {
    const response = await axios.get(`${API_URL}?route=actual&id_usuario=${id_usuario}`);
    return response.data;
  } catch (error) {
    console.error('Error al obtener fichaje actual:', error);
    return { success: false, message: 'Error al obtener fichaje actual' };
  }
};

// Obtener historial de fichajes
export const getHistorialFichajes = async (id_usuario) => {
  try {
    const response = await axios.get(`${API_URL}?route=historial&id_usuario=${id_usuario}`);
    return response.data;
  } catch (error) {
    console.error('Error al obtener historial de fichajes:', error);
    return { success: false, message: 'Error al obtener historial de fichajes' };
  }
};

// Obtener estadísticas de fichajes
export const getEstadisticasFichajes = async (id_usuario, periodo = 'semana') => {
  try {
    const response = await axios.get(`${API_URL}?route=estadisticas&id_usuario=${id_usuario}&periodo=${periodo}`);
    return response.data;
  } catch (error) {
    console.error('Error al obtener estadísticas de fichajes:', error);
    return { success: false, message: 'Error al obtener estadísticas de fichajes' };
  }
};

// Registrar entrada
export const registrarEntrada = async (id_usuario) => {
  try {
    const fecha = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const hora = new Date().toTimeString().split(' ')[0]; // HH:MM:SS
    
    const response = await axios.post(`${API_URL}?route=entrada`, {
      id_usuario,
      fecha,
      hora
    });
    
    return response.data;
  } catch (error) {
    console.error('Error al registrar entrada:', error);
    return { success: false, message: 'Error al registrar entrada' };
  }
};

// Registrar salida
export const registrarSalida = async (id_usuario, id_fichaje) => {
  try {
    const hora = new Date().toTimeString().split(' ')[0]; // HH:MM:SS
    
    const response = await axios.post(`${API_URL}?route=salida`, {
      id_usuario,
      id_fichaje,
      hora
    });
    
    return response.data;
  } catch (error) {
    console.error('Error al registrar salida:', error);
    return { success: false, message: 'Error al registrar salida' };
  }
};

// Registrar pausa (inicio o fin)
export const registrarPausa = async (id_usuario, id_fichaje, tipo) => {
  try {
    const hora = new Date().toTimeString().split(' ')[0]; // HH:MM:SS
    
    const response = await axios.post(`${API_URL}?route=pausa`, {
      id_usuario,
      id_fichaje,
      tipo, // 'inicio' o 'fin'
      hora
    });
    
    return response.data;
  } catch (error) {
    console.error('Error al registrar pausa:', error);
    return { success: false, message: 'Error al registrar pausa' };
  }
};
