<?php
session_start();
session_unset();    // Clear all variables
session_destroy();  // Destroy the session data on the server

// Force the browser to delete the cookie by setting its expiration to the past
setcookie('tara_admin_session', '', time() - 3600, '/'); 

header("Access-Control-Allow-Origin: " . (isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : ''));
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json");

echo json_encode(["success" => true, "message" => "Logged out securely."]);
?>