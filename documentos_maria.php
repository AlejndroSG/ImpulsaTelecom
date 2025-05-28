<?php
// Script directo para mostrar los documentos de Maru00eda
header('Content-Type: text/html; charset=utf-8');

// Conexiu00f3n directa a la base de datos
$db = new mysqli("localhost", "root", "", "impulsatelecom", 3306);
if ($db->connect_error) {
    die("Error de conexiu00f3n: " . $db->connect_error);
}

// Consulta directa para obtener los documentos de Maru00eda
$nif = '56789012C'; // NIF de Maru00eda
$query = "SELECT * FROM documentos WHERE nif_usuario = ?";
$stmt = $db->prepare($query);
$stmt->bind_param("s", $nif);
$stmt->execute();
$result = $stmt->get_result();

// Estilo bu00e1sico para la pu00e1gina
echo "<html>\n<head>\n<title>Documentos de Maru00eda</title>\n";
echo "<style>\n";
echo "body { font-family: Arial, sans-serif; margin: 20px; }\n";
echo "h1 { color: #2c3e50; }\n";
echo "table { width: 100%; border-collapse: collapse; margin-top: 20px; }\n";
echo "th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }\n";
echo "th { background-color: #f2f2f2; }\n";
echo "tr:hover { background-color: #f5f5f5; }\n";
echo "</style>\n</head>\n<body>\n";

// Tu00edtulo de la pu00e1gina
echo "<h1>Documentos de Maru00eda (NIF: $nif)</h1>\n";

// Mostrar los documentos
if ($result->num_rows > 0) {
    echo "<p>Se encontraron " . $result->num_rows . " documentos:</p>\n";
    echo "<table>\n";
    echo "<tr><th>ID</th><th>Tu00edtulo</th><th>Descripciu00f3n</th><th>Fecha</th><th>Tipo</th></tr>\n";
    
    while ($row = $result->fetch_assoc()) {
        echo "<tr>\n";
        echo "<td>" . $row['id'] . "</td>\n";
        echo "<td>" . htmlspecialchars($row['titulo']) . "</td>\n";
        echo "<td>" . htmlspecialchars($row['descripcion'] ?? 'Sin descripciu00f3n') . "</td>\n";
        echo "<td>" . date('d/m/Y H:i', strtotime($row['fecha_subida'])) . "</td>\n";
        echo "<td>" . htmlspecialchars($row['tipo_documento']) . "</td>\n";
        echo "</tr>\n";
    }
    
    echo "</table>\n";
} else {
    echo "<p>No se encontraron documentos para Maru00eda.</p>\n";
}

// Mostrar una tabla con todos los documentos para depuraciu00f3n
echo "<h2>Todos los documentos en la base de datos</h2>\n";
$query_all = "SELECT * FROM documentos";
$result_all = $db->query($query_all);

if ($result_all->num_rows > 0) {
    echo "<table>\n";
    echo "<tr><th>ID</th><th>Tu00edtulo</th><th>NIF Usuario</th><th>Fecha</th></tr>\n";
    
    while ($row = $result_all->fetch_assoc()) {
        echo "<tr>\n";
        echo "<td>" . $row['id'] . "</td>\n";
        echo "<td>" . htmlspecialchars($row['titulo']) . "</td>\n";
        echo "<td>" . htmlspecialchars($row['nif_usuario']) . "</td>\n";
        echo "<td>" . date('d/m/Y H:i', strtotime($row['fecha_subida'])) . "</td>\n";
        echo "</tr>\n";
    }
    
    echo "</table>\n";
} else {
    echo "<p>No hay documentos en la base de datos.</p>\n";
}

// Mostrar informaciu00f3n del usuario Maru00eda
echo "<h2>Informaciu00f3n del usuario</h2>\n";
$query_user = "SELECT * FROM usuarios WHERE NIF = ?";
$stmt_user = $db->prepare($query_user);
$stmt_user->bind_param("s", $nif);
$stmt_user->execute();
$result_user = $stmt_user->get_result();

if ($result_user->num_rows > 0) {
    $user = $result_user->fetch_assoc();
    echo "<p><strong>NIF:</strong> " . htmlspecialchars($user['NIF']) . "</p>\n";
    echo "<p><strong>Nombre:</strong> " . htmlspecialchars($user['nombre']) . " " . htmlspecialchars($user['apellidos']) . "</p>\n";
    echo "<p><strong>Email:</strong> " . htmlspecialchars($user['email']) . "</p>\n";
} else {
    echo "<p>No se encontru00f3 informaciu00f3n del usuario.</p>\n";
}

// Cerrar la conexiu00f3n
$db->close();

echo "</body>\n</html>";
?>
