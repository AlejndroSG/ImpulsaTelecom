import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { FaUserClock, FaClock, FaCalendarAlt, FaBuilding, FaIdCard } from 'react-icons/fa';
import { motion } from 'framer-motion';
import InitialsAvatar from './InitialsAvatar';

// Usar la misma URL base que en otros componentes
const API_URL = 'http://localhost/ImpulsaTelecom/backend/controlador.php';

const PerfilHorarioWidget = () => {
  const { user } = useAuth();
  const { isDarkMode } = useTheme();
  const [horario, setHorario] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cargar horario del usuario
  const cargarHorario = async () => {
    if (!user || !user.id) return;

    try {
      setLoading(true);
      console.log('Iniciando petición de horario de usuario, enviando parámetros:', { id_usuario: user.id });
      const response = await axios.post(
        `${API_URL}?action=horario_usuario`,
        { id_usuario: user.id },
        {
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );

      console.log('Respuesta del servidor (horario_usuario):', response.data);

      if (response.data.success && response.data.datos) {
        // Nueva estructura devuelta por el backend mejorado
        const usuario = response.data.datos;
        console.log('Datos de usuario recibidos:', usuario);
        
        if (usuario.horario) {
          // Adaptar los datos a la estructura que espera el componente
          const horarioCompleto = {
            'lunes': {'trabaja': true, 'hora_entrada': usuario.horario.entrada, 'hora_salida': usuario.horario.salida},
            'martes': {'trabaja': true, 'hora_entrada': usuario.horario.entrada, 'hora_salida': usuario.horario.salida},
            'miércoles': {'trabaja': true, 'hora_entrada': usuario.horario.entrada, 'hora_salida': usuario.horario.salida},
            'jueves': {'trabaja': true, 'hora_entrada': usuario.horario.entrada, 'hora_salida': usuario.horario.salida},
            'viernes': {'trabaja': true, 'hora_entrada': usuario.horario.entrada, 'hora_salida': usuario.horario.salida},
            'sábado': {'trabaja': false},
            'domingo': {'trabaja': false}
          };
          
          // Si hay días laborables específicos, actualizar
          if (usuario.horario.dias_laborables) {
            const diasLaborables = usuario.horario.dias_laborables.split(',');
            // Marcar los días que son laborables según los datos
            Object.keys(horarioCompleto).forEach(dia => {
              const inicial = dia.charAt(0).toUpperCase();
              horarioCompleto[dia].trabaja = diasLaborables.includes(inicial);
            });
          }
          
          console.log('Horario adaptado:', horarioCompleto);
          setHorario(horarioCompleto);
          
          // Actualizar datos del usuario si es necesario
          if (user && !user.correo && usuario.email) {
            user.correo = usuario.email;
            user.nombre = usuario.nombre || user.nombre;
          }
        } else {
          throw new Error('Estructura de datos de horario incompleta');
        }
      } else {
        // Fallback a horario predeterminado si no se pudo obtener del servidor
        const horarioPredeterminado = {
          'lunes': {'trabaja': true, 'hora_entrada': '08:00:00', 'hora_salida': '17:00:00'},
          'martes': {'trabaja': true, 'hora_entrada': '08:00:00', 'hora_salida': '17:00:00'},
          'miércoles': {'trabaja': true, 'hora_entrada': '08:00:00', 'hora_salida': '17:00:00'},
          'jueves': {'trabaja': true, 'hora_entrada': '08:00:00', 'hora_salida': '17:00:00'},
          'viernes': {'trabaja': true, 'hora_entrada': '08:00:00', 'hora_salida': '15:00:00'},
          'sábado': {'trabaja': false},
          'domingo': {'trabaja': false}
        };
        
        console.log('Usando horario predeterminado');
        setHorario(horarioPredeterminado);
      }
    } catch (error) {
      console.error('Error al cargar horario:', error);
      // Fallback a horario predeterminado si hay error
      const horarioPredeterminado = {
        'lunes': {'trabaja': true, 'hora_entrada': '08:00:00', 'hora_salida': '17:00:00'},
        'martes': {'trabaja': true, 'hora_entrada': '08:00:00', 'hora_salida': '17:00:00'},
        'miércoles': {'trabaja': true, 'hora_entrada': '08:00:00', 'hora_salida': '17:00:00'},
        'jueves': {'trabaja': true, 'hora_entrada': '08:00:00', 'hora_salida': '17:00:00'},
        'viernes': {'trabaja': true, 'hora_entrada': '08:00:00', 'hora_salida': '15:00:00'},
        'sábado': {'trabaja': false},
        'domingo': {'trabaja': false}
      };
      
      console.log('Usando horario predeterminado (error)');
      setHorario(horarioPredeterminado);
      setError('No se pudo cargar el horario del usuario.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarHorario();
  }, [user]);

  // Formatear hora para mostrar
  const formatearHora = (horaStr) => {
    if (!horaStr) return '-';
    return horaStr.substring(0, 5); // Mostrar solo HH:MM
  };

  // Determinar si hoy es día laboral
  const esDiaLaboral = () => {
    if (!horario) return false;
    
    const diasSemana = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    const hoy = diasSemana[new Date().getDay()];
    
    return horario[hoy] && horario[hoy].trabaja;
  };

  // Renderizar información de horario
  const renderHorario = () => {
    if (!horario) return null;
    
    const diasSemana = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
    
    return (
      <div className="mt-4">
        <h4 className={`font-medium mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
          <FaCalendarAlt className="inline-block mr-2" />
          Horario Semanal
        </h4>
        <div className={`grid grid-cols-1 gap-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          {diasSemana.map((dia) => (
            <div 
              key={dia} 
              className={`flex justify-between py-1 px-2 rounded ${horario[dia]?.trabaja 
                ? isDarkMode 
                  ? 'bg-green-900/20' 
                  : 'bg-green-50' 
                : isDarkMode 
                  ? 'bg-gray-700/30' 
                  : 'bg-gray-50'}`}
            >
              <span className="capitalize">{dia}</span>
              <span>
                {horario[dia]?.trabaja 
                  ? `${formatearHora(horario[dia].hora_entrada)} - ${formatearHora(horario[dia].hora_salida)}` 
                  : 'No laborable'}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className={`rounded-lg shadow-md overflow-hidden ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white'} h-full transition-colors duration-300`}>
      {/* Cabecera del widget */}
      <div className={`px-4 py-3 flex justify-between items-center ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} border-b ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
        <div className="flex items-center">
          <FaUserClock className={`mr-2 ${isDarkMode ? 'text-[#a5ff0d]' : 'text-[#91e302]'}`} />
          <h3 className="font-semibold">Datos y Horario</h3>
        </div>
      </div>

      {/* Cuerpo del widget */}
      <div className="p-4">
        {error && (
          <div className={`mb-4 p-3 rounded-md ${isDarkMode ? 'bg-red-900/30 text-red-200' : 'bg-red-100 text-red-700'}`}>
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-6">
            <div className={`animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 ${isDarkMode ? 'border-[#a5ff0d]' : 'border-[#91e302]'}`}></div>
          </div>
        ) : (
          <div>
            {/* Datos del perfil */}
            <div className="flex items-center space-x-4 mb-4">
              {user.avatar ? (
                <div className="relative">
                  <img 
                    src={user.avatar.ruta} 
                    alt={user.nombre}
                    className="w-16 h-16 rounded-full border-2 border-blue-100"
                    style={{ backgroundColor: user.avatar.color_fondo }}
                  />
                  <div className="absolute -bottom-1 -right-1 bg-green-400 w-4 h-4 rounded-full border-2 border-white"></div>
                </div>
              ) : (
                <InitialsAvatar 
                  nombre={user.nombre} 
                  size="lg"
                  className="border-2 border-blue-100"
                />
              )}
              <div className="flex-1">
                <h4 className={`text-lg font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>{user.nombre}</h4>
                <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>{user.correo}</p>
                <p className={`text-xs ${isDarkMode ? 'text-blue-400' : 'text-blue-600'} mt-1`}>
                  {esDiaLaboral() ? 'Día laborable' : 'No laborable hoy'}
                </p>
              </div>
            </div>
            
            {/* Información adicional */}
            <div className={`rounded-lg p-3 mb-4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <h4 className={`font-medium mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                <FaIdCard className="inline-block mr-2" />
                Información Personal
              </h4>
              <div className="space-y-2">
                <div className={`flex items-center ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  <span className="w-24 flex-shrink-0">Departamento:</span>
                  <span className="font-medium">{user.departamento || 'No asignado'}</span>
                </div>
                <div className={`flex items-center ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  <span className="w-24 flex-shrink-0">Cargo:</span>
                  <span className="font-medium">{user.cargo || 'No asignado'}</span>
                </div>
                {user.telefono && (
                  <div className={`flex items-center ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    <span className="w-24 flex-shrink-0">Teléfono:</span>
                    <span className="font-medium">{user.telefono}</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Horario */}
            {renderHorario()}
            
            {/* Estado actual */}
            {esDiaLaboral() && horario && (
              <div className={`mt-4 p-3 rounded-lg ${isDarkMode ? 'bg-blue-900/20 text-blue-100' : 'bg-blue-50 text-blue-800'}`}>
                <div className="flex items-center mb-1">
                  <FaClock className="mr-2" />
                  <span className="font-medium">Horario de hoy</span>
                </div>
                <p>
                  {formatearHora(horario[Object.keys(horario).find(dia => 
                    dia === ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'][new Date().getDay()]
                  )].hora_entrada)} - {formatearHora(horario[Object.keys(horario).find(dia => 
                    dia === ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'][new Date().getDay()]
                  )].hora_salida)}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PerfilHorarioWidget;
