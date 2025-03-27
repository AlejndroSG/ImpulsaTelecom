import React from 'react';

const DashboardWidget = ({ title, children, icon }) => {
  // Función para renderizar el icono adecuado según el parámetro
  const renderIcon = () => {
    switch(icon) {
      case 'task':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#91e302] mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
            <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
          </svg>
        );
      case 'notification':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#91e302] mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
          </svg>
        );
      case 'calendar':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#91e302] mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
          </svg>
        );
      case 'profile':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#91e302] mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white p-5 rounded-xl shadow-md min-h-full w-full relative transition-all duration-300 hover:shadow-lg border-l-4 border-[#91e302]">
      <div className="drag-handle absolute top-3 left-3 cursor-move w-4 h-4 flex flex-wrap content-start z-10">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="w-1 h-1 bg-[#cccccc] rounded-full m-[0.5px]"></div>
        ))}
      </div>
      <h3 className="text-lg font-semibold mb-4 pl-6 flex items-center relative">
        {renderIcon()}
        <span className="text-gray-800">{title}</span>
      </h3>
      <div className="widget-content h-[calc(100%-2rem)]">
        {children}
      </div>
    </div>
  );
};

export default DashboardWidget;
