import React, { useState, useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend, 
  PieChart, 
  Pie, 
  Cell,
  LineChart,
  Line
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  PiggyBank, 
  PieChart as PieIcon, 
  Calendar,
  Filter,
  ShoppingCart,
  HeartPulse,
  Receipt,
  PartyPopper,
  Bus,
  Home,
  Wallet,
  Zap,
  MoreHorizontal,
  UtensilsCrossed,
  Tag,
  Layers
} from 'lucide-react';
import { Transaction, UserSettings, Category } from '../types';
import { calculateMonthlyStats, formatCurrency, getMonthName } from '../utils/formatters';
import { DEFAULT_CATEGORIES, getCategoryById } from '../data/categories';

interface ReportsViewProps {
  transactions: Transaction[];
  settings: UserSettings;
  categories?: Category[];
}

const CATEGORY_ICONS: Record<string, React.FC<{ className?: string }>> = {
  UtensilsCrossed,
  ShoppingCart,
  HeartPulse,
  Receipt,
  PartyPopper,
  Bus,
  Home,
  Wallet,
  TrendingUp,
  Zap,
  MoreHorizontal,
  Tag,
};

export const ReportsView: React.FC<ReportsViewProps> = ({ 
  transactions, 
  settings,
  categories = DEFAULT_CATEGORIES,
}) => {
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [breakdownView, setBreakdownView] = useState<'categorias' | 'subcategorias'>('categorias');

  // Monthly summary calculation
  const monthlyStats = useMemo(() => {
    return calculateMonthlyStats(transactions);
  }, [transactions]);

  // Available months list for selector
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    transactions.forEach((tx) => months.add(tx.date.substring(0, 7)));
    return Array.from(months).sort().reverse();
  }, [transactions]);

  // Filtered transactions based on month selection
  const filteredTxs = useMemo(() => {
    if (selectedMonth === 'all') return transactions;
    return transactions.filter((t) => t.date.startsWith(selectedMonth));
  }, [transactions, selectedMonth]);

  // Total expenses
  const totalExpense = useMemo(() => {
    return filteredTxs
      .filter((t) => t.type === 'gasto')
      .reduce((acc, curr) => acc + curr.amount, 0);
  }, [filteredTxs]);

  // Category breakdown for pie chart & detailed table
  const categoryBreakdown = useMemo(() => {
    const expenses = filteredTxs.filter((t) => t.type === 'gasto');

    const map = new Map<string, { total: number; count: number }>();
    expenses.forEach((tx) => {
      const current = map.get(tx.categoryId) || { total: 0, count: 0 };
      map.set(tx.categoryId, {
        total: current.total + tx.amount,
        count: current.count + 1,
      });
    });

    return Array.from(map.entries())
      .map(([catId, data]) => ({
        category: getCategoryById(catId, categories),
        total: data.total,
        count: data.count,
        avg: data.count > 0 ? data.total / data.count : 0,
        percentage: totalExpense > 0 ? (data.total / totalExpense) * 100 : 0,
      }))
      .sort((a, b) => b.total - a.total);
  }, [filteredTxs, totalExpense, categories]);

  // Subcategory breakdown
  const subcategoryBreakdown = useMemo(() => {
    const expenses = filteredTxs.filter((t) => t.type === 'gasto');
    const map = new Map<string, { catId: string; subcategory: string; total: number; count: number }>();

    expenses.forEach((tx) => {
      const subcat = tx.subcategory?.trim() || 'General / Sin Subcategoría';
      const key = `${tx.categoryId}__${subcat.toLowerCase()}`;
      const current = map.get(key) || { catId: tx.categoryId, subcategory: subcat, total: 0, count: 0 };
      current.total += tx.amount;
      current.count += 1;
      map.set(key, current);
    });

    return Array.from(map.values())
      .map((item) => ({
        category: getCategoryById(item.catId, categories),
        subcategory: item.subcategory,
        total: item.total,
        count: item.count,
        avg: item.count > 0 ? item.total / item.count : 0,
        percentage: totalExpense > 0 ? (item.total / totalExpense) * 100 : 0,
      }))
      .sort((a, b) => b.total - a.total);
  }, [filteredTxs, totalExpense, categories]);

  // Totals for header
  const totalIncome = filteredTxs
    .filter((t) => t.type === 'ingreso')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const realSavings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? Math.max(0, (realSavings / totalIncome) * 100) : 0;

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* Header and Month Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-900 p-4 rounded-2xl border border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-100 flex items-center gap-2">
            <PieIcon className="w-6 h-6 text-teal-400" /> Informes y Métricas Financieras
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Evolución de ingresos vs. gastos, tasa de ahorro real y análisis de subcategorías
          </p>
        </div>

        {/* Month Filter */}
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-200 text-xs sm:text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-teal-500 font-semibold"
          >
            <option value="all">Histórico Completo</option>
            {availableMonths.map((m) => (
              <option key={m} value={m}>
                {getMonthName(m)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <span className="text-xs font-semibold text-slate-400">Ingresos Totales</span>
          <div className="text-lg sm:text-2xl font-black text-emerald-400 mt-1">
            +{formatCurrency(totalIncome, settings.currency)}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <span className="text-xs font-semibold text-slate-400">Gastos Totales</span>
          <div className="text-lg sm:text-2xl font-black text-rose-400 mt-1">
            -{formatCurrency(totalExpense, settings.currency)}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <span className="text-xs font-semibold text-slate-400">Ahorro Real Neto</span>
          <div className={`text-lg sm:text-2xl font-black mt-1 ${realSavings >= 0 ? 'text-teal-300' : 'text-rose-400'}`}>
            {formatCurrency(realSavings, settings.currency)}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <span className="text-xs font-semibold text-slate-400">Tasa de Ahorro</span>
          <div className="text-lg sm:text-2xl font-black text-teal-400 mt-1">
            {savingsRate.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Evolution Bar Chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
        <div>
          <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
            <BarChart className="w-4 h-4 text-teal-400" /> Ingresos vs. Gastos Mensuales
          </h3>
          <p className="text-xs text-slate-400">Comparativa histórica de flujo de caja</p>
        </div>

        <div className="h-64 sm:h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="monthName" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={11} tickLine={false} tickFormatter={(val) => `$${val}`} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '12px',
                  color: '#f8fafc',
                  fontSize: '12px',
                }}
                formatter={(val) => [formatCurrency(Number(val), settings.currency), '']}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Bar dataKey="income" name="Ingresos" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expense" name="Gastos" fill="#f43f5e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Category Breakdown: Pie Chart + Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pie Chart */}
        <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-teal-400" /> Distribución Porcentual
            </h3>
            <p className="text-xs text-slate-400">Proporción de gastos por categoría principal</p>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            {categoryBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryBreakdown}
                    dataKey="total"
                    nameKey="category.name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                  >
                    {categoryBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.category.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '12px',
                      color: '#f8fafc',
                      fontSize: '12px',
                    }}
                    formatter={(value: any) => [
                      formatCurrency(Number(value || 0), settings.currency),
                      'Monto',
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-xs text-slate-500">Sin datos de gastos</div>
            )}
          </div>
        </div>

        {/* Detailed Table Breakdown with Subcategories Tab Selector */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="font-bold text-sm text-slate-100">
                Desglose Detallado
              </h3>
              <p className="text-xs text-slate-400">
                Análisis por categorías principales y subcategorías específicas
              </p>
            </div>

            {/* Toggle Categorías vs. Subcategorías */}
            <div className="flex p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setBreakdownView('categorias')}
                className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                  breakdownView === 'categorias'
                    ? 'bg-teal-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                Categorías
              </button>
              <button
                type="button"
                onClick={() => setBreakdownView('subcategorias')}
                className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                  breakdownView === 'subcategorias'
                    ? 'bg-teal-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Tag className="w-3.5 h-3.5" />
                Subcategorías
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            {breakdownView === 'categorias' ? (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-[11px] uppercase text-slate-400 font-bold">
                    <th className="pb-3 pl-2">Categoría Principal</th>
                    <th className="pb-3 text-right">Monto Total</th>
                    <th className="pb-3 text-right">Nº Compras</th>
                    <th className="pb-3 text-right">% Del Total</th>
                    <th className="pb-3 text-right pr-2">Promedio</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs">
                  {categoryBreakdown.map((row) => {
                    const IconComp = CATEGORY_ICONS[row.category.icon] || Tag;
                    return (
                      <tr key={row.category.id} className="hover:bg-slate-800/30 transition">
                        <td className="py-3 pl-2 flex items-center gap-2.5">
                          <div
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0"
                            style={{ backgroundColor: row.category.color }}
                          >
                            <IconComp className="w-4 h-4" />
                          </div>
                          <span className="font-bold text-slate-200">{row.category.name}</span>
                        </td>
                        <td className="py-3 text-right font-extrabold text-slate-100">
                          {formatCurrency(row.total, settings.currency)}
                        </td>
                        <td className="py-3 text-right text-slate-400 font-semibold">
                          {row.count}
                        </td>
                        <td className="py-3 text-right text-teal-400 font-bold">
                          {row.percentage.toFixed(1)}%
                        </td>
                        <td className="py-3 text-right pr-2 text-slate-400 font-medium">
                          {formatCurrency(row.avg, settings.currency)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              /* Subcategories Breakdown Table */
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-[11px] uppercase text-slate-400 font-bold">
                    <th className="pb-3 pl-2">Subcategoría</th>
                    <th className="pb-3">Categoría</th>
                    <th className="pb-3 text-right">Monto Total</th>
                    <th className="pb-3 text-right">Registros</th>
                    <th className="pb-3 text-right pr-2">% Gastos</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs">
                  {subcategoryBreakdown.map((row, idx) => {
                    return (
                      <tr key={row.category.id + row.subcategory + idx} className="hover:bg-slate-800/30 transition">
                        <td className="py-3 pl-2">
                          <span className="font-bold text-slate-100 flex items-center gap-1.5">
                            <Tag className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                            {row.subcategory}
                          </span>
                        </td>
                        <td className="py-3 text-slate-400">
                          <span 
                            className="inline-block text-[11px] font-semibold px-2 py-0.5 rounded"
                            style={{ backgroundColor: `${row.category.color}20`, color: row.category.color }}
                          >
                            {row.category.name}
                          </span>
                        </td>
                        <td className="py-3 text-right font-extrabold text-slate-100">
                          {formatCurrency(row.total, settings.currency)}
                        </td>
                        <td className="py-3 text-right text-slate-400 font-semibold">
                          {row.count}
                        </td>
                        <td className="py-3 text-right pr-2 text-teal-400 font-bold">
                          {row.percentage.toFixed(1)}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
