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
import { motion } from 'framer-motion'
import InitialsAvatar from '../components/InitialsAvatar'
import { Link } from 'react-router-dom'

const ReactGridLayout = WidthProvider(RGL);

const Inicio = () => {
    const { user } = useAuth();
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
      { i: 'calendario', x: 0, y: 6, w: 6, h: 4 },
      { i: 'perfil', x: 6, y: 8, w: 6, h: 4 },
      { i: 'mapa', x: 0, y: 10, w: 12, h: 12 },
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
            <div className="min-h-screen bg-gradient-to-br from-[#f8f8f8] to-[#e6e6e6] flex items-center justify-center">
                <div className="text-center">
                    <div className="flex justify-center mb-4">
                        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-[#91e302]"></div>
                    </div>
                    <h2 className="text-xl text-gray-700 font-medium">Cargando su espacio de trabajo...</h2>
                </div>
            </div>
        );
    }
    
    return (
        <div className="min-h-screen bg-gradient-to-br from-[#f8f8f8] to-[#e6e6e6] pt-6 pb-12">
            <motion.div 
                className="container mx-auto px-4"
                initial="hidden"
                animate="visible"
                variants={containerVariants}
            >
                <motion.div 
                    className="mb-8 bg-white rounded-xl shadow-lg p-6 border-l-4 border-[#91e302]"
                    variants={itemVariants}
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800">
                                {getGreeting()}, <span className="text-[#91e302]">{user?.nombre || 'Usuario'}</span>
                            </h1>
                            <p className="text-gray-600 mt-1">
                                {new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                            </p>
                        </div>
                        <div className="hidden md:block">
                            <div className="bg-[#f0f9e0] text-[#5a8a01] px-4 py-2 rounded-lg font-medium border border-[#d1e9b0]">
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
                            rowHeight={100}
                            isDraggable={true}
                            isResizable={true}
                            compactType="vertical"
                            draggableHandle=".drag-handle"
                            margin={[16, 16]}
                        >
                            <div key="fichaje" className="widget-container">
                                <FichajeWidget />
                            </div>
                            
                            <div key="tareas" className="widget-container">
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

                            <div key="notificaciones" className="widget-container">
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

                            <div key="calendario" className="widget-container">
                                <DashboardWidget title="Calendario" icon="calendar">
                                    <CalendarioWidget />
                                </DashboardWidget>
                            </div>

                            <div key="perfil" className="widget-container">
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

                            <div key="mapa" className="widget-container">
                                <DashboardWidget title="Mapa" icon="map">
                                    <MapaWidget />
                                </DashboardWidget>
                            </div>
                        </ReactGridLayout>
                    </motion.div>
                ) : (
                    <motion.div 
                        className="bg-white rounded-xl shadow-lg p-6"
                        variants={itemVariants}
                    >
                        <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-3">Panel de Administración</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-gradient-to-br from-[#91e302] to-[#5a8a01] rounded-xl shadow-lg p-6 text-white hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 hover:scale-105">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-xl font-semibold">Gestión de Usuarios</h3>
                                    <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                        </svg>
                                    </div>
                                </div>
                                <p className="text-white text-opacity-80 mb-4">Administra los usuarios del sistema, sus permisos y roles.</p>
                                <button className="mt-2 px-4 py-2 bg-white text-[#5a8a01] rounded-lg font-medium hover:bg-opacity-90 transition-colors">
                                    Gestionar
                                </button>
                            </div>
                            
                            <div className="bg-gradient-to-br from-[#c3515f] to-[#8c3a44] rounded-xl shadow-lg p-6 text-white hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 hover:scale-105">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-xl font-semibold">Reportes</h3>
                                    <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                    </div>
                                </div>
                                <p className="text-white text-opacity-80 mb-4">Visualiza y genera informes de actividad y rendimiento.</p>
                                <button className="mt-2 px-4 py-2 bg-white text-[#8c3a44] rounded-lg font-medium hover:bg-opacity-90 transition-colors">
                                    Ver Reportes
                                </button>
                            </div>
                            
                            <div className="bg-gradient-to-br from-[#cccccc] to-[#888888] rounded-xl shadow-lg p-6 text-white hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 hover:scale-105">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-xl font-semibold">Configuración</h3>
                                    <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                    </div>
                                </div>
                                <p className="text-white text-opacity-80 mb-4">Personaliza y configura los parámetros del sistema.</p>
                                <button className="mt-2 px-4 py-2 bg-white text-[#666666] rounded-lg font-medium hover:bg-opacity-90 transition-colors">
                                    Configurar
                                </button>
                            </div>
                        </div>
                        
                        <div className="mt-8 bg-[#f8f8f8] rounded-xl p-6">
                            <h3 className="text-xl font-semibold mb-4 text-gray-800">Estadísticas Generales</h3>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="bg-white p-4 rounded-lg shadow border-l-4 border-[#91e302]">
                                    <div className="text-gray-500 text-sm">Usuarios Activos</div>
                                    <div className="text-2xl font-bold text-gray-800">24</div>
                                    <div className="text-[#91e302] text-xs mt-1">↑ 12% desde el mes pasado</div>
                                </div>
                                <div className="bg-white p-4 rounded-lg shadow border-l-4 border-[#91e302]">
                                    <div className="text-gray-500 text-sm">Tareas Completadas</div>
                                    <div className="text-2xl font-bold text-gray-800">156</div>
                                    <div className="text-[#91e302] text-xs mt-1">↑ 8% desde el mes pasado</div>
                                </div>
                                <div className="bg-white p-4 rounded-lg shadow border-l-4 border-[#c3515f]">
                                    <div className="text-gray-500 text-sm">Incidencias</div>
                                    <div className="text-2xl font-bold text-gray-800">3</div>
                                    <div className="text-[#c3515f] text-xs mt-1">↑ 2 más que el mes pasado</div>
                                </div>
                                <div className="bg-white p-4 rounded-lg shadow border-l-4 border-[#cccccc]">
                                    <div className="text-gray-500 text-sm">Tiempo Promedio</div>
                                    <div className="text-2xl font-bold text-gray-800">8.2h</div>
                                    <div className="text-[#91e302] text-xs mt-1">↓ 0.5h desde el mes pasado</div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </motion.div>
            
            {/* Footer con información adicional */}
            <motion.div 
                className="container mx-auto px-4 mt-8 text-center text-gray-500 text-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
            >
                <p> 2025 ImpulsaTelecom - Todos los derechos reservados</p>
            </motion.div>
        </div>
    )
}

export default Inicio