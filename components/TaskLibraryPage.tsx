
import React, { useState, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ThemeOption, Task, Goal, Habit } from '../types';
import { Hash, Menu, Activity, Book, Coffee, Heart, Smile, Star, Dumbbell, GlassWater, Moon, Sun, Laptop, Music, Camera, Brush, MapPin, Target, Trash2, Plus, ChevronDown, ChevronUp, Edit2, ListTodo, X } from 'lucide-react';

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

// 修复: 添加默认导出，并修正 renderHabitItem 中的 handleEndPress 为 handleItemEndPress
const TaskLibraryPage: React.FC<TaskLibraryPageProps> = ({ 
  theme, library, habits, goals, setLibrary, setHabits, setGoals, onEditTask, onEditHabit, onOpenSidebar, onCreateItem, 
  activeMainTab, setActiveMainTab 
}) => {
  const [expandedGoalIds, setExpandedGoalIds] = useState<Set<string>>(new Set());
  const [expandedTaskIds, setExpandedTaskIds] = useState<Set<string>>(new Set());
  const [editingCategory, setEditingCategory] = useState<{ oldName: string, newName: string } | null>(null);
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

    return (
      <div 
        key={task.id} 
        onPointerDown={() => handleItemStartPress(task, 'task')}
        onPointerUp={handleItemEndPress}
        onPointerLeave={handleItemEndPress}
        onClick={() => onEditTask(task)}
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
                 <button 
                  onClick={(e) => { e.stopPropagation(); toggleTaskExpansion(task.id); }}
                  className="flex items-center gap-1 bg-slate-50 px-1.5 py-0.5 rounded-[2px] border border-slate-100"
                 >
                    <ListTodo size={8} className="text-slate-400" />
                    <span className="text-[7px] font-black text-slate-400 uppercase">{task.subtasks!.length}</span>
                    {isExpanded ? <ChevronUp size={8} className="text-slate-300" /> : <ChevronDown size={8} className="text-slate-300" />}
                 </button>
               )}
             </div>
             {krInfo && <span className="text-[9px] font-black text-blue-400 uppercase tracking-tight mt-0.5">{krInfo.goal} · {krInfo.kr}</span>}
          </div>
          <div className="opacity-20 group-hover:opacity-100 transition-opacity">
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
        onClick={() => onEditHabit(habit)}
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

  return (
    <div className="h-full flex flex-col bg-white overflow-hidden">
      <header className="px-6 pt-16 pb-4 shrink-0 bg-white shadow-sm z-10">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={onOpenSidebar} className="p-1 -ml-1 text-slate-400 active:scale-90 transition-transform">
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-4 rounded-full" style={{ background: themeGradient }} />
            <h1 className="text-lg font-black tracking-tighter uppercase">库 / LIBRARY</h1>
          </div>
        </div>
        
        <div className="flex bg-slate-100 rounded-sm p-1">
          {['task', 'habit', 'goal'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveMainTab(tab as any)}
              className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest transition-all rounded-sm ${
                activeMainTab === tab ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {tab === 'task' ? '待办任务' : tab === 'habit' ? '长期习惯' : '目标愿景'}
            </button>
          ))}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto no-scrollbar px-6 pt-4 pb-32">
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

        <div className="space-y-1">
          {activeMainTab === 'task' && library
            .filter(t => activeCategory === '全部' || t.category === activeCategory)
            .map(renderTaskItem)}
          
          {activeMainTab === 'habit' && habits
            .filter(h => activeCategory === '全部' || h.category === activeCategory)
            .map(renderHabitItem)}
          
          {activeMainTab === 'goal' && goals
            .filter(g => activeCategory === '全部' || g.category === activeCategory)
            .map(goal => (
              <div 
                key={goal.id} 
                className="bg-white border border-slate-100 rounded-sm overflow-hidden mb-4 shadow-sm"
              >
                <div 
                  className="p-4 flex items-center justify-between cursor-pointer active:bg-slate-50 transition-colors"
                  onClick={() => toggleGoalExpansion(goal.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-sm bg-slate-50 flex items-center justify-center text-slate-400">
                      <Target size={18} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-800">{goal.title}</h3>
                      <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{goal.category}</span>
                    </div>
                  </div>
                  {expandedGoalIds.has(goal.id) ? <ChevronUp size={16} className="text-slate-300" /> : <ChevronDown size={16} className="text-slate-300" />}
                </div>
                
                {expandedGoalIds.has(goal.id) && (
                  <div className="px-4 pb-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                    {goal.keyResults.map(kr => (
                      <div key={kr.id} className="space-y-1.5">
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
                      </div>
                    ))}
                    <button 
                      onClick={() => onCreateItem('goal', goal.category)}
                      className="w-full py-2 border border-dashed border-slate-100 rounded-sm text-[9px] font-black text-slate-300 uppercase tracking-widest hover:border-slate-200 transition-all flex items-center justify-center gap-1"
                    >
                      <Plus size={10} /> 新增关键结果
                    </button>
                  </div>
                )}
              </div>
            ))}
        </div>
      </main>

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
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default TaskLibraryPage;
