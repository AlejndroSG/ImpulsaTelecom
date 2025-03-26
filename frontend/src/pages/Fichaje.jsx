import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FaRegClock, FaHistory, FaRegChartBar } from 'react-icons/fa';
import { motion } from 'framer-motion';

const API_URL = 'http://localhost/ImpulsaTelecom/backend/controlador.php';

// Configuración de axios para incluir credenciales y mejorar el manejo de la sesión
axios.defaults.withCredentials = true;

const Fichaje = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  // Estados para manejar el fichaje
  const [fichajeActual, setFichajeActual] = useState(null);
  const [estado, setEstado] = useState('');
  const [entrada, setEntrada] = useState(null);
  const [salida, setSalida] = useState(null);
  const [tiempoTotal, setTiempoTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('fichaje');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [horasTrabajadas, setHorasTrabajadas] = useState(0);
  const [registros, setRegistros] = useState([]);
  const [mostrarTabla, setMostrarTabla] = useState(false);
  const [loadingHistorial, setLoadingHistorial] = useState(false);

  // Cargar fichaje actual
  const cargarFichajeActual = async () => {
    if (user && user.id) {
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

        console.log(response.data);
        
        if (response.data.success && response.data.fichaje) {
          setFichajeActual(response.data.fichaje);
          setEstado(response.data.estado || 'pendiente');
          
          // Si el fichaje está finalizado, mostramos la tabla y limpiamos los campos
          if (response.data.estado === 'finalizado') {
            setMostrarTabla(true);
            setEntrada(null);
            setSalida(null);
            setTiempoTotal(0);
            
            // Cargar registros del usuario
            const registrosResponse = await axios.post(`${API_URL}?action=historial`,
              { id_usuario: user.id },
              {
                headers: {
                  'Content-Type': 'application/json',
                }
              }
            );
            if (registrosResponse.data.success) {
              setRegistros(registrosResponse.data.registros);
            }
          } else {
            setMostrarTabla(false);
            
            // Configurar tiempos
            if (response.data.fichaje.horaInicio) {
              const horaEntrada = new Date();
              const horaEntraParts = response.data.fichaje.horaInicio.split(':');
              if (horaEntraParts.length >= 2) {
                horaEntrada.setHours(
                  parseInt(horaEntraParts[0]),
                  parseInt(horaEntraParts[1]),
                  horaEntraParts.length > 2 ? parseInt(horaEntraParts[2] || 0) : 0
                );
              }
              setEntrada(horaEntrada);
              
              if (response.data.fichaje.horaFin) {
                const horaSalida = new Date();
                const horaSalidaParts = response.data.fichaje.horaFin.split(':');
                if (horaSalidaParts.length >= 2) {
                  horaSalida.setHours(
                    parseInt(horaSalidaParts[0]),
                    parseInt(horaSalidaParts[1]),
                    horaSalidaParts.length > 2 ? parseInt(horaSalidaParts[2] || 0) : 0
                  );
                }
                setSalida(horaSalida);
                
                // Calcular tiempo total
                const tiempoTotal = horaSalida - horaEntrada;
                setTiempoTotal(tiempoTotal);
              }
            }
          }
        } else {
          setEstado('pendiente');
          setFichajeActual(null);
          setEntrada(null);
          setSalida(null);
        }
      } catch (error) {
        console.error('Error al cargar fichaje:', error);
        setError('Error al cargar el fichaje actual.');
        setEstado('pendiente');
      } finally {
        setLoading(false);
      }
    }
  };

  // Cargar historial de fichajes
  const cargarHistorial = async () => {
    if (!user || !user.id) return;
    
    try {
      setLoadingHistorial(true);
      const response = await axios.post(`${API_URL}?action=historial`,
        { id_usuario: user.id },
        {
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
      
      if (response.data.success && response.data.registros) {
        setRegistros(response.data.registros);
      } else {
        setRegistros([]);
      }
    } catch (error) {
      console.error('Error al cargar historial:', error);
      setError('Error al cargar el historial de fichajes.');
    } finally {
      setLoadingHistorial(false);
    }
  };

  useEffect(() => {
    if (user && user.id) {
      cargarFichajeActual();
      cargarHistorial();
    }
  }, [user]);

  // Actualizar el reloj y calcular tiempo trabajado
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      if (entrada && !salida) {
        const tiempoTrabajado = (new Date() - entrada) / (1000 * 60 * 60);
        setHorasTrabajadas(tiempoTrabajado);
      }
    }, 1000);
    
    return () => clearInterval(timer);
  }, [entrada, salida]);

  const formatTime = (date) => {
    if (!date) return '--:--';
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Registrar entrada
  const handleEntrada = async () => {
    if (!user || !user.id) return;
    
    try {
      setLoading(true);
      setError(null); // Limpiar errores anteriores
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
        setEntrada(new Date());
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
      setError(null); // Limpiar errores anteriores
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
        setSalida(new Date());
        setEstado('finalizado');
        cargarFichajeActual(); // Recargar para obtener los datos actualizados
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

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-center text-gray-800">Control de Fichajes</h1>
      
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
          <p>{error}</p>
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-8">
        <div className="flex border-b">
          <button 
            className={`flex-1 py-4 px-6 text-center font-medium ${activeTab === 'fichaje' ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
            onClick={() => setActiveTab('fichaje')}
          >
            <FaRegClock className="inline mr-2" /> Fichaje Actual
          </button>
          <button 
            className={`flex-1 py-4 px-6 text-center font-medium ${activeTab === 'historial' ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
            onClick={() => {
              setActiveTab('historial');
              cargarHistorial(); // Recargar historial al cambiar de pestaña
            }}
          >
            <FaHistory className="inline mr-2" /> Historial
          </button>
        </div>
        
        {activeTab === 'fichaje' && (
          <div className="p-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">{formatDate(currentTime)}</h2>
              <p className="text-4xl font-bold text-blue-500 mt-2">{formatTime(currentTime)}</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <h3 className="text-lg font-medium text-gray-600">Entrada</h3>
                <p className="text-2xl font-bold text-gray-800 mt-2">{entrada ? formatTime(entrada) : '--:--'}</p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <h3 className="text-lg font-medium text-gray-600">Estado</h3>
                <p className={`text-2xl font-bold mt-2 ${estado === 'trabajando' ? 'text-green-500' : estado === 'finalizado' ? 'text-blue-500' : 'text-gray-500'}`}>
                  {estado === 'trabajando' ? 'Trabajando' : 
                   estado === 'finalizado' ? 'Finalizado' : 'Pendiente'}
                </p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <h3 className="text-lg font-medium text-gray-600">Salida</h3>
                <p className="text-2xl font-bold text-gray-800 mt-2">{salida ? formatTime(salida) : '--:--'}</p>
              </div>
            </div>
            
            {estado === 'trabajando' && (
              <div className="bg-blue-50 p-4 rounded-lg mb-6">
                <h3 className="text-lg font-medium text-blue-700 mb-2">Tiempo trabajado</h3>
                <p className="text-3xl font-bold text-blue-800">
                  {Math.floor(horasTrabajadas)}h {Math.floor((horasTrabajadas % 1) * 60)}m
                </p>
              </div>
            )}
            
            <div className="flex justify-center space-x-4">
              {estado === 'pendiente' && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg shadow-lg flex items-center"
                  onClick={handleEntrada}
                  disabled={loading}
                >
                  <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                  </svg>
                  Registrar Entrada
                </motion.button>
              )}
              
              {estado === 'trabajando' && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-6 rounded-lg shadow-lg flex items-center"
                  onClick={handleSalida}
                  disabled={loading}
                >
                  <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
                  </svg>
                  Finalizar Jornada
                </motion.button>
              )}
            </div>
          </div>
        )}
        
        {activeTab === 'historial' && (
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Historial de Fichajes</h2>
            
            {registros.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white">
                  <thead>
                    <tr className="bg-gray-100 text-gray-600 uppercase text-sm leading-normal">
                      <th className="py-3 px-6 text-left">Fecha</th>
                      <th className="py-3 px-6 text-left">Entrada</th>
                      <th className="py-3 px-6 text-left">Salida</th>
                      <th className="py-3 px-6 text-left">Tiempo Total</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-600 text-sm">
                    {registros.map((registro, index) => {
                      // Calcular tiempo total
                      let tiempoTotal = '--';
                      if (registro.horaInicio && registro.horaFin) {
                        const entrada = new Date(`2000-01-01T${registro.horaInicio}`);
                        const salida = new Date(`2000-01-01T${registro.horaFin}`);
                        const diff = (salida - entrada) / (1000 * 60 * 60);
                        tiempoTotal = `${Math.floor(diff)}h ${Math.floor((diff % 1) * 60)}m`;
                      }
                      
                      return (
                        <tr key={index} className="border-b border-gray-200 hover:bg-gray-50">
                          <td className="py-3 px-6 text-left">{registro.fecha}</td>
                          <td className="py-3 px-6 text-left">{registro.horaInicio}</td>
                          <td className="py-3 px-6 text-left">{registro.horaFin || '--'}</td>
                          <td className="py-3 px-6 text-left">{tiempoTotal}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-600">No hay registros de fichajes disponibles.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Fichaje;
