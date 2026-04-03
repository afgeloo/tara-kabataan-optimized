<?php
ob_start(); // THE MAGIC SHIELD: Prevents whitespace from breaking the cookie

set_exception_handler(function (\Throwable $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Server crash: " . $e->getMessage()]);
    exit;
});

include 'db.php'; 

// --- DYNAMIC CORS HEADERS ---
$allowed_origins = [
    "https://tarakabataan.org",
    "https://www.tarakabataan.org",
    "https://tara-kabataan-optimized.vercel.app"
];

$origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';
if (in_array($origin, $allowed_origins)) {
    header("Access-Control-Allow-Origin: $origin");
}

header("Access-Control-Allow-Credentials: true"); 
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// --- PARSE INPUT ---
$data = json_decode(file_get_contents("php://input"), true);
$email = trim($data['email'] ?? '');
$otp   = trim($data['otp'] ?? '');

if (!$email || !$otp) {
  echo json_encode(["success" => false, "message" => "Email and OTP are required."]);
  exit;
}

$emailEscaped = $conn->real_escape_string($email);

try {
  $userQuery = "SELECT * FROM tk_webapp.users WHERE user_email = ?";  
  $stmt = $conn->prepare($userQuery);
  $stmt->bind_param("s", $emailEscaped);
  $stmt->execute();
  $userResult = $stmt->get_result();

  if ($userResult->num_rows === 0) {
    echo json_encode(["success" => false, "message" => "Email not registered."]);
    exit;
  }

  $user = $userResult->fetch_assoc();

  $otpQuery = "SELECT otp, expires_at, attempts FROM tk_webapp.admin_otp WHERE email = ?";
  $stmt = $conn->prepare($otpQuery);
  $stmt->bind_param("s", $emailEscaped);
  $stmt->execute();
  $otpResult = $stmt->get_result();

  if ($otpResult->num_rows === 0) {
    echo json_encode(["success" => false, "message" => "No OTP found for this email."]);
    exit;
  }

  $row = $otpResult->fetch_assoc();
  $attempts = (int)$row['attempts'];

  if (strtotime($row['expires_at']) < time()) {
    $conn->query("DELETE FROM tk_webapp.admin_otp WHERE email = '$emailEscaped'");
    echo json_encode(["success" => false, "message" => "OTP has expired. Please request a new one."]);
    exit;
  }

  if ($attempts >= 3) {
    $conn->query("DELETE FROM tk_webapp.admin_otp WHERE email = '$emailEscaped'");
    echo json_encode(["success" => false, "message" => "Maximum attempts reached. Please request a new OTP."]);
    exit;
  }

  if ($row['otp'] !== $otp) {
    $new_attempts = $attempts + 1;

    if ($new_attempts >= 3) {
      $deleteStmt = $conn->prepare("DELETE FROM tk_webapp.admin_otp WHERE email = ?");
      $deleteStmt->bind_param("s", $emailEscaped);
      $deleteStmt->execute();
      
      echo json_encode(["success" => false, "message" => "Too many incorrect attempts. OTP destroyed. Request a new one."]);
    } else {
      $updateStmt = $conn->prepare("UPDATE tk_webapp.admin_otp SET attempts = ? WHERE email = ?");
      $updateStmt->bind_param("is", $new_attempts, $emailEscaped);
      $updateStmt->execute();
      
      $tries_left = 3 - $new_attempts;
      echo json_encode(["success" => false, "message" => "Incorrect OTP. You have $tries_left attempt(s) left."]);
    }
    exit; 
  }

  // --- SUCCESS! OTP IS CORRECT ---
  $deleteStmt = $conn->prepare("DELETE FROM tk_webapp.admin_otp WHERE email = ?");
  $deleteStmt->bind_param("s", $emailEscaped);
  $deleteStmt->execute();

  // --- SERVERLESS SESSION LOCKDOWN ---
  $session_token = bin2hex(random_bytes(32));

  $updateUserStmt = $conn->prepare("UPDATE tk_webapp.users SET session_token = ? WHERE user_email = ?");
  $updateUserStmt->bind_param("ss", $session_token, $emailEscaped);
  $updateUserStmt->execute();

  // Give the token to the browser as a secure, HTTP-only Cookie
  setcookie("admin_session_token", $session_token, [
      'expires' => time() + 86400, 
      'path' => '/',
      'secure' => true,      
      'httponly' => true,    
      'samesite' => 'None'   
  ]);

  echo json_encode([
      "success" => true, 
      "message" => "Authenticated successfully.",
      "user" => [
          "user_id" => $user['user_id'],
          "user_name" => $user['user_name'],
          "user_email" => $user['user_email'],
          "user_contact" => $user['user_contact'] ?? ''
      ]
  ]);

} catch (Throwable $e) { 
  echo json_encode([
      "success" => false, 
      "message" => "Server error: " . $e->getMessage(),
      "line" => $e->getLine()
  ]);
}
// NO CLOSING PHP TAG BELOW THIS LINE!