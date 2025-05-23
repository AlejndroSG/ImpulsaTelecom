import React, { useState } from 'react'
import axios from 'axios'
import { FaTimes, FaExclamationTriangle, FaRegLightbulb, FaQuestion, FaExclamationCircle } from 'react-icons/fa'
import { useAuth } from '../context/AuthContext'

const API_URL = 'http://localhost/ImpulsaTelecom/backend/api'

const FormularioIncidencia = ({ onClose, onSuccess }) => {
  const { token, user } = useAuth()
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    tipo: 'error',
    prioridad: 'media',
    archivos_adjuntos: null
  })
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')
  
  // Manejo de cambios en campos del formulario
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }
  
  // Manejo de archivos adjuntos (pendiente de implementar la subida)
  const handleFileChange = (e) => {
    // Aquí se implementaría la lógica para subir archivos
    // Por ahora solo guardamos una referencia
    setFormData(prev => ({
      ...prev,
      archivos_adjuntos: e.target.files[0]?.name || null
    }))
  }
  
  // Enviar el formulario
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.titulo.trim() || !formData.descripcion.trim()) {
      setError('Por favor, completa todos los campos obligatorios.')
      return
    }
    
    setEnviando(true)
    setError('')
    
    try {
      const response = await axios.post(`${API_URL}/incidencias.php`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        withCredentials: false // Deshabilitar explicitamente el envio de cookies
      })
      
      if (response.data.success) {
        // Notificar éxito y cerrar
        onSuccess?.(response.data.message || 'Incidencia reportada correctamente')
        onClose()
      } else {
        setError(response.data.message || 'Error al enviar la incidencia')
      }
    } catch (error) {
      console.error('Error al enviar incidencia:', error)
      setError('Error de conexión. Inténtalo de nuevo más tarde.')
    } finally {
      setEnviando(false)
    }
  }
  
  // Iconos para tipos de incidencia
  const tipoIconos = {
    error: <FaExclamationTriangle className="text-red-500" />,
    mejora: <FaRegLightbulb className="text-yellow-500" />,
    consulta: <FaQuestion className="text-blue-500" />,
    urgente: <FaExclamationCircle className="text-red-600" />
  }
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-md shadow-md w-full max-w-md overflow-hidden">
        {/* Cabecera */}
        <div className="flex justify-between items-center bg-blue-500 dark:bg-blue-700 p-3 text-white">
          <h2 className="text-lg font-medium flex items-center gap-2">
            <span>
              <FaExclamationCircle size={16} />
            </span>
            Reportar incidencia
          </h2>
          <button 
            onClick={onClose}
            className="text-white hover:text-gray-200"
            aria-label="Cerrar"
          >
            <FaTimes size={18} />
          </button>
        </div>
        
        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-4">
          {/* Mensaje de error */}
          {error && (
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-md">
              {error}
            </div>
          )}
          
          {/* Título */}
          <div className="mb-3">
            <label className="block text-gray-700 dark:text-gray-200 text-sm font-medium mb-1">
              Título <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="titulo"
              value={formData.titulo}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Breve descripción del problema"
              required
            />
          </div>
          
          {/* Tipo de incidencia */}
          <div className="mb-3">
            <label className="block text-gray-700 dark:text-gray-200 text-sm font-medium mb-1">
              Tipo de incidencia <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {['error', 'mejora', 'consulta', 'urgente'].map((tipo) => (
                <div 
                  key={tipo}
                  onClick={() => setFormData(prev => ({ ...prev, tipo }))}
                  className={`
                    flex items-center gap-2 p-2 border rounded-md cursor-pointer
                    ${formData.tipo === tipo 
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/40 dark:border-blue-400' 
                      : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50'}
                  `}
                >
                  <div>{tipoIconos[tipo]}</div>
                  <span className="capitalize text-sm">{tipo}</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Prioridad */}
          <div className="mb-3">
            <label className="block text-gray-700 dark:text-gray-200 text-sm font-medium mb-1">
              Prioridad
            </label>
            <select
              name="prioridad"
              value={formData.prioridad}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white appearance-none"
            >
              <option value="baja">Baja</option>
              <option value="media">Media</option>
              <option value="alta">Alta</option>
              <option value="critica">Crítica</option>
            </select>
          </div>
          
          {/* Descripción */}
          <div className="mb-3">
            <label className="block text-gray-700 dark:text-gray-200 text-sm font-medium mb-1">
              Descripción detallada <span className="text-red-500">*</span>
            </label>
            <textarea
              name="descripcion"
              value={formData.descripcion}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              rows="3"
              placeholder="Describe el problema o la mejora con el mayor detalle posible..."
              required
            ></textarea>
          </div>
          
          {/* Archivo adjunto (funcionalidad pendiente) */}
          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-200 text-sm font-medium mb-1">
              Adjuntar captura de pantalla (opcional)
            </label>
            <input
              type="file"
              name="archivo"
              onChange={handleFileChange}
              accept="image/*"
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-gray-700 dark:file:text-gray-200 dark:text-gray-400"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {formData.archivos_adjuntos ? 
                <span className="text-blue-500">Seleccionado: {formData.archivos_adjuntos}</span> : 
                'Formatos: JPG, PNG, GIF (máx. 5MB)'}
            </p>
          </div>
          
          {/* Botón de enviar */}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-sm text-gray-700 bg-gray-200 border border-gray-300 rounded-md hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
              disabled={enviando}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={enviando}
              className="px-3 py-1.5 text-sm text-white bg-blue-500 rounded-md hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
            >
              {enviando ? 'Enviando...' : 'Enviar reporte'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default FormularioIncidencia
