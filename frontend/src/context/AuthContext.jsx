import React, { createContext, useState, useContext, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import axios from 'axios';

// Configuración global de axios
axios.defaults.withCredentials = true;
axios.defaults.timeout = 30000; // 30 segundos

// URLs del backend (ajustar según la configuración de XAMPP)
const API_BASE_URL = 'http://localhost/ImpulsaTelecom/backend';
const AUTH_API_URL = `${API_BASE_URL}/api/usuarios.php`;
const CONTROLLER_API_URL = `${API_BASE_URL}/controlador.php`;

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar si hay un usuario en localStorage al cargar la aplicación
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Error al parsear usuario almacenado:', error);
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    let retryCount = 0;
    const maxRetries = 2;
    
    const attemptLogin = async () => {
      try {
        // Configurar axios para incluir credenciales
        const response = await axios.post(
          `${AUTH_API_URL}?action=login`,
          { email, password },
          { 
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        if (response.data.success) {
          const userData = response.data.usuario;
          setUser(userData);
          localStorage.setItem('user', JSON.stringify(userData));
          
          // No verificamos la sesión para evitar más timeouts
          return { success: true, usuario: userData };
        } else {
          console.error('Error de login (respuesta del servidor):', response.data);
          return { 
            success: false, 
            message: response.data.message || 'Error al iniciar sesión'
          };
        }
      } catch (error) {
        console.error(`Intento ${retryCount + 1}: Error en la solicitud de login:`, error);
        
        if (retryCount < maxRetries && (error.code === 'ECONNABORTED' || error.message.includes('timeout'))) {
          retryCount++;
          console.log(`Reintentando login (${retryCount}/${maxRetries})...`);
          return await attemptLogin(); // Reintentar
        }
        
        return { 
          success: false, 
          message: 'Error de conexión al servidor. Comprueba tu conexión o inténtalo más tarde.'
        };
      }
    };
    
    return await attemptLogin();
  };

  const logout = async () => {
    try {
      // Intentar cerrar sesión en el backend
      await axios.post(
        `${CONTROLLER_API_URL}?action=logout`,
        {},
      );
    } catch (error) {
      console.error('Error al cerrar sesión en el servidor:', error);
      // Continuar con el cierre de sesión local incluso si falla en el backend
    } finally {
      // Siempre limpiar los datos locales
      setUser(null);
      localStorage.removeItem('user');
    }
  };

  // Función para actualizar los datos del usuario
  const updateUser = (userData) => {
    try {
      // Si se pasa un objeto parcial, combinarlo con el usuario actual
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      return true;
    } catch (error) {
      console.error('Error al actualizar datos del usuario:', error);
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser }}>
      {loading ? null : children}
    </AuthContext.Provider>
  );
};

// Componente para rutas protegidas
const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    // Redirigir a login, pero guardar la ubicación actual para volver después si es necesario
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return children;
};

// Componente para rutas públicas (accesibles solo si NO está autenticado)
const PublicRoute = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();
  
  if (user) {
    // Si hay un 'from' en el estado, volver a esa página, de lo contrario ir a inicio
    const destination = location.state?.from || '/inicio';
    return <Navigate to={destination} replace />;
  }

  return children;
};

export { ProtectedRoute, PublicRoute };

export default AuthContext;
