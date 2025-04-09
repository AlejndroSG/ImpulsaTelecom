import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom/client'

// Componente de prueba para el calendario híbrido
const TestHibrido = () => {
  const [eventos, setEventos] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filtro, setFiltro] = useState('todos') // 'todos', 'personal', 'departamental'
  
  // URL base de la API
  const apiUrl = 'http://localhost/ImpulsaTelecom/backend/api'
  
  useEffect(() => {
    cargarEventos()
  }, [filtro])
  
  const cargarEventos = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      // Calcular rango de fechas (3 meses atrás y 6 meses adelante)
      const fechaActual = new Date()
      const fechaInicio = new Date(fechaActual.getFullYear(), fechaActual.getMonth() - 3, 1)
      const fechaFin = new Date(fechaActual.getFullYear(), fechaActual.getMonth() + 6, 0)
      
      // Formatear fechas para la API
      const inicio = fechaInicio.toISOString().split('T')[0]
      const fin = fechaFin.toISOString().split('T')[0]
      
      // Construir URL según el filtro seleccionado
      let url = `${apiUrl}/calendario.php?hibrido=true&incluir_departamento=true&inicio=${inicio}&fin=${fin}`
      
      if (filtro !== 'todos') {
        url += `&tipo=${filtro}`
      }
      
      console.log('Consultando URL:', url)
      
      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache, no-store'
        }
      })
      
      if (!response.ok) {
        throw new Error(`Error en la respuesta del servidor: ${response.status}`)
      }
      
      const data = await response.json()
      console.log('Respuesta de la API:', data)
      
      if (!data.success) {
        throw new Error(data.message || 'Error desconocido')
      }
      
      setEventos(data.eventos || [])
    } catch (error) {
      console.error('Error al cargar eventos:', error)
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }
  
  // Función para cambiar el filtro
  const cambiarFiltro = (nuevoFiltro) => {
    setFiltro(nuevoFiltro)
  }
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Prueba de Calendario Híbrido</h1>
      
      {/* Filtros */}
      <div className="mb-6 p-4 bg-white rounded-lg shadow">
        <h2 className="text-lg font-medium mb-2">Filtrar eventos:</h2>
        <div className="flex gap-2">
          <button 
            onClick={() => cambiarFiltro('todos')}
            className={`px-3 py-1.5 rounded-md ${filtro === 'todos' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            Todos
          </button>
          <button 
            onClick={() => cambiarFiltro('personal')}
            className={`px-3 py-1.5 rounded-md ${filtro === 'personal' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            Personales
          </button>
          <button 
            onClick={() => cambiarFiltro('departamental')}
            className={`px-3 py-1.5 rounded-md ${filtro === 'departamental' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            Departamentales
          </button>
        </div>
      </div>
      
      {/* Estado de carga */}
      {isLoading && (
        <div className="flex justify-center my-8">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900"></div>
        </div>
      )}
      
      {/* Mensaje de error */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p><strong>Error:</strong> {error}</p>
        </div>
      )}
      
      {/* Lista de eventos */}
      {!isLoading && !error && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Eventos encontrados: {eventos.length}</h2>
          
          {eventos.length > 0 ? (
            <div className="grid gap-4">
              {eventos.map(evento => (
                <div 
                  key={evento.id} 
                  className="p-4 rounded-lg shadow" 
                  style={{ 
                    backgroundColor: evento.tipo_evento === 'personal' ? '#e6f7ff' : '#f3e8ff',
                    borderLeft: `4px solid ${evento.tipo_evento === 'personal' ? '#3788d8' : '#8b5cf6'}`
                  }}
                >
                  <div className="flex justify-between items-start">
                    <h3 className="text-lg font-medium">{evento.titulo}</h3>
                    <span className="px-2 py-1 text-xs rounded-full" style={{
                      backgroundColor: evento.tipo_evento === 'personal' ? '#bfdbfe' : '#ddd6fe',
                      color: evento.tipo_evento === 'personal' ? '#1e40af' : '#5b21b6'
                    }}>
                      {evento.tipo_evento === 'personal' ? 'Personal' : 'Departamental'}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 mt-2">{evento.descripcion}</p>
                  
                  <div className="mt-3 text-sm text-gray-500">
                    <p><strong>Inicio:</strong> {new Date(evento.fecha_inicio).toLocaleString()}</p>
                    {evento.fecha_fin && (
                      <p><strong>Fin:</strong> {new Date(evento.fecha_fin).toLocaleString()}</p>
                    )}
                    <p><strong>Creado por:</strong> {evento.nombre_usuario} {evento.apellidos_usuario}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 italic">No se encontraron eventos con el filtro actual.</p>
          )}
        </div>
      )}
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <TestHibrido />
  </React.StrictMode>
)
