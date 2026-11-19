<?php
declare(strict_types=1);

function e(?string $val): string
{
    return htmlspecialchars((string)($val ?? ''), ENT_QUOTES, 'UTF-8');
}

function getActiveUser(PDO $pdo): array
{
    if (session_status() === PHP_SESSION_NONE) {
        @session_start();
    }
    $userId = $_SESSION['active_user_id'] ?? ($_COOKIE['pkkm_user_id'] ?? 'tata-usaha');

    $stmt = $pdo->prepare('SELECT * FROM users WHERE id = ? LIMIT 1');
    $stmt->execute([$userId]);
    $user = $stmt->fetch();

    if (!$user) {
        $stmt = $pdo->query("SELECT * FROM users WHERE id = 'tata-usaha' LIMIT 1");
        $user = $stmt->fetch();
    }
    return $user ?: [
        'id' => 'tata-usaha',
        'name' => 'Tata Usaha / Administrator',
        'role' => 'Tata Usaha Madrasah (TUM)',
        'initials' => 'TU',
        'is_admin' => 1,
    ];
}

function getAllUsers(PDO $pdo): array
{
    return $pdo->query('SELECT * FROM users ORDER BY is_admin DESC, name ASC')->fetchAll();
}

function getComponentsSummary(PDO $pdo): array
{
    $sql = "
        SELECT
            c.*,
            COUNT(i.id) AS total_count,
            SUM(CASE WHEN i.status = 'disetorkan' THEN 1 ELSE 0 END) AS disetorkan_count,
            SUM(CASE WHEN i.status = 'proses' THEN 1 ELSE 0 END) AS proses_count,
            SUM(CASE WHEN i.status = 'belum' THEN 1 ELSE 0 END) AS belum_count,
            (
                SELECT COUNT(*) FROM bukti_fisik_items b
                JOIN indicators i2 ON b.indicator_id = i2.id
                WHERE i2.component_id = c.id
            ) AS total_subitems,
            (
                SELECT COUNT(*) FROM bukti_fisik_items b
                JOIN indicators i2 ON b.indicator_id = i2.id
                WHERE i2.component_id = c.id AND b.is_checked = 1
            ) AS checked_subitems
        FROM components c
        LEFT JOIN indicators i ON i.component_id = c.id
        GROUP BY c.id
        ORDER BY c.id ASC
    ";
    return $pdo->query($sql)->fetchAll();
}

/**
 * Emit notifikasi progres otomatis kepada user yang relevan:
 * - Seluruh PIC yang terhubung pada indikator terkait (selain aktor yang melakukan aksi)
 * - Kepala Madrasah (ahmad-syaikhu) & Administrator (tata-usaha) untuk monitoring
 * - Milestone otomatis jika komponen mencapai 25%, 50%, 75%, atau 100% disetorkan
 */
function dispatchRelevantNotification(
    PDO $pdo,
    array $actor,
    string $indicatorId,
    string $type,
    string $title,
    string $message
): void {
    $indStmt = $pdo->prepare('SELECT id, component_id, no FROM indicators WHERE id = ? LIMIT 1');
    $indStmt->execute([$indicatorId]);
    $ind = $indStmt->fetch();
    if (!$ind) {
        return;
    }

    $picStmt = $pdo->prepare('SELECT user_id FROM indicator_pics WHERE indicator_id = ?');
    $picStmt->execute([$indicatorId]);
    $picIds = $picStmt->fetchAll(PDO::FETCH_COLUMN);

    $targets = array_unique(array_merge($picIds, ['ahmad-syaikhu', 'tata-usaha']));
    $targets = array_values(array_filter($targets, fn($uid) => $uid !== $actor['id']));

    if (empty($targets)) {
        $targets = ['ahmad-syaikhu', 'tata-usaha'];
    }

    $ins = $pdo->prepare("
        INSERT INTO notifications (actor_id, actor_name, indicator_id, component_id, indicator_no, type, title, message, target_user_ids)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");
    $ins->execute([
        $actor['id'],
        $actor['name'],
        $ind['id'],
        (int)$ind['component_id'],
        (int)$ind['no'],
        $type,
        $title,
        $message,
        json_encode($targets, JSON_UNESCAPED_UNICODE),
    ]);
}

function getRelevantNotifications(PDO $pdo, string $userId, int $limit = 50): array
{
    $stmt = $pdo->prepare("
        SELECT
            n.*,
            CASE WHEN nr.user_id IS NOT NULL THEN 1 ELSE 0 END AS is_read
        FROM notifications n
        LEFT JOIN notification_reads nr ON nr.notification_id = n.id AND nr.user_id = ?
        WHERE JSON_CONTAINS(n.target_user_ids, JSON_QUOTE(?))
           OR n.actor_id = ?
        ORDER BY n.created_at DESC, n.id DESC
        LIMIT ?
    ");
    $stmt->bindValue(1, $userId, PDO::PARAM_STR);
    $stmt->bindValue(2, $userId, PDO::PARAM_STR);
    $stmt->bindValue(3, $userId, PDO::PARAM_STR);
    $stmt->bindValue(4, $limit, PDO::PARAM_INT);
    $stmt->execute();
    return $stmt->fetchAll();
}

function getUnreadNotificationCount(PDO $pdo, string $userId): int
{
    $stmt = $pdo->prepare("
        SELECT COUNT(*) FROM notifications n
        LEFT JOIN notification_reads nr ON nr.notification_id = n.id AND nr.user_id = ?
        WHERE JSON_CONTAINS(n.target_user_ids, JSON_QUOTE(?))
          AND nr.user_id IS NULL
          AND n.actor_id <> ?
    ");
    $stmt->execute([$userId, $userId, $userId]);
    return (int)$stmt->fetchColumn();
}
