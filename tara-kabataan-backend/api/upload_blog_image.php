<?php
header('Content-Type: application/json');
// Update this to your specific S3 URL for better security, or keep * for testing
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit;
}

include '../config/db.php';

// --- FIX 1: Use the correct server path (same as add_new_blog_image.php) ---
$targetDir = __DIR__ . "/../uploads/blogs-images/";

if (!is_dir($targetDir)) {
    mkdir($targetDir, 0777, true);
}

if ($_FILES["image"]["error"] === UPLOAD_ERR_OK) {
    $extension = pathinfo($_FILES["image"]["name"], PATHINFO_EXTENSION);
    
    // Generate a unique name (simpler and safer than the loop)
    $imageName = uniqid() . "_blog." . $extension;
    $targetFile = $targetDir . $imageName;

    if (move_uploaded_file($_FILES["image"]["tmp_name"], $targetFile)) {
        // Optional: Base64 logic (you can keep it if your app needs it, otherwise remove)
        $fullPath = realpath($targetFile);
        $mime = mime_content_type($fullPath);
        $base64 = base64_encode(file_get_contents($fullPath));
        $base64Image = "data:$mime;base64,$base64";
    
        // --- FIX 2: Return the PUBLIC IP address so S3 can see the image ---
        $publicUrl = "http://3.25.130.172/uploads/blogs-images/" . $imageName;

        echo json_encode([
            "success" => true,
            "image_url" => $publicUrl,
            "base64" => $base64Image
        ]);
        exit;
    }    
}

echo json_encode(["success" => false, "error" => "Upload failed."]);
?>