-- Añadir columna permitir_pausas a la tabla usuarios
ALTER TABLE usuarios ADD COLUMN permitir_pausas TINYINT(1) NOT NULL DEFAULT 1;
