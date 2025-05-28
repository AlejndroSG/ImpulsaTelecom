import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { FaFileAlt, FaFilePdf, FaFileWord, FaFileExcel, FaFileImage, FaFile, FaDownload, FaTrash, FaEdit, FaPlus, FaUser } from 'react-icons/fa';
import { toast } from 'react-toastify';

const API_URL = 'http://localhost/ImpulsaTelecom/backend/api';

const AdminDocumentos = () => {
  const { isDarkMode } = useTheme();
  // Obtener todo el contexto de autenticación
  const authContext = useAuth();
  // Acceder correctamente al usuario y extraer datos relevantes
  const { user } = authContext;
  
  // Verificar la información disponible del usuario para depuración
  useEffect(() => {
    console.log('Estado de autenticación:', authContext);
    console.log('Datos de usuario disponibles:', user);
    
    // Verificar si tenemos localStorage
    const storedUser = localStorage.getItem('user');
    console.log('Usuario en localStorage:', storedUser ? JSON.parse(storedUser) : 'No disponible');
  }, [authContext, user]);
  const [documentos, setDocumentos] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtroUsuario, setFiltroUsuario] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [documentoEditar, setDocumentoEditar] = useState(null);
  
  // Estado del formulario
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    tipo_documento: 'nomina',
    nif_usuario: '',
    acceso_publico: 0,
    fecha_expiracion: ''
  });
  
  // Estado para el archivo
  const [archivo, setArchivo] = useState(null);
  
  // Definir un mapa simple para los tipos de documentos
  const tiposDocumentosData = {
    nomina: { nombre: 'Nómina' },
    contrato: { nombre: 'Contrato' },
    formacion: { nombre: 'Formación' },
    evaluacion: { nombre: 'Evaluación' },
    personal: { nombre: 'Personal' },
    otro: { nombre: 'Otro' }
  };
  
  // Lista de tipos para iterar en selectores
  const tiposList = [
    { id: 'nomina', nombre: 'Nómina' },
    { id: 'contrato', nombre: 'Contrato' },
    { id: 'formacion', nombre: 'Formación' },
    { id: 'evaluacion', nombre: 'Evaluación' },
    { id: 'personal', nombre: 'Personal' },
    { id: 'otro', nombre: 'Otro' }
  ];
  
  // Cargar usuarios
  const cargarUsuarios = useCallback(async () => {
    try {
      console.log('Solicitando lista de usuarios...');
      const response = await axios.get(`${API_URL}/usuarios.php?action=list`, {
        withCredentials: true
      });
      
      if (response.data && response.data.usuarios) {
        console.log('Usuarios cargados correctamente:', response.data.usuarios.length);
        setUsuarios(response.data.usuarios);
      } else {
        console.error('Respuesta sin usuarios:', response.data);
        setError('No se pudieron cargar los usuarios');
      }
    } catch (err) {
      console.error('Error al cargar usuarios:', err);
      setError('Error al cargar usuarios: ' + (err.response?.data?.error || err.message));
    }
  }, []);
  
  // Cargar documentos
  const cargarDocumentos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Solicitando lista de documentos como administrador...');
      
      // Asegurarse de que la solicitud incluya indicadores de que es administrador
      const response = await axios.get(`${API_URL}/documentos.php?action=list&admin=true`, {
        withCredentials: true
      });
      
      console.log('Respuesta de documentos:', response.data);
      
      if (response.data && response.data.documentos) {
        console.log(`Se encontraron ${response.data.documentos.length} documentos`);
        setDocumentos(response.data.documentos);
      } else {
        console.error('No se encontraron documentos o formato de respuesta incorrecto:', response.data);
        setDocumentos([]);
        if (response.data && response.data.error) {
          setError(response.data.error);
        }
      }
      setError(null);
    } catch (err) {
      console.error('Error al cargar documentos:', err);
      setError('Error al cargar documentos: ' + (err.response?.data?.error || err.message));
      setDocumentos([]);
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Cargar datos al iniciar
  useEffect(() => {
    cargarUsuarios();
    cargarDocumentos();
  }, [cargarUsuarios, cargarDocumentos]);
  
  // Manejar cambio en el formulario
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (checked ? 1 : 0) : value
    }));
  };
  
  // Manejar cambio de archivo
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setArchivo(e.target.files[0]);
    }
  };

  // Obtener nombre según tipo
  const getNombreTipo = (tipo) => {
    return tiposDocumentosData[tipo]?.nombre || 'Otro';
  };
  
  // Obtener nombre de usuario - envuelto en useCallback para evitar recreaciones
  const getNombreUsuario = useCallback((nif) => {
    const user = usuarios.find(u => u.id === nif);
    return user ? `${user.nombre} ${user.apellidos}` : nif;
  }, [usuarios]);
  
  // Renderizar icono según tipo
  const renderIconoTipo = (tipo) => {
    switch(tipo) {
      case 'nomina':
        return <FaFileAlt />;
      case 'contrato':
        return <FaFilePdf />;
      case 'formacion':
        return <FaFileWord />;
      case 'evaluacion':
        return <FaFileExcel />;
      case 'personal':
        return <FaFileImage />;
      default:
        return <FaFile />;
    }
  };
  
  // Formatear fecha
  const formatearFecha = (fechaStr) => {
    if (!fechaStr) return '-';
    const fecha = new Date(fechaStr);
    return fecha.toLocaleDateString('es-ES');
  };
  
  // Abrir modal para nuevo documento
  const abrirModalNuevo = (nif = '') => {
    setDocumentoEditar(null);
    setFormData({
      titulo: '',
      descripcion: '',
      tipo_documento: 'nomina',
      nif_usuario: nif,
      acceso_publico: 0,
      fecha_expiracion: ''
    });
    setArchivo(null);
    setModalVisible(true);
  };
  
  // Abrir modal para editar documento
  const abrirModalEditar = (documento) => {
    setDocumentoEditar(documento);
    setFormData({
      id: documento.id,
      titulo: documento.titulo,
      descripcion: documento.descripcion || '',
      tipo_documento: documento.tipo_documento,
      nif_usuario: documento.nif_usuario,
      acceso_publico: parseInt(documento.acceso_publico),
      fecha_expiracion: documento.fecha_expiracion || ''
    });
    setArchivo(null);
    setModalVisible(true);
  };
  
  // Subir documento
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('Iniciando subida de documento...');
    console.log('Datos del formulario:', formData);
    
    // Validaciones
    if (!formData.titulo.trim()) {
      toast.error('El título es obligatorio');
      return;
    }
    
    if (!formData.nif_usuario) {
      toast.error('Debes seleccionar un empleado');
      return;
    }
    
    // Si estamos editando y no tenemos ID
    if (documentoEditar && !formData.id) {
      toast.error('ID de documento no válido');
      return;
    }
    
    try {
      if (documentoEditar) {
        // Actualizar documento existente
        console.log('Actualizando documento existente:', documentoEditar.id);
        const response = await axios.post(`${API_URL}/documentos.php?action=update`, formData, {
          withCredentials: true
        });
        
        console.log('Respuesta de actualización:', response.data);
        
        if (response.data && response.data.success) {
          toast.success('Documento actualizado correctamente');
          cargarDocumentos();
          setModalVisible(false);
        } else {
          toast.error(response.data?.error || 'Error al actualizar el documento');
        }
      } else {
        // Subir nuevo documento
        if (!archivo) {
          toast.error('Debes seleccionar un archivo');
          return;
        }
        
        console.log('Preparando FormData para nuevo documento');
        console.log('Archivo seleccionado:', archivo.name, archivo.type, archivo.size);
        
        const formDataObj = new FormData();
        formDataObj.append('titulo', formData.titulo);
        formDataObj.append('descripcion', formData.descripcion);
        formDataObj.append('tipo_documento', formData.tipo_documento);
        formDataObj.append('nif_usuario', formData.nif_usuario);
        formDataObj.append('acceso_publico', formData.acceso_publico);
        formDataObj.append('fecha_expiracion', formData.fecha_expiracion);
        formDataObj.append('archivo', archivo);
        
              // Obtener datos de usuario de todas las fuentes posibles
        const userFromContext = user;
        const userFromStorage = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null;
        const effectiveUser = userFromContext || userFromStorage;
        
        console.log('Datos para autenticación:');
        console.log('- De contexto:', userFromContext);
        console.log('- De localStorage:', userFromStorage);
        
        // Incluir todos los identificadores posibles para máxima compatibilidad
        if (effectiveUser) {
          if (effectiveUser.id) formDataObj.append('usuario_id', effectiveUser.id);
          if (effectiveUser.NIF) formDataObj.append('usuario_nif', effectiveUser.NIF);
          if (effectiveUser.email) formDataObj.append('usuario_email', effectiveUser.email);
        } else {
          // Fallback - usar el NIF del formulario como identificador de usuario
          formDataObj.append('usuario_nif', formData.nif_usuario);
        }
        
        console.log('Enviando como usuario:', effectiveUser?.id || effectiveUser?.NIF, effectiveUser?.nombre);
        // Usar el nuevo endpoint simplificado para subir documentos
        console.log('Enviando solicitud a:', `${API_URL}/upload_documento.php`);
        
        // Usar FormData con credenciales y sin establecer Content-Type
        const response = await axios.post(`${API_URL}/upload_documento.php`, formDataObj, {
          withCredentials: true
        });
        
        console.log('Respuesta de subida:', response.data);
        
        if (response.data && response.data.success) {
          toast.success('Documento subido correctamente');
          cargarDocumentos();
          setModalVisible(false);
        } else {
          toast.error(response.data?.error || 'Error al subir el documento');
        }
      }
    } catch (err) {
      console.error('Error en la operación:', err);
      console.error('Detalles del error:', err.response?.data || err.message);
      toast.error('Error: ' + (err.response?.data?.error || err.message));
    }
  };
  
  // Eliminar documento
  const eliminarDocumento = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este documento?')) {
      return;
    }
    
    try {
      const response = await axios.post(`${API_URL}/documentos.php?action=delete`, { id }, {
        withCredentials: true
      });
      
      if (response.data && response.data.success) {
        toast.success('Documento eliminado correctamente');
        cargarDocumentos();
      } else {
        toast.error(response.data?.error || 'Error al eliminar el documento');
      }
    } catch (err) {
      console.error('Error al eliminar:', err);
      toast.error('Error: ' + (err.response?.data?.error || err.message));
    }
  };
  
  // Descargar documento
  const descargarDocumento = async (id, titulo) => {
    try {
      const response = await axios.get(`${API_URL}/documentos.php?action=download&id=${id}`, {
        withCredentials: true
      });
      
      if (response.data && response.data.success) {
        // Crear un enlace invisible para descargar
        const a = document.createElement('a');
        a.href = 'http://localhost/ImpulsaTelecom' + response.data.ruta;
        a.download = titulo || 'documento';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        toast.error(response.data?.error || 'Error al descargar el documento');
      }
    } catch (err) {
      console.error('Error al descargar:', err);
      toast.error('Error: ' + (err.response?.data?.error || err.message));
    }
  };
  
  // Filtramos documentos cada vez que cambian los filtros - usando useMemo para evitar cálculos innecesarios
  const documentosFiltrados = useMemo(() => {
    return documentos.filter(doc => {
      // Filtrar por usuario
      const pasaFiltroUsuario = !filtroUsuario || doc.nif_usuario === filtroUsuario;
      // Filtrar por tipo
      const pasaFiltroTipo = !filtroTipo || doc.tipo_documento === filtroTipo;
      return pasaFiltroUsuario && pasaFiltroTipo;
    });
  }, [documentos, filtroUsuario, filtroTipo]);
  
  // Agrupamos documentos filtrados por usuario - usando useMemo para evitar cálculos innecesarios
  const docsAgrupados = useMemo(() => {
    const usuariosConDocumentos = {};
    
    // Asignamos un ID único a cada documento para evitar problemas de keys
    documentosFiltrados.forEach((doc, index) => {
      const nifUsuario = doc.nif_usuario || 'sin-nif'; // Usamos NIF como identificador principal
      
      if (!usuariosConDocumentos[nifUsuario]) {
        const nombreUsuario = usuarios.find(u => u.id === nifUsuario);
        usuariosConDocumentos[nifUsuario] = {
          usuario: nombreUsuario ? `${nombreUsuario.nombre} ${nombreUsuario.apellidos}` : nifUsuario,
          nif: nifUsuario,
          documentos: []
        };
      }
      
      // Asegurarnos de que cada documento tenga un ID único
      const docConId = {...doc};
      if (!docConId.id) {
        docConId.id = `doc-${nifUsuario}-${index}`;
      }
      
      usuariosConDocumentos[nifUsuario].documentos.push(docConId);
    });
    
    return Object.values(usuariosConDocumentos);
  }, [documentosFiltrados, usuarios]);

  return (
    <div className={`container mx-auto px-4 py-6 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h1 className="text-2xl font-bold mb-4 md:mb-0">Gestión de Documentos</h1>
        
        <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
          <div className="relative">
            <select
              value={filtroUsuario}
              onChange={(e) => setFiltroUsuario(e.target.value)}
              className={`block w-full p-2 text-sm rounded-md border ${
                isDarkMode 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-700'
              }`}
            >
              <option key="filter-user-all" value="">Todos los empleados</option>
              {usuarios.map((user, index) => (
                <option key={`filter-user-${user.id || index}`} value={user.id || ''}>
                  {user.nombre} {user.apellidos}
                </option>
              ))}
            </select>
          </div>
          
          <div className="relative">
            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              className={`block w-full p-2 text-sm rounded-md border ${
                isDarkMode 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-700'
              }`}
            >
              <option key="filter-type-all" value="">Todos los tipos</option>
              {tiposList.map((tipo, index) => (
                <option key={`filter-type-${tipo.id || index}`} value={tipo.id || ''}>
                  {tipo.nombre}
                </option>
              ))}
            </select>
          </div>
          
          <button
            onClick={() => abrirModalNuevo()}
            className="px-4 py-2 bg-blue-600 text-white rounded flex items-center justify-center gap-1 hover:bg-blue-700 transition duration-200"
          >
            <FaPlus size={14} /> Nuevo Documento
          </button>
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        {/* Listado de documentos por usuario */}
        {loading ? (
          <div className="flex justify-center my-10">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <div className="bg-red-100 text-red-700 p-4 rounded my-4">
            {error}
          </div>
        ) : docsAgrupados.length === 0 ? (
          <div className="text-center my-10">
            <p className="text-lg">No hay documentos que coincidan con los filtros seleccionados.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {docsAgrupados.map((grupo) => (
              <div key={`grupo-${grupo.nif}`} className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                <div className="bg-primary text-white px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center">
                    <FaUser className="mr-2" />
                    <h3 className="text-lg font-semibold">{grupo.usuario}</h3>
                  </div>
                  <button
                    onClick={() => abrirModalNuevo(grupo.nif)}
                    className="bg-white text-primary hover:bg-gray-100 px-3 py-1 rounded text-sm flex items-center"
                  >
                    <FaPlus className="mr-1" /> Añadir
                  </button>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th key="th-doc" className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Documento</th>
                        <th key="th-tipo" className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Tipo</th>
                        <th key="th-fecha" className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Fecha</th>
                        <th key="th-acciones" className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                      {grupo.documentos.map((doc, idx) => (
                        <tr key={`doc-${doc.id || doc.nif_usuario}-${idx}`} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-4 py-3">
                            <div className="flex items-center">
                              <div className="text-primary mr-3">
                                {renderIconoTipo(doc.tipo_documento)}
                              </div>
                              <div>
                                <div className="font-medium text-gray-900 dark:text-white">{doc.titulo}</div>
                                {doc.descripcion && (
                                  <div className="text-sm text-gray-500 dark:text-gray-400">{doc.descripcion}</div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                            {getNombreTipo(doc.tipo_documento)}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                            {formatearFecha(doc.fecha_subida)}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => descargarDocumento(doc.id, doc.titulo)}
                                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
                                aria-label="Descargar"
                              >
                                <FaDownload />
                              </button>
                              <button
                                onClick={() => abrirModalEditar(doc)}
                                className="text-yellow-600 hover:text-yellow-800 dark:text-yellow-400 dark:hover:text-yellow-200"
                                aria-label="Editar"
                              >
                                <FaEdit />
                              </button>
                              <button
                                onClick={() => eliminarDocumento(doc.id)}
                                className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200"
                                aria-label="Eliminar"
                              >
                                <FaTrash />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Modal para subir/editar documento */}
      {modalVisible && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div 
            className={`relative w-full max-w-2xl rounded-lg shadow-xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-6`}
          >
            <button
              onClick={() => setModalVisible(false)}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            >
              &times;
            </button>
            
            <h2 className="text-xl font-bold mb-4">
              {documentoEditar ? 'Editar Documento' : 'Subir Nuevo Documento'}
            </h2>
            
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block mb-2 text-sm font-medium">Título*</label>
                <input
                  type="text"
                  name="titulo"
                  value={formData.titulo}
                  onChange={handleChange}
                  className={`w-full p-2 border rounded ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300'
                  }`}
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block mb-2 text-sm font-medium">Descripción</label>
                <textarea
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleChange}
                  className={`w-full p-2 border rounded ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300'
                  }`}
                  rows="3"
                ></textarea>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block mb-2 text-sm font-medium">Tipo de Documento*</label>
                  <select
                    name="tipo_documento"
                    value={formData.tipo_documento}
                    onChange={handleChange}
                    className={`w-full p-2 border rounded ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300'
                    }`}
                    required
                  >
                    {tiposList.map((tipo, index) => (
                      <option key={`modal-type-${tipo.id || index}`} value={tipo.id || ''}>
                        {tipo.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block mb-2 text-sm font-medium">Empleado*</label>
                  <select
                    name="nif_usuario"
                    value={formData.nif_usuario}
                    onChange={handleChange}
                    className={`w-full p-2 border rounded ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300'
                    }`}
                    required
                    disabled={!!documentoEditar}
                  >
                    <option key="modal-user-default" value="">Seleccionar empleado</option>
                    {usuarios.map((user, index) => (
                      <option key={`modal-user-${user.id || index}`} value={user.id || ''}>
                        {user.nombre} {user.apellidos}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block mb-2 text-sm font-medium">Fecha de Expiración</label>
                  <input
                    type="date"
                    name="fecha_expiracion"
                    value={formData.fecha_expiracion}
                    onChange={handleChange}
                    className={`w-full p-2 border rounded ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300'
                    }`}
                  />
                </div>
                
                <div>
                  <label className="block mb-2 text-sm font-medium">Acceso Público</label>
                  <div className="flex items-center mt-2">
                    <input
                      type="checkbox"
                      name="acceso_publico"
                      checked={formData.acceso_publico === 1}
                      onChange={handleChange}
                      className="mr-2"
                    />
                    <span>Documento visible para todos los empleados</span>
                  </div>
                </div>
              </div>
              
              {!documentoEditar && (
                <div className="mb-4">
                  <label className="block mb-2 text-sm font-medium">Archivo*</label>
                  <input
                    type="file"
                    onChange={handleFileChange}
                    className={`w-full p-2 border rounded ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300'
                    }`}
                    required
                  />
                </div>
              )}
              
              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => setModalVisible(false)}
                  className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  onClick={(e) => handleSubmit(e)} // Añadimos un onClick para garantizar la ejecución
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  {documentoEditar ? 'Guardar Cambios' : 'Subir Documento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDocumentos;
