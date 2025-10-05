<?php
/**
 * Configuración centralizada de la base de datos
 * Este archivo contiene las credenciales y configuración para la conexión a MySQL
 */

// Configuración de la base de datos
$host = 'localhost';
$dbname = 'a24bryruzgon_spa';
$username = 'a24bryruzgon_spa';
$password = '-%1R]{t#eWf(yx0I';

// DSN (Data Source Name) para PDO
$dsn = "mysql:host=$host;dbname=$dbname;charset=utf8mb4";

// Opciones de PDO
$options = [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES => false,
    PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4"
];

// Función para obtener la conexión PDO
function getConnection() {
    global $dsn, $username, $password, $options;
    
    try {
        $pdo = new PDO($dsn, $username, $password, $options);
        return $pdo;
    } catch (PDOException $e) {
        throw new Exception("Error de conexión a la base de datos: " . $e->getMessage());
    }
}

// Variables globales para compatibilidad con código existente
try {
    $pdo = getConnection();
} catch (Exception $e) {
    // En caso de error, mostrar mensaje y terminar
    if (php_sapi_name() === 'cli') {
        echo "Error de conexión: " . $e->getMessage() . "\n";
    } else {
        header('Content-Type: text/html; charset=UTF-8');
        echo "<h3>Error de conexión a la base de datos</h3>";
        echo "<p>" . htmlspecialchars($e->getMessage()) . "</p>";
    }
    exit(1);
}
?>