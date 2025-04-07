import React from 'react'

const CalendarioLeyenda = ({ coloresEventos, isDarkMode }) => {
  // Definir los diferentes tipos de eventos y su significado
  const tiposEventos = [
    { tipo: 'evento', label: 'Evento general', color: coloresEventos.evento },
    { tipo: 'reunion', label: 'Reuniu00f3n', color: coloresEventos.reunion },
    { tipo: 'formacion', label: 'Formaciu00f3n', color: coloresEventos.formacion },
    { tipo: 'proyecto', label: 'Proyecto', color: coloresEventos.proyecto },
    { tipo: 'ausencia', label: 'Ausencia', color: coloresEventos.ausencia },
    { tipo: 'tarea', label: 'Tarea', color: coloresEventos.tarea },
    { tipo: 'fichaje', label: 'Horario de trabajo', color: coloresEventos.fichaje },
  ]

  return (
    <div className={`mt-6 p-4 rounded-lg shadow ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
      <h3 className="text-lg font-medium mb-3">Leyenda</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {tiposEventos.map((item) => (
          <div key={item.tipo} className="flex items-center">
            <div 
              className="w-4 h-4 rounded-full mr-2" 
              style={{ backgroundColor: item.color }}
            ></div>
            <span className="text-sm">{item.label}</span>
          </div>
        ))}
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <h4 className="text-sm font-medium mb-2">Acciones disponibles:</h4>
        <ul className={`text-sm list-disc pl-5 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          <li>Haz clic en una fecha para crear un nuevo evento</li>
          <li>Haz clic en un evento para ver sus detalles</li>
          <li>Arrastra para seleccionar mu00faltiples du00edas u horas</li>
          <li>Cambia la vista usando los botones superiores</li>
        </ul>
      </div>
    </div>
  )
}

export default CalendarioLeyenda
