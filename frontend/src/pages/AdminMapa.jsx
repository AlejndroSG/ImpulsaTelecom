import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaMap, FaMapMarkedAlt, FaMapMarkerAlt, FaUser, FaBuilding, FaInfoCircle, FaSync } from 'react-icons/fa';
import { useTheme } from '../context/ThemeContext';
import MapaWidget from '../components/MapaWidget';

const AdminMapa = () => {
  const { isDarkMode } = useTheme();
  const [activeTab, setActiveTab] = useState('mapa'); // 'mapa' o 'leyenda'

  // Animación para la entrada de la página
  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  };

  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
      transition={{ duration: 0.3 }}
      className={`p-6 min-h-[calc(100vh-4rem)] ${isDarkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-800'}`}
    >
      {/* Cabecera */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <div className="flex items-center gap-3">
          <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${isDarkMode ? 'bg-indigo-900 text-indigo-300' : 'bg-indigo-100 text-indigo-600'}`}>
            <FaMapMarkedAlt className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Mapa de Personal</h1>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Visualización en tiempo real de la ubicación de los empleados
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className={`flex rounded-lg overflow-hidden ${isDarkMode ? 'bg-gray-800' : 'bg-gray-200'}`}>
          <button
            onClick={() => setActiveTab('mapa')}
            className={`px-4 py-2 flex items-center gap-2 ${activeTab === 'mapa' ? 
              (isDarkMode ? 'bg-indigo-700 text-white' : 'bg-indigo-600 text-white') : 
              (isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-300')}`}
          >
            <FaMap /> Mapa
          </button>
          <button
            onClick={() => setActiveTab('leyenda')}
            className={`px-4 py-2 flex items-center gap-2 ${activeTab === 'leyenda' ? 
              (isDarkMode ? 'bg-indigo-700 text-white' : 'bg-indigo-600 text-white') : 
              (isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-300')}`}
          >
            <FaInfoCircle /> Leyenda
          </button>
        </div>
      </div>

      {/* Contenido principal */}
      <div className={`rounded-xl shadow-lg overflow-hidden border ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
        {activeTab === 'mapa' ? (
          <div>
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-lg font-semibold">Ubicaciones de personal</h2>
              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                <FaMapMarkerAlt className="text-red-500 mr-1" /> Última actualización: {new Date().toLocaleTimeString()}
              </div>
            </div>
            <div>
              {/* Aquí integramos el componente de mapa con modo administrador */}
              <MapaWidget admin={true} />
            </div>
          </div>
        ) : (
          <div className="p-6">
            <h2 className="text-xl font-bold mb-4">Leyenda del Mapa</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className={`rounded-lg p-4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <FaMapMarkerAlt className="text-green-500" /> Marcadores
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-center gap-2">
                    <span className="inline-block w-4 h-4 rounded-full bg-green-500"></span>
                    <span>Oficina central de ImpulsaTelecom</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="inline-block w-4 h-4 rounded-full bg-blue-500"></span>
                    <span>Ubicación real de empleado</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="inline-block w-4 h-4 rounded-full bg-red-500"></span>
                    <span>Ubicación aproximada (sin datos reales)</span>
                  </li>
                </ul>
              </div>
              
              <div className={`rounded-lg p-4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <FaBuilding className="text-blue-500" /> Zonas
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-center gap-2">
                    <span className="inline-block w-4 h-4 rounded-full bg-blue-300 bg-opacity-50"></span>
                    <span>Radio de 300m alrededor de la oficina</span>
                  </li>
                </ul>
              </div>
              
              <div className={`rounded-lg p-4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <FaUser className="text-purple-500" /> Usuarios
                </h3>
                <p className="mb-2">Cada usuario tiene un color de marcador distinto para facilitar su identificación en el mapa.</p>
                <p>Al hacer clic en un marcador se mostrará información detallada del empleado.</p>
              </div>
              
              <div className={`rounded-lg p-4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <FaSync className="text-orange-500" /> Actualización
                </h3>
                <p>El mapa se actualiza automáticamente cada 5 minutos.</p>
                <p className="mt-2">También puedes forzar una actualización utilizando el botón "Actualizar ubicaciones" en la parte inferior del mapa.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default AdminMapa;
