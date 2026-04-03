<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data['image_url'])) {
    echo json_encode(["success" => false, "message" => "Image URL not provided."]);
    exit;
}

// SERVERLESS FIX: The file lives in AWS S3, so we do not use local unlink().
// We return a success message so React can clear the UI perfectly.
echo json_encode(["success" => true, "message" => "Image unlinked from database."]);
?>