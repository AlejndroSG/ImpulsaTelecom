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
    const [notificaciones, setNotificaciones] = useState([]);
    const [configuracion, setConfiguracion] = useState({
        enviar_recordatorio_entrada: true,
        enviar_recordatorio_salida: true,
        enviar_recordatorio_inicio_pausa: true,
        enviar_recordatorio_fin_pausa: true,
        minutos_antes: 5
    });
    const [tipoFiltro, setTipoFiltro] = useState('todos'); // 'todos', 'fichajes', 'tareas', 'solicitudes'
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
        fetchNotificaciones();
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

    // Función para cargar notificaciones desde la API
    const fetchNotificaciones = useCallback(async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_URL}/notificaciones.php?action=listAll`, {
                withCredentials: true
            });

            if (response.data.success) {
                setNotificaciones(response.data.notificaciones || []);
            } else {
                setError(`Error al cargar notificaciones: ${response.data.error || 'Error desconocido'}`);
            }
        } catch (err) {
            console.log("Error al cargar notificaciones:", err);
            // Para desarrollo, mostraremos datos de ejemplo si el endpoint no existe aún
            setNotificaciones([
                { idNotificacion: 1, NIF: '98765432B', nombre: 'Juan Pérez', tipo: 'tarea_cancelacion', mensaje: 'Solicitud de cancelación de tarea: Implementación de frontend', leida: false, fecha: '2025-04-23 09:15:00', id_referencia: 5 },
                { idNotificacion: 2, NIF: '56789012C', nombre: 'María García', tipo: 'tarea_asignacion', mensaje: 'Solicitud de asignación de tarea: Revisión de código', leida: true, fecha: '2025-04-22 14:30:00', id_referencia: 8 },
                { idNotificacion: 3, NIF: '12345678Z', nombre: 'Carlos López', tipo: 'solicitud', mensaje: 'Nueva solicitud de vacaciones', leida: false, fecha: '2025-04-24 10:05:00', id_referencia: 12 },
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
    // Marcar una notificaciu00f3n como leu00edda
    const handleMarcarLeida = useCallback(async (idNotificacion) => {
        try {
            setSuccessMessage('');
            setErrorMessage('');
            
            const response = await axios.post(
                `${API_URL}/notificaciones.php?action=markAsRead`,
                { id_notificacion: idNotificacion },
                { withCredentials: true }
            );

            if (response.data.success) {
                // Actualizamos el estado local para reflejar el cambio
                setNotificaciones(prev => 
                    prev.map(notif => 
                        notif.idNotificacion.toString() === idNotificacion.toString() ? 
                        { ...notif, leida: true } : notif
                    )
                );
                setSuccessMessage('Notificaciu00f3n marcada como leu00edda');
            } else {
                setErrorMessage(`Error al marcar como leu00edda: ${response.data.error || 'Error desconocido'}`);
            }
        } catch (err) {
            console.log("Error al marcar como leu00edda:", err);
            // Para desarrollo, actualizamos el estado local directamente
            setNotificaciones(prev => 
                prev.map(notif => 
                    notif.idNotificacion.toString() === idNotificacion.toString() ? 
                    { ...notif, leida: true } : notif
                )
            );
            setSuccessMessage('Notificaciu00f3n marcada como leu00edda (simulado)');
        }
    }, []);

    // Aprobar solicitud de cancelaciu00f3n de tarea
    const handleAprobarCancelacion = useCallback(async (idTarea) => {
        try {
            setSuccessMessage('');
            setErrorMessage('');
            
            const response = await axios.post(
                `${API_URL}/tareas.php?action=approveCancellation`,
                { id_tarea: idTarea },
                { withCredentials: true }
            );

            if (response.data.success) {
                setSuccessMessage('Solicitud de cancelaciu00f3n aprobada correctamente');
                // Recargar notificaciones para actualizar la vista
                fetchNotificaciones();
            } else {
                setErrorMessage(`Error al aprobar solicitud: ${response.data.error || 'Error desconocido'}`);
            }
        } catch (err) {
            console.log("Error al aprobar cancelaciu00f3n:", err);
            // Para desarrollo, mostramos mensaje de u00e9xito
            setSuccessMessage('Solicitud de cancelaciu00f3n aprobada correctamente (simulado)');
            // Filtramos la notificaciu00f3n para simular que ya no existe
            setNotificaciones(prev => 
                prev.filter(notif => 
                    notif.tipo !== 'tarea_cancelacion' || notif.id_referencia.toString() !== idTarea.toString()
                )
            );
        }
    }, [fetchNotificaciones]);

    // Rechazar solicitud de cancelaciu00f3n de tarea
    const handleRechazarCancelacion = useCallback(async (idTarea) => {
        try {
            setSuccessMessage('');
            setErrorMessage('');
            
            const response = await axios.post(
                `${API_URL}/tareas.php?action=rejectCancellation`,
                { id_tarea: idTarea },
                { withCredentials: true }
            );

            if (response.data.success) {
                setSuccessMessage('Solicitud de cancelaciu00f3n rechazada');
                // Recargar notificaciones para actualizar la vista
                fetchNotificaciones();
            } else {
                setErrorMessage(`Error al rechazar solicitud: ${response.data.error || 'Error desconocido'}`);
            }
        } catch (err) {
            console.log("Error al rechazar cancelaciu00f3n:", err);
            // Para desarrollo, mostramos mensaje de u00e9xito
            setSuccessMessage('Solicitud de cancelaciu00f3n rechazada (simulado)');
            // Filtramos la notificaciu00f3n para simular que ya no existe
            setNotificaciones(prev => 
                prev.filter(notif => 
                    notif.tipo !== 'tarea_cancelacion' || notif.id_referencia.toString() !== idTarea.toString()
                )
            );
        }
    }, [fetchNotificaciones]);

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

    // Formatear tipo de notificaciu00f3n para mostrar
    const formatearTipoNotificacion = (tipo) => {
        const tipos = {
            'tarea_asignacion': 'Asignaciu00f3n de tarea',
            'tarea_cancelacion': 'Cancelaciu00f3n de tarea',
            'tarea_completada': 'Tarea completada',
            'solicitud': 'Solicitud',
            'fichaje': 'Fichaje'
        };
        
        return tipos[tipo] || tipo;
    };

    // Determinar el color de fondo segu00fan el tipo de notificaciu00f3n
    const getColorNotificacion = (tipo) => {
        if (tipo.includes('tarea_cancelacion')) {
            return 'bg-red-100/80 text-red-800 dark:bg-red-800 dark:text-red-100';
        } else if (tipo.includes('tarea_asignacion')) {
            return 'bg-blue-100/80 text-blue-800 dark:bg-blue-800 dark:text-blue-100';
        } else if (tipo.includes('tarea_completada')) {
            return 'bg-green-100/80 text-green-800 dark:bg-green-800 dark:text-green-100';
        } else if (tipo.includes('solicitud')) {
            return 'bg-purple-100/80 text-purple-800 dark:bg-purple-800 dark:text-purple-100';
        } else {
            return 'bg-gray-100/80 text-gray-800 dark:bg-gray-800 dark:text-gray-100';
        }
    };
    // Filtrar elementos segu00fan el tipo seleccionado
    const filtrarElementos = () => {
        if (tipoFiltro === 'todos') {
            // Combinar recordatorios y notificaciones
            const recordatoriosFormateados = recordatorios.map(rec => ({
                id: `rec-${rec.id}`,
                tipo: 'recordatorio',
                tipoDetalle: rec.tipo_recordatorio,
                nombre: rec.nombre,
                NIF: rec.NIF,
                fecha: rec.fecha,
                hora: rec.enviado.split(' ')[1],
                mensaje: `Recordatorio de ${formatearTipoRecordatorio(rec.tipo_recordatorio)}`,
                leida: true // Los recordatorios siempre se consideran leu00eddos
            }));

            const notificacionesFormateadas = notificaciones.map(not => ({
                id: `not-${not.idNotificacion}`,
                tipo: 'notificacion',
                tipoDetalle: not.tipo,
                nombre: not.nombre,
                NIF: not.NIF,
                fecha: not.fecha.split(' ')[0],
                hora: not.fecha.split(' ')[1],
                mensaje: not.mensaje,
                leida: not.leida,
                id_referencia: not.id_referencia
            }));

            return [...recordatoriosFormateados, ...notificacionesFormateadas].sort((a, b) => {
                // Ordenar por fecha y hora (mu00e1s reciente primero)
                const fechaA = new Date(`${a.fecha} ${a.hora}`);
                const fechaB = new Date(`${b.fecha} ${b.hora}`);
                return fechaB - fechaA;
            });
        } else if (tipoFiltro === 'fichajes') {
            // Mostrar solo recordatorios de fichajes
            return recordatorios.map(rec => ({
                id: `rec-${rec.id}`,
                tipo: 'recordatorio',
                tipoDetalle: rec.tipo_recordatorio,
                nombre: rec.nombre,
                NIF: rec.NIF,
                fecha: rec.fecha,
                hora: rec.enviado.split(' ')[1],
                mensaje: `Recordatorio de ${formatearTipoRecordatorio(rec.tipo_recordatorio)}`,
                leida: true
            })).sort((a, b) => {
                const fechaA = new Date(`${a.fecha} ${a.hora}`);
                const fechaB = new Date(`${b.fecha} ${b.hora}`);
                return fechaB - fechaA;
            });
        } else if (tipoFiltro === 'tareas') {
            // Mostrar solo notificaciones relacionadas con tareas
            return notificaciones
                .filter(not => not.tipo.includes('tarea'))
                .map(not => ({
                    id: `not-${not.idNotificacion}`,
                    tipo: 'notificacion',
                    tipoDetalle: not.tipo,
                    nombre: not.nombre,
                    NIF: not.NIF,
                    fecha: not.fecha.split(' ')[0],
                    hora: not.fecha.split(' ')[1],
                    mensaje: not.mensaje,
                    leida: not.leida,
                    id_referencia: not.id_referencia
                })).sort((a, b) => {
                    const fechaA = new Date(`${a.fecha} ${a.hora}`);
                    const fechaB = new Date(`${b.fecha} ${b.hora}`);
                    return fechaB - fechaA;
                });
        } else if (tipoFiltro === 'solicitudes') {
            // Mostrar solo notificaciones de solicitudes
            return notificaciones
                .filter(not => not.tipo.includes('solicitud'))
                .map(not => ({
                    id: `not-${not.idNotificacion}`,
                    tipo: 'notificacion',
                    tipoDetalle: not.tipo,
                    nombre: not.nombre,
                    NIF: not.NIF,
                    fecha: not.fecha.split(' ')[0],
                    hora: not.fecha.split(' ')[1],
                    mensaje: not.mensaje,
                    leida: not.leida,
                    id_referencia: not.id_referencia
                })).sort((a, b) => {
                    const fechaA = new Date(`${a.fecha} ${a.hora}`);
                    const fechaB = new Date(`${b.fecha} ${b.hora}`);
                    return fechaB - fechaA;
                });
        }
        
        return [];
    };

    // Renderizar componente de carga
    if (loading) {
        return (
            <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-white'} p-6 flex items-center justify-center`}>
                <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mb-4"></div>
                    <p className="text-lg">Cargando datos...</p>
                </div>
            </div>
        );
    }
    return (
        <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gradient-to-br from-blue-50 to-white'} p-6`}>
            <div className="container mx-auto">
                {/* Cabecera */}
                <header className="mb-8">
                    <div className="flex flex-wrap items-center justify-between">
                        <div>
                            <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-blue-800'} mb-2`}>
                                Panel de Control
                            </h1>
                            <p className={`text-lg ${isDarkMode ? 'text-blue-300' : 'text-blue-600'}`}>
                                Gestión de Notificaciones y Recordatorios
                            </p>
                        </div>
                        
                        <div className="flex items-center space-x-2 mt-4 md:mt-0">
                            <div className={`rounded-full w-3 h-3 ${isDarkMode ? 'bg-emerald-500' : 'bg-emerald-400'} animate-pulse`}></div>
                            <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Sistema activo</span>
                        </div>
                    </div>
                </header>
                
                {/* Mensajes de error */}
                {error && (
                    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg shadow-sm mb-6 animate-fade-in">
                        <div className="flex items-center">
                            <svg className="h-6 w-6 text-red-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>{error}</span>
                        </div>
                    </div>
                )}

                {/* Filtros */}
                <div className="mb-8">
                    <div className={`rounded-xl shadow-md p-2 ${isDarkMode ? 'bg-gray-800/90 backdrop-blur-sm' : 'bg-white backdrop-blur-sm'}`}>
                        <nav className="flex flex-wrap justify-center md:justify-start">
                            <button 
                                onClick={() => setTipoFiltro('todos')}
                                className={`flex items-center px-6 py-3 m-1 rounded-lg transition-all duration-200 ${
                                    tipoFiltro === 'todos' 
                                    ? `${isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-600 text-white'} shadow-md transform -translate-y-1` 
                                    : `${isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-blue-50 text-blue-800 hover:bg-blue-100'}`
                                }`}
                            >
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"></path>
                                </svg>
                                Todos
                            </button>
                            
                            <button 
                                onClick={() => setTipoFiltro('fichajes')}
                                className={`flex items-center px-6 py-3 m-1 rounded-lg transition-all duration-200 ${
                                    tipoFiltro === 'fichajes' 
                                    ? `${isDarkMode ? 'bg-emerald-600 text-white' : 'bg-emerald-600 text-white'} shadow-md transform -translate-y-1` 
                                    : `${isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'}`
                                }`}
                            >
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                </svg>
                                Fichajes
                            </button>
                            
                            <button 
                                onClick={() => setTipoFiltro('tareas')}
                                className={`flex items-center px-6 py-3 m-1 rounded-lg transition-all duration-200 ${
                                    tipoFiltro === 'tareas' 
                                    ? `${isDarkMode ? 'bg-amber-600 text-white' : 'bg-amber-600 text-white'} shadow-md transform -translate-y-1` 
                                    : `${isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-amber-50 text-amber-800 hover:bg-amber-100'}`
                                }`}
                            >
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path>
                                </svg>
                                Tareas
                            </button>
                            
                            <button 
                                onClick={() => setTipoFiltro('solicitudes')}
                                className={`flex items-center px-6 py-3 m-1 rounded-lg transition-all duration-200 ${
                                    tipoFiltro === 'solicitudes' 
                                    ? `${isDarkMode ? 'bg-purple-600 text-white' : 'bg-purple-600 text-white'} shadow-md transform -translate-y-1` 
                                    : `${isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-purple-50 text-purple-800 hover:bg-purple-100'}`
                                }`}
                            >
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                </svg>
                                Solicitudes
                            </button>
                        </nav>
                    </div>
                </div>
                
                {/* Panel de contenido principal */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Panel de configuración */}
                    <div className={`rounded-xl shadow-lg overflow-hidden ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                        <div className={`p-4 ${isDarkMode ? 'bg-gradient-to-r from-blue-900/50 to-gray-800' : 'bg-gradient-to-r from-blue-100 to-white'}`}>
                            <h2 className={`text-xl font-semibold flex items-center ${isDarkMode ? 'text-white' : 'text-blue-800'}`}>
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                </svg>
                                Configuración
                            </h2>
                        </div>
                        
                        <div className="p-4">
                            {successMessage && (
                                <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded-lg shadow-sm mb-6 animate-fade-in">
                                    <div className="flex">
                                        <svg className="h-6 w-6 text-green-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                        </svg>
                                        <span>{successMessage}</span>
                                    </div>
                                </div>
                            )}

                            {errorMessage && (
                                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg shadow-sm mb-6 animate-fade-in">
                                    <div className="flex">
                                        <svg className="h-6 w-6 text-red-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span>{errorMessage}</span>
                                    </div>
                                </div>
                            )}
                            
                            <div className="space-y-4">
                                <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-4`}>
                                    Configure cómo y cuándo se envían los recordatorios a los empleados:
                                </p>
                            
                                <label className="inline-flex items-center">
                                    <input
                                        type="checkbox"
                                        name="enviar_recordatorio_entrada"
                                        checked={configuracion.enviar_recordatorio_entrada}
                                        onChange={handleConfigChange}
                                        className="form-checkbox h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
                                    />
                                    <span className={`text-sm ml-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Recordatorio de entrada</span>
                                </label>
                                
                                <label className="inline-flex items-center">
                                    <input
                                        type="checkbox"
                                        name="enviar_recordatorio_salida"
                                        checked={configuracion.enviar_recordatorio_salida}
                                        onChange={handleConfigChange}
                                        className="form-checkbox h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
                                    />
                                    <span className={`text-sm ml-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Recordatorio de salida</span>
                                </label>
                                
                                <label className="inline-flex items-center">
                                    <input
                                        type="checkbox"
                                        name="enviar_recordatorio_inicio_pausa"
                                        checked={configuracion.enviar_recordatorio_inicio_pausa}
                                        onChange={handleConfigChange}
                                        className="form-checkbox h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
                                    />
                                    <span className={`text-sm ml-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Recordatorio de inicio de pausa</span>
                                </label>
                                
                                <label className="inline-flex items-center">
                                    <input
                                        type="checkbox"
                                        name="enviar_recordatorio_fin_pausa"
                                        checked={configuracion.enviar_recordatorio_fin_pausa}
                                        onChange={handleConfigChange}
                                        className="form-checkbox h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
                                    />
                                    <span className={`text-sm ml-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Recordatorio de fin de pausa</span>
                                </label>
                            </div>
                            
                            <div>
                                <label htmlFor="minutos_antes" className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
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
                                    className={`mt-1 block w-full pl-3 pr-10 py-2 text-base focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md shadow-sm ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800'}`}
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
                    {/* Historial de notificaciones y recordatorios */}
                    <div className={`md:col-span-2 rounded-xl shadow-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                        <div className={`p-4 border-b ${isDarkMode ? 'border-gray-700 bg-gradient-to-r from-blue-900/50 to-gray-800' : 'border-blue-100 bg-gradient-to-r from-blue-100 to-white'} rounded-t-xl`}>
                            <h2 className={`text-xl font-semibold flex items-center ${isDarkMode ? 'text-white' : 'text-blue-800'}`}>
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
                                </svg>
                                {tipoFiltro === 'todos' && 'Historial completo'}
                                {tipoFiltro === 'fichajes' && 'Recordatorios de fichajes'}
                                {tipoFiltro === 'tareas' && 'Notificaciones de tareas'}
                                {tipoFiltro === 'solicitudes' && 'Solicitudes'}
                            </h2>
                        </div>
                        <div className="p-4">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                    <thead className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                        <tr>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                Empleado
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                Tipo
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                Mensaje
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                Fecha y Hora
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                Estado
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                Acciones
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className={`divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                                        {filtrarElementos().length > 0 ? (
                                            filtrarElementos().map((item) => (
                                                <tr key={item.id} className={`${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} ${!item.leida ? (isDarkMode ? 'bg-blue-900/20' : 'bg-blue-50/50') : ''}`}>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                                                            {item.nombre || 'Sin nombre'}
                                                        </div>
                                                        <div className="text-sm text-gray-500 dark:text-gray-400">
                                                            {item.NIF}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                                                            ${item.tipo === 'recordatorio' ? 
                                                                (item.tipoDetalle === 'entrada' ? 'bg-green-100/80 text-green-800 dark:bg-green-800 dark:text-green-100' : 
                                                                item.tipoDetalle === 'salida' ? 'bg-red-100/80 text-red-800 dark:bg-red-800 dark:text-red-100' : 
                                                                item.tipoDetalle === 'inicio_pausa' ? 'bg-yellow-100/80 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100' : 
                                                                'bg-blue-100/80 text-blue-800 dark:bg-blue-800 dark:text-blue-100') : 
                                                                getColorNotificacion(item.tipoDetalle)
                                                            }`}
                                                        >
                                                            {item.tipo === 'recordatorio' ? 
                                                                formatearTipoRecordatorio(item.tipoDetalle) : 
                                                                formatearTipoNotificacion(item.tipoDetalle)
                                                            }
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-normal max-w-xs text-sm text-gray-500 dark:text-gray-400">
                                                        {item.mensaje}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                        {item.fecha} <br/> {item.hora}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {item.tipo === 'notificacion' && !item.leida ? (
                                                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100/80 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100">
                                                                Sin leer
                                                            </span>
                                                        ) : (
                                                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100/80 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                                                                Leída
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                        {item.tipo === 'notificacion' && !item.leida && (
                                                            <button onClick={() => handleMarcarLeida(item.id.split('-')[1])} className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-2">
                                                                Marcar como leída
                                                            </button>
                                                        )}
                                                        {item.tipo === 'notificacion' && item.tipoDetalle === 'tarea_cancelacion' && (
                                                            <>
                                                                <button onClick={() => handleAprobarCancelacion(item.id_referencia)} className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 mr-2">
                                                                    Aprobar
                                                                </button>
                                                                <button onClick={() => handleRechazarCancelacion(item.id_referencia)} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300">
                                                                    Rechazar
                                                                </button>
                                                            </>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                                                    No hay elementos para mostrar
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Información y ayuda */}
                <div className={`mt-6 rounded-xl shadow-lg p-4 ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white'}`}>
                    <h2 className={`text-xl font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Información del Sistema de Notificaciones y Recordatorios</h2>
                    
                    <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} space-y-2`}>
                        <p>Este panel unifica la gestión de todas las notificaciones y recordatorios del sistema:</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                            <div className={`border rounded-lg p-3 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                                <h3 className="font-medium text-blue-600 dark:text-blue-400 mb-2">Recordatorios de Fichajes</h3>
                                <p>Se envían a los empleados por correo electrónico para ayudarles a mantener un registro preciso de sus fichajes.</p>
                                <ul className="list-disc list-inside ml-4 space-y-1 mt-2">
                                    <li>Entrada al trabajo</li>
                                    <li>Salida del trabajo</li>
                                    <li>Inicio y fin de pausas</li>
                                </ul>
                            </div>
                            
                            <div className={`border rounded-lg p-3 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                                <h3 className="font-medium text-green-600 dark:text-green-400 mb-2">Notificaciones de Tareas</h3>
                                <p>Gestionan las solicitudes relacionadas con las tareas asignadas a los empleados.</p>
                                <ul className="list-disc list-inside ml-4 space-y-1 mt-2">
                                    <li>Solicitudes de asignación</li>
                                    <li>Solicitudes de cancelación</li>
                                    <li>Tareas completadas</li>
                                </ul>
                            </div>
                            
                            <div className={`border rounded-lg p-3 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                                <h3 className="font-medium text-purple-600 dark:text-purple-400 mb-2">Solicitudes</h3>
                                <p>Gestiona otras peticiones de los empleados que requieren atención administrativa.</p>
                                <ul className="list-disc list-inside ml-4 space-y-1 mt-2">
                                    <li>Solicitudes de vacaciones</li>
                                    <li>Permisos especiales</li>
                                    <li>Cambios de horario</li>
                                </ul>
                            </div>
                            
                            <div className={`border rounded-lg p-3 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                                <h3 className="font-medium text-red-600 dark:text-red-400 mb-2">Acciones disponibles</h3>
                                <p>Como administrador, puedes realizar las siguientes acciones:</p>
                                <ul className="list-disc list-inside ml-4 space-y-1 mt-2">
                                    <li>Marcar notificaciones como leídas</li>
                                    <li>Aprobar o rechazar solicitudes de cancelación de tareas</li>
                                    <li>Configurar los recordatorios de fichajes</li>
                                    <li>Ejecutar el sistema de recordatorios manualmente</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminRecordatorios;
