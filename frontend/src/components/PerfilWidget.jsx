import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import InitialsAvatar from './InitialsAvatar';
import { motion } from 'framer-motion';
import axios from 'axios';

const PerfilWidget = () => {
  const { user } = useAuth();
  const { isDarkMode } = useTheme();
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
  
  // Cargar el horario cuando cambia el usuario
  useEffect(() => {
    if (user) {
      fetchHorarioUsuario();
    }
  }, [user, fetchHorarioUsuario]);

  return (
    <motion.div 
      className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-4 rounded-lg shadow-md h-full relative transition-colors duration-300`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="drag-handle absolute top-3 left-3 cursor-move w-4 h-4 flex flex-wrap content-start">
        {[...Array(6)].map((_, i) => (
          <div key={i} className={`w-1 h-1 ${isDarkMode ? 'bg-gray-500' : 'bg-gray-400'} rounded-full m-[0.5px]`}></div>
        ))}
      </div>
      <h3 className={`text-lg font-semibold mb-3 pl-6 ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>Perfil</h3>
      <div className="widget-content">
        <div className="flex items-center">
          <div 
            className="w-20 h-20 rounded-full overflow-hidden flex items-center justify-center"
            style={{ backgroundColor: user?.avatar?.color_fondo || (isDarkMode ? '#374151' : '#f3f4f6') }}
          >
            {user?.avatar ? (
              <img 
                src={user.avatar.ruta} 
                alt={user.nombre || 'Usuario'} 
                className="w-full h-full object-contain"
                onError={(e) => {
                  console.error('Error al cargar imagen de avatar:', user.avatar.ruta);
                  e.target.onerror = null;
                }}
              />
            ) : (
              <InitialsAvatar 
                nombre={user?.nombre || 'Usuario'} 
                size="lg" 
              />
            )}
          </div>
          <div className="ml-4">
            <h4 className={`font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>{user?.nombre || 'Usuario'}</h4>
            <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{user?.tipo_usuario}</p>
          </div>
        </div>
        <div className="mt-4 space-y-2">
          <p className={isDarkMode ? 'text-gray-300' : ''}><span className="font-semibold">Correo:</span> {user?.correo}</p>
          <p className={isDarkMode ? 'text-gray-300' : ''}><span className="font-semibold">Teléfono:</span> {user?.telefono || 'No especificado'}</p>
          
          {/* Información del horario */}
          <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
            <p className={`font-semibold ${isDarkMode ? 'text-gray-300' : ''}`}>Horario:</p>
            {loadingHorario ? (
              <div className="flex items-center py-1">
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500 mr-2"></div>
                <span className="text-sm text-gray-500 dark:text-gray-400">Cargando...</span>
              </div>
            ) : horario ? (
              <div className={`text-sm ${isDarkMode ? 'text-gray-300' : ''}`}>
                <p>{horario.nombre}</p>
                <p>{horario.hora_inicio} - {horario.hora_fin}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Días: {obtenerDiasHorario(horario)}</p>
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">Sin horario asignado</p>
            )}
          </div>
        </div>
        <div className="mt-4">
          <Link 
            to="/perfil" 
            className={`${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-500 hover:text-blue-700'} text-sm font-medium`}
          >
            Editar perfil
          </Link>
        </div>
      </div>
    </motion.div>
  );
};

export default PerfilWidget;
