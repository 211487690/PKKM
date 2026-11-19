<!doctype html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>SIP-PKKM 2026 | MIS Almaarif 06 Toyomarto</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700&family=JetBrains+Mono:wght@400;500;600&family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <style>
    body { font-family: 'Poppins', ui-sans-serif, system-ui, sans-serif; }
    h1, h2, h3, h4, .font-display { font-family: 'Trajan Pro', 'Cinzel', Georgia, serif; letter-spacing: 0.015em; }
    .font-mono, .tabular-nums { font-variant-numeric: tabular-nums; }
  </style>
</head>
<body class="bg-slate-50 text-slate-900 min-h-screen flex flex-col lg:flex-row">

  <!-- Sidebar Navigasi: Hijau Tosca & Abu-abu · Setiap Komponen Menu Tersendiri -->
  <aside class="w-full lg:w-72 bg-gradient-to-b from-teal-900 via-teal-950 to-slate-800 text-slate-100 border-b lg:border-b-0 lg:border-r border-slate-700/60 flex flex-col shrink-0">
    <div class="p-5 border-b border-teal-800/70 bg-teal-950/40 flex items-center gap-3">
      <div class="w-11 h-11 rounded-lg bg-white p-1 shrink-0 flex items-center justify-center border border-teal-400/30">
        <img src="/assets/logo-mia-06.png" alt="Logo MI Almaarif 06" class="w-full h-full object-contain" />
      </div>
      <div class="min-w-0">
        <div class="text-[10px] font-semibold text-teal-300 tracking-wider truncate">MIS ALMAARIF 06 TOYOMARTO</div>
        <div class="font-display text-base font-bold text-white mt-0.5 tracking-wide truncate">SIP-PKKM 2026</div>
        <div class="text-[11px] text-slate-300">Instrumen Level 4 · 89 Indikator</div>
      </div>
    </div>

    <nav class="p-3 space-y-1 flex-1 overflow-y-auto">
      <a href="/" class="flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium border transition-colors <?= $page === 'dashboard' ? 'bg-teal-500/25 text-white border-teal-400/30' : 'text-slate-200 border-transparent hover:bg-white/10 hover:text-white' ?>">
        <span>Dashboard Ringkasan</span>
        <span class="text-xs tabular-nums <?= $page === 'dashboard' ? 'text-teal-200 font-semibold' : 'text-slate-400' ?>">89</span>
      </a>

      <div class="pt-3 pb-1 px-3 text-[11px] font-semibold tracking-wider text-slate-400">Komponen Penilaian</div>
      <?php foreach ($componentsSummary as $comp):
        $isActive = ($page === 'komponen' && (int)($_GET['id'] ?? 0) === (int)$comp['id']);
      ?>
        <a href="/?page=komponen&id=<?= (int)$comp['id'] ?>" class="flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg text-sm font-medium border transition-colors <?= $isActive ? 'bg-teal-500/25 text-white border-teal-400/30' : 'text-slate-200 border-transparent hover:bg-white/10 hover:text-white' ?>">
          <span class="truncate"><?= (int)$comp['id'] ?>. <?= e($comp['short_title']) ?></span>
          <span class="text-xs tabular-nums shrink-0 <?= $isActive ? 'text-teal-200 font-semibold' : 'text-slate-400' ?>">
            <?= (int)$comp['disetorkan_count'] ?>/<?= (int)$comp['total_count'] ?>
          </span>
        </a>
      <?php endforeach; ?>

      <div class="pt-3 pb-1 px-3 text-[11px] font-semibold tracking-wider text-slate-400">Kolaborasi & Pemantauan</div>
      <a href="/?page=tim" class="flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium border transition-colors <?= $page === 'tim' ? 'bg-teal-500/25 text-white border-teal-400/30' : 'text-slate-200 border-transparent hover:bg-white/10 hover:text-white' ?>">
        <span>Tim & PIC Pelaksana</span>
        <span class="text-xs tabular-nums <?= $page === 'tim' ? 'text-teal-200 font-semibold' : 'text-slate-400' ?>"><?= count($allUsers) ?></span>
      </a>
      <a href="/?page=notifikasi" class="flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium border transition-colors <?= $page === 'notifikasi' ? 'bg-teal-500/25 text-white border-teal-400/30' : 'text-slate-200 border-transparent hover:bg-white/10 hover:text-white' ?>">
        <span>Notifikasi Progres</span>
        <?php if ($unreadCount > 0): ?>
          <span class="text-xs font-semibold tabular-nums text-teal-300"><?= $unreadCount ?> baru</span>
        <?php endif; ?>
      </a>
    </nav>

    <!-- Pengalih User Aktif (Simulasi Login PIC / Admin untuk Notifikasi Relevan) -->
    <div class="p-4 border-t border-slate-700/80 bg-slate-900/50">
      <form method="POST" action="/?action=switch_user" class="space-y-2">
        <input type="hidden" name="redirect" value="<?= e($_SERVER['REQUEST_URI'] ?? '/') ?>" />
        <label class="block text-xs font-medium text-slate-300">User Aktif (Sesi Ceklist)</label>
        <select name="user_id" onchange="this.form.submit()" class="w-full px-2.5 py-2 text-xs bg-slate-800 text-slate-100 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400">
          <?php foreach ($allUsers as $u): ?>
            <option value="<?= e($u['id']) ?>" <?= $u['id'] === $activeUser['id'] ? 'selected' : '' ?>>
              <?= e($u['name']) ?> (<?= e($u['role']) ?>)
            </option>
          <?php endforeach; ?>
        </select>
      </form>
    </div>
  </aside>

  <!-- Area Konten Utama -->
  <div class="flex-1 flex flex-col min-w-0">
    <!-- Top Header -->
    <header class="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between gap-4 shrink-0">
      <div class="text-sm font-medium text-slate-600 truncate">
        PKKM 2026
        <span class="mx-2 text-slate-300">/</span>
        <span class="text-slate-900 font-semibold">
          <?php
            if ($page === 'komponen') {
                $cid = (int)($_GET['id'] ?? 1);
                echo 'Komponen ' . $cid . ' · ' . e($componentsSummary[$cid - 1]['title'] ?? '');
            } elseif ($page === 'tim') {
                echo 'Tim & PIC Pelaksana';
            } elseif ($page === 'notifikasi') {
                echo 'Notifikasi Progres Otomatis';
            } else {
                echo 'Dashboard Ringkasan';
            }
          ?>
        </span>
      </div>

      <div class="flex items-center gap-3 shrink-0">
        <a href="/?page=notifikasi" class="px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-700 whitespace-nowrap">
          Notifikasi (<?= $unreadCount ?>)
        </a>
        <a href="/?action=export_csv" class="px-4 py-2 text-xs font-semibold bg-teal-700 text-white rounded-lg hover:bg-teal-800 whitespace-nowrap">
          Ekspor CSV
        </a>
        <a href="/?action=logout" class="px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-700 whitespace-nowrap">
          Keluar
        </a>
      </div>
    </header>

    <main class="flex-1 p-6 max-w-7xl w-full mx-auto">
