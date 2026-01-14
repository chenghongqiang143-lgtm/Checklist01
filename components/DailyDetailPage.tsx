
import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { DayInfo, ThemeOption, Task, Goal, Habit } from '../types';
import { CheckSquare, Square, Target, Menu, BarChart3, Activity, ListTodo, X, Flame, CheckCircle2, Plus, Bookmark } from 'lucide-react';

import { Book, Coffee, Heart, Smile, Star, Dumbbell, GlassWater, Moon, Sun, Laptop, Music, Camera, Brush, MapPin } from 'lucide-react';
const HABIT_ICONS: any = { Activity, Book, Coffee, Heart, Smile, Star, Dumbbell, GlassWater, Moon, Sun, Laptop, Music, Camera, Brush, MapPin };

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
  days, goals = [], habits = [], activeDate, onDateChange, onToggleLibrary, onToggleTaskComplete, onToggleHabitComplete, onEditTask, onOpenSidebar, onUpdateTask, theme, onOpenQuickMenu 
}) => {
  const activeDay = days.find(d => d.date === activeDate);
  const todayDate = new Date().getDate();
  const hours = Array.from({ length: 16 }, (_, i) => i + 7);
  const [now, setNow] = useState(new Date());
  const hourRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
  const mainRef = useRef<HTMLElement | null>(null);
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
      if (el) {
        const top = el.offsetTop + (m / 60) * el.offsetHeight;
        setIndicatorTop(top);
      }
    } else {
      setIndicatorTop(null);
    }
  }, [now, activeDay?.tasks, habits]); 

  const getTimeAgo = (timestamp?: number) => {
    if (!timestamp) return '未开始';
    const diff = Date.now() - timestamp;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    return days === 0 ? '今天' : days === 1 ? '昨天' : `${days}天前`;
  };

  const getKrTitle = (krId?: string) => {
    if (!krId) return null;
    for (const g of goals) {
      const kr = g.keyResults.find(k => k.id === krId);
      if (kr) return kr.title;
    }
    return null;
  };

  // 修复：将局部弹窗挂载到 Body 避免 transform 导致的位置失效
  const renderPlanningModal = () => {
    if (planningHour === null) return null;
    return createPortal(
      <div className="fixed inset-0 z-[600] bg-slate-900/60 flex items-end justify-center p-4" onClick={() => setPlanningHour(null)}>
        <div className="bg-white w-full max-w-md rounded-sm p-6 shadow-2xl animate-in slide-in-from-bottom duration-300 flex flex-col max-h-[80vh] overflow-hidden" onClick={e => e.stopPropagation()}>
          <div className="flex justify-between mb-4">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-slate-300 uppercase">分配到时间点</span>
              <span className="text-xl font-black text-slate-800 mono">{planningHour}:00</span>
            </div>
            <button onClick={() => setPlanningHour(null)} className="p-2 -mr-2 text-slate-300 active:scale-90 transition-transform"><X size={24}/></button>
          </div>
          <div className="flex gap-6 mb-4 border-b border-slate-50">
            {['tasks', 'habits'].map(t => (
              <button key={t} onClick={() => setAssignTab(t as any)} className={`pb-2 text-[11px] font-black uppercase tracking-widest relative ${assignTab === t ? 'text-slate-800' : 'text-slate-300'}`}>
                {t === 'tasks' ? '待办事项' : '习惯坚持'}
                {assignTab === t && <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: theme.color }} />}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto no-scrollbar space-y-2 pb-2">
            {assignTab === 'habits' ? (
              habits?.map(h => {
                const Icon = HABIT_ICONS[h.iconName||'Activity'];
                const isAssigned = h.remark === `${planningHour < 10 ? '0' + planningHour : planningHour}:00`;
                return (
                  <div key={h.id} onClick={() => { onToggleHabitComplete(h.id, planningHour); setPlanningHour(null); }} className={`p-4 rounded-sm flex items-center justify-between cursor-pointer active:scale-[0.98] transition-all border ${isAssigned ? 'bg-slate-100 border-slate-200' : 'bg-slate-50 border-transparent'}`}>
                    <div className="flex items-center gap-3 truncate">
                      <div className="w-8 h-8 rounded-sm bg-white flex items-center justify-center shadow-sm shrink-0"><Icon size={16} style={{ color: h.color }} /></div>
                      <div className="flex flex-col truncate">
                        <span className="text-sm font-bold text-slate-700 truncate">{h.title}</span>
                        <span className="text-[8px] font-black uppercase text-slate-400">{h.remark ? `已安排: ${h.remark}` : '未排期'}</span>
                      </div>
                    </div>
                    <CheckCircle2 size={16} className={`${isAssigned ? 'text-green-500' : 'text-slate-200'} shrink-0`} />
                  </div>
                );
              })
            ) : (
              activeDay?.tasks
                .filter(t => !t.time && (!t.targetCount || (t.accumulatedCount || 0) < t.targetCount))
                .map(t => (
                  <div key={t.id} onClick={() => { onUpdateTask({...t, time: `${planningHour < 10 ? '0' + planningHour : planningHour}:00`}); setPlanningHour(null); }} className="p-4 bg-slate-50 rounded-sm flex justify-between items-center cursor-pointer active:scale-[0.98] transition-all border border-transparent hover:border-slate-100 shadow-sm">
                    <span className="text-sm font-bold text-slate-700 truncate">{t.title}</span>
                    <ListTodo size={16} className="text-slate-200 shrink-0" />
                  </div>
                ))
            )}
            {(assignTab === 'tasks' && activeDay?.tasks.filter(t => !t.time).length === 0) && (
              <div className="py-12 text-center text-[10px] font-black text-slate-200 uppercase tracking-widest italic">没有可分配的空闲待办</div>
            )}
          </div>
        </div>
      </div>,
      document.body
    );
  };

  return (
    <div className="h-full flex flex-col bg-white relative">
      <header className="px-6 pt-16 pb-4 bg-white shrink-0 shadow-sm z-10">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={onOpenSidebar} className="p-1 -ml-1 text-slate-400 active:scale-90 transition-transform"><Menu size={20} strokeWidth={2.5} /></button>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-4 rounded-full" style={{ background: theme.color }} />
            <h1 className="text-lg font-black tracking-tighter uppercase truncate">日程 / DAILY</h1>
          </div>
        </div>
        <div className="flex justify-between gap-1 overflow-x-auto no-scrollbar pb-1">
          {days.map(day => {
            const isToday = day.date === todayDate;
            const isActive = day.date === activeDate;
            return (
              <button 
                key={day.date} 
                onClick={() => onDateChange(day.date)} 
                className={`flex-1 min-w-[44px] flex flex-col items-center py-2.5 rounded-sm transition-all relative shadow-[0_2px_8px_rgba(0,0,0,0.02)] ${isActive ? 'text-white' : 'text-slate-400 bg-slate-50/50'}`} 
                style={{ background: isActive ? theme.color : undefined }}
              >
                <span className={`text-[8px] font-black uppercase mb-1 ${isActive ? 'opacity-60' : 'opacity-40'}`}>{day.weekday}</span>
                <span className="text-sm font-black mono leading-none">{day.date}</span>
                {isToday && !isActive && (
                  <div className="absolute top-1 right-1 w-1 h-1 rounded-full animate-pulse" style={{ backgroundColor: theme.color }} />
                )}
              </button>
            );
          })}
        </div>
      </header>

      <main ref={mainRef} className="flex-1 overflow-y-auto no-scrollbar px-6 pt-4 pb-24 relative">
        <div className="relative">
          {indicatorTop !== null && activeDate === todayDate && (
            <div className="absolute left-0 right-0 z-20 flex items-center gap-2 pointer-events-none transition-all duration-300" style={{ top: `${indicatorTop}px`, transform: 'translateY(-50%)' }}>
              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: theme.color }} />
              <div className="flex-1 h-[1px]" style={{ backgroundColor: `${theme.color}40` }} />
              <div className="bg-white px-1.5 py-0.5 rounded shadow-sm border border-slate-100 flex items-center gap-1">
                 <span className="text-[9px] font-black mono" style={{ color: theme.color }}>{now.getHours()}:{now.getMinutes().toString().padStart(2, '0')}</span>
              </div>
            </div>
          )}
          {hours.map(hour => {
            const hTasks = activeDay?.tasks.filter(t => t.time === `${hour < 10 ? '0' + hour : hour}:00`);
            const hHabits = habits.filter(h => h.completedToday && h.remark === `${hour < 10 ? '0' + hour : hour}:00`);
            return (
              <div key={hour} ref={el => hourRefs.current[hour] = el} className="flex gap-4 min-h-[52px]">
                <div className="w-10 shrink-0 text-[10px] font-black text-slate-200 mono pt-1.5 uppercase cursor-pointer" onClick={() => setPlanningHour(hour)}>
                  {hour < 10 ? '0' + hour : hour}:00
                </div>
                <div className="flex-1 border-t border-slate-50 pt-1.5 pb-2 cursor-pointer" onClick={() => (hTasks?.length === 0 && hHabits.length === 0) && setPlanningHour(hour)}>
                  <div className="flex flex-wrap gap-1.5 mb-1">
                    {hHabits.map(h => {
                      const Icon = HABIT_ICONS[h.iconName || 'Activity'];
                      const progress = h.targetCount ? Math.min(100, ((h.accumulatedCount || 0) / h.targetCount) * 100) : 100;
                      return (
                        <div key={h.id} className="group relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-sm shadow-sm animate-in zoom-in-95 overflow-hidden border whitespace-nowrap" style={{ backgroundColor: h.color + '10', borderColor: h.color + '20' }}>
                          <div className="absolute inset-y-0 left-0 transition-all duration-500 ease-out" style={{ width: `${progress}%`, background: h.color, opacity: 0.1 }} />
                          <Icon size={11} style={{ color: h.color }} strokeWidth={3} className="relative z-10" />
                          <span className="text-[9px] font-black uppercase text-slate-800 tracking-tighter relative z-10 truncate max-w-[80px]">{h.title}</span>
                        </div>
                      );
                    })}
                  </div>
                  {hTasks?.map(task => {
                    const hasTarget = task.targetCount && task.targetCount > 0;
                    const progress = hasTarget ? Math.min(100, ((task.accumulatedCount || 0) / task.targetCount!) * 100) : (task.completed ? 100 : 0);
                    const krTitle = getKrTitle(task.krId);
                    return (
                      <div key={task.id} className="group relative p-2.5 rounded-sm mb-1.5 flat-card shadow-[0_2px_10px_rgba(0,0,0,0.03)] flex items-start gap-2.5 bg-slate-50 overflow-hidden border border-slate-100/50" onClick={e => { e.stopPropagation(); onEditTask(task); }}>
                        <div className="absolute inset-y-0 left-0 z-0 transition-all duration-500 ease-out" style={{ width: `${progress}%`, background: theme.color, opacity: 0.1 }} />
                        <button className="z-10 relative mt-0.5 shrink-0" onClick={e => { e.stopPropagation(); onToggleTaskComplete(task.id); }} style={{ color: theme.color }}>
                          {task.completed ? <CheckSquare size={16} strokeWidth={3} /> : <Square size={16} strokeWidth={3} />}
                        </button>
                        <div className="flex-1 z-10 relative flex flex-col gap-0.5 min-w-0">
                          <h4 className={`text-[13px] font-bold text-slate-800 truncate ${task.completed ? 'line-through opacity-40' : ''}`}>{task.title}</h4>
                          <div className="flex items-center gap-x-2 opacity-60 overflow-hidden">
                            <span className="text-[7px] font-black uppercase tracking-widest text-slate-400 bg-slate-200/50 px-1 rounded-sm shrink-0">{task.category}</span>
                            {krTitle && <span className="text-[7px] font-black text-blue-500 uppercase flex items-center gap-0.5 truncate shrink"><Target size={8}/> {krTitle}</span>}
                            <span className="text-[7px] font-black text-slate-400 mono ml-auto shrink-0">{getTimeAgo(task.lastCompletedAt)}</span>
                          </div>
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

      <div className="fixed right-6 bottom-28 z-[150] hide-on-keyboard">
         <button onClick={onOpenQuickMenu} className="w-14 h-14 rounded-sm shadow-xl flex items-center justify-center text-white active:scale-90 transition-transform" style={{ background: theme.color }}>
            <Plus size={28} />
         </button>
      </div>

      {renderPlanningModal()}
    </div>
  );
};

export default DailyDetailPage;
