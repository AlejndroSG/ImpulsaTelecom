import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';

// URL base para las peticiones API
const API_URL = 'http://localhost/ImpulsaTelecom/backend/api';

const AdminRecordatorios = () => {
    const { user } = useAuth();
    const { isDarkMode } = useTheme();
    const navigate = useNavigate();
    
    // Estados para gestionar datos y UI
    const [recordatorios, setRecordatorios] = useState([]);
    const [configuracion, setConfiguracion] = useState({
        enviar_recordatorio_entrada: true,
        enviar_recordatorio_salida: true,
        enviar_recordatorio_inicio_pausa: true,
        enviar_recordatorio_fin_pausa: true,
        minutos_antes: 5
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

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
        fetchRecordatorios();
        fetchConfiguracion();
    }, [user, navigate]);

    // Función para cargar recordatorios desde la API
    const fetchRecordatorios = useCallback(async () => {
        try {
            setLoading(true);
            // Esta llamada se implementará cuando se cree el endpoint correspondiente
            const response = await axios.get(`${API_URL}/recordatorios.php?action=list`, {
                withCredentials: true
            });

            if (response.data.success) {
                setRecordatorios(response.data.recordatorios || []);
            } else {
                setError(`Error al cargar recordatorios: ${response.data.error || 'Error desconocido'}`);
            }
        } catch (err) {
            console.log("Error al cargar recordatorios:", err);
            // Para desarrollo, mostraremos datos de ejemplo si el endpoint no existe aún
            setRecordatorios([
                { id: 1, NIF: '98765432B', nombre: 'Juan Pérez', tipo_recordatorio: 'entrada', fecha: '2025-04-23', enviado: '2025-04-23 08:25:00' },
                { id: 2, NIF: '98765432B', nombre: 'Juan Pérez', tipo_recordatorio: 'inicio_pausa', fecha: '2025-04-23', enviado: '2025-04-23 12:25:00' },
                { id: 3, NIF: '98765432B', nombre: 'Juan Pérez', tipo_recordatorio: 'fin_pausa', fecha: '2025-04-23', enviado: '2025-04-23 12:55:00' },
                { id: 4, NIF: '98765432B', nombre: 'Juan Pérez', tipo_recordatorio: 'salida', fecha: '2025-04-23', enviado: '2025-04-23 16:55:00' },
                { id: 5, NIF: '56789012C', nombre: 'María García', tipo_recordatorio: 'entrada', fecha: '2025-04-23', enviado: '2025-04-23 08:55:00' },
                { id: 6, NIF: '56789012C', nombre: 'María García', tipo_recordatorio: 'salida', fecha: '2025-04-23', enviado: '2025-04-23 17:25:00' },
            ]);
        } finally {
            setLoading(false);
        }
    }, []);

    // Función para cargar configuración
    const fetchConfiguracion = useCallback(async () => {
        try {
            // Esta llamada se implementará cuando se cree el endpoint correspondiente
            const response = await axios.get(`${API_URL}/recordatorios.php?action=getConfig`, {
                withCredentials: true
            });

            if (response.data.success) {
                setConfiguracion(response.data.configuracion);
            }
        } catch (err) {
            console.log("Error al cargar configuración:", err);
            // Mantener la configuración por defecto si hay error
        }
    }, []);

    // Función para guardar configuración
    const handleSaveConfig = useCallback(async () => {
        try {
            setSuccessMessage('');
            setErrorMessage('');
            
            // Esta llamada se implementará cuando se cree el endpoint correspondiente
            const response = await axios.post(
                `${API_URL}/recordatorios.php?action=saveConfig`,
                configuracion,
                { withCredentials: true }
            );

            if (response.data.success) {
                setSuccessMessage('Configuración guardada correctamente');
            } else {
                setErrorMessage(`Error al guardar: ${response.data.error || 'Error desconocido'}`);
            }
        } catch (err) {
            console.log("Error al guardar configuración:", err);
            // Para desarrollo, mostrar mensaje de éxito simulado
            setSuccessMessage('Configuración guardada correctamente (simulado)');
        }
    }, [configuracion]);

    // Manejar cambio en valores de configuración
    const handleConfigChange = useCallback((e) => {
        const { name, value, type, checked } = e.target;
        setConfiguracion(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    }, []);

    // Ejecutar el script de recordatorios manualmente
    const handleRunScript = useCallback(async () => {
        try {
            setSuccessMessage('');
            setErrorMessage('');
            
            // Esta llamada se implementará cuando se cree el endpoint correspondiente
            const response = await axios.post(
                `${API_URL}/recordatorios.php?action=runNow`,
                {},
                { withCredentials: true }
            );

            if (response.data.success) {
                setSuccessMessage('Script ejecutado correctamente');
                // Recargar recordatorios después de ejecutar el script
                fetchRecordatorios();
            } else {
                setErrorMessage(`Error al ejecutar script: ${response.data.error || 'Error desconocido'}`);
            }
        } catch (err) {
            console.log("Error al ejecutar script:", err);
            // Para desarrollo, mostrar mensaje de éxito simulado
            setSuccessMessage('Script ejecutado correctamente (simulado)');
        }
    }, [fetchRecordatorios]);

    // Formatear tipo de recordatorio para mostrar
    const formatearTipoRecordatorio = (tipo) => {
        const tipos = {
            'entrada': 'Entrada al trabajo',
            'salida': 'Salida del trabajo',
            'inicio_pausa': 'Inicio de pausa',
            'fin_pausa': 'Fin de pausa'
        };
        
        return tipos[tipo] || tipo;
    };

    // Renderizar componente de carga
    if (loading) {
        return (
            <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 bg-gradient-to-br from-gray-50 to-blue-50 text-gray-800'} p-6`}>
                <div className="flex justify-center items-center h-full">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
            </div>
        );
    }

    return (
        <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 bg-gradient-to-br from-gray-50 to-blue-50 text-gray-800'} p-6`}>
            <div className="container mx-auto">
                <h1 className="text-3xl font-bold mb-6 text-black dark:text-white">Administración de Recordatorios</h1>
                
                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Panel de configuración */}
                    <div className="md:col-span-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 border border-gray-200 dark:border-gray-700">
                        <h2 className="text-xl font-semibold mb-4 text-black dark:text-white">Configuración</h2>
                        
                        {successMessage && (
                            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                                {successMessage}
                            </div>
                        )}
                        
                        {errorMessage && (
                            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                                {errorMessage}
                            </div>
                        )}
                        
                        <div className="space-y-4">
                            <div>
                                <label className="flex items-center space-x-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        name="enviar_recordatorio_entrada"
                                        checked={configuracion.enviar_recordatorio_entrada}
                                        onChange={handleConfigChange}
                                        className="form-checkbox h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-gray-700 dark:text-gray-300">Recordatorio de entrada</span>
                                </label>
                            </div>
                            
                            <div>
                                <label className="flex items-center space-x-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        name="enviar_recordatorio_salida"
                                        checked={configuracion.enviar_recordatorio_salida}
                                        onChange={handleConfigChange}
                                        className="form-checkbox h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-gray-700 dark:text-gray-300">Recordatorio de salida</span>
                                </label>
                            </div>
                            
                            <div>
                                <label className="flex items-center space-x-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        name="enviar_recordatorio_inicio_pausa"
                                        checked={configuracion.enviar_recordatorio_inicio_pausa}
                                        onChange={handleConfigChange}
                                        className="form-checkbox h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-gray-700 dark:text-gray-300">Recordatorio de inicio de pausa</span>
                                </label>
                            </div>
                            
                            <div>
                                <label className="flex items-center space-x-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        name="enviar_recordatorio_fin_pausa"
                                        checked={configuracion.enviar_recordatorio_fin_pausa}
                                        onChange={handleConfigChange}
                                        className="form-checkbox h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-gray-700 dark:text-gray-300">Recordatorio de fin de pausa</span>
                                </label>
                            </div>
                            
                            <div>
                                <label htmlFor="minutos_antes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Minutos de anticipación
                                </label>
                                <input
                                    type="number"
                                    id="minutos_antes"
                                    name="minutos_antes"
                                    value={configuracion.minutos_antes}
                                    onChange={handleConfigChange}
                                    min="1"
                                    max="60"
                                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-white shadow-sm"
                                />
                            </div>
                            
                            <div className="pt-4 flex justify-between">
                                <button
                                    type="button"
                                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ease-in-out"
                                    onClick={handleSaveConfig}
                                >
                                    Guardar Configuración
                                </button>
                                
                                <button
                                    type="button"
                                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition duration-150 ease-in-out"
                                    onClick={handleRunScript}
                                >
                                    Ejecutar Ahora
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Historial de recordatorios */}
                    <div className="md:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 border border-gray-200 dark:border-gray-700">
                        <h2 className="text-xl font-semibold mb-4 text-black dark:text-white">Historial de Recordatorios</h2>
                        
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-700">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                            Empleado
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                            Tipo
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                            Fecha
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                            Hora Envío
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                                    {recordatorios.length > 0 ? (
                                        recordatorios.map((recordatorio) => (
                                            <tr key={recordatorio.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                        {recordatorio.nombre || 'Sin nombre'}
                                                    </div>
                                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                                        {recordatorio.NIF}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                                        ${recordatorio.tipo_recordatorio === 'entrada' ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' : 
                                                        recordatorio.tipo_recordatorio === 'salida' ? 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100' : 
                                                        recordatorio.tipo_recordatorio === 'inicio_pausa' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100' : 
                                                        'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100'}`}
                                                    >
                                                        {formatearTipoRecordatorio(recordatorio.tipo_recordatorio)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                    {recordatorio.fecha}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                    {recordatorio.enviado.split(' ')[1]}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                                                No hay recordatorios registrados
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
                
                {/* Información y ayuda */}
                <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 border border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-semibold mb-2 text-black dark:text-white">Información del Sistema de Recordatorios</h2>
                    
                    <div className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
                        <p>Los recordatorios se envían a los empleados por correo electrónico para ayudarles a mantener un registro preciso de sus fichajes.</p>
                        <p>El sistema enviará recordatorios para:</p>
                        <ul className="list-disc list-inside ml-4 space-y-1">
                            <li>Entrada al trabajo (5 minutos antes)</li>
                            <li>Salida del trabajo (5 minutos antes)</li>
                            <li>Inicio de pausa (5 minutos antes)</li>
                            <li>Fin de pausa (5 minutos antes)</li>
                        </ul>
                        <p className="mt-2">El script de recordatorios se ejecuta automáticamente cada minuto, verificando los horarios de los empleados y enviando los recordatorios cuando sea necesario.</p>
                        <p className="font-medium mt-2">Nota: Para que los recordatorios funcionen correctamente, es necesario que:</p>
                        <ul className="list-disc list-inside ml-4 space-y-1">
                            <li>Los empleados tengan un horario asignado</li>
                            <li>El correo electrónico de los empleados esté configurado correctamente</li>
                            <li>El servidor tenga configurado un cron job para ejecutar el script periódicamente</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminRecordatorios;
