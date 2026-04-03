<?php
// 1. MUST MATCH THE LOGIN COOKIE SETTINGS
ini_set('session.cookie_httponly', 1);
ini_set('session.cookie_secure', 1);
ini_set('session.cookie_samesite', 'None');
ini_set('session.cookie_domain', '.tarakabataan.org'); // <-- ADD THIS LINE!

// 2. START SESSION (PHP automatically reads the cookie here)
session_start();

// 3. DYNAMIC HEADERS
$origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';
header("Access-Control-Allow-Origin: $origin");
header("Access-Control-Allow-Credentials: true"); // CRITICAL for cookies
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// 4. CHECK IF THEY ARE LOGGED IN
if (isset($_SESSION['admin_logged_in']) && $_SESSION['admin_logged_in'] === true) {
    echo json_encode([
        "authenticated" => true,
        "user" => [
            "user_id" => $_SESSION['admin_user_id'],
            "user_name" => $_SESSION['admin_name'],
            "user_email" => $_SESSION['admin_email']
        ]
    ]);
} else {
    http_response_code(401); 
    echo json_encode(["authenticated" => false, "message" => "Unauthorized"]);
}
?>