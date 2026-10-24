import React, { useEffect } from 'react';
import { BellRing, VolumeX, CheckCircle, Clock, Calendar, ArrowRight } from 'lucide-react';
import { WeeklyTask } from '../types';
import { startRepeatingAlarm, stopAlarmSound } from '../services/alarmService';

interface AlarmModalProps {
  task: WeeklyTask | null;
  onDismiss: () => void;
  onSnooze: (task: WeeklyTask) => void;
  onComplete: (taskId: string) => void;
}

export const AlarmModal: React.FC<AlarmModalProps> = ({
  task,
  onDismiss,
  onSnooze,
  onComplete,
}) => {
  useEffect(() => {
    if (task && task.hasAlarmSound) {
      startRepeatingAlarm(task.alarmTone || 'chime');
    }
    return () => {
      stopAlarmSound();
    };
  }, [task]);

  if (!task) return null;

  const handleDismiss = () => {
    stopAlarmSound();
    onDismiss();
  };

  const handleSnooze = () => {
    stopAlarmSound();
    onSnooze(task);
  };

  const handleComplete = () => {
    stopAlarmSound();
    onComplete(task.id);
  };

  const dayNames = ['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border-2 border-teal-500/80 text-slate-100 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl shadow-teal-500/20 p-6 text-center space-y-5 animate-bounce-short">
        {/* Animated Ringing Bell Icon */}
        <div className="relative mx-auto w-20 h-20 rounded-2xl bg-teal-500/20 border border-teal-500/50 flex items-center justify-center text-teal-400">
          <BellRing className="w-10 h-10 animate-pulse text-teal-300" />
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-teal-500"></span>
          </span>
        </div>

        <div>
          <span className="text-[11px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider bg-teal-950 text-teal-300 border border-teal-700/50">
            Recordatorio de Tarea Semanal
          </span>
          <h3 className="text-xl font-black text-slate-100 mt-2.5">
            {task.title}
          </h3>
          {task.description && (
            <p className="text-xs text-slate-400 mt-1 line-clamp-2">
              {task.description}
            </p>
          )}
        </div>

        {/* Task Details Card */}
        <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-2xl flex items-center justify-around text-xs">
          <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
            <Calendar className="w-3.5 h-3.5 text-teal-400" />
            <span>{dayNames[task.dayOfWeek] || 'Semanal'}</span>
          </div>
          <span className="text-slate-700">•</span>
          <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
            <Clock className="w-3.5 h-3.5 text-teal-400" />
            <span>{task.startTime || '09:00'} ({task.durationMinutes || 30} min)</span>
          </div>
          <span className="text-slate-700">•</span>
          <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded ${
            task.priority === 'urgente'
              ? 'bg-rose-950 text-rose-300 border border-rose-800/40'
              : task.priority === 'alta'
              ? 'bg-amber-950 text-amber-300 border border-amber-800/40'
              : 'bg-slate-800 text-slate-300'
          }`}>
            {task.priority}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-2">
          <button
            onClick={handleComplete}
            className="w-full py-3 bg-teal-600 hover:bg-teal-500 text-white font-extrabold rounded-xl text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-teal-900/30"
          >
            <CheckCircle className="w-4 h-4" />
            Marcar como Completada
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleSnooze}
              className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 border border-slate-700"
            >
              <Clock className="w-3.5 h-3.5 text-teal-400" />
              Posponer 5 min
            </button>

            <button
              onClick={handleDismiss}
              className="py-2.5 px-3 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 border border-slate-800"
            >
              <VolumeX className="w-3.5 h-3.5" />
              Silenciar Alarma
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
