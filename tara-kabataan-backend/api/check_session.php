<?php
// DYNAMIC HEADERS (MUST allow the X-Session-Token header!)
$origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';
header("Access-Control-Allow-Origin: $origin");
header("Access-Control-Allow-Headers: Content-Type, X-Session-Token"); // <-- Critical addition
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// LOOK FOR THE TOKEN IN THE HEADERS THAT REACT SENDS
$token = isset($_SERVER['HTTP_X_SESSION_TOKEN']) ? $_SERVER['HTTP_X_SESSION_TOKEN'] : '';

if ($token) {
    session_id($token); // Tell PHP exactly which user session to load
}
session_start();

// CHECK IF THEY ARE LOGGED IN
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