<div class="space-y-6">
  <div class="bg-white border border-slate-200 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
    <div>
      <h1 class="font-display text-2xl font-bold text-slate-900">Notifikasi Progres Otomatis</h1>
      <p class="text-sm text-slate-600 mt-1">
        Menampilkan pembaruan relevan untuk <strong><?= e($activeUser['name']) ?></strong> (indikator yang ditugaskan bersama &amp; pemantauan pimpinan).
      </p>
    </div>
    <?php if ($unreadCount > 0): ?>
      <form method="POST" action="/?action=mark_read">
        <input type="hidden" name="redirect" value="/?page=notifikasi" />
        <button type="submit" class="px-4 py-2 text-xs font-semibold bg-teal-700 text-white rounded-lg hover:bg-teal-800 whitespace-nowrap">
          Tandai Semua Dibaca (<?= $unreadCount ?>)
        </button>
      </form>
    <?php endif; ?>
  </div>

  <div class="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100">
    <?php if (empty($notifications)): ?>
      <div class="p-8 text-center text-sm text-slate-500">
        Belum ada notifikasi progres untuk user ini. Ubah status atau centang bukti fisik pada salah satu komponen untuk memicu notifikasi otomatis.
      </div>
    <?php else: ?>
      <?php foreach ($notifications as $n):
        $isUnread = ((int)$n['is_read'] === 0 && $n['actor_id'] !== $activeUser['id']);
      ?>
        <div class="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 <?= $isUnread ? 'bg-teal-50/40' : '' ?>">
          <div class="space-y-1">
            <div class="flex items-center gap-2 text-xs text-slate-500">
              <span class="font-semibold text-teal-700">Komponen <?= (int)$n['component_id'] ?> · No. <?= (int)$n['indicator_no'] ?></span>
              <span>·</span>
              <span class="font-mono tabular-nums"><?= e($n['created_at']) ?></span>
              <?php if ($isUnread): ?>
                <span>·</span>
                <span class="font-semibold text-teal-700">Belum Dibaca</span>
              <?php endif; ?>
            </div>
            <div class="font-display font-bold text-slate-900 text-sm"><?= e($n['title']) ?></div>
            <p class="text-sm text-slate-600"><?= e($n['message']) ?></p>
          </div>
          <div class="flex items-center gap-2 shrink-0">
            <a href="/?page=komponen&id=<?= (int)$n['component_id'] ?>" class="px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-lg hover:bg-slate-50">
              Buka Indikator
            </a>
            <?php if ($isUnread): ?>
              <form method="POST" action="/?action=mark_read">
                <input type="hidden" name="notification_id" value="<?= (int)$n['id'] ?>" />
                <input type="hidden" name="redirect" value="/?page=notifikasi" />
                <button type="submit" class="px-3 py-1.5 text-xs font-medium text-teal-700 hover:bg-teal-50 rounded-lg">
                  Tandai Dibaca
                </button>
              </form>
            <?php endif; ?>
          </div>
        </div>
      <?php endforeach; ?>
    <?php endif; ?>
  </div>
</div>
