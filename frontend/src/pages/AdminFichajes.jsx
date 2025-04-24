import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { FaCalendarAlt, FaFilter, FaUserClock, FaBuilding, FaSearch, FaClipboardList, FaChartPie } from 'react-icons/fa';

// URL base para las peticiones API
const API_URL = 'http://localhost/ImpulsaTelecom/backend/api';

const AdminFichajes = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { isDarkMode } = useTheme();
    
    // Estados para gestionar datos y UI
    const [fichajes, setFichajes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('listado');
    const [showFilters, setShowFilters] = useState(false);
    const [departamentos, setDepartamentos] = useState([]);
    
    // Estados para filtros
    const [filtros, setFiltros] = useState({
        fecha_inicio: '',
        fecha_fin: '',
        nif: '',
        departamento: '',
        estado: ''
    });
    
    // Verificar autenticación y permisos de administrador
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
        cargarFichajes();
        cargarDepartamentos();
    }, [user, navigate]);
    
    // Cargar todos los fichajes
    const cargarFichajes = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            
            // Preparar parámetros de consulta con filtros activos
            const params = {};
            
            // Agregar filtros que tengan valor
            Object.entries(filtros).forEach(([key, value]) => {
                if (value) {
                    params[key] = value;
                }
            });
            
            const response = await axios.get(`${API_URL}/admin_fichajes.php`, {
                params: {
                    action: 'getAll',
                    ...params
                },
                withCredentials: true,
                // Timeout para evitar esperas muy largas
                timeout: 10000
            });
            
            // Mostrar la respuesta completa para depuración
            console.log('Respuesta completa del servidor:', response);
            console.log('Datos recibidos:', response.data);
            
            if (response.data && response.data.success) {
                console.log('Fichajes recibidos:', response.data.fichajes);
                setFichajes(response.data.fichajes || []);
            } else {
                console.log('Error en respuesta:', response.data ? response.data.error : 'No hay datos');
                setError(response.data ? (response.data.error || 'Error al cargar fichajes') : 'No se recibieron datos');
                setFichajes([]);
            }
        } catch (err) {
            console.error('Error al cargar fichajes:', err);
            if (err.code === 'ECONNABORTED') {
                setError('Tiempo de espera agotado. Verifica la conexión con el servidor.');
            } else if (err.code === 'ERR_NETWORK') {
                setError('Error de conexión CORS. Contacta al administrador del sistema.');
            } else {
                setError(`Error de conexión: ${err.message || 'Error desconocido'}`);
            }
            setFichajes([]);
        } finally {
            setLoading(false);
        }
    }, [filtros]);
    
    // Cargar departamentos para filtro
    const cargarDepartamentos = useCallback(async () => {
        try {
            const response = await axios.get(`${API_URL}/admin_fichajes.php`, {
                params: { action: 'getDepartamentos' },
                withCredentials: true,
                timeout: 10000 // Timeout para evitar esperas muy largas
            });
            
            if (response.data.success) {
                setDepartamentos(response.data.departamentos || []);
            }
        } catch (err) {
            console.error('Error al cargar departamentos:', err);
            // No mostrar error en interfaz de usuario para departamentos, solo log
            // ya que este error no es crítico para la funcionalidad principal
            setDepartamentos([]);
        }
    }, []);
    
    // Manejar cambios en los filtros
    const handleFiltroChange = (e) => {
        const { name, value } = e.target;
        setFiltros(prev => ({
            ...prev,
            [name]: value
        }));
    };
    
    // Aplicar filtros
    const aplicarFiltros = () => {
        cargarFichajes();
    };
    
    // Limpiar filtros
    const limpiarFiltros = () => {
        setFiltros({
            fecha_inicio: '',
            fecha_fin: '',
            nif: '',
            departamento: '',
            estado: ''
        });
        // Recargar fichajes sin filtros
        setTimeout(() => cargarFichajes(), 100);
    };
    
    // Formatear fecha y hora
    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateStr).toLocaleDateString('es-ES', options);
    };
    
    const formatTime = (timeStr) => {
        if (!timeStr) return '--:--';
        return timeStr.substring(0, 5); // Formato HH:MM
    };
    
    // Calcular duración del fichaje en formato legible
    const formatDuration = (seconds) => {
        // Debug del valor recibido
        console.log('formatDuration recibiu00f3:', seconds);
        
        // Asegurar que es un nu00famero válido
        if (!seconds || isNaN(seconds) || seconds <= 0) return '0h 0m';
        
        // Convertir a nu00famero si es string
        const totalSeconds = Number(seconds);
        
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        
        return `${hours}h ${minutes}m`;
    };
    
    // Obtener color según el estado del fichaje
    const getStatusColor = (estado) => {
        switch (estado) {
            case 'trabajando':
                return 'bg-green-100 text-green-800 border-green-300';
            case 'pausado':
                return 'bg-yellow-100 text-yellow-800 border-yellow-300';
            case 'finalizado':
                return 'bg-blue-100 text-blue-800 border-blue-300';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-300';
        }
    };
    
    // Renderizar componente
    return (
        <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gradient-to-br from-blue-50 to-white'} p-6`}>
            <div className="container mx-auto">
                {/* Cabecera */}
                <header className="mb-8">
                    <div className="flex flex-wrap items-center justify-between">
                        <div>
                            <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-blue-800'} mb-2`}>
                                Panel de Control de Fichajes
                            </h1>
                            <p className={`text-lg ${isDarkMode ? 'text-blue-300' : 'text-blue-600'}`}>
                                Supervisión de horarios y presencia de empleados
                            </p>
                        </div>
                    </div>
                </header>
                
                {/* Mensajes de error */}
                {error && (
                    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg shadow-md mb-6">
                        <div className="flex items-center">
                            <svg className="h-6 w-6 text-red-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>{error}</span>
                        </div>
                    </div>
                )}
                
                {/* Tabs principales */}
                <div className="mb-6">
                    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                        <div className="flex">
                            <button
                                className={`flex-1 py-4 px-6 text-center font-medium transition-all duration-200 flex items-center justify-center ${
                                    activeTab === 'listado' 
                                    ? `${isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-600 text-white'}` 
                                    : `${isDarkMode ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`
                                }`}
                                onClick={() => setActiveTab('listado')}
                            >
                                <FaClipboardList className="inline mr-2" />
                                Listado de Fichajes
                            </button>
                            
                            <button
                                className={`flex-1 py-4 px-6 text-center font-medium transition-all duration-200 flex items-center justify-center ${
                                    activeTab === 'estadisticas' 
                                    ? `${isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-600 text-white'}` 
                                    : `${isDarkMode ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`
                                }`}
                                onClick={() => setActiveTab('estadisticas')}
                            >
                                <FaChartPie className="inline mr-2" />
                                Estadísticas
                            </button>
                        </div>
                    </div>
                </div>
                
                {/* Filtros */}
                <div className="mb-6">
                    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                            <h2 className={`font-semibold flex items-center ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                                <FaFilter className="mr-2" />
                                Filtros
                            </h2>
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className={`text-sm px-3 py-1 rounded ${isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                            >
                                {showFilters ? 'Ocultar filtros' : 'Mostrar filtros'}
                            </button>
                        </div>
                        
                        {showFilters && (
                            <div className="p-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {/* Filtro por fecha */}
                                    <div>
                                        <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                            <FaCalendarAlt className="inline mr-1" /> Fecha inicio
                                        </label>
                                        <input
                                            type="date"
                                            name="fecha_inicio"
                                            value={filtros.fecha_inicio}
                                            onChange={handleFiltroChange}
                                            className={`mt-1 block w-full rounded-md shadow-sm border focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                                                isDarkMode 
                                                ? 'bg-gray-700 border-gray-600 text-white' 
                                                : 'bg-white border-gray-300 text-gray-900'
                                            }`}
                                        />
                                    </div>
                                    
                                    <div>
                                        <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                            <FaCalendarAlt className="inline mr-1" /> Fecha fin
                                        </label>
                                        <input
                                            type="date"
                                            name="fecha_fin"
                                            value={filtros.fecha_fin}
                                            onChange={handleFiltroChange}
                                            className={`mt-1 block w-full rounded-md shadow-sm border focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                                                isDarkMode 
                                                ? 'bg-gray-700 border-gray-600 text-white' 
                                                : 'bg-white border-gray-300 text-gray-900'
                                            }`}
                                        />
                                    </div>
                                    
                                    {/* Filtro por NIF */}
                                    <div>
                                        <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                            <FaUserClock className="inline mr-1" /> NIF empleado
                                        </label>
                                        <input
                                            type="text"
                                            name="nif"
                                            value={filtros.nif}
                                            onChange={handleFiltroChange}
                                            placeholder="Buscar por NIF..."
                                            className={`mt-1 block w-full rounded-md shadow-sm border focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                                                isDarkMode 
                                                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                                                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                                            }`}
                                        />
                                    </div>
                                    
                                    {/* Filtro por departamento */}
                                    <div>
                                        <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                            <FaBuilding className="inline mr-1" /> Departamento
                                        </label>
                                        <select
                                            name="departamento"
                                            value={filtros.departamento}
                                            onChange={handleFiltroChange}
                                            className={`mt-1 block w-full rounded-md shadow-sm border focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                                                isDarkMode 
                                                ? 'bg-gray-700 border-gray-600 text-white' 
                                                : 'bg-white border-gray-300 text-gray-900'
                                            }`}
                                        >
                                            <option value="">Todos los departamentos</option>
                                            {departamentos.map((depto, index) => (
                                                <option key={index} value={depto}>{depto}</option>
                                            ))}
                                        </select>
                                    </div>
                                    
                                    {/* Filtro por estado */}
                                    <div>
                                        <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                            Estado
                                        </label>
                                        <select
                                            name="estado"
                                            value={filtros.estado}
                                            onChange={handleFiltroChange}
                                            className={`mt-1 block w-full rounded-md shadow-sm border focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                                                isDarkMode 
                                                ? 'bg-gray-700 border-gray-600 text-white' 
                                                : 'bg-white border-gray-300 text-gray-900'
                                            }`}
                                        >
                                            <option value="">Todos los estados</option>
                                            <option value="trabajando">Trabajando</option>
                                            <option value="pausado">En pausa</option>
                                            <option value="finalizado">Finalizado</option>
                                        </select>
                                    </div>
                                </div>
                                
                                <div className="mt-4 flex justify-end space-x-3">
                                    <button
                                        onClick={limpiarFiltros}
                                        className={`px-4 py-2 rounded-lg transition-colors ${
                                            isDarkMode 
                                            ? 'bg-gray-700 text-white hover:bg-gray-600' 
                                            : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                                        }`}
                                    >
                                        Limpiar filtros
                                    </button>
                                    
                                    <button
                                        onClick={aplicarFiltros}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                                    >
                                        <FaSearch className="inline mr-1" />
                                        Aplicar filtros
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                
                {activeTab === 'listado' && (
                    <>
                        {/* Tarjetas resumen */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                            <div className={`rounded-xl shadow-md p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Empleados activos</h3>
                                        <p className="text-3xl font-bold text-blue-600 mt-2">
                                            {fichajes.filter(f => f.estado === 'trabajando').length}
                                        </p>
                                    </div>
                                    <div className="p-3 rounded-full bg-blue-100 text-blue-800">
                                        <FaUserClock size={24} />
                                    </div>
                                </div>
                            </div>
                            
                            <div className={`rounded-xl shadow-md p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>En pausa</h3>
                                        <p className="text-3xl font-bold text-yellow-500 mt-2">
                                            {fichajes.filter(f => f.estado === 'pausado').length}
                                        </p>
                                    </div>
                                    <div className="p-3 rounded-full bg-yellow-100 text-yellow-800">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                            
                            <div className={`rounded-xl shadow-md p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Total fichajes</h3>
                                        <p className="text-3xl font-bold text-green-600 mt-2">{fichajes.length}</p>
                                    </div>
                                    <div className="p-3 rounded-full bg-green-100 text-green-800">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        {/* Tabla de fichajes */}
                        <div className={`rounded-xl shadow-md overflow-hidden border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                            <div className={`p-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                                <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                                    Listado de fichajes
                                </h2>
                            </div>
                            
                            <div className="overflow-x-auto">
                                {loading ? (
                                    <div className="p-10 text-center">
                                        <div className="animate-spin inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mb-4"></div>
                                        <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>Cargando fichajes...</p>
                                    </div>
                                ) : fichajes.length === 0 ? (
                                    <div className="p-10 text-center">
                                        <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>No se encontraron fichajes con los filtros aplicados.</p>
                                    </div>
                                ) : (
                                    <>
                                        {/* Panel de depuraciu00f3n - solo visible durante desarrollo */}
                                        <div className="p-4 bg-yellow-50 border-yellow-200 border text-sm">
                                            <h3 className="font-bold mb-2">Información de depuración:</h3>
                                            <p>Total fichajes cargados: {fichajes.length}</p>
                                            <p>Primer fichaje (si existe):</p>
                                            {fichajes.length > 0 && (
                                                <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto max-h-40">
                                                    {JSON.stringify(fichajes[0], null, 2)}
                                                </pre>
                                            )}
                                        </div>
                                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                            <thead className={isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}>
                                                <tr>
                                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                        Empleado
                                                    </th>
                                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                        Departamento
                                                    </th>
                                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                        Fecha
                                                    </th>
                                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                        Entrada
                                                    </th>
                                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                        Salida
                                                    </th>
                                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                        Tiempo trabajado
                                                    </th>
                                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                        Estado
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className={`divide-y divide-gray-200 dark:divide-gray-700 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                                                {fichajes.map((fichaje) => (
                                                    <tr key={fichaje.idRegistro} className={isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                                                {fichaje.nombreCompleto || 'Sin nombre'}
                                                            </div>
                                                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                                                {fichaje.NIF}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                                                {fichaje.departamento || 'No asignado'}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className={`text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                                                {formatDate(fichaje.fecha)}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="text-sm font-medium text-green-600">
                                                                {formatTime(fichaje.horaInicio)}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="text-sm font-medium text-red-600">
                                                                {formatTime(fichaje.horaFin)}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                                                {formatDuration(fichaje.tiempoTrabajado)}
                                                            </div>
                                                            {fichaje.tiempoPausa > 0 && (
                                                                <div className="text-xs text-gray-400">
                                                                    Pausa: {formatDuration(fichaje.tiempoPausa)}
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getStatusColor(fichaje.estado)}`}>
                                                                {fichaje.estado === 'trabajando' ? 'Trabajando' : 
                                                                fichaje.estado === 'pausado' ? 'En pausa' : 
                                                                fichaje.estado === 'finalizado' ? 'Finalizado' : 'Pendiente'}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </>
                                )}
                            </div>
                        </div>
                    </>
                )}
                
                {activeTab === 'estadisticas' && (
                    <div className={`rounded-xl shadow-md p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                        <h2 className={`text-xl font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                            Estadísticas de fichajes
                        </h2>
                        <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            Esta sección mostrará gráficos y estadísticas basadas en los fichajes de los empleados.
                        </p>
                        <div className="text-center mt-6">
                            <p className="text-blue-600">Función en desarrollo</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminFichajes;
