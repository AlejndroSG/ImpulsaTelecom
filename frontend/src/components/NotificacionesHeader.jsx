import React, { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { FaBell } from 'react-icons/fa'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

const API_URL = 'http://localhost/ImpulsaTelecom/backend/api'

const NotificacionesHeader = () => {
  const { user, token } = useAuth()
  const [notificaciones, setNotificaciones] = useState(0)
  const [mostrarMenu, setMostrarMenu] = useState(false)
  const menuRef = useRef(null)
  const navigate = useNavigate()
  
  // Solo cargar notificaciones si es administrador
  const esAdmin = user && user.rol === 'admin'
  
  // Función para cargar el número de notificaciones no leídas
  const cargarNotificaciones = async () => {
    if (!esAdmin) return
    
    try {
      const response = await axios.get(`${API_URL}/incidencias.php?no_leidas=true`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        withCredentials: false // Deshabilitar explicitamente el envio de cookies
      })
      
      if (response.data.success) {
        setNotificaciones(response.data.total_no_leidas)
      }
    } catch (error) {
      console.error('Error al cargar notificaciones:', error)
    }
  }
  
  // Cargar notificaciones al montar el componente y cada minuto
  useEffect(() => {
    if (esAdmin) {
      cargarNotificaciones()
      
      // Configurar intervalo para actualizar cada 60 segundos
      const intervalo = setInterval(cargarNotificaciones, 60000)
      
      // Limpiar intervalo al desmontar
      return () => clearInterval(intervalo)
    }
  }, [esAdmin, token])
  
  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMostrarMenu(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])
  
  // Ir a la página de gestión de incidencias
  const irAIncidencias = () => {
    navigate('/admin/incidencias')
    setMostrarMenu(false)
  }
  
  // No mostrar nada si no es administrador
  if (!esAdmin) return null
  
  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setMostrarMenu(!mostrarMenu)}
        className="relative p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        aria-label="Notificaciones"
      >
        <FaBell className="text-gray-700 dark:text-gray-300" size={18} />
        {notificaciones > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
            {notificaciones > 99 ? '99+' : notificaciones}
          </span>
        )}
      </button>
      
      {mostrarMenu && (
        <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-gray-800 rounded-md shadow-lg z-20 border border-gray-200 dark:border-gray-700">
          <div className="p-3 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Notificaciones
            </h3>
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {notificaciones > 0 ? (
              <div className="p-4 text-center">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Tienes {notificaciones} {notificaciones === 1 ? 'incidencia nueva' : 'incidencias nuevas'}
                </p>
                <button
                  onClick={irAIncidencias}
                  className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition-colors"
                >
                  Ver todas
                </button>
              </div>
            ) : (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                <p>No tienes notificaciones nuevas</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default NotificacionesHeader
