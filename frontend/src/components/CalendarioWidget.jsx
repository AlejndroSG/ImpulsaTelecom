import React, { useState } from 'react';
import { Calendar } from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './CalendarioWidget.css'; // Importamos los estilos personalizados
import { motion } from 'framer-motion';

const CalendarioWidget = () => {
  const [date, setDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month');
  
  // Función para formatear la fecha seleccionada
  const formatDate = (date) => {
    return date.toLocaleDateString('es-ES', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };
  
  // Función para obtener eventos (simulados)
  const getEvents = (date) => {
    // Simulación de eventos - en una aplicación real, estos vendrían de una API
    const events = [
      { date: new Date(2025, 2, 25), title: 'Reunión de equipo', type: 'work' },
      { date: new Date(2025, 2, 27), title: 'Entrega de proyecto', type: 'deadline' },
      { date: new Date(2025, 2, 30), title: 'Formación', type: 'training' }
    ];
    
    // Comprobar si hay eventos para la fecha seleccionada
    return events.filter(event => 
      event.date.getDate() === date.getDate() && 
      event.date.getMonth() === date.getMonth() && 
      event.date.getFullYear() === date.getFullYear()
    );
  };
  
  // Eventos para la fecha seleccionada
  const selectedDateEvents = getEvents(date);
  
  // Función para determinar el color de la fecha en el calendario
  const tileClassName = ({ date, view }) => {
    if (view === 'month') {
      const events = getEvents(date);
      if (events.length > 0) {
        const eventType = events[0].type;
        if (eventType === 'work') return 'event-work';
        if (eventType === 'deadline') return 'event-deadline';
        if (eventType === 'training') return 'event-training';
      }
    }
    return null;
  };
  
  return (
    <motion.div 
      className="h-full w-full flex flex-col min-h-full"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-800">Calendario</h3>
        <div className="flex space-x-2">
          <button 
            onClick={() => setViewMode('month')} 
            className={`px-3 py-1 rounded-md text-sm font-medium ${
              viewMode === 'month' 
                ? 'bg-[#91e302] text-white' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Mes
          </button>
          <button 
            onClick={() => setViewMode('year')} 
            className={`px-3 py-1 rounded-md text-sm font-medium ${
              viewMode === 'year' 
                ? 'bg-[#91e302] text-white' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Año
          </button>
        </div>
      </div>
      
      <div className="calendar-container flex-grow">
        <Calendar 
          onChange={setDate} 
          value={date}
          view={viewMode}
          onViewChange={({ view }) => setViewMode(view)}
          tileClassName={tileClassName}
          className="custom-calendar"
          nextLabel={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          }
          prevLabel={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          }
        />
      </div>
      
      <div className="mt-6">
        <div className="p-4 bg-gray-50 rounded-lg">
          <h4 className="font-semibold text-gray-800 mb-2">
            {formatDate(date)}
          </h4>
          
          {selectedDateEvents.length > 0 ? (
            <div className="space-y-3">
              {selectedDateEvents.map((event, index) => (
                <div 
                  key={index} 
                  className={`p-3 rounded-lg flex items-center ${
                    event.type === 'work' 
                      ? 'bg-[#f0f9e0] border-l-4 border-[#91e302]' 
                      : event.type === 'deadline' 
                        ? 'bg-[#f9e0e3] border-l-4 border-[#c3515f]' 
                        : 'bg-[#f0f0f0] border-l-4 border-[#cccccc]'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                    event.type === 'work' 
                      ? 'bg-[#91e302] text-white' 
                      : event.type === 'deadline' 
                        ? 'bg-[#c3515f] text-white' 
                        : 'bg-[#cccccc] text-white'
                  }`}>
                    {event.type === 'work' && (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
                        <path d="M2 13.692V16a2 2 0 002 2h12a2 2 0 002-2v-2.308A24.974 24.974 0 0110 15c-2.796 0-5.487-.46-8-1.308z" />
                      </svg>
                    )}
                    {event.type === 'deadline' && (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                      </svg>
                    )}
                    {event.type === 'training' && (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                      </svg>
                    )}
                  </div>
                  <span className="font-medium">{event.title}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No hay eventos programados para este día.</p>
          )}
        </div>
      </div>
      
      <div className="mt-4 border-t pt-4 flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center">
          <span className="inline-block w-3 h-3 bg-[#91e302] rounded-full mr-1"></span>
          <span>Reuniones</span>
        </div>
        <div className="flex items-center">
          <span className="inline-block w-3 h-3 bg-[#c3515f] rounded-full mr-1"></span>
          <span>Entregas</span>
        </div>
        <div className="flex items-center">
          <span className="inline-block w-3 h-3 bg-[#cccccc] rounded-full mr-1"></span>
          <span>Formación</span>
        </div>
      </div>
    </motion.div>
  );
};

export default CalendarioWidget;
