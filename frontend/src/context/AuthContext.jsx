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
        
        // Verificar que la sesión se ha iniciado correctamente
        const sessionCheck = await axios.get(
          'http://localhost/ImpulsaTelecom/backend/controlador.php?action=actual',
          {
            withCredentials: true,
            headers: {
              'Content-Type': 'application/json',
            }
          }
        );
        
        if (sessionCheck.data.error) {
          throw new Error('Error al verificar la sesión: ' + sessionCheck.data.error);
        }
        
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
    // No necesitamos hacer una llamada al backend para cerrar sesión
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {loading ? null : children}
    </AuthContext.Provider>
  );
};

// Componente para rutas protegidas
const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" />;
  }

  return children;
};

// Componente para rutas públicas (accesibles solo si NO está autenticado)
const PublicRoute = ({ children }) => {
  const { user } = useAuth();

  if (user) {
    return <Navigate to="/inicio" />;
  }

  return children;
};

export { ProtectedRoute, PublicRoute };

export default AuthContext;
