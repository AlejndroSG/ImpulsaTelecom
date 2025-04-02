import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

const FormularioTarea = ({ tarea, onGuardar, onCancelar }) => {
  const { user } = useAuth()
  const { isDarkMode } = useTheme()
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    estado: 'pendiente',
    prioridad: 'media',
    fecha_vencimiento: ''
  })
  const [error, setError] = useState('')

  // Cargar datos de la tarea si estamos editando
  useEffect(() => {
    if (tarea) {
      setFormData({
        titulo: tarea.titulo || '',
        descripcion: tarea.descripcion || '',
        estado: tarea.estado || 'pendiente',
        prioridad: tarea.prioridad || 'media',
        fecha_vencimiento: tarea.fecha_vencimiento || ''
      })
    }
  }, [tarea])

  // Manejar cambios en el formulario
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // Enviar formulario
  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')

    // Validar campos obligatorios
    if (!formData.titulo.trim()) {
      setError('El título es obligatorio')
      return
    }

    // Preparar datos para enviar
    const tareaData = {
      ...formData
    }

    // Si la fecha de vencimiento está vacía, eliminarla para que el backend use NULL
    if (!tareaData.fecha_vencimiento) {
      delete tareaData.fecha_vencimiento
    }

    // Enviar al componente padre
    onGuardar(tareaData)
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div className={`p-4 mb-4 rounded-lg ${isDarkMode ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-800'}`}>
          {error}
        </div>
      )}

      <div className="mb-4">
        <label className={`block mb-2 text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          Título *
        </label>
        <input
          type="text"
          name="titulo"
          value={formData.titulo}
          onChange={handleChange}
          className={`w-full p-2 rounded border ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
          placeholder="Título de la tarea"
          required
        />
      </div>

      <div className="mb-4">
        <label className={`block mb-2 text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          Descripción
        </label>
        <textarea
          name="descripcion"
          value={formData.descripcion}
          onChange={handleChange}
          rows="4"
          className={`w-full p-2 rounded border ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
          placeholder="Descripción detallada de la tarea"
        ></textarea>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <label className={`block mb-2 text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Estado
          </label>
          <select
            name="estado"
            value={formData.estado}
            onChange={handleChange}
            className={`w-full p-2 rounded border ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
          >
            <option value="pendiente">Pendiente</option>
            <option value="en_progreso">En progreso</option>
            <option value="completada">Completada</option>
            <option value="cancelada">Cancelada</option>
          </select>
        </div>

        <div>
          <label className={`block mb-2 text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Prioridad
          </label>
          <select
            name="prioridad"
            value={formData.prioridad}
            onChange={handleChange}
            className={`w-full p-2 rounded border ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
          >
            <option value="baja">Baja</option>
            <option value="media">Media</option>
            <option value="alta">Alta</option>
          </select>
        </div>

        <div>
          <label className={`block mb-2 text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Fecha de vencimiento
          </label>
          <input
            type="date"
            name="fecha_vencimiento"
            value={formData.fecha_vencimiento}
            onChange={handleChange}
            className={`w-full p-2 rounded border ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
          />
        </div>
      </div>

      <div className="flex justify-end space-x-3 mt-6">
        <button
          type="button"
          onClick={onCancelar}
          className={`px-4 py-2 rounded ${isDarkMode ? 'bg-gray-600 hover:bg-gray-500 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`}
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
        >
          {tarea ? 'Actualizar' : 'Crear'} Tarea
        </button>
      </div>
    </form>
  )
}

export default FormularioTarea
