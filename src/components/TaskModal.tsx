import React, { useState, useEffect } from 'react';
import { 
  X, 
  Save, 
  Clock, 
  Calendar, 
  Bell, 
  BellRing, 
  AlertTriangle, 
  Volume2, 
  Tag, 
  Check, 
  CheckCircle2 
} from 'lucide-react';
import { WeeklyTask, TaskPriority, TaskStatus } from '../types';
import { playTonePattern } from '../services/alarmService';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Omit<WeeklyTask, 'id' | 'createdAt'> | WeeklyTask) => void;
  initialData?: WeeklyTask | null;
  defaultDayOfWeek?: number;
}

const DAYS_OF_WEEK = [
  { value: 1, label: 'Lunes' },
  { value: 2, label: 'Martes' },
  { value: 3, label: 'Miércoles' },
  { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' },
  { value: 6, label: 'Sábado' },
  { value: 7, label: 'Domingo' },
];

const TASK_CATEGORIES = [
  'Finanzas',
  'Pagos',
  'Impuestos',
  'Inversiones',
  'Ahorro',
  'Trabajo',
  'Salud',
  'Personal',
  'Hogar',
  'Compras',
];

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  defaultDayOfWeek = 1,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dayOfWeek, setDayOfWeek] = useState<number>(defaultDayOfWeek);
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [durationMinutes, setDurationMinutes] = useState<number>(60);
  const [priority, setPriority] = useState<TaskPriority>('media');
  const [status, setStatus] = useState<TaskStatus>('pendiente');
  const [category, setCategory] = useState('Finanzas');

  // Alarm and Reminder states
  const [hasReminder, setHasReminder] = useState(true);
  const [reminderMinutesBefore, setReminderMinutesBefore] = useState<number>(10);
  const [hasAlarmSound, setHasAlarmSound] = useState(true);
  const [alarmTone, setAlarmTone] = useState<'bell' | 'chime' | 'urgent'>('chime');

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setDescription(initialData.description || '');
      setDayOfWeek(initialData.dayOfWeek);
      setDate(initialData.date || '');
      setStartTime(initialData.startTime || '09:00');
      setEndTime(initialData.endTime || '10:00');
      setDurationMinutes(initialData.durationMinutes || 60);
      setPriority(initialData.priority);
      setStatus(initialData.status);
      setCategory(initialData.category || 'Finanzas');
      setHasReminder(initialData.hasReminder ?? true);
      setReminderMinutesBefore(initialData.reminderMinutesBefore ?? 10);
      setHasAlarmSound(initialData.hasAlarmSound ?? true);
      setAlarmTone(initialData.alarmTone || 'chime');
    } else {
      setTitle('');
      setDescription('');
      setDayOfWeek(defaultDayOfWeek);
      setDate('');
      setStartTime('09:00');
      setEndTime('10:00');
      setDurationMinutes(60);
      setPriority('media');
      setStatus('pendiente');
      setCategory('Finanzas');
      setHasReminder(true);
      setReminderMinutesBefore(10);
      setHasAlarmSound(true);
      setAlarmTone('chime');
    }
  }, [initialData, defaultDayOfWeek, isOpen]);

  // Auto calculate duration from start and end time
  const handleStartTimeChange = (newStart: string) => {
    setStartTime(newStart);
    if (newStart && endTime) {
      const [sh, sm] = newStart.split(':').map(Number);
      const [eh, em] = endTime.split(':').map(Number);
      const startMin = sh * 60 + sm;
      const endMin = eh * 60 + em;
      if (endMin > startMin) {
        setDurationMinutes(endMin - startMin);
      }
    }
  };

  const handleEndTimeChange = (newEnd: string) => {
    setEndTime(newEnd);
    if (startTime && newEnd) {
      const [sh, sm] = startTime.split(':').map(Number);
      const [eh, em] = newEnd.split(':').map(Number);
      const startMin = sh * 60 + sm;
      const endMin = eh * 60 + em;
      if (endMin > startMin) {
        setDurationMinutes(endMin - startMin);
      }
    }
  };

  const handleDurationPreset = (mins: number) => {
    setDurationMinutes(mins);
    if (startTime) {
      const [sh, sm] = startTime.split(':').map(Number);
      const startTotal = sh * 60 + sm;
      const endTotal = startTotal + mins;
      const eh = Math.floor(endTotal / 60) % 24;
      const em = endTotal % 60;
      setEndTime(`${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}`);
    }
  };

  const handleTestAlarm = () => {
    playTonePattern(alarmTone);
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const payload = {
      ...(initialData?.id ? { id: initialData.id } : {}),
      title: title.trim(),
      description: description.trim() || undefined,
      dayOfWeek: Number(dayOfWeek),
      date: date || undefined,
      startTime: startTime || undefined,
      endTime: endTime || undefined,
      durationMinutes: durationMinutes > 0 ? durationMinutes : 30,
      priority,
      status,
      category,
      hasReminder,
      reminderMinutesBefore: Number(reminderMinutesBefore),
      hasAlarmSound,
      alarmTone,
      reminderTriggered: false,
    };

    onSave(payload as WeeklyTask);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-100">
                {initialData ? 'Editar Tarea Semanal' : 'Nueva Tarea y Horario'}
              </h3>
              <p className="text-xs text-slate-400">
                Organiza tus tiempos con asignación por día, alarma y recordatorio
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">
              Título de la Tarea por Hacer *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Conciliar gastos semanales, Pagar cuota IRPF, Compra supermercado..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500 font-semibold"
            />
          </div>

          {/* Day of Week & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">
                Día de la Semana Asignado
              </label>
              <select
                value={dayOfWeek}
                onChange={(e) => setDayOfWeek(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-sm text-slate-100 focus:outline-none focus:border-teal-500 font-bold"
              >
                {DAYS_OF_WEEK.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">
                Fecha Específica (Opcional)
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-sm text-slate-100 focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          {/* Time Allocation (Tiempo determinado) */}
          <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-teal-400" />
                Tiempo Determinado y Horario
              </label>
              <span className="text-xs font-bold text-teal-400">
                {durationMinutes >= 60
                  ? `${Math.floor(durationMinutes / 60)}h ${durationMinutes % 60 > 0 ? `${durationMinutes % 60}m` : ''}`
                  : `${durationMinutes} min`}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Hora Inicio</label>
                <input
                  type="time"
                  required
                  value={startTime}
                  onChange={(e) => handleStartTimeChange(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs font-bold text-slate-100 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Hora Fin</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => handleEndTimeChange(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs font-bold text-slate-100 focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>

            {/* Quick duration presets */}
            <div className="flex items-center gap-1.5 pt-1">
              <span className="text-[10px] text-slate-500 uppercase font-bold mr-1">Duración:</span>
              {[15, 30, 45, 60, 90, 120].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => handleDurationPreset(mins)}
                  className={`text-[11px] px-2 py-0.5 rounded-md border transition ${
                    durationMinutes === mins
                      ? 'bg-teal-600 border-teal-500 text-white font-bold'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {mins >= 60 ? `${mins / 60}h` : `${mins}m`}
                </button>
              ))}
            </div>
          </div>

          {/* Priority & Category & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">
                Prioridad
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-2.5 text-xs text-slate-100 focus:outline-none focus:border-teal-500 font-semibold"
              >
                <option value="baja">Baja</option>
                <option value="media">Media</option>
                <option value="alta">Alta</option>
                <option value="urgente">Urgente 🔥</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">
                Categoría
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-2.5 text-xs text-slate-100 focus:outline-none focus:border-teal-500 font-semibold"
              >
                {TASK_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">
                Estado
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-2.5 text-xs text-slate-100 focus:outline-none focus:border-teal-500 font-semibold"
              >
                <option value="pendiente">Pendiente</option>
                <option value="en_progreso">En Progreso ⏳</option>
                <option value="completada">Completada ✅</option>
              </select>
            </div>
          </div>

          {/* Alarm, Notifications and Reminder Section (Requested Feature) */}
          <div className="p-4 bg-teal-950/20 border border-teal-500/30 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BellRing className="w-4 h-4 text-teal-400" />
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Alarma, Notificación y Recordatorio
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasReminder}
                  onChange={(e) => setHasReminder(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-500"></div>
              </label>
            </div>

            {hasReminder && (
              <div className="space-y-3 pt-1 border-t border-teal-500/20">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Avisar con anticipación:
                    </label>
                    <select
                      value={reminderMinutesBefore}
                      onChange={(e) => setReminderMinutesBefore(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg py-1.5 px-2.5 text-xs text-slate-100 focus:outline-none focus:border-teal-500"
                    >
                      <option value={0}>A la hora exacta</option>
                      <option value={5}>5 minutos antes</option>
                      <option value={10}>10 minutos antes</option>
                      <option value={15}>15 minutos antes</option>
                      <option value={30}>30 minutos antes</option>
                      <option value={60}>1 hora antes</option>
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-semibold text-slate-400">
                        Tono de Alarma:
                      </label>
                      <button
                        type="button"
                        onClick={handleTestAlarm}
                        className="text-[10px] text-teal-400 hover:text-teal-300 font-bold flex items-center gap-1"
                      >
                        <Volume2 className="w-3 h-3" />
                        Probar
                      </button>
                    </div>
                    <select
                      value={alarmTone}
                      onChange={(e) => setAlarmTone(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg py-1.5 px-2.5 text-xs text-slate-100 focus:outline-none focus:border-teal-500"
                    >
                      <option value="chime">Melodía Armónica (Chime)</option>
                      <option value="bell">Campana Suave (Bell)</option>
                      <option value="urgent">Alerta Intensa (Urgent)</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[11px] text-teal-300 bg-teal-950/40 p-2 rounded-lg border border-teal-500/20">
                  <Bell className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                  <span>
                    Sonará una alarma acústica interactiva y se enviará notificación in-app y de navegador cuando llegue la hora.
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Description / Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">
              Descripción / Notas de la Tarea (Opcional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalles sobre facturas a juntar, páginas web a consultar o pasos a seguir..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-teal-500"
            />
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 text-white font-bold rounded-xl text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-teal-900/20"
            >
              <Save className="w-4 h-4" />
              {initialData ? 'Guardar Cambios' : 'Agendar Tarea Semanal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
