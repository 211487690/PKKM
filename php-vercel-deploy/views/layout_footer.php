    </main>

    <footer class="bg-white border-t border-slate-200 px-6 py-4 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
      <div>MIS ALMAARIF 06 TOYOMARTO · NSM 111235070217 / NPSN 60715202 · Kepala Madrasah: Ahmad Syaikhu, S.Pd.I</div>
      <div class="font-medium text-slate-700">Developer By Administrator MI Almaarif 06 Toyomarto</div>
    </footer>
  </div>

  <script>
    async function toggleSubitem(subitemId, checkboxEl) {
      const checked = checkboxEl.checked ? 1 : 0;
      const body = new URLSearchParams({ action: 'toggle_subitem', subitem_id: subitemId, checked: checked });
      const res = await fetch('/?action=toggle_subitem', { method: 'POST', body });
      if (res.ok) {
        location.reload();
      }
    }

    async function saveIndicator(event, indicatorId) {
      event.preventDefault();
      const form = event.target;
      const body = new URLSearchParams(new FormData(form));
      body.set('action', 'update_indicator');
      body.set('indicator_id', indicatorId);
      const res = await fetch('/?action=update_indicator', { method: 'POST', body });
      if (res.ok) {
        location.reload();
      }
    }
  </script>
</body>
</html>
