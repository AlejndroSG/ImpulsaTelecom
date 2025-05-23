import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import FormularioIncidencia from '../components/FormularioIncidencia'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { 
  FaExclamationTriangle, FaRegLightbulb, FaQuestion, FaExclamationCircle,
  FaFilter, FaPlus, FaSearch, FaTrash, FaTimes, FaCheck,
  FaSpinner, FaClock, FaSort, FaSortUp, FaSortDown
} from 'react-icons/fa'

const API_URL = 'http://localhost/ImpulsaTelecom/backend/api'

const Reportes = () => {
  const { token, user } = useAuth()
  const { isDarkMode } = useTheme()
  const [reportes, setReportes] = useState([])
  const [reporteSeleccionado, setReporteSeleccionado] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [mensajeExito, setMensajeExito] = useState('')
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [filtros, setFiltros] = useState({
    estado: '',
    tipo: ''
  })
  const [ordenacion, setOrdenacion] = useState({
    campo: 'fecha_creacion',
    direccion: 'desc'
  })
  const [busqueda, setBusqueda] = useState('')
  
  // Cargar reportes del usuario
  const cargarReportes = async () => {
    setCargando(true)
    setError('')
    
    try {
      const response = await axios.get(`${API_URL}/incidencias.php`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        withCredentials: false // Deshabilitar explicitamente el envio de cookies
      })
      
      if (response.data.success) {
        setReportes(response.data.incidencias || [])
      } else {
        setError(response.data.message || 'Error al cargar los reportes')
      }
    } catch (error) {
      console.error('Error al cargar reportes:', error)
      setError('No se pudieron cargar los reportes. Intu00e9ntalo de nuevo mu00e1s tarde.')
    } finally {
      setCargando(false)
    }
  }
  
  // Cargar reportes al montar el componente
  useEffect(() => {
    if (token) {
      cargarReportes()
    }
  }, [token])
  
  // Mostrar mensaje de u00e9xito temporalmente
  useEffect(() => {
    if (mensajeExito) {
      const timer = setTimeout(() => setMensajeExito(''), 5000)
      return () => clearTimeout(timer)
    }
  }, [mensajeExito])
  
  // Manejar envio exitoso de formulario
  const handleSuccess = (mensaje) => {
    setMensajeExito(mensaje)
    cargarReportes() // Recargar lista de reportes
    setMostrarFormulario(false)
  }
  
  // Iconos para los diferentes tipos de reporte
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
  
  // Clases de estado para estilizar cada reporte
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
  
  // Ordenar reportes
  const ordenarReportes = (campo) => {
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
  
  // Obtener reportes filtrados y ordenados
  const getReportesFiltrados = () => {
    // Aplicar filtros
    let filtrados = reportes
    
    if (filtros.estado) {
      filtrados = filtrados.filter(reporte => reporte.estado === filtros.estado)
    }
    
    if (filtros.tipo) {
      filtrados = filtrados.filter(reporte => reporte.tipo === filtros.tipo)
    }
    
    // Aplicar bu00fasqueda
    if (busqueda.trim()) {
      const termino = busqueda.toLowerCase()
      filtrados = filtrados.filter(reporte => 
        reporte.titulo.toLowerCase().includes(termino) ||
        reporte.descripcion.toLowerCase().includes(termino)
      )
    }
    
    // Ordenar
    return filtrados.sort((a, b) => {
      let valorA = a[ordenacion.campo]
      let valorB = b[ordenacion.campo]
      
      // Convertir a nu00fameros si son fechas
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
  
  // Cerrar un reporte resuelto
  const cerrarReporte = async (id) => {
    try {
      const response = await axios.put(`${API_URL}/incidencias.php?id=${id}`, {
        estado: 'cerrado'
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.data.success) {
        setMensajeExito('Reporte cerrado correctamente')
        cargarReportes()
        
        // Si es el reporte seleccionado, actualizarlo
        if (reporteSeleccionado && reporteSeleccionado.id === id) {
          setReporteSeleccionado({...reporteSeleccionado, estado: 'cerrado'})
        }
      } else {
        setError(response.data.message || 'Error al cerrar el reporte')
      }
    } catch (error) {
      console.error('Error al cerrar reporte:', error)
      setError('Error al cerrar el reporte. Intu00e9ntalo de nuevo mu00e1s tarde.')
    }
  }
  
  // Lista de reportes filtrados
  const reportesFiltrados = getReportesFiltrados()
  
  return (
    <div className={`min-h-screen p-4 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-800'}`}>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Mis Reportes</h1>
          <button
            onClick={() => setMostrarFormulario(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <FaPlus /> Nuevo Reporte
          </button>
        </div>
        
        {/* Mensajes de u00e9xito o error */}
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
          {/* Panel izquierdo - Lista de reportes */}
          <div className="lg:w-2/3 bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
            {/* Barra de bu00fasqueda y filtros */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex flex-wrap gap-2 items-center justify-between">
              {/* Bu00fasqueda */}
              <div className="relative flex-grow max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaSearch className="text-gray-400" />
                </div>
                <input
                  type="text"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Buscar en mis reportes..."
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              
              {/* Filtros */}
              <div className="flex flex-wrap gap-2">
                {/* Filtro de estado */}
                <select
                  value={filtros.estado}
                  onChange={(e) => setFiltros({...filtros, estado: e.target.value})}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
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
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Todos los tipos</option>
                  <option value="error">Error</option>
                  <option value="mejora">Mejora</option>
                  <option value="consulta">Consulta</option>
                  <option value="urgente">Urgente</option>
                </select>
              </div>
            </div>
            
            {/* Lista de reportes */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer" onClick={() => ordenarReportes('id')}>
                      <div className="flex items-center">
                        #
                        {ordenacion.campo === 'id' && (
                          ordenacion.direccion === 'asc' ? <FaSortUp className="ml-1" /> : <FaSortDown className="ml-1" />
                        )}
                        {ordenacion.campo !== 'id' && <FaSort className="ml-1 text-gray-400" />}
                      </div>
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Estado
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer" onClick={() => ordenarReportes('titulo')}>
                      <div className="flex items-center">
                        Tu00edtulo
                        {ordenacion.campo === 'titulo' && (
                          ordenacion.direccion === 'asc' ? <FaSortUp className="ml-1" /> : <FaSortDown className="ml-1" />
                        )}
                        {ordenacion.campo !== 'titulo' && <FaSort className="ml-1 text-gray-400" />}
                      </div>
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer" onClick={() => ordenarReportes('fecha_creacion')}>
                      <div className="flex items-center">
                        Fecha
                        {ordenacion.campo === 'fecha_creacion' && (
                          ordenacion.direccion === 'asc' ? <FaSortUp className="ml-1" /> : <FaSortDown className="ml-1" />
                        )}
                        {ordenacion.campo !== 'fecha_creacion' && <FaSort className="ml-1 text-gray-400" />}
                      </div>
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {cargando ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-4 text-center">
                        <div className="flex justify-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                        </div>
                      </td>
                    </tr>
                  ) : reportesFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                        No se encontraron reportes
                      </td>
                    </tr>
                  ) : (
                    reportesFiltrados.map(reporte => (
                      <tr 
                        key={reporte.id}
                        className={`
                          ${reporteSeleccionado?.id === reporte.id ? 'bg-blue-50 dark:bg-blue-900' : ''}
                          hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer
                        `}
                        onClick={() => setReporteSeleccionado(reporte)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          #{reporte.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getEstadoClase(reporte.estado)}`}>
                            {reporte.estado.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div className="flex items-center">
                            {getIconoTipo(reporte.tipo)}
                            <span className="ml-2 line-clamp-1">{reporte.titulo}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {format(new Date(reporte.fecha_creacion), "d MMM yyyy, HH:mm", { locale: es })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {/* Botones de acción según estado */}
                          {reporte.estado === 'resuelto' && (
                            <button 
                              onClick={(e) => {
                                e.stopPropagation()
                                cerrarReporte(reporte.id)
                              }}
                              className="text-blue-600 hover:text-blue-900 dark:hover:text-blue-400 mr-2"
                              title="Marcar como cerrado"
                            >
                              <FaCheck />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Panel derecho - Detalles del reporte seleccionado */}
          <div className="lg:w-1/3">
            {reporteSeleccionado ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-xl font-semibold">{reporteSeleccionado.titulo}</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Reporte #{reporteSeleccionado.id} - {format(new Date(reporteSeleccionado.fecha_creacion), "d 'de' MMMM 'de' yyyy, HH:mm", { locale: es })}
                    </p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${getEstadoClase(reporteSeleccionado.estado)}`}>
                    {reporteSeleccionado.estado.replace('_', ' ')}
                  </span>
                </div>
                
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex items-center gap-1 text-sm">
                    {getIconoTipo(reporteSeleccionado.tipo)}
                    <span className="capitalize">{reporteSeleccionado.tipo}</span>
                  </div>
                  <span className="text-gray-300 dark:text-gray-600">|</span>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Prioridad: <span className="capitalize">{reporteSeleccionado.prioridad}</span>
                  </div>
                </div>
                
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Descripción:</h3>
                  <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md text-sm">
                    {reporteSeleccionado.descripcion}
                  </div>
                </div>
                
                {/* Respuesta del administrador (si existe) */}
                {reporteSeleccionado.respuesta && (
                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Respuesta:</h3>
                    <div className="p-3 bg-blue-50 dark:bg-blue-900 rounded-md text-sm">
                      {reporteSeleccionado.respuesta}
                    </div>
                  </div>
                )}
                
                {/* Acciones */}
                <div className="mt-6 flex justify-between">
                  {/* Botones segu00fan el estado */}
                  <div className="space-x-2">
                    {reporteSeleccionado.estado === 'resuelto' && (
                      <button
                        onClick={() => cerrarReporte(reporteSeleccionado.id)}
                        className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      >
                        Marcar como cerrado
                      </button>
                    )}
                  </div>
                  
                  <button
                    onClick={() => setReporteSeleccionado(null)}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Volver a la lista
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 flex flex-col items-center justify-center h-64">
                <p className="text-gray-500 dark:text-gray-400 mb-4">Selecciona un reporte para ver los detalles</p>
                <FaExclamationCircle className="text-gray-400 text-4xl mb-4" />
                <button
                  onClick={() => setMostrarFormulario(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <FaPlus /> Crear nuevo reporte
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Modal de formulario */}
      {mostrarFormulario && (
        <FormularioIncidencia 
          onClose={() => setMostrarFormulario(false)}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  )
}

export default Reportes
