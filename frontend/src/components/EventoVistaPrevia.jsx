import React from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { FaCalendarAlt, FaClock, FaUser, FaTimes, FaBuilding, FaTag } from 'react-icons/fa';
import { MdClose, MdTitle, MdDescription } from 'react-icons/md';

const EventoVistaPrevia = ({ evento, onClose, isDarkMode }) => {
  // Formatear fechas para mostrarlas en un formato legible
  const formatearFecha = (fecha) => {
    if (!fecha) return '';
    
    try {
      const fechaObj = new Date(fecha);
      return format(fechaObj, 'EEEE d MMMM yyyy', { locale: es });
    } catch (error) {
      console.error('Error al formatear fecha:', error);
      return 'Fecha inválida';
    }
  };
  
  // Formatear horas para mostrarlas en un formato legible
  const formatearHora = (fecha) => {
    if (!fecha) return '';
    
    try {
      const fechaObj = new Date(fecha);
      return format(fechaObj, 'HH:mm', { locale: es });
    } catch (error) {
      console.error('Error al formatear hora:', error);
      return 'Hora inválida';
    }
  };
  
  // Verificar si tenemos toda la información necesaria
  if (!evento || !evento.titulo) {
    return null;
  }
  
  // Determinar el tipo de evento para mostrar un color de encabezado adecuado
  let headerColor = 'bg-blue-500';
  if (evento.tipo_evento === 'departamental') {
    headerColor = 'bg-purple-500';
  } else if (evento.tipo_evento === 'global') {
    headerColor = 'bg-green-500';
  }
  
  return (
    <div className={`fixed inset-0 z-50 overflow-y-auto ${isDarkMode ? 'dark' : ''}`}>
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Overlay oscuro */}
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        />

        {/* Centro el modal */}
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

        {/* Contenido del modal */}
        <div
          className={`inline-block w-full max-w-md p-0 my-8 overflow-hidden text-left align-middle transition-all transform rounded-lg shadow-xl ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}
        >
          {/* Cabecera del modal con el color según tipo de evento */}
          <div className={`flex items-center justify-between p-4 ${headerColor} text-white`}>
            <h3 className="text-xl font-medium leading-6">
              {evento.titulo}
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center p-1 text-white hover:text-gray-200 focus:outline-none"
            >
              <MdClose className="w-6 h-6" />
            </button>
          </div>

          {/* Cuerpo del modal */}
          <div className={`p-5 space-y-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            {/* Información del evento */}
            <div className="space-y-3">
              {/* Fecha y hora */}
              <div className="flex items-start">
                <FaCalendarAlt className="w-5 h-5 mt-0.5 mr-3 flex-shrink-0 text-gray-400" />
                <div>
                  <p className="font-medium">{formatearFecha(evento.inicio)}</p>
                  {!evento.diaCompleto && (
                    <div className="flex items-center mt-1 text-sm text-gray-500">
                      <FaClock className="w-4 h-4 mr-1" />
                      <span>{formatearHora(evento.inicio)}</span>
                      {evento.fin && evento.fin !== evento.inicio && (
                        <>
                          <span className="mx-1">-</span>
                          <span>{formatearHora(evento.fin)}</span>
                        </>
                      )}
                    </div>
                  )}
                  {evento.diaCompleto && (
                    <p className="mt-1 text-sm text-gray-500">Todo el día</p>
                  )}
                </div>
              </div>
              
              {/* Tipo de evento */}
              <div className="flex items-start">
                <FaTag className="w-5 h-5 mt-0.5 mr-3 flex-shrink-0 text-gray-400" />
                <div>
                  <p className="font-medium">
                    {evento.tipo_evento === 'personal' ? 'Personal' : 
                     evento.tipo_evento === 'departamental' ? 'Departamental' : 
                     evento.tipo_evento === 'global' ? 'Global (toda la empresa)' : 
                     'Evento'}
                  </p>
                </div>
              </div>
              
              {/* Creador */}
              {evento.creador && (
                <div className="flex items-start">
                  <FaUser className="w-5 h-5 mt-0.5 mr-3 flex-shrink-0 text-gray-400" />
                  <div>
                    <p className="font-medium">Creado por</p>
                    <p className="text-gray-500">{evento.creador}</p>
                  </div>
                </div>
              )}
              
              {/* Departamento */}
              {evento.departamento && (
                <div className="flex items-start">
                  <FaBuilding className="w-5 h-5 mt-0.5 mr-3 flex-shrink-0 text-gray-400" />
                  <div>
                    <p className="font-medium">Departamento</p>
                    <p className="text-gray-500">{evento.departamento}</p>
                  </div>
                </div>
              )}
              
              {/* Descripción */}
              {evento.descripcion && (
                <div className="flex items-start">
                  <MdDescription className="w-5 h-5 mt-0.5 mr-3 flex-shrink-0 text-gray-400" />
                  <div className="flex-1">
                    <p className="font-medium">Descripción</p>
                    <p className="text-gray-500 whitespace-pre-wrap">{evento.descripcion}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Pie del modal */}
          <div className={`px-4 py-3 flex justify-end ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 font-medium rounded-md ${isDarkMode ? 'bg-gray-600 text-white hover:bg-gray-500' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventoVistaPrevia;
