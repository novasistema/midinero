import React, { useState, useEffect } from 'react';
import { 
  INITIAL_TRANSACTIONS, 
  INITIAL_BUDGETS, 
  INITIAL_SAVINGS_GOALS, 
  INITIAL_SETTINGS 
} from './data/initialData';
import { 
  Transaction, 
  CategoryBudget, 
  SavingsGoal, 
  UserSettings, 
  CategoryId 
} from './types';
import { syncManager } from './utils/sync';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { TransactionsView } from './components/TransactionsView';
import { ReportsView } from './components/ReportsView';
import { BudgetsView } from './components/BudgetsView';
import { SavingsView } from './components/SavingsView';
import { SettingsView } from './components/SettingsView';
import { TransactionModal } from './components/TransactionModal';
import { QuickAiInputModal } from './components/QuickAiInputModal';
import { ConfirmModal } from './components/ConfirmModal';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function App() {
  // Persistence state
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const saved = localStorage.getItem('midinero_transactions');
      return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
    } catch {
      return INITIAL_TRANSACTIONS;
    }
  });

  const [budgets, setBudgets] = useState<CategoryBudget[]>(() => {
    try {
      const saved = localStorage.getItem('midinero_budgets');
      return saved ? JSON.parse(saved) : INITIAL_BUDGETS;
    } catch {
      return INITIAL_BUDGETS;
    }
  });

  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>(() => {
    try {
      const saved = localStorage.getItem('midinero_savings_goals');
      return saved ? JSON.parse(saved) : INITIAL_SAVINGS_GOALS;
    } catch {
      return INITIAL_SAVINGS_GOALS;
    }
  });

  const [settings, setSettings] = useState<UserSettings>(() => {
    try {
      const saved = localStorage.getItem('midinero_settings');
      return saved ? JSON.parse(saved) : INITIAL_SETTINGS;
    } catch {
      return INITIAL_SETTINGS;
    }
  });

  // Active view tab
  const [activeTab, setActiveTab] = useState<string>('inicio');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

  // Custom confirmation dialog state (replaces blocked window.confirm in iframe)
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    isDestructive?: boolean;
    iconType?: 'reset' | 'delete' | 'warning';
    onConfirm: () => void;
  } | null>(null);

  // In-app toast feedback state (replaces blocked window.alert in iframe)
  const [toast, setToast] = useState<{
    id: number;
    message: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now();
    setToast({ id, message, type });
    setTimeout(() => {
      setToast((curr) => (curr?.id === id ? null : curr));
    }, 4000);
  };

  // Sync to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem('midinero_transactions', JSON.stringify(transactions));
      syncManager.notifyUpdate('DATA_UPDATED');
    } catch (err) {
      console.error('Failed to save transactions:', err);
    }
  }, [transactions]);

  useEffect(() => {
    try {
      localStorage.setItem('midinero_budgets', JSON.stringify(budgets));
      syncManager.notifyUpdate('DATA_UPDATED');
    } catch (err) {
      console.error('Failed to save budgets:', err);
    }
  }, [budgets]);

  useEffect(() => {
    try {
      localStorage.setItem('midinero_savings_goals', JSON.stringify(savingsGoals));
      syncManager.notifyUpdate('DATA_UPDATED');
    } catch (err) {
      console.error('Failed to save savings goals:', err);
    }
  }, [savingsGoals]);

  useEffect(() => {
    try {
      localStorage.setItem('midinero_settings', JSON.stringify(settings));
    } catch (err) {
      console.error('Failed to save settings:', err);
    }
  }, [settings]);

  // Listen to cross-tab real-time sync
  useEffect(() => {
    const unsubscribe = syncManager.subscribe(() => {
      try {
        const savedTxs = localStorage.getItem('midinero_transactions');
        if (savedTxs) setTransactions(JSON.parse(savedTxs));

        const savedBudgets = localStorage.getItem('midinero_budgets');
        if (savedBudgets) setBudgets(JSON.parse(savedBudgets));

        const savedGoals = localStorage.getItem('midinero_savings_goals');
        if (savedGoals) setSavingsGoals(JSON.parse(savedGoals));
      } catch (err) {
        console.warn('Realtime sync reload error:', err);
      }
    });

    return () => unsubscribe();
  }, []);

  // Handlers for Transactions
  const handleSaveTransaction = (txData: Omit<Transaction, 'id'> | Transaction) => {
    if ('id' in txData && txData.id) {
      // Edit existing
      setTransactions((prev) =>
        prev.map((t) => (t.id === txData.id ? (txData as Transaction) : t))
      );
    } else {
      // Create new
      const newTx: Transaction = {
        ...(txData as Omit<Transaction, 'id'>),
        id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      };
      setTransactions((prev) => [newTx, ...prev]);
    }
    setEditingTx(null);
  };

  const handleDeleteTransaction = (id: string) => {
    setConfirmDialog({
      isOpen: true,
      title: '¿Eliminar transacción?',
      message: '¿Estás seguro de que deseas eliminar este movimiento? Esta acción no se puede deshacer.',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      isDestructive: true,
      iconType: 'delete',
      onConfirm: () => {
        setTransactions((prev) => prev.filter((t) => t.id !== id));
        showToast('Transacción eliminada correctamente', 'info');
      },
    });
  };

  // Handlers for Budgets
  const handleUpdateBudget = (categoryId: CategoryId, limit: number) => {
    setBudgets((prev) => {
      const exists = prev.some((b) => b.categoryId === categoryId);
      if (exists) {
        return prev.map((b) => (b.categoryId === categoryId ? { ...b, limit } : b));
      } else {
        return [...prev, { categoryId, limit }];
      }
    });
    showToast('Presupuesto actualizado', 'success');
  };

  // Handlers for Savings Goals
  const handleAddSavingsGoal = (goalData: Omit<SavingsGoal, 'id'>) => {
    const newGoal: SavingsGoal = {
      ...goalData,
      id: `goal-${Date.now()}`,
    };
    setSavingsGoals((prev) => [...prev, newGoal]);
    showToast('Meta de ahorro creada', 'success');
  };

  const handleUpdateSavingsGoal = (updatedGoal: SavingsGoal) => {
    setSavingsGoals((prev) =>
      prev.map((g) => (g.id === updatedGoal.id ? updatedGoal : g))
    );
    showToast('Meta de ahorro actualizada', 'success');
  };

  const handleDeleteSavingsGoal = (id: string) => {
    setConfirmDialog({
      isOpen: true,
      title: '¿Eliminar meta de ahorro?',
      message: '¿Estás seguro de que deseas eliminar esta meta? Se perderá el seguimiento de su avance.',
      confirmText: 'Eliminar Meta',
      cancelText: 'Cancelar',
      isDestructive: true,
      iconType: 'delete',
      onConfirm: () => {
        setSavingsGoals((prev) => prev.filter((g) => g.id !== id));
        showToast('Meta de ahorro eliminada', 'info');
      },
    });
  };

  // Export / Import / Reset Data
  const handleExportData = () => {
    const data = {
      transactions,
      budgets,
      savingsGoals,
      settings,
      exportDate: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MiDinero_Backup_${new Date().toISOString().substring(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Copia de seguridad descargada correctamente', 'success');
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        if (parsed.transactions) setTransactions(parsed.transactions);
        if (parsed.budgets) setBudgets(parsed.budgets);
        if (parsed.savingsGoals) setSavingsGoals(parsed.savingsGoals);
        if (parsed.settings) setSettings(parsed.settings);
        showToast('¡Datos importados con éxito!', 'success');
      } catch (err) {
        showToast('Error al leer el archivo JSON de copia de seguridad', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleResetData = () => {
    setConfirmDialog({
      isOpen: true,
      title: '¿Restablecer datos de fábrica?',
      message:
        'Se restablecerán todas las transacciones, presupuestos por categoría, metas de ahorro y configuración a los datos predeterminados en pesos ($). Se perderán los registros que hayas añadido.',
      confirmText: 'Restablecer de Fábrica',
      cancelText: 'Cancelar',
      isDestructive: true,
      iconType: 'reset',
      onConfirm: () => {
        try {
          const defaultTransactions = JSON.parse(JSON.stringify(INITIAL_TRANSACTIONS));
          const defaultBudgets = JSON.parse(JSON.stringify(INITIAL_BUDGETS));
          const defaultSavings = JSON.parse(JSON.stringify(INITIAL_SAVINGS_GOALS));
          const defaultSettings = JSON.parse(JSON.stringify(INITIAL_SETTINGS));

          localStorage.removeItem('midinero_transactions');
          localStorage.removeItem('midinero_budgets');
          localStorage.removeItem('midinero_savings_goals');
          localStorage.removeItem('midinero_settings');

          setTransactions(defaultTransactions);
          setBudgets(defaultBudgets);
          setSavingsGoals(defaultSavings);
          setSettings(defaultSettings);

          localStorage.setItem('midinero_transactions', JSON.stringify(defaultTransactions));
          localStorage.setItem('midinero_budgets', JSON.stringify(defaultBudgets));
          localStorage.setItem('midinero_savings_goals', JSON.stringify(defaultSavings));
          localStorage.setItem('midinero_settings', JSON.stringify(defaultSettings));
          syncManager.notifyUpdate('DATA_UPDATED');

          showToast('¡Datos restablecidos a la configuración de fábrica con éxito!', 'success');
        } catch (err) {
          console.error('Error al restablecer:', err);
          showToast('Error al restablecer los datos de fábrica', 'error');
        }
      },
    });
  };

  // Clear all transactions only
  const handleClearAllTransactions = () => {
    setConfirmDialog({
      isOpen: true,
      title: '¿Borrar todas las transacciones?',
      message:
        '¿Deseas eliminar todo el historial de transacciones (ingresos, gastos e impuestos)? La lista quedará vacía (0 registros) para que registres únicamente tus propios movimientos.',
      confirmText: 'Sí, Vaciar Transacciones',
      cancelText: 'Cancelar',
      isDestructive: true,
      iconType: 'delete',
      onConfirm: () => {
        try {
          setTransactions([]);
          localStorage.setItem('midinero_transactions', JSON.stringify([]));
          syncManager.notifyUpdate('DATA_UPDATED');
          showToast('Historial de transacciones vaciado por completo', 'info');
        } catch (err) {
          console.error('Error al vaciar transacciones:', err);
          showToast('Error al vaciar transacciones', 'error');
        }
      },
    });
  };

  // Clear all data to start completely from zero
  const handleClearAllData = () => {
    setConfirmDialog({
      isOpen: true,
      title: '¿Iniciar de cero completamente?',
      message:
        'Esta acción borrará todas las transacciones, todas las metas de ahorro y presupuestos para que empieces tu contabilidad completamente vacía desde cero (0 registros).',
      confirmText: 'Borrar Todo e Iniciar de Cero',
      cancelText: 'Cancelar',
      isDestructive: true,
      iconType: 'delete',
      onConfirm: () => {
        try {
          setTransactions([]);
          setBudgets([]);
          setSavingsGoals([]);
          localStorage.setItem('midinero_transactions', JSON.stringify([]));
          localStorage.setItem('midinero_budgets', JSON.stringify([]));
          localStorage.setItem('midinero_savings_goals', JSON.stringify([]));
          syncManager.notifyUpdate('DATA_UPDATED');
          showToast('¡Se han borrado todos los datos! La aplicación está lista desde cero.', 'success');
        } catch (err) {
          console.error('Error al vaciar todos los datos:', err);
          showToast('Error al vaciar los datos', 'error');
        }
      },
    });
  };

  const isDark = settings.theme === 'dark';

  return (
    <div className={`min-h-screen ${isDark ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-900'} font-sans antialiased selection:bg-teal-500 selection:text-white transition-colors duration-200`}>
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenAddModal={() => {
          setEditingTx(null);
          setIsAddModalOpen(true);
        }}
        onOpenAiModal={() => setIsAiModalOpen(true)}
      />

      <main className="max-w-7xl mx-auto px-3 sm:px-6 pt-5 pb-12">
        {activeTab === 'inicio' && (
          <Dashboard
            transactions={transactions}
            budgets={budgets}
            savingsGoals={savingsGoals}
            settings={settings}
            onOpenAddModal={() => {
              setEditingTx(null);
              setIsAddModalOpen(true);
            }}
            onOpenAiModal={() => setIsAiModalOpen(true)}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === 'transacciones' && (
          <TransactionsView
            transactions={transactions}
            settings={settings}
            onAddTransaction={() => {
              setEditingTx(null);
              setIsAddModalOpen(true);
            }}
            onEditTransaction={(tx) => {
              setEditingTx(tx);
              setIsAddModalOpen(true);
            }}
            onDeleteTransaction={handleDeleteTransaction}
            onClearAllTransactions={handleClearAllTransactions}
          />
        )}

        {activeTab === 'informes' && (
          <ReportsView transactions={transactions} settings={settings} />
        )}

        {activeTab === 'presupuestos' && (
          <BudgetsView
            budgets={budgets}
            transactions={transactions}
            settings={settings}
            onUpdateBudget={handleUpdateBudget}
          />
        )}

        {activeTab === 'ahorros' && (
          <SavingsView
            goals={savingsGoals}
            settings={settings}
            onAddGoal={handleAddSavingsGoal}
            onUpdateGoal={handleUpdateSavingsGoal}
            onDeleteGoal={handleDeleteSavingsGoal}
          />
        )}

        {activeTab === 'ajustes' && (
          <SettingsView
            settings={settings}
            onUpdateSettings={setSettings}
            onExportData={handleExportData}
            onImportData={handleImportData}
            onResetData={handleResetData}
            onClearAllData={handleClearAllData}
          />
        )}
      </main>

      {/* Transaction Modal (Add / Edit) */}
      <TransactionModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingTx(null);
        }}
        onSave={handleSaveTransaction}
        initialData={editingTx}
      />

      {/* AI Quick Assistant Modal */}
      <QuickAiInputModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        onAddTransaction={handleSaveTransaction}
      />

      {/* Confirmation Modal */}
      {confirmDialog && (
        <ConfirmModal
          isOpen={confirmDialog.isOpen}
          title={confirmDialog.title}
          message={confirmDialog.message}
          confirmText={confirmDialog.confirmText}
          cancelText={confirmDialog.cancelText}
          isDestructive={confirmDialog.isDestructive}
          iconType={confirmDialog.iconType}
          onConfirm={confirmDialog.onConfirm}
          onClose={() => setConfirmDialog(null)}
        />
      )}

      {/* Floating Toast Notification */}
      {toast && (
        <div
          id="app-toast-notification"
          className={`fixed bottom-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-2xl animate-fadeIn text-sm font-medium transition-all max-w-sm sm:max-w-md ${
            toast.type === 'success'
              ? 'bg-emerald-950/95 border-emerald-500/40 text-emerald-100 shadow-emerald-950/40'
              : toast.type === 'error'
              ? 'bg-rose-950/95 border-rose-500/40 text-rose-100 shadow-rose-950/40'
              : 'bg-slate-900/95 border-slate-700 text-slate-100 shadow-black/50'
          }`}
        >
          {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
          {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />}
          {toast.type === 'info' && <Info className="w-5 h-5 text-teal-400 shrink-0" />}
          <span className="flex-1 text-xs sm:text-sm">{toast.message}</span>
          <button
            id="btn-close-toast"
            onClick={() => setToast(null)}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
