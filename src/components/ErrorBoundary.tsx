import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
  parsedInfo: {
    error?: string;
    operationType?: string;
    path?: string | null;
    authInfo?: { email?: string | null };
  } | null;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = {
      hasError: false,
      errorMessage: '',
      parsedInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    let parsedInfo: ErrorBoundaryState['parsedInfo'] = null;
    try {
      const parsed = JSON.parse(error.message);
      if (parsed && typeof parsed === 'object' && 'operationType' in parsed) {
        parsedInfo = parsed;
      }
    } catch {
      // Plain error message
    }
    return {
      hasError: true,
      errorMessage: error.message || 'Terjadi kesalahan tidak terduga pada sistem.',
      parsedInfo,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('ErrorBoundary caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h1 className="font-display text-lg font-bold text-slate-900">
                  Terjadi Kendala Koneksi Database
                </h1>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Sistem mendeteksi gangguan saat memproses data Firestore. Silakan muat ulang
                  halaman atau periksa hak akses akun Google Anda.
                </p>
              </div>
            </div>

            {this.state.parsedInfo ? (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-700 space-y-1">
                <div>
                  <span className="font-semibold">Operasi:</span>{' '}
                  <span className="font-mono">{this.state.parsedInfo.operationType}</span>
                </div>
                {this.state.parsedInfo.path && (
                  <div>
                    <span className="font-semibold">Path:</span>{' '}
                    <span className="font-mono">{this.state.parsedInfo.path}</span>
                  </div>
                )}
                {this.state.parsedInfo.authInfo?.email && (
                  <div>
                    <span className="font-semibold">Akun:</span>{' '}
                    <span className="font-mono">{this.state.parsedInfo.authInfo.email}</span>
                  </div>
                )}
                <div className="text-rose-700 pt-1 break-words">
                  {this.state.parsedInfo.error}
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-rose-700 break-words">
                {this.state.errorMessage}
              </div>
            )}

            <button
              type="button"
              onClick={() => window.location.reload()}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold bg-teal-700 text-white rounded-lg hover:bg-teal-800 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Muat Ulang Aplikasi</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
