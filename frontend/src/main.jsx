import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

// Estilos globales
import './index.css'

// Estilos personalizados para el calendario
import './styles/calendar.css'

import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
