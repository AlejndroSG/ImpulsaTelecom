import React from 'react'
import { useTheme } from '../context/ThemeContext'

const Footer = ({ className }) => {
  const currentYear = new Date().getFullYear();
  const { isDarkMode } = useTheme();
  
  return (
    <footer className={`${isDarkMode ? 'bg-gray-900 border-gray-700 text-gray-300' : 'bg-gray-100 border-gray-200 text-gray-600'} py-4 px-6 border-t text-center text-sm transition-colors duration-300 ${className || ''}`}>
      <p>&copy; {currentYear} Impulsa Telecom. Todos los derechos reservados.</p>
    </footer>
  )
}

export default Footer