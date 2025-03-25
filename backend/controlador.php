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

    // if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    //     exit(0);
    // }

    // function comprobarSesion(){
    //     $response = array(
    //         'id' => isset($_SESSION['id']) ? $_SESSION['id'] : null,
    //         'username' => isset($_SESSION['username']) ? $_SESSION['username'] : null,
    //         'tipo_usuario' => isset($_SESSION['tipo_usuario']) ? $_SESSION['tipo_usuario'] : null,
    //         'sessionId' => session_id()
    //     );
        
    //     echo json_encode($response);
    // }
    
    function iniciarSesion(){
        if (!isset($_POST["email"]) || !isset($_POST["password"])) {
            echo json_encode(["error" => "Datos de login incompletos"]);
            return;
        }
        
        require_once("./modelos/bd.php");
        $modelo = new db();
        $comprobar = $modelo->compCredenciales($_POST["email"], $_POST["password"]);
        
        if($comprobar['NIF'] === null) {
            echo json_encode(["error" => "Credenciales incorrectas"]);
            return;
        }
        
        session_regenerate_id(true);
        
        $_SESSION['NIF'] = $comprobar['NIF'];
        $_SESSION['tipo_usuario'] = $comprobar['tipo_Usu'];
        $_SESSION['avatar'] = $comprobar['avatar'];
        $_SESSION['nombre'] = $comprobar['nombre'];
        $_SESSION['apellidos'] = $comprobar['apellidos'];
        
        $response = array('NIF' => $_SESSION['NIF'], 'tipo_usuario' => $_SESSION['tipo_usuario'], 'avatar' => $_SESSION['avatar'], 'nombre' => $_SESSION['nombre'], 'apellidos' => $_SESSION['apellidos']);
        echo json_encode($response);
    }

    // function obtenerCursos(){
    //     require_once("../modelo/cursos.php");
    //     $modelo = new Cursos();
    //     $cursos = array();
    //     $cursos = $modelo->obtenerCursos();
        
    //     echo json_encode($cursos);
    // }

    // function obtenerMisCursos(){
    //     if (!isset($_SESSION['id'])) {
    //         echo json_encode(["error" => "Usuario no autenticado"]);
    //         return;
    //     }

    //     require_once("../modelo/cursos.php");
    //     $cursos = new Cursos();
    //     $misCursos = array();
    //     $misCursos = $cursos->obtenerMisCursos($_SESSION['id']);
    //     echo json_encode($misCursos);
    // }

    // function obtenerCurso(){
    //     if (!isset($_POST["id"])) {
    //         echo json_encode(["error" => "Datos de curso incompletos"]);
    //         return;
    //     }
        
    //     require_once("../modelo/cursos.php");
    //     $cursos = new Cursos();
    //     $curso = array();
    //     $curso = $cursos->obtenerCurso($_POST["id"]);
    //     error_log('Datos del curso: ' . print_r($curso, true));
    //     echo json_encode($curso);
    // }

    // function desconectar(){
    //     $_SESSION = array();
        
    //     if (isset($_COOKIE[session_name()])) {
    //         setcookie(session_name(), '', time() - 3600, '/');
    //     }
        
    //     session_destroy();
        
    //     echo json_encode(['success' => true]);
    // }
    
    // Si no ha sido iniciado el action
    if(isset($_REQUEST["action"])){
        $action = $_REQUEST["action"];
        $action(); //La cabra del sistema, lo acciona absolutamente todo
    }
?>