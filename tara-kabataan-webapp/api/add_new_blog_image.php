<?php
// 1. HEADERS GO FIRST! 
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

// 2. PROPER PREFLIGHT HANDLING
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// 3. LOAD DEPENDENCIES
require 'vendor/autoload.php';

// USE statements must be here, before logic
use Aws\S3\S3Client;
use Aws\Exception\AwsException;
use Dotenv\Dotenv;

// 4. LOAD ENVIRONMENT VARIABLES
// Check if the file exists to avoid a "Fatal Error" if .env is missing
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
$s3Folder   = 'tara-kabataan-optimized/tara-kabataan-webapp/uploads/blogs-images/';

// 6. UPLOAD LOGIC
if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
    $imageName = uniqid() . "_" . basename($_FILES["image"]["name"]);

    try {
        $result = $s3Client->putObject([
            'Bucket'      => $bucketName,
            'Key'         => $s3Folder . $imageName,
            'SourceFile'  => $_FILES['image']['tmp_name'],
            'ContentType' => $_FILES['image']['type']
        ]);

        // GENERATE THE FULL HTTPS URL
        $fullS3Url = "https://{$bucketName}.s3.ap-southeast-2.amazonaws.com/{$s3Folder}{$imageName}";

        echo json_encode([
            "success"   => true,
            "image_url" => $fullS3Url
        ]);

    } catch (AwsException $e) {
        echo json_encode([
            "success" => false, 
            "error"   => "S3 Error: " . $e->getAwsErrorMessage()
        ]);
    }
} else {
    $errorMsg = isset($_FILES['image']) ? "PHP Upload Error Code: " . $_FILES['image']['error'] : "No image detected";
    echo json_encode([
        "success" => false, 
        "error"   => "No image uploaded or upload error. " . $errorMsg
    ]);
}
?>