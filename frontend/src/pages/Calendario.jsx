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
import CalendarioLeyenda from '../components/CalendarioLeyenda'

const Calendario = () => {
  const { user } = useAuth()
  const { isDarkMode } = useTheme()
  const [eventos, setEventos] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [modalEvento, setModalEvento] = useState(null)
  const [calendario, setCalendario] = useState(null)
  const [vista, setVista] = useState('dayGridMonth')
  const [filtros, setFiltros] = useState({
    verEventos: true,
    verTareas: true,
    verFichajes: true,
    verDepartamento: false,
  })
  
  // Colores para los diferentes tipos de eventos
  const coloresEventos = {
    evento: '#3788d8',
    tarea: '#f59e0b',
    reunion: '#4f46e5',
    fichaje: '#10b981',
    formacion: '#f97316',
    proyecto: '#ec4899',
    ausencia: '#6b7280'
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
      const inicio = fechaInicio.toISOString().split('T')[0]
      const fin = fechaFin.toISOString().split('T')[0]
      
      // Determinar qué endpoint usar según filtros
      let url
      if (filtros.verDepartamento) {
        url = `${import.meta.env.VITE_API_URL}/calendario.php?departamento=true&inicio=${inicio}&fin=${fin}`
      } else {
        url = `${import.meta.env.VITE_API_URL}/calendario.php?mis_eventos=true&inicio=${inicio}&fin=${fin}&incluir_todo=true`
      }
      
      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache, no-store'
        }
      })

      if (!response.ok) {
        throw new Error(`Error al cargar eventos: ${response.status}`)
      }

      const data = await response.json()
      if (data.success) {
        const eventosFormateados = []
        
        // Agregar eventos normales si el filtro está activado
        if (filtros.verEventos && data.eventos) {
          const eventosCalendario = data.eventos.map(evento => ({
            id: `evento_${evento.id}`,
            title: evento.titulo,
            start: evento.fecha_inicio,
            end: evento.fecha_fin,
            allDay: evento.dia_completo === '1',
            backgroundColor: evento.color || coloresEventos[evento.tipo] || coloresEventos.evento,
            borderColor: evento.color || coloresEventos[evento.tipo] || coloresEventos.evento,
            extendedProps: {
              tipo: evento.tipo || 'evento',
              descripcion: evento.descripcion,
              creador: evento.nombre_usuario ? `${evento.nombre_usuario} ${evento.apellidos_usuario}` : user.nombre,
              departamento: evento.nombre_departamento || '',
              eventoOriginal: evento
            }
          }))
          eventosFormateados.push(...eventosCalendario)
        }
        
        // Agregar tareas si el filtro está activado
        if (filtros.verTareas && data.tareas) {
          const tareasCalendario = data.tareas.map(tarea => {
            // Definir color según estado de la tarea
            let color = tarea.color || coloresEventos.tarea
            if (tarea.estado === 'completada') {
              color = '#10b981' // verde para completadas
            } else if (tarea.estado === 'cancelada') {
              color = '#6b7280' // gris para canceladas
            }
            
            return {
              id: `tarea_${tarea.id}`,
              title: `🔔 ${tarea.titulo}`,
              start: tarea.fecha_inicio,
              end: tarea.fecha_fin,
              allDay: true,
              backgroundColor: color,
              borderColor: color,
              textColor: '#ffffff',
              extendedProps: {
                tipo: 'tarea',
                descripcion: tarea.descripcion,
                prioridad: tarea.prioridad,
                estado: tarea.estado,
                eventoOriginal: tarea
              }
            }
          })
          eventosFormateados.push(...tareasCalendario)
        }
        
        // Agregar fichajes si el filtro está activado
        if (filtros.verFichajes && data.fichajes) {
          const fichajesCalendario = data.fichajes.map(fichaje => ({
            id: `fichaje_${fichaje.id}`,
            title: fichaje.titulo,
            start: fichaje.fecha_inicio,
            end: fichaje.fecha_fin,
            backgroundColor: fichaje.color || coloresEventos.fichaje,
            borderColor: fichaje.color || coloresEventos.fichaje,
            extendedProps: {
              tipo: 'fichaje',
              eventoOriginal: fichaje
            }
          }))
          eventosFormateados.push(...fichajesCalendario)
        }
        
        setEventos(eventosFormateados)
      } else {
        throw new Error(data.message || 'Error al cargar eventos')
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
    const tipoEvento = info.event.extendedProps.tipo
    
    // Si es un fichaje, no mostrar modal
    if (tipoEvento === 'fichaje') {
      return
    }
    
    // Si es una tarea, redirigir a la página de tareas
    if (tipoEvento === 'tarea') {
      // En una implementación futura se podría abrir el detalle de la tarea
      return
    }
    
    // Para eventos normales, mostrar modal
    setModalEvento({
      id: info.event.id.replace('evento_', ''),
      titulo: info.event.title,
      inicio: info.event.start,
      fin: info.event.end,
      diaCompleto: info.event.allDay,
      color: info.event.backgroundColor,
      descripcion: info.event.extendedProps.descripcion,
      tipo: info.event.extendedProps.tipo,
      creador: info.event.extendedProps.creador,
      departamento: info.event.extendedProps.departamento,
      modo: 'ver'
    })
  }

  // Función para crear un nuevo evento
  const handleDateSelect = (selectInfo) => {
    if (filtros.verDepartamento) return // No crear eventos en vista departamental
    
    setModalEvento({
      id: null,
      titulo: '',
      inicio: selectInfo.start,
      fin: selectInfo.end,
      diaCompleto: selectInfo.allDay,
      color: coloresEventos.evento,
      descripcion: '',
      tipo: 'evento',
      modo: 'crear'
    })
  }

  // Función para cerrar el modal
  const cerrarModal = () => {
    setModalEvento(null)
  }

  // Función para guardar un evento
  const guardarEvento = async (evento) => {
    try {
      // Preparar datos para enviar a la API
      const datosEvento = {
        titulo: evento.titulo,
        descripcion: evento.descripcion,
        fecha_inicio: evento.inicio.toISOString().slice(0, 19).replace('T', ' '),
        fecha_fin: evento.fin ? evento.fin.toISOString().slice(0, 19).replace('T', ' ') : null,
        tipo: evento.tipo,
        color: evento.color,
        dia_completo: evento.diaCompleto ? 1 : 0
      }
      
      let url, method
      
      if (evento.modo === 'crear') {
        url = `${import.meta.env.VITE_API_URL}/calendario.php`
        method = 'POST'
      } else {
        url = `${import.meta.env.VITE_API_URL}/calendario.php?id=${evento.id.replace('evento_', '')}`
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
      const url = `${import.meta.env.VITE_API_URL}/calendario.php?id=${eventoId.replace('evento_', '')}`
      
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

  return (
    <div className={`container mx-auto px-4 py-8 ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
      <h1 className="text-3xl font-bold mb-6">Calendario</h1>
      
      {/* Filtros */}
      <div className={`mb-6 p-4 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow`}>
        <div className="flex flex-wrap gap-3">
          <h3 className="w-full text-lg font-medium mb-2">Mostrar en calendario:</h3>
          
          <button
            onClick={() => toggleFiltro('verEventos')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${filtros.verEventos 
              ? isDarkMode ? 'bg-blue-700 text-white' : 'bg-blue-100 text-blue-800'
              : isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'}`}
          >
            <span className="mr-1.5">🗓️</span>
            Eventos
          </button>
          
          <button
            onClick={() => toggleFiltro('verTareas')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${filtros.verTareas
              ? isDarkMode ? 'bg-yellow-700 text-white' : 'bg-yellow-100 text-yellow-800'
              : isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'}`}
          >
            <span className="mr-1.5">🔔</span>
            Tareas
          </button>
          
          <button
            onClick={() => toggleFiltro('verFichajes')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${filtros.verFichajes
              ? isDarkMode ? 'bg-green-700 text-white' : 'bg-green-100 text-green-800'
              : isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'}`}
          >
            <span className="mr-1.5">⏱️</span>
            Fichajes
          </button>
          
          <button
            onClick={() => toggleFiltro('verDepartamento')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${filtros.verDepartamento
              ? isDarkMode ? 'bg-purple-700 text-white' : 'bg-purple-100 text-purple-800'
              : isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'}`}
          >
            <span className="mr-1.5">👥</span>
            Eventos del departamento
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
          selectable={!filtros.verDepartamento}
          selectMirror={true}
          dayMaxEvents={true}
          weekends={true}
          events={eventos}
          select={handleDateSelect}
          eventClick={handleEventClick}
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
      
      {/* Leyenda */}
      <CalendarioLeyenda coloresEventos={coloresEventos} isDarkMode={isDarkMode} />
      
      {/* Modal de evento */}
      {modalEvento && (
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
          soloLectura={filtros.verDepartamento && modalEvento.creador !== user.nombre}
        />
      )}
    </div>
  )
}

export default Calendario
