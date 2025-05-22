import React, { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useTheme } from '../context/ThemeContext';
import axios from 'axios';
import './MapaWidget.css';

// Importar iconos de Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import iconRetina from 'leaflet/dist/images/marker-icon-2x.png';

// Arreglar problema de iconos en React Leaflet
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: iconRetina,
  iconUrl: icon,
  shadowUrl: iconShadow,
});

// URLs de la API
const API_URL = 'http://localhost/ImpulsaTelecom/backend';

// Colores para los marcadores de ejemplo (usuarios sin datos reales de ubicación)
const COLORES_EJEMPLO = [
  '#ff6b6b', '#51cf66', '#339af0', '#fcc419', '#cc5de8',
  '#22b8cf', '#ff922b', '#94d82d', '#20c997', '#845ef7'
];

// Componente para centrar el mapa
const MapCenterController = ({ center }) => {
  const map = useMap();
  
  useEffect(() => {
    if (center) {
      map.flyTo(center, map.getZoom());
    }
  }, [center, map]);
  
  return null;
};

// Coordenadas de la oficina
const OFICINA_COORDS = { lat: 40.416775, lng: -3.703790 }; // Madrid, España
const RANGO_PERMITIDO = 300; // 300 metros

// Iconos personalizados para los usuarios
const crearIconoPersonalizado = (color) => {
  return new L.Icon({
    iconUrl: icon,
    iconRetinaUrl: iconRetina,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
    className: 'usuario-marcador',
    iconColor: color
  });
};

const MapaWidget = ({ admin = false, className = '' }) => {
  const { theme } = useTheme();
  const [mapaCenter, setMapaCenter] = useState(OFICINA_COORDS);
  const [ubicacion, setUbicacion] = useState(null);
  const [distancia, setDistancia] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [mostrarCirculo, setMostrarCirculo] = useState(true);
  const [usuariosUbicaciones, setUsuariosUbicaciones] = useState([]);
  const [loadingUsuarios, setLoadingUsuarios] = useState(false);
  
  // Para modos oscuros, ajustar el estilo del mapa
  const mapStyle = theme === 'dark' ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png' : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
  
  // Función para obtener la ubicación actual del usuario
  const obtenerUbicacion = useCallback(() => {
    if (!admin) {
      setLoading(true);
      setError(null);
      
      // Comprobar si el navegador soporta geolocalización
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const nuevaUbicacion = {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            };
            
            setUbicacion(nuevaUbicacion);
            setMapaCenter(nuevaUbicacion);
            
            // Calcular distancia a la oficina
            const distanciaMetros = calcularDistancia(
              nuevaUbicacion.lat, nuevaUbicacion.lng,
              OFICINA_COORDS.lat, OFICINA_COORDS.lng
            ) * 1000; // convertir km a metros
            
            setDistancia(distanciaMetros);
            setLoading(false);
          },
          (error) => {
            console.error('Error al obtener la ubicación:', error);
            let mensajeError = 'Error al obtener la ubicación';
            
            switch (error.code) {
              case error.PERMISSION_DENIED:
                mensajeError = 'Permiso denegado para obtener ubicación';
                break;
              case error.POSITION_UNAVAILABLE:
                mensajeError = 'Ubicación no disponible';
                break;
              case error.TIMEOUT:
                mensajeError = 'Tiempo de espera agotado';
                break;
              default:
                mensajeError = `Error desconocido: ${error.message}`;
            }
            
            setError(mensajeError);
            setLoading(false);
          }
        );
      } else {
        setError('Tu navegador no soporta geolocalización');
        setLoading(false);
      }
    }
  }, [admin]);
  
  // Función para obtener ubicaciones de todos los usuarios (modo admin)
  const obtenerUbicacionesUsuarios = useCallback(async () => {
    if (!admin) return;
    
    try {
      setLoadingUsuarios(true);
      setError(null);
      
      console.log('Obteniendo ubicaciones de usuarios...');
      
      const response = await axios.get('http://localhost/ImpulsaTelecom/backend/api/obtener_ubicaciones.php', {
        withCredentials: true
      });
      
      console.log('Respuesta recibida:', response.data);
      
      if (response.data.success) {
        // Convertir los datos recibidos al formato adecuado
        if (response.data.ubicaciones && Array.isArray(response.data.ubicaciones)) {
          const ubicacionesFormateadas = response.data.ubicaciones.map(u => ({
            id: u.id_usuario,
            nombre: u.nombre || 'Usuario ' + u.id_usuario,
            avatar: u.avatar_ruta,
            posicion: { 
              lat: parseFloat(u.latitud || 0), 
              lng: parseFloat(u.longitud || 0) 
            },
            fecha: u.fecha_actualizacion || 'No disponible',
            departamento: u.departamento || 'No especificado'
          }));
          
          console.log('Ubicaciones formateadas:', ubicacionesFormateadas);
          
          // Para usuarios sin ubicación, agregar ubicaciones de ejemplo y marcarlos
          let usuariosSinUbicacion = [];
          if (response.data.usuarios_sin_ubicacion && Array.isArray(response.data.usuarios_sin_ubicacion) && response.data.usuarios_sin_ubicacion.length > 0) {
            // Crear ubicaciones aleatorias alrededor de la oficina para los usuarios sin ubicación
            usuariosSinUbicacion = response.data.usuarios_sin_ubicacion.map((u, index) => {
              // Generar posición aleatoria cercana a la oficina (+-0.01 grados ~ 1km)
              const randomLat = OFICINA_COORDS.lat + (Math.random() * 0.02 - 0.01);
              const randomLng = OFICINA_COORDS.lng + (Math.random() * 0.02 - 0.01);
              
              return {
                id: u.id_usuario,
                nombre: u.nombre || 'Usuario ' + u.id_usuario,
                avatar: u.avatar_ruta,
                posicion: { lat: randomLat, lng: randomLng },
                fecha: 'No disponible',
                departamento: u.departamento || 'No especificado',
                esEjemplo: true // Marcar como ejemplo
              };
            });
            
            console.log('Usuarios sin ubicación (ejemplos):', usuariosSinUbicacion);
          }
          
          // Combinar con las ubicaciones reales
          const todasLasUbicaciones = [...ubicacionesFormateadas, ...usuariosSinUbicacion];
          setUsuariosUbicaciones(todasLasUbicaciones);
          
          // Si hay ubicaciones, centrar el mapa en la primera real, o en la oficina si no hay reales
          if (ubicacionesFormateadas.length > 0) {
            setMapaCenter(ubicacionesFormateadas[0].posicion);
          } else if (usuariosSinUbicacion.length > 0) {
            // Si solo hay usuarios de ejemplo, centrar en la oficina
            setMapaCenter(OFICINA_COORDS);
          } else {
            setMapaCenter(OFICINA_COORDS);
          }
        } else {
          console.warn('No se encontraron ubicaciones o el formato es inválido', response.data);
          setUsuariosUbicaciones([]);
          setMapaCenter(OFICINA_COORDS);
        }
      } else {
        console.error('Error al obtener ubicaciones:', response.data.message);
        setError(`Error al cargar datos: ${response.data.message}`);
        // Si no hay datos, mostrar al menos la oficina
        setMapaCenter(OFICINA_COORDS);
        setUsuariosUbicaciones([]);
      }
    } catch (error) {
      console.error('Error al obtener ubicaciones de usuarios:', error);
      setError(`Error de conexión: ${error.message || 'Error desconocido'}`);
      setMapaCenter(OFICINA_COORDS);
      setUsuariosUbicaciones([]);
    } finally {
      setLoadingUsuarios(false);
    }
  }, [admin]);
  
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
    return d;
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
    
    // Si es administrador, obtener las ubicaciones de todos los usuarios
    if (admin) {
      obtenerUbicacionesUsuarios();
    }
  }, [obtenerUbicacion, obtenerUbicacionesUsuarios, admin]);
  
  // Función para guardar la ubicación actual en el servidor
  const guardarUbicacion = async () => {
    if (!ubicacion) return;
    
    try {
      setGuardando(true);
      setError(null);
      
      console.log('Guardando ubicación:', ubicacion);
      
      const response = await axios.post(`${API_URL}/api/guardar_ubicacion.php`, {
        latitud: ubicacion.lat,
        longitud: ubicacion.lng
      }, {
        withCredentials: true
      });
      
      console.log('Respuesta del servidor:', response.data);
      
      if (response.data.success) {
        // Actualizar UI con mensaje de éxito
        setGuardando(false);
      } else {
        setError(`Error al guardar ubicación: ${response.data.message}`);
        setGuardando(false);
      }
    } catch (error) {
      console.error('Error al guardar ubicación:', error);
      setError(`Error de conexión: ${error.message || 'Error desconocido'}`);
      setGuardando(false);
    }
  };
  
  // Crear un icono personalizado para cada usuario
  const crearIconoUsuario = (index) => {
    // Usar colores predefinidos para los usuarios con datos de ejemplo
    // y el icono predeterminado para usuarios con datos reales
    const color = index % COLORES_EJEMPLO.length;
    return crearIconoPersonalizado(COLORES_EJEMPLO[color]);
  };
  
  return (
    <div className={`mapa-widget ${className} ${theme === 'dark' ? 'dark-theme' : ''}`}>
      {admin ? (
        <h2 className="mapa-titulo">Mapa de Ubicaciones de Personal</h2>
      ) : (
        <h3 className="mapa-titulo">Mi Ubicación</h3>
      )}
      
      {error && (
        <div className="error-mensaje">
          <p>{error}</p>
          {!admin && (
            <button 
              className="btn-retry" 
              onClick={obtenerUbicacion} 
              disabled={loading}>
              Reintentar
            </button>
          )}
        </div>
      )}
      
      <div className="mapa-container">
        <MapContainer 
          center={mapaCenter} 
          zoom={13} 
          style={{ height: admin ? '500px' : '300px', width: '100%' }}
          >      
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url={mapStyle}
          />
          
          {/* Marcador de la oficina siempre visible */}
          <Marker position={OFICINA_COORDS}>
            <Popup>
              <strong>Oficina Central</strong>
            </Popup>
          </Marker>
          
          {/* Círculo alrededor de la oficina que muestra el rango permitido */}
          {mostrarCirculo && (
            <Circle 
              center={OFICINA_COORDS} 
              radius={RANGO_PERMITIDO} 
              pathOptions={{ fillColor: 'blue', fillOpacity: 0.1, color: 'blue' }}
            />
          )}
          
          {/* Controlador para centrar el mapa */}
          <MapCenterController center={mapaCenter} />
          
          {/* Marcador de ubicación del usuario actual (solo para vista normal) */}
          {!admin && ubicacion && (
            <Marker position={ubicacion}>
              <Popup>
                <div className="popup-content">
                  <strong>Tu ubicación actual</strong>
                  <p>Latitud: {ubicacion.lat.toFixed(6)}</p>
                  <p>Longitud: {ubicacion.lng.toFixed(6)}</p>
                  {distancia !== null && (
                    <p>
                      Distancia a la oficina: <strong>{formatearDistancia(distancia)}</strong>
                      {distancia <= RANGO_PERMITIDO ? (
                        <span className="dentro-rango"> (Dentro del rango permitido)</span>
                      ) : (
                        <span className="fuera-rango"> (Fuera del rango permitido)</span>
                      )}
                    </p>
                  )}
                </div>
              </Popup>
            </Marker>
          )}
          
          {/* Marcadores para todos los usuarios (modo admin) */}
          {admin && usuariosUbicaciones.map((usuario, index) => (
            <Marker 
              key={`usuario-${usuario.id}`} 
              position={usuario.posicion}
              icon={usuario.esEjemplo ? crearIconoUsuario(index) : new L.Icon.Default()}
            >
              <Popup>
                <div className="popup-content">
                  <div className="usuario-header">
                    {usuario.avatar && (
                      <img 
                        src={usuario.avatar} 
                        alt={usuario.nombre} 
                        className="avatar-mini" 
                      />
                    )}
                    <strong>{usuario.nombre}</strong>
                  </div>
                  <p>Departamento: {usuario.departamento}</p>
                  {usuario.esEjemplo ? (
                    <p className="ejemplo-nota">⚠️ Sin datos reales de ubicación</p>
                  ) : (
                    <>
                      <p>Latitud: {usuario.posicion.lat.toFixed(6)}</p>
                      <p>Longitud: {usuario.posicion.lng.toFixed(6)}</p>
                      <p>Última actualización: {usuario.fecha}</p>
                    </>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
      
      {/* Controles para usuario normal */}
      {!admin && (
        <div className="controles">
          <button 
            className="btn-ubicacion" 
            onClick={obtenerUbicacion} 
            disabled={loading}>
            {loading ? 'Obteniendo ubicación...' : 'Actualizar mi ubicación'}
          </button>
          
          {ubicacion && (
            <button 
              className="btn-guardar" 
              onClick={guardarUbicacion} 
              disabled={guardando || loading}>
              {guardando ? 'Guardando...' : 'Guardar esta ubicación'}
            </button>
          )}
          
          <label className="toggle-label">
            <input 
              type="checkbox" 
              checked={mostrarCirculo} 
              onChange={() => setMostrarCirculo(!mostrarCirculo)} 
            />
            Mostrar área de oficina
          </label>
        </div>
      )}
      
      {/* Leyenda para el modo admin */}
      {admin && (
        <div className="mapa-leyenda">
          <h4>Leyenda:</h4>
          <ul>
            <li><span className="marcador-oficina"></span> Oficina Central</li>
            <li><span className="marcador-usuario"></span> Usuario con ubicación registrada</li>
            <li><span className="marcador-ejemplo"></span> Usuario sin ubicación registrada (posición aproximada)</li>
            <li><span className="circulo-rango"></span> Rango permitido (300 m)</li>
          </ul>
          <div className="mapa-stats">
            <p><strong>Total usuarios:</strong> {usuariosUbicaciones.length}</p>
            <p><strong>Con ubicación:</strong> {usuariosUbicaciones.filter(u => !u.esEjemplo).length}</p>
            <p><strong>Sin ubicación:</strong> {usuariosUbicaciones.filter(u => u.esEjemplo).length}</p>
          </div>
          <button 
            className="btn-refresh" 
            onClick={obtenerUbicacionesUsuarios} 
            disabled={loadingUsuarios}>
            {loadingUsuarios ? 'Actualizando...' : 'Actualizar datos'}
          </button>
        </div>
      )}
    </div>
  );
};

export default MapaWidget;
