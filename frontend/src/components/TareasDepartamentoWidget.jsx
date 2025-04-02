import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

const TareasDepartamentoWidget = () => {
  const { user } = useAuth()
  const { isDarkMode } = useTheme()
  const [tareas, setTareas] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [compañeros, setCompañeros] = useState([])
  const [filtros, setFiltros] = useState({
    estado: '',
    prioridad: '',
    fecha_desde: '',
    fecha_hasta: '',
    NIF_asignado: ''
  })

  // Cargar tareas del departamento
  const cargarTareas = async () => {
    try {
      setIsLoading(true)
      
      // Construir URL con filtros
      let url = `${import.meta.env.VITE_API_URL}/tareas.php?departamento=true`
      
      if (filtros.estado) url += `&estado=${filtros.estado}`
      if (filtros.prioridad) url += `&prioridad=${filtros.prioridad}`
      if (filtros.fecha_desde) url += `&fecha_desde=${filtros.fecha_desde}`
      if (filtros.fecha_hasta) url += `&fecha_hasta=${filtros.fecha_hasta}`
      if (filtros.NIF_asignado) url += `&NIF_asignado=${filtros.NIF_asignado}`
      
      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Error al cargar tareas del departamento')
      }

      const data = await response.json()
      if (data.success) {
        setTareas(data.tareas)
        
        // Extraer compañeros únicos del departamento
        const compañerosUnicos = [...new Set(data.tareas.map(tarea => tarea.NIF_asignado))]
          .filter(nif => nif !== user.id) // Filtrar el usuario actual
          .map(nif => {
            const tarea = data.tareas.find(t => t.NIF_asignado === nif)
            return {
              NIF: nif,
              nombre: `${tarea.nombre_asignado || ''} ${tarea.apellidos_asignado || ''}`.trim() || 'Usuario'
            }
          })
        
        setCompañeros(compañerosUnicos)
      } else {
        throw new Error(data.message || 'Error al cargar tareas del departamento')
      }
    } catch (error) {
      console.error('Error:', error)
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  // Cargar tareas al iniciar y cuando cambien los filtros
  useEffect(() => {
    cargarTareas()
  }, [filtros])

  // Manejar cambios en los filtros
  const handleFiltroChange = (e) => {
    const { name, value } = e.target
    setFiltros(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // Resetear filtros
  const resetFiltros = () => {
    setFiltros({
      estado: '',
      prioridad: '',
      fecha_desde: '',
      fecha_hasta: '',
      NIF_asignado: ''
    })
  }

  // Renderizar el estado con color
  const renderEstado = (estado) => {
    const estilos = {
      pendiente: `${isDarkMode ? 'bg-yellow-800 text-yellow-200' : 'bg-yellow-100 text-yellow-800'}`,
      en_progreso: `${isDarkMode ? 'bg-blue-800 text-blue-200' : 'bg-blue-100 text-blue-800'}`,
      completada: `${isDarkMode ? 'bg-green-800 text-green-200' : 'bg-green-100 text-green-800'}`,
      cancelada: `${isDarkMode ? 'bg-red-800 text-red-200' : 'bg-red-100 text-red-800'}`
    }
    
    const nombres = {
      pendiente: 'Pendiente',
      en_progreso: 'En progreso',
      completada: 'Completada',
      cancelada: 'Cancelada'
    }
    
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${estilos[estado]}`}>
        {nombres[estado]}
      </span>
    )
  }

  // Renderizar la prioridad con color
  const renderPrioridad = (prioridad) => {
    const estilos = {
      baja: `${isDarkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-700'}`,
      media: `${isDarkMode ? 'bg-blue-700 text-blue-200' : 'bg-blue-100 text-blue-700'}`,
      alta: `${isDarkMode ? 'bg-red-700 text-red-200' : 'bg-red-100 text-red-700'}`
    }
    
    const nombres = {
      baja: 'Baja',
      media: 'Media',
      alta: 'Alta'
    }
    
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${estilos[prioridad]}`}>
        {nombres[prioridad]}
      </span>
    )
  }

  return (
    <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-6`}>
      <div className="flex justify-between items-center mb-6">
        <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Tareas del Departamento</h2>
      </div>

      {/* Filtros */}
      <div className={`mb-6 p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className={`block mb-2 text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Compañero</label>
            <select
              name="NIF_asignado"
              value={filtros.NIF_asignado}
              onChange={handleFiltroChange}
              className={`w-full p-2 rounded border ${isDarkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
            >
              <option value="">Todos</option>
              {compañeros.map(comp => (
                <option key={comp.NIF} value={comp.NIF}>{comp.nombre}</option>
              ))}
            </select>
          </div>
          
          <div className="flex-1 min-w-[200px]">
            <label className={`block mb-2 text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Estado</label>
            <select
              name="estado"
              value={filtros.estado}
              onChange={handleFiltroChange}
              className={`w-full p-2 rounded border ${isDarkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
            >
              <option value="">Todos</option>
              <option value="pendiente">Pendiente</option>
              <option value="en_progreso">En progreso</option>
              <option value="completada">Completada</option>
              <option value="cancelada">Cancelada</option>
            </select>
          </div>
          
          <div className="flex-1 min-w-[200px]">
            <label className={`block mb-2 text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Prioridad</label>
            <select
              name="prioridad"
              value={filtros.prioridad}
              onChange={handleFiltroChange}
              className={`w-full p-2 rounded border ${isDarkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
            >
              <option value="">Todas</option>
              <option value="baja">Baja</option>
              <option value="media">Media</option>
              <option value="alta">Alta</option>
            </select>
          </div>
          
          <div className="flex-1 min-w-[200px]">
            <label className={`block mb-2 text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Desde</label>
            <input
              type="date"
              name="fecha_desde"
              value={filtros.fecha_desde}
              onChange={handleFiltroChange}
              className={`w-full p-2 rounded border ${isDarkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
            />
          </div>
          
          <div className="flex-1 min-w-[200px]">
            <label className={`block mb-2 text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Hasta</label>
            <input
              type="date"
              name="fecha_hasta"
              value={filtros.fecha_hasta}
              onChange={handleFiltroChange}
              className={`w-full p-2 rounded border ${isDarkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
            />
          </div>
        </div>
        
        <div className="mt-4 flex justify-end">
          <button
            onClick={resetFiltros}
            className={`px-4 py-2 rounded ${isDarkMode ? 'bg-gray-600 hover:bg-gray-500 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`}
          >
            Limpiar Filtros
          </button>
        </div>
      </div>

      {/* Lista de tareas */}
      {isLoading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-500"></div>
        </div>
      ) : error ? (
        <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-800'}`}>
          {error}
        </div>
      ) : tareas.length === 0 ? (
        <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
          No hay tareas en el departamento que coincidan con los filtros seleccionados.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className={`min-w-full ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            <thead>
              <tr className={`${isDarkMode ? 'border-gray-700' : 'border-gray-200'} border-b`}>
                <th className="py-3 px-4 text-left">Tu00edtulo</th>
                <th className="py-3 px-4 text-left">Asignado a</th>
                <th className="py-3 px-4 text-left">Estado</th>
                <th className="py-3 px-4 text-left">Prioridad</th>
                <th className="py-3 px-4 text-left">Vencimiento</th>
              </tr>
            </thead>
            <tbody>
              {tareas.map(tarea => (
                <tr 
                  key={tarea.id} 
                  className={`${isDarkMode ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-50'} border-b transition-colors`}
                >
                  <td className="py-3 px-4">
                    <div className="font-medium">{tarea.titulo}</div>
                    <div className="text-sm truncate max-w-xs">{tarea.descripcion}</div>
                  </td>
                  <td className="py-3 px-4">
                    {`${tarea.nombre_asignado || ''} ${tarea.apellidos_asignado || ''}`.trim() || 'Usuario'}
                  </td>
                  <td className="py-3 px-4">{renderEstado(tarea.estado)}</td>
                  <td className="py-3 px-4">{renderPrioridad(tarea.prioridad)}</td>
                  <td className="py-3 px-4">{tarea.fecha_vencimiento || 'Sin fecha'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default TareasDepartamentoWidget
