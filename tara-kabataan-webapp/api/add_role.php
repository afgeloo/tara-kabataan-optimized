<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

header("Content-Type: application/json");

include 'db.php';

$input = json_decode(file_get_contents('php://input'), true);
$role_name = trim($input['role_name'] ?? '');

if ($role_name === '') {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "role_name is required"]);
    exit;
}

// --- START ID GENERATOR ---
$conn->query("INSERT INTO tk_webapp.role_id_counter VALUES (NULL)");
$next_id = $conn->insert_id;
$base36_id = str_pad(strtoupper(base_convert($next_id, 10, 36)), 6, '0', STR_PAD_LEFT);
$year = date("Y");
$new_role_id = "roles-{$year}-{$base36_id}";
// --- END ID GENERATOR ---

$stmt = $conn->prepare("INSERT INTO tk_webapp.roles (role_id, role_name) VALUES (?, ?)");
$stmt->bind_param("ss", $new_role_id, $role_name);

if (!$stmt->execute()) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Database error: " . $stmt->error
    ]);
    exit;
}

$stmt->close();
$conn->close();

echo json_encode([
    "success"   => true,
    "role"      => [
        "role_id"   => $new_role_id,
        "role_name" => $role_name
    ]
]);
?>