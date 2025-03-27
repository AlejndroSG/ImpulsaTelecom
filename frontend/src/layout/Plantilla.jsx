import React, { useState, useEffect } from 'react'
import Header from '../components/Header'
import { Outlet } from 'react-router-dom'
import Footer from '../components/Footer'
import Sidebar from '../components/Sidebar'
import { useTheme } from '../context/ThemeContext'
import { motion, AnimatePresence } from 'framer-motion'

const Plantilla = () => {
  const { isDarkMode } = useTheme();
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

  // Recuperar el estado del sidebar pinned desde localStorage al cargar
  useEffect(() => {
    const savedPinState = localStorage.getItem('sidebarPinned');
    if (savedPinState) {
      const isPinned = JSON.parse(savedPinState);
      setSidebarPinned(isPinned);
      setSidebarExpanded(isPinned);
    }
  }, []);

  // Guardar el estado del sidebar pinned en localStorage cuando cambie
  useEffect(() => {
    localStorage.setItem('sidebarPinned', JSON.stringify(sidebarPinned));
  }, [sidebarPinned]);

  return (
    <div className={`flex flex-col min-h-screen w-full ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'} transition-colors duration-300`}>
        <div className={`flex fixed top-0 left-0 right-0 z-50 ${isDarkMode ? 'dark-header' : ''}`}>
            <div className={`transition-all duration-300 ease-in-out ${sidebarExpanded ? 'w-[240px]' : 'w-[60px]'} ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                {/* Espacio reservado para mantener el layout */}
            </div>
            <div className={`transition-all duration-300 ease-in-out ${sidebarExpanded ? 'w-[calc(100%-240px)]' : 'w-[calc(100%-60px)]'}`}>
                <Header/>
            </div>
        </div>
        <div className="flex flex-1 pt-16">
            <motion.div 
              className={`fixed top-16 bottom-0 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'} z-40 overflow-hidden shadow-lg`}
              initial={{ width: sidebarPinned ? '240px' : '60px' }}
              animate={{ width: sidebarExpanded ? '240px' : '60px' }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
                <div className="relative h-full overflow-hidden">
                    <AnimatePresence>
                        {sidebarExpanded && (
                            <motion.button 
                                onClick={toggleSidebarPin}
                                className={`absolute top-3 right-3 z-10 p-1.5 rounded-full ${sidebarPinned 
                                    ? (isDarkMode ? 'bg-indigo-900 text-indigo-300' : 'bg-blue-100 text-blue-600')
                                    : (isDarkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600')} 
                                    ${isDarkMode ? 'hover:bg-indigo-800' : 'hover:bg-gray-200'}`}
                                title={sidebarPinned ? "Desfijar menu" : "Fijar menu"}
                                aria-label={sidebarPinned ? "Desfijar menu" : "Fijar menu"}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                transition={{ duration: 0.2 }}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={sidebarPinned 
                                    ? "M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" // X cuando está fijado (para desfijar)
                                    : "M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"} // Marcador cuando no está fijado (para fijar)
                                    />
                                </svg>
                            </motion.button>
                        )}
                    </AnimatePresence>
                    <Sidebar expanded={sidebarExpanded} />
                </div>
            </motion.div>
            <motion.main 
                className={`flex-1 ${isDarkMode ? 'bg-gray-800 text-gray-100' : 'bg-gray-50'} py-5 overflow-x-hidden`}
                initial={{ marginLeft: sidebarPinned ? '240px' : '60px' }}
                animate={{ marginLeft: sidebarExpanded ? '240px' : '60px' }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
                <Outlet/>
            </motion.main>
        </div>
        <motion.div
            initial={{ marginLeft: sidebarPinned ? '240px' : '60px' }}
            animate={{ marginLeft: sidebarExpanded ? '240px' : '60px' }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="w-[calc(100%-240px)]"  
        >
            <Footer className={`mt-auto ${isDarkMode ? 'bg-gray-900 text-gray-200' : ''}`}/>
        </motion.div>
    </div>
  )
}

export default Plantilla