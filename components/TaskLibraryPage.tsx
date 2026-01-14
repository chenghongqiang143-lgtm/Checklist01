
import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { ThemeOption, Task, Goal, Habit, KeyResult } from '../types';
import { Hash, Settings2, Menu, Activity, Book, Coffee, Heart, Smile, Star, Dumbbell, GlassWater, Moon, Sun, Laptop, Music, Camera, Brush, MapPin, Target, Trash2, Plus, ChevronDown, ChevronUp, Flame, CheckCircle2, Clock, X, LayoutGrid, Circle, Bookmark } from 'lucide-react';

const HABIT_ICONS: any = { Activity, Book, Coffee, Heart, Smile, Star, Dumbbell, GlassWater, Moon, Sun, Laptop, Music, Camera, Brush, MapPin };

interface TaskLibraryPageProps {
  theme: ThemeOption;
  library: Task[];
  habits: Habit[];
  goals: Goal[];
  setGoals: React.Dispatch<React.SetStateAction<Goal[]>>;
  onEditTask: (task: Task) => void;
  onEditHabit: (habit: Habit) => void;
  onOpenSidebar: () => void;
  onCreateItem: (type: 'task' | 'habit' | 'goal', defaultCategory?: string) => void;
  activeMainTab: 'task' | 'habit' | 'goal';
  setActiveMainTab: (tab: 'task' | 'habit' | 'goal') => void;
}

const TaskLibraryPage: React.FC<TaskLibraryPageProps> = ({ 
  theme, library, habits, goals, setGoals, onEditTask, onEditHabit, onOpenSidebar, onCreateItem, 
  activeMainTab, setActiveMainTab 
}) => {
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  
  const allCategories = useMemo(() => {
    const cats = activeMainTab === 'task' 
      ? library.map(t => t.category)
      : activeMainTab === 'habit'
        ? habits.map(h => h.category)
        : goals.map(g => g.category);
    return Array.from(new Set(['全部', ...cats]));
  }, [library, habits, goals, activeMainTab]);

  const [activeCategory, setActiveCategory] = useState('全部');

  const themeGradient = `linear-gradient(135deg, ${theme.color}, ${theme.color}99)`;

  // 根据分类生成颜色 (简单的伪随机生成，基于文字哈希)
  const getCategoryColor = (cat: string) => {
    if (cat === '全部' || !cat) return theme.color;
    let hash = 0;
    for (let i = 0; i < cat.length; i++) hash = cat.charCodeAt(i) + ((hash << 5) - hash);
    const h = Math.abs(hash % 360);
    return `hsl(${h}, 65%, 55%)`;
  };

  const getTimeAgo = (timestamp?: number) => {
    if (!timestamp) return '未开始';
    const days = Math.floor((Date.now() - timestamp) / (1000 * 60 * 60 * 24));
    return days === 0 ? '今天' : `${days}天前`;
  };

  const getKrInfo = (krId?: string) => {
    if (!krId) return null;
    for (const g of goals) {
      const kr = g.keyResults.find(k => k.id === krId);
      if (kr) return { goal: g.title, kr: kr.title };
    }
    return null;
  };

  const getKRProgress = (krId: string) => {
    const linkedTasks = library.filter(t => t.krId === krId);
    const linkedHabits = habits.filter(h => h.krId === krId);
    const total = linkedTasks.length + linkedHabits.length;
    if (total === 0) return 0;
    const completedTasks = linkedTasks.filter(t => t.completed || (t.targetCount && t.accumulatedCount! >= t.targetCount)).length;
    const completedHabits = linkedHabits.filter(h => h.completedToday).length;
    return Math.round(((completedTasks + completedHabits) / total) * 100);
  };

  const getGoalTitleByKrId = (krId?: string) => {
    if (!krId) return null;
    return goals.find(g => g.keyResults.some(kr => kr.id === krId))?.title;
  };

  const handleDeleteGoal = (id: string) => {
    setGoals(goals.filter(g => g.id !== id));
    setEditingGoal(null);
  };

  const handleUpdateGoal = (updated: Goal) => {
    setGoals(goals.map(g => g.id === updated.id ? updated : g));
  };

  const addKR = (goalId: string) => {
    const newKR: KeyResult = { id: 'kr-' + Date.now(), title: '新关键结果', progress: 0 };
    setGoals(goals.map(g => g.id === goalId ? { ...g, keyResults: [...g.keyResults, newKR] } : g));
    if (editingGoal?.id === goalId) setEditingGoal({ ...editingGoal, keyResults: [...editingGoal.keyResults, newKR] });
  };

  const currentList = useMemo(() => {
    if (activeMainTab === 'task') {
      return activeCategory === '全部' ? library : library.filter(t => t.category === activeCategory);
    } else if (activeMainTab === 'habit') {
      return activeCategory === '全部' ? habits : habits.filter(h => h.category === activeCategory);
    } else {
      return activeCategory === '全部' ? goals : goals.filter(g => g.category === activeCategory);
    }
  }, [activeMainTab, activeCategory, library, habits, goals]);

  return (
    <div className="h-full flex flex-col bg-white overflow-hidden relative">
      <header className="pt-16 shrink-0 bg-white z-20 shadow-sm">
         <div className="px-6 mb-4 flex justify-between items-center">
            <button onClick={onOpenSidebar} className="p-1 -ml-1 text-slate-400"><Menu size={20}/></button>
         </div>
         <div className="flex gap-6 mb-2 px-6 overflow-x-auto no-scrollbar items-center">
            {['task', 'habit', 'goal'].map(id => (
                <button key={id} onClick={() => { setActiveMainTab(id as any); setActiveCategory('全部'); }} className={`text-2xl font-black tracking-tight relative whitespace-nowrap pb-1 transition-colors ${activeMainTab === id ? 'text-slate-800' : 'text-slate-200'}`}>
                    {id === 'task' ? '任务' : id === 'habit' ? '习惯' : '目标'}
                    {activeMainTab === id && <div className="absolute -bottom-1 left-0 right-0 h-1 rounded-full" style={{ background: theme.color }} />}
                </button>
            ))}
         </div>
         {/* 分类顶栏 */}
         <div className="flex gap-2 px-6 py-3 overflow-x-auto no-scrollbar bg-slate-50/50">
            {allCategories.map(cat => (
              <button 
                key={cat} 
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-1.5 rounded-sm text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${activeCategory === cat ? 'text-white border-transparent' : 'bg-white text-slate-400 border-slate-100 hover:border-slate-300'}`}
                style={{ backgroundColor: activeCategory === cat ? theme.color : undefined }}
              >
                {cat}
              </button>
            ))}
         </div>
      </header>

      <main className="flex-1 overflow-y-auto px-6 pb-32 no-scrollbar pt-4 space-y-4">
        {activeMainTab === 'task' && currentList.map((task: any) => {
            const krInfo = getKrInfo(task.krId);
            const progress = task.targetCount ? Math.min(100, ((task.accumulatedCount || 0) / task.targetCount) * 100) : 0;
            const catColor = getCategoryColor(task.category);
            return (
              <div key={task.id} onClick={() => onEditTask(task)} className="p-4 bg-white rounded-sm flex flex-col relative overflow-hidden group cursor-pointer border border-slate-100 shadow-sm active:scale-[0.99] transition-all">
                <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: catColor }} />
                {task.targetCount && (
                  <div className="absolute inset-y-0 left-0 opacity-10 transition-all duration-700" style={{ width: `${progress}%`, background: catColor }} />
                )}
                <div className="flex justify-between items-start z-10">
                  <div className="flex flex-col">
                     <span className="text-sm font-bold text-slate-700">{task.title}</span>
                     {krInfo && <span className="text-[9px] font-black text-blue-400 uppercase tracking-tight mt-0.5">{krInfo.goal} · {krInfo.kr}</span>}
                  </div>
                  <Settings2 size={14} className="text-slate-200 shrink-0" />
                </div>
                <div className="flex items-center justify-between mt-2 z-10 opacity-50">
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><Hash size={8} style={{color: catColor}}/> {task.category} · {getTimeAgo(task.lastCompletedAt)}</span>
                  {task.targetCount && <span className="text-[8px] font-black mono text-slate-500">{task.accumulatedCount}/{task.targetCount}</span>}
                </div>
              </div>
            );
        })}

        {activeMainTab === 'habit' && currentList.map((habit: any) => {
          const IconComp = HABIT_ICONS[habit.iconName] || Activity;
          const progress = habit.targetCount ? Math.min(100, ((habit.accumulatedCount || 0) / habit.targetCount) * 100) : 0;
          const goalTitle = getGoalTitleByKrId(habit.krId);
          return (
            <div 
              key={habit.id} 
              onClick={() => onEditHabit(habit)} 
              className="p-5 rounded-sm mb-3 flex flex-col gap-1 cursor-pointer active:scale-[0.98] transition-all border-none shadow-md relative overflow-hidden group"
              style={{ background: habit.color }}
            >
              {/* 与块融合的深色进度条 */}
              <div className="absolute inset-y-0 left-0 bg-black/15 transition-all duration-700 pointer-events-none" style={{ width: `${progress}%` }} />
              
              <div className="flex items-center justify-between z-10 relative">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-sm bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/10 shadow-sm">
                    <IconComp size={20} className="text-white" strokeWidth={2.5} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-black text-white leading-tight drop-shadow-sm">{habit.title}</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                       <span className="text-[9px] font-black uppercase tracking-widest leading-none text-white/80">{habit.category}</span>
                       {goalTitle && <span className="text-[9px] font-black text-white/50 uppercase tracking-widest leading-none truncate max-w-[120px]">· {goalTitle}</span>}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                       <span className="text-[9px] font-bold text-white/40 uppercase tracking-tight leading-none bg-black/5 px-1.5 py-0.5 rounded-[2px]">
                          {habit.frequencyDays}天{habit.frequencyTimes}次
                       </span>
                       <span className="text-[9px] font-black text-white/60 mono uppercase tracking-tight leading-none">
                          已累计: {habit.accumulatedCount} 次
                       </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center self-start">
                  <Settings2 size={16} className="text-white/20 group-hover:text-white/60 transition-colors" />
                </div>
              </div>
            </div>
          );
        })}

        {activeMainTab === 'goal' && currentList.map((goal: any) => (
            <div key={goal.id} className="bg-white rounded-sm border border-slate-100 shadow-sm p-5 space-y-4 group transition-all hover:bg-slate-50" onClick={() => setEditingGoal(goal)}>
               <div className="flex items-center justify-between cursor-pointer">
                 <div className="flex flex-col gap-1">
                   <div className="flex items-center gap-3">
                     <Target size={16} style={{ color: theme.color }} />
                     <h3 className="text-base font-black text-slate-800">{goal.title}</h3>
                   </div>
                   <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest pl-7">{goal.category}</span>
                 </div>
                 <Settings2 size={14} className="text-slate-200" />
               </div>
               <div className="space-y-6">
                 {goal.keyResults.map((kr: any) => {
                   const progress = getKRProgress(kr.id);
                   const linkedTasks = library.filter(t => t.krId === kr.id);
                   const linkedHabits = habits.filter(h => h.krId === kr.id);
                   
                   return (
                     <div key={kr.id} className="space-y-2">
                       <div className="flex justify-between items-end text-[10px] font-black uppercase">
                         <span className="text-slate-500">{kr.title}</span>
                         <span className="text-slate-400 mono">{progress}%</span>
                       </div>
                       <div className="h-1 bg-slate-200 rounded-full overflow-hidden">
                          <div className="h-full transition-all duration-1000" style={{ width: `${progress}%`, background: themeGradient }} />
                       </div>
                       
                       {/* 关联的子项列表 */}
                       {(linkedTasks.length > 0 || linkedHabits.length > 0) && (
                         <div className="ml-2 pl-3 border-l border-slate-100 mt-2 space-y-1.5">
                            {linkedHabits.map(h => {
                              const HabitIcon = HABIT_ICONS[h.iconName] || Activity;
                              return (
                                <div key={h.id} className="flex items-center gap-2 text-[10px] font-bold text-slate-500 py-0.5">
                                   <div className="w-4 h-4 rounded-[2px] flex items-center justify-center text-white" style={{ background: h.color }}>
                                      <HabitIcon size={10} />
                                   </div>
                                   <span className="truncate">{h.title}</span>
                                   <span className="text-[8px] font-black mono text-slate-300 ml-auto">{h.accumulatedCount}/{h.targetCount}</span>
                                </div>
                              );
                            })}
                            {linkedTasks.map(t => (
                                <div key={t.id} className="flex items-center gap-2 text-[10px] font-bold text-slate-500 py-0.5">
                                   <div className={`w-4 h-4 rounded-[2px] border flex items-center justify-center ${t.completed ? 'bg-slate-200 border-transparent text-slate-400' : 'border-slate-200 text-slate-300'}`}>
                                      {t.completed ? <CheckCircle2 size={10} /> : <Circle size={10} />}
                                   </div>
                                   <span className={`truncate ${t.completed ? 'line-through text-slate-300' : ''}`}>{t.title}</span>
                                   {t.targetCount && <span className="text-[8px] font-black mono text-slate-300 ml-auto">{t.accumulatedCount}/{t.targetCount}</span>}
                                </div>
                            ))}
                         </div>
                       )}
                     </div>
                   );
                 })}
               </div>
            </div>
        ))}

        <button 
          onClick={() => onCreateItem(activeMainTab, activeCategory === '全部' ? '' : activeCategory)}
          className="w-full py-5 border-2 border-dashed border-slate-100 rounded-sm text-slate-300 font-black uppercase tracking-widest text-[11px] flex items-center justify-center gap-2 hover:border-slate-200 transition-all"
        >
          <Plus size={16} /> 新增{activeMainTab === 'task' ? '任务' : activeMainTab === 'habit' ? '习惯' : '目标'}
        </button>
      </main>

      {editingGoal && createPortal(
        <div className="fixed inset-0 z-[800] bg-slate-900/60 flex items-end justify-center p-4" onClick={() => setEditingGoal(null)}>
          <div className="bg-white w-full max-w-md rounded-sm p-6 shadow-2xl animate-in slide-in-from-bottom duration-300 flex flex-col max-h-[85vh] overflow-hidden" onClick={e => e.stopPropagation()}>
             <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">目标与关键结果管理</h3>
                <button onClick={() => setEditingGoal(null)}><X size={20}/></button>
             </div>
             <div className="flex-1 overflow-y-auto no-scrollbar space-y-6">
                <div className="space-y-1.5">
                   <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest pl-1">目标标题</span>
                   <input className="w-full bg-slate-50 p-4 text-lg font-bold border-none outline-none focus:bg-slate-100 rounded-sm transition-colors" value={editingGoal.title} onChange={e => {
                      const updated = { ...editingGoal, title: e.target.value };
                      setEditingGoal(updated);
                      handleUpdateGoal(updated);
                   }} />
                </div>
                <div className="space-y-1.5">
                   <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest pl-1">所属分类</span>
                   <input className="w-full bg-slate-50 p-3 text-sm font-bold border-none outline-none focus:bg-slate-100 rounded-sm transition-colors" value={editingGoal.category} onChange={e => {
                      const updated = { ...editingGoal, category: e.target.value };
                      setEditingGoal(updated);
                      handleUpdateGoal(updated);
                   }} placeholder="例如：长期、年度、学习..." />
                </div>
                <div className="space-y-3">
                   <div className="flex justify-between items-center px-1">
                      <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-2"><Plus size={12}/> 关键结果 (KR)</span>
                      <button onClick={() => addKR(editingGoal.id)} className="p-1 text-slate-400 hover:text-slate-800 transition-colors"><Plus size={16}/></button>
                   </div>
                   <div className="space-y-2">
                      {editingGoal.keyResults.map(kr => (
                        <div key={kr.id} className="flex gap-2">
                           <input className="flex-1 bg-slate-50 p-3 text-xs font-bold rounded-sm border-none outline-none" value={kr.title} onChange={e => {
                              const updatedKRs = editingGoal.keyResults.map(k => k.id === kr.id ? { ...k, title: e.target.value } : k);
                              const updated = { ...editingGoal, keyResults: updatedKRs };
                              setEditingGoal(updated);
                              handleUpdateGoal(updated);
                           }} />
                           <button onClick={() => {
                              const updatedKRs = editingGoal.keyResults.filter(k => k.id !== kr.id);
                              const updated = { ...editingGoal, keyResults: updatedKRs };
                              setEditingGoal(updated);
                              handleUpdateGoal(updated);
                           }} className="p-3 text-rose-300 hover:text-rose-500 transition-colors"><Trash2 size={16}/></button>
                        </div>
                      ))}
                   </div>
                </div>
                <button 
                  onClick={() => handleDeleteGoal(editingGoal.id)}
                  className="w-full py-4 bg-rose-50 text-rose-500 font-black uppercase text-[10px] tracking-widest rounded-sm flex items-center justify-center gap-2 active:bg-rose-100 transition-colors"
                >
                  <Trash2 size={14} /> 删除此目标
                </button>
             </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default TaskLibraryPage;
