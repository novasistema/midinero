import React, { useState, useEffect } from 'react';
import { X, Plus, Save, ShoppingCart, HeartPulse, Receipt, PartyPopper, Bus, Home, Wallet, TrendingUp, Zap, MoreHorizontal } from 'lucide-react';
import { Transaction, CategoryId, PaymentMethod, TransactionType } from '../types';
import { CATEGORIES } from '../data/categories';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (tx: Omit<Transaction, 'id'> | Transaction) => void;
  initialData?: Transaction | null;
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

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
}) => {
  const [type, setType] = useState<TransactionType>('gasto');
  const [amount, setAmount] = useState<string>('');
  const [categoryId, setCategoryId] = useState<CategoryId>('supermercado');
  const [description, setDescription] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [date, setDate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('tarjeta');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (initialData) {
      setType(initialData.type);
      setAmount(initialData.amount.toString());
      setCategoryId(initialData.categoryId);
      setDescription(initialData.description);
      setSubcategory(initialData.subcategory || '');
      setDate(initialData.date);
      setPaymentMethod(initialData.paymentMethod);
      setNotes(initialData.notes || '');
    } else {
      setType('gasto');
      setAmount('');
      setCategoryId('supermercado');
      setDescription('');
      setSubcategory('');
      setDate(new Date().toISOString().split('T')[0]);
      setPaymentMethod('tarjeta');
      setNotes('');
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount.replace(',', '.'));
    if (isNaN(parsedAmount) || parsedAmount <= 0) return;

    const payload = {
      ...(initialData?.id ? { id: initialData.id } : {}),
      type,
      amount: parsedAmount,
      categoryId,
      description: description.trim() || (type === 'ingreso' ? 'Ingreso' : 'Gasto'),
      subcategory: subcategory.trim() || undefined,
      date: date || new Date().toISOString().split('T')[0],
      paymentMethod,
      notes: notes.trim() || undefined,
    };

    onSave(payload as Transaction);
    onClose();
  };

  const filteredCategories = CATEGORIES.filter(c => c.defaultType === type || c.id === 'otros');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/60">
          <h3 className="font-bold text-lg text-slate-100">
            {initialData ? 'Editar Registro' : 'Nuevo Registro de Dinero'}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Type Toggle */}
          <div className="grid grid-cols-2 p-1 bg-slate-950 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => {
                setType('gasto');
                if (type !== 'gasto') setCategoryId('supermercado');
              }}
              className={`py-2 text-sm font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${
                type === 'gasto'
                  ? 'bg-rose-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Gasto
            </button>
            <button
              type="button"
              onClick={() => {
                setType('ingreso');
                if (type !== 'ingreso') setCategoryId('salario');
              }}
              className={`py-2 text-sm font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${
                type === 'ingreso'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Ingreso
            </button>
          </div>

          {/* Amount Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">
              Monto / Cantidad ($)
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-4 pr-10 text-2xl font-black text-slate-100 placeholder-slate-600 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xl font-bold text-slate-400">
                $
              </span>
            </div>
          </div>

          {/* Category Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
              Categoría
            </label>
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
              {filteredCategories.map((cat) => {
                const IconComponent = CATEGORY_ICONS[cat.icon] || MoreHorizontal;
                const isSelected = categoryId === cat.id;

                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategoryId(cat.id)}
                    className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left text-xs font-semibold transition ${
                      isSelected
                        ? 'border-teal-500 bg-teal-500/10 text-teal-300'
                        : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0"
                      style={{ backgroundColor: cat.color }}
                    >
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <span className="truncate">{cat.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Concept / Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">
              Concepto / Descripción
            </label>
            <input
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ej: Compra quincenal Mercadona, Farmacia receta, Impuestos..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500"
            />
          </div>

          {/* Subcategory & Payment Method in 2 cols */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">
                Método de Pago
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-sm text-slate-100 focus:outline-none focus:border-teal-500"
              >
                <option value="tarjeta">Tarjeta</option>
                <option value="efectivo">Efectivo</option>
                <option value="transferencia">Transferencia</option>
                <option value="bizum">Bizum</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">
                Fecha
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-sm text-slate-100 focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          {/* Optional Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">
              Notas Adicionales (Opcional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Anotaciones relativas a la factura o ticket..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-teal-500"
            />
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 text-white font-bold rounded-xl text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-teal-900/20"
            >
              <Save className="w-4 h-4" />
              {initialData ? 'Guardar Cambios' : 'Guardar Transacción'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
