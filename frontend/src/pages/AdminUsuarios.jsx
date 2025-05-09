import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';

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
            // Asegurarse de que NIF existe y es una cadena
            const userNIF = selectedUser.NIF || selectedUser.id;
            
            // Convertir el ID del horario a entero o null si está vacío
            const horarioID = selectedHorario === '' ? null : parseInt(selectedHorario, 10);
            
            console.log('Enviando datos:', { NIF: userNIF, id_horario: horarioID });
            
            const response = await axios.post(
                `${API_URL}/horarios.php?asignar`, 
                {
                    NIF: userNIF,
                    id_horario: horarioID
                },
                { withCredentials: true }
            );

            if (response.data.success) {
                setSuccessMessage('Horario asignado correctamente');
                // Actualizar la lista de usuarios
                fetchUsuarios();
            } else {
                setErrorMessage(`Error al asignar horario: ${response.data.error || 'Error desconocido'}`);
            }
        } catch (err) {
            setErrorMessage(`Error de conexión: ${err.message}`);
            console.error('Error al asignar horario:', err);
        }
    }, [selectedUser, selectedHorario, fetchUsuarios]);

    // Función para obtener los días de la semana de un horario
    const obtenerDiasHorario = useCallback((horario) => {
        if (!horario) return '';
        
        const diasSemana = [
            { id: 'lunes', nombre: 'Lunes' },
            { id: 'martes', nombre: 'Martes' },
            { id: 'miercoles', nombre: 'Miércoles' },
            { id: 'jueves', nombre: 'Jueves' },
            { id: 'viernes', nombre: 'Viernes' },
            { id: 'sabado', nombre: 'Sábado' },
            { id: 'domingo', nombre: 'Domingo' }
        ];
        
        const diasActivos = diasSemana
            .filter(dia => horario[dia.id])
            .map(dia => dia.nombre);
            
        return diasActivos.join(', ');
    }, []);

    // Renderizar información del horario seleccionado
    const renderInfoHorario = useCallback(() => {
        if (!selectedUser || !selectedUser.id_horario) {
            return <p className="text-sm text-gray-500 dark:text-gray-400">No hay horario asignado</p>;
        }

        const horarioSeleccionado = horarios.find(h => h.id === parseInt(selectedUser.id_horario));
        
        if (!horarioSeleccionado) {
            return <p className="text-sm text-gray-500 dark:text-gray-400">Cargando información del horario...</p>;
        }

        return (
            <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-md shadow-inner border border-gray-200 dark:border-gray-600">
                <p className="font-medium text-gray-800 dark:text-white">{horarioSeleccionado.nombre}</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                    Horario: {horarioSeleccionado.hora_inicio} - {horarioSeleccionado.hora_fin}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                    Días: {obtenerDiasHorario(horarioSeleccionado)}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                    Tiempo de pausa: {horarioSeleccionado.tiempo_pausa_permitido} minutos
                </p>
            </div>
        );
    }, [selectedUser, horarios, obtenerDiasHorario]);

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
                <h1 className="text-3xl font-bold mb-6 text-black dark:text-white">Administración de Usuarios</h1>
                
                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Lista de usuarios */}
                    <div className={`md:col-span-1 rounded-xl shadow-lg p-4 ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border-0'}`}>
                        <h2 className={`text-xl font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Usuarios</h2>
                        <div className="overflow-y-auto max-h-[70vh]">
                            {usuarios.length > 0 ? (
                                <ul className={`divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                                    {usuarios.map((usuario) => (
                                        <li 
                                            key={usuario.NIF || usuario.id} 
                                            className={`py-3 px-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition duration-150 ease-in-out ${selectedUser && (selectedUser.NIF === usuario.NIF || selectedUser.id === usuario.id) ? 'bg-blue-50 dark:bg-blue-900/70 border-l-4 border-blue-500' : ''}`}
                                            onClick={() => handleUserSelect(usuario)}
                                        >
                                            <div className="flex items-center justify-between w-full">
                                                <div className="flex-shrink-0">
                                                    {usuario.avatar ? (
                                                        <img 
                                                            src={usuario.avatar.ruta} 
                                                            alt={`Avatar de ${usuario.nombre}`} 
                                                            className="h-10 w-10 rounded-full shadow-sm"
                                                            style={{ backgroundColor: usuario.avatar.color_fondo }}
                                                        />
                                                    ) : (
                                                        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 shadow-sm">
                                                            {usuario.nombre.charAt(0).toUpperCase()}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="ml-3">
                                                    <p className="text-sm font-medium text-gray-800 dark:text-white">{usuario.nombre} {usuario.apellidos}</p>
                                                    <p className="text-xs text-gray-600 dark:text-gray-300">{usuario.correo}</p>
                                                    <p className="text-xs text-gray-600 dark:text-gray-300">
                                                        {usuario.tipo_Usu || usuario.tipo_usuario}
                                                    </p>
                                                </div>
                                                <div className="ml-auto">
                                                    {usuario.id_horario && usuario.id_horario !== 'NULL' && usuario.id_horario !== '0' && usuario.id_horario !== 0 ? (
                                                        <div className="bg-blue-600 text-white text-xs px-2 py-1 rounded shadow-sm">
                                                            {(() => {
                                                                const horario = horarios.find(h => String(h.id) === String(usuario.id_horario));
                                                                return horario ? horario.nombre : `Horario ${usuario.id_horario}`;
                                                            })()}
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-400 text-xs">Sin horario</span>
                                                    )}
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-gray-500 dark:text-gray-400">No hay usuarios disponibles</p>
                            )}
                        </div>
                    </div>

                    {/* Detalles del usuario y asignación de horario */}
                    <div className="md:col-span-2">
                        {selectedUser ? (
                            <div className={`rounded-xl shadow-lg p-6 ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border-0'}`}>
                                <h2 className={`text-2xl font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{selectedUser.nombre} {selectedUser.apellidos}</h2>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">NIF</p>
                                        <p className="font-medium text-gray-800 dark:text-white">{selectedUser.NIF || selectedUser.id}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Correo</p>
                                        <p className="font-medium text-gray-800 dark:text-white">{selectedUser.correo}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Tipo de Usuario</p>
                                        <p className="font-medium text-gray-800 dark:text-white">{selectedUser.tipo_Usu || selectedUser.tipo_usuario}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Departamento</p>
                                        <p className="font-medium text-gray-800 dark:text-white">{selectedUser.dpto || 'No asignado'}</p>
                                    </div>
                                </div>

                                <div className={`border-t pt-4 mt-4 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                                    <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Asignar Horario</h3>
                                    
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

                                    <div className="flex flex-col md:flex-row gap-4 items-end">
                                        <div className="flex-grow">
                                            <label htmlFor="horario" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Horario
                                            </label>
                                            <select
                                                id="horario"
                                                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white shadow-sm"
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
                                        </div>
                                        <button
                                            type="button"
                                            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ease-in-out"
                                            onClick={handleAsignarHorario}
                                        >
                                            Asignar Horario
                                        </button>
                                    </div>

                                    <div className="mt-4">
                                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Información del Horario</h4>
                                        {renderInfoHorario()}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 flex items-center justify-center h-full border border-gray-200 dark:border-gray-700">
                                <p className="text-gray-500 dark:text-gray-400">Seleccione un usuario para ver sus detalles y asignar horario</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminUsuarios;