import React from 'react'

const TareaItem = ({ tarea, colores, isDarkMode, onStatusChange }) => {
  // Función para cambiar el estado de una tarea
  const cambiarEstadoTarea = async (id, nuevoEstado) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/tareas.php?id=${id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ estado: nuevoEstado })
      })

      // Verificar si la respuesta es JSON
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text()
        console.error('Received non-JSON response:', text)
        throw new Error('El servidor no devolvió una respuesta JSON válida')
      }

      if (!response.ok) {
        throw new Error(`Error al actualizar tarea: ${response.status}`)
      }

      const data = await response.json()
      if (data.success) {
        // Notificar al componente padre para que actualice la lista
        if (onStatusChange) onStatusChange()
      } else {
        throw new Error(data.message || 'Error al actualizar tarea')
      }
    } catch (error) {
      console.error('Error:', error)
      alert(error.message)
    }
  }

  // Eliminar una tarea
  const eliminarTarea = async (id) => {
    if (!confirm('¿Estás seguro de eliminar esta tarea?')) return
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/tareas.php?id=${id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Accept': 'application/json'
        }
      })

      // Verificar si la respuesta es JSON
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text()
        console.error('Received non-JSON response:', text)
        throw new Error('El servidor no devolvió una respuesta JSON válida')
      }

      if (!response.ok) {
        throw new Error(`Error al eliminar tarea: ${response.status}`)
      }

      const data = await response.json()
      if (data.success) {
        // Notificar al componente padre para que actualice la lista
        if (onStatusChange) onStatusChange()
      } else {
        throw new Error(data.message || 'Error al eliminar tarea')
      }
    } catch (error) {
      console.error('Error:', error)
      alert(error.message)
    }
  }

  // Renderizar el estado con color
  const renderEstado = (estado) => {
    const estilos = {
      pendiente: `${isDarkMode ? 'bg-yellow-900 text-yellow-200' : 'bg-yellow-100 text-yellow-800'}`,
      en_progreso: `${isDarkMode ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800'}`,
      completada: `${isDarkMode ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800'}`,
      cancelada: `${isDarkMode ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-800'}`
    }
    
    const nombres = {
      pendiente: 'Pendiente',
      en_progreso: 'En progreso',
      completada: 'Completada',
      cancelada: 'Cancelada'
    }
    
    return (
      <span className={`px-2 py-1 rounded text-xs ${estilos[estado]}`}>
        {nombres[estado]}
      </span>
    )
  }

  // Renderizar la prioridad con color
  const renderPrioridad = (prioridad) => {
    const estilos = {
      baja: `${isDarkMode ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800'}`,
      media: `${isDarkMode ? 'bg-yellow-900 text-yellow-200' : 'bg-yellow-100 text-yellow-800'}`,
      alta: `${isDarkMode ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-800'}`
    }
    
    const nombres = {
      baja: 'Baja',
      media: 'Media',
      alta: 'Alta'
    }
    
    return (
      <span className={`px-2 py-1 rounded text-xs ${estilos[prioridad]}`}>
        {nombres[prioridad]}
      </span>
    )
  }

  return (
    <div className={`p-4 rounded-lg shadow ${isDarkMode ? 'bg-gray-700' : 'bg-white'}`}>
      <div className="flex justify-between">
        <div>
          <h3 className={`font-medium text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{tarea.titulo}</h3>
          <p className={`mt-1 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{tarea.descripcion}</p>
          
          <div className="mt-3 flex flex-wrap gap-2">
            {renderEstado(tarea.estado)}
            {renderPrioridad(tarea.prioridad)}
            <span className={`px-2 py-1 rounded text-xs ${isDarkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
              Vence: {tarea.fecha_vencimiento ? new Date(tarea.fecha_vencimiento).toLocaleDateString() : 'Sin fecha'}
            </span>
          </div>
        </div>
        
        <div className="flex space-x-2">
          {tarea.estado !== 'completada' && (
            <button
              onClick={() => cambiarEstadoTarea(tarea.id, 'completada')}
              className={`p-2 rounded-full ${isDarkMode ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-100 hover:bg-gray-200'}`}
              title="Marcar como completada"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke={colores.completada}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </button>
          )}
          
          {tarea.estado === 'pendiente' && (
            <button
              onClick={() => cambiarEstadoTarea(tarea.id, 'en_progreso')}
              className={`p-2 rounded-full ${isDarkMode ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-100 hover:bg-gray-200'}`}
              title="Marcar en progreso"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke={colores.en_progreso}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </button>
          )}
          
          <button
            onClick={() => eliminarTarea(tarea.id)}
            className={`p-2 rounded-full ${isDarkMode ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-100 hover:bg-gray-200'}`}
            title="Eliminar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke={colores.cancelada}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

export default TareaItem
