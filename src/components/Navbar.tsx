import React from 'react';
import { 
  Home, 
  Receipt, 
  PieChart, 
  BarChart2, 
  PiggyBank, 
  Settings, 
  Plus, 
  Sparkles 
} from 'lucide-react';
import { MiDineroLogo } from './MiDineroLogo';

interface NavbarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onOpenAddModal: () => void;
  onOpenAiModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  onOpenAddModal,
  onOpenAiModal,
}) => {
  const tabs = [
    { id: 'inicio', label: 'Inicio', icon: Home },
    { id: 'transacciones', label: 'Registros', icon: Receipt },
    { id: 'informes', label: 'Informes', icon: PieChart },
    { id: 'presupuestos', label: 'Límites', icon: BarChart2 },
    { id: 'ahorros', label: 'Ahorros', icon: PiggyBank },
    { id: 'ajustes', label: 'Ajustes', icon: Settings },
  ];

  return (
    <>
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <div className="cursor-pointer" onClick={() => onTabChange('inicio')}>
            <MiDineroLogo size="md" />
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1.5 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                    isActive
                      ? 'bg-teal-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>

          {/* Top Quick Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenAiModal}
              className="hidden sm:flex items-center gap-1.5 py-2 px-3 bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 font-bold text-xs rounded-xl border border-teal-500/30 transition"
              title="Registro rápido con Inteligencia Artificial"
            >
              <Sparkles className="w-3.5 h-3.5" />
              IA Ticket
            </button>

            <button
              onClick={onOpenAddModal}
              className="py-2 px-3.5 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 text-white font-extrabold text-xs rounded-xl transition flex items-center gap-1.5 shadow-lg shadow-teal-900/20"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Añadir Registro</span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Floating Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-lg border-t border-slate-800 px-2 py-1.5">
        <div className="flex items-center justify-around max-w-md mx-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition ${
                  isActive ? 'text-teal-400 font-extrabold' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'scale-110' : ''}`} />
                <span className="text-[10px] tracking-tight">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
