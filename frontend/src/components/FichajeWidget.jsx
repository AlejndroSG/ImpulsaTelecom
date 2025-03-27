import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { FaRegClock, FaPlay, FaStop, FaPauseCircle, FaExclamationCircle } from 'react-icons/fa';
import { motion } from 'framer-motion';

// Usar la misma URL base que en otros componentes
const API_URL = 'http://localhost/ImpulsaTelecom/backend/controlador.php';

// Asegurar que axios use credenciales
axios.defaults.withCredentials = true;

const FichajeWidget = () => {
  const { user } = useAuth();
  const [fichajeActual, setFichajeActual] = useState(null);
  const [estado, setEstado] = useState('pendiente');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [mostrarModalIncidencia, setMostrarModalIncidencia] = useState(false);
  const [incidenciaTexto, setIncidenciaTexto] = useState('');

  // Actualizar el reloj en tiempo real
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  // Formatear tiempo
  const formatTime = (date) => {
    if (!date) return '--:--';
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  // Cargar fichaje actual
  const cargarFichajeActual = async () => {
    if (!user || !user.id) return;

    try {
      setLoading(true);
      const response = await axios.post(`${API_URL}?action=actual`,
        { id_usuario: user.id },
        {
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );

      if (response.data.success && response.data.fichaje) {
        setFichajeActual(response.data.fichaje);
        setEstado(response.data.estado);
      } else {
        setEstado('pendiente');
      }
    } catch (error) {
      console.error('Error al cargar fichaje:', error);
      setError('Error al cargar el fichaje actual.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarFichajeActual();
    // Actualizar cada minuto
    const interval = setInterval(cargarFichajeActual, 60000);
    return () => clearInterval(interval);
  }, [user]);

  // Registrar entrada
  const handleEntrada = async () => {
    if (!user || !user.id) return;
    setLoading(true);
    setError(null);

    try {
      // Obtener la ubicación actual
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            console.log('Coordenadas obtenidas:', latitude, longitude); // Debug
            
            // Obtener fecha y hora actual
            const now = new Date();
            const fecha = now.toISOString().split('T')[0];
            const hora = now.toTimeString().split(' ')[0];
            
            // Convertir coordenadas a números para asegurar que no se envíen como strings
            const latitudNum = parseFloat(latitude);
            const longitudNum = parseFloat(longitude);
            
            // Verificar que las coordenadas sean números válidos
            if (isNaN(latitudNum) || isNaN(longitudNum)) {
              console.error('Coordenadas inválidas:', latitude, longitude);
              setError('No se pudieron obtener coordenadas válidas');
              setLoading(false);
              return;
            }
            
            // Datos para enviar al servidor
            const datos = { 
              id_usuario: user.id,
              fecha: fecha,
              hora: hora,
              latitud: latitudNum,
              longitud: longitudNum
            };
            
            console.log('Datos a enviar:', datos); // Debug
            
            // Registrar entrada con geolocalización
            const response = await axios.post(
              `${API_URL}?action=entrada`,
              datos,
              {
                headers: {
                  'Content-Type': 'application/json',
                }
              }
            );
            
            console.log('Respuesta del servidor:', response.data); // Debug
            
            if (response.data.success) {
              setEstado('trabajando');
              setFichajeActual({ idRegistro: response.data.id_fichaje });
              setError(null);
              // Actualizar la lista de fichajes
              if (typeof onFichajeChange === 'function') {
                onFichajeChange();
              }
            } else {
              setError(response.data.error || 'Error al registrar entrada');
            }
            setLoading(false);
          },
          (error) => {
            console.error('Error al obtener ubicación:', error);
            setError('No se pudo obtener tu ubicación. Por favor, permite el acceso a la ubicación en tu navegador.');
            setLoading(false);
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 } // Mejores opciones para geolocalización
        );
      } else {
        // Si no hay geolocalización, hacer la solicitud sin ubicación
        const now = new Date();
        const fecha = now.toISOString().split('T')[0];
        const hora = now.toTimeString().split(' ')[0];
        
        const response = await axios.post(
          `${API_URL}?action=entrada`,
          { 
            id_usuario: user.id,
            fecha: fecha,
            hora: hora 
          },
          {
            headers: {
              'Content-Type': 'application/json',
            }
          }
        );
        
        if (response.data.success) {
          setEstado('trabajando');
          setFichajeActual({ idRegistro: response.data.id_fichaje });
          setError(null);
        } else {
          setError(response.data.error || 'Error al registrar entrada');
        }
        setLoading(false);
      }
    } catch (err) {
      console.error('Error al registrar entrada:', err);
      setError('Error al registrar entrada');
      setLoading(false);
    }
  };

  // Registrar salida
  const handleSalida = async () => {
    if (!user || !user.id || !fichajeActual) return;
    
    try {
      setLoading(true);
      setError(null);
      const response = await axios.post(
        `${API_URL}?action=salida`,
        { 
          id_usuario: user.id,
          id_fichaje: fichajeActual.idRegistro 
        },
        {
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
      
      if (response.data.success) {
        // Establecer el estado a finalizado y mantener el fichaje actual
        // para poder mostrar el botón de nuevo fichaje
        setEstado('finalizado');
        // Esperar un momento antes de recargar para asegurar que el backend haya procesado el cambio
        setTimeout(() => {
          cargarFichajeActual(); // Recargar para obtener los datos actualizados
        }, 500);
      } else {
        setError(response.data.error || 'Error al registrar salida');
      }
    } catch (err) {
      console.error('Error al registrar salida:', err);
      setError('Error al registrar salida');
    } finally {
      setLoading(false);
    }
  };

  // Iniciar nuevo fichaje después de haber finalizado uno
  const handleNuevoFichaje = async () => {
    if (!user || !user.id) return;
    setLoading(true);
    setError(null);
    
    // Primero establecemos el estado a pendiente
    setEstado('pendiente');
    setFichajeActual(null);

    try {
      // Obtener la ubicación actual
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            console.log('Coordenadas obtenidas para nuevo fichaje:', latitude, longitude); // Debug
            
            // Obtener fecha y hora actual
            const now = new Date();
            const fecha = now.toISOString().split('T')[0];
            const hora = now.toTimeString().split(' ')[0];
            
            // Convertir coordenadas a números para asegurar que no se envíen como strings
            const latitudNum = parseFloat(latitude);
            const longitudNum = parseFloat(longitude);
            
            // Verificar que las coordenadas sean números válidos
            if (isNaN(latitudNum) || isNaN(longitudNum)) {
              console.error('Coordenadas inválidas:', latitude, longitude);
              setError('No se pudieron obtener coordenadas válidas');
              setLoading(false);
              return;
            }
            
            // Datos para enviar al servidor
            const datos = { 
              id_usuario: user.id,
              fecha: fecha,
              hora: hora,
              latitud: latitudNum,
              longitud: longitudNum
            };
            
            console.log('Datos a enviar:', datos); // Debug
            
            // Registrar entrada con geolocalización
            const response = await axios.post(
              `${API_URL}?action=entrada`,
              datos,
              {
                headers: {
                  'Content-Type': 'application/json',
                }
              }
            );
            
            console.log('Respuesta del servidor para nuevo fichaje:', response.data); // Debug
            
            if (response.data.success) {
              setEstado('trabajando');
              setFichajeActual({ idRegistro: response.data.id_fichaje });
              setError(null);
              // Actualizar la lista de fichajes
              if (typeof onFichajeChange === 'function') {
                onFichajeChange();
              }
            } else {
              setError(response.data.error || 'Error al registrar nueva entrada');
            }
            setLoading(false);
          },
          (error) => {
            console.error('Error al obtener ubicación para nuevo fichaje:', error);
            setError('No se pudo obtener tu ubicación. Por favor, permite el acceso a la ubicación en tu navegador.');
            setLoading(false);
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 } // Mejores opciones para geolocalización
        );
      } else {
        // Si no hay geolocalización, hacer la solicitud sin ubicación
        const now = new Date();
        const fecha = now.toISOString().split('T')[0];
        const hora = now.toTimeString().split(' ')[0];
        
        const response = await axios.post(
          `${API_URL}?action=entrada`,
          { 
            id_usuario: user.id,
            fecha: fecha,
            hora: hora 
          },
          {
            headers: {
              'Content-Type': 'application/json',
            }
          }
        );
        
        if (response.data.success) {
          setEstado('trabajando');
          setFichajeActual({ idRegistro: response.data.id_fichaje });
          setError(null);
        } else {
          setError(response.data.error || 'Error al registrar nueva entrada');
        }
        setLoading(false);
      }
    } catch (err) {
      console.error('Error al iniciar nuevo fichaje:', err);
      setError('Error al iniciar nuevo fichaje');
      setLoading(false);
    }
  };

  // Manejar registro de incidencia
  const handleIncidencia = async () => {
    if (!user || !user.id || !fichajeActual || !incidenciaTexto.trim()) return;
    
    try {
      setLoading(true);
      setError(null);
      // Aquí iría la llamada al backend para registrar la incidencia
      // Por ahora simulamos una respuesta exitosa
      setTimeout(() => {
        setMostrarModalIncidencia(false);
        setIncidenciaTexto('');
        // Mostrar mensaje de éxito
        alert('Incidencia registrada correctamente');
      }, 1000);
    } catch (err) {
      console.error('Error al registrar incidencia:', err);
      setError('Error al registrar incidencia');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      className="bg-white rounded-xl shadow-md p-5 border-l-4 border-[#91e302] h-full"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-xl font-semibold text-gray-800 flex items-center">
          <FaRegClock className="mr-2 text-[#91e302]" />
          Control de Fichaje
        </h3>
        <div className="text-lg font-bold text-[#5a8a01]">{formatTime(currentTime)}</div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-[#c3515f] text-sm rounded-lg border border-[#c3515f]/20">
          {error}
        </div>
      )}

      <div className="bg-gray-50 p-4 rounded-lg mb-4 shadow-inner">
        <div className="flex flex-col items-center justify-center mb-3">
          <span className="text-sm text-gray-600 mb-2">Estado Actual</span>
          <div className={`flex items-center px-4 py-2 rounded-full ${estado === 'trabajando' ? 'bg-[#91e302]/20 text-[#5a8a01]' : 
                                                  estado === 'finalizado' ? 'bg-[#cccccc]/30 text-gray-700' : 
                                                  'bg-gray-100 text-gray-700'}`}>
            <span className={`w-3 h-3 rounded-full mr-2 ${estado === 'trabajando' ? 'bg-[#91e302]' : 
                                                  estado === 'finalizado' ? 'bg-[#cccccc]' : 
                                                  'bg-gray-400'}`}></span>
            <span className="font-semibold">
              {estado === 'trabajando' ? 'Trabajando' : 
              estado === 'finalizado' ? 'Finalizado' : 'Pendiente'}
            </span>
          </div>
        </div>

        {estado === 'trabajando' && (
          <div className="text-center mt-3">
            <div className="text-sm text-gray-600 mb-1">Tiempo de trabajo</div>
            <div className="text-2xl font-bold text-[#5a8a01] flex items-center justify-center">
              <FaRegClock className="mr-2 text-[#91e302]" />
              <span>En curso</span>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-center mt-6">
        {estado === 'pendiente' && (
          <div className="flex flex-col space-y-3 w-full">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-gradient-to-r from-[#91e302] to-[#5a8a01] text-white font-medium py-3 px-6 rounded-lg shadow-md flex items-center justify-center w-full transition-all duration-300 hover:shadow-lg"
              onClick={handleEntrada}
              disabled={loading}
            >
              <FaPlay className="mr-2" />
              {loading ? 'Procesando...' : 'Iniciar Jornada'}
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-gradient-to-r from-[#f0ad4e] to-[#ec971f] text-white font-medium py-2 px-4 rounded-lg shadow-md flex items-center justify-center w-full transition-all duration-300 hover:shadow-lg"
              onClick={() => setMostrarModalIncidencia(true)}
              disabled={loading}
            >
              <FaExclamationCircle className="mr-2" />
              Registrar Incidencia
            </motion.button>
          </div>
        )}

        {estado === 'trabajando' && (
          <div className="flex flex-col space-y-3 w-full">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-gradient-to-r from-[#c3515f] to-[#a73848] text-white font-medium py-3 px-6 rounded-lg shadow-md flex items-center justify-center w-full transition-all duration-300 hover:shadow-lg"
              onClick={handleSalida}
              disabled={loading}
            >
              <FaStop className="mr-2" />
              {loading ? 'Procesando...' : 'Finalizar Jornada'}
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-gradient-to-r from-[#f0ad4e] to-[#ec971f] text-white font-medium py-2 px-4 rounded-lg shadow-md flex items-center justify-center w-full transition-all duration-300 hover:shadow-lg"
              onClick={() => setMostrarModalIncidencia(true)}
              disabled={loading}
            >
              <FaExclamationCircle className="mr-2" />
              Registrar Incidencia
            </motion.button>
          </div>
        )}

        {estado === 'finalizado' && (
          <div className="flex flex-col space-y-3 w-full">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-gradient-to-r from-[#91e302] to-[#5a8a01] text-white font-medium py-3 px-6 rounded-lg shadow-md flex items-center justify-center w-full transition-all duration-300 hover:shadow-lg"
              onClick={handleNuevoFichaje}
              disabled={loading}
            >
              <FaPlay className="mr-2" />
              {loading ? 'Procesando...' : 'Nuevo Fichaje'}
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-gradient-to-r from-[#f0ad4e] to-[#ec971f] text-white font-medium py-2 px-4 rounded-lg shadow-md flex items-center justify-center w-full transition-all duration-300 hover:shadow-lg"
              onClick={() => setMostrarModalIncidencia(true)}
              disabled={loading}
            >
              <FaExclamationCircle className="mr-2" />
              Registrar Incidencia
            </motion.button>
          </div>
        )}
      </div>

      <div className="mt-4 text-center">
        <a href="/fichaje" className="text-sm text-[#5a8a01] hover:text-[#91e302] transition-colors duration-200 inline-flex items-center">
          Ver detalles completos
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </a>
      </div>
      
      {/* Modal para registrar incidencia */}
      {mostrarModalIncidencia && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Registrar Incidencia</h3>
            <textarea 
              className="w-full border border-gray-300 rounded-lg p-3 h-32 focus:outline-none focus:ring-2 focus:ring-[#91e302] focus:border-transparent"
              placeholder="Describe la incidencia..."
              value={incidenciaTexto}
              onChange={(e) => setIncidenciaTexto(e.target.value)}
            ></textarea>
            <div className="flex justify-end space-x-3 mt-4">
              <button 
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                onClick={() => setMostrarModalIncidencia(false)}
              >
                Cancelar
              </button>
              <button 
                className="px-4 py-2 bg-[#91e302] text-white rounded-lg hover:bg-[#5a8a01] transition-colors"
                onClick={handleIncidencia}
                disabled={loading || !incidenciaTexto.trim()}
              >
                {loading ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default FichajeWidget;
