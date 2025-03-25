import React, { useState } from 'react'
import Header from '../components/Header'
import { Outlet } from 'react-router-dom'
import Footer from '../components/Footer'
import Sidebar from '../components/Sidebar'

const Plantilla = () => {
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [sidebarPinned, setSidebarPinned] = useState(false);
  
  const handleMouseEnter = () => {
    if (!sidebarPinned) {
      setSidebarExpanded(true);
    }
  };

  const handleMouseLeave = () => {
    if (!sidebarPinned) {
      setSidebarExpanded(false);
    }
  };

  const toggleSidebarPin = () => {
    setSidebarPinned(!sidebarPinned);
    setSidebarExpanded(!sidebarPinned);
  };

  return (
    <div className="flex flex-col min-h-screen w-full">
        <div className="flex fixed top-0 left-0 right-0 z-50">
            <div className={`transition-all duration-300 ease-in-out ${
              sidebarExpanded ? 'w-[15%]' : 'w-[60px]'
            } bg-white border-r border-gray-200`}>
                {/* Espacio reservado para mantener el layout */}
            </div>
            <div className={`transition-all duration-300 ease-in-out ${
              sidebarExpanded ? 'w-[85%]' : 'w-[calc(100%-60px)]'
            }`}>
                <Header/>
            </div>
        </div>
        <div className="flex flex-1 pt-16">
            <div 
              className={`transition-all duration-300 ease-in-out fixed top-16 bottom-0 ${
                sidebarExpanded ? 'w-[15%]' : 'w-[60px]'
              } border-r border-gray-200 bg-white z-40`}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
                <button 
                  onClick={toggleSidebarPin}
                  className={`absolute top-2 right-2 z-10 p-1 rounded-full transition-all duration-300 ${
                    sidebarExpanded ? 'opacity-100' : 'opacity-0'
                  } ${sidebarPinned ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'} hover:bg-gray-200`}
                  title={sidebarPinned ? "Desfijar menú" : "Fijar menú"}
                  aria-label={sidebarPinned ? "Desfijar menú" : "Fijar menú"}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={sidebarPinned 
                      ? "M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" // X cuando está fijado (para desfijar)
                      : "M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"} // Marcador cuando no está fijado (para fijar)
                    />
                  </svg>
                </button>
                <Sidebar expanded={sidebarExpanded} />
            </div>
            <main className={`transition-all duration-300 ease-in-out flex-1 ${
              sidebarExpanded ? 'ml-[15%]' : 'ml-[60px]'
            }`}>
                <Outlet/>
            </main>
        </div>
        <Footer className="mt-auto"/>
    </div>
  )
}

export default Plantilla