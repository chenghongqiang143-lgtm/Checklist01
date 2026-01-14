
import React, { useState } from 'react';
import { ThemeOption, DayInfo, Habit, ScoreDefinition, DayScore } from '../types';
import { Trophy, Star, MessageSquare, Save, CheckCircle2, Menu, LayoutGrid, ChevronRight, Plus, Trash2, BarChart3, X, Zap } from 'lucide-react';

interface ReviewPageProps {
  theme: ThemeOption;
  activeDate: number;
  days: DayInfo[];
  habits: Habit[];
  scoreDefs: ScoreDefinition[];
  setScoreDefs: React.Dispatch<React.SetStateAction<ScoreDefinition[]>>;
  onUpdateDay: (date: number, updates: Partial<DayInfo>) => void;
  onOpenSidebar: () => void;
}

const TEMPLATES = [
  { name: '每日复盘', text: "1. 今日最开心的事：\n2. 遇到的困难及应对：\n3. 明日的改进点：" },
  { name: '五感笔记', text: "看：\n听：\n闻：\n味：\n触：" },
  { name: '成功日记', text: "1. 克服了...\n2. 完成了...\n3. 帮助了..." }
];

const ReviewPage: React.FC<ReviewPageProps> = ({ theme, activeDate, days, habits, scoreDefs, setScoreDefs, onUpdateDay, onOpenSidebar }) => {
  const activeDay = days.find(d => d.date === activeDate);
  const totalTasks = activeDay?.tasks.length || 0;
  const doneTasks = activeDay?.tasks.filter(t => t.completed).length || 0;
  const totalHabits = habits.length;
  const doneHabits = habits.filter(h => h.completedToday).length;

  const [showStats, setShowStats] = useState(false);

  const getScoreValue = (defId: string) => activeDay?.scores?.find(s => s.definitionId === defId)?.value ?? 0;
  const totalDayScore = activeDay?.scores?.reduce((acc, s) => acc + s.value, 0) ?? 0;

  const handleScoreChange = (defId: string, val: number) => {
    const currentScores = activeDay?.scores || [];
    const exists = currentScores.find(s => s.definitionId === defId);
    let newScores = exists 
      ? currentScores.map(s => s.definitionId === defId ? { ...s, value: val } : s)
      : [...currentScores, { definitionId: defId, value: val }];
    onUpdateDay(activeDate, { scores: newScores });
  };

  const renderStats = () => {
    const historyDays = days.slice(-14); // 扩展到 14 天展示
    return (
      <div className="fixed inset-0 z-[200] bg-white p-6 overflow-y-auto no-scrollbar animate-in slide-in-from-right">
        <div className="flex justify-between items-center mb-8 pt-10">
           <h2 className="text-xl font-black uppercase tracking-tighter">趋势统计 / TRENDS</h2>
           <button onClick={() => setShowStats(false)} className="p-2 bg-slate-50 rounded-full"><X size={20}/></button>
        </div>
        <div className="space-y-12">
           {scoreDefs.map(def => (
             <section key={def.id}>
               <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Zap size={10} style={{ color: theme.color }}/> {def.label} 热力图</h4>
               <div className="flex flex-wrap gap-1.5 px-1">
                 {historyDays.map(d => {
                   const val = d.scores?.find(s => s.definitionId === def.id)?.value ?? 0;
                   // 计算透明度 0.1 ~ 1.0
                   const opacity = val === 0 ? 0.05 : (val + 3) / 5;
                   return (
                     <div key={d.date} className="w-8 h-8 rounded-[4px] transition-all flex items-center justify-center relative group" style={{ backgroundColor: val !== 0 ? theme.color : '#f1f5f9', opacity }}>
                        <span className="text-[7px] font-black text-white pointer-events-none">{d.date}</span>
                        {/* Tooltip */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-slate-800 text-white text-[6px] px-1.5 py-0.5 rounded whitespace-nowrap z-50">{val > 0 ? '+' : ''}{val}</div>
                     </div>
                   );
                 })}
               </div>
             </section>
           ))}
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-white overflow-hidden">
      <header className="px-6 pt-16 pb-4 shrink-0 bg-white">
        <div className="flex items-center justify-between mb-4">
           <div className="flex items-center gap-3">
             <button onClick={onOpenSidebar} className="p-1 -ml-1 text-slate-400"><Menu size={20}/></button>
             <h1 className="text-lg font-black tracking-tighter uppercase">复盘 / REVIEW</h1>
           </div>
           <button onClick={() => setShowStats(true)} className="p-2 text-slate-400 hover:text-slate-800"><BarChart3 size={18}/></button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto no-scrollbar px-6 pb-24 space-y-8 pt-2">
        <section className="bg-slate-50 p-6 rounded-sm space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">今日成就 ({totalDayScore > 0 ? '+' : ''}{totalDayScore})</h3>
            <span className="text-[10px] font-black mono text-slate-300">{activeDate} JAN</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-sm shadow-sm flex flex-col items-center">
              <span className="text-2xl font-black mono text-slate-800">{doneTasks}/{totalTasks}</span>
              <span className="text-[8px] font-black text-slate-300 uppercase mt-1">任务达成</span>
            </div>
            <div className="bg-white p-4 rounded-sm shadow-sm flex flex-col items-center">
              <span className="text-2xl font-black mono text-slate-800">{doneHabits}/{totalHabits}</span>
              <span className="text-[8px] font-black text-slate-300 uppercase mt-1">习惯坚持</span>
            </div>
          </div>
        </section>

        <section className="space-y-6">
           <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-2"><Zap size={12}/> 量化评分</h3>
              <button onClick={() => setScoreDefs([...scoreDefs, { id: 's'+Date.now(), label: '新维度', labels: {[-2]:'极差',[-1]:'较差',[0]:'一般',[1]:'良好',[2]:'极佳'} }])} className="p-1 text-slate-300 hover:text-slate-600"><Plus size={16}/></button>
           </div>
           <div className="space-y-8">
              {scoreDefs.map(def => (
                <div key={def.id} className="space-y-3">
                  <div className="flex justify-between items-center group">
                    <input className="text-[11px] font-black text-slate-500 uppercase bg-transparent border-none outline-none w-24" value={def.label} onChange={e => setScoreDefs(scoreDefs.map(d => d.id === def.id ? { ...d, label: e.target.value } : d))} />
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-bold text-slate-300 px-2 py-0.5 bg-slate-50 rounded-full">{def.labels[getScoreValue(def.id)]}</span>
                      <button onClick={() => setScoreDefs(scoreDefs.filter(d => d.id !== def.id))} className="opacity-0 group-hover:opacity-100 p-1 text-rose-300"><Trash2 size={12}/></button>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {[-2, -1, 0, 1, 2].map(v => (
                      <button key={v} onClick={() => handleScoreChange(def.id, v)} className={`flex-1 h-10 rounded-sm font-black mono text-xs transition-all ${getScoreValue(def.id) === v ? 'text-white shadow-lg' : 'bg-slate-50 text-slate-300 hover:bg-slate-100'}`} style={{ backgroundColor: getScoreValue(def.id) === v ? theme.color : undefined }}>
                        {v > 0 ? '+' : ''}{v}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
           </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-2"><MessageSquare size={12}/> 心得复盘</h3>
          <div className="flex gap-2 mb-2 overflow-x-auto no-scrollbar pb-1">
             {TEMPLATES.map(t => (
               <button key={t.name} onClick={() => onUpdateDay(activeDate, { reflection: t.text })} className="whitespace-nowrap px-3 py-1.5 bg-slate-50 rounded-sm text-[9px] font-black uppercase text-slate-400 border border-slate-100">{t.name}</button>
             ))}
          </div>
          <textarea className="w-full min-h-[200px] bg-slate-50 border-0 rounded-sm p-5 text-sm font-bold text-slate-700 outline-none placeholder:text-slate-200" placeholder="点击模板或在此开始记录..." value={activeDay?.reflection || ''} onChange={e => onUpdateDay(activeDate, { reflection: e.target.value })} />
        </section>
      </main>
      {showStats && renderStats()}
    </div>
  );
};

export default ReviewPage;
