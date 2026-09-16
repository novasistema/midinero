import { Category } from '../types';

export const CATEGORIES: Category[] = [
  { id: 'supermercado', name: 'Supermercado', icon: 'ShoppingCart', color: '#10b981', defaultType: 'gasto' },
  { id: 'farmacia', name: 'Farmacia', icon: 'HeartPulse', color: '#ec4899', defaultType: 'gasto' },
  { id: 'impuestos', name: 'Impuestos Abonados', icon: 'Receipt', color: '#ef4444', defaultType: 'gasto' },
  { id: 'ocio', name: 'Ocio y Restauración', icon: 'PartyPopper', color: '#f59e0b', defaultType: 'gasto' },
  { id: 'transporte', name: 'Transporte', icon: 'Bus', color: '#3b82f6', defaultType: 'gasto' },
  { id: 'vivienda', name: 'Vivienda y Servicios', icon: 'Home', color: '#8b5cf6', defaultType: 'gasto' },
  { id: 'salario', name: 'Salario e Ingresos', icon: 'Wallet', color: '#14b8a6', defaultType: 'ingreso' },
  { id: 'inversiones', name: 'Inversiones y Rendimientos', icon: 'TrendingUp', color: '#06b6d4', defaultType: 'ingreso' },
  { id: 'servicios', name: 'Suscripciones y Tecnología', icon: 'Zap', color: '#6366f1', defaultType: 'gasto' },
  { id: 'otros', name: 'Otros Gastos / Ingresos', icon: 'MoreHorizontal', color: '#64748b', defaultType: 'gasto' },
];

export const getCategoryById = (id: string): Category => {
  return CATEGORIES.find(c => c.id === id) || {
    id: 'otros',
    name: 'Otros',
    icon: 'MoreHorizontal',
    color: '#64748b',
    defaultType: 'gasto'
  };
};
