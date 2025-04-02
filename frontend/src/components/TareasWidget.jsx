import React, { useState, useEffect, useCallback } from 'react'
import { useTheme } from '../context/ThemeContext'
import TareaItem from './TareaItem'

const TareasWidget = ({ titulo, tipo = 'misTareas' }) => {
  const { isDarkMode } = useTheme()
  const [tareas, setTareas] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filtros, setFiltros] = useState({
    estado: '',
    prioridad: '',
    fecha_desde: '',
    fecha_hasta: ''
  })
  const [retryCount, setRetryCount] = useState(0)

  // Colores para los diferentes estados
  const colores = { pendiente: '#fbbf24', en_progreso: '#3b82f6', completada: '#10b981', cancelada: '#ef4444' }

  // Cargar tareas del usuario
  const cargarTareas = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      // Construir URL con filtros
      let url = `${import.meta.env.VITE_API_URL}/tareas.php?mis_tareas=true`
      
      if (filtros.estado) url += `&estado=${filtros.estado}`
      if (filtros.prioridad) url += `&prioridad=${filtros.prioridad}`
      if (filtros.fecha_desde) url += `&fecha_desde=${filtros.fecha_desde}`
      if (filtros.fecha_hasta) url += `&fecha_hasta=${filtros.fecha_hasta}`
      
      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache, no-store'
        }
      })

      // Check if response is JSON
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        // Handle non-JSON response
        const text = await response.text()
        console.error('Received non-JSON response:', text)
        throw new Error('El servidor no devolvió una respuesta JSON válida')
      }

      if (!response.ok) {
        throw new Error(`Error al cargar tareas: ${response.status}`)
      }

      const data = await response.json()
      if (data.success) {
        setTareas(data.tareas || [])
      } else {
        throw new Error(data.message || 'Error al cargar tareas')
      }
    } catch (error) {
      console.error('Error:', error)
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }, [filtros]);

  // Cargar tareas cuando cambian los filtros o se solicita un reintento
  useEffect(() => {
    cargarTareas()
  }, [cargarTareas, retryCount])

  // Manejar cambios en los filtros
  const handleFiltroChange = (e) => {
    const { name, value } = e.target
    setFiltros(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // Función para reintentar manualmente
  const handleRetry = () => {
    setRetryCount(prev => prev + 1)
  }

  // Mensaje de error personalizado
  const mensajeError = error ? (
    error.includes('JSON') ? 'Error de comunicación con el servidor. Por favor, inténtelo de nuevo más tarde.' : error
  ) : 'No hay tareas disponibles.';

  return (
    <div className={`${isDarkMode ? 'bg-gray-800 text-gray-200' : 'bg-white text-gray-800'} rounded-lg shadow p-6`}>
      <h2 className="text-xl font-semibold mb-6">{titulo || 'Mis Tareas'}</h2>
      
      {/* Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div>
          <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Estado</label>
          <select 
            name="estado"
            value={filtros.estado}
            onChange={handleFiltroChange}
            className={`w-full p-2 rounded border ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-white border-gray-300'}`}
          >
            <option value="">Todos</option>
            <option value="pendiente">Pendiente</option>
            <option value="en_progreso">En Progreso</option>
            <option value="completada">Completada</option>
            <option value="cancelada">Cancelada</option>
          </select>
        </div>
        
        <div>
          <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Prioridad</label>
          <select 
            name="prioridad"
            value={filtros.prioridad}
            onChange={handleFiltroChange}
            className={`w-full p-2 rounded border ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-white border-gray-300'}`}
          >
            <option value="">Todas</option>
            <option value="alta">Alta</option>
            <option value="media">Media</option>
            <option value="baja">Baja</option>
          </select>
        </div>
        
        <div>
          <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Desde</label>
          <input 
            type="date" 
            name="fecha_desde"
            value={filtros.fecha_desde}
            onChange={handleFiltroChange}
            className={`w-full p-2 rounded border ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-white border-gray-300'}`}
          />
        </div>
        
        <div>
          <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Hasta</label>
          <input 
            type="date" 
            name="fecha_hasta"
            value={filtros.fecha_hasta}
            onChange={handleFiltroChange}
            className={`w-full p-2 rounded border ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-white border-gray-300'}`}
          />
        </div>
      </div>
      
      {/* Lista de tareas */}
      {isLoading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-500"></div>
        </div>
      ) : error ? (
        <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-800'}`}>
          {mensajeError}
          <button 
            onClick={handleRetry} 
            className={`mt-2 px-4 py-2 rounded ${isDarkMode ? 'bg-red-800 hover:bg-red-700' : 'bg-red-200 hover:bg-red-300'} text-sm`}
          >
            Reintentar
          </button>
        </div>
      ) : tareas.length === 0 ? (
        <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
          No hay tareas que coincidan con los filtros seleccionados.
        </div>
      ) : (
        <div className="space-y-4">
          {tareas.map((tarea, index) => (
            <TareaItem 
              key={index} 
              tarea={tarea} 
              colores={colores} 
              isDarkMode={isDarkMode} 
              onStatusChange={handleRetry}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default TareasWidget
