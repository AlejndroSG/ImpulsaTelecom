import React, { useEffect, useState } from 'react'
import '../styles/modal.css'

const ModalCredenciales = ({ mensaje, datos }) => {
  const [visible, setVisible] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const [key, setKey] = useState(0); // Añadimos una key para forzar el re-render

  useEffect(() => {
    setVisible(true);
    setFadeOut(false);
    setKey(prev => prev + 1); // Incrementamos la key cada vez que cambian los props

    const timer = setTimeout(() => {
      setFadeOut(true);
      setTimeout(() => setVisible(false), 500);
    }, 4500);

    return () => clearTimeout(timer);
  }, [mensaje, datos]); // El efecto se ejecuta cuando cambian los props

  if (!visible) return null;

  return (
    <div key={key} className={`absolute right-5 bottom-10 p-4 rounded-lg shadow-lg bg-white modal-credenciales ${fadeOut ? 'fade-out' : ''}`}>
        {datos ? (
          <p className="text-green-500">
            Bienvenido {datos.nombre} {datos.apellidos}
          </p>
        ) : (
          <p className={mensaje === 'Credenciales correctas' ? 'text-green-500' : 'text-red-500'}>
            {mensaje}
          </p>
        )}
        <div className={`progress-bar ${datos ? 'text-green-500' : mensaje === 'Credenciales correctas' ? 'text-green-500' : 'text-red-500'}`}></div>
    </div>
  )
}

export default ModalCredenciales