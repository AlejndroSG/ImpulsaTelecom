-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 02-04-2025 a las 15:14:56
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `ImpulsaTelecom`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `avatares`
--

CREATE TABLE `avatares` (
  `id` int(11) NOT NULL,
  `ruta` varchar(255) NOT NULL,
  `categoria` varchar(50) DEFAULT NULL,
  `color_fondo` varchar(20) DEFAULT NULL,
  `nombre` varchar(100) DEFAULT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `avatares`
--

INSERT INTO `avatares` (`id`, `ruta`, `categoria`, `color_fondo`, `nombre`, `activo`) VALUES
(192, '/src/img/avatares/001-man.png', 'masculino', '#4A90E2', 'Hombre 1', 1),
(193, '/src/img/avatares/002-man.png', 'masculino', '#50E3C2', 'Hombre 2', 1),
(194, '/src/img/avatares/004-man-1.png', 'masculino', '#F5A623', 'Hombre 3', 1),
(195, '/src/img/avatares/005-man-1.png', 'masculino', '#D0021B', 'Hombre 4', 1),
(196, '/src/img/avatares/006-man-2.png', 'masculino', '#9013FE', 'Hombre 5', 1),
(197, '/src/img/avatares/007-man-3.png', 'masculino', '#417505', 'Hombre 6', 1),
(198, '/src/img/avatares/009-man-4.png', 'masculino', '#7ED321', 'Hombre 7', 1),
(199, '/src/img/avatares/011-man-2.png', 'masculino', '#BD10E0', 'Hombre 8', 1),
(200, '/src/img/avatares/011-man-5.png', 'masculino', '#8B572A', 'Hombre 9', 1),
(201, '/src/img/avatares/012-man-6.png', 'masculino', '#4A4A4A', 'Hombre 10', 1),
(202, '/src/img/avatares/014-man-3.png', 'masculino', '#9B9B9B', 'Hombre 11', 1),
(203, '/src/img/avatares/014-man-7.png', 'masculino', '#2D9CDB', 'Hombre 12', 1),
(204, '/src/img/avatares/015-man-8.png', 'masculino', '#27AE60', 'Hombre 13', 1),
(205, '/src/img/avatares/017-man-9.png', 'masculino', '#EB5757', 'Hombre 14', 1),
(206, '/src/img/avatares/019-man-10.png', 'masculino', '#6FCF97', 'Hombre 15', 1),
(207, '/src/img/avatares/020-man-11.png', 'masculino', '#BB6BD9', 'Hombre 16', 1),
(208, '/src/img/avatares/020-man-4.png', 'masculino', '#F2994A', 'Hombre 17', 1),
(209, '/src/img/avatares/021-man-12.png', 'masculino', '#56CCF2', 'Hombre 18', 1),
(210, '/src/img/avatares/022-man-13.png', 'masculino', '#219653', 'Hombre 19', 1),
(211, '/src/img/avatares/022-man-5.png', 'masculino', '#F2C94C', 'Hombre 20', 1),
(212, '/src/img/avatares/023-man-14.png', 'masculino', '#828282', 'Hombre 21', 1),
(213, '/src/img/avatares/023-man-6.png', 'masculino', '#BDBDBD', 'Hombre 22', 1),
(214, '/src/img/avatares/025-man-15.png', 'masculino', '#E0E0E0', 'Hombre 23', 1),
(215, '/src/img/avatares/001-woman.png', 'femenino', '#FF6B6B', 'Mujer 1', 1),
(216, '/src/img/avatares/003-woman-1.png', 'femenino', '#FF9ED8', 'Mujer 2', 1),
(217, '/src/img/avatares/004-woman.png', 'femenino', '#FFD166', 'Mujer 3', 1),
(218, '/src/img/avatares/005-woman-2.png', 'femenino', '#06D6A0', 'Mujer 4', 1),
(219, '/src/img/avatares/006-woman-1.png', 'femenino', '#118AB2', 'Mujer 5', 1),
(220, '/src/img/avatares/008-woman-3.png', 'femenino', '#073B4C', 'Mujer 6', 1),
(221, '/src/img/avatares/010-woman-4.png', 'femenino', '#EF476F', 'Mujer 7', 1),
(222, '/src/img/avatares/012-woman-2.png', 'femenino', '#FFD166', 'Mujer 8', 1),
(223, '/src/img/avatares/013-woman-3.png', 'femenino', '#06D6A0', 'Mujer 9', 1),
(224, '/src/img/avatares/013-woman-5.png', 'femenino', '#118AB2', 'Mujer 10', 1),
(225, '/src/img/avatares/015-woman-4.png', 'femenino', '#073B4C', 'Mujer 11', 1),
(226, '/src/img/avatares/016-woman-6.png', 'femenino', '#EF476F', 'Mujer 12', 1),
(227, '/src/img/avatares/019-woman-5.png', 'femenino', '#FFD166', 'Mujer 13', 1),
(228, '/src/img/avatares/024-woman-6.png', 'femenino', '#06D6A0', 'Mujer 14', 1),
(229, '/src/img/avatares/024-woman-7.png', 'femenino', '#118AB2', 'Mujer 15', 1),
(230, '/src/img/avatares/002-girl.png', 'niños', '#FF9ED8', 'Niña 1', 1),
(231, '/src/img/avatares/003-boy.png', 'niños', '#4A90E2', 'Niño 1', 1),
(232, '/src/img/avatares/007-boy-1.png', 'niños', '#50E3C2', 'Niño 2', 1),
(233, '/src/img/avatares/010-girl-1.png', 'niños', '#F5A623', 'Niña 2', 1),
(234, '/src/img/avatares/016-boy-2.png', 'niños', '#D0021B', 'Niño 3', 1),
(235, '/src/img/avatares/017-girl-2.png', 'niños', '#9013FE', 'Niña 3', 1),
(236, '/src/img/avatares/018-boy-3.png', 'niños', '#417505', 'Niño 4', 1),
(237, '/src/img/avatares/021-girl-3.png', 'niños', '#7ED321', 'Niña 4', 1),
(238, '/src/img/avatares/025-boy-4.png', 'niños', '#BD10E0', 'Niño 5', 1),
(239, '/src/img/avatares/008-clown.png', 'profesiones', '#FF6B6B', 'Payaso', 1),
(240, '/src/img/avatares/009-firefighter.png', 'profesiones', '#FF9ED8', 'Bombero', 1),
(241, '/src/img/avatares/018-policeman.png', 'profesiones', '#FFD166', 'Policía', 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `registros`
--

CREATE TABLE `registros` (
  `idRegistro` int(11) NOT NULL,
  `NIF` varchar(15) NOT NULL,
  `fecha` date NOT NULL,
  `horaInicio` time DEFAULT NULL,
  `horaFin` time DEFAULT NULL,
  `horaPausa` time DEFAULT NULL,
  `horaReanudacion` time DEFAULT NULL,
  `tiempoPausa` int(11) DEFAULT 0,
  `latitud` decimal(10,8) DEFAULT NULL,
  `longitud` decimal(11,8) DEFAULT NULL,
  `localizacion` varchar(255) DEFAULT NULL,
  `estado` enum('entrada','salida','pausa') DEFAULT 'entrada'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `registros`
--

INSERT INTO `registros` (`idRegistro`, `NIF`, `fecha`, `horaInicio`, `horaFin`, `horaPausa`, `horaReanudacion`, `tiempoPausa`, `latitud`, `longitud`, `localizacion`, `estado`) VALUES
(1, '98765432B', '2025-03-31', '08:30:00', '17:00:00', NULL, NULL, 0, NULL, NULL, NULL, 'salida'),
(2, '56789012C', '2025-03-31', '09:00:00', '18:00:00', NULL, NULL, 0, NULL, NULL, NULL, 'salida'),
(3, '34567890D', '2025-03-31', '08:00:00', '16:30:00', NULL, NULL, 0, NULL, NULL, NULL, 'salida'),
(4, '98765432B', '2025-03-30', '08:30:00', '17:30:00', '12:00:00', '13:00:00', 3600, NULL, NULL, NULL, 'salida'),
(5, '56789012C', '2025-03-30', '09:00:00', '18:30:00', '13:00:00', '14:00:00', 3600, NULL, NULL, NULL, 'salida'),
(6, '34567890D', '2025-03-30', '08:00:00', '16:00:00', NULL, NULL, 0, 40.41680000, -3.70380000, '40.4168, -3.7038', 'salida'),
(7, '98765432B', '2025-04-01', '11:12:05', '11:12:11', '11:12:07', '11:12:08', 1, NULL, NULL, NULL, 'entrada'),
(8, '98765432B', '2025-04-01', '11:56:05', '11:56:07', NULL, NULL, 0, NULL, NULL, NULL, 'entrada'),
(9, '98765432B', '2025-04-01', '11:58:52', '11:59:08', '11:59:04', '11:59:01', 5, NULL, NULL, NULL, 'entrada'),
(10, '98765432B', '2025-04-01', '12:03:39', '12:03:52', '12:03:43', '12:03:47', 4, NULL, NULL, NULL, 'entrada'),
(11, '98765432B', '2025-04-01', '12:04:32', '12:04:34', '12:04:33', NULL, 1, NULL, NULL, NULL, 'entrada'),
(12, '98765432B', '2025-04-01', '12:04:45', '12:04:46', NULL, NULL, 0, NULL, NULL, NULL, 'entrada'),
(13, '98765432B', '2025-04-01', '12:04:49', '12:04:50', NULL, NULL, 0, NULL, NULL, NULL, 'entrada'),
(14, '98765432B', '2025-04-01', '12:26:35', '12:26:49', '12:26:39', '12:26:44', 5, NULL, NULL, NULL, 'entrada'),
(15, '98765432B', '2025-04-01', '12:46:40', '12:46:43', NULL, NULL, 0, 37.15356010, -3.59967030, '37.1535601, -3.5996703', 'entrada'),
(16, '98765432B', '2025-01-01', '17:11:57', '22:10:57', NULL, NULL, 0, NULL, NULL, NULL, 'entrada'),
(17, '98765432B', '2025-02-04', '09:19:24', '09:19:32', '09:19:26', '09:19:28', 2, 37.15356190, -3.59965680, '37.1535619, -3.5996568', 'entrada'),
(18, '98765432B', '2025-04-02', '10:33:57', '10:34:02', NULL, NULL, 0, 37.15355690, -3.59966710, '37.1535569, -3.5996671', 'entrada'),
(19, '98765432B', '2025-04-02', '10:36:43', '10:36:46', NULL, NULL, 0, NULL, NULL, NULL, 'entrada'),
(20, '98765432B', '2025-04-02', '10:36:53', '10:37:10', '10:36:54', '10:37:08', 14, NULL, NULL, NULL, 'entrada'),
(21, '98765432B', '2025-04-02', '10:40:26', '10:40:26', NULL, NULL, 0, 37.15355690, -3.59966710, '37.1535569, -3.5996671', 'entrada'),
(22, '98765432B', '2025-04-02', '10:40:27', '10:40:27', NULL, NULL, 0, 37.15355690, -3.59966710, '37.1535569, -3.5996671', 'entrada');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tareas`
--

CREATE TABLE `tareas` (
  `id` int(11) NOT NULL,
  `titulo` varchar(255) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `estado` enum('pendiente','en_progreso','completada','cancelada') DEFAULT 'pendiente',
  `prioridad` enum('baja','media','alta') DEFAULT 'media',
  `fecha_creacion` datetime DEFAULT current_timestamp(),
  `fecha_vencimiento` date DEFAULT NULL,
  `fecha_completada` datetime DEFAULT NULL,
  `NIF_creador` varchar(15) NOT NULL,
  `NIF_asignado` varchar(15) NOT NULL,
  `departamento` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `tareas`
--

INSERT INTO `tareas` (`id`, `titulo`, `descripcion`, `estado`, `prioridad`, `fecha_creacion`, `fecha_vencimiento`, `fecha_completada`, `NIF_creador`, `NIF_asignado`, `departamento`) VALUES
(1, 'Revisar equipos de red', 'Realizar revisi¾n de todos los equipos de red en la oficina central y actualizar firmware si es necesario', 'en_progreso', 'alta', '2025-04-02 13:57:44', '2025-04-15', NULL, '12345678A', '98765432B', 'Ventas'),
(2, 'Preparar informe mensual', 'Elaborar el informe de ventas del mes de marzo con comparativa del trimestre anterior', 'en_progreso', 'media', '2025-04-02 13:57:52', '2025-04-10', NULL, '12345678A', '98765432B', 'Ventas');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuarios`
--

CREATE TABLE `usuarios` (
  `NIF` varchar(15) NOT NULL,
  `nombre` varchar(50) NOT NULL,
  `apellidos` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `pswd` varchar(255) NOT NULL,
  `dpto` varchar(50) DEFAULT NULL,
  `centro` varchar(50) DEFAULT NULL,
  `tipo_Usu` enum('admin','empleado','supervisor') NOT NULL DEFAULT 'empleado',
  `id_avatar` int(11) DEFAULT NULL,
  `permitir_pausas` tinyint(1) NOT NULL DEFAULT 1 COMMENT '1=permitir pausas, 0=no permitir',
  `activo` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `usuarios`
--

INSERT INTO `usuarios` (`NIF`, `nombre`, `apellidos`, `email`, `pswd`, `dpto`, `centro`, `tipo_Usu`, `id_avatar`, `permitir_pausas`, `activo`) VALUES
('12345678A', 'Admin', 'Sistema', 'admin@impulsatelecom.com', '$2y$10$XFvlfrAGkm8H8Y5.hvKAXO4x0ICsQPEAB9NMR/LVUVnvIpj5h0nPe', 'IT', 'Sede Central', 'admin', 1, 1, 1),
('34567890D', 'Carlos', 'Rodríguez Sánchez', 'carlos.rodriguez@impulsatelecom.com', '$2y$10$hKu9B.K9.r1rnMePvKj81OBsLNxGIOdxOQJLqpXjDn1alwv8YK7Uy', 'Soporte', 'Valencia', 'supervisor', 4, 1, 1),
('56789012C', 'María', 'García Martínez', 'maria.garcia@impulsatelecom.com', '$2y$10$hKu9B.K9.r1rnMePvKj81OBsLNxGIOdxOQJLqpXjDn1alwv8YK7Uy', 'Marketing', 'Barcelona', 'empleado', 3, 0, 1),
('98765432B', 'Juan', 'Pérez López', 'juan.perez@impulsatelecom.com', '$2y$10$LicS6g26QCmH1IXJdtlMJe1bbsw.CJb4l5vA3wegbhLRlMvcq9puq', 'Ventas', 'Madrid', 'empleado', 214, 1, 1);

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `avatares`
--
ALTER TABLE `avatares`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `registros`
--
ALTER TABLE `registros`
  ADD PRIMARY KEY (`idRegistro`),
  ADD KEY `idx_registros_nif` (`NIF`),
  ADD KEY `idx_registros_fecha` (`fecha`);

--
-- Indices de la tabla `tareas`
--
ALTER TABLE `tareas`
  ADD PRIMARY KEY (`id`),
  ADD KEY `NIF_creador` (`NIF_creador`),
  ADD KEY `idx_nif_asignado` (`NIF_asignado`),
  ADD KEY `idx_departamento` (`departamento`),
  ADD KEY `idx_estado` (`estado`),
  ADD KEY `idx_fecha_vencimiento` (`fecha_vencimiento`);

--
-- Indices de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`NIF`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `idx_usuarios_email` (`email`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `avatares`
--
ALTER TABLE `avatares`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=262;

--
-- AUTO_INCREMENT de la tabla `registros`
--
ALTER TABLE `registros`
  MODIFY `idRegistro` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;

--
-- AUTO_INCREMENT de la tabla `tareas`
--
ALTER TABLE `tareas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `registros`
--
ALTER TABLE `registros`
  ADD CONSTRAINT `registros_ibfk_1` FOREIGN KEY (`NIF`) REFERENCES `usuarios` (`NIF`);

--
-- Filtros para la tabla `tareas`
--
ALTER TABLE `tareas`
  ADD CONSTRAINT `tareas_ibfk_1` FOREIGN KEY (`NIF_creador`) REFERENCES `usuarios` (`NIF`),
  ADD CONSTRAINT `tareas_ibfk_2` FOREIGN KEY (`NIF_asignado`) REFERENCES `usuarios` (`NIF`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
