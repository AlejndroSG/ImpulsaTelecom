import React from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import InitialsAvatar from './InitialsAvatar'

const Sidebar = ({ expanded }) => {
  const { user } = useAuth();
  
  return (
    <aside className="bg-gray-100 h-full w-full">
      {/* Perfil del usuario en el sidebar */}
      {expanded && (
        <div className="p-4 mb-4 border-b pt-10 border-gray-200">
          <div className="flex items-center">
            <div 
              className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center mr-3"
              style={{ backgroundColor: user?.avatar?.color_fondo || '#f3f4f6' }}
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
              <p className="font-medium text-gray-800 truncate">{user?.nombre || 'Usuario'}</p>
              <p className="text-xs text-gray-500 truncate">{user?.correo || ''}</p>
            </div>
          </div>
        </div>
      )}
      
      <nav className="py-6">
        <NavLink 
          to="/inicio" 
          className={({isActive}) => 
            `flex items-center p-3 rounded-lg transition-colors duration-200 ${
              isActive 
                ? 'bg-[#78bd00] text-white' 
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
            `flex items-center p-3 mt-4 rounded-lg transition-colors duration-200 ${
              isActive 
                ? 'bg-[#78bd00] text-white' 
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
          to="/calendario" 
          className={({isActive}) => 
            `flex items-center p-3 mt-4 rounded-lg transition-colors duration-200 ${
              isActive 
                ? 'bg-[#78bd00] text-white' 
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
            `flex items-center p-3 mt-4 rounded-lg transition-colors duration-200 ${
              isActive 
                ? 'bg-[#78bd00] text-white' 
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
            `flex items-center p-3 mt-4 rounded-lg transition-colors duration-200 ${
              isActive 
                ? 'bg-[#78bd00] text-white' 
                : 'hover:bg-gray-200 text-gray-700'
            } ${expanded ? 'mx-2' : 'justify-center'}`
          }
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span className={`ml-2 whitespace-nowrap ${expanded ? 'block' : 'hidden'} transition-all duration-300`}>Perfil</span>
        </NavLink>
      </nav>
    </aside>
  )
}

export default Sidebar
