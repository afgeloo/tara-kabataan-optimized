<?php
// --- 1. ENABLE DEBUGGING (Remove this after fixing) ---
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// --- 2. SECURITY HEADERS (Only One Set!) ---
$origin = 'http://tara-kabataan-webapp.s3-website-ap-southeast-2.amazonaws.com';

// Allow specific origin or fallback to * (safer for production to use specific)
header("Access-Control-Allow-Origin: $origin");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

// Handle Preflight Options
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// --- 3. LOAD DEPENDENCIES ---
// Check if vendor exists
if (!file_exists(__DIR__ . '/../vendor/autoload.php')) {
    echo json_encode(["success" => false, "message" => "Vendor folder missing on server"]);
    exit;
}
require __DIR__ . '/../vendor/autoload.php';
include '../config/db.php'; 

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

// --- 4. MAIN LOGIC ---
$data = json_decode(file_get_contents("php://input"), true);
$email = trim($data['email'] ?? '');

if (!$email) {
    echo json_encode(["success" => false, "message" => "Email is required"]);
    exit;
}

// Verify email exists
$emailEscaped = $conn->real_escape_string($email);
$checkUser = $conn->prepare("SELECT * FROM users WHERE user_email = ?");
$checkUser->bind_param("s", $emailEscaped);
$checkUser->execute();
$userResult = $checkUser->get_result();

if ($userResult->num_rows === 0) {
    echo json_encode(["success" => false, "message" => "Email not registered."]);
    exit;
}

// Generate OTP
$otp = rand(100000, 999999);
$expires_at = date("Y-m-d H:i:s", strtotime("+5 minutes"));
$otp_id = uniqid("otp_", true);

// Clean old OTPs & Insert new one
$conn->query("DELETE FROM admin_otp WHERE email = '$emailEscaped'");

$insertOtp = $conn->prepare("INSERT INTO admin_otp (otp_id, email, otp, expires_at) VALUES (?, ?, ?, ?)");
$insertOtp->bind_param("ssss", $otp_id, $emailEscaped, $otp, $expires_at);

if (!$insertOtp->execute()) {
    echo json_encode(["success" => false, "message" => "Database Error: " . $conn->error]);
    exit;
}

// Send Email
try {
    $mail = new PHPMailer(true);
    $mail->isSMTP();
    $mail->Host = 'smtp.gmail.com';
    $mail->SMTPAuth = true;
    $mail->Username = 'fajmreyes@gmail.com'; 
    $mail->Password = 'zkeq tdmk hxxl iftr'; 
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS; // Use constant
    $mail->Port = 587;

    $mail->setFrom('fajmreyes@gmail.com', 'Tara Kabataan');
    $mail->addAddress($email);
    $mail->isHTML(true);
    $mail->Subject = 'Your OTP Code';
    $mail->Body = "
      <div style='font-family: Arial, sans-serif; color: #333;'>
        <h2 style='color: #4DB1E3;'>Tara Kabataan Admin Panel</h2>
        <p>Your OTP Code is:</p>
        <p style='font-size: 24px; font-weight: bold; color: #000;'>$otp</p>
        <p>Expires in 5 minutes.</p>
      </div>
    ";

    $mail->send();
    echo json_encode(["success" => true, "message" => "OTP sent successfully"]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Mailer Error",
        "error" => $mail->ErrorInfo
    ]);
}
?>