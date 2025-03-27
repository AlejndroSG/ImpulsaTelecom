import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { FaRegClock, FaPlay, FaStop } from 'react-icons/fa';
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
        setFichajeActual({ idRegistro: response.data.id_fichaje });
        setError(null);
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
    try {
      setLoading(true);
      setError(null);
      
      // Primero establecemos el estado a pendiente
      setEstado('pendiente');
      setFichajeActual(null);
      
      // Luego registramos una nueva entrada
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
        setFichajeActual({ idRegistro: response.data.id_fichaje });
        setError(null);
      } else {
        setError(response.data.error || 'Error al registrar nueva entrada');
      }
    } catch (err) {
      console.error('Error al iniciar nuevo fichaje:', err);
      setError('Error al iniciar nuevo fichaje');
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
        )}

        {estado === 'trabajando' && (
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
        )}

        {estado === 'finalizado' && (
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
    </motion.div>
  );
};

export default FichajeWidget;
