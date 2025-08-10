<?php
header("Content-Type: application/json; charset=utf-8");
$host = "tara-kabataan-rds.cdy2k86gkg9l.ap-southeast-2.rds.amazonaws.com";
$port = 3306; 
$user = "tkadmin";
$pass = "tkwebapp2025";
$db   = "tk_webapp";

$conn = mysqli_init();
mysqli_options($conn, MYSQLI_OPT_CONNECT_TIMEOUT, 5);

if (!@mysqli_real_connect($conn, $host, $user, $pass, $db, $port)) {
  http_response_code(500);
  echo json_encode(["error"=>"DB connect failed","code"=>mysqli_connect_errno(),"msg"=>mysqli_connect_error()]);
  exit;
}
$conn->set_charset("utf8mb4");
