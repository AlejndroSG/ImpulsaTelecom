import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { FaUserClock, FaCalendarWeek, FaCalendarDay, FaClock, FaExclamationTriangle } from 'react-icons/fa';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, 
         startOfWeek, endOfWeek, isSameDay, addMonths, subMonths, 
         isToday, addDays } from 'date-fns';
import { es } from 'date-fns/locale';

const API_URL = 'http://localhost/ImpulsaTelecom/backend/api';

const TurnosCalendarioSidebar = () => {
  const { user } = useAuth();
  const { isDarkMode } = useTheme();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [turnoSeleccionado, setTurnoSeleccionado] = useState(null);
  const [mostrarDetalle, setMostrarDetalle] = useState(false);
  const [diasConTurnos, setDiasConTurnos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [turnos, setTurnos] = useState([]);
  
  // Cargar los turnos desde la API
  useEffect(() => {
    const cargarTurnos = async () => {
      console.log('Estado del usuario en TurnosCalendarioSidebar:', user);
      console.log('Tipo de usuario:', typeof user);
      
      // Verificar si hay un usuario y si tiene NIF (recordar que NIF es la clave primaria en la base de datos)
      if (!user) {
        console.log('Usuario no definido, cancelando carga de turnos para calendario');
        setLoading(false);
        return;
      }
      
      // Verificar explícitamente las propiedades del usuario
      console.log('Propiedades del usuario:', Object.keys(user));
      
      // Comprobamos si existe NIF en el objeto usuario (puede estar como NIF, nif o id)
      if (!user.NIF && !user.nif && !user.id) {
        console.log('No hay identificador de usuario (ni como NIF, nif, o id), cancelando carga');
        setLoading(false);
        return;
      }
      
      // Usar NIF, nif o id según esté disponible (prioridad: NIF > nif > id)
      const nifUsuario = user.NIF || user.nif || user.id;
      console.log('Usando identificador para consultar turnos:', nifUsuario);
      console.log('NIF para consultar turnos:', nifUsuario);
      
      try {
        setLoading(true);
        setError(null);
        
        console.log('Intentando cargar turnos para calendario, usuario:', user.NIF);
        
        // Comprobar el estado de autenticación antes de hacer la solicitud
        try {
          // Obtener todos los turnos (usando el NIF o nif según esté disponible)
          const respuesta = await axios.get(`${API_URL}/turnos.php?usuario=${nifUsuario}`, {
            withCredentials: true
          });
          
          console.log(`Solicitud enviada a: ${API_URL}/turnos.php?usuario=${nifUsuario}`);
          
          console.log('Respuesta API turnos calendario:', respuesta.data);
          
          if (respuesta.data.success) {
            setTurnos(respuesta.data.turnos || []);
            if (respuesta.data.turnos && respuesta.data.turnos.length === 0) {
              console.log('No se encontraron turnos para el usuario en el calendario');
            }
          } else {
            console.warn('La API respondió con success: false para el calendario', respuesta.data);
            setError('No se pudieron cargar los turnos');
            setTurnos([]);
          }
        } catch (err) {
          console.error('Error al cargar turnos para calendario:', err);
          if (err.response) {
            console.error('Detalles del error:', err.response.status, err.response.data);
          }
          setError('Error al cargar los turnos del calendario');
          setTurnos([]);
        }
      } catch (generalErr) {
        console.error('Error general en carga de turnos calendario:', generalErr);
        setError('Error al cargar los turnos del calendario');
        setTurnos([]);
      } finally {
        console.log('Finalizando carga de turnos calendario, actualizando estado loading');
        setLoading(false);
      }
    };
    
    cargarTurnos();
  }, [user]); // Usando el objeto user completo como dependencia en lugar de solo user?.NIF
  
  // Función para generar días del mes con turnos asignados
  const generarDiasConTurno = (mes) => {
    if (!turnos || turnos.length === 0) {
      return [];
    }
    
    const primerDiaMes = startOfMonth(mes);
    const ultimoDiaMes = endOfMonth(mes);
    const diasDelMes = eachDayOfInterval({ start: primerDiaMes, end: ultimoDiaMes });
    
    return diasDelMes.map(dia => {
      const diaSemana = getDay(dia);
      const diaFormateado = diaSemana === 0 ? 7 : diaSemana; // Convertir domingo (0) a 7
      const semanaDelMes = Math.ceil(dia.getDate() / 7);
      
      // Procesamos las cadenas de días y semanas
      const procesarCadena = (cadena) => {
        if (!cadena) return [];
        return cadena.split(',').map(n => parseInt(n, 10));
      };
      
      // Buscar un turno que corresponda a este día
      const turnoAsignado = turnos.find(turno => {
        if (!turno.dias_semana || !turno.semanas_mes) return false;
        
        const diasTurno = procesarCadena(turno.dias_semana);
        const semanasTurno = procesarCadena(turno.semanas_mes);
        
        return diasTurno.includes(diaFormateado) && semanasTurno.includes(semanaDelMes);
      });
      
      return {
        fecha: dia,
        turno: turnoAsignado || null
      };
    });
  };
  
  // Actualizar días con turnos cuando cambia el mes
  useEffect(() => {
    setDiasConTurnos(generarDiasConTurno(currentMonth));
  }, [currentMonth]);
  
  // Cambiar al mes anterior
  const mesAnterior = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };
  
  // Cambiar al mes siguiente
  const mesSiguiente = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };
  
  // Manejar clic en una celda de día
  const handleDayClick = (dia) => {
    if (dia.turno) {
      setTurnoSeleccionado({
        ...dia.turno,
        fecha: dia.fecha
      });
      setMostrarDetalle(true);
    }
  };
  
  // Renderizar el encabezado del calendario
  const renderCalendarHeader = () => {
    const diasSemana = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
    
    return (
      <div className="grid grid-cols-7 gap-1 mb-1 text-center">
        {diasSemana.map((dia, index) => (
          <div 
            key={index} 
            className={`text-xs font-medium py-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
          >
            {dia}
          </div>
        ))}
      </div>
    );
  };
  
  // Renderizar el calendario
  const renderCalendar = () => {
    const primerDiaMes = startOfMonth(currentMonth);
    const ultimoDiaMes = endOfMonth(currentMonth);
    const inicioCalendario = startOfWeek(primerDiaMes, { weekStartsOn: 1 }); // Lunes
    const finCalendario = endOfWeek(ultimoDiaMes, { weekStartsOn: 1 }); // Domingo
    
    const diasCalendario = eachDayOfInterval({ start: inicioCalendario, end: finCalendario });
    
    // Dividir los días en semanas
    const semanas = [];
    let semanaActual = [];
    
    diasCalendario.forEach(dia => {
      semanaActual.push(dia);
      
      if (semanaActual.length === 7) {
        semanas.push(semanaActual);
        semanaActual = [];
      }
    });
    
    return (
      <div className="space-y-1">
        {semanas.map((semana, indexSemana) => (
          <div key={indexSemana} className="grid grid-cols-7 gap-1">
            {semana.map((dia, indexDia) => {
              // Buscar si este día tiene un turno asociado
              const diaInfo = diasConTurnos.find(d => isSameDay(d.fecha, dia));
              const tieneTurno = diaInfo && diaInfo.turno;
              
              const esHoy = isToday(dia);
              const esMismoMes = dia.getMonth() === currentMonth.getMonth();
              
              return (
                <div
                  key={indexDia}
                  onClick={() => handleDayClick(diaInfo || { fecha: dia, turno: null })}
                  className={`
                    ${tieneTurno ? (isDarkMode ? 'bg-blue-800 text-white' : 'bg-blue-100 text-blue-800') : 
                                 (isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-50 hover:bg-gray-100')}
                    ${esHoy ? (isDarkMode ? 'ring-2 ring-blue-400' : 'ring-2 ring-blue-500') : ''}
                    ${!esMismoMes ? (isDarkMode ? 'opacity-30' : 'opacity-40') : ''}
                    cursor-pointer text-center text-xs font-medium aspect-square flex flex-col justify-center items-center rounded-md transition-colors
                  `}
                >
                  <span>{format(dia, 'd')}</span>
                  {tieneTurno && (
                    <div className={`w-1.5 h-1.5 rounded-full mt-0.5 
                      ${isDarkMode ? 'bg-blue-200' : 'bg-blue-600'}`}>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  };
  
  // Renderizar turno detalle al seleccionar un día
  const renderTurnoDetalle = () => {
    if (!turnoSeleccionado) return null;
    
    return (
      <div className={`mt-4 p-4 rounded-lg border-l-4 border-blue-500 
        ${isDarkMode ? 'bg-gray-700 text-white' : 'bg-blue-50 text-gray-800'}`}>
        <div className="flex justify-between items-start">
          <div>
            <h4 className="font-bold text-lg">{turnoSeleccionado.nombre}</h4>
            <p className="text-xs mt-1">{format(turnoSeleccionado.fecha, "EEEE, d 'de' MMMM", { locale: es })}</p>
          </div>
          <button 
            onClick={() => setMostrarDetalle(false)}
            className={`text-xs p-1 rounded-full 
              ${isDarkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'}`}>
            &times;
          </button>
        </div>
        
        <div className="mt-3 space-y-2">
          <div className="flex items-center text-sm">
            <FaClock className="mr-2 text-green-500" size={14} />
            <span>Entrada: {turnoSeleccionado.hora_inicio}</span>
          </div>
          <div className="flex items-center text-sm">
            <FaClock className="mr-2 text-red-500" size={14} />
            <span>Salida: {turnoSeleccionado.hora_fin}</span>
          </div>
          <div className={`mt-2 text-xs inline-block py-1 px-2 rounded 
            ${isDarkMode ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800'}`}>
            {turnoSeleccionado.nombre_horario}
          </div>
        </div>
      </div>
    );
  };



  return (
    <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'} shadow-md`}>
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          <FaCalendarWeek className="mr-2 text-blue-500" />
          <h3 className="font-medium">Calendario de Turnos</h3>
        </div>
        
        <div className="flex items-center space-x-2">
          <button 
            onClick={mesAnterior}
            className={`p-1 rounded hover:bg-opacity-80 
              ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
          >
            &lt;
          </button>
          <span className="text-sm font-medium">
            {format(currentMonth, 'MMMM yyyy', { locale: es })}
          </span>
          <button 
            onClick={mesSiguiente}
            className={`p-1 rounded hover:bg-opacity-80 
              ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
          >
            &gt;
          </button>
        </div>
      </div>
      
      {renderCalendarHeader()}
      {renderCalendar()}
      
      {mostrarDetalle && renderTurnoDetalle()}
      
      {loading ? (
        <div className="flex justify-center items-center py-6 mt-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className={`mt-4 p-3 text-sm rounded-md flex items-center 
          ${isDarkMode ? 'bg-red-900 bg-opacity-20 text-red-200' : 'bg-red-50 text-red-600'}`}>
          <FaExclamationTriangle className="mr-2" />
          {error}
        </div>
      ) : !mostrarDetalle && (!turnos || turnos.length === 0) && (
        <div className={`mt-4 p-3 text-center text-sm rounded-md 
          ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
          No tienes turnos asignados
        </div>
      )}
    </div>
  );
};

export default TurnosCalendarioSidebar;
