import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { 
  PiggyBank, 
  TrendingUp, 
  Plus, 
  ShieldCheck, 
  Palmtree, 
  Target, 
  DollarSign, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  X,
  Sparkles,
  ArrowUpRight
} from 'lucide-react';
import { SavingsGoal, UserSettings } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';

interface SavingsViewProps {
  goals: SavingsGoal[];
  settings: UserSettings;
  onAddGoal: (goal: Omit<SavingsGoal, 'id'>) => void;
  onUpdateGoal: (goal: SavingsGoal) => void;
  onDeleteGoal: (id: string) => void;
}

export const SavingsView: React.FC<SavingsViewProps> = ({
  goals,
  settings,
  onAddGoal,
  onUpdateGoal,
  onDeleteGoal,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [depositModalGoal, setDepositModalGoal] = useState<SavingsGoal | null>(null);
  const [depositAmount, setDepositAmount] = useState<string>('');

  // Form State
  const [title, setTitle] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [category, setCategory] = useState<SavingsGoal['category']>('inversion');
  const [notes, setNotes] = useState('');

  const triggerConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedTarget = parseFloat(targetAmount);
    const parsedCurrent = parseFloat(currentAmount) || 0;

    if (isNaN(parsedTarget) || parsedTarget <= 0) return;

    onAddGoal({
      title: title.trim(),
      targetAmount: parsedTarget,
      currentAmount: parsedCurrent,
      targetDate: targetDate || '2026-12-31',
      category,
      color: category === 'inversion' ? '#06b6d4' : category === 'emergencia' ? '#14b8a6' : '#f59e0b',
      icon: category === 'inversion' ? 'TrendingUp' : category === 'emergencia' ? 'ShieldCheck' : 'Target',
      notes: notes.trim() || undefined,
    });

    if (parsedCurrent >= parsedTarget) {
      triggerConfetti();
    }

    setIsModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setTitle('');
    setTargetAmount('');
    setCurrentAmount('');
    setTargetDate('');
    setCategory('inversion');
    setNotes('');
  };

  const handleDepositSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!depositModalGoal) return;

    const val = parseFloat(depositAmount);
    if (isNaN(val) || val === 0) return;

    const newAmount = Math.max(0, depositModalGoal.currentAmount + val);
    const updatedGoal = { ...depositModalGoal, currentAmount: newAmount };

    onUpdateGoal(updatedGoal);

    if (newAmount >= depositModalGoal.targetAmount && depositModalGoal.currentAmount < depositModalGoal.targetAmount) {
      triggerConfetti();
    }

    setDepositModalGoal(null);
    setDepositAmount('');
  };

  const totalSavedAllGoals = goals.reduce((acc, g) => acc + g.currentAmount, 0);
  const totalTargetAllGoals = goals.reduce((acc, g) => acc + g.targetAmount, 0);

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-900 p-4 rounded-2xl border border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-100 flex items-center gap-2">
            Módulo de Ahorros e Inversión
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Establece metas de ahorro, fondos de emergencia y carteras de inversión
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="py-2.5 px-4 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 text-white font-bold rounded-xl text-xs sm:text-sm transition flex items-center gap-1.5 shadow-lg shadow-teal-900/20 w-fit"
        >
          <Plus className="w-4 h-4" />
          Nueva Meta de Ahorro
        </button>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400">Total Acumulado en Metas</span>
            <div className="text-2xl font-black text-teal-300 mt-0.5">
              {formatCurrency(totalSavedAllGoals, settings.currency)}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {totalTargetAllGoals > 0
                ? `${((totalSavedAllGoals / totalTargetAllGoals) * 100).toFixed(0)}% del objetivo global`
                : 'Sin metas creadas'}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-teal-500/10 text-teal-400">
            <PiggyBank className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400">Objetivo Total de Capital</span>
            <div className="text-2xl font-black text-slate-100 mt-0.5">
              {formatCurrency(totalTargetAllGoals, settings.currency)}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">{goals.length} Meta(s) en seguimiento</p>
          </div>
          <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400">
            <Target className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Goals Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {goals.map((goal) => {
          const pct = Math.min(100, (goal.currentAmount / goal.targetAmount) * 100);
          const isCompleted = goal.currentAmount >= goal.targetAmount;

          return (
            <div
              key={goal.id}
              className={`bg-slate-900 border p-5 rounded-2xl space-y-4 relative flex flex-col justify-between transition ${
                isCompleted
                  ? 'border-emerald-500/40 bg-emerald-950/20 shadow-lg shadow-emerald-950/30'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shadow"
                      style={{ backgroundColor: goal.color }}
                    >
                      {goal.category === 'inversion' ? (
                        <TrendingUp className="w-5 h-5" />
                      ) : goal.category === 'emergencia' ? (
                        <ShieldCheck className="w-5 h-5" />
                      ) : (
                        <Palmtree className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-100 line-clamp-1">{goal.title}</h3>
                      <span className="text-[10px] uppercase font-bold text-teal-400">
                        {goal.category}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => onDeleteGoal(goal.id)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
                    title="Eliminar meta"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Progress Bar */}
                <div className="mt-4 space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Progreso:</span>
                    <span className="font-extrabold text-teal-300">{pct.toFixed(0)}%</span>
                  </div>

                  <div className="w-full bg-slate-950 rounded-full h-3 overflow-hidden border border-slate-800">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isCompleted ? 'bg-emerald-400' : 'bg-teal-500'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  <div className="flex justify-between items-center text-xs font-semibold pt-1">
                    <span className="text-slate-100 font-bold">
                      {formatCurrency(goal.currentAmount, settings.currency)}
                    </span>
                    <span className="text-slate-400">
                      de {formatCurrency(goal.targetAmount, settings.currency)}
                    </span>
                  </div>
                </div>

                {goal.notes && (
                  <p className="text-xs text-slate-400 italic mt-3 bg-slate-950/60 p-2 rounded-lg border border-slate-800/60">
                    "{goal.notes}"
                  </p>
                )}
              </div>

              {/* Action */}
              <div className="pt-2">
                <button
                  onClick={() => setDepositModalGoal(goal)}
                  className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 border border-slate-700"
                >
                  <ArrowUpRight className="w-4 h-4 text-teal-400" />
                  Añadir / Retirar Aportación
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: New Goal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950">
              <h3 className="font-bold text-slate-100">Nueva Meta de Ahorro / Inversión</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateGoal} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Nombre de la Meta</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej: Fondo de Emergencia, Inversión ETF, Coche..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-slate-100 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Monto Objetivo ($)</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    placeholder="3000"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-slate-100 focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Monto Inicial ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={currentAmount}
                    onChange={(e) => setCurrentAmount(e.target.value)}
                    placeholder="0"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-slate-100 focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Categoría de Meta</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as SavingsGoal['category'])}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-slate-100 focus:outline-none focus:border-teal-500"
                >
                  <option value="inversion">Inversión & Rendimientos</option>
                  <option value="emergencia">Fondo de Emergencia</option>
                  <option value="vacaciones">Vacaciones / Viajes</option>
                  <option value="meta_personal">Meta Personal / Compra</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Notas Opcionales</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Estrategia o meta mensual..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-slate-100 focus:outline-none focus:border-teal-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl text-sm transition"
              >
                Crear Meta
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Deposit / Withdraw Contribution */}
      {depositModalGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950">
              <h3 className="font-bold text-slate-100">Aportación a {depositModalGoal.title}</h3>
              <button
                onClick={() => setDepositModalGoal(null)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleDepositSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Monto de Aportación ($)
                </label>
                <p className="text-[11px] text-slate-500 mb-2">
                  Usa número positivo para sumar capital o negativo para retirar.
                </p>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder="Ej: 150.00"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-lg font-bold text-slate-100 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setDepositModalGoal(null)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl text-xs"
                >
                  Confirmar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
