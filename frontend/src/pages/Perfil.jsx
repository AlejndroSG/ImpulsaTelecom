import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AvatarSelector from '../components/AvatarSelector';
import { useAuth } from '../context/AuthContext';

const Perfil = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  
  const [formData, setFormData] = useState({
    nombre: user?.nombre || '',
    correo: user?.correo || '',
    telefono: user?.telefono || '',
    password: '',
    confirmarPassword: '',
    permitir_pausas: user?.permitir_pausas !== undefined ? user.permitir_pausas : 0,
  });
  
  const [selectedAvatar, setSelectedAvatar] = useState(user?.id_avatar || null);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mensaje, setMensaje] = useState(null);
  const [horario, setHorario] = useState(null);
  const [loadingHorario, setLoadingHorario] = useState(false);
  
  // Función para obtener el horario del usuario
  const fetchHorarioUsuario = useCallback(async () => {
    if (!user || !user.id) return;
    
    try {
      setLoadingHorario(true);
      const response = await axios.get(
        `http://localhost/ImpulsaTelecom/backend/api/horarios.php?usuario=${user.NIF || user.id}`,
        { withCredentials: true }
      );
      
      if (response.data.success) {
        setHorario(response.data.horario);
      } else {
        setHorario(null);
      }
    } catch (err) {
      console.error('Error al cargar horario del usuario:', err);
      setHorario(null);
    } finally {
      setLoadingHorario(false);
    }
  }, [user]);

  // Actualizar el formulario cuando cambia el usuario
  useEffect(() => {
    if (user) {
      // Mostrar en consola para debugging
      console.log('Usuario completo recibido:', user);
      console.log('Valor de permitir_pausas recibido:', user.permitir_pausas);
      console.log('Tipo de dato de permitir_pausas:', typeof user.permitir_pausas);
      
      // Convertir explícitamente a número para asegurar consistencia
      const pausasValue = Number(user.permitir_pausas);
      console.log('Valor convertido a Number:', pausasValue);
      
      setFormData({
        nombre: user.nombre || '',
        correo: user.correo || '',
        telefono: user.telefono || '',
        password: '',
        confirmarPassword: '',
        permitir_pausas: pausasValue, // Usar el valor explícitamente convertido a número
      });
      
      // Log después de establecer el estado
      setTimeout(() => {
        console.log('Valor en formData después de setFormData:', formData.permitir_pausas);
      }, 0);
      
      setSelectedAvatar(user.id_avatar || null);
      
      // Cargar el horario del usuario
      fetchHorarioUsuario();
    }
  }, [user, fetchHorarioUsuario]);
  
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const toggleModoEdicion = () => {
    setModoEdicion(!modoEdicion);
    // Si se cancela la edición, restaurar los valores originales
    if (modoEdicion) {
      setFormData({
        nombre: user?.nombre || '',
        correo: user?.correo || '',
        telefono: user?.telefono || '',
        password: '',
        confirmarPassword: '',
        permitir_pausas: user?.permitir_pausas !== undefined ? user.permitir_pausas : true,
      });
      setSelectedAvatar(user?.id_avatar || null);
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validar que las contraseñas coincidan si se están cambiando
    if (formData.password && formData.password !== formData.confirmarPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Preparar datos para enviar
      const datosActualizados = {
        nombre: formData.nombre,
        correo: formData.correo,
        telefono: formData.telefono,
        id_avatar: selectedAvatar,
        permitir_pausas: formData.permitir_pausas
      };
      console.log(datosActualizados)
      // Solo incluir contraseña si se ha ingresado una nueva
      if (formData.password) {
        datosActualizados.password = formData.password;
      }
      
      // Construir la URL completa para la API
      const apiUrl = `http://localhost/ImpulsaTelecom/backend/api/usuarios.php?action=update&id=${user.id}`;
      
      const response = await axios.post(apiUrl, datosActualizados);
      
      if (response.data.success) {
        setMensaje('Perfil actualizado correctamente');
        setModoEdicion(false);
        
        // Actualizar los datos del usuario en el contexto
        const usuarioActualizado = {
          ...user,
          ...datosActualizados
        };
        
        // Eliminar la contraseña del objeto actualizado
        delete usuarioActualizado.password;
        
        // Actualizar el usuario en el contexto de autenticación
        updateUser(usuarioActualizado);
        
        // Si se cambió el avatar, necesitamos obtener la información actualizada
        if (selectedAvatar !== user.id_avatar) {
          if (selectedAvatar === null) {
            // Si se seleccionó "usar iniciales", establecer avatar a null
            updateUser({ avatar: null });
          } else {
            try {
              const avatarResponse = await axios.get(`http://localhost/ImpulsaTelecom/backend/api/avatares.php?id=${selectedAvatar}`);
              if (avatarResponse.data && !avatarResponse.data.error) {
                // Asegurarse de que la ruta sea absoluta
                let avatarData = avatarResponse.data;
                if (!avatarData.ruta.startsWith('http')) {
                  avatarData.ruta = 'http://localhost/ImpulsaTelecom/frontend' + avatarData.ruta;
                }
                // Guardar solo la información necesaria del avatar, sin sobrescribir el nombre del usuario
                updateUser({ 
                  avatar: {
                    id: avatarData.id,
                    ruta: avatarData.ruta,
                    color_fondo: avatarData.color_fondo,
                    categoria: avatarData.categoria
                  }
                });
              }
            } catch (err) {
              console.error('Error al obtener información del avatar:', err);
            }
          }
        }
      } else {
        setError(response.data.message || 'Error al actualizar el perfil');
      }
    } catch (err) {
      console.error('Error al actualizar perfil:', err);
      setError('Error de conexión al servidor');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-800">Mi Perfil</h1>
          <button
            onClick={toggleModoEdicion}
            className="inline-flex items-center px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Editar Perfil
          </button>
        </div>

        {!modoEdicion ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Columna del Avatar */}
              <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                  {user.avatar ? (
                    <div 
                      className="w-40 h-40 rounded-full border-4 border-blue-100 overflow-hidden"
                      style={{ backgroundColor: user.avatar.color_fondo }}
                    >
                      <img 
                        src={user.avatar.ruta} 
                        alt={user.nombre}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="w-40 h-40 rounded-full border-4 border-blue-100 bg-blue-50 flex items-center justify-center">
                      <span className="text-6xl font-bold text-blue-300">
                        {formData.nombre ? formData.nombre[0].toUpperCase() : 'U'}
                      </span>
                    </div>
                  )}
                  <div className="absolute -bottom-2 -right-2 bg-green-400 w-6 h-6 rounded-full border-2 border-white"></div>
                </div>
                <div className="text-center">
                  <h2 className="text-xl font-bold text-gray-800">{formData.nombre}</h2>
                  <p className="text-sm text-green-600 font-medium">Online</p>
                </div>
              </div>

              {/* Columna de Información Personal */}
              <div className="md:col-span-2 space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Información Personal</h3>
                  <div className="mt-2 grid grid-cols-1 gap-4">
                    <div>
                      <span className="block text-sm font-medium text-gray-700">Nombre completo</span>
                      <span className="block mt-1 text-gray-900">{formData.nombre}</span>
                    </div>
                    <div>
                      <span className="block text-sm font-medium text-gray-700">Correo electrónico</span>
                      <span className="block mt-1 text-gray-900">{formData.correo}</span>
                    </div>
                    <div>
                      <span className="block text-sm font-medium text-gray-700">Teléfono</span>
                      <span className="block mt-1 text-gray-900">{formData.telefono || 'No especificado'}</span>
                    </div>
                    <div>
                      <span className="block text-sm font-medium text-gray-700">Pausas en fichajes</span>
                      <span className="block mt-1">
                        {/* Debugging info - se puede quitar en producción */}
                        <span className="hidden">Valor en DB: {JSON.stringify(formData.permitir_pausas)}</span>
                        
                        <span className="px-2 py-1 rounded-full text-xs font-medium" style={{
                          backgroundColor: Number(formData.permitir_pausas) === 1 ? 'rgba(52, 211, 153, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                          color: Number(formData.permitir_pausas) === 1 ? 'rgb(16, 185, 129)' : 'rgb(239, 68, 68)'
                        }}>
                          {Number(formData.permitir_pausas) === 1 ? 'Habilitadas' : 'Deshabilitadas'}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6">
                  <h3 className="text-sm font-medium text-gray-500">Horario Asignado</h3>
                  <div className="mt-2">
                    {loadingHorario ? (
                      <div className="flex items-center justify-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
                      </div>
                    ) : horario ? (
                      <div className="bg-gray-50 p-3 rounded-md">
                        <p className="font-medium">{horario.nombre}</p>
                        <p className="text-sm text-gray-600">
                          Horario: {horario.hora_inicio} - {horario.hora_fin}
                        </p>
                        <p className="text-sm text-gray-600">
                          Días: {obtenerDiasHorario(horario)}
                        </p>
                        <p className="text-sm text-gray-600">
                          Tiempo de pausa: {horario.tiempo_pausa_permitido} minutos
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No tienes un horario asignado</p>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Seguridad</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Contraseña</p>
                        <p className="font-medium text-gray-800">••••••••</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {mensaje && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-600 text-sm">{mensaje}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-800 mb-4">Información Personal</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                      <input
                        type="text"
                        name="nombre"
                        value={formData.nombre}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        disabled={!modoEdicion}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
                      <input
                        type="email"
                        name="correo"
                        value={formData.correo}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        disabled={!modoEdicion}
                      />
                    </div>
                    <div className="mb-4">
                      <label htmlFor="telefono" className="block text-sm font-medium text-gray-700 mb-1">
                        Teléfono
                      </label>
                      <input
                        type="tel"
                        id="telefono"
                        name="telefono"
                        value={formData.telefono}
                        onChange={handleChange}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Tu número de teléfono"
                      />
                    </div>
                    <div className="mb-4">
                      <div className="flex items-center justify-between">
                        <span className="block text-sm font-medium text-gray-700">
                          Pausas en fichajes
                        </span>
                        <div className="px-3 py-1 rounded-full text-xs font-medium" style={{ 
                          backgroundColor: formData.permitir_pausas ? 'rgba(52, 211, 153, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                          color: formData.permitir_pausas ? 'rgb(16, 185, 129)' : 'rgb(239, 68, 68)'
                        }}>
                          {formData.permitir_pausas ? 'Habilitadas' : 'Deshabilitadas'}
                        </div>
                      </div>
                      <p className="mt-1 text-sm text-gray-500">
                        Esta configuración solo puede ser modificada por un administrador.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h2 className="text-lg font-semibold text-gray-800 mb-4">Avatar</h2>
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <AvatarSelector
                      selectedAvatar={selectedAvatar}
                      onSelectAvatar={setSelectedAvatar}
                      disabled={!modoEdicion}
                    />
                  </div>
                </div>
              </div>

              {modoEdicion && (
                <div className="border-t border-gray-200 pt-6">
                  <h2 className="text-lg font-semibold text-gray-800 mb-4">Cambiar Contraseña</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nueva Contraseña</label>
                      <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Dejar en blanco para mantener la actual"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar Contraseña</label>
                      <input
                        type="password"
                        name="confirmarPassword"
                        value={formData.confirmarPassword}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Confirmar nueva contraseña"
                      />
                    </div>
                  </div>
                </div>
              )}

              {modoEdicion && (
                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={toggleModoEdicion}
                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    disabled={loading}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    disabled={loading}
                  >
                    {loading ? 'Guardando...' : 'Guardar Cambios'}
                  </button>
                </div>
              )}
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default Perfil;
