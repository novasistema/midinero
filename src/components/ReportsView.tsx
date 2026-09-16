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
  MoreHorizontal
} from 'lucide-react';
import { Transaction, UserSettings } from '../types';
import { calculateMonthlyStats, formatCurrency, getMonthName } from '../utils/formatters';
import { CATEGORIES, getCategoryById } from '../data/categories';

interface ReportsViewProps {
  transactions: Transaction[];
  settings: UserSettings;
}

const CATEGORY_ICONS: Record<string, React.FC<{ className?: string }>> = {
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
};

export const ReportsView: React.FC<ReportsViewProps> = ({ transactions, settings }) => {
  const [selectedMonth, setSelectedMonth] = useState<string>('all');

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

  // Category breakdown for pie chart & detailed table
  const categoryBreakdown = useMemo(() => {
    const expenses = filteredTxs.filter((t) => t.type === 'gasto');
    const totalExp = expenses.reduce((acc, curr) => acc + curr.amount, 0);

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
        category: getCategoryById(catId),
        total: data.total,
        count: data.count,
        avg: data.count > 0 ? data.total / data.count : 0,
        percentage: totalExp > 0 ? (data.total / totalExp) * 100 : 0,
      }))
      .sort((a, b) => b.total - a.total);
  }, [filteredTxs]);

  // Totals for header
  const totalIncome = filteredTxs
    .filter((t) => t.type === 'ingreso')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalExpense = filteredTxs
    .filter((t) => t.type === 'gasto')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const realSavings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? Math.max(0, (realSavings / totalIncome) * 100) : 0;

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* Header & Month Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-900 p-4 rounded-2xl border border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-100 flex items-center gap-2">
            Informes & Gráficas Comparativas
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Análisis detallado de ingresos, compras, impuestos y evolución del ahorro real
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-teal-400 shrink-0" />
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-200 text-xs font-semibold rounded-xl px-3 py-2 focus:outline-none focus:border-teal-500"
          >
            <option value="all">Todo el Historial</option>
            {availableMonths.map((m) => (
              <option key={m} value={m}>
                {getMonthName(m)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400">Total Ingresos</span>
            <div className="text-xl font-extrabold text-emerald-400 mt-0.5">
              +{formatCurrency(totalIncome, settings.currency)}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400">Total Gastos</span>
            <div className="text-xl font-extrabold text-rose-400 mt-0.5">
              -{formatCurrency(totalExpense, settings.currency)}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-rose-500/10 text-rose-400">
            <TrendingDown className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400">Ahorro Real</span>
            <div className="text-xl font-extrabold text-teal-300 mt-0.5">
              {formatCurrency(realSavings, settings.currency)}
            </div>
            <span className="text-[10px] text-teal-400 font-bold">
              ({savingsRate.toFixed(1)}% del ingreso)
            </span>
          </div>
          <div className="p-3 rounded-xl bg-teal-500/10 text-teal-400">
            <PiggyBank className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Monthly Comparative Chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-100">
            Evolución Comparativa Mensual (Ingresos vs Gastos vs Ahorro Real)
          </h2>
          <p className="text-xs text-slate-400">
            Visualiza el comportamiento de tus finanzas mes a mes para asegurar el crecimiento de tu capital
          </p>
        </div>

        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={monthlyStats}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
              <XAxis dataKey="monthName" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '12px',
                  color: '#f8fafc',
                  fontSize: '12px',
                }}
                formatter={(value: number | string | undefined) => [
                  formatCurrency(Number(value || 0), settings.currency),
                ]}
              />
              <Legend
                wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }}
                formatter={(value) => <span className="text-slate-300 capitalize">{value}</span>}
              />
              <Bar dataKey="income" name="Ingresos" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expense" name="Gastos" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="realSavings" name="Ahorro Real" fill="#14b8a6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Savings Rate Trend Line Chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-100">Tendencia de Tasa de Ahorro (%)</h2>
          <p className="text-xs text-slate-400">Porcentaje de ingresos conservados cada mes</p>
        </div>

        <div className="h-48 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
              <XAxis dataKey="monthName" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} unit="%" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '12px',
                  color: '#f8fafc',
                  fontSize: '12px',
                }}
                formatter={(val) => [`${val}%`, 'Tasa de Ahorro']}
              />
              <Line
                type="monotone"
                dataKey="savingsRate"
                stroke="#06b6d4"
                strokeWidth={3}
                dot={{ fill: '#06b6d4', r: 5 }}
              />
            </LineChart>
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
            <p className="text-xs text-slate-400">Proporción de gastos por categoría</p>
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
                    formatter={(value: number | string | undefined) => [
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

        {/* Detailed Category Table Breakdown */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div>
            <h3 className="font-bold text-sm text-slate-100">
              Desglose Detallado por Categoría
            </h3>
            <p className="text-xs text-slate-400">
              Supermercado, Farmacia, Impuestos Abonados, Ocio, Transporte, etc.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] uppercase text-slate-400 font-bold">
                  <th className="pb-3 pl-2">Categoría</th>
                  <th className="pb-3 text-right">Monto Total</th>
                  <th className="pb-3 text-right">Nº Compras</th>
                  <th className="pb-3 text-right">% Del Total</th>
                  <th className="pb-3 text-right pr-2">Promedio / Compra</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {categoryBreakdown.map((row) => {
                  const IconComp = CATEGORY_ICONS[row.category.icon] || MoreHorizontal;
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
          </div>
        </div>
      </div>
    </div>
  );
};
