import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import EstadisticasWidget from '../components/EstadisticasWidget';
import ExportarInformeWidget from '../components/ExportarInformeWidget';
import MapaWidget from '../components/MapaWidget';

const Usuario = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { isDarkMode } = useTheme();
    const [activeTab, setActiveTab] = useState('estadisticas');
    
    useEffect(() => {
        // Verificar si el usuario está autenticado
        if (!user) {
            navigate('/login');
        }
    }, [user, navigate]);
    
    // Función para cambiar de pestaña
    const handleTabChange = (tab) => {
        setActiveTab(tab);
    };
    
    if (!user) {
        return <div className="loading">Cargando...</div>;
    }
    
    return (
        <div className={`usuario-container ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
            <div className="usuario-header">
                <h1>Panel de Usuario</h1>
                <p>Bienvenido, {user.nombre}</p>
            </div>
            
            <div className="usuario-tabs">
                <button 
                    className={`tab-button ${activeTab === 'estadisticas' ? 'active' : ''}`}
                    onClick={() => handleTabChange('estadisticas')}
                >
                    Estadísticas
                </button>
                <button 
                    className={`tab-button ${activeTab === 'exportar' ? 'active' : ''}`}
                    onClick={() => handleTabChange('exportar')}
                >
                    Exportar Informes
                </button>
                <button 
                    className={`tab-button ${activeTab === 'mapa' ? 'active' : ''}`}
                    onClick={() => handleTabChange('mapa')}
                >
                    Mapa de Ubicaciones
                </button>
                <button 
                    className={`tab-button ${activeTab === 'perfil' ? 'active' : ''}`}
                    onClick={() => handleTabChange('perfil')}
                >
                    Mi Perfil
                </button>
            </div>
            
            <div className="usuario-content">
                {activeTab === 'estadisticas' && (
                    <div className="tab-content">
                        <h2>Mis Estadísticas</h2>
                        <EstadisticasWidget userId={user.id} />
                    </div>
                )}
                
                {activeTab === 'exportar' && (
                    <div className="tab-content">
                        <h2>Exportar Informes</h2>
                        <ExportarInformeWidget userId={user.id} />
                    </div>
                )}
                
                {activeTab === 'mapa' && (
                    <div className="tab-content">
                        <h2>Mapa de Ubicaciones</h2>
                        <MapaWidget userId={user.id} showHistory={true} />
                    </div>
                )}
                
                {activeTab === 'perfil' && (
                    <div className="tab-content">
                        <h2>Mi Perfil</h2>
                        <button 
                            className="navigate-button"
                            onClick={() => navigate('/perfil')}
                        >
                            Ir a Perfil
                        </button>
                    </div>
                )}
            </div>
            
            {/* Estilos CSS inline para la demostración */}
            <style>{`
                .usuario-container {
                    padding: 20px;
                    max-width: 1200px;
                    margin: 0 auto;
                }
                
                .usuario-header {
                    margin-bottom: 30px;
                }
                
                .usuario-header h1 {
                    font-size: 28px;
                    margin-bottom: 10px;
                }
                
                .usuario-tabs {
                    display: flex;
                    border-bottom: 1px solid #ddd;
                    margin-bottom: 20px;
                }
                
                .tab-button {
                    padding: 10px 20px;
                    background: none;
                    border: none;
                    cursor: pointer;
                    font-size: 16px;
                    border-bottom: 3px solid transparent;
                    transition: all 0.3s;
                }
                
                .tab-button.active {
                    border-bottom: 3px solid #007bff;
                    color: #007bff;
                    font-weight: bold;
                }
                
                .tab-content {
                    padding: 20px 0;
                }
                
                .tab-content h2 {
                    margin-bottom: 20px;
                    font-size: 22px;
                }
                
                .navigate-button {
                    padding: 10px 20px;
                    background-color: #007bff;
                    color: white;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                    font-size: 16px;
                    transition: background-color 0.3s;
                }
                
                .navigate-button:hover {
                    background-color: #0056b3;
                }
                
                /* Estilos para modo oscuro */
                .dark-mode {
                    background-color: #222;
                    color: #eee;
                }
                
                .dark-mode .tab-button {
                    color: #eee;
                }
                
                .dark-mode .tab-button.active {
                    border-bottom: 3px solid #4da3ff;
                    color: #4da3ff;
                }
            `}</style>
        </div>
    );
};

export default Usuario;
