<?php
// --- 1. CONFIGURATION ---
// Allow access from your S3 frontend
header("Access-Control-Allow-Origin: http://tara-kabataan-webapp.s3-website-ap-southeast-2.amazonaws.com");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

// Handle Preflight Options
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// --- 2. SET PATHS ---
// Save images inside the backend folder on EC2
// __DIR__ is the 'api' folder, so we go up one level (..) to the root
$targetDir = __DIR__ . "/../uploads/blogs-images/";

// Create directory if it doesn't exist (just in case)
if (!is_dir($targetDir)) {
    mkdir($targetDir, 0777, true);
}

// --- 3. VALIDATION ---
if (!isset($_FILES['image']) || $_FILES['image']['error'] !== UPLOAD_ERR_OK) {
    echo json_encode(["success" => false, "error" => "No image uploaded or upload error"]);
    exit;
}

$allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
if (!in_array($_FILES['image']['type'], $allowedTypes)) {
    echo json_encode(["success" => false, "error" => "Only JPG, PNG, and GIF files are allowed."]);
    exit;
}

// --- 4. SAVE FILE ---
// Generate a unique name
$imageName = uniqid() . "_" . basename($_FILES["image"]["name"]);
$targetFile = $targetDir . $imageName;

if (move_uploaded_file($_FILES["image"]["tmp_name"], $targetFile)) {
    // --- 5. RETURN SUCCESS ---
    // IMPORTANT: Return the public EC2 URL so the frontend can display it
    $publicUrl = "http://3.25.130.172/uploads/blogs-images/" . $imageName;
    
    echo json_encode([
        "success" => true, 
        "image_url" => $publicUrl
    ]);
} else {
    echo json_encode(["success" => false, "error" => "Upload failed to destination: " . $targetDir]);
}
?>