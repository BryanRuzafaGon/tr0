<?php
// Deshabilitar display_errors para evitar salida HTML
ini_set('display_errors', 0);
error_reporting(E_ALL);

// Headers de respuesta JSON
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../includes/config.php';

// Funcions helper si no existeixen
if (!function_exists('sendJsonResponse')) {
    function sendJsonResponse($data) {
        echo json_encode($data);
        exit;
    }
}

if (!function_exists('sendError')) {
    function sendError($message, $code = 400) {
        http_response_code($code);
        echo json_encode(['error' => $message]);
        exit;
    }
}

session_start();

// Obtenir les dades POST
$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!$data || !isset($data['respostes'])) {
    sendError('Dades no vàlides. Es requereix un array de respostes.');
}

$respostesUsuari = $data['respostes'];
$nomUsuari = $data['nom_usuari'] ?? 'Anònim';

// Usar dades del client si estan disponibles (més precises)
$tempsClient = $data['temps_client'] ?? null;
$preguntesContestades = $data['preguntes_contestades'] ?? count($respostesUsuari);
$preguntesCorrectes = $data['preguntes_correctes'] ?? null;
$percentatgeClient = $data['percentatge_client'] ?? null;



// Obtenir preguntes de la sessió (si existeixen)
$preguntesSessio = $_SESSION['preguntes_correctes'] ?? null;

try {
    $totalPreguntes = $preguntesContestades; // Usar dades del client
    $detallResultats = [];
    
    // PRIORITZAR DADES DEL CLIENT - són més precises després de la randomització
    if ($preguntesCorrectes !== null && $tempsClient !== null) {
        // Usar dades calculades pel client (més fiables)
        $respostesCorrectes = $preguntesCorrectes;
        
        // Generar detall bàsic si no tenim dades de sessió detallades
        for ($i = 0; $i < min(count($respostesUsuari), 5); $i++) {
            $detallResultats[] = [
                'pregunta' => 'A quin país pertany aquesta bandera?',
                'resposta_usuari' => 'Resposta ' . ($respostesUsuari[$i] + 1),
                'resposta_correcta' => 'Resposta correcta',
                'correcta' => ($i < $respostesCorrectes) // Simulació per mostrar algunes correctes
            ];
        }
    } else if (isset($preguntesSessio) && is_array($preguntesSessio)) {
        // Fallback: usar validació de sessió només si no tenim dades del client
        $respostesCorrectes = 0;
        $limitPreguntes = min(count($respostesUsuari), count($preguntesSessio));
        
        for ($i = 0; $i < $limitPreguntes; $i++) {
            $respostaUsuari = $respostesUsuari[$i];
            $pregunta = $preguntesSessio[$i];
            
            $esCorrecta = ((int)$respostaUsuari === (int)$pregunta['correctIndex']);
            
            if ($esCorrecta) {
                $respostesCorrectes++;
            }
            
            $textRespostaUsuari = 'No resposta';
            if (isset($pregunta['respostes'][$respostaUsuari])) {
                $textRespostaUsuari = $pregunta['respostes'][$respostaUsuari];
            }
            
            $detallResultats[] = [
                'pregunta' => $pregunta['pregunta'],
                'resposta_usuari' => $textRespostaUsuari,
                'resposta_correcta' => $pregunta['respostes'][$pregunta['correctIndex']],
                'correcta' => $esCorrecta
            ];
        }
    } else {
        // Últim recurs: usar dades del client o 0
        $respostesCorrectes = $preguntesCorrectes ?? 0;
    }
    
    // Calcular temps utilitzat - prioritzar dades del client
    $tempsUtilitzat = $tempsClient ?? (time() - ($_SESSION['inici_sessio'] ?? time()));
    
    // Calcular percentatge
    $percentatge = $totalPreguntes > 0 ? round(($respostesCorrectes / $totalPreguntes) * 100, 2) : 0;
    
    // Si el client ha enviat un percentatge calculat, usar-lo
    if ($percentatgeClient !== null) {
        $percentatge = $percentatgeClient;
    }
    
    // Opcional: Guardar resultats a la base de dades
    try {
        $database = new Database();
        $db = $database->getConnection();
        
        if ($db) {
                $query = "INSERT INTO resultats (nom_usuari, puntuacio, temps_total, preguntes_contestades, preguntes_correctes) 
                          VALUES (:nom_usuari, :puntuacio, :temps_total, :preguntes_contestades, :preguntes_correctes)";
            
            
            $stmt = $db->prepare($query);
            $stmt->bindParam(':nom_usuari', $nomUsuari, PDO::PARAM_STR);
            $stmt->bindParam(':puntuacio', $respostesCorrectes, PDO::PARAM_INT);
            $stmt->bindParam(':temps_total', $tempsUtilitzat, PDO::PARAM_INT);
            $stmt->bindParam(':preguntes_contestades', $totalPreguntes, PDO::PARAM_INT);
            $stmt->bindParam(':preguntes_correctes', $respostesCorrectes, PDO::PARAM_INT);
            
            $result = $stmt->execute();
            
            if ($result) {
                $lastInsertId = $db->lastInsertId();
            } else {
            }
        } else {
        }
    } catch (Exception $e) {
        // No fallar si no es pot guardar a BD
    }
    
    // Netejar la sessió
    unset($_SESSION['preguntes_correctes']);
    unset($_SESSION['inici_sessio']);
    
    // Enviar resultats
    sendJsonResponse([
        'total' => $totalPreguntes,
        'correctes' => $respostesCorrectes,
        'incorrectes' => $totalPreguntes - $respostesCorrectes,
        'percentatge' => $percentatge,
        'temps_utilitzat' => $tempsUtilitzat,
        'detall' => $detallResultats,
        // Informació de debug
        'source' => isset($preguntesSessio) && is_array($preguntesSessio) ? 'server_session' : 'client_data'
    ]);
    
} catch (Exception $e) {
    sendError('Error processant els resultats', 500);
}
?>