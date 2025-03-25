import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { 
  getFichajeActual, 
  registrarEntrada, 
  registrarSalida, 
  registrarPausa,
  getHistorialFichajes,
  getEstadisticasFichajes
} from '../services/fichajeService';
import { FaRegClock, FaRegCalendarAlt, FaHistory, FaRegChartBar } from 'react-icons/fa';

const Fichaje = () => {
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [estado, setEstado] = useState('pendiente'); // pendiente, trabajando, pausado, finalizado
  const [entrada, setEntrada] = useState(null);
  const [salida, setSalida] = useState(null);
  const [pausaInicio, setPausaInicio] = useState(null);
  const [tiempoPausado, setTiempoPausado] = useState(0);
  const [horasTrabajadas, setHorasTrabajadas] = useState(0);
  const [historialFichajes, setHistorialFichajes] = useState([]);
  const [estadisticas, setEstadisticas] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingHistorial, setLoadingHistorial] = useState(true);
  const [loadingEstadisticas, setLoadingEstadisticas] = useState(true);
  const [activeTab, setActiveTab] = useState('fichaje');
  const [error, setError] = useState(null);
  const [periodoEstadisticas, setPeriodoEstadisticas] = useState('semana');
  const [fichajeActual, setFichajeActual] = useState(null);

  // Cargar fichaje actual al iniciar
  useEffect(() => {
    const cargarFichajeActual = async () => {
      if (user && user.id) {
        try {
          setLoading(true);
          const response = await getFichajeActual(user.id);
          
          if (response.success && response.fichaje) {
            setFichajeActual(response.fichaje);
            setEstado(response.estado);
            
            // Configurar tiempos
            const horaEntrada = new Date();
            horaEntrada.setHours(
              parseInt(response.fichaje.hora_entrada.split(':')[0]),
              parseInt(response.fichaje.hora_entrada.split(':')[1]),
              parseInt(response.fichaje.hora_entrada.split(':')[2] || 0)
            );
            setEntrada(horaEntrada);
            
            if (response.fichaje.hora_salida) {
              const horaSalida = new Date();
              horaSalida.setHours(
                parseInt(response.fichaje.hora_salida.split(':')[0]),
                parseInt(response.fichaje.hora_salida.split(':')[1]),
                parseInt(response.fichaje.hora_salida.split(':')[2] || 0)
              );
              setSalida(horaSalida);
            }
            
            // Calcular tiempo pausado
            if (response.pausas && response.pausas.length > 0) {
              let tiempoPausadoTotal = 0;
              
              response.pausas.forEach(pausa => {
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

  // Cargar historial cuando se cambia a la pestaña de historial
  useEffect(() => {
    if (activeTab === 'historial' && user && user.id) {
      const cargarHistorial = async () => {
        try {
          setLoadingHistorial(true);
          const response = await getHistorialFichajes(user.id);
          
          if (response.success) {
            setHistorialFichajes(response.fichajes || []);
          } else {
            setError('Error al cargar el historial de fichajes');
          }
        } catch (err) {
          console.error('Error al cargar historial:', err);
          setError('Error al cargar el historial de fichajes');
        } finally {
          setLoadingHistorial(false);
        }
      };
      
      cargarHistorial();
    }
  }, [activeTab, user]);

  // Cargar estadísticas cuando se cambia a la pestaña de estadísticas
  useEffect(() => {
    if (activeTab === 'estadisticas' && user && user.id) {
      const cargarEstadisticas = async () => {
        try {
          setLoadingEstadisticas(true);
          const response = await getEstadisticasFichajes(user.id, periodoEstadisticas);
          
          if (response.success) {
            setEstadisticas(response);
          } else {
            setError('Error al cargar las estadísticas');
          }
        } catch (err) {
          console.error('Error al cargar estadísticas:', err);
          setError('Error al cargar las estadísticas');
        } finally {
          setLoadingEstadisticas(false);
        }
      };
      
      cargarEstadisticas();
    }
  }, [activeTab, periodoEstadisticas, user]);

  // Actualizar el reloj y calcular tiempo trabajado
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
    if (!user || !user.id) return;
    
    try {
      setLoading(true);
      setError(null); // Limpiar errores anteriores
      const response = await registrarEntrada(user.id);
      
      if (response.success) {
        setEntrada(new Date());
        setEstado('trabajando');
        setFichajeActual({ id: response.id_fichaje });
      } else {
        // Si ya existe un fichaje activo, cargar los datos de ese fichaje
        if (response.message === 'Ya existe un fichaje activo para hoy') {
          // Recargar el fichaje actual
          const fichajeResponse = await getFichajeActual(user.id);
          if (fichajeResponse.success && fichajeResponse.fichaje) {
            setFichajeActual(fichajeResponse.fichaje);
            setEstado(fichajeResponse.estado);
            
            // Configurar tiempos
            const horaEntrada = new Date();
            horaEntrada.setHours(
              parseInt(fichajeResponse.fichaje.hora_entrada.split(':')[0]),
              parseInt(fichajeResponse.fichaje.hora_entrada.split(':')[1]),
              parseInt(fichajeResponse.fichaje.hora_entrada.split(':')[2] || 0)
            );
            setEntrada(horaEntrada);
            
            if (fichajeResponse.fichaje.hora_salida) {
              const horaSalida = new Date();
              horaSalida.setHours(
                parseInt(fichajeResponse.fichaje.hora_salida.split(':')[0]),
                parseInt(fichajeResponse.fichaje.hora_salida.split(':')[1]),
                parseInt(fichajeResponse.fichaje.hora_salida.split(':')[2] || 0)
              );
              setSalida(horaSalida);
            }
            
            // No mostrar error en este caso
            return;
          }
        }
        
        // Para otros errores, mostrar el mensaje normalmente
        setError(response.message || 'Error al registrar entrada');
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
      const response = await registrarSalida(user.id, fichajeActual.id);
      
      if (response.success) {
        setSalida(new Date());
        setEstado('finalizado');
      } else {
        setError(response.message || 'Error al registrar salida');
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
        const response = await registrarPausa(user.id, fichajeActual.id, 'inicio');
        
        if (response.success) {
          setPausaInicio(new Date());
          setEstado('pausado');
        } else {
          setError(response.message || 'Error al iniciar pausa');
        }
      } else if (estado === 'pausado') {
        // Finalizar pausa
        const response = await registrarPausa(user.id, fichajeActual.id, 'fin');
        
        if (response.success) {
          const tiempoPausaActual = (new Date() - pausaInicio);
          setTiempoPausado(prev => prev + tiempoPausaActual);
          setPausaInicio(null);
          setEstado('trabajando');
        } else {
          setError(response.message || 'Error al finalizar pausa');
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

  const handleChangePeriodo = (periodo) => {
    setPeriodoEstadisticas(periodo);
  };

  const renderFichajeActual = () => (
    <motion.div 
      className="bg-white rounded-lg shadow-md p-6 mb-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-2">Control de Fichaje</h2>
      
      {error && (
        <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-lg flex justify-between items-center">
          <span>{error}</span>
          <button 
            className="text-red-700 hover:text-red-900"
            onClick={() => setError(null)}
          >
            ×
          </button>
        </div>
      )}
      
      {loading && !entrada ? (
        <div className="flex justify-center items-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="text-center">
              <motion.div 
                className="text-4xl font-bold tracking-wider text-gray-800"
                animate={{ scale: [1, 1.02, 1] }}
                transition={{ duration: 1, repeat: Infinity, repeatType: "reverse" }}
              >
                {currentTime.toLocaleTimeString('es-ES')}
              </motion.div>
              <div className="text-sm text-gray-500 mt-1">
                {formatDate(currentTime)}
              </div>
            </div>
            
            <div className={`rounded-lg p-4 text-center font-medium ${getEstadoColor()} flex items-center justify-center`}>
              <span className="text-xl">{getEstadoTexto()}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="text-sm text-gray-500 mb-1">Entrada</div>
              <div className="text-xl font-semibold text-gray-800">{formatTime(entrada)}</div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="text-sm text-gray-500 mb-1">Tiempo trabajado</div>
              <div className="text-xl font-semibold text-gray-800">
                {entrada && !salida ? `${horasTrabajadas.toFixed(2)} h` : '--:--'}
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="text-sm text-gray-500 mb-1">Salida</div>
              <div className="text-xl font-semibold text-gray-800">{formatTime(salida)}</div>
            </div>
          </div>

          {estado !== 'finalizado' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {estado === 'pendiente' && (
                <button
                  onClick={handleEntrada}
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 bg-green-600 hover:bg-green-700 text-white flex items-center justify-center transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Procesando...
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
                      </svg>
                      Registrar entrada
                    </>
                  )}
                </button>
              )}

              {(estado === 'trabajando' || estado === 'pausado') && (
                <>
                  <button
                    onClick={handlePausa}
                    disabled={loading}
                    className={`py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
                      estado === 'pausado' 
                        ? 'bg-orange-600 hover:bg-orange-700' 
                        : 'bg-yellow-600 hover:bg-yellow-700'
                    } text-white flex items-center justify-center transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" viewBox="0 0 20 20" fill="currentColor">
                          {estado === 'pausado' ? (
                            <path fillRule="evenodd" d="M10 18a8 8 0 11-16 0 8 8 0 0116 0zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                          ) : (
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8a1 1 0 00-1 1v4a1 1 0 102 0V9a1 1 0 00-1-1z" clipRule="evenodd" />
                          )}
                        </svg>
                        {estado === 'pausado' ? 'Reanudar' : 'Pausar'}
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleSalida}
                    disabled={loading}
                    className="py-3 px-4 rounded-lg font-medium transition-all duration-200 bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 011.414-1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
                        </svg>
                        Registrar salida
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          )}

          {tiempoPausado > 0 && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Tiempo en pausas:</span>
                <span className="text-lg font-semibold text-gray-800">
                  {(tiempoPausado / (1000 * 60 * 60)).toFixed(2)} h
                </span>
              </div>
            </div>
          )}
        </>
      )}
    </motion.div>
  );

  const renderHistorial = () => (
    <motion.div 
      className="bg-white rounded-lg shadow-md p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-2">Historial de Fichajes</h2>
      
      {loadingHistorial ? (
        <div className="flex justify-center items-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Entrada
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Salida
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pausas
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {historialFichajes.map((fichaje, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {new Date(fichaje.fecha).toLocaleDateString('es-ES')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{fichaje.entrada}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{fichaje.salida}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{fichaje.pausas}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium">{fichaje.total}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      fichaje.estado === 'completado' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {fichaje.estado === 'completado' ? 'Completado' : 'Incompleto'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </motion.div>
  );

  const renderEstadisticas = () => (
    <motion.div 
      className="bg-white rounded-lg shadow-md p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-2">Estadísticas de Fichaje</h2>
      
      {loadingEstadisticas ? (
        <div className="flex justify-center items-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-700">Resumen Semanal</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Horas trabajadas:</span>
                  <span className="font-semibold">39.5 h</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Tiempo en pausas:</span>
                  <span className="font-semibold">4.5 h</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Promedio diario:</span>
                  <span className="font-semibold">7.9 h</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Días trabajados:</span>
                  <span className="font-semibold">5 / 5</span>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-700">Resumen Mensual</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Horas trabajadas:</span>
                  <span className="font-semibold">158 h</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Tiempo en pausas:</span>
                  <span className="font-semibold">18 h</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Promedio diario:</span>
                  <span className="font-semibold">7.9 h</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Días trabajados:</span>
                  <span className="font-semibold">20 / 22</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-700">Distribución de Horas</h3>
            <div className="h-64 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <FaRegChartBar className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p>Gráfico de distribución de horas trabajadas</p>
                <p className="text-sm">(Implementación pendiente)</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Control de Fichaje</h1>
          <p className="text-gray-600">Gestiona tus horas de trabajo y consulta tu historial</p>
        </div>
        
        <div className="mt-4 md:mt-0">
          <div className="bg-white rounded-full shadow-md p-1">
            <div className="flex space-x-1">
              <button 
                onClick={() => setActiveTab('fichaje')} 
                className={`px-4 py-2 rounded-full transition-colors duration-200 flex items-center ${activeTab === 'fichaje' ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'}`}
              >
                <FaRegClock className="mr-2" />
                Fichaje
              </button>
              <button 
                onClick={() => setActiveTab('historial')} 
                className={`px-4 py-2 rounded-full transition-colors duration-200 flex items-center ${activeTab === 'historial' ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'}`}
              >
                <FaHistory className="mr-2" />
                Historial
              </button>
              <button 
                onClick={() => setActiveTab('estadisticas')} 
                className={`px-4 py-2 rounded-full transition-colors duration-200 flex items-center ${activeTab === 'estadisticas' ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'}`}
              >
                <FaRegChartBar className="mr-2" />
                Estadísticas
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {activeTab === 'fichaje' && renderFichajeActual()}
      {activeTab === 'historial' && renderHistorial()}
      {activeTab === 'estadisticas' && renderEstadisticas()}
    </div>
  );
};

export default Fichaje;
