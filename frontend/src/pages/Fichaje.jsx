import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FaRegClock, FaHistory, FaRegChartBar, FaPauseCircle, FaPlayCircle } from 'react-icons/fa';
import { motion } from 'framer-motion';

// Usar la misma URL base que en AuthContext
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
  const [tiempoPausa, setTiempoPausa] = useState(0); // Tiempo acumulado en pausa
  const [horaPausa, setHoraPausa] = useState(null); // Hora de inicio de la pausa actual

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
            setTiempoPausa(0);
            setHoraPausa(null);
            
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
              
              // Configurar tiempo de pausa si existe
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
                
                // Calcular tiempo total (restando el tiempo de pausa)
                const tiempoTotalMs = horaSalida - horaEntrada;
                const tiempoPausaMs = response.data.fichaje.tiempoPausa * 1000 || 0;
                setTiempoTotal(tiempoTotalMs - tiempoPausaMs);
              }
            }
          }
        } else {
          setEstado('pendiente');
          setFichajeActual(null);
          setEntrada(null);
          setSalida(null);
          setTiempoPausa(0);
          setHoraPausa(null);
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
        let tiempoTrabajadoMs = 0;
        
        if (estado === 'pausado' && horaPausa) {
          // Si está en pausa, calcular tiempo hasta el inicio de la pausa
          tiempoTrabajadoMs = horaPausa - entrada - (tiempoPausa * 1000);
        } else {
          // Si está trabajando, calcular tiempo hasta ahora menos las pausas acumuladas
          tiempoTrabajadoMs = new Date() - entrada - (tiempoPausa * 1000);
        }
        
        // Convertir a horas
        const tiempoTrabajado = tiempoTrabajadoMs / (1000 * 60 * 60);
        setHorasTrabajadas(tiempoTrabajado > 0 ? tiempoTrabajado : 0);
      }
    }, 1000);
    
    return () => clearInterval(timer);
  }, [entrada, salida, estado, horaPausa, tiempoPausa]);

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

  // Registrar pausa
  const handlePausa = async () => {
    if (!user || !user.id || !fichajeActual) return;
    
    try {
      setLoading(true);
      setError(null); // Limpiar errores anteriores
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
        setTimeout(() => {
          cargarFichajeActual(); // Recargar para obtener los datos actualizados
        }, 500);
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
      setError(null); // Limpiar errores anteriores
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
        // Actualizar el tiempo de pausa acumulado
        if (response.data.tiempoPausa) {
          setTiempoPausa(response.data.tiempoPausa);
        }
        setHoraPausa(null);
        setEstado('trabajando');
        setTimeout(() => {
          cargarFichajeActual(); // Recargar para obtener los datos actualizados
        }, 500);
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
        // Esperar un momento antes de recargar para asegurar que el backend haya procesado el cambio
        setTimeout(() => {
          cargarFichajeActual(); // Recargar para obtener los datos actualizados
          cargarHistorial(); // Actualizar también el historial
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

  // Iniciar un nuevo fichaje después de finalizar uno
  const handleNuevoFichaje = async () => {
    if (!user || !user.id) return;
    
    try {
      setLoading(true);
      setError(null); // Limpiar errores anteriores
      const response = await axios.post(
        `${API_URL}?action=nuevo`,
        { id_usuario: user.id },
        {
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
      
      if (response.data.success) {
        setEntrada(null);
        setSalida(null);
        setTiempoTotal(0);
        setTiempoPausa(0);
        setHoraPausa(null);
        setEstado('trabajando');
        setFichajeActual({ idRegistro: response.data.id_fichaje });
        setTimeout(() => {
          cargarFichajeActual(); // Recargar para obtener los datos actualizados
        }, 500);
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

  return (
    <div className="container mx-auto px-4 py-8 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-8 text-center text-gray-800 border-b-4 border-[#91e302] pb-4 w-fit mx-auto">Control de Fichajes</h1>
      
      {error && (
        <div className="bg-red-50 border-l-4 border-[#c3515f] text-[#c3515f] p-4 mb-6 rounded-md shadow-sm" role="alert">
          <p>{error}</p>
        </div>
      )}
      
      <div className="bg-white rounded-xl shadow-xl overflow-hidden mb-8 border border-gray-100">
        <div className="flex border-b">
          <button 
            className={`flex-1 py-4 px-6 text-center font-medium transition-all duration-200 ${activeTab === 'fichaje' ? 'bg-[#91e302] text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}
            onClick={() => setActiveTab('fichaje')}
          >
            <FaRegClock className="inline mr-2" /> Fichaje Actual
          </button>
          <button 
            className={`flex-1 py-4 px-6 text-center font-medium transition-all duration-200 ${activeTab === 'historial' ? 'bg-[#91e302] text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}
            onClick={() => {
              setActiveTab('historial');
              cargarHistorial(); // Recargar historial al cambiar de pestaña
            }}
          >
            <FaHistory className="inline mr-2" /> Historial
          </button>
        </div>
        
        {activeTab === 'fichaje' && (
          <div className="p-8">
            <div className="text-center mb-8 bg-[#f0f9e0] py-4 rounded-lg shadow-inner border border-[#d1e9b0]">
              <h2 className="text-2xl font-bold text-gray-800">{formatDate(currentTime)}</h2>
              <p className="text-5xl font-bold text-[#5a8a01] mt-2 drop-shadow-sm">{formatTime(currentTime)}</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-xl shadow-sm border border-gray-200 text-center transform transition-transform hover:scale-105 duration-300">
                <h3 className="text-lg font-medium text-gray-600 mb-2">Entrada</h3>
                <p className="text-2xl font-bold text-gray-800 mt-2">{entrada ? formatTime(entrada) : '--:--'}</p>
              </div>
              
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-xl shadow-sm border border-gray-200 text-center transform transition-transform hover:scale-105 duration-300">
                <h3 className="text-lg font-medium text-gray-600 mb-2">Estado</h3>
                <div className={`inline-flex items-center px-4 py-2 rounded-full ${estado === 'trabajando' ? 'bg-[#91e302]/20 text-[#5a8a01]' : 
                                                        estado === 'pausado' ? 'bg-[#cccccc]/30 text-gray-700' : 
                                                        estado === 'finalizado' ? 'bg-[#cccccc]/30 text-gray-700' : 'bg-gray-100 text-gray-700'}`}>
                  <span className={`w-3 h-3 rounded-full mr-2 ${estado === 'trabajando' ? 'bg-[#91e302]' : 
                                                        estado === 'pausado' ? 'bg-[#cccccc]' : 
                                                        estado === 'finalizado' ? 'bg-[#cccccc]' : 'bg-gray-500'}`}></span>
                  <span className="font-semibold">
                    {estado === 'trabajando' ? 'Trabajando' : 
                    estado === 'pausado' ? 'En Pausa' :
                    estado === 'finalizado' ? 'Finalizado' : 'Pendiente'}
                  </span>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-xl shadow-sm border border-gray-200 text-center transform transition-transform hover:scale-105 duration-300">
                <h3 className="text-lg font-medium text-gray-600 mb-2">Salida</h3>
                <p className="text-2xl font-bold text-gray-800 mt-2">{salida ? formatTime(salida) : '--:--'}</p>
              </div>
            </div>
            
            {(estado === 'trabajando' || estado === 'pausado') && (
              <div className="bg-gradient-to-r from-[#f0f9e0] to-[#e8f5d4] p-6 rounded-xl mb-8 shadow-inner border border-[#d1e9b0]">
                <div className="flex flex-col md:flex-row justify-between items-center">
                  <div className="mb-4 md:mb-0 text-center md:text-left">
                    <h3 className="text-lg font-medium text-[#5a8a01] mb-2">Tiempo trabajado</h3>
                    <div className="flex items-center">
                      <FaRegClock className="text-[#91e302] mr-2 text-xl" />
                      <p className="text-3xl font-bold text-[#5a8a01]">
                        {Math.floor(horasTrabajadas)}h {Math.floor((horasTrabajadas % 1) * 60)}m
                      </p>
                    </div>
                  </div>
                  {tiempoPausa > 0 && (
                    <div className="text-center md:text-right">
                      <h3 className="text-lg font-medium text-gray-700 mb-2">Tiempo en pausa</h3>
                      <div className="flex items-center justify-center md:justify-end">
                        <FaPauseCircle className="text-[#cccccc] mr-2 text-xl" />
                        <p className="text-3xl font-bold text-gray-700">
                          {Math.floor(tiempoPausa / 3600)}h {Math.floor((tiempoPausa % 3600) / 60)}m
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            <div className="flex flex-col md:flex-row justify-center space-y-4 md:space-y-0 md:space-x-4">
              {estado === 'pendiente' && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-gradient-to-r from-[#91e302] to-[#5a8a01] text-white font-bold py-4 px-8 rounded-xl shadow-lg flex items-center justify-center hover:shadow-xl transition-all duration-300"
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
                <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 w-full justify-center">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-gradient-to-r from-[#cccccc] to-[#a0a0a0] text-white font-bold py-4 px-8 rounded-xl shadow-lg flex items-center justify-center hover:shadow-xl transition-all duration-300"
                    onClick={handlePausa}
                    disabled={loading}
                  >
                    <FaPauseCircle className="w-6 h-6 mr-2" />
                    Iniciar Pausa
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-gradient-to-r from-[#c3515f] to-[#a73848] text-white font-bold py-4 px-8 rounded-xl shadow-lg flex items-center justify-center hover:shadow-xl transition-all duration-300"
                    onClick={handleSalida}
                    disabled={loading}
                  >
                    <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
                    </svg>
                    Finalizar Jornada
                  </motion.button>
                </div>
              )}
              
              {estado === 'pausado' && (
                <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 w-full justify-center">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-gradient-to-r from-[#91e302] to-[#5a8a01] text-white font-bold py-4 px-8 rounded-xl shadow-lg flex items-center justify-center hover:shadow-xl transition-all duration-300"
                    onClick={handleReanudar}
                    disabled={loading}
                  >
                    <FaPlayCircle className="w-6 h-6 mr-2" />
                    Reanudar Trabajo
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-gradient-to-r from-[#c3515f] to-[#a73848] text-white font-bold py-4 px-8 rounded-xl shadow-lg flex items-center justify-center hover:shadow-xl transition-all duration-300"
                    onClick={handleSalida}
                    disabled={loading}
                  >
                    <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
                    </svg>
                    Finalizar Jornada
                  </motion.button>
                </div>
              )}
              
              {estado === 'finalizado' && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-gradient-to-r from-[#91e302] to-[#5a8a01] text-white font-bold py-4 px-8 rounded-xl shadow-lg flex items-center justify-center hover:shadow-xl transition-all duration-300"
                  onClick={handleNuevoFichaje}
                  disabled={loading}
                >
                  <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                  </svg>
                  Nuevo Fichaje
                </motion.button>
              )}
            </div>
          </div>
        )}
        
        {activeTab === 'historial' && (
          <div className="p-8">
            <h2 className="text-2xl font-bold text-[#5a8a01] mb-6">Historial de Fichajes</h2>
            
            {registros.length > 0 ? (
              <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-gray-200">
                <table className="min-w-full bg-white">
                  <thead>
                    <tr className="bg-gradient-to-r from-[#f0f9e0] to-[#e8f5d4] text-[#5a8a01] uppercase text-sm leading-normal">
                      <th className="py-4 px-6 text-left font-semibold">Fecha</th>
                      <th className="py-4 px-6 text-left font-semibold">Entrada</th>
                      <th className="py-4 px-6 text-left font-semibold">Salida</th>
                      <th className="py-4 px-6 text-left font-semibold">Tiempo Total</th>
                      <th className="py-4 px-6 text-left font-semibold">Tiempo Pausa</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-700 text-sm">
                    {registros.map((registro, index) => {
                      // Calcular tiempo total
                      let tiempoTotal = '--';
                      if (registro.horaInicio && registro.horaFin) {
                        const entrada = new Date(`2000-01-01T${registro.horaInicio}`);
                        const salida = new Date(`2000-01-01T${registro.horaFin}`);
                        const diff = (salida - entrada) / 1000; // Tiempo total en segundos
                        const tiempoPausaSegundos = parseInt(registro.tiempoPausa || 0);
                        const tiempoEfectivo = diff - tiempoPausaSegundos; // Restar tiempo de pausa
                        
                        // Convertir a formato horas y minutos
                        const horas = Math.floor(tiempoEfectivo / 3600);
                        const minutos = Math.floor((tiempoEfectivo % 3600) / 60);
                        tiempoTotal = `${horas}h ${minutos}m`;
                      }
                      
                      // Formatear tiempo de pausa
                      let tiempoPausaFormateado = '--';
                      if (registro.tiempoPausa && parseInt(registro.tiempoPausa) > 0) {
                        const pausaSegundos = parseInt(registro.tiempoPausa);
                        const horas = Math.floor(pausaSegundos / 3600);
                        const minutos = Math.floor((pausaSegundos % 3600) / 60);
                        tiempoPausaFormateado = `${horas}h ${minutos}m`;
                      }
                      
                      return (
                        <tr key={index} className="border-b border-gray-200 hover:bg-[#f0f9e0] transition-colors duration-150">
                          <td className="py-4 px-6 text-left font-medium">{registro.fecha}</td>
                          <td className="py-4 px-6 text-left">{registro.horaInicio}</td>
                          <td className="py-4 px-6 text-left">{registro.horaFin || '--'}</td>
                          <td className="py-4 px-6 text-left font-medium text-[#5a8a01]">{tiempoTotal}</td>
                          <td className="py-4 px-6 text-left font-medium text-gray-700">{tiempoPausaFormateado}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="bg-gray-50 p-8 rounded-xl text-center border border-gray-200 shadow-sm">
                <FaRegChartBar className="text-gray-400 text-5xl mx-auto mb-4" />
                <p className="text-gray-600 text-lg">No hay registros de fichajes disponibles.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Fichaje;
