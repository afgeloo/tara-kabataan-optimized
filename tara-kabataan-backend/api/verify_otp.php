<?php
// 1. THE ULTIMATE COOKIE LOCKDOWN
ini_set('session.cookie_httponly', 1); // Invisible to JavaScript
ini_set('session.cookie_secure', 1);   // ONLY works over HTTPS
ini_set('session.cookie_samesite', 'None'); // CRITICAL: Allows Vercel to receive the cookie
ini_set('session.cookie_domain', '.tarakabataan.org'); // <-- ADD THIS LINE!

session_start();

include '../config/db.php'; 

// DYNAMIC CORS HEADERS
$origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';
header("Access-Control-Allow-Origin: $origin");
header("Access-Control-Allow-Credentials: true"); // Tells browser to save the cookie
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

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

  // --- ADDED ATTEMPTS TO THE QUERY ---
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

  // 1. Check Expiration
  if (strtotime($row['expires_at']) < time()) {
    $conn->query("DELETE FROM tk_webapp.admin_otp WHERE email = '$emailEscaped'");
    echo json_encode(["success" => false, "message" => "OTP has expired. Please request a new one."]);
    exit;
  }

  // 2. Safety Catch: If they somehow got to 3+ attempts, reject instantly
  if ($attempts >= 3) {
    $conn->query("DELETE FROM tk_webapp.admin_otp WHERE email = '$emailEscaped'");
    echo json_encode(["success" => false, "message" => "Maximum attempts reached. Please request a new OTP."]);
    exit;
  }

  // 3. CHECK IF THE OTP IS WRONG
  if ($row['otp'] !== $otp) {
    $new_attempts = $attempts + 1;

    if ($new_attempts >= 3) {
      // They failed 3 times. DESTROY the OTP in the database.
      $deleteStmt = $conn->prepare("DELETE FROM tk_webapp.admin_otp WHERE email = ?");
      $deleteStmt->bind_param("s", $emailEscaped);
      $deleteStmt->execute();
      
      echo json_encode(["success" => false, "message" => "Too many incorrect attempts. OTP destroyed. Request a new one."]);
    } else {
      // They failed, but still have tries left. UPDATE the database counter.
      $updateStmt = $conn->prepare("UPDATE tk_webapp.admin_otp SET attempts = ? WHERE email = ?");
      $updateStmt->bind_param("is", $new_attempts, $emailEscaped);
      $updateStmt->execute();
      
      $tries_left = 3 - $new_attempts;
      echo json_encode(["success" => false, "message" => "Incorrect OTP. You have $tries_left attempt(s) left."]);
    }
    exit; // STOP SCRIPT EXECUTION SO IT DOESN'T LOG THEM IN!
  }

  // 4. IF WE REACH HERE, THE OTP WAS CORRECT!
  // Delete the successful OTP so it can't be reused
  $deleteStmt = $conn->prepare("DELETE FROM tk_webapp.admin_otp WHERE email = ?");
  $deleteStmt->bind_param("s", $emailEscaped);
  $deleteStmt->execute();

  // THE SECURITY LOCKDOWN
  session_regenerate_id(true); // Destroy the old session ID and create a fresh one
  $_SESSION['admin_logged_in'] = true;
  $_SESSION['admin_user_id']   = $user['user_id']; 
  $_SESSION['admin_email']     = $user['user_email'];
  $_SESSION['admin_name']      = $user['user_name']; 

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
} catch (Throwable $e) { // Changed to Throwable to catch fatal SQL crashes
  echo json_encode([
      "success" => false, 
      "message" => "Server error: " . $e->getMessage(),
      "line" => $e->getLine()
  ]);
}
?>