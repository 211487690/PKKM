<?php
$teamData = $pdo->query("
    SELECT u.id, u.name, u.role, u.initials,
           COUNT(ip.indicator_id) AS total_assigned,
           SUM(CASE WHEN i.status = 'disetorkan' THEN 1 ELSE 0 END) AS done_count,
           SUM(CASE WHEN i.status = 'proses' THEN 1 ELSE 0 END) AS proses_count,
           GROUP_CONCAT(DISTINCT CONCAT('K', i.component_id) ORDER BY i.component_id SEPARATOR ', ') AS components_list
    FROM users u
    LEFT JOIN indicator_pics ip ON ip.user_id = u.id
    LEFT JOIN indicators i ON i.id = ip.indicator_id
    GROUP BY u.id
    ORDER BY total_assigned DESC, u.name ASC
")->fetchAll();
?>

<div class="space-y-6">
  <div class="bg-white border border-slate-200 rounded-xl p-6">
    <h1 class="font-display text-2xl font-bold text-slate-900">Tim &amp; Penanggung Jawab (PIC) PKKM 2026</h1>
    <p class="text-sm text-slate-600 mt-1">
      Daftar seluruh pelaksana yang mengerjakan 89 butir indikator di 4 komponen sesuai kolom Keterangan dokumen visitasi.
    </p>
  </div>

  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    <?php foreach ($teamData as $member):
      $tot = (int)$member['total_assigned'];
      $done = (int)$member['done_count'];
      $pct = $tot > 0 ? round(($done / $tot) * 100) : 0;
    ?>
      <div class="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between">
        <div>
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-teal-50 text-teal-800 font-display font-bold flex items-center justify-center text-sm">
              <?= e($member['initials']) ?>
            </div>
            <div>
              <h2 class="font-display font-bold text-slate-900 text-base"><?= e($member['name']) ?></h2>
              <div class="text-xs text-slate-500"><?= e($member['role']) ?></div>
            </div>
          </div>

          <div class="mt-4 text-xs text-slate-600">
            Menangani Komponen: <span class="font-semibold text-slate-900"><?= e($member['components_list'] ?: '-') ?></span>
          </div>
        </div>

        <div class="mt-4 pt-4 border-t border-slate-100">
          <div class="flex items-center justify-between text-xs text-slate-600 mb-1.5 tabular-nums">
            <span><?= $done ?>/<?= $tot ?> indikator disetorkan</span>
            <span class="font-semibold text-teal-700"><?= $pct ?>%</span>
          </div>
          <div class="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div class="h-full bg-teal-600 rounded-full" style="width: <?= $pct ?>%"></div>
          </div>
        </div>
      </div>
    <?php endforeach; ?>
  </div>
</div>
