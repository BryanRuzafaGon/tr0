<?php
// Deshabilitar display_errors para evitar salida HTML
ini_set('display_errors', 0);
error_reporting(E_ALL);

// Headers de respuesta JSON
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../includes/config.php';

session_start();

// Obtenir paràmetre del nombre de preguntes
$numPreguntes = isset($_GET['num']) ? (int)$_GET['num'] : 10;

// Validar el número de preguntes
if ($numPreguntes < 1 || $numPreguntes > 50) {
    sendError('El nombre de preguntes ha d\'estar entre 1 i 50');
}

try {
    // Crear connexió amb la base de dades
    $database = new Database();
    $db = $database->getConnection();
    
    if (!$db) {
        sendError('Error de connexió amb la base de dades', 500);
    }
    
    // Consulta per obtenir preguntes aleatòries
    $query = "SELECT id, pregunta, imatge, resposta_1, resposta_2, resposta_3, resposta_4, resposta_correcta_index 
              FROM preguntes 
              WHERE activa = 1 
              ORDER BY RAND() 
              LIMIT :num";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(':num', $numPreguntes, PDO::PARAM_INT);
    $stmt->execute();
    
    $preguntes = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (empty($preguntes)) {
        sendError('No s\'han trobat preguntes a la base de dades');
    }
    
    // Reformatar les preguntes per al frontend
    $preguntesFormatejades = [];
    $preguntesPerSessio = []; // Per guardar a la sessió amb la resposta correcta
    
    foreach ($preguntes as $pregunta) {
        $respostes = [
            $pregunta['resposta_1'],
            $pregunta['resposta_2'],
            $pregunta['resposta_3'],
            $pregunta['resposta_4']
        ];
        
        // Per al frontend (AMB índex correcte per verificar al client)
        $preguntesFormatejades[] = [
            'id' => $pregunta['id'],
            'pregunta' => $pregunta['pregunta'],
            'imatge' => $pregunta['imatge'],
            'respostes' => $respostes,
            'resposta_correcta_index' => (int)$pregunta['resposta_correcta_index']
        ];
        
        // Per a la sessió (amb índex correcte)
        $preguntesPerSessio[] = [
            'id' => $pregunta['id'],
            'pregunta' => $pregunta['pregunta'],
            'imatge' => $pregunta['imatge'],
            'respostes' => $respostes,
            'correctIndex' => (int)$pregunta['resposta_correcta_index']
        ];
    }
    
    // Guardar les preguntes amb respostes correctes a la sessió
    $_SESSION['preguntes_correctes'] = $preguntesPerSessio;
    $_SESSION['inici_sessio'] = time();
    
    // Enviar resposta sense l'índex correcte
    sendJsonResponse([
        'preguntes' => $preguntesFormatejades,
        'total' => count($preguntesFormatejades)
    ]);
    
} catch (PDOException $e) {
    sendError('Error intern del servidor', 500);
} catch (Exception $e) {
    sendError('Error intern del servidor', 500);
}
?>