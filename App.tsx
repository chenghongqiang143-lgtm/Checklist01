
import React, { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import { createPortal } from 'react-dom';
import { AppView, DayInfo, Task, ThemeOption, Goal, Habit, ScoreDefinition, Reward, Subtask, HabitInstance, PurchaseRecord, TaskPriority } from './types';
import { THEME_OPTIONS, LIBRARY_TASKS } from './constants';
import BottomNav from './components/BottomNav';
import { X, Plus, Loader2, Trash2, Target, ListTodo, RotateCcw, Check, AlertCircle, Clock, Circle } from 'lucide-react';

// Lazy load page components
const DailyDetailPage = lazy(() => import('./components/DailyDetailPage'));
const TaskLibraryPage = lazy(() => import('./components/TaskLibraryPage'));
const OverviewPage = lazy(() => import('./components/OverviewPage'));
const ReviewPage = lazy(() => import('./components/ReviewPage'));
const Sidebar = lazy(() => import('./components/Sidebar'));

const INITIAL_HABITS: Habit[] = [
  { id: 'h1', title: '早起 (06:00)', streak: 12, category: '生活', frequencyDays: 1, frequencyTimes: 1, iconName: 'Sun', color: '#f43f5e', targetCount: 1, accumulatedCount: 0, resetCycle: 'daily', completionTimes: [], lastCompletedAt: Date.now() - 86400000 },
  { id: 'h2', title: '阅读 30min', streak: 5, category: '学习', frequencyDays: 1, frequencyTimes: 1, iconName: 'Book', color: '#0ea5e9', krId: 'kr1', targetCount: 1, accumulatedCount: 0, resetCycle: 'daily', completionTimes: [] },
];

const INITIAL_REWARDS: Reward[] = [
  { id: 'r1', title: '喝杯奶茶', cost: 10, icon: 'Coffee' },
  { id: 'r2', title: '游戏1小时', cost: 15, icon: 'Gamepad' },
  { id: 'r3', title: '购买心愿单物品', cost: 50, icon: 'ShoppingBag' }
];

const INITIAL_TEMPLATES = [
  { id: 'tmp1', name: '三件好事', text: "✨ 今日三件好事：\n1. \n2. \n3. " },
  { id: 'tmp2', name: '成功日记', text: "🏆 今日成就：\n🚩 核心产出：\n💡 待改进点：" },
];

// Helper to generate current week days
const generateCurrentWeekDays = (): DayInfo[] => {
  const now = new Date();
  const dayOfWeek = now.getDay() || 7; // 1-7
  const monday = new Date(now);
  monday.setDate(now.getDate() - dayOfWeek + 1);
  
  const weekdays = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
  return Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return {
      date: d.getDate(),
      weekday: weekdays[i],
      fullDate: `${d.getMonth() + 1}月${d.getDate()}日`,
      tasks: [],
      scheduledHabits: []
    };
  });
};

// Loading fallback component
const PageLoader = () => (
  <div className="h-full w-full flex items-center justify-center bg-slate-50/50">
    <Loader2 className="animate-spin text-slate-300" size={24} />
  </div>
);

// Quick Create Modal Component
const QuickCreateModal: React.FC<{
  type: 'task' | 'habit' | 'goal' | 'temp_task' | 'reward';
  defaultCategory?: string;
  allCategories: string[];
  themeColor: string;
  onClose: () => void;
  onConfirm: (title: string, category: string) => void;
}> = ({ type, defaultCategory, allCategories, themeColor, onClose, onConfirm }) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(defaultCategory || '默认');

  const getTitle = () => {
    switch(type) {
      case 'task': return '新建待办任务 (Library)';
      case 'habit': return '新建打卡习惯 (Habit)';
      case 'goal': return '新建年度目标 (Goal)';
      case 'temp_task': return '今日临时事项 (Daily)';
      case 'reward': return '新建奖励项 (Reward)';
      default: return '快速创建';
    }
  };

  const categories = Array.from(new Set([...allCategories, '默认', '工作', '学习', '生活', '健康']));

  const handleSubmit = () => {
    if(!title.trim()) return;
    onConfirm(title, category);
  };

  return (
    <div className="fixed inset-0 z-[700] bg-slate-900/80 flex items-end justify-center p-4" onClick={onClose}>
        <div className="bg-white w-full max-w-md rounded-sm p-6 shadow-2xl animate-in slide-in-from-bottom duration-300" onClick={e => e.stopPropagation()}>
           <div className="flex justify-between mb-6 items-center">
             <div className="flex items-center gap-2">
               <div className="w-1 h-4 rounded-full" style={{ background: themeColor }} />
               <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">{getTitle()}</h3>
             </div>
             <button onClick={onClose}><X size={20} className="text-slate-300 hover:text-slate-500"/></button>
           </div>
           
           <input 
             autoFocus 
             className="w-full bg-slate-50 p-4 text-lg font-bold rounded-sm border-none outline-none focus:bg-slate-100 transition-colors mb-6" 
             placeholder="输入名称..." 
             value={title}
             onChange={e => setTitle(e.target.value)}
             onKeyDown={e => {
                if (e.key === 'Enter') handleSubmit();
             }} 
           />

           <div className="mb-6">
              <div className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-2 pl-1">选择分类 / CATEGORY</div>
              <div className="flex flex-wrap gap-2 max-h-[120px] overflow-y-auto no-scrollbar">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`px-3 py-1.5 rounded-sm text-[10px] font-black uppercase tracking-wide transition-all ${category === cat ? 'text-white shadow-md' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                    style={{ background: category === cat ? themeColor : undefined }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
           </div>

           <button 
            onClick={handleSubmit}
            className="w-full py-4 text-white font-black uppercase rounded-sm shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2"
            style={{ background: themeColor }}
           >
             <Check size={16} strokeWidth={3} /> 确认创建
           </button>
        </div>
      </div>
  );
};

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  const [days, setDays] = useState<DayInfo[]>(() => generateCurrentWeekDays());
  const [library, setLibrary] = useState<Task[]>(LIBRARY_TASKS);
  const [habits, setHabits] = useState<Habit[]>(INITIAL_HABITS);
  const [rewards, setRewards] = useState<Reward[]>(INITIAL_REWARDS);
  const [purchaseHistory, setPurchaseHistory] = useState<PurchaseRecord[]>([]);
  const [reflectionTemplates, setReflectionTemplates] = useState(INITIAL_TEMPLATES);
  const [goals, setGoals] = useState<Goal[]>([
    { id: 'g1', title: '掌控前端艺术', category: '学习', keyResults: [{ id: 'kr1', title: '实战项目完成', progress: 30 }] }
  ]);
  const [scoreDefs, setScoreDefs] = useState<ScoreDefinition[]>([
    { id: 's1', label: '专注度', labels: { [-2]: '极度涣散', [-1]: '状态一般', [0]: '正常水平', [1]: '高效专注', [2]: '心流状态' } },
    { id: 's2', label: '心情值', labels: { [-2]: '极差', [-1]: '低落', [0]: '平静', [1]: '愉快', [2]: '亢奋' } },
  ]);
  const [activeDate, setActiveDate] = useState<number>(new Date().getDate());
  const [activeLibraryTab, setActiveLibraryTab] = useState<'task' | 'habit' | 'goal'>('task');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [theme, setTheme] = useState<ThemeOption>(THEME_OPTIONS[0]);

  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [isHabitAppearanceOpen, setIsHabitAppearanceOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [isCreating, setIsCreating] = useState<{ type: 'task' | 'habit' | 'goal' | 'temp_task' | 'reward', defaultCategory?: string } | null>(null);

  const allCategories = useMemo(() => {
    const cats = [
      ...library.map(t => t.category),
      ...habits.map(h => h.category),
      ...goals.map(g => g.category)
    ];
    return Array.from(new Set(cats)).filter(Boolean).sort();
  }, [library, habits, goals]);

  // Load data from localStorage on mount
  useEffect(() => {
    const loadData = () => {
      try {
        const savedData = localStorage.getItem('MINIMALIST_SCHEDULE_DATA');
        if (savedData) {
          const parsed = JSON.parse(savedData);
          if (parsed.days && parsed.days.length > 0) setDays(parsed.days);
          if (parsed.library) setLibrary(parsed.library);
          if (parsed.habits) setHabits(parsed.habits);
          if (parsed.goals) setGoals(parsed.goals);
          if (parsed.rewards) setRewards(parsed.rewards);
          if (parsed.purchaseHistory) setPurchaseHistory(parsed.purchaseHistory);
          if (parsed.reflectionTemplates) setReflectionTemplates(parsed.reflectionTemplates);
          if (parsed.scoreDefs) setScoreDefs(parsed.scoreDefs);
          if (parsed.theme) setTheme(parsed.theme);
        }
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setIsDataLoaded(true);
      }
    };
    loadData();
  }, []);

  // Save data to localStorage
  useEffect(() => {
    if (!isDataLoaded) return;
    
    const dataToSave = {
      days,
      library,
      habits,
      goals,
      rewards,
      purchaseHistory,
      reflectionTemplates,
      scoreDefs,
      theme,
      version: '2.8.5',
      timestamp: Date.now(),
    };

    try {
      localStorage.setItem('MINIMALIST_SCHEDULE_DATA', JSON.stringify(dataToSave));
    } catch (error) {
      console.error('Failed to save data:', error);
    }
  }, [days, library, habits, goals, rewards, purchaseHistory, reflectionTemplates, scoreDefs, theme, isDataLoaded]);

  // ... (Rest of logic remains same)
  const totalEarned = useMemo(() => {
    return days.reduce((sum, d) => sum + (d.scores?.reduce((ds, s) => ds + s.value, 0) || 0), 0);
  }, [days]);

  const totalSpent = useMemo(() => {
    return purchaseHistory.reduce((sum, record) => sum + record.cost, 0);
  }, [purchaseHistory]);

  const currentBalance = totalEarned - totalSpent;

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  const handleToggleTaskComplete = (taskId: string) => {
    setDays(prev => prev.map(d => ({
      ...d,
      tasks: d.tasks.map(t => {
        if (t.id === taskId || t.originalId === taskId) {
          if (!t.targetCount) {
             return { ...t, completed: !t.completed, lastCompletedAt: !t.completed ? Date.now() : t.lastCompletedAt };
          }
          const current = t.accumulatedCount || 0;
          const target = t.targetCount;
          const nextCount = current >= target ? 0 : current + 1;
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
    const isInLibrary = library.some(t => t.id === updatedTask.id);
    if (isInLibrary) {
      setLibrary(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
      setDays(prev => prev.map(d => ({
        ...d,
        tasks: d.tasks.map(t => t.originalId === updatedTask.id ? { 
          ...updatedTask, 
          id: t.id, 
          originalId: updatedTask.id, 
          time: t.time, 
          date: t.date,
          completed: updatedTask.targetCount ? (updatedTask.accumulatedCount || 0) >= updatedTask.targetCount : t.completed,
          accumulatedCount: updatedTask.accumulatedCount ?? t.accumulatedCount,
          subtasks: updatedTask.subtasks || t.subtasks
        } : t)
      })));
    } else {
      setDays(prev => prev.map(d => ({
        ...d,
        tasks: d.tasks.map(t => t.id === updatedTask.id ? updatedTask : t)
      })));
      if (updatedTask.originalId) {
        setLibrary(prev => prev.map(t => t.id === updatedTask.originalId ? { 
          ...t, 
          title: updatedTask.title, 
          category: updatedTask.category, 
          krId: updatedTask.krId,
          targetCount: updatedTask.targetCount,
          accumulatedCount: updatedTask.accumulatedCount,
          subtasks: updatedTask.subtasks,
          priority: updatedTask.priority
        } : t));
      }
    }
    setEditingTask(null);
  };

  const handleDeleteTaskFromLibrary = (taskId: string) => {
    setLibrary(prev => prev.filter(t => t.id !== taskId));
    setDays(prev => prev.map(d => ({ ...d, tasks: d.tasks.filter(t => t.originalId !== taskId && t.id !== taskId) })));
    setEditingTask(null);
  };

  const handleUpdateHabit = (updatedHabit: Habit) => {
    setHabits(prev => prev.map(h => h.id === updatedHabit.id ? updatedHabit : h));
    setEditingHabit(null);
    setIsHabitAppearanceOpen(false);
  };

  const handleDeleteHabit = (habitId: string) => {
    setHabits(prev => prev.filter(h => h.id !== habitId));
    setEditingHabit(null);
  };

  const handleUpdateGoal = (updatedGoal: Goal) => {
    setGoals(prev => prev.map(g => g.id === updatedGoal.id ? updatedGoal : g));
    setEditingGoal(null);
  };

  const handleDeleteGoal = (goalId: string) => {
    setGoals(prev => prev.filter(g => g.id !== goalId));
    setEditingGoal(null);
  };

  const handlePurchaseReward = (reward: Reward) => {
    if (currentBalance >= reward.cost) {
      const newRecord: PurchaseRecord = {
        id: `pr-${Date.now()}`,
        rewardId: reward.id,
        rewardTitle: reward.title,
        cost: reward.cost,
        timestamp: Date.now()
      };
      setPurchaseHistory(prev => [newRecord, ...prev]);
      return true;
    }
    return false;
  };

  const handleToggleHabitComplete = (habitId: string, forcedHour?: number) => {
    if (forcedHour === undefined) return;
    const hourStr = `${forcedHour < 10 ? '0' + forcedHour : forcedHour}:00`;
    setDays(prev => prev.map(d => {
      if (d.date === activeDate) {
        const existing = d.scheduledHabits?.find(hi => hi.habitId === habitId && hi.time === hourStr);
        if (existing) {
          return { ...d, scheduledHabits: d.scheduledHabits?.filter(hi => hi !== existing) };
        }
        const newInstance: HabitInstance = {
          id: `hi-${Date.now()}`,
          habitId: habitId,
          time: hourStr,
          completed: false
        };
        return { ...d, scheduledHabits: [...(d.scheduledHabits || []), newInstance] };
      }
      return d;
    }));
  };

  const handleToggleHabitInstance = (instanceId: string) => {
    let affectedHabitId = '';
    let isNowCompleted = false;

    setDays(prev => prev.map(d => {
      if (d.date === activeDate) {
        const updatedHabits = d.scheduledHabits?.map(hi => {
          if (hi.id === instanceId) {
            affectedHabitId = hi.habitId;
            isNowCompleted = !hi.completed;
            return { ...hi, completed: isNowCompleted };
          }
          return hi;
        });
        return { ...d, scheduledHabits: updatedHabits };
      }
      return d;
    }));

    if (affectedHabitId) {
      setHabits(prev => prev.map(h => {
        if (h.id === affectedHabitId) {
          const nextCount = isNowCompleted ? (h.accumulatedCount || 0) + 1 : Math.max(0, (h.accumulatedCount || 0) - 1);
          return { 
            ...h, 
            accumulatedCount: nextCount, 
            completedToday: nextCount >= (h.targetCount || 1), 
            streak: (isNowCompleted && nextCount >= (h.targetCount || 1) && !h.completedToday) ? h.streak + 1 : h.streak,
            lastCompletedAt: isNowCompleted ? Date.now() : h.lastCompletedAt 
          };
        }
        return h;
      }));
    }
  };

  const handleAddTaskToDay = (taskTemplate: Task) => {
    setDays(prev => prev.map(d => {
      if (d.date === activeDate) {
        const existingTask = d.tasks.find(t => t.originalId === taskTemplate.id);
        if (existingTask) {
          return { ...d, tasks: d.tasks.filter(t => t.originalId !== taskTemplate.id) };
        } else {
          const newTask: Task = {
            ...taskTemplate,
            id: 't-' + Date.now(),
            originalId: taskTemplate.id,
            date: activeDate,
            completed: false,
            accumulatedCount: taskTemplate.accumulatedCount || 0,
            time: undefined,
            subtasks: taskTemplate.subtasks ? taskTemplate.subtasks.map(s => ({ ...s, completed: false })) : []
          };
          return { ...d, tasks: [...d.tasks, newTask] };
        }
      }
      return d;
    }));
  };

  const handleRetractTask = (taskId: string) => {
    setDays(prev => prev.map(d => ({
      ...d,
      tasks: d.tasks.map(t => (t.id === taskId) ? { ...t, time: undefined } : t)
    })));
  };

  const handleCreateItem = (title: string, category: string) => {
     if (!isCreating) return;
     if (isCreating.type === 'goal') setGoals([...goals, { id: 'g-'+Date.now(), title, category, keyResults: [] }]);
     else if (isCreating.type === 'temp_task') handleAddTaskToDay({ id: 'tmp-'+Date.now(), title, category, type: 'completed' });
     else if (isCreating.type === 'habit') setHabits([...habits, { id: 'h-'+Date.now(), title, category, streak: 0, frequencyDays: 1, frequencyTimes: 1, color: theme.color, iconName: 'Star', targetCount: 1, accumulatedCount: 0, completionTimes: [] }]);
     else if (isCreating.type === 'task') setLibrary([...library, { id: 'lib-'+Date.now(), title, category, type: 'focus', priority: 'normal' }]);
     else if (isCreating.type === 'reward') setRewards([...rewards, { id: 'r-'+Date.now(), title, cost: 10, icon: 'Gift' }]);
     
     setIsCreating(null);
  };

  const handleBackup = () => {
    const data = {
      version: '2.8.5',
      timestamp: Date.now(),
      days,
      library,
      habits,
      goals,
      rewards,
      purchaseHistory,
      reflectionTemplates,
      scoreDefs,
      theme
    };
    try {
      const json = JSON.stringify(data, null, 2);
      navigator.clipboard.writeText(json).then(() => {
        alert('备份数据已复制到剪贴板！\n您可以将其粘贴到记事本保存，或在其他设备上恢复。');
      }).catch(() => {
        alert('复制失败，请检查浏览器权限。');
      });
    } catch (err) {
      alert('备份生成失败');
    }
  };

  const handleRestore = (json: string) => {
    if (!json.trim()) return;
    try {
      const data = JSON.parse(json);
      if (data.days) setDays(data.days);
      if (data.library) setLibrary(data.library);
      if (data.habits) setHabits(data.habits);
      if (data.goals) setGoals(data.goals);
      if (data.rewards) setRewards(data.rewards);
      if (data.purchaseHistory) setPurchaseHistory(data.purchaseHistory);
      if (data.reflectionTemplates) setReflectionTemplates(data.reflectionTemplates);
      if (data.scoreDefs) setScoreDefs(data.scoreDefs);
      if (data.theme) setTheme(data.theme);
      alert('数据恢复成功！');
      setIsSidebarOpen(false);
    } catch (e) {
      alert('恢复失败：无效的 JSON 数据格式。');
    }
  };

  const handleClearTasks = () => {
    if (!window.confirm('确定要清空所有日期的日程安排吗？\n\n注意：任务库、习惯定义和目标将被保留，但所有日期的任务记录、打卡记录和复盘内容将被永久删除。')) {
      return;
    }
    // We recreate current week days to clear everything but keep the structure
    setDays(generateCurrentWeekDays());
    alert('所有日程已清空并重置为本周。');
  };

  const getTranslateX = () => {
    switch (currentView) {
      case 'overview': return '0%';
      case 'daily': return '-25%';
      case 'library': return '-50%';
      case 'review': return '-75%';
      default: return '0%';
    }
  };

  const renderGlobalOverlays = () => {
    // ... (Keep existing overlays code unchanged)
    const overlays = [];
    if (editingHabit) overlays.push(
      <div key="editHabit" className="fixed inset-0 z-[700] bg-slate-900/80 flex items-end justify-center p-4" onClick={() => { setEditingHabit(null); setIsHabitAppearanceOpen(false); }}>
        <div className="bg-white w-full max-w-md rounded-sm p-6 shadow-2xl animate-in slide-in-from-bottom duration-300 max-h-[90vh] overflow-y-auto no-scrollbar" onClick={e => e.stopPropagation()}>
           <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <button onClick={() => handleDeleteHabit(editingHabit.id)} className="p-2 bg-rose-50 text-rose-500 rounded-sm hover:bg-rose-100 transition-colors"><Trash2 size={18} /></button>
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">习惯设置</h3>
              </div>
              <button onClick={() => { setEditingHabit(null); setIsHabitAppearanceOpen(false); }}><X size={20}/></button>
           </div>
           <div className="space-y-5 pb-4">
             <div className="space-y-1"><span className="text-[9px] font-black text-slate-300 uppercase pl-1">习惯标题</span><input className="w-full bg-slate-50 p-4 text-lg font-bold rounded-sm border border-slate-100 outline-none focus:bg-white transition-colors" value={editingHabit.title} onChange={e => setEditingHabit({ ...editingHabit, title: e.target.value })} /></div>
             
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-[9px] font-black text-slate-300 uppercase pl-1">习惯分类</span>
                  <select className="w-full bg-slate-50 p-3 text-xs font-bold rounded-sm border border-slate-100 outline-none appearance-none" value={editingHabit.category} onChange={e => setEditingHabit({ ...editingHabit, category: e.target.value })}>{allCategories.map(c => <option key={c} value={c}>{c}</option>)}{!allCategories.includes(editingHabit.category) && <option value={editingHabit.category}>{editingHabit.category}</option>}</select>
                </div>
                <div className="space-y-1">
                   <span className="text-[9px] font-black text-slate-300 uppercase pl-1">关联目标 (KR)</span>
                   <select className="w-full bg-slate-50 p-3 text-xs font-bold rounded-sm border border-slate-100 outline-none appearance-none" value={editingHabit.krId || ''} onChange={e => setEditingHabit({ ...editingHabit, krId: e.target.value || undefined})}>
                      <option value="">不关联目标</option>
                      {goals.map(g => (
                        <optgroup key={g.id} label={g.title}>
                          {g.keyResults.map(kr => <option key={kr.id} value={kr.id}>{kr.title}</option>)}
                        </optgroup>
                      ))}
                   </select>
                </div>
             </div>

             <div className="grid grid-cols-2 gap-4"><div className="space-y-1"><span className="text-[9px] font-black text-slate-300 uppercase tracking-tight pl-1">频率（天数）</span><input type="number" className="w-full bg-slate-50 p-3 text-xs font-bold rounded-sm border border-slate-100 outline-none" value={editingHabit.frequencyDays || 1} onChange={e => setEditingHabit({...editingHabit, frequencyDays: parseInt(e.target.value) || 1})} /></div><div className="space-y-1"><span className="text-[9px] font-black text-slate-300 uppercase tracking-tight pl-1">频率（次数）</span><input type="number" className="w-full bg-slate-50 p-3 text-xs font-bold rounded-sm border border-slate-100 outline-none" value={editingHabit.frequencyTimes || 1} onChange={e => setEditingHabit({...editingHabit, frequencyTimes: parseInt(e.target.value) || 1})} /></div></div>
             <div className="grid grid-cols-2 gap-4"><div className="space-y-1"><span className="text-[9px] font-black text-slate-300 uppercase pl-1">累计完成次数</span><input type="number" className="w-full bg-slate-50 p-3 rounded-sm text-xs font-bold border border-slate-100 outline-none" value={editingHabit.accumulatedCount || 0} onChange={e => setEditingHabit({...editingHabit, accumulatedCount: parseInt(e.target.value) || 0})} /></div><div className="space-y-1"><span className="text-[9px] font-black text-slate-300 uppercase pl-1">总目标</span><input type="number" className="w-full bg-slate-50 p-3 rounded-sm text-xs font-bold border border-slate-100 outline-none" value={editingHabit.targetCount || 1} onChange={e => setEditingHabit({...editingHabit, targetCount: parseInt(e.target.value) || 1})} /></div></div>
             <button onClick={() => handleUpdateHabit(editingHabit)} className="w-full py-4 text-white font-black uppercase rounded-sm shadow-xl mt-4 active:scale-95 transition-all" style={{ background: editingHabit.color }}>更新并保存</button>
           </div>
        </div>
      </div>
    );
    if (editingGoal) overlays.push(
      <div key="editGoal" className="fixed inset-0 z-[700] bg-slate-900/80 flex items-end justify-center p-4" onClick={() => setEditingGoal(null)}>
         <div className="bg-white w-full max-w-md rounded-sm p-6 shadow-2xl animate-in slide-in-from-bottom duration-300" onClick={e => e.stopPropagation()}>
           <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <button onClick={() => handleDeleteGoal(editingGoal.id)} className="p-2 bg-rose-50 text-rose-500 rounded-sm hover:bg-rose-100 transition-colors"><Trash2 size={18} /></button>
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">编辑目标</h3>
              </div>
              <button onClick={() => setEditingGoal(null)}><X size={20}/></button>
           </div>
           <div className="space-y-4">
             <div className="space-y-1"><span className="text-[9px] font-black text-slate-300 uppercase pl-1">目标标题</span><input className="w-full bg-slate-50 p-4 text-lg font-bold rounded-sm border border-slate-100 outline-none focus:bg-white transition-colors" value={editingGoal.title} onChange={e => setEditingGoal({ ...editingGoal, title: e.target.value })} /></div>
             <div className="space-y-1"><span className="text-[9px] font-black text-slate-300 uppercase pl-1">分类</span><select className="w-full bg-slate-50 p-3 text-xs font-bold rounded-sm border border-slate-100 outline-none appearance-none" value={editingGoal.category} onChange={e => setEditingGoal({ ...editingGoal, category: e.target.value })}>{allCategories.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
             <div className="pt-2"><span className="text-[9px] font-black text-slate-300 uppercase pl-1 mb-2 block">关键结果 (KR)</span>
               <div className="space-y-2">
                 {editingGoal.keyResults.map(kr => (
                    <div key={kr.id} className="flex gap-2">
                      <input className="flex-1 bg-slate-50 p-3 text-xs font-bold rounded-sm border outline-none" value={kr.title} onChange={e => setEditingGoal({...editingGoal, keyResults: editingGoal.keyResults.map(k => k.id === kr.id ? {...k, title: e.target.value} : k)})} />
                      <button onClick={() => setEditingGoal({...editingGoal, keyResults: editingGoal.keyResults.filter(k => k.id !== kr.id)})} className="p-2 text-rose-300 hover:text-rose-500"><Trash2 size={16}/></button>
                    </div>
                 ))}
                 <button onClick={() => setEditingGoal({...editingGoal, keyResults: [...editingGoal.keyResults, { id: 'kr-'+Date.now(), title: '', progress: 0 }]})} className="w-full py-3 border border-dashed border-slate-200 text-slate-300 text-[10px] font-black uppercase rounded-sm hover:bg-slate-50">添加关键结果</button>
               </div>
             </div>
             <button onClick={() => handleUpdateGoal(editingGoal)} className="w-full py-4 text-white font-black uppercase rounded-sm shadow-xl mt-4 active:scale-95 transition-all" style={{ background: theme.color }}>保存修改</button>
           </div>
         </div>
      </div>
    );
    if (editingTask) overlays.push(
      <div key="editTask" className="fixed inset-0 z-[700] bg-slate-900/80 flex items-end justify-center p-4" onClick={() => setEditingTask(null)}>
        <div className="bg-white w-full max-w-md rounded-sm p-6 shadow-2xl animate-in slide-in-from-bottom duration-300 max-h-[90vh] overflow-y-auto no-scrollbar" onClick={e => e.stopPropagation()}>
           <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <button onClick={() => handleDeleteTaskFromLibrary(editingTask.id)} className="p-2 bg-rose-50 text-rose-500 rounded-sm hover:bg-rose-100 transition-colors"><Trash2 size={18} /></button>
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">任务详情编辑</h3>
              </div>
              <button onClick={() => setEditingTask(null)}><X size={20}/></button>
           </div>
           <div className="space-y-5 pb-6">
             <div className="space-y-1"><span className="text-[9px] font-black text-slate-300 uppercase pl-1">任务名称</span><input className="w-full bg-slate-50 p-4 text-lg font-bold rounded-sm border border-slate-100 outline-none focus:bg-white transition-colors" value={editingTask.title} onChange={e => setEditingTask({ ...editingTask, title: e.target.value })} /></div>
             
             {/* 状态选择 (Priority) */}
             <div className="space-y-2">
                <span className="text-[9px] font-black text-slate-300 uppercase pl-1">任务状态 / 优先级</span>
                <div className="flex bg-slate-50 p-1 rounded-sm">
                   {(['normal', 'important', 'waiting'] as TaskPriority[]).map(p => (
                      <button 
                        key={p}
                        onClick={() => setEditingTask({...editingTask, priority: p})}
                        className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-sm transition-all flex items-center justify-center gap-1 ${editingTask.priority === p || (!editingTask.priority && p === 'normal') ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
                      >
                         {p === 'important' && <AlertCircle size={10} className="text-amber-500" />}
                         {p === 'waiting' && <Clock size={10} className="text-slate-400" />}
                         {p === 'normal' && <Circle size={10} className="text-slate-400" />}
                         {p === 'normal' ? '普通' : p === 'important' ? '重点' : '等待'}
                      </button>
                   ))}
                </div>
                {editingTask.priority === 'waiting' && (
                  <p className="text-[8px] text-slate-400 pl-1">* 等待状态的任务不会显示在概览和日程中</p>
                )}
             </div>

             <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1">
                   <div className="flex items-center px-1 mb-1">
                      <span className="text-[9px] font-black text-slate-300 uppercase">分类</span>
                   </div>
                   <select className="w-full bg-slate-50 p-3 text-xs font-bold rounded-sm border outline-none appearance-none" value={editingTask.category} onChange={e => setEditingTask({...editingTask, category: e.target.value})}>{allCategories.map(c => <option key={c} value={c}>{c}</option>)}</select>
                 </div>
                 <div className="space-y-1">
                   <div className="flex items-center px-1 mb-1">
                      <span className="text-[9px] font-black text-slate-300 uppercase flex items-center gap-1"><Target size={10}/> 关联目标</span>
                   </div>
                   <select className="w-full bg-slate-50 p-3 text-xs font-bold rounded-sm border outline-none appearance-none" value={editingTask.krId || ''} onChange={e => setEditingTask({...editingTask, krId: e.target.value || undefined})}>
                      <option value="">不关联目标</option>
                      {goals.map(g => (
                        <optgroup key={g.id} label={g.title}>
                          {g.keyResults.map(kr => <option key={kr.id} value={kr.id}>{kr.title}</option>)}
                        </optgroup>
                      ))}
                   </select>
                </div>
             </div>
             
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                   <div className="flex justify-between items-center px-1 mb-1 min-h-[16px]">
                      <span className="text-[9px] font-black text-slate-300 uppercase flex items-center gap-1"><RotateCcw size={10}/> 当前完成次数</span>
                      {editingTask.accumulatedCount && editingTask.accumulatedCount > 0 ? (
                        <button onClick={() => setEditingTask({...editingTask, accumulatedCount: 0})} className="text-[8px] font-black text-rose-400 uppercase tracking-tighter hover:text-rose-600 transition-colors">重置为0</button>
                      ) : null}
                   </div>
                   <input type="number" className="w-full bg-slate-50 p-3 text-xs font-bold rounded-sm border outline-none" value={editingTask.accumulatedCount || 0} onChange={e => setEditingTask({...editingTask, accumulatedCount: parseInt(e.target.value) || 0})} />
                 </div>
                 <div className="space-y-1">
                   <div className="flex justify-between items-center px-1 mb-1 min-h-[16px]">
                      <span className="text-[9px] font-black text-slate-300 uppercase">总目标次数 (Target)</span>
                   </div>
                   <input type="number" className="w-full bg-slate-50 p-3 text-xs font-bold rounded-sm border outline-none" value={editingTask.targetCount || 0} onChange={e => setEditingTask({...editingTask, targetCount: parseInt(e.target.value) || 0})} />
                </div>
             </div>

             <div className="space-y-3">
                <div className="flex justify-between items-center px-1">
                   <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-1"><ListTodo size={12}/> 子任务清单</span>
                   <button onClick={() => setEditingTask({...editingTask, subtasks: [...(editingTask.subtasks || []), { id: 's-'+Date.now(), title: '', completed: false }]})} className="p-1 text-slate-400 hover:text-slate-700 transition-colors"><Plus size={14}/></button>
                </div>
                <div className="space-y-2">
                   {(editingTask.subtasks || []).map(s => (
                     <div key={s.id} className="flex gap-2">
                        <input className="flex-1 bg-slate-50 p-3 text-xs font-bold rounded-sm border outline-none" placeholder="子任务内容..." value={s.title} onChange={e => setEditingTask({...editingTask, subtasks: (editingTask.subtasks || []).map(x => x.id === s.id ? {...x, title: e.target.value} : x)})} />
                        <button onClick={() => setEditingTask({...editingTask, subtasks: (editingTask.subtasks || []).filter(x => x.id !== s.id)})} className="p-2 text-rose-300 hover:text-rose-500 transition-colors"><Trash2 size={16}/></button>
                     </div>
                   ))}
                </div>
             </div>

             <button onClick={() => handleUpdateTask(editingTask)} className="w-full py-4 text-white font-black uppercase rounded-sm shadow-xl mt-4 transition-all active:scale-95" style={{ background: theme.color }}>保存并同步到日程</button>
           </div>
        </div>
      </div>
    );
    if (isCreating) overlays.push(
      <QuickCreateModal 
        key="quickCreate"
        type={isCreating.type}
        defaultCategory={isCreating.defaultCategory}
        allCategories={allCategories}
        themeColor={theme.color}
        onClose={() => setIsCreating(null)}
        onConfirm={handleCreateItem}
      />
    );
    return overlays;
  };

  return (
    <div className="h-full w-full overflow-hidden bg-white text-slate-900 font-sans">
      {isLoading && (
        <div className="fixed inset-0 z-[2000] bg-white flex flex-col items-center justify-center animate-out fade-out zoom-out-110 duration-700 delay-500 fill-mode-forwards">
           <div className="relative mb-8">
              <div className="w-24 h-24 rounded-full border-4 border-slate-50 shadow-inner" />
              <div className="absolute inset-0 border-4 rounded-full border-t-transparent animate-spin" style={{ borderColor: theme.color, borderTopColor: 'transparent', animationDuration: '0.8s' }} />
           </div>
           <h2 className="text-2xl font-black tracking-[0.4em] uppercase text-slate-800">极简日程</h2>
        </div>
      )}
      <div className="h-full flex flex-col relative">
        <div className="flex-1 overflow-hidden relative">
          <div className="view-slider" style={{ transform: `translateX(${getTranslateX()})` }}>
            <div className="view-slide">
                <Suspense fallback={<PageLoader />}>
                    <OverviewPage days={days} theme={theme} activeDate={activeDate} onDateChange={setActiveDate} onAddTask={handleAddTaskToDay} onOpenSidebar={() => setIsSidebarOpen(true)} library={library} goals={goals} />
                </Suspense>
            </div>
            <div className="view-slide">
                <Suspense fallback={<PageLoader />}>
                    <DailyDetailPage days={days} goals={goals} habits={habits} activeDate={activeDate} onDateChange={setActiveDate} onToggleLibrary={() => {}} onOpenQuickMenu={() => setIsCreating({ type: 'temp_task' })} onToggleTaskComplete={handleToggleTaskComplete} onToggleHabitComplete={handleToggleHabitComplete} onToggleHabitInstance={handleToggleHabitInstance} onRetractTask={handleRetractTask} onEditTask={setEditingTask} onOpenSidebar={() => setIsSidebarOpen(true)} onUpdateTask={handleUpdateTask} theme={theme} />
                </Suspense>
            </div>
            <div className="view-slide">
                <Suspense fallback={<PageLoader />}>
                    <TaskLibraryPage 
                      theme={theme} 
                      library={library} 
                      habits={habits} 
                      goals={goals} 
                      setLibrary={setLibrary} 
                      setHabits={setHabits} 
                      setGoals={setGoals} 
                      onEditTask={setEditingTask} 
                      onEditHabit={setEditingHabit} 
                      onEditGoal={setEditingGoal} 
                      onOpenSidebar={() => setIsSidebarOpen(true)} 
                      onCreateItem={(type, cat) => setIsCreating({ type, defaultCategory: cat })} 
                      activeMainTab={activeLibraryTab} 
                      setActiveMainTab={setActiveLibraryTab}
                      isVisible={currentView === 'library'}
                    />
                </Suspense>
            </div>
            <div className="view-slide">
                <Suspense fallback={<PageLoader />}>
                    <ReviewPage theme={theme} activeDate={activeDate} days={days} habits={habits} rewards={rewards} setRewards={setRewards} purchaseHistory={purchaseHistory} onPurchase={handlePurchaseReward} reflectionTemplates={reflectionTemplates} setReflectionTemplates={setReflectionTemplates} scoreDefs={scoreDefs} setScoreDefs={setScoreDefs} onUpdateDay={(date, updates) => setDays(prev => prev.map(d => d.date === date ? { ...d, ...updates } : d))} onOpenSidebar={() => setIsSidebarOpen(true)} currentBalance={currentBalance} />
                </Suspense>
            </div>
          </div>
        </div>
        <BottomNav currentView={currentView} onViewChange={setCurrentView} theme={theme} />
      </div>
      {(currentView === 'daily' || currentView === 'library') && (
        <button onClick={() => setIsCreating({ type: currentView === 'daily' ? 'temp_task' : (activeLibraryTab === 'habit' ? 'habit' : activeLibraryTab === 'goal' ? 'goal' : 'task') })} className="fixed right-6 bottom-28 w-14 h-14 rounded-sm shadow-2xl flex items-center justify-center text-white active:scale-90 transition-all z-[150]" style={{ background: theme.color }}><Plus size={32} /></button>
      )}
      <Suspense fallback={null}>
        <Sidebar 
          isOpen={isSidebarOpen} 
          onClose={() => setIsSidebarOpen(false)} 
          currentTheme={theme} 
          onThemeChange={setTheme} 
          onClearTasks={handleClearTasks} 
          onBackup={handleBackup} 
          onRestore={handleRestore} 
        />
      </Suspense>
      {renderGlobalOverlays()}
    </div>
  );
};

export default App;
