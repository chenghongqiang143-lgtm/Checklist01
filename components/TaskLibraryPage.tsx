
import React, { useState, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ThemeOption, Task, Goal, Habit, KeyResult } from '../types';
// Added ChevronUp to the imports from lucide-react
import { Hash, Settings2, Menu, Activity, Book, Coffee, Heart, Smile, Star, Dumbbell, GlassWater, Moon, Sun, Laptop, Music, Camera, Brush, MapPin, Target, Trash2, Plus, ChevronDown, ChevronUp, ChevronRight, Flame, CheckCircle2, Clock, X, LayoutGrid, Circle, Bookmark, Edit2, ListTodo } from 'lucide-react';

const HABIT_ICONS: any = { Activity, Book, Coffee, Heart, Smile, Star, Dumbbell, GlassWater, Moon, Sun, Laptop, Music, Camera, Brush, MapPin };

interface TaskLibraryPageProps {
  theme: ThemeOption;
  library: Task[];
  habits: Habit[];
  goals: Goal[];
  setLibrary: (lib: Task[]) => void;
  setHabits: (habits: Habit[]) => void;
  setGoals: (goals: Goal[]) => void;
  onEditTask: (task: Task) => void;
  onEditHabit: (habit: Habit) => void;
  onOpenSidebar: () => void;
  onCreateItem: (type: 'task' | 'habit' | 'goal', defaultCategory?: string) => void;
  activeMainTab: 'task' | 'habit' | 'goal';
  setActiveMainTab: (tab: 'task' | 'habit' | 'goal') => void;
}

const TaskLibraryPage: React.FC<TaskLibraryPageProps> = ({ 
  theme, library, habits, goals, setLibrary, setHabits, setGoals, onEditTask, onEditHabit, onOpenSidebar, onCreateItem, 
  activeMainTab, setActiveMainTab 
}) => {
  const [expandedGoalIds, setExpandedGoalIds] = useState<Set<string>>(new Set());
  const [expandedTaskIds, setExpandedTaskIds] = useState<Set<string>>(new Set());
  const [editingCategory, setEditingCategory] = useState<{ oldName: string, newName: string } | null>(null);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [isAddingNewCategory, setIsAddingNewCategory] = useState(false);
  const longPressTimer = useRef<number | null>(null);
  const itemLongPressTimer = useRef<number | null>(null);
  
  const allCategories = useMemo(() => {
    const cats = activeMainTab === 'task' 
      ? library.map(t => t.category)
      : activeMainTab === 'habit'
        ? habits.map(h => h.category)
        : goals.map(g => g.category);
    return Array.from(new Set(cats)).filter(Boolean).sort();
  }, [library, habits, goals, activeMainTab]);

  const [activeCategory, setActiveCategory] = useState('全部');

  const themeGradient = `linear-gradient(135deg, ${theme.color}, ${theme.color}99)`;

  const handleCatStartPress = (cat: string) => {
    if (cat === '全部') return;
    longPressTimer.current = window.setTimeout(() => {
      setEditingCategory({ oldName: cat, newName: cat });
    }, 600);
  };

  const handleCatEndPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleItemStartPress = (item: any, type: 'task' | 'habit' | 'goal') => {
    itemLongPressTimer.current = window.setTimeout(() => {
      if (type === 'task') onEditTask(item);
      else if (type === 'habit') onEditHabit(item);
      else if (type === 'goal') setEditingGoal(item);
      itemLongPressTimer.current = null;
    }, 600);
  };

  const handleItemEndPress = () => {
    if (itemLongPressTimer.current) {
      clearTimeout(itemLongPressTimer.current);
      itemLongPressTimer.current = null;
    }
  };

  const handleUpdateCategory = () => {
    if (!editingCategory || !editingCategory.newName.trim()) return;
    const { oldName, newName } = editingCategory;
    const trimmedNewName = newName.trim();

    if (allCategories.includes(trimmedNewName) && trimmedNewName !== oldName) {
      alert('分类名称已存在');
      return;
    }

    if (activeMainTab === 'task') {
      setLibrary(library.map(t => t.category === oldName ? { ...t, category: trimmedNewName } : t));
    } else if (activeMainTab === 'habit') {
      setHabits(habits.map(h => h.category === oldName ? { ...h, category: trimmedNewName } : h));
    } else {
      setGoals(goals.map(g => g.category === oldName ? { ...g, category: trimmedNewName } : g));
    }

    if (activeCategory === oldName) setActiveCategory(trimmedNewName);
    setEditingCategory(null);
  };

  const handleDeleteCategory = () => {
    if (!editingCategory) return;
    const { oldName } = editingCategory;

    if (activeMainTab === 'task') {
      setLibrary(library.map(t => t.category === oldName ? { ...t, category: '默认' } : t));
    } else if (activeMainTab === 'habit') {
      setHabits(habits.map(h => h.category === oldName ? { ...h, category: '默认' } : h));
    } else {
      setGoals(goals.map(g => g.category === oldName ? { ...g, category: '默认' } : g));
    }

    if (activeCategory === oldName) setActiveCategory('全部');
    setEditingCategory(null);
  };

  const toggleGoalExpansion = (id: string) => {
    const next = new Set(expandedGoalIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedGoalIds(next);
  };

  const toggleTaskExpansion = (id: string) => {
    const next = new Set(expandedTaskIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedTaskIds(next);
  };

  const getCategoryColor = (cat: string) => {
    if (cat === '全部' || !cat) return theme.color;
    let hash = 0;
    for (let i = 0; i < cat.length; i++) hash = cat.charCodeAt(i) + ((hash << 5) - hash);
    const h = Math.abs(hash % 360);
    return `hsl(${h}, 65%, 55%)`;
  };

  const getTimeAgo = (timestamp?: number) => {
    if (!timestamp) return '从未完成';
    const diff = Date.now() - timestamp;
    const minutesAgo = Math.floor(diff / (1000 * 60));
    const hoursAgo = Math.floor(diff / (1000 * 60 * 60));
    const daysAgo = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (minutesAgo < 60) return `${minutesAgo}分钟前`;
    if (hoursAgo < 24) return `${hoursAgo}小时前`;
    if (daysAgo === 0) return '今天';
    return `${daysAgo}天前`;
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

  const renderTaskItem = (task: Task) => {
    const krInfo = getKrInfo(task.krId);
    const progress = task.targetCount ? Math.min(100, ((task.accumulatedCount || 0) / task.targetCount) * 100) : 0;
    const catColor = getCategoryColor(task.category);
    const hasSubtasks = task.subtasks && task.subtasks.length > 0;
    const isExpanded = expandedTaskIds.has(task.id);

    return (
      <div 
        key={task.id} 
        onPointerDown={() => handleItemStartPress(task, 'task')}
        onPointerUp={handleItemEndPress}
        onPointerLeave={handleItemEndPress}
        onClick={() => hasSubtasks && toggleTaskExpansion(task.id)}
        className="p-4 bg-white rounded-sm flex flex-col relative overflow-hidden group cursor-pointer border border-slate-100 shadow-sm active:scale-[0.99] transition-all mb-3"
      >
        <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: catColor }} />
        {task.targetCount && (
          <div className="absolute inset-y-0 left-0 opacity-10 transition-all duration-700" style={{ width: `${progress}%`, background: catColor }} />
        )}
        <div className="flex justify-between items-start z-10">
          <div className="flex flex-col">
             <div className="flex items-center gap-2">
               <span className="text-sm font-bold text-slate-700">{task.title}</span>
               {hasSubtasks && (
                 <div className="flex items-center gap-1 bg-slate-50 px-1.5 py-0.5 rounded-[2px] border border-slate-100">
                    <ListTodo size={8} className="text-slate-400" />
                    <span className="text-[7px] font-black text-slate-400 uppercase">{task.subtasks!.length}</span>
                    {isExpanded ? <ChevronUp size={8} className="text-slate-300" /> : <ChevronDown size={8} className="text-slate-300" />}
                 </div>
               )}
             </div>
             {krInfo && <span className="text-[9px] font-black text-blue-400 uppercase tracking-tight mt-0.5">{krInfo.goal} · {krInfo.kr}</span>}
          </div>
          <div className="opacity-0 group-hover:opacity-40 transition-opacity">
            <Edit2 size={12} className="text-slate-400 shrink-0" />
          </div>
        </div>

        {isExpanded && hasSubtasks && (
          <div className="mt-3 space-y-1.5 pl-3 border-l-2 border-slate-50 animate-in fade-in slide-in-from-top-2 duration-300">
             {task.subtasks!.map(s => (
               <div key={s.id} className="flex items-center gap-2">
                  <div className={`w-1 h-1 rounded-full ${s.completed ? 'bg-slate-300' : ''}`} style={{ backgroundColor: !s.completed ? theme.color : undefined }} />
                  <span className={`text-[10px] font-bold ${s.completed ? 'text-slate-300 line-through' : 'text-slate-500'}`}>{s.title || '无标题子任务'}</span>
               </div>
             ))}
          </div>
        )}

        <div className="flex items-center justify-between mt-2 z-10 opacity-50">
          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><Hash size={8} style={{color: catColor}}/> {task.category} · {getTimeAgo(task.lastCompletedAt)}</span>
          {task.targetCount && <span className="text-[8px] font-black mono text-slate-500">{task.accumulatedCount}/{task.targetCount}</span>}
        </div>
      </div>
    );
  };

  const renderHabitItem = (habit: Habit) => {
    const IconComp = HABIT_ICONS[habit.iconName] || Activity;
    const progress = habit.targetCount ? Math.min(100, ((habit.accumulatedCount || 0) / habit.targetCount) * 100) : 0;
    const goalTitle = getGoalTitleByKrId(habit.krId);
    return (
      <div 
        key={habit.id} 
        onPointerDown={() => handleItemStartPress(habit, 'habit')}
        onPointerUp={handleItemEndPress}
        onPointerLeave={handleItemEndPress}
        className="p-5 rounded-sm mb-3 flex flex-col gap-1 cursor-pointer active:scale-[0.98] transition-all border-none shadow-md relative overflow-hidden group"
        style={{ background: habit.color }}
      >
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
                 <span className="text-[8px] font-bold text-white/40 uppercase tracking-tight leading-none bg-black/10 px-1.5 py-0.5 rounded-[2px]">
                    {habit.frequencyDays}天{habit.frequencyTimes}次
                 </span>
                 <span className="text-[8px] font-black text-white/70 mono uppercase tracking-tight leading-none">
                    累计: {habit.accumulatedCount} · 上次: {getTimeAgo(habit.lastCompletedAt)}
                 </span>
              </div>
            </div>
          </div>
          <div className="flex items-center self-start">
            <Edit2 size={16} className="text-white/20 group-hover:text-white/60 transition-colors" />
          </div>
        </div>
      </div>
    );
  };

  const renderGoalItem = (goal: Goal) => {
    const isExpanded = expandedGoalIds.has(goal.id);
    return (
      <div key={goal.id} className={`bg-white rounded-sm border border-slate-100 shadow-sm overflow-hidden transition-all duration-300 mb-3 ${isExpanded ? 'p-5 space-y-4 ring-1 ring-slate-100' : 'p-4'}`}>
         <div className="flex items-center justify-between">
           <div 
            className="flex-1 flex items-center gap-3 cursor-pointer group"
            onPointerDown={() => handleItemStartPress(goal, 'goal')}
            onPointerUp={handleItemEndPress}
            onPointerLeave={handleItemEndPress}
            onClick={() => !editingGoal && toggleGoalExpansion(goal.id)}
           >
             <div className={`p-1.5 rounded-[4px] transition-all ${isExpanded ? 'text-white scale-110' : 'bg-slate-50 text-slate-300'}`} style={{ background: isExpanded ? theme.color : undefined }}>
                <Target size={16} />
             </div>
             <div className="flex flex-col">
               <h3 className={`text-sm font-black transition-colors ${isExpanded ? 'text-slate-800' : 'text-slate-600'}`}>{goal.title}</h3>
               {!isExpanded && <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest leading-none mt-0.5">{goal.category}</span>}
             </div>
             <div className={`ml-auto transition-transform duration-300 ${isExpanded ? 'rotate-180 text-slate-400' : 'text-slate-200'}`}>
                <ChevronDown size={14} />
             </div>
           </div>
         </div>
         {isExpanded && (
           <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
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
                   
                   <div className="mt-2 ml-2 border-l-2 border-slate-50 pl-3 space-y-1.5">
                      {linkedHabits.map(h => {
                         const Icon = HABIT_ICONS[h.iconName] || Activity;
                         return (
                           <div key={h.id} className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                             <Icon size={10} style={{ color: h.color }} />
                             <span className="truncate">{h.title}</span>
                           </div>
                         );
                      })}
                      {linkedTasks.map(t => (
                        <div key={t.id} className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                          <Circle size={8} className="text-slate-200" />
                          <span className="truncate">{t.title}</span>
                        </div>
                      ))}
                      {linkedTasks.length === 0 && linkedHabits.length === 0 && (
                        <span className="text-[9px] font-black text-slate-200 uppercase italic">暂无链接项</span>
                      )}
                   </div>
                 </div>
               );
             })}
           </div>
         )}
      </div>
    );
  };

  const renderGroupedContent = () => {
    const listToRender = activeCategory === '全部' ? allCategories : [activeCategory];
    
    return (
      <div className="space-y-8">
        {listToRender.map(cat => {
          let items = [];
          if (activeMainTab === 'task') items = library.filter(t => t.category === cat);
          else if (activeMainTab === 'habit') items = habits.filter(h => h.category === cat);
          else items = goals.filter(g => g.category === cat);

          if (items.length === 0 && activeCategory !== '全部') return (
            <div key={cat} className="flex flex-col items-center justify-center py-20 text-slate-200 gap-4">
              <LayoutGrid size={48} />
              <span className="text-[11px] font-black uppercase tracking-[0.3em]">该分类下暂无内容</span>
            </div>
          );
          if (items.length === 0) return null;

          return (
            <div key={cat} className="space-y-4">
              <div className="flex items-center gap-3 px-1">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{cat}</span>
                <div className="flex-1 h-[1px] bg-slate-100" />
              </div>
              <div className="space-y-0">
                {items.map(item => {
                  if (activeMainTab === 'task') return renderTaskItem(item);
                  if (activeMainTab === 'habit') return renderHabitItem(item);
                  return renderGoalItem(item);
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const handleUpdateGoal = (updated: Goal) => {
    setGoals(goals.map(g => g.id === updated.id ? updated : g));
  };

  const handleDeleteGoal = (id: string) => {
    setGoals(goals.filter(g => g.id !== id));
    setEditingGoal(null);
  };

  return (
    <div className="h-full flex flex-col bg-white overflow-hidden relative">
      <header className="px-6 pt-16 pb-4 shrink-0 bg-white z-20 shadow-sm">
         <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <button onClick={onOpenSidebar} className="p-1 -ml-1 text-slate-400 active:scale-90 transition-transform">
                <Menu size={20} strokeWidth={2.5} />
              </button>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-4 rounded-full" style={{ background: themeGradient }} />
                <h1 className="text-lg font-black tracking-tighter uppercase truncate">库 / LIBRARY</h1>
              </div>
            </div>
         </div>
         <div className="flex gap-6 mb-2 px-1 overflow-x-auto no-scrollbar items-center">
            {['task', 'habit', 'goal'].map(id => (
                <button key={id} onClick={() => { setActiveMainTab(id as any); setActiveCategory('全部'); }} className={`text-2xl font-black tracking-tight relative whitespace-nowrap pb-1 transition-colors ${activeMainTab === id ? 'text-slate-800' : 'text-slate-200'}`}>
                    {id === 'task' ? '任务' : id === 'habit' ? '习惯' : '目标'}
                    {activeMainTab === id && <div className="absolute -bottom-1 left-0 right-0 h-1 rounded-full" style={{ background: theme.color }} />}
                </button>
            ))}
         </div>
         <div className="flex items-center gap-2 py-3 bg-slate-50/50 -mx-6 px-6">
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              <button 
                onClick={() => setActiveCategory('全部')}
                className={`px-4 py-1.5 rounded-sm text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${activeCategory === '全部' ? 'text-white border-transparent' : 'bg-white text-slate-400 border-slate-100'}`}
                style={{ backgroundColor: activeCategory === '全部' ? theme.color : undefined }}
              >
                全部
              </button>
              {allCategories.map(cat => (
                <button 
                  key={cat} 
                  onPointerDown={() => handleCatStartPress(cat)}
                  onPointerUp={handleCatEndPress}
                  onPointerLeave={handleCatEndPress}
                  onClick={() => !editingCategory && setActiveCategory(cat)}
                  className={`px-4 py-1.5 rounded-sm text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${activeCategory === cat ? 'text-white border-transparent' : 'bg-white text-slate-400 border-slate-100 hover:border-slate-300'}`}
                  style={{ backgroundColor: activeCategory === cat ? theme.color : undefined }}
                >
                  {cat}
                </button>
              ))}
            </div>
            <button 
              onClick={() => setIsAddingNewCategory(true)}
              className="w-8 h-8 flex items-center justify-center shrink-0 bg-white border border-slate-100 text-slate-300 rounded-sm hover:text-slate-600 transition-colors ml-1"
            >
              <Plus size={16} />
            </button>
         </div>
      </header>

      <main className="flex-1 overflow-y-auto px-6 pb-32 no-scrollbar pt-6">
        {renderGroupedContent()}

        <button 
          onClick={() => onCreateItem(activeMainTab, activeCategory === '全部' ? undefined : activeCategory)}
          className="w-full py-5 border-2 border-dashed border-slate-100 rounded-sm text-slate-300 font-black uppercase tracking-widest text-[11px] flex items-center justify-center gap-2 hover:border-slate-200 transition-all mt-4"
        >
          <Plus size={16} /> 新增{activeMainTab === 'task' ? '任务' : activeMainTab === 'habit' ? '习惯' : '目标'}
        </button>
      </main>

      {isAddingNewCategory && createPortal(
        <div className="fixed inset-0 z-[1000] bg-slate-900/60 flex items-center justify-center p-6" onClick={() => setIsAddingNewCategory(false)}>
          <div className="bg-white w-full max-w-xs rounded-sm p-6 shadow-2xl space-y-6 animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
             <div className="flex justify-between items-center">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">新增分类</h3>
                <button onClick={() => setIsAddingNewCategory(false)}><X size={18}/></button>
             </div>
             <div className="space-y-1">
                <span className="text-[9px] font-black text-slate-300 uppercase pl-1">新分类名称</span>
                <input autoFocus className="w-full bg-slate-50 p-4 font-bold border rounded-sm outline-none focus:bg-white transition-colors" placeholder="输入名称后回车" onKeyDown={e => {
                  if (e.key === 'Enter') {
                    const name = (e.target as HTMLInputElement).value.trim();
                    if (!name) return;
                    if (allCategories.includes(name)) {
                      alert('分类已存在');
                      return;
                    }
                    onCreateItem(activeMainTab, name);
                    setIsAddingNewCategory(false);
                  }
                }} />
             </div>
          </div>
        </div>,
        document.body
      )}

      {editingCategory && createPortal(
        <div className="fixed inset-0 z-[1000] bg-slate-900/60 flex items-center justify-center p-6" onClick={() => setEditingCategory(null)}>
          <div className="bg-white w-full max-w-xs rounded-sm p-6 shadow-2xl space-y-6 animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
             <div className="flex justify-between items-center">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">编辑分类</h3>
                <button onClick={() => setEditingCategory(null)}><X size={18}/></button>
             </div>
             <div className="space-y-1">
                <span className="text-[9px] font-black text-slate-300 uppercase pl-1">重命名分类</span>
                <input autoFocus className="w-full bg-slate-50 p-4 font-bold border rounded-sm outline-none focus:bg-white transition-colors" value={editingCategory.newName} onChange={e => setEditingCategory({...editingCategory, newName: e.target.value})} />
             </div>
             <div className="flex flex-col gap-2">
                <button onClick={handleUpdateCategory} className="w-full py-3 text-white font-black uppercase text-[10px] tracking-widest rounded-sm shadow-lg active:scale-95 transition-all" style={{ background: theme.color }}>
                   应用重命名
                </button>
                <button onClick={handleDeleteCategory} className="w-full py-3 bg-rose-50 text-rose-500 font-black uppercase text-[10px] tracking-widest rounded-sm flex items-center justify-center gap-2 hover:bg-rose-100 transition-colors">
                   <Trash2 size={14} /> 删除分类 (项目设为默认)
                </button>
             </div>
          </div>
        </div>,
        document.body
      )}

      {editingGoal && createPortal(
        <div className="fixed inset-0 z-[800] bg-slate-900/60 flex items-end justify-center p-4" onClick={() => setEditingGoal(null)}>
          <div className="bg-white w-full max-w-md rounded-sm p-6 shadow-2xl animate-in slide-in-from-bottom duration-300 flex flex-col max-h-[85vh] overflow-hidden" onClick={e => e.stopPropagation()}>
             <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <button onClick={() => handleDeleteGoal(editingGoal.id)} className="p-2 bg-rose-50 text-rose-500 rounded-sm hover:bg-rose-100 transition-colors">
                    <Trash2 size={18} />
                  </button>
                  <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">目标编辑</h3>
                </div>
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
                   <select className="w-full bg-slate-50 p-3 text-sm font-bold border-none outline-none focus:bg-slate-100 rounded-sm transition-colors appearance-none" value={editingGoal.category} onChange={e => {
                      const updated = { ...editingGoal, category: e.target.value };
                      setEditingGoal(updated);
                      handleUpdateGoal(updated);
                   }}>
                      {allCategories.map(c => <option key={c} value={c}>{c}</option>)}
                   </select>
                </div>
                <div className="space-y-3">
                   <div className="flex justify-between items-center px-1">
                      <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-2"><Plus size={12}/> 关键结果 (KR)</span>
                      <button onClick={() => {
                        const newKR = { id: 'kr-' + Date.now(), title: '新关键结果', progress: 0 };
                        const updated = { ...editingGoal, keyResults: [...editingGoal.keyResults, newKR] };
                        setEditingGoal(updated);
                        handleUpdateGoal(updated);
                      }} className="p-1 text-slate-400 hover:text-slate-800 transition-colors"><Plus size={16}/></button>
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
             </div>
             <button onClick={() => handleUpdateGoal(editingGoal)} className="w-full py-4 text-white font-black uppercase rounded-sm shadow-xl active:scale-95 transition-all shrink-0 mt-4" style={{ background: theme.color }}>保存并更新</button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default TaskLibraryPage;
