import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { FaUserClock, FaCalendarAlt, FaCalendarWeek, FaCircle, FaClock } from 'react-icons/fa';
import TurnosWidget from '../components/TurnosWidget';
import { motion } from 'framer-motion';
import { format, addWeeks, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, isToday } from 'date-fns';
import { es } from 'date-fns/locale';

const API_URL = 'http://localhost/ImpulsaTelecom/backend/api';

const Turnos = () => {
  const { user } = useAuth();
  const { isDarkMode } = useTheme();
  const [semanaActual, setSemanaActual] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [turnos, setTurnos] = useState([]);
  const [turnosPorDia, setTurnosPorDia] = useState({});
  
  // Calcular los días de la semana actual
  const inicio = startOfWeek(semanaActual, { weekStartsOn: 1 }); // Lunes
  const fin = endOfWeek(semanaActual, { weekStartsOn: 1 }); // Domingo
  const diasSemana = eachDayOfInterval({ start: inicio, end: fin });
  
  // Cargar los turnos desde la API
  useEffect(() => {
    const cargarTurnos = async () => {
      if (!user?.NIF) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        
        // Obtener todos los turnos del usuario desde la API
        const respuesta = await axios.get(`${API_URL}/turnos.php?usuario=${user.NIF}`, {
          withCredentials: true
        });
        
        console.log('Respuesta API turnos:', respuesta.data);
        
        if (respuesta.data.success) {
          const turnosData = respuesta.data.turnos || [];
          setTurnos(turnosData);
          procesarTurnosSemana(turnosData);
        } else {
          console.warn('La API respondió con success: false', respuesta.data);
          setError('No se pudieron cargar los turnos');
          setTurnos([]);
          setTurnosPorDia({});
        }
      } catch (err) {
        console.error('Error al cargar turnos:', err);
        setError('Error al cargar los turnos');
        setTurnos([]);
        setTurnosPorDia({});
      } finally {
        setLoading(false);
      }
    };
    
    cargarTurnos();
  }, [user?.NIF, semanaActual]);
  
  // Procesar turnos para la semana seleccionada
  const procesarTurnosSemana = (turnosData) => {
    if (!turnosData || turnosData.length === 0) {
      console.log('No hay turnos para procesar');
      setTurnosPorDia({});
      return;
    }
    
    console.log('Procesando turnos:', turnosData);
    
    const turnosAsignados = {};
    
    diasSemana.forEach(dia => {
      const diaSemana = dia.getDay() === 0 ? 7 : dia.getDay(); // 1=Lunes, 7=Domingo
      const semanaDelMes = Math.ceil(dia.getDate() / 7);
      const fechaFormateada = format(dia, 'yyyy-MM-dd');
      
      console.log(`Procesando día: ${fechaFormateada}, día semana: ${diaSemana}, semana: ${semanaDelMes}`);
      
      // Procesamos las cadenas de días y semanas de manera más robusta
      const procesarCadena = (cadena) => {
        if (!cadena) return [];
        // Eliminar espacios y asegurar que solo procesamos números
        return cadena.split(',')
          .map(n => n.trim())
          .filter(n => n !== '')
          .map(n => parseInt(n, 10));
      };
      
      // Buscar un turno que corresponda a este día
      let turnoEncontrado = null;
      
      for (const turno of turnosData) {
        console.log(`Evaluando turno: ${turno.nombre || 'Sin nombre'}`);
        
        // Si no tiene días o semanas asignadas, continuamos
        if (!turno.dias_semana || !turno.semanas_mes) {
          console.log('Turno sin días o semanas asignadas, omitiendo');
          continue;
        }
        
        const diasTurno = procesarCadena(turno.dias_semana);
        const semanasTurno = procesarCadena(turno.semanas_mes);
        
        console.log(`Días del turno: ${diasTurno.join(', ')}, Semanas: ${semanasTurno.join(', ')}`);
        
        // Verificar si este turno aplica para el día actual
        if (diasTurno.includes(diaSemana) && semanasTurno.includes(semanaDelMes)) {
          console.log('¡Turno encontrado para este día!');
          turnoEncontrado = turno;
          break;
        }
      }
      
      turnosAsignados[fechaFormateada] = turnoEncontrado;
    });
    
    console.log('Turnos asignados por día:', turnosAsignados);
    setTurnosPorDia(turnosAsignados);
  };

  // Cambiar a la semana anterior
  const semanaAnterior = () => {
    setSemanaActual(prev => addWeeks(prev, -1));
  };

  // Cambiar a la semana siguiente
  const semanaSiguiente = () => {
    setSemanaActual(prev => addWeeks(prev, 1));
  };

  // Volver a la semana actual
  const volverASemanaActual = () => {
    setSemanaActual(new Date());
  };

  // Renderizar la vista de calendario semanal
  const renderizarCalendarioSemanal = () => {
    return (
      <div className={`mt-6 rounded-lg shadow-md overflow-hidden 
        ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className={`p-4 flex justify-between items-center border-b 
          ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <h3 className="font-semibold flex items-center">
            <FaCalendarWeek className="mr-2 text-blue-500" />
            Vista Semanal
          </h3>
          <div className="flex items-center space-x-2">
            <button 
              onClick={semanaAnterior}
              className={`p-2 rounded-md transition-colors 
                ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
            >
              &lt;
            </button>
            <button
              onClick={volverASemanaActual}
              className={`px-3 py-1 text-xs rounded-md 
                ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}
            >
              Hoy
            </button>
            <button 
              onClick={semanaSiguiente}
              className={`p-2 rounded-md transition-colors 
                ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
            >
              &gt;
            </button>
          </div>
        </div>

        <div className="p-4 overflow-x-auto">
          <div className="min-w-full">
            <div className="grid grid-cols-7 gap-2">
              {diasSemana.map((dia, index) => {
                const fechaStr = format(dia, 'yyyy-MM-dd');
                const turno = turnosPorDia[fechaStr];
                const esHoy = isToday(dia);
                
                return (
                  <div 
                    key={index} 
                    className={`rounded-lg overflow-hidden transition-transform hover:transform hover:scale-105 
                      ${esHoy 
                        ? isDarkMode ? 'ring-2 ring-blue-500' : 'ring-2 ring-blue-400' 
                        : ''}`}
                  >
                    <div className={`p-2 text-center border-b 
                      ${isDarkMode 
                        ? esHoy ? 'bg-blue-800 text-white' : 'bg-gray-700 text-gray-200' 
                        : esHoy ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                      <div className="text-xs uppercase font-medium">
                        {format(dia, 'EEEE', { locale: es })}
                      </div>
                      <div className="font-bold text-lg">
                        {format(dia, 'd')}
                      </div>
                    </div>
                    
                    <div className={`p-3 h-36 
                      ${isDarkMode 
                        ? turno ? 'bg-gray-700' : 'bg-gray-750' 
                        : turno ? 'bg-white' : 'bg-gray-50'}`}>
                      {turno ? (
                        <div className="h-full flex flex-col">
                          <div className="font-medium mb-2 text-sm truncate">{turno.nombre}</div>
                          
                          <div className="grid grid-cols-1 gap-2 mt-1">
                            {/* Entrada con mejor formato */}
                            <div className={`flex items-center py-1.5 px-2 rounded-md
                              ${isDarkMode ? 'bg-gray-600' : 'bg-blue-50'}`}>
                              <FaClock className="text-green-500 mr-2" size={14} />
                              <div>
                                <div className="text-xs font-medium opacity-80">Entrada</div>
                                <div className="text-sm font-bold">{turno.hora_inicio}</div>
                              </div>
                            </div>
                            
                            {/* Salida con mejor formato */}
                            <div className={`flex items-center py-1.5 px-2 rounded-md
                              ${isDarkMode ? 'bg-gray-600' : 'bg-red-50'}`}>
                              <FaClock className="text-red-500 mr-2" size={14} />
                              <div>
                                <div className="text-xs font-medium opacity-80">Salida</div>
                                <div className="text-sm font-bold">{turno.hora_fin}</div>
                              </div>
                            </div>
                          </div>
                          
                          <div className={`mt-auto text-xs py-1 px-2 rounded-md self-start 
                            ${isDarkMode ? 'bg-blue-900 text-blue-200' : 'bg-blue-50 text-blue-800'}`}>
                            {turno.nombre_horario}
                          </div>
                        </div>
                      ) : (
                        <div className={`h-full flex items-center justify-center text-xs font-medium
                          ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                          No hay turno
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Renderizar la leyenda de los tipos de turnos
  const renderizarLeyenda = () => {
    // Agrupar turnos por nombre para la leyenda
    const turnosUnicos = turnos.reduce((acc, turno) => {
      if (!acc.find(t => t.nombre === turno.nombre)) {
        acc.push(turno);
      }
      return acc;
    }, []);
    
    if (turnosUnicos.length === 0) return null;

    return (
      <div className={`mt-6 rounded-lg shadow-md overflow-hidden p-4
        ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <h3 className="font-semibold mb-3">Mis Horarios</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {turnosUnicos.map((turno, index) => (
            <div 
              key={index}
              className={`p-3 rounded-lg flex items-center 
                ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}
            >
              <div 
                className="w-3 h-3 rounded-full mr-2"
                style={{ backgroundColor: getColorByIndex(index) }}
              ></div>
              <div>
                <div className="font-medium">{turno.nombre}</div>
                <div className="text-xs">
                  {turno.hora_inicio} - {turno.hora_fin}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Obtener color basado en índice
  const getColorByIndex = (index) => {
    const colors = [
      '#3498db', '#2ecc71', '#e74c3c', '#f39c12', 
      '#9b59b6', '#1abc9c', '#d35400', '#34495e'
    ];
    return colors[index % colors.length];
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className={`min-h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-800'} p-4`}
    >
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold mb-6 flex items-center">
          <FaUserClock className="mr-2" />
          Mis Turnos
        </h1>
        
        {error && (
          <div className={`p-4 mb-4 rounded-lg border-l-4 border-red-500
            ${isDarkMode ? 'bg-red-900 bg-opacity-20 text-red-300' : 'bg-red-50 text-red-800'}`}>
            {error}
          </div>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {loading ? (
              <div className={`rounded-lg shadow-md p-6 flex justify-center items-center
                ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <>
                {renderizarCalendarioSemanal()}
                {renderizarLeyenda()}
              </>
            )}
          </div>
          
          <div>
            <TurnosWidget height="auto" />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Turnos;
