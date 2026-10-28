import React from 'react';
import { ShieldAlert, ExternalLink, LogOut, RefreshCw } from 'lucide-react';
import { supabase } from '../../services/supabase';

interface AccessDeniedViewProps {
  userEmail?: string;
  reason?: 'no_record' | 'expired' | 'inactive' | 'error' | 'not_configured';
  message?: string;
  onRetry: () => void;
  onLogout: () => void;
}

export const AccessDeniedView: React.FC<AccessDeniedViewProps> = ({
  userEmail,
  reason = 'no_record',
  message,
  onRetry,
  onLogout,
}) => {
  const getExplanation = () => {
    switch (reason) {
      case 'expired':
        return 'Tu periodo de suscripción o licencia para Mi Dinero ha finalizado. Para reactivar tu acceso y continuar gestionando tus finanzas, renueva tu membresía.';
      case 'inactive':
        return 'Tu cuenta ha sido pausada o desactivada. Por favor ponte en contacto con Vértice Lab para verificar el estado de tu licencia.';
      case 'not_configured':
        return message || 'Falta vincular la base de datos de Supabase.';
      case 'no_record':
      default:
        return 'No encontramos una licencia activa asignada a este usuario para el software Mi Dinero. Adquiere tu acceso para comenzar.';
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 selection:bg-[#E3A82B] selection:text-black"
      style={{ backgroundColor: '#0D1117' }}
    >
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-950/40 border border-[#E3A82B]/30 mb-4 shadow-xl">
            <ShieldAlert className="w-8 h-8 text-[#E3A82B]" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-wider uppercase">
            Vértice Lab
          </h1>
          <p className="text-sm font-semibold text-[#E3A82B] tracking-widest uppercase mt-1">
            Mi Dinero
          </p>
        </div>

        {/* Card */}
        <div className="bg-[#161B22] border border-[#30363D] rounded-2xl p-7 shadow-2xl relative overflow-hidden text-center space-y-5">
          <div 
            className="absolute -top-24 -right-24 w-48 h-48 rounded-full blur-3xl pointer-events-none opacity-15"
            style={{ backgroundColor: '#E3A82B' }}
          />

          <div className="space-y-2">
            <h2 className="text-xl font-black text-white">
              Tu acceso no está activo
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              {getExplanation()}
            </p>
          </div>

          {userEmail && (
            <div className="py-2.5 px-3 bg-[#0D1117] rounded-xl border border-[#30363D] text-xs text-slate-300 font-mono">
              Usuario: <span className="text-slate-100 font-semibold">{userEmail}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3 pt-2">
            <a
              href="https://verticelab.com.ar"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 px-4 rounded-xl font-bold text-sm text-[#0D1117] transition flex items-center justify-center gap-2 shadow-lg hover:brightness-110 cursor-pointer"
              style={{ backgroundColor: '#E3A82B' }}
            >
              Obtener acceso
              <ExternalLink className="w-4 h-4" />
            </a>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={onRetry}
                className="py-2.5 px-3 bg-[#0D1117] hover:bg-slate-800 border border-[#30363D] text-slate-200 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5 text-[#E3A82B]" />
                Reintentar
              </button>

              <button
                type="button"
                onClick={onLogout}
                className="py-2.5 px-3 bg-rose-950/30 hover:bg-rose-950/60 border border-rose-500/30 text-rose-300 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-xs text-slate-600">
          © {new Date().getFullYear()} Vértice Lab • Soporte en verticelab.com.ar
        </div>
      </div>
    </div>
  );
};
