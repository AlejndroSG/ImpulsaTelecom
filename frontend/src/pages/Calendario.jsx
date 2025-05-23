import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

// Importaciones de FullCalendar (v6.x)
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import listPlugin from '@fullcalendar/list'
import interactionPlugin from '@fullcalendar/interaction'
import esLocale from '@fullcalendar/core/locales/es'

// Los estilos ya están incluidos en las importaciones anteriores para v6.x

import EventoModal from '../components/EventoModal'
import EventoVistaPrevia from '../components/EventoVistaPrevia' // Importar el nuevo componente de vista previa

const Calendario = () => {
  const { user } = useAuth()
  const { isDarkMode } = useTheme()
  const [eventos, setEventos] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [modalEvento, setModalEvento] = useState(null)
  const [calendario, setCalendario] = useState(null)
  const [eventoSeleccionadoId, setEventoSeleccionadoId] = useState(null);
  const [vista, setVista] = useState('dayGridMonth')
  const [filtros, setFiltros] = useState({
    verPersonales: true,
    verDepartamental: false,
    verGlobal: true,
  })
  
  // Para depuraciu00f3n - mostrar el estado de los filtros cuando cambien
  useEffect(() => {
    console.log('Estado actual de filtros:', filtros);
  }, [filtros])
  
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
    departamental: '#8b5cf6', // Morado para eventos departamentales
    global: '#10b981'        // Verde para eventos globales
  }

  // Estilo para prevenir el parpadeo negro al cambiar filtros
  const transitionStyle = {
    transition: 'all 0.3s ease',
    backgroundColor: isDarkMode ? '#1f2937' : '#ffffff'
  }

  // Cargar eventos del calendario
  const cargarEventos = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      // Obtener fecha actual
      const fechaActual = new Date()
      
      // Calcular rango de fechas (3 meses atrás y 6 meses adelante)
      const fechaInicio = new Date(fechaActual.getFullYear(), fechaActual.getMonth() - 3, 1)
      const fechaFin = new Date(fechaActual.getFullYear(), fechaActual.getMonth() + 6, 0)
      
      // Formatear fechas para la API
      const inicio = formatearFechaParaAPI(fechaInicio)
      const fin = formatearFechaParaAPI(fechaFin)
      
      // Determinar si el usuario es administrador
      const esAdmin = user?.tipo_usuario === 'admin'
      
      // Añadir parámetros de autenticación alternativa
      const storedUser = localStorage.getItem('user')
      let userId = ''
      let userNif = ''
      
      if (storedUser) {
        try {
          const userObj = JSON.parse(storedUser)
          userId = userObj.id || ''
          userNif = userObj.NIF || ''
        } catch (error) {
          console.error('Error al parsear usuario almacenado:', error)
        }
      }
      
      // Determinar qué endpoint usar según filtros
      // Usar directamente el endpoint de calendario.php con método GET
      // Este endpoint ya tiene implementada la lógica para mostrar eventos globales y personales
      let url = `${import.meta.env.VITE_API_URL}/calendario.php?inicio=${inicio}&fin=${fin}&user_id=${userId}&user_nif=${userNif}`
      
      // Añadir el parámetro de tipo_usuario para que el backend pueda determinar permisos
      url += `&user_type=${user?.tipo_usuario || 'usuario'}`
      
      // SOLUCIU00d3N: Obtener SIEMPRE todos los tipos de eventos del servidor
      // El filtrado se haru00e1 del lado del cliente para evitar problemas
      url += `&tipos_evento=personal,departamental,global`
      
      // Registrar la URL para depuraciu00f3n
      console.log('URL para obtener TODOS los eventos:', url);
      
      console.log('URL de la API:', url)
      
      try {
        const response = await fetch(url, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
            'Cache-Control': 'no-cache, no-store'
          }
        })

        if (!response.ok) {
          console.error(`Error en la respuesta del servidor: ${response.status}`);
          setError(`Error al cargar eventos (${response.status}). Por favor, inténtelo de nuevo más tarde.`);
          setIsLoading(false);
          return;
        }

        // Intentar parsear la respuesta como JSON
        let data;
        try {
          data = await response.json();
          console.log('Respuesta de la API de eventos:', data);
        } catch (jsonError) {
          console.error('Error al parsear JSON:', jsonError);
          setError('Error en el formato de la respuesta del servidor. Por favor, contacte al administrador.');
          setIsLoading(false);
          return;
        }

        if (!data.success && data.message) {
          console.error('Error reportado por la API:', data.message);
          setError(`Error: ${data.message}`);
          setIsLoading(false);
          return;
        }

        const eventosFormateados = []
        
        // Agregar eventos normales si el filtro está activado
        if (filtros.verPersonales && data.eventos) {
          console.log('Eventos recibidos del servidor:', data.eventos);
          
          // Verificar si hay eventos para procesar
          if (Array.isArray(data.eventos) && data.eventos.length > 0) {
            const eventosCalendario = data.eventos
              // FILTRADO DEFINITIVO y fu00e1cil de entender
              .filter(evento => {
                // Extraer y registrar cu00f3mo se estu00e1 filtrando cada evento
                console.log(`FILTRADO - Evento: ${evento.titulo}, Tipo: ${evento.tipo_evento || 'sin tipo'}`);
                
                // Nunca confiar en el valor de tipo_evento - forzar la comprobacion explicitamente
                if (evento.tipo_evento === 'global') {
                  // Si es global, solo mostrar si el filtro global estu00e1 activo
                  console.log(`  -> Evento GLOBAL, se muestra: ${filtros.verGlobal}`);
                  return filtros.verGlobal;
                }
                else if (evento.tipo_evento === 'departamental') {
                  // Si es departamental, solo mostrar si el filtro departamental estu00e1 activo
                  console.log(`  -> Evento DEPARTAMENTAL, se muestra: ${filtros.verDepartamental}`);
                  return filtros.verDepartamental;
                }
                else {
                  // Todo lo demu00e1s se considera personal
                  console.log(`  -> Evento PERSONAL, se muestra: ${filtros.verPersonales}`);
                  return filtros.verPersonales;
                }
              })
              .map(evento => {
                // Determinar color según tipo de evento (personal, departamental o global)
                let color;
                
                // Asignar colores basados en el tipo_evento (prioridad más alta)
                if (evento.tipo_evento === 'departamental') {
                  color = coloresEventos.departamental;
                } else if (evento.tipo_evento === 'global') {
                  color = coloresEventos.global;
                } else if (evento.tipo_evento === 'personal') {
                  color = coloresEventos.personal;
                } else {
                  // Si no hay tipo_evento, usar el tipo (prioridad más baja)
                  color = evento.color || coloresEventos[evento.tipo] || coloresEventos.personal;
                }
                
                // Registrar el evento para depuración
                console.log(`Evento formateado: ${evento.titulo}, tipo_evento: ${evento.tipo_evento}, color asignado: ${color}`);
                
                return {
                  id: `evento_${evento.id}`,
                  title: evento.titulo,
                  start: evento.fecha_inicio,
                  end: evento.fecha_fin || evento.fecha_inicio, // Si no hay fecha fin, usar la de inicio
                  allDay: evento.dia_completo === '1',
                  backgroundColor: color,
                  borderColor: color,
                  extendedProps: {
                    tipo: evento.tipo || 'evento',
                    tipo_evento: evento.tipo_evento || 'personal', // Asegurar que siempre tenga un valor
                    descripcion: evento.descripcion,
                    creador: evento.nombre_usuario ? `${evento.nombre_usuario} ${evento.apellidos_usuario || ''}` : evento.NIF_creador ? 'Administrador' : 'Usuario',
                    departamento: evento.nombre_departamento || '',
                    eventoOriginal: evento
                  }
                }
              });
            eventosFormateados.push(...eventosCalendario)
            console.log('Eventos formateados para el calendario:', eventosCalendario);
          } else {
            console.log('No hay eventos para mostrar o el formato es incorrecto');
          }
        }
        
        setEventos(eventosFormateados)
      } catch (error) {
        console.error('Error:', error)
        setError(error.message)
      } finally {
        setIsLoading(false)
      }
    } catch (error) {
      console.error('Error:', error)
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }, [filtros, user])

  // Cargar eventos cuando cambian los filtros
  useEffect(() => {
    cargarEventos()
  }, [cargarEventos])

  // Función para manejar clic en eventos
  const handleEventClick = (info) => {
    console.log('Evento clickeado:', info.event);
    
    // Obtener el tipo de evento de las propiedades extendidas
    const tipoEvento = info.event.extendedProps?.tipo || 'evento';
    
    // Guardar el ID del evento seleccionado para resaltarlo en el calendario
    setEventoSeleccionadoId(info.event.id);
    
    // Si es un fichaje, no mostrar modal
    if (tipoEvento === 'fichaje') {
      return;
    }
    
    // Si es una tarea, en una implementación futura se podría abrir el detalle de la tarea
    if (tipoEvento === 'tarea') {
      return;
    }
    
    // Extraer todos los datos necesarios del evento para pasarlos al modal o vista previa
    // Asegurarse de manejar posibles valores undefined con valores predeterminados
    const eventoData = {
      id: info.event.id ? info.event.id.replace('evento_', '') : '',
      titulo: info.event.title || 'Evento sin título',
      inicio: info.event.start || new Date(),
      fin: info.event.end || info.event.start,
      diaCompleto: info.event.allDay || false,
      color: info.event.backgroundColor || '#3788d8',
      tipo: info.event.extendedProps?.tipo || 'evento',
      tipo_evento: info.event.extendedProps?.tipo_evento || 'personal',
      descripcion: info.event.extendedProps?.descripcion || '',
      creador: info.event.extendedProps?.creador || '',
      departamento: info.event.extendedProps?.departamento || '',
      modo: 'ver' // Siempre establecer en modo 'ver' cuando se hace clic en un evento
    };
    
    console.log('Datos de evento preparados para modal:', eventoData);
    
    // Actualizar el estado con los datos del evento
    setModalEvento(eventoData);
};

  // Función para crear un nuevo evento - DESHABILITADA PARA USUARIOS NORMALES
  const handleDateSelect = (selectInfo) => {
    // Los usuarios normales no pueden crear eventos
    if (user?.tipo_usuario !== 'admin') {
      // No mostrar ningu00fan mensaje, simplemente no hacer nada
      return;
    }
    
    // Esta parte nunca se ejecuta para usuarios normales
    setModalEvento({
      id: null,
      titulo: '',
      inicio: selectInfo.start,
      fin: selectInfo.end,
      diaCompleto: selectInfo.allDay,
      color: coloresEventos.departamental,
      descripcion: '',
      tipo: 'evento',
      tipo_evento: 'departamental',
      modo: 'crear'
    })
  }

  // Añade esta función para personalizar el renderizado de eventos
  const eventDidMount = (info) => {
  // Si este evento es el seleccionado, cambia su estilo
  if (info.event.id === eventoSeleccionadoId) {
    // Aplicar un estilo destacado al evento seleccionado
    info.el.style.boxShadow = '0 0 0 2px #fff, 0 0 0 4px #000';
    info.el.style.transform = 'scale(1.05)';
    info.el.style.zIndex = '10';
    info.el.style.transition = 'all 0.2s ease';
    
    // Cambiar el color de fondo para mayor contraste
    const currentColor = info.event.backgroundColor;
    // Hacer el color un poco más brillante
    const brighterColor = adjustBrightness(currentColor, 20);
    info.el.style.backgroundColor = brighterColor;
  }   
};

// Función auxiliar para ajustar el brillo de un color
const adjustBrightness = (color, percent) => {
  // Implementación simple para ajustar brillo
  // En producción podrías usar una biblioteca como tinycolor2
  return color; // Por simplicidad, devolvemos el mismo color
};

  // Modifica la función cerrarModal para limpiar también el evento seleccionado
  const cerrarModal = () => {
    setModalEvento(null);
    setEventoSeleccionadoId(null); // Limpiar el evento seleccionado
  };

  // Función para guardar un evento
  const guardarEvento = async (evento) => {
    try {
      // Verificar si el usuario es administrador para eventos departamentales
      if (evento.tipo_evento === 'departamental' && user?.tipo_usuario !== 'admin') {
        alert('Solo los administradores pueden crear eventos departamentales.');
        return;
      }
      
      // Preparar datos para enviar a la API
      const datosEvento = {
        titulo: evento.titulo,
        descripcion: evento.descripcion,
        fecha_inicio: formatearFechaParaAPI(evento.inicio),
        fecha_fin: evento.fin ? formatearFechaParaAPI(evento.fin) : null,
        tipo: evento.tipo,
        tipo_evento: evento.tipo_evento || 'personal', // Agregar tipo de evento (personal o departamental)
        color: evento.color,
        dia_completo: evento.diaCompleto ? 1 : 0
      }
      
      let url, method
      
      // Obtener el ID del usuario desde localStorage para autenticación alternativa
      const storedUser = localStorage.getItem('user')
      let userId = ''
      let userNif = ''
      let userType = ''
      
      if (storedUser) {
        try {
          const userObj = JSON.parse(storedUser)
          userId = userObj.id || ''
          userNif = userObj.NIF || ''
          userType = userObj.tipo_usuario || ''
          
          // Agregar información del usuario para permisos en el backend
          datosEvento.user_id = userId
          datosEvento.user_nif = userNif
          datosEvento.user_type = userType
        } catch (error) {
          console.error('Error al parsear usuario almacenado:', error)
        }
      }
      
      if (evento.modo === 'crear') {
        url = `${import.meta.env.VITE_API_URL}/calendario.php?user_id=${userId}`
        method = 'POST'
      } else {
        url = `${import.meta.env.VITE_API_URL}/calendario.php?id=${evento.id.replace('evento_', '')}&user_id=${userId}`
        method = 'PUT'
      }
      
      const response = await fetch(url, {
        method,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(datosEvento)
      })
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (data.success) {
        cerrarModal()
        cargarEventos() // Recargar eventos
      } else {
        throw new Error(data.message || 'Error al guardar evento')
      }
      
    } catch (error) {
      console.error('Error al guardar evento:', error)
      alert(`Error al guardar evento: ${error.message}`)
    }
  }

  // Función para eliminar un evento
  const eliminarEvento = async (eventoId) => {
    try {
      // Obtener el ID del usuario desde localStorage para autenticación alternativa
      const storedUser = localStorage.getItem('user')
      let userId = ''
      
      if (storedUser) {
        try {
          const userObj = JSON.parse(storedUser)
          userId = userObj.id || ''
        } catch (error) {
          console.error('Error al parsear usuario almacenado:', error)
        }
      }
      
      const url = `${import.meta.env.VITE_API_URL}/calendario.php?id=${eventoId.replace('evento_', '')}&user_id=${userId}`
      
      const response = await fetch(url, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Accept': 'application/json'
        }
      })
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (data.success) {
        cerrarModal()
        cargarEventos() // Recargar eventos
      } else {
        throw new Error(data.message || 'Error al eliminar evento')
      }
      
    } catch (error) {
      console.error('Error al eliminar evento:', error)
      alert(`Error al eliminar evento: ${error.message}`)
    }
  }

  // Manejar cambio de vista
  const handleViewChange = (viewInfo) => {
    setVista(viewInfo.view.type)
  }

  // Manejar cambio de filtros
  const toggleFiltro = (filtro) => {
    setFiltros(prev => ({
      ...prev,
      [filtro]: !prev[filtro]
    }))
  }

  // Función para formatear fechas antes de enviarlas al backend
  const formatearFechaParaAPI = (fecha) => {
    // Obtener los componentes de la fecha en la zona horaria local
    const año = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    const horas = String(fecha.getHours()).padStart(2, '0');
    const minutos = String(fecha.getMinutes()).padStart(2, '0');
    const segundos = String(fecha.getSeconds()).padStart(2, '0');
    
    // Devolver formato MySQL: YYYY-MM-DD HH:MM:SS
    return `${año}-${mes}-${dia} ${horas}:${minutos}:${segundos}`;
  }

  return (
    <div className={`container mx-auto px-4 py-8 ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`} style={transitionStyle}>
      <h1 className="text-3xl font-bold mb-6">Calendario</h1>
      
      {/* Filtros */}
      <div className={`mb-6 p-4 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow`}>
        <div className="flex flex-wrap gap-3">
          <h3 className="w-full text-lg font-medium mb-2">Mostrar en calendario:</h3>
          
          <button
            onClick={() => toggleFiltro('verPersonales')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${filtros.verPersonales
              ? isDarkMode ? 'bg-blue-700 text-white' : 'bg-blue-100 text-blue-800'
              : isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'}`}
          >
            <span className="mr-1.5">👤</span>
            Personal
          </button>
          
          <button
            onClick={() => toggleFiltro('verDepartamental')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${filtros.verDepartamental
              ? isDarkMode ? 'bg-purple-700 text-white' : 'bg-purple-100 text-purple-800'
              : isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'}`}
          >
            <span className="mr-1.5">👥</span>
            Departamental
          </button>
          
          <button
            onClick={() => toggleFiltro('verGlobal')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${filtros.verGlobal
              ? isDarkMode ? 'bg-green-700 text-white' : 'bg-green-100 text-green-800'
              : isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'}`}
          >
            <span className="mr-1.5">🌎</span>
            Global (toda la empresa)
          </button>
        </div>
      </div>
      
      {/* Calendario */}
      <div className={`rounded-lg shadow overflow-hidden ${isDarkMode ? 'fc-dark' : ''}`}>
        {isLoading && (
          <div className="absolute inset-0 bg-black bg-opacity-10 flex items-center justify-center z-10">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-500"></div>
          </div>
        )}
        
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
          ref={(el) => setCalendario(el)}
          initialView="dayGridMonth"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
          }}
          locale={esLocale}
          height="auto"
          selectable={user?.tipo_usuario === 'admin'} // Solo los administradores pueden seleccionar fechas
          selectMirror={user?.tipo_usuario === 'admin'} // Solo mostrar espejo de selección a administradores
          dayMaxEvents={true}
          editable={false} // Nadie puede editar eventos arrastrándolos
          weekends={true}
          events={eventos}
          select={handleDateSelect}
          eventClick={handleEventClick}
          eventDidMount={eventDidMount}
          viewDidMount={handleViewChange}
          eventTimeFormat={{
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          }}
          buttonText={{
            today: 'Hoy',
            month: 'Mes',
            week: 'Semana',
            day: 'Día',
            list: 'Lista'
          }}
          slotLabelFormat={{
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          }}
          allDayText="Todo el día"
          noEventsText="No hay eventos para mostrar"
          firstDay={1} // Lunes como primer día de la semana
          businessHours={{
            daysOfWeek: [1, 2, 3, 4, 5], // Lunes a viernes
            startTime: '08:00',
            endTime: '18:00',
          }}
          themeSystem="standard"
        />
      </div>
      
      {/* Se ha eliminado la leyenda del calendario */}
      
      {/* Modal de evento - usamos componentes diferentes segu00fan el tipo de usuario */}
      {modalEvento && (
        <>
          {user?.tipo_usuario === 'admin' ? (
            // Para administradores, mostrar el modal de ediciu00f3n
            <EventoModal
              evento={modalEvento}
              onClose={cerrarModal}
              onSave={guardarEvento}
              onDelete={eliminarEvento}
              tiposEventos={Object.keys(coloresEventos).map(tipo => ({
                value: tipo,
                label: tipo.charAt(0).toUpperCase() + tipo.slice(1),
                color: coloresEventos[tipo]
              }))}
              isDarkMode={isDarkMode}
              soloLectura={false}
            />
          ) : (
            // Para usuarios normales, mostrar la vista previa simplificada
            <EventoVistaPrevia
              evento={modalEvento}
              onClose={cerrarModal}
              isDarkMode={isDarkMode}
            />
          )}
        </>
      )}
    </div>
  )
}

export default Calendario
