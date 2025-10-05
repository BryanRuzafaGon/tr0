<?php
// Configuració d'errors per desenvolupament
// Comenta aquestes línies en producció
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Configuració de zona horària
date_default_timezone_set('Europe/Madrid');

// Configuració de sessió
ini_set('session.gc_maxlifetime', 3600); // 1 hora
session_set_cookie_params(3600);

// Activar sortida de buffer per a millor rendiment
if (!ob_get_level()) {
    ob_start();
}

// Funció per registrar errors
function logError($message, $file = null, $line = null) {
    $timestamp = date('Y-m-d H:i:s');
    $errorMsg = "[$timestamp] ERROR: $message";
    
    if ($file && $line) {
        $errorMsg .= " in $file:$line";
    }
    
}

// Gestió global d'errors
set_error_handler(function($severity, $message, $file, $line) {
    logError($message, $file, $line);
    return false; // Permet que el gestor d'errors normal també s'executi
});

// Gestió d'excepcions no capturades
set_exception_handler(function($exception) {
    logError('Uncaught exception: ' . $exception->getMessage(), $exception->getFile(), $exception->getLine());
    
    // Enviar resposta d'error JSON si és una crida AJAX
    if (!headers_sent()) {
        header('Content-Type: application/json');
        http_response_code(500);
        echo json_encode(['error' => 'Error intern del servidor']);
    }
});

// Crear directori de logs si no existeix
$logDir = __DIR__ . '/../logs';
if (!is_dir($logDir)) {
    mkdir($logDir, 0755, true);
}
?>