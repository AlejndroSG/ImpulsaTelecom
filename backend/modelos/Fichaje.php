<?php
class Fichaje {
    private $conn;
    private $table_name = "fichajes";
    private $table_pausas = "pausas_fichaje";
    
    // Propiedades del objeto
    public $id;
    public $id_usuario;
    public $fecha;
    public $hora_entrada;
    public $hora_salida;
    public $estado;
    public $tiempo_total;
    public $tiempo_pausas;
    
    // Constructor con conexión a la base de datos
    public function __construct($db) {
        $this->conn = $db;
    }
    
    // Obtener el fichaje actual del usuario
    public function getFichajeActual($id_usuario) {
        // Consultar si hay un fichaje activo para hoy
        $query = "SELECT * FROM " . $this->table_name . " 
                  WHERE id_usuario = ? 
                  AND fecha = CURDATE() 
                  AND (hora_salida IS NULL OR hora_salida = '')
                  ORDER BY id DESC LIMIT 1";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $id_usuario);
        $stmt->execute();
        
        if ($stmt->rowCount() > 0) {
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            
            // Obtener pausas asociadas a este fichaje
            $pausas = $this->getPausasByFichaje($row['id']);
            
            return [
                'success' => true,
                'fichaje' => $row,
                'pausas' => $pausas,
                'estado' => $this->getEstadoFichaje($row['id'])
            ];
        }
        
        return [
            'success' => false,
            'message' => 'No hay fichaje activo para hoy',
            'estado' => 'pendiente'
        ];
    }
    
    // Obtener el estado actual del fichaje
    private function getEstadoFichaje($id_fichaje) {
        // Verificar si hay una pausa activa
        $query = "SELECT * FROM " . $this->table_pausas . " 
                  WHERE id_fichaje = ? 
                  AND hora_fin IS NULL
                  ORDER BY id DESC LIMIT 1";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $id_fichaje);
        $stmt->execute();
        
        if ($stmt->rowCount() > 0) {
            return 'pausado';
        }
        
        // Verificar si el fichaje tiene hora de salida
        $query = "SELECT hora_salida FROM " . $this->table_name . " 
                  WHERE id = ?";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $id_fichaje);
        $stmt->execute();
        
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!empty($row['hora_salida'])) {
            return 'finalizado';
        }
        
        return 'trabajando';
    }
    
    // Obtener las pausas de un fichaje
    private function getPausasByFichaje($id_fichaje) {
        $query = "SELECT * FROM " . $this->table_pausas . " 
                  WHERE id_fichaje = ? 
                  ORDER BY id ASC";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $id_fichaje);
        $stmt->execute();
        
        $pausas = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $pausas[] = $row;
        }
        
        return $pausas;
    }
    
    // Registrar entrada
    public function registrarEntrada($id_usuario, $fecha, $hora) {
        // Verificar si ya existe un fichaje activo
        $fichaje_actual = $this->getFichajeActual($id_usuario);
        
        if ($fichaje_actual['success']) {
            return [
                'success' => false,
                'message' => 'Ya existe un fichaje activo para hoy'
            ];
        }
        
        // Insertar nuevo fichaje
        $query = "INSERT INTO " . $this->table_name . " 
                  (id_usuario, fecha, hora_entrada) 
                  VALUES (?, ?, ?)";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $id_usuario);
        $stmt->bindParam(2, $fecha);
        $stmt->bindParam(3, $hora);
        
        if ($stmt->execute()) {
            $id_fichaje = $this->conn->lastInsertId();
            
            return [
                'success' => true,
                'message' => 'Entrada registrada correctamente',
                'id_fichaje' => $id_fichaje,
                'estado' => 'trabajando'
            ];
        }
        
        return [
            'success' => false,
            'message' => 'Error al registrar la entrada'
        ];
    }
    
    // Registrar salida
    public function registrarSalida($id_usuario, $id_fichaje, $hora) {
        // Verificar que el fichaje pertenece al usuario
        $query = "SELECT * FROM " . $this->table_name . " 
                  WHERE id = ? AND id_usuario = ?";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $id_fichaje);
        $stmt->bindParam(2, $id_usuario);
        $stmt->execute();
        
        if ($stmt->rowCount() === 0) {
            return [
                'success' => false,
                'message' => 'El fichaje no pertenece al usuario'
            ];
        }
        
        // Verificar si hay pausas activas y cerrarlas
        $this->finalizarPausasActivas($id_fichaje, $hora);
        
        // Actualizar hora de salida
        $query = "UPDATE " . $this->table_name . " 
                  SET hora_salida = ? 
                  WHERE id = ?";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $hora);
        $stmt->bindParam(2, $id_fichaje);
        
        if ($stmt->execute()) {
            // Calcular tiempo total y tiempo de pausas
            $this->calcularTiempos($id_fichaje);
            
            return [
                'success' => true,
                'message' => 'Salida registrada correctamente',
                'estado' => 'finalizado'
            ];
        }
        
        return [
            'success' => false,
            'message' => 'Error al registrar la salida'
        ];
    }
    
    // Registrar pausa
    public function registrarPausa($id_usuario, $id_fichaje, $tipo, $hora) {
        // Verificar que el fichaje pertenece al usuario
        $query = "SELECT * FROM " . $this->table_name . " 
                  WHERE id = ? AND id_usuario = ?";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $id_fichaje);
        $stmt->bindParam(2, $id_usuario);
        $stmt->execute();
        
        if ($stmt->rowCount() === 0) {
            return [
                'success' => false,
                'message' => 'El fichaje no pertenece al usuario'
            ];
        }
        
        if ($tipo === 'inicio') {
            // Verificar que no haya pausas activas
            $query = "SELECT * FROM " . $this->table_pausas . " 
                      WHERE id_fichaje = ? AND hora_fin IS NULL";
            
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(1, $id_fichaje);
            $stmt->execute();
            
            if ($stmt->rowCount() > 0) {
                return [
                    'success' => false,
                    'message' => 'Ya existe una pausa activa'
                ];
            }
            
            // Insertar nueva pausa
            $query = "INSERT INTO " . $this->table_pausas . " 
                      (id_fichaje, hora_inicio) 
                      VALUES (?, ?)";
            
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(1, $id_fichaje);
            $stmt->bindParam(2, $hora);
            
            if ($stmt->execute()) {
                $id_pausa = $this->conn->lastInsertId();
                
                return [
                    'success' => true,
                    'message' => 'Pausa iniciada correctamente',
                    'id_pausa' => $id_pausa,
                    'estado' => 'pausado'
                ];
            }
        } else if ($tipo === 'fin') {
            // Buscar la pausa activa
            $query = "SELECT * FROM " . $this->table_pausas . " 
                      WHERE id_fichaje = ? AND hora_fin IS NULL
                      ORDER BY id DESC LIMIT 1";
            
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(1, $id_fichaje);
            $stmt->execute();
            
            if ($stmt->rowCount() === 0) {
                return [
                    'success' => false,
                    'message' => 'No hay pausas activas'
                ];
            }
            
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            $id_pausa = $row['id'];
            
            // Actualizar hora de fin
            $query = "UPDATE " . $this->table_pausas . " 
                      SET hora_fin = ? 
                      WHERE id = ?";
            
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(1, $hora);
            $stmt->bindParam(2, $id_pausa);
            
            if ($stmt->execute()) {
                return [
                    'success' => true,
                    'message' => 'Pausa finalizada correctamente',
                    'estado' => 'trabajando'
                ];
            }
        }
        
        return [
            'success' => false,
            'message' => 'Error al registrar la pausa'
        ];
    }
    
    // Finalizar pausas activas
    private function finalizarPausasActivas($id_fichaje, $hora) {
        $query = "UPDATE " . $this->table_pausas . " 
                  SET hora_fin = ? 
                  WHERE id_fichaje = ? AND hora_fin IS NULL";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $hora);
        $stmt->bindParam(2, $id_fichaje);
        $stmt->execute();
    }
    
    // Calcular tiempos totales
    private function calcularTiempos($id_fichaje) {
        // Obtener datos del fichaje
        $query = "SELECT hora_entrada, hora_salida FROM " . $this->table_name . " 
                  WHERE id = ?";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $id_fichaje);
        $stmt->execute();
        
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        
        $hora_entrada = strtotime($row['hora_entrada']);
        $hora_salida = strtotime($row['hora_salida']);
        
        $tiempo_total = $hora_salida - $hora_entrada; // en segundos
        
        // Calcular tiempo de pausas
        $query = "SELECT SUM(TIMESTAMPDIFF(SECOND, hora_inicio, hora_fin)) as tiempo_pausas 
                  FROM " . $this->table_pausas . " 
                  WHERE id_fichaje = ? AND hora_fin IS NOT NULL";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $id_fichaje);
        $stmt->execute();
        
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        $tiempo_pausas = $row['tiempo_pausas'] ? $row['tiempo_pausas'] : 0;
        
        // Actualizar tiempos en el fichaje
        $query = "UPDATE " . $this->table_name . " 
                  SET tiempo_total = ?, tiempo_pausas = ? 
                  WHERE id = ?";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $tiempo_total);
        $stmt->bindParam(2, $tiempo_pausas);
        $stmt->bindParam(3, $id_fichaje);
        $stmt->execute();
    }
    
    // Obtener historial de fichajes por usuario
    public function getHistorialByUsuario($id_usuario) {
        $query = "SELECT f.*, 
                  TIME_FORMAT(f.hora_entrada, '%H:%i') as hora_entrada_formato,
                  TIME_FORMAT(f.hora_salida, '%H:%i') as hora_salida_formato,
                  SEC_TO_TIME(f.tiempo_total) as tiempo_total_formato,
                  SEC_TO_TIME(f.tiempo_pausas) as tiempo_pausas_formato,
                  SEC_TO_TIME(f.tiempo_total - f.tiempo_pausas) as tiempo_efectivo_formato
                  FROM " . $this->table_name . " f
                  WHERE f.id_usuario = ?
                  ORDER BY f.fecha DESC, f.hora_entrada DESC
                  LIMIT 30";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $id_usuario);
        $stmt->execute();
        
        $fichajes = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            // Determinar estado
            if (empty($row['hora_salida'])) {
                $estado = $this->getEstadoFichaje($row['id']);
            } else {
                $estado = 'completado';
            }
            
            $row['estado'] = $estado;
            $fichajes[] = $row;
        }
        
        return [
            'success' => true,
            'fichajes' => $fichajes
        ];
    }
    
    // Obtener estadísticas de fichajes
    public function getEstadisticas($id_usuario, $periodo) {
        $where_clause = "WHERE f.id_usuario = ?";
        
        switch ($periodo) {
            case 'semana':
                $where_clause .= " AND f.fecha >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)";
                break;
            case 'mes':
                $where_clause .= " AND f.fecha >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)";
                break;
            case 'año':
                $where_clause .= " AND f.fecha >= DATE_SUB(CURDATE(), INTERVAL 365 DAY)";
                break;
        }
        
        // Estadísticas generales
        $query = "SELECT 
                  COUNT(*) as total_fichajes,
                  COUNT(DISTINCT DATE(f.fecha)) as dias_trabajados,
                  SEC_TO_TIME(SUM(f.tiempo_total)) as tiempo_total,
                  SEC_TO_TIME(SUM(f.tiempo_pausas)) as tiempo_pausas,
                  SEC_TO_TIME(SUM(f.tiempo_total - f.tiempo_pausas)) as tiempo_efectivo,
                  TIME_FORMAT(SEC_TO_TIME(AVG(f.tiempo_total - f.tiempo_pausas)), '%H:%i') as promedio_diario
                  FROM " . $this->table_name . " f
                  " . $where_clause;
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $id_usuario);
        $stmt->execute();
        
        $estadisticas = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Distribución por día de la semana
        $query = "SELECT 
                  DAYNAME(f.fecha) as dia_semana,
                  COUNT(*) as total_fichajes,
                  SEC_TO_TIME(SUM(f.tiempo_total - f.tiempo_pausas)) as tiempo_efectivo
                  FROM " . $this->table_name . " f
                  " . $where_clause . "
                  GROUP BY DAYNAME(f.fecha)
                  ORDER BY DAYOFWEEK(f.fecha)";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $id_usuario);
        $stmt->execute();
        
        $distribucion_dias = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $distribucion_dias[] = $row;
        }
        
        return [
            'success' => true,
            'estadisticas' => $estadisticas,
            'distribucion_dias' => $distribucion_dias,
            'periodo' => $periodo
        ];
    }
}
?>
