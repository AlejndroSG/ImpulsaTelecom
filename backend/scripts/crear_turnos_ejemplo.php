<?php
// Script para crear turnos de ejemplo para los usuarios que no tienen turnos asignados
$baseDir = dirname(__DIR__);
include_once "$baseDir/modelos/Turno.php";
include_once "$baseDir/modelos/bd.php";

// Configuración inicial
$db = new db();
$conn = $db->getConn();
$modelo = new Turno();

// Obtener todos los usuarios empleados
$query = "SELECT NIF, nombre, apellidos FROM usuarios WHERE tipo_Usu = 'empleado'";
$result = $conn->query($query);

if (!$result) {
    // Si falla, intentar con estructura alternativa
    $query = "SHOW COLUMNS FROM usuarios LIKE 'tipo%'";
    $columnsResult = $conn->query($query);
    
    if ($columnsResult && $columnsResult->num_rows > 0) {
        $column = $columnsResult->fetch_assoc();
        $tipoColumn = $column['Field'];
        
        $query = "SELECT NIF, nombre, apellidos FROM usuarios WHERE $tipoColumn = 'empleado'";
        $result = $conn->query($query);
        
        if (!$result) {
            die("Error al obtener usuarios: " . $conn->error);
        }
    } else {
        // Si no podemos determinar la columna de tipo, seleccionar todos los usuarios excepto admin
        $query = "SELECT NIF, nombre, apellidos FROM usuarios WHERE NIF != 'admin'";
        $result = $conn->query($query);
        
        if (!$result) {
            die("Error al obtener usuarios: " . $conn->error);
        }
    }
}

$usuarios = [];
while ($row = $result->fetch_assoc()) {
    $usuarios[] = $row;
}

echo "Encontrados " . count($usuarios) . " usuarios empleados.\n";

// Definir horarios disponibles para los turnos
$query = "SELECT id, nombre, hora_inicio, hora_fin FROM horarios WHERE activo = 1";
$result = $conn->query($query);

if (!$result) {
    die("Error al obtener horarios: " . $conn->error);
}

$horarios = [];
while ($row = $result->fetch_assoc()) {
    $horarios[] = $row;
}

if (count($horarios) === 0) {
    // Crear horarios de ejemplo si no existen
    echo "No se encontraron horarios activos. Creando horarios de ejemplo...\n";
    
    $horariosEjemplo = [
        ["nombre" => "Mañana", "hora_inicio" => "08:00:00", "hora_fin" => "15:00:00"],
        ["nombre" => "Tarde", "hora_inicio" => "15:00:00", "hora_fin" => "22:00:00"],
        ["nombre" => "Noche", "hora_inicio" => "22:00:00", "hora_fin" => "06:00:00"],
        ["nombre" => "Jornada Completa", "hora_inicio" => "09:00:00", "hora_fin" => "18:00:00"]
    ];
    
    foreach ($horariosEjemplo as $horario) {
        $query = "INSERT INTO horarios (nombre, hora_inicio, hora_fin, activo) 
                  VALUES ('{$horario['nombre']}', '{$horario['hora_inicio']}', '{$horario['hora_fin']}', 1)";
        
        if ($conn->query($query)) {
            $id = $conn->insert_id;
            $horarios[] = [
                "id" => $id,
                "nombre" => $horario['nombre'],
                "hora_inicio" => $horario['hora_inicio'],
                "hora_fin" => $horario['hora_fin']
            ];
            echo "Creado horario: {$horario['nombre']}\n";
        } else {
            echo "Error al crear horario {$horario['nombre']}: " . $conn->error . "\n";
        }
    }
}

echo "Encontrados " . count($horarios) . " horarios disponibles.\n";

// Crear turnos para cada usuario que no tenga turnos asignados
$turnosCreados = 0;

foreach ($usuarios as $usuario) {
    // Verificar si el usuario ya tiene turnos
    $result = $modelo->getTurnosByUsuario($usuario['NIF']);
    
    if ($result['success'] && count($result['turnos']) > 0) {
        echo "Usuario {$usuario['nombre']} {$usuario['apellidos']} ya tiene " . count($result['turnos']) . " turnos asignados.\n";
        continue;
    }
    
    echo "Creando turnos para {$usuario['nombre']} {$usuario['apellidos']}...\n";
    
    // Crear turnos de ejemplo para este usuario
    $turnos = [
        [
            "nombre" => "Turno de Lunes a Viernes",
            "dias_semana" => "1,2,3,4,5",
            "semanas_mes" => "1,2,3,4,5",
            "orden" => 1,
            "id_horario" => $horarios[3]['id'] // Jornada Completa
        ],
        [
            "nombre" => "Turno Fin de Semana",
            "dias_semana" => "6,7",
            "semanas_mes" => "1,2,3,4,5",
            "orden" => 2,
            "id_horario" => $horarios[0]['id'] // Mañana
        ]
    ];
    
    foreach ($turnos as $turno) {
        $datos = [
            "nif_usuario" => $usuario['NIF'],
            "id_horario" => $turno['id_horario'],
            "orden" => $turno['orden'],
            "dias_semana" => $turno['dias_semana'],
            "nombre" => $turno['nombre'],
            "semanas_mes" => $turno['semanas_mes']
        ];
        
        $resultado = $modelo->crear($datos);
        
        if ($resultado['success']) {
            echo "  Creado turno: {$turno['nombre']} (ID: {$resultado['id']})\n";
            $turnosCreados++;
        } else {
            echo "  Error al crear turno {$turno['nombre']}: {$resultado['error']}\n";
        }
    }
}

echo "Proceso completado. Se crearon $turnosCreados turnos de ejemplo.\n";
?>
