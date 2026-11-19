import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Eye, EyeOff, Lock, LogIn, ShieldCheck, User } from 'lucide-react';
import { MADRASAH_INFO } from '../data/pkkmData';
import { apiLogin } from '../utils/pkkmClient';

interface LoginViewProps {
  onLoginSuccess: (token: string, user: { username: string; name: string }) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!username.trim() || !password) {
      setErrorMsg('Username dan password wajib diisi.');
      return;
    }

    setSubmitting(true);
    try {
      const result = await apiLogin(username, password);
      if (!result.ok) {
        setErrorMsg(result.error);
        return;
      }
      onLoginSuccess(result.token, result.user);
    } catch {
      setErrorMsg('Gagal memproses login. Silakan coba lagi.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-between">
      {/* Latar Atas Dekoratif Hijau Tosca & Abu-abu */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-4xl bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm grid grid-cols-1 md:grid-cols-12"
        >
          {/* Panel Kiri: Identitas Madrasah & Logo */}
          <div className="md:col-span-5 bg-gradient-to-b from-teal-900 via-teal-950 to-slate-800 text-slate-100 p-8 flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex items-center gap-3.5">
                <div className="w-16 h-16 rounded-xl bg-white p-1.5 border border-teal-400/30 shrink-0 flex items-center justify-center">
                  <img
                    src="/assets/aistudio/LOGO_MIA_06_23b19dba.png"
                    alt="Logo MIS Almaarif 06 Toyomarto"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <div className="text-[11px] font-semibold text-teal-300 tracking-wider">
                    PORTAL ADMINISTRATOR
                  </div>
                  <div className="font-display text-lg font-bold text-white leading-tight mt-0.5">
                    SIP-PKKM 2026
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-teal-800/60">
                <h1 className="font-display text-xl font-bold text-white leading-snug">
                  {MADRASAH_INFO.namaMadrasah}
                </h1>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Sistem Informasi Pemantauan Ceklist Bukti Fisik &amp; Progres Visitasi Penilaian
                  Kinerja Kepala Madrasah (PKKM) Instrumen Level 4.
                </p>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-slate-700/70 space-y-1.5 text-xs text-slate-300">
              <div className="flex items-center gap-2 text-teal-300 font-medium">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>Akses Terproteksi Administrator</span>
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                NSM {MADRASAH_INFO.nsm} · NPSN {MADRASAH_INFO.npsn}
              </div>
            </div>
          </div>

          {/* Panel Kanan: Form Login */}
          <div className="md:col-span-7 p-8 sm:p-10 flex flex-col justify-center">
            <div className="flex flex-col items-center md:items-start text-center md:text-left mb-7">
              <img
                src="/assets/aistudio/LOGO_MIA_06_23b19dba.png"
                alt="Logo MI Almaarif 06 Toyomarto"
                className="w-16 h-16 object-contain mb-3 md:hidden"
              />
              <h2 className="font-display text-2xl font-bold text-slate-900">
                Masuk ke Sistem
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Silakan masukkan kredensial akun pengelola madrasah untuk melanjutkan.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMsg && (
                <div
                  role="alert"
                  className="px-3.5 py-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs font-medium text-rose-700"
                >
                  {errorMsg}
                </div>
              )}

              <div>
                <label
                  htmlFor="login-username"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  Username
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="login-username"
                    type="text"
                    autoComplete="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Masukkan username"
                    className="w-full pl-9 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="login-password"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan password"
                    className="w-full pl-9 pr-10 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold bg-teal-700 text-white rounded-lg hover:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:ring-offset-1 disabled:opacity-60 transition-colors mt-2"
              >
                <LogIn className="w-4 h-4" />
                <span>{submitting ? 'Memverifikasi...' : 'Masuk Dashboard'}</span>
              </button>
            </form>
          </div>
        </motion.div>
      </div>

      {/* Footnote Sesuai Permintaan */}
      <footer className="py-4 px-6 text-center text-xs text-slate-500">
        <span>{MADRASAH_INFO.namaMadrasah}</span>
        <span className="mx-2 text-slate-300">·</span>
        <span className="font-semibold text-slate-700">
          Developer By Administrator MI Almaarif 06 Toyomarto
        </span>
      </footer>
    </div>
  );
};
