CREATE TABLE IF NOT EXISTS `documentos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `titulo` varchar(255) NOT NULL,
  `descripcion` text,
  `ruta_archivo` varchar(255) NOT NULL,
  `tipo_documento` varchar(50) NOT NULL,
  `tamanio` int(11) NOT NULL,
  `nif_usuario` varchar(15) NOT NULL,
  `creado_por` varchar(15) NOT NULL,
  `fecha_subida` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `acceso_publico` tinyint(1) NOT NULL DEFAULT '0',
  `fecha_expiracion` date DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_nif_usuario` (`nif_usuario`),
  KEY `idx_tipo_documento` (`tipo_documento`),
  KEY `idx_creado_por` (`creado_por`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
