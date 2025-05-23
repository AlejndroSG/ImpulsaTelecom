import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { FaExclamationTriangle, FaExclamationCircle, FaQuestion, FaRegLightbulb, FaArrowRight } from 'react-icons/fa'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import FormularioIncidencia from './FormularioIncidencia'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Link } from 'react-router-dom'

const API_URL = 'http://localhost/ImpulsaTelecom/backend/api'

const ReportesWidget = () => {
  const { token } = useAuth()
  const { isDarkMode } = useTheme()
  const [reportes, setReportes] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [mensajeExito, setMensajeExito] = useState('')
  
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
    cargarReportes()
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
  
  return (
    <div className={`h-full flex flex-col rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-md`}>
      {/* Cabecera del widget */}
      <div className="border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex justify-between items-center">
          <Link to="/reportes" className="group flex items-center gap-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">Mis Reportes</h2>
            <FaArrowRight className="opacity-0 group-hover:opacity-100 transition-opacity" size={14} />
          </Link>
          <button
            onClick={() => setMostrarFormulario(true)}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md transition-colors">
            Nuevo Reporte
          </button>
        </div>
      </div>
      
      {/* Mensaje de u00e9xito */}
      {mensajeExito && (
        <div className="m-4 p-3 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-md">
          {mensajeExito}
        </div>
      )}
      
      {/* Mensaje de error */}
      {error && (
        <div className="m-4 p-3 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-md">
          {error}
        </div>
      )}
      
      {/* Contenido principal */}
      <div className="flex-1 overflow-y-auto hide-scrollbar p-4 space-y-3">
        {cargando ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : reportes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
            <p className="mb-4">No tienes reportes registrados</p>
            <button
              onClick={() => setMostrarFormulario(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors">
              Crear tu primer reporte
            </button>
          </div>
        ) : (
          reportes.slice(0, 5).map((reporte) => (
            <div 
              key={reporte.id}
              className={`p-3 rounded-lg border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  {getIconoTipo(reporte.tipo)}
                  <span className="font-medium text-gray-800 dark:text-white">{reporte.titulo}</span>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${getEstadoClase(reporte.estado)}`}>
                  {reporte.estado.replace('_', ' ')}
                </span>
              </div>
              
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                {reporte.descripcion}
              </p>
              
              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                {format(new Date(reporte.fecha_creacion), "d 'de' MMMM 'de' yyyy, HH:mm", { locale: es })}
              </div>
            </div>
          ))
        )}
      </div>
      
      {/* Ver todos los reportes */}
      {reportes.length > 5 && (
        <div className="p-3 border-t border-gray-200 dark:border-gray-700 text-center">
          <a 
            href="/reportes" 
            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
          >
            Ver todos mis reportes ({reportes.length})
          </a>
        </div>
      )}
      
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

export default ReportesWidget
