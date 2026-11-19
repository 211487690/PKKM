<?php
$totalInd = 0; $totalDisetorkan = 0; $totalProses = 0; $totalSub = 0; $totalChecked = 0;
$barLabels = []; $barIndPct = []; $barSubPct = [];

foreach ($componentsSummary as $c) {
    $cTot = (int)$c['total_count'];
    $cDone = (int)$c['disetorkan_count'];
    $cSubTot = (int)$c['total_subitems'];
    $cSubDone = (int)$c['checked_subitems'];

    $totalInd += $cTot;
    $totalDisetorkan += $cDone;
    $totalProses += (int)$c['proses_count'];
    $totalSub += $cSubTot;
    $totalChecked += $cSubDone;

    $barLabels[] = 'Komp. ' . (int)$c['id'];
    $barIndPct[] = $cTot > 0 ? round(($cDone / $cTot) * 100) : 0;
    $barSubPct[] = $cSubTot > 0 ? round(($cSubDone / $cSubTot) * 100) : 0;
}
$totalBelum = max(0, $totalInd - $totalDisetorkan - $totalProses);
$pctGlobal = $totalInd > 0 ? round(($totalDisetorkan / $totalInd) * 100, 1) : 0;
$pctSub = $totalSub > 0 ? round(($totalChecked / $totalSub) * 100, 1) : 0;

$picStats = $pdo->query("
    SELECT u.id, u.name, u.role, u.initials,
           COUNT(ip.indicator_id) AS assigned_count,
           SUM(CASE WHEN i.status = 'disetorkan' THEN 1 ELSE 0 END) AS done_count,
           SUM(CASE WHEN i.status = 'proses' THEN 1 ELSE 0 END) AS proses_count
    FROM users u
    LEFT JOIN indicator_pics ip ON ip.user_id = u.id
    LEFT JOIN indicators i ON i.id = ip.indicator_id
    GROUP BY u.id
    ORDER BY assigned_count DESC, u.name ASC
")->fetchAll();

$archiveTab = ($_GET['archive_tab'] ?? 'active') === 'archived' ? 'archived' : 'active';
$archiveComp = (int)($_GET['archive_comp'] ?? 0);

$activeIndCount = (int)$pdo->query("SELECT COUNT(*) FROM indicators WHERE is_archived = 0")->fetchColumn();
$archivedIndCount = (int)$pdo->query("SELECT COUNT(*) FROM indicators WHERE is_archived = 1")->fetchColumn();
$archivableReadyCount = (int)$pdo->query("SELECT COUNT(*) FROM indicators WHERE status = 'disetorkan' AND is_archived = 0")->fetchColumn();

$focusSql = "SELECT * FROM indicators WHERE is_archived = ?";
$focusParams = [$archiveTab === 'archived' ? 1 : 0];
if ($archiveComp >= 1 && $archiveComp <= 4) {
    $focusSql .= " AND component_id = ?";
    $focusParams[] = $archiveComp;
}
$focusSql .= " ORDER BY component_id ASC, no ASC";
$focusStmt = $pdo->prepare($focusSql);
$focusStmt->execute($focusParams);
$focusRows = $focusStmt->fetchAll();
$pdfSummaryRows = [];
foreach ($componentsSummary as $cs) {
    $tot = (int)$cs['total_count'];
    $dn = (int)$cs['disetorkan_count'];
    $pdfSummaryRows[] = [
        'K' . (int)$cs['id'],
        $cs['title'],
        (string)(int)$cs['max_score'],
        (string)$tot,
        (string)$dn,
        (string)(int)$cs['proses_count'],
        (string)(int)$cs['belum_count'],
        (int)$cs['checked_subitems'] . '/' . (int)$cs['total_subitems'],
        ($tot > 0 ? round(($dn / $tot) * 100) : 0) . '%',
    ];
}

$allPdfDetailRows = $pdo->query("
    SELECT i.component_id, i.no, i.indikator_kinerja, i.raw_keterangan, i.status, i.lokasi_berkas, i.is_archived,
           (SELECT COUNT(*) FROM bukti_fisik_items b WHERE b.indicator_id = i.id) AS total_b,
           (SELECT COUNT(*) FROM bukti_fisik_items b WHERE b.indicator_id = i.id AND b.is_checked = 1) AS done_b
    FROM indicators i
    ORDER BY i.component_id ASC, i.no ASC
")->fetchAll();
$pdfDetailPayload = array_map(fn($r) => [
    'K' . (int)$r['component_id'] . ' #' . (int)$r['no'],
    $r['indikator_kinerja'],
    $r['raw_keterangan'],
    ($r['status'] === 'disetorkan' ? 'Disetorkan' : ($r['status'] === 'proses' ? 'Proses' : 'Belum')) . ((int)$r['is_archived'] === 1 ? ' [Arsip]' : ''),
    (int)$r['done_b'] . '/' . (int)$r['total_b'],
    $r['lokasi_berkas'] !== '' ? $r['lokasi_berkas'] : '-',
], $allPdfDetailRows);
?>

<div class="space-y-6">
  <!-- Header Lembaga + Logo + Countdown Deadline 3 Desember 2026 -->
  <div class="bg-white border border-slate-200 rounded-xl p-6">
    <div class="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">
      <div class="flex flex-col sm:flex-row sm:items-center gap-4">
        <div class="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-slate-50 border border-slate-200 p-1.5 shrink-0 flex items-center justify-center">
          <img src="/assets/logo-mia-06.png" alt="Logo MIS Almaarif 06 Toyomarto" class="w-full h-full object-contain" />
        </div>
        <div>
          <div class="text-xs font-semibold text-teal-700">LEMBAR KENDALI &amp; CEKLIST BUKTI FISIK VISITASI PKKM</div>
          <h1 class="font-display text-2xl font-bold text-slate-900 mt-1">MIS ALMAARIF 06 TOYOMARTO · PKKM 2026</h1>
          <p class="text-xs text-slate-600 mt-1">
            NSM/NPSN: <strong class="font-mono">111235070217 / 60715202</strong> · Kepala Madrasah: <strong>Ahmad Syaikhu, S.Pd.I</strong> · Pengawas: <strong>DRA. DIYAH SURYANINGSIH, M.Pd</strong>
          </p>
          <div class="mt-3">
            <button type="button" id="btn-download-pdf" class="px-4 py-2 text-xs font-semibold bg-teal-700 text-white rounded-lg hover:bg-teal-800">
              Unduh Laporan Rekapitulasi (PDF)
            </button>
          </div>
        </div>
      </div>

      <div class="bg-slate-900 text-white rounded-xl p-4 shrink-0 border border-slate-800">
        <div class="flex items-center justify-between gap-4 mb-2">
          <span class="text-xs font-medium text-teal-300">Hitung Mundur Deadline Penyetoran</span>
          <span class="text-[11px] font-mono text-slate-400">3 Des 2026</span>
        </div>
        <div id="php-countdown" class="grid grid-cols-4 gap-2 text-center">
          <div class="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5">
            <div id="cd-days" class="font-mono text-xl font-bold text-teal-300 tabular-nums">00</div>
            <div class="text-[11px] text-slate-400">Hari</div>
          </div>
          <div class="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5">
            <div id="cd-hours" class="font-mono text-xl font-bold text-white tabular-nums">00</div>
            <div class="text-[11px] text-slate-400">Jam</div>
          </div>
          <div class="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5">
            <div id="cd-mins" class="font-mono text-xl font-bold text-white tabular-nums">00</div>
            <div class="text-[11px] text-slate-400">Menit</div>
          </div>
          <div class="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5">
            <div id="cd-secs" class="font-mono text-xl font-bold text-teal-400 tabular-nums">00</div>
            <div class="text-[11px] text-slate-400">Detik</div>
          </div>
        </div>
      </div>
    </div>

    <div class="mt-5 pt-5 border-t border-slate-200 grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="p-3 rounded-lg bg-teal-50/70 border border-teal-200/70">
        <div class="text-xs text-teal-800 font-medium">Capaian Indikator</div>
        <div class="font-mono text-2xl font-bold text-teal-700 tabular-nums"><?= $pctGlobal ?>%</div>
        <div class="text-[11px] text-slate-600 tabular-nums"><?= $totalDisetorkan ?> / <?= $totalInd ?> disetorkan</div>
      </div>
      <div class="p-3 rounded-lg bg-slate-50 border border-slate-200">
        <div class="text-xs text-slate-600 font-medium">Kelengkapan Berkas</div>
        <div class="font-mono text-2xl font-bold text-slate-900 tabular-nums"><?= $pctSub ?>%</div>
        <div class="text-[11px] text-slate-500 tabular-nums"><?= $totalChecked ?> / <?= $totalSub ?> dokumen</div>
      </div>
      <div class="p-3 rounded-lg bg-slate-50 border border-slate-200">
        <div class="text-xs text-slate-500">Dalam Proses</div>
        <div class="font-mono text-2xl font-bold text-amber-700 tabular-nums"><?= $totalProses ?></div>
        <div class="text-[11px] text-slate-500">indikator</div>
      </div>
      <div class="p-3 rounded-lg bg-slate-50 border border-slate-200">
        <div class="text-xs text-slate-500">Belum Disetor</div>
        <div class="font-mono text-2xl font-bold text-slate-700 tabular-nums"><?= $totalBelum ?></div>
        <div class="text-[11px] text-slate-500">indikator</div>
      </div>
    </div>
  </div>

  <!-- Grafik Batang & Diagram Pie (Chart.js) -->
  <div class="grid grid-cols-1 lg:grid-cols-12 gap-4">
    <div class="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6">
      <h2 class="font-display text-base font-bold text-slate-900">Grafik Penyelesaian Per Komponen (%)</h2>
      <p class="text-xs text-slate-500 mb-4">Persentase indikator disetorkan vs kelengkapan bukti fisik</p>
      <div class="h-64">
        <canvas id="barChartPkkm"></canvas>
      </div>
    </div>
    <div class="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6">
      <h2 class="font-display text-base font-bold text-slate-900">Diagram Proporsi Status (<?= $totalInd ?> Indikator)</h2>
      <p class="text-xs text-slate-500 mb-4">Distribusi status penyetoran saat ini</p>
      <div class="h-64 flex items-center justify-center">
        <canvas id="pieChartPkkm"></canvas>
      </div>
    </div>
  </div>

  <!-- 4 Komponen Kartu Menu -->
  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
    <?php foreach ($componentsSummary as $comp):
      $cTotal = (int)$comp['total_count'];
      $cDone = (int)$comp['disetorkan_count'];
      $cPct = $cTotal > 0 ? round(($cDone / $cTotal) * 100) : 0;
    ?>
      <a href="/?page=komponen&id=<?= (int)$comp['id'] ?>" class="block bg-white border border-slate-200 rounded-xl p-5 hover:border-teal-500 transition-colors">
        <div class="flex items-start justify-between gap-3">
          <div>
            <div class="text-xs font-semibold text-teal-700">Komponen <?= (int)$comp['id'] ?> · Skor Maks <?= (int)$comp['max_score'] ?></div>
            <h2 class="font-display text-lg font-bold text-slate-900 mt-0.5"><?= e($comp['title']) ?></h2>
          </div>
          <span class="font-mono text-sm font-semibold text-slate-900 tabular-nums"><?= $cDone ?>/<?= $cTotal ?></span>
        </div>
        <p class="text-xs text-slate-500 mt-2 line-clamp-2"><?= e($comp['description']) ?></p>
        <div class="mt-4">
          <div class="flex items-center justify-between text-xs text-slate-600 mb-1.5 tabular-nums">
            <span><?= (int)$comp['checked_subitems'] ?>/<?= (int)$comp['total_subitems'] ?> berkas fisik tercentang</span>
            <span class="font-semibold text-teal-700"><?= $cPct ?>%</span>
          </div>
          <div class="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div class="h-full bg-teal-600 rounded-full" style="width: <?= $cPct ?>%"></div>
          </div>
        </div>
      </a>
    <?php endforeach; ?>
  </div>

  <!-- Fokus Pengerjaan & Arsip Indikator -->
  <div class="bg-white border border-slate-200 rounded-xl overflow-hidden">
    <div class="px-6 py-4 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
      <div>
        <h3 class="font-display text-base font-bold text-slate-900">Fokus Pengerjaan &amp; Arsip Indikator</h3>
        <p class="text-xs text-slate-500">Arsipkan indikator yang sudah selesai disetorkan agar tim fokus pada item belum selesai</p>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <?php if ((int)$activeUser['is_admin'] === 1 && $archivableReadyCount > 0): ?>
          <form method="POST" action="/?action=bulk_archive_completed">
            <input type="hidden" name="redirect" value="/?archive_tab=<?= e($archiveTab) ?>&archive_comp=<?= (int)$archiveComp ?>" />
            <button type="submit" class="px-3 py-1.5 text-xs font-semibold bg-teal-700 text-white rounded-lg hover:bg-teal-800">
              Arsipkan Semua Selesai (<?= $archivableReadyCount ?>)
            </button>
          </form>
        <?php endif; ?>
        <div class="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs">
          <a href="/?archive_tab=active&archive_comp=<?= (int)$archiveComp ?>" class="px-3 py-1.5 rounded-md font-medium <?= $archiveTab === 'active' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600' ?>">
            Fokus Aktif (<?= $activeIndCount ?>)
          </a>
          <a href="/?archive_tab=archived&archive_comp=<?= (int)$archiveComp ?>" class="px-3 py-1.5 rounded-md font-medium <?= $archiveTab === 'archived' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600' ?>">
            Area Arsip (<?= $archivedIndCount ?>)
          </a>
        </div>
      </div>
    </div>

    <div class="px-6 py-3 bg-slate-50/70 border-b border-slate-200 flex flex-wrap items-center gap-1.5 text-xs">
      <?php foreach ([0 => 'Semua', 1 => 'K1', 2 => 'K2', 3 => 'K3', 4 => 'K4'] as $cid => $clabel): ?>
        <a href="/?archive_tab=<?= e($archiveTab) ?>&archive_comp=<?= $cid ?>" class="px-2.5 py-1 rounded-md border font-medium <?= $archiveComp === $cid ? 'bg-teal-700 text-white border-teal-700' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100' ?>">
          <?= $clabel ?>
        </a>
      <?php endforeach; ?>
    </div>

    <div class="divide-y divide-slate-100 max-h-96 overflow-y-auto">
      <?php if (empty($focusRows)): ?>
        <div class="p-8 text-center text-xs text-slate-500">
          <?= $archiveTab === 'archived' ? 'Area Arsip masih kosong.' : 'Seluruh indikator telah diarsipkan.' ?>
        </div>
      <?php else: ?>
        <?php foreach ($focusRows as $fr): ?>
          <div class="px-6 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80">
            <div class="min-w-0">
              <div class="text-xs text-slate-500">
                <span class="font-mono font-semibold text-teal-700">K<?= (int)$fr['component_id'] ?> #<?= (int)$fr['no'] ?></span>
                <span class="mx-1.5 text-slate-300">·</span>
                <span><?= $fr['status'] === 'disetorkan' ? 'Sudah Disetorkan' : ($fr['status'] === 'proses' ? 'Dalam Proses' : 'Belum Disetor') ?></span>
                <span class="mx-1.5 text-slate-300">·</span>
                <span><?= e($fr['raw_keterangan']) ?></span>
              </div>
              <div class="text-sm font-semibold text-slate-900 truncate mt-0.5"><?= e($fr['indikator_kinerja']) ?></div>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <a href="/?page=komponen&id=<?= (int)$fr['component_id'] ?>&show_archived=1#ind-<?= e($fr['id']) ?>" class="px-2.5 py-1.5 text-xs font-medium border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-100">
                Buka
              </a>
              <?php if ((int)$activeUser['is_admin'] === 1): ?>
                <?php if ($archiveTab === 'archived'): ?>
                  <form method="POST" action="/?action=archive_indicator">
                    <input type="hidden" name="indicator_id" value="<?= e($fr['id']) ?>" />
                    <input type="hidden" name="archived" value="0" />
                    <input type="hidden" name="redirect" value="/?archive_tab=archived&archive_comp=<?= (int)$archiveComp ?>" />
                    <button type="submit" class="px-2.5 py-1.5 text-xs font-medium border border-slate-300 bg-white rounded-lg text-slate-700 hover:bg-slate-50">
                      Kembalikan
                    </button>
                  </form>
                <?php elseif ($fr['status'] === 'disetorkan'): ?>
                  <form method="POST" action="/?action=archive_indicator">
                    <input type="hidden" name="indicator_id" value="<?= e($fr['id']) ?>" />
                    <input type="hidden" name="archived" value="1" />
                    <input type="hidden" name="redirect" value="/?archive_tab=active&archive_comp=<?= (int)$archiveComp ?>" />
                    <button type="submit" class="px-2.5 py-1.5 text-xs font-medium border border-teal-200 bg-teal-50 rounded-lg text-teal-800 hover:bg-teal-100">
                      Arsipkan
                    </button>
                  </form>
                <?php endif; ?>
              <?php endif; ?>
            </div>
          </div>
        <?php endforeach; ?>
      <?php endif; ?>
    </div>
  </div>

  <!-- Rekap Orang yang Mengerjakan -->
  <div class="bg-white border border-slate-200 rounded-xl overflow-hidden">
    <div class="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
      <div>
        <h3 class="font-display text-base font-bold text-slate-900">Pelaksana / Penanggung Jawab Komponen</h3>
        <p class="text-xs text-slate-500">Berdasarkan pembagian tugas dalam dokumen Ceklist Bukti Fisik PKKM Level 4</p>
      </div>
      <a href="/?page=tim" class="text-xs font-semibold text-teal-700 hover:underline">Lihat Detail Tim →</a>
    </div>
    <div class="overflow-x-auto">
      <table class="w-full text-sm text-left">
        <thead class="bg-slate-50 text-xs text-slate-500 border-b border-slate-200">
          <tr>
            <th class="px-6 py-3 font-medium">Nama Pelaksana</th>
            <th class="px-6 py-3 font-medium">Peran / Jabatan</th>
            <th class="px-6 py-3 font-medium text-right">Indikator</th>
            <th class="px-6 py-3 font-medium text-right">Proses</th>
            <th class="px-6 py-3 font-medium text-right">Disetorkan</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <?php foreach ($picStats as $ps): ?>
            <tr class="hover:bg-teal-50/40">
              <td class="px-6 py-3 font-medium text-slate-900"><?= e($ps['name']) ?></td>
              <td class="px-6 py-3 text-slate-500 text-xs"><?= e($ps['role']) ?></td>
              <td class="px-6 py-3 text-right font-mono tabular-nums"><?= (int)$ps['assigned_count'] ?></td>
              <td class="px-6 py-3 text-right font-mono tabular-nums text-amber-700"><?= (int)$ps['proses_count'] ?></td>
              <td class="px-6 py-3 text-right font-mono tabular-nums font-semibold text-teal-700"><?= (int)$ps['done_count'] ?></td>
            </tr>
          <?php endforeach; ?>
        </tbody>
      </table>
    </div>
  </div>
</div>

<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.4/dist/chart.umd.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/jspdf-autotable@3.8.2/dist/jspdf.plugin.autotable.min.js"></script>
<script>
  (function() {
    const deadline = new Date('2026-12-03T23:59:59+07:00').getTime();
    const pad = (n) => String(n).padStart(2, '0');
    const elDays = document.getElementById('cd-days');
    const elHours = document.getElementById('cd-hours');
    const elMins = document.getElementById('cd-mins');
    const elSecs = document.getElementById('cd-secs');

    function updateCountdown() {
      if (!elDays || !elHours || !elMins || !elSecs) return;
      const diff = deadline - Date.now();
      if (diff <= 0) {
        elDays.textContent = '00';
        elHours.textContent = '00';
        elMins.textContent = '00';
        elSecs.textContent = '00';
        return;
      }
      elDays.textContent = pad(Math.floor(diff / 86400000));
      elHours.textContent = pad(Math.floor((diff / 3600000) % 24));
      elMins.textContent = pad(Math.floor((diff / 60000) % 60));
      elSecs.textContent = pad(Math.floor((diff / 1000) % 60));
    }
    updateCountdown();
    setInterval(updateCountdown, 1000);

    const pdfBtn = document.getElementById('btn-download-pdf');
    if (pdfBtn) {
      pdfBtn.addEventListener('click', async function() {
        if (!window.jspdf) {
          alert('Pustaka PDF belum termuat. Periksa koneksi internet dan coba lagi.');
          return;
        }
        pdfBtn.disabled = true;
        try {
          const { jsPDF } = window.jspdf;
          const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
          let headerX = 14;
          try {
            const imgRes = await fetch('/assets/logo-mia-06.png');
            if (imgRes.ok) {
              const blob = await imgRes.blob();
              const dataUrl = await new Promise((resolve) => {
                const r = new FileReader();
                r.onloadend = () => resolve(typeof r.result === 'string' ? r.result : null);
                r.readAsDataURL(blob);
              });
              if (dataUrl) {
                doc.addImage(dataUrl, 'PNG', 14, 11, 20, 20);
                headerX = 38;
              }
            }
          } catch (_) {}

          doc.setFont('helvetica', 'bold');
          doc.setFontSize(13);
          doc.text('MIS ALMAARIF 06 TOYOMARTO - LAPORAN REKAPITULASI PKKM 2026', headerX, 18);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8.5);
          doc.text('NSM: 111235070217 | NPSN: 60715202 | Capaian Global: <?= $pctGlobal ?>% (<?= $totalDisetorkan ?>/<?= $totalInd ?> Butir)', headerX, 24);
          doc.text('Developer By Administrator MI Almaarif 06 Toyomarto', headerX, 29);

          doc.autoTable({
            startY: 36,
            head: [['Kode', 'Komponen', 'Skor', 'Butir', 'Disetorkan', 'Proses', 'Belum', 'Bukti Fisik', 'Capaian']],
            body: <?= json_encode($pdfSummaryRows, JSON_HEX_TAG | JSON_HEX_AMP | JSON_UNESCAPED_UNICODE) ?>,
            headStyles: { fillColor: [15, 118, 110] },
            styles: { fontSize: 8 }
          });
          const nextY = (doc.lastAutoTable && doc.lastAutoTable.finalY ? doc.lastAutoTable.finalY : 70) + 8;
          doc.autoTable({
            startY: nextY,
            head: [['Butir', 'Indikator Kinerja', 'PIC', 'Status', 'Bukti', 'Lokasi Berkas']],
            body: <?= json_encode($pdfDetailPayload, JSON_HEX_TAG | JSON_HEX_AMP | JSON_UNESCAPED_UNICODE) ?>,
            headStyles: { fillColor: [15, 118, 110] },
            styles: { fontSize: 7 }
          });
          doc.save('Laporan-Rekap-PKKM-2026-MI-Almaarif-06.pdf');
        } finally {
          pdfBtn.disabled = false;
        }
      });
    }

    if (window.Chart) {
      const barCtx = document.getElementById('barChartPkkm');
      if (barCtx) {
        new Chart(barCtx, {
          type: 'bar',
          data: {
            labels: <?= json_encode($barLabels, JSON_HEX_TAG | JSON_HEX_AMP | JSON_UNESCAPED_UNICODE) ?>,
            datasets: [
              {
                label: 'Indikator Disetorkan (%)',
                data: <?= json_encode($barIndPct, JSON_HEX_TAG | JSON_HEX_AMP | JSON_UNESCAPED_UNICODE) ?>,
                backgroundColor: '#0d9488',
                borderRadius: 4
              },
              {
                label: 'Bukti Fisik Tercentang (%)',
                data: <?= json_encode($barSubPct, JSON_HEX_TAG | JSON_HEX_AMP | JSON_UNESCAPED_UNICODE) ?>,
                backgroundColor: '#94a3b8',
                borderRadius: 4
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { y: { beginAtZero: true, max: 100 } }
          }
        });
      }

      const pieCtx = document.getElementById('pieChartPkkm');
      if (pieCtx) {
        new Chart(pieCtx, {
          type: 'doughnut',
          data: {
            labels: ['Sudah Disetorkan', 'Dalam Proses', 'Belum Disetor'],
            datasets: [{
              data: [<?= $totalDisetorkan ?>, <?= $totalProses ?>, <?= $totalBelum ?>],
              backgroundColor: ['#0d9488', '#d97706', '#94a3b8'],
              borderWidth: 2,
              borderColor: '#ffffff'
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '62%'
          }
        });
      }
    }
  })();
</script>
