export type TransactionType = 'ingreso' | 'gasto';

export type CategoryId = 
  | 'supermercado'
  | 'farmacia'
  | 'impuestos'
  | 'ocio'
  | 'transporte'
  | 'vivienda'
  | 'salario'
  | 'inversiones'
  | 'servicios'
  | 'otros';

export interface Category {
  id: CategoryId;
  name: string;
  icon: string;
  color: string;
  defaultType: TransactionType;
}

export type PaymentMethod = 'efectivo' | 'tarjeta' | 'transferencia' | 'bizum';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  categoryId: CategoryId;
  subcategory?: string;
  description: string;
  date: string; // YYYY-MM-DD
  paymentMethod: PaymentMethod;
  tags?: string[];
  notes?: string;
  receiptUrl?: string;
}

export interface CategoryBudget {
  categoryId: CategoryId;
  limit: number;
}

export interface SavingsGoal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string; // YYYY-MM-DD
  category: 'inversion' | 'emergencia' | 'meta_personal' | 'vacaciones' | 'otro';
  color: string;
  icon: string;
  notes?: string;
}

export interface UserSettings {
  currency: string; // 'EUR', 'USD', 'MXN', 'PEN', 'ARS', etc.
  currencySymbol: string;
  theme: 'dark' | 'light';
  budgetAlertThreshold: number; // e.g., 85%
  enableAlerts: boolean;
  autoSyncEnabled: boolean;
}

export interface MonthlySummary {
  monthKey: string; // YYYY-MM
  monthName: string;
  income: number;
  expense: number;
  realSavings: number;
  savingsRate: number;
}
