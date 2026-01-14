
import React, { useState, useMemo } from 'react';
import { DayInfo, ThemeOption, Task, Goal } from '../types';
import { Plus, Check, Hash, Bookmark, ChevronLeft, ChevronRight, Menu, Target } from 'lucide-react';

interface OverviewPageProps {
  days: DayInfo[];
  theme: ThemeOption;
  activeDate: number;
  onDateChange: (date: number) => void;
  onAddTask: (task: Task) => void;
  onOpenSidebar: () => void;
  library: Task[];
  goals: Goal[];
}

const OverviewPage: React.FC<OverviewPageProps> = ({ days, theme, activeDate, onDateChange, onAddTask, onOpenSidebar, library, goals }) => {
  const todayDate = new Date().getDate();
  const [libraryFilter, setLibraryFilter] = useState<'goal' | 'category'>('category');
  const [weekOffset, setWeekOffset] = useState(0); // -1: 上周, 0: 本周, 1: 下周

  const themeGradient = `linear-gradient(135deg, ${theme.color}, ${theme.color}99)`;

  // 计算当前显示的周日期数据
  const displayDays = useMemo(() => {
    const now = new Date();
    // 获取当前周的周一
    const day = now.getDay() || 7;
    const monday = new Date(now);
    monday.setDate(now.getDate() - day + 1 + (weekOffset * 7));

    const week: DayInfo[] = [];
    const weekdays = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateVal = d.getDate();
      
      // 尝试匹配 props 中传入的 days 里的任务
      const existingDay = days.find(day => day.date === dateVal);
      
      week.push({
        date: dateVal,
        weekday: weekdays[i],
        fullDate: `${d.getMonth() + 1}月${dateVal}日`,
        tasks: existingDay ? existingDay.tasks : []
      });
    }
    return week;
  }, [weekOffset, days]);

  const activeDayTasks = useMemo(() => {
    return days.find(d => d.date === activeDate)?.tasks || [];
  }, [days, activeDate]);

  const isTaskInActiveDay = (taskId: string) => {
    return activeDayTasks.some(t => t.originalId === taskId);
  };

  const dateRangeString = useMemo(() => {
    const start = displayDays[0].fullDate;
    const end = displayDays[6].fullDate;
    return `${start} - ${end}`;
  }, [displayDays]);

  const categories = Array.from(new Set(library.map(t => t.category)));

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
    const diff = Date.now() - timestamp;
    const daysAgo = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (daysAgo === 0) return '今天';
    return `${daysAgo}天前`;
  };

  const renderLibraryContent = () => {
    if (libraryFilter === 'category') {
      return (
        <div className="space-y-6">
          {categories.map(cat => {
            const tasksInCategory = library.filter(t => t.category === cat);
            if (tasksInCategory.length === 0) return null;
            return (
              <div key={cat} className="space-y-1.5">
                <h4 className="text-[9px] font-black text-slate-300 uppercase tracking-widest pl-1 mb-2 flex items-center gap-1">
                  <Hash size={8} /> {cat}
                </h4>
                {tasksInCategory.map((task) => {
                  const added = isTaskInActiveDay(task.id);
                  const krInfo = getKrInfo(task.krId);
                  const hasTarget = task.targetCount && task.targetCount > 0;
                  const progress = hasTarget ? Math.min(100, ((task.accumulatedCount || 0) / task.targetCount!) * 100) : 0;
                  return (
                    <button
                      key={task.id}
                      onClick={() => onAddTask(task)}
                      className={`w-full flex flex-col p-3 rounded-sm flat-card group active:scale-95 transition-all shadow-[0_4px_12px_rgba(0,0,0,0.03)] relative overflow-hidden text-left border ${added ? 'bg-slate-50 border-slate-200' : 'bg-white border-slate-100'}`}
                      style={{ borderColor: added ? theme.color + '44' : undefined }}
                    >
                      {hasTarget && (
                        <div 
                          className="absolute inset-y-0 left-0 z-0 transition-all duration-500" 
                          style={{ width: `${progress}%`, background: themeGradient, opacity: 0.12 }} 
                        />
                      )}
                      <div className="flex items-center justify-between w-full mb-1 z-10 relative">
                        <span className={`text-[11px] font-bold truncate pr-4 transition-colors ${added ? 'text-slate-900' : 'text-slate-700'}`}>{task.title}</span>
                        <div 
                          className={`w-4 h-4 rounded-sm flex items-center justify-center transition-all shrink-0 ${added ? 'text-white' : 'bg-slate-50 text-slate-300'}`}
                          style={{ backgroundColor: added ? theme.color : undefined }}
                        >
                          {added ? <Check size={10} strokeWidth={4} /> : <Plus size={10} />}
                        </div>
                      </div>
                      <div className="flex flex-col gap-0.5 z-10 relative opacity-60">
                        <div className="flex items-center gap-2">
                          <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest">{task.category}</span>
                          {krInfo && <span className="text-[7px] font-black text-blue-400 uppercase">/ {krInfo.kr}</span>}
                        </div>
                        <div className="flex items-center justify-between mt-0.5">
                          <span className="text-[7px] font-black text-slate-300 mono">{getTimeAgo(task.lastCompletedAt)}</span>
                          {hasTarget && <span className="text-[7px] font-black text-slate-400 mono">{task.accumulatedCount}/{task.targetCount}</span>}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {goals.map(goal => {
           const relatedTasks = library.filter(t => goal.keyResults.some(kr => kr.id === t.krId));
           if (relatedTasks.length === 0) return null;
           return (
             <div key={goal.id} className="space-y-3">
               <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1 mb-2 flex items-center gap-1.5">
                 <Target size={10} style={{ color: theme.color }} /> {goal.title}
               </h4>
               {goal.keyResults.map(kr => {
                 const krTasks = library.filter(t => t.krId === kr.id);
                 if (krTasks.length === 0) return null;
                 return (
                   <div key={kr.id} className="space-y-1.5 ml-2 border-l border-slate-100 pl-3">
                     <span className="text-[8px] font-black text-blue-400 uppercase tracking-widest mb-1 block">KR: {kr.title}</span>
                     {krTasks.map(task => {
                        const added = isTaskInActiveDay(task.id);
                        const hasTarget = task.targetCount && task.targetCount > 0;
                        const progress = hasTarget ? Math.min(100, ((task.accumulatedCount || 0) / task.targetCount!) * 100) : 0;
                        return (
                          <button
                              key={task.id}
                              onClick={() => onAddTask(task)}
                              className={`w-full flex flex-col p-3 rounded-sm flat-card group active:scale-95 transition-all shadow-[0_4px_12px_rgba(0,0,0,0.03)] text-left border relative overflow-hidden ${added ? 'bg-slate-50 border-slate-200' : 'bg-white border-slate-100'}`}
                              style={{ borderColor: added ? theme.color + '44' : undefined }}
                            >
                              {hasTarget && (
                                <div 
                                  className="absolute inset-y-0 left-0 z-0 transition-all duration-500" 
                                  style={{ width: `${progress}%`, background: themeGradient, opacity: 0.12 }} 
                                />
                              )}
                              <div className="flex items-center justify-between w-full mb-1 z-10 relative">
                                <span className={`text-[11px] font-bold truncate pr-4 transition-colors ${added ? 'text-slate-900' : 'text-slate-700'}`}>{task.title}</span>
                                <div 
                                  className={`w-4 h-4 rounded-sm flex items-center justify-center transition-all shrink-0 ${added ? 'text-white' : 'bg-slate-50 text-slate-300'}`}
                                  style={{ backgroundColor: added ? theme.color : undefined }}
                                >
                                  {added ? <Check size={10} strokeWidth={4} /> : <Plus size={10} />}
                                </div>
                              </div>
                              <div className="flex items-center justify-between z-10 relative opacity-60">
                                <span className="text-[7px] font-black text-slate-300 uppercase tracking-widest">{task.category}</span>
                                {hasTarget && <span className="text-[7px] font-black text-slate-400 mono">{task.accumulatedCount}/{task.targetCount}</span>}
                              </div>
                            </button>
                        );
                     })}
                   </div>
                 );
               })}
             </div>
           );
        })}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-white overflow-hidden">
      <header className="px-6 pt-16 pb-4 shrink-0 bg-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button onClick={onOpenSidebar} className="p-1 -ml-1 text-slate-400 active:scale-90 transition-transform">
              <Menu size={20} strokeWidth={2.5} />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-4 rounded-full" style={{ background: themeGradient }} />
              <h1 className="text-lg font-black tracking-tighter uppercase">WEEKLY / 概览</h1>
            </div>
          </div>
        </div>
        
        {/* 周切换选择器 */}
        <div className="flex items-center justify-between bg-slate-50 rounded-sm px-1 py-1">
          <button 
            onClick={() => setWeekOffset(Math.max(-1, weekOffset - 1))}
            className={`p-2 transition-colors ${weekOffset === -1 ? 'text-slate-200 pointer-events-none' : 'text-slate-400 hover:text-slate-800'}`}
          >
            <ChevronLeft size={16} />
          </button>
          <div className="flex-1 text-center">
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-0.5">
              {weekOffset === -1 ? 'LAST WEEK' : weekOffset === 1 ? 'NEXT WEEK' : 'THIS WEEK'}
            </span>
            <span className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-800">
              {dateRangeString}
            </span>
          </div>
          <button 
            onClick={() => setWeekOffset(Math.min(1, weekOffset + 1))}
            className={`p-2 transition-colors ${weekOffset === 1 ? 'text-slate-200 pointer-events-none' : 'text-slate-400 hover:text-slate-800'}`}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        <div className="w-1/2 flex flex-col bg-white border-0">
          <div className="px-5 py-2">
            <h3 className="text-[9px] font-black text-slate-300 uppercase tracking-widest">计划流</h3>
          </div>
          <div className="flex-1 overflow-y-auto no-scrollbar px-2 space-y-1.5 pb-24">
            {displayDays.map((day) => {
              const isActive = day.date === activeDate;
              const isToday = day.date === todayDate && weekOffset === 0;
              return (
                <div 
                  key={day.date}
                  onClick={() => onDateChange(day.date)}
                  className={`w-full flex flex-col p-3 rounded-sm transition-all cursor-pointer relative ${
                    isActive ? 'shadow-[0_12px_24px_-8px_rgba(0,0,0,0.2)] z-10' : 'bg-slate-50/50 hover:bg-slate-50'
                  }`}
                  style={{ background: isActive ? themeGradient : undefined }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[8px] font-black uppercase leading-none ${isActive ? 'text-white/60' : 'text-slate-300'}`}>
                          {day.weekday}
                        </span>
                        {isToday && (
                           <span className={`text-[7px] font-black px-1 rounded-[2px] ${isActive ? 'bg-white text-rose-500' : 'bg-rose-500 text-white'}`}>
                             TODAY
                           </span>
                        )}
                      </div>
                      <span className={`text-sm font-black mono leading-none mt-0.5 ${isActive ? 'text-white' : 'text-slate-800'}`}>
                        {day.date}
                      </span>
                    </div>
                    {isActive && <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
                  </div>
                  
                  <div className="space-y-1">
                    {day.tasks.length > 0 ? (
                      day.tasks.map((task) => {
                        const hasTarget = task.targetCount && task.targetCount > 0;
                        const progress = hasTarget ? Math.min(100, ((task.accumulatedCount || 0) / task.targetCount!) * 100) : 0;
                        return (
                          <div 
                            key={task.id} 
                            className={`text-[9px] font-bold truncate px-1.5 py-0.5 rounded-[2px] flex items-center justify-between gap-1 relative overflow-hidden ${
                              isActive ? 'bg-white/20 text-white' : 'bg-white text-slate-500 shadow-sm'
                            }`}
                          >
                            {hasTarget && (
                              <div 
                                className={`absolute inset-y-0 left-0 z-0 opacity-20 ${isActive ? 'bg-white' : 'bg-slate-300'}`} 
                                style={{ width: `${progress}%` }} 
                              />
                            )}
                            <div className="flex items-center gap-1 z-10 truncate">
                              <Bookmark size={7} className={isActive ? 'text-white/40' : 'text-slate-200'} />
                              {task.title}
                            </div>
                            {hasTarget && (
                              <span className="text-[7px] font-black z-10 mono opacity-60">
                                {task.accumulatedCount}
                              </span>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <div className={`text-[8px] font-black uppercase ${isActive ? 'text-white/20' : 'text-slate-200'}`}>
                        Empty
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="w-1/2 flex flex-col bg-slate-50 border-0">
          <div className="px-4 py-3 flex items-center justify-between bg-slate-100/50 shrink-0">
            <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">任务库</h3>
            <div className="flex bg-slate-200/50 rounded-sm p-0.5">
                <button 
                  onClick={() => setLibraryFilter('goal')} 
                  className={`px-3 py-1 rounded-sm text-[8px] font-black uppercase tracking-widest transition-all ${
                    libraryFilter === 'goal' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-500'
                  }`}
                >
                  目标
                </button>
                <button 
                  onClick={() => setLibraryFilter('category')} 
                  className={`px-3 py-1 rounded-sm text-[8px] font-black uppercase tracking-widest transition-all ${
                    libraryFilter === 'category' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-500'
                  }`}
                >
                  分类
                </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto no-scrollbar px-3 space-y-1 pt-4 pb-24">
            {renderLibraryContent()}
          </div>
        </div>
      </main>
    </div>
  );
};

export default OverviewPage;
