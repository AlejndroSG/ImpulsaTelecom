import React from 'react'
import './App.css'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
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
import { AuthProvider, ProtectedRoute, PublicRoute } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'

function App() {
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
              <Route path="/admin/usuarios" element={<AdminUsuarios />} />
            </Route>
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Router>
      </ThemeProvider>
    </AuthProvider>
  )
}

export default App
