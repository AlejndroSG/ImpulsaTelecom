import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { FaCalendarDay, FaCalendarAlt, FaClock, FaUserClock, FaSun, FaMoon } from 'react-icons/fa';
import { motion } from 'framer-motion';

const API_URL = 'http://localhost/ImpulsaTelecom/backend/api';

const TurnosWidget = ({ height }) => {
  const { user } = useAuth();
  const { isDarkMode } = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [turnoActual, setTurnoActual] = useState(null);
  const [proximosTurnos, setProximosTurnos] = useState([]);
  
  useEffect(() => {
    const cargarTurnos = async () => {
      console.log('TurnosWidget - Estado del usuario:', user);
      console.log('TurnosWidget - Tipo de usuario:', typeof user);
      
      // Verificar si hay un usuario y obtener su NIF (recordar que NIF es la clave primaria en la BD)
      if (!user) {
        console.log('TurnosWidget - Usuario no definido, cancelando carga');
        setLoading(false);
        return;
      }
      
      // Verificar las propiedades del usuario
      console.log('TurnosWidget - Propiedades del usuario:', Object.keys(user));
      
      // Comprobar si existe NIF en el objeto usuario (puede estar como NIF, nif o id)
      if (!user.NIF && !user.nif && !user.id) {
        console.log('TurnosWidget - No hay identificador de usuario (ni como NIF, nif, o id), cancelando carga');
        setLoading(false);
        return;
      }
      
      // Usar NIF, nif o id según esté disponible (prioridad: NIF > nif > id)
      const nifUsuario = user.NIF || user.nif || user.id;
      console.log('TurnosWidget - Usando identificador para consultar turnos:', nifUsuario);
      console.log('TurnosWidget - NIF para consultar turnos:', nifUsuario);
      
      try {
        setLoading(true);
        setError(null);
        
        console.log('TurnosWidget - Cargando turnos para usuario:', nifUsuario);
        
        // Obtener todos los turnos (usando nifUsuario)
        const respuestaTurnoActual = await axios.get(`${API_URL}/turnos.php?turno_actual=1&usuario=${nifUsuario}`, {
          withCredentials: true
        });
        
        console.log(`Solicitud de turno actual enviada a: ${API_URL}/turnos.php?turno_actual=1&usuario=${nifUsuario}`);
        
        const respuestaTurnos = await axios.get(`${API_URL}/turnos.php?usuario=${nifUsuario}`, {
          withCredentials: true
        });
        
        console.log(`Solicitud enviada a: ${API_URL}/turnos.php?usuario=${nifUsuario}`);
        
        console.log('TurnosWidget - Respuesta API:', respuestaTurnos.data);
        
        if (respuestaTurnos.data.success) {
          const turnos = respuestaTurnos.data.turnos || [];
          
          console.log('TurnosWidget - Turnos obtenidos:', turnos.length);
          
          if (turnos.length > 0) {
            // Para el turno actual, buscar el turno que aplica al día actual
            const hoy = new Date();
            const diaSemana = hoy.getDay() === 0 ? 7 : hoy.getDay(); // 1=Lunes, 7=Domingo
            const semanaDelMes = Math.ceil(hoy.getDate() / 7);
            
            console.log(`TurnosWidget - Buscando turno para hoy: día ${diaSemana}, semana ${semanaDelMes}`);
            
            // Procesar las cadenas de días y semanas de manera más robusta
            const procesarCadena = (cadena) => {
              if (!cadena) return [];
              // Eliminar espacios y asegurar que solo procesamos números
              return cadena.split(',')
                .map(n => n.trim())
                .filter(n => n !== '')
                .map(n => parseInt(n, 10));
            };
            
            // Buscar un turno para hoy
            const turnoHoy = turnos.find(turno => {
              if (!turno.dias_semana || !turno.semanas_mes) return false;
              
              const diasTurno = procesarCadena(turno.dias_semana);
              const semanasTurno = procesarCadena(turno.semanas_mes);
              
              console.log(`TurnosWidget - Evaluando turno: ${turno.nombre || 'Sin nombre'}`);
              console.log(`TurnosWidget - Días del turno: ${diasTurno.join(', ')}, Semanas: ${semanasTurno.join(', ')}`);
              
              return diasTurno.includes(diaSemana) && semanasTurno.includes(semanaDelMes);
            });
            
            if (turnoHoy) {
              console.log('TurnosWidget - Turno actual encontrado:', turnoHoy);
              setTurnoActual(turnoHoy);
            } else {
              console.log('TurnosWidget - No se encontró turno para hoy');
              setTurnoActual(null);
            }
            
            // Para los próximos turnos, simplemente tomamos todos los turnos disponibles
            setProximosTurnos(turnos);
          } else {
            console.log('TurnosWidget - No hay turnos asignados');
            setProximosTurnos([]);
            setTurnoActual(null);
          }
        } else {
          console.warn('TurnosWidget - La API respondió con success: false', respuestaTurnos.data);
          setProximosTurnos([]);
          setTurnoActual(null);
        }
      } catch (err) {
        console.error('TurnosWidget - Error al cargar turnos:', err);
        setError('Error al cargar los turnos');
        setProximosTurnos([]);
        setTurnoActual(null);
      } finally {
        setLoading(false);
      }
    };
    
    cargarTurnos();
  }, [user]); // Usando el objeto user completo como dependencia en lugar de solo user?.NIF

  // Renderizar indicador de estado del turno
  const renderEstadoTurno = () => {
    return (
      <div className={`text-xs font-semibold px-2 py-1 rounded-full inline-flex items-center gap-1 
        ${isDarkMode ? 'bg-green-800 text-green-200' : 'bg-green-100 text-green-800'}`}>
        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
        En turno ahora
      </div>
    );
  };
  
  // Obtener el nombre del día de la semana
  const obtenerNombreDia = (fecha) => {
    return format(fecha, 'EEEE', { locale: es });
  };

  // Renderizar la fecha formateada (hoy, mañana o fecha específica)
  const renderizarFecha = (fechaStr) => {
    const fecha = parseISO(fechaStr);
    if (isToday(fecha)) {
      return 'Hoy';
    } else if (isTomorrow(fecha)) {
      return 'Mañana';
    } else {
      return format(fecha, "d 'de' MMMM", { locale: es });
    }
  };
  
  return (
    <div style={{ height: height || '400px' }} className={`rounded-lg overflow-hidden shadow-md transition-all 
      ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'}`}>
      
      {/* Encabezado del widget */}
      <div className={`p-4 flex justify-between items-center border-b 
        ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}>
        <div className="flex items-center">
          <FaUserClock className="mr-2 text-blue-500" size={20} />
          <h3 className="font-semibold">Mis Turnos</h3>
        </div>
      </div>
      
      {/* Contenido principal */}
      <div className="p-4">
        {loading ? (
          <div className="flex justify-center items-center py-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className={`p-3 rounded-md text-sm ${isDarkMode ? 'bg-red-900 bg-opacity-20 text-red-200' : 'bg-red-50 text-red-600'}`}>
            {error}
          </div>
        ) : (
          <>
            {/* Turno actual */}
            {turnoActual ? (
              <div className={`mb-6 p-4 rounded-lg border-l-4 border-blue-500 
                ${isDarkMode ? 'bg-gray-700' : 'bg-blue-50'}`}>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-lg">{turnoActual.nombre}</h4>
                  {renderEstadoTurno()}
                </div>
                
                <div className="grid grid-cols-2 gap-2 mt-3">
                  <div className="flex items-center">
                    <FaSun className={`mr-2 ${isDarkMode ? 'text-yellow-400' : 'text-yellow-500'}`} />
                    <div>
                      <div className="text-xs uppercase opacity-70">Entrada</div>
                      <div className="font-semibold">{turnoActual.hora_inicio}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <FaMoon className={`mr-2 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
                    <div>
                      <div className="text-xs uppercase opacity-70">Salida</div>
                      <div className="font-semibold">{turnoActual.hora_fin}</div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className={`mb-6 p-4 rounded-lg text-center 
                ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <p className="text-sm">No tienes ningún turno asignado actualmente</p>
              </div>
            )}

            {/* Próximos turnos */}
            <div className="mt-4">
              <h4 className={`text-sm uppercase font-semibold mb-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Próximos turnos
              </h4>
              
              <div className="space-y-3">
                {proximosTurnos.length > 0 ? (
                  proximosTurnos.map((turno, index) => (
                    <div key={index} className={`p-3 rounded-md flex items-center justify-between 
                      ${isDarkMode ? 'bg-gray-700 hover:bg-gray-650' : 'bg-gray-50 hover:bg-gray-100'} 
                      transition-colors`}>
                      <div className="flex items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3
                          ${isDarkMode ? 'bg-gray-600' : 'bg-white border border-gray-200'}`}>
                          <FaCalendarAlt className="text-blue-500" />
                        </div>
                        <div>
                          <div className="font-semibold">{turno.nombre}</div>
                          <div className="text-xs opacity-80">
                            {turno.fecha && renderizarFecha(turno.fecha)} - {turno.fecha && obtenerNombreDia(parseISO(turno.fecha))}
                          </div>
                        </div>
                      </div>
                      <div className={`text-sm font-medium ${isDarkMode ? 'text-blue-300' : 'text-blue-600'}`}>
                        {turno.hora_inicio} - {turno.hora_fin}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className={`p-3 rounded-md text-center text-sm 
                    ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    No tienes próximos turnos programados
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default TurnosWidget;
