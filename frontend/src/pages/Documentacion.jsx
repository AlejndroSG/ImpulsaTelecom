import React, { useState } from "react";
import { FaFilePdf, FaEye, FaDownload } from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useTheme } from "../context/ThemeContext";
import { motion } from "framer-motion";

const Documentacion = () => {
  const { isDarkMode } = useTheme();
  const [activeTab, setActiveTab] = useState('proteccion-datos');
  const [expandedDocId, setExpandedDocId] = useState(null);

  // Documentos legales disponibles
  const documentos = [
    {
      id: 'proteccion-datos',
      titulo: 'Protección de Datos',
      descripcion: 'Documentos relacionados con el tratamiento de sus datos personales según el RGPD',
      documentos: [
        {
          id: 'politica-privacidad',
          titulo: 'Política de Privacidad',
          fecha: '12/05/2025',
          descripcion: 'Información detallada sobre cómo se recogen, almacenan y procesan sus datos personales.',
          url: '/documentos/politica-privacidad.pdf'
        },
        {
          id: 'derechos-arco',
          titulo: 'Derechos ARCO+',
          fecha: '10/05/2025',
          descripcion: 'Información sobre sus derechos de Acceso, Rectificación, Cancelación, Oposición, Limitación, Portabilidad y Olvido.',
          url: '/documentos/derechos-arco.pdf'
        },
        {
          id: 'consentimiento',
          titulo: 'Consentimiento para Tratamiento de Datos',
          fecha: '08/05/2025',
          descripcion: 'Documento de consentimiento explícito para el tratamiento de sus datos personales.',
          url: '/documentos/consentimiento.pdf'
        }
      ]
    },
    {
      id: 'laboral',
      titulo: 'Documentación Laboral',
      descripcion: 'Documentos relacionados con su relación laboral',
      documentos: [
        {
          id: 'contrato-trabajo',
          titulo: 'Contrato de Trabajo',
          fecha: '15/04/2025',
          descripcion: 'Su contrato laboral y condiciones de trabajo.',
          url: '/documentos/contrato-trabajo.pdf'
        },
        {
          id: 'convenio-colectivo',
          titulo: 'Convenio Colectivo',
          fecha: '01/01/2025',
          descripcion: 'Convenio colectivo aplicable a su categoría profesional.',
          url: '/documentos/convenio-colectivo.pdf'
        },
        {
          id: 'registro-jornada',
          titulo: 'Política de Registro de Jornada',
          fecha: '20/04/2025',
          descripcion: 'Información sobre el sistema de registro horario según el Real Decreto-ley 8/2019.',
          url: '/documentos/registro-jornada.pdf'
        }
      ]
    },
    {
      id: 'normativa-interna',
      titulo: 'Normativa Interna',
      descripcion: 'Normas y políticas internas de la empresa',
      documentos: [
        {
          id: 'codigo-conducta',
          titulo: 'Código de Conducta',
          fecha: '05/03/2025',
          descripcion: 'Normas éticas y de conducta para todos los empleados.',
          url: '/documentos/codigo-conducta.pdf'
        },
        {
          id: 'politica-teletrabajo',
          titulo: 'Política de Teletrabajo',
          fecha: '10/03/2025',
          descripcion: 'Condiciones y normativa aplicable al teletrabajo.',
          url: '/documentos/politica-teletrabajo.pdf'
        },
        {
          id: 'prevencion-riesgos',
          titulo: 'Plan de Prevención de Riesgos Laborales',
          fecha: '15/02/2025',
          descripcion: 'Información sobre prevención de riesgos laborales y procedimientos de seguridad.',
          url: '/documentos/prevencion-riesgos.pdf'
        }
      ]
    }
  ];

  // Encontrar la categoría activa
  const categoriaActiva = documentos.find(cat => cat.id === activeTab) || documentos[0];

  // Manejar la visualización de documentos
  const handleVerDocumento = (docId) => {
    // En una implementación real, esto podría abrir un visor de documentos
    console.log(`Visualizar documento ${docId}`);
  };

  // Manejar la descarga de documentos
  const handleDescargarDocumento = (url) => {
    // En una implementación real, esto iniciaría una descarga
    console.log(`Descargar documento desde ${url}`);
    toast.success('Descargando documento...');
  };

  // Manejar la expansión/colapso de documentos
  const toggleExpandDocument = (docId) => {
    if (expandedDocId === docId) {
      setExpandedDocId(null);
    } else {
      setExpandedDocId(docId);
    }
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-800'} transition-colors duration-300`}>
      <ToastContainer 
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme={isDarkMode ? 'dark' : 'light'}
      />
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col">
          <h1 className={`text-3xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Documentación Legal
          </h1>
          <p className={`mb-6 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            En cumplimiento con las normativas de la Unión Europea, aquí puede acceder a toda su documentación legal.
          </p>

          {/* Pestañas de categorías */}
          <div className="flex overflow-x-auto mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
            {documentos.map(categoria => (
              <button
                key={categoria.id}
                onClick={() => setActiveTab(categoria.id)}
                className={`px-4 py-2 border-b-2 font-medium text-sm ${activeTab === categoria.id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                {categoria.titulo}
              </button>
            ))}
          </div>

          {/* Descripción de la categoría seleccionada */}
          <div className={`p-4 mb-6 rounded-md ${isDarkMode ? 'bg-gray-800' : 'bg-white border border-gray-200'}`}>
            <h2 className="text-xl font-semibold mb-2">{categoriaActiva.titulo}</h2>
            <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>{categoriaActiva.descripcion}</p>
          </div>

          {/* Lista de documentos legales */}
          <div className="grid gap-4 mb-6">
            {categoriaActiva.documentos.map(documento => (
              <motion.div
                key={documento.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white border border-gray-200'}`}
              >
                <div 
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => toggleExpandDocument(documento.id)}
                >
                  <div className="flex items-center">
                    <FaFilePdf className={`mr-3 text-xl ${isDarkMode ? 'text-red-400' : 'text-red-500'}`} />
                    <div>
                      <h3 className="font-semibold text-lg">{documento.titulo}</h3>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Última actualización: {documento.fecha}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleVerDocumento(documento.id);
                      }}
                      className={`p-2 mr-2 rounded-full transition-colors ${
                        isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                      }`}
                      title="Ver documento"
                    >
                      <FaEye className={isDarkMode ? 'text-blue-300' : 'text-blue-500'} />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDescargarDocumento(documento.url);
                      }}
                      className={`p-2 rounded-full transition-colors ${
                        isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                      }`}
                      title="Descargar documento"
                    >
                      <FaDownload className={isDarkMode ? 'text-green-300' : 'text-green-600'} />
                    </button>
                  </div>
                </div>
                
                {/* Descripción expandible */}
                {expandedDocId === documento.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    transition={{ duration: 0.3 }}
                    className="mt-4 pt-4 border-t"
                  >
                    <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
                      {documento.descripcion}
                    </p>
                    <div className="mt-4 flex">
                      <button 
                        onClick={() => handleVerDocumento(documento.id)}
                        className={`flex items-center px-4 py-2 mr-2 rounded-md ${
                          isDarkMode 
                            ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                            : 'bg-blue-500 hover:bg-blue-600 text-white'
                        }`}
                      >
                        <FaEye className="mr-2" />
                        Ver documento
                      </button>
                      <button 
                        onClick={() => handleDescargarDocumento(documento.url)}
                        className={`flex items-center px-4 py-2 rounded-md ${
                          isDarkMode 
                            ? 'bg-green-600 hover:bg-green-700 text-white' 
                            : 'bg-green-500 hover:bg-green-600 text-white'
                        }`}
                      >
                        <FaDownload className="mr-2" />
                        Descargar
                      </button>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>

          {/* Información adicional */}
          <div className={`p-4 rounded-md mt-6 ${isDarkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
            <h3 className="font-semibold mb-2">Información importante</h3>
            <p>
              Si necesita alguna aclaración o documento adicional, por favor contacte con el departamento de Recursos Humanos.
              Todos los documentos están disponibles en formato PDF y están firmados digitalmente para garantizar su autenticidad.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Documentacion;
