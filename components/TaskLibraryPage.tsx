
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ThemeOption, Task, Goal, Habit } from '../types';
import { Hash, Menu, Activity, Book, Coffee, Heart, Smile, Star, Dumbbell, GlassWater, Moon, Sun, Laptop, Music, Camera, Brush, MapPin, Target, Trash2, Plus, ChevronDown, ChevronUp, Edit2, ListTodo, X, Check, FolderInput, ArrowRightLeft, Square, CheckSquare, AlertCircle, Clock, MoreHorizontal } from 'lucide-react';

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
  onEditGoal: (goal: Goal) => void;
  onOpenSidebar: () => void;
  onCreateItem: (type: 'task' | 'habit' | 'goal', defaultCategory?: string) => void;
  activeMainTab: 'task' | 'habit' | 'goal';
  setActiveMainTab: (tab: 'task' | 'habit' | 'goal') => void;
  isVisible: boolean;
}

const TaskLibraryPage: React.FC<TaskLibraryPageProps> = ({ 
  theme, library, habits, goals, setLibrary, setHabits, setGoals, onEditTask, onEditHabit, onEditGoal, onOpenSidebar, onCreateItem, 
  activeMainTab, setActiveMainTab, isVisible
}) => {
  const [expandedGoalIds, setExpandedGoalIds] = useState<Set<string>>(new Set());
  const [expandedTaskIds, setExpandedTaskIds] = useState<Set<string>>(new Set());
  const [editingCategory, setEditingCategory] = useState<{ oldName: string, newName: string } | null>(null);
  const [isAddingNewCategory, setIsAddingNewCategory] = useState(false);
  
  // 多选模式状态
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBatchMoving, setIsBatchMoving] = useState(false);
  const [batchMoveTarget, setBatchMoveTarget] = useState('');

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

  // 当页面不可见或切换Tab时，退出多选模式
  useEffect(() => {
    if (!isVisible) {
      setIsSelectionMode(false);
      setSelectedIds(new Set());
      setEditingCategory(null);
      setIsAddingNewCategory(false);
      setIsBatchMoving(false);
    }
  }, [isVisible]);

  useEffect(() => {
    setIsSelectionMode(false);
    setSelectedIds(new Set());
  }, [activeMainTab]);

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

  const handleItemStartPress = (itemId: string) => {
    // 已经在多选模式下长按无效（或者可以设计为退出，这里保持无效）
    if (isSelectionMode) return;
    
    itemLongPressTimer.current = window.setTimeout(() => {
      setIsSelectionMode(true);
      const newSet = new Set<string>();
      newSet.add(itemId);
      setSelectedIds(newSet);
      if (navigator.vibrate) navigator.vibrate(50);
      itemLongPressTimer.current = null;
    }, 500);
  };

  const handleItemEndPress = () => {
    if (itemLongPressTimer.current) {
      clearTimeout(itemLongPressTimer.current);
      itemLongPressTimer.current = null;
    }
  };

  const handleItemClick = (item: Task | Habit | Goal) => {
    if (isSelectionMode) {
      const newSet = new Set(selectedIds);
      if (newSet.has(item.id)) {
        newSet.delete(item.id);
        if (newSet.size === 0) setIsSelectionMode(false);
      } else {
        newSet.add(item.id);
      }
      setSelectedIds(newSet);
    } else {
      if ('type' in item) onEditTask(item as Task);
      else if ('frequencyDays' in item) onEditHabit(item as Habit);
      else onEditGoal(item as Goal);
    }
  };

  const handleBatchDelete = () => {
    if (window.confirm(`确定要删除选中的 ${selectedIds.size} 项吗？此操作不可恢复。`)) {
      if (activeMainTab === 'task') {
        setLibrary(library.filter(t => !selectedIds.has(t.id)));
      } else if (activeMainTab === 'habit') {
        setHabits(habits.filter(h => !selectedIds.has(h.id)));
      } else if (activeMainTab === 'goal') {
        setGoals(goals.filter(g => !selectedIds.has(g.id)));
      }
      setIsSelectionMode(false);
      setSelectedIds(new Set());
    }
  };

  const handleBatchMove = () => {
    if (!batchMoveTarget) return;
    if (activeMainTab === 'task') {
      setLibrary(library.map(t => selectedIds.has(t.id) ? { ...t, category: batchMoveTarget } : t));
    } else if (activeMainTab === 'habit') {
      setHabits(habits.map(h => selectedIds.has(h.id) ? { ...h, category: batchMoveTarget } : h));
    } else if (activeMainTab === 'goal') {
      setGoals(goals.map(g => selectedIds.has(g.id) ? { ...g, category: batchMoveTarget } : g));
    }
    setIsBatchMoving(false);
    setIsSelectionMode(false);
    setSelectedIds(new Set());
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
    const completedTasks = linkedTasks.filter(t => t.completed || (t.targetCount && (t.accumulatedCount || 0) >= t.targetCount)).length;
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
    const isSelected = selectedIds.has(task.id);
    
    // Priority Styles
    const isImportant = task.priority === 'important';
    const isWaiting = task.priority === 'waiting';

    return (
      <div 
        key={task.id} 
        onPointerDown={() => handleItemStartPress(task.id)}
        onPointerUp={handleItemEndPress}
        onPointerLeave={handleItemEndPress}
        onClick={() => handleItemClick(task)}
        className={`p-4 bg-white rounded-sm flex flex-col relative overflow-hidden group cursor-pointer border shadow-sm active:scale-[0.99] transition-all mb-3 ${isSelected ? 'ring-2 ring-offset-1' : 'border-slate-100'}`}
        style={{ 
          borderColor: isSelected ? theme.color : undefined,
          opacity: isWaiting ? 0.6 : 1,
        }}
      >
        <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: catColor }} />
        
        {/* Important Indicator */}
        {isImportant && (
          <div className="absolute top-0 right-0 w-0 h-0 border-t-[20px] border-l-[20px] border-t-amber-400 border-l-transparent" />
        )}

        {task.targetCount && (
          <div className="absolute inset-y-0 left-0 opacity-10 transition-all duration-700" style={{ width: `${progress}%`, background: catColor }} />
        )}
        <div className="flex justify-between items-start z-10">
          <div className="flex flex-col flex-1 min-w-0 pr-2">
             <div className="flex items-center gap-2">
               {isSelectionMode && (
                 <div className={`w-3.5 h-3.5 rounded-[3px] border flex items-center justify-center transition-colors ${isSelected ? 'bg-slate-800 border-slate-800 text-white' : 'border-slate-300 bg-white'}`}>
                    {isSelected && <Check size={10} strokeWidth={4} />}
                 </div>
               )}
               {isWaiting && <Clock size={12} className="text-slate-400" />}
               <span className={`text-sm font-bold truncate ${isImportant ? 'text-slate-800' : 'text-slate-700'}`}>{task.title}</span>
               {hasSubtasks && !isSelectionMode && (
                 <button 
                  onClick={(e) => { e.stopPropagation(); toggleTaskExpansion(task.id); }}
                  className="flex items-center gap-1 bg-slate-50 px-1.5 py-0.5 rounded-[2px] border border-slate-100 shrink-0"
                 >
                    <ListTodo size={8} className="text-slate-400" />
                    <span className="text-[7px] font-black text-slate-400 uppercase">{task.subtasks!.length}</span>
                    {isExpanded ? <ChevronUp size={8} className="text-slate-300" /> : <ChevronDown size={8} className="text-slate-300" />}
                 </button>
               )}
             </div>
             {krInfo && <span className="text-[9px] font-black text-blue-400 uppercase tracking-tight mt-0.5">{krInfo.goal} · {krInfo.kr}</span>}
          </div>
          {!isSelectionMode && (
            <div className="opacity-20 group-hover:opacity-100 transition-opacity flex items-center gap-1">
              {isImportant && <AlertCircle size={12} className="text-amber-500 shrink-0 mr-1" />}
              <Edit2 size={12} className="text-slate-400 shrink-0" />
            </div>
          )}
        </div>

        {isExpanded && hasSubtasks && !isSelectionMode && (
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
    const isSelected = selectedIds.has(habit.id);

    return (
      <div 
        key={habit.id} 
        onPointerDown={() => handleItemStartPress(habit.id)}
        onPointerUp={handleItemEndPress}
        onPointerLeave={handleItemEndPress}
        onClick={() => handleItemClick(habit)}
        className={`p-5 rounded-sm mb-3 flex flex-col gap-1 cursor-pointer active:scale-[0.98] transition-all border-none shadow-md relative overflow-hidden group ${isSelected ? 'ring-2 ring-offset-2 ring-slate-300' : ''}`}
        style={{ background: habit.color }}
      >
        <div className="absolute inset-y-0 left-0 bg-black/15 transition-all duration-700 pointer-events-none" style={{ width: `${progress}%` }} />
        
        <div className="flex items-center justify-between z-10 relative">
          <div className="flex items-center gap-4">
            <div className="relative">
               <div className="w-10 h-10 rounded-sm bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/10 shadow-sm">
                 <IconComp size={20} className="text-white" strokeWidth={2.5} />
               </div>
               {isSelectionMode && (
                 <div className={`absolute -top-1 -left-1 w-4 h-4 rounded-full flex items-center justify-center shadow-md ${isSelected ? 'bg-white text-slate-900' : 'bg-black/40 text-white/50'}`}>
                    {isSelected && <Check size={10} strokeWidth={4} />}
                 </div>
               )}
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
          {!isSelectionMode && (
            <div className="flex items-center self-start">
              <Edit2 size={16} className="text-white/20 group-hover:text-white/60 transition-colors" />
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-white overflow-hidden relative">
      <header className="px-6 pt-16 pb-4 shrink-0 bg-white shadow-sm z-10">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={onOpenSidebar} className="p-1 -ml-1 text-slate-400 active:scale-90 transition-transform">
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-4 rounded-full" style={{ background: themeGradient }} />
            <h1 className="text-lg font-black tracking-tighter uppercase">库 / LIBRARY</h1>
          </div>
          {isSelectionMode && (
             <div className="ml-auto px-2 py-1 bg-slate-900 text-white text-[9px] font-black uppercase rounded-[2px] animate-in slide-in-from-right duration-300">
                多选模式 ({selectedIds.size})
             </div>
          )}
        </div>
        
        <div className="flex bg-slate-100 rounded-sm p-1">
          {['task', 'habit', 'goal'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveMainTab(tab as any)}
              className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest transition-all rounded-sm ${
                activeMainTab === tab ? 'shadow-sm' : 'text-slate-400 hover:text-slate-600'
              }`}
              style={{
                backgroundColor: activeMainTab === tab ? theme.color : 'transparent',
                color: activeMainTab === tab ? 'white' : undefined
              }}
            >
              {tab === 'task' ? '待办任务' : tab === 'habit' ? '长期习惯' : '目标愿景'}
            </button>
          ))}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto no-scrollbar px-6 pt-4 pb-32">
        {!isSelectionMode && (
          <div className="flex gap-2 overflow-x-auto no-scrollbar mb-6 pb-1">
            <button
              onClick={() => setActiveCategory('全部')}
              className={`px-4 py-1.5 rounded-sm text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${
                activeCategory === '全部' 
                  ? 'text-white border-transparent' 
                  : 'bg-slate-50 text-slate-400 border-slate-100 hover:bg-slate-100'
              }`}
              style={{ backgroundColor: activeCategory === '全部' ? theme.color : undefined }}
            >
              全部
            </button>
            {allCategories.map((cat) => (
              <button
                key={cat}
                onPointerDown={() => handleCatStartPress(cat)}
                onPointerUp={handleCatEndPress}
                onPointerLeave={handleCatEndPress}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-1.5 rounded-sm text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${
                  activeCategory === cat 
                    ? 'text-white border-transparent' 
                    : 'bg-slate-50 text-slate-400 border-slate-100 hover:bg-slate-100'
                }`}
                style={{ backgroundColor: activeCategory === cat ? getCategoryColor(cat) : undefined }}
              >
                {cat}
              </button>
            ))}
            <button 
              onClick={() => setIsAddingNewCategory(true)}
              className="px-3 py-1.5 rounded-sm text-slate-300 border border-dashed border-slate-200 hover:border-slate-300 transition-all"
            >
              <Plus size={12} />
            </button>
          </div>
        )}

        <div className="space-y-1">
          {activeMainTab === 'task' && library
            .filter(t => activeCategory === '全部' || t.category === activeCategory)
            .map(renderTaskItem)}
          
          {activeMainTab === 'habit' && habits
            .filter(h => activeCategory === '全部' || h.category === activeCategory)
            .map(renderHabitItem)}
          
          {activeMainTab === 'goal' && goals
            .filter(g => activeCategory === '全部' || g.category === activeCategory)
            .map(goal => {
              const isSelected = selectedIds.has(goal.id);
              return (
              <div 
                key={goal.id} 
                onPointerDown={() => handleItemStartPress(goal.id)}
                onPointerUp={handleItemEndPress}
                onPointerLeave={handleItemEndPress}
                onClick={() => handleItemClick(goal)}
                className={`bg-white rounded-sm overflow-hidden mb-4 shadow-sm group transition-all cursor-pointer border ${isSelected ? 'ring-2 ring-offset-1' : 'border-slate-100'}`}
                style={{ borderColor: isSelected ? theme.color : undefined }}
              >
                <div 
                  className="p-4 flex items-center justify-between active:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-8 h-8 rounded-sm bg-slate-50 flex items-center justify-center text-slate-400">
                        <Target size={18} />
                      </div>
                      {isSelectionMode && (
                        <div className={`absolute -top-1 -left-1 w-3.5 h-3.5 rounded-[3px] border flex items-center justify-center transition-colors shadow-sm ${isSelected ? 'bg-slate-800 border-slate-800 text-white' : 'border-slate-300 bg-white'}`}>
                            {isSelected && <Check size={9} strokeWidth={4} />}
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-800">{goal.title}</h3>
                      <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{goal.category}</span>
                    </div>
                  </div>
                  {!isSelectionMode && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); toggleGoalExpansion(goal.id); }}
                      className="p-2 -mr-2 text-slate-300 hover:text-slate-500 transition-colors"
                    >
                      {expandedGoalIds.has(goal.id) ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  )}
                </div>
                
                {expandedGoalIds.has(goal.id) && !isSelectionMode && (
                  <div className="px-4 pb-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300 border-t border-slate-50 pt-4">
                    {goal.keyResults.map(kr => {
                      const linkedTasks = library.filter(t => t.krId === kr.id);
                      const linkedHabits = habits.filter(h => h.krId === kr.id);
                      return (
                        <div key={kr.id} className="space-y-2">
                          <div className="flex justify-between items-end">
                            <span className="text-[10px] font-bold text-slate-600 truncate pr-4">{kr.title}</span>
                            <span className="text-[9px] font-black mono text-slate-400">{getKRProgress(kr.id)}%</span>
                          </div>
                          <div className="w-full h-1 bg-slate-50 rounded-full overflow-hidden">
                            <div 
                              className="h-full transition-all duration-1000" 
                              style={{ width: `${getKRProgress(kr.id)}%`, background: themeGradient }} 
                            />
                          </div>
                          {/* 关联的具体事项展示 */}
                          <div className="pl-2 space-y-1">
                             {linkedTasks.map(t => (
                               <div key={t.id} className="flex items-center gap-2 p-1.5 bg-slate-50/50 rounded-sm border border-slate-50">
                                  <div className="w-1 h-3 rounded-full bg-slate-200" />
                                  <span className="text-[9px] font-bold text-slate-500 truncate flex-1">{t.title}</span>
                                  {t.targetCount && <span className="text-[8px] font-mono text-slate-300">{t.accumulatedCount}/{t.targetCount}</span>}
                               </div>
                             ))}
                             {linkedHabits.map(h => (
                               <div key={h.id} className="flex items-center gap-2 p-1.5 bg-slate-50/50 rounded-sm border border-slate-50">
                                  <div className="w-1 h-3 rounded-full" style={{background: h.color}} />
                                  <span className="text-[9px] font-bold text-slate-500 truncate flex-1">{h.title}</span>
                                  <Activity size={10} className="text-slate-300" />
                               </div>
                             ))}
                             {linkedTasks.length === 0 && linkedHabits.length === 0 && (
                               <span className="text-[8px] text-slate-300 pl-1">暂无关联事项</span>
                             )}
                          </div>
                        </div>
                      );
                    })}
                    <button 
                      onClick={() => onCreateItem('goal', goal.category)}
                      className="w-full py-2 border border-dashed border-slate-100 rounded-sm text-[9px] font-black text-slate-300 uppercase tracking-widest hover:border-slate-200 transition-all flex items-center justify-center gap-1"
                    >
                      <Plus size={10} /> 新增关键结果
                    </button>
                  </div>
                )}
              </div>
            )})}
        </div>
      </main>
      
      {/* 底部多选操作栏 - 使用 createPortal 修复层级和上下文问题，样式匹配新的 BottomNav */}
      {isSelectionMode && createPortal(
         <div className="fixed bottom-4 left-4 right-4 h-[68px] bg-slate-900 text-white flex items-center justify-between px-6 z-[200] rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.3)] animate-in slide-in-from-bottom duration-300 gap-6">
            <div className="flex items-center gap-4">
               <button onClick={() => { setIsSelectionMode(false); setSelectedIds(new Set()); }} className="p-2 text-slate-400 hover:text-white transition-colors"><X size={20}/></button>
               <span className="text-xs font-black uppercase tracking-widest">{selectedIds.size} SELECTED</span>
            </div>
            <div className="flex items-center gap-2">
               <button onClick={() => setIsBatchMoving(true)} className="p-2.5 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50" disabled={selectedIds.size === 0}>
                  <FolderInput size={18} /> <span className="text-[10px] font-bold uppercase hidden sm:inline">移动</span>
               </button>
               <button onClick={handleBatchDelete} className="p-2.5 bg-rose-600 hover:bg-rose-500 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50" disabled={selectedIds.size === 0}>
                  <Trash2 size={18} /> <span className="text-[10px] font-bold uppercase hidden sm:inline">删除</span>
               </button>
            </div>
         </div>,
         document.body
      )}

      {/* Categories Edit Overlay */}
      {editingCategory && createPortal(
        <div className="fixed inset-0 z-[1000] bg-slate-900/60 flex items-end justify-center p-4" onClick={() => setEditingCategory(null)}>
          <div className="bg-white w-full max-w-md rounded-sm p-6 shadow-2xl animate-in slide-in-from-bottom duration-300" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">编辑分类</h3>
              <button onClick={() => setEditingCategory(null)}><X size={20}/></button>
            </div>
            <div className="space-y-4">
              <input 
                autoFocus
                className="w-full bg-slate-50 p-4 text-lg font-bold rounded-sm border outline-none focus:bg-white transition-colors" 
                value={editingCategory.newName} 
                onChange={e => setEditingCategory({...editingCategory, newName: e.target.value})} 
              />
              <div className="flex gap-2">
                <button 
                  onClick={handleDeleteCategory}
                  className="flex-1 py-4 bg-rose-50 text-rose-500 text-[10px] font-black uppercase tracking-widest rounded-sm"
                >
                  删除分类
                </button>
                <button 
                  onClick={handleUpdateCategory}
                  className="flex-[2] py-4 text-white text-[10px] font-black uppercase tracking-widest rounded-sm shadow-lg"
                  style={{ background: themeGradient }}
                >
                  保存修改
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
      
      {/* 批量移动分类弹窗 */}
      {isBatchMoving && createPortal(
        <div className="fixed inset-0 z-[1100] bg-slate-900/60 flex items-end justify-center p-4" onClick={() => setIsBatchMoving(false)}>
           <div className="bg-white w-full max-w-md rounded-sm p-6 shadow-2xl animate-in slide-in-from-bottom duration-300" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-6">
                 <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">批量移动到...</h3>
                 <button onClick={() => setIsBatchMoving(false)}><X size={20}/></button>
              </div>
              <div className="flex flex-wrap gap-2 max-h-[300px] overflow-y-auto no-scrollbar mb-6">
                 {allCategories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setBatchMoveTarget(cat)}
                      className={`px-4 py-3 rounded-sm text-xs font-bold uppercase transition-all border ${batchMoveTarget === cat ? 'bg-slate-800 text-white border-transparent' : 'bg-slate-50 text-slate-500 border-slate-100 hover:bg-slate-100'}`}
                    >
                      {cat}
                    </button>
                 ))}
              </div>
              <button 
                onClick={handleBatchMove}
                disabled={!batchMoveTarget}
                className="w-full py-4 text-white font-black uppercase rounded-sm shadow-xl transition-all disabled:opacity-50"
                style={{ background: theme.color }}
              >
                确认移动
              </button>
           </div>
        </div>,
        document.body
      )}

      {/* New Category Overlay */}
      {isAddingNewCategory && createPortal(
        <div className="fixed inset-0 z-[1000] bg-slate-900/60 flex items-end justify-center p-4" onClick={() => setIsAddingNewCategory(false)}>
          <div className="bg-white w-full max-w-md rounded-sm p-6 shadow-2xl animate-in slide-in-from-bottom duration-300" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">新增分类</h3>
              <button onClick={() => setIsAddingNewCategory(false)}><X size={20}/></button>
            </div>
            <input 
              autoFocus
              className="w-full bg-slate-50 p-4 text-lg font-bold rounded-sm border outline-none focus:bg-white transition-colors mb-4" 
              placeholder="输入分类名称..."
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  const val = (e.target as HTMLInputElement).value.trim();
                  if (val) {
                    onCreateItem(activeMainTab as any, val);
                    setIsAddingNewCategory(false);
                  }
                }
              }}
            />
            <button
               onClick={() => {
                 const input = document.querySelector('input[placeholder="输入分类名称..."]') as HTMLInputElement;
                 const val = input?.value.trim();
                 if (val) {
                   onCreateItem(activeMainTab as any, val);
                   setIsAddingNewCategory(false);
                 }
               }}
               className="w-full py-4 text-white font-black uppercase rounded-sm shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
               style={{ background: themeGradient }}
            >
               <Check size={16} strokeWidth={3} /> 确认创建
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default TaskLibraryPage;
