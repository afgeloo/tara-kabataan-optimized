<?php
// 1. HEADERS
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

// 2. PREFLIGHT
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// 3. DEPENDENCIES
require __DIR__ . '/../vendor/autoload.php';

use Aws\S3\S3Client;
use Aws\Exception\AwsException;
use Dotenv\Dotenv;

// 4. LOAD ENV
if (file_exists(__DIR__ . '/../.env')) {
    $dotenv = Dotenv::createImmutable(__DIR__ . '/../');
    $dotenv->load();
}

// 5. S3 CONFIGURATION
$s3Client = new S3Client([
    'region'      => 'ap-southeast-2',
    'version'     => 'latest',
    'credentials' => [
        'key'    => getenv('TK_AWS_ACCESS_KEY'), 
        'secret' => getenv('TK_AWS_SECRET_KEY'),
    ],
]);

$bucketName = 'tara-kabataan-webapp';
// Pointing to the partners folder!
$s3Folder   = 'tara-kabataan-optimized/tara-kabataan-webapp/uploads/partners-images/';

// 6. UPLOAD LOGIC
if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
    // Generate unique name to prevent browser caching issues
    $imageName = uniqid() . "_partner_" . basename($_FILES["image"]["name"]);

    try {
        $result = $s3Client->putObject([
            'Bucket'      => $bucketName,
            'Key'         => $s3Folder . $imageName,
            'SourceFile'  => $_FILES['image']['tmp_name'],
            'ContentType' => $_FILES['image']['type']
        ]);

        // GENERATE FULL S3 URL
        $fullS3Url = "https://{$bucketName}.s3.ap-southeast-2.amazonaws.com/{$s3Folder}{$imageName}";

        echo json_encode([
            "success"   => true,
            "image_url" => $fullS3Url
        ]);

    } catch (AwsException $e) {
        echo json_encode(["success" => false, "error" => "S3 Error: " . $e->getAwsErrorMessage()]);
    }
} else {
    echo json_encode(["success" => false, "error" => "Upload failed. No file detected."]);
}
?>