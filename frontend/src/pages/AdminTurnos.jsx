import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { 
  FaUserClock, FaCalendarAlt, FaPlus, FaEdit, 
  FaTrash, FaUserAlt, FaFilter, FaSearch,
  FaExclamationTriangle, FaCheckCircle, FaTimesCircle, FaRedo
} from 'react-icons/fa';

// URL base para las peticiones API
const API_URL = 'http://localhost/ImpulsaTelecom/backend/api';

const AdminTurnos = () => {
  const { user, token } = useAuth(); // Extraemos el token del contexto de auth
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  
  // Estados para gestionar datos y UI
  const [usuarios, setUsuarios] = useState([]);
  const [horarios, setHorarios] = useState([]);
  const [turnos, setTurnos] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showTurnoModal, setShowTurnoModal] = useState(false);
  const [turnoFormData, setTurnoFormData] = useState({
    nif_usuario: '',
    id_horario: '',
    orden: 1,
    dias_semana: '1,2,3,4,5',
    semanas_mes: '1,2,3,4,5',
    nombre: ''
  });
  const [editTurnoId, setEditTurnoId] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [turnoToDelete, setTurnoToDelete] = useState(null);
  const [loadingAction, setLoadingAction] = useState(false);
  const [incluirInactivos, setIncluirInactivos] = useState(false);
  const [turnoInactivoSimilar, setTurnoInactivoSimilar] = useState(null);
  const [showReactivarModal, setShowReactivarModal] = useState(false);
  const [loadingReactivar, setLoadingReactivar] = useState(false);

  // Verificar autenticación y permisos
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (user.tipo_usuario !== 'admin') {
      navigate('/');
      return;
    }

    // Cargar datos iniciales
    fetchUsuarios();
    fetchHorarios();
  }, [user, navigate]);

  // Cargar turnos de un usuario específico
  const loadTurnosByUser = async (nif) => {
    if (!nif) {
      setTurnos([]);
      return;
    }

    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/turnos.php?usuario=${nif}${incluirInactivos ? '&incluir_inactivos=true' : ''}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setTurnos(response.data.turnos || []);
        setError(null);
      } else {
        console.error('Error al cargar los turnos:', response.data.error);
        setError('No se pudieron cargar los turnos. ' + response.data.error);
        setTurnos([]);
      }
    } catch (err) {
      console.error('Error al hacer la solicitud:', err);
      setError('Error de conexión al servidor.');
      setTurnos([]);
    } finally {
      setLoading(false);
    }
  };

  // Función para cargar usuarios desde la API
  const fetchUsuarios = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/usuarios.php?action=list`, {
        withCredentials: true
      });

      if (response.data.success) {
        setUsuarios(response.data.usuarios);
      } else {
        setError(`Error al cargar usuarios: ${response.data.error || 'Error desconocido'}`);
      }
    } catch (err) {
      setError(`Error de conexión: ${err.message}`);
      console.error('Error al cargar usuarios:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Función para cargar horarios
  const fetchHorarios = async () => {
    try {
      const response = await axios.get(`${API_URL}/horarios.php?action=list`, {
        withCredentials: true
      });
      if (response.data.success) {
        setHorarios(response.data.horarios || []);
      } else {
        console.error('Error al cargar horarios:', response.data.error);
      }
    } catch (error) {
      console.error('Error al cargar horarios:', error);
    }
  };
  
  // Función para verificar solapamiento de horarios en el frontend
  const verificarSolapamientoHorarios = (turnoData, turnoIdExcluir = null) => {
    // Si no hay turnos o no hay horarios cargados, no podemos verificar
    if (!turnos.length || !horarios.length) {
      return { existe: false };
    }
    
    // Obtener datos del horario seleccionado
    const horarioSeleccionado = horarios.find(h => h.id === turnoData.id_horario);
    if (!horarioSeleccionado) {
      return { existe: false }; // No podemos verificar sin datos del horario
    }
    
    const horaInicioNuevo = horarioSeleccionado.hora_inicio;
    const horaFinNuevo = horarioSeleccionado.hora_fin;
    const diasSemana = turnoData.dias_semana.split(',');
    const semanasMes = turnoData.semanas_mes.split(',');
    
    // Verificar cada turno existente
    for (const turno of turnos) {
      // No comparar con el mismo turno que estamos editando
      if (turnoIdExcluir && turno.id === turnoIdExcluir) {
        continue;
      }
      
      // Buscar el horario de este turno
      const horarioTurno = horarios.find(h => h.id === turno.id_horario);
      if (!horarioTurno) continue;
      
      // Verificar solapamiento de días
      const diasTurno = turno.dias_semana.split(',');
      const diasComunes = diasTurno.filter(dia => diasSemana.includes(dia));
      if (!diasComunes.length) continue; // No hay días comunes
      
      // Verificar solapamiento de semanas
      const semanasTurno = turno.semanas_mes ? turno.semanas_mes.split(',') : ['1', '2', '3', '4', '5'];
      const semanasComunes = semanasTurno.filter(semana => semanasMes.includes(semana));
      if (!semanasComunes.length) continue; // No hay semanas comunes
      
      // Verificar solapamiento de horas
      const horaInicioExistente = horarioTurno.hora_inicio;
      const horaFinExistente = horarioTurno.hora_fin;
      
      // Hay solapamiento si:
      // 1. La hora de inicio del nuevo está dentro del rango del existente
      // 2. La hora de fin del nuevo está dentro del rango del existente
      // 3. El nuevo turno engloba completamente al existente
      if ((horaInicioNuevo >= horaInicioExistente && horaInicioNuevo < horaFinExistente) ||
          (horaFinNuevo > horaInicioExistente && horaFinNuevo <= horaFinExistente) ||
          (horaInicioNuevo <= horaInicioExistente && horaFinNuevo >= horaFinExistente)) {
        
        // Encontramos un solapamiento
        return {
          existe: true,
          detalle: `${turno.nombre} (${horaInicioExistente} - ${horaFinExistente})`,
          turno: turno
        };
      }
    }
    
    // No se encontró solapamiento
    return { existe: false };
  };

  // Función para cargar turnos de un usuario
  const fetchTurnos = useCallback(async (nif) => {
    if (!nif) return;
    
    try {
      const response = await axios.get(`${API_URL}/turnos.php?usuario=${nif}`, {
        withCredentials: true
      });

      if (response.data.success) {
        setTurnos(response.data.turnos || []);
      } else {
        setTurnos([]);
      }
    } catch (err) {
      console.error('Error al cargar turnos:', err);
      setTurnos([]);
    }
  }, []);

  // Manejar selección de usuario
  const handleUserSelect = useCallback((usuario) => {
    // Obtener el NIF del usuario (está en usuario.id en lugar de usuario.NIF)
    const nifUsuario = usuario?.id;
    
    if (!usuario || !nifUsuario) {
      console.error('Error: Usuario seleccionado sin identificador', usuario);
      setErrorMessage('Error al seleccionar usuario: identificador no disponible');
      return;
    }
    
    console.log('Usuario seleccionado con ID/NIF:', nifUsuario);
    setSelectedUser({
      ...usuario,
      NIF: nifUsuario  // Asegurarnos de que tenga la propiedad NIF para compatibilidad
    });
    fetchTurnos(nifUsuario);
    // Limpiar mensajes
    setSuccessMessage('');
    setErrorMessage('');
  }, [fetchTurnos]);

  // Filtrar usuarios por término de búsqueda
  const filteredUsuarios = usuarios.filter(usuario => {
    const searchTermLower = searchTerm.toLowerCase();
    return (
      (usuario.nombre?.toLowerCase().includes(searchTermLower) || false) ||
      (usuario.apellidos?.toLowerCase().includes(searchTermLower) || false) ||
      (usuario.NIF?.toLowerCase().includes(searchTermLower) || false) ||
      (usuario.correo?.toLowerCase().includes(searchTermLower) || false)
    );
  });

  // Formatear días de la semana
  const formatDiasSemana = (diasStr) => {
    if (!diasStr) return 'No especificado';
    
    const diasMap = {
      '1': 'Lunes',
      '2': 'Martes',
      '3': 'Miércoles',
      '4': 'Jueves',
      '5': 'Viernes',
      '6': 'Sábado',
      '7': 'Domingo'
    };
    
    return diasStr.split(',')
      .map(dia => diasMap[dia.trim()] || '')
      .filter(Boolean)
      .join(', ');
  };

  // Formatear semanas del mes
  const formatSemanasMes = (semanasStr) => {
    if (!semanasStr) return 'No especificado';
    
    const semanasMap = {
      '1': 'Primera',
      '2': 'Segunda',
      '3': 'Tercera',
      '4': 'Cuarta',
      '5': 'Quinta'
    };
    
    return semanasStr.split(',')
      .map(semana => semanasMap[semana.trim()] || '')
      .filter(Boolean)
      .join(', ');
  };

  // Función para abrir modal de nuevo turno
  const handleOpenNewTurnoModal = () => {
    // El NIF puede estar en selectedUser.NIF (tras nuestra normalización) o en selectedUser.id (original)
    const nifUsuario = selectedUser?.NIF || selectedUser?.id;
    
    if (!selectedUser || !nifUsuario) {
      setErrorMessage('Error: No se pudo obtener el identificador del usuario seleccionado');
      return;
    }
    
    console.log('Usuario seleccionado:', selectedUser);
    
    // Resetear mensajes de error al abrir un nuevo modal
    setErrorMessage('');
    setSuccessMessage('');
    
    setTurnoFormData({
      nif_usuario: nifUsuario,
      id_horario: '',
      orden: turnos.length + 1,
      dias_semana: '1,2,3,4,5',
      semanas_mes: '1,2,3,4,5',
      nombre: `Turno ${turnos.length + 1}`
    });
    setEditTurnoId(null);
    setShowTurnoModal(true);
  };

  // Función para abrir modal de edición de turno
  const handleOpenEditTurnoModal = (turno) => {
    // Asegurar que tenemos un valor válido para nif_usuario
    const nifUsuario = turno.nif_usuario || selectedUser?.NIF || selectedUser?.id;
    
    if (!nifUsuario) {
      setErrorMessage('Error: No se pudo determinar el NIF del usuario para este turno');
      return;
    }
    
    setTurnoFormData({
      nif_usuario: nifUsuario,
      id_horario: turno.id_horario,
      orden: turno.orden,
      dias_semana: turno.dias_semana || '1,2,3,4,5',
      semanas_mes: turno.semanas_mes || '1,2,3,4,5',
      nombre: turno.nombre || `Turno ${turno.orden}`
    });
    setEditTurnoId(turno.id);
    setShowTurnoModal(true);
  };
  
  // Función para confirmar eliminación de turno
  const handleConfirmDeleteTurno = (turno) => {
    setTurnoToDelete(turno);
    setShowDeleteConfirm(true);
  };
  
  // Función para buscar turno inactivo similar
  const buscarTurnoInactivoSimilar = async (formData) => {
    try {
      const response = await axios.post(
        `${API_URL}/turnos.php?action=buscar_similar`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success && response.data.encontrado) {
        setTurnoInactivoSimilar(response.data.turno);
        setShowReactivarModal(true);
        return true; // Se encontró un turno inactivo similar
      }
      return false; // No se encontró un turno similar
    } catch (err) {
      console.error('Error al buscar turno similar:', err);
      return false;
    }
  };

  // Función para desactivar un turno
  const handleDesactivarTurno = async (id) => {
    try {
      setLoadingAction(true);
      setErrorMessage('');

      const response = await axios.post(
        `${API_URL}/turnos.php?action=desactivar&id=${id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setSuccessMessage('Turno desactivado correctamente');
        // Recargar turnos para asegurarnos de tener datos actualizados
        if (selectedUser) {
          const nifUsuario = selectedUser?.NIF || selectedUser?.id;
          if (nifUsuario) {
            loadTurnosByUser(nifUsuario);
          }
        }
        setShowDeleteConfirm(false);
        setTurnoToDelete(null);
      } else {
        setErrorMessage(`Error: ${response.data.error || 'Hubo un problema al desactivar el turno'}`);
      }
    } catch (err) {
      console.error('Error al desactivar el turno:', err);
      setErrorMessage(`Error: ${err.response?.data?.error || err.message || 'Hubo un problema al desactivar el turno'}`);
    } finally {
      setLoadingAction(false);
    }
  };

  // Función para reactivar un turno
  const handleReactivarTurno = async (id) => {
    try {
      setLoadingReactivar(true);
      setErrorMessage('');

      const response = await axios.post(
        `${API_URL}/turnos.php?action=reactivar&id=${id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setSuccessMessage('Turno reactivado correctamente');
        // Recargar turnos para asegurarnos de tener datos actualizados
        if (selectedUser) {
          const nifUsuario = selectedUser?.NIF || selectedUser?.id;
          if (nifUsuario) {
            loadTurnosByUser(nifUsuario);
          }
        }
        setShowReactivarModal(false);
        setTurnoInactivoSimilar(null);
      } else {
        setErrorMessage(`Error: ${response.data.error || 'Hubo un problema al reactivar el turno'}`);
      }
    } catch (err) {
      console.error('Error al reactivar el turno:', err);
      setErrorMessage(`Error: ${err.response?.data?.error || err.message || 'Hubo un problema al reactivar el turno'}`);
    } finally {
      setLoadingReactivar(false);
    }
  };

  // Función para guardar turno (crear o actualizar)
  const handleSaveTurno = async () => {
    // Validar datos requeridos
    if (!turnoFormData.id_horario) {
      setErrorMessage('Por favor selecciona un horario');
      return;
    }

    // Verificar que tenemos el NIF del usuario
    if (!turnoFormData.nif_usuario) {
      // Intentar obtener el NIF nuevamente del usuario seleccionado
      if (selectedUser && selectedUser.NIF) {
        setTurnoFormData(prev => ({
          ...prev,
          nif_usuario: selectedUser.NIF
        }));
      } else {
        setErrorMessage('Error: No se pudo obtener el NIF del usuario. Por favor, selecciona el usuario nuevamente.');
        return;
      }
    }

    // Verificar solapamientos con otros turnos
    const solapamiento = verificarSolapamientoHorarios(turnoFormData, editTurnoId);
    if (solapamiento.existe) {
      setErrorMessage(`No se puede asignar este turno porque se solapa con: ${solapamiento.detalle}`);
      return;
    }
    
    // Si estamos creando un nuevo turno, verificar si existe uno inactivo similar
    if (!editTurnoId) {
      const encontrado = await buscarTurnoInactivoSimilar(turnoFormData);
      if (encontrado) {
        return; // Detener la creación y mostrar modal de reactivación
      }
    }
    
    try {
      let url;
      
      if (editTurnoId) {
        // Actualizar turno existente
        url = `${API_URL}/turnos.php?action=update&id=${editTurnoId}`;
      } else {
        // Crear nuevo turno
        url = `${API_URL}/turnos.php?action=create`;
      }

      const response = await axios.post(url, turnoFormData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setSuccessMessage(editTurnoId ? 'Turno actualizado correctamente' : 'Turno creado correctamente');
        setShowTurnoModal(false);
        // Recargar los turnos del usuario seleccionado
        const nifUsuario = selectedUser?.NIF || selectedUser?.id;
        if (nifUsuario) {
          loadTurnosByUser(nifUsuario);
        }
        // Limpiar formulario
        resetTurnoForm();
      } else {
        setErrorMessage(`Error: ${response.data.error || 'Hubo un problema al procesar la solicitud'}`);
      }
    } catch (err) {
      console.error('Error al guardar el turno:', err);
      setErrorMessage(`Error: ${err.response?.data?.error || err.message || 'Hubo un problema al procesar la solicitud'}`);
    }
  };
  
  // Función para resetear el formulario de turnos
  const resetTurnoForm = () => {
    setTurnoFormData({
      nif_usuario: selectedUser?.NIF || '',
      id_horario: '',
      orden: 1,
      dias_semana: '1,2,3,4,5',
      semanas_mes: '1,2,3,4,5',
      nombre: ''
    });
    setEditTurnoId(null);
  };

  // Función para eliminar/desactivar turno
  const handleDeleteTurno = async () => {
    if (!turnoToDelete) return;
    
    try {
      setLoadingAction(true); // Indicar que hay una acción en progreso
      
      // Usar el endpoint de desactivación en lugar de eliminación permanente
      const response = await axios.post(
        `${API_URL}/turnos.php?action=desactivar&id=${turnoToDelete.id}`, 
        {}, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        setSuccessMessage(`Turno "${turnoToDelete.nombre}" desactivado correctamente`);
        // Cerrar modal de confirmación
        setShowDeleteConfirm(false);
        setTurnoToDelete(null);
        
        // Recargar turnos para asegurarnos de tener datos actualizados
        if (selectedUser) {
          const nifUsuario = selectedUser?.NIF || selectedUser?.id;
          if (nifUsuario) {
            loadTurnosByUser(nifUsuario);
          }
        }
        
        // Limpiar mensaje después de 3 segundos
        setTimeout(() => {
          setSuccessMessage('');
        }, 3000);
      } else {
        setErrorMessage(`Error al desactivar turno: ${response.data.error || 'Error desconocido'}`);
      }
    } catch (err) {
      console.error('Error al desactivar turno:', err);
      setErrorMessage(`Error de conexión: ${err.message}`);
    } finally {
      setLoadingAction(false);
    }
  };

  // Manejar cambios en el formulario de turno
  const handleTurnoFormChange = (e) => {
    const { name, value } = e.target;
    setTurnoFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Manejar cambios en la selección de días de la semana
  const handleDiasSemanaChange = (dia) => {
    const diasArray = turnoFormData.dias_semana.split(',').map(d => d.trim());
    
    if (diasArray.includes(dia)) {
      // Remover día si ya está seleccionado
      const newDias = diasArray.filter(d => d !== dia).join(',');
      setTurnoFormData(prev => ({
        ...prev,
        dias_semana: newDias
      }));
    } else {
      // Añadir día si no está seleccionado
      diasArray.push(dia);
      // Ordenar días de la semana (1-7)
      const sortedDias = diasArray
        .filter(Boolean)
        .sort((a, b) => parseInt(a) - parseInt(b))
        .join(',');
      
      setTurnoFormData(prev => ({
        ...prev,
        dias_semana: sortedDias
      }));
    }
  };
  
  // Manejar cambios en la selección de semanas del mes
  const handleSemanasMesChange = (semana) => {
    const semanasArray = turnoFormData.semanas_mes.split(',').map(s => s.trim());
    
    if (semanasArray.includes(semana)) {
      // Remover semana si ya está seleccionada
      const newSemanas = semanasArray.filter(s => s !== semana).join(',');
      setTurnoFormData(prev => ({
        ...prev,
        semanas_mes: newSemanas
      }));
    } else {
      // Añadir semana si no está seleccionada
      semanasArray.push(semana);
      // Ordenar semanas del mes (1-5)
      const sortedSemanas = semanasArray
        .filter(Boolean)
        .sort((a, b) => parseInt(a) - parseInt(b))
        .join(',');
      
      setTurnoFormData(prev => ({
        ...prev,
        semanas_mes: sortedSemanas
      }));
    }
  };

  // Componente para renderizar el selector de días de la semana
  const DiasSemanaSelector = () => {
    const dias = [
      { id: '1', nombre: 'Lunes' },
      { id: '2', nombre: 'Martes' },
      { id: '3', nombre: 'Miércoles' },
      { id: '4', nombre: 'Jueves' },
      { id: '5', nombre: 'Viernes' },
      { id: '6', nombre: 'Sábado' },
      { id: '7', nombre: 'Domingo' }
    ];
    
    const diasSeleccionados = turnoFormData.dias_semana.split(',').map(d => d.trim());
    
    return (
      <div className="grid grid-cols-4 gap-2">
        {dias.map(dia => (
          <div 
            key={dia.id}
            onClick={() => handleDiasSemanaChange(dia.id)}
            className={`cursor-pointer p-2 rounded text-center ${diasSeleccionados.includes(dia.id) ? 
              'bg-blue-600 text-white' : 
              isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}
          >
            {dia.nombre}
          </div>
        ))}
      </div>
    );
  };

  // Componente para renderizar el selector de semanas del mes
  const SemanasMesSelector = () => {
    const semanas = [
      { id: '1', nombre: 'Primera' },
      { id: '2', nombre: 'Segunda' },
      { id: '3', nombre: 'Tercera' },
      { id: '4', nombre: 'Cuarta' },
      { id: '5', nombre: 'Quinta' }
    ];
    
    const semanasSeleccionadas = turnoFormData.semanas_mes.split(',').map(s => s.trim());
    
    return (
      <div className="grid grid-cols-3 gap-2">
        {semanas.map(semana => (
          <div 
            key={`semana-${semana.id}`}
            onClick={() => handleSemanasMesChange(semana.id)}
            className={`cursor-pointer p-2 rounded text-center ${semanasSeleccionadas.includes(semana.id) ? 
              'bg-blue-600 text-white' : 
              isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}
          >
            {semana.nombre}
          </div>
        ))}
      </div>
    );
  };
  
  // Renderizado del componente principal
  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-800'} p-4`}>
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold mb-6 flex items-center">
          <FaUserClock className="mr-2" />
          Administración de Turnos
        </h1>
        
        {/* Mensajes de éxito o error */}
        {successMessage && (
          <div className={`p-4 mb-4 text-sm font-medium rounded-lg border-l-4 border-green-500 
          ${isDarkMode ? 'bg-green-900 bg-opacity-20 text-green-300' : 'bg-green-50 text-green-800 border border-green-100'}`}>
            {successMessage}
          </div>
        )}
        {errorMessage && (
          <div className={`p-4 mb-4 text-sm font-medium rounded-lg border-l-4 border-red-500
          ${isDarkMode ? 'bg-red-900 bg-opacity-20 text-red-300' : 'bg-red-50 text-red-800 border border-red-100'}`}>
            {errorMessage}
            {errorMessage.includes('solapa') && (
              <button 
                className="ml-2 text-xs font-medium underline"
                onClick={() => setErrorMessage('')}
              >
                Entendido
              </button>
            )}
          </div>
        )}
        
        {/* Buscador de usuarios */}
        <div className={`mb-6 p-4 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white shadow'}`}>
          <h2 className="text-xl font-semibold mb-3 flex items-center">
            <FaSearch className="mr-2" />
            Buscar usuario
          </h2>
          
          <div className="flex">
            <input
              type="text"
              placeholder="Buscar por nombre, apellidos, NIF o correo..."
              className={`flex-grow p-2 rounded-l border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button 
              className="bg-blue-600 text-white px-4 py-2 rounded-r hover:bg-blue-700"
              onClick={() => setSearchTerm('')}
            >
              Limpiar
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Lista de usuarios */}
          <div className={`md:col-span-1 p-4 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white shadow'}`}>
            <h2 className="text-xl font-semibold mb-3 flex items-center">
              <FaUserAlt className="mr-2" />
              Usuarios
            </h2>
            
            {loading ? (
              <p>Cargando usuarios...</p>
            ) : error ? (
              <p className="text-red-500">{error}</p>
            ) : filteredUsuarios.length === 0 ? (
              <p>No se encontraron usuarios</p>
            ) : (
              <div className="max-h-[600px] overflow-y-auto">
                {filteredUsuarios.map(usuario => (
                  <div 
                    key={usuario.id || usuario.NIF}
                    onClick={() => handleUserSelect(usuario)}
                    className={`p-3 mb-2 rounded cursor-pointer ${(selectedUser?.NIF === usuario.NIF || selectedUser?.NIF === usuario.id) ? 
                      'bg-blue-100 text-blue-800' : 
                      isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                  >
                    <div className="font-medium">{usuario.nombre} {usuario.apellidos}</div>
                    <div className="text-sm">{usuario.id || usuario.NIF}</div>
                    <div className="text-sm">{usuario.correo || 'Sin correo'}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Gestión de turnos */}
          <div className={`md:col-span-2 p-4 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white shadow'}`}>
            {selectedUser ? (
              <>
                <style>
                  {!isDarkMode && `
                    .turno-table { border-collapse: separate !important; border-spacing: 0 !important; }
                    .turno-table thead tr { background-color: #dbeafe !important; color: #1e40af !important; font-weight: 600 !important; }
                    .turno-table thead th { border-bottom: 2px solid #bfdbfe !important; }
                    .turno-table tbody { background-color: white !important; }
                    .turno-table tbody tr:not(.inactive-row) { background-color: white !important; color: #1f2937 !important; }
                    .turno-table tbody tr:not(.inactive-row):hover { background-color: #eff6ff !important; }
                    .turno-table tbody tr.inactive-row { background-color: #f3f4f6 !important; color: #6b7280 !important; }
                    .turno-table td, .turno-table th { padding: 12px 16px !important; }
                    .turno-table .action-btn { box-shadow: 0 1px 2px rgba(0,0,0,0.05) !important; }
                    .turno-table .action-btn.edit { background-color: #3b82f6 !important; color: white !important; }
                    .turno-table .action-btn.delete { background-color: #ef4444 !important; color: white !important; }
                    .turno-table .action-btn.reactivate { background-color: #10b981 !important; color: white !important; }
                  `}
                </style>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold flex items-center">
                    <FaUserClock className="mr-2" />
                    Turnos de {selectedUser.nombre} {selectedUser.apellidos}
                  </h2>
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={incluirInactivos}
                        onChange={() => {
                          setIncluirInactivos(!incluirInactivos);
                          loadTurnosByUser(selectedUser.NIF || selectedUser.id);
                        }}
                        className="form-checkbox h-4 w-4 text-blue-600 transition duration-150 ease-in-out"
                      />
                      <span className="ml-2 text-sm">
                        Mostrar turnos inactivos
                      </span>
                    </label>
                    <button
                      onClick={handleOpenNewTurnoModal}
                      className="bg-green-600 hover:bg-green-700 text-white py-1 px-3 rounded-md flex items-center"
                    >
                      <FaPlus className="mr-1" /> Nuevo Turno
                    </button>
                  </div>
                </div>

                {turnos.length === 0 ? (
                <div className="p-6 text-center">
                  <FaExclamationTriangle className="text-yellow-500 text-4xl mx-auto mb-3" />
                  <p className="mb-2">No hay turnos asignados para este usuario.</p>
                  <p className="text-sm">Haz clic en "Nuevo Turno" para asignar un horario.</p>
                </div>
              ) : (
                <div className="overflow-x-auto mt-4">
                  <table className="turno-table min-w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden border border-gray-300 dark:border-gray-700">
                    <thead>
                      <tr className="bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-white">
                        <th className="py-2 px-4 text-left">Horario</th>
                        <th className="py-2 px-4 text-left">Hora Inicio</th>
                        <th className="py-2 px-4 text-left">Hora Fin</th>
                        <th className="py-2 px-4 text-left">Días</th>
                        <th className="py-2 px-4 text-left">Semanas</th>
                        <th className="py-2 px-4 text-left">Estado</th>
                        <th className="py-2 px-4 text-left">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800">
                      {turnos.length > 0 ? (
                        turnos.map(turno => (
                          <tr 
                            key={turno.id} 
                            className={`border-b ${turno.activo === '0' || turno.activo === 0 
                              ? 'inactive-row bg-gray-100 dark:bg-gray-900 text-gray-500 dark:text-gray-400 border-red-200 dark:border-red-900' 
                              : 'bg-white hover:bg-blue-50 dark:bg-gray-800 dark:hover:bg-blue-900 dark:hover:bg-opacity-20 border-gray-200 dark:border-gray-700'}`}
                          >
                            <td className={`py-2 px-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-800'}`}>{turno.nombre_horario}</td>
                            <td className={`py-2 px-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-800'}`}>{turno.hora_inicio}</td>
                            <td className={`py-2 px-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-800'}`}>{turno.hora_fin}</td>
                            <td className={`py-2 px-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-800'}`}>{formatDiasSemana(turno.dias_semana)}</td>
                            <td className={`py-2 px-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-800'}`}>{formatSemanasMes(turno.semanas_mes)}</td>
                            <td className="py-2 px-4">
                              {turno.activo === '1' || turno.activo === 1 ? (
                                <span className="px-3 py-1 bg-green-100 dark:bg-green-900 dark:bg-opacity-50 text-green-800 dark:text-green-300 rounded-full text-xs font-bold flex items-center w-fit">
                                  <span className="h-2 w-2 rounded-full bg-green-500 dark:bg-green-400 mr-1.5"></span>
                                  Activo
                                </span>
                              ) : (
                                <span className="px-3 py-1 bg-red-100 dark:bg-red-900 dark:bg-opacity-50 text-red-800 dark:text-red-300 rounded-full text-xs font-bold flex items-center w-fit">
                                  <span className="h-2 w-2 rounded-full bg-red-500 dark:bg-red-400 mr-1.5"></span>
                                  Inactivo
                                </span>
                              )}
                            </td>
                            <td className="py-2 px-4 flex space-x-2">
                              {turno.activo === '1' || turno.activo === 1 ? (
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => handleOpenEditTurnoModal(turno)}
                                    className="action-btn edit bg-blue-500 hover:bg-blue-600 text-white py-1.5 px-2.5 rounded-md text-sm flex items-center justify-center shadow-sm transition-all duration-200 hover:shadow-md"
                                    title="Editar turno"
                                  >
                                    <FaEdit className="text-white" />
                                  </button>
                                  <button
                                    onClick={() => handleConfirmDeleteTurno(turno)}
                                    className="action-btn delete bg-red-500 hover:bg-red-600 text-white py-1.5 px-2.5 rounded-md text-sm flex items-center justify-center shadow-sm transition-all duration-200 hover:shadow-md"
                                    title="Desactivar turno"
                                  >
                                    <FaTrash className="text-white" />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => handleReactivarTurno(turno.id)}
                                  className="action-btn reactivate bg-green-500 hover:bg-green-600 text-white py-1.5 px-2.5 rounded-md text-sm flex items-center justify-center shadow-sm transition-all duration-200 hover:shadow-md"
                                  title="Reactivar turno"
                                >
                                  <FaRedo className="text-white" />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="7" className="py-8 px-4 text-center">
                            <div className="flex flex-col items-center justify-center space-y-2">
                              <FaExclamationTriangle className="text-yellow-500 dark:text-yellow-400 text-3xl mb-2" />
                              <p className="text-gray-700 dark:text-gray-300 font-medium text-lg">
                                No hay turnos {incluirInactivos ? '' : 'activos'} asignados para este usuario.
                              </p>
                              <p className="text-gray-500 dark:text-gray-400 text-sm">
                                Haz clic en "Nuevo Turno" para asignar un horario.
                              </p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          ) : (
            <div className="p-6 text-center">
              <FaUserAlt className="text-gray-400 text-4xl mx-auto mb-3" />
              <p>Selecciona un usuario para gestionar sus turnos</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal para crear/editar turno */}
      {showTurnoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`max-w-lg w-full p-6 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <h2 className="text-xl font-semibold mb-4">
              {editTurnoId ? 'Editar Turno' : 'Nuevo Turno'}
            </h2>

            <div className="mb-4">
              <label className="block mb-1">Nombre del turno</label>
              <input
                type="text"
                name="nombre"
                value={turnoFormData.nombre}
                onChange={handleTurnoFormChange}
                className={`w-full p-2 rounded border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                placeholder="Ej: Turno Mañana"
              />
            </div>

            <div className="mb-4">
              <label className="block mb-1">Horario</label>
              <select
                name="id_horario"
                value={turnoFormData.id_horario}
                onChange={handleTurnoFormChange}
                className={`w-full p-2 rounded border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
              >
                <option value="">Seleccionar horario</option>
                {horarios.map(horario => (
                  <option key={`horario-${horario.id}`} value={horario.id}>
                    {horario.nombre} ({horario.hora_inicio} - {horario.hora_fin})
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="block mb-1">Días de la semana</label>
              <DiasSemanaSelector />
            </div>

            <div className="mb-4">
              <label className="block mb-1">Semanas del mes</label>
              <SemanasMesSelector />
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowTurnoModal(false)}
                className={`px-4 py-2 rounded ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}
              >
                Cancelar
              </button>
              <button
                onClick={() => handleSaveTurno(false)}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación de eliminación */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full dark:bg-gray-800">
            <h3 className="text-lg font-bold mb-4 dark:text-white">
              Confirmar desactivación
            </h3>
            <p className="mb-4 dark:text-gray-300">
              ¿Estás seguro de que quieres desactivar el turno <strong className="text-red-600">{turnoToDelete?.nombre || `Turno ${turnoToDelete?.orden}`}</strong>?
            </p>
            <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">
              El turno quedará inactivo pero podrás reactivarlo más adelante si lo necesitas.
            </p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 border rounded hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700 dark:text-white"
                disabled={loadingAction}
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteTurno}
                className={`px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 flex items-center justify-center ${loadingAction ? 'opacity-75 cursor-not-allowed' : ''}`}
                disabled={loadingAction}
              >
                {loadingAction ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Desactivando...
                  </>
                ) : (
                  'Desactivar'
                )}
              </button>
                <label className="block mb-1">Nombre del turno</label>
                <input
                  type="text"
                  name="nombre"
                  value={turnoFormData.nombre}
                  onChange={handleTurnoFormChange}
                  className={`w-full p-2 rounded border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                  placeholder="Ej: Turno Mañana"
                />
              </div>
              
              <div className="mb-4">
                <label className="block mb-1">Horario</label>
                <select
                  name="id_horario"
                  value={turnoFormData.id_horario}
                  onChange={handleTurnoFormChange}
                  className={`w-full p-2 rounded border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                >
                  <option value="">Seleccionar horario</option>
                  {horarios.map(horario => (
                    <option key={`horario-${horario.id}`} value={horario.id}>
                      {horario.nombre} ({horario.hora_inicio} - {horario.hora_fin})
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="mb-4">
                <label className="block mb-1">Días de la semana</label>
                <DiasSemanaSelector />
              </div>
              
              <div className="mb-4">
                <label className="block mb-1">Semanas del mes</label>
                <SemanasMesSelector />
              </div>
              
              <div className="flex justify-end gap-2 mt-6">
                <button
                  onClick={() => setShowTurnoModal(false)}
                  className={`px-4 py-2 rounded ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveTurno}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Modal de confirmación de desactivación */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full dark:bg-gray-800">
              <h3 className="text-lg font-bold mb-4 dark:text-white">
                Confirmar desactivación
              </h3>
              <p className="mb-4 dark:text-gray-300">
                ¿Estás seguro de que quieres desactivar el turno <strong className="text-red-600">{turnoToDelete?.nombre || `Turno ${turnoToDelete?.orden}`}</strong>?
              </p>
              <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">
                El turno quedará inactivo pero podrás reactivarlo más adelante si lo necesitas.
              </p>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 border rounded hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700 dark:text-white"
                  disabled={loadingAction}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeleteTurno}
                  className={`px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 flex items-center justify-center ${loadingAction ? 'opacity-75 cursor-not-allowed' : ''}`}
                  disabled={loadingAction}
                >
                  {loadingAction ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Desactivando...
                    </>
                  ) : (
                    'Desactivar'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de reactivación de turno */}
        {showReactivarModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full dark:bg-gray-800">
              <h3 className="text-lg font-bold mb-4 dark:text-white">
                Turno inactivo encontrado
              </h3>
              <p className="mb-4 dark:text-gray-300">
                Se encontró un turno inactivo con parámetros similares. 
              </p>
              <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">
                ¿Quieres reactivar este turno existente en lugar de crear uno nuevo?
              </p>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => {
                    setShowReactivarModal(false);
                    setTurnoInactivoSimilar(null);
                    // Continuar con la creación normal
                    handleSaveTurno(true);
                  }}
                  className="px-4 py-2 border rounded hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700 dark:text-white"
                  disabled={loadingReactivar}
                >
                  Crear nuevo
                </button>
                <button
                  onClick={() => handleReactivarTurno(turnoInactivoSimilar.id)}
                  className={`px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center justify-center ${loadingReactivar ? 'opacity-75 cursor-not-allowed' : ''}`}
                  disabled={loadingReactivar}
                >
                  {loadingReactivar ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Reactivando...
                    </>
                  ) : (
                    'Reactivar existente'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminTurnos;
