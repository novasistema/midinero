import React, { useState, useEffect } from 'react';
import { 
  X, 
  Lock, 
  Eye, 
  EyeOff, 
  RefreshCw, 
  Key, 
  Globe, 
  User, 
  ShieldCheck, 
  FileText, 
  Star,
  Building,
  Wallet,
  CreditCard,
  Layers,
  Mail
} from 'lucide-react';
import { VaultCredential, VaultCategory } from '../types';

interface VaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (credential: Omit<VaultCredential, 'id' | 'createdAt' | 'updatedAt'> | VaultCredential) => void;
  initialData?: VaultCredential | null;
}

const CATEGORIES: { id: VaultCategory; name: string; icon: any; color: string }[] = [
  { id: 'banco', name: 'Banco / Home Banking', icon: Building, color: '#ec4899' },
  { id: 'billetera', name: 'Billetera Virtual / Cripto', icon: Wallet, color: '#06b6d4' },
  { id: 'web', name: 'Sitio Web / Redes', icon: Globe, color: '#3b82f6' },
  { id: 'tarjeta', name: 'Tarjeta / PIN Cajero', icon: CreditCard, color: '#10b981' },
  { id: 'servicio', name: 'Servicio / Fiscal', icon: Layers, color: '#f59e0b' },
  { id: 'email', name: 'Correo Electrónico', icon: Mail, color: '#8b5cf6' },
  { id: 'otro', name: 'Otro', icon: Key, color: '#64748b' },
];

const PRESET_COLORS = [
  '#ec4899', '#06b6d4', '#10b981', '#3b82f6', 
  '#8b5cf6', '#f59e0b', '#ef4444', '#64748b'
];

export const VaultModal: React.FC<VaultModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<VaultCategory>('banco');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [url, setUrl] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [securityNotes, setSecurityNotes] = useState('');
  const [color, setColor] = useState('#06b6d4');
  const [favorite, setFavorite] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setCategory(initialData.category);
      setUsername(initialData.username);
      setPassword(initialData.password);
      setUrl(initialData.url || '');
      setPin(initialData.pin || '');
      setSecurityNotes(initialData.securityNotes || '');
      setColor(initialData.color || '#06b6d4');
      setFavorite(!!initialData.favorite);
    } else {
      setTitle('');
      setCategory('banco');
      setUsername('');
      setPassword('');
      setUrl('');
      setPin('');
      setSecurityNotes('');
      setColor('#06b6d4');
      setFavorite(false);
    }
    setShowPassword(false);
    setShowPin(false);
    setError('');
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  // Password Generator
  const generateRandomPassword = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+~`|}{[]:;?><,./-=';
    let result = '';
    const length = 16;
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(result);
    setShowPassword(true);
  };

  // Password strength calculation
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, text: 'Vacía', color: 'bg-slate-700' };
    let score = 0;
    if (pass.length >= 8) score += 1;
    if (pass.length >= 12) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score <= 2) return { score: 1, text: 'Débil', color: 'bg-rose-500' };
    if (score === 3 || score === 4) return { score: 2, text: 'Segura', color: 'bg-amber-500' };
    return { score: 3, text: 'Muy Robusta', color: 'bg-emerald-500' };
  };

  const strength = getPasswordStrength(password);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Por favor escribe un nombre o servicio para esta credencial.');
      return;
    }
    if (!password.trim() && !pin.trim()) {
      setError('Debes registrar al menos una contraseña o PIN de seguridad.');
      return;
    }

    const payload = {
      title: title.trim(),
      category,
      username: username.trim(),
      password: password.trim(),
      url: url.trim() || undefined,
      pin: pin.trim() || undefined,
      securityNotes: securityNotes.trim() || undefined,
      color,
      favorite,
      ...(initialData ? { id: initialData.id, createdAt: initialData.createdAt, updatedAt: new Date().toISOString() } : {}),
    };

    onSave(payload as any);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-scaleUp">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-lg"
              style={{ backgroundColor: color }}
            >
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {initialData ? 'Editar Contraseña' : 'Nueva Credencial en Bóveda'}
              </h2>
              <p className="text-xs text-slate-400">
                Almacena de forma privada bancos, sitios, PINs y billeteras
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-4 flex-1">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium">
              {error}
            </div>
          )}

          {/* Title and Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Nombre / Servicio *
              </label>
              <input
                type="text"
                required
                placeholder="Ej. Banco Santander, Netflix, AFIP"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Categoría
              </label>
              <select
                value={category}
                onChange={(e) => {
                  const selected = e.target.value as VaultCategory;
                  setCategory(selected);
                  const found = CATEGORIES.find(c => c.id === selected);
                  if (found) setColor(found.color);
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-teal-500 transition cursor-pointer"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Username / Email */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-400" />
              Usuario, Identificador o Email
            </label>
            <input
              type="text"
              placeholder="Ej. juan.perez@gmail.com o usuario_banco"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 transition"
            />
          </div>

          {/* Password with Strength & Generator */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-slate-400" />
                Contraseña
              </label>
              <button
                type="button"
                onClick={generateRandomPassword}
                className="text-xs text-teal-400 hover:text-teal-300 flex items-center gap-1 font-semibold transition"
              >
                <RefreshCw className="w-3 h-3" />
                Generar Segura
              </button>
            </div>

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Contraseña de acceso"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-3.5 pr-10 py-2.5 text-sm text-white font-mono placeholder-slate-500 focus:outline-none focus:border-teal-500 transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition"
                title={showPassword ? 'Ocultar' : 'Mostrar'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {password && (
              <div className="mt-2 flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden flex gap-1">
                  <div className={`h-full flex-1 rounded-full ${strength.score >= 1 ? strength.color : 'bg-transparent'}`} />
                  <div className={`h-full flex-1 rounded-full ${strength.score >= 2 ? strength.color : 'bg-transparent'}`} />
                  <div className={`h-full flex-1 rounded-full ${strength.score >= 3 ? strength.color : 'bg-transparent'}`} />
                </div>
                <span className="text-[11px] font-medium text-slate-400">
                  {strength.text}
                </span>
              </div>
            )}
          </div>

          {/* PIN and URL */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                PIN / Token Numérico (Opcional)
              </label>
              <div className="relative">
                <input
                  type={showPin ? 'text' : 'password'}
                  placeholder="Ej. 4921 o clave cajero"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-3.5 pr-10 py-2.5 text-sm text-white font-mono placeholder-slate-500 focus:outline-none focus:border-teal-500 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition"
                >
                  {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-slate-400" />
                Sitio Web / URL
              </label>
              <input
                type="text"
                placeholder="https://..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 transition"
              />
            </div>
          </div>

          {/* Security Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              Notas de Seguridad y Respaldos
            </label>
            <textarea
              rows={2}
              placeholder="Preguntas de seguridad, tokens, alias CBU, instrucciones para recuperar la cuenta..."
              value={securityNotes}
              onChange={(e) => setSecurityNotes(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 transition resize-none"
            />
          </div>

          {/* Color & Favorite */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Color Distintivo
              </label>
              <div className="flex items-center gap-2">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-6 h-6 rounded-full transition transform ${
                      color === c ? 'scale-125 ring-2 ring-white' : 'hover:scale-110 opacity-70'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer mt-2 sm:mt-0 select-none">
              <input
                type="checkbox"
                checked={favorite}
                onChange={(e) => setFavorite(e.target.checked)}
                className="rounded border-slate-700 bg-slate-950 text-teal-600 focus:ring-teal-500 w-4 h-4 cursor-pointer"
              />
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                <Star className={`w-3.5 h-3.5 ${favorite ? 'text-amber-400 fill-amber-400' : 'text-slate-400'}`} />
                Marcar como Favorito
              </span>
            </label>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-slate-400 hover:text-white hover:bg-slate-800 text-sm font-semibold rounded-xl transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 text-white text-sm font-bold rounded-xl shadow-lg shadow-teal-900/30 transition flex items-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              {initialData ? 'Guardar Cambios' : 'Guardar en Bóveda'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
