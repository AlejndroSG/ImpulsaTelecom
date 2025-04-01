import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { FaPlay, FaStop, FaPauseCircle, FaPlayCircle, FaExclamationCircle } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

// Usar la misma URL base que en otros componentes
const API_URL = 'http://localhost/ImpulsaTelecom/backend/controlador.php';

// Asegurar que axios use credenciales
axios.defaults.withCredentials = true;

const FichajeWidget = ({ onFichajeChange }) => {
  const { user } = useAuth();
  const { isDarkMode } = useTheme();
  const [fichajeActual, setFichajeActual] = useState(null);
  const [estado, setEstado] = useState('pendiente');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hora, setHora] = useState('');
  const [mostrarModalIncidencia, setMostrarModalIncidencia] = useState(false);
  const [incidenciaTexto, setIncidenciaTexto] = useState('');
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState(null);
  
  // Actualizar el reloj en tiempo real
  useEffect(() => {
    const timer = setInterval(() => {
      setHora(new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

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
      } else {
        setEstado('pendiente');
        setFichajeActual(null);
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

  // Obtener coordenadas de geolocalizaciu00f3n
  const obtenerCoordenadas = () => {
    return new Promise((resolve, reject) => {
      setGeoLoading(true);
      setGeoError(null);
      
      if (!navigator.geolocation) {
        setGeoError('La geolocalizaciu00f3n no estu00e1 soportada por este navegador.');
        setGeoLoading(false);
        reject(new Error('Geolocalizaciu00f3n no soportada'));
        return;
      }
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setGeoLoading(false);
          resolve({
            latitud: position.coords.latitude,
            longitud: position.coords.longitude
          });
        },
        (error) => {
          setGeoLoading(false);
          let errorMsg = 'Error desconocido al obtener la ubicaciu00f3n.';
          
          switch(error.code) {
            case error.PERMISSION_DENIED:
              errorMsg = 'Usuario denegu00f3 la solicitud de geolocalizaciu00f3n.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMsg = 'La informaciu00f3n de ubicaciu00f3n no estu00e1 disponible.';
              break;
            case error.TIMEOUT:
              errorMsg = 'La solicitud de ubicaciu00f3n expiru00f3.';
              break;
          }
          
          setGeoError(errorMsg);
          console.error('Error de geolocalizaciu00f3n:', errorMsg);
          reject(new Error(errorMsg));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    });
  };

  // Registrar entrada
  const handleEntrada = async () => {
    if (!user || !user.id) return;

    try {
      setLoading(true);
      setError(null);
      
      // Obtener coordenadas de geolocalizaciu00f3n
      let coordenadas = {};
      try {
        coordenadas = await obtenerCoordenadas();
        console.log('Coordenadas obtenidas para entrada:', coordenadas);
      } catch (geoErr) {
        console.warn('No se pudieron obtener las coordenadas:', geoErr.message);
        // Continuamos sin coordenadas
      }
      
      const response = await axios.post(
        `${API_URL}?action=entrada`,
        { 
          id_usuario: user.id,
          latitud: coordenadas.latitud,
          longitud: coordenadas.longitud
        },
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
      
      // Obtener coordenadas de geolocalizaciu00f3n
      let coordenadas = {};
      try {
        coordenadas = await obtenerCoordenadas();
        console.log('Coordenadas obtenidas para salida:', coordenadas);
      } catch (geoErr) {
        console.warn('No se pudieron obtener las coordenadas:', geoErr.message);
        // Continuamos sin coordenadas
      }
      
      const response = await axios.post(
        `${API_URL}?action=salida`,
        { 
          id_usuario: user.id,
          id_fichaje: fichajeActual.idRegistro,
          latitud: coordenadas.latitud,
          longitud: coordenadas.longitud
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
          id_fichaje: fichajeActual.idRegistro
        },
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
    if (!user || !user.id || !incidenciaTexto.trim()) {
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
          id_fichaje: fichajeActual?.idRegistro,
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

  // Renderizar botones según el estado
  const renderBotones = () => {
    if (loading) {
      return (
        <div className="flex justify-center">
          <div className={`animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 ${isDarkMode ? 'border-[#a5ff0d]' : 'border-[#91e302]'}`}></div>
        </div>
      );
    }

    // Botón de incidencia siempre visible
    const incidenciaButton = (
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setMostrarModalIncidencia(true)}
        className={`py-3 px-4 rounded-lg flex items-center justify-center font-medium w-full ${isDarkMode ? 'bg-yellow-600 text-white hover:bg-yellow-700' : 'bg-yellow-500 text-white hover:bg-yellow-600'} transition-colors duration-300`}
      >
        <FaExclamationCircle className="mr-2" />
        Incidencia
      </motion.button>
    );

    if (estado === 'pendiente') {
      return (
        <div className="grid grid-cols-2 gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleEntrada}
            className={`py-3 px-4 rounded-lg flex items-center justify-center font-medium ${isDarkMode ? 'bg-[#a5ff0d] text-gray-900 hover:bg-[#b9ff4d]' : 'bg-[#91e302] text-white hover:bg-[#7bc700]'} transition-colors duration-300`}
          >
            <FaPlay className="mr-2" />
            Registrar Entrada
          </motion.button>
          {incidenciaButton}
        </div>
      );
    }

    if (estado === 'trabajando') {
      // Verificar si el usuario tiene permitidas las pausas
      const mostrarBotonPausa = user?.permitir_pausas !== false;
      
      return (
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSalida}
              className={`py-3 px-4 rounded-lg flex items-center justify-center font-medium ${isDarkMode ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-red-500 text-white hover:bg-red-600'} transition-colors duration-300`}
            >
              <FaStop className="mr-2" />
              Finalizar
            </motion.button>
            {mostrarBotonPausa && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handlePausa}
                className={`py-3 px-4 rounded-lg flex items-center justify-center font-medium ${isDarkMode ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-blue-500 text-white hover:bg-blue-600'} transition-colors duration-300`}
              >
                <FaPauseCircle className="mr-2" />
                Pausar
              </motion.button>
            )}
          </div>
          
          {/* El botón de incidencias siempre ocupa el ancho completo */}
          <div className="w-full">
            {incidenciaButton}
          </div>
        </div>
      );
    }

    if (estado === 'pausado') {
      return (
        <div className="flex flex-col gap-3">
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
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSalida}
              className={`py-3 px-4 rounded-lg flex items-center justify-center font-medium ${isDarkMode ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-red-500 text-white hover:bg-red-600'} transition-colors duration-300`}
            >
              <FaStop className="mr-2" />
              Finalizar
            </motion.button>
          </div>
          <div className="w-full">
            {incidenciaButton}
          </div>
        </div>
      );
    }

    if (estado === 'finalizado') {
      return (
        <div className="grid grid-cols-2 gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleEntrada}
            className={`py-3 px-4 rounded-lg flex items-center justify-center font-medium ${isDarkMode ? 'bg-[#a5ff0d] text-gray-900 hover:bg-[#b9ff4d]' : 'bg-[#91e302] text-white hover:bg-[#7bc700]'} transition-colors duration-300`}
          >
            <FaPlay className="mr-2" />
            Nuevo Fichaje
          </motion.button>
          {incidenciaButton}
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 gap-3">
        {incidenciaButton}
      </div>
    );
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
        estadoIcono = <FaPlay className="mr-2" />;
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
        estadoIcono = <FaPlay className="mr-2" />;
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

  return (
    <div className={`rounded-lg shadow-md overflow-hidden ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white'} transition-colors duration-300`}>
      {/* Cabecera del widget */}
      <div className={`px-4 py-3 flex justify-between items-center ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} border-b ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
        <div className="flex items-center">
          <FaPlay className={`mr-2 ${isDarkMode ? 'text-[#a5ff0d]' : 'text-[#91e302]'}`} />
          <h3 className="font-semibold">Control de Fichaje</h3>
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
            {hora}
          </div>
        </div>

        {/* Estado actual */}
        <div className="flex justify-center mb-4">
          {renderEstado()}
        </div>

        {/* Botones de acción */}
        <div className="mb-4">
          {renderBotones()}
        </div>
      </div>

      {/* Modal de incidencia */}
      {renderModalIncidencia()}
    </div>
  );
};

export default FichajeWidget;
