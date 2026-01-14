
import React, { useState } from 'react';
import { ThemeOption, Task, Goal, Habit } from '../types';
// 添加缺失的 X 图标导入
import { Search, Hash, Target, Flame, Bookmark, Settings2, Menu, BarChart3, Activity, Book, Coffee, Heart, Smile, Star, Dumbbell, GlassWater, Moon, Sun, Laptop, Plus, ChevronRight, X } from 'lucide-react';

const HABIT_ICONS = { Activity, Book, Coffee, Heart, Smile, Star, Dumbbell, GlassWater, Moon, Sun, Laptop };

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
  onCreateItem: (type: 'task' | 'habit' | 'goal') => void;
  allTasks: Task[];
}

const TaskLibraryPage: React.FC<TaskLibraryPageProps> = ({ theme, library, habits, goals, onEditTask, onEditGoal, onEditHabit, onOpenSidebar, onCreateItem }) => {
  const [activeMainTab, setActiveMainTab] = useState<'task' | 'habit' | 'goal'>('task');
  const [showAddMenu, setShowAddMenu] = useState(false);
  
  const categories = Array.from(new Set(library.map(t => t.category)));

  return (
    <div className="h-full flex flex-col bg-white relative">
      <header className="pt-16 pb-2 shrink-0">
         <div className="px-6 mb-4"><button onClick={onOpenSidebar} className="p-1 -ml-1 text-slate-400"><Menu size={20}/></button></div>
         <div className="flex gap-6 mb-6 px-6">
            {['task', 'habit', 'goal'].map(id => (
                <button key={id} onClick={() => setActiveMainTab(id as any)} className={`text-2xl font-black tracking-tight relative ${activeMainTab === id ? 'text-slate-800' : 'text-slate-200'}`}>
                    {id === 'task' ? '任务库' : id === 'habit' ? '习惯' : '目标'}
                    {activeMainTab === id && <div className="absolute -bottom-1 left-0 right-0 h-1 rounded-full" style={{ backgroundColor: theme.color }} />}
                </button>
            ))}
         </div>
      </header>

      <main className="flex-1 overflow-y-auto px-6 pb-24 no-scrollbar pt-4 space-y-6">
        {activeMainTab === 'task' && categories.map(cat => (
          <section key={cat} className="space-y-3">
             <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-1.5"><Hash size={10} /> {cat}</h4>
             <div className="space-y-1">
               {library.filter(t => t.category === cat).map(task => (
                 <div key={task.id} onClick={() => onEditTask(task)} className="p-4 bg-slate-50 rounded-sm flex justify-between items-center group cursor-pointer active:bg-slate-100 transition-colors">
                   <div className="flex flex-col">
                     <span className="text-sm font-bold text-slate-700">{task.title}</span>
                     {task.krId && <span className="text-[8px] font-black text-slate-300 uppercase mt-0.5">关联目标 KR</span>}
                   </div>
                   <Settings2 size={14} className="text-slate-200 group-hover:text-slate-400" />
                 </div>
               ))}
             </div>
          </section>
        ))}

        {activeMainTab === 'habit' && habits.map(habit => {
          const IconComp = (HABIT_ICONS as any)[habit.iconName as string] || Activity;
          return (
            <div key={habit.id} className="p-4 rounded-sm mb-3 flex items-center justify-between group cursor-pointer active:scale-[0.98] transition-all" style={{ backgroundColor: habit.color + '15', border: `1px solid ${habit.color}30` }} onClick={() => onEditHabit(habit)}>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-sm bg-white flex items-center justify-center shadow-sm"><IconComp size={18} style={{ color: habit.color }} /></div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-slate-800">{habit.title}</span>
                  <span className="text-[9px] font-black uppercase text-slate-400">{habit.category} · 每{habit.frequencyDays}天{habit.frequencyTimes}次</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                 <div className="px-2 py-1 bg-white rounded-full text-[10px] font-black mono flex items-center gap-1 shadow-sm" style={{ color: habit.color }}><Flame size={10}/>{habit.streak}</div>
                 <Settings2 size={16} className="text-slate-300 group-hover:text-slate-500" />
              </div>
            </div>
          );
        })}

        {activeMainTab === 'goal' && goals.map(goal => (
          <div key={goal.id} className="p-5 bg-slate-50 rounded-sm space-y-4" onClick={() => onEditGoal(goal)}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2"><Target size={16} className="text-slate-400" /><h3 className="text-base font-black text-slate-800">{goal.title}</h3></div>
              <Settings2 size={16} className="text-slate-200" />
            </div>
            <div className="space-y-4">
              {goal.keyResults.map(kr => (
                <div key={kr.id} className="space-y-2">
                   <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest"><span>{kr.title}</span><span className="mono">{kr.progress}%</span></div>
                   <div className="h-1 bg-slate-200 rounded-full overflow-hidden"><div className="h-full" style={{ width: `${kr.progress}%`, backgroundColor: theme.color }} /></div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </main>

      {/* FAB: Floating Action Button */}
      <div className="fixed right-6 bottom-28 z-[150] flex flex-col items-end gap-3">
         {showAddMenu && (
            <div className="flex flex-col gap-2 mb-2 animate-in slide-in-from-bottom-4 fade-in duration-200">
               {[
                 { label: '新增任务', icon: Bookmark, type: 'task' },
                 { label: '新增习惯', icon: Flame, type: 'habit' },
                 { label: '新增目标', icon: Target, type: 'goal' }
               ].map(item => (
                 <button key={item.type} onClick={() => { onCreateItem(item.type as any); setShowAddMenu(false); }} className="flex items-center gap-3 bg-white shadow-xl px-4 py-2.5 rounded-full border border-slate-50 active:scale-90 transition-transform">
                   <item.icon size={14} className="text-slate-600" />
                   <span className="text-xs font-black text-slate-600 uppercase tracking-widest">{item.label}</span>
                 </button>
               ))}
            </div>
         )}
         <button onClick={() => setShowAddMenu(!showAddMenu)} className="w-14 h-14 rounded-full shadow-2xl flex items-center justify-center text-white active:scale-90 transition-transform" style={{ backgroundColor: theme.color }}>
            {showAddMenu ? <X size={24} /> : <Plus size={28} />}
         </button>
      </div>
    </div>
  );
};

export default TaskLibraryPage;
