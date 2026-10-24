import React, { useState, useMemo, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  Bell, 
  BellRing, 
  Plus, 
  CheckCircle2, 
  Circle, 
  Trash2, 
  Edit3, 
  Play, 
  Pause, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  AlertTriangle, 
  Filter, 
  ChevronLeft, 
  ChevronRight,
  Layers,
  Sparkles,
  Check
} from 'lucide-react';
import { WeeklyTask, TaskPriority, TaskStatus } from '../types';
import { 
  requestNotificationPermission, 
  playTonePattern 
} from '../services/alarmService';

interface WeeklyTasksViewProps {
  tasks: WeeklyTask[];
  onAddTask: (defaultDay?: number) => void;
  onEditTask: (task: WeeklyTask) => void;
  onDeleteTask: (id: string) => void;
  onToggleTaskStatus: (id: string) => void;
  onTriggerAlarmTest?: () => void;
}

const DAYS_OF_WEEK = [
  { id: 1, name: 'Lunes', short: 'Lun' },
  { id: 2, name: 'Martes', short: 'Mar' },
  { id: 3, name: 'Miércoles', short: 'Mié' },
  { id: 4, name: 'Jueves', short: 'Jue' },
  { id: 5, name: 'Viernes', short: 'Vie' },
  { id: 6, name: 'Sábado', short: 'Sáb' },
  { id: 7, name: 'Domingo', short: 'Dom' },
];

export const WeeklyTasksView: React.FC<WeeklyTasksViewProps> = ({
  tasks,
  onAddTask,
  onEditTask,
  onDeleteTask,
  onToggleTaskStatus,
  onTriggerAlarmTest,
}) => {
  const [viewMode, setViewMode] = useState<'columns' | 'list'>('columns');
  const [selectedDayFilter, setSelectedDayFilter] = useState<number | 'all'>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [selectedPriorityFilter, setSelectedPriorityFilter] = useState<string>('all');
  const [hasNotificationPerm, setHasNotificationPerm] = useState<boolean>(() => {
    return 'Notification' in window && Notification.permission === 'granted';
  });

  // Active Timer for task execution (time management)
  const [activeTimerTaskId, setActiveTimerTaskId] = useState<string | null>(null);
  const [timerSecondsRemaining, setTimerSecondsRemaining] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // Current day of week (1=Lunes ... 7=Domingo)
  const todayDayOfWeek = useMemo(() => {
    const d = new Date().getDay();
    return d === 0 ? 7 : d;
  }, []);

  // Request notifications permission handler
  const handleEnableNotifications = async () => {
    const granted = await requestNotificationPermission();
    setHasNotificationPerm(granted);
    if (granted) {
      playTonePattern('bell');
    }
  };

  // Timer tick effect
  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning && timerSecondsRemaining > 0) {
      interval = setInterval(() => {
        setTimerSecondsRemaining((prev) => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            playTonePattern('urgent');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, timerSecondsRemaining]);

  const handleStartTimer = (task: WeeklyTask) => {
    setActiveTimerTaskId(task.id);
    const totalSecs = (task.durationMinutes || 30) * 60;
    setTimerSecondsRemaining(totalSecs);
    setIsTimerRunning(true);
    playTonePattern('chime');
  };

  const handleStopTimer = () => {
    setIsTimerRunning(false);
  };

  const activeTask = tasks.find((t) => t.id === activeTimerTaskId);

  // Metrics
  const totalTasksCount = tasks.length;
  const completedTasksCount = tasks.filter((t) => t.status === 'completada').length;
  const pendingTasksCount = tasks.filter((t) => t.status !== 'completada').length;
  const progressPercent = totalTasksCount > 0 ? (completedTasksCount / totalTasksCount) * 100 : 0;
  
  const totalMinutesPlanned = tasks.reduce((acc, t) => acc + (t.durationMinutes || 30), 0);
  const hoursPlanned = Math.floor(totalMinutesPlanned / 60);
  const minsPlanned = totalMinutesPlanned % 60;

  // Filtered tasks for list view
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (selectedDayFilter !== 'all' && task.dayOfWeek !== selectedDayFilter) {
        return false;
      }
      if (selectedStatusFilter !== 'all' && task.status !== selectedStatusFilter) {
        return false;
      }
      if (selectedPriorityFilter !== 'all' && task.priority !== selectedPriorityFilter) {
        return false;
      }
      return true;
    }).sort((a, b) => {
      if (a.dayOfWeek !== b.dayOfWeek) {
        return a.dayOfWeek - b.dayOfWeek;
      }
      return (a.startTime || '00:00').localeCompare(b.startTime || '00:00');
    });
  }, [tasks, selectedDayFilter, selectedStatusFilter, selectedPriorityFilter]);

  const formatTimerClock = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="space-y-5 pb-20 md:pb-6">
      {/* Title & Actions Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-900 p-4 rounded-2xl border border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-100 flex items-center gap-2">
            <Clock className="w-6 h-6 text-teal-400" /> Planificador y Tareas Semanales
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Asigna tiempos determinados a cada día de la semana con alarma sonora y recordatorios
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Notification permission button */}
          {!hasNotificationPerm && (
            <button
              onClick={handleEnableNotifications}
              className="py-2.5 px-3 bg-teal-950/60 hover:bg-teal-900/80 border border-teal-500/40 text-teal-300 rounded-xl font-bold text-xs transition flex items-center gap-1.5"
              title="Permitir notificaciones de escritorio"
            >
              <Bell className="w-3.5 h-3.5" />
              Activar Notificaciones
            </button>
          )}

          {/* Test Alarm Sound Button */}
          <button
            onClick={() => {
              playTonePattern('chime');
              if (onTriggerAlarmTest) onTriggerAlarmTest();
            }}
            className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold text-xs transition flex items-center gap-1.5 border border-slate-700"
            title="Escuchar prueba de alarma acústica"
          >
            <Volume2 className="w-3.5 h-3.5 text-teal-400" />
            Probar Alarma
          </button>

          {/* New Task Button */}
          <button
            onClick={() => onAddTask(todayDayOfWeek)}
            className="py-2.5 px-4 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 text-white font-bold rounded-xl text-xs sm:text-sm transition flex items-center gap-1.5 shadow-lg shadow-teal-900/20"
          >
            <Plus className="w-4 h-4" />
            Nueva Tarea
          </button>
        </div>
      </div>

      {/* Metrics & Weekly Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <span className="text-xs font-semibold text-slate-400">Total Tareas Semanales</span>
          <div className="text-xl sm:text-2xl font-black text-slate-100 mt-1">
            {totalTasksCount}
          </div>
          <span className="text-[11px] text-slate-500">Agendadas de Lun a Dom</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <span className="text-xs font-semibold text-slate-400">Pendientes</span>
          <div className="text-xl sm:text-2xl font-black text-amber-400 mt-1">
            {pendingTasksCount}
          </div>
          <span className="text-[11px] text-slate-500">Por realizar esta semana</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <span className="text-xs font-semibold text-slate-400">Cumplimiento Semanal</span>
          <div className="text-xl sm:text-2xl font-black text-teal-300 mt-1">
            {progressPercent.toFixed(0)}%
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 mt-1.5 overflow-hidden">
            <div className="h-full bg-teal-500 transition-all duration-500" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <span className="text-xs font-semibold text-slate-400">Tiempo Planificado</span>
          <div className="text-xl sm:text-2xl font-black text-teal-400 mt-1">
            {hoursPlanned}h {minsPlanned > 0 ? `${minsPlanned}m` : ''}
          </div>
          <span className="text-[11px] text-slate-500">Dedicación organizada</span>
        </div>
      </div>

      {/* Active Focus Task Stopwatch / Timer Bar (if active) */}
      {activeTask && (
        <div className="bg-gradient-to-r from-teal-950 via-slate-900 to-teal-950 border border-teal-500/40 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-lg shadow-teal-950/50 animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-teal-500/20 text-teal-300">
              <Clock className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">
                Enfoque de Tiempo en Curso
              </span>
              <h4 className="font-extrabold text-sm sm:text-base text-slate-100 mt-0.5">
                {activeTask.title}
              </h4>
              <p className="text-xs text-slate-400">
                Horario: {activeTask.startTime} • Duración: {activeTask.durationMinutes} min
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto">
            <div className="text-2xl sm:text-3xl font-black font-mono text-teal-300">
              {formatTimerClock(timerSecondsRemaining)}
            </div>
            <button
              onClick={() => (isTimerRunning ? handleStopTimer() : setIsTimerRunning(true))}
              className="p-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl transition shadow"
              title={isTimerRunning ? 'Pausar' : 'Reanudar'}
            >
              {isTimerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            <button
              onClick={() => {
                onToggleTaskStatus(activeTask.id);
                setActiveTimerTaskId(null);
                setIsTimerRunning(false);
              }}
              className="py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow"
            >
              <Check className="w-3.5 h-3.5" />
              Completar
            </button>
            <button
              onClick={() => {
                setActiveTimerTaskId(null);
                setIsTimerRunning(false);
              }}
              className="p-2 text-slate-500 hover:text-slate-300 rounded-lg"
              title="Cerrar temporizador"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Controls Bar: View mode toggle & filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-900 p-3 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setViewMode('columns')}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
              viewMode === 'columns'
                ? 'bg-teal-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            Vista Semanal 7 Días
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
              viewMode === 'list'
                ? 'bg-teal-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Vista Agenda / Lista
          </button>
        </div>

        {/* Filters if in List view */}
        {viewMode === 'list' && (
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedDayFilter}
              onChange={(e) => setSelectedDayFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-teal-500 font-semibold"
            >
              <option value="all">Todos los días</option>
              {DAYS_OF_WEEK.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>

            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-teal-500 font-semibold"
            >
              <option value="all">Todos los estados</option>
              <option value="pendiente">Pendientes</option>
              <option value="en_progreso">En Progreso</option>
              <option value="completada">Completadas</option>
            </select>

            <select
              value={selectedPriorityFilter}
              onChange={(e) => setSelectedPriorityFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-teal-500 font-semibold"
            >
              <option value="all">Todas las prioridades</option>
              <option value="urgente">Urgente 🔥</option>
              <option value="alta">Alta</option>
              <option value="media">Media</option>
              <option value="baja">Baja</option>
            </select>
          </div>
        )}
      </div>

      {/* VIEW MODE 1: 7 COLUMNS (Lunes a Domingo) */}
      {viewMode === 'columns' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-3 items-start">
          {DAYS_OF_WEEK.map((day) => {
            const isToday = day.id === todayDayOfWeek;
            const dayTasks = tasks
              .filter((t) => t.dayOfWeek === day.id)
              .sort((a, b) => (a.startTime || '00:00').localeCompare(b.startTime || '00:00'));

            const dayMinutes = dayTasks.reduce((acc, t) => acc + (t.durationMinutes || 30), 0);
            const dayCompleted = dayTasks.filter((t) => t.status === 'completada').length;

            return (
              <div
                key={day.id}
                className={`bg-slate-900/90 rounded-2xl border flex flex-col min-h-[380px] shadow-sm transition ${
                  isToday
                    ? 'border-teal-500/80 ring-1 ring-teal-500/30'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Column Day Header */}
                <div className={`p-3 border-b rounded-t-2xl flex items-center justify-between ${
                  isToday ? 'bg-teal-950/40 border-teal-500/40' : 'bg-slate-950/40 border-slate-800'
                }`}>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-xs font-black uppercase tracking-wider ${
                        isToday ? 'text-teal-300' : 'text-slate-200'
                      }`}>
                        {day.name}
                      </span>
                      {isToday && (
                        <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-teal-500 text-slate-950">
                          HOY
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {dayTasks.length} {dayTasks.length === 1 ? 'tarea' : 'tareas'} • {dayMinutes}m
                    </div>
                  </div>

                  <button
                    onClick={() => onAddTask(day.id)}
                    className="p-1.5 text-slate-400 hover:text-teal-300 hover:bg-slate-800 rounded-lg transition"
                    title={`Agregar tarea para el ${day.name}`}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* Day Tasks List */}
                <div className="p-2 space-y-2 flex-1 overflow-y-auto">
                  {dayTasks.length > 0 ? (
                    dayTasks.map((task) => {
                      const isCompleted = task.status === 'completada';

                      return (
                        <div
                          key={task.id}
                          className={`p-2.5 rounded-xl border text-xs transition relative group ${
                            isCompleted
                              ? 'bg-slate-950/40 border-slate-900/80 opacity-60'
                              : task.priority === 'urgente'
                              ? 'bg-rose-950/20 border-rose-900/40 hover:border-rose-700/60'
                              : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          {/* Top: Status toggle + Title */}
                          <div className="flex items-start gap-2">
                            <button
                              onClick={() => onToggleTaskStatus(task.id)}
                              className="mt-0.5 text-slate-500 hover:text-teal-400 shrink-0 transition"
                              title={isCompleted ? 'Desmarcar' : 'Completar tarea'}
                            >
                              {isCompleted ? (
                                <CheckCircle2 className="w-4 h-4 text-teal-400" />
                              ) : (
                                <Circle className="w-4 h-4" />
                              )}
                            </button>

                            <div className="min-w-0 flex-1">
                              <p className={`font-bold leading-tight ${
                                isCompleted ? 'line-through text-slate-500' : 'text-slate-100'
                              }`}>
                                {task.title}
                              </p>

                              {task.description && (
                                <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                                  {task.description}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Time & Duration badge */}
                          <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2 pt-1.5 border-t border-slate-900">
                            <div className="flex items-center gap-1 font-semibold text-teal-300">
                              <Clock className="w-3 h-3 text-teal-400" />
                              <span>{task.startTime || '09:00'}</span>
                              <span className="text-slate-600">({task.durationMinutes || 30}m)</span>
                            </div>

                            {/* Alarm indicator */}
                            {task.hasReminder && (
                              <span
                                className="flex items-center gap-0.5 text-amber-400 font-bold"
                                title={`Recordatorio activo: ${task.reminderMinutesBefore}m antes`}
                              >
                                <BellRing className="w-2.5 h-2.5" />
                                {task.reminderMinutesBefore > 0 ? `${task.reminderMinutesBefore}m` : '0m'}
                              </span>
                            )}
                          </div>

                          {/* Category and Actions */}
                          <div className="flex items-center justify-between mt-1.5 pt-1">
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-800/80 text-slate-400">
                              {task.category}
                            </span>

                            <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition">
                              {!isCompleted && (
                                <button
                                  onClick={() => handleStartTimer(task)}
                                  className="p-1 text-slate-400 hover:text-teal-300 hover:bg-slate-800 rounded transition"
                                  title="Iniciar temporizador de tiempo"
                                >
                                  <Play className="w-3 h-3" />
                                </button>
                              )}
                              <button
                                onClick={() => onEditTask(task)}
                                className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition"
                                title="Editar tarea"
                              >
                                <Edit3 className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => onDeleteTask(task.id)}
                                className="p-1 text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 rounded transition"
                                title="Eliminar tarea"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-6 text-center text-[11px] text-slate-600 space-y-1">
                      <p>Sin tareas</p>
                      <button
                        onClick={() => onAddTask(day.id)}
                        className="text-teal-400 hover:underline font-bold text-[10px]"
                      >
                        + Asignar tarea
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* VIEW MODE 2: LIST / AGENDA VIEW */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="p-3.5 border-b border-slate-800 bg-slate-950/40 text-xs text-slate-400 font-semibold flex items-center justify-between">
            <span>
              Mostrando {filteredTasks.length} de {tasks.length} tareas
            </span>
          </div>

          {filteredTasks.length > 0 ? (
            <div className="divide-y divide-slate-800">
              {filteredTasks.map((task) => {
                const isCompleted = task.status === 'completada';
                const dayObj = DAYS_OF_WEEK.find((d) => d.id === task.dayOfWeek);

                return (
                  <div
                    key={task.id}
                    className="p-4 flex items-center justify-between gap-3 hover:bg-slate-800/40 transition group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <button
                        onClick={() => onToggleTaskStatus(task.id)}
                        className="text-slate-500 hover:text-teal-400 shrink-0 transition"
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="w-5 h-5 text-teal-400" />
                        ) : (
                          <Circle className="w-5 h-5" />
                        )}
                      </button>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-sm font-bold ${
                            isCompleted ? 'line-through text-slate-500' : 'text-slate-100'
                          }`}>
                            {task.title}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                            {dayObj?.name || 'Semana'}
                          </span>
                          <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded ${
                            task.priority === 'urgente'
                              ? 'bg-rose-950 text-rose-300 border border-rose-800/40'
                              : task.priority === 'alta'
                              ? 'bg-amber-950 text-amber-300 border border-amber-800/40'
                              : 'bg-slate-800 text-slate-400'
                          }`}>
                            {task.priority}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1 flex-wrap">
                          <span className="font-semibold text-teal-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {task.startTime || '09:00'} - {task.endTime || '10:00'} ({task.durationMinutes || 30} min)
                          </span>
                          <span>•</span>
                          <span className="text-slate-400">{task.category}</span>
                          {task.hasReminder && (
                            <>
                              <span>•</span>
                              <span className="text-amber-400 flex items-center gap-0.5">
                                <BellRing className="w-3 h-3" />
                                Alarma {task.reminderMinutesBefore}m antes
                              </span>
                            </>
                          )}
                          {task.description && (
                            <>
                              <span>•</span>
                              <span className="italic text-slate-500 truncate max-w-[200px]">
                                {task.description}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {!isCompleted && (
                        <button
                          onClick={() => handleStartTimer(task)}
                          className="py-1.5 px-2.5 bg-teal-950/60 hover:bg-teal-900 border border-teal-500/40 text-teal-300 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                        >
                          <Play className="w-3 h-3" />
                          <span className="hidden sm:inline">Enfocar</span>
                        </button>
                      )}
                      <button
                        onClick={() => onEditTask(task)}
                        className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeleteTask(task.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-12 text-center text-slate-500 space-y-2">
              <Calendar className="w-8 h-8 mx-auto text-slate-600 opacity-50" />
              <p className="text-sm font-semibold">No se encontraron tareas con los filtros seleccionados</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
