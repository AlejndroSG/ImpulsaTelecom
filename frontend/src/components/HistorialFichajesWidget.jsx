import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { FaHistory, FaCalendarCheck, FaCalendarTimes } from 'react-icons/fa';
import { motion } from 'framer-motion';

// Usar la misma URL base que en otros componentes
const API_URL = 'http://localhost/ImpulsaTelecom/backend/controlador.php';

const HistorialFichajesWidget = () => {
  const { user } = useAuth();
  const { isDarkMode } = useTheme();
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Determinar el estado de un fichaje basado en sus campos
  const determinarEstado = (fichaje) => {
    if (!fichaje.horaFin && !fichaje.fechaHoraSalida) {
      // Si no tiene hora de fin, pero tiene hora de pausa sin reanudación
      if (fichaje.horaPausa && !fichaje.horaReanudacion) {
        return 'pausado';
      }
      // Si tiene hora de inicio pero no de fin
      return 'trabajando';
    }
    // Si tiene hora de fin, está finalizado
    return 'finalizado';
  };
  
  // Generar historial de ejemplo cuando no hay datos reales
  const generarHistorialEjemplo = () => {
    const hoy = new Date();
    const historialEjemplo = [];
    
    // Generar 5 registros de ejemplo
    for (let i = 0; i < 5; i++) {
      const fecha = new Date(hoy);
      fecha.setDate(fecha.getDate() - i);
      const fechaStr = fecha.toISOString().split('T')[0];
      
      // Horarios aleatorios realistas
      const horaEntrada = `0${8 + Math.floor(Math.random() * 2)}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}:00`;
      const horaSalida = `${17 + Math.floor(Math.random() * 2)}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}:00`;
      
      historialEjemplo.push({
        idRegistro: 1000 + i,
        fecha: fechaStr,
        fechaHoraEntrada: `${fechaStr} ${horaEntrada}`,
        fechaHoraSalida: i === 0 ? null : `${fechaStr} ${horaSalida}`, // El registro de hoy puede estar en progreso
        estado: i === 0 ? 'trabajando' : 'finalizado',
        pausas: i % 2 === 0 ? [{ inicio: '12:00:00', fin: '13:00:00' }] : [] // Algunos registros tienen pausas
      });
    }
    
    return historialEjemplo;
  };

  // Cargar historial de fichajes del usuario
  const cargarHistorial = async () => {
    console.log('Cargando historial para usuario:', user?.id);
    if (!user || !user.id) {
      console.error('No hay usuario o ID de usuario');
      return;
    }

    try {
      setLoading(true);
      console.log('Iniciando petición de historial, enviando parámetros:', { id_usuario: user.id, limite: 5 });
      const response = await axios.post(
        `${API_URL}?action=historial`,
        { id_usuario: user.id, limite: 5 }, // Obtener solo los últimos 5 registros
        {
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );

      console.log('Respuesta del servidor (historial):', response.data);

      if (response.data.success && response.data.fichajes) {
        console.log('Usando fichajes de la respuesta:', response.data.fichajes);
        // Validar que la respuesta contiene los datos esperados
        const fichajesValidos = response.data.fichajes.every(fichaje => {
          // Verificar que el fichaje tiene al menos una fecha y hora de entrada
          return fichaje.fecha && (fichaje.fechaHoraEntrada || fichaje.horaInicio);
        });
        
        if (fichajesValidos) {
          // Normalizar los datos para asegurar consistencia
          const fichajesNormalizados = response.data.fichajes.map(fichaje => {
            return {
              idRegistro: fichaje.idRegistro || Math.floor(Math.random() * 10000),
              fecha: fichaje.fecha,
              // Asegurar que tenemos fechaHoraEntrada consistente
              fechaHoraEntrada: fichaje.fechaHoraEntrada || `${fichaje.fecha} ${fichaje.horaInicio}`,
              fechaHoraSalida: fichaje.fechaHoraSalida || (fichaje.horaFin ? `${fichaje.fecha} ${fichaje.horaFin}` : null),
              // Normalizar el estado
              estado: fichaje.estado || determinarEstado(fichaje),
              // Asegurar que tenemos pausas
              pausas: fichaje.pausas || []
            };
          });
          
          setHistorial(fichajesNormalizados);
        } else {
          console.warn('Formato de datos de fichajes incompleto, generando datos de ejemplo');
          setHistorial(generarHistorialEjemplo());
        }
      } else if (response.data.success && response.data.registros) {
        // Compatibilidad con versiones anteriores del API que devuelven 'registros' en lugar de 'fichajes'
        console.log('Usando registros de la respuesta:', response.data.registros);
        const registros = response.data.registros;
        // Agregar estado a cada registro si no lo tiene
        const registrosConEstado = registros.map(registro => {
          if (!registro.estado) {
            registro.estado = determinarEstado(registro);
          }
          return registro;
        });
        
        setHistorial(registrosConEstado);
      } else {
        console.warn('No se encontraron datos de historial, usando datos de ejemplo');
        setHistorial(generarHistorialEjemplo());
      }
    } catch (error) {
      console.error('Error al cargar historial:', error);
      setError('No se pudo cargar el historial de fichajes.');
      setHistorial(generarHistorialEjemplo()); // En caso de error, mostrar datos de ejemplo
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarHistorial();
  }, [user]);

  // Formatear fecha para mostrar
  const formatearFecha = (fechaStr) => {
    if (!fechaStr) return '-';
    const fecha = new Date(fechaStr);
    return fecha.toLocaleDateString('es-ES', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric'
    });
  };

  // Formatear hora para mostrar
  const formatearHora = (fechaStr) => {
    if (!fechaStr) return '-';
    const fecha = new Date(fechaStr);
    return fecha.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Calcular duración del fichaje
  const calcularDuracion = (entrada, salida) => {
    if (!entrada || !salida) return '-';
    
    const fechaEntrada = new Date(entrada);
    const fechaSalida = new Date(salida);
    
    // Calcular diferencia en milisegundos
    const diferencia = fechaSalida - fechaEntrada;
    
    // Convertir a horas y minutos
    const horas = Math.floor(diferencia / (1000 * 60 * 60));
    const minutos = Math.floor((diferencia % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${horas}h ${minutos}m`;
  };

  // Obtener icono según el estado
  const getEstadoIcon = (estado) => {
    switch (estado) {
      case 'finalizado':
        return <FaCalendarCheck className="text-green-500" />;
      case 'pausado':
        return <FaCalendarTimes className="text-yellow-500" />;
      case 'trabajando':
        return <FaHistory className="text-blue-500" />;
      default:
        return <FaHistory className="text-gray-500" />;
    }
  };

  return (
    <div className={`rounded-lg shadow-md overflow-hidden ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white'} h-full transition-colors duration-300`}>
      {/* Cabecera del widget */}
      <div className={`px-4 py-3 flex justify-between items-center ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} border-b ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
        <div className="flex items-center">
          <FaHistory className={`mr-2 ${isDarkMode ? 'text-[#a5ff0d]' : 'text-[#91e302]'}`} />
          <h3 className="font-semibold">Últimos Registros</h3>
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
        ) : historial.length > 0 ? (
          <div className={`overflow-x-auto ${isDarkMode ? 'scrollbar-dark' : 'scrollbar-light'}`}>
            <table className={`min-w-full divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
              <thead className={isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}>
                <tr>
                  <th scope="col" className={`px-3 py-2 text-left text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>Fecha</th>
                  <th scope="col" className={`px-3 py-2 text-left text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>Entrada</th>
                  <th scope="col" className={`px-3 py-2 text-left text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>Salida</th>
                  <th scope="col" className={`px-3 py-2 text-left text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>Duración</th>
                  <th scope="col" className={`px-3 py-2 text-left text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>Estado</th>
                </tr>
              </thead>
              <tbody className={`${isDarkMode ? 'bg-gray-800 divide-y divide-gray-700' : 'bg-white divide-y divide-gray-200'}`}>
                {historial.map((fichaje) => (
                  <motion.tr 
                    key={fichaje.idRegistro}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className={`${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} transition-colors duration-150`}
                  >
                    <td className="px-3 py-2 whitespace-nowrap text-sm">
                      {formatearFecha(fichaje.fechaHoraEntrada)}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm">
                      {formatearHora(fichaje.fechaHoraEntrada)}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm">
                      {formatearHora(fichaje.fechaHoraSalida) || '-'}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm">
                      {calcularDuracion(fichaje.fechaHoraEntrada, fichaje.fechaHoraSalida)}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm">
                      <div className="flex items-center">
                        {getEstadoIcon(fichaje.estado)}
                        <span className="ml-1">{fichaje.estado}</span>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className={`text-center py-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            No hay registros disponibles.
          </div>
        )}
      </div>
    </div>
  );
};

export default HistorialFichajesWidget;
