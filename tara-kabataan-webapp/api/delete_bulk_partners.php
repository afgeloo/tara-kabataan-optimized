<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once 'db.php';

$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data['partner_ids']) || !is_array($data['partner_ids'])) {
    echo json_encode(["success" => false, "error" => "Invalid or missing IDs"]);
    exit;
}

$ids = array_filter(array_map('trim', $data['partner_ids']));
if (empty($ids)) {
    echo json_encode(["success" => false, "error" => "No IDs provided"]);
    exit;
}

$placeholders = implode(',', array_fill(0, count($ids), '?'));
$types = str_repeat('s', count($ids));

// Delete partners from the database
$deleteSql = "DELETE FROM tk_webapp.partnerships WHERE partner_id IN ($placeholders)";
$stmtDelete = $conn->prepare($deleteSql);

if (!$stmtDelete) {
    http_response_code(500);
    echo json_encode(["success" => false, "error" => "Prepare failed: " . $conn->error]);
    exit;
}

$stmtDelete->bind_param($types, ...$ids);

if ($stmtDelete->execute()) {
    echo json_encode(["success" => true]);
} else {
    http_response_code(500);
    echo json_encode(["success" => false, "error" => $stmtDelete->error]);
}

$stmtDelete->close();
$conn->close();
?>