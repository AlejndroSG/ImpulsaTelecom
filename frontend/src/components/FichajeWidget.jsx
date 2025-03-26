import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { FaRegClock, FaPlay, FaStop } from 'react-icons/fa';
import { motion } from 'framer-motion';

const API_URL = 'http://localhost/ImpulsaTelecom/backend/controlador.php';

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
        // No llamamos a cargarFichajeActual() para evitar que se sobrescriba el estado
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
      className="bg-white rounded-lg shadow-md p-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center">
          <FaRegClock className="mr-2 text-blue-500" />
          Control de Fichaje
        </h3>
      </div>

      {error && (
        <div className="mb-4 p-2 bg-red-100 text-red-700 text-sm rounded">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-gray-600">Estado:</span>
        <span className={`text-sm font-medium px-2 py-1 rounded-full ${estado === 'trabajando' ? 'bg-green-100 text-green-800' : estado === 'finalizado' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
          {estado === 'trabajando' ? 'Trabajando' : 
           estado === 'finalizado' ? 'Finalizado' : 'Pendiente'}
        </span>
      </div>

      <div className="flex justify-center space-x-2 mt-4">
        {estado === 'pendiente' && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-green-500 hover:bg-green-600 text-white text-sm py-2 px-4 rounded flex items-center justify-center"
            onClick={handleEntrada}
            disabled={loading}
          >
            <FaPlay className="mr-1" />
            {loading ? 'Procesando...' : 'Iniciar'}
          </motion.button>
        )}

        {estado === 'trabajando' && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-red-500 hover:bg-red-600 text-white text-sm py-2 px-4 rounded flex items-center justify-center"
            onClick={handleSalida}
            disabled={loading}
          >
            <FaStop className="mr-1" />
            {loading ? 'Procesando...' : 'Finalizar'}
          </motion.button>
        )}

        {estado === 'finalizado' && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-green-500 hover:bg-green-600 text-white text-sm py-2 px-4 rounded flex items-center justify-center"
            onClick={handleNuevoFichaje}
            disabled={loading}
          >
            <FaPlay className="mr-1" />
            {loading ? 'Procesando...' : 'Nuevo Fichaje'}
          </motion.button>
        )}
      </div>
    </motion.div>
  );
};

export default FichajeWidget;
