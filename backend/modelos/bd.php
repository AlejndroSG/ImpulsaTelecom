<?php
    // require_once("../../../cred.php");

    class db{
        private $conn;
        public function __construct(){
            $this->conn = new mysqli("localhost", "root", "", "impulsatelecom");
            $this->conn->set_charset("utf8");
        }

        public function getConn() {
            return $this->conn;
        }
        
        // Comprobamos si las credenciales son correctas
        public function compCredenciales(String $email, String $psw){
            $sentencia = "SELECT NIF, nombre, apellidos, email, pswd, dpto, centro, tipo_Usu, avatar FROM usuarios WHERE email = ? AND pswd = ?"; 
            $consulta = $this->conn->prepare($sentencia);
            $consulta->bind_param("ss", $email, $psw);
            $consulta->bind_result($NIF, $nombre, $apellidos, $email, $pswd, $dpto, $centro, $tipo_Usu, $avatar);
            $consulta->execute();
            $consulta->fetch();
            $comprobar = array("NIF" => $NIF, "nombre" => $nombre, "apellidos" => $apellidos, "email" => $email, "pswd" => $pswd, "dpto" => $dpto, "centro" => $centro, "tipo_Usu" => $tipo_Usu, "avatar" => $avatar);
            $consulta->close();
            return $comprobar;
        }
    }
?>
