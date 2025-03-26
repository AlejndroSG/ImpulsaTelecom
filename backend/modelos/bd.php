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
        public function compCredenciales(String $email, String $password){
            try {
                // Consulta para obtener los datos del usuario
                $sentencia = "SELECT NIF, nombre, apellidos, email, pswd, dpto, centro, tipo_Usu, avatar FROM usuarios WHERE email = ?"; 
                $consulta = $this->conn->prepare($sentencia);
                $consulta->bind_param("s", $email);
                $consulta->execute();
                $resultado = $consulta->get_result();
                
                if ($resultado->num_rows === 1) {
                    $usuario = $resultado->fetch_assoc();
                    
                    // Verificar la contraseña usando password_verify
                    if (password_verify($password, $usuario['pswd'])) {
                        // Crear un array con los datos necesarios
                        $datosUsuario = array(
                            'NIF' => $usuario['NIF'],
                            'nombre' => $usuario['nombre'],
                            'apellidos' => $usuario['apellidos'],
                            'email' => $usuario['email'],
                            'dpto' => $usuario['dpto'],
                            'centro' => $usuario['centro'],
                            'tipo_Usu' => $usuario['tipo_Usu'],
                            'avatar' => $usuario['avatar']
                        );
                        
                        return $datosUsuario;
                    }
                }
                
                // Si no se encuentra el usuario o la contraseña no coincide
                return array('NIF' => null);
                
            } catch (Exception $e) {
                error_log("Error en compCredenciales: " . $e->getMessage());
                return array('NIF' => null);
            }
        }
    }
?>
