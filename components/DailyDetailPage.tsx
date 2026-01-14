
import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { DayInfo, ThemeOption, Task, Goal, Habit } from '../types';
import { CheckSquare, Square, Target, Menu, Clock, BarChart3, Activity, ListTodo, X, Archive, Flame, CheckCircle2 } from 'lucide-react';

// 图标映射
import { Book, Coffee, Heart, Smile, Star, Dumbbell, GlassWater, Moon, Sun, Laptop } from 'lucide-react';
const HABIT_ICONS: any = { Activity, Book, Coffee, Heart, Smile, Star, Dumbbell, GlassWater, Moon, Sun, Laptop };

interface DailyDetailPageProps {
  days: DayInfo[];
  goals?: Goal[];
  habits?: Habit[];
  activeDate: number;
  onDateChange: (date: number) => void;
  onToggleLibrary: (state?: boolean) => void;
  onOpenQuickMenu: () => void;
  onToggleTaskComplete: (taskId: string) => void;
  onToggleHabitComplete: (habitId: string, forcedHour?: number) => void;
  onEditTask: (task: Task) => void;
  onOpenSidebar: () => void;
  onUpdateTask: (task: Task) => void;
  theme: ThemeOption;
}

const DailyDetailPage: React.FC<DailyDetailPageProps> = ({ 
  days, goals = [], habits = [], activeDate, onDateChange, onToggleLibrary, onToggleTaskComplete, onToggleHabitComplete, onEditTask, onOpenSidebar, onUpdateTask, theme 
}) => {
  const activeDay = days.find(d => d.date === activeDate);
  const hours = Array.from({ length: 16 }, (_, i) => i + 7);
  const [now, setNow] = useState(new Date());
  const hourRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
  const [indicatorTop, setIndicatorTop] = useState<number | null>(null);
  const [planningHour, setPlanningHour] = useState<number | null>(null);
  const [assignTab, setAssignTab] = useState<'tasks' | 'habits'>('tasks');

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useLayoutEffect(() => {
    const h = now.getHours();
    const m = now.getMinutes();
    if (h >= 7 && h <= 22) {
      const el = hourRefs.current[h];
      if (el) setIndicatorTop(el.offsetTop + (m / 60) * el.offsetHeight);
    } else setIndicatorTop(null);
  }, [now, days, activeDate]);

  return (
    <div className="h-full flex flex-col bg-white">
      <header className="px-6 pt-16 pb-4 bg-white shrink-0">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={onOpenSidebar} className="p-1 -ml-1 text-slate-400 active:scale-90 transition-transform"><Menu size={20} strokeWidth={2.5} /></button>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-4 rounded-full" style={{ backgroundColor: theme.color }} />
            <h1 className="text-lg font-black tracking-tighter uppercase">日程 / DAILY</h1>
          </div>
        </div>
        <div className="flex justify-between gap-1">
          {days.map(day => (
            <button key={day.date} onClick={() => onDateChange(day.date)} className={`flex-1 flex flex-col items-center py-2.5 rounded-sm transition-all relative ${day.date === activeDate ? 'text-white' : 'text-slate-400 bg-slate-50/50 hover:bg-slate-50'}`} style={{ backgroundColor: day.date === activeDate ? theme.color : undefined }}>
              <span className={`text-[8px] font-black uppercase mb-1 ${day.date === activeDate ? 'opacity-60' : 'opacity-40'}`}>{day.weekday}</span>
              <span className="text-sm font-black mono leading-none">{day.date}</span>
            </button>
          ))}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto no-scrollbar px-6 pt-2 pb-24 relative">
        <div className="relative">
          {indicatorTop !== null && activeDate === new Date().getDate() && (
            <div className="absolute left-0 right-0 z-20 flex items-center gap-2 pointer-events-none" style={{ top: `${indicatorTop}px`, transform: 'translateY(-50%)' }}>
              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: theme.color }} />
              <div className="flex-1 h-[1px]" style={{ backgroundColor: `${theme.color}40` }} />
            </div>
          )}
          {hours.map(hour => {
            const hTasks = activeDay?.tasks.filter(t => t.time === `${hour < 10 ? '0' + hour : hour}:00`);
            const hHabits = habits.filter(h => h.completedToday && h.remark === `${hour < 10 ? '0' + hour : hour}:00`);
            return (
              <div key={hour} ref={el => hourRefs.current[hour] = el} className="flex gap-4 min-h-[72px]">
                <div className="w-10 shrink-0 text-[10px] font-black text-slate-200 mono pt-1 uppercase cursor-pointer hover:text-slate-400" onClick={() => setPlanningHour(hour)}>
                  {hour < 10 ? '0' + hour : hour}:00
                </div>
                <div className="flex-1 border-t border-slate-50 pt-2 pb-4 cursor-pointer" onClick={() => (hTasks?.length === 0 && hHabits.length === 0) && setPlanningHour(hour)}>
                  <div className="flex flex-wrap gap-2">
                    {hHabits.map(h => {
                      const Icon = HABIT_ICONS[h.iconName || 'Activity'];
                      return (
                        <div key={h.id} className="flex items-center gap-2 px-3 py-1.5 rounded-sm shadow-sm animate-in zoom-in-95" style={{ backgroundColor: h.color + '20', border: `1px solid ${h.color}40` }}>
                          <Icon size={12} style={{ color: h.color }} strokeWidth={3} />
                          <span className="text-[9px] font-black uppercase text-slate-600 tracking-tighter">{h.title}</span>
                        </div>
                      );
                    })}
                  </div>
                  {hTasks?.map(task => (
                    <div key={task.id} className="group relative p-4 rounded-sm mb-3 flat-card shadow-sm flex items-start gap-3 bg-slate-50" onClick={e => { e.stopPropagation(); onEditTask(task); }}>
                      <button onClick={e => { e.stopPropagation(); onToggleTaskComplete(task.id); }} style={{ color: theme.color }}>
                        {task.completed ? <CheckSquare size={20} strokeWidth={3} /> : <Square size={20} strokeWidth={3} />}
                      </button>
                      <div className="flex-1"><h4 className="text-[14px] font-bold text-slate-800">{task.title}</h4></div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {planningHour !== null && (
        <div className="fixed inset-0 z-[180] bg-slate-900/40 backdrop-blur-sm flex items-end justify-center" onClick={() => setPlanningHour(null)}>
           <div className="bg-white w-full max-w-md rounded-t-xl p-6 shadow-2xl animate-in slide-in-from-bottom duration-300 flex flex-col max-h-[75vh]" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between mb-4">
                 <div className="flex flex-col"><span className="text-[10px] font-black text-slate-300 uppercase">分配到</span><span className="text-xl font-black text-slate-800 mono">{planningHour}:00</span></div>
                 <button onClick={() => setPlanningHour(null)}><X size={24} className="text-slate-300"/></button>
              </div>
              <div className="flex gap-6 mb-4 border-b border-slate-50">
                 {['tasks', 'habits'].map(t => (
                   <button key={t} onClick={() => setAssignTab(t as any)} className={`pb-2 text-[11px] font-black uppercase tracking-widest relative ${assignTab === t ? 'text-slate-800' : 'text-slate-300'}`}>
                     {t === 'tasks' ? '待办' : '习惯'}{assignTab === t && <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ backgroundColor: theme.color }} />}
                   </button>
                 ))}
              </div>
              <div className="flex-1 overflow-y-auto no-scrollbar space-y-2 pb-6">
                 {assignTab === 'habits' ? habits?.filter(h => !h.completedToday).map(h => {
                    const Icon = HABIT_ICONS[h.iconName||'Activity'];
                    return (
                      <div key={h.id} onClick={() => { onToggleHabitComplete(h.id, planningHour); setPlanningHour(null); }} className="p-4 bg-slate-50 rounded-sm flex items-center justify-between cursor-pointer group active:scale-95 transition-all">
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-sm bg-white flex items-center justify-center shadow-sm"><Icon size={16} style={{ color: h.color }} /></div>
                           <span className="text-sm font-bold text-slate-700">{h.title}</span>
                        </div>
                        <CheckCircle2 size={16} className="text-slate-200 group-hover:text-green-500" />
                      </div>
                    );
                 }) : activeDay?.tasks.filter(t => !t.time).map(t => (
                   <div key={t.id} onClick={() => { onUpdateTask({...t, time: `${planningHour < 10 ? '0' + planningHour : planningHour}:00`}); setPlanningHour(null); }} className="p-4 bg-slate-50 rounded-sm flex justify-between cursor-pointer active:scale-95 transition-all">
                     <span className="text-sm font-bold text-slate-700">{t.title}</span>
                     <ListTodo size={16} className="text-slate-200" />
                   </div>
                 ))}
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default DailyDetailPage;
