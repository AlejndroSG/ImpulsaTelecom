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

// Iniciar sesiu00f3n para pruebas
session_start();

echo "<h1>Prueba de Eventos Hu00edbridos</h1>";

// Formulario para iniciar sesiu00f3n
if (!isset($_SESSION['NIF'])) {
    echo "<h2>Iniciar sesiu00f3n para pruebas</h2>";
    echo "<form method='post' action='" . $_SERVER['PHP_SELF'] . "'>";
    echo "<label for='nif'>NIF:</label>";
    echo "<select name='nif' id='nif'>";
    
    try {
        $query = "SELECT NIF, nombre, apellidos FROM usuarios ORDER BY nombre";
        $stmt = $conn->query($query);
        $usuarios = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($usuarios as $usuario) {
            echo "<option value='{$usuario['NIF']}'>{$usuario['nombre']} {$usuario['apellidos']} ({$usuario['NIF']})</option>";
        }
    } catch (PDOException $e) {
        echo "<option value=''>Error al cargar usuarios</option>";
    }
    
    echo "</select>";
    echo "<button type='submit' name='login'>Iniciar sesiu00f3n</button>";
    echo "</form>";
    
    if (isset($_POST['login']) && isset($_POST['nif'])) {
        $_SESSION['NIF'] = $_POST['nif'];
        echo "<script>window.location.href = window.location.pathname;</script>";
    }
} else {
    // Mostrar usuario actual y opciu00f3n para cerrar sesiu00f3n
    try {
        $query = "SELECT nombre, apellidos, dpto FROM usuarios WHERE NIF = :NIF";
        $stmt = $conn->prepare($query);
        $stmt->bindParam(':NIF', $_SESSION['NIF']);
        $stmt->execute();
        $usuario = $stmt->fetch(PDO::FETCH_ASSOC);
        
        echo "<div style='background-color: #f0f0f0; padding: 10px; margin-bottom: 20px;'>";
        echo "<p><strong>Usuario actual:</strong> {$usuario['nombre']} {$usuario['apellidos']} (NIF: {$_SESSION['NIF']})";
        echo " | <strong>Departamento:</strong> " . ($usuario['dpto'] ?? 'No asignado');
        echo " | <a href='?logout=1'>Cerrar sesiu00f3n</a></p>";
        echo "</div>";
    } catch (PDOException $e) {
        echo "<p>Error al obtener informaciu00f3n del usuario: {$e->getMessage()}</p>";
    }
    
    // Cerrar sesiu00f3n si se solicita
    if (isset($_GET['logout'])) {
        session_destroy();
        echo "<script>window.location.href = window.location.pathname;</script>";
    }
    
    // Formulario para probar la obtenciou00f3n de eventos hu00edbridos
    echo "<h2>Probar obtenciou00f3n de eventos hu00edbridos</h2>";
    echo "<form method='get' action='" . $_SERVER['PHP_SELF'] . "'>";
    
    // Incluir eventos departamentales
    echo "<label><input type='checkbox' name='incluir_departamento' value='true' " . (isset($_GET['incluir_departamento']) ? 'checked' : '') . "> Incluir eventos departamentales</label>";
    echo "<br><br>";
    
    // Tipo de filtro
    echo "<label for='tipo'>Filtrar por tipo:</label>";
    echo "<select name='tipo' id='tipo'>";
    $tipos = ['todos' => 'Todos los eventos', 'personal' => 'Solo eventos personales', 'departamental' => 'Solo eventos departamentales'];
    foreach ($tipos as $valor => $texto) {
        $selected = (isset($_GET['tipo']) && $_GET['tipo'] === $valor) ? 'selected' : '';
        echo "<option value='$valor' $selected>$texto</option>";
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
    
    echo "<button type='submit' name='buscar'>Buscar eventos</button>";
    echo "</form>";
    
    // Procesar la bu00fasqueda de eventos
    if (isset($_GET['buscar'])) {
        $NIF = $_SESSION['NIF'];
        $dpto = isset($_GET['incluir_departamento']) ? obtenerDepartamentoUsuario($NIF) : null;
        $fecha_inicio = isset($_GET['fecha_inicio']) && !empty($_GET['fecha_inicio']) ? $_GET['fecha_inicio'] : null;
        $fecha_fin = isset($_GET['fecha_fin']) && !empty($_GET['fecha_fin']) ? $_GET['fecha_fin'] : null;
        $tipo_filtro = isset($_GET['tipo']) ? $_GET['tipo'] : 'todos';
        
        echo "<h2>Resultados de la bu00fasqueda</h2>";
        echo "<p><strong>Usuario:</strong> $NIF</p>";
        echo "<p><strong>Departamento:</strong> " . ($dpto ?: 'No incluido') . "</p>";
        echo "<p><strong>Tipo de filtro:</strong> $tipo_filtro</p>";
        echo "<p><strong>Fecha inicio:</strong> " . ($fecha_inicio ?: 'No especificada') . "</p>";
        echo "<p><strong>Fecha fin:</strong> " . ($fecha_fin ?: 'No especificada') . "</p>";
        
        try {
            $resultado = $modeloEvento->obtenerEventosHibridos($NIF, $dpto, $fecha_inicio, $fecha_fin);
            
            // Aplicar filtro por tipo si es necesario
            if ($resultado['success'] && $tipo_filtro !== 'todos') {
                $eventos_filtrados = [];
                foreach ($resultado['eventos'] as $evento) {
                    if ($evento['tipo_evento'] === $tipo_filtro) {
                        $eventos_filtrados[] = $evento;
                    }
                }
                $resultado['eventos'] = $eventos_filtrados;
                $resultado['debug']['count_filtrado'] = count($eventos_filtrados);
                $resultado['debug']['tipo_filtro'] = $tipo_filtro;
            }
            
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
                echo "<th>Tipo</th>";
                echo "</tr>";
                
                foreach ($resultado['eventos'] as $evento) {
                    $tipo_color = $evento['tipo_evento'] === 'personal' ? 'background-color: #e6f7ff;' : 'background-color: #fff0e6;';
                    echo "<tr style='$tipo_color'>";
                    echo "<td>{$evento['id']}</td>";
                    echo "<td>{$evento['titulo']}</td>";
                    echo "<td>{$evento['descripcion']}</td>";
                    echo "<td>{$evento['fecha_inicio']}</td>";
                    echo "<td>{$evento['fecha_fin']}</td>";
                    echo "<td>{$evento['nombre_usuario']} {$evento['apellidos_usuario']}</td>";
                    echo "<td>{$evento['tipo_evento']}</td>";
                    echo "</tr>";
                }
                
                echo "</table>";
            } else {
                echo "<p>No se encontraron eventos con los criterios especificados.</p>";
            }
            
            echo "<h3>Informaciu00f3n de depuraciu00f3n</h3>";
            echo "<pre>" . json_encode($resultado['debug'], JSON_PRETTY_PRINT) . "</pre>";
            
        } catch (Exception $e) {
            echo "<p style='color:red'>Error al obtener eventos: " . $e->getMessage() . "</p>";
        }
    }
}

// Funciu00f3n para obtener el departamento del usuario
function obtenerDepartamentoUsuario($NIF) {
    global $conn;
    
    try {
        $query = "SELECT dpto FROM usuarios WHERE NIF = :NIF";
        $stmt = $conn->prepare($query);
        $stmt->bindParam(':NIF', $NIF);
        $stmt->execute();
        $resultado = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($resultado && isset($resultado['dpto'])) {
            return $resultado['dpto'];
        }
        
        return null;
    } catch (PDOException $e) {
        error_log("Error al obtener departamento: " . $e->getMessage());
        return null;
    }
}
?>
