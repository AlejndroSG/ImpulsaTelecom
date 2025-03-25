# Instrucciones de Configuración para ImpulsaTelecom

## Configuración de la Base de Datos

Para solucionar el error de carga de avatares, necesitas configurar la base de datos siguiendo estos pasos:

1. Abre phpMyAdmin en tu navegador (http://localhost/phpmyadmin)
2. Crea una nueva base de datos llamada `impulsatelecom` con cotejamiento `utf8mb4_unicode_ci`
3. Importa el archivo SQL de configuración:
   - Selecciona la base de datos `impulsatelecom`
   - Haz clic en la pestaña "Importar"
   - Selecciona el archivo `backend/sql/setup_database.sql`
   - Haz clic en "Continuar"

Alternativamente, puedes copiar y pegar el contenido del archivo SQL directamente en la pestaña "SQL" de phpMyAdmin.

## Estructura de Directorios

Asegúrate de que la estructura de directorios sea la siguiente:

```
ImpulsaTelecom/
├── backend/
│   ├── api/
│   │   ├── avatares.php
│   │   └── usuarios.php
│   ├── config/
│   │   └── database.php
│   └── sql/
│       ├── avatares.sql
│       └── setup_database.sql
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── AvatarSelector.jsx
    │   │   └── PerfilWidget.jsx
    │   ├── img/
    │   │   └── avatares/
    │   │       └── [imágenes de avatares]
    │   └── pages/
    │       └── Perfil.jsx
    └── [otros archivos de frontend]
```

## Solución de Problemas

Si sigues teniendo problemas con la carga de avatares:

1. **Verifica las rutas de las imágenes**: 
   - Las imágenes deben estar en `frontend/src/img/avatares/`
   - Las rutas en la base de datos deben comenzar con `/src/img/avatares/`

2. **Verifica la conexión a la base de datos**:
   - Asegúrate de que el archivo `backend/config/database.php` tenga las credenciales correctas
   - Por defecto, el usuario es `root` y la contraseña está vacía

3. **Verifica los permisos de archivos**:
   - Asegúrate de que los archivos PHP tengan permisos de lectura y ejecución

4. **Revisa la consola del navegador**:
   - Abre las herramientas de desarrollador (F12) y revisa la consola para ver errores específicos
   - Verifica la pestaña "Red" para ver si las solicitudes HTTP están funcionando correctamente

## Credenciales de Prueba

Usuario: admin@impulsatelecom.com
Contraseña: admin123

## Notas Adicionales

- El sistema está configurado para funcionar incluso si la base de datos no está configurada, mostrando avatares de prueba.
- Si modificas las rutas de las imágenes, asegúrate de actualizar también las rutas en la base de datos.
