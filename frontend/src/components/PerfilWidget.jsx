import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import InitialsAvatar from './InitialsAvatar';
import { motion } from 'framer-motion';

const PerfilWidget = () => {
  const { user } = useAuth();
  const { isDarkMode } = useTheme();

  return (
    <motion.div 
      className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-4 rounded-lg shadow-md h-full relative transition-colors duration-300`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="drag-handle absolute top-3 left-3 cursor-move w-4 h-4 flex flex-wrap content-start">
        {[...Array(6)].map((_, i) => (
          <div key={i} className={`w-1 h-1 ${isDarkMode ? 'bg-gray-500' : 'bg-gray-400'} rounded-full m-[0.5px]`}></div>
        ))}
      </div>
      <h3 className={`text-lg font-semibold mb-3 pl-6 ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>Perfil</h3>
      <div className="widget-content">
        <div className="flex items-center">
          <div 
            className="w-20 h-20 rounded-full overflow-hidden flex items-center justify-center"
            style={{ backgroundColor: user?.avatar?.color_fondo || (isDarkMode ? '#374151' : '#f3f4f6') }}
          >
            {user?.avatar ? (
              <img 
                src={user.avatar.ruta} 
                alt={user.nombre || 'Usuario'} 
                className="w-full h-full object-contain"
                onError={(e) => {
                  console.error('Error al cargar imagen de avatar:', user.avatar.ruta);
                  e.target.onerror = null;
                }}
              />
            ) : (
              <InitialsAvatar 
                nombre={user?.nombre || 'Usuario'} 
                size="lg" 
              />
            )}
          </div>
          <div className="ml-4">
            <h4 className={`font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>{user?.nombre || 'Usuario'}</h4>
            <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{user?.tipo_usuario}</p>
          </div>
        </div>
        <div className="mt-4 space-y-2">
          <p className={isDarkMode ? 'text-gray-300' : ''}><span className="font-semibold">Correo:</span> {user?.correo}</p>
          <p className={isDarkMode ? 'text-gray-300' : ''}><span className="font-semibold">Teléfono:</span> {user?.telefono || 'No especificado'}</p>
        </div>
        <div className="mt-4">
          <Link 
            to="/perfil" 
            className={`${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-500 hover:text-blue-700'} text-sm font-medium`}
          >
            Editar perfil
          </Link>
        </div>
      </div>
    </motion.div>
  );
};

export default PerfilWidget;
