import React from 'react';

/**
 * Componente que muestra un avatar con las iniciales del usuario
 * @param {string} nombre - Nombre completo del usuario
 * @param {string} className - Clases adicionales para el avatar
 * @param {string} bgColor - Color de fondo personalizado (opcional)
 * @param {string} textColor - Color del texto personalizado (opcional)
 * @param {string} size - Tamaño del avatar ('sm', 'md', 'lg')
 */
const InitialsAvatar = ({ nombre, className = '', bgColor, textColor, size = 'md' }) => {
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
  
  const defaultBgColor = bgColor || getConsistentColor(nombre);
  const defaultTextColor = textColor || '#FFFFFF';
  
  // Asegurarse de que el componente se renderice incluso si nombre es undefined
  const initials = nombre ? getInitials(nombre) : '?';
  
  return (
    <div 
      className={`rounded-full flex items-center justify-center font-semibold ${sizeClasses[size]} ${className}`}
      style={{ backgroundColor: defaultBgColor, color: defaultTextColor }}
    >
      {initials}
    </div>
  );
};

export default InitialsAvatar;
