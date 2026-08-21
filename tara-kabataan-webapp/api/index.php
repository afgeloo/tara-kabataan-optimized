<?php
/**
 * Single-function API router.
 *
 * Vercel's Hobby plan allows 12 Serverless Functions per deployment, but
 * mapping api/*.php to the PHP runtime produced one function per file (61).
 * vercel.json now declares only this file as a function and rewrites
 * /api/<script>.php to it; every endpoint still lives in its own file and is
 * dispatched here, so 61 functions collapse into 1.
 *
 * The endpoint name arrives as __endpoint from the rewrite's named capture.
 * REQUEST_URI is used as a fallback so the file also works when hit directly.
 */

$requested = $_GET['__endpoint'] ?? null;

if ($requested === null) {
    // Fallback: recover the script name from the original URI.
    $path = parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH) ?? '';
    $requested = preg_replace('#^/api/#', '', $path);
}

// Never let the dispatch parameter leak into the endpoint's own input.
unset($_GET['__endpoint'], $_REQUEST['__endpoint']);

// Collapse any directory traversal to a bare filename before validating.
$script = basename((string) $requested);

$deny = ['index.php', 'db.php'];

if (
    $script === ''
    || !preg_match('/^[A-Za-z0-9_-]+\.php$/', $script)
    || in_array($script, $deny, true)
    || !is_file(__DIR__ . '/' . $script)
) {
    http_response_code(404);
    header('Content-Type: application/json; charset=UTF-8');
    echo json_encode([
        'success'  => false,
        'error'    => 'Unknown API endpoint',
        'endpoint' => $script,
    ]);
    exit;
}

// Endpoints use relative includes ("include 'db.php'"), which resolve against
// the working directory. Pin it to api/ so dispatch cannot change resolution.
chdir(__DIR__);

require __DIR__ . '/' . $script;
