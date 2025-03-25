import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import InitialsAvatar from './InitialsAvatar'

const Header = ({ className }) => {
  const { user, logout } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleMenu = () => {
    setShowMenu(!showMenu);
  };

  return (
    <header className={`bg-white shadow-md py-4 px-6 flex justify-between items-center ${className || ''}`}>
      <div className="flex items-center">
        <img src="./src/img/logo/logoimpulsa.png" alt="Impulsa Telecom Logo" className="h-10 mr-4" />
        <h1 className="text-xl font-semibold text-gray-800">Registro de Horas</h1>
      </div>

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
                className="mr-2"
              />
            )}
            <span className="text-gray-700 mr-1">{user.nombre}</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>

          {showMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
              <Link to="/perfil" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                Mi Perfil
              </Link>
              <button 
                onClick={handleLogout}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Cerrar Sesión
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  )
}

export default Header