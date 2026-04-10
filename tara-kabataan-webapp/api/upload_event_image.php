<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require __DIR__ . '/../vendor/autoload.php';

use Aws\S3\S3Client;
use Aws\Exception\AwsException;
use Dotenv\Dotenv;

if (file_exists(__DIR__ . '/../.env')) {
    $dotenv = Dotenv::createImmutable(__DIR__ . '/../');
    $dotenv->load();
}

$s3Client = new S3Client([
    'region'      => 'ap-southeast-2',
    'version'     => 'latest',
    'credentials' => [
        'key'    => getenv('TK_AWS_ACCESS_KEY'), 
        'secret' => getenv('TK_AWS_SECRET_KEY'),
    ],
]);

$bucketName = 'tara-kabataan-webapp-v2';
$s3Folder   = 'tara-kabataan-optimized/tara-kabataan-webapp/uploads/events-images/';

if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
    
    // Check allowed extensions
    $allowedExtensions = ['jpg', 'jpeg', 'png', 'gif'];
    $ext = strtolower(pathinfo($_FILES['image']['name'], PATHINFO_EXTENSION));
    
    if (!in_array($ext, $allowedExtensions)) {
        echo json_encode(["success" => false, "error" => "Only JPG, PNG, and GIF files are allowed."]);
        exit;
    }

    $imageName = uniqid() . "_event_" . basename($_FILES["image"]["name"]);

    try {
        $result = $s3Client->putObject([
            'Bucket'      => $bucketName,
            'Key'         => $s3Folder . $imageName,
            'SourceFile'  => $_FILES['image']['tmp_name'],
            'ContentType' => mime_content_type($_FILES['image']['tmp_name'])
        ]);

        // Return the clean, relative path
        $relativePath = "events-images/" . $imageName;

        echo json_encode([
            "success"   => true,
            "image_url" => $relativePath
        ]);

    } catch (AwsException $e) {
        echo json_encode(["success" => false, "error" => "S3 Error: " . $e->getAwsErrorMessage()]);
    }
} else {
    echo json_encode(["success" => false, "error" => "Upload failed. No file detected."]);
}
?>