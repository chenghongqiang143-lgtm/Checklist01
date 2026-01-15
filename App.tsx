
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AppView, DayInfo, Task, ThemeOption, Goal, Habit, ScoreDefinition, Reward } from './types';
import { INITIAL_DAYS, THEME_OPTIONS, LIBRARY_TASKS } from './constants';
import BottomNav from './components/BottomNav';
import DailyDetailPage from './components/DailyDetailPage';
import TaskLibraryPage from './components/TaskLibraryPage';
import OverviewPage from './components/OverviewPage';
import ReviewPage from './components/ReviewPage';
import Sidebar from './components/Sidebar';
import { X, Plus, ChevronDown, ChevronUp, Palette, Check, Loader2 } from 'lucide-react';

import { Activity, Book, Coffee, Heart, Smile, Star, Dumbbell, GlassWater, Moon, Sun, Laptop, Music, Camera, Brush, MapPin } from 'lucide-react';
const HABIT_ICONS: any = { Activity, Book, Coffee, Heart, Smile, Star, Dumbbell, GlassWater, Moon, Sun, Laptop, Music, Camera, Brush, MapPin };

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

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [days, setDays] = useState<DayInfo[]>(INITIAL_DAYS);
  const [library, setLibrary] = useState<Task[]>(LIBRARY_TASKS);
  const [habits, setHabits] = useState<Habit[]>(INITIAL_HABITS);
  const [rewards, setRewards] = useState<Reward[]>(INITIAL_REWARDS);
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

  useEffect(() => {
    // 增加延迟展示动画
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
    setDays(prev => prev.map(d => ({ ...d, tasks: d.tasks.map(t => t.id === updatedTask.id || t.originalId === updatedTask.id ? { ...updatedTask, id: t.id, originalId: updatedTask.id } : t) })));
    setLibrary(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
    setEditingTask(null);
  };

  const handleUpdateHabit = (updatedHabit: Habit) => {
    setHabits(prev => prev.map(h => h.id === updatedHabit.id ? updatedHabit : h));
    setEditingHabit(null);
    setIsHabitAppearanceOpen(false);
  };

  const handleUpdateGoal = (updatedGoal: Goal) => {
    setGoals(prev => prev.map(g => g.id === updatedGoal.id ? updatedGoal : g));
    setEditingGoal(null);
  };

  const handleToggleHabitComplete = (habitId: string, forcedHour?: number) => {
    setHabits(prev => prev.map(h => {
      if (h.id === habitId) {
        const target = h.targetCount || 1;
        const current = h.accumulatedCount || 0;
        const hourStr = forcedHour !== undefined ? `${forcedHour < 10 ? '0' + forcedHour : forcedHour}:00` : null;
        
        const isRestarting = current >= target;
        const nextCount = isRestarting ? 0 : current + 1;
        
        let newTimes = [...(h.completionTimes || [])];
        if (isRestarting) {
          newTimes = [];
        } else if (hourStr) {
          newTimes.push(hourStr);
        }

        return { 
          ...h, 
          completedToday: nextCount >= target, 
          accumulatedCount: nextCount, 
          streak: nextCount >= target ? h.streak + 1 : h.streak, 
          lastCompletedAt: Date.now(), 
          completionTimes: newTimes,
          remark: hourStr || h.remark
        };
      }
      return h;
    }));
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
            accumulatedCount: 0
          };
          return { ...d, tasks: [...d.tasks, newTask] };
        }
      }
      return d;
    }));
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
    const overlays = [];
    
    if (editingHabit) overlays.push(
      <div key="editHabit" className="fixed inset-0 z-[700] bg-slate-900/80 flex items-end justify-center p-4" onClick={() => { setEditingHabit(null); setIsHabitAppearanceOpen(false); }}>
        <div className="bg-white w-full max-w-md rounded-sm p-6 shadow-2xl animate-in slide-in-from-bottom duration-300 max-h-[90vh] overflow-y-auto no-scrollbar" onClick={e => e.stopPropagation()}>
           <div className="flex justify-between items-center mb-6"><h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">习惯设置</h3><button onClick={() => { setEditingHabit(null); setIsHabitAppearanceOpen(false); }}><X size={20}/></button></div>
           <div className="space-y-5 pb-4">
             <div className="space-y-1">
               <span className="text-[9px] font-black text-slate-300 uppercase pl-1">习惯标题</span>
               <input className="w-full bg-slate-50 p-4 text-lg font-bold rounded-sm border border-slate-100 outline-none focus:bg-white transition-colors" value={editingHabit.title} onChange={e => setEditingHabit({ ...editingHabit, title: e.target.value })} />
             </div>
             <div className="space-y-1">
               <span className="text-[9px] font-black text-slate-300 uppercase pl-1">习惯分类</span>
               <input className="w-full bg-slate-50 p-3 text-xs font-bold rounded-sm border border-slate-100 outline-none" value={editingHabit.category} onChange={e => setEditingHabit({ ...editingHabit, category: e.target.value })} />
             </div>
             <div className="space-y-1">
               <span className="text-[9px] font-black text-slate-300 uppercase pl-1">关联所属目标</span>
               <select className="w-full bg-slate-50 p-3 rounded-sm text-xs font-bold border border-slate-100 outline-none appearance-none" value={editingHabit.krId || ''} onChange={e => setEditingHabit({...editingHabit, krId: e.target.value})}>
                  <option value="">不关联目标</option>
                  {goals.map(g => (
                    <optgroup key={g.id} label={g.title}>
                      {g.keyResults.map(kr => <option key={kr.id} value={kr.id}>{kr.title}</option>)}
                    </optgroup>
                  ))}
               </select>
             </div>
             <div className="grid grid-cols-2 gap-4">
               <div className="space-y-1">
                 <span className="text-[9px] font-black text-slate-300 uppercase tracking-tight pl-1">频率（天数）</span>
                 <div className="flex items-center bg-slate-50 rounded-sm border border-slate-100 px-3">
                   <input type="number" className="w-full bg-transparent py-3 text-xs font-bold outline-none" value={editingHabit.frequencyDays || 1} onChange={e => setEditingHabit({...editingHabit, frequencyDays: parseInt(e.target.value) || 1})} />
                   <span className="text-[9px] font-black text-slate-300 uppercase ml-1 shrink-0">天</span>
                 </div>
               </div>
               <div className="space-y-1">
                 <span className="text-[9px] font-black text-slate-300 uppercase tracking-tight pl-1">频率（次数）</span>
                 <div className="flex items-center bg-slate-50 rounded-sm border border-slate-100 px-3">
                   <input type="number" className="w-full bg-transparent py-3 text-xs font-bold outline-none" value={editingHabit.frequencyTimes || 1} onChange={e => setEditingHabit({...editingHabit, frequencyTimes: parseInt(e.target.value) || 1})} />
                   <span className="text-[9px] font-black text-slate-300 uppercase ml-1 shrink-0">次</span>
                 </div>
               </div>
             </div>
             <div className="grid grid-cols-2 gap-4">
               <div className="space-y-1">
                 <span className="text-[9px] font-black text-slate-300 uppercase pl-1">累计完成次数</span>
                 <input type="number" className="w-full bg-slate-50 p-3 rounded-sm text-xs font-bold border border-slate-100 outline-none" value={editingHabit.accumulatedCount || 0} onChange={e => setEditingHabit({...editingHabit, accumulatedCount: parseInt(e.target.value) || 0})} />
               </div>
               <div className="space-y-1">
                 <span className="text-[9px] font-black text-slate-300 uppercase pl-1">总目标</span>
                 <input type="number" className="w-full bg-slate-50 p-3 rounded-sm text-xs font-bold border border-slate-100 outline-none" value={editingHabit.targetCount || 1} onChange={e => setEditingHabit({...editingHabit, targetCount: parseInt(e.target.value) || 1})} />
               </div>
             </div>
             <div className="border border-slate-100 rounded-sm overflow-hidden">
               <button 
                onClick={() => setIsHabitAppearanceOpen(!isHabitAppearanceOpen)}
                className="w-full px-4 py-3 bg-slate-50 flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest hover:bg-slate-100 transition-colors"
               >
                 <div className="flex items-center gap-2">
                   <Palette size={12} />
                   外观设置 (图标与颜色)
                 </div>
                 {isHabitAppearanceOpen ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
               </button>
               {isHabitAppearanceOpen && (
                 <div className="p-4 space-y-4 animate-in slide-in-from-top duration-200">
                    <div className="space-y-2">
                       <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest block">选择图标</span>
                       <div className="grid grid-cols-5 gap-2">
                          {Object.keys(HABIT_ICONS).map(iconName => {
                             const Icon = HABIT_ICONS[iconName];
                             const isSelected = editingHabit.iconName === iconName;
                             return (
                               <button key={iconName} onClick={() => setEditingHabit({...editingHabit, iconName})} className={`w-full aspect-square flex items-center justify-center rounded-sm transition-all border ${isSelected ? 'bg-slate-900 border-slate-900 shadow-md scale-110' : 'bg-white border-slate-100 hover:border-slate-300'}`}><Icon size={16} className={isSelected ? 'text-white' : 'text-slate-400'} /></button>
                             );
                          })}
                       </div>
                    </div>
                    <div className="space-y-2">
                       <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest block">选择主题色</span>
                       <div className="grid grid-cols-5 gap-2">
                          {THEME_OPTIONS.map(opt => {
                             const isSelected = editingHabit.color === opt.color;
                             return (
                               <button key={opt.name} onClick={() => setEditingHabit({...editingHabit, color: opt.color})} className={`w-full aspect-square rounded-sm transition-all flex items-center justify-center shadow-sm ${isSelected ? 'ring-2 ring-slate-900 ring-offset-2 scale-105' : 'hover:scale-105'}`} style={{ background: opt.color }}>{isSelected && <Check size={12} className="text-white" />}</button>
                             );
                          })}
                       </div>
                    </div>
                 </div>
               )}
             </div>
             <button onClick={() => handleUpdateHabit(editingHabit)} className="w-full py-4 text-white font-black uppercase rounded-sm shadow-xl mt-4 active:scale-95 transition-all" style={{ background: editingHabit.color }}>更新并保存</button>
           </div>
        </div>
      </div>
    );

    if (editingTask) overlays.push(
      <div key="editTask" className="fixed inset-0 z-[700] bg-slate-900/80 flex items-end justify-center p-4" onClick={() => setEditingTask(null)}>
        <div className="bg-white w-full max-w-md rounded-sm p-6 shadow-2xl animate-in slide-in-from-bottom duration-300 max-h-[90vh] overflow-y-auto no-scrollbar" onClick={e => e.stopPropagation()}>
           <div className="flex justify-between items-center mb-6"><h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">任务高级编辑</h3><button onClick={() => setEditingTask(null)}><X size={20}/></button></div>
           <div className="space-y-5">
             <div className="space-y-1">
                <span className="text-[9px] font-black text-slate-300 uppercase pl-1">任务名称</span>
                <input className="w-full bg-slate-50 p-4 text-lg font-bold rounded-sm border border-slate-100 outline-none focus:bg-white transition-colors" value={editingTask.title} onChange={e => setEditingTask({ ...editingTask, title: e.target.value })} />
             </div>
             <div className="space-y-1">
                <span className="text-[9px] font-black text-slate-300 uppercase pl-1">所属分类</span>
                <input className="w-full bg-slate-50 p-3 text-xs font-bold rounded-sm border border-slate-100 outline-none" value={editingTask.category} onChange={e => setEditingTask({ ...editingTask, category: e.target.value })} placeholder="例如：工作、学习..." />
             </div>
             <div className="space-y-1">
                 <span className="text-[9px] font-black text-slate-300 uppercase pl-1">关联关键结果 (KR)</span>
                 <select className="w-full bg-slate-50 p-3 rounded-sm text-xs font-bold border border-slate-100 outline-none" value={editingTask.krId || ''} onChange={e => setEditingTask({...editingTask, krId: e.target.value})}>
                    <option value="">不关联目标</option>
                    {goals.map(g => (
                      <optgroup key={g.id} label={g.title}>
                        {g.keyResults.map(kr => <option key={kr.id} value={kr.id}>{kr.title}</option>)}
                      </optgroup>
                    ))}
                 </select>
             </div>
             <div className="grid grid-cols-2 gap-4">
               <div className="space-y-1">
                 <span className="text-[9px] font-black text-slate-300 uppercase pl-1">当前量 (累计)</span>
                 <input type="number" className="w-full bg-slate-50 p-3 rounded-sm text-xs font-bold border border-slate-100 outline-none" value={editingTask.accumulatedCount || 0} onChange={e => setEditingTask({...editingTask, accumulatedCount: parseInt(e.target.value) || 0})} />
               </div>
               <div className="space-y-1">
                 <span className="text-[9px] font-black text-slate-300 uppercase pl-1">目标量</span>
                 <input type="number" className="w-full bg-slate-50 p-3 rounded-sm text-xs font-bold border border-slate-100 outline-none" value={editingTask.targetCount || 0} onChange={e => setEditingTask({...editingTask, targetCount: parseInt(e.target.value) || 0})} />
               </div>
             </div>
             <button onClick={() => handleUpdateTask(editingTask)} className="w-full py-4 text-white font-black uppercase rounded-sm shadow-xl mt-4 transition-all active:scale-95" style={{ background: theme.color }}>保存并同步</button>
           </div>
        </div>
      </div>
    );

    if (isCreating) overlays.push(
      <div key="createOverlay" className="fixed inset-0 z-[700] bg-slate-900/80 flex items-end justify-center p-4" onClick={() => setIsCreating(null)}>
        <div className="bg-white w-full max-w-md rounded-sm p-6 shadow-2xl animate-in slide-in-from-bottom duration-300" onClick={e => e.stopPropagation()}>
           <div className="flex justify-between mb-6">
              <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">快速创建</h3>
              <button onClick={() => setIsCreating(null)}><X size={20}/></button>
           </div>
           <input autoFocus className="w-full bg-slate-50 p-4 text-lg font-bold border-none outline-none" placeholder="输入名称回车..." onKeyDown={e => {
              if (e.key === 'Enter') {
                const title = (e.target as HTMLInputElement).value;
                if (!title) return;
                const defaultCat = isCreating.defaultCategory || '默认';
                if (isCreating.type === 'goal') setGoals([...goals, { id: 'g-'+Date.now(), title, category: defaultCat, keyResults: [] }]);
                else if (isCreating.type === 'temp_task') handleAddTaskToDay({ id: 'tmp-'+Date.now(), title, category: '临时', type: 'completed' });
                else if (isCreating.type === 'habit') setHabits([...habits, { id: 'h-'+Date.now(), title, category: defaultCat, streak: 0, frequencyDays: 1, frequencyTimes: 1, color: theme.color, iconName: 'Star', targetCount: 1, accumulatedCount: 0, completionTimes: [] }]);
                else if (isCreating.type === 'task') setLibrary([...library, { id: 'lib-'+Date.now(), title, category: defaultCat, type: 'focus' }]);
                setIsCreating(null);
              }
           }} />
        </div>
      </div>
    );
    return overlays;
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-white text-slate-900 font-sans">
      {/* 沉浸式启动加载动画 */}
      {isLoading && (
        <div className="fixed inset-0 z-[2000] bg-white flex flex-col items-center justify-center animate-out fade-out zoom-out-110 duration-700 delay-500 fill-mode-forwards">
           <div className="relative mb-8">
              <div className="w-24 h-24 rounded-full border-4 border-slate-50 shadow-inner" />
              <div className="absolute inset-0 border-4 rounded-full border-t-transparent animate-spin" style={{ borderColor: theme.color, borderTopColor: 'transparent', animationDuration: '0.8s' }} />
              <div className="absolute inset-0 flex items-center justify-center">
                 <div className="w-10 h-10 rounded-sm shadow-xl animate-pulse" style={{ background: theme.color }} />
              </div>
           </div>
           <div className="flex flex-col items-center gap-3">
              <h2 className="text-2xl font-black tracking-[0.4em] uppercase text-slate-800">极简日程</h2>
              <div className="flex items-center gap-2">
                <span className="w-4 h-[1px] bg-slate-200" />
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest mono">Minimalist Workspace</span>
                <span className="w-4 h-[1px] bg-slate-200" />
              </div>
           </div>
        </div>
      )}

      <div className="h-full flex flex-col relative">
        {/* 滑动视图主容器 */}
        <div className="flex-1 overflow-hidden relative">
          <div 
            className="view-slider" 
            style={{ transform: `translateX(${getTranslateX()})` }}
          >
            {/* 概览页 */}
            <div className="view-slide">
              <OverviewPage 
                days={days} 
                theme={theme} 
                activeDate={activeDate} 
                onDateChange={setActiveDate} 
                onAddTask={handleAddTaskToDay} 
                onOpenSidebar={() => setIsSidebarOpen(true)} 
                library={library} 
                goals={goals} 
              />
            </div>
            
            {/* 日程页 */}
            <div className="view-slide">
              <DailyDetailPage 
                days={days} 
                goals={goals} 
                habits={habits} 
                activeDate={activeDate} 
                onDateChange={setActiveDate} 
                onToggleLibrary={() => {}} 
                onOpenQuickMenu={() => setIsCreating({ type: 'temp_task' })} 
                onToggleTaskComplete={handleToggleTaskComplete} 
                onToggleHabitComplete={handleToggleHabitComplete} 
                onEditTask={setEditingTask} 
                onOpenSidebar={() => setIsSidebarOpen(true)} 
                onUpdateTask={handleUpdateTask} 
                theme={theme} 
              />
            </div>

            {/* 库页面 */}
            <div className="view-slide">
              <TaskLibraryPage 
                theme={theme} 
                library={library} 
                habits={habits} 
                goals={goals} 
                setGoals={setGoals} 
                onEditTask={setEditingTask} 
                onEditHabit={setEditingHabit} 
                onOpenSidebar={() => setIsSidebarOpen(true)} 
                onCreateItem={(type, cat) => setIsCreating({ type, defaultCategory: cat })} 
                activeMainTab={activeLibraryTab} 
                setActiveMainTab={setActiveLibraryTab} 
              />
            </div>

            {/* 复盘页 */}
            <div className="view-slide">
              <ReviewPage 
                theme={theme} 
                activeDate={activeDate} 
                days={days} 
                habits={habits} 
                rewards={rewards} 
                setRewards={setRewards} 
                reflectionTemplates={reflectionTemplates} 
                setReflectionTemplates={setReflectionTemplates} 
                scoreDefs={scoreDefs} 
                setScoreDefs={setScoreDefs} 
                onUpdateDay={(date, updates) => setDays(prev => prev.map(d => d.date === date ? { ...d, ...updates } : d))} 
                onOpenSidebar={() => setIsSidebarOpen(true)} 
              />
            </div>
          </div>
        </div>

        {/* 固定底栏 */}
        <BottomNav currentView={currentView} onViewChange={setCurrentView} theme={theme} />
      </div>

      {/* 固定悬浮按钮 */}
      {(currentView === 'daily' || currentView === 'library') && (
        <button 
          onClick={() => setIsCreating({ 
            type: currentView === 'daily' ? 'temp_task' : (activeLibraryTab === 'habit' ? 'habit' : activeLibraryTab === 'goal' ? 'goal' : 'task') 
          })} 
          className="fixed right-6 bottom-28 w-14 h-14 rounded-sm shadow-2xl flex items-center justify-center text-white active:scale-90 transition-all z-[150]" 
          style={{ background: theme.color }}
        >
          <Plus size={32} />
        </button>
      )}

      {/* 固定侧边栏和 Overlay */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        currentTheme={theme} 
        onThemeChange={setTheme} 
        onClearTasks={() => setDays(INITIAL_DAYS)} 
        onBackup={() => {}} 
        onRestore={() => {}} 
      />
      {renderGlobalOverlays()}
    </div>
  );
};

export default App;
