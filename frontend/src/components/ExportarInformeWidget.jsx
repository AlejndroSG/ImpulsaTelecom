import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import axios from 'axios';
import { saveAs } from 'file-saver';

const API_URL = 'http://localhost/ImpulsaTelecom/backend/controlador.php';

const ExportarInformeWidget = () => {
  const { user } = useAuth();
  const { isDarkMode } = useTheme();
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [formato, setFormato] = useState('pdf');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);
  const [exito, setExito] = useState(false);

  // Establecer fechas predeterminadas al cargar el componente
  React.useEffect(() => {
    // Fecha fin: hoy
    const hoy = new Date();
    const fechaFinFormateada = hoy.toISOString().split('T')[0];
    setFechaFin(fechaFinFormateada);

    // Fecha inicio: hace 30 días
    const fechaInicio = new Date();
    fechaInicio.setDate(hoy.getDate() - 30);
    const fechaInicioFormateada = fechaInicio.toISOString().split('T')[0];
    setFechaInicio(fechaInicioFormateada);
  }, []);

  const exportarInforme = async () => {
    try {
      setCargando(true);
      setError(null);
      setExito(false);

      const response = await axios.post(
        `${API_URL}?action=exportar_informe`,
        {
          id_usuario: user?.NIF,
          fecha_inicio: fechaInicio,
          fecha_fin: fechaFin,
          formato: formato
        },
        { withCredentials: true }
      );

      if (response.data.success) {
        // Decodificar el contenido Base64
        const contenido = atob(response.data.contenido);
        let tipoMime = '';
        let extension = '';
        
        // Determinar el tipo MIME y extensión según el formato
        switch (formato) {
          case 'pdf':
            tipoMime = 'application/pdf';
            extension = 'pdf';
            break;
          case 'excel':
            tipoMime = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
            extension = 'xlsx';
            break;
          case 'csv':
            tipoMime = 'text/csv';
            extension = 'csv';
            break;
          default:
            tipoMime = 'text/plain';
            extension = 'txt';
        }
        
        // Convertir el contenido a un Blob
        const blob = new Blob([contenido], { type: tipoMime });
        
        // Descargar el archivo
        saveAs(blob, `informe_fichajes_${fechaInicio}_${fechaFin}.${extension}`);
        
        setExito(true);
      } else {
        setError(response.data.error || 'Error al exportar el informe');
      }
    } catch (err) {
      console.error('Error al exportar informe:', err);
      setError('Error de conexión al servidor');
    } finally {
      setCargando(false);
      // Limpiar mensaje de éxito después de 3 segundos
      if (exito) {
        setTimeout(() => setExito(false), 3000);
      }
    }
  };

  return (
    <div className={`p-4 rounded-lg shadow-md ${isDarkMode ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-800'}`}>
      <h2 className="text-xl font-semibold mb-4">Exportar informe de fichajes</h2>
      
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Fecha inicio</label>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className={`w-full p-2 rounded border ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-white border-gray-300 text-gray-700'}`}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Fecha fin</label>
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className={`w-full p-2 rounded border ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-white border-gray-300 text-gray-700'}`}
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Formato</label>
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={() => setFormato('pdf')}
              className={`px-4 py-2 rounded ${formato === 'pdf' ? 'bg-[#78bd00] text-white' : isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'}`}
            >
              PDF
            </button>
            <button
              type="button"
              onClick={() => setFormato('excel')}
              className={`px-4 py-2 rounded ${formato === 'excel' ? 'bg-[#78bd00] text-white' : isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'}`}
            >
              Excel
            </button>
            <button
              type="button"
              onClick={() => setFormato('csv')}
              className={`px-4 py-2 rounded ${formato === 'csv' ? 'bg-[#78bd00] text-white' : isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'}`}
            >
              CSV
            </button>
          </div>
        </div>
        
        {error && (
          <div className="p-3 rounded bg-red-100 text-red-700 border border-red-200">
            {error}
          </div>
        )}
        
        {exito && (
          <div className="p-3 rounded bg-green-100 text-green-700 border border-green-200">
            Informe exportado correctamente
          </div>
        )}
        
        <div className="flex justify-end">
          <button
            onClick={exportarInforme}
            disabled={cargando}
            className={`px-4 py-2 rounded flex items-center ${cargando ? 'opacity-70 cursor-not-allowed' : 'hover:bg-[#6aa700]'} bg-[#78bd00] text-white transition-colors`}
          >
            {cargando ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Exportando...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Exportar
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportarInformeWidget;
