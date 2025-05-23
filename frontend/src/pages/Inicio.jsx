import React, { useState, useEffect, useCallback } from 'react'
import RGL, { WidthProvider } from 'react-grid-layout'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'
import DashboardWidget from '../components/DashboardWidget'
import axios from 'axios'
import CalendarioWidget from '../components/CalendarioWidget'
import PerfilWidget from '../components/PerfilWidget'
import FichajeWidget from '../components/FichajeWidget'
import MapaWidget from '../components/MapaWidget'
import HistorialFichajesWidget from '../components/HistorialFichajesWidget'
import PerfilHorarioWidget from '../components/PerfilHorarioWidget'
import GraficoFichajesWidget from '../components/GraficoFichajesWidget'
import ReportesWidget from '../components/ReportesWidget'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { motion } from 'framer-motion'
import InitialsAvatar from '../components/InitialsAvatar'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { FaCalendarAlt, FaFilter, FaUserClock, FaBuilding, FaSearch, FaClipboardList, FaChartPie, FaEdit, FaTrash, FaUser, FaCheckCircle, FaTimesCircle, FaMap, FaMapMarkedAlt, FaMapMarkerAlt, FaExclamationTriangle } from 'react-icons/fa'
import AdminStatsChart from '../components/AdminStatsChart'

const ReactGridLayout = WidthProvider(RGL);

// Estilos para los widgets
const widgetContainerStyle = {
    height: 'auto',
    width: '100%'
};

// Estilos específicos para widgets que necesitan más espacio
const mapCalendarWidgetStyle = {
    height: 'auto',
    width: '100%',
    minHeight: '300px'
};

// URL base para las peticiones API
const API_URL = 'http://localhost/ImpulsaTelecom/backend/api';

// Función para formatear la hora extraída de un timestamp o valor de hora
const formatearHora = (horaStr) => {
    if (!horaStr) return '-';
    
    // Si la hora incluye segundos (HH:MM:SS), quitar los segundos
    if (horaStr.includes(':')) {
        const partes = horaStr.split(':');
        if (partes.length >= 2) {
            return `${partes[0]}:${partes[1]}`;
        }
    }
    
    return horaStr;
};

// Función para extraer la hora del formato fecha-hora
const extraerHora = (fechaHoraStr) => {
    if (!fechaHoraStr) return null;
    
    // Intentar extraer la hora si viene en formato "YYYY-MM-DD HH:MM:SS"
    const partes = fechaHoraStr.split(' ');
    if (partes.length > 1) {
        return formatearHora(partes[1]);
    }
    
    return null;
};

const Inicio = () => {
    const { user } = useAuth();
    const { isDarkMode } = useTheme();
    const [isLoading, setIsLoading] = useState(true);
    const isEmpleado = user?.tipo_usuario === 'empleado';
    
    // Estados para la sección de fichajes en el panel de administrador
    const [fichajes, setFichajes] = useState([]);
    const [loadingFichajes, setLoadingFichajes] = useState(false);
    const [errorFichajes, setErrorFichajes] = useState(null);
    const [editandoFichaje, setEditandoFichaje] = useState(null);
    const [eliminandoFichaje, setEliminandoFichaje] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [editForm, setEditForm] = useState({
        fecha: '',
        horaInicio: '',
        horaFin: '',
        estado: ''
    });
    const [filtrosFichajes, setFiltrosFichajes] = useState({
        fecha_inicio: '',
        fecha_fin: '',
        nif: '',
        departamento: ''
    });
    const [showFiltros, setShowFiltros] = useState(false);
    
    // Simular tiempo de carga para mostrar animación
    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 800);
        return () => clearTimeout(timer);
    }, []);
    
    // Función para cargar fichajes recientes para el dashboard de administrador
    const cargarFichajes = useCallback(async () => {
        // Solo cargar si el usuario es administrador
        if (user?.tipo_usuario !== 'admin') return;
        
        try {
            setLoadingFichajes(true);
            setErrorFichajes(null);
            
            const response = await axios.get('http://localhost/ImpulsaTelecom/backend/api/admin_fichajes.php', {
                params: {
                    action: 'getAll',
                    limite: 10,  // Limitar a 10 fichajes para el dashboard
                    ...filtrosFichajes
                },
                withCredentials: true
            });
            
            if (response.data.success) {
                console.log('Fichajes recientes:', response.data.fichajes);
                setFichajes(response.data.fichajes || []);
            } else {
                console.error('Error al cargar fichajes:', response.data.error);
                setErrorFichajes(response.data.error || 'Error desconocido');
            }
            // Mostrar la respuesta completa para depuración detallada
            console.log('Respuesta completa de fichajes:', response.data);
            
            if (response.data.fichajes && response.data.fichajes.length > 0) {
                const primerFichaje = response.data.fichajes[0];
                console.log('Primer fichaje (ejemplo - vista completa):', JSON.stringify(primerFichaje, null, 2));
                console.log('Propiedades del primer fichaje:', Object.keys(primerFichaje).join(', '));
                
                // Depurar TODAS las propiedades para encontrar donde están las horas
                Object.keys(primerFichaje).forEach(key => {
                    console.log(`${key}:`, primerFichaje[key]);
                });
                
                // Buscar específicamente campos que contengan la palabra "hora"
                const horaFields = Object.keys(primerFichaje).filter(key => 
                    key.toLowerCase().includes('hora') || 
                    key.toLowerCase().includes('time') || 
                    key.toLowerCase().includes('inicio') || 
                    key.toLowerCase().includes('fin')
                );
                
                console.log('Campos relacionados con hora/tiempo:', horaFields);
                horaFields.forEach(field => {
                    console.log(`${field}:`, primerFichaje[field]);
                });
            }
            
            if (response.data && response.data.success) {
                setFichajes(response.data.fichajes || []);
            } else {
                setErrorFichajes(response.data ? (response.data.error || 'Error al cargar fichajes') : 'No se recibieron datos');
                setFichajes([]);
            }
        } catch (err) {
            console.error('Error al cargar fichajes:', err);
            setErrorFichajes(`Error de conexión: ${err.message || 'Error desconocido'}`);
            setFichajes([]);
        } finally {
            setLoadingFichajes(false);
        }
    }, [filtrosFichajes, isEmpleado]);
    
    // Efecto para cargar los fichajes al iniciar o cuando cambien los filtros
    useEffect(() => {
        if (!isEmpleado && user) {
            cargarFichajes();
        }
    }, [cargarFichajes, isEmpleado, user]);
    
    const [layout, setLayout] = useState([
      { i: 'fichaje', x: 0, y: 0, w: 6, h: 6 },
      { i: 'historial', x: 6, y: 0, w: 6, h: 6 },
      { i: 'reportes', x: 0, y: 6, w: 6, h: 8 },
      { i: 'perfil-horario', x: 6, y: 6, w: 6, h: 8 },
      { i: 'grafico', x: 0, y: 14, w: 12, h: 8 },
    ]);
  
    const onLayoutChange = (newLayout) => {
      setLayout(newLayout);
    };
    
    // Función para abrir el modal de edición
    const handleOpenEdit = (fichaje) => {
        setEditandoFichaje(fichaje);
        setEditForm({
            fecha: fichaje.fecha,
            horaInicio: fichaje.horaInicio,
            horaFin: fichaje.horaFin,
            estado: fichaje.estado
        });
        setShowEditModal(true);
    };
    
    // Función para abrir el modal de confirmación de eliminación
    const handleOpenDelete = (fichaje) => {
        setEliminandoFichaje(fichaje);
        setShowDeleteModal(true);
    };
    
    // Función para guardar los cambios de edición
    const handleGuardarEdicion = async () => {
        try {
            setLoadingFichajes(true);
            const response = await axios.post('http://localhost/ImpulsaTelecom/backend/api/admin_fichajes.php', {
                action: 'updateFichaje',
                idRegistro: editandoFichaje.idRegistro,
                fecha: editForm.fecha,
                horaInicio: editForm.horaInicio,
                horaFin: editForm.horaFin,
                estado: editForm.estado
            }, {
                withCredentials: true
            });
            
            if (response.data.success) {
                // Actualizar la lista de fichajes
                const updatedFichajes = fichajes.map(f => 
                    f.idRegistro === editandoFichaje.idRegistro 
                        ? { ...f, ...editForm } 
                        : f
                );
                setFichajes(updatedFichajes);
                setShowEditModal(false);
                setSuccessMessage('Fichaje actualizado correctamente.');
                setTimeout(() => setSuccessMessage(''), 3000);
            } else {
                setErrorFichajes('Error al actualizar el fichaje: ' + (response.data.error || 'Error desconocido'));
                setTimeout(() => setErrorFichajes(null), 3000);
            }
        } catch (err) {
            console.error('Error al actualizar el fichaje:', err);
            setErrorFichajes(`Error al actualizar: ${err.message || 'Error desconocido'}`);
            setTimeout(() => setErrorFichajes(null), 3000);
        } finally {
            setLoadingFichajes(false);
        }
    };
    
    // Función para eliminar un fichaje
    const handleEliminarFichaje = async () => {
        try {
            setLoadingFichajes(true);
            const response = await axios.post('http://localhost/ImpulsaTelecom/backend/api/admin_fichajes.php', {
                action: 'deleteFichaje',
                idRegistro: eliminandoFichaje.idRegistro
            }, {
                withCredentials: true
            });
            
            if (response.data.success) {
                // Eliminar el fichaje de la lista
                const updatedFichajes = fichajes.filter(f => f.idRegistro !== eliminandoFichaje.idRegistro);
                setFichajes(updatedFichajes);
                setShowDeleteModal(false);
                setSuccessMessage('Fichaje eliminado correctamente.');
                setTimeout(() => setSuccessMessage(''), 3000);
            } else {
                setErrorFichajes('Error al eliminar el fichaje: ' + (response.data.error || 'Error desconocido'));
                setTimeout(() => setErrorFichajes(null), 3000);
            }
        } catch (err) {
            console.error('Error al eliminar el fichaje:', err);
            setErrorFichajes(`Error al eliminar: ${err.message || 'Error desconocido'}`);
            setTimeout(() => setErrorFichajes(null), 3000);
        } finally {
            setLoadingFichajes(false);
        }
    };
    
    // Función para manejar cambios en el formulario de edición
    const handleEditFormChange = (e) => {
        const { name, value } = e.target;
        setEditForm(prev => ({
            ...prev,
            [name]: value
        }));
    };
    
    // Variantes para animaciones
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
    
    // Obtener hora actual para el saludo personalizado
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Buenos días";
        if (hour < 18) return "Buenas tardes";
        return "Buenas noches";
    };
    
    if (isLoading) {
        return (
            <div className={`min-h-screen ${isDarkMode ? 'bg-gradient-to-br from-gray-900 to-gray-800' : 'bg-gradient-to-br from-[#f8f8f8] to-[#e6e6e6]'} flex items-center justify-center transition-colors duration-300`}>
                <div className="text-center">
                    <div className="flex justify-center mb-4">
                        <div className={`animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 ${isDarkMode ? 'border-[#a5ff0d]' : 'border-[#91e302]'}`}></div>
                    </div>
                    <h2 className={`text-xl ${isDarkMode ? 'text-gray-200' : 'text-gray-700'} font-medium`}>Cargando su espacio de trabajo...</h2>
                </div>
            </div>
        );
    }
    
    return (
        <div className={`min-h-screen ${isDarkMode ? 'bg-gradient-to-br from-gray-900 to-gray-800' : 'bg-gradient-to-br from-[#f8f8f8] to-[#e6e6e6]'} px-4 pt-6 pb-12 transition-colors duration-300`}>
            <motion.div 
                className="container mx-auto px-4"
                initial="hidden"
                animate="visible"
                variants={containerVariants}
            >
                <motion.div 
                    className={`mb-8 ${isDarkMode ? 'bg-gray-800 border-[#a5ff0d] text-gray-100' : 'bg-white border-[#91e302] text-gray-800'} rounded-xl shadow-lg p-6 border-l-4 transition-colors duration-300`}
                    variants={itemVariants}
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                                {getGreeting()}, <span className={isDarkMode ? 'text-[#a5ff0d]' : 'text-[#91e302]'}>{user?.nombre || 'Usuario'}</span>
                            </h1>
                            <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mt-1`}>
                                {new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                            </p>
                        </div>
                        <div className="hidden md:block">
                            <div className={`${isDarkMode ? 'bg-gray-700 text-[#a5ff0d] border-gray-600' : 'bg-[#f0f9e0] text-[#5a8a01] border-[#d1e9b0]'} px-4 py-2 rounded-lg font-medium border transition-colors duration-300`}>
                                {isEmpleado ? 'Panel de Empleado' : 'Panel de Administración'}
                            </div>
                        </div>
                    </div>
                </motion.div>
                
                {isEmpleado ? (
                    <motion.div variants={itemVariants}>
                        <ReactGridLayout
                            className="layout"
                            layout={layout}
                            onLayoutChange={onLayoutChange}
                            cols={12}
                            rowHeight={60}
                            autoSize={true}
                            isDraggable={true}
                            isResizable={true}
                            compactType="vertical"
                            draggableHandle=".drag-handle"
                            margin={[16, 16]}
                            containerPadding={[0, 0]}
                            useCSSTransforms={true}
                            verticalCompact={true}
                        >
                            <div key="fichaje" className="widget-container" style={widgetContainerStyle}>
                                <FichajeWidget />
                            </div>
                            
                            <div key="historial" className="widget-container" style={widgetContainerStyle}>
                                <HistorialFichajesWidget />
                            </div>
                            
                            <div key="reportes" className="widget-container" style={widgetContainerStyle}>
                                <ReportesWidget />
                            </div>

                            <div key="perfil-horario" className="widget-container" style={widgetContainerStyle}>
                                <PerfilHorarioWidget />
                            </div>

                            <div key="grafico" className="widget-container" style={widgetContainerStyle}>
                                <GraficoFichajesWidget />
                            </div>
                        </ReactGridLayout>
                        
                        {/* Mapa para usuarios normales (aparece en la parte inferior) */}
                        <div className="mt-8 mb-4">
                            <div className="widget-container" style={mapCalendarWidgetStyle}>
                                <div className="drag-handle w-full bg-gradient-to-r from-[#f0f9e0] to-white dark:from-[#1e293b] dark:to-[#1a1f2b] p-3 rounded-t-xl flex items-center justify-between border-b border-gray-200 dark:border-gray-700">
                                    <div className="flex items-center">
                                        <FaMap className="text-[#78bd00] mr-2" />
                                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Tu Ubicación</h3>
                                    </div>
                                </div>
                                <MapaWidget className="rounded-t-none" />
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <>
                        <motion.div 
                            className={`relative rounded-2xl shadow-2xl p-8 border-l-8 overflow-hidden animate-fade-in transition-colors duration-300 mb-8
                                ${isDarkMode ? 'bg-[#181c23] border-[#a5ff0d] text-gray-100' : 'bg-white border-[#d6e8b5] text-gray-800'}`}
                            variants={itemVariants}>

                        {/* Logo minimalista y cabecera */}
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-10 gap-4">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-xl flex items-center justify-center bg-gradient-to-br from-[#a5ff0d] to-[#91e302] shadow-lg animate-pulse-slow">
                                    <span className="text-3xl font-extrabold tracking-tight text-white drop-shadow-lg">IT</span>
                                </div>
                                <div>
                                    <h1 className="text-3xl md:text-4xl font-bold text-[#5a8a01] drop-shadow-sm">Bienvenido, {user?.nombre || 'Administrador'}</h1>
                                    <p className="text-gray-500 dark:text-gray-300 text-lg mt-1 flex items-center gap-2">
                                        <svg className="w-5 h-5 inline-block text-[#91e302]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                        {new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                    </p>
                                </div>
                            </div>
                            <div className="flex flex-col md:items-end gap-2">
                                <span className="inline-flex items-center px-4 py-2 rounded-full font-semibold text-white bg-gradient-to-r from-[#5a8a01] to-[#91e302] shadow-md">
                                    <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0-1.104.896-2 2-2s2 .896 2 2-.896 2-2 2-2-.896-2-2z" /></svg>
                                    Panel de Administración
                                </span>
                            </div>
                        </div>
                        {/* Tarjetas de acceso rápido */}
                        <div className={`grid grid-cols-1 md:grid-cols-3 gap-8 mb-10`}>
                            <Link to="/admin/usuarios" className={`group rounded-2xl shadow-xl p-8 flex flex-col items-start gap-4 hover:scale-105 hover:shadow-2xl transition-all duration-300 
                                ${isDarkMode ? 'bg-[#23272f] text-[#a5ff0d]' : 'bg-white text-[#5a8a01] border border-[#e5f2d6]'}
                            `}>
                                <div className={`flex items-center justify-center w-14 h-14 rounded-xl mb-2 
                                    ${isDarkMode ? 'bg-[#181c23] text-[#a5ff0d]' : 'bg-[#f6faef] text-[#91e302]'}`}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                    </svg>
                                </div>
                                <span className="text-2xl font-bold">Usuarios</span>
                                <span className={`text-opacity-80 ${isDarkMode ? 'text-[#a5ff0d]' : 'text-[#7da53e]'}`}>Gestiona usuarios, roles y permisos.</span>
                            </Link>
                            <button className={`group rounded-2xl shadow-xl p-8 flex flex-col items-start gap-4 hover:scale-105 hover:shadow-2xl transition-all duration-300 
                                ${isDarkMode ? 'bg-[#2d2023] text-[#ffb0c0]' : 'bg-[#fff6f7] text-[#c3515f] border border-[#ffe5ea]'}
                            `}>
                                <div className={`flex items-center justify-center w-14 h-14 rounded-xl mb-2 
                                    ${isDarkMode ? 'bg-[#181c23] text-[#ffb0c0]' : 'bg-white text-[#c3515f]'}`}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <span className="text-2xl font-bold">Reportes</span>
                                <span className={`text-opacity-80 ${isDarkMode ? 'text-[#ffb0c0]' : 'text-[#c3515f]'}`}>Visualiza y genera informes de actividad.</span>
                            </button>
                            <button className={`group rounded-2xl shadow-xl p-8 flex flex-col items-start gap-4 hover:scale-105 hover:shadow-2xl transition-all duration-300 
                                ${isDarkMode ? 'bg-[#23272f] text-[#cccccc]' : 'bg-[#f7f7f7] text-[#888888] border border-[#ededed]'}
                            `}>
                                <div className={`flex items-center justify-center w-14 h-14 rounded-xl mb-2 
                                    ${isDarkMode ? 'bg-[#181c23] text-[#cccccc]' : 'bg-white text-[#888888]'}`}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A2 2 0 0021 6.382V5a2 2 0 00-2-2H5a2 2 0 00-2 2v1.382a2 2 0 00.447 1.342L8 10m7 0v6a2 2 0 01-2 2H7a2 2 0 01-2-2v-6m12 0v6a2 2 0 01-2 2h-2a2 2 0 01-2-2v-6" />
                                    </svg>
                                </div>
                                <span className="text-2xl font-bold">Configuración</span>
                                <span className={`text-opacity-80 ${isDarkMode ? 'text-[#cccccc]' : 'text-[#888888]'}`}>Personaliza parámetros del sistema.</span>
                            </button>
                        </div>

                        {/* Estadísticas generales */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div className="bg-gradient-to-br from-[#91e302] to-[#5a8a01] p-6 rounded-2xl shadow flex flex-col items-center justify-center text-white">
                                <svg className="w-8 h-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                                <div className="text-3xl font-bold">24</div>
                                <div className="text-lg">Usuarios Activos</div>
                                <span className="text-[#d9ffb2] text-xs mt-1">↑ 12% desde el mes pasado</span>
                            </div>
                            <div className="bg-gradient-to-br from-[#c3515f] to-[#8c3a44] p-6 rounded-2xl shadow flex flex-col items-center justify-center text-white">
                                <svg className="w-8 h-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                <div className="text-3xl font-bold">156</div>
                                <div className="text-lg">Tareas Completadas</div>
                                <span className="text-[#ffdbe5] text-xs mt-1">↑ 8% desde el mes pasado</span>
                            </div>
                            <div className="bg-gradient-to-br from-[#f9e0e3] to-[#c3515f] p-6 rounded-2xl shadow flex flex-col items-center justify-center text-[#c3515f]">
                                <svg className="w-8 h-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                <div className="text-3xl font-bold">3</div>
                                <div className="text-lg">Incidencias</div>
                                <span className="text-[#c3515f] text-xs mt-1">↑ 2 más que el mes pasado</span>
                            </div>
                            <div className="bg-gradient-to-br from-[#cccccc] to-[#888888] p-6 rounded-2xl shadow flex flex-col items-center justify-center text-white">
                                <svg className="w-8 h-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A2 2 0 0021 6.382V5a2 2 0 00-2-2H5a2 2 0 00-2 2v1.382a2 2 0 00.447 1.342L8 10m7 0v6a2 2 0 01-2 2H7a2 2 0 01-2-2v-6m12 0v6a2 2 0 01-2 2h-2a2 2 0 01-2-2v-6" />
                                </svg>
                                <div className="text-3xl font-bold">8.2h</div>
                                <div className="text-lg">Tiempo Promedio</div>
                                <span className="text-[#d9ffb2] text-xs mt-1">↓ 0.5h desde el mes pasado</span>
                            </div>
                        </div>
                    </motion.div>

                    {/* Sección de Historial de Fichajes */}
                    <motion.div 
                        className={`relative rounded-2xl shadow-2xl p-8 border-l-8 overflow-hidden animate-fade-in transition-colors duration-300 mt-8
                            ${isDarkMode ? 'bg-[#181c23] border-[#a5ff0d] text-gray-100' : 'bg-white border-[#d6e8b5] text-gray-800'}`}
                        variants={itemVariants}
                    >
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
                            <div className="flex items-center gap-3">
                                <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${isDarkMode ? 'bg-[#232833] text-[#a5ff0d]' : 'bg-[#f6faef] text-[#91e302]'}`}>
                                    <FaUserClock className="w-5 h-5" />
                                </div>
                                <h2 className="text-2xl font-bold">Historial de Fichajes</h2>
                            </div>
                            <Link to="/admin/fichajes" className="inline-flex items-center px-4 py-2 rounded-lg font-semibold text-white bg-gradient-to-r from-[#5a8a01] to-[#91e302] shadow-md hover:shadow-lg transition-shadow duration-300">
                                <FaClipboardList className="mr-2" />
                                Ver Completo
                            </Link>
                        </div>

                        {/* Tabla de fichajes */}
                        <div className="relative overflow-x-auto shadow-md rounded-lg">
                            {loadingFichajes ? (
                                <div className="flex justify-center items-center py-12">
                                    <div className={`animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 ${isDarkMode ? 'border-[#a5ff0d]' : 'border-[#91e302]'}`}></div>
                                </div>
                            ) : errorFichajes ? (
                                <div className="p-4 text-center text-red-500">
                                    <p>{errorFichajes}</p>
                                </div>
                            ) : fichajes.length === 0 ? (
                                <div className="p-4 text-center">
                                    <p>No se encontraron fichajes.</p>
                                </div>
                            ) : (
                                <table className={`min-w-full divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                                    <thead className={isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}>
                                        <tr>
                                            <th scope="col" className="px-4 py-3 text-left text-sm font-medium uppercase tracking-wider">
                                                <div className="flex items-center">
                                                    <FaUser className="mr-1" /> Usuario
                                                </div>
                                            </th>
                                            <th scope="col" className="px-4 py-3 text-left text-sm font-medium uppercase tracking-wider">Fecha</th>
                                            <th scope="col" className="px-4 py-3 text-left text-sm font-medium uppercase tracking-wider">Entrada</th>
                                            <th scope="col" className="px-4 py-3 text-left text-sm font-medium uppercase tracking-wider">Salida</th>
                                            <th scope="col" className="px-4 py-3 text-left text-sm font-medium uppercase tracking-wider">Estado</th>
                                            <th scope="col" className="px-4 py-3 text-right text-sm font-medium uppercase tracking-wider">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className={`${isDarkMode ? 'bg-gray-900 divide-y divide-gray-800' : 'bg-white divide-y divide-gray-200'}`}>
                                        {fichajes.slice(0, 10).map((fichaje) => (
                                            <tr key={fichaje.idRegistro} className={`${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-50'} transition-colors duration-150`}>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm">
                                                    <div className="flex items-center">
                                                        <div className="flex-shrink-0">
                                                            {fichaje.avatar_ruta ? (
                                                                <img 
                                                                    src={`http://localhost/ImpulsaTelecom/frontend${fichaje.avatar_ruta}`} 
                                                                    alt={`Avatar de ${fichaje.nombreCompleto || fichaje.nombre || fichaje.nif || 'Usuario'}`}
                                                                    className="h-10 w-10 rounded-full object-cover border-2 border-gray-200"
                                                                    onError={(e) => {
                                                                        e.target.onerror = null;
                                                                        e.target.src = 'http://localhost/ImpulsaTelecom/frontend/src/img/avatares/user-profile-icon.png';
                                                                    }}
                                                                />
                                                            ) : (
                                                                <InitialsAvatar 
                                                                    nombre={fichaje.nombreCompleto || fichaje.nombre || fichaje.nif || 'Usuario'} 
                                                                    size="md" 
                                                                />
                                                            )}
                                                        </div>
                                                        <div className="ml-3">
                                                            <div className="font-medium">{fichaje.nombreCompleto || fichaje.nombre || fichaje.usuario || fichaje.nif}</div>
                                                            {fichaje.nif && <div className="text-xs text-gray-500">{fichaje.nif}</div>}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm">
                                                    {/* Intentar diferentes formatos para la fecha */}
                                                    {fichaje.fecha || 
                                                     fichaje.fechaFormato || 
                                                     (fichaje.fechaEntrada ? fichaje.fechaEntrada.split(' ')[0] : '') || 
                                                     (fichaje.fecha_entrada ? fichaje.fecha_entrada.split(' ')[0] : '') ||
                                                     '-'}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-green-600">
                                                    {/* Usar nuestras funciones de formateo para la hora de entrada */}
                                                    {(() => {
                                                        // Comprobar todos los posibles nombres de campo para hora entrada
                                                        if (fichaje.hora_entrada) return formatearHora(fichaje.hora_entrada);
                                                        if (fichaje.hora_inicio) return formatearHora(fichaje.hora_inicio);
                                                        if (fichaje.horaInicio) return formatearHora(fichaje.horaInicio);
                                                        if (fichaje.horaEntrada) return formatearHora(fichaje.horaEntrada);
                                                        if (fichaje.fechaHoraEntrada) return extraerHora(fichaje.fechaHoraEntrada);
                                                        if (fichaje.fecha_hora_entrada) return extraerHora(fichaje.fecha_hora_entrada);
                                                        if (fichaje.fechaEntrada) return extraerHora(fichaje.fechaEntrada);
                                                        if (fichaje.fecha_inicio) return extraerHora(fichaje.fecha_inicio);
                                                        if (fichaje.start_time) return formatearHora(fichaje.start_time);
                                                        
                                                        // Depuración para comprobar todos los campos
                                                        console.log('Campos de hora entrada no encontrados en:', Object.keys(fichaje));
                                                        return '-';
                                                    })()}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-red-600">
                                                    {/* Usar nuestras funciones de formateo para la hora de salida */}
                                                    {(() => {
                                                        // Comprobar todos los posibles nombres de campo para hora salida
                                                        if (fichaje.hora_salida) return formatearHora(fichaje.hora_salida);
                                                        if (fichaje.hora_fin) return formatearHora(fichaje.hora_fin);
                                                        if (fichaje.horaFin) return formatearHora(fichaje.horaFin);
                                                        if (fichaje.horaSalida) return formatearHora(fichaje.horaSalida);
                                                        if (fichaje.fechaHoraSalida) return extraerHora(fichaje.fechaHoraSalida);
                                                        if (fichaje.fecha_hora_salida) return extraerHora(fichaje.fecha_hora_salida);
                                                        if (fichaje.fechaSalida) return extraerHora(fichaje.fechaSalida);
                                                        if (fichaje.fecha_fin) return extraerHora(fichaje.fecha_fin);
                                                        if (fichaje.end_time) return formatearHora(fichaje.end_time);
                                                        
                                                        // Si no hay información de salida
                                                        return '-';
                                                    })()}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold
                                                        ${fichaje.estado === 'finalizado' ? 
                                                          (isDarkMode ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800') : 
                                                        fichaje.estado === 'pausado' ? 
                                                          (isDarkMode ? 'bg-yellow-900 text-yellow-200' : 'bg-yellow-100 text-yellow-800') : 
                                                          (isDarkMode ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800')}
                                                    `}>
                                                        {fichaje.estado === 'finalizado' ? 'Finalizado' : 
                                                         fichaje.estado === 'pausado' ? 'Pausado' : 'Activo'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-right text-sm">
                                                    <button 
                                                        onClick={() => handleOpenEdit(fichaje)}
                                                        className={`ml-2 p-1 rounded ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
                                                        title="Editar fichaje"
                                                    >
                                                        <FaEdit className="h-4 w-4 text-blue-500" />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleOpenDelete(fichaje)}
                                                        className={`ml-2 p-1 rounded ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
                                                        title="Eliminar fichaje"
                                                    >
                                                        <FaTrash className="h-4 w-4 text-red-500" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </motion.div>
                </>    
                )}
            </motion.div>

            {/* Mensaje de éxito */}
            {successMessage && (
                <div className="fixed bottom-5 right-5 bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded shadow-lg z-50 animate-fade-in-up">
                    <div className="flex items-center">
                        <div className="py-1">
                            <FaCheckCircle className="text-green-500 mr-3" />
                        </div>
                        <div>
                            <p className="font-bold">Éxito</p>
                            <p className="text-sm">{successMessage}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de edición de fichaje */}
            {showEditModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
                    <div className={`rounded-lg shadow-lg p-6 max-w-md w-full mx-4 ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white'}`}>
                        <h2 className="text-xl font-semibold mb-4">Editar Fichaje</h2>
                        
                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-1">Fecha</label>
                            <input 
                                type="date" 
                                name="fecha" 
                                value={editForm.fecha} 
                                onChange={handleEditFormChange}
                                className={`w-full p-2 border rounded ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                            />
                        </div>
                        
                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-1">Hora Entrada</label>
                            <input 
                                type="time" 
                                name="horaInicio" 
                                value={editForm.horaInicio} 
                                onChange={handleEditFormChange}
                                className={`w-full p-2 border rounded ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                            />
                        </div>
                        
                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-1">Hora Salida</label>
                            <input 
                                type="time" 
                                name="horaFin" 
                                value={editForm.horaFin} 
                                onChange={handleEditFormChange}
                                className={`w-full p-2 border rounded ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                            />
                        </div>
                        
                        <div className="mb-6">
                            <label className="block text-sm font-medium mb-1">Estado</label>
                            <select 
                                name="estado" 
                                value={editForm.estado} 
                                onChange={handleEditFormChange}
                                className={`w-full p-2 border rounded ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                            >
                                <option value="trabajando">Trabajando</option>
                                <option value="pausado">Pausado</option>
                                <option value="finalizado">Finalizado</option>
                            </select>
                        </div>
                        
                        <div className="flex justify-end space-x-3">
                            <button 
                                onClick={() => setShowEditModal(false)} 
                                className={`px-4 py-2 rounded-lg ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={handleGuardarEdicion} 
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                disabled={loadingFichajes}
                            >
                                {loadingFichajes ? 'Guardando...' : 'Guardar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Modal de confirmación para eliminar */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
                    <div className={`rounded-lg shadow-lg p-6 max-w-md w-full mx-4 ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white'}`}>
                        <h2 className="text-xl font-semibold mb-4">Confirmar eliminación</h2>
                        
                        <p className="mb-6">
                            ¿Estás seguro de que deseas eliminar este fichaje? Esta acción no se puede deshacer.
                        </p>
                        
                        <div className="flex justify-end space-x-3">
                            <button 
                                onClick={() => setShowDeleteModal(false)} 
                                className={`px-4 py-2 rounded-lg ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={handleEliminarFichaje} 
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                                disabled={loadingFichajes}
                            >
                                {loadingFichajes ? 'Eliminando...' : 'Eliminar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Inicio;