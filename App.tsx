
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AppView, DayInfo, Task, ThemeOption, Goal, Habit, ScoreDefinition } from './types';
import { INITIAL_DAYS, THEME_OPTIONS, LIBRARY_TASKS } from './constants';
import BottomNav from './components/BottomNav';
import DailyDetailPage from './components/DailyDetailPage';
import TaskLibraryPage from './components/TaskLibraryPage';
import OverviewPage from './components/OverviewPage';
import ReviewPage from './components/ReviewPage';
import Sidebar from './components/Sidebar';
import { X, Trash2, ListTodo, Flame, Target, Settings2, Palette } from 'lucide-react';

import { Book, Coffee, Heart, Smile, Star, Dumbbell, GlassWater, Moon, Sun, Laptop, Music, Camera, Brush, MapPin, Activity } from 'lucide-react';
const HABIT_ICONS: any = { Activity, Book, Coffee, Heart, Smile, Star, Dumbbell, GlassWater, Moon, Sun, Laptop, Music, Camera, Brush, MapPin };
const ICON_KEYS = Object.keys(HABIT_ICONS);
const PRESET_COLORS = ['#f43f5e', '#0ea5e9', '#10b981', '#f59e0b', '#8b5cf6', '#64748b'];

const INITIAL_HABITS: Habit[] = [
  { id: 'h1', title: '早起 (06:00)', streak: 12, category: '生活', frequencyDays: 1, frequencyTimes: 1, iconName: 'Sun', color: '#f43f5e', targetCount: 1, accumulatedCount: 0, resetCycle: 'daily' },
  { id: 'h2', title: '阅读 30min', streak: 5, category: '学习', frequencyDays: 1, frequencyTimes: 1, iconName: 'Book', color: '#0ea5e9', krId: 'kr1', targetCount: 1, accumulatedCount: 0, resetCycle: 'daily' },
];

const VIEW_ORDER: AppView[] = ['overview', 'daily', 'library', 'review'];

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [days, setDays] = useState<DayInfo[]>(INITIAL_DAYS);
  const [library, setLibrary] = useState<Task[]>(LIBRARY_TASKS);
  const [habits, setHabits] = useState<Habit[]>(INITIAL_HABITS);
  const [goals, setGoals] = useState<Goal[]>([
    { id: 'g1', title: '掌控前端艺术', category: '学习', keyResults: [{ id: 'kr1', title: '实战项目完成', progress: 30 }] }
  ]);
  const [scoreDefs, setScoreDefs] = useState<ScoreDefinition[]>([
    { id: 's1', label: '专注度', labels: { [-2]: '极度涣散', [-1]: '状态一般', [0]: '正常水平', [1]: '高效专注', [2]: '心流状态' } },
  ]);
  const [activeDate, setActiveDate] = useState<number>(new Date().getDate());
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [theme, setTheme] = useState<ThemeOption>(THEME_OPTIONS[0]);

  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [isCreating, setIsCreating] = useState<{ type: 'task' | 'habit' | 'goal' | 'temp_task', defaultCategory?: string } | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  /**
   * Fix for Error in file App.tsx on line 221: Cannot find name 'handleToggleTaskComplete'.
   * Implements the missing task toggle completion handler.
   */
  const handleToggleTaskComplete = (taskId: string) => {
    setDays(prev => prev.map(d => ({
      ...d,
      tasks: d.tasks.map(t => {
        if (t.id === taskId) {
          const target = t.targetCount || 1;
          const current = t.accumulatedCount || 0;
          const isCompleting = current < target;
          const nextCount = isCompleting ? current + 1 : 0;
          return {
            ...t,
            accumulatedCount: nextCount,
            completed: nextCount >= target,
            lastCompletedAt: nextCount > current ? Date.now() : t.lastCompletedAt
          };
        }
        return t;
      })
    })));
  };

  const handleUpdateTask = (updatedTask: Task) => {
    setDays(prev => prev.map(d => ({ ...d, tasks: d.tasks.map(t => t.id === updatedTask.id || t.originalId === updatedTask.id ? { ...updatedTask, id: t.id, originalId: updatedTask.id } : t) })));
    setLibrary(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
    setEditingTask(null);
  };

  const handleUpdateHabit = (updatedHabit: Habit) => {
    setHabits(prev => prev.map(h => h.id === updatedHabit.id ? updatedHabit : h));
    setEditingHabit(null);
  };

  const handleUpdateGoal = (updatedGoal: Goal) => {
    setGoals(prev => prev.map(g => g.id === updatedGoal.id ? updatedGoal : g));
    setEditingGoal(null);
  };

  const handleToggleHabitComplete = (habitId: string, forcedHour?: number) => {
    setHabits(prev => prev.map(h => {
      if (h.id === habitId) {
        const isCompleting = (h.accumulatedCount || 0) < (h.targetCount || 1);
        const newCount = isCompleting ? (h.accumulatedCount || 0) + 1 : 0;
        return { ...h, completedToday: newCount >= (h.targetCount || 1), accumulatedCount: newCount, streak: newCount >= (h.targetCount || 1) ? h.streak + 1 : h.streak, lastCompletedAt: Date.now(), remark: forcedHour !== undefined ? `${forcedHour < 10 ? '0' + forcedHour : forcedHour}:00` : h.remark };
      }
      return h;
    }));
  };

  const renderGlobalOverlays = () => {
    const overlays = [];
    
    // 任务编辑
    if (editingTask) overlays.push(
      <div key="editTask" className="fixed inset-0 z-[700] bg-slate-900/80 flex items-end justify-center p-4" onClick={() => setEditingTask(null)}>
        <div className="bg-white w-full max-w-md rounded-sm p-6 shadow-2xl animate-in slide-in-from-bottom duration-300" onClick={e => e.stopPropagation()}>
           <div className="flex justify-between items-center mb-6"><h3 className="text-sm font-black text-slate-400">编辑任务</h3><button onClick={() => setEditingTask(null)}><X size={20}/></button></div>
           <div className="space-y-4">
             <input className="w-full bg-slate-50 p-4 text-lg font-bold rounded-sm border border-slate-100 outline-none" value={editingTask.title} onChange={e => setEditingTask({ ...editingTask, title: e.target.value })} />
             <div className="grid grid-cols-2 gap-4">
               <input className="bg-slate-50 p-3 rounded-sm text-xs font-bold border border-slate-100 outline-none" value={editingTask.category} onChange={e => setEditingTask({ ...editingTask, category: e.target.value })} />
               <select className="bg-slate-50 p-3 rounded-sm text-[10px] font-bold border border-slate-100 outline-none" value={editingTask.krId || ''} onChange={e => setEditingTask({...editingTask, krId: e.target.value || undefined})}>
                 <option value="">未关联目标</option>
                 {goals.map(g => (<optgroup key={g.id} label={g.title}>{g.keyResults.map(kr => <option key={kr.id} value={kr.id}>{kr.title}</option>)}</optgroup>))}
               </select>
             </div>
             <div className="grid grid-cols-2 gap-4">
               <div className="space-y-1">
                 <span className="text-[9px] font-black text-slate-300 uppercase">当前累计</span>
                 <input type="number" className="w-full bg-slate-50 p-3 rounded-sm text-xs font-bold border border-slate-100" value={editingTask.accumulatedCount || 0} onChange={e => setEditingTask({...editingTask, accumulatedCount: parseInt(e.target.value)})}/>
               </div>
               <div className="space-y-1">
                 <span className="text-[9px] font-black text-slate-300 uppercase">目标总量</span>
                 <input type="number" className="w-full bg-slate-50 p-3 rounded-sm text-xs font-bold border border-slate-100" value={editingTask.targetCount || 0} onChange={e => setEditingTask({...editingTask, targetCount: parseInt(e.target.value)})}/>
               </div>
             </div>
             <button onClick={() => handleUpdateTask(editingTask)} className="w-full py-4 text-white font-black uppercase rounded-sm shadow-xl" style={{ background: theme.color }}>保存修改</button>
             <button onClick={() => { if(confirm('确认删除?')) { setLibrary(prev => prev.filter(t => t.id !== editingTask.id)); setEditingTask(null); } }} className="w-full py-2 text-rose-500 font-black uppercase text-[10px]">删除任务</button>
           </div>
        </div>
      </div>
    );

    // 习惯编辑 (增强版)
    if (editingHabit) overlays.push(
      <div key="editHabit" className="fixed inset-0 z-[700] bg-slate-900/80 flex items-end justify-center p-4" onClick={() => setEditingHabit(null)}>
        <div className="bg-white w-full max-w-md rounded-sm p-6 shadow-2xl animate-in slide-in-from-bottom duration-300 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
           <div className="flex justify-between items-center mb-6"><h3 className="text-sm font-black text-slate-400">配置习惯</h3><button onClick={() => setEditingHabit(null)}><X size={20}/></button></div>
           <div className="space-y-5">
             <div className="space-y-1">
               <span className="text-[9px] font-black text-slate-300 uppercase">习惯名称</span>
               <input className="w-full bg-slate-50 p-4 text-lg font-bold rounded-sm border border-slate-100 outline-none" value={editingHabit.title} onChange={e => setEditingHabit({ ...editingHabit, title: e.target.value })} />
             </div>
             
             <div className="space-y-2">
               <span className="text-[9px] font-black text-slate-300 uppercase">图标与颜色</span>
               <div className="flex flex-wrap gap-2">
                 {ICON_KEYS.map(ik => {
                   const Icon = HABIT_ICONS[ik];
                   return <button key={ik} onClick={() => setEditingHabit({...editingHabit, iconName: ik})} className={`p-2 rounded-sm border ${editingHabit.iconName === ik ? 'border-slate-800' : 'border-slate-100'}`}><Icon size={16} /></button>
                 })}
               </div>
               <div className="flex gap-2">
                 {PRESET_COLORS.map(c => <button key={c} onClick={() => setEditingHabit({...editingHabit, color: c})} className={`w-8 h-8 rounded-full border-2 ${editingHabit.color === c ? 'border-slate-800' : 'border-transparent'}`} style={{background: c}} />)}
               </div>
             </div>

             <div className="grid grid-cols-2 gap-4">
               <div className="space-y-1">
                 <span className="text-[9px] font-black text-slate-300 uppercase">频率 (天/次)</span>
                 <div className="flex items-center gap-2">
                   <input type="number" className="w-12 bg-slate-50 p-2 text-center rounded-sm font-bold border border-slate-100" value={editingHabit.frequencyDays} onChange={e => setEditingHabit({...editingHabit, frequencyDays: parseInt(e.target.value)})}/>
                   <span className="text-[10px] text-slate-400">天</span>
                   <input type="number" className="w-12 bg-slate-50 p-2 text-center rounded-sm font-bold border border-slate-100" value={editingHabit.frequencyTimes} onChange={e => setEditingHabit({...editingHabit, frequencyTimes: parseInt(e.target.value)})}/>
                   <span className="text-[10px] text-slate-400">次</span>
                 </div>
               </div>
               <div className="space-y-1">
                 <span className="text-[9px] font-black text-slate-300 uppercase">关联目标</span>
                 <select className="w-full bg-slate-50 p-2 rounded-sm text-[10px] font-bold border border-slate-100 outline-none" value={editingHabit.krId || ''} onChange={e => setEditingHabit({...editingHabit, krId: e.target.value || undefined})}>
                    <option value="">未关联</option>
                    {goals.map(g => (<optgroup key={g.id} label={g.title}>{g.keyResults.map(kr => <option key={kr.id} value={kr.id}>{kr.title}</option>)}</optgroup>))}
                  </select>
               </div>
             </div>

             <button onClick={() => handleUpdateHabit(editingHabit)} className="w-full py-4 text-white font-black uppercase rounded-sm shadow-xl" style={{ background: editingHabit.color }}>保存习惯</button>
             <button onClick={() => { if(confirm('删除此习惯?')) { setHabits(prev => prev.filter(h => h.id !== editingHabit.id)); setEditingHabit(null); } }} className="w-full py-2 text-rose-500 font-black uppercase text-[10px]">彻底删除</button>
           </div>
        </div>
      </div>
    );

    // 目标编辑
    if (editingGoal) overlays.push(
      <div key="editGoal" className="fixed inset-0 z-[700] bg-slate-900/80 flex items-end justify-center p-4" onClick={() => setEditingGoal(null)}>
        <div className="bg-white w-full max-w-md rounded-sm p-6 shadow-2xl animate-in slide-in-from-bottom duration-300" onClick={e => e.stopPropagation()}>
           <div className="flex justify-between items-center mb-6"><h3 className="text-sm font-black text-slate-400">编辑目标</h3><button onClick={() => setEditingGoal(null)}><X size={20}/></button></div>
           <div className="space-y-5">
             <input className="w-full bg-slate-50 p-4 text-lg font-bold rounded-sm border border-slate-100 outline-none" value={editingGoal.title} onChange={e => setEditingGoal({ ...editingGoal, title: e.target.value })} />
             <div className="space-y-2">
                <span className="text-[9px] font-black text-slate-300 uppercase">关键结果 (KR)</span>
                {editingGoal.keyResults.map((kr, idx) => (
                   <div key={kr.id} className="flex gap-2">
                      <input className="flex-1 bg-slate-50 p-2 rounded-sm text-xs font-bold border border-slate-100" value={kr.title} onChange={e => {
                        const nextKrs = [...editingGoal.keyResults];
                        nextKrs[idx].title = e.target.value;
                        setEditingGoal({...editingGoal, keyResults: nextKrs});
                      }} />
                      <button onClick={() => setEditingGoal({...editingGoal, keyResults: editingGoal.keyResults.filter(k => k.id !== kr.id)})} className="p-2 text-rose-400"><Trash2 size={12}/></button>
                   </div>
                ))}
                <button onClick={() => setEditingGoal({...editingGoal, keyResults: [...editingGoal.keyResults, { id: `kr-${Date.now()}`, title: '新 KR', progress: 0 }]})} className="w-full py-2 border border-dashed border-slate-200 text-[10px] font-black text-slate-400 uppercase">+ 新增 KR</button>
             </div>
             <button onClick={() => handleUpdateGoal(editingGoal)} className="w-full py-4 text-white font-black uppercase rounded-sm shadow-xl" style={{ background: theme.color }}>保存目标</button>
             <button onClick={() => { if(confirm('确认删除目标?')) { setGoals(prev => prev.filter(g => g.id !== editingGoal.id)); setEditingGoal(null); } }} className="w-full py-2 text-rose-500 font-black uppercase text-[10px]">删除目标</button>
           </div>
        </div>
      </div>
    );

    if (isCreating) overlays.push(
      <div key="createItem" className="fixed inset-0 z-[700] bg-slate-900/80 flex items-end justify-center p-4" onClick={() => setIsCreating(null)}>
        <div className="bg-white w-full max-w-md rounded-sm p-6 animate-in slide-in-from-bottom duration-300" onClick={e => e.stopPropagation()}>
           <div className="flex justify-between mb-6"><h3 className="text-sm font-black text-slate-400 uppercase">新建项目</h3><button onClick={() => setIsCreating(null)}><X size={20}/></button></div>
           <form onSubmit={e => {
             e.preventDefault();
             const title = new FormData(e.currentTarget).get('title') as string;
             if (!title) return;
             if (isCreating.type === 'task') setLibrary([...library, { id: `lib-${Date.now()}`, title, category: isCreating.defaultCategory || '任务', type: 'focus', targetCount: 0, accumulatedCount: 0 }]);
             else if (isCreating.type === 'habit') setHabits([...habits, { id: `h-${Date.now()}`, title, category: isCreating.defaultCategory || '自我', streak: 0, frequencyDays: 1, frequencyTimes: 1, iconName: 'Star', color: theme.color, targetCount: 1, accumulatedCount: 0 }]);
             else if (isCreating.type === 'goal') setGoals([...goals, { id: `g-${Date.now()}`, title, category: '长期', keyResults: [] }]);
             setIsCreating(null);
           }}>
             <input name="title" autoFocus className="w-full bg-slate-50 p-4 text-lg font-bold rounded-sm border border-slate-100 outline-none" placeholder="输入名称..." />
             <button type="submit" className="w-full py-4 text-white font-black uppercase rounded-sm mt-4 shadow-xl" style={{ background: theme.color }}>确认</button>
           </form>
        </div>
      </div>
    );

    return overlays.length > 0 ? createPortal(overlays, document.body) : null;
  };

  const viewIndex = VIEW_ORDER.indexOf(currentView);

  return (
    <div className="relative max-w-md mx-auto min-h-screen bg-white flex flex-col shadow-xl overflow-hidden">
      <div className="flex-1 relative overflow-hidden">
        <div className="view-slider" style={{ transform: `translateX(-${viewIndex * 25}%)` }}>
          <div className="view-slide"><OverviewPage days={days} theme={theme} activeDate={activeDate} onDateChange={setActiveDate} onAddTask={(t) => setDays(prev => prev.map(d => d.date === activeDate ? { ...d, tasks: [...d.tasks, { ...t, id: `inst-${Date.now()}`, originalId: t.id }] } : d))} onOpenSidebar={() => setIsSidebarOpen(true)} library={library} goals={goals} /></div>
          <div className="view-slide"><DailyDetailPage days={days} goals={goals} habits={habits} activeDate={activeDate} onDateChange={setActiveDate} onToggleLibrary={() => setCurrentView('library')} onOpenQuickMenu={() => setIsCreating({ type: 'temp_task' })} onToggleTaskComplete={handleToggleTaskComplete} onToggleHabitComplete={handleToggleHabitComplete} onEditTask={setEditingTask} onOpenSidebar={() => setIsSidebarOpen(true)} onUpdateTask={handleUpdateTask} theme={theme} /></div>
          <div className="view-slide"><TaskLibraryPage theme={theme} library={library} habits={habits} goals={goals} onEditTask={setEditingTask} onEditHabit={setEditingHabit} onEditGoal={setEditingGoal} onOpenSidebar={() => setIsSidebarOpen(true)} onAddTask={() => setIsCreating({ type: 'task' })} onToggleHabitComplete={handleToggleHabitComplete} onDeleteHabit={() => {}} onDeleteGoal={() => {}} onDeleteTask={() => {}} onCreateItem={(type, cat) => setIsCreating({ type, defaultCategory: cat })} /></div>
          <div className="view-slide"><ReviewPage theme={theme} activeDate={activeDate} days={days} habits={habits} scoreDefs={scoreDefs} setScoreDefs={setScoreDefs} onUpdateDay={(d, u) => setDays(prev => prev.map(day => day.date === d ? {...day, ...u} : day))} onOpenSidebar={() => setIsSidebarOpen(true)} /></div>
        </div>
      </div>
      <BottomNav currentView={currentView} onViewChange={setCurrentView} theme={theme} />
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} currentTheme={theme} onThemeChange={setTheme} onClearTasks={() => setDays(INITIAL_DAYS)} onBackup={() => {}} onRestore={() => {}} />
      {renderGlobalOverlays()}
    </div>
  );
};

export default App;
