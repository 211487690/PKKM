<?php
$compStmt = $pdo->prepare('SELECT * FROM components WHERE id = ?');
$compStmt->execute([$compId]);
$comp = $compStmt->fetch();

$filterStatus = $_GET['status'] ?? 'all';
$filterPic = $_GET['pic'] ?? 'all';
$search = trim((string)($_GET['q'] ?? ''));

$indSql = "SELECT * FROM indicators WHERE component_id = ?";
$params = [$compId];
if (in_array($filterStatus, ['belum', 'proses', 'disetorkan'], true)) {
    $indSql .= " AND status = ?";
    $params[] = $filterStatus;
}
if ($search !== '') {
    $indSql .= " AND (unsur_tugas LIKE ? OR indikator_kinerja LIKE ? OR raw_keterangan LIKE ?)";
    $like = '%' . $search . '%';
    $params[] = $like; $params[] = $like; $params[] = $like;
}
$indSql .= " ORDER BY no ASC";
$indStmt = $pdo->prepare($indSql);
$indStmt->execute($params);
$indicators = $indStmt->fetchAll();

// Ambil PICs untuk komponen ini
$compPicsStmt = $pdo->prepare("
    SELECT DISTINCT u.id, u.name, u.role
    FROM users u
    JOIN indicator_pics ip ON ip.user_id = u.id
    JOIN indicators i ON i.id = ip.indicator_id
    WHERE i.component_id = ?
    ORDER BY u.name ASC
");
$compPicsStmt->execute([$compId]);
$compPics = $compPicsStmt->fetchAll();
?>

<div class="space-y-6">
  <div class="bg-white border border-slate-200 rounded-xl p-6">
    <div class="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
      <div>
        <div class="text-xs font-medium text-teal-700">KOMPONEN <?= (int)$comp['id'] ?> · <?= e($comp['category']) ?> · Skor Maks <?= (int)$comp['max_score'] ?></div>
        <h1 class="font-display text-2xl font-bold text-slate-900 mt-1"><?= e($comp['title']) ?></h1>
        <p class="text-sm text-slate-600 mt-1"><?= e($comp['description']) ?></p>
      </div>
    </div>

    <!-- Daftar Orang yang Mengerjakan Komponen Ini -->
    <div class="mt-4 pt-4 border-t border-slate-100">
      <div class="text-xs font-medium text-slate-500 mb-2">Orang yang mengerjakan Komponen <?= (int)$comp['id'] ?>:</div>
      <div class="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-700">
        <?php foreach ($compPics as $cp): ?>
          <a href="/?page=komponen&id=<?= (int)$compId ?>&pic=<?= e($cp['id']) ?>" class="hover:text-teal-700 <?= $filterPic === $cp['id'] ? 'font-bold text-teal-700 underline' : '' ?>">
            <?= e($cp['name']) ?>
          </a>
        <?php endforeach; ?>
        <?php if ($filterPic !== 'all'): ?>
          <a href="/?page=komponen&id=<?= (int)$compId ?>" class="text-slate-400 hover:text-slate-700">(Reset PIC)</a>
        <?php endif; ?>
      </div>
    </div>
  </div>

  <!-- Filter Bar -->
  <form method="GET" action="/" class="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
    <input type="hidden" name="page" value="komponen" />
    <input type="hidden" name="id" value="<?= (int)$compId ?>" />
    <input type="text" name="q" value="<?= e($search) ?>" placeholder="Cari unsur tugas, indikator, atau nama pelaksana..." class="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600" />
    <div class="flex items-center gap-2">
      <select name="status" class="px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white">
        <option value="all" <?= $filterStatus === 'all' ? 'selected' : '' ?>>Semua Status</option>
        <option value="disetorkan" <?= $filterStatus === 'disetorkan' ? 'selected' : '' ?>>Disetorkan (Lengkap)</option>
        <option value="proses" <?= $filterStatus === 'proses' ? 'selected' : '' ?>>Dalam Proses</option>
        <option value="belum" <?= $filterStatus === 'belum' ? 'selected' : '' ?>>Belum Disetor</option>
      </select>
      <button type="submit" class="px-4 py-2 text-sm font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800">Filter</button>
    </div>
  </form>

  <!-- Daftar Indikator & Ceklist Bukti Fisik -->
  <div class="space-y-4">
    <?php foreach ($indicators as $ind):
      // Filter PIC jika dipilih
      $picRows = $pdo->prepare("SELECT u.id, u.name FROM indicator_pics ip JOIN users u ON u.id = ip.user_id WHERE ip.indicator_id = ?");
      $picRows->execute([$ind['id']]);
      $assignedPics = $picRows->fetchAll();

      if ($filterPic !== 'all') {
          $ids = array_column($assignedPics, 'id');
          if (!in_array($filterPic, $ids, true)) {
              continue;
          }
      }

      $subStmt = $pdo->prepare('SELECT * FROM bukti_fisik_items WHERE indicator_id = ? ORDER BY item_order ASC');
      $subStmt->execute([$ind['id']]);
      $subItems = $subStmt->fetchAll();
      $doneSub = 0;
      foreach ($subItems as $si) {
          if ((int)$si['is_checked'] === 1) $doneSub++;
      }
      $totalSub = count($subItems);
    ?>
      <div class="bg-white border border-slate-200 rounded-xl p-5">
        <div class="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div class="space-y-1 flex-1">
            <div class="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span class="font-mono font-semibold text-slate-900">Butir #<?= (int)$ind['no'] ?></span>
              <span>·</span>
              <span>Pelaksana: <strong class="text-slate-800"><?= e($ind['raw_keterangan']) ?></strong></span>
              <span>·</span>
              <span class="font-mono tabular-nums"><?= $doneSub ?>/<?= $totalSub ?> bukti tercentang</span>
            </div>
            <div class="text-xs text-slate-500"><?= e($ind['unsur_tugas']) ?></div>
            <h3 class="font-display text-base font-bold text-slate-900"><?= e($ind['indikator_kinerja']) ?></h3>
          </div>

          <div class="shrink-0 text-xs font-semibold <?= $ind['status'] === 'disetorkan' ? 'text-teal-700' : ($ind['status'] === 'proses' ? 'text-amber-700' : 'text-slate-500') ?>">
            <?= $ind['status'] === 'disetorkan' ? '✓ Sudah Disetorkan' : ($ind['status'] === 'proses' ? '◔ Dalam Proses' : '○ Belum Disetor') ?>
          </div>
        </div>

        <!-- Checklist Sub-Item Bukti Fisik Level 4 -->
        <div class="mt-4 pt-4 border-t border-slate-100 space-y-2">
          <?php foreach ($subItems as $si): ?>
            <label class="flex items-start gap-2.5 text-sm cursor-pointer hover:bg-slate-50 p-1.5 rounded-lg">
              <input
                type="checkbox"
                class="mt-1 h-4 w-4 rounded border-slate-300 text-teal-700 focus:ring-teal-600"
                <?= (int)$si['is_checked'] === 1 ? 'checked' : '' ?>
                onchange="toggleSubitem(<?= (int)$si['id'] ?>, this)"
              />
              <span class="<?= (int)$si['is_checked'] === 1 ? 'line-through text-slate-400' : 'text-slate-700' ?>">
                <span class="font-mono text-xs text-slate-400 mr-1"><?= (int)$si['item_order'] ?>.</span>
                <?= e($si['description']) ?>
              </span>
            </label>
          <?php endforeach; ?>
        </div>

        <!-- Form Status & Lokasi Berkas (Ordner / Map / Google Drive) -->
        <form onsubmit="saveIndicator(event, '<?= e($ind['id']) ?>')" class="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
          <div class="md:col-span-3">
            <label class="block text-xs text-slate-500 mb-1">Status Penyetoran</label>
            <select name="status" class="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white">
              <option value="belum" <?= $ind['status'] === 'belum' ? 'selected' : '' ?>>Belum Disetor</option>
              <option value="proses" <?= $ind['status'] === 'proses' ? 'selected' : '' ?>>Dalam Proses</option>
              <option value="disetorkan" <?= $ind['status'] === 'disetorkan' ? 'selected' : '' ?>>Sudah Disetorkan (Lengkap)</option>
            </select>
          </div>
          <div class="md:col-span-4">
            <label class="block text-xs text-slate-500 mb-1">Lokasi Berkas (No. Ordner / Map / Link Drive)</label>
            <input type="text" name="lokasi_berkas" value="<?= e($ind['lokasi_berkas']) ?>" placeholder="Misal: Ordner K1-A / https://drive.google.com/..." class="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg" />
          </div>
          <div class="md:col-span-3">
            <label class="block text-xs text-slate-500 mb-1">Catatan</label>
            <input type="text" name="catatan" value="<?= e($ind['catatan']) ?>" placeholder="Catatan progres..." class="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg" />
          </div>
          <div class="md:col-span-2">
            <button type="submit" class="w-full px-4 py-2 text-xs font-semibold bg-teal-700 text-white rounded-lg hover:bg-teal-800">
              Simpan Progres
            </button>
          </div>
        </form>
      </div>
    <?php endforeach; ?>
  </div>
</div>
