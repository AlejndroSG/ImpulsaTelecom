import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { FaRegClock, FaPlay, FaStop, FaPauseCircle, FaPlayCircle, FaExclamationCircle, FaPlus, FaHistory } from 'react-icons/fa';
import { motion } from 'framer-motion';

// Usar la misma URL base que en otros componentes
const API_URL = 'http://localhost/ImpulsaTelecom/backend/controlador.php';

// Asegurar que axios use credenciales
axios.defaults.withCredentials = true;

const FichajeWidget = ({ onFichajeChange }) => {
  const { user } = useAuth();
  const { isDarkMode } = useTheme();
  const [fichajeActual, setFichajeActual] = useState(null);
  const [estado, setEstado] = useState('pendiente');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [mostrarModalIncidencia, setMostrarModalIncidencia] = useState(false);
  const [incidenciaTexto, setIncidenciaTexto] = useState('');
  const [historialFichajes, setHistorialFichajes] = useState([]);
  const [mostrarHistorial, setMostrarHistorial] = useState(false);
  
  // Estados para el sistema de pausas
  const [horaPausa, setHoraPausa] = useState(null);
  const [tiempoPausa, setTiempoPausa] = useState(0);
  const [tiempoPausaActual, setTiempoPausaActual] = useState(0);
  const [horasTrabajadas, setHorasTrabajadas] = useState(0);

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
        setEstado(response.data.estado || 'pendiente');
        
        // Configurar tiempos de pausa si existen
        if (response.data.fichaje.tiempoPausa) {
          setTiempoPausa(parseInt(response.data.fichaje.tiempoPausa));
        }
        
        // Configurar estado de pausa actual si existe
        if (response.data.estado === 'pausado' && response.data.fichaje.horaPausa) {
          const pausaTime = new Date();
          const pausaParts = response.data.fichaje.horaPausa.split(':');
          if (pausaParts.length >= 2) {
            pausaTime.setHours(
              parseInt(pausaParts[0]),
              parseInt(pausaParts[1]),
              pausaParts.length > 2 ? parseInt(pausaParts[2] || 0) : 0
            );
          }
          setHoraPausa(pausaTime);
        } else {
          setHoraPausa(null);
        }
      } else {
        setEstado('pendiente');
        setFichajeActual(null);
        setTiempoPausa(0);
        setHoraPausa(null);
      }
    } catch (error) {
      console.error('Error al cargar fichaje:', error);
      setError('Error al cargar el fichaje actual.');
    } finally {
      setLoading(false);
    }
  };

  // Cargar historial de fichajes
  const cargarHistorial = async () => {
    if (!user || !user.id) return;

    try {
      const response = await axios.post(`${API_URL}?action=historial`,
        { id_usuario: user.id },
        {
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );

      if (response.data.success && response.data.fichajes) {
        setHistorialFichajes(response.data.fichajes);
      }
    } catch (error) {
      console.error('Error al cargar historial:', error);
    }
  };

  // Actualizar el reloj y calcular tiempo trabajado
  useEffect(() => {
    const timer = setInterval(() => {
      if (fichajeActual && fichajeActual.hora_entrada) {
        let tiempoTrabajadoMs = 0;
        
        const entrada = new Date(fichajeActual.fecha + 'T' + fichajeActual.hora_entrada);
        
        if (estado === 'pausado' && horaPausa) {
          // Si está en pausa, calcular tiempo hasta el inicio de la pausa
          tiempoTrabajadoMs = horaPausa - entrada - (tiempoPausa * 1000);
          
          // Calcular tiempo de pausa actual en tiempo real
          const tiempoPausaActualMs = new Date() - horaPausa;
          setTiempoPausaActual(Math.floor(tiempoPausaActualMs / 1000));
        } else {
          // Si está trabajando, calcular tiempo hasta ahora menos las pausas acumuladas
          tiempoTrabajadoMs = new Date() - entrada - (tiempoPausa * 1000);
          // Resetear el tiempo de pausa actual si no está en pausa
          setTiempoPausaActual(0);
        }
        
        // Convertir a horas para mostrar
        const tiempoTrabajado = tiempoTrabajadoMs / (1000 * 60 * 60);
        setHorasTrabajadas(tiempoTrabajado > 0 ? tiempoTrabajado : 0);
      }
    }, 1000);
    
    return () => clearInterval(timer);
  }, [fichajeActual, estado, horaPausa, tiempoPausa]);

  useEffect(() => {
    cargarFichajeActual();
    // Actualizar cada minuto
    const interval = setInterval(cargarFichajeActual, 60000);
    return () => clearInterval(interval);
  }, [user]);

  // Registrar entrada
  const handleEntrada = async () => {
    if (!user || !user.id) return;

    try {
      setLoading(true);
      setError(null);
      const response = await axios.post(
        `${API_URL}?action=entrada`,
        { id_usuario: user.id },
        {
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );

      if (response.data.success) {
        setEstado('trabajando');
        // Notificar al componente padre
        if (onFichajeChange) onFichajeChange();
        // Recargar para obtener los datos actualizados
        cargarFichajeActual();
      } else {
        setError(response.data.error || 'Error al registrar entrada');
      }
    } catch (err) {
      console.error('Error al registrar entrada:', err);
      setError('Error al registrar entrada');
    } finally {
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
        setEstado('finalizado');
        // Notificar al componente padre
        if (onFichajeChange) onFichajeChange();
        // Recargar para obtener los datos actualizados
        cargarFichajeActual();
        // Cargar historial para mostrar el nuevo registro
        cargarHistorial();
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

  // Registrar pausa
  const handlePausa = async () => {
    if (!user || !user.id || !fichajeActual) return;
    
    try {
      setLoading(true);
      setError(null);
      const response = await axios.post(
        `${API_URL}?action=pausa`,
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
        setHoraPausa(new Date());
        setEstado('pausado');
        // Notificar al componente padre
        if (onFichajeChange) onFichajeChange();
        // Recargar el fichaje actual para obtener los datos actualizados
        cargarFichajeActual();
      } else {
        setError(response.data.error || 'Error al registrar pausa');
      }
    } catch (err) {
      console.error('Error al registrar pausa:', err);
      setError('Error al registrar pausa');
    } finally {
      setLoading(false);
    }
  };

  // Reanudar trabajo
  const handleReanudar = async () => {
    if (!user || !user.id || !fichajeActual) return;
    
    try {
      setLoading(true);
      setError(null);
      const response = await axios.post(
        `${API_URL}?action=reanudar`,
        { 
          id_usuario: user.id,
          id_fichaje: fichajeActual.idRegistro,
          tiempo_pausa: tiempoPausaActual
        },
        {
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
      
      if (response.data.success) {
        // Actualizar el tiempo de pausa acumulado
        if (response.data.tiempoPausa) {
          setTiempoPausa(parseInt(response.data.tiempoPausa));
        } else {
          setTiempoPausa(tiempoPausa + tiempoPausaActual);
        }
        setHoraPausa(null);
        setTiempoPausaActual(0);
        setEstado('trabajando');
        // Notificar al componente padre
        if (onFichajeChange) onFichajeChange();
        // Recargar el fichaje actual para obtener los datos actualizados
        cargarFichajeActual();
      } else {
        setError(response.data.error || 'Error al reanudar trabajo');
      }
    } catch (err) {
      console.error('Error al reanudar trabajo:', err);
      setError('Error al reanudar trabajo');
    } finally {
      setLoading(false);
    }
  };

  // Registrar incidencia
  const handleIncidencia = async () => {
    if (!user || !user.id || !fichajeActual || !incidenciaTexto.trim()) {
      setError('Por favor, introduce una descripción de la incidencia');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await axios.post(
        `${API_URL}?action=incidencia`,
        { 
          id_usuario: user.id,
          id_fichaje: fichajeActual.idRegistro,
          descripcion: incidenciaTexto 
        },
        {
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );

      if (response.data.success) {
        setMostrarModalIncidencia(false);
        setIncidenciaTexto('');
        // Notificar al componente padre
        if (onFichajeChange) onFichajeChange();
      } else {
        setError(response.data.error || 'Error al registrar incidencia');
      }
    } catch (err) {
      console.error('Error al registrar incidencia:', err);
      setError('Error al registrar incidencia');
    } finally {
      setLoading(false);
    }
  };

  // Iniciar nuevo fichaje después de finalizar uno
  const handleNuevoFichaje = async () => {
    if (!user || !user.id) return;

    try {
      setLoading(true);
      setError(null);
      const response = await axios.post(
        `${API_URL}?action=entrada`,
        { id_usuario: user.id },
        {
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );

      if (response.data.success) {
        setEstado('trabajando');
        // Reiniciar estados
        setTiempoPausa(0);
        setTiempoPausaActual(0);
        setHoraPausa(null);
        // Notificar al componente padre
        if (onFichajeChange) onFichajeChange();
        // Recargar para obtener los datos actualizados
        cargarFichajeActual();
      } else {
        setError(response.data.error || 'Error al iniciar nuevo fichaje');
      }
    } catch (err) {
      console.error('Error al iniciar nuevo fichaje:', err);
      setError('Error al iniciar nuevo fichaje');
    } finally {
      setLoading(false);
    }
  };

  // Obtener el tiempo transcurrido en formato legible
  const getTiempoTranscurrido = () => {
    if (!fichajeActual || !fichajeActual.hora_entrada) return 'No disponible';
    
    const entrada = new Date(fichajeActual.fecha + 'T' + fichajeActual.hora_entrada);
    const ahora = new Date();
    const diff = Math.floor((ahora - entrada) / 1000); // diferencia en segundos
    
    const horas = Math.floor(diff / 3600);
    const minutos = Math.floor((diff % 3600) / 60);
    const segundos = diff % 60;
    
    return `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}:${segundos.toString().padStart(2, '0')}`;
  };

  // Mostrar historial
  const toggleHistorial = () => {
    if (!mostrarHistorial) {
      cargarHistorial();
    }
    setMostrarHistorial(!mostrarHistorial);
  };

  // Renderizar botones según el estado
  const renderBotones = () => {
    if (loading) {
      return (
        <div className="flex justify-center">
          <div className={`animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 ${isDarkMode ? 'border-[#a5ff0d]' : 'border-[#91e302]'}`}></div>
        </div>
      );
    }

    if (estado === 'pendiente') {
      return (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleEntrada}
          className={`w-full py-3 px-4 rounded-lg flex items-center justify-center font-medium ${isDarkMode ? 'bg-[#a5ff0d] text-gray-900 hover:bg-[#b9ff4d]' : 'bg-[#91e302] text-white hover:bg-[#7bc700]'} transition-colors duration-300`}
        >
          <FaPlay className="mr-2" />
          Registrar Entrada
        </motion.button>
      );
    }

    if (estado === 'trabajando') {
      return (
        <div className="grid grid-cols-2 gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSalida}
            className={`py-3 px-4 rounded-lg flex items-center justify-center font-medium ${isDarkMode ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-red-500 text-white hover:bg-red-600'} transition-colors duration-300`}
          >
            <FaStop className="mr-2" />
            Salida
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setMostrarModalIncidencia(true)}
            className={`py-3 px-4 rounded-lg flex items-center justify-center font-medium ${isDarkMode ? 'bg-yellow-600 text-white hover:bg-yellow-700' : 'bg-yellow-500 text-white hover:bg-yellow-600'} transition-colors duration-300`}
          >
            <FaExclamationCircle className="mr-2" />
            Incidencia
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handlePausa}
            className={`py-3 px-4 rounded-lg flex items-center justify-center font-medium ${isDarkMode ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-blue-500 text-white hover:bg-blue-600'} transition-colors duration-300`}
          >
            <FaPauseCircle className="mr-2" />
            Pausa
          </motion.button>
          {horaPausa && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleReanudar}
              className={`py-3 px-4 rounded-lg flex items-center justify-center font-medium ${isDarkMode ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-green-500 text-white hover:bg-green-600'} transition-colors duration-300`}
            >
              <FaPlayCircle className="mr-2" />
              Reanudar
            </motion.button>
          )}
        </div>
      );
    }

    if (estado === 'pausado') {
      return (
        <div className="grid grid-cols-2 gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleReanudar}
            className={`py-3 px-4 rounded-lg flex items-center justify-center font-medium ${isDarkMode ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-green-500 text-white hover:bg-green-600'} transition-colors duration-300`}
          >
            <FaPlayCircle className="mr-2" />
            Reanudar
          </motion.button>
        </div>
      );
    }

    if (estado === 'finalizado') {
      return (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleNuevoFichaje}
          className={`w-full py-3 px-4 rounded-lg flex items-center justify-center font-medium ${isDarkMode ? 'bg-[#a5ff0d] text-gray-900 hover:bg-[#b9ff4d]' : 'bg-[#91e302] text-white hover:bg-[#7bc700]'} transition-colors duration-300`}
        >
          <FaPlus className="mr-2" />
          Nuevo Fichaje
        </motion.button>
      );
    }

    return null;
  };

  // Renderizar el estado del fichaje
  const renderEstado = () => {
    let estadoClase = '';
    let estadoTexto = '';
    let estadoIcono = null;

    switch (estado) {
      case 'pendiente':
        estadoClase = isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700';
        estadoTexto = 'Pendiente';
        estadoIcono = <FaRegClock className="mr-2" />;
        break;
      case 'trabajando':
        estadoClase = isDarkMode ? 'bg-green-800 text-green-100' : 'bg-green-100 text-green-800';
        estadoTexto = 'Trabajando';
        estadoIcono = <FaPlay className="mr-2" />;
        break;
      case 'pausado':
        estadoClase = isDarkMode ? 'bg-blue-800 text-blue-100' : 'bg-blue-100 text-blue-800';
        estadoTexto = 'Pausado';
        estadoIcono = <FaPauseCircle className="mr-2" />;
        break;
      case 'finalizado':
        estadoClase = isDarkMode ? 'bg-blue-800 text-blue-100' : 'bg-blue-100 text-blue-800';
        estadoTexto = 'Finalizado';
        estadoIcono = <FaStop className="mr-2" />;
        break;
      default:
        estadoClase = isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700';
        estadoTexto = 'Desconocido';
        estadoIcono = <FaRegClock className="mr-2" />;
    }

    return (
      <div className={`px-3 py-1 rounded-full flex items-center justify-center text-sm font-medium ${estadoClase}`}>
        {estadoIcono}
        {estadoTexto}
      </div>
    );
  };

  // Renderizar el modal de incidencia
  const renderModalIncidencia = () => {
    if (!mostrarModalIncidencia) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
        <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} w-full max-w-md rounded-lg shadow-xl p-6 border transition-colors duration-300`}>
          <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>Registrar Incidencia</h3>
          <textarea
            value={incidenciaTexto}
            onChange={(e) => setIncidenciaTexto(e.target.value)}
            placeholder="Describe la incidencia..."
            className={`w-full p-3 rounded-lg border ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400' : 'bg-white border-gray-300 text-gray-800 placeholder-gray-500'} focus:outline-none focus:ring-2 ${isDarkMode ? 'focus:ring-indigo-500' : 'focus:ring-[#91e302]'} mb-4 transition-colors duration-300`}
            rows={4}
          />
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => {
                setMostrarModalIncidencia(false);
                setIncidenciaTexto('');
              }}
              className={`px-4 py-2 rounded-lg ${isDarkMode ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'} transition-colors duration-300`}
            >
              Cancelar
            </button>
            <button
              onClick={handleIncidencia}
              disabled={!incidenciaTexto.trim() || loading}
              className={`px-4 py-2 rounded-lg ${isDarkMode ? 'bg-[#a5ff0d] text-gray-900 hover:bg-[#b9ff4d]' : 'bg-[#91e302] text-white hover:bg-[#7bc700]'} transition-colors duration-300 ${(!incidenciaTexto.trim() || loading) ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loading ? 'Enviando...' : 'Enviar'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Renderizar historial de fichajes
  const renderHistorial = () => {
    if (!mostrarHistorial) return null;

    return (
      <div className={`mt-4 p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} transition-colors duration-300`}>
        <h4 className={`text-sm font-semibold mb-3 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Historial de Fichajes</h4>
        
        {historialFichajes.length === 0 ? (
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>No hay registros disponibles</p>
        ) : (
          <div className="max-h-48 overflow-y-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  <th className="text-left py-2">Fecha</th>
                  <th className="text-left py-2">Entrada</th>
                  <th className="text-left py-2">Salida</th>
                  <th className="text-left py-2">Total</th>
                </tr>
              </thead>
              <tbody>
                {historialFichajes.map((fichaje, index) => (
                  <tr key={index} className={`${isDarkMode ? 'text-gray-200 border-gray-600' : 'text-gray-800 border-gray-200'} border-t`}>
                    <td className="py-2">{fichaje.fecha}</td>
                    <td className="py-2">{fichaje.hora_entrada || '--:--'}</td>
                    <td className="py-2">{fichaje.hora_salida || '--:--'}</td>
                    <td className="py-2 font-medium">{fichaje.total_horas || '--:--'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        <button
          onClick={() => setMostrarHistorial(false)}
          className={`mt-3 px-3 py-1 text-xs rounded ${isDarkMode ? 'bg-gray-600 text-gray-200 hover:bg-gray-500' : 'bg-gray-300 text-gray-700 hover:bg-gray-400'} transition-colors duration-300`}
        >
          Cerrar Historial
        </button>
      </div>
    );
  };

  return (
    <div className={`rounded-lg shadow-md overflow-hidden ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white'} transition-colors duration-300`}>
      {/* Cabecera del widget */}
      <div className={`px-4 py-3 flex justify-between items-center ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} border-b ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
        <div className="flex items-center">
          <FaRegClock className={`mr-2 ${isDarkMode ? 'text-[#a5ff0d]' : 'text-[#91e302]'}`} />
          <h3 className="font-semibold">Control de Fichaje</h3>
        </div>
        <div className="flex items-center">
          <button 
            onClick={() => setMostrarHistorial(!mostrarHistorial)}
            className={`p-1 rounded-md ${isDarkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'} transition-colors duration-200`}
            title="Ver historial"
          >
            <FaHistory className={isDarkMode ? 'text-gray-300' : 'text-gray-500'} />
          </button>
        </div>
      </div>

      {/* Cuerpo del widget */}
      <div className="p-4">
        {error && (
          <div className={`mb-4 p-3 rounded-md ${isDarkMode ? 'bg-red-900/30 text-red-200' : 'bg-red-100 text-red-700'}`}>
            {error}
          </div>
        )}

        {/* Reloj en tiempo real */}
        <div className="text-center mb-4">
          <div className={`text-3xl font-bold ${isDarkMode ? 'text-[#a5ff0d]' : 'text-[#91e302]'}`}>
            {formatTime(currentTime)}
          </div>
          <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {currentTime.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>

        {/* Estado actual */}
        <div className="flex justify-center mb-4">
          {renderEstado()}
        </div>

        {/* Información del fichaje actual */}
        {(estado === 'trabajando' || estado === 'pausado' || estado === 'finalizado') && fichajeActual && (
          <div className={`mb-4 p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} transition-colors duration-300`}>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Fecha:</div>
              <div className={isDarkMode ? 'text-gray-200' : 'text-gray-800'}>{fichajeActual.fecha || 'N/A'}</div>
              
              <div className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Hora entrada:</div>
              <div className={isDarkMode ? 'text-gray-200' : 'text-gray-800'}>{fichajeActual.hora_entrada || 'N/A'}</div>
              
              {estado === 'finalizado' && (
                <>
                  <div className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Hora salida:</div>
                  <div className={isDarkMode ? 'text-gray-200' : 'text-gray-800'}>{fichajeActual.hora_salida || 'N/A'}</div>
                  
                  <div className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Total horas:</div>
                  <div className={isDarkMode ? 'text-gray-200 font-semibold' : 'text-gray-800 font-semibold'}>{fichajeActual.total_horas || 'N/A'}</div>
                </>
              )}
              
              {(estado === 'trabajando' || estado === 'pausado') && (
                <>
                  <div className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Tiempo trabajado:</div>
                  <div className={isDarkMode ? 'text-gray-200 font-semibold' : 'text-gray-800 font-semibold'}>
                    {Math.floor(horasTrabajadas)}h {Math.floor((horasTrabajadas % 1) * 60)}m {Math.floor(((horasTrabajadas % 1) * 60 % 1) * 60)}s
                  </div>
                  
                  {(tiempoPausa > 0 || (estado === 'pausado' && tiempoPausaActual > 0)) && (
                    <>
                      <div className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Tiempo en pausa:</div>
                      <div className={isDarkMode ? 'text-gray-200 font-semibold' : 'text-gray-800 font-semibold'}>
                        {estado === 'pausado' ? (
                          // Mostrar tiempo de pausa acumulado + tiempo de pausa actual
                          <>
                            {Math.floor((tiempoPausa + tiempoPausaActual) / 3600)}h {Math.floor(((tiempoPausa + tiempoPausaActual) % 3600) / 60)}m {Math.floor((tiempoPausa + tiempoPausaActual) % 60)}s
                          </>
                        ) : (
                          // Mostrar solo tiempo de pausa acumulado
                          <>
                            {Math.floor(tiempoPausa / 3600)}h {Math.floor((tiempoPausa % 3600) / 60)}m {Math.floor(tiempoPausa % 60)}s
                          </>
                        )}
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Botones de acción */}
        <div className="mb-4">
          {renderBotones()}
        </div>

        {/* Historial de fichajes */}
        {mostrarHistorial && (
          <div className={`mt-4 p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} transition-colors duration-300`}>
            <h4 className="font-semibold mb-2">Historial de Fichajes</h4>
            {historialFichajes.length > 0 ? (
              <div className="overflow-x-auto">
                <table className={`w-full text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  <thead>
                    <tr className={isDarkMode ? 'border-b border-gray-600' : 'border-b border-gray-300'}>
                      <th className="py-2 text-left">Fecha</th>
                      <th className="py-2 text-left">Entrada</th>
                      <th className="py-2 text-left">Salida</th>
                      <th className="py-2 text-left">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historialFichajes.map((fichaje, index) => (
                      <tr 
                        key={index} 
                        className={`${isDarkMode ? 'border-b border-gray-600 hover:bg-gray-600/30' : 'border-b border-gray-200 hover:bg-gray-50'} transition-colors duration-150`}
                      >
                        <td className="py-2">{fichaje.fecha}</td>
                        <td className="py-2">{fichaje.hora_entrada}</td>
                        <td className="py-2">{fichaje.hora_salida || '--:--'}</td>
                        <td className="py-2">{fichaje.total_horas || '--'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className={`text-center py-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>No hay registros disponibles</p>
            )}
          </div>
        )}
      </div>

      {/* Modal de incidencia */}
      {mostrarModalIncidencia && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`rounded-lg shadow-xl p-6 max-w-md w-full mx-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <h3 className="text-lg font-semibold mb-4">Registrar Incidencia</h3>
            <textarea
              value={incidenciaTexto}
              onChange={(e) => setIncidenciaTexto(e.target.value)}
              className={`w-full p-3 rounded-md mb-4 ${isDarkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-800 border-gray-300'} border`}
              rows="4"
              placeholder="Describe la incidencia..."
            ></textarea>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setMostrarModalIncidencia(false)}
                className={`px-4 py-2 rounded-md ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} transition-colors duration-200`}
              >
                Cancelar
              </button>
              <button
                onClick={handleIncidencia}
                className={`px-4 py-2 rounded-md ${isDarkMode ? 'bg-[#a5ff0d] text-gray-900 hover:bg-[#b9ff4d]' : 'bg-[#91e302] text-white hover:bg-[#7bc700]'} transition-colors duration-200`}
                disabled={loading}
              >
                {loading ? 'Enviando...' : 'Registrar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FichajeWidget;
