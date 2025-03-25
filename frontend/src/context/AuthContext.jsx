import React, { createContext, useState, useContext, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import axios from 'axios';

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
    try {
      // Configurar axios para incluir credenciales
      const response = await axios.post(
        'http://localhost/ImpulsaTelecom/backend/api/usuarios.php?action=login',
        { email, password },
        { 
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );

      if (response.data.success) {
        const userData = response.data.usuario;
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        return { success: true, usuario: userData };
      } else {
        console.error('Error de login (respuesta del servidor):', response.data);
        return { 
          success: false, 
          message: response.data.message || 'Error al iniciar sesión' 
        };
      }
    } catch (error) {
      console.error('Error en la solicitud de login:', error);
      return { 
        success: false, 
        message: 'Error de conexión al servidor: ' + (error.message || 'Desconocido')
      };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  const updateUser = async (userData) => {
    try {
      if (user && user.id) {
        // Si estamos actualizando datos en el servidor
        if (userData.updateServer) {
          delete userData.updateServer; // Eliminar la bandera antes de enviar
          
          const response = await axios.post(
            `http://localhost/ImpulsaTelecom/backend/api/usuarios.php?action=update&id=${user.id}`,
            userData,
            { 
              withCredentials: true,
              headers: {
                'Content-Type': 'application/json',
              }
            }
          );
          
          if (!response.data.success) {
            throw new Error(response.data.message || 'Error al actualizar usuario');
          }
        }
        
        // Actualizar el estado local y localStorage
        const updatedUser = { ...user, ...userData };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        return { success: true };
      } else {
        throw new Error('No hay usuario autenticado');
      }
    } catch (error) {
      console.error('Error al actualizar usuario:', error);
      return { 
        success: false, 
        message: error.message || 'Error al actualizar usuario' 
      };
    }
  };

  const value = {
    user,
    loading,
    login,
    logout,
    updateUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Componente para rutas protegidas
export const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#78bd00]"></div>
      </div>
    );
  }

  if (!user) {
    // Redirigir a la página de login si no hay usuario autenticado
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

// Componente para rutas públicas (accesibles solo si NO está autenticado)
export const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  
  // Usar un valor estático para la redirección en lugar de location.state
  // que podría cambiar en cada renderizado
  const from = location.state?.from?.pathname || '/inicio';

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#78bd00]"></div>
      </div>
    );
  }

  // Si el usuario está autenticado, redirigir a la página de inicio
  return user ? <Navigate to={from} replace state={{}} /> : children;
};

export default AuthContext;
