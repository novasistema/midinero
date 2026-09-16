import React from 'react';
import { 
  Settings as SettingsIcon, 
  DollarSign, 
  Moon, 
  Sun, 
  Bell, 
  RefreshCw, 
  Download, 
  Upload, 
  RotateCcw,
  Check
} from 'lucide-react';
import { UserSettings } from '../types';

interface SettingsViewProps {
  settings: UserSettings;
  onUpdateSettings: (newSettings: UserSettings) => void;
  onExportData: () => void;
  onImportData: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onResetData: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  onExportData,
  onImportData,
  onResetData,
}) => {
  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* Header */}
      <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800">
        <h1 className="text-xl sm:text-2xl font-black text-slate-100 flex items-center gap-2">
          <SettingsIcon className="w-6 h-6 text-teal-400" /> Configuración de la Aplicación
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Personaliza moneda, alertas de presupuesto, tema y copias de seguridad
        </p>
      </div>

      {/* Preferences Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-5">
        <h2 className="font-bold text-sm text-slate-200 uppercase tracking-wider text-xs">
          Preferencia de Divisa & Apariencia
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Currency */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Moneda Principal</label>
            <select
              value={settings.currency}
              onChange={(e) =>
                onUpdateSettings({
                  ...settings,
                  currency: e.target.value,
                  currencySymbol: e.target.value === 'EUR' ? '€' : e.target.value === 'PEN' ? 'S/.' : '$',
                })
              }
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-100 focus:outline-none focus:border-teal-500"
            >
              <option value="ARS">Peso Argentino ($ ARS)</option>
              <option value="USD">Dólar ($ USD)</option>
              <option value="MXN">Peso Mexicano ($ MXN)</option>
              <option value="COP">Peso Colombiano ($ COP)</option>
              <option value="CLP">Peso Chileno ($ CLP)</option>
              <option value="EUR">Euro (€ EUR)</option>
              <option value="PEN">Sol Peruano (S/. PEN)</option>
            </select>
          </div>

          {/* Theme */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Modo de Color</label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800">
              <button
                onClick={() => onUpdateSettings({ ...settings, theme: 'dark' })}
                className={`py-2 px-3 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition ${
                  settings.theme === 'dark'
                    ? 'bg-teal-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Moon className="w-4 h-4" /> Modo Oscuro
              </button>
              <button
                onClick={() => onUpdateSettings({ ...settings, theme: 'light' })}
                className={`py-2 px-3 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition ${
                  settings.theme === 'light'
                    ? 'bg-teal-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sun className="w-4 h-4" /> Modo Claro
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Budget Alerts Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <h2 className="font-bold text-sm text-slate-200 uppercase tracking-wider text-xs flex items-center gap-2">
          <Bell className="w-4 h-4 text-teal-400" /> Alertas de Presupuesto Excedido
        </h2>

        <div className="flex items-center justify-between py-2 border-b border-slate-800">
          <div>
            <p className="text-sm font-semibold text-slate-200">Activar Alertas de Límite</p>
            <p className="text-xs text-slate-400">Notificar en pantalla al acercarse o superar presupuestos</p>
          </div>
          <input
            type="checkbox"
            checked={settings.enableAlerts}
            onChange={(e) => onUpdateSettings({ ...settings, enableAlerts: e.target.checked })}
            className="w-5 h-5 accent-teal-500 rounded cursor-pointer"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">
            Umbral de Alerta Temprana (% del Presupuesto)
          </label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="50"
              max="100"
              value={settings.budgetAlertThreshold}
              onChange={(e) =>
                onUpdateSettings({ ...settings, budgetAlertThreshold: parseInt(e.target.value, 10) })
              }
              className="flex-1 accent-teal-500"
            />
            <span className="text-sm font-bold text-teal-400 w-12 text-right">
              {settings.budgetAlertThreshold}%
            </span>
          </div>
        </div>
      </div>

      {/* Backup & Data Sync Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <h2 className="font-bold text-sm text-slate-200 uppercase tracking-wider text-xs flex items-center gap-2">
          <RefreshCw className="w-4 h-4 text-teal-400" /> Copia de Seguridad & Datos
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <button
            id="btn-export-json"
            onClick={onExportData}
            className="p-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4 text-teal-400" />
            Descargar Copia JSON
          </button>

          <label
            id="btn-import-json"
            className="p-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Upload className="w-4 h-4 text-teal-400" />
            Restaurar Copia JSON
            <input type="file" accept=".json" onChange={onImportData} className="hidden" />
          </label>

          <button
            id="btn-reset-factory-data"
            onClick={onResetData}
            className="p-3 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/30 text-rose-300 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Restablecer de Fábrica
          </button>
        </div>
      </div>
    </div>
  );
};
