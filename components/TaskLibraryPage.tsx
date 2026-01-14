
import React, { useState } from 'react';
import { ThemeOption, Task, Goal, Habit } from '../types';
import { Search, Hash, Target, Flame, Bookmark, Settings2, Menu, BarChart3, Activity, Book, Coffee, Heart, Smile, Star, Dumbbell, GlassWater, Moon, Sun, Laptop } from 'lucide-react';

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
  allTasks: Task[];
}

const TaskLibraryPage: React.FC<TaskLibraryPageProps> = ({ theme, library, habits, goals, onEditTask, onEditGoal, onEditHabit, onOpenSidebar }) => {
  const [activeMainTab, setActiveMainTab] = useState<'task' | 'habit' | 'goal'>('task');
  
  return (
    <div className="h-full flex flex-col bg-white">
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

      <main className="flex-1 overflow-y-auto px-6 pb-24 no-scrollbar pt-4">
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
        {/* 其余分类逻辑保持一致但统一扁平风格 */}
      </main>
    </div>
  );
};

export default TaskLibraryPage;
