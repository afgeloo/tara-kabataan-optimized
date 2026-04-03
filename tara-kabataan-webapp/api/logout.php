<?php
// 1. MUST MATCH THE COOKIE SETTINGS TO DESTROY IT
ini_set('session.cookie_httponly', 1);
ini_set('session.cookie_secure', 1);
ini_set('session.cookie_samesite', 'None');
ini_set('session.cookie_domain', '.tarakabataan.org');

session_start();

// 2. DYNAMIC CORS HEADERS (So React is allowed to call this file)
$origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';
header("Access-Control-Allow-Origin: $origin");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// 3. SHRED THE SESSION DATA
$_SESSION = array();

// 4. DESTROY THE COOKIE IN THE USER'S BROWSER
// We do this by setting the cookie's expiration date to the past
if (ini_get("session.use_cookies")) {
    $params = session_get_cookie_params();
    setcookie(session_name(), '', time() - 42000,
        $params["path"], $params["domain"],
        $params["secure"], $params["httponly"]
    );
}

// 5. DESTROY THE BACKEND RECORD
session_destroy();

echo json_encode(["success" => true, "message" => "Logged out securely"]);
?>