// Web Audio API Synthesizer and Browser Notification Service for Weekly Tasks
import { WeeklyTask } from '../types';

let audioCtx: AudioContext | null = null;
let activeOscillators: OscillatorNode[] = [];
let activeGains: GainNode[] = [];
let alarmIntervalId: any = null;
let isPlaying = false;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export const playChimeNote = (freq: number, duration: number, type: OscillatorType = 'sine', volume: number = 0.2) => {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    // Envelope
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (e) {
    console.warn('AudioContext playback error', e);
  }
};

export const playTonePattern = (tone: 'bell' | 'chime' | 'urgent' = 'chime') => {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    if (tone === 'bell') {
      // Bell chime (587Hz & 880Hz)
      [587.33, 880].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.15);
        gain.gain.setValueAtTime(0.25, now + idx * 0.15);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.15 + 1.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.15);
        osc.stop(now + idx * 0.15 + 1.2);
      });
    } else if (tone === 'urgent') {
      // High-energy urgent double-beep
      [880, 1046.5, 880, 1046.5].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, now + idx * 0.12);
        gain.gain.setValueAtTime(0.18, now + idx * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.09);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.12);
        osc.stop(now + idx * 0.12 + 0.1);
      });
    } else {
      // Default: pleasant arpeggio chime (C5, E5, G5, C6)
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.14);
        gain.gain.setValueAtTime(0.25, now + idx * 0.14);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.14 + 0.8);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.14);
        osc.stop(now + idx * 0.14 + 0.8);
      });
    }
  } catch (err) {
    console.warn('Tone pattern playback error', err);
  }
};

/**
 * Start repeating alarm sound until dismissed
 */
export const startRepeatingAlarm = (tone: 'bell' | 'chime' | 'urgent' = 'chime', intervalMs: number = 2200) => {
  stopAlarmSound();
  isPlaying = true;
  playTonePattern(tone);

  alarmIntervalId = setInterval(() => {
    if (isPlaying) {
      playTonePattern(tone);
    } else {
      stopAlarmSound();
    }
  }, intervalMs);
};

export const stopAlarmSound = () => {
  isPlaying = false;
  if (alarmIntervalId) {
    clearInterval(alarmIntervalId);
    alarmIntervalId = null;
  }
};

export const isAlarmSoundPlaying = () => isPlaying;

/**
 * Browser Notification Permission and Dispatch
 */
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
    return false;
  }
  if (Notification.permission === 'granted') {
    return true;
  }
  if (Notification.permission !== 'denied') {
    const result = await Notification.requestPermission();
    return result === 'granted';
  }
  return false;
};

export const sendBrowserNotification = (
  title: string,
  body: string,
  icon?: string
) => {
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body,
        icon: icon || '/assets/aistudio/logo_control_0bd5bb22.jpg',
        tag: 'control-task-reminder',
      });
    } catch (e) {
      console.warn('Error displaying Notification', e);
    }
  }
};

/**
 * Checks if a specific task's reminder or start time is due right now
 */
export const isTaskDueForReminder = (task: WeeklyTask, now: Date = new Date()): boolean => {
  if (task.status === 'completada' || task.reminderTriggered) {
    return false;
  }
  if (!task.hasReminder) {
    return false;
  }

  // 1. If task has a specific date YYYY-MM-DD
  const todayStr = now.toISOString().split('T')[0];
  const currentDayOfWeek = now.getDay() === 0 ? 7 : now.getDay(); // 1=Lunes ... 7=Domingo

  // Check matching day
  const isMatchingDay = task.date ? task.date === todayStr : task.dayOfWeek === currentDayOfWeek;
  if (!isMatchingDay) {
    return false;
  }

  // If task has no startTime, it can't trigger an exact alarm
  if (!task.startTime) {
    return false;
  }

  const [hours, minutes] = task.startTime.split(':').map(Number);
  const taskStartTime = new Date(now);
  taskStartTime.setHours(hours, minutes, 0, 0);

  // Apply reminderMinutesBefore
  const reminderTime = new Date(taskStartTime.getTime() - (task.reminderMinutesBefore || 0) * 60 * 1000);

  // Check if current time is within [reminderTime, reminderTime + 3 minutes]
  const diffMs = now.getTime() - reminderTime.getTime();
  const diffMinutes = diffMs / (60 * 1000);

  return diffMinutes >= 0 && diffMinutes <= 3;
};
