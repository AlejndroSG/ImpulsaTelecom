import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaFilePdf, FaCalendarAlt, FaUserAlt, FaDownload, FaSpinner, FaFileExport, FaSearch, FaTimesCircle, FaClipboardList } from 'react-icons/fa';

// URL base para las peticiones API
const API_URL = 'http://localhost/ImpulsaTelecom/backend/api';

const meses = [
    { id: 1, nombre: 'Enero' },
    { id: 2, nombre: 'Febrero' },
    { id: 3, nombre: 'Marzo' },
    { id: 4, nombre: 'Abril' },
    { id: 5, nombre: 'Mayo' },
    { id: 6, nombre: 'Junio' },
    { id: 7, nombre: 'Julio' },
    { id: 8, nombre: 'Agosto' },
    { id: 9, nombre: 'Septiembre' },
    { id: 10, nombre: 'Octubre' },
    { id: 11, nombre: 'Noviembre' },
    { id: 12, nombre: 'Diciembre' }
];

const AdminReportes = () => {
    const { user } = useAuth();
    const { isDarkMode } = useTheme();
    const navigate = useNavigate();

    // Estados para gestionar datos y UI
    const [usuarios, setUsuarios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [generando, setGenerando] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    // Estados para el formulario
    const [selectedUser, setSelectedUser] = useState('');
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1); // Mes actual
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear()); // Año actual
    const [historialReportes, setHistorialReportes] = useState([]);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [showPreview, setShowPreview] = useState(false);

    // Opciones para el año (último año y actual)
    const yearOptions = [selectedYear - 1, selectedYear, selectedYear + 1];

    // Verificar autenticación y permisos
    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }

        if (user.tipo_usuario !== 'admin') {
            navigate('/');
            return;
        }

        // Cargar datos iniciales
        fetchUsuarios();
        fetchHistorialReportes();
    }, [user, navigate]);

    // Función para cargar usuarios desde la API
    const fetchUsuarios = useCallback(async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_URL}/usuarios.php?action=list`, {
                withCredentials: true
            });

            if (response.data.success) {
                setUsuarios(response.data.usuarios);
            } else {
                setError(`Error al cargar usuarios: ${response.data.error || 'Error desconocido'}`);
            }
        } catch (err) {
            setError(`Error de conexión: ${err.message}`);
            console.error('Error al cargar usuarios:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    // Función para cargar historial de reportes
    const fetchHistorialReportes = useCallback(async () => {
        try {
            // Esta función simula la carga del historial de reportes
            // En una implementación real, debería conectarse a la API
            setHistorialReportes([
                { id: 1, usuario: 'Juan Pérez', mes: 'Abril', anio: 2025, fecha_generacion: '2025-05-15', url: '#' },
                { id: 2, usuario: 'María García', mes: 'Abril', anio: 2025, fecha_generacion: '2025-05-14', url: '#' },
                { id: 3, usuario: 'Carlos Rodríguez', mes: 'Marzo', anio: 2025, fecha_generacion: '2025-04-10', url: '#' },
            ]);
        } catch (err) {
            console.error('Error al cargar historial de reportes:', err);
        }
    }, []);

    // Filtrar usuarios por término de búsqueda
    const filteredUsuarios = usuarios.filter(usuario => {
        const searchTermLower = searchTerm.toLowerCase();
        return (
            (usuario.nombre?.toLowerCase().includes(searchTermLower) || false) ||
            (usuario.apellidos?.toLowerCase().includes(searchTermLower) || false) ||
            (usuario.NIF?.toLowerCase().includes(searchTermLower) || false) ||
            (usuario.correo?.toLowerCase().includes(searchTermLower) || false)
        );
    });

    // Manejar la generación de PDF
    const handleGenerarPDF = async () => {
        if (!selectedUser) {
            setErrorMessage('Por favor, seleccione un usuario');
            return;
        }

        setGenerando(true);
        setSuccessMessage('');
        setErrorMessage('');
        setPreviewUrl(null);

        try {
            // Usar la versión HTML directamente (solucion alternativa a TCPDF)
            const reportUrl = `http://localhost/ImpulsaTelecom/informe.php?nif=${selectedUser}&mes=${selectedMonth}&anio=${selectedYear}`;
            
            // Abrir el informe en una nueva pestaña
            window.open(reportUrl, '_blank');
            
            setGenerando(false);
            setSuccessMessage(`Informe generado correctamente para ${selectedMonth}/${selectedYear}`);
            
            // Actualizar el historial
            const usuarioSeleccionado = usuarios.find(u => u.NIF === selectedUser || u.id === selectedUser);
            const nombreMes = meses.find(m => m.id === selectedMonth)?.nombre;
            
            if (usuarioSeleccionado && nombreMes) {
                const nuevoReporte = {
                    id: Date.now(),
                    usuario: `${usuarioSeleccionado.nombre} ${usuarioSeleccionado.apellidos || ''}`,
                    mes: nombreMes,
                    anio: selectedYear,
                    fecha_generacion: new Date().toISOString().split('T')[0],
                    url: reportUrl
                };
                
                setHistorialReportes(prev => [nuevoReporte, ...prev]);
            }
            
            // Intentar actualizar el historial de reportes desde el servidor (si está disponible)
            try {
                fetchHistorialReportes();
            } catch (error) {
                console.log('No se pudo actualizar el historial desde el servidor', error);
            }
        } catch (err) {
            setErrorMessage(`Error al generar informe: ${err.message}`);
            setGenerando(false);
            console.error('Error al generar informe:', err);
        }
    };

    // Descargar un informe específico
    const handleDescargarInforme = (id, url) => {
        // Abrir el informe HTML en una nueva pestaña
        if (url && url.startsWith('http')) {
            window.open(url, '_blank');
            return;
        }
        
        // Si tenemos un ID pero no una URL, intentar construir la URL basada en el historial
        const reporte = historialReportes.find(r => r.id === id);
        if (reporte) {
            const nif = reporte.nif || selectedUser; // Usar NIF del reporte si está disponible
            const mes = meses.findIndex(m => m.nombre === reporte.mes) + 1;
            const anio = reporte.anio;
            
            const reportUrl = `http://localhost/ImpulsaTelecom/informe.php?nif=${nif}&mes=${mes}&anio=${anio}`;
            window.open(reportUrl, '_blank');
        } else {
            // Si no hay información suficiente, mostrar un mensaje de error
            setErrorMessage('No se puede descargar el informe. Información insuficiente.');
            setTimeout(() => setErrorMessage(''), 3000);
        }
    };
    
    // Cerrar la vista previa
    const handleClosePreview = () => {
        setShowPreview(false);
    };

    // Animaciones
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                when: "beforeChildren",
                staggerChildren: 0.1
            }
        }
    };
    
    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: { type: "spring", stiffness: 100 }
        }
    };

    return (
        <motion.div 
            className={`min-h-screen py-8 px-6 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50'}`}
            initial="hidden"
            animate="visible"
            variants={containerVariants}
        >
            <div className="container mx-auto">
                {/* Header */}
                <motion.div variants={itemVariants} className="mb-8">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                        <div className="flex items-center">
                            <div className={`rounded-lg p-3 mr-4 ${isDarkMode ? 'bg-blue-900' : 'bg-blue-100'}`}>
                                <FaFilePdf className={`text-2xl ${isDarkMode ? 'text-blue-300' : 'text-blue-600'}`} />
                            </div>
                            <div>
                                <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Informes de Horas</h1>
                                <p className={`mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Genera informes PDF de horas trabajadas por empleado</p>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Mensajes de error generales */}
                {error && (
                    <motion.div 
                        variants={itemVariants}
                        className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded mb-6 shadow"
                    >
                        <div className="flex items-center">
                            <FaTimesCircle className="text-red-500 mr-3" />
                            <p>{error}</p>
                        </div>
                    </motion.div>
                )}

                {/* Contenido principal */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                    {/* Formulario de generación de informes */}
                    <motion.div 
                        variants={itemVariants} 
                        className={`md:col-span-5 rounded-xl shadow-lg overflow-hidden ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}
                    >
                        <div className={`py-4 px-6 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                            <div className="flex items-center">
                                <FaFileExport className={`mr-2 ${isDarkMode ? 'text-blue-400' : 'text-blue-500'}`} />
                                <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                                    Generar Informe PDF
                                </h2>
                            </div>
                        </div>

                        <div className="p-6">
                            {successMessage && (
                                <div className="mb-4 p-3 rounded-lg bg-green-100 border border-green-200 text-green-800 flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    {successMessage}
                                </div>
                            )}
                            
                            {errorMessage && (
                                <div className="mb-4 p-3 rounded-lg bg-red-100 border border-red-200 text-red-800 flex items-center">
                                    <FaTimesCircle className="text-red-500 mr-2" />
                                    {errorMessage}
                                </div>
                            )}

                            <div className="space-y-6">
                                {/* Selector de Empleado */}
                                <div>
                                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        <div className="flex items-center">
                                            <FaUserAlt className="mr-2" />
                                            Seleccionar Empleado
                                        </div>
                                    </label>
                                    <div className="relative">
                                        <div className="relative">
                                            <input
                                                type="text"
                                                className={`pl-10 pr-3 py-2 w-full border rounded-lg shadow-sm ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                                                placeholder="Buscar empleado..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                            />
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <FaSearch className={`h-4 w-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                                            </div>
                                        </div>
                                        <select
                                            className={`mt-2 block w-full rounded-lg shadow-sm border px-3 py-2 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                                            value={selectedUser}
                                            onChange={(e) => setSelectedUser(e.target.value)}
                                        >
                                            <option value="">Seleccione un empleado</option>
                                            {filteredUsuarios.map((usuario) => (
                                                <option key={usuario.NIF || usuario.id} value={usuario.NIF || usuario.id}>
                                                    {usuario.nombre} {usuario.apellidos || ''} - {usuario.NIF || usuario.id}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Selector de Período */}
                                <div>
                                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        <div className="flex items-center">
                                            <FaCalendarAlt className="mr-2" />
                                            Seleccionar Período
                                        </div>
                                    </label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <select
                                                className={`block w-full rounded-lg shadow-sm border px-3 py-2 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                                                value={selectedMonth}
                                                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                                            >
                                                {meses.map((mes) => (
                                                    <option key={mes.id} value={mes.id}>
                                                        {mes.nombre}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <select
                                                className={`block w-full rounded-lg shadow-sm border px-3 py-2 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                                                value={selectedYear}
                                                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                            >
                                                {yearOptions.map((year) => (
                                                    <option key={year} value={year}>
                                                        {year}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Botón de Generación */}
                                <button
                                    className={`w-full flex items-center justify-center px-4 py-3 rounded-lg font-medium text-white ${!selectedUser ? 'bg-gray-500 cursor-not-allowed' : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'} shadow-sm transition-all duration-200`}
                                    onClick={handleGenerarPDF}
                                    disabled={!selectedUser || generando}
                                >
                                    {generando ? (
                                        <>
                                            <FaSpinner className="animate-spin mr-2" />
                                            Generando...
                                        </>
                                    ) : (
                                        <>
                                            <FaFilePdf className="mr-2" />
                                            Generar Informe PDF
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </motion.div>

                    {/* Historial de informes generados */}
                    <motion.div 
                        variants={itemVariants} 
                        className={`md:col-span-7 rounded-xl shadow-lg overflow-hidden ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}
                    >
                        <div className={`py-4 px-6 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <FaClipboardList className={`mr-2 ${isDarkMode ? 'text-blue-400' : 'text-blue-500'}`} />
                                    <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                                        Historial de Informes
                                    </h2>
                                </div>
                                <span className={`inline-flex items-center justify-center px-3 py-1 text-xs font-medium rounded-full ${isDarkMode ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800'}`}>
                                    {historialReportes.length} informes
                                </span>
                            </div>
                        </div>

                        <div className="p-6 overflow-x-auto">
                            {historialReportes.length > 0 ? (
                                <table className={`min-w-full divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                                    <thead>
                                        <tr>
                                            <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Empleado</th>
                                            <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Período</th>
                                            <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Fecha Generación</th>
                                            <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className={`divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                                        {historialReportes.map((reporte) => (
                                            <tr key={reporte.id} className={isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>
                                                <td className={`px-6 py-4 whitespace-nowrap ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                                                    {reporte.usuario}
                                                </td>
                                                <td className={`px-6 py-4 whitespace-nowrap ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                                                    {reporte.mes} {reporte.anio}
                                                </td>
                                                <td className={`px-6 py-4 whitespace-nowrap ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                                                    {reporte.fecha_generacion}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    <button 
                                                        onClick={() => handleDescargarInforme(reporte.id)}
                                                        className={`inline-flex items-center px-3 py-1 rounded-lg text-sm ${isDarkMode ? 'bg-blue-900 text-blue-100 hover:bg-blue-800' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'} transition-colors`}
                                                    >
                                                        <FaDownload className="mr-1" /> Descargar
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="text-center py-10">
                                    <FaFilePdf className={`mx-auto h-10 w-10 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                                    <p className={`mt-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                        No hay informes generados recientemente
                                    </p>
                                    <p className={`mt-2 text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                        Utilice el formulario para generar un nuevo informe
                                    </p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            </div>
            
            {/* Modal de vista previa del PDF */}
            {showPreview && previewUrl && (
                <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        {/* Overlay de fondo */}
                        <div 
                            className="fixed inset-0 bg-gray-900 bg-opacity-75 transition-opacity"
                            aria-hidden="true"
                            onClick={handleClosePreview}
                        ></div>

                        {/* Modal */}
                        <div className="inline-block align-bottom rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
                            <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-t-lg flex justify-between items-center`}>
                                <h3 className={`text-xl font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                    Vista previa del informe PDF
                                </h3>
                                <div className="flex space-x-2">
                                    <button 
                                        onClick={() => handleDescargarInforme('latest', previewUrl)}
                                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                    >
                                        <FaDownload className="mr-2" />
                                        Descargar PDF
                                    </button>
                                    <button 
                                        onClick={handleClosePreview}
                                        className={`inline-flex items-center p-2 border border-transparent rounded-md text-sm font-medium ${isDarkMode ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500`}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                            <div className="h-[70vh] overflow-hidden bg-gray-100">
                                <iframe 
                                    src={previewUrl} 
                                    className="w-full h-full"
                                    title="Vista previa del PDF"
                                ></iframe>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </motion.div>
    );
};

export default AdminReportes;
