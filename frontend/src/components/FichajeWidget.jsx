import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
const API_URL = 'http://localhost/ImpulsaTelecom/backend/api/Fichaje.php';

const FichajeWidget = () => {
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [estado, setEstado] = useState('pendiente'); // pendiente, trabajando, pausado, finalizado
  const [entrada, setEntrada] = useState(null);
  const [salida, setSalida] = useState(null);
  const [pausaInicio, setPausaInicio] = useState(null);
  const [tiempoPausado, setTiempoPausado] = useState(0);
  const [horasTrabajadas, setHorasTrabajadas] = useState(0);
  const [fichajeActual, setFichajeActual] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cargar fichaje actual al iniciar
  useEffect(() => {
    const cargarFichajeActual = async () => {
      if (user && user.id) {
        try {
          setLoading(true);
          const response = await axios.get(`${API_URL}?route=actual&id_usuario=${user.id}`);
          
          if (response.data.success && response.data.fichaje) {
            setFichajeActual(response.data.fichaje);
            setEstado(response.data.estado);
            setError(null); // Limpiar errores anteriores
            
            // Configurar tiempos
            const horaEntrada = new Date();
            horaEntrada.setHours(
              parseInt(response.data.fichaje.hora_entrada.split(':')[0]),
              parseInt(response.data.fichaje.hora_entrada.split(':')[1]),
              parseInt(response.data.fichaje.hora_entrada.split(':')[2] || 0)
            );
            setEntrada(horaEntrada);
            
            if (response.data.fichaje.hora_salida) {
              const horaSalida = new Date();
              horaSalida.setHours(
                parseInt(response.data.fichaje.hora_salida.split(':')[0]),
                parseInt(response.data.fichaje.hora_salida.split(':')[1]),
                parseInt(response.data.fichaje.hora_salida.split(':')[2] || 0)
              );
              setSalida(horaSalida);
            }
            
            // Calcular tiempo pausado
            if (response.data.pausas && response.data.pausas.length > 0) {
              let tiempoPausadoTotal = 0;
              
              response.data.pausas.forEach(pausa => {
                if (pausa.hora_inicio && pausa.hora_fin) {
                  const inicioPausa = new Date();
                  inicioPausa.setHours(
                    parseInt(pausa.hora_inicio.split(':')[0]),
                    parseInt(pausa.hora_inicio.split(':')[1]),
                    parseInt(pausa.hora_inicio.split(':')[2] || 0)
                  );
                  
                  const finPausa = new Date();
                  finPausa.setHours(
                    parseInt(pausa.hora_fin.split(':')[0]),
                    parseInt(pausa.hora_fin.split(':')[1]),
                    parseInt(pausa.hora_fin.split(':')[2] || 0)
                  );
                  
                  tiempoPausadoTotal += (finPausa - inicioPausa);
                } else if (pausa.hora_inicio && !pausa.hora_fin) {
                  // Pausa activa
                  const inicioPausa = new Date();
                  inicioPausa.setHours(
                    parseInt(pausa.hora_inicio.split(':')[0]),
                    parseInt(pausa.hora_inicio.split(':')[1]),
                    parseInt(pausa.hora_inicio.split(':')[2] || 0)
                  );
                  
                  setPausaInicio(inicioPausa);
                }
              });
              
              setTiempoPausado(tiempoPausadoTotal);
            }
          } else {
            setEstado('pendiente');
          }
        } catch (err) {
          console.error('Error al cargar fichaje:', err);
          setError('Error al cargar el fichaje');
        } finally {
          setLoading(false);
        }
      }
    };
    
    cargarFichajeActual();
  }, [user]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      if (entrada && !salida) {
        let tiempoActualPausado = tiempoPausado;
        
        // Si está en pausa, añadir el tiempo de la pausa actual
        if (estado === 'pausado' && pausaInicio) {
          tiempoActualPausado += (new Date() - pausaInicio);
        }
        
        const tiempoTrabajado = (new Date() - entrada - tiempoActualPausado) / (1000 * 60 * 60);
        setHorasTrabajadas(tiempoTrabajado);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [entrada, salida, tiempoPausado, estado, pausaInicio]);

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

  const handleEntrada = async () => {
    if (!user || !user.id){
      setError('Debe iniciar sesión para registrar entrada');
      return;
    } 
    
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}?route=entrada&id_usuario=${user.id}`);
      
      if (response.data.success) {
        setEntrada(new Date());
        setEstado('trabajando');
        setFichajeActual({ id: response.data.id_fichaje });
      } else {
        setError(response.data.message || 'Error al registrar entrada');
      }
    } catch (err) {
      console.error('Error al registrar entrada:', err);
      setError('Error al registrar entrada');
    } finally {
      setLoading(false);
    }
  };

  const handleSalida = async () => {
    if (!user || !user.id || !fichajeActual) return;
    
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}?route=salida&id_usuario=${user.id}&id_fichaje=${fichajeActual.id}`);
      
      if (response.data.success) {
        setSalida(new Date());
        setEstado('finalizado');
      } else {
        setError(response.data.message || 'Error al registrar salida');
      }
    } catch (err) {
      console.error('Error al registrar salida:', err);
      setError('Error al registrar salida');
    } finally {
      setLoading(false);
    }
  };

  const handlePausa = async () => {
    if (!user || !user.id || !fichajeActual) return;
    
    try {
      setLoading(true);
      
      if (estado === 'trabajando') {
        // Iniciar pausa
        const response = await axios.get(`${API_URL}?route=pausa&id_usuario=${user.id}&id_fichaje=${fichajeActual.id}&tipo=inicio`);
        
        if (response.data.success) {
          setPausaInicio(new Date());
          setEstado('pausado');
        } else {
          setError(response.data.message || 'Error al iniciar pausa');
        }
      } else if (estado === 'pausado') {
        // Finalizar pausa
        const response = await axios.get(`${API_URL}?route=pausa&id_usuario=${user.id}&id_fichaje=${fichajeActual.id}&tipo=fin`);
        
        if (response.data.success) {
          const tiempoPausaActual = (new Date() - pausaInicio);
          setTiempoPausado(prev => prev + tiempoPausaActual);
          setPausaInicio(null);
          setEstado('trabajando');
        } else {
          setError(response.data.message || 'Error al finalizar pausa');
        }
      }
    } catch (err) {
      console.error('Error al gestionar pausa:', err);
      setError('Error al gestionar pausa');
    } finally {
      setLoading(false);
    }
  };

  const getEstadoColor = () => {
    switch (estado) {
      case 'pendiente': return 'bg-yellow-100 text-yellow-800';
      case 'trabajando': return 'bg-green-100 text-green-800';
      case 'pausado': return 'bg-orange-100 text-orange-800';
      case 'finalizado': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getEstadoTexto = () => {
    switch (estado) {
      case 'pendiente': return 'Pendiente de fichar';
      case 'trabajando': return 'Trabajando';
      case 'pausado': return 'En pausa';
      case 'finalizado': return 'Jornada finalizada';
      default: return '';
    }
  };

  if (loading && !entrada) {
    return (
      <div className="bg-white p-4 rounded-lg shadow-md h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-800 mx-auto"></div>
          <p className="mt-3 text-gray-600">Cargando fichaje...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow-md h-full relative">
      <div className="drag-handle absolute top-3 left-3 cursor-move w-4 h-4 flex flex-wrap content-start z-10">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="w-1 h-1 bg-gray-400 rounded-full m-[0.5px]"></div>
        ))}
      </div>
      <h3 className="text-lg font-semibold mb-3 pl-6">Control de Fichaje</h3>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
          {error}
          <button 
            className="ml-2 text-red-700 hover:text-red-900"
            onClick={() => setError(null)}
          >
            ×
          </button>
        </div>
      )}
      
      <div className="widget-content">
        <motion.div 
          className="text-center mb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div 
            className="text-3xl font-bold tracking-wide text-gray-800"
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ duration: 1, repeat: Infinity, repeatType: "reverse" }}
          >
            {currentTime.toLocaleTimeString('es-ES')}
          </motion.div>
          <div className="text-sm text-gray-500 mt-1">
            {formatDate(currentTime)}
          </div>
        </motion.div>

        <div className={`rounded-lg p-3 mb-4 text-center font-medium ${getEstadoColor()} transition-colors duration-300`}>
          {getEstadoTexto()}
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center">
            <div className="text-sm text-gray-500 mb-1">Entrada</div>
            <div className="text-xl font-semibold text-gray-800">{formatTime(entrada)}</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-500 mb-1">Salida</div>
            <div className="text-xl font-semibold text-gray-800">{formatTime(salida)}</div>
          </div>
        </div>

        {estado !== 'finalizado' && (
          <div className="space-y-4">
            {estado === 'pendiente' && (
              <button
                onClick={handleEntrada}
                disabled={loading}
                className="w-full py-2 px-4 rounded-lg font-medium transition-all duration-200 bg-green-600 hover:bg-green-700 text-white flex items-center justify-center transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Procesando...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
                    </svg>
                    Registrar entrada
                  </>
                )}
              </button>
            )}

            {(estado === 'trabajando' || estado === 'pausado') && (
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={handlePausa}
                  disabled={loading}
                  className={`py-2 px-4 rounded-lg font-medium transition-all duration-200 ${
                    estado === 'pausado' 
                      ? 'bg-orange-600 hover:bg-orange-700' 
                      : 'bg-yellow-600 hover:bg-yellow-700'
                  } text-white flex items-center justify-center transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        {estado === 'pausado' ? (
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                        ) : (
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        )}
                      </svg>
                      {estado === 'pausado' ? 'Reanudar' : 'Pausar'}
                    </>
                  )}
                </button>

                <button
                  onClick={handleSalida}
                  disabled={loading}
                  className="py-2 px-4 rounded-lg font-medium transition-all duration-200 bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 011.414-1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
                      </svg>
                      Registrar salida
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {(estado === 'trabajando' || estado === 'pausado') && (
          <div className="mt-4 p-3 border border-gray-200 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Tiempo trabajado:</span>
              <span className="text-lg font-semibold text-gray-800">
                {horasTrabajadas.toFixed(2)} h
              </span>
            </div>
            {tiempoPausado > 0 && (
              <div className="flex justify-between items-center mt-2">
                <span className="text-sm text-gray-500">Tiempo en pausas:</span>
                <span className="text-lg font-semibold text-gray-800">
                  {(tiempoPausado / (1000 * 60 * 60)).toFixed(2)} h
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FichajeWidget;
