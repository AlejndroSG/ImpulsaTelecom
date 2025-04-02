import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import TareasWidget from '../components/TareasWidget'
import TareasDepartamentoWidget from '../components/TareasDepartamentoWidget'
import EstadisticasTareasWidget from '../components/EstadisticasTareasWidget'

const Tareas = () => {
  const { user } = useAuth()
  const { isDarkMode } = useTheme()
  const [activeTab, setActiveTab] = useState('misTareas')
  const [estadisticas, setEstadisticas] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [retryCount, setRetryCount] = useState(0)

  // Cargar estadísticas de tareas al iniciar
  const fetchEstadisticas = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/tareas.php?estadisticas=true`, {
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
        throw new Error(`Error al cargar estadísticas: ${response.status}`)
      }

      const data = await response.json()
      if (data.success) {
        setEstadisticas(data.estadisticas)
      } else {
        throw new Error(data.message || 'Error al cargar estadísticas')
      }
    } catch (error) {
      console.error('Error:', error)
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }, []);

  // Manejar reintentos automáticos si hay errores
  useEffect(() => {
    fetchEstadisticas()
  }, [fetchEstadisticas, retryCount])

  // Función para reintentar manualmente
  const handleRetry = () => {
    setRetryCount(prev => prev + 1)
  }

  return (
    <div className={`container mx-auto px-4 py-8 ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
      <h1 className="text-3xl font-bold mb-6">Gestión de Tareas</h1>
      
      {/* Estadísticas de tareas */}
      <div className="mb-8">
        <EstadisticasTareasWidget 
          estadisticas={estadisticas} 
          isLoading={isLoading} 
          error={error} 
          onRetry={handleRetry}
        />
      </div>

      {/* Tabs para cambiar entre mis tareas y tareas del departamento */}
      <div className="mb-6 border-b border-gray-300">
        <ul className="flex flex-wrap -mb-px">
          <li className="mr-2">
            <button
              className={`inline-block p-4 rounded-t-lg ${activeTab === 'misTareas' 
                ? `${isDarkMode ? 'text-blue-400 border-blue-400' : 'text-blue-600 border-blue-600'} border-b-2` 
                : `${isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-600'} hover:border-gray-300 border-b-2 border-transparent`}`}
              onClick={() => setActiveTab('misTareas')}
            >
              Mis Tareas
            </button>
          </li>
          <li className="mr-2">
            <button
              className={`inline-block p-4 rounded-t-lg ${activeTab === 'departamento' 
                ? `${isDarkMode ? 'text-blue-400 border-blue-400' : 'text-blue-600 border-blue-600'} border-b-2` 
                : `${isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-600'} hover:border-gray-300 border-b-2 border-transparent`}`}
              onClick={() => setActiveTab('departamento')}
            >
              Tareas del Departamento
            </button>
          </li>
        </ul>
      </div>

      {/* Contenido según la pestaña activa */}
      <div className="mt-4">
        {activeTab === 'misTareas' ? (
          <TareasWidget />
        ) : (
          <TareasDepartamentoWidget />
        )}
      </div>
    </div>
  )
}

export default Tareas
