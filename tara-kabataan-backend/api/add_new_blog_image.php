<?php
require __DIR__ . '/../vendor/autoload.php';
use Aws\S3\S3Client;
use Aws\Exception\AwsException;

header("Access-Control-Allow-Origin: http://tara-kabataan-webapp.s3-website-ap-southeast-2.amazonaws.com");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit; }

// S3 CONFIG
$s3Client = new S3Client([
    'region'      => 'ap-southeast-2',
    'version'     => 'latest',
    'credentials' => [
        'key'    => 'YOUR_ACCESS_KEY', 
        'secret' => 'YOUR_SECRET_KEY',
    ],
]);

$bucketName = 'tara-kabataan-webapp';
// Match your exact bucket path from the screenshot
$s3Folder = 'tara-kabataan-optimized/tara-kabataan-webapp/uploads/blogs-images/';

if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
    $imageName = uniqid() . "_" . basename($_FILES["image"]["name"]);
    
    try {
        $result = $s3Client->putObject([
            'Bucket' => $bucketName,
            'Key'    => $s3Folder . $imageName,
            'SourceFile' => $_FILES['image']['tmp_name'],
            'ACL'    => 'public-read',
            'ContentType' => $_FILES['image']['type']
        ]);

        // Return the path starting from 'tara-kabataan-optimized'
        echo json_encode([
            "success" => true, 
            "image_url" => $s3Folder . $imageName
        ]);
    } catch (AwsException $e) {
        echo json_encode(["success" => false, "error" => $e->getAwsErrorMessage()]);
    }
}
?>