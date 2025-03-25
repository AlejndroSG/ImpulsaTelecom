import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import InitialsAvatar from './InitialsAvatar';

const PerfilWidget = () => {
  const { user } = useAuth();

  return (
    <div className="bg-white p-4 rounded-lg shadow-md h-full relative">
      <div className="drag-handle absolute top-3 left-3 cursor-move w-4 h-4 flex flex-wrap content-start">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="w-1 h-1 bg-gray-400 rounded-full m-[0.5px]"></div>
        ))}
      </div>
      <h3 className="text-lg font-semibold mb-3 pl-6">Perfil</h3>
      <div className="widget-content">
        <div className="flex items-center">
          <div 
            className="w-20 h-20 rounded-full overflow-hidden flex items-center justify-center"
            style={{ backgroundColor: user?.avatar?.color_fondo || '#f3f4f6' }}
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
            <h4 className="font-semibold">{user?.nombre || 'Usuario'}</h4>
            <p className="text-gray-600">{user?.tipo_usuario}</p>
          </div>
        </div>
        <div className="mt-4 space-y-2">
          <p><span className="font-semibold">Correo:</span> {user?.correo}</p>
          <p><span className="font-semibold">Teléfono:</span> {user?.telefono || 'No especificado'}</p>
        </div>
        <div className="mt-4">
          <Link 
            to="/perfil" 
            className="text-blue-500 hover:text-blue-700 text-sm font-medium"
          >
            Editar perfil
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PerfilWidget;
