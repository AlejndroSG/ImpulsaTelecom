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
  const [persistSession, setPersistSession] = useState(false); // Estado para controlar si la sesión debe persistir

  useEffect(() => {
    const verificarUsuario = async () => {
      try {
        // Enfoque drásticamente simplificado: solo usamos localStorage
        const storedUser = localStorage.getItem('user');
        
        // Verificar que storedUser existe y no es "undefined" (como string)
        if (storedUser && storedUser !== "undefined" && storedUser !== "null") {
          try {
            // Usuario encontrado en localStorage
            const userData = JSON.parse(storedUser);
            console.log('Usuario recuperado de localStorage:', userData);
            
            // Verificar que los datos son válidos (teniendo en cuenta que podría ser 'id' o 'NIF')
            if (userData && (userData.id || userData.NIF)) {
              // Asegurar que el usuario tenga ambos campos: id y NIF
              if (!userData.NIF && userData.id) {
                userData.NIF = userData.id; // Usar id como NIF si no hay NIF
              } else if (!userData.id && userData.NIF) {
                userData.id = userData.NIF; // Usar NIF como id si no hay id
              }
              
              // Establecer el usuario desde localStorage
              setUser(userData);
              console.log('Sesión restaurada con éxito desde localStorage');
            } else {
              console.error('Datos de usuario inválidos en localStorage');
              localStorage.removeItem('user'); // Limpiar datos corruptos
            }
            
            // No hacemos verificación con el backend para evitar problemas
            // Esto podría no ser ideal desde el punto de vista de seguridad,
            // pero resolverá el problema inmediato de la persistencia de sesión
          } catch (parseError) {
            console.error('Error al parsear usuario almacenado:', parseError);
            localStorage.removeItem('user');
            setUser(null);
          }
        } else {
          console.log('No hay usuario en localStorage');
          setUser(null);
        }
      } catch (error) {
        console.error('Error en verificarUsuario:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    
    verificarUsuario();
  }, []);

  const login = async (email, password, recordar = false) => {
    let retryCount = 0;
    const maxRetries = 2;
    
    console.log(`Iniciando login con recordar=${recordar}`);
    
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
          
          // Asegurarnos de que tenemos tanto id como NIF
          if (!userData.NIF && userData.id) {
            userData.NIF = userData.id; // Usar id como NIF si no hay NIF
          } else if (!userData.id && userData.NIF) {
            userData.id = userData.NIF; // Usar NIF como id si no hay id
          }
          
          // Guardar el usuario en el estado
          setUser(userData);
          
          // SIEMPRE guardamos en localStorage, independientemente de 'recordar'
          // La opción 'recordar' sólo afectará a cuándo se limpia esta información
          console.log('Guardando usuario en localStorage:', userData);
          localStorage.setItem('user', JSON.stringify(userData));
          localStorage.setItem('recordar', recordar ? 'true' : 'false');
          
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

  const logout = () => {
    setUser(null);
    
    // Limpiar almacenamiento local
    localStorage.removeItem('user');
    localStorage.removeItem('recordar');
    
    // Intentar eliminar la sesión en el servidor
    try {
      axios.post(`${AUTH_API_URL}?action=logout`, {});
    } catch (error) {
      console.error('Error al cerrar sesión en el servidor:', error);
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
