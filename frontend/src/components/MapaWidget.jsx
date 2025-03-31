import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useTheme } from '../context/ThemeContext';

// Corregir el problema de los iconos de Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// Definir iconos personalizados
const userIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const officeIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Coordenadas de la oficina
const OFICINA_COORDS = { lat: 40.416775, lng: -3.703790 }; // Madrid, España
const RANGO_PERMITIDO = 300; // 300 metros

const MapaWidget = () => {
  const { isDarkMode } = useTheme();
  
  // Estados para manejar la ubicación
  const [ubicacion, setUbicacion] = useState(null);
  const [distanciaOficina, setDistanciaOficina] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Función para obtener la ubicación actual
  const obtenerUbicacion = () => {
    setLoading(true);
    setError(null);
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const newPosition = { lat: latitude, lng: longitude };
          setUbicacion(newPosition);
          
          // Calcular distancia a la oficina
          const distancia = calcularDistancia(latitude, longitude, OFICINA_COORDS.lat, OFICINA_COORDS.lng);
          const distanciaFormateada = formatearDistancia(distancia);
          setDistanciaOficina(distanciaFormateada);
          
          setLoading(false);
        },
        (error) => {
          console.error('Error al obtener la ubicación:', error);
          setError('No se pudo obtener tu ubicación. Por favor, verifica los permisos de ubicación en tu navegador.');
          setLoading(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setError('Tu navegador no soporta geolocalización.');
      setLoading(false);
    }
  };
  
  // Función para calcular la distancia entre dos puntos geográficos (fórmula de Haversine)
  const calcularDistancia = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radio de la Tierra en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const d = R * c; // Distancia en km
    return d * 1000; // Convertir a metros
  };
  
  // Función para formatear la distancia en un formato legible
  const formatearDistancia = (distanciaMetros) => {
    if (distanciaMetros < 1000) {
      return `${Math.round(distanciaMetros)} metros`;
    } else {
      return `${(distanciaMetros / 1000).toFixed(2)} km`;
    }
  };
  
  // Efectos para cargar datos iniciales
  useEffect(() => {
    // Obtener ubicación actual al cargar el componente
    obtenerUbicacion();
  }, []);
  
  if (error) {
    return (
      <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-md p-5 h-full`}>
        <div className="text-center">
          <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'} mb-2`}>Error de Ubicación</h3>
          <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${isDarkMode ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-800'} rounded-xl shadow-md p-5`}>
      <div className="mb-3">
        <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>Tu Ubicación</h3>
        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          {distanciaOficina ? `Distancia a la oficina: ${distanciaOficina}` : 'Calculando distancia...'}
        </p>
      </div>
      
      {/* Mapa con Leaflet */}
      <div className="rounded-lg overflow-hidden" style={{ height: '350px' }}>
        {ubicacion ? (
          <MapContainer 
            center={[ubicacion.lat, ubicacion.lng]} 
            zoom={15} 
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            {/* Marcador de la oficina */}
            <Marker position={[OFICINA_COORDS.lat, OFICINA_COORDS.lng]} icon={officeIcon}>
              <Popup>
                <div>
                  <h4>Oficina</h4>
                </div>
              </Popup>
            </Marker>
            
            {/* Marcador del usuario */}
            <Marker position={[ubicacion.lat, ubicacion.lng]} icon={userIcon}>
              <Popup>
                <div>
                  <h4>Tu ubicación</h4>
                  <p>{distanciaOficina} de la oficina</p>
                </div>
              </Popup>
            </Marker>
            
            {/* Círculo de rango (300m) */}
            <Circle 
              center={[OFICINA_COORDS.lat, OFICINA_COORDS.lng]}
              radius={300}
              pathOptions={{
                fillColor: '#60a5fa80',
                fillOpacity: 0.3,
                color: '#3b82f6',
                weight: 1
              }}
            />
          </MapContainer>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p>Obteniendo tu ubicación...</p>
            </div>
          </div>
        )}
      </div>
      
      {/* Botón para actualizar ubicación */}
      <div className="mt-4">
        <button
          onClick={obtenerUbicacion}
          className={`px-4 py-2 rounded-md text-sm font-medium ${isDarkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white`}
          disabled={loading}
        >
          {loading ? 'Actualizando...' : 'Actualizar ubicación'}
        </button>
      </div>
    </div>
  );
};

export default MapaWidget;
