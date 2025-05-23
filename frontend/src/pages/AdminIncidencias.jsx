import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { 
  FaExclamationTriangle, FaRegLightbulb, FaQuestion, FaExclamationCircle,
  FaFilter, FaSearch, FaEnvelope, FaEnvelopeOpen, FaTimes, FaCheck,
  FaSpinner, FaClock, FaSort, FaSortUp, FaSortDown, FaTrash
} from 'react-icons/fa'

const API_URL = 'http://localhost/ImpulsaTelecom/backend/api'

const AdminIncidencias = () => {
  const { token, user } = useAuth()
  const { isDarkMode } = useTheme()
  const [incidencias, setIncidencias] = useState([])
  const [incidenciaSeleccionada, setIncidenciaSeleccionada] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [filtros, setFiltros] = useState({
    estado: '',
    tipo: '',
    prioridad: '',
    leido: ''
  })
  const [ordenacion, setOrdenacion] = useState({
    campo: 'fecha_creacion',
    direccion: 'desc'
  })
  const [busqueda, setBusqueda] = useState('')
  const [mensajeExito, setMensajeExito] = useState('')
  
  // Verificar si el usuario es administrador
  useEffect(() => {
    if (user && user.rol !== 'admin') {
      window.location.href = '/inicio'
    }
  }, [user])
  
  // Cargar todas las incidencias
  const cargarIncidencias = async () => {
    setCargando(true)
    setError('')
    
    try {
      // Construir URL con los filtros
      let url = `${API_URL}/incidencias.php`
      const params = new URLSearchParams()
      
      Object.keys(filtros).forEach(key => {
        if (filtros[key]) {
          params.append(key, filtros[key])
        }
      })
      
      if (params.toString()) {
        url += `?${params.toString()}`
      }
      
      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        withCredentials: false // Deshabilitar explicitamente el envio de cookies
      })
      
      if (response.data.success) {
        setIncidencias(response.data.incidencias || [])
      } else {
        setError(response.data.message || 'Error al cargar las incidencias')
      }
    } catch (error) {
      setError('No se pudieron cargar las incidencias. Intu00e9ntalo de nuevo mu00e1s tarde.')
    } finally {
      setCargando(false)
    }
  }
  
  // Cargar incidencias al montar el componente o cambiar filtros
  useEffect(() => {
    if (token) {
      cargarIncidencias()
    }
  }, [token, filtros])
  
  // Actualizar estado de una incidencia
  const actualizarEstadoIncidencia = async (id, nuevoEstado, respuesta = null) => {
    try {
      const data = { estado: nuevoEstado }
      if (respuesta) data.respuesta = respuesta
      
      const response = await axios.put(`${API_URL}/incidencias.php?id=${id}`, data, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.data.success) {
        // Actualizar la lista de incidencias
        cargarIncidencias()
        
        // Si hay una incidencia seleccionada, actualizarla
        if (incidenciaSeleccionada && incidenciaSeleccionada.id === id) {
          setIncidenciaSeleccionada({
            ...incidenciaSeleccionada,
            estado: nuevoEstado,
            respuesta: respuesta || incidenciaSeleccionada.respuesta
          })
        }
        
        setMensajeExito(`Incidencia #${id} actualizada correctamente`)
        
        // Ocultar mensaje de u00e9xito despuu00e9s de 3 segundos
        setTimeout(() => setMensajeExito(''), 3000)
        
        return true
      } else {
        setError(response.data.message || 'Error al actualizar la incidencia')
        return false
      }
    } catch (error) {
      setError('No se pudo actualizar la incidencia. Intu00e9ntalo de nuevo mu00e1s tarde.')
      return false
    }
  }
  
  // Eliminar una incidencia
  const eliminarIncidencia = async (id) => {
    if (!confirm('u00bfEstu00e1s seguro de que deseas eliminar esta incidencia? Esta acciu00f3n no se puede deshacer.')) {
      return
    }
    
    try {
      const response = await axios.delete(`${API_URL}/incidencias.php?id=${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.data.success) {
        // Si la incidencia eliminada era la seleccionada, limpiar la selecciu00f3n
        if (incidenciaSeleccionada && incidenciaSeleccionada.id === id) {
          setIncidenciaSeleccionada(null)
        }
        
        // Actualizar la lista de incidencias
        cargarIncidencias()
        
        setMensajeExito(`Incidencia #${id} eliminada correctamente`)
        
        // Ocultar mensaje de u00e9xito despuu00e9s de 3 segundos
        setTimeout(() => setMensajeExito(''), 3000)
      } else {
        setError(response.data.message || 'Error al eliminar la incidencia')
      }
    } catch (error) {
      setError('No se pudo eliminar la incidencia. Intu00e9ntalo de nuevo mu00e1s tarde.')
    }
  }
  
  // Marcar incidencia como leida
  const marcarComoLeida = async (id, leido = true) => {
    try {
      await axios.put(`${API_URL}/incidencias.php?id=${id}`, { leido: leido ? 1 : 0 }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      // Actualizar el estado en la lista local
      setIncidencias(prev => prev.map(inc => 
        inc.id === id ? { ...inc, leido: leido ? 1 : 0 } : inc
      ))
      
      return true
    } catch (error) {
      // Manejo silencioso del error
      return false
    }
  }
  
  // Ver detalles de una incidencia
  const verDetalles = async (incidencia) => {
    // Si la incidencia no ha sido leu00edda, marcarla como leu00edda
    if (incidencia.leido === '0' || incidencia.leido === 0) {
      await marcarComoLeida(incidencia.id)
      // Actualizar el estado de la incidencia en la lista local
      incidencia.leido = 1
    }
    
    setIncidenciaSeleccionada(incidencia)
  }
  
  // Ordenar incidencias
  const ordenarIncidencias = (campo) => {
    if (ordenacion.campo === campo) {
      // Cambiar dirección si es el mismo campo
      setOrdenacion({
        campo,
        direccion: ordenacion.direccion === 'asc' ? 'desc' : 'asc'
      })
    } else {
      // Nuevo campo, ordenar descendente por defecto
      setOrdenacion({
        campo,
        direccion: 'desc'
      })
    }
  }
  
  // Obtener incidencias filtradas y ordenadas
  const getIncidenciasFiltradas = () => {
    // Filtrar por búsqueda
    let filtradas = incidencias
    
    if (busqueda.trim()) {
      const termino = busqueda.toLowerCase()
      filtradas = filtradas.filter(inc => 
        inc.titulo.toLowerCase().includes(termino) ||
        inc.descripcion.toLowerCase().includes(termino) ||
        (inc.nombre && inc.nombre.toLowerCase().includes(termino)) ||
        (inc.apellidos && inc.apellidos.toLowerCase().includes(termino))
      )
    }
    
    // Ordenar
    return filtradas.sort((a, b) => {
      let valorA = a[ordenacion.campo]
      let valorB = b[ordenacion.campo]
      
      // Convertir a números si son fechas
      if (ordenacion.campo.includes('fecha')) {
        valorA = new Date(valorA).getTime()
        valorB = new Date(valorB).getTime()
      }
      
      // Comparar según dirección
      if (ordenacion.direccion === 'asc') {
        return valorA > valorB ? 1 : -1
      } else {
        return valorA < valorB ? 1 : -1
      }
    })
  }
  
  // Iconos para los diferentes tipos de incidencia
  const getIconoTipo = (tipo) => {
    switch (tipo) {
      case 'error':
        return <FaExclamationTriangle className="text-red-500" />
      case 'mejora':
        return <FaRegLightbulb className="text-yellow-500" />
      case 'consulta':
        return <FaQuestion className="text-blue-500" />
      case 'urgente':
        return <FaExclamationCircle className="text-red-600" />
      default:
        return <FaQuestion className="text-gray-500" />
    }
  }
  
  // Clases de estado para estilizar cada incidencia
  const getEstadoClase = (estado) => {
    switch (estado) {
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'en_progreso':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'resuelto':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'cerrado':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    }
  }
  
  // Componente para el formulario de respuesta
  const FormularioRespuesta = ({ incidencia }) => {
    const [respuesta, setRespuesta] = useState(incidencia.respuesta || '')
    const [enviando, setEnviando] = useState(false)
    
    const handleSubmit = async (e) => {
      e.preventDefault()
      setEnviando(true)
      
      const exito = await actualizarEstadoIncidencia(incidencia.id, 'resuelto', respuesta)
      setEnviando(false)
      
      if (!exito) {
        alert('Error al enviar la respuesta. Intenta de nuevo.')
      }
    }
    
    return (
      <form onSubmit={handleSubmit} className="mt-4">
        <div className="mb-4">
          <label className="block text-gray-700 dark:text-gray-300 mb-2">Respuesta al usuario</label>
          <textarea
            value={respuesta}
            onChange={(e) => setRespuesta(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            rows="4"
            placeholder="Escribe tu respuesta a esta incidencia..."
            required
          ></textarea>
        </div>
        
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => actualizarEstadoIncidencia(incidencia.id, 'en_progreso')}
            className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
            En progreso
          </button>
          <button
            type="submit"
            disabled={enviando}
            className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50">
            {enviando ? 'Enviando...' : 'Resolver incidencia'}
          </button>
        </div>
      </form>
    )
  }
  
  // Obtener la lista filtrada de incidencias
  const incidenciasFiltradas = getIncidenciasFiltradas()
  
  // Renderizar el componente
  return (
    <div className={`min-h-screen p-4 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-800'}`}>
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Gestión de Incidencias</h1>
        
        {/* Mensajes de éxito o error */}
        {mensajeExito && (
          <div className="mb-4 p-4 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-md">
            {mensajeExito}
          </div>
        )}
        
        {error && (
          <div className="mb-4 p-4 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-md">
            {error}
          </div>
        )}
        
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Panel izquierdo - Lista de incidencias */}
          <div className="lg:w-2/3 bg-white dark:bg-gray-800 rounded-lg shadow-md">
            {/* Barra de búsqueda y filtros */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex flex-wrap gap-2 items-center justify-between">
              {/* Búsqueda */}
              <div className="relative flex-grow max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaSearch className="text-gray-400" />
                </div>
                <input
                  type="text"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Buscar incidencias..."
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              
              {/* Botón de filtros */}
              <div className="flex flex-wrap gap-2">
                {/* Filtro de estado */}
                <select
                  value={filtros.estado}
                  onChange={(e) => setFiltros({...filtros, estado: e.target.value})}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white">
                  <option value="">Todos los estados</option>
                  <option value="pendiente">Pendiente</option>
                  <option value="en_progreso">En progreso</option>
                  <option value="resuelto">Resuelto</option>
                  <option value="cerrado">Cerrado</option>
                </select>
                
                {/* Filtro de tipo */}
                <select
                  value={filtros.tipo}
                  onChange={(e) => setFiltros({...filtros, tipo: e.target.value})}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white">
                  <option value="">Todos los tipos</option>
                  <option value="error">Error</option>
                  <option value="mejora">Mejora</option>
                  <option value="consulta">Consulta</option>
                  <option value="urgente">Urgente</option>
                </select>
                
                {/* Filtro de leídos/no leídos */}
                <select
                  value={filtros.leido}
                  onChange={(e) => setFiltros({...filtros, leido: e.target.value})}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white">
                  <option value="">Todos</option>
                  <option value="0">No leídos</option>
                  <option value="1">Leídos</option>
                </select>
              </div>
            </div>
            
            {/* Tabla de incidencias */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer" onClick={() => ordenarIncidencias('id')}>
                      <div className="flex items-center">
                        ID
                        {ordenacion.campo === 'id' && (
                          ordenacion.direccion === 'asc' ? <FaSortUp className="ml-1" /> : <FaSortDown className="ml-1" />
                        )}
                        {ordenacion.campo !== 'id' && <FaSort className="ml-1 text-gray-400" />}
                      </div>
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Estado
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer" onClick={() => ordenarIncidencias('titulo')}>
                      <div className="flex items-center">
                        Título
                        {ordenacion.campo === 'titulo' && (
                          ordenacion.direccion === 'asc' ? <FaSortUp className="ml-1" /> : <FaSortDown className="ml-1" />
                        )}
                        {ordenacion.campo !== 'titulo' && <FaSort className="ml-1 text-gray-400" />}
                      </div>
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer" onClick={() => ordenarIncidencias('fecha_creacion')}>
                      <div className="flex items-center">
                        Fecha
                        {ordenacion.campo === 'fecha_creacion' && (
                          ordenacion.direccion === 'asc' ? <FaSortUp className="ml-1" /> : <FaSortDown className="ml-1" />
                        )}
                        {ordenacion.campo !== 'fecha_creacion' && <FaSort className="ml-1 text-gray-400" />}
                      </div>
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Usuario
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {cargando ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-4 text-center">
                        <div className="flex justify-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                        </div>
                      </td>
                    </tr>
                  ) : incidenciasFiltradas.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                        No se encontraron incidencias
                      </td>
                    </tr>
                  ) : (
                    incidenciasFiltradas.map(incidencia => (
                      <tr 
                        key={incidencia.id}
                        className={`
                          ${incidenciaSeleccionada?.id === incidencia.id ? 'bg-blue-50 dark:bg-blue-900' : ''}
                          ${incidencia.leido === '0' || incidencia.leido === 0 ? 'font-semibold' : ''}
                          hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer
                        `}
                        onClick={() => verDetalles(incidencia)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center">
                            {(incidencia.leido === '0' || incidencia.leido === 0) && (
                              <FaEnvelope className="text-blue-500 mr-2" />
                            )}
                            #{incidencia.id}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getEstadoClase(incidencia.estado)}`}>
                            {incidencia.estado.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div className="flex items-center">
                            {getIconoTipo(incidencia.tipo)}
                            <span className="ml-2 line-clamp-1">{incidencia.titulo}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {format(new Date(incidencia.fecha_creacion), "d MMM yyyy, HH:mm", { locale: es })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {incidencia.nombre ? `${incidencia.nombre} ${incidencia.apellidos}` : incidencia.NIF_usuario}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation()
                              eliminarIncidencia(incidencia.id)
                            }}
                            className="text-red-600 hover:text-red-900 dark:hover:text-red-400 mr-2"
                          >
                            <FaTrash />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Panel derecho - Detalles de la incidencia seleccionada */}
          <div className="lg:w-1/3">
            {incidenciaSeleccionada ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-xl font-semibold">{incidenciaSeleccionada.titulo}</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Incidencia #{incidenciaSeleccionada.id} - {format(new Date(incidenciaSeleccionada.fecha_creacion), "d 'de' MMMM 'de' yyyy, HH:mm", { locale: es })}
                    </p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${getEstadoClase(incidenciaSeleccionada.estado)}`}>
                    {incidenciaSeleccionada.estado.replace('_', ' ')}
                  </span>
                </div>
                
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex items-center gap-1 text-sm">
                    {getIconoTipo(incidenciaSeleccionada.tipo)}
                    <span className="capitalize">{incidenciaSeleccionada.tipo}</span>
                  </div>
                  <span className="text-gray-300 dark:text-gray-600">|</span>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Prioridad: <span className="capitalize">{incidenciaSeleccionada.prioridad}</span>
                  </div>
                </div>
                
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Reportado por:</h3>
                  <div className="flex items-center">
                    <div className="ml-2">
                      <p className="text-sm font-medium">
                        {incidenciaSeleccionada.nombre 
                          ? `${incidenciaSeleccionada.nombre} ${incidenciaSeleccionada.apellidos}` 
                          : 'Usuario'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        NIF: {incidenciaSeleccionada.NIF_usuario}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Descripción:</h3>
                  <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md text-sm">
                    {incidenciaSeleccionada.descripcion}
                  </div>
                </div>
                
                {/* Respuesta (si existe) */}
                {incidenciaSeleccionada.respuesta && (
                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Respuesta:</h3>
                    <div className="p-3 bg-blue-50 dark:bg-blue-900 rounded-md text-sm">
                      {incidenciaSeleccionada.respuesta}
                    </div>
                  </div>
                )}
                
                {/* Formulario de respuesta (solo para incidencias pendientes o en progreso) */}
                {['pendiente', 'en_progreso'].includes(incidenciaSeleccionada.estado) && (
                  <FormularioRespuesta incidencia={incidenciaSeleccionada} />
                )}
                
                {/* Acciones adicionales */}
                <div className="mt-6 flex justify-between">
                  {/* Botones según el estado */}
                  <div className="space-x-2">
                    {incidenciaSeleccionada.estado === 'resuelto' && (
                      <button
                        onClick={() => actualizarEstadoIncidencia(incidenciaSeleccionada.id, 'cerrado')}
                        className="px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700">
                        Cerrar incidencia
                      </button>
                    )}
                    
                    {incidenciaSeleccionada.estado === 'cerrado' && (
                      <button
                        onClick={() => actualizarEstadoIncidencia(incidenciaSeleccionada.id, 'pendiente')}
                        className="px-3 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700">
                        Reabrir incidencia
                      </button>
                    )}
                  </div>
                  
                  <button
                    onClick={() => setIncidenciaSeleccionada(null)}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700">
                    Volver a la lista
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 flex flex-col items-center justify-center h-64">
                <p className="text-gray-500 dark:text-gray-400 mb-2">Selecciona una incidencia para ver sus detalles</p>
                <FaExclamationCircle className="text-gray-400 text-4xl" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminIncidencias
