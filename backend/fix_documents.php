<?php
// Archivo temporal para corregir el problema de documentos

// Conexión a la base de datos
require_once 'modelos/bd.php';
$connection = new db();
$db = $connection->getConn();

echo "<h1>Corrección de Documentos para María</h1>";

// 1. Verificar todos los documentos
echo "<h2>Listado de todos los documentos</h2>";
$query_all = "SELECT * FROM documentos";
$result_all = $db->query($query_all);

echo "<table border='1'>
<tr>
    <th>ID</th>
    <th>Título</th>
    <th>NIF Usuario</th>
    <th>Fecha</th>
</tr>";

if ($result_all && $result_all->num_rows > 0) {
    while ($row = $result_all->fetch_assoc()) {
        echo "<tr>
            <td>{$row['id']}</td>
            <td>{$row['titulo']}</td>
            <td>{$row['nif_usuario']}</td>
            <td>{$row['fecha_subida']}</td>
        </tr>";
    }
} else {
    echo "<tr><td colspan='4'>No hay documentos en la base de datos</td></tr>";
}
echo "</table>";

// 2. Corregir el documento de María
echo "<h2>Actualizando documento para María</h2>";

// Buscar documentos con el NIF "A-79766576"
$query_check = "SELECT * FROM documentos WHERE nif_usuario = 'A-79766576'";
$result_check = $db->query($query_check);

if ($result_check && $result_check->num_rows > 0) {
    echo "<p>Se encontraron " . $result_check->num_rows . " documentos con NIF A-79766576</p>";
    
    // Actualizar al NIF correcto
    $query_update = "UPDATE documentos SET nif_usuario = '56789012C' WHERE nif_usuario = 'A-79766576'";
    
    if ($db->query($query_update)) {
        echo "<p style='color:green;'>✅ Documentos actualizados correctamente al NIF 56789012C (María)</p>";
    } else {
        echo "<p style='color:red;'>❌ Error al actualizar: " . $db->error . "</p>";
    }
} else {
    echo "<p>No se encontraron documentos con NIF A-79766576</p>";
}

// 3. Crear un documento de prueba para María si no existe ninguno
echo "<h2>Creando documento de prueba para María</h2>";

$query_check_maria = "SELECT * FROM documentos WHERE nif_usuario = '56789012C'";
$result_check_maria = $db->query($query_check_maria);

if ($result_check_maria && $result_check_maria->num_rows > 0) {
    echo "<p>María ya tiene " . $result_check_maria->num_rows . " documentos asociados</p>";
} else {
    echo "<p>María no tiene documentos. Creando uno de prueba...</p>";
    
    // Crear documento de prueba
    $titulo = "Nómina María";
    $descripcion = "Documento de prueba para María";
    $ruta_archivo = "/uploads/documentos/nomina_maria.pdf";
    $tipo_documento = "nomina";
    $tamanio = 12345;
    $nif_usuario = "56789012C";
    $creado_por = "ADMIN";
    $acceso_publico = 1;
    
    $query_insert = "INSERT INTO documentos 
                    (titulo, descripcion, ruta_archivo, tipo_documento, tamanio, nif_usuario, creado_por, acceso_publico) 
                    VALUES 
                    ('$titulo', '$descripcion', '$ruta_archivo', '$tipo_documento', $tamanio, '$nif_usuario', '$creado_por', $acceso_publico)";
    
    if ($db->query($query_insert)) {
        $new_id = $db->insert_id;
        echo "<p style='color:green;'>✅ Documento de prueba creado para María (ID: $new_id)</p>";
    } else {
        echo "<p style='color:red;'>❌ Error al crear documento: " . $db->error . "</p>";
    }
}

// 4. Verificar usuarios
echo "<h2>Verificando usuarios</h2>";
$query_users = "SELECT * FROM usuarios WHERE nombre LIKE '%Maria%' OR nombre LIKE '%María%'";
$result_users = $db->query($query_users);

echo "<table border='1'>
<tr>
    <th>NIF</th>
    <th>Nombre</th>
    <th>Apellidos</th>
    <th>Correo</th>
</tr>";

if ($result_users && $result_users->num_rows > 0) {
    while ($row = $result_users->fetch_assoc()) {
        echo "<tr>
            <td>{$row['NIF']}</td>
            <td>{$row['nombre']}</td>
            <td>{$row['apellidos']}</td>
            <td>{$row['correo']}</td>
        </tr>";
    }
} else {
    echo "<tr><td colspan='4'>No se encontró el usuario María</td></tr>";
}
echo "</table>";

// 5. Verificar documentos finales
echo "<h2>Documentos finales después de las correcciones</h2>";
$query_final = "SELECT * FROM documentos";
$result_final = $db->query($query_final);

echo "<table border='1'>
<tr>
    <th>ID</th>
    <th>Título</th>
    <th>NIF Usuario</th>
    <th>Fecha</th>
</tr>";

if ($result_final && $result_final->num_rows > 0) {
    while ($row = $result_final->fetch_assoc()) {
        $style = $row['nif_usuario'] == '56789012C' ? "background-color: #dff0d8;" : "";
        
        echo "<tr style='$style'>
            <td>{$row['id']}</td>
            <td>{$row['titulo']}</td>
            <td>{$row['nif_usuario']}</td>
            <td>{$row['fecha_subida']}</td>
        </tr>";
    }
} else {
    echo "<tr><td colspan='4'>No hay documentos en la base de datos</td></tr>";
}
echo "</table>";

echo "<p><a href='../frontend/'>Volver a la aplicación</a></p>";
?>
