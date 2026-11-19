<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/helpers.php';

if (session_status() === PHP_SESSION_NONE) {
    @session_start();
}

$action = $_GET['action'] ?? ($_POST['action'] ?? '');

$requestPath = parse_url((string)($_SERVER['REQUEST_URI'] ?? '/'), PHP_URL_PATH) ?: '/';

// Serve static logo if routed through PHP
if ($requestPath === '/assets/logo-mia-06.png') {
    $logoFile = __DIR__ . '/../assets/logo-mia-06.png';
    if (is_file($logoFile)) {
        header('Content-Type: image/png');
        readfile($logoFile);
        exit;
    }
}

function safeRedirectPath(?string $raw, string $fallback = '/'): string
{
    $target = trim((string)($raw ?? ''));
    if ($target === '' || !str_starts_with($target, '/') || str_starts_with($target, '//')) {
        return $fallback;
    }
    return $target;
}

$isHttps = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
    || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');
$authSecret = hash('sha256', 'sip-pkkm-2026-almaarif06-secret-' . (getenv('DB_PASS') ?: 'local'));
$expectedAuthCookie = hash_hmac('sha256', 'admin', $authSecret);
$isAuthenticated = (!empty($_SESSION['pkkm_auth']) && $_SESSION['pkkm_auth'] === 'admin')
    || (isset($_COOKIE['pkkm_auth']) && hash_equals($expectedAuthCookie, (string)$_COOKIE['pkkm_auth']));

$loginError = '';

if ($action === 'logout') {
    unset($_SESSION['pkkm_auth']);
    setcookie('pkkm_auth', '', [
        'expires' => time() - 3600,
        'path' => '/',
        'secure' => $isHttps,
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
    header('Location: /');
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'login') {
    $inputUser = strtolower(trim((string)($_POST['username'] ?? '')));
    $inputPass = (string)($_POST['password'] ?? '');
    $passDigest = hash('sha256', $inputPass);
    $expectedDigest = '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9';

    if ($inputUser === 'admin' && hash_equals($expectedDigest, $passDigest)) {
        $_SESSION['pkkm_auth'] = 'admin';
        setcookie('pkkm_auth', $expectedAuthCookie, [
            'expires' => time() + 86400 * 7,
            'path' => '/',
            'secure' => $isHttps,
            'httponly' => true,
            'samesite' => 'Lax',
        ]);
        header('Location: /');
        exit;
    }
    $loginError = 'Username atau password tidak sesuai.';
}

if (!$isAuthenticated) {
    require __DIR__ . '/../views/login.php';
    exit;
}

$pdo = Database::getConnection();
$activeUser = getActiveUser($pdo);
$allUsers = getAllUsers($pdo);
$componentsSummary = getComponentsSummary($pdo);

// ============================================================
// API & FORM POST HANDLERS
// ============================================================
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if ($action === 'switch_user') {
        $newUserId = trim((string)($_POST['user_id'] ?? 'tata-usaha'));
        $check = $pdo->prepare('SELECT id FROM users WHERE id = ?');
        $check->execute([$newUserId]);
        if ($check->fetch()) {
            $_SESSION['active_user_id'] = $newUserId;
            setcookie('pkkm_user_id', $newUserId, time() + 86400 * 30, '/');
        }
        $redirect = safeRedirectPath($_POST['redirect'] ?? '/');
        header('Location: ' . $redirect);
        exit;
    }

    if ($action === 'toggle_subitem') {
        header('Content-Type: application/json; charset=utf-8');
        $subitemId = (int)($_POST['subitem_id'] ?? 0);
        $checked = (int)($_POST['checked'] ?? 0) ? 1 : 0;

        $stmt = $pdo->prepare('SELECT b.*, i.component_id, i.no FROM bukti_fisik_items b JOIN indicators i ON b.indicator_id = i.id WHERE b.id = ?');
        $stmt->execute([$subitemId]);
        $item = $stmt->fetch();

        if (!$item) {
            http_response_code(404);
            echo json_encode(['error' => 'Item tidak ditemukan']);
            exit;
        }

        $upd = $pdo->prepare('UPDATE bukti_fisik_items SET is_checked = ?, checked_by = ?, checked_at = NOW() WHERE id = ?');
        $upd->execute([$checked, $activeUser['id'], $subitemId]);

        // Hitung progres sub-item indikator
        $cntStmt = $pdo->prepare('SELECT COUNT(*) AS total, SUM(is_checked) AS done FROM bukti_fisik_items WHERE indicator_id = ?');
        $cntStmt->execute([$item['indicator_id']]);
        $counts = $cntStmt->fetch();
        $total = (int)$counts['total'];
        $done = (int)$counts['done'];

        $newStatus = 'belum';
        if ($done >= $total && $total > 0) {
            $newStatus = 'disetorkan';
        } elseif ($done > 0) {
            $newStatus = 'proses';
        }

        $indUpd = $pdo->prepare('UPDATE indicators SET status = ?, updated_by = ?, updated_at = NOW() WHERE id = ?');
        $indUpd->execute([$newStatus, $activeUser['id'], $item['indicator_id']]);

        $statusLabel = $newStatus === 'disetorkan' ? 'Lengkap / Disetorkan' : ($newStatus === 'proses' ? 'Dalam Proses' : 'Belum Disetor');
        dispatchRelevantNotification(
            $pdo,
            $activeUser,
            $item['indicator_id'],
            'subitem_check',
            sprintf('Update Bukti Fisik K%d No.%d', $item['component_id'], $item['no']),
            sprintf('%s %s bukti fisik #%d (%d/%d selesai · Status: %s).', $activeUser['name'], $checked ? 'menyetor/mencentang' : 'membatalkan centang', $item['item_order'], $done, $total, $statusLabel)
        );

        echo json_encode([
            'ok' => true,
            'indicator_id' => $item['indicator_id'],
            'done' => $done,
            'total' => $total,
            'status' => $newStatus,
        ]);
        exit;
    }

    if ($action === 'update_indicator') {
        header('Content-Type: application/json; charset=utf-8');
        $indicatorId = trim((string)($_POST['indicator_id'] ?? ''));
        $status = trim((string)($_POST['status'] ?? 'belum'));
        $lokasi = trim((string)($_POST['lokasi_berkas'] ?? ''));
        $catatan = trim((string)($_POST['catatan'] ?? ''));

        if (!in_array($status, ['belum', 'proses', 'disetorkan'], true)) {
            $status = 'belum';
        }

        $stmt = $pdo->prepare('SELECT * FROM indicators WHERE id = ?');
        $stmt->execute([$indicatorId]);
        $ind = $stmt->fetch();
        if (!$ind) {
            http_response_code(404);
            echo json_encode(['error' => 'Indikator tidak ditemukan']);
            exit;
        }

        $upd = $pdo->prepare('UPDATE indicators SET status = ?, lokasi_berkas = ?, catatan = ?, updated_by = ?, updated_at = NOW() WHERE id = ?');
        $upd->execute([$status, $lokasi, $catatan, $activeUser['id'], $indicatorId]);

        $statusText = $status === 'disetorkan' ? 'Disetorkan (Lengkap)' : ($status === 'proses' ? 'Dalam Proses' : 'Belum Disetor');
        dispatchRelevantNotification(
            $pdo,
            $activeUser,
            $indicatorId,
            'status_change',
            sprintf('Progres K%d Indikator #%d Diperbarui', $ind['component_id'], $ind['no']),
            sprintf('%s mengubah status menjadi %s%s.', $activeUser['name'], $statusText, $lokasi !== '' ? ' · Lokasi: ' . $lokasi : '')
        );

        echo json_encode(['ok' => true, 'status' => $status]);
        exit;
    }

    if ($action === 'mark_read') {
        $notifId = (int)($_POST['notification_id'] ?? 0);
        if ($notifId > 0) {
            $stmt = $pdo->prepare('INSERT IGNORE INTO notification_reads (notification_id, user_id) VALUES (?, ?)');
            $stmt->execute([$notifId, $activeUser['id']]);
        } else {
            // Tandai semua terbaca
            $list = getRelevantNotifications($pdo, $activeUser['id'], 200);
            $stmt = $pdo->prepare('INSERT IGNORE INTO notification_reads (notification_id, user_id) VALUES (?, ?)');
            foreach ($list as $n) {
                $stmt->execute([(int)$n['id'], $activeUser['id']]);
            }
        }
        if (!empty($_SERVER['HTTP_X_REQUESTED_WITH'])) {
            header('Content-Type: application/json');
            echo json_encode(['ok' => true]);
            exit;
        }
        header('Location: ' . safeRedirectPath($_POST['redirect'] ?? '/?page=notifikasi', '/?page=notifikasi'));
        exit;
    }

    if ($action === 'archive_indicator') {
        $indicatorId = trim((string)($_POST['indicator_id'] ?? ''));
        $archived = (int)($_POST['archived'] ?? 1) ? 1 : 0;

        if ((int)$activeUser['is_admin'] === 1 && $indicatorId !== '') {
            $stmt = $pdo->prepare('SELECT * FROM indicators WHERE id = ?');
            $stmt->execute([$indicatorId]);
            $ind = $stmt->fetch();

            if ($ind) {
                if ($archived === 1) {
                    $upd = $pdo->prepare('UPDATE indicators SET is_archived = 1, archived_by = ?, archived_at = NOW() WHERE id = ?');
                    $upd->execute([$activeUser['id'], $indicatorId]);
                } else {
                    $upd = $pdo->prepare('UPDATE indicators SET is_archived = 0, archived_by = NULL, archived_at = NULL WHERE id = ?');
                    $upd->execute([$indicatorId]);
                }

                dispatchRelevantNotification(
                    $pdo,
                    $activeUser,
                    $indicatorId,
                    'archive_update',
                    sprintf('K%d Butir #%d %s', $ind['component_id'], $ind['no'], $archived ? 'Diarsipkan' : 'Dikembalikan dari Arsip'),
                    sprintf('%s %s indikator K%d #%d.', $activeUser['name'], $archived ? 'memindahkan ke Area Arsip' : 'mengembalikan ke Fokus Aktif', $ind['component_id'], $ind['no'])
                );
            }
        }
        header('Location: ' . safeRedirectPath($_POST['redirect'] ?? '/'));
        exit;
    }

    if ($action === 'bulk_archive_completed') {
        if ((int)$activeUser['is_admin'] === 1) {
            $firstInd = $pdo->query("SELECT id FROM indicators WHERE status = 'disetorkan' AND is_archived = 0 LIMIT 1")->fetchColumn();
            $stmt = $pdo->prepare("UPDATE indicators SET is_archived = 1, archived_by = ?, archived_at = NOW() WHERE status = 'disetorkan' AND is_archived = 0");
            $stmt->execute([$activeUser['id']]);
            $count = $stmt->rowCount();
            if ($count > 0 && $firstInd) {
                dispatchRelevantNotification(
                    $pdo,
                    $activeUser,
                    (string)$firstInd,
                    'archive_update',
                    sprintf('%d Indikator Selesai Diarsipkan', $count),
                    sprintf('%s memindahkan %d indikator yang sudah disetorkan ke Area Arsip.', $activeUser['name'], $count)
                );
            }
        }
        header('Location: ' . safeRedirectPath($_POST['redirect'] ?? '/'));
        exit;
    }
}

// ============================================================
// CSV EXPORT HANDLER
// ============================================================
if ($action === 'export_csv') {
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="ceklist-pkkm-2026-almaarif06.csv"');
    $out = fopen('php://output', 'w');
    fprintf($out, chr(0xEF) . chr(0xBB) . chr(0xBF));
    fputcsv($out, ['Komponen', 'No', 'Unsur Tugas', 'Indikator Kinerja', 'PIC / Pelaksana', 'Status', 'Bukti Fisik Tercentang', 'Total Bukti Fisik', 'Lokasi Berkas / Link Drive', 'Diperbarui Oleh']);

    $rows = $pdo->query("
        SELECT i.*, c.code AS comp_code, c.title AS comp_title,
               (SELECT COUNT(*) FROM bukti_fisik_items b WHERE b.indicator_id = i.id) AS total_b,
               (SELECT COUNT(*) FROM bukti_fisik_items b WHERE b.indicator_id = i.id AND b.is_checked = 1) AS done_b
        FROM indicators i
        JOIN components c ON c.id = i.component_id
        ORDER BY i.component_id ASC, i.no ASC
    ")->fetchAll();

    foreach ($rows as $r) {
        fputcsv($out, [
            $r['comp_code'] . ' - ' . $r['comp_title'],
            $r['no'],
            $r['unsur_tugas'],
            $r['indikator_kinerja'],
            $r['raw_keterangan'],
            strtoupper($r['status']),
            $r['done_b'],
            $r['total_b'],
            $r['lokasi_berkas'],
            $r['updated_by'] ?? '-',
        ]);
    }
    fclose($out);
    exit;
}

// ============================================================
// ROUTING HALAMAN (SETIAP KOMPONEN MENU TERSENDIRI)
// ============================================================
$page = $_GET['page'] ?? 'dashboard';
$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
if (preg_match('#^/komponen/([1-4])$#', $path, $m)) {
    $page = 'komponen';
    $_GET['id'] = $m[1];
} elseif ($path === '/tim-pic') {
    $page = 'tim';
} elseif ($path === '/notifikasi') {
    $page = 'notifikasi';
}

$notifications = getRelevantNotifications($pdo, $activeUser['id'], 40);
$unreadCount = getUnreadNotificationCount($pdo, $activeUser['id']);

require __DIR__ . '/../views/layout_header.php';

if ($page === 'komponen') {
    $compId = max(1, min(4, (int)($_GET['id'] ?? 1)));
    require __DIR__ . '/../views/component.php';
} elseif ($page === 'tim') {
    require __DIR__ . '/../views/team.php';
} elseif ($page === 'notifikasi') {
    require __DIR__ . '/../views/notifications.php';
} else {
    require __DIR__ . '/../views/dashboard.php';
}

require __DIR__ . '/../views/layout_footer.php';
