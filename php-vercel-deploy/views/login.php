<!doctype html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Login Administrator | SIP-PKKM 2026 MIS Almaarif 06 Toyomarto</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700&family=JetBrains+Mono:wght@400;500;600&family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <style>
    body { font-family: 'Poppins', ui-sans-serif, system-ui, sans-serif; }
    h1, h2, h3, .font-display { font-family: 'Trajan Pro', 'Cinzel', Georgia, serif; letter-spacing: 0.015em; }
  </style>
</head>
<body class="min-h-screen bg-slate-100 flex flex-col justify-between text-slate-900">
  <div class="flex-1 flex items-center justify-center p-4 sm:p-6">
    <div class="w-full max-w-4xl bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm grid grid-cols-1 md:grid-cols-12">
      <!-- Panel Kiri: Logo & Identitas Madrasah -->
      <div class="md:col-span-5 bg-gradient-to-b from-teal-900 via-teal-950 to-slate-800 text-slate-100 p-8 flex flex-col justify-between">
        <div class="space-y-6">
          <div class="flex items-center gap-3.5">
            <div class="w-16 h-16 rounded-xl bg-white p-1.5 border border-teal-400/30 shrink-0 flex items-center justify-center">
              <img src="/assets/logo-mia-06.png" alt="Logo MIS Almaarif 06 Toyomarto" class="w-full h-full object-contain" />
            </div>
            <div>
              <div class="text-[11px] font-semibold text-teal-300 tracking-wider">PORTAL ADMINISTRATOR</div>
              <div class="font-display text-lg font-bold text-white leading-tight mt-0.5">SIP-PKKM 2026</div>
            </div>
          </div>

          <div class="space-y-2 pt-2 border-t border-teal-800/60">
            <h1 class="font-display text-xl font-bold text-white leading-snug">MIS ALMAARIF 06 TOYOMARTO</h1>
            <p class="text-xs text-slate-300 leading-relaxed">
              Sistem Informasi Pemantauan Ceklist Bukti Fisik &amp; Progres Visitasi Penilaian Kinerja Kepala Madrasah (PKKM) Instrumen Level 4.
            </p>
          </div>
        </div>

        <div class="mt-8 pt-4 border-t border-slate-700/70 text-[11px] text-slate-400 font-mono">
          NSM 111235070217 · NPSN 60715202
        </div>
      </div>

      <!-- Panel Kanan: Form Login -->
      <div class="md:col-span-7 p-8 sm:p-10 flex flex-col justify-center">
        <div class="flex flex-col items-center md:items-start text-center md:text-left mb-7">
          <img src="/assets/logo-mia-06.png" alt="Logo MI Almaarif 06 Toyomarto" class="w-16 h-16 object-contain mb-3 md:hidden" />
          <h2 class="font-display text-2xl font-bold text-slate-900">Masuk ke Sistem</h2>
          <p class="text-xs text-slate-500 mt-1">
            Silakan masukkan kredensial akun pengelola madrasah untuk melanjutkan.
          </p>
        </div>

        <form method="POST" action="/?action=login" class="space-y-4">
          <?php if (!empty($loginError)): ?>
            <div role="alert" class="px-3.5 py-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs font-medium text-rose-700">
              <?= e($loginError) ?>
            </div>
          <?php endif; ?>

          <div>
            <label for="username" class="block text-xs font-semibold text-slate-700 mb-1.5">Username</label>
            <input
              id="username"
              name="username"
              type="text"
              required
              autocomplete="username"
              placeholder="Masukkan username"
              class="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600"
            />
          </div>

          <div>
            <label for="password" class="block text-xs font-semibold text-slate-700 mb-1.5">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autocomplete="current-password"
              placeholder="Masukkan password"
              class="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600"
            />
          </div>

          <button
            type="submit"
            class="w-full px-4 py-2.5 text-sm font-semibold bg-teal-700 text-white rounded-lg hover:bg-teal-800 transition-colors"
          >
            Masuk Dashboard
          </button>
        </form>
      </div>
    </div>
  </div>

  <footer class="py-4 px-6 text-center text-xs text-slate-500">
    <span>MIS ALMAARIF 06 TOYOMARTO</span>
    <span class="mx-2 text-slate-300">·</span>
    <span class="font-semibold text-slate-700">Developer By Administrator MI Almaarif 06 Toyomarto</span>
  </footer>
</body>
</html>
