import React, { useState, useEffect } from 'react';
import axios from 'axios';
import InitialsAvatar from './InitialsAvatar';

const AvatarSelector = ({ selectedAvatar, onSelectAvatar }) => {
  const [avatares, setAvatares] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('todos');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState(null);

  useEffect(() => {
    const fetchAvatares = async () => {
      try {
        setLoading(true);
        
        // Usar la URL completa para evitar problemas de ruta
        const apiUrl = 'http://localhost/ImpulsaTelecom/backend/api/avatares.php';
        
        const response = await axios.get(apiUrl);
        
        if (response.data && Array.isArray(response.data)) {
          // Ya no modificamos las rutas, las usamos tal como vienen del backend
          setAvatares(response.data);
          
          // Extraer categorías únicas
          const uniqueCategorias = ['todos', ...new Set(response.data.map(avatar => avatar.categoria))];
          setCategorias(uniqueCategorias);
          
          setLoading(false);
          setDebugInfo(null);
        } else {
          setError('Formato de respuesta inesperado');
          setDebugInfo(JSON.stringify(response.data));
          setLoading(false);
        }
      } catch (err) {
        console.error('Error al cargar avatares:', err);
        setError(`Error al cargar los avatares: ${err.message}`);
        setLoading(false);
      }
    };

    fetchAvatares();
  }, []);

  const filteredAvatares = categoriaSeleccionada === 'todos' 
    ? avatares 
    : avatares.filter(avatar => avatar.categoria === categoriaSeleccionada);

  if (loading) return <div className="text-center py-4">Cargando avatares...</div>;
  
  if (error) {
    return (
      <div className="text-center py-4">
        <p className="text-red-500 mb-2">{error}</p>
        {debugInfo && (
          <div className="mt-2 p-3 bg-gray-100 rounded-md text-left overflow-auto max-h-40 text-xs">
            <p className="font-semibold mb-1">Información de depuración:</p>
            <pre>{debugInfo}</pre>
          </div>
        )}
        <button 
          onClick={() => window.location.reload()}
          className="mt-3 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="avatar-selector">
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
        <select 
          className="w-full p-2 border border-gray-300 rounded-md"
          value={categoriaSeleccionada}
          onChange={(e) => setCategoriaSeleccionada(e.target.value)}
        >
          {categorias.map(categoria => (
            <option key={categoria} value={categoria}>
              {categoria.charAt(0).toUpperCase() + categoria.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {/* Opción para usar iniciales (sin avatar) */}
        <div 
          key="no-avatar"
          className={`cursor-pointer p-2 rounded-lg transition-all ${
            selectedAvatar === null ? 'bg-blue-100 ring-2 ring-blue-500' : 'hover:bg-gray-100'
          }`}
          onClick={() => onSelectAvatar(null)}
        >
          <div className="aspect-square rounded-full overflow-hidden flex items-center justify-center">
            <InitialsAvatar nombre="Usar Iniciales" size="md" />
          </div>
          <p className="text-xs text-center mt-1 truncate">Usar Iniciales</p>
        </div>
        
        {filteredAvatares.length > 0 ? (
          filteredAvatares.map(avatar => (
            <div 
              key={avatar.id}
              className={`cursor-pointer p-2 rounded-lg transition-all ${
                selectedAvatar === avatar.id ? 'bg-blue-100 ring-2 ring-blue-500' : 'hover:bg-gray-100'
              }`}
              onClick={() => onSelectAvatar(avatar.id)}
            >
              <div 
                className="aspect-square rounded-full overflow-hidden flex items-center justify-center" 
                style={{ backgroundColor: avatar.color_fondo }}
              >
                <img 
                  src={avatar.ruta} 
                  alt={avatar.nombre} 
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    console.error('Error al cargar imagen:', avatar.ruta);
                    e.target.onerror = null;
                  }}
                />
              </div>
              <p className="text-xs text-center mt-1 truncate">{avatar.nombre}</p>
            </div>
          ))
        ) : (
          <div className="col-span-4 text-center py-4 text-gray-500">
            No se encontraron avatares en esta categoría
          </div>
        )}
      </div>
    </div>
  );
};

export default AvatarSelector;
