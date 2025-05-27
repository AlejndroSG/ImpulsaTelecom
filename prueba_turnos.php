<?php
// Script para probar la funcionalidad de turnos inactivos

// Incluir el modelo de Turno
require_once "backend/modelos/Turno.php";
$modelo = new Turno();

echo "<h1>Prueba de Funcionalidades de Turnos</h1>";

// 1. Crear un turno de prueba (desactivado)
$turno_test = [
    'nif_usuario' => '11111111A', // Asumiendo que este usuario existe
    'id_horario' => 1,            // Asumiendo que este horario existe
    'orden' => 1,
    'dias_semana' => '1,2,3,4,5',
    'semanas_mes' => '1,2',
    'nombre' => 'Turno de Prueba ' . time(),
    'activo' => 0                 // Creamos el turno inactivo
];

// 2. Buscar si existe un turno similar
$resultado_busqueda = $modelo->buscarTurnoInactivoSimilar([
    'nif_usuario' => '11111111A',
    'id_horario' => 1,
    'dias_semana' => '1,2,3,4,5',
    'semanas_mes' => '1,2'
]);

echo "<h2>Resultado de búsqueda de turno similar:</h2>";
echo "<pre>";
print_r($resultado_busqueda);
echo "</pre>";

// Si no se encuentra un turno similar, crear uno para pruebas
if (!$resultado_busqueda['encontrado']) {
    echo "<p>No se encontró un turno similar. Creando uno de prueba...</p>";
    
    // Guardar en la base de datos
    $stmt = $modelo->conn->prepare(
        "INSERT INTO turnos (nif_usuario, id_horario, orden, dias_semana, semanas_mes, nombre, activo) 
         VALUES (?, ?, ?, ?, ?, ?, ?)"
    );
    
    $stmt->bind_param(
        "siisssi", 
        $turno_test['nif_usuario'],
        $turno_test['id_horario'],
        $turno_test['orden'],
        $turno_test['dias_semana'],
        $turno_test['semanas_mes'],
        $turno_test['nombre'],
        $turno_test['activo']
    );
    
    if ($stmt->execute()) {
        $turno_test['id'] = $modelo->conn->insert_id;
        echo "<p>Turno de prueba creado con ID: {$turno_test['id']}</p>";
        
        // Ahora buscar de nuevo
        $resultado_busqueda = $modelo->buscarTurnoInactivoSimilar([
            'nif_usuario' => '11111111A',
            'id_horario' => 1,
            'dias_semana' => '1,2,3,4,5',
            'semanas_mes' => '1,2'
        ]);
        
        echo "<h2>Nuevo resultado de búsqueda:</h2>";
        echo "<pre>";
        print_r($resultado_busqueda);
        echo "</pre>";
    } else {
        echo "<p>Error al crear turno de prueba: " . $stmt->error . "</p>";
    }
}

// Probar reactivación si tenemos un turno inactivo
if (isset($resultado_busqueda['turno']['id'])) {
    $turno_id = $resultado_busqueda['turno']['id'];
    
    echo "<h2>Reactivación de turno</h2>";
    echo "<p>Intentando reactivar turno con ID: {$turno_id}</p>";
    
    $resultado_reactivacion = $modelo->reactivar($turno_id);
    
    echo "<pre>";
    print_r($resultado_reactivacion);
    echo "</pre>";
}

echo "<p><a href='prueba_turnos.php?accion=limpiar'>Limpiar turnos de prueba</a></p>";

// Opción para limpiar los turnos de prueba
if (isset($_GET['accion']) && $_GET['accion'] === 'limpiar') {
    $resultado_limpieza = $modelo->conn->query("DELETE FROM turnos WHERE nombre LIKE 'Turno de Prueba%'");
    
    if ($resultado_limpieza) {
        echo "<p>Turnos de prueba eliminados. Filas afectadas: {$modelo->conn->affected_rows}</p>";
    } else {
        echo "<p>Error al eliminar turnos de prueba: {$modelo->conn->error}</p>";
    }
}
?>
