import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';

const AdminUsuarios = () => {
    const { user } = useAuth();
    const { isDarkMode } = useTheme();
    const navigate = useNavigate();
    const [usuarios, setUsuarios] = useState([]);
    const [horarios, setHorarios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedUser, setSelectedUser] = useState(null);
    const [selectedHorario, setSelectedHorario] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    const API_URL = 'http://localhost/ImpulsaTelecom/backend/api';

    useEffect(() => {
        // Verificar si el usuario está autenticado y es administrador
        if (!user) {
            navigate('/login');
            return;
        }

        if (user.tipo_usuario !== 'admin') {
            navigate('/');
            return;
        }

        // Cargar usuarios y horarios
        fetchUsuarios();
        fetchHorarios();
    }, [user, navigate]);

    const fetchUsuarios = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_URL}/usuarios.php?action=list`, {
                withCredentials: true
            });

            if (response.data.success) {
                setUsuarios(response.data.usuarios);
            } else {
                setError('Error al cargar usuarios: ' + response.data.error);
            }
        } catch (err) {
            setError('Error de conexión: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchHorarios = async () => {
        try {
            const response = await axios.get(`${API_URL}/horarios.php`, {
                withCredentials: true
            });

            if (response.data.success) {
                setHorarios(response.data.horarios);
            } else {
                setError('Error al cargar horarios: ' + response.data.error);
            }
        } catch (err) {
            setError('Error de conexión: ' + err.message);
        }
    };

    const handleUserSelect = (usuario) => {
        setSelectedUser(usuario);
        setSelectedHorario(usuario.id_horario || '');
        // Limpiar mensajes
        setSuccessMessage('');
        setErrorMessage('');
    };

    const handleHorarioChange = (e) => {
        setSelectedHorario(e.target.value);
    };

    const handleAsignarHorario = async () => {
        if (!selectedUser) return;

        try {
            const response = await axios.post(
                `${API_URL}/horarios.php?asignar`, 
                {
                    NIF: selectedUser.NIF,
                    id_horario: selectedHorario === '' ? null : parseInt(selectedHorario)
                },
                { withCredentials: true }
            );

            if (response.data.success) {
                setSuccessMessage('Horario asignado correctamente');
                // Actualizar la lista de usuarios
                fetchUsuarios();
            } else {
                setErrorMessage('Error al asignar horario: ' + response.data.error);
            }
        } catch (err) {
            setErrorMessage('Error de conexión: ' + err.message);
        }
    };

    if (loading) {
        return (
            <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-800'} p-6`}>
                <div className="flex justify-center items-center h-full">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
            </div>
        );
    }

    return (
        <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-800'} p-6`}>
            <div className="container mx-auto">
                <h1 className="text-3xl font-bold mb-6">Administración de Usuarios</h1>
                
                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Lista de usuarios */}
                    <div className="md:col-span-1 bg-white rounded-lg shadow-md p-4 dark:bg-gray-800">
                        <h2 className="text-xl font-semibold mb-4">Usuarios</h2>
                        <div className="overflow-y-auto max-h-[70vh]">
                            {usuarios.length > 0 ? (
                                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {usuarios.map((usuario) => (
                                        <li 
                                            key={usuario.NIF} 
                                            className={`py-3 px-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded ${selectedUser && selectedUser.NIF === usuario.NIF ? 'bg-blue-50 dark:bg-blue-900' : ''}`}
                                            onClick={() => handleUserSelect(usuario)}
                                        >
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0">
                                                    {usuario.avatar ? (
                                                        <img 
                                                            src={usuario.avatar.ruta} 
                                                            alt={usuario.nombre} 
                                                            className="h-10 w-10 rounded-full"
                                                            style={{ backgroundColor: usuario.avatar.color_fondo }}
                                                        />
                                                    ) : (
                                                        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600">
                                                            {usuario.nombre.charAt(0).toUpperCase()}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="ml-3">
                                                    <p className="text-sm font-medium">{usuario.nombre} {usuario.apellidos}</p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">{usuario.correo}</p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                                        {usuario.tipo_Usu || usuario.tipo_usuario}
                                                    </p>
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
                            <div className="bg-white rounded-lg shadow-md p-6 dark:bg-gray-800">
                                <h2 className="text-2xl font-semibold mb-4">{selectedUser.nombre} {selectedUser.apellidos}</h2>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                    <div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">NIF</p>
                                        <p className="font-medium">{selectedUser.NIF}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Correo</p>
                                        <p className="font-medium">{selectedUser.correo}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Tipo de Usuario</p>
                                        <p className="font-medium">{selectedUser.tipo_Usu || selectedUser.tipo_usuario}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Departamento</p>
                                        <p className="font-medium">{selectedUser.dpto || 'No asignado'}</p>
                                    </div>
                                </div>

                                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                                    <h3 className="text-lg font-semibold mb-4">Asignar Horario</h3>
                                    
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
                                                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600"
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
                                            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                            onClick={handleAsignarHorario}
                                        >
                                            Asignar Horario
                                        </button>
                                    </div>

                                    <div className="mt-4">
                                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Información del Horario</h4>
                                        {selectedHorario ? (
                                            <div className="bg-gray-50 p-3 rounded-md dark:bg-gray-700">
                                                {horarios.find(h => h.id === parseInt(selectedHorario)) ? (
                                                    <div>
                                                        <p className="font-medium">
                                                            {horarios.find(h => h.id === parseInt(selectedHorario)).nombre}
                                                        </p>
                                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                                            Horario: {horarios.find(h => h.id === parseInt(selectedHorario)).hora_inicio} - 
                                                            {horarios.find(h => h.id === parseInt(selectedHorario)).hora_fin}
                                                        </p>
                                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                                            Días: {
                                                                // Obtener el horario seleccionado una sola vez para evitar múltiples búsquedas
                                                                (() => {
                                                                    const horario = horarios.find(h => h.id === parseInt(selectedHorario));
                                                                    if (!horario) return '';
                                                                    
                                                                    // Crear un array de días y renderizarlo como string
                                                                    const dias = [];
                                                                    if (horario.lunes) dias.push('Lunes');
                                                                    if (horario.martes) dias.push('Martes');
                                                                    if (horario.miercoles) dias.push('Miércoles');
                                                                    if (horario.jueves) dias.push('Jueves');
                                                                    if (horario.viernes) dias.push('Viernes');
                                                                    if (horario.sabado) dias.push('Sábado');
                                                                    if (horario.domingo) dias.push('Domingo');
                                                                    
                                                                    // Unir los días con coma en lugar de renderizar como elementos separados
                                                                    return dias.join(', ');
                                                                })()
                                                            }
                                                        </p>
                                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                                            Tiempo de pausa: {horarios.find(h => h.id === parseInt(selectedHorario)).tiempo_pausa_permitido} minutos
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <p>Cargando información del horario...</p>
                                                )}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-gray-500 dark:text-gray-400">No hay horario asignado</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white rounded-lg shadow-md p-6 dark:bg-gray-800 flex items-center justify-center h-full">
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