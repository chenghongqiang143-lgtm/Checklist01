
import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { DayInfo, ThemeOption, Task, Goal, Habit } from '../types';
import { CheckSquare, Square, Menu, Activity, X, ListTodo, CheckCircle2 } from 'lucide-react';

import { Book, Coffee, Heart, Smile, Star, Dumbbell, GlassWater, Moon, Sun, Laptop, Music, Camera, Brush, MapPin } from 'lucide-react';
const HABIT_ICONS: any = { Activity, Book, Coffee, Heart, Smile, Star, Dumbbell, GlassWater, Moon, Sun, Laptop, Music, Camera, Brush, MapPin };

interface DailyDetailPageProps {
  days: DayInfo[];
  goals?: Goal[];
  habits?: Habit[];
  activeDate: number;
  onDateChange: (date: number) => void;
  onToggleLibrary: (state?: boolean) => void;
  onOpenQuickMenu: (time?: string) => void;
  onToggleTaskComplete: (taskId: string) => void;
  onToggleHabitComplete: (habitId: string, forcedHour?: number) => void;
  onEditTask: (task: Task) => void;
  onOpenSidebar: () => void;
  onUpdateTask: (task: Task) => void;
  theme: ThemeOption;
}

const DailyDetailPage: React.FC<DailyDetailPageProps> = ({ 
  days, goals = [], habits = [], activeDate, onDateChange, onToggleTaskComplete, onToggleHabitComplete, onEditTask, onOpenSidebar, onUpdateTask, theme, onOpenQuickMenu 
}) => {
  const activeDay = days.find(d => d.date === activeDate);
  const todayDate = new Date().getDate();
  const hours = Array.from({ length: 16 }, (_, i) => i + 7);
  const [now, setNow] = useState(new Date());
  const hourRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
  const [indicatorTop, setIndicatorTop] = useState<number | null>(null);
  const [planningHour, setPlanningHour] = useState<number | null>(null);
  const [assignTab, setAssignTab] = useState<'tasks' | 'habits'>('tasks');

  const themeGradient = `linear-gradient(135deg, ${theme.color}, ${theme.color}99)`;

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useLayoutEffect(() => {
    const h = now.getHours();
    const m = now.getMinutes();
    if (h >= 7 && h <= 22) {
      const el = hourRefs.current[h];
      if (el) {
        const top = el.offsetTop + (m / 60) * el.offsetHeight;
        setIndicatorTop(top);
      }
    } else {
      setIndicatorTop(null);
    }
  }, [now, activeDay?.tasks, habits, activeDate]); 

  const getKrInfo = (krId?: string) => {
    if (!krId) return null;
    for (const g of goals) {
      const kr = g.keyResults.find(k => k.id === krId);
      if (kr) return { goal: g.title, kr: kr.title };
    }
    return null;
  };

  const getTimeAgo = (timestamp?: number) => {
    if (!timestamp) return '未开始';
    const diffDays = Math.floor((Date.now() - timestamp) / (1000 * 60 * 60 * 24));
    return diffDays === 0 ? '今天' : `${diffDays}天前`;
  };

  const renderPlanningModal = () => {
    if (planningHour === null) return null;
    return createPortal(
      <div className="fixed inset-0 z-[600] bg-slate-900/60 flex items-end justify-center p-4" onClick={() => setPlanningHour(null)}>
        <div className="bg-white w-full max-w-md rounded-sm p-6 shadow-2xl animate-in slide-in-from-bottom duration-300 flex flex-col max-h-[80vh] overflow-hidden" onClick={e => e.stopPropagation()}>
          <div className="flex justify-between mb-4">
            <span className="text-xl font-black text-slate-800 mono">安排到 {planningHour}:00</span>
            <button onClick={() => setPlanningHour(null)}><X size={24}/></button>
          </div>
          <div className="flex gap-6 mb-4 border-b border-slate-50">
            {['tasks', 'habits'].map(t => (
              <button key={t} onClick={() => setAssignTab(t as any)} className={`pb-2 text-[11px] font-black uppercase tracking-widest relative ${assignTab === t ? 'text-slate-800' : 'text-slate-300'}`}>
                {t === 'tasks' ? '待办事项' : '习惯'}
                {assignTab === t && <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: themeGradient }} />}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto no-scrollbar space-y-2">
            {assignTab === 'habits' ? (
              habits?.map(h => {
                const krInfo = getKrInfo(h.krId);
                return (
                  <div key={h.id} onClick={() => { onToggleHabitComplete(h.id, planningHour); setPlanningHour(null); }} className="p-4 bg-slate-50 rounded-sm flex items-center justify-between cursor-pointer border border-transparent hover:border-slate-100">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-700">{h.title}</span>
                      {krInfo && <span className="text-[8px] font-black text-blue-400 uppercase tracking-widest mt-0.5">{krInfo.goal} · {krInfo.kr}</span>}
                    </div>
                    <div className="flex items-center gap-3">
                       <span className="text-[9px] font-black text-slate-300 uppercase">{h.frequencyDays}d/{h.frequencyTimes}t</span>
                       <CheckCircle2 size={16} className="text-slate-200" />
                    </div>
                  </div>
                );
              })
            ) : (
              activeDay?.tasks.filter(t => !t.time).map(t => {
                const krInfo = getKrInfo(t.krId);
                return (
                  <div key={t.id} onClick={() => { onUpdateTask({...t, time: `${planningHour < 10 ? '0' + planningHour : planningHour}:00`}); setPlanningHour(null); }} className="p-4 bg-slate-50 rounded-sm flex flex-col cursor-pointer border border-transparent hover:border-slate-100">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-slate-700">{t.title}</span>
                      <ListTodo size={16} className="text-slate-200" />
                    </div>
                    {krInfo && <span className="text-[8px] font-black text-blue-400 uppercase mt-0.5">{krInfo.goal}</span>}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>,
      document.body
    );
  };

  return (
    <div className="h-full flex flex-col bg-white overflow-hidden relative">
      <header className="px-6 pt-16 pb-4 bg-white shrink-0 z-10">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={onOpenSidebar} className="p-1 -ml-1 text-slate-400"><Menu size={20}/></button>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-4 rounded-full" style={{ background: themeGradient }} />
            <h1 className="text-lg font-black tracking-tighter uppercase truncate">日程 / DAILY</h1>
          </div>
        </div>
        <div className="flex justify-between gap-1 overflow-x-auto no-scrollbar pb-1">
          {days.map(day => {
            const isActive = day.date === activeDate;
            const isToday = day.date === todayDate;
            return (
              <button 
                key={day.date} 
                onClick={() => onDateChange(day.date)} 
                className={`flex-1 min-w-[44px] flex flex-col items-center py-2.5 rounded-sm transition-all relative ${isActive ? 'text-white shadow-md' : 'text-slate-400 bg-slate-50'}`} 
                style={{ background: isActive ? themeGradient : undefined }}
              >
                <span className={`text-[8px] font-black uppercase mb-1 ${isActive ? 'opacity-60' : 'opacity-40'}`}>{day.weekday}</span>
                <span className="text-sm font-black mono">{day.date}</span>
                {isToday && (
                  <div className={`absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${isActive ? 'bg-white' : 'bg-rose-500'}`} />
                )}
              </button>
            );
          })}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto no-scrollbar px-6 pt-4 pb-24 relative">
        <div className="relative">
          {indicatorTop !== null && activeDate === todayDate && (
            <div className="absolute left-0 right-0 z-20 flex items-center gap-2 pointer-events-none" style={{ top: `${indicatorTop}px`, transform: 'translateY(-50%)' }}>
              <div className="w-2.5 h-2.5 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.3)] z-30" style={{ backgroundColor: theme.color }} />
              <div className="flex-1 h-[2px] z-20" style={{ backgroundColor: theme.color }} />
            </div>
          )}
          {hours.map(hour => {
            const hourStr = `${hour < 10 ? '0' + hour : hour}:00`;
            const hTasks = activeDay?.tasks.filter(t => t.time === hourStr);
            const hHabits = habits.filter(h => h.completionTimes?.includes(hourStr));
            
            return (
              <div key={hour} ref={el => hourRefs.current[hour] = el} className="flex gap-4 min-h-[56px]">
                <div className="w-10 shrink-0 text-[10px] font-black text-slate-200 mono pt-1.5 uppercase cursor-pointer" onClick={() => setPlanningHour(hour)}>
                  {hour < 10 ? '0' + hour : hour}:00
                </div>
                <div className="flex-1 border-t border-slate-50 pt-1.5 pb-2 cursor-pointer" onClick={() => setPlanningHour(hour)}>
                  <div className="flex flex-wrap gap-1.5 mb-1.5">
                    {hHabits.map(h => {
                      const Icon = HABIT_ICONS[h.iconName || 'Activity'];
                      const krInfo = getKrInfo(h.krId);
                      const habitProgress = h.targetCount ? Math.min(100, ((h.accumulatedCount || 0) / h.targetCount) * 100) : 0;
                      return (
                        <div 
                          key={h.id + hourStr} 
                          className="group relative flex flex-col gap-0.5 px-3 py-2 rounded-sm shadow-md border-none min-w-[120px] overflow-hidden transition-transform active:scale-95" 
                          style={{ background: h.color }}
                        >
                          {/* 融合进度条：使用半透明黑色覆盖背景 */}
                          <div 
                            className="absolute inset-y-0 left-0 transition-all duration-1000 pointer-events-none bg-black/15 z-0" 
                            style={{ width: `${habitProgress}%` }} 
                          />
                          
                          <div className="flex items-center gap-1.5 relative z-10 text-white">
                             <Icon size={11} strokeWidth={3} />
                             <span className="text-[10px] font-black uppercase tracking-tighter truncate max-w-[100px]">
                               {h.title} 
                             </span>
                             <span className="text-[8px] font-bold opacity-60 ml-auto mono">
                               {h.accumulatedCount}/{h.targetCount}
                             </span>
                          </div>
                          <div className="flex items-center justify-between mt-0.5 relative z-10 text-white/70">
                             <span className="text-[7px] font-black uppercase tracking-widest">{h.frequencyDays}d/{h.frequencyTimes}t</span>
                             {krInfo && <span className="text-[7px] font-black uppercase tracking-tight truncate max-w-[60px]">{krInfo.goal}</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {hTasks?.map(task => {
                    const krInfo = getKrInfo(task.krId);
                    const progress = task.targetCount ? Math.min(100, ((task.accumulatedCount || 0) / task.targetCount) * 100) : (task.completed ? 100 : 0);
                    return (
                      <div key={task.id} className="relative rounded-sm mb-2 overflow-hidden shadow-sm border border-slate-100" 
                        onClick={e => { e.stopPropagation(); onToggleTaskComplete(task.id); }}
                        onContextMenu={e => { e.preventDefault(); e.stopPropagation(); onEditTask(task); }}
                      >
                        <div className="absolute inset-y-0 left-0 transition-all duration-700 pointer-events-none opacity-20" style={{ width: `${progress}%`, background: theme.color }} />
                        <div className="p-3 bg-white/60 backdrop-blur-sm flex flex-col gap-1 relative z-10">
                          <div className="flex items-start justify-between">
                            <div className="flex flex-col">
                              <h4 className={`text-[12px] font-bold text-slate-800 transition-all ${task.completed ? 'line-through opacity-40' : ''}`}>{task.title}</h4>
                              {krInfo && <span className="text-[8px] font-black text-blue-500 uppercase mt-0.5">{krInfo.goal} · {krInfo.kr}</span>}
                            </div>
                            <div className="mt-0.5" style={{ color: theme.color }}>
                              {task.completed ? <CheckCircle2 size={16} strokeWidth={3} /> : (task.targetCount ? <span className="text-[9px] font-black mono opacity-40">{task.accumulatedCount}/{task.targetCount}</span> : <Square size={16} strokeWidth={3} />)}
                            </div>
                          </div>
                          <span className="text-[7px] font-black text-slate-300 uppercase tracking-widest mt-1">上次完成: {getTimeAgo(task.lastCompletedAt)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </main>
      {renderPlanningModal()}
    </div>
  );
};

export default DailyDetailPage;
