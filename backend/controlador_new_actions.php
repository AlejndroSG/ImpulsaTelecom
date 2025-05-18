        case 'historial_grafico':
            // Verificar que el usuario esté autenticado o que se proporcionó un ID
            $id_usuario = isset($requestData['id_usuario']) ? $requestData['id_usuario'] : (isset($_SESSION['user_id']) ? $_SESSION['user_id'] : null);
            
            if ($id_usuario) {
                // Obtener parámetro opcional de días
                $dias = isset($requestData['dias']) ? intval($requestData['dias']) : 7;
                
                $result = $fichaje->getHistorialGrafico($id_usuario, $dias);
                echo json_encode($result);
            } else {
                echo json_encode([
                    'success' => false,
                    'error' => 'Usuario no autenticado'
                ]);
            }
            break;
            
        case 'horario_usuario':
            // Verificar que el usuario esté autenticado o que se proporcionó un ID
            $id_usuario = isset($requestData['id_usuario']) ? $requestData['id_usuario'] : (isset($_SESSION['user_id']) ? $_SESSION['user_id'] : null);
            
            if ($id_usuario) {
                $result = $fichaje->getHorarioUsuario($id_usuario);
                echo json_encode($result);
            } else {
                echo json_encode([
                    'success' => false,
                    'error' => 'Usuario no autenticado'
                ]);
            }
            break;
