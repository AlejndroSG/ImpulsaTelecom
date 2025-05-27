import React, { useState } from 'react'
import '../styles/login.css'
import { useNavigate } from 'react-router-dom'
import ModalCredenciales from '../components/ModalCredenciales'
import { useAuth } from '../context/AuthContext'

const Login = () => {
    const [mensaje, setMensaje] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [recordar, setRecordar] = useState(false);
    const { login } = useAuth();
    
    const iniciarSesion = async (e) => {
        e.preventDefault();
        
        if (!email || !password) {
            setMensaje('Por favor, introduce email y contraseña');
            return;
        }
        
        setLoading(true);
        setMensaje('');
        
        try {
            console.log('Intentando iniciar sesión con:', { email, password, recordar });
            const result = await login(email, password, recordar);
            if (result.success) {
                setMensaje('Credenciales correctas');
                navigate('/inicio');
            } else {
                setMensaje(result.message || 'Credenciales incorrectas');
            }
        } catch (error) {
            console.error('Error al iniciar sesión:', error);
            setMensaje('Error al iniciar sesión: ' + (error.message || 'Error desconocido'));
        } finally {
            setLoading(false);
        }
    }

  return (
    <section className="w-full login-page login-container flex justify-center items-center relative min-h-screen">
        <div className="md:w-[600px] w-full mx-4 p-8 bg-[#D9D9D9] shadow-lg rounded-lg relative">
            <img className=" w-100 h-auto mx-auto" src="/src/img/logo/logoimpulsa.png" alt="Impulsa Telecom Logo"/>
            <div className="text-center flex justify-center items-center my-7">
                <hr className="w-1/2 border-gray-500"/>
                <p className="text-gray-500 block w-full">Acceder al Registro de Horas</p>
                <hr className="w-1/2 border-gray-500"/>
            </div>
            <form onSubmit={iniciarSesion} className="space-y-6 relative">
                <div className="relative flex items-center mb-2">
                    <svg className='absolute left-3 text-gray-500' xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor"  viewBox="0 0 16 16"><path d="M3 14s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1zm5-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6"/></svg>
                    <input 
                        onChange={(e) => setEmail(e.target.value)} 
                        type="email" 
                        id="username" 
                        className="bg-[#E9E9E9] login-input w-full pl-11 py-4 rounded-lg focus:outline-none text-gray-900 focus:ring-2 focus:ring-[#78bd00] transition-all duration-200" 
                        placeholder="Email"
                        required
                    />
                </div>
                <div className="relative flex items-center">
                    <svg className='absolute left-3 text-gray-500' xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor"  viewBox="0 0 16 16"><path d="M8 1a2 2 0 0 1 2 2v4H6V3a2 2 0 0 1 2-2m3 6V3a3 3 0 0 0-6 0v4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2"/></svg>
                    <input 
                        onChange={(e) => setPassword(e.target.value)} 
                        type="password" 
                        id="password" 
                        className="bg-[#E9E9E9] login-input w-full pl-11 py-4 rounded-lg focus:outline-none text-gray-900 focus:ring-2 focus:ring-[#78bd00] transition-all duration-200" 
                        placeholder="Contraseña"
                        required
                    />
                </div>
                <div className="flex justify-between">
                    <div>
                        <input 
                            type="checkbox" 
                            id="remember" 
                            className="mr-2" 
                            checked={recordar}
                            onChange={(e) => setRecordar(e.target.checked)}
                        />
                        <label htmlFor="remember" className="text-gray-600">Recordarme</label>
                    </div>
                    <a href="#" className="text-gray-600 hover:text-blue-500 transition-colors duration-200">¿Olvidaste tu contraseña?</a>
                </div>
                <button 
                    type="submit" 
                    className="bg-[#78bd00] login-button w-full py-3 text-[#E9E9E9] font-medium rounded-lg hover:bg-[#69a500] transition-colors duration-200 flex justify-center items-center"
                    disabled={loading}
                >
                    {loading ? (
                        <span className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></span>
                    ) : null}
                    Iniciar Sesión
                </button>
            </form>
        </div>
        {mensaje && 
        <div className='absolute right-5 bottom-0'>
            <ModalCredenciales mensaje={mensaje} />
        </div>
        }
    </section>
  )
}

export default Login