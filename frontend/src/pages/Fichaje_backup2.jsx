import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FaRegClock, FaHistory, FaRegChartBar, FaPauseCircle, FaPlayCircle, FaEdit, FaTrash, FaExclamationTriangle, FaCheckCircle, FaSpinner } from 'react-icons/fa';
import { motion } from 'framer-motion';

// Usar la misma URL base que en AuthContext
const API_URL = 'http://localhost/ImpulsaTelecom/backend/controlador.php';

// Configuración de axios para incluir credenciales y mejorar el manejo de la sesión
axios.defaults.withCredentials = true;

const Fichaje = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Estados para manejar el fichaje
  const [fichajeActual, setFichajeActual] = useState(null);
  const [estado, setEstado] = useState('');
  const [entrada, setEntrada] = useState(null);
  const [salida, setSalida] = useState(null);
  const [tiempoTotal, setTiempoTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Estados para manejar modales de edición y eliminación (solo admin)
  const [modalEdicion, setModalEdicion] = useState(false);
  const [modalConfirmacion, setModalConfirmacion] = useState(false);
  const [fichajeSeleccionado, setFichajeSeleccionado] = useState(null);
  const [fichajeEditado, setFichajeEditado] = useState({});
  const [errorModal, setErrorModal] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [activeTab, setActiveTab] = useState('fichaje');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [horasTrabajadas, setHorasTrabajadas] = useState(0);
  const [registros, setRegistros] = useState([]);
  const [mostrarTabla, setMostrarTabla] = useState(false);
  const [loadingHistorial, setLoadingHistorial] = useState(false);
  const [tiempoPausa, setTiempoPausa] = useState(0); // Tiempo acumulado en pausa
  const [horaPausa, setHoraPausa] = useState(null); // Hora de inicio de la pausa actual
  const [tiempoPausaActual, setTiempoPausaActual] = useState(0); // Tiempo de la pausa actual en tiempo real

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  useEffect(() => {
    if (user && user.id) {
      cargarFichajeActual();
      cargarHistorial();
    }
  }, [user]);

  // Cargar fichaje actual
  const cargarFichajeActual = async () => {
    if (user && user.id) {
      try {
        setLoading(true);
        const response = await axios.post(`${API_URL}?action=actual`, { id_usuario: user.id }, { headers: { 'Content-Type': 'application/json' } });

        if (response.data.success && response.data.fichaje) {
          setFichajeActual(response.data.fichaje);
          setEstado(response.data.estado || 'pendiente');

          if (response.data.estado === 'finalizado') {
            setMostrarTabla(true);
            setEntrada(null);
            setSalida(null);
            setTiempoTotal(0);
            setTiempoPausa(0);
            setHoraPausa(null);

            const registrosResponse = await axios.post(`${API_URL}?action=historial`, { id_usuario: user.id }, { headers: { 'Content-Type': 'application/json' } });
            if (registrosResponse.data.success) {
              setRegistros(registrosResponse.data.registros);
            }
          } else {
            setMostrarTabla(false);

            if (response.data.fichaje.horaInicio) {
              const horaEntrada = new Date();
              const horaEntraParts = response.data.fichaje.horaInicio.split(':');
              if (horaEntraParts.length >= 2) {
                horaEntrada.setHours(parseInt(horaEntraParts[0]), parseInt(horaEntraParts[1]), horaEntraParts.length > 2 ? parseInt(horaEntraParts[2] || 0) : 0);
              }
              setEntrada(horaEntrada);

              if (response.data.fichaje.tiempoPausa) {
                setTiempoPausa(parseInt(response.data.fichaje.tiempoPausa));
              }

              if (response.data.estado === 'pausado' && response.data.fichaje.horaPausa) {
                const pausaTime = new Date();
                const pausaParts = response.data.fichaje.horaPausa.split(':');
                if (pausaParts.length >= 2) {
                  pausaTime.setHours(parseInt(pausaParts[0]), parseInt(pausaParts[1]), pausaParts.length > 2 ? parseInt(pausaParts[2] || 0) : 0);
                }
                setHoraPausa(pausaTime);
              } else {
                setHoraPausa(null);
              }

              if (response.data.fichaje.horaFin) {
                const horaSalida = new Date();
                const horaSalidaParts = response.data.fichaje.horaFin.split(':');
                if (horaSalidaParts.length >= 2) {
                  horaSalida.setHours(parseInt(horaSalidaParts[0]), parseInt(horaSalidaParts[1]), horaSalidaParts.length > 2 ? parseInt(horaSalidaParts[2] || 0) : 0);
                }
                setSalida(horaSalida);

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
      const response = await axios.post(`${API_URL}?action=historial`, { id_usuario: user.id }, { headers: { 'Content-Type': 'application/json' } });

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

  // Actualizar el reloj y calcular tiempo trabajado
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      if (entrada && !salida) {
        let tiempoTrabajadoMs = 0;

        if (estado === 'pausado' && horaPausa) {
          tiempoTrabajadoMs = horaPausa - entrada - (tiempoPausa * 1000);

          const tiempoPausaActualMs = new Date() - horaPausa;
          setTiempoPausaActual(Math.floor(tiempoPausaActualMs / 1000));
        } else {
          tiempoTrabajadoMs = new Date() - entrada - (tiempoPausa * 1000);
          setTiempoPausaActual(0);
        }

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
      setError(null);
      const response = await axios.post(`${API_URL}?action=entrada`, { id_usuario: user.id }, { headers: { 'Content-Type': 'application/json' } });

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
    
    // Verificar si el usuario tiene permitidas las pausas (valor debe ser 1)
    if (user.permitir_pausas !== 1) {
      setError('No tienes permiso para pausar fichajes. Contacta con tu administrador.');
      console.error('Intento de pausar sin permiso:', { 
        usuarioId: user.id, 
        permitirPausas: user.permitir_pausas
      });
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await axios.post(`${API_URL}?action=pausa`, { id_usuario: user.id, id_fichaje: fichajeActual.idRegistro }, { headers: { 'Content-Type': 'application/json' } });

      if (response.data.success) {
        setHoraPausa(new Date());
        setEstado('pausado');
        setTimeout(() => {
          cargarFichajeActual();
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
      setError(null);
      const response = await axios.post(`${API_URL}?action=reanudar`, { id_usuario: user.id, id_fichaje: fichajeActual.idRegistro }, { headers: { 'Content-Type': 'application/json' } });

      if (response.data.success) {
        setTiempoPausa(response.data.tiempoPausa);
        setHoraPausa(null);
        setEstado('trabajando');
        setTimeout(() => {
          cargarFichajeActual();
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
      setError(null);
      const response = await axios.post(`${API_URL}?action=salida`, { id_usuario: user.id, id_fichaje: fichajeActual.idRegistro }, { headers: { 'Content-Type': 'application/json' } });

      if (response.data.success) {
        setSalida(new Date());
        setEstado('finalizado');
        setTimeout(() => {
          cargarFichajeActual();
          cargarHistorial();
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
      setError(null);
      const response = await axios.post(`${API_URL}?action=nuevo`, { id_usuario: user.id }, { headers: { 'Content-Type': 'application/json' } });

      if (response.data.success) {
        setEntrada(null);
        setSalida(null);
        setTiempoTotal(0);
        setTiempoPausa(0);
        setHoraPausa(null);
        setEstado('trabajando');
        setFichajeActual({ idRegistro: response.data.id_fichaje });
        setTimeout(() => {
          cargarFichajeActual();
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

  // Funciones para manejar la edición y eliminación de fichajes (solo admin)
  const abrirModalEdicion = (fichaje) => {
    setFichajeSeleccionado(fichaje);
    setFichajeEditado({
      id: fichaje.idRegistro,
      fecha: fichaje.fecha,
      hora_entrada: fichaje.horaInicio,
      hora_salida: fichaje.horaFin || '',
      estado: fichaje.estado
    });
    setErrorModal('');
    setModalEdicion(true);
  };

  const cerrarModalEdicion = () => {
    setModalEdicion(false);
    setFichajeSeleccionado(null);
    setFichajeEditado({});
    setErrorModal('');
  };

  const abrirModalConfirmacion = (fichaje) => {
    setFichajeSeleccionado(fichaje);
    setErrorModal('');
    setModalConfirmacion(true);
  };

  const cerrarModalConfirmacion = () => {
    setModalConfirmacion(false);
    setFichajeSeleccionado(null);
    setErrorModal('');
  };

  const handleGuardarEdicion = async () => {
    if (!user || user.tipo !== 'admin' || !fichajeSeleccionado) return;

    try {
      setLoading(true);
      setErrorModal('');

      const response = await axios.post('http://localhost/ImpulsaTelecom/backend/api/admin_fichajes.php', {
        action: 'editFichaje',
        id: fichajeEditado.id,
        fecha: fichajeEditado.fecha,
        hora_entrada: fichajeEditado.hora_entrada,
        hora_salida: fichajeEditado.hora_salida,
        estado: fichajeEditado.estado
      }, {
        withCredentials: true
      });

      if (response.data.success) {
        cerrarModalEdicion();
        cargarHistorial();
        setSuccessMessage('Fichaje actualizado correctamente');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setErrorModal(response.data.error || 'Error al actualizar el fichaje');
      }
    } catch (error) {
      console.error('Error al actualizar fichaje:', error);
      setErrorModal('Error de conexión al actualizar el fichaje');
    } finally {
      setLoading(false);
    }
  };

  const handleEliminarFichaje = async () => {
    if (!user || user.tipo !== 'admin' || !fichajeSeleccionado) return;

    try {
      setLoading(true);
      setErrorModal('');

      const response = await axios.post('http://localhost/ImpulsaTelecom/backend/api/admin_fichajes.php', {
        action: 'deleteFichaje',
        id: fichajeSeleccionado.idRegistro
      }, {
        withCredentials: true
      });

      if (response.data.success) {
        cerrarModalConfirmacion();
        cargarHistorial();
        setSuccessMessage('Fichaje eliminado correctamente');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setErrorModal(response.data.error || 'Error al eliminar el fichaje');
      }
    } catch (error) {
      console.error('Error al eliminar fichaje:', error);
      setErrorModal('Error de conexión al eliminar el fichaje');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-8 text-center text-gray-800 border-b-4 border-[#91e302] pb-4 w-fit mx-auto">Control de Fichajes</h1>

      {successMessage && (
        <div className="bg-green-50 border-l-4 border-green-500 text-green-700 p-4 mb-6 rounded-md shadow-sm" role="alert">
          <div className="flex items-center">
            <FaCheckCircle className="text-green-500 mr-2" />
            <p>{successMessage}</p>
          </div>
        </div>
      )}

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
              cargarHistorial();
            }}
          >
            <FaHistory className="inline mr-2" /> Historial
          </button>
        </div>

        {activeTab === 'fichaje' && (
          <div className="p-8">
            {/* Panel de reloj y fecha con diseño moderno */}
            <div className="relative bg-gradient-to-r from-[#f8ffee] to-[#e8f5d4] p-6 rounded-2xl shadow-md mb-8 overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#91e302]/10 rounded-full -mr-10 -mt-10"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-[#91e302]/10 rounded-full -ml-8 -mb-8"></div>
              
              <div className="relative flex flex-col md:flex-row justify-between items-center z-10">
                <div className="text-left mb-4 md:mb-0">
                  <h2 className="text-xl md:text-2xl font-bold text-gray-700">{formatDate(currentTime)}</h2>
                  <div className="mt-1 text-sm text-gray-500 flex items-center">
                    <FaRegClock className="mr-1" />
                    <span>Semana {new Date().getWeek ? new Date().getWeek() : Math.ceil(new Date().getDate() / 7)}</span>
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="bg-white px-8 py-4 rounded-xl shadow-sm border border-[#d1e9b0] flex items-center">
                    <div className="flex flex-col items-center">
                      <span className="text-sm text-gray-500 uppercase">Hora actual</span>
                      <p className="text-4xl md:text-5xl font-bold text-[#5a8a01] mt-1 tracking-wide">{formatTime(currentTime)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Cards de información de fichaje */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              {/* Card de Entrada */}
              <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-lg group">
                <div className="bg-gradient-to-r from-[#91e302]/10 to-[#91e302]/5 px-5 py-3 border-b border-gray-100">
                  <h3 className="font-medium text-gray-700 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-[#91e302] group-hover:scale-110 transition-transform duration-300" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-11.25a.75.75 0 00-1.5 0v2.5h-2.5a.75.75 0 000 1.5h2.5v2.5a.75.75 0 001.5 0v-2.5h2.5a.75.75 0 000-1.5h-2.5v-2.5z" clipRule="evenodd" />
                    </svg>
                    Hora de Entrada
                  </h3>
                </div>
                <div className="p-5 text-center">
                  {entrada ? (
                    <div className="flex flex-col items-center">
                      <p className="text-3xl font-bold text-gray-800">{formatTime(entrada)}</p>
                      <p className="text-sm text-gray-500 mt-1">Registrado correctamente</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-gray-400">
                      <p className="text-3xl font-bold">--:--</p>
                      <p className="text-sm mt-1">Sin registrar</p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Card de Estado */}
              <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-lg group">
                <div className="bg-gradient-to-r from-[#91e302]/10 to-[#91e302]/5 px-5 py-3 border-b border-gray-100">
                  <h3 className="font-medium text-gray-700 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-[#91e302] group-hover:scale-110 transition-transform duration-300" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10 3a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM10 8.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM10 14a1.5 1.5 0 110 3 1.5 1.5 0 010-3z" />
                    </svg>
                    Estado Actual
                  </h3>
                </div>
                <div className="p-6 flex justify-center items-center">
                  <div className={`flex items-center py-3 px-6 rounded-full ${
                    estado === 'trabajando' ? 'bg-green-100 text-green-800' : 
                    estado === 'pausado' ? 'bg-blue-100 text-blue-800' : 
                    estado === 'finalizado' ? 'bg-gray-100 text-gray-800' : 
                    'bg-gray-100 text-gray-600'
                  }`}>
                    <span className={`w-3 h-3 rounded-full mr-3 ${
                      estado === 'trabajando' ? 'bg-green-500' : 
                      estado === 'pausado' ? 'bg-blue-500' : 
                      estado === 'finalizado' ? 'bg-gray-500' : 
                      'bg-gray-400'
                    }`}></span>
                    <span className="font-semibold text-lg">
                      {estado === 'trabajando' ? 'Trabajando' : 
                       estado === 'pausado' ? 'En Pausa' : 
                       estado === 'finalizado' ? 'Finalizado' : 
                       'Pendiente'}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Card de Salida */}
              <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-lg group">
                <div className="bg-gradient-to-r from-[#91e302]/10 to-[#91e302]/5 px-5 py-3 border-b border-gray-100">
                  <h3 className="font-medium text-gray-700 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-[#91e302] group-hover:scale-110 transition-transform duration-300" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5.5a.75.75 0 001.5 0V5z" clipRule="evenodd" />
                    </svg>
                    Hora de Salida
                  </h3>
                </div>
                <div className="p-5 text-center">
                  {salida ? (
                    <div className="flex flex-col items-center">
                      <p className="text-3xl font-bold text-gray-800">{formatTime(salida)}</p>
                      <p className="text-sm text-gray-500 mt-1">Registrado correctamente</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-gray-400">
                      <p className="text-3xl font-bold">--:--</p>
                      <p className="text-sm mt-1">Sin registrar</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {(estado === 'trabajando' || estado === 'pausado') && (
              <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden mb-8">
                <div className="bg-gradient-to-r from-[#91e302]/10 to-[#91e302]/5 px-5 py-3 border-b border-gray-100">
                  <h3 className="font-medium text-gray-700 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-[#91e302]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M5 8a1 1 0 011-1h1V6a1 1 0 012 0v1h1a1 1 0 110 2H9v1a1 1 0 11-2 0V9H6a1 1 0 01-1-1z" />
                      <path fillRule="evenodd" d="M2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8zm6-4a4 4 0 100 8 4 4 0 000-8z" clipRule="evenodd" />
                    </svg>
                    Detalles del fichaje actual
                  </h3>
                </div>
                
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Tiempo trabajado */}
                    <div className="bg-gradient-to-r from-green-50 to-green-100 p-5 rounded-xl">
                      <div className="flex items-center mb-2">
                        <div className="bg-green-500 p-2 rounded-lg mr-3">
                          <FaRegClock className="text-white text-lg" />
                        </div>
                        <h4 className="font-medium text-green-800">Tiempo trabajado</h4>
                      </div>
                      
                      <div className="flex justify-center mt-2">
                        <div className="grid grid-cols-3 gap-2 w-full">
                          <div className="bg-white rounded-lg p-3 text-center shadow-sm">
                            <p className="text-3xl font-bold text-green-700">{Math.floor(horasTrabajadas)}</p>
                            <p className="text-xs font-medium text-green-600 uppercase tracking-wide mt-1">Horas</p>
                          </div>
                          <div className="bg-white rounded-lg p-3 text-center shadow-sm">
                            <p className="text-3xl font-bold text-green-700">{Math.floor((horasTrabajadas % 1) * 60)}</p>
                            <p className="text-xs font-medium text-green-600 uppercase tracking-wide mt-1">Minutos</p>
                          </div>
                          <div className="bg-white rounded-lg p-3 text-center shadow-sm">
                            <p className="text-3xl font-bold text-green-700">{Math.floor(((horasTrabajadas % 1) * 60 % 1) * 60)}</p>
                            <p className="text-xs font-medium text-green-600 uppercase tracking-wide mt-1">Segundos</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Tiempo en pausa - Solo visible si hay pausas o está en pausa */}
                    {(tiempoPausa > 0 || (estado === 'pausado' && tiempoPausaActual > 0)) && (
                      <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-5 rounded-xl">
                        <div className="flex items-center mb-2">
                          <div className="bg-blue-500 p-2 rounded-lg mr-3">
                            <FaPauseCircle className="text-white text-lg" />
                          </div>
                          <h4 className="font-medium text-blue-800">Tiempo en pausa</h4>
                          {estado === 'pausado' && (
                            <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-200 text-blue-800">
                              Activa
                            </span>
                          )}
                        </div>
                        
                        <div className="flex justify-center mt-2">
                          <div className="grid grid-cols-3 gap-2 w-full">
                            <div className="bg-white rounded-lg p-3 text-center shadow-sm">
                              <p className="text-3xl font-bold text-blue-700">
                                {estado === 'pausado' 
                                  ? Math.floor((tiempoPausa + tiempoPausaActual) / 3600) 
                                  : Math.floor(tiempoPausa / 3600)}
                              </p>
                              <p className="text-xs font-medium text-blue-600 uppercase tracking-wide mt-1">Horas</p>
                            </div>
                            <div className="bg-white rounded-lg p-3 text-center shadow-sm">
                              <p className="text-3xl font-bold text-blue-700">
                                {estado === 'pausado' 
                                  ? Math.floor(((tiempoPausa + tiempoPausaActual) % 3600) / 60) 
                                  : Math.floor((tiempoPausa % 3600) / 60)}
                              </p>
                              <p className="text-xs font-medium text-blue-600 uppercase tracking-wide mt-1">Minutos</p>
                            </div>
                            <div className="bg-white rounded-lg p-3 text-center shadow-sm">
                              <p className="text-3xl font-bold text-blue-700">
                                {estado === 'pausado' 
                                  ? Math.floor((tiempoPausa + tiempoPausaActual) % 60) 
                                  : Math.floor(tiempoPausa % 60)}
                              </p>
                              <p className="text-xs font-medium text-blue-600 uppercase tracking-wide mt-1">Segundos</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-[#91e302]/10 to-[#91e302]/5 px-5 py-3 border-b border-gray-100">
                <h3 className="font-medium text-gray-700 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-[#91e302]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                  Acciones disponibles
                </h3>
              </div>
              
              <div className="p-6">
                {/* Botones de acción según el estado */}
                {estado === 'pendiente' && (
                  <div className="flex justify-center">
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      className="bg-gradient-to-r from-green-500 to-green-600 text-white py-4 px-8 rounded-xl shadow-md flex items-center justify-center hover:shadow-lg transition-all duration-300 w-full md:w-2/3 lg:w-1/2"
                      onClick={handleEntrada}
                      disabled={loading}
                    >
                      {loading ? (
                        <div className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Procesando...
                        </div>
                      ) : (
                        <>
                          <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                          </svg>
                          Registrar Entrada
                        </>
                      )}
                    </motion.button>
                  </div>
                )}

                {estado === 'trabajando' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Botón de pausa - Solo mostrar si permitir_pausas === 1 */}
                    {user && user.permitir_pausas === 1 && (
                      <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        className="bg-gradient-to-r from-blue-500 to-blue-600 text-white py-4 px-6 rounded-xl shadow-md flex items-center justify-center hover:shadow-lg transition-all duration-300"
                        onClick={handlePausa}
                        disabled={loading}
                      >
                        {loading ? (
                          <div className="flex items-center">
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Procesando...
                          </div>
                        ) : (
                          <>
                            <FaPauseCircle className="mr-2 text-xl" />
                            <span>Pausar Fichaje</span>
                          </>
                        )}
                      </motion.button>
                    )}

                    {/* Botón para finalizar */}
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      className={`bg-gradient-to-r from-red-500 to-red-600 text-white py-4 px-6 rounded-xl shadow-md flex items-center justify-center hover:shadow-lg transition-all duration-300 ${user && user.permitir_pausas !== 1 ? 'col-span-2' : ''}`}
                      onClick={handleSalida}
                      disabled={loading}
                    >
                      {loading ? (
                        <div className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Procesando...
                        </div>
                      ) : (
                        <>
                          <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
                          </svg>
                          <span>Finalizar Jornada</span>
                        </>
                      )}
                    </motion.button>
                  </div>
                )}

                {estado === 'pausado' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      className="bg-gradient-to-r from-green-500 to-green-600 text-white py-4 px-6 rounded-xl shadow-md flex items-center justify-center hover:shadow-lg transition-all duration-300"
                      onClick={handleReanudar}
                      disabled={loading}
                    >
                      {loading ? (
                        <div className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Procesando...
                        </div>
                      ) : (
                        <>
                          <FaPlayCircle className="mr-2 text-xl" />
                          <span>Reanudar Trabajo</span>
                        </>
                      )}
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      className="bg-gradient-to-r from-red-500 to-red-600 text-white py-4 px-6 rounded-xl shadow-md flex items-center justify-center hover:shadow-lg transition-all duration-300"
                      onClick={handleSalida}
                      disabled={loading}
                    >
                      {loading ? (
                        <div className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Procesando...
                        </div>
                      ) : (
                        <>
                          <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
                          </svg>
                          <span>Finalizar Jornada</span>
                        </>
                      )}
                    </motion.button>
                  </div>
                )}
              </div>
            </div>

            {estado === 'finalizado' && (
              <div className="p-6">
                <div className="flex justify-center">
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="bg-gradient-to-r from-[#91e302] to-[#5a8a01] text-white font-bold py-4 px-8 rounded-xl shadow-lg flex items-center justify-center hover:shadow-xl transition-all duration-300 w-full md:w-2/3 lg:w-1/2"
                    onClick={handleNuevoFichaje}
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Procesando...
                      </div>
                    ) : (
                      <>
                        <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                        </svg>
                        Nuevo Fichaje
                      </>
                    )}
                  </motion.button>
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
                      {user && user.tipo === 'admin' && (
                        <th className="py-4 px-6 text-right font-semibold">Acciones</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="text-gray-700 text-sm">
                    {registros.map((registro, index) => {
                      let tiempoTotal = '--';
                      if (registro.horaInicio && registro.horaFin) {
                        const entrada = new Date(`2000-01-01T${registro.horaInicio}`);
                        const salida = new Date(`2000-01-01T${registro.horaFin}`);
                        const diff = (salida - entrada) / 1000;
                        const tiempoPausaSegundos = parseInt(registro.tiempoPausa || 0);
                        const tiempoEfectivo = diff - tiempoPausaSegundos;

                        const horas = Math.floor(tiempoEfectivo / 3600);
                        const minutos = Math.floor((tiempoEfectivo % 3600) / 60);
                        const segundos = Math.floor(tiempoEfectivo % 60);
                        tiempoTotal = `${horas}h ${minutos}m ${segundos}s`;
                      }

                      let tiempoPausaFormateado = '--';
                      if (registro.tiempoPausa && parseInt(registro.tiempoPausa) > 0) {
                        const pausaSegundos = parseInt(registro.tiempoPausa);
                        const horas = Math.floor(pausaSegundos / 3600);
                        const minutos = Math.floor((pausaSegundos % 3600) / 60);
                        const segundos = Math.floor(pausaSegundos % 60);
                        tiempoPausaFormateado = `${horas}h ${minutos}m ${segundos}s`;
                      }

                      return (
                        <tr key={index} className="border-b border-gray-200 hover:bg-[#f0f9e0] transition-colors duration-150">
                          <td className="py-4 px-6 text-left font-medium">{registro.fecha}</td>
                          <td className="py-4 px-6 text-left">{registro.horaInicio}</td>
                          <td className="py-4 px-6 text-left">{registro.horaFin || '--'}</td>
                          <td className="py-4 px-6 text-left font-medium text-[#5a8a01]">{tiempoTotal}</td>
                          <td className="py-4 px-6 text-left font-medium text-gray-700">{tiempoPausaFormateado}</td>
                          {user && user.tipo === 'admin' && (
                            <td className="py-4 px-6 text-right">
                              <button
                                onClick={() => abrirModalEdicion(registro)}
                                className="bg-blue-100 p-2 rounded-full text-blue-600 hover:bg-blue-200 mr-2 transition-colors duration-200"
                                title="Editar fichaje"
                              >
                                <FaEdit size={16} />
                              </button>
                              <button
                                onClick={() => abrirModalConfirmacion(registro)}
                                className="bg-red-100 p-2 rounded-full text-red-600 hover:bg-red-200 transition-colors duration-200"
                                title="Eliminar fichaje"
                              >
                                <FaTrash size={16} />
                              </button>
                            </td>
                          )}
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
      
      {/* Modal para editar fichaje */}
      {modalEdicion && fichajeSeleccionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4 text-[#5a8a01]">Editar Fichaje</h3>
            
            {errorModal && (
              <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded">
                <div className="flex items-center">
                  <FaExclamationTriangle className="text-red-500 mr-2" />
                  <p>{errorModal}</p>
                </div>
              </div>
            )}
            
            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2">Fecha</label>
              <input 
                type="date" 
                className="w-full p-2 border rounded" 
                value={fichajeEditado.fecha} 
                onChange={(e) => setFichajeEditado({...fichajeEditado, fecha: e.target.value})}
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2">Hora de Entrada</label>
              <input 
                type="time" 
                className="w-full p-2 border rounded" 
                value={fichajeEditado.hora_entrada} 
                onChange={(e) => setFichajeEditado({...fichajeEditado, hora_entrada: e.target.value})}
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2">Hora de Salida</label>
              <input 
                type="time" 
                className="w-full p-2 border rounded" 
                value={fichajeEditado.hora_salida} 
                onChange={(e) => setFichajeEditado({...fichajeEditado, hora_salida: e.target.value})}
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2">Estado</label>
              <select 
                className="w-full p-2 border rounded" 
                value={fichajeEditado.estado} 
                onChange={(e) => setFichajeEditado({...fichajeEditado, estado: e.target.value})}
              >
                <option value="finalizado">Finalizado</option>
                <option value="activo">Activo</option>
                <option value="pausado">Pausado</option>
              </select>
            </div>
            
            <div className="flex justify-end space-x-2">
              <button 
                onClick={cerrarModalEdicion} 
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium py-2 px-4 rounded"
                disabled={loading}
              >
                Cancelar
              </button>
              <button 
                onClick={handleGuardarEdicion} 
                className="bg-[#78bd00] hover:bg-[#5a8f00] text-white font-medium py-2 px-4 rounded flex items-center"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <FaSpinner className="animate-spin mr-2" />
                    Guardando...
                  </>
                ) : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal para confirmar eliminación */}
      {modalConfirmacion && fichajeSeleccionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4 text-red-600">Confirmar Eliminación</h3>
            
            {errorModal && (
              <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded">
                <div className="flex items-center">
                  <FaExclamationTriangle className="text-red-500 mr-2" />
                  <p>{errorModal}</p>
                </div>
              </div>
            )}
            
            <p className="mb-4 text-gray-700">
              ¿Estás seguro de que deseas eliminar este fichaje? Esta acción no se puede deshacer.
            </p>
            
            <div className="mb-4 text-gray-700">
              <p className="mb-1"><span className="font-medium">Fecha:</span> {fichajeSeleccionado.fecha}</p>
              <p className="mb-1"><span className="font-medium">Entrada:</span> {fichajeSeleccionado.horaInicio}</p>
              <p className="mb-1"><span className="font-medium">Salida:</span> {fichajeSeleccionado.horaFin || '--'}</p>
            </div>
            
            <div className="flex justify-end space-x-2">
              <button 
                onClick={cerrarModalConfirmacion} 
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium py-2 px-4 rounded"
                disabled={loading}
              >
                Cancelar
              </button>
              <button 
                onClick={handleEliminarFichaje} 
                className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded flex items-center"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <FaSpinner className="animate-spin mr-2" />
                    Eliminando...
                  </>
                ) : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Fichaje;
