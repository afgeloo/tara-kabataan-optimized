<?php
// Pull credentials securely from Vercel's environment
$host = getenv('DB_HOST');
$port = getenv('DB_PORT') ?: 4000; 
$user = getenv('DB_USER');
$pass = getenv('DB_PASS');
$db   = getenv('DB_NAME');

$conn = mysqli_init();
mysqli_options($conn, MYSQLI_OPT_CONNECT_TIMEOUT, 5);

// TiDB requires SSL
mysqli_ssl_set($conn, NULL, NULL, NULL, NULL, NULL); 

$connected = mysqli_real_connect($conn, $host, $user, $pass, $db, $port, NULL, MYSQLI_CLIENT_SSL);

if (!$connected) {
    http_response_code(500);
    echo json_encode(["error" => "Database connection failed"]);
    exit;
}

$conn->set_charset("utf8mb4");
?>