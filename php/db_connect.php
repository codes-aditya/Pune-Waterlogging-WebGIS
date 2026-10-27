
<?php

// Load database credentials from .env
$config = parse_ini_file(__DIR__ . '/../.env');

if ($config === false) {
    throw new Exception("Database configuration missing.");
}

$host = $config['DB_HOST'];
$port = $config['DB_PORT'];
$dbname = $config['DB_NAME'];
$user = $config['DB_USER'];
$password = $config['DB_PASSWORD'];

try {

    $dsn = "pgsql:host=$host;port=$port;dbname=$dbname;";

    $pdo = new PDO($dsn, $user, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);

} catch (PDOException $e) {

    error_log($e->getMessage());

    throw new Exception("Database connection failed.");

}

?>
