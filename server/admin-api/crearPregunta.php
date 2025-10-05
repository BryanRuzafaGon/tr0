<?php
require_once '../includes/config.php';

// Obtenir les dades POST
$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!$data) {
    sendError('Dades no vàlides');
}

// Validar camps obligatoris
$camps_obligatoris = ['pregunta', 'imatge', 'resposta_1', 'resposta_2', 'resposta_3', 'resposta_4', 'resposta_correcta_index'];

foreach ($camps_obligatoris as $camp) {
    if (!isset($data[$camp]) || trim($data[$camp]) === '') {
        sendError("El camp '$camp' és obligatori");
    }
}

// Validar índex de resposta correcta
if (!is_numeric($data['resposta_correcta_index']) || 
    $data['resposta_correcta_index'] < 0 || 
    $data['resposta_correcta_index'] > 3) {
    sendError('L\'índex de resposta correcta ha de ser entre 0 i 3');
}

try {
    // Crear connexió amb la base de dades
    $database = new Database();
    $db = $database->getConnection();
    
    if (!$db) {
        sendError('Error de connexió amb la base de dades', 500);
    }
    
    // Preparar la consulta d'inserció
    $query = "INSERT INTO preguntes (pregunta, imatge, resposta_1, resposta_2, resposta_3, resposta_4, 
                                   resposta_correcta_index, activa) 
              VALUES (:pregunta, :imatge, :resposta_1, :resposta_2, :resposta_3, :resposta_4, 
                      :resposta_correcta_index, :activa)";
    
    $stmt = $db->prepare($query);
    
    // Vincular paràmetres
    $stmt->bindParam(':pregunta', $data['pregunta']);
    $stmt->bindParam(':imatge', $data['imatge']);
    $stmt->bindParam(':resposta_1', $data['resposta_1']);
    $stmt->bindParam(':resposta_2', $data['resposta_2']);
    $stmt->bindParam(':resposta_3', $data['resposta_3']);
    $stmt->bindParam(':resposta_4', $data['resposta_4']);
    $stmt->bindParam(':resposta_correcta_index', $data['resposta_correcta_index'], PDO::PARAM_INT);
    
    $activa = isset($data['activa']) ? (bool)$data['activa'] : true;
    $stmt->bindParam(':activa', $activa, PDO::PARAM_BOOL);
    
    // Executar la consulta
    if ($stmt->execute()) {
        $nouId = $db->lastInsertId();
        
        sendJsonResponse([
            'success' => true,
            'message' => 'Pregunta creada correctament',
            'id' => $nouId
        ]);
    } else {
        sendError('Error creant la pregunta', 500);
    }
    
} catch (PDOException $e) {
    sendError('Error intern del servidor', 500);
} catch (Exception $e) {
    sendError('Error intern del servidor', 500);
}
?>