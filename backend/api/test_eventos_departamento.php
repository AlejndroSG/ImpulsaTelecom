<?php
// Configuraciu00f3n de errores - Mostrar todos los errores para depuraciu00f3n
error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);

// Incluir configuraciu00f3n de base de datos y modelo de eventos
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../modelos/Evento.php';

// Crear conexiu00f3n a la base de datos
$database = new Database();
$conn = $database->getConnection();

// Crear instancia del modelo de eventos
$modeloEvento = new Evento($conn);

echo "<h1>Prueba de Eventos por Departamento</h1>";

// Obtener departamentos u00fanicos
echo "<h2>Departamentos disponibles</h2>";
try {
    $query = "SELECT DISTINCT dpto FROM usuarios WHERE dpto IS NOT NULL ORDER BY dpto";
    $stmt = $conn->query($query);
    $departamentos = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (count($departamentos) > 0) {
        echo "<ul>";
        foreach ($departamentos as $depto) {
            echo "<li>{$depto['dpto']}</li>";
        }
        echo "</ul>";
    } else {
        echo "<p style='color:orange'>No hay departamentos asignados a ninguu00fan usuario.</p>";
    }
} catch (PDOException $e) {
    echo "<p style='color:red'>Error al listar departamentos: " . $e->getMessage() . "</p>";
}

// Formulario para probar la obtenciou00f3n de eventos
echo "<h2>Probar obtenciou00f3n de eventos</h2>";
echo "<form method='get' action='" . $_SERVER['PHP_SELF'] . "'>";

// Seleccionar departamento
echo "<label for='dpto'>Departamento:</label>";
echo "<select name='dpto' id='dpto'>";
echo "<option value=''>Todos los departamentos</option>";

foreach ($departamentos as $depto) {
    $selected = (isset($_GET['dpto']) && $_GET['dpto'] === $depto['dpto']) ? 'selected' : '';
    echo "<option value='{$depto['dpto']}' $selected>{$depto['dpto']}</option>";
}

echo "</select>";
echo "<br><br>";

// Fechas
echo "<label for='fecha_inicio'>Fecha inicio:</label>";
$fecha_inicio_value = isset($_GET['fecha_inicio']) ? $_GET['fecha_inicio'] : '';
echo "<input type='date' name='fecha_inicio' id='fecha_inicio' value='$fecha_inicio_value'>";
echo "<br><br>";

echo "<label for='fecha_fin'>Fecha fin:</label>";
$fecha_fin_value = isset($_GET['fecha_fin']) ? $_GET['fecha_fin'] : '';
echo "<input type='date' name='fecha_fin' id='fecha_fin' value='$fecha_fin_value'>";
echo "<br><br>";

echo "<button type='submit'>Buscar eventos</button>";
echo "</form>";

// Procesar la bu00fasqueda de eventos
if (isset($_GET['dpto']) || isset($_GET['fecha_inicio']) || isset($_GET['fecha_fin'])) {
    $dpto = isset($_GET['dpto']) ? $_GET['dpto'] : null;
    $fecha_inicio = isset($_GET['fecha_inicio']) && !empty($_GET['fecha_inicio']) ? $_GET['fecha_inicio'] : null;
    $fecha_fin = isset($_GET['fecha_fin']) && !empty($_GET['fecha_fin']) ? $_GET['fecha_fin'] : null;
    
    echo "<h2>Resultados de la bu00fasqueda</h2>";
    echo "<p>Departamento: " . ($dpto ?: 'Todos') . "</p>";
    echo "<p>Fecha inicio: " . ($fecha_inicio ?: 'No especificada') . "</p>";
    echo "<p>Fecha fin: " . ($fecha_fin ?: 'No especificada') . "</p>";
    
    try {
        $resultado = $modeloEvento->obtenerEventosPorDepartamento($dpto, $fecha_inicio, $fecha_fin);
        
        echo "<h3>Respuesta de la API</h3>";
        echo "<pre>" . json_encode($resultado, JSON_PRETTY_PRINT) . "</pre>";
        
        if ($resultado['success']) {
            echo "<h3>Eventos encontrados: " . count($resultado['eventos']) . "</h3>";
            
            if (count($resultado['eventos']) > 0) {
                echo "<table border='1'>";
                echo "<tr>";
                echo "<th>ID</th>";
                echo "<th>Tu00edtulo</th>";
                echo "<th>Descripciu00f3n</th>";
                echo "<th>Fecha inicio</th>";
                echo "<th>Fecha fin</th>";
                echo "<th>Usuario</th>";
                echo "</tr>";
                
                foreach ($resultado['eventos'] as $evento) {
                    echo "<tr>";
                    echo "<td>{$evento['id']}</td>";
                    echo "<td>{$evento['titulo']}</td>";
                    echo "<td>{$evento['descripcion']}</td>";
                    echo "<td>{$evento['fecha_inicio']}</td>";
                    echo "<td>{$evento['fecha_fin']}</td>";
                    echo "<td>{$evento['nombre_usuario']} {$evento['apellidos_usuario']}</td>";
                    echo "</tr>";
                }
                
                echo "</table>";
            } else {
                echo "<p>No se encontraron eventos con los criterios especificados.</p>";
            }
        } else {
            echo "<p style='color:red'>Error: {$resultado['message']}</p>";
        }
    } catch (Exception $e) {
        echo "<p style='color:red'>Error al obtener eventos: " . $e->getMessage() . "</p>";
    }
}
?>
