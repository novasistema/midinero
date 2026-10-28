import React, { useState } from 'react';
import { 
  Lock, 
  Mail, 
  KeyRound, 
  ArrowRight, 
  ArrowLeft, 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  ShieldCheck,
  Eye,
  EyeOff
} from 'lucide-react';
import { supabase, isSupabaseConfigured, closeOtherSessions } from '../../services/supabase';

interface AuthViewProps {
  initialMode?: 'login' | 'forgot_password' | 'reset_password';
  onAuthSuccess: () => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ 
  initialMode = 'login', 
  onAuthSuccess 
}) => {
  const [mode, setMode] = useState<'login' | 'forgot_password' | 'reset_password'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const configured = isSupabaseConfigured();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!configured) {
      setErrorMsg(
        'Faltan configurar las variables de entorno VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en tu archivo .env o en el panel de despliegue.'
      );
      return;
    }

    if (!email || !password) {
      setErrorMsg('Por favor completa tu correo electrónico y contraseña.');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setErrorMsg('Credenciales incorrectas. Verifica tu email y contraseña.');
        } else if (error.message.includes('Email not confirmed')) {
          setErrorMsg('Tu email aún no ha sido confirmado.');
        } else {
          setErrorMsg(error.message);
        }
        setLoading(false);
        return;
      }

      // Requisito 4: Permitir una sola sesión activa por usuario
      // Al iniciar sesión en un dispositivo nuevo, cerrar las sesiones anteriores en otros dispositivos
      await closeOtherSessions();

      onAuthSuccess();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error de conexión con el servicio de autenticación.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!configured) {
      setErrorMsg('Faltan configurar las variables de entorno de Supabase.');
      return;
    }

    if (!email) {
      setErrorMsg('Por favor escribe el email asociado a tu cuenta.');
      return;
    }

    setLoading(true);
    try {
      const redirectTo = window.location.origin;
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo,
      });

      if (error) {
        setErrorMsg(error.message);
      } else {
        setSuccessMsg(
          'Te hemos enviado un enlace a tu correo para restablecer tu contraseña. Revisa tu bandeja de entrada o spam.'
        );
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'No se pudo enviar el correo de recuperación.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!password) {
      setErrorMsg('Por favor ingresa tu nueva contraseña.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        setErrorMsg(error.message);
      } else {
        setSuccessMsg('¡Contraseña actualizada con éxito! Ingresando a la aplicación...');
        await closeOtherSessions();
        setTimeout(() => {
          onAuthSuccess();
        }, 1500);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error al actualizar la contraseña.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 selection:bg-[#E3A82B] selection:text-black"
      style={{ backgroundColor: '#0D1117' }}
    >
      <div className="w-full max-w-md">
        {/* Brand Card Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#161B22] border border-[#30363D] mb-4 shadow-xl">
            <ShieldCheck className="w-7 h-7 text-[#E3A82B]" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-wider uppercase">
            Vértice Lab
          </h1>
          <p className="text-sm font-semibold text-[#E3A82B] tracking-widest uppercase mt-1">
            Mi Dinero
          </p>
          <p className="text-xs text-slate-400 mt-2">
            Sistema privado de gestión de finanzas personales
          </p>
        </div>

        {/* Main Form Box */}
        <div className="bg-[#161B22] border border-[#30363D] rounded-2xl p-7 shadow-2xl relative overflow-hidden">
          {/* Subtle Accent Glow */}
          <div 
            className="absolute -top-24 -right-24 w-48 h-48 rounded-full blur-3xl pointer-events-none opacity-15"
            style={{ backgroundColor: '#E3A82B' }}
          />

          {!configured && (
            <div className="mb-6 p-4 rounded-xl bg-amber-950/40 border border-amber-600/40 text-amber-200 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-amber-400">
                <AlertCircle className="w-4 h-4 shrink-0" />
                Configuración de Supabase requerida
              </div>
              <p className="text-[11px] leading-relaxed">
                Para autenticar clientes, define las variables <code className="bg-black/50 px-1 py-0.5 rounded text-amber-300">VITE_SUPABASE_URL</code> y <code className="bg-black/50 px-1 py-0.5 rounded text-amber-300">VITE_SUPABASE_ANON_KEY</code>.
              </p>
            </div>
          )}

          {errorMsg && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs flex items-start gap-2.5 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-5 p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-xs flex items-start gap-2.5 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{successMsg}</span>
            </div>
          )}

          {/* MODE 1: LOGIN */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="tu@email.com"
                    autoComplete="email"
                    className="w-full bg-[#0D1117] border border-[#30363D] text-slate-100 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-[#E3A82B] transition placeholder:text-slate-600"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    Contraseña
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMsg(null);
                      setSuccessMsg(null);
                      setMode('forgot_password');
                    }}
                    className="text-xs text-[#E3A82B] hover:underline font-medium transition"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className="w-full bg-[#0D1117] border border-[#30363D] text-slate-100 rounded-xl pl-10 pr-10 py-2.5 text-sm focus:outline-none focus:border-[#E3A82B] transition placeholder:text-slate-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 px-4 rounded-xl font-bold text-sm text-[#0D1117] transition flex items-center justify-center gap-2 shadow-lg hover:brightness-110 disabled:opacity-50 cursor-pointer"
                style={{ backgroundColor: '#E3A82B' }}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Iniciando Sesión...
                  </>
                ) : (
                  <>
                    Iniciar Sesión
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="pt-3 text-center">
                <p className="text-[11px] text-slate-500">
                  Acceso exclusivo para usuarios autorizados. Los accesos se otorgan al adquirir la licencia.
                </p>
              </div>
            </form>
          )}

          {/* MODE 2: FORGOT PASSWORD */}
          {mode === 'forgot_password' && (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="text-left mb-2">
                <h3 className="text-sm font-bold text-white">Recuperar Contraseña</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Ingresa tu correo para recibir un enlace de restablecimiento seguro.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="tu@email.com"
                    className="w-full bg-[#0D1117] border border-[#30363D] text-slate-100 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-[#E3A82B] transition placeholder:text-slate-600"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl font-bold text-sm text-[#0D1117] transition flex items-center justify-center gap-2 shadow-lg hover:brightness-110 disabled:opacity-50 cursor-pointer"
                style={{ backgroundColor: '#E3A82B' }}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Enviando Enlace...
                  </>
                ) : (
                  <>
                    Enviar Enlace de Recuperación
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg(null);
                    setSuccessMsg(null);
                    setMode('login');
                  }}
                  className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Volver al inicio de sesión
                </button>
              </div>
            </form>
          )}

          {/* MODE 3: RESET PASSWORD (FROM EMAIL RECOVERY LINK) */}
          {mode === 'reset_password' && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="text-left mb-2">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-[#E3A82B]" />
                  Establecer Nueva Contraseña
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Escribe tu nueva clave para acceder a Mi Dinero.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Nueva Contraseña
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Mínimo 6 caracteres"
                    className="w-full bg-[#0D1117] border border-[#30363D] text-slate-100 rounded-xl pl-10 pr-10 py-2.5 text-sm focus:outline-none focus:border-[#E3A82B] transition placeholder:text-slate-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Confirmar Nueva Contraseña
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="Repite la nueva contraseña"
                    className="w-full bg-[#0D1117] border border-[#30363D] text-slate-100 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-[#E3A82B] transition placeholder:text-slate-600"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl font-bold text-sm text-[#0D1117] transition flex items-center justify-center gap-2 shadow-lg hover:brightness-110 disabled:opacity-50 cursor-pointer"
                style={{ backgroundColor: '#E3A82B' }}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Guardando Contraseña...
                  </>
                ) : (
                  <>
                    Actualizar Contraseña e Ingresar
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Footer Brand */}
        <div className="text-center mt-6 text-xs text-slate-600">
          © {new Date().getFullYear()} Vértice Lab • Todos los derechos reservados
        </div>
      </div>
    </div>
  );
};
