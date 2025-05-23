import React, { useEffect } from 'react';
import './App.css'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import axios from 'axios'
import Login from './pages/Login'
import Inicio from './pages/Inicio'
import Plantilla from './layout/Plantilla'
import Perfil from './pages/Perfil'
import Fichaje from './pages/Fichaje'

import Tareas from './pages/Tareas'
import Calendario from './pages/Calendario'
import Solicitudes from './pages/Solicitudes'
import AdminUsuarios from './pages/AdminUsuarios'
import AdminFichajes from './pages/AdminFichajes'
import AdminReportes from './pages/AdminReportes'
import AdminMapa from './pages/AdminMapa'
import AdminDocumentos from './pages/AdminDocumentos'
import EventosAdmin from './pages/admin/EventosAdmin'
import Documentacion from './pages/Documentacion'
import { AuthProvider, ProtectedRoute, PublicRoute } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'

function App() {
  // La aplicación ya no requiere verificación de recordatorios
  useEffect(() => {}, []);
  
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

              <Route path="/tareas" element={<Tareas />} />
              <Route path="/calendario" element={<Calendario />} />
              <Route path="/solicitudes" element={<Solicitudes />} />
              <Route path="/documentacion" element={<Documentacion />} />
              <Route path="/admin/usuarios" element={<AdminUsuarios />} />
              <Route path="/admin/fichajes" element={<AdminFichajes />} />
              <Route path="/admin/reportes" element={<AdminReportes />} />
              <Route path="/admin/mapa" element={<AdminMapa />} />
              <Route path="/admin/documentos" element={<AdminDocumentos />} />
              <Route path="/admin/eventos" element={<EventosAdmin />} />
            </Route>
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Router>
      </ThemeProvider>
    </AuthProvider>
  )
}

export default App
