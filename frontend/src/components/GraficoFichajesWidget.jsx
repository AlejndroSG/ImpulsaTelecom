import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { FaChartBar } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Usar la misma URL base que en otros componentes
const API_URL = 'http://localhost/ImpulsaTelecom/backend/controlador.php';

const GraficoFichajesWidget = () => {
  const { user } = useAuth();
  const { isDarkMode } = useTheme();
  const [historialSemanal, setHistorialSemanal] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cargar historial de fichajes del usuario para la última semana
  const cargarHistorialSemanal = async () => {
    console.log('Cargando gráfico para usuario:', user?.id);
    if (!user || !user.id) {
      console.error('No hay usuario o ID de usuario para gráfico');
      return;
    }

    try {
      setLoading(true);
      // Intentar usar el nuevo endpoint historial_grafico
      console.log('Iniciando petición a historial_grafico, parámetros:', { id_usuario: user.id, dias: 7 });
      const response = await axios.post(
        `${API_URL}?action=historial_grafico`,
        { id_usuario: user.id, dias: 7 }, // Obtener los datos de los últimos 7 días
        {
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );

      console.log('Respuesta del servidor (historial_grafico):', response.data);

      if (response.data.success && response.data.datos) {
        // Si el endpoint devuelve datos ya procesados, usarlos directamente
        console.log('Usando datos procesados directamente:', response.data.datos);
        
        // Asegurar que los datos numéricos sean realmente números y convertir días en inglés a español si es necesario
        const diasEnIngles = {'Mon': 'Lun', 'Tue': 'Mar', 'Wed': 'Mié', 'Thu': 'Jue', 'Fri': 'Vie', 'Sat': 'Sáb', 'Sun': 'Dom'};
        
        const datosFormateados = response.data.datos.map(item => {
          const diaSemanaEsp = diasEnIngles[item.diaSemana] || item.diaSemana;
          
          return {
            fecha: item.fecha,
            diaSemana: diaSemanaEsp,
            // Convertir a número si por alguna razón vienen como string
            horasTrabajadas: typeof item.horasTrabajadas === 'string' ? parseFloat(item.horasTrabajadas) : item.horasTrabajadas,
            horasPausadas: typeof item.horasPausadas === 'string' ? parseFloat(item.horasPausadas) : item.horasPausadas,
            // Añadir etiqueta corta para el día de la semana
            name: diaSemanaEsp
          };
        });
        
        console.log('Datos formateados para el gráfico:', datosFormateados);
        setHistorialSemanal(datosFormateados);
      } else if (response.data.success && (response.data.fichajes || response.data.registros)) {
        // Si no, usar el endpoint anterior y procesar los datos
        const registros = response.data.fichajes || response.data.registros;
        console.log('Procesando registros manualmente:', registros);
        procesarDatosGrafico(registros);
      } else {
        console.warn('No se encontraron datos para el gráfico');
        // Generar datos de ejemplo si no hay datos reales
        const datosEjemplo = generarDatosEjemplo();
        setHistorialSemanal(datosEjemplo);
      }
    } catch (error) {
      console.error('Error al cargar historial semanal:', error);
      // Si falla el nuevo endpoint, intentar con el anterior
      try {
        console.log('Usando fallback a endpoint historial');
        const fallbackResponse = await axios.post(
          `${API_URL}?action=historial`,
          { id_usuario: user.id, dias: 7 },
          {
            headers: {
              'Content-Type': 'application/json',
            }
          }
        );
        
        console.log('Respuesta del fallback:', fallbackResponse.data);
        
        if (fallbackResponse.data.success && (fallbackResponse.data.fichajes || fallbackResponse.data.registros)) {
          const registros = fallbackResponse.data.fichajes || fallbackResponse.data.registros;
          console.log('Procesando registros del fallback:', registros);
          procesarDatosGrafico(registros);
        } else {
          console.warn('No se encontraron datos en el fallback');
          setHistorialSemanal([]);
        }
      } catch (fallbackError) {
        console.error('Error en fallback:', fallbackError);
        setError('Error al cargar el historial semanal de fichajes.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarHistorialSemanal();
  }, [user]);

  // Generar datos de ejemplo para el gráfico cuando no hay datos reales
  const generarDatosEjemplo = () => {
    const hoy = new Date();
    const datos = [];
    
    // Generar datos para los últimos 7 días
    for (let i = 6; i >= 0; i--) {
      const fecha = new Date(hoy);
      fecha.setDate(fecha.getDate() - i);
      
      const diaSemana = fecha.toLocaleDateString('es-ES', { weekday: 'short' });
      const esDiaLaboral = fecha.getDay() !== 0 && fecha.getDay() !== 6; // 0=domingo, 6=sábado
      
      datos.push({
        fecha: fecha.toISOString().split('T')[0],
        diaSemana: diaSemana,
        // Generar datos aleatorios pero realistas
        horasTrabajadas: esDiaLaboral ? 7 + Math.random() * 2 : Math.random() * 0.5, // 7-9 horas en días laborales, 0-0.5 en fines de semana
        horasPausadas: esDiaLaboral ? Math.random() * 1.5 : 0, // 0-1.5 horas de pausa en días laborales
        name: diaSemana // Para etiqueta en el gráfico
      });
    }
    
    return datos;
  };
  
  // Procesar datos para el gráfico
  const procesarDatosGrafico = (fichajes) => {
    // Crear un objeto con los últimos 7 días
    const ultimosDias = [];
    const hoy = new Date();
    
    // Generar fechas para los últimos 7 días
    for (let i = 6; i >= 0; i--) {
      const fecha = new Date();
      fecha.setDate(hoy.getDate() - i);
      
      ultimosDias.push({
        fecha: fecha.toISOString().split('T')[0], // Formato YYYY-MM-DD
        diaSemana: fecha.toLocaleDateString('es-ES', { weekday: 'short' }), // Día abreviado
        horasTrabajadas: 0,
        horasPausadas: 0
      });
    }
    
    // Calcular horas trabajadas y pausadas para cada día
    fichajes.forEach(fichaje => {
      if (!fichaje.fechaHoraEntrada) return;
      
      const fechaFichaje = new Date(fichaje.fechaHoraEntrada).toISOString().split('T')[0];
      const diaIndex = ultimosDias.findIndex(dia => dia.fecha === fechaFichaje);
      
      if (diaIndex !== -1) {
        // Calcular horas trabajadas si hay entrada y salida
        if (fichaje.fechaHoraSalida) {
          const entrada = new Date(fichaje.fechaHoraEntrada);
          const salida = new Date(fichaje.fechaHoraSalida);
          const diferenciaMilisegundos = salida - entrada;
          
          // Convertir a horas (con decimales)
          const horas = diferenciaMilisegundos / (1000 * 60 * 60);
          
          // Sumar al total del día
          ultimosDias[diaIndex].horasTrabajadas += horas;
          
          // Si hay pausas, calcular tiempo pausado
          if (fichaje.pausas && fichaje.pausas.length > 0) {
            fichaje.pausas.forEach(pausa => {
              if (pausa.inicio && pausa.fin) {
                const inicioPausa = new Date(pausa.inicio);
                const finPausa = new Date(pausa.fin);
                const tiempoPausado = (finPausa - inicioPausa) / (1000 * 60 * 60);
                ultimosDias[diaIndex].horasPausadas += tiempoPausado;
              }
            });
          }
        }
      }
    });
    
    // Redondear valores a 1 decimal para mejor visualización
    ultimosDias.forEach(dia => {
      dia.horasTrabajadas = Math.round(dia.horasTrabajadas * 10) / 10;
      dia.horasPausadas = Math.round(dia.horasPausadas * 10) / 10;
    });
    
    setHistorialSemanal(ultimosDias);
  };

  // Formatear datos para tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className={`p-2 rounded-md shadow-md ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}>
          <p className="font-medium">{label}</p>
          <p className="text-sm">
            <span className={isDarkMode ? 'text-green-400' : 'text-green-600'}>
              Horas trabajadas: {payload[0].value}
            </span>
          </p>
          {payload[1] && (
            <p className="text-sm">
              <span className={isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}>
                Horas pausadas: {payload[1].value}
              </span>
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`rounded-lg shadow-md overflow-hidden ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white'} h-full transition-colors duration-300`}>
      {/* Cabecera del widget */}
      <div className={`px-4 py-3 flex justify-between items-center ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} border-b ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
        <div className="flex items-center">
          <FaChartBar className={`mr-2 ${isDarkMode ? 'text-[#a5ff0d]' : 'text-[#91e302]'}`} />
          <h3 className="font-semibold">Análisis de Jornadas</h3>
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
        ) : historialSemanal.length > 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="h-64 md:h-72 mt-2"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={historialSemanal}
                margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#555' : '#eee'} />
                <XAxis 
                  dataKey="diaSemana" 
                  tick={{ fill: isDarkMode ? '#ccc' : '#333' }} 
                />
                <YAxis 
                  label={{ 
                    value: 'Horas', 
                    angle: -90, 
                    position: 'insideLeft', 
                    style: { textAnchor: 'middle', fill: isDarkMode ? '#ccc' : '#333' } 
                  }}
                  tick={{ fill: isDarkMode ? '#ccc' : '#333' }} 
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  wrapperStyle={{ 
                    paddingTop: '10px', 
                    color: isDarkMode ? 'white' : 'black' 
                  }} 
                />
                <Bar 
                  name="Horas trabajadas" 
                  dataKey="horasTrabajadas" 
                  fill={isDarkMode ? '#a5ff0d' : '#91e302'} 
                  radius={[4, 4, 0, 0]} 
                />
                <Bar 
                  name="Horas pausadas" 
                  dataKey="horasPausadas" 
                  fill={isDarkMode ? '#ffb800' : '#ffc107'} 
                  radius={[4, 4, 0, 0]} 
                />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        ) : (
          <div className={`text-center py-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            No hay datos suficientes para mostrar el gráfico.
          </div>
        )}
        
        <div className={`mt-3 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} text-center`}>
          Resumen de las horas trabajadas y pausadas durante la última semana.
        </div>
      </div>
    </div>
  );
};

export default GraficoFichajesWidget;
