import React from 'react';
import { useTheme } from '../context/ThemeContext';

/**
 * Componente que muestra un avatar con las iniciales del usuario
 * @param {string} nombre - Nombre completo del usuario
 * @param {string} className - Clases adicionales para el avatar
 * @param {string} bgColor - Color de fondo personalizado (opcional)
 * @param {string} textColor - Color del texto personalizado (opcional)
 * @param {string} size - Tamaño del avatar ('sm', 'md', 'lg')
 */
const InitialsAvatar = ({ nombre, className = '', bgColor, textColor, size = 'md' }) => {
  const { isDarkMode } = useTheme();
  
  // Función para obtener las iniciales del nombre completo
  const getInitials = (name) => {
    if (!name) return '?';
    
    // Dividir el nombre por espacios
    const parts = name.split(' ');
    
    // Si solo hay una parte, devolver la primera letra
    if (parts.length === 1) {
      return parts[0].charAt(0).toUpperCase();
    }
    
    // Si hay más partes, tomar la primera letra del primer nombre y la primera letra del último apellido
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };
  
  // Determinar el tamaño del avatar y del texto
  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-20 h-20 text-2xl'
  };
  
  // Generar un color aleatorio pero consistente basado en el nombre
  const getConsistentColor = (name) => {
    if (!name) return '#6B7280'; // Gris por defecto
    
    // Función simple de hash para generar un número basado en el nombre
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    // Convertir el hash a un color hexadecimal
    let color = '#';
    for (let i = 0; i < 3; i++) {
      const value = (hash >> (i * 8)) & 0xFF;
      color += ('00' + value.toString(16)).substr(-2);
    }
    
    return color;
  };
  
  // Ajustar el brillo del color en modo oscuro para que sea más vibrante
  const adjustColorForDarkMode = (color) => {
    if (!isDarkMode) return color;
    
    // Convertir el color hexadecimal a RGB
    const r = parseInt(color.substr(1, 2), 16);
    const g = parseInt(color.substr(3, 2), 16);
    const b = parseInt(color.substr(5, 2), 16);
    
    // Aumentar el brillo y la saturación para modo oscuro
    const brightenFactor = 1.2;
    const newR = Math.min(255, Math.floor(r * brightenFactor));
    const newG = Math.min(255, Math.floor(g * brightenFactor));
    const newB = Math.min(255, Math.floor(b * brightenFactor));
    
    // Convertir de nuevo a hexadecimal
    return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
  };
  
  const defaultBgColor = isDarkMode ? adjustColorForDarkMode(bgColor || getConsistentColor(nombre)) : (bgColor || getConsistentColor(nombre));
  const defaultTextColor = textColor || '#FFFFFF';
  
  // Asegurarse de que el componente se renderice incluso si nombre es undefined
  const initials = nombre ? getInitials(nombre) : '?';
  
  return (
    <div 
      className={`rounded-full flex items-center justify-center font-semibold ${sizeClasses[size]} ${className} ${isDarkMode ? 'dark-glow' : ''}`}
      style={{ 
        backgroundColor: defaultBgColor, 
        color: defaultTextColor,
        transition: 'all 0.3s ease'
      }}
    >
      {initials}
    </div>
  );
};

export default InitialsAvatar;
