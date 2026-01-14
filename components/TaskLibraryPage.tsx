
import React, { useState } from 'react';
import { ThemeOption, Task, Goal, Habit } from '../types';
import { Hash, Target, Flame, Bookmark, Settings2, Menu, Activity, Book, Coffee, Heart, Smile, Star, Dumbbell, GlassWater, Moon, Sun, Laptop, Plus, Music, Camera, Brush, MapPin, ListTodo } from 'lucide-react';

const HABIT_ICONS: any = { Activity, Book, Coffee, Heart, Smile, Star, Dumbbell, GlassWater, Moon, Sun, Laptop, Music, Camera, Brush, MapPin };

interface TaskLibraryPageProps {
  theme: ThemeOption;
  library: Task[];
  habits: Habit[];
  goals: Goal[];
  onEditTask: (task: Task) => void;
  onEditGoal: (goal: Goal) => void;
  onEditHabit: (habit: Habit) => void;
  onOpenSidebar: () => void;
  onCreateItem: (type: 'task' | 'habit' | 'goal', defaultCategory?: string) => void;
}

const TaskLibraryPage: React.FC<TaskLibraryPageProps> = ({ theme, library, habits, goals, onEditTask, onEditGoal, onEditHabit, onOpenSidebar, onCreateItem }) => {
  const [activeMainTab, setActiveMainTab] = useState<'task' | 'habit' | 'goal'>('task');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  const categories = Array.from(new Set(library.map(t => t.category)));

  const calculateKrProgress = (krId: string) => {
    const linkedTasks = library.filter(t => t.krId === krId);
    const linkedHabits = habits.filter(h => h.krId === krId);
    const totalTarget = linkedTasks.reduce((acc, t) => acc + (t.targetCount || 1), 0) + linkedHabits.reduce((acc, h) => acc + (h.targetCount || 1), 0);
    const totalCompleted = linkedTasks.reduce((acc, t) => acc + (t.accumulatedCount || 0), 0) + linkedHabits.reduce((acc, h) => acc + (h.accumulatedCount || 0), 0);
    if (totalTarget === 0) return 0;
    return Math.round((totalCompleted / totalTarget) * 100);
  };

  return (
    <div className="h-full flex flex-col bg-white relative">
      <header className="pt-16 shrink-0 bg-white shadow-sm z-10">
         <div className="px-6 mb-4 flex justify-between items-center">
            <button onClick={onOpenSidebar} className="p-1 -ml-1 text-slate-400 active:scale-90 transition-transform"><Menu size={20}/></button>
            <div className="w-1.5 h-4 rounded-full" style={{ background: theme.color }} />
         </div>
         <div className="flex gap-6 mb-4 px-6 overflow-x-auto no-scrollbar items-center">
            {['task', 'habit', 'goal'].map(id => (
                <button key={id} onClick={() => setActiveMainTab(id as any)} className={`text-2xl font-black tracking-tight relative whitespace-nowrap pb-1 transition-colors ${activeMainTab === id ? 'text-slate-800' : 'text-slate-200'}`}>
                    {id === 'task' ? '任务' : id === 'habit' ? '习惯' : '目标'}
                    {activeMainTab === id && <div className="absolute -bottom-1 left-0 right-0 h-1 rounded-full" style={{ background: theme.color }} />}
                </button>
            ))}
         </div>
         
         {activeMainTab === 'task' && (
           <div className="px-6 pb-4 flex gap-2 overflow-x-auto no-scrollbar scroll-smooth">
              <button onClick={() => setSelectedCategory(null)} className={`px-3 py-1.5 rounded-sm text-[10px] font-black uppercase border ${!selectedCategory ? 'text-white border-transparent' : 'text-slate-300 border-slate-100 bg-slate-50'}`} style={{ background: !selectedCategory ? theme.color : undefined }}>全部</button>
              {categories.map(cat => (
                <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-3 py-1.5 rounded-sm text-[10px] font-black uppercase border ${selectedCategory === cat ? 'text-white border-transparent' : 'text-slate-300 border-slate-100 bg-slate-50'}`} style={{ background: selectedCategory === cat ? theme.color : undefined }}>{cat}</button>
              ))}
           </div>
         )}
      </header>

      <main className="flex-1 overflow-y-auto px-6 pb-24 no-scrollbar pt-6 space-y-6">
        {activeMainTab === 'task' && categories.filter(cat => !selectedCategory || cat === selectedCategory).map(cat => (
          <section key={cat} className="space-y-3">
             <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-1.5 pl-1"><Hash size={10} /> {cat}</h4>
             <div className="space-y-2">
               {library.filter(t => t.category === cat).map(task => (
                 <div key={task.id} onClick={() => onEditTask(task)} className="p-4 bg-slate-50 rounded-sm flex justify-between items-center group cursor-pointer border border-slate-100 shadow-sm active:scale-[0.99] transition-all">
                   <div className="flex flex-col gap-1 w-full">
                     <span className="text-sm font-bold text-slate-700">{task.title}</span>
                     <div className="flex items-center gap-x-3 opacity-60">
                        <span className="text-[8px] font-black uppercase bg-slate-200/50 px-1 rounded-sm">{task.category}</span>
                        {task.targetCount ? <span className="text-[8px] font-black text-slate-400 mono">{task.accumulatedCount}/{task.targetCount}</span> : null}
                     </div>
                   </div>
                   <Settings2 size={14} className="text-slate-200" />
                 </div>
               ))}
             </div>
          </section>
        ))}

        {activeMainTab === 'habit' && habits.map(habit => {
          const IconComp = HABIT_ICONS[habit.iconName] || Activity;
          return (
            <div key={habit.id} onClick={() => onEditHabit(habit)} className="p-4 rounded-sm mb-3 flex items-center justify-between cursor-pointer active:scale-[0.98] transition-all border bg-white shadow-sm" style={{ borderColor: habit.color + '40' }}>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-sm bg-slate-50 flex items-center justify-center border border-slate-100"><IconComp size={18} style={{ color: habit.color }} /></div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-slate-800">{habit.title}</span>
                  <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">{habit.category} · 每 {habit.frequencyDays} 天 {habit.frequencyTimes} 次</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                 <div className="px-2 py-1 rounded-sm text-[10px] font-black mono bg-slate-50 border border-slate-100" style={{ color: habit.color }}>{habit.streak}</div>
                 <Settings2 size={16} className="text-slate-300" />
              </div>
            </div>
          );
        })}

        {activeMainTab === 'goal' && goals.map(goal => (
          <div key={goal.id} className="p-5 bg-slate-50 rounded-sm space-y-6 border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target size={16} style={{ color: theme.color }} />
                <h3 className="text-base font-black text-slate-800 tracking-tight">{goal.title}</h3>
              </div>
              <button onClick={() => onEditGoal(goal)}><Settings2 size={16} className="text-slate-200" /></button>
            </div>
            <div className="space-y-6">
              {goal.keyResults.map(kr => {
                const progress = calculateKrProgress(kr.id);
                const krTasks = library.filter(t => t.krId === kr.id);
                const krHabits = habits.filter(h => h.krId === kr.id);
                return (
                  <div key={kr.id} className="space-y-3">
                     <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <span>{kr.title}</span>
                        <span className="mono">{progress}%</span>
                     </div>
                     <div className="h-1 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full transition-all duration-700" style={{ width: `${progress}%`, background: theme.color }} />
                     </div>
                     <div className="space-y-1.5 pl-2 border-l-2 border-slate-200/50">
                        {krHabits.map(h => (
                           <div key={h.id} onClick={() => onEditHabit(h)} className="flex items-center justify-between py-1 active:opacity-60">
                              <div className="flex items-center gap-2">
                                 <Flame size={10} style={{ color: h.color }} />
                                 <span className="text-[10px] font-bold text-slate-500">{h.title}</span>
                              </div>
                              <span className="text-[8px] font-black mono text-slate-300">{h.accumulatedCount}/{h.targetCount}</span>
                           </div>
                        ))}
                        {krTasks.map(t => (
                           <div key={t.id} onClick={() => onEditTask(t)} className="flex items-center justify-between py-1 active:opacity-60">
                              <div className="flex items-center gap-2">
                                 <ListTodo size={10} className="text-slate-400" />
                                 <span className="text-[10px] font-bold text-slate-500">{t.title}</span>
                              </div>
                              <span className="text-[8px] font-black mono text-slate-300">{t.accumulatedCount}/{t.targetCount}</span>
                           </div>
                        ))}
                        {(krTasks.length === 0 && krHabits.length === 0) && <span className="text-[8px] font-black text-slate-200 uppercase tracking-widest">尚未关联任何项</span>}
                     </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </main>

      <div className="fixed right-6 bottom-28 z-[150] flex flex-col items-end gap-3 hide-on-keyboard">
         <button onClick={() => onCreateItem(activeMainTab as any)} className="w-14 h-14 rounded-sm shadow-xl flex items-center justify-center text-white active:scale-90 transition-transform" style={{ background: theme.color }}>
            <Plus size={28} />
         </button>
      </div>
    </div>
  );
};

export default TaskLibraryPage;
