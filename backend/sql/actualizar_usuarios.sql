-- Verificar si la columna ya existe
SELECT COUNT(*) INTO @exists FROM information_schema.columns 
WHERE table_schema = DATABASE() AND table_name = 'usuarios' AND column_name = 'permitir_pausas';

-- Agregar la columna si no existe
SET @query = IF(@exists = 0, 
    'ALTER TABLE usuarios ADD COLUMN permitir_pausas TINYINT(1) NOT NULL DEFAULT 1 COMMENT "1=permitir pausas, 0=no permitir"', 
    'SELECT "La columna permitir_pausas ya existe"');

PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
