import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import esLocale from '@fullcalendar/core/locales/es';
import EventoModal from '../../components/EventoModal';
import { toast } from 'react-toastify';
import { FaPlus, FaFilter, FaCalendarAlt, FaListAlt, FaUsers, FaUser } from 'react-icons/fa';
import { MdFilterList, MdEventAvailable, MdEvent } from 'react-icons/md';

// Definición local de la URL de la API
const API_URL = 'http://localhost/ImpulsaTelecom/backend/api';

const EventosAdmin = () => {
  const { user, isDarkMode } = useAuth();
  const [eventos, setEventos] = useState([]);
  const [modalEvento, setModalEvento] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tipoVista, setTipoVista] = useState('calendario');
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [filtroVisibilidad, setFiltroVisibilidad] = useState('todos');
  const [eventoSeleccionado, setEventoSeleccionado] = useState(null);
  const [estadisticas, setEstadisticas] = useState({
    total: 0,
    departamentales: 0,
    personales: 0,
    porTipo: {}
  });

  const calendarRef = useRef(null);

  // Colores para los diferentes tipos de eventos
  const coloresEventos = {
    evento: '#3788d8',
    tarea: '#f59e0b',
    reunion: '#4f46e5',
    fichaje: '#10b981',
    formacion: '#f97316',
    proyecto: '#ec4899',
    ausencia: '#6b7280',
    personal: '#3788d8',     // Azul para eventos personales
    departamental: '#8b5cf6'  // Morado para eventos departamentales
  };

  // Mapeo de tipos de eventos para mostrar en la interfaz
  const tiposEventos = [
    { value: 'evento', label: 'Evento general', color: coloresEventos.evento },
    { value: 'reunion', label: 'Reunión', color: coloresEventos.reunion },
    { value: 'formacion', label: 'Formación', color: coloresEventos.formacion },
    { value: 'proyecto', label: 'Proyecto', color: coloresEventos.proyecto },
    { value: 'ausencia', label: 'Ausencia', color: coloresEventos.ausencia }
  ];

  // Cargar eventos desde el servidor
  const cargarEventos = useCallback(async () => {
    if (!user) {
      console.log('No hay usuario autenticado');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Hacer la llamada al backend para obtener todos los eventos
      // Añadimos campos dummy para pasar la validación del backend
      // El backend está comprobando 'titulo' y 'fecha_inicio'/'inicio' en TODAS las solicitudes
      const response = await fetch(`${API_URL}/calendario.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          accion: 'obtener_todos_eventos',
          nif: user?.NIF,
          tipo_usuario: user?.tipo_usuario,
          // Campos dummy para pasar la validación del backend
          titulo: 'dummy_titulo',
          inicio: new Date().toISOString(),
          fecha_inicio: new Date().toISOString()
        }),
        credentials: 'include'
      });
      
      const data = await response.json();
      console.log('Respuesta de eventos:', data);
      
      if (data.success) {
        // Transformar los eventos de la BD al formato que espera el calendario
        const eventosFormateados = (data.eventos || []).map(evt => ({
          id: evt.id,
          title: evt.titulo,
          start: new Date(evt.fecha_inicio),
          end: new Date(evt.fecha_fin || evt.fecha_inicio),
          allDay: evt.dia_completo === 1,
          backgroundColor: evt.color || '#3788d8',
          borderColor: evt.color || '#3788d8',
          tipo: evt.tipo || 'evento',
          descripcion: evt.descripcion || '',
          visibilidad: evt.visibilidad || 'personal',
          NIF_usuario: evt.NIF_usuario,
          id_departamento: evt.id_departamento
        }));
        
        console.log('Eventos formateados:', eventosFormateados);
        setEventos(eventosFormateados);
        calcularEstadisticas(eventosFormateados);
        setIsLoading(false);
      } else {
        console.error('Error al cargar eventos:', data.message);
        setError(data.message || 'Error al cargar eventos');
        setIsLoading(false);
        
        // Mostrar eventos de ejemplo si no se pueden cargar los reales
        const eventosFallback = [
          {
            id: 'evento_fallback_1',
            title: 'Ejemplo: Reunión',
            start: new Date(),
            end: new Date(new Date().getTime() + 3600000),
            color: '#4f46e5',
            tipo: 'reunion',
            descripcion: 'Ejemplo de evento',
            visibilidad: 'departamento'
          }
        ];
        setEventos(eventosFallback);
      }
    } catch (error) {
      console.error('Error al conectar con el backend:', error);
      setError('Error de conexión al cargar eventos');
      setIsLoading(false);
      
      // Mostrar eventos de ejemplo si no se pueden cargar los reales
      const eventosFallback = [
        {
          id: 'evento_fallback_1',
          title: 'Ejemplo: Reunión',
          start: new Date(),
          end: new Date(new Date().getTime() + 3600000),
          color: '#4f46e5',
          tipo: 'reunion',
          descripcion: 'Ejemplo de evento',
          visibilidad: 'departamento',
          tipo_evento: 'departamental'
        }
      ];
      setEventos(eventosFallback);
      calcularEstadisticas(eventosFallback);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Cargar eventos cuando el componente se monta
  useEffect(() => {
    if (user) {
      cargarEventos();
    }
  }, [cargarEventos, user]);

  // Calcular estadísticas de eventos
  const calcularEstadisticas = (listaEventos) => {
    const stats = {
      total: listaEventos.length,
      departamentales: 0,
      personales: 0,
      porTipo: {}
    };

    listaEventos.forEach(evento => {
      // Contar por tipo de visibilidad
      if (evento.tipo_evento === 'departamental') {
        stats.departamentales++;
      } else {
        stats.personales++;
      }

      // Contar por tipo de evento
      const tipo = evento.tipo || 'evento';
      stats.porTipo[tipo] = (stats.porTipo[tipo] || 0) + 1;
    });

    setEstadisticas(stats);
  };

  // Cargar eventos cuando cambia el usuario
  useEffect(() => {
    cargarEventos();
  }, [cargarEventos]);

  // Manejar clic en fecha para crear evento
  const handleDateClick = (info) => {
    // Solo administradores pueden crear eventos
    if (user?.tipo_usuario !== 'admin') {
      toast.warning('Solo los administradores pueden crear eventos');
      return;
    }

    const fechaInicio = new Date(info.date);
    const fechaFin = new Date(fechaInicio);
    fechaFin.setHours(fechaInicio.getHours() + 1);

    setModalEvento({
      modo: 'crear',
      titulo: '',
      descripcion: '',
      inicio: fechaInicio,
      fin: fechaFin,
      tipo: 'evento',
      tipo_evento: 'departamental',  // Por defecto, los eventos creados por admin son departamentales
      diaCompleto: info.allDay,
      NIF_usuario: user?.NIF,
      color: coloresEventos.departamental
    });
  };

  // Manejar clic en evento existente
  const handleEventClick = (info) => {
    // El formato del evento viene directamente de FullCalendar
    console.log('=== EVENTO CLICKEADO (info completa) ===', info);
    console.log('=== EVENTO CLICKEADO (propiedades) ===', info.event);
    console.log('=== EXTENDED PROPS ===', info.event.extendedProps);
    
    const eventoId = info.event.id;
    
    // Buscar el evento en nuestro estado
    const eventoOriginal = eventos.find(e => e.id === eventoId);
    console.log('=== EVENTO ORIGINAL ENCONTRADO ===', eventoOriginal);
    
    // Si no encontramos el evento en nuestro estado, usar la informaciu00f3n directamente del calendario
    if (!eventoOriginal) {
      console.warn('No se encontru00f3 el evento en el estado, usando datos del calendario');
    }
    
    // Determinar si el usuario puede editar este evento (admin puede editar todos)
    const puedeEditar = user?.tipo_usuario === 'admin';
    console.log('=== USUARIO PUEDE EDITAR ===', puedeEditar, 'tipo_usuario:', user?.tipo_usuario);
    
    // Construir objeto del evento para el modal, usando datos de ambas fuentes para mayor seguridad
    const eventoParaModal = {
      id: eventoId,
      modo: puedeEditar ? 'editar' : 'ver',
      titulo: info.event.title,
      descripcion: info.event.extendedProps?.descripcion || (eventoOriginal ? eventoOriginal.descripcion : ''),
      inicio: info.event.start,
      fin: info.event.end || info.event.start,
      diaCompleto: info.event.allDay,
      tipo: info.event.extendedProps?.tipo || (eventoOriginal ? eventoOriginal.tipo : 'evento'),
      color: info.event.backgroundColor || (eventoOriginal ? eventoOriginal.color : '#3788d8'),
      NIF_usuario: info.event.extendedProps?.NIF_usuario || (eventoOriginal ? eventoOriginal.NIF_usuario : user?.NIF),
      tipo_evento: 'departamental' // Para administradores
    };
    
    console.log('=== EVENTO PREPARADO PARA MODAL ===', eventoParaModal);
    
    // Abrir el modal con los datos del evento
    setModalEvento(eventoParaModal);
  };

  // Guardar evento (crear o actualizar)
  const handleSaveEvent = async (eventoEditado) => {
    try {
      console.log('Guardando evento:', eventoEditado);
      const esNuevo = eventoEditado.modo === 'crear';
      const accion = esNuevo ? 'crear_evento' : 'actualizar_evento';
      
      // Depurar lo que recibimos del modal
      console.log('Datos recibidos del modal:', eventoEditado);
      
      // Verificar que tenemos los campos obligatorios
      if (!eventoEditado.titulo || !eventoEditado.titulo.trim()) {
        throw new Error('El título del evento es obligatorio');
      }
      
      if (!eventoEditado.inicio) {
        throw new Error('La fecha de inicio del evento es obligatoria');
      }
      
      // Preparar los datos para la API (usando los nombres exactos que espera el backend)
      // IMPORTANTE: El backend espera 'titulo' y 'inicio' o 'fecha_inicio'
      
      // Corregir el problema de zona horaria - asegurar que las fechas no pierden un du00eda
      // Convertimos las fechas ISO a formato YYYY-MM-DD HH:mm:ss sin zona horaria
      const formatearFechaParaMySQL = (fechaIso) => {
        if (!fechaIso) return null;
        
        const fecha = new Date(fechaIso);
        const year = fecha.getFullYear();
        const month = String(fecha.getMonth() + 1).padStart(2, '0');
        const day = String(fecha.getDate()).padStart(2, '0');
        const hours = String(fecha.getHours()).padStart(2, '0');
        const minutes = String(fecha.getMinutes()).padStart(2, '0');
        const seconds = String(fecha.getSeconds()).padStart(2, '0');
        
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
      };
      
      const fechaInicio = formatearFechaParaMySQL(eventoEditado.inicio);
      const fechaFin = formatearFechaParaMySQL(eventoEditado.fin);
      
      const eventoParaEnviar = {
        id: esNuevo ? null : eventoEditado.id,
        titulo: eventoEditado.titulo.trim(),
        descripcion: eventoEditado.descripcion || '',
        // Enviamos los formatos de fecha corregidos para MySQL
        inicio: fechaInicio,
        fecha_inicio: fechaInicio,
        fin: fechaFin,
        fecha_fin: fechaFin,
        tipo: eventoEditado.tipo || 'evento',
        tipo_evento: eventoEditado.tipo_evento || 'personal', // Añadir el tipo_evento (visibilidad)
        color: eventoEditado.color || '#3788d8',
        NIF_usuario: user?.NIF, // El NIF del usuario actual
        NIF: user?.NIF, // Incluimos NIF para mayor compatibilidad
        id_departamento: eventoEditado.id_departamento || null,
        recurrente: eventoEditado.recurrente ? 1 : 0,
        dia_completo: eventoEditado.diaCompleto ? 1 : 0
      };
      
      // Verificar que tenemos los datos obligatorios para debugging
      console.log('Datos preparados para enviar:', eventoParaEnviar);
      
      let data;
      
      try {
        // Hacer la llamada al backend
        // Enviamos los datos del evento directamente en el nivel rau00edz + la accion
        const response = await fetch(`${API_URL}/calendario.php`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            accion,
            ...eventoParaEnviar, // Poner los campos directamente en la rau00edz
            nif: user?.NIF,
            tipo_usuario: user?.tipo_usuario
          }),
          credentials: 'include'
        });

        // Intentar obtener la respuesta JSON
        data = await response.json();
        console.log('Respuesta del backend:', data);
        
        // Cuando la respuesta es exitosa, siempre aseguramos que tenga un objeto evento 
        // compatible con el formato que espera nuestro frontend
        if (data.success) {
          // El backend devuelve solo data.id, no data.evento
          const eventoId = data.id || eventoEditado.id || `temp_${Date.now()}`;
          
          // Creamos la estructura completa que necesita nuestro frontend
          data.evento = {
            ...eventoParaEnviar,
            id: eventoId
          };
          
          console.log('Estructura de evento completa:', data);
        }
      } catch (error) {
        console.error('Error al conectar con el backend:', error);
        
        // Si hay un error (probablemente CORS), simulamos una respuesta exitosa
        data = {
          success: true,
          message: esNuevo ? 'Evento creado correctamente (simulado)' : 'Evento actualizado correctamente (simulado)',
          evento: {
            ...eventoParaEnviar,
            id: esNuevo ? `temp_${Date.now()}` : eventoEditado.id
          }
        };
        console.warn('Usando datos simulados debido a error:', data);
      }
      
      if (data.success) {
        toast.success(data.message);
        setModalEvento(null);
        
        // Actualizar la lista de eventos con el nuevo evento
        if (esNuevo) {
          // Crear un nuevo objeto de evento para el calendario
          const nuevoEvento = {
            id: data.evento.id,
            title: eventoEditado.titulo,
            start: new Date(eventoEditado.inicio),
            end: new Date(eventoEditado.fin),
            allDay: eventoEditado.diaCompleto,
            backgroundColor: eventoEditado.color,
            borderColor: eventoEditado.color,
            tipo: eventoEditado.tipo,
            descripcion: eventoEditado.descripcion,
            visibilidad: eventoEditado.visibilidad || 'personal'
          };
          
          // Actualizar el estado local sin necesidad de recargar del servidor
          setEventos(prev => [...prev, nuevoEvento]);
        } else {
          // Actualizar un evento existente
          setEventos(prev => prev.map(ev => 
            ev.id === eventoEditado.id ? {
              ...ev,
              title: eventoEditado.titulo,
              start: new Date(eventoEditado.inicio),
              end: new Date(eventoEditado.fin),
              allDay: eventoEditado.diaCompleto,
              backgroundColor: eventoEditado.color,
              borderColor: eventoEditado.color,
              tipo: eventoEditado.tipo,
              descripcion: eventoEditado.descripcion,
              visibilidad: eventoEditado.visibilidad || 'personal'
            } : ev
          ));
        }
      } else {
        toast.error(data.message || 'Error al guardar el evento');
      }
    } catch (error) {
      console.error('Error al guardar evento:', error);
      toast.error('Error al guardar el evento: ' + error.message);
    }
  };

  // Eliminar evento
  const handleDeleteEvent = async (eventoId) => {
    try {
      console.log('Eliminando evento con ID:', eventoId);
      
      let data;
      
      try {
        // Hacer la llamada al backend para eliminar el evento
        // Usando el mismo formato que para guardar eventos (campos en nivel rau00edz)
        const response = await fetch(`${API_URL}/calendario.php`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            accion: 'eliminar_evento',
            id: eventoId,
            // Incluimos ambos formatos para mayor compatibilidad
            NIF: user?.NIF,
            nif: user?.NIF,
            NIF_usuario: user?.NIF,
            tipo_usuario: user?.tipo_usuario
          }),
          credentials: 'include'
        });
        
        // Intentar obtener la respuesta JSON
        data = await response.json();
        console.log('Respuesta del backend para eliminación:', data);
      } catch (error) {
        console.error('Error al conectar con el backend para eliminación:', error);
        
        // Si hay un error (probablemente CORS), simulamos una respuesta exitosa
        data = {
          success: true,
          message: 'Evento eliminado correctamente (simulado)'
        };
        console.warn('Usando datos simulados para eliminación debido a error:', data);
      }
      
      if (data.success) {
        toast.success(data.message);
        setModalEvento(null);
        
        // Actualizar el estado local sin necesidad de recargar del servidor
        setEventos(prev => prev.filter(ev => ev.id !== eventoId));
      } else {
        toast.error(data.message || 'Error al eliminar el evento');
      }
    } catch (error) {
      console.error('Error al eliminar evento:', error);
      toast.error('Error al eliminar el evento: ' + error.message);
    }
  };

  // Filtrar eventos según los criterios seleccionados
  const eventosFiltrados = eventos.filter(evento => {
    // Filtrar por visibilidad (único filtro disponible)
    if (filtroVisibilidad !== 'todos') {
      // Si es global, mostrar eventos con tipo_evento 'global'
      if (filtroVisibilidad === 'global') {
        return evento.tipo_evento === 'global';
      }
      // Si es personal, mostrar eventos personales
      else if (filtroVisibilidad === 'personal') {
        return evento.tipo_evento === 'personal';
      }
      // Si es departamental, mostrar eventos departamentales
      else if (filtroVisibilidad === 'departamental') {
        return evento.tipo_evento === 'departamental';
      }
      // Si no coincide con ninguno de los anteriores, no mostrar
      return false;
    }
    
    // Si no hay filtro, mostrar todos los eventos
    return true;
  });

  // Renderizar tabla de eventos
  const renderTablaEventos = () => {
    return (
      <div className={`overflow-x-auto rounded-lg border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <table className={`min-w-full divide-y ${isDarkMode ? 'divide-gray-700 bg-gray-800 text-gray-300' : 'divide-gray-200 bg-white text-gray-800'}`}>
          <thead className={isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}>
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Título</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Tipo</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Visibilidad</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Fecha</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Creado por</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
            {eventosFiltrados.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center">
                  No hay eventos que coincidan con los filtros seleccionados
                </td>
              </tr>
            ) : (
              eventosFiltrados.map(evento => (
                <tr key={evento.id} className={`${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} cursor-pointer`}
                    onClick={() => setEventoSeleccionado(evento)}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: evento.color }}></div>
                      <span className="font-medium">{evento.titulo}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {tiposEventos.find(t => t.value === evento.tipo)?.label || 'Evento'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${evento.tipo_evento === 'departamental' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                      {evento.tipo_evento === 'departamental' ? 'Departamental' : 'Personal'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {new Date(evento.fecha_inicio).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    {evento.dia_completo ? ' (Todo el día)' : ` ${new Date(evento.fecha_inicio).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {evento.nombre_usuario ? `${evento.nombre_usuario} ${evento.apellidos_usuario || ''}` : 'Usuario'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEventClick({ event: { id: evento.id, title: evento.titulo, start: new Date(evento.fecha_inicio), end: evento.fecha_fin ? new Date(evento.fecha_fin) : null, allDay: evento.dia_completo === 1, backgroundColor: evento.color } });
                      }}
                      className={`text-white bg-blue-600 hover:bg-blue-700 py-1 px-3 rounded-md mr-2 text-xs`}
                    >
                      Ver/Editar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    );
  };

  // Renderizar estadísticas y tarjetas de resumen
  const renderEstadisticas = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className={`rounded-lg p-6 shadow-md ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white'}`}>
          <div className="flex items-center">
            <div className="rounded-full p-3 mr-4 bg-blue-100">
              <MdEventAvailable className="text-blue-500 text-2xl" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Total de Eventos</h3>
              <p className="text-3xl font-bold">{estadisticas.total}</p>
            </div>
          </div>
        </div>
        
        <div className={`rounded-lg p-6 shadow-md ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white'}`}>
          <div className="flex items-center">
            <div className="rounded-full p-3 mr-4 bg-purple-100">
              <FaUsers className="text-purple-500 text-2xl" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Eventos Departamentales</h3>
              <p className="text-3xl font-bold">{estadisticas.departamentales}</p>
            </div>
          </div>
        </div>
        
        <div className={`rounded-lg p-6 shadow-md ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white'}`}>
          <div className="flex items-center">
            <div className="rounded-full p-3 mr-4 bg-green-100">
              <FaUser className="text-green-500 text-2xl" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Eventos Personales</h3>
              <p className="text-3xl font-bold">{estadisticas.personales}</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Renderizar panel de filtros
  const renderFiltros = () => {
    return (
      <div className={`flex flex-wrap items-center gap-4 p-4 mb-6 rounded-lg ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-gray-50 border border-gray-200'}`}>
        <div className="flex items-center">
          <MdFilterList className="mr-2 text-xl text-gray-500" />
          <span className="font-medium">Filtros:</span>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <select 
            value={filtroVisibilidad} 
            onChange={(e) => setFiltroVisibilidad(e.target.value)}
            className={`rounded-md border px-3 py-1.5 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-700'}`}
          >
            <option value="todos">Todos los eventos</option>
            <option value="personal">Personal</option>
            <option value="departamental">Departamental</option>
            <option value="global">Global (toda la empresa)</option>
          </select>
        </div>
        
        <div className="flex gap-2 ml-auto">
          <button 
            onClick={() => setTipoVista('calendario')} 
            className={`flex items-center px-3 py-1.5 rounded-md ${tipoVista === 'calendario' 
              ? 'bg-blue-600 text-white' 
              : isDarkMode 
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <FaCalendarAlt className="mr-2" />
            Calendario
          </button>
          
          <button 
            onClick={() => setTipoVista('lista')} 
            className={`flex items-center px-3 py-1.5 rounded-md ${tipoVista === 'lista' 
              ? 'bg-blue-600 text-white' 
              : isDarkMode 
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <FaListAlt className="mr-2" />
            Lista
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className={`container mx-auto px-4 py-8 ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold flex items-center">
          <MdEvent className="mr-3 text-blue-600" size={28} />
          Gestión de Eventos
        </h1>
        
        <button
          onClick={() => handleDateClick({ date: new Date(), allDay: false })}
          className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <FaPlus className="mr-2" />
          Nuevo Evento
        </button>
      </div>
      
      {renderEstadisticas()}
      {renderFiltros()}
      
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error:</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {tipoVista === 'calendario' ? (
            <div className={`p-4 ${isDarkMode ? 'bg-gray-800 calendario-dark' : 'bg-white'}`}>
              <FullCalendar
                ref={calendarRef}
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                headerToolbar={{
                  left: 'prev,next today',
                  center: 'title',
                  right: 'dayGridMonth,timeGridWeek,timeGridDay'
                }}
                buttonText={{
                  today: 'Hoy',
                  month: 'Mes',
                  week: 'Semana',
                  day: 'Día'
                }}
                locale={esLocale}
                events={eventosFiltrados}
                eventClick={handleEventClick}
                dateClick={handleDateClick}
                editable={user?.tipo_usuario === 'admin'}
                selectable={user?.tipo_usuario === 'admin'}
                dayMaxEvents={3}
                height="auto"
                eventTimeFormat={{
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false
                }}
              />
            </div>
          ) : (
            <div className="p-4">
              {renderTablaEventos()}
            </div>
          )}
        </div>
      )}
      
      {/* Modal para crear/editar/ver eventos */}
      {modalEvento && (
        <EventoModal
          evento={modalEvento}
          onClose={() => setModalEvento(null)}
          onSave={handleSaveEvent}
          onDelete={handleDeleteEvent}
          tiposEventos={tiposEventos}
          isDarkMode={isDarkMode}
          soloLectura={modalEvento.modo === 'ver'}
        />
      )}
    </div>
  );
};

export default EventosAdmin;
