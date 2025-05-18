import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FaCheckCircle, FaTimesCircle, FaFileAlt, FaUserAlt, FaClock, FaCalendarAlt, FaMedkit, FaPlane, FaFilePdf, FaFileUpload, FaExclamationTriangle, FaCommentAlt, FaFileImage, FaTimes, FaCheck } from 'react-icons/fa';
import { motion } from 'framer-motion';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

// Usar la misma URL base que en AuthContext
const API_URL = 'http://localhost/ImpulsaTelecom/backend/api/solicitudes.php';

// Configuración de axios para incluir credenciales
axios.defaults.withCredentials = true;

const Solicitudes = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Estados para el formulario de solicitud
  const [tipoSolicitud, setTipoSolicitud] = useState('horaria');
  const [fechaInicio, setFechaInicio] = useState(new Date());
  const [fechaFin, setFechaFin] = useState(new Date());
  const [horaInicio, setHoraInicio] = useState('09:00');
  const [horaFin, setHoraFin] = useState('14:00');
  const [motivo, setMotivo] = useState('');
  
  // Estados para manejo de archivos (justificantes)
  const [archivoJustificante, setArchivoJustificante] = useState(null);
  const [nombreArchivo, setNombreArchivo] = useState('');
  const [subiendoArchivo, setSubiendoArchivo] = useState(false);
  const [errorArchivo, setErrorArchivo] = useState(null);
  const fileInputRef = useRef(null);
  
  // Estados para el formulario
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Estados para la lista de solicitudes
  const [solicitudes, setSolicitudes] = useState([]);
  const [loadingSolicitudes, setLoadingSolicitudes] = useState(true);
  const [activeTab, setActiveTab] = useState('nueva');
  
  // Estados para la vista de administrador
  const [todasSolicitudes, setTodasSolicitudes] = useState([]);
  const [loadingTodasSolicitudes, setLoadingTodasSolicitudes] = useState(true);
  const [comentarioRespuesta, setComentarioRespuesta] = useState('');
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState(null);
  const [modalRespuesta, setModalRespuesta] = useState(false);
  const [accionRespuesta, setAccionRespuesta] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else {
      // Si el usuario es administrador, cargar todas las solicitudes y establecer la pestaña activa a 'admin'
      if (user.tipo_usuario === 'admin') {
        setActiveTab('admin');
        cargarTodasSolicitudes();
      } else {
        cargarSolicitudes();
      }
    }
  }, [user, navigate]);
  
  // Cargar todas las solicitudes (para administradores)
  const cargarTodasSolicitudes = async () => {
    try {
      setLoadingTodasSolicitudes(true);
      const response = await axios.post(`${API_URL}?action=todas`,
        {},
        {
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
      
      if (response.data.success) {
        setTodasSolicitudes(response.data.solicitudes);
      } else {
        setError('Error al cargar todas las solicitudes: ' + response.data.error);
      }
    } catch (error) {
      console.error('Error al cargar todas las solicitudes:', error);
      setError('Error al cargar solicitudes. Por favor, inténtelo de nuevo.');
    } finally {
      setLoadingTodasSolicitudes(false);
    }
  };
  
  // Responder a una solicitud (aprobar o rechazar)
  const responderSolicitud = async (estado) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.post(`${API_URL}?action=responder`,
        {
          id_solicitud: solicitudSeleccionada.idSolicitud,
          estado: estado,
          comentario: comentarioRespuesta
        },
        {
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
      
      if (response.data.success) {
        setSuccess(`Solicitud ${estado === 'aprobada' ? 'aprobada' : 'rechazada'} correctamente`);
        // Cerrar modal y limpiar datos
        setModalRespuesta(false);
        setComentarioRespuesta('');
        setSolicitudSeleccionada(null);
        // Recargar solicitudes
        cargarTodasSolicitudes();
      } else {
        setError('Error al responder solicitud: ' + response.data.error);
      }
    } catch (error) {
      console.error('Error al responder solicitud:', error);
      setError('Error al responder la solicitud. Por favor, inténtelo de nuevo.');
    } finally {
      setLoading(false);
    }
  };
  
  // Abrir modal de respuesta
  const abrirModalRespuesta = (solicitud, accion) => {
    setSolicitudSeleccionada(solicitud);
    setAccionRespuesta(accion);
    setModalRespuesta(true);
  };

  // Cargar solicitudes del usuario
  const cargarSolicitudes = async () => {
    if (!user || !user.id) return;
    
    try {
      setLoadingSolicitudes(true);
      const response = await axios.post(`${API_URL}?action=usuario`,
        { NIF: user.id },
        {
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
      
      if (response.data.success) {
        const solicitudesRecibidas = response.data.solicitudes;
        console.log('Datos recibidos del backend:', solicitudesRecibidas);
        setSolicitudes(solicitudesRecibidas);
      } else {
        setError('Error al cargar solicitudes: ' + response.data.error);
      }
    } catch (error) {
      console.error('Error al cargar solicitudes:', error);
      setError('Error al cargar solicitudes. Por favor, inténtelo de nuevo.');
    } finally {
      setLoadingSolicitudes(false);
    }
  };

  // Manejar la selección de archivos
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validar tipo de archivo (PDF, JPG, PNG)
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      setErrorArchivo('Formato de archivo no válido. Solo se permiten PDF, JPG y PNG.');
      return;
    }
    
    // Validar tamaño (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB en bytes
    if (file.size > maxSize) {
      setErrorArchivo('El archivo es demasiado grande. Tamaño máximo: 5MB');
      return;
    }
    
    setErrorArchivo(null);
    setArchivoJustificante(file);
    setNombreArchivo(file.name);
  };
  
  // Subir archivo al servidor
  const subirArchivo = async () => {
    if (!archivoJustificante) return null;
    
    try {
      setSubiendoArchivo(true);
      
      const formData = new FormData();
      formData.append('justificante', archivoJustificante);
      formData.append('NIF', user.id);
      
      const response = await axios.post(
        `${API_URL}?action=subir_justificante`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      if (response.data.success) {
        return response.data.ruta_archivo;
      } else {
        throw new Error(response.data.error || 'Error al subir el archivo');
      }
    } catch (error) {
      console.error('Error al subir archivo:', error);
      throw error;
    } finally {
      setSubiendoArchivo(false);
    }
  };

  // Enviar solicitud
  const enviarSolicitud = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Formatear fechas para enviar al servidor
      const formatDate = (date) => {
        const d = new Date(date);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      };
      
      const solicitudData = {
        NIF: user.id,
        tipo: tipoSolicitud,
        fecha_inicio: formatDate(fechaInicio),
        motivo: motivo
      };
      
      // Configurar datos específicos según el tipo de solicitud
      if (tipoSolicitud === 'horaria') {
        solicitudData.hora_inicio = horaInicio;
        solicitudData.hora_fin = horaFin;
      } else if (tipoSolicitud === 'diaria' || tipoSolicitud === 'medica' || tipoSolicitud === 'vacaciones') {
        // Para solicitudes que abarcan días completos
        solicitudData.fecha_fin = formatDate(fechaFin);
      }
      
      // Si es una baja médica y hay un archivo adjunto, subirlo primero
      if (tipoSolicitud === 'medica' && archivoJustificante) {
        try {
          const rutaArchivo = await subirArchivo();
          if (rutaArchivo) {
            solicitudData.justificante = rutaArchivo;
          }
        } catch (archivoError) {
          setError(`Error al subir el justificante: ${archivoError.message}`);
          setLoading(false);
          return;
        }
      }
      
      const response = await axios.post(`${API_URL}?action=crear`,
        solicitudData,
        {
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
      
      if (response.data.success) {
        setSuccess('Solicitud enviada correctamente');
        // Limpiar formulario
        setMotivo('');
        setArchivoJustificante(null);
        setNombreArchivo('');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        // Recargar solicitudes
        cargarSolicitudes();
        // Cambiar a la pestaña de historial
        setActiveTab('historial');
      } else {
        setError('Error al enviar solicitud: ' + response.data.error);
      }
    } catch (error) {
      console.error('Error al enviar solicitud:', error);
      setError('Error al enviar la solicitud. Por favor, inténtelo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  // Renderizar el tipo de solicitud con su icono correspondiente
  const renderTipoSolicitud = (solicitud) => {
    // Si se pasa una solicitud completa, extraer el tipo
    // Si solo se pasa una cadena, usarla como tipo
    let tipo = '';
    
    if (typeof solicitud === 'object' && solicitud !== null) {
      tipo = solicitud.tipo || '';
    } else {
      tipo = solicitud || '';
    }
    
    // Convertir a minúsculas para hacer comparaciones flexibles
    const tipoNormalizado = typeof tipo === 'string' ? tipo.toLowerCase() : '';
    
    // Identificar el tipo de solicitud
    switch(tipoNormalizado) {
      case 'horaria':
        return (
          <>
            <FaClock className="text-[#78bd00] mr-2" />
            <span>Horaria</span>
          </>
        );
      case 'diaria':
        return (
          <>
            <FaCalendarAlt className="text-[#78bd00] mr-2" />
            <span>Diaria</span>
          </>
        );
      case 'medica':
        return (
          <>
            <FaMedkit className="text-red-500 mr-2" />
            <span>Baja Médica</span>
          </>
        );
      case 'vacaciones':
        return (
          <>
            <FaPlane className="text-blue-500 mr-2" />
            <span>Vacaciones</span>
          </>
        );
      default:
        // Caso por defecto con logging para debug
        console.log('Tipo no reconocido:', tipo, 'normalizado como:', tipoNormalizado);
        console.log('Objeto completo:', solicitud);
        return (
          <>
            <FaFileAlt className="text-gray-500 mr-2" />
            <span>{tipo || 'Desconocido'}</span>
          </>
        );
    }
  };

  // Formatear fecha para mostrar
  const formatearFecha = (fechaStr) => {
    const fecha = new Date(fechaStr);
    return fecha.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  // Obtener clase de estado para el badge
  const getEstadoClass = (estado) => {
    switch (estado) {
      case 'aprobada':
        return 'bg-green-500';
      case 'rechazada':
        return 'bg-red-500';
      default:
        return 'bg-yellow-500';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Solicitudes de Ausencia</h1>
      
      {/* Tabs */}
      <div className="flex border-b mb-6">
        {user && user.tipo_usuario !== 'admin' ? (
          <>
            <button
              className={`py-2 px-4 font-medium ${activeTab === 'nueva' ? 'border-b-2 border-[#78bd00] text-[#78bd00]' : 'text-gray-500'}`}
              onClick={() => setActiveTab('nueva')}
            >
              Nueva Solicitud
            </button>
            <button
              className={`py-2 px-4 font-medium ${activeTab === 'historial' ? 'border-b-2 border-[#78bd00] text-[#78bd00]' : 'text-gray-500'}`}
              onClick={() => setActiveTab('historial')}
            >
              Historial
            </button>
          </>
        ) : (
          <button
            className={`py-2 px-4 font-medium border-b-2 border-[#78bd00] text-[#78bd00]`}
          >
            Administración
          </button>
        )}
      </div>
      
      {activeTab === 'nueva' ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-lg shadow-md p-6"
        >
          <h2 className="text-xl font-semibold mb-4">Nueva Solicitud de Ausencia</h2>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          
          {success && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
              {success}
            </div>
          )}
          
          <form onSubmit={enviarSolicitud}>
            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2">Tipo de Solicitud</label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mt-2">
                <label className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors hover:bg-gray-50 ${tipoSolicitud === 'horaria' ? 'border-[#78bd00] bg-green-50' : 'border-gray-300'}`}>
                  <input
                    type="radio"
                    className="form-radio text-[#78bd00] hidden"
                    name="tipoSolicitud"
                    value="horaria"
                    checked={tipoSolicitud === 'horaria'}
                    onChange={() => setTipoSolicitud('horaria')}
                  />
                  <FaClock className={`mr-3 ${tipoSolicitud === 'horaria' ? 'text-[#78bd00]' : 'text-gray-500'}`} size={18} />
                  <div>
                    <p className="font-medium">Ausencia Horaria</p>
                    <p className="text-xs text-gray-500">Horas dentro de un día</p>
                  </div>
                </label>
                
                <label className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors hover:bg-gray-50 ${tipoSolicitud === 'diaria' ? 'border-[#78bd00] bg-green-50' : 'border-gray-300'}`}>
                  <input
                    type="radio"
                    className="form-radio text-[#78bd00] hidden"
                    name="tipoSolicitud"
                    value="diaria"
                    checked={tipoSolicitud === 'diaria'}
                    onChange={() => setTipoSolicitud('diaria')}
                  />
                  <FaCalendarAlt className={`mr-3 ${tipoSolicitud === 'diaria' ? 'text-[#78bd00]' : 'text-gray-500'}`} size={18} />
                  <div>
                    <p className="font-medium">Ausencia Diaria</p>
                    <p className="text-xs text-gray-500">Días completos</p>
                  </div>
                </label>
                
                <label className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors hover:bg-gray-50 ${tipoSolicitud === 'medica' ? 'border-[#78bd00] bg-green-50' : 'border-gray-300'}`}>
                  <input
                    type="radio"
                    className="form-radio text-[#78bd00] hidden"
                    name="tipoSolicitud"
                    value="medica"
                    checked={tipoSolicitud === 'medica'}
                    onChange={() => setTipoSolicitud('medica')}
                  />
                  <FaMedkit className={`mr-3 ${tipoSolicitud === 'medica' ? 'text-red-500' : 'text-gray-500'}`} size={18} />
                  <div>
                    <p className="font-medium">Baja Médica</p>
                    <p className="text-xs text-gray-500">Ausencia por enfermedad</p>
                  </div>
                </label>
                
                <label className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors hover:bg-gray-50 ${tipoSolicitud === 'vacaciones' ? 'border-[#78bd00] bg-green-50' : 'border-gray-300'}`}>
                  <input
                    type="radio"
                    className="form-radio text-[#78bd00] hidden"
                    name="tipoSolicitud"
                    value="vacaciones"
                    checked={tipoSolicitud === 'vacaciones'}
                    onChange={() => setTipoSolicitud('vacaciones')}
                  />
                  <FaPlane className={`mr-3 ${tipoSolicitud === 'vacaciones' ? 'text-blue-500' : 'text-gray-500'}`} size={18} />
                  <div>
                    <p className="font-medium">Vacaciones</p>
                    <p className="text-xs text-gray-500">Periodo vacacional</p>
                  </div>
                </label>
              </div>
            </div>
            
            {tipoSolicitud === 'horaria' ? (
              <>
                <div className="mb-4">
                  <label className="block text-gray-700 font-medium mb-2">Fecha</label>
                  <DatePicker
                    selected={fechaInicio}
                    onChange={(date) => setFechaInicio(date)}
                    className="w-full p-2 border rounded"
                    dateFormat="dd/MM/yyyy"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Hora de Inicio</label>
                    <input
                      type="time"
                      className="w-full p-2 border rounded"
                      value={horaInicio}
                      onChange={(e) => setHoraInicio(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Hora de Fin</label>
                    <input
                      type="time"
                      className="w-full p-2 border rounded"
                      value={horaFin}
                      onChange={(e) => setHoraFin(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Fecha de Inicio</label>
                  <DatePicker
                    selected={fechaInicio}
                    onChange={(date) => setFechaInicio(date)}
                    selectsStart
                    startDate={fechaInicio}
                    endDate={fechaFin}
                    className="w-full p-2 border rounded"
                    dateFormat="dd/MM/yyyy"
                    minDate={new Date()}
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Fecha de Fin</label>
                  <DatePicker
                    selected={fechaFin}
                    onChange={(date) => setFechaFin(date)}
                    selectsEnd
                    startDate={fechaInicio}
                    endDate={fechaFin}
                    minDate={fechaInicio}
                    className="w-full p-2 border rounded"
                    dateFormat="dd/MM/yyyy"
                  />
                </div>
              </div>
            )}
            
            {/* Sección para cargar justificante médico */}
            {tipoSolicitud === 'medica' && (
              <div className="mb-4 p-4 border border-dashed rounded-lg border-gray-300 bg-gray-50">
                <label className="text-gray-700 font-medium mb-2 flex items-center">
                  <FaFilePdf className="mr-2 text-red-500" />
                  Justificante Médico
                </label>
                
                <div className="flex items-center mb-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileChange}
                    accept=".pdf,.jpg,.jpeg,.png"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded inline-flex items-center mr-2"
                  >
                    <FaFileUpload className="mr-2" />
                    Seleccionar archivo
                  </button>
                  <span className="text-sm text-gray-600">
                    {nombreArchivo ? nombreArchivo : 'Ningún archivo seleccionado'}
                  </span>
                </div>
                
                {errorArchivo && (
                  <div className="text-sm text-red-500 flex items-center mt-1">
                    <FaExclamationTriangle className="mr-1" />
                    {errorArchivo}
                  </div>
                )}
                
                <p className="text-xs text-gray-500 mt-1">
                  Formatos permitidos: PDF, JPG, PNG. Tamaño máximo: 5MB.
                </p>
              </div>
            )}
            
            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2">
                {tipoSolicitud === 'medica' ? 'Detalles de la Baja Médica' :
                 tipoSolicitud === 'vacaciones' ? 'Detalles de las Vacaciones' :
                 'Motivo de la Ausencia'}
              </label>
              <textarea
                className="w-full p-2 border rounded"
                rows="4"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                required
                placeholder={tipoSolicitud === 'medica' ? "Describa brevemente el motivo de su baja médica..." :
                            tipoSolicitud === 'vacaciones' ? "Indique cualquier información relevante sobre sus vacaciones..." :
                            "Describa brevemente el motivo de su solicitud..."}
              ></textarea>
            </div>
            
            <div className="flex justify-end">
              <button
                type="submit"
                className="bg-[#78bd00] hover:bg-[#69a500] text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline flex items-center"
                disabled={loading || subiendoArchivo || (tipoSolicitud === 'medica' && errorArchivo)}
              >
                {loading || subiendoArchivo ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {subiendoArchivo ? 'Subiendo archivo...' : 'Enviando solicitud...'}
                  </>
                ) : (
                  'Enviar Solicitud'
                )}
              </button>
            </div>
          </form>
        </motion.div>
      ) : activeTab === 'historial' ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-lg shadow-md p-6"
        >
          <h2 className="text-xl font-semibold mb-4">Historial de Solicitudes</h2>
          
          {loadingSolicitudes ? (
            <div className="flex justify-center items-center py-8">
              <svg className="animate-spin h-8 w-8 text-[#78bd00]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          ) : solicitudes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FaFileAlt className="mx-auto text-4xl mb-2" />
              <p>No hay solicitudes registradas</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Motivo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Comentario</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {solicitudes.map((solicitud) => (
                    <tr key={solicitud.idSolicitud}>
                      <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {renderTipoSolicitud(solicitud)}
                      </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {solicitud.tipo === 'horaria' ? (
                          <>
                            {formatearFecha(solicitud.fecha_inicio)}
                            <br />
                            <span className="text-sm text-gray-500">
                              {solicitud.hora_inicio} - {solicitud.hora_fin}
                            </span>
                          </>
                        ) : (
                          <>
                            {formatearFecha(solicitud.fecha_inicio)}
                            <br />
                            <span className="text-sm text-gray-500">
                              hasta {formatearFecha(solicitud.fecha_fin)}
                            </span>
                          </>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">{solicitud.motivo}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getEstadoClass(solicitud.estado)} text-white`}>
                          {solicitud.estado === 'pendiente' && 'Pendiente'}
                          {solicitud.estado === 'aprobada' && (
                            <>
                              <FaCheck className="mr-1" /> Aprobada
                            </>
                          )}
                          {solicitud.estado === 'rechazada' && (
                            <>
                              <FaTimes className="mr-1" /> Rechazada
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {solicitud.comentario_respuesta || '-'}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      ) : (
        // Vista de administrador
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-lg shadow-md p-6"
        >
          <h2 className="text-xl font-semibold mb-4">Administración de Solicitudes</h2>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          
          {success && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
              {success}
            </div>
          )}
          
          {loadingTodasSolicitudes ? (
            <div className="flex justify-center items-center py-8">
              <svg className="animate-spin h-8 w-8 text-[#78bd00]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          ) : todasSolicitudes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FaFileAlt className="mx-auto text-4xl mb-2" />
              <p>No hay solicitudes registradas</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Empleado</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Motivo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {todasSolicitudes.map((solicitud) => (
                    <tr key={solicitud.idSolicitud} className={solicitud.estado === 'pendiente' ? 'bg-yellow-50' : ''}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <FaUserAlt className="text-gray-500 mr-2" />
                          <span>{solicitud.nombre || solicitud.NIF}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
  {renderTipoSolicitud(solicitud)}
</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {solicitud.tipo === 'horaria' ? (
                          <>
                            {formatearFecha(solicitud.fecha_inicio)}
                            <br />
                            <span className="text-sm text-gray-500">
                              {solicitud.hora_inicio} - {solicitud.hora_fin}
                            </span>
                          </>
                        ) : (
                          <>
                            {formatearFecha(solicitud.fecha_inicio)}
                            <br />
                            <span className="text-sm text-gray-500">
                              hasta {formatearFecha(solicitud.fecha_fin)}
                            </span>
                          </>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">{solicitud.motivo}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getEstadoClass(solicitud.estado)} text-white`}>
                          {solicitud.estado === 'pendiente' && 'Pendiente'}
                          {solicitud.estado === 'aprobada' && (
                            <>
                              <FaCheck className="mr-1" /> Aprobada
                            </>
                          )}
                          {solicitud.estado === 'rechazada' && (
                            <>
                              <FaTimes className="mr-1" /> Rechazada
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {solicitud.estado === 'pendiente' && (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => abrirModalRespuesta(solicitud, 'aprobar')}
                              className="text-green-600 hover:text-green-900 bg-green-100 hover:bg-green-200 px-2 py-1 rounded transition-colors duration-200"
                            >
                              <FaCheck className="inline mr-1" /> Aprobar
                            </button>
                            <button
                              onClick={() => abrirModalRespuesta(solicitud, 'rechazar')}
                              className="text-red-600 hover:text-red-900 bg-red-100 hover:bg-red-200 px-2 py-1 rounded transition-colors duration-200"
                            >
                              <FaTimes className="inline mr-1" /> Rechazar
                            </button>
                          </div>
                        )}
                        {solicitud.estado !== 'pendiente' && (
                          <div className="text-gray-500">
                            <FaCommentAlt className="inline mr-1" />
                            {solicitud.comentario_respuesta ? 'Comentario: ' + solicitud.comentario_respuesta : 'Sin comentarios'}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {/* Modal para responder solicitudes */}
          {modalRespuesta && solicitudSeleccionada && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <h3 className="text-xl font-semibold mb-4">
                  {accionRespuesta === 'aprobar' ? 'Aprobar Solicitud' : 'Rechazar Solicitud'}
                </h3>
                
                <p className="mb-4">
                  <span className="font-medium">Empleado:</span> {solicitudSeleccionada.nombre || solicitudSeleccionada.NIF}
                </p>
                
                <p className="mb-4">
  <span className="font-medium">Tipo:</span> <span className="flex items-center inline-flex mt-1">
    {renderTipoSolicitud(solicitudSeleccionada)}
  </span>
</p>
                
                <p className="mb-4">
                  <span className="font-medium">Fecha:</span> {formatearFecha(solicitudSeleccionada.fecha_inicio)}
                  {solicitudSeleccionada.tipo === 'horaria' ? 
                    ` (${solicitudSeleccionada.hora_inicio} - ${solicitudSeleccionada.hora_fin})` : 
                    ` hasta ${formatearFecha(solicitudSeleccionada.fecha_fin)}`
                  }
                </p>
                
                <p className="mb-4">
                  <span className="font-medium">Motivo:</span> {solicitudSeleccionada.motivo}
                </p>
                
                <div className="mb-4">
                  <label className="block text-gray-700 font-medium mb-2">Comentario (opcional)</label>
                  <textarea
                    className="w-full p-2 border rounded"
                    rows="3"
                    value={comentarioRespuesta}
                    onChange={(e) => setComentarioRespuesta(e.target.value)}
                    placeholder="Añada un comentario a su respuesta"
                  ></textarea>
                </div>
                
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => setModalRespuesta(false)}
                    className="bg-gray-300 text-gray-800 py-2 px-4 rounded hover:bg-gray-400 transition-colors duration-300"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => responderSolicitud(accionRespuesta === 'aprobar' ? 'aprobada' : 'rechazada')}
                    className={`text-white py-2 px-4 rounded transition-colors duration-300 flex items-center ${accionRespuesta === 'aprobar' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Procesando...
                      </>
                    ) : (
                      <>
                        {accionRespuesta === 'aprobar' ? <FaCheck className="mr-2" /> : <FaTimes className="mr-2" />}
                        {accionRespuesta === 'aprobar' ? 'Aprobar' : 'Rechazar'}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default Solicitudes;