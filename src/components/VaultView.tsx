import React, { useState, useMemo } from 'react';
import { 
  Lock, 
  Unlock, 
  ShieldCheck, 
  Plus, 
  Search, 
  Copy, 
  Check, 
  Eye, 
  EyeOff, 
  Star, 
  ExternalLink, 
  Trash2, 
  Edit3, 
  RefreshCw, 
  Building, 
  Wallet, 
  Globe, 
  CreditCard, 
  Layers, 
  Mail, 
  Key, 
  Sparkles,
  Sliders,
  ShieldAlert
} from 'lucide-react';
import { VaultCredential, VaultCategory } from '../types';

interface VaultViewProps {
  credentials: VaultCredential[];
  onAddCredential: () => void;
  onEditCredential: (item: VaultCredential) => void;
  onDeleteCredential: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

const CATEGORY_TABS: { id: VaultCategory | 'all' | 'favorites'; label: string; icon: any }[] = [
  { id: 'all', label: 'Todos', icon: Key },
  { id: 'favorites', label: 'Favoritos', icon: Star },
  { id: 'banco', label: 'Bancos', icon: Building },
  { id: 'billetera', label: 'Billeteras & Cripto', icon: Wallet },
  { id: 'web', label: 'Sitios Web', icon: Globe },
  { id: 'tarjeta', label: 'Tarjetas & PINs', icon: CreditCard },
  { id: 'servicio', label: 'Servicios', icon: Layers },
  { id: 'email', label: 'Emails', icon: Mail },
];

export const VaultView: React.FC<VaultViewProps> = ({
  credentials,
  onAddCredential,
  onEditCredential,
  onDeleteCredential,
  onToggleFavorite,
  showToast,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<VaultCategory | 'all' | 'favorites'>('all');
  const [isPrivacyLocked, setIsPrivacyLocked] = useState(false);
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});
  const [revealedPins, setRevealedPins] = useState<Record<string, boolean>>({});
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Standalone Generator State
  const [showGenerator, setShowGenerator] = useState(false);
  const [genLength, setGenLength] = useState(16);
  const [genUpper, setGenUpper] = useState(true);
  const [genLower, setGenLower] = useState(true);
  const [genNumbers, setGenNumbers] = useState(true);
  const [genSymbols, setGenSymbols] = useState(true);
  const [generatedPass, setGeneratedPass] = useState('Control#Segura2026!');

  // Generate password function
  const handleGenerate = () => {
    let charset = '';
    if (genLower) charset += 'abcdefghijklmnopqrstuvwxyz';
    if (genUpper) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (genNumbers) charset += '0123456789';
    if (genSymbols) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';

    if (!charset) charset = 'abcdefghijklmnopqrstuvwxyz0123456789';

    let result = '';
    for (let i = 0; i < genLength; i++) {
      result += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    setGeneratedPass(result);
  };

  // Copy to clipboard helper
  const copyToClipboard = (text: string, identifier: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(identifier);
    showToast(`¡${label} copiado al portapapeles!`, 'success');
    setTimeout(() => {
      setCopiedField((curr) => (curr === identifier ? null : curr));
    }, 2500);
  };

  const togglePasswordReveal = (id: string) => {
    setRevealedPasswords((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const togglePinReveal = (id: string) => {
    setRevealedPins((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Filtered credentials
  const filteredCredentials = useMemo(() => {
    return credentials.filter((item) => {
      const matchesSearch =
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.url && item.url.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.securityNotes && item.securityNotes.toLowerCase().includes(searchTerm.toLowerCase()));

      if (!matchesSearch) return false;

      if (selectedCategory === 'favorites') {
        return !!item.favorite;
      }
      if (selectedCategory !== 'all') {
        return item.category === selectedCategory;
      }
      return true;
    });
  }, [credentials, searchTerm, selectedCategory]);

  const stats = useMemo(() => {
    const total = credentials.length;
    const banks = credentials.filter((c) => c.category === 'banco' || c.category === 'billetera').length;
    const favorites = credentials.filter((c) => c.favorite).length;
    const webs = credentials.filter((c) => c.category === 'web' || c.category === 'servicio').length;
    return { total, banks, favorites, webs };
  }, [credentials]);

  const getCategoryIcon = (cat: VaultCategory) => {
    switch (cat) {
      case 'banco':
        return Building;
      case 'billetera':
        return Wallet;
      case 'web':
        return Globe;
      case 'tarjeta':
        return CreditCard;
      case 'servicio':
        return Layers;
      case 'email':
        return Mail;
      default:
        return Key;
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white shadow-lg shadow-teal-900/30">
            <Lock className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-white">Bóveda de Contraseñas</h1>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/30">
                Cifrado Local Seguro
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Administra tus accesos de bancos, billeteras virtuales, webs, PINs y cuentas de dinero
            </p>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Privacy Toggle */}
          <button
            onClick={() => setIsPrivacyLocked(!isPrivacyLocked)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition flex items-center gap-2 shadow-sm ${
              isPrivacyLocked
                ? 'bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white'
            }`}
            title="Oculta o desenfoca los datos para evitar miradas indiscretas"
          >
            {isPrivacyLocked ? (
              <>
                <Lock className="w-4 h-4 text-amber-400" />
                <span>Bóveda Oculta</span>
              </>
            ) : (
              <>
                <Unlock className="w-4 h-4 text-slate-400" />
                <span>Modo Privacidad</span>
              </>
            )}
          </button>

          {/* Quick Generator Toggle */}
          <button
            onClick={() => setShowGenerator(!showGenerator)}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition flex items-center gap-1.5"
          >
            <Sparkles className="w-4 h-4 text-teal-400" />
            <span>Generador</span>
          </button>

          {/* Add Credential Button */}
          <button
            onClick={onAddCredential}
            className="px-4 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-extrabold text-xs rounded-xl transition flex items-center gap-2 shadow-lg shadow-teal-900/30"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Contraseña</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Total Bóveda</span>
            <Key className="w-4 h-4 text-teal-400" />
          </div>
          <p className="text-2xl font-black text-white mt-1">{stats.total}</p>
          <span className="text-[11px] text-slate-500">Credenciales guardadas</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Bancos & Billeteras</span>
            <Wallet className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-2xl font-black text-cyan-300 mt-1">{stats.banks}</p>
          <span className="text-[11px] text-slate-500">Finanzas y pagos</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Favoritos</span>
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
          </div>
          <p className="text-2xl font-black text-amber-300 mt-1">{stats.favorites}</p>
          <span className="text-[11px] text-slate-500">Acceso diario rápido</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Webs & Servicios</span>
            <Globe className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-2xl font-black text-indigo-300 mt-1">{stats.webs}</p>
          <span className="text-[11px] text-slate-500">Suscripciones y portales</span>
        </div>
      </div>

      {/* Standalone Interactive Password Generator Panel */}
      {showGenerator && (
        <div className="bg-slate-900 border border-teal-500/30 rounded-3xl p-5 shadow-2xl animate-scaleUp">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-teal-400" />
              <h3 className="text-sm font-bold text-white">Generador Rápido de Contraseñas Fuertes</h3>
            </div>
            <button
              onClick={() => setShowGenerator(false)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Cerrar
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            {/* Generated Output */}
            <div className="space-y-2">
              <div className="flex items-center justify-between bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3">
                <span className="font-mono text-sm text-teal-300 tracking-wider truncate mr-2 select-all">
                  {generatedPass}
                </span>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={handleGenerate}
                    className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                    title="Generar otra"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => copyToClipboard(generatedPass, 'gen-output', 'Contraseña')}
                    className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-lg transition flex items-center gap-1"
                  >
                    {copiedField === 'gen-output' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedField === 'gen-output' ? '¡Copiada!' : 'Copiar'}</span>
                  </button>
                </div>
              </div>
              <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Alta entropía con caracteres aleatorios seguros</span>
              </div>
            </div>

            {/* Generator Controls */}
            <div className="space-y-3 bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300">Longitud: {genLength} caracteres</span>
                <input
                  type="range"
                  min="8"
                  max="32"
                  value={genLength}
                  onChange={(e) => {
                    setGenLength(Number(e.target.value));
                    setTimeout(handleGenerate, 50);
                  }}
                  className="w-36 accent-teal-500 cursor-pointer"
                />
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs">
                <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={genUpper}
                    onChange={(e) => {
                      setGenUpper(e.target.checked);
                      setTimeout(handleGenerate, 50);
                    }}
                    className="rounded bg-slate-900 border-slate-700 text-teal-600 focus:ring-teal-500 w-3.5 h-3.5"
                  />
                  <span>Mayúsculas (A-Z)</span>
                </label>
                <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={genNumbers}
                    onChange={(e) => {
                      setGenNumbers(e.target.checked);
                      setTimeout(handleGenerate, 50);
                    }}
                    className="rounded bg-slate-900 border-slate-700 text-teal-600 focus:ring-teal-500 w-3.5 h-3.5"
                  />
                  <span>Números (0-9)</span>
                </label>
                <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={genSymbols}
                    onChange={(e) => {
                      setGenSymbols(e.target.checked);
                      setTimeout(handleGenerate, 50);
                    }}
                    className="rounded bg-slate-900 border-slate-700 text-teal-600 focus:ring-teal-500 w-3.5 h-3.5"
                  />
                  <span>Símbolos (!@#$)</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search and Category Filters */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por banco, servicio, usuario, URL o nota..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 transition shadow-inner"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
              >
                Limpiar
              </button>
            )}
          </div>
        </div>

        {/* Categories Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORY_TABS.map((tab) => {
            const Icon = tab.icon;
            const isSelected = selectedCategory === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedCategory(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-teal-600 text-white shadow-md shadow-teal-900/30'
                    : 'bg-slate-900/90 text-slate-400 hover:text-slate-100 hover:bg-slate-800 border border-slate-800'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${tab.id === 'favorites' && isSelected ? 'text-amber-300' : ''}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Privacy Mode Overlay if Locked */}
      {isPrivacyLocked && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <h4 className="text-xs font-bold text-amber-300">Modo Privacidad Activo</h4>
              <p className="text-[11px] text-amber-400/80">
                Las contraseñas y datos confidenciales se encuentran protegidos visualmente.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsPrivacyLocked(false)}
            className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-bold rounded-xl transition border border-amber-500/30"
          >
            Desactivar
          </button>
        </div>
      )}

      {/* Credential Cards Grid */}
      {filteredCredentials.length === 0 ? (
        <div className="bg-slate-900/60 border border-dashed border-slate-800 rounded-3xl p-12 text-center">
          <Lock className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white mb-1">
            {searchTerm ? 'No se encontraron credenciales' : 'Bóveda vacía'}
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mb-5">
            {searchTerm
              ? 'Prueba modificando los términos de búsqueda o cambiando la categoría seleccionada.'
              : 'Empieza a guardar tus contraseñas de bancos, sitios web y billeteras con seguridad.'}
          </p>
          <button
            onClick={onAddCredential}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-xl shadow-lg transition inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Agregar Primer Registro</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCredentials.map((item) => {
            const Icon = getCategoryIcon(item.category);
            const isPassVisible = !isPrivacyLocked && !!revealedPasswords[item.id];
            const isPinVisible = !isPrivacyLocked && !!revealedPins[item.id];

            return (
              <div
                key={item.id}
                className={`bg-slate-900 border rounded-3xl p-5 flex flex-col justify-between transition-all hover:border-slate-700 shadow-xl relative overflow-hidden group ${
                  item.favorite ? 'border-amber-500/30' : 'border-slate-800'
                }`}
              >
                {/* Decorative Top Accent Stripe */}
                <div
                  className="absolute top-0 left-0 right-0 h-1.5"
                  style={{ backgroundColor: item.color || '#06b6d4' }}
                />

                {/* Card Header */}
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3 pt-1">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 shadow-md"
                        style={{ backgroundColor: item.color || '#06b6d4' }}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white leading-tight">
                          {item.title}
                        </h3>
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                          {item.category}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => onToggleFavorite(item.id)}
                      className="text-slate-500 hover:text-amber-400 transition p-1"
                      title={item.favorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}
                    >
                      <Star
                        className={`w-4 h-4 ${
                          item.favorite ? 'text-amber-400 fill-amber-400' : ''
                        }`}
                      />
                    </button>
                  </div>

                  {/* Username / Identifier */}
                  {item.username && (
                    <div className="mb-2.5 bg-slate-950/70 border border-slate-800/80 rounded-xl px-3 py-2 flex items-center justify-between">
                      <div className="truncate mr-2">
                        <span className="text-[10px] text-slate-500 block uppercase font-bold">
                          Usuario / Email
                        </span>
                        <span className="text-xs font-mono text-slate-200 truncate block">
                          {isPrivacyLocked ? '••••••••••••' : item.username}
                        </span>
                      </div>
                      <button
                        onClick={() => copyToClipboard(item.username, `user-${item.id}`, 'Usuario')}
                        disabled={isPrivacyLocked}
                        className="p-1.5 text-slate-400 hover:text-teal-400 rounded-lg hover:bg-slate-800 transition disabled:opacity-30"
                        title="Copiar usuario"
                      >
                        {copiedField === `user-${item.id}` ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  )}

                  {/* Password Field */}
                  <div className="mb-2.5 bg-slate-950/70 border border-slate-800/80 rounded-xl px-3 py-2 flex items-center justify-between">
                    <div className="truncate mr-2">
                      <span className="text-[10px] text-slate-500 block uppercase font-bold">
                        Contraseña
                      </span>
                      <span className="text-xs font-mono text-teal-300 tracking-wider truncate block">
                        {isPrivacyLocked
                          ? '••••••••••••'
                          : isPassVisible
                          ? item.password
                          : '••••••••••••'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => togglePasswordReveal(item.id)}
                        disabled={isPrivacyLocked}
                        className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition disabled:opacity-30"
                        title={isPassVisible ? 'Ocultar' : 'Ver'}
                      >
                        {isPassVisible ? (
                          <EyeOff className="w-3.5 h-3.5" />
                        ) : (
                          <Eye className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <button
                        onClick={() => copyToClipboard(item.password, `pass-${item.id}`, 'Contraseña')}
                        disabled={isPrivacyLocked}
                        className="p-1.5 text-slate-400 hover:text-teal-400 rounded-lg hover:bg-slate-800 transition disabled:opacity-30"
                        title="Copiar contraseña"
                      >
                        {copiedField === `pass-${item.id}` ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Optional PIN Field */}
                  {item.pin && (
                    <div className="mb-2.5 bg-slate-950/70 border border-slate-800/80 rounded-xl px-3 py-2 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-500 block uppercase font-bold">
                          PIN / Clave Cajero
                        </span>
                        <span className="text-xs font-mono text-amber-300 font-bold">
                          {isPrivacyLocked ? '••••' : isPinVisible ? item.pin : '••••'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => togglePinReveal(item.id)}
                          disabled={isPrivacyLocked}
                          className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition disabled:opacity-30"
                        >
                          {isPinVisible ? (
                            <EyeOff className="w-3.5 h-3.5" />
                          ) : (
                            <Eye className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          onClick={() => copyToClipboard(item.pin!, `pin-${item.id}`, 'PIN')}
                          disabled={isPrivacyLocked}
                          className="p-1.5 text-slate-400 hover:text-amber-400 rounded-lg hover:bg-slate-800 transition disabled:opacity-30"
                        >
                          {copiedField === `pin-${item.id}` ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Security Notes preview */}
                  {item.securityNotes && (
                    <div className="mb-3 text-[11px] text-slate-400 bg-slate-950/40 p-2 rounded-xl border border-slate-800/50">
                      <span className="font-semibold text-slate-300">Nota: </span>
                      <span>{item.securityNotes}</span>
                    </div>
                  )}
                </div>

                {/* Card Footer Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 text-xs">
                  {item.url ? (
                    <a
                      href={item.url.startsWith('http') ? item.url : `https://${item.url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-teal-400 hover:text-teal-300 font-semibold flex items-center gap-1 truncate max-w-[140px]"
                      title={item.url}
                    >
                      <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">Abrir sitio</span>
                    </a>
                  ) : (
                    <span className="text-[11px] text-slate-600">Local</span>
                  )}

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onEditCredential(item)}
                      className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                      title="Editar"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteCredential(item.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition"
                      title="Eliminar"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
