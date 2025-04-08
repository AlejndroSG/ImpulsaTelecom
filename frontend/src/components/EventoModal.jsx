import React, { useState, useEffect, useRef } from 'react'
import { format, parse } from 'date-fns'
import { es } from 'date-fns/locale'

const EventoModal = ({ evento, onClose, onSave, onDelete, tiposEventos, isDarkMode, soloLectura = false }) => {
  // Asegurar que las fechas sean objetos Date válidos
  const inicioFecha = evento.inicio ? new Date(evento.inicio) : new Date()
  const finFecha = evento.fin ? new Date(evento.fin) : new Date(new Date().setHours(inicioFecha.getHours() + 1))
  
  const [eventoEditado, setEventoEditado] = useState({
    ...evento,
    inicio: inicioFecha,
    fin: finFecha
  })
  
  // Estados para manejar los valores de texto de las fechas
  const [fechaInicioTexto, setFechaInicioTexto] = useState('')
  const [fechaFinTexto, setFechaFinTexto] = useState('')
  const [errorInicio, setErrorInicio] = useState('')
  const [errorFin, setErrorFin] = useState('')
  
  // Referencias para los inputs reales de tipo date/datetime-local
  const inicioInputRef = useRef(null)
  const finInputRef = useRef(null)
  
  // Actualizar estado cuando cambia el evento, preservando las fechas
  useEffect(() => {
    // Solo actualizar si el ID del evento ha cambiado o si es un nuevo evento
    if (evento.id !== eventoEditado.id || evento.modo === 'crear') {
      const nuevoInicio = evento.inicio ? new Date(evento.inicio) : new Date()
      const nuevoFin = evento.fin ? new Date(evento.fin) : new Date(new Date().setHours(nuevoInicio.getHours() + 1))
      
      setEventoEditado({
        ...evento,
        inicio: nuevoInicio,
        fin: nuevoFin
      })
    }
  }, [evento.id, evento.modo])
  
  // Actualizar los textos de fecha cuando cambia eventoEditado
  useEffect(() => {
    setFechaInicioTexto(formatearFechaParaMostrar(eventoEditado.inicio))
    setFechaFinTexto(formatearFechaParaMostrar(eventoEditado.fin))
  }, [eventoEditado.inicio, eventoEditado.fin, eventoEditado.diaCompleto])
  
  // Formatear fechas para mostrar al usuario (formato español)
  const formatearFechaParaMostrar = (fecha) => {
    if (!fecha) return ''
    try {
      const fechaObj = fecha instanceof Date ? fecha : new Date(fecha)
      if (isNaN(fechaObj.getTime())) throw new Error('Fecha inválida')
      
      return format(fechaObj, eventoEditado.diaCompleto ? 'dd/MM/yyyy' : 'dd/MM/yyyy HH:mm', { locale: es })
    } catch (error) {
      console.error('Error al formatear fecha para mostrar:', error)
      return ''
    }
  }
  
  // Formatear fechas para inputs de tipo date y datetime-local
  const formatearFechaParaInput = (fecha, incluirHora = true) => {
    if (!fecha) return ''
    try {
      const fechaObj = fecha instanceof Date ? fecha : new Date(fecha)
      if (isNaN(fechaObj.getTime())) return ''
      
      // Para inputs de tipo date, solo necesitamos YYYY-MM-DD
      if (!incluirHora) {
        return fechaObj.toISOString().split('T')[0]
      }
      
      // Para inputs de tipo datetime-local, necesitamos YYYY-MM-DDThh:mm
      // Formatear con timezone local
      const year = fechaObj.getFullYear()
      const month = String(fechaObj.getMonth() + 1).padStart(2, '0')
      const day = String(fechaObj.getDate()).padStart(2, '0')
      const hours = String(fechaObj.getHours()).padStart(2, '0')
      const minutes = String(fechaObj.getMinutes()).padStart(2, '0')
      
      return `${year}-${month}-${day}T${hours}:${minutes}`
    } catch (error) {
      console.error('Error al formatear fecha para input:', error)
      return ''
    }
  }
  
  // Parsear texto de fecha en formato español a objeto Date
  const parsearFechaDesdeTexto = (textoFecha, esDiaCompleto) => {
    try {
      // Intentar parsear en formato español
      const formatoEsperado = esDiaCompleto ? 'dd/MM/yyyy' : 'dd/MM/yyyy HH:mm'
      return parse(textoFecha, formatoEsperado, new Date(), { locale: es })
    } catch (error) {
      console.error('Error al parsear fecha desde texto:', error)
      return null
    }
  }
  
  // Manejar cambio en el texto de fecha de inicio
  const handleFechaInicioTextoChange = (e) => {
    const nuevoTexto = e.target.value
    setFechaInicioTexto(nuevoTexto)
    
    try {
      const nuevaFecha = parsearFechaDesdeTexto(nuevoTexto, eventoEditado.diaCompleto)
      
      if (!nuevaFecha || isNaN(nuevaFecha.getTime())) {
        setErrorInicio('Formato de fecha inválido')
        return
      }
      
      setErrorInicio('')
      setEventoEditado(prev => ({
        ...prev,
        inicio: nuevaFecha
      }))
      
      // Si la fecha de inicio es posterior a la de fin, actualizar la de fin
      if (eventoEditado.fin && nuevaFecha > eventoEditado.fin) {
        const nuevaFechaFin = new Date(nuevaFecha)
        nuevaFechaFin.setHours(nuevaFecha.getHours() + 1)
        
        setEventoEditado(prev => ({
          ...prev,
          fin: nuevaFechaFin
        }))
        setFechaFinTexto(formatearFechaParaMostrar(nuevaFechaFin))
      }
    } catch (error) {
      console.error('Error al procesar fecha de inicio:', error)
      setErrorInicio('Formato de fecha inválido')
    }
  }
  
  // Manejar cambio en el texto de fecha de fin
  const handleFechaFinTextoChange = (e) => {
    const nuevoTexto = e.target.value
    setFechaFinTexto(nuevoTexto)
    
    try {
      const nuevaFecha = parsearFechaDesdeTexto(nuevoTexto, eventoEditado.diaCompleto)
      
      if (!nuevaFecha || isNaN(nuevaFecha.getTime())) {
        setErrorFin('Formato de fecha inválido')
        return
      }
      
      // Verificar que la fecha de fin es posterior a la de inicio
      if (eventoEditado.inicio && nuevaFecha < eventoEditado.inicio) {
        setErrorFin('La fecha de fin debe ser posterior a la de inicio')
        return
      }
      
      setErrorFin('')
      setEventoEditado(prev => ({
        ...prev,
        fin: nuevaFecha
      }))
    } catch (error) {
      console.error('Error al procesar fecha de fin:', error)
      setErrorFin('Formato de fecha inválido')
    }
  }
  
  // Manejar cambios en los inputs
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    
    if (type === 'checkbox') {
      setEventoEditado({ ...eventoEditado, [name]: checked })
      
      // Si se cambia a día completo, ajustar las horas
      if (name === 'diaCompleto' && checked) {
        const inicioAjustado = new Date(eventoEditado.inicio)
        inicioAjustado.setHours(0, 0, 0, 0)
        
        const finAjustado = new Date(eventoEditado.fin)
        finAjustado.setHours(23, 59, 59, 999)
        
        setEventoEditado(prev => ({
          ...prev,
          inicio: inicioAjustado,
          fin: finAjustado
        }))
        
        // Actualizar los textos de las fechas
        setFechaInicioTexto(formatearFechaParaMostrar(inicioAjustado, true))
        setFechaFinTexto(formatearFechaParaMostrar(finAjustado, true))
      }
    } else if (name === 'inicio' || name === 'fin') {
      try {
        console.log(`Procesando ${name} con valor:`, value);
        
        // Crear un nuevo objeto Date a partir del valor del input
        const fechaObj = new Date(value)
        
        // Verificar que la fecha es válida
        if (isNaN(fechaObj.getTime())) {
          console.error('Fecha inválida:', value)
          return
        }
        
        console.log(`Fecha ${name} parseada correctamente:`, fechaObj);
        
        // Si cambia la fecha de inicio y es posterior a la fecha de fin, actualizar la fecha de fin
        if (name === 'inicio' && eventoEditado.fin && fechaObj > eventoEditado.fin) {
          const nuevaFechaFin = new Date(fechaObj)
          nuevaFechaFin.setHours(fechaObj.getHours() + 1)
          
          setEventoEditado({ 
            ...eventoEditado, 
            [name]: fechaObj,
            fin: nuevaFechaFin
          })
          
          // Actualizar el texto de la fecha de fin
          setFechaFinTexto(formatearFechaParaMostrar(nuevaFechaFin, !eventoEditado.diaCompleto))
        } else {
          setEventoEditado({ ...eventoEditado, [name]: fechaObj })
        }
        
        // Actualizar el texto de la fecha que cambió
        if (name === 'inicio') {
          setFechaInicioTexto(formatearFechaParaMostrar(fechaObj, !eventoEditado.diaCompleto))
          setErrorInicio('')
        } else if (name === 'fin') {
          setFechaFinTexto(formatearFechaParaMostrar(fechaObj, !eventoEditado.diaCompleto))
          setErrorFin('')
        }
      } catch (error) {
        console.error('Error al procesar la fecha:', error)
      }
    } else {
      setEventoEditado({ ...eventoEditado, [name]: value })
    }
  }
  
  // Manejar envío del formulario
  const handleSubmit = (e) => {
    e.preventDefault()
    
    // Validar que la fecha de fin sea posterior a la de inicio
    if (eventoEditado.fin < eventoEditado.inicio) {
      alert('La fecha de fin debe ser posterior a la fecha de inicio')
      return
    }
    
    // Si es día completo, ajustar las horas
    let eventoFinal = { ...eventoEditado }
    
    if (eventoFinal.diaCompleto) {
      const inicioAjustado = new Date(eventoFinal.inicio)
      inicioAjustado.setHours(0, 0, 0, 0)
      
      const finAjustado = new Date(eventoFinal.fin)
      finAjustado.setHours(23, 59, 59, 999)
      
      eventoFinal = {
        ...eventoFinal,
        inicio: inicioAjustado,
        fin: finAjustado
      }
    }
    
    onSave(eventoFinal)
  }
  
  // Validar el formulario
  const esFormularioValido = () => {
    try {
      // Verificar que el título no esté vacío
      if (eventoEditado.titulo.trim() === '') return false
      
      // Verificar que la fecha de inicio sea válida
      const inicioFecha = new Date(eventoEditado.inicio)
      if (isNaN(inicioFecha.getTime())) return false
      
      // Si hay fecha de fin, verificar que sea válida y posterior a la de inicio
      if (eventoEditado.fin) {
        const finFecha = new Date(eventoEditado.fin)
        if (isNaN(finFecha.getTime())) return false
        
        // Para eventos que no son de día completo, verificar que fin sea posterior a inicio
        if (!eventoEditado.diaCompleto && finFecha < inicioFecha) return false
      }
      
      return true
    } catch (error) {
      console.error('Error al validar el formulario:', error)
      return false
    }
  }
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center px-4">
      <div 
        className={`relative mx-auto p-6 rounded-lg shadow-xl w-full max-w-2xl ${isDarkMode ? 'bg-gray-800 text-gray-200 border border-gray-700' : 'bg-white text-gray-800 border border-gray-200'}`}
        onClick={(e) => e.stopPropagation()}
        style={{
          transition: 'all 0.3s ease-in-out',
          boxShadow: isDarkMode ? '0 10px 25px -5px rgba(0, 0, 0, 0.5)' : '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
        }}
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
        
        {/* Modo visualización */}
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
                  {eventoEditado.diaCompleto ? 'Todo el día' : 'Horario'}
                </span>
              </div>
              
              <p>
                {formatearFechaParaMostrar(eventoEditado.inicio)}
                {eventoEditado.fin && !eventoEditado.diaCompleto && (
                  <> hasta {formatearFechaParaMostrar(eventoEditado.fin)}</>
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
        
        {/* Modo edición o creación */}
        {(eventoEditado.modo === 'editar' || eventoEditado.modo === 'crear') && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="titulo"
                className={`block font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'} mb-1`}
              >
                Título *
              </label>
              <input
                type="text"
                id="titulo"
                name="titulo"
                value={eventoEditado.titulo}
                onChange={handleChange}
                required
                className={`w-full px-3 py-2 rounded-md ${isDarkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'} border`}
                placeholder="Añade un título"
              />
            </div>
            
            <div>
              <label
                htmlFor="descripcion"
                className={`block font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'} mb-1`}
              >
                Descripción
              </label>
              <textarea
                id="descripcion"
                name="descripcion"
                value={eventoEditado.descripcion || ''}
                onChange={handleChange}
                rows="3"
                className={`w-full px-3 py-2 rounded-md ${isDarkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'} border`}
                placeholder="Añade una descripción (opcional)"
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
                Todo el día
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
                <div className="relative">
                  <input
                    type="text"
                    id="inicio_texto"
                    name="inicio_texto"
                    value={fechaInicioTexto}
                    onChange={handleFechaInicioTextoChange}
                    placeholder={eventoEditado.diaCompleto ? "DD/MM/AAAA" : "DD/MM/AAAA HH:MM"}
                    required
                    className={`w-full px-3 py-2 rounded-md ${isDarkMode ? 'bg-gray-700 text-white border-gray-600 focus:border-blue-500' : 'bg-white text-gray-900 border-gray-300 focus:border-blue-500'} border focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50`}
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <input
                  type={eventoEditado.diaCompleto ? "date" : "datetime-local"}
                  id="inicio"
                  name="inicio"
                  ref={inicioInputRef}
                  value={formatearFechaParaInput(eventoEditado.inicio, !eventoEditado.diaCompleto)}
                  onChange={handleChange}
                  className="hidden"
                  data-testid="input-inicio"
                />
                <p className="text-xs text-gray-500 mt-1">Formato: {eventoEditado.diaCompleto ? 'DD/MM/AAAA' : 'DD/MM/AAAA HH:MM'}</p>
                {errorInicio && (
                  <p className="text-red-500 text-sm mt-1">{errorInicio}</p>
                )}
              </div>
              
              <div>
                <label
                  htmlFor="fin"
                  className={`block font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'} mb-1`}
                >
                  Fin
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="fin_texto"
                    name="fin_texto"
                    value={fechaFinTexto}
                    onChange={handleFechaFinTextoChange}
                    placeholder={eventoEditado.diaCompleto ? "DD/MM/AAAA" : "DD/MM/AAAA HH:MM"}
                    className={`w-full px-3 py-2 rounded-md ${isDarkMode ? 'bg-gray-700 text-white border-gray-600 focus:border-blue-500' : 'bg-white text-gray-900 border-gray-300 focus:border-blue-500'} border focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50`}
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <input
                  type={eventoEditado.diaCompleto ? "date" : "datetime-local"}
                  id="fin"
                  name="fin"
                  ref={finInputRef}
                  value={formatearFechaParaInput(eventoEditado.fin, !eventoEditado.diaCompleto)}
                  onChange={handleChange}
                  className="hidden"
                />
                <p className="text-xs text-gray-500 mt-1">Formato: {eventoEditado.diaCompleto ? 'DD/MM/AAAA' : 'DD/MM/AAAA HH:MM'}</p>
                {errorFin && (
                  <p className="text-red-500 text-sm mt-1">{errorFin}</p>
                )}
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
