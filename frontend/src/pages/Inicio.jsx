import React, { useState, useEffect } from 'react'
import RGL, { WidthProvider } from 'react-grid-layout'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'
import DashboardWidget from '../components/DashboardWidget'
import CalendarioWidget from '../components/CalendarioWidget'
import PerfilWidget from '../components/PerfilWidget'
import FichajeWidget from '../components/FichajeWidget'
import MapaWidget from '../components/MapaWidget'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { motion } from 'framer-motion'
import InitialsAvatar from '../components/InitialsAvatar'
import { Link } from 'react-router-dom'
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

const Inicio = () => {
    const { user } = useAuth();
    const { isDarkMode } = useTheme();
    const [isLoading, setIsLoading] = useState(true);
    const isEmpleado = user?.tipo_usuario === 'empleado';
    
    // Simular tiempo de carga para mostrar animación
    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 800);
        return () => clearTimeout(timer);
    }, []);
    
    const [layout, setLayout] = useState([
      { i: 'fichaje', x: 0, y: 0, w: 6, h: 6 },
      { i: 'tareas', x: 6, y: 0, w: 6, h: 4 },
      { i: 'notificaciones', x: 6, y: 4, w: 6, h: 4 },
      { i: 'calendario', x: 0, y: 6, w: 6, h: 9.5 },
      { i: 'perfil', x: 6, y: 8, w: 6, h: 4 },
      { i: 'mapa', x: 0, y: 10, w: 12, h: 10 },
    ]);
  
    const onLayoutChange = (newLayout) => {
      setLayout(newLayout);
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
                            
                            <div key="tareas" className="widget-container" style={widgetContainerStyle}>
                                <DashboardWidget title="Tareas Pendientes" icon="task">
                                    <ul className="space-y-3">
                                        <li className="flex items-center p-2 hover:bg-[#f0f9e0] rounded-lg transition-colors duration-200">
                                            <div className="flex items-center justify-center w-6 h-6 bg-[#f0f9e0] text-[#91e302] rounded-full mr-3">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                            <div className="flex-grow">
                                                <div className="flex items-center justify-between">
                                                    <span className="font-medium">Revisar documentación</span>
                                                    <span className="text-xs text-gray-500">Hoy</span>
                                                </div>
                                                <div className="text-xs text-gray-500 mt-1">Prioridad: Alta</div>
                                            </div>
                                        </li>
                                        <li className="flex items-center p-2 hover:bg-[#f0f9e0] rounded-lg transition-colors duration-200">
                                            <div className="flex items-center justify-center w-6 h-6 bg-[#f0f9e0] text-[#91e302] rounded-full mr-3">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                            <div className="flex-grow">
                                                <div className="flex items-center justify-between">
                                                    <span className="font-medium">Actualizar reportes</span>
                                                    <span className="text-xs text-gray-500">Mañana</span>
                                                </div>
                                                <div className="text-xs text-gray-500 mt-1">Prioridad: Media</div>
                                            </div>
                                        </li>
                                        <li className="flex items-center p-2 hover:bg-[#f0f9e0] rounded-lg transition-colors duration-200">
                                            <div className="flex items-center justify-center w-6 h-6 bg-[#f0f9e0] text-[#91e302] rounded-full mr-3">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                            <div className="flex-grow">
                                                <div className="flex items-center justify-between">
                                                    <span className="font-medium">Reunión de equipo</span>
                                                    <span className="text-xs text-gray-500">Jueves</span>
                                                </div>
                                                <div className="text-xs text-gray-500 mt-1">Prioridad: Baja</div>
                                            </div>
                                        </li>
                                    </ul>
                                </DashboardWidget>
                            </div>

                            <div key="notificaciones" className="widget-container" style={widgetContainerStyle}>
                                <DashboardWidget title="Notificaciones" icon="notification">
                                    <div className="space-y-3">
                                        <div className="p-3 bg-[#f0f9e0] rounded-lg border-l-4 border-[#91e302] hover:shadow-md transition-shadow duration-200">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 mr-3">
                                                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-[#91e302]">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                    </div>
                                                </div>
                                                <div>
                                                    <h4 className="font-medium">Nueva actualización del sistema</h4>
                                                    <p className="text-sm text-gray-600">Se ha lanzado la versión 2.3.0 con nuevas funcionalidades</p>
                                                    <span className="text-xs text-gray-500 mt-1">Hace 2 horas</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="p-3 bg-[#f9e0e3] rounded-lg border-l-4 border-[#c3515f] hover:shadow-md transition-shadow duration-200">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 mr-3">
                                                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-[#c3515f]">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                        </svg>
                                                    </div>
                                                </div>
                                                <div>
                                                    <h4 className="font-medium">Reunión programada</h4>
                                                    <p className="text-sm text-gray-600">Reunión de equipo mañana a las 10:00 AM</p>
                                                    <span className="text-xs text-gray-500 mt-1">Hace 5 horas</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </DashboardWidget>
                            </div>

                            <div key="calendario" className="widget-container" style={mapCalendarWidgetStyle}>
                                <DashboardWidget title="Calendario" icon="calendar">
                                    <CalendarioWidget />
                                </DashboardWidget>
                            </div>

                            <div key="perfil" className="widget-container" style={widgetContainerStyle}>
                                <DashboardWidget title="Mi Perfil" icon="user">
                                    <div className="flex items-center space-x-4 mb-4">
                                        {user.avatar ? (
                                            <div className="relative">
                                                <img 
                                                    src={user.avatar.ruta} 
                                                    alt={user.nombre}
                                                    className="w-16 h-16 rounded-full border-2 border-blue-100"
                                                    style={{ backgroundColor: user.avatar.color_fondo }}
                                                />
                                                <div className="absolute -bottom-1 -right-1 bg-green-400 w-4 h-4 rounded-full border-2 border-white"></div>
                                            </div>
                                        ) : (
                                            <InitialsAvatar 
                                                nombre={user.nombre} 
                                                size="lg"
                                                className="border-2 border-blue-100"
                                            />
                                        )}
                                        <div className="flex-1">
                                            <h4 className="text-lg font-semibold text-gray-800">{user.nombre}</h4>
                                            <p className="text-sm text-gray-500">{user.correo}</p>
                                            <p className="text-xs text-blue-600 mt-1">Activo ahora</p>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex items-center text-gray-600">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                            </svg>
                                            <span className="text-sm">{user.correo}</span>
                                        </div>
                                        {user.telefono && (
                                            <div className="flex items-center text-gray-600">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                                </svg>
                                                <span className="text-sm">{user.telefono}</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-gray-100">
                                        <Link 
                                            to="/perfil" 
                                            className="inline-flex items-center px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                            Editar perfil
                                        </Link>
                                    </div>
                                </DashboardWidget>
                            </div>

                            <div key="mapa" className="widget-container" style={mapCalendarWidgetStyle}>
                                <DashboardWidget title="Mapa" icon="map">
                                    <MapaWidget />
                                </DashboardWidget>
                            </div>
                        </ReactGridLayout>
                    </motion.div>
                ) : (
                    <motion.div 
                        className={`relative rounded-2xl shadow-2xl p-8 border-l-8 overflow-hidden animate-fade-in transition-colors duration-300 
                            ${isDarkMode ? 'bg-[#181c23] border-[#a5ff0d] text-gray-100' : 'bg-white border-[#d6e8b5] text-gray-800'}`}
                        variants={itemVariants}
                    >
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
                )}
            </motion.div>
        </div>
    );
};

export default Inicio;