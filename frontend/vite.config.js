import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@fullcalendar/core': path.resolve('node_modules', '@fullcalendar/core'),
      '@fullcalendar/react': path.resolve('node_modules', '@fullcalendar/react'),
      '@fullcalendar/daygrid': path.resolve('node_modules', '@fullcalendar/daygrid'),
      '@fullcalendar/timegrid': path.resolve('node_modules', '@fullcalendar/timegrid'),
      '@fullcalendar/list': path.resolve('node_modules', '@fullcalendar/list'),
      '@fullcalendar/interaction': path.resolve('node_modules', '@fullcalendar/interaction')
    }
  },
  server: {
    host: true, // permite conexiones externas
    port: 5173, // o el puerto que uses
    allowedHosts: [
      'asp-natural-annually.ngrok-free.app' // <- tu subdominio de ngrok
    ]
  }
})
