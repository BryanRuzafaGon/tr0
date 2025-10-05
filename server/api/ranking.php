<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Gestionar preflight request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once '../includes/config.php';
require_once '../includes/database.php';

try {
    $database = new Database();
    $pdo = $database->getConnection();
    
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        // Crear taula ranking si no existeix
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS ranking (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nom_usuari VARCHAR(100) NOT NULL,
                puntuacio INT NOT NULL,
                preguntes_correctes INT NOT NULL,
                preguntes_totals INT NOT NULL,
                percentatge DECIMAL(5,2) NOT NULL,
                temps_total INT NOT NULL,
                data_creacio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                data_actualitzacio TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_ranking (puntuacio DESC, preguntes_correctes DESC, temps_total ASC)
            )
        ");
        
        // Obtenir el Top 10 actual
        $stmt = $pdo->prepare("
            SELECT 
                nom_usuari,
                puntuacio,
                preguntes_correctes as encerts,
                preguntes_totals as contestades,
                percentatge,
                temps_total as temps,
                data_actualitzacio
            FROM ranking 
            ORDER BY puntuacio DESC, preguntes_correctes DESC, temps_total ASC 
            LIMIT 10
        ");
        
        $stmt->execute();
        $ranking = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Processar dades per al frontend
        $rankingProcessat = array_map(function($entry) {
            return [
                'nom' => $entry['nom_usuari'],
                'puntuacio' => (int)$entry['puntuacio'],
                'encerts' => (int)$entry['encerts'],
                'contestades' => (int)$entry['contestades'],
                'percentatge' => (float)$entry['percentatge'],
                'temps' => (int)$entry['temps'],
                'data' => $entry['data_actualitzacio']
            ];
        }, $ranking);
        
        echo json_encode([
            'ranking' => $rankingProcessat
        ]);
        
    } elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
        // Afegir/actualitzar entrada al rànquing
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input || !isset($input['nom_usuari']) || !isset($input['puntuacio'])) {
            throw new Exception('Dades incompletes per actualitzar el rànquing');
        }
        
        $nom_usuari = trim($input['nom_usuari']);
        $puntuacio = (int)$input['puntuacio'];
        $preguntes_correctes = (int)$input['preguntes_correctes'];
        $preguntes_totals = (int)$input['preguntes_totals'];
        $percentatge = (float)$input['percentatge'];
        $temps_total = (int)$input['temps_total'];
        
        // Comprovar si l'usuari ja existeix al rànquing
        $stmt = $pdo->prepare("
            SELECT id, puntuacio, preguntes_correctes, temps_total 
            FROM ranking 
            WHERE nom_usuari = ?
        ");
        $stmt->execute([$nom_usuari]);
        $existing = $stmt->fetch(PDO::FETCH_ASSOC);
        
        $shouldUpdate = false;
        
        if ($existing) {
            // Comprovar si la nova puntuació és millor
            $existing_puntuacio = (int)$existing['puntuacio'];
            $existing_correctes = (int)$existing['preguntes_correctes'];
            $existing_temps = (int)$existing['temps_total'];
            
            if ($puntuacio > $existing_puntuacio || 
                ($puntuacio == $existing_puntuacio && $preguntes_correctes > $existing_correctes) ||
                ($puntuacio == $existing_puntuacio && $preguntes_correctes == $existing_correctes && $temps_total < $existing_temps)) {
                
                // Actualitzar registre existent
                $stmt = $pdo->prepare("
                    UPDATE ranking SET
                        puntuacio = ?, preguntes_correctes = ?, preguntes_totals = ?,
                        percentatge = ?, temps_total = ?, data_actualitzacio = CURRENT_TIMESTAMP
                    WHERE id = ?
                ");
                $stmt->execute([$puntuacio, $preguntes_correctes, $preguntes_totals, $percentatge, $temps_total, $existing['id']]);
                $shouldUpdate = true;
                $message = "Rècord personal millorat!";
            } else {
                $message = "No ha superat el seu rècord anterior";
            }
        } else {
            // Nou usuari - inserir
            $stmt = $pdo->prepare("
                INSERT INTO ranking (nom_usuari, puntuacio, preguntes_correctes, preguntes_totals, percentatge, temps_total)
                VALUES (?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([$nom_usuari, $puntuacio, $preguntes_correctes, $preguntes_totals, $percentatge, $temps_total]);
            $shouldUpdate = true;
            $message = "Afegit al rànquing!";
        }
        
        // Mantenir només el Top 10
        $stmt = $pdo->prepare("
            DELETE FROM ranking WHERE id NOT IN (
                SELECT * FROM (
                    SELECT id FROM ranking 
                    ORDER BY puntuacio DESC, preguntes_correctes DESC, temps_total ASC 
                    LIMIT 10
                ) as top10
            )
        ");
        $stmt->execute();
        
        echo json_encode([
            'success' => true,
            'updated' => $shouldUpdate,
            'message' => $message
        ]);
        
    } else {
        throw new Exception('Mètode HTTP no suportat');
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'ranking' => []
    ]);
}
