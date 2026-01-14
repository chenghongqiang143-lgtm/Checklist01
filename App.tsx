
import React, { useState, useMemo } from 'react';
import { AppView, DayInfo, Task, ThemeOption, Goal, Habit, ScoreDefinition, DayScore } from './types';
import { INITIAL_DAYS, THEME_OPTIONS, LIBRARY_TASKS } from './constants';
import BottomNav from './components/BottomNav';
import DailyDetailPage from './components/DailyDetailPage';
import TaskLibraryPage from './components/TaskLibraryPage';
import OverviewPage from './components/OverviewPage';
import ReviewPage from './components/ReviewPage';
import Sidebar from './components/Sidebar';
import { X, CheckCircle2, Flame, Bookmark, Target, Activity, Book, Coffee, Heart, Smile, Star, Trash2, Dumbbell, GlassWater, Moon, Sun, Laptop, Clock, Palette } from 'lucide-react';

const INITIAL_HABITS: Habit[] = [
  { id: 'h1', title: '早起 (06:00)', streak: 12, category: '生活', frequencyDays: 1, frequencyTimes: 1, iconName: 'Sun', color: '#f43f5e' },
  { id: 'h2', title: '阅读 30min', streak: 5, category: '学习', frequencyDays: 1, frequencyTimes: 1, iconName: 'Book', color: '#0ea5e9', krId: 'kr1' },
];

const INITIAL_SCORE_DEFS: ScoreDefinition[] = [
  { id: 's1', label: '专注度', labels: { [-2]: '极度涣散', [-1]: '状态一般', [0]: '正常水平', [1]: '高效专注', [2]: '心流状态' } },
  { id: 's2', label: '情绪值', labels: { [-2]: '极度沮丧', [-1]: '略显消沉', [0]: '平和', [1]: '积极愉悦', [2]: '充满动力' } }
];

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>('overview');
  const [days, setDays] = useState<DayInfo[]>(INITIAL_DAYS);
  const [library, setLibrary] = useState<Task[]>(LIBRARY_TASKS);
  const [habits, setHabits] = useState<Habit[]>(INITIAL_HABITS);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [scoreDefs, setScoreDefs] = useState<ScoreDefinition[]>(INITIAL_SCORE_DEFS);
  const [activeDate, setActiveDate] = useState<number>(new Date().getDate());
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [theme, setTheme] = useState<ThemeOption>(THEME_OPTIONS[0]);

  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  const processedDays = useMemo(() => {
    return days.map(day => {
      const cyclic = library.filter(l => l.frequencyDays && (day.date - 1) % l.frequencyDays === 0)
        .map(l => ({ ...l, id: `c-${l.id}-${day.date}`, date: day.date, isCyclicInstance: true }));
      const exists = new Set(day.tasks.map(t => t.title));
      return { ...day, tasks: [...day.tasks, ...cyclic.filter(t => !exists.has(t.title))] };
    });
  }, [days, library]);

  const handleUpdateDayData = (date: number, updates: Partial<DayInfo>) => {
    setDays(prev => prev.map(d => d.date === date ? { ...d, ...updates } : d));
  };

  const handleToggleHabitComplete = (habitId: string, forcedHour?: number) => {
    setHabits(prev => prev.map(h => {
      if (h.id === habitId) {
        const isCompleting = !h.completedToday;
        return { 
          ...h, 
          completedToday: isCompleting, 
          streak: isCompleting ? h.streak + 1 : Math.max(0, h.streak - 1),
          remark: isCompleting && forcedHour !== undefined ? `${forcedHour < 10 ? '0' + forcedHour : forcedHour}:00` : h.remark 
        };
      }
      return h;
    }));
  };

  const handleUpdateTask = (updatedTask: Task) => {
    setDays(prev => prev.map(d => ({ ...d, tasks: d.tasks.map(t => t.id === updatedTask.id ? updatedTask : t) })));
    setLibrary(prev => prev.map(t => t.title === updatedTask.title ? { ...t, ...updatedTask, id: t.id } : t));
    setEditingTask(null);
  };

  // 修复 renderTaskEditModal 缺失的问题
  const renderTaskEditModal = () => {
    if (!editingTask) return null;
    return (
      <div className="fixed inset-0 z-[200] bg-slate-900/40 backdrop-blur-sm flex items-end justify-center">
        <div className="bg-white w-full max-w-md rounded-t-xl p-6 shadow-2xl animate-in slide-in-from-bottom duration-300 overflow-y-auto max-h-[85vh] no-scrollbar pb-10">
           <div className="flex justify-between items-center mb-6">
             <h3 className="text-[10px] font-black uppercase text-slate-400">编辑任务</h3>
             <button onClick={() => setEditingTask(null)} className="text-slate-300"><X size={20} /></button>
           </div>
           <div className="space-y-5">
              <div className="space-y-1">
                <label className="text-[8px] font-black text-slate-300 uppercase">任务名称</label>
                <input 
                  className="w-full bg-transparent border-b border-slate-100 p-2 text-lg font-bold outline-none" 
                  value={editingTask.title} 
                  onChange={e => setEditingTask({...editingTask, title: e.target.value})} 
                  placeholder="任务名称" 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[8px] font-black text-slate-300 uppercase">分类</label>
                  <input 
                    className="w-full bg-slate-50 p-3 text-xs font-bold rounded-sm outline-none" 
                    value={editingTask.category} 
                    onChange={e => setEditingTask({...editingTask, category: e.target.value})} 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] font-black text-slate-300 uppercase">计划时间 (HH:mm)</label>
                  <input 
                    className="w-full bg-slate-50 p-3 text-xs font-bold rounded-sm outline-none" 
                    value={editingTask.time || ''} 
                    onChange={e => setEditingTask({...editingTask, time: e.target.value})} 
                    placeholder="例如 09:00"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[8px] font-black text-slate-300 uppercase">当前数值</label>
                  <input 
                    type="number" 
                    className="w-full bg-slate-50 p-3 text-xs font-bold rounded-sm outline-none" 
                    value={editingTask.accumulatedCount || 0} 
                    onChange={e => setEditingTask({...editingTask, accumulatedCount: parseInt(e.target.value)||0})} 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] font-black text-slate-300 uppercase">目标数值</label>
                  <input 
                    type="number" 
                    className="w-full bg-slate-50 p-3 text-xs font-bold rounded-sm outline-none" 
                    value={editingTask.targetCount || 0} 
                    onChange={e => setEditingTask({...editingTask, targetCount: parseInt(e.target.value)||0})} 
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                 <button 
                  onClick={() => {
                    setDays(prev => prev.map(d => ({ ...d, tasks: d.tasks.filter(t => t.id !== editingTask.id) })));
                    setEditingTask(null);
                  }}
                  className="flex-1 py-4 rounded-sm bg-rose-50 text-rose-500 font-black uppercase text-[11px] tracking-widest flex items-center justify-center gap-2"
                >
                  <Trash2 size={14} /> 删除
                </button>
                <button onClick={() => handleUpdateTask(editingTask)} className="flex-[2] py-4 rounded-sm text-white font-black uppercase text-[11px] tracking-widest" style={{ backgroundColor: theme.color }}>保存修改</button>
              </div>
           </div>
        </div>
      </div>
    );
  };

  const renderHabitEdit = () => {
    if (!editingHabit) return null;
    return (
      <div className="fixed inset-0 z-[200] bg-slate-900/40 backdrop-blur-sm flex items-end justify-center">
        <div className="bg-white w-full max-w-md rounded-t-xl p-6 shadow-2xl animate-in slide-in-from-bottom duration-300 overflow-y-auto max-h-[85vh] no-scrollbar pb-10">
           <div className="flex justify-between items-center mb-6">
             <h3 className="text-[10px] font-black uppercase text-slate-400">配置习惯</h3>
             <button onClick={() => setEditingHabit(null)} className="text-slate-300"><X size={20} /></button>
           </div>
           <div className="space-y-5">
              <input className="w-full bg-transparent border-b border-slate-100 p-2 text-lg font-bold outline-none" value={editingHabit.title} onChange={e => setEditingHabit({...editingHabit, title: e.target.value})} placeholder="名称" />
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1"><label className="text-[8px] font-black text-slate-300 uppercase">周期 (天)</label><input type="number" className="w-full bg-slate-50 p-3 text-xs font-bold rounded-sm" value={editingHabit.frequencyDays} onChange={e => setEditingHabit({...editingHabit, frequencyDays: parseInt(e.target.value)||1})} /></div>
                <div className="space-y-1"><label className="text-[8px] font-black text-slate-300 uppercase">频率 (次)</label><input type="number" className="w-full bg-slate-50 p-3 text-xs font-bold rounded-sm" value={editingHabit.frequencyTimes} onChange={e => setEditingHabit({...editingHabit, frequencyTimes: parseInt(e.target.value)||1})} /></div>
              </div>
              <div className="space-y-2">
                 <label className="text-[8px] font-black text-slate-300 uppercase flex items-center gap-2"><Palette size={10}/> 习惯色</label>
                 <div className="flex flex-wrap gap-2">
                    {THEME_OPTIONS.map(opt => (
                      <button key={opt.color} onClick={() => setEditingHabit({...editingHabit, color: opt.color})} className={`w-8 h-8 rounded-full transition-all ${editingHabit.color === opt.color ? 'ring-2 ring-offset-2 ring-slate-300 scale-110' : 'opacity-40'}`} style={{ backgroundColor: opt.color }} />
                    ))}
                 </div>
              </div>
              <button onClick={() => { setHabits(habits.map(h => h.id === editingHabit.id ? editingHabit : h)); setEditingHabit(null); }} className="w-full py-4 rounded-sm text-white font-black uppercase text-[11px] tracking-widest mt-4" style={{ backgroundColor: editingHabit.color }}>保存并同步</button>
           </div>
        </div>
      </div>
    );
  };

  return (
    <div className="relative max-w-md mx-auto min-h-screen bg-white flex flex-col shadow-xl overflow-hidden">
      <div className="flex-1 relative overflow-hidden">
        {currentView === 'overview' && <OverviewPage days={processedDays} theme={theme} activeDate={activeDate} onDateChange={setActiveDate} onAddTask={(t) => setDays(prev => prev.map(d => d.date === activeDate ? { ...d, tasks: [...d.tasks, { ...t, id: `inst-${Date.now()}` }] } : d))} onOpenSidebar={() => setIsSidebarOpen(true)} library={library} goals={goals} />}
        {currentView === 'daily' && <DailyDetailPage days={processedDays} goals={goals} habits={habits} activeDate={activeDate} onDateChange={setActiveDate} onToggleLibrary={() => setCurrentView('library')} onOpenQuickMenu={() => {}} onToggleTaskComplete={(id) => setDays(prev => prev.map(d => ({ ...d, tasks: d.tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t) })))} onToggleHabitComplete={handleToggleHabitComplete} onEditTask={setEditingTask} onOpenSidebar={() => setIsSidebarOpen(true)} onUpdateTask={handleUpdateTask} theme={theme} />}
        {currentView === 'review' && <ReviewPage theme={theme} activeDate={activeDate} days={processedDays} habits={habits} scoreDefs={scoreDefs} setScoreDefs={setScoreDefs} onUpdateDay={handleUpdateDayData} onOpenSidebar={() => setIsSidebarOpen(true)} />}
        {currentView === 'library' && <TaskLibraryPage theme={theme} library={library} habits={habits} goals={goals} onEditTask={setEditingTask} onEditHabit={setEditingHabit} onEditGoal={setEditingGoal} onOpenSidebar={() => setIsSidebarOpen(true)} allTasks={[]} onAddTask={() => {}} onToggleHabitComplete={handleToggleHabitComplete} onDeleteHabit={() => {}} onDeleteGoal={() => {}} onDeleteTask={() => {}} />}
      </div>
      <BottomNav currentView={currentView} onViewChange={setCurrentView} theme={theme} />
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} currentTheme={theme} onThemeChange={setTheme} onClearTasks={() => setDays(INITIAL_DAYS)} onBackup={() => {}} onRestore={() => {}} />
      {renderTaskEditModal()}
      {renderHabitEdit()}
    </div>
  );
};

export default App;
