
import React, { useState, useMemo, useEffect } from 'react';
import { AppView, DayInfo, Task, ThemeOption, Goal, Habit, ScoreDefinition } from './types';
import { INITIAL_DAYS, THEME_OPTIONS, LIBRARY_TASKS } from './constants';
import BottomNav from './components/BottomNav';
import DailyDetailPage from './components/DailyDetailPage';
import TaskLibraryPage from './components/TaskLibraryPage';
import OverviewPage from './components/OverviewPage';
import ReviewPage from './components/ReviewPage';
import Sidebar from './components/Sidebar';
import { X, Trash2, Star } from 'lucide-react';

const INITIAL_HABITS: Habit[] = [
  { id: 'h1', title: '早起 (06:00)', streak: 12, category: '生活', frequencyDays: 1, frequencyTimes: 1, iconName: 'Sun', color: '#f43f5e', targetCount: 1, accumulatedCount: 0, resetCycle: 'daily' },
  { id: 'h2', title: '阅读 30min', streak: 5, category: '学习', frequencyDays: 1, frequencyTimes: 1, iconName: 'Book', color: '#0ea5e9', krId: 'kr1', targetCount: 1, accumulatedCount: 0, resetCycle: 'daily' },
];

const INITIAL_SCORE_DEFS: ScoreDefinition[] = [
  { id: 's1', label: '专注度', labels: { [-2]: '极度涣散', [-1]: '状态一般', [0]: '正常水平', [1]: '高效专注', [2]: '心流状态' } },
  { id: 's2', label: '情绪值', labels: { [-2]: '极度沮丧', [-1]: '略显消沉', [0]: '平和', [1]: '积极愉悦', [2]: '充满动力' } }
];

const HABIT_ICONS_LIST = [
  'Sun', 'Moon', 'Star', 'Heart', 'Smile', 
  'Activity', 'Book', 'Coffee', 'Dumbbell', 'GlassWater', 
  'Laptop', 'Music', 'Camera', 'Brush', 'MapPin'
];

const HABIT_ICONS: any = { 
    Activity: 'Activity', Book: 'Book', Coffee: 'Coffee', Heart: 'Heart', 
    Smile: 'Smile', Star: 'Star', Dumbbell: 'Dumbbell', GlassWater: 'GlassWater', 
    Moon: 'Moon', Sun: 'Sun', Laptop: 'Laptop', Music: 'Music', 
    Camera: 'Camera', Brush: 'Brush', MapPin: 'MapPin' 
};

const VIBRANT_COLORS = [
  '#f43f5e', '#171717', '#f59e0b', '#10b981', '#0ea5e9', '#8b5cf6', '#f97316', '#14b8a6', '#ec4899', '#52525b'
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
  const [scoreDefs, setScoreDefs] = useState<ScoreDefinition[]>(INITIAL_SCORE_DEFS);
  const [activeDate, setActiveDate] = useState<number>(new Date().getDate());
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [theme, setTheme] = useState<ThemeOption>(THEME_OPTIONS[0]);

  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [isCreating, setIsCreating] = useState<{ type: 'task' | 'habit' | 'goal' | 'temp_task', defaultCategory?: string } | null>(null);

  // 1. 启动优化与资源预加载
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1200); // 模拟加载

    const safetyTimer = setTimeout(() => {
      setIsLoading(false);
    }, 3000); // 安全超时

    return () => {
      clearTimeout(timer);
      clearTimeout(safetyTimer);
    };
  }, []);

  const processedDays = useMemo(() => {
    return days.map(day => {
      const cyclic = library.filter(l => l.frequencyDays && (day.date - 1) % l.frequencyDays === 0)
        .map(l => ({ ...l, id: `c-${l.id}-${day.date}`, date: day.date, isCyclicInstance: true, originalId: l.id }));
      const exists = new Set(day.tasks.map(t => t.title));
      return { ...day, tasks: [...day.tasks, ...cyclic.filter(t => !exists.has(t.title))] };
    });
  }, [days, library]);

  const viewIndex = VIEW_ORDER.indexOf(currentView);

  // 事件处理逻辑
  const handleUpdateDayData = (date: number, updates: Partial<DayInfo>) => {
    setDays(prev => prev.map(d => d.date === date ? { ...d, ...updates } : d));
  };

  const handleToggleHabitComplete = (habitId: string, forcedHour?: number) => {
    setHabits(prev => prev.map(h => {
      if (h.id === habitId) {
        const isCompleting = (h.accumulatedCount || 0) < (h.targetCount || 1);
        const newCount = isCompleting ? (h.accumulatedCount || 0) + 1 : 0;
        return { 
          ...h, 
          completedToday: newCount >= (h.targetCount || 1),
          accumulatedCount: newCount,
          streak: newCount >= (h.targetCount || 1) ? h.streak + 1 : h.streak,
          lastCompletedAt: Date.now(),
          remark: forcedHour !== undefined ? `${forcedHour < 10 ? '0' + forcedHour : forcedHour}:00` : h.remark 
        };
      }
      return h;
    }));
  };

  const handleToggleTaskComplete = (taskId: string) => {
    setDays(prevDays => {
      let libUpdate: { id: string, count: number, lastCompletedAt?: number } | null = null;
      const now = Date.now();
      const nextDays = prevDays.map(day => ({
        ...day,
        tasks: day.tasks.map(t => {
          if (t.id === taskId) {
            const isNowCompleted = !t.completed;
            const newCount = t.targetCount 
              ? (isNowCompleted ? (t.accumulatedCount || 0) + 1 : Math.max(0, (t.accumulatedCount || 0) - 1))
              : (t.accumulatedCount || 0);
            
            if (t.originalId) {
              libUpdate = { 
                id: t.originalId, 
                count: newCount, 
                lastCompletedAt: isNowCompleted ? now : t.lastCompletedAt 
              };
            }
            return { ...t, completed: isNowCompleted, accumulatedCount: newCount, lastCompletedAt: isNowCompleted ? now : t.lastCompletedAt };
          }
          return t;
        })
      }));
      if (libUpdate) {
        setLibrary(prev => prev.map(lt => lt.id === (libUpdate as any).id ? { ...lt, accumulatedCount: (libUpdate as any).count, lastCompletedAt: (libUpdate as any).lastCompletedAt } : lt));
      }
      return nextDays;
    });
  };

  const handleUpdateTask = (updatedTask: Task) => {
    setDays(prev => prev.map(d => ({ ...d, tasks: d.tasks.map(t => t.id === updatedTask.id ? updatedTask : t) })));
    setLibrary(prev => prev.map(t => t.id === updatedTask.id || (t.id === updatedTask.originalId) ? { ...updatedTask, id: t.id } : t));
    setEditingTask(null);
  };

  const handleUpdateGoal = (updatedGoal: Goal) => {
    setGoals(prev => prev.map(g => g.id === updatedGoal.id ? updatedGoal : g));
    setEditingGoal(null);
  };

  const handleDeleteGoal = (goalId: string) => {
    if (confirm('确认删除此目标及其所有关键结果？链接关系将被断开。')) {
      setGoals(prev => prev.filter(g => g.id !== goalId));
      setEditingGoal(null);
      setLibrary(prev => prev.map(t => t.krId && goals.find(g => g.id === goalId)?.keyResults.some(kr => kr.id === t.krId) ? { ...t, krId: undefined } : t));
      setHabits(prev => prev.map(h => h.krId && goals.find(g => g.id === goalId)?.keyResults.some(kr => kr.id === h.krId) ? { ...h, krId: undefined } : h));
    }
  };

  // 弹窗渲染逻辑
  const renderTaskEditModal = () => {
    if (!editingTask) return null;
    return (
      <div className="fixed inset-0 z-[300] bg-slate-900/60 backdrop-blur-md flex items-end justify-center p-4" onClick={() => setEditingTask(null)}>
        <div className="bg-white w-full max-w-md rounded-sm p-6 shadow-2xl animate-in slide-in-from-bottom duration-300 max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-black uppercase text-slate-400">编辑库任务</h3>
            <button onClick={() => setEditingTask(null)}><X size={20} className="text-slate-300" /></button>
          </div>
          <div className="space-y-4">
            <div className="space-y-1">
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest pl-1">任务名称</span>
              <input className="w-full bg-slate-50 p-4 text-lg font-bold rounded-sm outline-none border border-slate-100" value={editingTask.title} onChange={e => setEditingTask({ ...editingTask, title: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest pl-1">分类</span>
                <input className="w-full bg-slate-50 p-3 text-xs font-bold rounded-sm outline-none border border-slate-100" value={editingTask.category} onChange={e => setEditingTask({ ...editingTask, category: e.target.value })} />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest pl-1">链接关键结果</span>
                <select className="w-full bg-slate-50 p-3 text-[10px] font-bold rounded-sm outline-none appearance-none border border-slate-100" value={editingTask.krId || ''} onChange={e => setEditingTask({...editingTask, krId: e.target.value || undefined})}>
                  <option value="">不关联</option>
                  {goals.map(g => (
                    <optgroup key={g.id} label={g.title}>
                      {g.keyResults.map(kr => <option key={kr.id} value={kr.id}>{kr.title}</option>)}
                    </optgroup>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest pl-1">已累计次数</span>
                <input type="number" className="w-full bg-slate-50 p-3 text-xs font-bold rounded-sm outline-none border border-slate-100" value={editingTask.accumulatedCount || 0} onChange={e => setEditingTask({ ...editingTask, accumulatedCount: parseInt(e.target.value) || 0 })} />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest pl-1">总目标</span>
                <input type="number" className="w-full bg-slate-50 p-3 text-xs font-bold rounded-sm outline-none border border-slate-100" value={editingTask.targetCount || 0} onChange={e => setEditingTask({ ...editingTask, targetCount: parseInt(e.target.value) || 0 })} />
              </div>
            </div>
            <button onClick={() => handleUpdateTask(editingTask)} className="w-full py-4 text-white font-black uppercase tracking-widest rounded-sm shadow-xl active:scale-95 transition-all mt-2" style={{ background: `linear-gradient(135deg, ${theme.color}, ${theme.color}80)` }}>保存修改</button>
          </div>
        </div>
      </div>
    );
  };

  const renderHabitEdit = () => {
    if (!editingHabit) return null;
    return (
      <div className="fixed inset-0 z-[300] bg-slate-900/60 backdrop-blur-md flex items-end justify-center p-4" onClick={() => setEditingHabit(null)}>
        <div className="bg-white w-full max-w-md rounded-sm p-6 shadow-2xl animate-in slide-in-from-bottom duration-300 max-h-[85vh] overflow-y-auto no-scrollbar" onClick={e => e.stopPropagation()}>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-black uppercase text-slate-400">配置习惯</h3>
            <button onClick={() => setEditingHabit(null)}><X size={20} className="text-slate-300" /></button>
          </div>
          <div className="space-y-4">
            <div className="space-y-1">
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest pl-1">习惯名称</span>
              <input className="w-full bg-slate-50 p-4 text-lg font-bold rounded-sm outline-none border border-slate-100 shadow-inner" value={editingHabit.title} onChange={e => setEditingHabit({ ...editingHabit, title: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest pl-1">分类</span>
                <input className="w-full bg-slate-50 p-3 text-xs font-bold rounded-sm outline-none border border-slate-100" value={editingHabit.category} onChange={e => setEditingHabit({ ...editingHabit, category: e.target.value })} />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest pl-1">链接关键结果</span>
                <select className="w-full bg-slate-50 p-3 text-[10px] font-bold rounded-sm outline-none border border-slate-100" value={editingHabit.krId || ''} onChange={e => setEditingHabit({...editingHabit, krId: e.target.value || undefined})}>
                  <option value="">不关联</option>
                  {goals.map(g => (<optgroup key={g.id} label={g.title}>{g.keyResults.map(kr => (<option key={kr.id} value={kr.id}>{kr.title}</option>))}</optgroup>))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest pl-1">频率(天)</span>
                <input type="number" className="w-full bg-slate-50 p-3 text-xs font-bold rounded-sm outline-none border border-slate-100" value={editingHabit.frequencyDays || 1} onChange={e => setEditingHabit({ ...editingHabit, frequencyDays: parseInt(e.target.value) || 1 })} />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest pl-1">频率(次)</span>
                <input type="number" className="w-full bg-slate-50 p-3 text-xs font-bold rounded-sm outline-none border border-slate-100" value={editingHabit.frequencyTimes || 1} onChange={e => setEditingHabit({ ...editingHabit, frequencyTimes: parseInt(e.target.value) || 1 })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest pl-1">已累计</span>
                <input type="number" className="w-full bg-slate-50 p-3 text-xs font-bold rounded-sm outline-none border border-slate-100" value={editingHabit.accumulatedCount || 0} onChange={e => setEditingHabit({ ...editingHabit, accumulatedCount: parseInt(e.target.value) || 0 })} />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest pl-1">总目标</span>
                <input type="number" className="w-full bg-slate-50 p-3 text-xs font-bold rounded-sm outline-none border border-slate-100" value={editingHabit.targetCount || 1} onChange={e => setEditingHabit({ ...editingHabit, targetCount: parseInt(e.target.value) || 1 })} />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest pl-1">主题配色</span>
              <div className="flex flex-wrap gap-2.5 px-1 py-1">
                {VIBRANT_COLORS.map(c => (
                  <button key={c} onClick={() => setEditingHabit({...editingHabit, color: c})} className={`w-8 h-8 rounded-full transition-all flex items-center justify-center shadow-sm ${editingHabit.color === c ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : 'opacity-60 hover:opacity-100'}`} style={{ backgroundColor: c }}>
                     {editingHabit.color === c && <div className="w-1 h-1 bg-white rounded-full" />}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={() => { setHabits(prev => prev.map(h => h.id === editingHabit.id ? editingHabit : h)); setEditingHabit(null); }} className="w-full py-4 text-white font-black uppercase tracking-widest rounded-sm shadow-xl active:scale-95 transition-all mt-4" style={{ background: `linear-gradient(135deg, ${editingHabit.color}, ${editingHabit.color}80)` }}>确认同步</button>
          </div>
        </div>
      </div>
    );
  };

  const renderGoalEdit = () => {
    if (!editingGoal) return null;
    return (
      <div className="fixed inset-0 z-[300] bg-slate-900/60 backdrop-blur-md flex items-end justify-center p-4" onClick={() => setEditingGoal(null)}>
        <div className="bg-white w-full max-w-md rounded-sm p-6 shadow-2xl animate-in slide-in-from-bottom duration-300 max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-black uppercase text-slate-400">编辑大目标</h3>
            <button onClick={() => setEditingGoal(null)}><X size={20} className="text-slate-300" /></button>
          </div>
          <div className="space-y-4">
            <div className="space-y-1">
               <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest pl-1">目标名称</span>
               <input className="w-full bg-slate-50 p-4 text-lg font-bold rounded-sm outline-none border border-slate-100 shadow-inner" value={editingGoal.title} onChange={e => setEditingGoal({ ...editingGoal, title: e.target.value })} />
            </div>
            <div className="space-y-3">
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest pl-1">关键结果 (KR)</span>
              {editingGoal.keyResults.map((kr, idx) => (
                <div key={kr.id} className="p-3 bg-slate-50 rounded-sm flex justify-between items-center group border border-slate-100">
                  <input className="bg-transparent text-xs font-bold outline-none w-full" value={kr.title} onChange={e => {
                    const newKrs = [...editingGoal.keyResults];
                    newKrs[idx].title = e.target.value;
                    setEditingGoal({...editingGoal, keyResults: newKrs});
                  }} />
                  <button onClick={() => setEditingGoal({...editingGoal, keyResults: editingGoal.keyResults.filter(k => k.id !== kr.id)})} className="text-rose-400 opacity-0 group-hover:opacity-100 p-1 active:scale-90 transition-opacity"><Trash2 size={12} /></button>
                </div>
              ))}
              <button onClick={() => setEditingGoal({...editingGoal, keyResults: [...editingGoal.keyResults, { id: `kr-${Date.now()}`, title: '新增关键结果', progress: 0 }]})} className="w-full py-3 bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest rounded-sm border border-dashed border-slate-200">
                + 添加关键结果
              </button>
            </div>
            <div className="flex flex-col gap-2 pt-4">
              <button onClick={() => handleUpdateGoal(editingGoal)} className="w-full py-4 text-white font-black uppercase tracking-widest rounded-sm shadow-xl active:scale-95 transition-all" style={{ background: `linear-gradient(135deg, ${theme.color}, ${theme.color}80)` }}>保存修改</button>
              <button onClick={() => handleDeleteGoal(editingGoal.id)} className="w-full py-3 text-rose-500 font-black uppercase tracking-widest rounded-sm border border-rose-100 bg-rose-50/50 active:scale-95 transition-all flex items-center justify-center gap-2">删除大目标</button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderCreationModal = () => {
    if (!isCreating) return null;
    const { type, defaultCategory } = isCreating;
    return (
      <div className="fixed inset-0 z-[250] bg-slate-900/60 backdrop-blur-md flex items-end justify-center p-4">
        <div className="bg-white w-full max-w-md rounded-sm p-6 shadow-2xl animate-in slide-in-from-bottom duration-300">
           <div className="flex justify-between items-center mb-6">
             <h3 className="text-sm font-black uppercase text-slate-400">
               {type === 'task' ? '新增库任务' : type === 'habit' ? '新增习惯' : type === 'goal' ? '新增目标' : '新增事项'}
             </h3>
             <button onClick={() => setIsCreating(null)}><X size={20} className="text-slate-300" /></button>
           </div>
           <form className="space-y-4" onSubmit={(e) => {
             e.preventDefault();
             const formData = new FormData(e.currentTarget);
             const title = formData.get('title') as string;
             if (!title) return;
             if (type === 'task') setLibrary([...library, { id: `lib-${Date.now()}`, title, category: defaultCategory || '工作', type: 'focus', targetCount: 0, accumulatedCount: 0, resetCycle: 'none' }]);
             else if (type === 'habit') setHabits([...habits, { id: `h-${Date.now()}`, title, category: defaultCategory || '提升', streak: 0, frequencyDays: 1, frequencyTimes: 1, iconName: 'Star', color: theme.color, targetCount: 1, accumulatedCount: 0, resetCycle: 'daily' }]);
             else if (type === 'goal') setGoals([...goals, { id: `g-${Date.now()}`, title, category: '发展', keyResults: [] }]);
             else if (type === 'temp_task') {
               const now = new Date();
               const isToday = activeDate === now.getDate();
               const currentHour = now.getHours();
               const autoTime = (isToday && currentHour >= 7 && currentHour <= 22) ? `${currentHour < 10 ? '0' + currentHour : currentHour}:00` : undefined;
               const newTask: Task = { id: `tmp-${Date.now()}`, title, category: defaultCategory || '事项', type: 'completed', date: activeDate, time: autoTime };
               setDays(prev => prev.map(d => d.date === activeDate ? { ...d, tasks: [...d.tasks, newTask] } : d));
             }
             setIsCreating(null);
           }}>
             <input name="title" autoFocus className="w-full bg-slate-50 p-4 text-lg font-bold rounded-sm outline-none border border-slate-100 shadow-inner" placeholder="输入名称..." />
             <button type="submit" className="w-full py-4 text-white font-black uppercase tracking-widest rounded-sm shadow-xl active:scale-95 transition-all mt-4" style={{ background: `linear-gradient(135deg, ${theme.color}, ${theme.color}80)` }}>确认新增</button>
           </form>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-white flex flex-col items-center justify-center z-[500] animate-in fade-in duration-500">
        <div className="w-12 h-12 rounded-sm mb-4 animate-pulse" style={{ background: `linear-gradient(135deg, ${theme.color}, ${theme.color}80)` }} />
        <h2 className="text-xl font-black tracking-tighter text-slate-800 uppercase">极简日程</h2>
        <div className="mt-8 flex gap-1">
          {[0,1,2].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-slate-200 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="relative max-w-md mx-auto min-h-screen bg-white flex flex-col shadow-xl overflow-hidden">
      <div className="flex-1 relative overflow-hidden">
        {/* 页面平移容器 */}
        <div className="view-slider" style={{ transform: `translateX(-${viewIndex * 25}%)` }}>
          <div className="view-slide">
             <OverviewPage days={processedDays} theme={theme} activeDate={activeDate} onDateChange={setActiveDate} onAddTask={(t) => setDays(prev => prev.map(d => d.date === activeDate ? { ...d, tasks: [...d.tasks, { ...t, id: `inst-${Date.now()}`, originalId: t.id }] } : d))} onOpenSidebar={() => setIsSidebarOpen(true)} library={library} goals={goals} />
          </div>
          <div className="view-slide">
             <DailyDetailPage days={processedDays} goals={goals} habits={habits} activeDate={activeDate} onDateChange={setActiveDate} onToggleLibrary={() => setCurrentView('library')} onOpenQuickMenu={() => setIsCreating({ type: 'temp_task' })} onToggleTaskComplete={handleToggleTaskComplete} onToggleHabitComplete={handleToggleHabitComplete} onEditTask={setEditingTask} onOpenSidebar={() => setIsSidebarOpen(true)} onUpdateTask={handleUpdateTask} theme={theme} />
          </div>
          <div className="view-slide">
             <TaskLibraryPage theme={theme} library={library} habits={habits} goals={goals} onEditTask={setEditingTask} onEditHabit={setEditingHabit} onEditGoal={setEditingGoal} onOpenSidebar={() => setIsSidebarOpen(true)} allTasks={[]} onAddTask={() => setIsCreating({ type: 'task' })} onToggleHabitComplete={handleToggleHabitComplete} onDeleteHabit={() => {}} onDeleteGoal={() => {}} onDeleteTask={() => {}} onCreateItem={(type, cat) => setIsCreating({ type, defaultCategory: cat })} />
          </div>
          <div className="view-slide">
             <ReviewPage theme={theme} activeDate={activeDate} days={processedDays} habits={habits} scoreDefs={scoreDefs} setScoreDefs={setScoreDefs} onUpdateDay={handleUpdateDayData} onOpenSidebar={() => setIsSidebarOpen(true)} />
          </div>
        </div>
      </div>
      
      <BottomNav currentView={currentView} onViewChange={setCurrentView} theme={theme} />
      
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} currentTheme={theme} onThemeChange={setTheme} onClearTasks={() => setDays(INITIAL_DAYS)} onBackup={() => {}} onRestore={() => {}} />
      
      {/* 所有的弹窗 */}
      <div className="z-[300]">
        {renderTaskEditModal()}
        {renderHabitEdit()}
        {renderGoalEdit()}
        {renderCreationModal()}
      </div>
    </div>
  );
};

export default App;
