-- Tabla de horarios para asignación a usuarios
CREATE TABLE IF NOT EXISTS `horarios` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `hora_inicio` time NOT NULL,
  `hora_fin` time NOT NULL,
  `lunes` tinyint(1) NOT NULL DEFAULT 1,
  `martes` tinyint(1) NOT NULL DEFAULT 1,
  `miercoles` tinyint(1) NOT NULL DEFAULT 1,
  `jueves` tinyint(1) NOT NULL DEFAULT 1,
  `viernes` tinyint(1) NOT NULL DEFAULT 1,
  `sabado` tinyint(1) NOT NULL DEFAULT 0,
  `domingo` tinyint(1) NOT NULL DEFAULT 0,
  `tiempo_pausa_permitido` int(11) DEFAULT 60 COMMENT 'Tiempo de pausa permitido en minutos',
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  `fecha_creacion` timestamp NOT NULL DEFAULT current_timestamp(),
  `fecha_modificacion` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Añadir campo id_horario a la tabla usuarios
ALTER TABLE `usuarios` ADD COLUMN `id_horario` int(11) DEFAULT NULL;

-- Añadir clave foránea para relacionar usuarios con horarios
ALTER TABLE `usuarios` ADD CONSTRAINT `fk_usuarios_horarios` FOREIGN KEY (`id_horario`) REFERENCES `horarios` (`id`) ON DELETE SET NULL;

-- Insertar algunos horarios de ejemplo
INSERT INTO `horarios` (`nombre`, `descripcion`, `hora_inicio`, `hora_fin`, `lunes`, `martes`, `miercoles`, `jueves`, `viernes`, `sabado`, `domingo`, `tiempo_pausa_permitido`) VALUES
('Jornada Completa', 'Horario estándar de oficina de lunes a viernes', '09:00:00', '18:00:00', 1, 1, 1, 1, 1, 0, 0, 60),
('Media Jornada Mañana', 'Horario de media jornada por la mañana', '09:00:00', '13:00:00', 1, 1, 1, 1, 1, 0, 0, 30),
('Media Jornada Tarde', 'Horario de media jornada por la tarde', '14:00:00', '18:00:00', 1, 1, 1, 1, 1, 0, 0, 30),
('Jornada Intensiva', 'Horario intensivo sin pausa para comida', '08:00:00', '15:00:00', 1, 1, 1, 1, 1, 0, 0, 30),
('Fin de Semana', 'Horario para trabajadores de fin de semana', '10:00:00', '19:00:00', 0, 0, 0, 0, 0, 1, 1, 60);