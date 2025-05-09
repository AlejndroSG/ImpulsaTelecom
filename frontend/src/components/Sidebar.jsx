import React from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import InitialsAvatar from './InitialsAvatar'
import { useTheme } from '../context/ThemeContext'

const Sidebar = ({ expanded }) => {
  const { user } = useAuth();
  const { isDarkMode } = useTheme();
  
  return (
    <aside className={`${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'} h-full w-full transition-colors duration-300`}>
      {/* Perfil del usuario en el sidebar */}
      {expanded && (
        <div className={`p-4 mb-4 pt-10 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} border-b`}>
          <div className="flex items-center">
            <div 
              className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center mr-3"
              style={{ backgroundColor: user?.avatar?.color_fondo || (isDarkMode ? '#374151' : '#f3f4f6') }}
            >
              {user?.avatar ? (
                <img 
                  src={user.avatar.ruta} 
                  alt={user.nombre || 'Usuario'} 
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    e.target.onerror = null;
                  }}
                />
              ) : (
                <InitialsAvatar 
                  nombre={user?.nombre || 'Usuario'} 
                  size="md" 
                />
              )}
            </div>
            <div className="overflow-hidden">
              <p className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'} truncate`}>{user?.nombre || 'Usuario'}</p>
              <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} truncate`}>{user?.correo || ''}</p>
            </div>
          </div>
        </div>
      )}
      
      <nav className="py-6">
        <NavLink 
          to="/inicio" 
          className={({isActive}) => 
            `flex items-center p-3 rounded-lg transition-colors duration-200 ${isActive 
                ? 'bg-[#78bd00] text-white' 
                : isDarkMode 
                  ? 'hover:bg-gray-800 text-gray-300' 
                  : 'hover:bg-gray-200 text-gray-700'
            } ${expanded ? 'mx-2' : 'justify-center'}`
          }
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span className={`ml-2 whitespace-nowrap ${expanded ? 'block' : 'hidden'} transition-all duration-300`}>Inicio</span>
        </NavLink>
        
        <NavLink 
          to="/fichaje" 
          className={({isActive}) => 
            `flex items-center p-3 mt-4 rounded-lg transition-colors duration-200 ${isActive 
                ? 'bg-[#78bd00] text-white' 
                : isDarkMode 
                  ? 'hover:bg-gray-800 text-gray-300' 
                  : 'hover:bg-gray-200 text-gray-700'
            } ${expanded ? 'mx-2' : 'justify-center'}`
          }
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className={`ml-2 whitespace-nowrap ${expanded ? 'block' : 'hidden'} transition-all duration-300`}>Fichaje</span>
        </NavLink>
        
        <NavLink 
          to="/solicitudes" 
          className={({isActive}) => 
            `flex items-center p-3 mt-4 rounded-lg transition-colors duration-200 ${isActive 
                ? 'bg-[#78bd00] text-white' 
                : isDarkMode 
                  ? 'hover:bg-gray-800 text-gray-300' 
                  : 'hover:bg-gray-200 text-gray-700'
            } ${expanded ? 'mx-2' : 'justify-center'}`
          }
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className={`ml-2 whitespace-nowrap ${expanded ? 'block' : 'hidden'} transition-all duration-300`}>Solicitudes</span>
        </NavLink>
        
        <NavLink 
          to="/usuario" 
          className={({isActive}) => 
            `flex items-center p-3 mt-4 rounded-lg transition-colors duration-200 ${isActive 
                ? 'bg-[#78bd00] text-white' 
                : isDarkMode 
                  ? 'hover:bg-gray-800 text-gray-300' 
                  : 'hover:bg-gray-200 text-gray-700'
            } ${expanded ? 'mx-2' : 'justify-center'}`
          }
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <span className={`ml-2 whitespace-nowrap ${expanded ? 'block' : 'hidden'} transition-all duration-300`}>Mi Panel</span>
        </NavLink>
        
        <NavLink 
          to="/calendario" 
          className={({isActive}) => 
            `flex items-center p-3 mt-4 rounded-lg transition-colors duration-200 ${isActive 
                ? 'bg-[#78bd00] text-white' 
                : isDarkMode 
                  ? 'hover:bg-gray-800 text-gray-300' 
                  : 'hover:bg-gray-200 text-gray-700'
            } ${expanded ? 'mx-2' : 'justify-center'}`
          }
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className={`ml-2 whitespace-nowrap ${expanded ? 'block' : 'hidden'} transition-all duration-300`}>Calendario</span>
        </NavLink>
        
        <NavLink 
          to="/tareas" 
          className={({isActive}) => 
            `flex items-center p-3 mt-4 rounded-lg transition-colors duration-200 ${isActive 
                ? 'bg-[#78bd00] text-white' 
                : isDarkMode 
                  ? 'hover:bg-gray-800 text-gray-300' 
                  : 'hover:bg-gray-200 text-gray-700'
            } ${expanded ? 'mx-2' : 'justify-center'}`
          }
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <span className={`ml-2 whitespace-nowrap ${expanded ? 'block' : 'hidden'} transition-all duration-300`}>Tareas</span>
        </NavLink>
        
        <NavLink 
          to="/perfil" 
          className={({isActive}) => 
            `flex items-center p-3 mt-4 rounded-lg transition-colors duration-200 ${isActive 
                ? 'bg-[#78bd00] text-white' 
                : isDarkMode 
                  ? 'hover:bg-gray-800 text-gray-300' 
                  : 'hover:bg-gray-200 text-gray-700'
            } ${expanded ? 'mx-2' : 'justify-center'}`
          }
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span className={`ml-2 whitespace-nowrap ${expanded ? 'block' : 'hidden'} transition-all duration-300`}>Perfil</span>
        </NavLink>
        
        {/* Sección de administración - solo visible para administradores */}
        {user?.tipo_usuario === 'admin' && (
          <>
            <div className={`mt-8 px-4 ${expanded ? 'block' : 'hidden'}`}>
              <h3 className={`text-xs font-semibold uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Administración
              </h3>
            </div>
            
            <NavLink 
              to="/admin/usuarios" 
              className={({isActive}) => 
                `flex items-center p-3 mt-4 rounded-lg transition-colors duration-200 ${isActive 
                    ? 'bg-[#78bd00] text-white' 
                    : isDarkMode 
                      ? 'hover:bg-gray-800 text-gray-300' 
                      : 'hover:bg-gray-200 text-gray-700'
                } ${expanded ? 'mx-2' : 'justify-center'}`
              }
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <span className={`ml-2 whitespace-nowrap ${expanded ? 'block' : 'hidden'} transition-all duration-300`}>Usuarios</span>
            </NavLink>
            
            <NavLink 
              to="/admin/recordatorios" 
              className={({isActive}) => 
                `flex items-center p-3 mt-4 rounded-lg transition-colors duration-200 ${isActive 
                    ? 'bg-[#78bd00] text-white' 
                    : isDarkMode 
                      ? 'hover:bg-gray-800 text-gray-300' 
                      : 'hover:bg-gray-200 text-gray-700'
                } ${expanded ? 'mx-2' : 'justify-center'}`
              }
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className={`ml-2 whitespace-nowrap ${expanded ? 'block' : 'hidden'} transition-all duration-300`}>Recordatorios</span>
            </NavLink>
            
            <NavLink 
              to="/admin/fichajes" 
              className={({isActive}) => 
                `flex items-center p-3 mt-4 rounded-lg transition-colors duration-200 ${isActive 
                    ? 'bg-[#78bd00] text-white' 
                    : isDarkMode 
                      ? 'hover:bg-gray-800 text-gray-300' 
                      : 'hover:bg-gray-200 text-gray-700'
                } ${expanded ? 'mx-2' : 'justify-center'}`
              }
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className={`ml-2 whitespace-nowrap ${expanded ? 'block' : 'hidden'} transition-all duration-300`}>Fichajes</span>
            </NavLink>
          </>
        )}
      </nav>
    </aside>
  )
}

export default Sidebar
