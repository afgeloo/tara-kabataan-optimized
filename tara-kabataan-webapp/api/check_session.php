<?php
// Catch fatal errors silently so Vercel doesn't blank out
set_exception_handler(function (\Throwable $e) {
    http_response_code(500);
    echo json_encode(["authenticated" => false, "message" => "Server crash: " . $e->getMessage()]);
    exit;
});

include 'db.php';

// --- DYNAMIC CORS HEADERS ---
$allowed_origins = [
    "https://tarakabataan.org",
    "https://www.tarakabataan.org",
    "https://tara-kabataan-optimized.vercel.app"
];

$origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';
if (in_array($origin, $allowed_origins)) {
    header("Access-Control-Allow-Origin: $origin");
}

header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// --- GRAB THE COOKIE ---
$session_token = $_COOKIE['admin_session_token'] ?? '';

if (empty($session_token)) {
    http_response_code(401);
    echo json_encode(["authenticated" => false, "message" => "No session cookie found."]);
    exit;
}

// --- VERIFY IN DATABASE ---
// Make sure it matches tk_webapp.users exactly!
$stmt = $conn->prepare("SELECT * FROM tk_webapp.users WHERE session_token = ?");
if (!$stmt) {
    throw new Exception("Database prepare failed: " . $conn->error);
}

$stmt->bind_param("s", $session_token);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 1) {
    $user = $result->fetch_assoc();
    
    echo json_encode([
        "authenticated" => true,
        "user" => [
            "user_id" => $user['user_id'] ?? '',
            "user_name" => $user['user_name'] ?? '',
            "user_email" => $user['user_email'] ?? ''
        ]
    ]);
} else {
    http_response_code(401);
    echo json_encode(["authenticated" => false, "message" => "Invalid or expired session."]);
}
?>