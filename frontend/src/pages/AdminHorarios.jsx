import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaClock, FaPlus, FaEdit, FaTrash, FaCheckCircle, FaTimesCircle, FaExclamationTriangle } from 'react-icons/fa';

// URL base para las peticiones API
const API_URL = 'http://localhost/ImpulsaTelecom/backend/api';

const AdminHorarios = () => {
    const { user } = useAuth();
    const { isDarkMode } = useTheme();
    const navigate = useNavigate();
    
    // Estados para gestionar datos y UI
    const [horarios, setHorarios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    
    // Estado para el modal de creación/edición
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [selectedHorario, setSelectedHorario] = useState(null);
    
    // Estado para confirmación de eliminación
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    
    // Estado del formulario
    const [formData, setFormData] = useState({
        nombre: '',
        hora_inicio: '',
        hora_fin: '',
        descripcion: ''
    });

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
        fetchHorarios();
    }, [user, navigate]);

    // Función para cargar horarios desde la API
    const fetchHorarios = useCallback(async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_URL}/horarios.php`, {
                withCredentials: true
            });

            if (response.data.success) {
                setHorarios(response.data.horarios || []);
                console.log('Horarios cargados:', response.data.horarios);
            } else {
                setError(`Error al cargar horarios: ${response.data.error || 'Error desconocido'}`);
            }
        } catch (err) {
            setError(`Error de conexión: ${err.message}`);
            console.error('Error al cargar horarios:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    // Manejar cambios en el formulario
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Abrir modal para crear nuevo horario
    const handleOpenCreateModal = () => {
        setFormData({
            nombre: '',
            hora_inicio: '',
            hora_fin: '',
            descripcion: ''
        });
        setIsEditing(false);
        setShowModal(true);
    };

    // Abrir modal para editar un horario existente
    const handleOpenEditModal = (horario) => {
        setFormData({
            id: horario.id,
            nombre: horario.nombre || '',
            hora_inicio: horario.hora_inicio || '',
            hora_fin: horario.hora_fin || '',
            descripcion: horario.descripcion || ''
        });
        setSelectedHorario(horario);
        setIsEditing(true);
        setShowModal(true);
    };

    // Confirmar eliminación de un horario
    const handleConfirmDelete = (horario) => {
        setSelectedHorario(horario);
        setShowDeleteConfirm(true);
    };

    // Guardar horario (crear o actualizar)
    const handleSaveHorario = async () => {
        try {
            // Validación básica
            if (!formData.nombre || !formData.hora_inicio || !formData.hora_fin) {
                setErrorMessage('Por favor, completa todos los campos obligatorios');
                return;
            }

            let response;
            
            if (isEditing) {
                // Actualizar horario existente
                response = await axios.put(`${API_URL}/horarios.php?id=${formData.id}`, formData, {
                    withCredentials: true
                });
            } else {
                // Crear nuevo horario
                response = await axios.post(`${API_URL}/horarios.php`, formData, {
                    withCredentials: true
                });
            }

            if (response.data.success) {
                setSuccessMessage(isEditing ? 'Horario actualizado correctamente' : 'Horario creado correctamente');
                setShowModal(false);
                fetchHorarios(); // Recargar la lista
                
                // Limpiar el mensaje después de un tiempo
                setTimeout(() => {
                    setSuccessMessage('');
                }, 3000);
            } else {
                setErrorMessage(`Error: ${response.data.error || 'Error desconocido'}`);
            }
        } catch (err) {
            setErrorMessage(`Error: ${err.message}`);
            console.error('Error al guardar horario:', err);
        }
    };

    // Eliminar horario
    const handleDeleteHorario = async () => {
        if (!selectedHorario) return;
        
        try {
            // Mostrar indicador de carga
            setLoading(true);
            console.log(`Intentando eliminar horario con ID: ${selectedHorario.id}`);
            
            const response = await axios.delete(`${API_URL}/horarios.php?id=${selectedHorario.id}`, {
                withCredentials: true
            });

            console.log('Respuesta del servidor:', response.data);
            
            if (response.data.success) {
                setSuccessMessage('Horario eliminado correctamente');
                setShowDeleteConfirm(false);
                await fetchHorarios(); // Recargar la lista inmediatamente y esperar a que termine
                
                // Limpiar el mensaje después de un tiempo
                setTimeout(() => {
                    setSuccessMessage('');
                }, 3000);
            } else {
                setErrorMessage(`Error: ${response.data.error || 'Error desconocido'}`);
                console.error('Error del servidor:', response.data.error);
            }
        } catch (err) {
            setErrorMessage(`Error: ${err.message}`);
            console.error('Error al eliminar horario:', err);
            
            // Intentar obtener más detalles del error
            if (err.response) {
                console.error('Datos de la respuesta de error:', err.response.data);
                console.error('Estado HTTP:', err.response.status);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`p-6 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'}`}
        >
            <h1 className="text-2xl font-bold mb-6 flex items-center">
                <FaClock className="mr-2 text-blue-500" />
                Administración de Horarios
            </h1>

            {/* Mensajes de éxito o error */}
            {successMessage && (
                <div className={`p-4 mb-4 rounded-lg flex items-center ${isDarkMode ? 'bg-green-900 bg-opacity-20 text-green-300' : 'bg-green-50 text-green-800'}`}>
                    <FaCheckCircle className="mr-2" />
                    {successMessage}
                </div>
            )}
            
            {errorMessage && (
                <div className={`p-4 mb-4 rounded-lg flex items-center ${isDarkMode ? 'bg-red-900 bg-opacity-20 text-red-300' : 'bg-red-50 text-red-800'}`}>
                    <FaTimesCircle className="mr-2" />
                    {errorMessage}
                </div>
            )}

            {/* Botón para añadir horario */}
            <div className="mb-4">
                <button 
                    onClick={handleOpenCreateModal}
                    className={`px-4 py-2 rounded-lg flex items-center
                        ${isDarkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white`}
                >
                    <FaPlus className="mr-2" /> Crear Nuevo Horario
                </button>
            </div>

            {/* Lista de horarios */}
            <div className={`bg-opacity-80 rounded-lg shadow-md overflow-hidden
                ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className={`${isDarkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-50 text-gray-700'}`}>
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Nombre</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Hora Inicio</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Hora Fin</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Descripción</th>
                                <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-4 text-center">
                                        <div className="flex justify-center">
                                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                                        </div>
                                    </td>
                                </tr>
                            ) : horarios.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-10 text-center">
                                        <div className="flex flex-col items-center justify-center">
                                            <FaClock className={`text-4xl mb-3 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                                            <p className="mb-2 font-medium">No hay horarios configurados todavía</p>
                                            <p className="text-sm opacity-70 mb-4 max-w-md">Necesitas crear al menos un horario para poder asignarlo a los empleados</p>
                                            <button 
                                                onClick={handleOpenCreateModal}
                                                className={`px-4 py-2 rounded-lg flex items-center
                                                    ${isDarkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white`}
                                            >
                                                <FaPlus className="mr-2" /> Crear Mi Primer Horario
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                horarios.map((horario) => (
                                    <tr key={horario.id} className={`${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="font-medium">{horario.nombre}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {horario.hora_inicio}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {horario.hora_fin}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="truncate max-w-xs">{horario.descripcion || '-'}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <div className="flex justify-center space-x-2">
                                                <button 
                                                    onClick={() => handleOpenEditModal(horario)}
                                                    className={`p-2 rounded-full ${isDarkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'}`}
                                                    title="Editar"
                                                >
                                                    <FaEdit className="text-blue-500" />
                                                </button>
                                                <button 
                                                    onClick={() => handleConfirmDelete(horario)}
                                                    className={`p-2 rounded-full ${isDarkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'}`}
                                                    title="Eliminar"
                                                >
                                                    <FaTrash className="text-red-500" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal para crear/editar horario */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className={`rounded-lg shadow-xl w-full max-w-md p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                        <h3 className="text-lg font-bold mb-4">{isEditing ? 'Editar Horario' : 'Crear Nuevo Horario'}</h3>
                        
                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-1">Nombre del Horario*</label>
                            <input
                                type="text"
                                name="nombre"
                                value={formData.nombre}
                                onChange={handleInputChange}
                                className={`w-full p-2 rounded-md border ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                                placeholder="Ej: Turno Mañana"
                            />
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-1">Hora de Inicio*</label>
                            <input
                                type="time"
                                name="hora_inicio"
                                value={formData.hora_inicio}
                                onChange={handleInputChange}
                                className={`w-full p-2 rounded-md border ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                            />
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-1">Hora de Fin*</label>
                            <input
                                type="time"
                                name="hora_fin"
                                value={formData.hora_fin}
                                onChange={handleInputChange}
                                className={`w-full p-2 rounded-md border ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                            />
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-medium mb-1">Descripción</label>
                            <textarea
                                name="descripcion"
                                value={formData.descripcion}
                                onChange={handleInputChange}
                                rows="3"
                                className={`w-full p-2 rounded-md border ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                                placeholder="Descripción opcional del horario"
                            ></textarea>
                        </div>

                        <div className="flex justify-end space-x-2">
                            <button 
                                onClick={() => setShowModal(false)}
                                className={`px-4 py-2 rounded-md ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={handleSaveHorario}
                                className="px-4 py-2 rounded-md bg-blue-500 hover:bg-blue-600 text-white"
                            >
                                {isEditing ? 'Actualizar' : 'Crear'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de confirmación para eliminar */}
            {showDeleteConfirm && selectedHorario && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className={`rounded-lg shadow-xl w-full max-w-md p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                        <div className="flex items-center mb-4 text-yellow-500">
                            <FaExclamationTriangle className="mr-2" size={24} />
                            <h3 className="text-lg font-bold">Confirmar eliminación</h3>
                        </div>
                        
                        <p className="mb-6">
                            ¿Estás seguro que deseas eliminar el horario <strong>{selectedHorario.nombre}</strong>? 
                            Esta acción no se puede deshacer y podría afectar a los usuarios que tengan este horario asignado.
                        </p>

                        <div className="flex justify-end space-x-2">
                            <button 
                                onClick={() => setShowDeleteConfirm(false)}
                                className={`px-4 py-2 rounded-md ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={handleDeleteHorario}
                                className="px-4 py-2 rounded-md bg-red-500 hover:bg-red-600 text-white"
                            >
                                Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </motion.div>
    );
};

export default AdminHorarios;
