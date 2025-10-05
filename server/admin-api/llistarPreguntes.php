<?php
require_once '../includes/config.php';

try {
    // Crear connexió amb la base de dades
    $database = new Database();
    $db = $database->getConnection();
    
    if (!$db) {
        sendError('Error de connexió amb la base de dades', 500);
    }
    
    // Consulta per obtenir totes les preguntes
    $query = "SELECT id, pregunta, imatge, resposta_1, resposta_2, resposta_3, resposta_4, 
                     resposta_correcta_index, activa, data_creacio, data_modificacio 
              FROM preguntes 
              ORDER BY data_modificacio DESC";
    
    $stmt = $db->prepare($query);
    $stmt->execute();
    
    $preguntes = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Convertir valors booleans
    foreach ($preguntes as &$pregunta) {
        $pregunta['activa'] = (bool)$pregunta['activa'];
        $pregunta['resposta_correcta_index'] = (int)$pregunta['resposta_correcta_index'];
    }
    
    sendJsonResponse([
        'preguntes' => $preguntes,
        'total' => count($preguntes)
    ]);
    
} catch (PDOException $e) {
    error_log("Error BD llistarPreguntes: " . $e->getMessage());
    sendError('Error intern del servidor', 500);
} catch (Exception $e) {
    error_log("Error llistarPreguntes: " . $e->getMessage());
    sendError('Error intern del servidor', 500);
}
?>