import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import InitialsAvatar from './InitialsAvatar'

const Header = ({ className }) => {
  const { user, logout } = useAuth();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const [showMenu, setShowMenu] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const navigate = useNavigate();

  // Actualizar la hora cada minuto
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error al cerrar sesión', error);
    }
  };

  const toggleMenu = () => {
    setShowMenu(!showMenu);
  };

  // Formatear la hora actual
  const formattedTime = currentTime.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit'
  });

  // Formatear la fecha actual
  const formattedDate = currentTime.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });

  return (
    <header 
      className={`${isDarkMode ? 'bg-gradient-to-r from-gray-900 via-purple-900 to-gray-900 text-white' : 'bg-white text-gray-800'} 
                shadow-md py-4 px-6 flex justify-between items-center transition-all duration-500 ${className || ''}`}
    >
      <div className="flex items-center">
        <img 
          src="./src/img/logo/logoimpulsa.png" 
          alt="Impulsa Telecom Logo" 
          className={`h-10 mr-4 ${isDarkMode ? 'filter brightness-150 drop-shadow-lg' : ''} transition-all duration-500`} 
        />
        <h1 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'} transition-colors duration-500`}>
          Registro de Horas
        </h1>
      </div>

      <div className="flex items-center">
        {/* Fecha y hora */}
        <div className="hidden md:flex flex-col items-end mr-6">
          <p className={`text-lg font-medium ${isDarkMode ? 'text-cyan-300' : 'text-cyan-600'} transition-colors duration-500`}>
            {formattedTime}
          </p>
          <p className={`text-sm capitalize ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} transition-colors duration-500`}>
            {formattedDate}
          </p>
        </div>

        {/* Toggle de modo oscuro */}
        <button
          onClick={toggleDarkMode}
          className={`p-2 rounded-full mr-4 transition-all duration-500 transform hover:scale-110 ${isDarkMode 
            ? 'bg-gradient-to-r from-purple-800 to-indigo-900 text-yellow-300 shadow-lg shadow-purple-500/30' 
            : 'bg-gray-200 text-gray-700'}`}
        >
          {isDarkMode ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>

        {user && (
          <div className="relative">
            <div 
              className="flex items-center cursor-pointer" 
              onClick={toggleMenu}
            >
              {user.avatar ? (
                <img 
                  src={user.avatar.ruta} 
                  alt={user.nombre} 
                  className="w-10 h-10 rounded-full mr-2"
                  style={{ backgroundColor: user.avatar.color_fondo }}
                />
              ) : (
                <InitialsAvatar 
                  nombre={user.nombre} 
                  size="md" 
                  className={`mr-2 ${isDarkMode ? 'ring-2 ring-purple-500' : ''}`}
                />
              )}
              <span className={`mr-1 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'} transition-colors duration-500`}>{user.nombre}</span>
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} transition-colors duration-500`} viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>

            {showMenu && (
              <div className={`absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 z-10 ${isDarkMode 
                ? 'bg-gradient-to-b from-gray-800 to-gray-900 text-white border border-purple-800' 
                : 'bg-white text-gray-700'} transition-all duration-500`}>
                <Link to="/perfil" className={`block px-4 py-2 text-sm ${isDarkMode 
                  ? 'hover:bg-purple-900 hover:text-white' 
                  : 'hover:bg-gray-100'} transition-colors duration-300`}>
                  Mi Perfil
                </Link>
                <button 
                  onClick={handleLogout}
                  className={`block w-full text-left px-4 py-2 text-sm ${isDarkMode 
                    ? 'hover:bg-purple-900 hover:text-white' 
                    : 'hover:bg-gray-100'} transition-colors duration-300`}
                >
                  Cerrar Sesión
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  )
}

export default Header