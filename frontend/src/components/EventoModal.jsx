import React, { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

const EventoModal = ({ evento, onClose, onSave, onDelete, tiposEventos, isDarkMode, soloLectura = false }) => {
  const [eventoEditado, setEventoEditado] = useState({
    ...evento,
    inicio: evento.inicio ? new Date(evento.inicio) : new Date(),
    fin: evento.fin ? new Date(evento.fin) : new Date()
  })
  
  // Actualizar estado cuando cambia el evento
  useEffect(() => {
    setEventoEditado({
      ...evento,
      inicio: evento.inicio ? new Date(evento.inicio) : new Date(),
      fin: evento.fin ? new Date(evento.fin) : new Date()
    })
  }, [evento])
  
  // Formatear fechas para los campos de entrada
  const formatearFechaInput = (fecha) => {
    if (!fecha) return ''
    return format(new Date(fecha), "yyyy-MM-dd'T'HH:mm")
  }
  
  // Manejar cambios en los inputs
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    
    if (type === 'checkbox') {
      setEventoEditado({ ...eventoEditado, [name]: checked })
    } else if (name === 'inicio' || name === 'fin') {
      setEventoEditado({ ...eventoEditado, [name]: new Date(value) })
    } else {
      setEventoEditado({ ...eventoEditado, [name]: value })
    }
  }
  
  // Manejar envu00edo del formulario
  const handleSubmit = (e) => {
    e.preventDefault()
    onSave(eventoEditado)
  }
  
  // Validar el formulario
  const esFormularioValido = () => {
    return (
      eventoEditado.titulo.trim() !== '' &&
      eventoEditado.inicio &&
      (!eventoEditado.fin || eventoEditado.fin >= eventoEditado.inicio)
    )
  }
  
  // Formatear fecha para mostrar
  const formatearFechaLegible = (fecha) => {
    if (!fecha) return ''
    return format(new Date(fecha), "EEEE d 'de' MMMM 'de' yyyy 'a las' HH:mm", { locale: es })
  }
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center px-4">
      <div 
        className={`relative mx-auto p-6 rounded-lg shadow-lg w-full max-w-2xl ${isDarkMode ? 'bg-gray-800 text-gray-200' : 'bg-white text-gray-800'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          className={`absolute top-4 right-4 p-1 rounded-full ${isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
          aria-label="Cerrar"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        <h2 className="text-xl font-semibold mb-4">
          {eventoEditado.modo === 'crear' ? 'Crear nuevo evento' : 'Detalles del evento'}
        </h2>
        
        {/* Modo visualizaciu00f3n */}
        {eventoEditado.modo === 'ver' && (
          <div className="space-y-4">
            <div className="flex items-start">
              <div 
                className="w-4 h-4 rounded-full flex-shrink-0 mt-1.5 mr-2" 
                style={{ backgroundColor: eventoEditado.color }}
              ></div>
              <div>
                <h3 className="text-lg font-medium">{eventoEditado.titulo}</h3>
                {eventoEditado.descripcion && (
                  <p className={`mt-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    {eventoEditado.descripcion}
                  </p>
                )}
              </div>
            </div>
            
            <div className={`px-4 py-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <div className="flex items-center mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="font-medium">
                  {eventoEditado.diaCompleto ? 'Todo el du00eda' : 'Horario'}
                </span>
              </div>
              
              <p>
                {formatearFechaLegible(eventoEditado.inicio)}
                {eventoEditado.fin && !eventoEditado.diaCompleto && (
                  <> hasta {formatearFechaLegible(eventoEditado.fin)}</>
                )}
              </p>
            </div>
            
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              <span>
                <span className="font-medium mr-1">Tipo:</span>
                {tiposEventos.find(t => t.value === eventoEditado.tipo)?.label || 'Evento'}
              </span>
            </div>
            
            {eventoEditado.creador && (
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span>
                  <span className="font-medium mr-1">Creado por:</span>
                  {eventoEditado.creador}
                </span>
              </div>
            )}
            
            {eventoEditado.departamento && (
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <span>
                  <span className="font-medium mr-1">Departamento:</span>
                  {eventoEditado.departamento}
                </span>
              </div>
            )}
            
            {!soloLectura && (
              <div className="flex justify-between mt-6">
                <button
                  onClick={() => setEventoEditado({...eventoEditado, modo: 'editar'})}
                  className={`px-4 py-2 rounded-md ${isDarkMode ? 'bg-blue-700 hover:bg-blue-600' : 'bg-blue-100 hover:bg-blue-200 text-blue-800'}`}
                >
                  Editar
                </button>
                
                <button
                  onClick={() => onDelete(eventoEditado.id)}
                  className={`px-4 py-2 rounded-md ${isDarkMode ? 'bg-red-700 hover:bg-red-600' : 'bg-red-100 hover:bg-red-200 text-red-800'}`}
                >
                  Eliminar
                </button>
              </div>
            )}
          </div>
        )}
        
        {/* Modo ediciu00f3n o creaciu00f3n */}
        {(eventoEditado.modo === 'editar' || eventoEditado.modo === 'crear') && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="titulo"
                className={`block font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'} mb-1`}
              >
                Tu00edtulo *
              </label>
              <input
                type="text"
                id="titulo"
                name="titulo"
                value={eventoEditado.titulo}
                onChange={handleChange}
                required
                className={`w-full px-3 py-2 rounded-md ${isDarkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'} border`}
                placeholder="Au00f1ade un tu00edtulo"
              />
            </div>
            
            <div>
              <label
                htmlFor="descripcion"
                className={`block font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'} mb-1`}
              >
                Descripciu00f3n
              </label>
              <textarea
                id="descripcion"
                name="descripcion"
                value={eventoEditado.descripcion || ''}
                onChange={handleChange}
                rows="3"
                className={`w-full px-3 py-2 rounded-md ${isDarkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'} border`}
                placeholder="Au00f1ade una descripciu00f3n (opcional)"
              ></textarea>
            </div>
            
            <div className="flex items-center mb-4">
              <input
                type="checkbox"
                id="diaCompleto"
                name="diaCompleto"
                checked={eventoEditado.diaCompleto}
                onChange={handleChange}
                className="mr-2 h-4 w-4 rounded"
              />
              <label
                htmlFor="diaCompleto"
                className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}
              >
                Todo el du00eda
              </label>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="inicio"
                  className={`block font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'} mb-1`}
                >
                  Inicio *
                </label>
                <input
                  type={eventoEditado.diaCompleto ? "date" : "datetime-local"}
                  id="inicio"
                  name="inicio"
                  value={formatearFechaInput(eventoEditado.inicio)}
                  onChange={handleChange}
                  required
                  className={`w-full px-3 py-2 rounded-md ${isDarkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'} border`}
                />
              </div>
              
              <div>
                <label
                  htmlFor="fin"
                  className={`block font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'} mb-1`}
                >
                  Fin
                </label>
                <input
                  type={eventoEditado.diaCompleto ? "date" : "datetime-local"}
                  id="fin"
                  name="fin"
                  value={formatearFechaInput(eventoEditado.fin)}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 rounded-md ${isDarkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'} border`}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="tipo"
                  className={`block font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'} mb-1`}
                >
                  Tipo de evento
                </label>
                <select
                  id="tipo"
                  name="tipo"
                  value={eventoEditado.tipo}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 rounded-md ${isDarkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'} border`}
                >
                  {tiposEventos.map(tipo => (
                    <option key={tipo.value} value={tipo.value}>{tipo.label}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label
                  htmlFor="color"
                  className={`block font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'} mb-1`}
                >
                  Color
                </label>
                <div className="flex items-center">
                  <input
                    type="color"
                    id="color"
                    name="color"
                    value={eventoEditado.color}
                    onChange={handleChange}
                    className="w-10 h-10 p-1 rounded mr-2 cursor-pointer border-none"
                  />
                  <input
                    type="text"
                    value={eventoEditado.color}
                    onChange={handleChange}
                    name="color"
                    className={`flex-1 px-3 py-2 rounded-md ${isDarkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'} border`}
                  />
                </div>
              </div>
            </div>
            
            <div className="flex justify-between mt-6">
              {eventoEditado.modo === 'editar' && (
                <button
                  type="button"
                  onClick={() => setEventoEditado({...eventoEditado, modo: 'ver'})}
                  className={`px-4 py-2 rounded-md ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`}
                >
                  Cancelar
                </button>
              )}
              
              {eventoEditado.modo === 'crear' && (
                <button
                  type="button"
                  onClick={onClose}
                  className={`px-4 py-2 rounded-md ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`}
                >
                  Cancelar
                </button>
              )}
              
              <button
                type="submit"
                disabled={!esFormularioValido()}
                className={`px-4 py-2 rounded-md ${isDarkMode 
                  ? esFormularioValido() ? 'bg-green-700 hover:bg-green-600' : 'bg-gray-600 cursor-not-allowed'
                  : esFormularioValido() ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
              >
                {eventoEditado.modo === 'crear' ? 'Crear evento' : 'Guardar cambios'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default EventoModal
