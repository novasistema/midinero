import React, { useState, useEffect, useRef } from 'react';
import { 
  INITIAL_TRANSACTIONS, 
  INITIAL_BUDGETS, 
  INITIAL_SAVINGS_GOALS, 
  INITIAL_SETTINGS,
  INITIAL_WEEKLY_TASKS,
  INITIAL_ACCOUNTS,
  INITIAL_CREDENTIALS
} from './data/initialData';
import { 
  Transaction, 
  CategoryBudget, 
  SavingsGoal, 
  UserSettings, 
  CategoryId,
  TransferSavingsPayload,
  WeeklyTask,
  VaultCredential,
  MoneyAccount,
  AccountTransferPayload,
  Category
} from './types';
import { 
  loadStoredCategories, 
  saveStoredCategories, 
  DEFAULT_CATEGORIES 
} from './data/categories';
import { 
  isTaskDueForReminder, 
  startRepeatingAlarm, 
  stopAlarmSound, 
  playTonePattern 
} from './services/alarmService';
import { syncManager } from './utils/sync';
import confetti from 'canvas-confetti';

// Core Components
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { TransactionsView } from './components/TransactionsView';
import { ReportsView } from './components/ReportsView';
import { BudgetsView } from './components/BudgetsView';
import { SavingsView } from './components/SavingsView';
import { SettingsView } from './components/SettingsView';
import { WeeklyTasksView } from './components/WeeklyTasksView';
import { VaultView } from './components/VaultView';
import { AccountsView } from './components/AccountsView';

// Modals
import { TransactionModal } from './components/TransactionModal';
import { TransferModal } from './components/TransferModal';
import { QuickAiInputModal } from './components/QuickAiInputModal';
import { ConfirmModal } from './components/ConfirmModal';
import { CategoriesModal } from './components/CategoriesModal';
import { TaskModal } from './components/TaskModal';
import { AlarmModal } from './components/AlarmModal';
import { VaultModal } from './components/VaultModal';
import { AccountModal } from './components/AccountModal';
import { AccountTransferModal } from './components/AccountTransferModal';

import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function App() {
  // 1. Transactions State
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const saved = localStorage.getItem('midinero_transactions');
      return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
    } catch {
      return INITIAL_TRANSACTIONS;
    }
  });

  // 2. Budgets State
  const [budgets, setBudgets] = useState<CategoryBudget[]>(() => {
    try {
      const saved = localStorage.getItem('midinero_budgets');
      return saved ? JSON.parse(saved) : INITIAL_BUDGETS;
    } catch {
      return INITIAL_BUDGETS;
    }
  });

  // 3. Savings Goals State
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>(() => {
    try {
      const saved = localStorage.getItem('midinero_savings_goals');
      if (saved) {
        const parsed: SavingsGoal[] = JSON.parse(saved);
        const hasLiveInvestment = parsed.some((g) => g.isInvestment);
        if (!hasLiveInvestment) {
          const defaultInvestments = INITIAL_SAVINGS_GOALS.filter((g) => g.isInvestment);
          return [...defaultInvestments, ...parsed];
        }
        return parsed;
      }
      return INITIAL_SAVINGS_GOALS;
    } catch {
      return INITIAL_SAVINGS_GOALS;
    }
  });

  // 4. Categories & Subcategories State
  const [categories, setCategories] = useState<Category[]>(loadStoredCategories);

  // 5. Weekly Tasks State (with Day planner, time blocks, alarms)
  const [weeklyTasks, setWeeklyTasks] = useState<WeeklyTask[]>(() => {
    try {
      const saved = localStorage.getItem('midinero_weekly_tasks');
      return saved ? JSON.parse(saved) : INITIAL_WEEKLY_TASKS;
    } catch {
      return INITIAL_WEEKLY_TASKS;
    }
  });

  // 6. Money Accounts & Wallets State
  const [accounts, setAccounts] = useState<MoneyAccount[]>(() => {
    try {
      const saved = localStorage.getItem('midinero_accounts');
      return saved ? JSON.parse(saved) : INITIAL_ACCOUNTS;
    } catch {
      return INITIAL_ACCOUNTS;
    }
  });

  // 7. Password Vault State
  const [credentials, setCredentials] = useState<VaultCredential[]>(() => {
    try {
      const saved = localStorage.getItem('midinero_vault_credentials');
      return saved ? JSON.parse(saved) : INITIAL_CREDENTIALS;
    } catch {
      return INITIAL_CREDENTIALS;
    }
  });

  // 8. User Settings State
  const [settings, setSettings] = useState<UserSettings>(() => {
    try {
      const saved = localStorage.getItem('midinero_settings');
      return saved ? JSON.parse(saved) : INITIAL_SETTINGS;
    } catch {
      return INITIAL_SETTINGS;
    }
  });

  // Active view tab ('inicio' | 'cuentas' | 'transacciones' | 'tareas' | 'boveda' | 'informes' | 'presupuestos' | 'ahorros' | 'ajustes')
  const [activeTab, setActiveTab] = useState<string>('inicio');

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferInitialSourceId, setTransferInitialSourceId] = useState<string | undefined>(undefined);

  // Subcategories & Custom Categories Modal
  const [isCategoriesModalOpen, setIsCategoriesModalOpen] = useState(false);

  // Task Modals & Alarm State
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<WeeklyTask | null>(null);
  const [defaultTaskDay, setDefaultTaskDay] = useState<number>(1);
  const [activeAlarmTask, setActiveAlarmTask] = useState<WeeklyTask | null>(null);

  // Account Modals State
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<MoneyAccount | null>(null);
  const [isAccountTransferModalOpen, setIsAccountTransferModalOpen] = useState(false);
  const [transferInitialSourceAccountId, setTransferInitialSourceAccountId] = useState<string | undefined>(undefined);

  // Vault Modal State
  const [isVaultModalOpen, setIsVaultModalOpen] = useState(false);
  const [editingCredential, setEditingCredential] = useState<VaultCredential | null>(null);

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
    saveStoredCategories(categories);
  }, [categories]);

  useEffect(() => {
    try {
      localStorage.setItem('midinero_weekly_tasks', JSON.stringify(weeklyTasks));
      syncManager.notifyUpdate('DATA_UPDATED');
    } catch (err) {
      console.error('Failed to save weekly tasks:', err);
    }
  }, [weeklyTasks]);

  useEffect(() => {
    try {
      localStorage.setItem('midinero_accounts', JSON.stringify(accounts));
      syncManager.notifyUpdate('DATA_UPDATED');
    } catch (err) {
      console.error('Failed to save accounts:', err);
    }
  }, [accounts]);

  useEffect(() => {
    try {
      localStorage.setItem('midinero_vault_credentials', JSON.stringify(credentials));
      syncManager.notifyUpdate('DATA_UPDATED');
    } catch (err) {
      console.error('Failed to save vault credentials:', err);
    }
  }, [credentials]);

  useEffect(() => {
    try {
      localStorage.setItem('midinero_settings', JSON.stringify(settings));
    } catch (err) {
      console.error('Failed to save settings:', err);
    }
  }, [settings]);

  // Periodic Alarm & Reminder Checker for Weekly Tasks (every 15 seconds)
  const tasksRef = useRef(weeklyTasks);
  tasksRef.current = weeklyTasks;

  useEffect(() => {
    const checkTaskAlarms = () => {
      const now = new Date();
      // Current day of week: Monday = 1 ... Sunday = 7
      const currentDay = now.getDay() === 0 ? 7 : now.getDay();

      tasksRef.current.forEach((task) => {
        if (task.status === 'completada') return;
        if (task.reminderTriggered) return;

        // Check if task is for today and due for alarm
        if (task.dayOfWeek === currentDay && isTaskDueForReminder(task)) {
          // Trigger alarm!
          if (task.hasAlarmSound) {
            startRepeatingAlarm(task.alarmTone || 'chime', 2000);
          } else {
            playTonePattern('bell');
          }

          // Browser Notification if permitted
          if ('Notification' in window && Notification.permission === 'granted') {
            try {
              new Notification(`⏰ Recordatorio de Tarea: ${task.title}`, {
                body: task.description || `Hora asignada: ${task.startTime || 'Ahora'}`,
                icon: '/favicon.ico',
              });
            } catch (e) {
              console.warn('Browser notification error', e);
            }
          }

          // Mark task as triggered in state so it doesn't loop forever
          setWeeklyTasks((prev) =>
            prev.map((t) => (t.id === task.id ? { ...t, reminderTriggered: true } : t))
          );

          // Open in-app visual alarm modal
          setActiveAlarmTask(task);
        }
      });
    };

    // Check immediately and then every 15s
    checkTaskAlarms();
    const interval = setInterval(checkTaskAlarms, 15000);
    return () => clearInterval(interval);
  }, []);

  // Handlers for Transactions (with account balance synchronization)
  const handleSaveTransaction = (txData: Omit<Transaction, 'id'> | Transaction) => {
    let savedTx: Transaction;

    if ('id' in txData && txData.id) {
      // Edit existing
      const existingTx = transactions.find((t) => t.id === txData.id);
      savedTx = txData as Transaction;

      // Reconcile account balance changes if account was specified
      if (existingTx && existingTx.accountId) {
        // Revert previous transaction impact
        const prevImpact = existingTx.type === 'ingreso' ? -existingTx.amount : existingTx.amount;
        setAccounts((prevAccs) =>
          prevAccs.map((acc) =>
            acc.id === existingTx.accountId
              ? { ...acc, currentBalance: acc.currentBalance + prevImpact }
              : acc
          )
        );
      }

      if (savedTx.accountId) {
        // Apply new transaction impact
        const newImpact = savedTx.type === 'ingreso' ? savedTx.amount : -savedTx.amount;
        setAccounts((prevAccs) =>
          prevAccs.map((acc) =>
            acc.id === savedTx.accountId
              ? { ...acc, currentBalance: acc.currentBalance + newImpact }
              : acc
          )
        );
      }

      setTransactions((prev) =>
        prev.map((t) => (t.id === txData.id ? savedTx : t))
      );
      showToast('Registro actualizado correctamente', 'success');
    } else {
      // Create new
      savedTx = {
        ...(txData as Omit<Transaction, 'id'>),
        id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      };

      // Impact account balance
      if (savedTx.accountId) {
        const impact = savedTx.type === 'ingreso' ? savedTx.amount : -savedTx.amount;
        setAccounts((prevAccs) =>
          prevAccs.map((acc) =>
            acc.id === savedTx.accountId
              ? { ...acc, currentBalance: acc.currentBalance + impact }
              : acc
          )
        );
      }

      setTransactions((prev) => [savedTx, ...prev]);
      showToast('Registro añadido correctamente', 'success');
    }
    setEditingTx(null);
  };

  const handleDeleteTransaction = (id: string) => {
    const tx = transactions.find((t) => t.id === id);
    setConfirmDialog({
      isOpen: true,
      title: '¿Eliminar transacción?',
      message: '¿Estás seguro de que deseas eliminar este movimiento? Esta acción no se puede deshacer.',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      isDestructive: true,
      iconType: 'delete',
      onConfirm: () => {
        if (tx && tx.accountId) {
          // Revert impact on account balance
          const revertAmount = tx.type === 'ingreso' ? -tx.amount : tx.amount;
          setAccounts((prevAccs) =>
            prevAccs.map((acc) =>
              acc.id === tx.accountId
                ? { ...acc, currentBalance: acc.currentBalance + revertAmount }
                : acc
            )
          );
        }
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

  const handleUpdateAllSavingsGoals = (updatedGoals: SavingsGoal[]) => {
    setSavingsGoals(updatedGoals);
    showToast('Cotizaciones actualizadas', 'success');
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

  const handleOpenTransfer = (sourceGoalId?: string) => {
    setTransferInitialSourceId(sourceGoalId);
    setIsTransferModalOpen(true);
  };

  const handleConfirmTransfer = (payload: TransferSavingsPayload) => {
    if (payload.type === 'between_goals' && payload.sourceGoalId && payload.targetGoalId) {
      setSavingsGoals((prev) =>
        prev.map((g) => {
          if (g.id === payload.sourceGoalId) {
            return { ...g, currentAmount: Math.max(0, g.currentAmount - payload.amount) };
          }
          if (g.id === payload.targetGoalId) {
            return { ...g, currentAmount: g.currentAmount + payload.amount };
          }
          return g;
        })
      );
      showToast('¡Fondos transferidos entre metas de ahorro con éxito!', 'success');
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
    }
  };

  // Handlers for Categories & Subcategories
  const handleAddSubcategory = (categoryId: string, subcategory: string) => {
    setCategories((prev) =>
      prev.map((cat) => {
        if (cat.id === categoryId) {
          if (cat.subcategories.some((s) => s.toLowerCase() === subcategory.toLowerCase())) {
            return cat;
          }
          return { ...cat, subcategories: [...cat.subcategories, subcategory] };
        }
        return cat;
      })
    );
    showToast(`Subcategoría "${subcategory}" agregada`, 'success');
  };

  const handleSaveCategory = (cat: Category) => {
    setCategories((prev) => {
      const idx = prev.findIndex((c) => c.id === cat.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = cat;
        return updated;
      }
      return [...prev, cat];
    });
    showToast(`Categoría "${cat.name}" guardada`, 'success');
  };

  const handleDeleteCategory = (id: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
    showToast('Categoría eliminada', 'info');
  };

  const handleDeleteSubcategory = (categoryId: string, subcategory: string) => {
    setCategories((prev) =>
      prev.map((cat) => {
        if (cat.id === categoryId) {
          return {
            ...cat,
            subcategories: cat.subcategories.filter((s) => s !== subcategory),
          };
        }
        return cat;
      })
    );
    showToast('Subcategoría eliminada', 'info');
  };

  // Handlers for Weekly Tasks
  const handleOpenAddTask = (day: number = 1) => {
    setDefaultTaskDay(day);
    setEditingTask(null);
    setIsTaskModalOpen(true);
  };

  const handleOpenEditTask = (task: WeeklyTask) => {
    setEditingTask(task);
    setIsTaskModalOpen(true);
  };

  const handleSaveTask = (taskData: Omit<WeeklyTask, 'id' | 'createdAt'> | WeeklyTask) => {
    if ('id' in taskData && taskData.id) {
      setWeeklyTasks((prev) =>
        prev.map((t) => (t.id === taskData.id ? (taskData as WeeklyTask) : t))
      );
      showToast('Tarea actualizada correctamente', 'success');
    } else {
      const newTask: WeeklyTask = {
        ...(taskData as Omit<WeeklyTask, 'id' | 'createdAt'>),
        id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        createdAt: new Date().toISOString(),
      };
      setWeeklyTasks((prev) => [...prev, newTask]);
      showToast('Tarea programada con recordatorio', 'success');
    }
  };

  const handleDeleteTask = (id: string) => {
    setWeeklyTasks((prev) => prev.filter((t) => t.id !== id));
    showToast('Tarea eliminada de la agenda', 'info');
  };

  const handleToggleTaskStatus = (id: string) => {
    setWeeklyTasks((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const nextStatus = t.status === 'completada' ? 'pendiente' : 'completada';
          if (nextStatus === 'completada') {
            confetti({ particleCount: 35, spread: 50, origin: { y: 0.8 } });
          }
          return {
            ...t,
            status: nextStatus,
            completedAt: nextStatus === 'completada' ? new Date().toISOString() : undefined,
          };
        }
        return t;
      })
    );
  };

  const handleSnoozeAlarm = (minutes: number = 5) => {
    stopAlarmSound();
    if (activeAlarmTask) {
      showToast(`Alarma pospuesta por ${minutes} minutos`, 'info');
    }
    setActiveAlarmTask(null);
  };

  const handleCompleteAlarmTask = (id: string) => {
    stopAlarmSound();
    handleToggleTaskStatus(id);
    setActiveAlarmTask(null);
    showToast('¡Tarea completada! 🎉', 'success');
  };

  // Handlers for Money Accounts & Wallets
  const handleOpenAddAccount = () => {
    setEditingAccount(null);
    setIsAccountModalOpen(true);
  };

  const handleOpenEditAccount = (account: MoneyAccount) => {
    setEditingAccount(account);
    setIsAccountModalOpen(true);
  };

  const handleSaveAccount = (accountData: Omit<MoneyAccount, 'id' | 'createdAt'> | MoneyAccount) => {
    if ('id' in accountData && accountData.id) {
      setAccounts((prev) =>
        prev.map((a) => (a.id === accountData.id ? (accountData as MoneyAccount) : a))
      );
      showToast('Cuenta de dinero actualizada', 'success');
    } else {
      const newAcc: MoneyAccount = {
        ...(accountData as Omit<MoneyAccount, 'id' | 'createdAt'>),
        id: `acc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        createdAt: new Date().toISOString(),
      };
      setAccounts((prev) => [...prev, newAcc]);
      showToast('Nueva cuenta o billetera agregada', 'success');
    }
  };

  const handleDeleteAccount = (id: string) => {
    setConfirmDialog({
      isOpen: true,
      title: '¿Eliminar cuenta de dinero?',
      message: '¿Estás seguro de que deseas eliminar esta cuenta o billetera? Las transacciones mantendrán su historial.',
      confirmText: 'Eliminar Cuenta',
      cancelText: 'Cancelar',
      isDestructive: true,
      iconType: 'delete',
      onConfirm: () => {
        setAccounts((prev) => prev.filter((a) => a.id !== id));
        showToast('Cuenta eliminada', 'info');
      },
    });
  };

  const handleOpenAccountTransferModal = (initialSourceId?: string) => {
    setTransferInitialSourceAccountId(initialSourceId);
    setIsAccountTransferModalOpen(true);
  };

  const handleConfirmAccountTransfer = (payload: AccountTransferPayload) => {
    const source = accounts.find((a) => a.id === payload.sourceAccountId);
    const target = accounts.find((a) => a.id === payload.targetAccountId);

    if (!source || !target) return;

    // Update account balances
    setAccounts((prev) =>
      prev.map((a) => {
        if (a.id === payload.sourceAccountId) {
          return { ...a, currentBalance: a.currentBalance - payload.amount };
        }
        if (a.id === payload.targetAccountId) {
          return { ...a, currentBalance: a.currentBalance + payload.amount };
        }
        return a;
      })
    );

    // Record an internal transfer transaction entry
    const transferTx: Transaction = {
      id: `tx-transfer-${Date.now()}`,
      type: 'gasto',
      amount: payload.amount,
      categoryId: 'otros',
      subcategory: 'Transferencia Interna',
      description: `Transferencia: ${source.name} ➔ ${target.name}${payload.notes ? ` (${payload.notes})` : ''}`,
      date: payload.date || new Date().toISOString().split('T')[0],
      paymentMethod: 'transferencia',
      accountId: payload.sourceAccountId,
    };
    setTransactions((prev) => [transferTx, ...prev]);

    showToast(`Transferencia de ${payload.amount} ${source.currency} realizada con éxito`, 'success');
    confetti({ particleCount: 40, spread: 60, origin: { y: 0.7 } });
  };

  // Handlers for Password Vault
  const handleOpenAddCredential = () => {
    setEditingCredential(null);
    setIsVaultModalOpen(true);
  };

  const handleOpenEditCredential = (cred: VaultCredential) => {
    setEditingCredential(cred);
    setIsVaultModalOpen(true);
  };

  const handleSaveCredential = (credData: Omit<VaultCredential, 'id' | 'createdAt' | 'updatedAt'> | VaultCredential) => {
    if ('id' in credData && credData.id) {
      setCredentials((prev) =>
        prev.map((c) => (c.id === credData.id ? (credData as VaultCredential) : c))
      );
      showToast('Credencial actualizada en la bóveda', 'success');
    } else {
      const newCred: VaultCredential = {
        ...(credData as Omit<VaultCredential, 'id' | 'createdAt' | 'updatedAt'>),
        id: `vault-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setCredentials((prev) => [newCred, ...prev]);
      showToast('Credencial guardada de forma segura', 'success');
    }
  };

  const handleDeleteCredential = (id: string) => {
    setConfirmDialog({
      isOpen: true,
      title: '¿Eliminar de la bóveda?',
      message: '¿Estás seguro de que deseas eliminar este registro de contraseñas? Esta acción no se puede deshacer.',
      confirmText: 'Eliminar Credencial',
      cancelText: 'Cancelar',
      isDestructive: true,
      iconType: 'delete',
      onConfirm: () => {
        setCredentials((prev) => prev.filter((c) => c.id !== id));
        showToast('Credencial eliminada de la bóveda', 'info');
      },
    });
  };

  const handleToggleFavoriteCredential = (id: string) => {
    setCredentials((prev) =>
      prev.map((c) => (c.id === id ? { ...c, favorite: !c.favorite } : c))
    );
  };

  // Backup & Import
  const handleExportData = () => {
    const data = {
      transactions,
      budgets,
      savingsGoals,
      settings,
      categories,
      weeklyTasks,
      accounts,
      credentials,
      version: '2.5.0',
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Control_Backup_${new Date().toISOString().substring(0, 10)}.json`;
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
        if (parsed.categories) setCategories(parsed.categories);
        if (parsed.weeklyTasks) setWeeklyTasks(parsed.weeklyTasks);
        if (parsed.accounts) setAccounts(parsed.accounts);
        if (parsed.credentials) setCredentials(parsed.credentials);
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
        'Se restablecerán todas las transacciones, cuentas de dinero, contraseñas, agenda semanal, metas y presupuestos a sus valores iniciales.',
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
          const defaultCategories = JSON.parse(JSON.stringify(DEFAULT_CATEGORIES));
          const defaultTasks = JSON.parse(JSON.stringify(INITIAL_WEEKLY_TASKS));
          const defaultAccs = JSON.parse(JSON.stringify(INITIAL_ACCOUNTS));
          const defaultCreds = JSON.parse(JSON.stringify(INITIAL_CREDENTIALS));

          setTransactions(defaultTransactions);
          setBudgets(defaultBudgets);
          setSavingsGoals(defaultSavings);
          setSettings(defaultSettings);
          setCategories(defaultCategories);
          setWeeklyTasks(defaultTasks);
          setAccounts(defaultAccs);
          setCredentials(defaultCreds);

          localStorage.setItem('midinero_transactions', JSON.stringify(defaultTransactions));
          localStorage.setItem('midinero_budgets', JSON.stringify(defaultBudgets));
          localStorage.setItem('midinero_savings_goals', JSON.stringify(defaultSavings));
          localStorage.setItem('midinero_settings', JSON.stringify(defaultSettings));
          localStorage.setItem('midinero_categories', JSON.stringify(defaultCategories));
          localStorage.setItem('midinero_weekly_tasks', JSON.stringify(defaultTasks));
          localStorage.setItem('midinero_accounts', JSON.stringify(defaultAccs));
          localStorage.setItem('midinero_vault_credentials', JSON.stringify(defaultCreds));

          showToast('¡Datos restablecidos a la configuración de fábrica con éxito!', 'success');
        } catch (err) {
          console.error('Error al restablecer:', err);
          showToast('Error al restablecer los datos de fábrica', 'error');
        }
      },
    });
  };

  const handleClearAllTransactions = () => {
    setConfirmDialog({
      isOpen: true,
      title: '¿Borrar todas las transacciones?',
      message:
        '¿Deseas eliminar todo el historial de transacciones (ingresos, gastos e impuestos)? La lista quedará vacía (0 registros).',
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

  const handleClearAllData = () => {
    setConfirmDialog({
      isOpen: true,
      title: '¿Iniciar de cero completamente?',
      message:
        'Esta acción borrará todas las transacciones, metas de ahorro, cuentas y presupuestos para que empieces desde cero (0 registros).',
      confirmText: 'Borrar Todo e Iniciar de Cero',
      cancelText: 'Cancelar',
      isDestructive: true,
      iconType: 'delete',
      onConfirm: () => {
        try {
          setTransactions([]);
          setBudgets([]);
          setSavingsGoals([]);
          setWeeklyTasks([]);
          setAccounts([]);
          setCredentials([]);

          localStorage.setItem('midinero_transactions', JSON.stringify([]));
          localStorage.setItem('midinero_budgets', JSON.stringify([]));
          localStorage.setItem('midinero_savings_goals', JSON.stringify([]));
          localStorage.setItem('midinero_weekly_tasks', JSON.stringify([]));
          localStorage.setItem('midinero_accounts', JSON.stringify([]));
          localStorage.setItem('midinero_vault_credentials', JSON.stringify([]));

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

      <main className="max-w-7xl mx-auto px-3 sm:px-6 pt-5 pb-20 md:pb-12">
        {/* INICIO / DASHBOARD */}
        {activeTab === 'inicio' && (
          <Dashboard
            transactions={transactions}
            budgets={budgets}
            savingsGoals={savingsGoals}
            settings={settings}
            categories={categories}
            weeklyTasks={weeklyTasks}
            accounts={accounts}
            vaultCount={credentials.length}
            onOpenAddModal={() => {
              setEditingTx(null);
              setIsAddModalOpen(true);
            }}
            onOpenAiModal={() => setIsAiModalOpen(true)}
            onNavigateTab={setActiveTab}
            onOpenTransferModal={handleOpenTransfer}
            onToggleTaskStatus={handleToggleTaskStatus}
          />
        )}

        {/* CUENTAS Y BILLETERAS */}
        {activeTab === 'cuentas' && (
          <AccountsView
            accounts={accounts}
            transactions={transactions}
            settings={settings}
            onAddAccount={handleOpenAddAccount}
            onEditAccount={handleOpenEditAccount}
            onDeleteAccount={handleDeleteAccount}
            onOpenTransferModal={handleOpenAccountTransferModal}
          />
        )}

        {/* REGISTROS / TRANSACCIONES */}
        {activeTab === 'transacciones' && (
          <TransactionsView
            transactions={transactions}
            settings={settings}
            categories={categories}
            accounts={accounts}
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
            onOpenCategoriesModal={() => setIsCategoriesModalOpen(true)}
          />
        )}

        {/* AGENDA SEMANAL Y TAREAS */}
        {activeTab === 'tareas' && (
          <WeeklyTasksView
            tasks={weeklyTasks}
            onAddTask={handleOpenAddTask}
            onEditTask={handleOpenEditTask}
            onDeleteTask={handleDeleteTask}
            onToggleTaskStatus={handleToggleTaskStatus}
            onTriggerAlarmTest={() => {
              startRepeatingAlarm('chime', 2000);
              showToast('Probando timbre de alarma sintetizado...', 'info');
              setTimeout(stopAlarmSound, 6000);
            }}
          />
        )}

        {/* BÓVEDA DE CONTRASEÑAS */}
        {activeTab === 'boveda' && (
          <VaultView
            credentials={credentials}
            onAddCredential={handleOpenAddCredential}
            onEditCredential={handleOpenEditCredential}
            onDeleteCredential={handleDeleteCredential}
            onToggleFavorite={handleToggleFavoriteCredential}
            showToast={showToast}
          />
        )}

        {/* INFORMES Y DESGLOSE */}
        {activeTab === 'informes' && (
          <ReportsView 
            transactions={transactions} 
            settings={settings} 
            categories={categories}
          />
        )}

        {/* LÍMITES Y PRESUPUESTOS */}
        {activeTab === 'presupuestos' && (
          <BudgetsView
            budgets={budgets}
            transactions={transactions}
            settings={settings}
            onUpdateBudget={handleUpdateBudget}
          />
        )}

        {/* METAS DE AHORRO E INVERSIONES */}
        {activeTab === 'ahorros' && (
          <SavingsView
            goals={savingsGoals}
            settings={settings}
            onAddGoal={handleAddSavingsGoal}
            onUpdateGoal={handleUpdateSavingsGoal}
            onDeleteGoal={handleDeleteSavingsGoal}
            onOpenTransferModal={handleOpenTransfer}
            onUpdateAllGoals={handleUpdateAllSavingsGoals}
          />
        )}

        {/* AJUSTES */}
        {activeTab === 'ajustes' && (
          <SettingsView
            settings={settings}
            onUpdateSettings={setSettings}
            onExportData={handleExportData}
            onImportData={handleImportData}
            onResetData={handleResetData}
            onClearAllData={handleClearAllData}
            onOpenCategoriesModal={() => setIsCategoriesModalOpen(true)}
          />
        )}
      </main>

      {/* Transaction Modal (Add / Edit) with Categories, Subcategories & Accounts */}
      <TransactionModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingTx(null);
        }}
        onSave={handleSaveTransaction}
        initialData={editingTx}
        categories={categories}
        accounts={accounts}
        onAddSubcategory={handleAddSubcategory}
      />

      {/* Transfer Modal between Cajas de Ahorro / Metas */}
      <TransferModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        goals={savingsGoals}
        settings={settings}
        initialSourceGoalId={transferInitialSourceId}
        onConfirmTransfer={handleConfirmTransfer}
      />

      {/* Account Modal (Create / Edit Money Account or Wallet) */}
      <AccountModal
        isOpen={isAccountModalOpen}
        onClose={() => {
          setIsAccountModalOpen(false);
          setEditingAccount(null);
        }}
        onSave={handleSaveAccount}
        initialData={editingAccount}
        settings={settings}
      />

      {/* Account Transfer Modal (Transfer between accounts/wallets) */}
      <AccountTransferModal
        isOpen={isAccountTransferModalOpen}
        onClose={() => setIsAccountTransferModalOpen(false)}
        accounts={accounts}
        settings={settings}
        initialSourceId={transferInitialSourceAccountId}
        onConfirmTransfer={handleConfirmAccountTransfer}
      />

      {/* Task Modal (Create / Edit Weekly Task with Day and Alarm settings) */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setEditingTask(null);
        }}
        onSave={handleSaveTask}
        initialData={editingTask}
        defaultDay={defaultTaskDay}
      />

      {/* Acoustic Ringing Alarm Modal */}
      {activeAlarmTask && (
        <AlarmModal
          task={activeAlarmTask}
          onDismiss={() => {
            stopAlarmSound();
            setActiveAlarmTask(null);
          }}
          onSnooze={handleSnoozeAlarm}
          onComplete={handleCompleteAlarmTask}
        />
      )}

      {/* Password Vault Modal (Add / Edit Credential) */}
      <VaultModal
        isOpen={isVaultModalOpen}
        onClose={() => {
          setIsVaultModalOpen(false);
          setEditingCredential(null);
        }}
        onSave={handleSaveCredential}
        initialData={editingCredential}
      />

      {/* Categories & Subcategories Management Modal */}
      <CategoriesModal
        isOpen={isCategoriesModalOpen}
        onClose={() => setIsCategoriesModalOpen(false)}
        categories={categories}
        onSaveCategory={handleSaveCategory}
        onDeleteCategory={handleDeleteCategory}
        onAddSubcategory={handleAddSubcategory}
        onDeleteSubcategory={handleDeleteSubcategory}
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
