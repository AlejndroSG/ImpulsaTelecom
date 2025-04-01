import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import axios from 'axios';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

// Registrar componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const API_URL = 'http://localhost/ImpulsaTelecom/backend/controlador.php';

const EstadisticasWidget = ({ userId }) => {
  const { user } = useAuth();
  const { isDarkMode } = useTheme();
  const [periodo, setPeriodo] = useState('semana');
  const [estadisticas, setEstadisticas] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [tipoGrafica, setTipoGrafica] = useState('linea');

  useEffect(() => {
    cargarEstadisticas();
  }, [periodo, userId]);

  const cargarEstadisticas = async () => {
    try {
      setCargando(true);
      setError(null);

      const response = await axios.post(
        `${API_URL}?action=estadisticas`,
        { id_usuario: userId, periodo },
        { withCredentials: true }
      );

      if (response.data.success) {
        setEstadisticas(response.data.estadisticas);
      } else {
        setError(response.data.error || 'Error al cargar estadísticas');
      }
    } catch (err) {
      console.error('Error al cargar estadísticas:', err);
      setError('Error de conexión al servidor');
    } finally {
      setCargando(false);
    }
  };

  const formatearFecha = (fecha) => {
    const opciones = { weekday: 'short', day: 'numeric', month: 'short' };
    return new Date(fecha).toLocaleDateString('es-ES', opciones);
  };

  const prepararDatosGrafica = () => {
    if (!estadisticas || !estadisticas.datosPorDia) return null;

    const datos = estadisticas.datosPorDia;
    const labels = datos.map(item => formatearFecha(item.fecha));
    const valores = datos.map(item => item.horasTrabajadas);

    const colores = {
      primario: isDarkMode ? 'rgba(120, 189, 0, 0.7)' : 'rgba(120, 189, 0, 0.7)',
      secundario: isDarkMode ? 'rgba(120, 189, 0, 0.2)' : 'rgba(120, 189, 0, 0.2)',
      borde: isDarkMode ? 'rgba(120, 189, 0, 1)' : 'rgba(120, 189, 0, 1)',
    };

    return {
      labels,
      datasets: [
        {
          label: 'Horas trabajadas',
          data: valores,
          backgroundColor: tipoGrafica === 'linea' ? colores.secundario : colores.primario,
          borderColor: colores.borde,
          borderWidth: 2,
          pointBackgroundColor: colores.borde,
          pointRadius: 4,
          tension: 0.3,
          fill: tipoGrafica === 'linea',
        },
      ],
    };
  };

  const opcionesGrafica = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: isDarkMode ? '#e5e7eb' : '#374151',
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
        titleColor: isDarkMode ? '#e5e7eb' : '#374151',
        bodyColor: isDarkMode ? '#e5e7eb' : '#374151',
        borderColor: isDarkMode ? '#4b5563' : '#e5e7eb',
        borderWidth: 1,
        padding: 10,
        displayColors: false,
        callbacks: {
          label: function(context) {
            return `${context.parsed.y} horas`;
          }
        }
      },
    },
    scales: {
      x: {
        grid: {
          color: isDarkMode ? 'rgba(75, 85, 99, 0.3)' : 'rgba(229, 231, 235, 0.8)',
        },
        ticks: {
          color: isDarkMode ? '#e5e7eb' : '#374151',
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: isDarkMode ? 'rgba(75, 85, 99, 0.3)' : 'rgba(229, 231, 235, 0.8)',
        },
        ticks: {
          color: isDarkMode ? '#e5e7eb' : '#374151',
          callback: function(value) {
            return value + ' h';
          }
        },
      },
    },
  };

  const renderGrafica = () => {
    const datos = prepararDatosGrafica();
    if (!datos) return null;

    return (
      <div className="h-64 mt-4">
        {tipoGrafica === 'linea' ? (
          <Line data={datos} options={opcionesGrafica} />
        ) : (
          <Bar data={datos} options={opcionesGrafica} />
        )}
      </div>
    );
  };

  const renderEstadisticasDetalladas = () => {
    if (!estadisticas) return null;
    
    return (
      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-3">
          Detalles del período
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
            <div className="text-sm text-gray-500">Tiempo total trabajado</div>
            <div className="text-2xl font-bold mt-1">
              {estadisticas.totalHoras} h
            </div>
          </div>
          <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
            <div className="text-sm text-gray-500">Promedio diario</div>
            <div className="text-2xl font-bold mt-1">
              {estadisticas.promedioHorasDiarias} h
            </div>
          </div>
          <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
            <div className="text-sm text-gray-500">Días trabajados</div>
            <div className="text-2xl font-bold mt-1">
              {estadisticas.totalDias}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`p-4 rounded-lg shadow-md ${isDarkMode ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-800'}`}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Estadísticas de trabajo</h2>
        <div className="flex space-x-2">
          <select
            value={periodo}
            onChange={(e) => setPeriodo(e.target.value)}
            className={`px-3 py-1 rounded text-sm ${isDarkMode ? 'bg-gray-700 text-gray-200 border-gray-600' : 'bg-gray-100 text-gray-700 border-gray-300'} border`}
          >
            <option value="semana">Última semana</option>
            <option value="mes">Último mes</option>
            <option value="trimestre">Último trimestre</option>
            <option value="anio">Último año</option>
          </select>
          <div className="flex rounded overflow-hidden">
            <button
              onClick={() => setTipoGrafica('linea')}
              className={`px-2 py-1 text-xs ${tipoGrafica === 'linea' ? 'bg-[#78bd00] text-white' : isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'}`}
            >
              Línea
            </button>
            <button
              onClick={() => setTipoGrafica('barra')}
              className={`px-2 py-1 text-xs ${tipoGrafica === 'barra' ? 'bg-[#78bd00] text-white' : isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'}`}
            >
              Barras
            </button>
          </div>
        </div>
      </div>

      {cargando ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#78bd00]"></div>
        </div>
      ) : error ? (
        <div className="text-center py-8 text-red-500">
          <p>{error}</p>
          <button 
            onClick={cargarEstadisticas}
            className="mt-2 px-4 py-2 bg-[#78bd00] text-white rounded hover:bg-[#6aa700] transition-colors"
          >
            Reintentar
          </button>
        </div>
      ) : (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <p className="text-sm opacity-70">Horas totales</p>
              <p className="text-2xl font-bold">{estadisticas.totalHoras} h</p>
            </div>
            <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <p className="text-sm opacity-70">Promedio diario</p>
              <p className="text-2xl font-bold">{estadisticas.promedioHorasDiarias} h</p>
            </div>
            <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <p className="text-sm opacity-70">Días trabajados</p>
              <p className="text-2xl font-bold">{estadisticas.totalDias}</p>
            </div>
          </div>
          
          {renderGrafica()}
          {renderEstadisticasDetalladas()}
        </div>
      )}
    </div>
  );
};

export default EstadisticasWidget;
