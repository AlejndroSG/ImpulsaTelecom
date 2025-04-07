-- Tabla de eventos para el calendario
CREATE TABLE IF NOT EXISTS `eventos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `titulo` varchar(255) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `fecha_inicio` datetime NOT NULL,
  `fecha_fin` datetime DEFAULT NULL,
  `tipo` varchar(50) NOT NULL DEFAULT 'evento',
  `color` varchar(20) DEFAULT '#3788d8',
  `NIF_usuario` varchar(10) NOT NULL,
  `id_departamento` int(11) DEFAULT NULL,
  `recurrente` tinyint(1) NOT NULL DEFAULT 0,
  `dia_completo` tinyint(1) NOT NULL DEFAULT 0,
  `fecha_creacion` timestamp NOT NULL DEFAULT current_timestamp(),
  `fecha_modificacion` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_eventos_usuarios` (`NIF_usuario`),
  KEY `fk_eventos_departamentos` (`id_departamento`),
  CONSTRAINT `fk_eventos_usuarios` FOREIGN KEY (`NIF_usuario`) REFERENCES `usuarios` (`NIF`) ON DELETE CASCADE,
  CONSTRAINT `fk_eventos_departamentos` FOREIGN KEY (`id_departamento`) REFERENCES `departamentos` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Insertar algunos eventos de ejemplo
INSERT INTO `eventos` (`titulo`, `descripcion`, `fecha_inicio`, `fecha_fin`, `tipo`, `color`, `NIF_usuario`, `id_departamento`, `recurrente`, `dia_completo`) VALUES
('Reuniu00f3n de equipo', 'Revisiu00f3n semanal de proyectos', '2025-04-08 10:00:00', '2025-04-08 11:30:00', 'reunion', '#4f46e5', '98765432B', 1, 0, 0),
('Formacin sobre atencin al cliente', 'Taller sobre mejoras en la atencin al cliente', '2025-04-10 09:00:00', '2025-04-10 13:00:00', 'formacion', '#f97316', '98765432B', 1, 0, 0),
('Da libre', 'Da de asuntos propios', '2025-04-15 00:00:00', '2025-04-15 23:59:59', 'ausencia', '#10b981', '98765432B', 1, 0, 1),
('Reunin departamental', 'Planificacin mensual', '2025-04-09 15:00:00', '2025-04-09 16:30:00', 'reunion', '#4f46e5', '87654321A', 2, 0, 0),
('Desarrollo de nueva funcionalidad', 'Implementacin de sistema de notificaciones', '2025-04-11 09:00:00', '2025-04-11 18:00:00', 'proyecto', '#ec4899', '87654321A', 2, 0, 0);
