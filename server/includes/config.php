<?php
// Deshabilitar display_errors para evitar salida HTML en APIs
ini_set('display_errors', 0);
error_reporting(E_ALL);

// Configuració de la base de dades - AUTO-DETECTAR HOST
define('DB_NAME', 'a24bryruzgon_spa');
define('DB_USER', 'a24bryruzgon_spa');
define('DB_PASS', '-%1R]{t#eWf(yx0I');

// Detectar si estem al servidor o en desenvolupament local
function getDbHost() {
    // Si estem al servidor daw.inspedralbes.cat, usar localhost
    if (isset($_SERVER['HTTP_HOST']) && strpos($_SERVER['HTTP_HOST'], 'daw.inspedralbes.cat') !== false) {
        return 'localhost';
    }
    // Altrament, intentar connexió externa
    return 'daw.inspedralbes.cat';
}

class Database {
    private $db_name = DB_NAME;
    private $username = DB_USER;
    private $password = DB_PASS;
    public $conn;

    public function getConnection() {
        $this->conn = null;

        // Detectar el host adequat
        $host = getDbHost();
        
        try {
            
            // DSN adequat segons el host
            if ($host === 'localhost') {
                // Connexió local al servidor (sense port específic)
                $dsn = "mysql:host=localhost;dbname=" . $this->db_name . ";charset=utf8mb4";
            } else {
                // Connexió externa (amb port)
                $dsn = "mysql:host=$host;dbname=" . $this->db_name . ";charset=utf8mb4;port=3306";
            }
            
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4",
                PDO::ATTR_TIMEOUT => 10
            ];
            
            $this->conn = new PDO($dsn, $this->username, $this->password, $options);
            
            // Test de connexió immediat
            $this->conn->query("SELECT 1")->fetch();
            
            
        } catch(PDOException $exception) {
            $errorMsg = "Error de connexió BD amb host $host: " . $exception->getMessage();
            
            // NO fer die() aquí, només retornar null
            return null;
        }

        return $this->conn;
    }
}

// Configurar headers per a CORS
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Gestionar OPTIONS request per a CORS
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit(0);
}

// Funció per enviar resposta JSON
function sendJsonResponse($data, $status = 200) {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit();
}

// Funció per enviar error
function sendError($message, $status = 400) {
    sendJsonResponse(['error' => $message], $status);
}
?>