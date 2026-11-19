import React, { useEffect, useState } from 'react';
import JSZip from 'jszip';
import { Check, Copy, Download, FileCode2, FolderGit2, Server } from 'lucide-react';

interface PhpFileEntry {
  path: string;
  content: string;
}

const staticPhpRawModules = import.meta.glob(
  [
    '/php-vercel-deploy/**/*.php',
    '/php-vercel-deploy/**/*.sql',
    '/php-vercel-deploy/**/*.json',
    '/php-vercel-deploy/**/*.md',
    '/php-vercel-deploy/.env.example',
    '/php-vercel-deploy/.gitignore',
  ],
  { query: '?raw', import: 'default' }
) as Record<string, () => Promise<string>>;

export const PhpDeployView: React.FC = () => {
  const [files, setFiles] = useState<PhpFileEntry[]>([]);
  const [selectedPath, setSelectedPath] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const [downloadingZip, setDownloadingZip] = useState<boolean>(false);

  useEffect(() => {
    let active = true;

    const loadFiles = async () => {
      try {
        const res = await fetch('/api/php-files');
        const ct = res.headers.get('content-type') || '';
        if (res.ok && ct.includes('application/json')) {
          const data = await res.json();
          if (active && Array.isArray(data.files) && data.files.length > 0) {
            setFiles(data.files);
            const preferred =
              data.files.find((f: PhpFileEntry) => f.path === 'vercel.json') ?? data.files[0];
            setSelectedPath(preferred.path);
            setLoading(false);
            return;
          }
        }
      } catch {
        // Fallback to static Vite bundled files
      }

      try {
        const entries = await Promise.all(
          Object.entries(staticPhpRawModules).map(async ([fullPath, loader]) => ({
            path: fullPath.replace(/^\/php-vercel-deploy\//, ''),
            content: await loader(),
          }))
        );
        entries.sort((a, b) => a.path.localeCompare(b.path));
        if (active) {
          setFiles(entries);
          if (entries.length > 0) {
            const preferred = entries.find((f) => f.path === 'vercel.json') ?? entries[0];
            setSelectedPath(preferred.path);
          }
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    loadFiles();
    return () => {
      active = false;
    };
  }, []);

  const currentFile = files.find((f) => f.path === selectedPath);

  const handleCopy = async () => {
    if (!currentFile) return;
    await navigator.clipboard.writeText(currentFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleDownloadZip = async () => {
    setDownloadingZip(true);
    try {
      const res = await fetch('/api/download-php-zip');
      const ct = res.headers.get('content-type') || '';
      if (res.ok && ct.includes('application/zip')) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'sip-pkkm-2026-php-pdo-vercel.zip';
        a.click();
        URL.revokeObjectURL(url);
        return;
      }
    } catch {
      // Fall back to client-side JSZip bundle
    }

    try {
      const zip = new JSZip();
      for (const f of files) {
        zip.file(f.path, f.content);
      }
      try {
        const logoRes = await fetch('/assets/aistudio/LOGO_MIA_06_23b19dba.png');
        if (logoRes.ok) {
          const logoBuf = await logoRes.arrayBuffer();
          zip.file('assets/logo-mia-06.png', logoBuf);
        }
      } catch {
        // Optional logo asset
      }
      const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'sip-pkkm-2026-php-pdo-vercel.zip';
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setDownloadingZip(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Unduh Paket Siap Deploy */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="text-xs font-medium text-teal-700">
            PHP Native PDO · MySQL · Tailwind CSS · Vercel PHP Runtime
          </div>
          <h1 className="font-display text-2xl font-bold text-slate-900">
            Paket Siap Deploy GitHub &amp; Vercel App
          </h1>
          <p className="text-sm text-slate-600 max-w-3xl">
            Seluruh kode sumber PHP Native PDO, skema database MySQL + data seed 89 indikator PKKM 2026, tampilan Tailwind CSS, dan konfigurasi <span className="font-mono text-xs">vercel.json</span> siap diunduh dan diunggah ke GitHub.
          </p>
        </div>

        <button
          type="button"
          disabled={downloadingZip || loading}
          onClick={handleDownloadZip}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold bg-teal-700 text-white rounded-lg hover:bg-teal-800 disabled:opacity-60 whitespace-nowrap shrink-0"
        >
          <Download className="w-4 h-4" />
          <span>{downloadingZip ? 'Menyiapkan ZIP...' : 'Unduh Paket ZIP Siap Deploy'}</span>
        </button>
      </section>

      {/* Ringkasan Langkah GitHub & Vercel */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-2">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <Server className="w-4 h-4 text-teal-700" />
            <span>1. Import MySQL Cloud</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Buat database MySQL (TiDB Cloud / Aiven / Railway / Hostinger). Jalankan file <span className="font-mono">database/schema.sql</span> lalu <span className="font-mono">database/seed.sql</span> untuk mengisi seluruh 89 indikator &amp; 12 PIC.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-2">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <FolderGit2 className="w-4 h-4 text-teal-700" />
            <span>2. Push ke Repository GitHub</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Ekstrak arsip ZIP yang diunduh, lalu unggah ke repository GitHub Anda (<span className="font-mono">git init</span>, <span className="font-mono">git add .</span>, <span className="font-mono">git push</span>). Pastikan file <span className="font-mono">vercel.json</span> berada di root folder.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-2">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <FileCode2 className="w-4 h-4 text-teal-700" />
            <span>3. Deploy di Vercel App</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Hubungkan repo GitHub di Vercel, isi Environment Variables (<span className="font-mono">DB_HOST</span>, <span className="font-mono">DB_PORT</span>, <span className="font-mono">DB_NAME</span>, <span className="font-mono">DB_USER</span>, <span className="font-mono">DB_PASS</span>), lalu klik Deploy.
          </p>
        </div>
      </section>

      {/* Explorer File Kode Sumber PHP Native PDO */}
      <section className="bg-white border border-slate-200 rounded-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[520px]">
        <div className="lg:col-span-4 border-b lg:border-b-0 lg:border-r border-slate-200 bg-slate-50/60">
          <div className="px-4 py-3 border-b border-slate-200 text-xs font-semibold text-slate-700">
            Struktur File PHP Native PDO ({files.length} file)
          </div>
          {loading ? (
            <div className="p-4 text-xs text-slate-500">Memuat daftar file...</div>
          ) : (
            <div className="divide-y divide-slate-100 max-h-[480px] overflow-y-auto">
              {files.map((f) => (
                <button
                  key={f.path}
                  type="button"
                  onClick={() => setSelectedPath(f.path)}
                  className={`w-full text-left px-4 py-2.5 text-xs font-mono transition-colors ${
                    f.path === selectedPath
                      ? 'bg-teal-50 text-teal-800 font-semibold'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {f.path}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-8 flex flex-col min-w-0">
          <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between gap-2 bg-white">
            <span className="font-mono text-xs font-semibold text-slate-800 truncate">
              {currentFile?.path ?? 'Pilih file'}
            </span>
            {currentFile && (
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-700 shrink-0"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-teal-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Tersalin' : 'Salin Kode'}</span>
              </button>
            )}
          </div>
          <pre className="flex-1 p-4 text-xs font-mono text-slate-800 bg-slate-50/40 overflow-auto max-h-[480px] leading-relaxed">
            {currentFile?.content ?? ''}
          </pre>
        </div>
      </section>
    </div>
  );
};
