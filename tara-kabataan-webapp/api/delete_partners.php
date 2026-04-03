<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit;
}

require 'db.php';

$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data['partner_id'])) {
    echo json_encode(["success" => false, "message" => "Missing partner_id"]);
    exit;
}

$partner_id = $data['partner_id'];

$deleteStmt = $conn->prepare("DELETE FROM tk_webapp.partnerships WHERE partner_id = ?");
$deleteStmt->bind_param("s", $partner_id);

if ($deleteStmt->execute()) {
    echo json_encode(["success" => true]);
} else {
    http_response_code(500);
    echo json_encode(["success" => false, "error" => $deleteStmt->error]);
}

$deleteStmt->close();
$conn->close();
?>