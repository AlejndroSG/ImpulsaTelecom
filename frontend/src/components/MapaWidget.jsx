import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Icon } from 'leaflet';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import 'leaflet/dist/leaflet.css';
import { motion } from 'framer-motion';

// Usar la misma URL base que en otros componentes
const API_URL = 'http://localhost/ImpulsaTelecom/backend/controlador.php';

// Asegurar que axios use credenciales
axios.defaults.withCredentials = true;

// Icono personalizado para el marcador del usuario actual
const currentUserIcon = new Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Componente para centrar el mapa en la ubicación actual
const LocationMarker = ({ position, setPosition }) => {
  const map = useMap();
  
  useEffect(() => {
    if (position) {
      map.flyTo(position, map.getZoom());
    }
  }, [position, map]);
  
  return null;
};

const MapaWidget = () => {
  const { user } = useAuth();
  const [position, setPosition] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Obtener la ubicación actual del usuario
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setPosition([latitude, longitude]);
          setLoading(false);
          
          // Si hay un usuario logueado, guardar su ubicación
          if (user && user.id) {
            guardarUbicacion(latitude, longitude);
          }
        },
        (error) => {
          console.error('Error al obtener la ubicación:', error);
          setError('No se pudo obtener tu ubicación. Por favor, permite el acceso a la ubicación en tu navegador.');
          setLoading(false);
        },
        { enableHighAccuracy: true }
      );
    } else {
      setError('Tu navegador no soporta geolocalización.');
      setLoading(false);
    }
  }, [user]);

  // Guardar la ubicación del usuario en la base de datos
  const guardarUbicacion = async (latitude, longitude) => {
    if (!user || !user.id) return;

    try {
      await axios.post(`${API_URL}?action=guardar_ubicacion`,
        { 
          id_usuario: user.id,
          latitud: latitude,
          longitud: longitude 
        },
        {
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
    } catch (error) {
      console.error('Error al guardar ubicación:', error);
    }
  };

  // Actualizar ubicación cuando se inicia un nuevo fichaje
  const actualizarUbicacionFichaje = async (idFichaje) => {
    if (!user || !user.id || !position) return;

    try {
      await axios.post(`${API_URL}?action=actualizar_ubicacion_fichaje`,
        { 
          id_usuario: user.id,
          id_fichaje: idFichaje,
          latitud: position[0],
          longitud: position[1] 
        },
        {
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
    } catch (error) {
      console.error('Error al actualizar ubicación de fichaje:', error);
    }
  };

  // Actualizar ubicaciones cada cierto tiempo
  useEffect(() => {
    // Actualizar cada 5 minutos
    const interval = setInterval(() => {
      if (user && user.id && position) {
        guardarUbicacion(position[0], position[1]);
      }
    }, 300000); // 5 minutos

    return () => clearInterval(interval);
  }, [user, position]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-[#91e302] h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#91e302]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-[#91e302] h-full">
        <div className="text-center">
          <div className="text-red-500 mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Error de Ubicación</h3>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      className="bg-white rounded-xl shadow-md p-5 border-l-4 border-[#91e302] h-full flex flex-col"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="mb-3 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">Tu Ubicación</h3>
          <p className="text-sm text-gray-500">Coordenadas: {position ? `${position[0].toFixed(6)}, ${position[1].toFixed(6)}` : 'Cargando...'}</p>
        </div>
        <div className="flex items-center bg-green-100 px-3 py-1 rounded-full text-sm text-green-700">
          <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
          Localización activa
        </div>
      </div>
      
      <div className="flex-grow relative" style={{ minHeight: '450px' }}>
        {position ? (
          <>
            <div className="absolute top-2 right-2 z-10 bg-white p-2 rounded-lg shadow-md text-xs text-gray-600">
              <div className="flex items-center mb-1">
                <div className="w-3 h-3 rounded-full bg-[#91e302] mr-2"></div>
                <span>Tu posición</span>
              </div>
              <div className="text-center text-[10px] mt-1 text-gray-500">
                Actualizado: {new Date().toLocaleTimeString()}
              </div>
            </div>
            <MapContainer 
              center={position} 
              zoom={15} 
              style={{ height: '100%', width: '100%', borderRadius: '0.5rem', minHeight: '450px' }}
              className="shadow-inner"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <LocationMarker position={position} setPosition={setPosition} />
              
              {/* Marcador del usuario actual */}
              <Marker position={position} icon={currentUserIcon}>
                <Popup className="custom-popup" maxWidth={280}>
                  <div className="text-center p-3 bg-white rounded-lg shadow-inner">
                    <div className="flex flex-col items-center">
                      <div className="w-20 h-20 rounded-full bg-gradient-to-r from-[#91e302] to-[#68a300] flex items-center justify-center text-white text-2xl font-bold mb-3 shadow-md border-4 border-white">
                        {user?.nombre?.charAt(0) || 'U'}
                      </div>
                      <h3 className="text-xl font-bold text-gray-800 mb-1">{user?.nombre || 'Usuario actual'}</h3>
                      <p className="text-sm text-gray-600 mb-2">{user?.email || ''}</p>
                      <div className="w-full border-t border-gray-200 my-2"></div>
                      <div className="bg-gray-100 px-4 py-2 rounded-full text-sm text-gray-700 mt-1 shadow-sm flex items-center">
                        <span className="inline-block w-3 h-3 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                        Conectado ahora
                      </div>
                      <p className="text-xs text-gray-500 mt-3 italic">Ubicación actualizada: {new Date().toLocaleTimeString()}</p>
                    </div>
                  </div>
                </Popup>
              </Marker>
            </MapContainer>
          </>
        ) : (
          <div className="flex items-center justify-center h-full bg-gray-50 rounded-lg">
            <div className="text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#91e302] mx-auto mb-3"></div>
              <p className="text-gray-500">Cargando mapa...</p>
            </div>
          </div>
        )}
      </div>
      
      <div className="mt-3 text-xs text-gray-500 italic text-center">
        La ubicación se actualiza automáticamente cada 5 minutos o al iniciar un nuevo fichaje
      </div>
    </motion.div>
  );
};

export default MapaWidget;
