<?php
require_once '../includes/config.php';

// Obtenir les dades POST
$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!$data || !isset($data['id'])) {
    sendError('ID de pregunta no proporcionat');
}

$preguntaId = (int)$data['id'];

if ($preguntaId <= 0) {
    sendError('ID de pregunta no vàlid');
}

try {
    // Crear connexió amb la base de dades
    $database = new Database();
    $db = $database->getConnection();
    
    if (!$db) {
        sendError('Error de connexió amb la base de dades', 500);
    }
    
    // Comprovar que la pregunta existeix
    $checkQuery = "SELECT id, pregunta FROM preguntes WHERE id = :id";
    $checkStmt = $db->prepare($checkQuery);
    $checkStmt->bindParam(':id', $preguntaId, PDO::PARAM_INT);
    $checkStmt->execute();
    
    if ($checkStmt->rowCount() === 0) {
        sendError('Pregunta no trobada');
    }
    
    // Eliminar la pregunta
    $deleteQuery = "DELETE FROM preguntes WHERE id = :id";
    $deleteStmt = $db->prepare($deleteQuery);
    $deleteStmt->bindParam(':id', $preguntaId, PDO::PARAM_INT);
    
    if ($deleteStmt->execute()) {
        sendJsonResponse([
            'success' => true,
            'message' => 'Pregunta eliminada correctament'
        ]);
    } else {
        sendError('Error eliminant la pregunta', 500);
    }
    
} catch (PDOException $e) {
    error_log("Error BD eliminarPregunta: " . $e->getMessage());
    sendError('Error intern del servidor', 500);
} catch (Exception $e) {
    error_log("Error eliminarPregunta: " . $e->getMessage());
    sendError('Error intern del servidor', 500);
}
?>