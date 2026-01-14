
import React, { useState, useRef } from 'react';
import { Package, X, Target, LayoutGrid } from 'lucide-react';
import { Task, ThemeOption, Goal } from '../types';

interface TaskLibraryProps {
  library: Task[];
  onUpdateLibraryTask: (task: Task) => void;
  selectedTask: Task | null;
  onSelectTask: (task: Task | null) => void;
  compact?: boolean;
  theme?: ThemeOption;
  goals?: Goal[];
}

const TaskLibrary: React.FC<TaskLibraryProps> = ({ library, onUpdateLibraryTask, selectedTask, onSelectTask, compact = false, theme, goals = [] }) => {
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [filterMode, setFilterMode] = useState<'category' | 'goal'>('category');
  const longPressTimer = useRef<number | null>(null);
  const categories: string[] = Array.from(new Set(library.map(t => t.category)));
  const primaryColor = theme?.color || '#0f172a';

  const handleStartPress = (task: Task) => {
    longPressTimer.current = window.setTimeout(() => {
      setEditingTask({ ...task });
      longPressTimer.current = null;
    }, 600);
  };

  const handleEndPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const saveEdit = () => {
    if (editingTask) {
      onUpdateLibraryTask(editingTask);
      setEditingTask(null);
    }
  };

  const renderTaskList = (tasks: Task[], title: string) => {
    if (tasks.length === 0) return null;
    return (
      <div key={title} className="flex flex-col gap-2">
        <div className="flex items-center justify-between px-2">
           <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{title}</span>
        </div>
        <div className="grid grid-cols-1 gap-1.5">
          {tasks.map((task) => (
            <button
              key={task.id}
              onPointerDown={() => handleStartPress(task)}
              onPointerUp={handleEndPress}
              onPointerLeave={handleEndPress}
              onClick={() => !editingTask && onSelectTask(selectedTask?.id === task.id ? null : task)}
              className={`group flex flex-col px-5 py-3 rounded-full border-none text-left transition-all duration-300 relative ${
                selectedTask?.id === task.id 
                  ? 'text-white shadow-lg' 
                  : 'bg-white text-slate-600 shadow-sm'
              }`}
              style={{ backgroundColor: selectedTask?.id === task.id ? primaryColor : undefined }}
            >
              <div className="flex justify-between items-center w-full">
                <span className="text-[12px] font-medium leading-tight truncate pr-2">{task.title}</span>
                {task.krId && <Target size={11} className="opacity-40" />}
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 w-full">
      <div className="flex bg-slate-200/50 p-1 rounded-full shrink-0">
        <button 
          onClick={() => setFilterMode('category')}
          className={`flex-1 py-1.5 rounded-full transition-all flex items-center justify-center gap-2 ${filterMode === 'category' ? 'bg-white shadow-sm' : 'text-slate-400'}`}
          style={{ color: filterMode === 'category' ? primaryColor : undefined }}
        >
          <LayoutGrid size={12} />
          <span className="text-[10px] font-bold">分类</span>
        </button>
        <button 
          onClick={() => setFilterMode('goal')}
          className={`flex-1 py-1.5 rounded-full transition-all flex items-center justify-center gap-2 ${filterMode === 'goal' ? 'bg-white shadow-sm' : 'text-slate-400'}`}
          style={{ color: filterMode === 'goal' ? primaryColor : undefined }}
        >
          <Target size={12} />
          <span className="text-[10px] font-bold">目标</span>
        </button>
      </div>

      {filterMode === 'category' ? (
        categories.map(cat => renderTaskList(library.filter(t => t.category === cat), cat))
      ) : (
        <>
          {goals.map(goal => {
            const goalTasks = library.filter(t => goal.keyResults.some(kr => kr.id === t.krId));
            return renderTaskList(goalTasks, goal.title);
          })}
          {renderTaskList(library.filter(t => !t.krId), '未分类')}
        </>
      )}

      {editingTask && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center p-4 bg-slate-900/10 backdrop-blur-md">
          <div className="bg-white w-full max-w-sm rounded-[40px] shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-500 p-6">
            <div className="pb-4 flex items-center justify-between">
              <h3 className="text-[16px] font-black text-slate-800">编辑任务</h3>
              <button onClick={() => setEditingTask(null)} className="text-slate-300 p-2"><X size={20}/></button>
            </div>
            <div className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-300 uppercase ml-2">名称</label>
                <input 
                  type="text" 
                  value={editingTask.title} 
                  onChange={e => setEditingTask({...editingTask, title: e.target.value})}
                  className="w-full bg-slate-50 border-none rounded-full px-5 py-3 text-[14px] font-medium outline-none" 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-300 uppercase ml-2">分类</label>
                  <select 
                    value={editingTask.category}
                    onChange={e => setEditingTask({...editingTask, category: e.target.value})}
                    className="w-full bg-slate-50 border-none rounded-full px-5 py-3 text-[12px] font-medium outline-none appearance-none"
                  >
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-300 uppercase ml-2">关联目标</label>
                  <select 
                    value={editingTask.krId || ''}
                    onChange={e => setEditingTask({...editingTask, krId: e.target.value})}
                    className="w-full bg-slate-50 border-none rounded-full px-5 py-3 text-[12px] font-medium outline-none appearance-none"
                  >
                    <option value="">不关联</option>
                    {goals.map(g => (
                      <optgroup key={g.id} label={g.title}>
                        {g.keyResults.map(kr => <option key={kr.id} value={kr.id}>{kr.title}</option>)}
                      </optgroup>
                    ))}
                  </select>
                </div>
              </div>
              <button 
                onClick={saveEdit}
                className="w-full py-4 text-white font-bold text-[15px] rounded-full shadow-lg active:scale-95 transition-all"
                style={{ backgroundColor: primaryColor }}
              >
                完成
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskLibrary;
