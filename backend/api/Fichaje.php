<?php
// Configurar cookies antes de cualquier salida
ini_set('session.cookie_lifetime', '86400');    // 24 horas
ini_set('session.gc_maxlifetime', '86400');     // 24 horas
ini_set('session.use_strict_mode', '1');        // Modo estricto para seguridad
ini_set('session.cookie_httponly', '1');        // Prevenir acceso JS a la cookie
ini_set('session.use_only_cookies', '1');       // Solo usar cookies para sesiones
ini_set('session.cookie_samesite', 'Lax');      // Configuración más compatible

session_start();

header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Accept");
header("Content-Type: application/json; charset=UTF-8");

require_once '../modelos/Fichaje.php';
$fichaje = new Fichaje();

// if ($_GET['route'] === 'actual') {
//     $id_usuario = $_GET['id_usuario'];
//     $resultado = $fichaje->getFichajeActual($id_usuario);
//     echo json_encode($resultado);
// }

function getFichajeActual($id_usuario){
    $consulta = "SELECT * FROM fichajes WHERE id_usuario = ?";
    $stmt = $fichaje->prepare($consulta);
    $stmt->bind_param("i", $id_usuario);
    $stmt->execute();
    $resultado = array();
    while($row = $stmt->fetch()) {
        $resultado[] = $row;
    }
    $stmt->close();
    return $resultado;
}
?>
