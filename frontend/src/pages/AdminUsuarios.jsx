import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaUserCog, FaUserClock, FaCheckCircle, FaTimesCircle, FaSearch, FaFilter, FaCalendarAlt, FaUserAlt, FaEnvelope, FaIdCard, FaBuilding, FaEdit, FaKey, FaPhone, FaBriefcase, FaSave } from 'react-icons/fa';
import InitialsAvatar from '../components/InitialsAvatar';

// URL base para las peticiones API
const API_URL = 'http://localhost/ImpulsaTelecom/backend/api';

const AdminUsuarios = () => {
    const { user } = useAuth();
    const { isDarkMode } = useTheme();
    const navigate = useNavigate();
    
    // Estados para gestionar datos y UI
    const [usuarios, setUsuarios] = useState([]);
    const [horarios, setHorarios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedUser, setSelectedUser] = useState(null);
    const [selectedHorario, setSelectedHorario] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    
    // Estados para edición de usuario
    const [editMode, setEditMode] = useState(false);
    const [editFormData, setEditFormData] = useState({
        nombre: '',
        apellidos: '',
        correo: '',
        telefono: '',
        dpto: '',
        id_avatar: '',
        tipo_usuario: '',
        password: '',
        permitir_pausas: false
    });
    
    // Estado para mostrar o no el campo de contraseña
    const [showPasswordField, setShowPasswordField] = useState(false);

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
        fetchHorarios();
    }, [user, navigate]);

    // Función para cargar usuarios desde la API
    const fetchUsuarios = useCallback(async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_URL}/usuarios.php?action=list&include_avatars=true`, {
                withCredentials: true
            });

            if (response.data.success) {
                setUsuarios(response.data.usuarios);
                console.log('Usuarios cargados:', response.data.usuarios);
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

    // Función para cargar horarios desde la API
    const fetchHorarios = useCallback(async () => {
        try {
            const response = await axios.get(`${API_URL}/horarios.php`, {
                withCredentials: true
            });

            if (response.data.success) {
                setHorarios(response.data.horarios);
            } else {
                setError(`Error al cargar horarios: ${response.data.error || 'Error desconocido'}`);
            }
        } catch (err) {
            setError(`Error de conexión: ${err.message}`);
            console.error('Error al cargar horarios:', err);
        }
    }, []);

    // Manejar selección de usuario
    const handleUserSelect = useCallback((usuario) => {
        setSelectedUser(usuario);
        setSelectedHorario(usuario.id_horario || '');
        
        // Mostrar en consola para debugging
        console.log('Usuario seleccionado:', usuario);
        console.log('Valor permitir_pausas recibido:', usuario.permitir_pausas);
        
        // Inicializar formulario de edición con datos del usuario
        setEditFormData({
            nombre: usuario.nombre || '',
            apellidos: usuario.apellidos || '',
            correo: usuario.correo || '',
            telefono: usuario.telefono || '',
            dpto: usuario.dpto || '',
            id_avatar: usuario.id_avatar || '',
            tipo_usuario: usuario.tipo_Usu || usuario.tipo_usuario || '',
            password: '',
            permitir_pausas: usuario.permitir_pausas !== undefined ? usuario.permitir_pausas : 0
        });
        // Salir del modo edición si estaba activo
        setEditMode(false);
        setShowPasswordField(false);
        // Limpiar mensajes
        setSuccessMessage('');
        setErrorMessage('');
    }, []);

    // Manejar cambio de horario en el selector
    const handleHorarioChange = useCallback((e) => {
        setSelectedHorario(e.target.value);
    }, []);

    // Función para asignar horario al usuario seleccionado
    const handleAsignarHorario = useCallback(async () => {
        if (!selectedUser) return;

        try {
            const response = await axios.post(`${API_URL}/usuarios.php`, {
                action: 'asignarHorario',
                nif: selectedUser.NIF || selectedUser.id,
                id_horario: selectedHorario
            }, {
                withCredentials: true
            });

            if (response.data.success) {
                // Actualizar usuario en la lista
                setUsuarios(prev => prev.map(u => {
                    if ((u.NIF === selectedUser.NIF) || (u.id === selectedUser.id)) {
                        return { ...u, id_horario: selectedHorario };
                    }
                    return u;
                }));
                
                // Actualizar usuario seleccionado
                setSelectedUser(prev => ({ ...prev, id_horario: selectedHorario }));
                
                // Mostrar mensaje de éxito
                setSuccessMessage('Horario asignado correctamente');
                setErrorMessage('');
                
                // Limpiar mensaje después de 3 segundos
                setTimeout(() => {
                    setSuccessMessage('');
                }, 3000);
            } else {
                setErrorMessage(`Error: ${response.data.error || 'Error desconocido'}`);
                setSuccessMessage('');
            }
        } catch (err) {
            setErrorMessage(`Error de conexión: ${err.message}`);
            setSuccessMessage('');
            console.error('Error al asignar horario:', err);
        }
    }, [selectedUser, selectedHorario]);
    
    // Función para manejar cambios en el formulario de edición
    const handleEditFormChange = useCallback((e) => {
        const { name, value, type, checked } = e.target;
        setEditFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    }, []);
    
    // Función para guardar cambios en el usuario
    const handleSaveUserChanges = useCallback(async () => {
        if (!selectedUser) return;
        
        try {
            const userId = selectedUser.NIF || selectedUser.id;
            // Preparar datos para enviar
            const userData = {
                ...editFormData,
                // Si no se ha modificado la contraseña, no la enviamos
                password: showPasswordField && editFormData.password ? editFormData.password : undefined
            };
            
            const response = await axios.post(`${API_URL}/usuarios.php?action=update&id=${userId}`, userData, {
                withCredentials: true
            });
            
            if (response.data.success) {
                // Volver a cargar la lista completa de usuarios para evitar duplicaciones
                await fetchUsuarios();
                
                // Actualizar usuario seleccionado
                const updatedUserData = {
                    ...selectedUser,
                    nombre: editFormData.nombre,
                    apellidos: editFormData.apellidos,
                    correo: editFormData.correo,
                    telefono: editFormData.telefono,
                    dpto: editFormData.dpto,
                    id_avatar: editFormData.id_avatar,
                    tipo_Usu: editFormData.tipo_usuario,
                    tipo_usuario: editFormData.tipo_usuario,
                    permitir_pausas: editFormData.permitir_pausas // Ya es un valor numérico (0/1)
                };
                
                console.log('Datos actualizados enviados al servidor:', updatedUserData);
                
                setSelectedUser(updatedUserData);
                
                // Salir del modo edición
                setEditMode(false);
                setShowPasswordField(false);
                
                // Mostrar mensaje de éxito
                setSuccessMessage('Usuario actualizado correctamente');
                setErrorMessage('');
                
                // Limpiar mensaje después de 3 segundos
                setTimeout(() => {
                    setSuccessMessage('');
                }, 3000);
            } else {
                setErrorMessage(`Error: ${response.data.error || 'Error desconocido'}`);
                setSuccessMessage('');
            }
        } catch (err) {
            setErrorMessage(`Error de conexión: ${err.message}`);
            setSuccessMessage('');
            console.error('Error al actualizar usuario:', err);
        }
    }, [selectedUser, editFormData, showPasswordField, fetchUsuarios]);

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

    // Función para renderizar información del horario seleccionado
    const renderInfoHorario = useCallback(() => {
        if (!selectedHorario) {
            return (
                <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>No hay horario asignado.</p>
                </div>
            );
        }

        const horario = horarios.find(h => String(h.id) === String(selectedHorario));
        if (!horario) {
            return (
                <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>No se encontró información del horario.</p>
                </div>
            );
        }

        return (
            <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-blue-900/40' : 'bg-blue-50'} border ${isDarkMode ? 'border-blue-800' : 'border-blue-200'}`}>
                <h5 className={`font-medium mb-2 ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>{horario.nombre}</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                        <p className={`text-xs mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Horario de trabajo</p>
                        <p className={`flex items-center text-sm ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                            <FaCalendarAlt className="mr-2 text-blue-500" />
                            {horario.hora_inicio} - {horario.hora_fin}
                        </p>
                    </div>
                    <div>
                        <p className={`text-xs mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Días de trabajo</p>
                        <p className={`text-sm ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                            {horario.dias_trabajo ? horario.dias_trabajo : 'Lunes a Viernes'}
                        </p>
                    </div>
                </div>
            </div>
        );
    }, [selectedHorario, horarios, isDarkMode]);

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
                                <FaUserCog className={`text-2xl ${isDarkMode ? 'text-blue-300' : 'text-blue-600'}`} />
                            </div>
                            <div>
                                <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Administración de Usuarios</h1>
                                <p className={`mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Gestiona usuarios y asigna horarios</p>
                            </div>
                        </div>
                        
                        <div className="mt-4 md:mt-0 flex items-center">
                            <div className={`relative rounded-lg overflow-hidden shadow-sm ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <FaSearch className="h-4 w-4 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    className={`block w-full pl-10 pr-3 py-2 border-0 ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:outline-none sm:text-sm`}
                                    placeholder="Buscar usuario..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <button className={`ml-3 p-2 rounded-lg ${isDarkMode ? 'bg-gray-800 text-gray-200' : 'bg-white text-gray-700'} hover:bg-blue-500 hover:text-white transition-colors`}>
                                <FaFilter className="h-4 w-4" />
                            </button>
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
                <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Lista de usuarios */}
                    <div className={`md:col-span-1 rounded-xl shadow-lg overflow-hidden ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                        <div className={`py-4 px-5 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                            <div className="flex items-center justify-between">
                                <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                                    <div className="flex items-center">
                                        <FaUserAlt className={`mr-2 ${isDarkMode ? 'text-blue-400' : 'text-blue-500'}`} />
                                        Usuarios
                                    </div>
                                </h2>
                                <span className={`inline-flex items-center justify-center px-3 py-1 text-xs font-medium rounded-full ${isDarkMode ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800'}`}>
                                    {filteredUsuarios.length} {filteredUsuarios.length === 1 ? 'usuario' : 'usuarios'}
                                </span>
                            </div>
                        </div>
                        <div className="p-4 overflow-y-auto" style={{ maxHeight: '65vh' }}>
                            {loading ? (
                                <div className="flex justify-center items-center h-48">
                                    <div className={`animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 ${isDarkMode ? 'border-blue-400' : 'border-blue-600'}`}></div>
                                </div>
                            ) : filteredUsuarios.length > 0 ? (
                                <ul className="space-y-2">
                                    {filteredUsuarios.map((usuario) => (
                                        <li 
                                            key={usuario.NIF || usuario.id || Math.random()}
                                            className={`p-3 cursor-pointer rounded-lg transition duration-200 ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} ${selectedUser && (selectedUser.NIF === usuario.NIF || selectedUser.id === usuario.id) ? `${isDarkMode ? 'bg-blue-900/30 border-l-4 border-blue-500' : 'bg-blue-50 border-l-4 border-blue-500'}` : ''}`}
                                            onClick={() => handleUserSelect(usuario)}
                                        >
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0">
                                                    {usuario.id_avatar ? (
                                                        <div 
                                                            className="h-12 w-12 rounded-full overflow-hidden flex items-center justify-center border-2 border-gray-200"
                                                            style={{ backgroundColor: usuario.avatar?.color_fondo || '#f3f4f6' }}
                                                        >
                                                            <img 
                                                                src={usuario.avatar?.ruta || `http://localhost/ImpulsaTelecom/frontend/src/img/avatares/001-man.png`} 
                                                                alt={`Avatar de ${usuario.nombre}`} 
                                                                className="h-full w-full object-contain"
                                                                onError={(e) => {
                                                                    e.target.onerror = null;
                                                                    e.target.src = 'http://localhost/ImpulsaTelecom/frontend/src/img/avatares/user-profile-icon.png';
                                                                }}
                                                            />
                                                        </div>
                                                    ) : (
                                                        <InitialsAvatar 
                                                            nombre={usuario.nombre || usuario.NIF || 'Usuario'} 
                                                            size="md" 
                                                        />
                                                    )}
                                                </div>
                                                <div className="ml-4 flex-1">
                                                    <div className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                                        {usuario.nombre} {usuario.apellidos}
                                                    </div>
                                                    <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                        {usuario.correo}
                                                    </div>
                                                    <div className="flex items-center mt-1">
                                                        <span className={`text-xs px-2 py-0.5 rounded-full ${isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'}`}>
                                                            {usuario.tipo_Usu || usuario.tipo_usuario}
                                                        </span>
                                                        {usuario.id_horario && usuario.id_horario !== 'NULL' && usuario.id_horario !== '0' && usuario.id_horario !== 0 && (
                                                            <span className={`text-xs px-2 py-0.5 rounded-full ml-2 ${isDarkMode ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800'}`}>
                                                                <FaUserClock className="inline mr-1 text-xs" />
                                                                Con horario
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className={`text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                    {searchTerm ? 'No se encontraron usuarios con ese criterio de búsqueda' : 'No hay usuarios disponibles'}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Detalles del usuario y asignación de horario */}
                    <div className="md:col-span-2">
                        {selectedUser ? (
                            <div className={`rounded-xl shadow-lg overflow-hidden ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                                <div className={`py-4 px-6 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                                    <div className="flex items-center">
                                        <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                                            Detalles del Usuario
                                        </h2>
                                    </div>
                                </div>
                                
                                <div className="p-6">
                                    {/* Botón para activar modo edición */}
                                    <div className="flex justify-end mb-4">
                                        <button
                                            onClick={() => setEditMode(!editMode)}
                                            className={`px-4 py-2 rounded-lg font-medium flex items-center ${isDarkMode ? 'bg-blue-700 hover:bg-blue-600' : 'bg-blue-500 hover:bg-blue-600'} text-white shadow-sm transition-all duration-200`}
                                        >
                                            <FaEdit className="mr-2" />
                                            {editMode ? 'Cancelar Edición' : 'Editar Usuario'}
                                        </button>
                                    </div>
                                    {!editMode ? (
                                        <div className="flex items-center mb-6">
                                            <div className="mr-4">
                                                {selectedUser.id_avatar ? (
                                                    <div 
                                                        className="h-20 w-20 rounded-full overflow-hidden flex items-center justify-center border-4 border-gray-200"
                                                        style={{ backgroundColor: selectedUser.avatar?.color_fondo || '#f3f4f6' }}
                                                    >
                                                        <img 
                                                            src={selectedUser.avatar?.ruta || `http://localhost/ImpulsaTelecom/frontend/src/img/avatares/001-man.png`} 
                                                            alt={`Avatar de ${selectedUser.nombre}`} 
                                                            className="h-full w-full object-contain"
                                                            onError={(e) => {
                                                                e.target.onerror = null;
                                                                e.target.src = 'http://localhost/ImpulsaTelecom/frontend/src/img/avatares/user-profile-icon.png';
                                                            }}
                                                        />
                                                    </div>
                                                ) : (
                                                    <InitialsAvatar 
                                                        nombre={selectedUser.nombre || 'Usuario'} 
                                                        size="lg" 
                                                    />
                                                )}
                                            </div>
                                            <div>
                                                <h3 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                                                    {selectedUser.nombre} {selectedUser.apellidos}
                                                </h3>
                                                <p className={`text-sm ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                                                    {selectedUser.tipo_Usu || selectedUser.tipo_usuario}
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="mb-6">
                                            <h3 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                                                Editar Información del Usuario
                                            </h3>
                                            
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                                {/* Nombre */}
                                                <div>
                                                    <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                                        Nombre
                                                    </label>
                                                    <input
                                                        type="text"
                                                        name="nombre"
                                                        value={editFormData.nombre}
                                                        onChange={handleEditFormChange}
                                                        className={`w-full rounded-lg shadow-sm border px-3 py-2 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                                                    />
                                                </div>
                                                
                                                {/* Apellidos */}
                                                <div>
                                                    <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                                        Apellidos
                                                    </label>
                                                    <input
                                                        type="text"
                                                        name="apellidos"
                                                        value={editFormData.apellidos}
                                                        onChange={handleEditFormChange}
                                                        className={`w-full rounded-lg shadow-sm border px-3 py-2 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                                                    />
                                                </div>
                                                
                                                {/* Correo */}
                                                <div>
                                                    <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                                        Correo Electrónico
                                                    </label>
                                                    <input
                                                        type="email"
                                                        name="correo"
                                                        value={editFormData.correo}
                                                        onChange={handleEditFormChange}
                                                        className={`w-full rounded-lg shadow-sm border px-3 py-2 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                                                    />
                                                </div>
                                                
                                                {/* Teléfono */}
                                                <div>
                                                    <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                                        Teléfono
                                                    </label>
                                                    <input
                                                        type="text"
                                                        name="telefono"
                                                        value={editFormData.telefono}
                                                        onChange={handleEditFormChange}
                                                        className={`w-full rounded-lg shadow-sm border px-3 py-2 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                                                    />
                                                </div>
                                                
                                                {/* Departamento */}
                                                <div>
                                                    <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                                        Departamento
                                                    </label>
                                                    <input
                                                        type="text"
                                                        name="dpto"
                                                        value={editFormData.dpto}
                                                        onChange={handleEditFormChange}
                                                        className={`w-full rounded-lg shadow-sm border px-3 py-2 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                                                    />
                                                </div>
                                                
                                                {/* Tipo de Usuario */}
                                                <div>
                                                    <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                                        Tipo de Usuario
                                                    </label>
                                                    <select
                                                        name="tipo_usuario"
                                                        value={editFormData.tipo_usuario}
                                                        onChange={handleEditFormChange}
                                                        className={`w-full rounded-lg shadow-sm border px-3 py-2 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                                                    >
                                                        <option value="admin">Administrador</option>
                                                        <option value="empleado">Empleado</option>
                                                        <option value="gestor">Gestor</option>
                                                    </select>
                                                </div>
                                                
                                                {/* ID Avatar (se podría mejorar con un selector de avatares) */}
                                                <div>
                                                    <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                                        ID Avatar
                                                    </label>
                                                    <input
                                                        type="number"
                                                        name="id_avatar"
                                                        value={editFormData.id_avatar}
                                                        onChange={handleEditFormChange}
                                                        className={`w-full rounded-lg shadow-sm border px-3 py-2 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                                                    />
                                                </div>
                                            </div>
                                            
                                            {/* Permitir pausas */}
                                            <div className="mb-4">
                                                <div className="flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        id="permitir_pausas"
                                                        name="permitir_pausas"
                                                        checked={editFormData.permitir_pausas === 1}
                                                        onChange={(e) => {
                                                            // Convertir el valor booleano del checkbox a 0/1
                                                            const numericValue = e.target.checked ? 1 : 0;
                                                            setEditFormData(prev => ({
                                                                ...prev,
                                                                permitir_pausas: numericValue
                                                            }));
                                                        }}
                                                        className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                                                    />
                                                    <label htmlFor="permitir_pausas" className={`ml-2 block text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                                        Permitir pausas en fichajes 
                                                        <span className="ml-2 px-2 py-0.5 rounded text-xs" style={{
                                                            backgroundColor: editFormData.permitir_pausas === 1 ? 'rgba(52, 211, 153, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                                            color: editFormData.permitir_pausas === 1 ? 'rgb(16, 185, 129)' : 'rgb(239, 68, 68)'
                                                        }}>
                                                            {editFormData.permitir_pausas === 1 ? 'Habilitadas' : 'Deshabilitadas'}
                                                        </span>
                                                    </label>
                                                </div>
                                            </div>
                                            
                                            {/* Cambiar contraseña (botón toggle) */}
                                            <div className="mb-4">
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPasswordField(!showPasswordField)}
                                                    className={`px-3 py-1 text-sm rounded-lg flex items-center ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} transition-colors`}
                                                >
                                                    <FaKey className="mr-2" />
                                                    {showPasswordField ? 'Cancelar cambio de contraseña' : 'Cambiar contraseña'}
                                                </button>
                                            </div>
                                            
                                            {/* Campo de contraseña (condicional) */}
                                            {showPasswordField && (
                                                <div className="mb-4">
                                                    <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                                        Nueva Contraseña
                                                    </label>
                                                    <input
                                                        type="password"
                                                        name="password"
                                                        value={editFormData.password}
                                                        onChange={handleEditFormChange}
                                                        className={`w-full rounded-lg shadow-sm border px-3 py-2 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                                                        placeholder="Ingrese nueva contraseña"
                                                    />
                                                </div>
                                            )}
                                            
                                            {/* Botón para guardar cambios */}
                                            <div className="mt-6">
                                                <button
                                                    onClick={handleSaveUserChanges}
                                                    className={`px-6 py-3 rounded-lg font-medium text-white bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-sm transition-all duration-200 flex items-center justify-center`}
                                                >
                                                    <FaSave className="mr-2" />
                                                    Guardar Cambios
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                    
                                    <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 p-4 rounded-lg ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                                        <div className="flex items-start">
                                            <FaIdCard className={`mt-1 mr-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                                            <div>
                                                <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>NIF</p>
                                                <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                                                    {selectedUser.NIF || selectedUser.id}
                                                </p>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-start">
                                            <FaEnvelope className={`mt-1 mr-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                                            <div>
                                                <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Correo</p>
                                                <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                                                    {selectedUser.correo}
                                                </p>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-start">
                                            <FaUserAlt className={`mt-1 mr-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                                            <div>
                                                <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Tipo de Usuario</p>
                                                <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                                                    {selectedUser.tipo_Usu || selectedUser.tipo_usuario}
                                                </p>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-start">
                                            <FaBuilding className={`mt-1 mr-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                                            <div>
                                                <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Departamento</p>
                                                <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                                                    {selectedUser.dpto || 'No asignado'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className={`rounded-lg p-6 ${isDarkMode ? 'bg-blue-900/20' : 'bg-blue-50'} border ${isDarkMode ? 'border-blue-900' : 'border-blue-100'}`}>
                                        <div className="flex items-center mb-4">
                                            <FaUserClock className={`mr-2 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                                            <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                                                Gestión de Horario
                                            </h3>
                                        </div>
                                        
                                        {successMessage && (
                                            <div className="mb-4 p-3 rounded-lg bg-green-100 border border-green-200 text-green-800 flex items-center">
                                                <FaCheckCircle className="text-green-500 mr-2" />
                                                {successMessage}
                                            </div>
                                        )}
                                        
                                        {errorMessage && (
                                            <div className="mb-4 p-3 rounded-lg bg-red-100 border border-red-200 text-red-800 flex items-center">
                                                <FaTimesCircle className="text-red-500 mr-2" />
                                                {errorMessage}
                                            </div>
                                        )}

                                        <div className="mb-4">
                                            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                                Seleccionar Horario
                                            </label>
                                            <div className="flex flex-col sm:flex-row gap-3">
                                                <select
                                                    className={`flex-grow rounded-lg shadow-sm border px-3 py-2 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                                                    value={selectedHorario}
                                                    onChange={handleHorarioChange}
                                                >
                                                    <option value="">Sin horario asignado</option>
                                                    {horarios.map((horario) => (
                                                        <option key={`horario-${horario.id}`} value={horario.id}>
                                                            {horario.nombre} ({horario.hora_inicio} - {horario.hora_fin})
                                                        </option>
                                                    ))}
                                                </select>
                                                <button
                                                    className={`px-4 py-2 rounded-lg font-medium text-white ${selectedUser.id_horario === selectedHorario ? 'bg-gray-500' : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'} shadow-sm transition-all duration-200`}
                                                    onClick={handleAsignarHorario}
                                                    disabled={selectedUser.id_horario === selectedHorario}
                                                >
                                                    {selectedUser.id_horario === selectedHorario ? 'Ya Asignado' : 'Asignar Horario'}
                                                </button>
                                            </div>
                                        </div>

                                        <div className="mt-4">
                                            <h4 className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                                Información del Horario
                                            </h4>
                                            {renderInfoHorario()}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className={`rounded-xl shadow-lg overflow-hidden ${isDarkMode ? 'bg-gray-800' : 'bg-white'} h-full flex flex-col items-center justify-center p-10`}>
                                <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                                    <FaUserClock className={`text-4xl ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                                </div>
                                <h3 className={`text-xl font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                    Seleccione un Usuario
                                </h3>
                                <p className={`text-center max-w-md ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                    Seleccione un usuario de la lista para ver sus detalles y asignar un horario de trabajo
                                </p>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
};

export default AdminUsuarios;
