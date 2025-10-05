<?php
require_once '../includes/config.php';

try {
    // Crear connexió amb la base de dades
    $database = new Database();
    $db = $database->getConnection();
    
    if (!$db) {
        sendError('Error de connexió amb la base de dades', 500);
    }
    
    // Estadístiques de preguntes
    $queryPreguntes = "SELECT 
                         COUNT(*) as total_preguntes,
                         SUM(CASE WHEN activa = 1 THEN 1 ELSE 0 END) as preguntes_actives
                       FROM preguntes";
    
    $stmtPreguntes = $db->prepare($queryPreguntes);
    $stmtPreguntes->execute();
    $statsPreguntes = $stmtPreguntes->fetch(PDO::FETCH_ASSOC);
    
    // Estadístiques de sessions
    $querySessions = "SELECT 
                        COUNT(*) as total_partides,
                        AVG((puntuacio / total_preguntes) * 100) as puntuacio_mitjana
                      FROM sessions_joc";
    
    $stmtSessions = $db->prepare($querySessions);
    $stmtSessions->execute();
    $statsSessions = $stmtSessions->fetch(PDO::FETCH_ASSOC);
    
    // Sessions recents
    $queryRecents = "SELECT puntuacio, total_preguntes, temps_utilitzat, data_sessio
                     FROM sessions_joc 
                     ORDER BY data_sessio DESC 
                     LIMIT 10";
    
    $stmtRecents = $db->prepare($queryRecents);
    $stmtRecents->execute();
    $sessionsRecents = $stmtRecents->fetchAll(PDO::FETCH_ASSOC);
    
    // Combinar totes les estadístiques
    $estadistiques = [
        'total_preguntes' => (int)($statsPreguntes['total_preguntes'] ?? 0),
        'preguntes_actives' => (int)($statsPreguntes['preguntes_actives'] ?? 0),
        'total_partides' => (int)($statsSessions['total_partides'] ?? 0),
        'puntuacio_mitjana' => round($statsSessions['puntuacio_mitjana'] ?? 0, 1),
        'sessions_recents' => $sessionsRecents
    ];
    
    sendJsonResponse($estadistiques);
    
} catch (PDOException $e) {
    error_log("Error BD estadistiques: " . $e->getMessage());
    sendError('Error intern del servidor', 500);
} catch (Exception $e) {
    error_log("Error estadistiques: " . $e->getMessage());
    sendError('Error intern del servidor', 500);
}
?>