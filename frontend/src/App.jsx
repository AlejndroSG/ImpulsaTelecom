import React, { useEffect } from 'react';
import './App.css'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import axios from 'axios'
import Login from './pages/Login'
import Inicio from './pages/Inicio'
import Plantilla from './layout/Plantilla'
import Perfil from './pages/Perfil'
import Fichaje from './pages/Fichaje'
import Usuario from './pages/Usuario'
import Tareas from './pages/Tareas'
import Calendario from './pages/Calendario'
import Solicitudes from './pages/Solicitudes'
import AdminUsuarios from './pages/AdminUsuarios'
import AdminRecordatorios from './pages/AdminRecordatorios'
import AdminFichajes from './pages/AdminFichajes'
import AdminReportes from './pages/AdminReportes'
import AdminMapa from './pages/AdminMapa'
import Documentacion from './pages/Documentacion'
import { AuthProvider, ProtectedRoute, PublicRoute } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'

function App() {
  useEffect(() => {
    // API URL para verificar recordatorios
    const API_URL = 'http://localhost/ImpulsaTelecom/backend/api';
    
    // Funciu00f3n para verificar recordatorios
    const checkNotifications = async () => {
      try {
        await axios.get(`${API_URL}/check_recordatorios.php`, { withCredentials: true });
        console.log('✅ Verificaciu00f3n de recordatorios completada');
      } catch (error) {
        // Ignorar errores silenciosamente para no interrumpir la aplicaciu00f3n
      }
    };
    
    // Verificar inmediatamente al cargar la app
    checkNotifications();
    
    // Configurar verificaciu00f3n periu00f3dica cada minuto
    const interval = setInterval(checkNotifications, 60000);
    
    // Limpiar al desmontar la aplicaciu00f3n
    return () => clearInterval(interval);
  }, []);
  
  return (
    <AuthProvider>
      <ThemeProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              }
            />
            
            {/* Rutas protegidas dentro de Plantilla */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Plantilla />
                </ProtectedRoute>
              }
            >
              <Route path="/inicio" element={<Inicio />} />
              <Route path="/perfil" element={<Perfil />} />
              <Route path="/fichaje" element={<Fichaje />} />
              <Route path="/usuario" element={<Usuario />} />
              <Route path="/tareas" element={<Tareas />} />
              <Route path="/calendario" element={<Calendario />} />
              <Route path="/solicitudes" element={<Solicitudes />} />
              <Route path="/documentacion" element={<Documentacion />} />
              <Route path="/admin/usuarios" element={<AdminUsuarios />} />
              <Route path="/admin/recordatorios" element={<AdminRecordatorios />} />
              <Route path="/admin/fichajes" element={<AdminFichajes />} />
              <Route path="/admin/reportes" element={<AdminReportes />} />
              <Route path="/admin/mapa" element={<AdminMapa />} />
            </Route>
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Router>
      </ThemeProvider>
    </AuthProvider>
  )
}

export default App
