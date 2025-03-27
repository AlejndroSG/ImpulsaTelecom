import React, { createContext, useState, useContext, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  // Verificar si el usuario tiene una preferencia guardada
  const savedTheme = localStorage.getItem('theme');
  
  // Verificar si el sistema operativo prefiere el modo oscuro
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  // Estado inicial basado en la preferencia guardada o la preferencia del sistema
  const [isDarkMode, setIsDarkMode] = useState(savedTheme ? savedTheme === 'dark' : prefersDark);
  
  // Aplicar el tema al cargar el componente
  useEffect(() => {
    applyTheme(isDarkMode);
  }, [isDarkMode]);
  
  // Función para aplicar el tema a todo el documento
  const applyTheme = (dark) => {
    // Aplicar clase al body para estilos globales
    if (dark) {
      document.body.classList.add('dark');
      document.documentElement.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
      document.documentElement.classList.remove('dark');
    }
    
    // Guardar preferencia en localStorage
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  };
  
  // Función para cambiar entre modos
  const toggleDarkMode = () => {
    setIsDarkMode(prev => !prev);
  };
  
  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};
