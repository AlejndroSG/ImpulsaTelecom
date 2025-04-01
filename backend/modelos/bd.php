<?php
    // require_once("../../../cred.php");

    class db{
        private $conn;
        public function __construct(){
            try {
                // Usar exclusivamente el método de conexión que suele funcionar mejor con XAMPP
                $this->conn = new mysqli("localhost", "root", "", "impulsatelecom", 3306);
                
                // Verificar si hay error de conexión
                if ($this->conn->connect_error) {
                    throw new Exception("Error de conexión: " . $this->conn->connect_error);
                }
                
                $this->conn->set_charset("utf8");
            } catch (Exception $e) {
                // Registrar el error para diagnóstico
                error_log("Error de conexión a la base de datos: " . $e->getMessage());
                throw $e;  // Re-lanzar la excepción para que sea manejada por el código que llama
            }
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
