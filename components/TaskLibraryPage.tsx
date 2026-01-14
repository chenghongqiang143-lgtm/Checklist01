
import React, { useState } from 'react';
import { ThemeOption, Task, Goal, Habit } from '../types';
import { Search, Hash, Target, Flame, Bookmark, Settings2, Menu, BarChart3, Activity, Book, Coffee, Heart, Smile, Star, Dumbbell, GlassWater, Moon, Sun, Laptop, Plus, ChevronRight, X, Music, Camera, Brush, MapPin, ListTodo } from 'lucide-react';

const HABIT_ICONS: any = { Activity, Book, Coffee, Heart, Smile, Star, Dumbbell, GlassWater, Moon, Sun, Laptop, Music, Camera, Brush, MapPin };

interface TaskLibraryPageProps {
  theme: ThemeOption;
  library: Task[];
  habits: Habit[];
  goals: Goal[];
  onAddTask: (task: Task) => void;
  onEditTask: (task: Task) => void;
  onEditGoal: (goal: Goal) => void;
  onEditHabit: (habit: Habit) => void;
  onToggleHabitComplete: (habitId: string) => void;
  onDeleteHabit: (habitId: string) => void;
  onDeleteGoal: (goalId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onOpenSidebar: () => void;
  onCreateItem: (type: 'task' | 'habit' | 'goal', defaultCategory?: string) => void;
  allTasks: Task[];
}

const TaskLibraryPage: React.FC<TaskLibraryPageProps> = ({ theme, library, habits, goals, onEditTask, onEditGoal, onEditHabit, onOpenSidebar, onCreateItem }) => {
  const [activeMainTab, setActiveMainTab] = useState<'task' | 'habit' | 'goal'>('task');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  const categories = Array.from(new Set(library.map(t => t.category)));

  const getTimeAgo = (timestamp?: number) => {
    if (!timestamp) return '从未开始';
    const diff = Date.now() - timestamp;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    return days === 0 ? '今天已尝试' : `${days}天前完成`;
  };

  const getKrTitle = (krId?: string) => {
    if (!krId) return null;
    for (const g of goals) {
      const kr = g.keyResults.find(k => k.id === krId);
      if (kr) return kr.title;
    }
    return null;
  };

  const calculateKrProgress = (krId: string) => {
    const linkedTasks = library.filter(t => t.krId === krId);
    const linkedHabits = habits.filter(h => h.krId === krId);
    
    const totalTarget = 
      linkedTasks.reduce((acc, t) => acc + (t.targetCount || 1), 0) + 
      linkedHabits.reduce((acc, h) => acc + (h.targetCount || 1), 0);
    
    const totalCompleted = 
      linkedTasks.reduce((acc, t) => acc + (t.accumulatedCount || 0), 0) + 
      linkedHabits.reduce((acc, h) => acc + (h.accumulatedCount || 0), 0);
      
    if (totalTarget === 0) return 0;
    return Math.round((totalCompleted / totalTarget) * 100);
  };

  return (
    <div className="h-full flex flex-col bg-white relative animate-in slide-in-from-right duration-300">
      <header className="pt-16 shrink-0 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.02)] z-10">
         <div className="px-6 mb-4 flex justify-between items-center">
            <button onClick={onOpenSidebar} className="p-1 -ml-1 text-slate-400 active:scale-90 transition-transform"><Menu size={20}/></button>
            <div className="w-1.5 h-4 rounded-full" style={{ background: `linear-gradient(135deg, ${theme.color}, ${theme.color}80)` }} />
         </div>
         <div className="flex gap-6 mb-4 px-6 overflow-x-auto no-scrollbar items-center">
            {['task', 'habit', 'goal'].map(id => (
                <button key={id} onClick={() => setActiveMainTab(id as any)} className={`text-2xl font-black tracking-tight relative whitespace-nowrap pb-1 transition-colors ${activeMainTab === id ? 'text-slate-800' : 'text-slate-200'}`}>
                    {id === 'task' ? '任务库' : id === 'habit' ? '习惯库' : '目标库'}
                    {activeMainTab === id && (
                      <div 
                        className="absolute -bottom-1 left-0 right-0 h-1 rounded-full" 
                        style={{ background: `linear-gradient(135deg, ${theme.color}, ${theme.color}80)` }} 
                      />
                    )}
                </button>
            ))}
         </div>
         
         {activeMainTab === 'task' && (
           <div className="px-6 pb-4 flex gap-2 overflow-x-auto no-scrollbar scroll-smooth">
              <button 
                onClick={() => setSelectedCategory(null)}
                className={`px-3 py-1.5 rounded-sm text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${!selectedCategory ? 'text-white border-transparent shadow-sm' : 'text-slate-300 border-slate-100 bg-slate-50'}`}
                style={{ background: !selectedCategory ? `linear-gradient(135deg, ${theme.color}, ${theme.color}80)` : undefined }}
              >
                全部
              </button>
              {categories.map(cat => (
                <button 
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-sm text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${selectedCategory === cat ? 'text-white border-transparent shadow-sm' : 'text-slate-300 border-slate-100 bg-slate-50'}`}
                  style={{ background: selectedCategory === cat ? `linear-gradient(135deg, ${theme.color}, ${theme.color}80)` : undefined }}
                >
                  {cat}
                </button>
              ))}
           </div>
         )}
      </header>

      <main className="flex-1 overflow-y-auto px-6 pb-24 no-scrollbar pt-6 space-y-6">
        {activeMainTab === 'task' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-400">
            {categories.filter(cat => !selectedCategory || cat === selectedCategory).map(cat => (
              <section key={cat} className="space-y-3">
                 <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-1.5 pl-1"><Hash size={10} /> {cat}</h4>
                 <div className="space-y-2">
                   {library.filter(t => t.category === cat).map(task => {
                     const hasTarget = task.targetCount && task.targetCount > 0;
                     const progress = hasTarget ? Math.min(100, (task.accumulatedCount || 0) / task.targetCount! * 100) : 0;
                     return (
                       <div key={task.id} onClick={() => onEditTask(task)} className="p-4 bg-slate-50 rounded-sm flex justify-between items-center group cursor-pointer relative overflow-hidden border border-slate-100/50 shadow-[0_4px_12px_rgba(0,0,0,0.03)] active:scale-[0.99] transition-all">
                         <div className="absolute inset-y-0 left-0 transition-all duration-500" style={{ width: `${progress}%`, background: `linear-gradient(135deg, ${theme.color}, ${theme.color}60)`, opacity: 0.1 }} />
                         <div className="flex flex-col relative z-10 gap-1 w-full">
                           <span className="text-sm font-bold text-slate-700">{task.title}</span>
                           <div className="flex flex-wrap items-center gap-x-3 gap-y-1 opacity-60">
                              <span className="text-[8px] font-black uppercase bg-slate-200/50 px-1 rounded-sm">{task.category}</span>
                              {task.krId && <span className="text-[8px] font-black text-blue-500 uppercase flex items-center gap-0.5"><Target size={8}/> {getKrTitle(task.krId)}</span>}
                              <span className="text-[8px] font-black text-slate-300 mono">{getTimeAgo(task.lastCompletedAt)}</span>
                              {hasTarget && <span className="text-[8px] font-black text-slate-400 mono ml-auto">{task.accumulatedCount}/{task.targetCount}</span>}
                           </div>
                         </div>
                         <Settings2 size={14} className="text-slate-200 group-hover:text-slate-400 relative z-10 ml-2" />
                       </div>
                     );
                   })}
                 </div>
              </section>
            ))}
          </div>
        )}

        {activeMainTab === 'habit' && habits.map(habit => {
          const IconComp = HABIT_ICONS[habit.iconName] || Activity;
          const progress = habit.targetCount ? Math.min(100, ((habit.accumulatedCount || 0) / habit.targetCount) * 100) : 0;
          return (
            <div key={habit.id} className="group relative p-4 rounded-sm mb-3 flex items-center justify-between cursor-pointer active:scale-[0.98] transition-all overflow-hidden border bg-white shadow-[0_4px_12px_rgba(0,0,0,0.03)] animate-in slide-in-from-bottom-2 duration-300" style={{ borderColor: habit.color + '40' }} onClick={() => onEditHabit(habit)}>
              <div className="absolute inset-y-0 left-0 transition-all duration-500 ease-out" style={{ width: `${progress}%`, background: `linear-gradient(135deg, ${habit.color}, ${habit.color}80)`, opacity: 0.12 }} />
              <div className="flex items-center gap-4 relative z-10">
                <div className="w-10 h-10 rounded-sm bg-slate-50 flex items-center justify-center border border-slate-100"><IconComp size={18} style={{ color: habit.color }} /></div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-slate-800">{habit.title}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">{habit.category} · 每{habit.frequencyDays}天{habit.frequencyTimes}次 · {habit.accumulatedCount}/{habit.targetCount}</span>
                    {habit.krId && <Target size={10} className="text-blue-400" />}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 relative z-10">
                 <div className="px-2 py-1 rounded-sm text-[10px] font-black mono flex items-center gap-1 bg-slate-50 border border-slate-100" style={{ color: habit.color }}><Flame size={10}/>{habit.streak}</div>
                 <Settings2 size={16} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
              </div>
            </div>
          );
        })}

        {activeMainTab === 'goal' && (
          <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
            {goals.map(goal => (
              <div key={goal.id} className="p-5 bg-slate-50 rounded-sm space-y-6 cursor-pointer active:bg-slate-100 transition-all border border-slate-100/50 shadow-[0_6px_16px_rgba(0,0,0,0.03)]" onClick={() => onEditGoal(goal)}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Target size={16} style={{ color: theme.color }} />
                    <h3 className="text-base font-black text-slate-800 tracking-tight">{goal.title}</h3>
                  </div>
                  <Settings2 size={16} className="text-slate-200" />
                </div>
                <div className="space-y-6">
                  {goal.keyResults.map(kr => {
                    const progress = calculateKrProgress(kr.id);
                    const linkedTasks = library.filter(t => t.krId === kr.id);
                    const linkedHabits = habits.filter(h => h.krId === kr.id);
                    return (
                      <div key={kr.id} className="space-y-2">
                         <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            <span>{kr.title}</span>
                            <span className="mono">{progress}%</span>
                         </div>
                         <div className="h-1 bg-slate-200 rounded-full overflow-hidden mb-2">
                            <div className="h-full transition-all duration-700" style={{ width: `${progress}%`, background: `linear-gradient(135deg, ${theme.color}, ${theme.color}90)` }} />
                         </div>
                         {/* 链接的任务和习惯列表 */}
                         <div className="flex flex-wrap gap-1.5 mt-2">
                            {linkedTasks.map(t => (
                              <div key={t.id} className="flex items-center gap-1 px-2 py-0.5 bg-white rounded-sm border border-slate-100 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                                <Bookmark size={7} className="text-blue-400" />
                                <span className="text-[8px] font-bold text-slate-500 truncate max-w-[80px]">{t.title}</span>
                              </div>
                            ))}
                            {linkedHabits.map(h => (
                              <div key={h.id} className="flex items-center gap-1 px-2 py-0.5 bg-white rounded-sm border border-slate-100 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                                <Flame size={7} className="text-rose-400" />
                                <span className="text-[8px] font-bold text-slate-500 truncate max-w-[80px]">{h.title}</span>
                              </div>
                            ))}
                            {linkedTasks.length === 0 && linkedHabits.length === 0 && (
                               <span className="text-[7px] font-black text-slate-200 uppercase italic">暂无链接内容</span>
                            )}
                         </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <div className="fixed right-6 bottom-28 z-[150] flex flex-col items-end gap-3">
         <button 
           onClick={() => onCreateItem(activeMainTab as any, (activeMainTab === 'task' && selectedCategory) ? selectedCategory : undefined)} 
           className="w-14 h-14 rounded-sm shadow-xl flex items-center justify-center text-white active:scale-90 transition-transform" 
           style={{ background: `linear-gradient(135deg, ${theme.color}, ${theme.color}90)` }}
         >
            <Plus size={28} />
         </button>
      </div>
    </div>
  );
};

export default TaskLibraryPage;
