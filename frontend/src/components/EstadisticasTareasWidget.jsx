import React from 'react'
import { useTheme } from '../context/ThemeContext'

const EstadisticasTareasWidget = ({ estadisticas, isLoading, error, onRetry }) => {
  const { isDarkMode } = useTheme()

  // Colores para los diferentes estados
  const colores = {
    pendiente: isDarkMode ? '#fcd34d' : '#fbbf24',
    en_progreso: isDarkMode ? '#60a5fa' : '#3b82f6',
    completada: isDarkMode ? '#34d399' : '#10b981',
    cancelada: isDarkMode ? '#f87171' : '#ef4444'
  }

  // Renderizar tarjeta de estadística
  const renderTarjeta = (titulo, valor, color, icono) => (
    <div className={`p-4 rounded-lg shadow ${isDarkMode ? 'bg-gray-700' : 'bg-white'}`}>
      <div className="flex items-center">
        <div className="flex-shrink-0 mr-3">
          <div className="p-3 rounded-full" style={{ backgroundColor: color + (isDarkMode ? '30' : '20') }}>
            {icono}
          </div>
        </div>
        <div>
          <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>{titulo}</p>
          <p className={`text-2xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{valor}</p>
        </div>
      </div>
    </div>
  )

  // Verificar si las estadísticas son válidas
  const tieneEstadisticasValidas = estadisticas && 
    typeof estadisticas === 'object' && 
    !Array.isArray(estadisticas) && 
    Object.keys(estadisticas).length > 0;

  // Mensaje de error personalizado
  const mensajeError = error ? (
    error.includes('JSON') ? 'Error de comunicación con el servidor. Por favor, inténtelo de nuevo más tarde.' : error
  ) : 'No hay estadísticas disponibles.';

  // Función para manejar el clic en el botón de reintento
  const handleRetryClick = () => {
    if (onRetry) {
      onRetry();
    } else {
      window.location.reload();
    }
  };

  return (
    <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-6`}>
      <h2 className={`text-xl font-semibold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Resumen de Tareas</h2>
      
      {isLoading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-500"></div>
        </div>
      ) : error ? (
        <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-800'}`}>
          {mensajeError}
          <button 
            onClick={handleRetryClick} 
            className={`mt-2 px-4 py-2 rounded ${isDarkMode ? 'bg-red-800 hover:bg-red-700' : 'bg-red-200 hover:bg-red-300'} text-sm`}
          >
            Reintentar
          </button>
        </div>
      ) : !tieneEstadisticasValidas ? (
        <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
          No hay estadísticas disponibles.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {renderTarjeta(
            'Tareas Pendientes',
            estadisticas.pendientes || 0,
            colores.pendiente,
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke={colores.pendiente}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
          
          {renderTarjeta(
            'En Progreso',
            estadisticas.en_progreso || 0,
            colores.en_progreso,
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke={colores.en_progreso}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          )}
          
          {renderTarjeta(
            'Completadas',
            estadisticas.completadas || 0,
            colores.completada,
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke={colores.completada}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          )}
          
          {renderTarjeta(
            'Total de Tareas',
            estadisticas.total || 0,
            isDarkMode ? '#9ca3af' : '#6b7280',
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke={isDarkMode ? '#9ca3af' : '#6b7280'}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          )}
        </div>
      )}
      
      {tieneEstadisticasValidas && estadisticas.proximas_vencimiento && estadisticas.proximas_vencimiento.length > 0 && (
        <div className="mt-8">
          <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Próximas a vencer</h3>
          <div className="overflow-x-auto">
            <table className={`min-w-full ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              <thead>
                <tr className={`${isDarkMode ? 'border-gray-700' : 'border-gray-200'} border-b`}>
                  <th className="py-3 px-4 text-left">Título</th>
                  <th className="py-3 px-4 text-left">Prioridad</th>
                  <th className="py-3 px-4 text-left">Vencimiento</th>
                </tr>
              </thead>
              <tbody>
                {estadisticas.proximas_vencimiento.map((tarea, index) => (
                  <tr key={index} className={`${isDarkMode ? 'border-gray-700' : 'border-gray-200'} border-b`}>
                    <td className="py-3 px-4">{tarea.titulo}</td>
                    <td className="py-3 px-4">
                      <span 
                        className={`px-2 py-1 rounded text-xs ${tarea.prioridad === 'alta' 
                          ? (isDarkMode ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-800')
                          : tarea.prioridad === 'media'
                            ? (isDarkMode ? 'bg-yellow-900 text-yellow-200' : 'bg-yellow-100 text-yellow-800')
                            : (isDarkMode ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800')
                        }`}
                      >
                        {tarea.prioridad.charAt(0).toUpperCase() + tarea.prioridad.slice(1)}
                      </span>
                    </td>
                    <td className="py-3 px-4">{new Date(tarea.fecha_vencimiento).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default EstadisticasTareasWidget
