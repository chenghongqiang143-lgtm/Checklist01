
import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { ThemeOption, DayInfo, Habit, ScoreDefinition } from '../types';
import { Trophy, MessageSquare, Plus, Trash2, BarChart3, X, Zap, ChevronLeft, ChevronRight, ShoppingBag, Gift, Coins, Settings2 } from 'lucide-react';

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

const INITIAL_REWARDS = [
  { id: 'r1', title: '喝杯奶茶', cost: 10, icon: 'Coffee' },
  { id: 'r2', title: '游戏1小时', cost: 15, icon: 'Gamepad' },
  { id: 'r3', title: '购买心愿单物品', cost: 50, icon: 'ShoppingBag' }
];

const ReviewPage: React.FC<ReviewPageProps> = ({ theme, activeDate, days, habits, scoreDefs, setScoreDefs, onUpdateDay, onOpenSidebar }) => {
  const activeDay = days.find(d => d.date === activeDate);
  const totalTasks = activeDay?.tasks.length || 0;
  const doneTasks = activeDay?.tasks.filter(t => t.completed).length || 0;
  const totalHabits = habits.length;
  const doneHabits = habits.filter(h => h.completedToday).length;

  const [showStats, setShowStats] = useState(false);
  const [showShop, setShowShop] = useState(false);
  const [editingLabelsDefId, setEditingLabelsDefId] = useState<string | null>(null);
  const [weekOffset, setWeekOffset] = useState(0);

  const currentRange = useMemo(() => {
    const startIdx = 0 + (weekOffset * 7);
    const endIdx = 6 + (weekOffset * 7);
    return {
      start: days[startIdx]?.date || days[0].date,
      end: days[endIdx]?.date || days[days.length - 1].date
    };
  }, [weekOffset, days]);

  const totalPoints = useMemo(() => {
    return days.reduce((sum, d) => sum + (d.scores?.reduce((ds, s) => ds + s.value, 0) || 0), 0);
  }, [days]);

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
    const filteredDays = days.slice(Math.max(0, weekOffset * 7), Math.max(0, (weekOffset + 1) * 7));
    
    return createPortal(
      <div className="fixed inset-0 z-[500] bg-white flex flex-col animate-in slide-in-from-right duration-300">
        <header className="px-6 pt-16 pb-4 bg-white shrink-0 border-b border-slate-50">
          <div className="flex justify-between items-center">
             <h2 className="text-xl font-black uppercase tracking-tighter">周复盘统计</h2>
             <button onClick={() => setShowStats(false)} className="p-2 bg-slate-50 rounded-full active:scale-90 transition-transform"><X size={20}/></button>
          </div>
          <div className="flex items-center justify-between mt-4 bg-slate-50 rounded-sm px-3 py-2">
            <button onClick={() => setWeekOffset(prev => prev - 1)} className="text-slate-300 hover:text-slate-800"><ChevronLeft size={20} /></button>
            <div className="text-center">
              <span className="text-[10px] font-black uppercase block">{weekOffset === 0 ? '本周概况' : '过往回顾'}</span>
              <span className="text-[9px] font-bold text-slate-400 mono">{currentRange.start}日 - {currentRange.end}日</span>
            </div>
            <button onClick={() => setWeekOffset(prev => prev + 1)} className="text-slate-300 hover:text-slate-800"><ChevronRight size={20} /></button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-10 pb-20">
           <section className="bg-slate-50 rounded-sm overflow-hidden border border-slate-100 shadow-sm">
             <div className="p-3 border-b border-slate-100 bg-white">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                   <BarChart3 size={10} style={{ color: theme.color }}/> 数据量化趋势
                </h4>
             </div>
             <div className="overflow-x-auto no-scrollbar">
                <table className="w-full text-left border-collapse table-fixed min-w-[320px]">
                   <thead>
                      <tr className="bg-slate-50/50">
                         <th className="p-3 text-[8px] font-black text-slate-300 uppercase sticky left-0 bg-slate-50 z-10 w-20">评估项</th>
                         {filteredDays.map(d => (
                            <th key={d.date} className="p-3 text-[8px] font-black text-slate-400 mono text-center w-10">{d.date}</th>
                         ))}
                      </tr>
                   </thead>
                   <tbody>
                      {scoreDefs.map(def => (
                         <tr key={def.id} className="border-t border-slate-100 bg-white">
                            <td className="p-3 text-[9px] font-black text-slate-600 uppercase sticky left-0 bg-white z-10 border-r border-slate-50 truncate">{def.label}</td>
                            {filteredDays.map(d => {
                               const val = d.scores?.find(s => s.definitionId === def.id)?.value ?? 0;
                               const isZero = val === 0;
                               return (
                                  <td key={d.date} className="p-1.5 text-center">
                                     <div className="w-full aspect-square flex items-center justify-center rounded-sm text-[9px] font-black mono text-white shadow-sm" style={{ 
                                       background: isZero ? '#f1f5f9' : (val > 0 ? theme.color : '#94a3b8'),
                                       opacity: isZero ? 1 : 0.6 + (Math.abs(val) * 0.1)
                                     }}>
                                       {isZero ? '' : val}
                                     </div>
                                  </td>
                               );
                            })}
                         </tr>
                      ))}
                   </tbody>
                </table>
             </div>
           </section>

           <section className="space-y-4">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 pl-1">
                <MessageSquare size={10} style={{ color: theme.color }}/> 每日随感记录
              </h4>
              <div className="space-y-3">
                {filteredDays.map(d => (
                  <div key={d.date} className="p-4 bg-slate-50 rounded-sm border border-slate-100">
                    <div className="flex justify-between items-center mb-2">
                       <span className="text-[10px] font-black text-slate-800 uppercase">{d.weekday} {d.date} JAN</span>
                    </div>
                    <p className="text-[11px] font-bold text-slate-500 leading-relaxed whitespace-pre-wrap">
                      {d.reflection || '当日无详细记录'}
                    </p>
                  </div>
                ))}
              </div>
           </section>
        </main>
      </div>,
      document.body
    );
  };

  const renderPointsShop = () => {
    return createPortal(
      <div className="fixed inset-0 z-[500] bg-white animate-in slide-in-from-right duration-300 overflow-y-auto p-6">
         <div className="flex justify-between items-center mb-8 pt-10">
            <h2 className="text-xl font-black uppercase tracking-tighter">积分激励商店</h2>
            <button onClick={() => setShowShop(false)} className="p-2 bg-slate-50 rounded-full active:scale-90 transition-transform"><X size={20}/></button>
         </div>
         <div className="mb-6 p-4 bg-amber-50 rounded-sm border border-amber-100 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2">
               <Coins size={16} className="text-amber-500" />
               <span className="text-sm font-black text-amber-700 uppercase">可用灵感积分: {totalPoints}</span>
            </div>
         </div>
         <div className="space-y-4">
            {INITIAL_REWARDS.map(reward => (
               <div key={reward.id} className="p-4 bg-slate-50 rounded-sm border border-slate-100 flex items-center justify-between active:scale-[0.98] transition-all">
                  <div className="flex items-center gap-4">
                     <Gift size={24} style={{ color: theme.color }} />
                     <div>
                        <div className="text-sm font-black text-slate-800">{reward.title}</div>
                        <div className="text-[10px] font-bold text-amber-600 uppercase">兑换需 {reward.cost} 积分</div>
                     </div>
                  </div>
                  <button disabled={totalPoints < reward.cost} className="px-4 py-2 rounded-sm text-[10px] font-black uppercase tracking-widest disabled:opacity-30 text-white shadow-md" style={{ background: theme.color }}>兑换</button>
               </div>
            ))}
         </div>
      </div>,
      document.body
    );
  };

  const renderLabelEditor = () => {
    if (!editingLabelsDefId) return null;
    const def = scoreDefs.find(d => d.id === editingLabelsDefId);
    if (!def) return null;
    return createPortal(
      <div className="fixed inset-0 z-[600] bg-slate-900/80 flex items-end justify-center p-4" onClick={() => setEditingLabelsDefId(null)}>
        <div className="bg-white w-full max-w-md rounded-t-sm p-6 shadow-2xl animate-in slide-in-from-bottom duration-300" onClick={e => e.stopPropagation()}>
           <div className="flex justify-between items-center mb-6">
             <span className="text-base font-black text-slate-800 uppercase tracking-tight">自定义维度: {def.label}</span>
             <button onClick={() => setEditingLabelsDefId(null)}><X size={20} className="text-slate-300" /></button>
           </div>
           <div className="space-y-3">
             {[-2, -1, 0, 1, 2].map(val => (
               <div key={val} className="flex items-center gap-4">
                 <div className="w-8 h-8 rounded-sm bg-slate-50 flex items-center justify-center text-[10px] font-black mono text-slate-400">{val > 0 ? '+' : ''}{val}</div>
                 <input className="flex-1 bg-slate-50 p-3 rounded-sm text-xs font-bold text-slate-700 outline-none border border-slate-100 focus:border-slate-300 transition-colors" value={def.labels[val]} onChange={e => setScoreDefs(scoreDefs.map(d => d.id === def.id ? { ...d, labels: { ...d.labels, [val]: e.target.value } } : d))} />
               </div>
             ))}
           </div>
           <button onClick={() => setEditingLabelsDefId(null)} className="w-full py-4 mt-6 text-white font-black uppercase tracking-widest rounded-sm shadow-xl" style={{ background: theme.color }}>完成保存</button>
        </div>
      </div>,
      document.body
    );
  };

  return (
    <div className="h-full flex flex-col bg-white overflow-hidden">
      <header className="px-6 pt-16 pb-4 shrink-0 bg-white shadow-sm z-10">
        <div className="flex items-center justify-between">
           <div className="flex items-center gap-3">
             <button onClick={onOpenSidebar} className="p-1 -ml-1 text-slate-400 active:scale-90 transition-transform"><X size={20}/></button>
             <h1 className="text-lg font-black tracking-tighter uppercase truncate">周报复盘 / REVIEW</h1>
           </div>
           <div className="flex items-center gap-1">
              <button onClick={() => setShowShop(true)} className="p-2 text-slate-400 hover:text-amber-500 transition-colors"><ShoppingBag size={20}/></button>
              <button onClick={() => setShowStats(true)} className="p-2 text-slate-400 hover:text-slate-800 transition-colors"><BarChart3 size={20}/></button>
           </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto no-scrollbar px-6 pb-24 space-y-8 pt-4">
        <section className="p-6 rounded-sm space-y-6 text-white shadow-xl relative overflow-hidden" style={{ background: theme.color }}>
          <div className="flex items-center justify-between relative z-10">
            <h3 className="text-[10px] font-black text-white/60 uppercase tracking-widest">今日累计增分 ({totalDayScore > 0 ? '+' : ''}{totalDayScore})</h3>
            <span className="text-[10px] font-black mono text-white/60">{activeDate} JAN</span>
          </div>
          <div className="grid grid-cols-2 gap-4 relative z-10">
            <div className="bg-white/10 p-4 rounded-sm border border-white/10 flex flex-col items-center">
              <span className="text-2xl font-black mono text-white">{doneTasks}/{totalTasks}</span>
              <span className="text-[8px] font-black text-white/60 uppercase mt-1">事项达成</span>
            </div>
            <div className="bg-white/10 p-4 rounded-sm border border-white/10 flex flex-col items-center">
              <span className="text-2xl font-black mono text-white">{doneHabits}/{totalHabits}</span>
              <span className="text-[8px] font-black text-white/60 uppercase mt-1">习惯坚持</span>
            </div>
          </div>
        </section>

        <section className="space-y-6">
           <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-2"><Zap size={12}/> 心态量化评分</h3>
              <button onClick={() => setScoreDefs([...scoreDefs, { id: 's'+Date.now(), label: '新维度', labels: {[-2]:'极差',[-1]:'较差',[0]:'一般',[1]:'良好',[2]:'极佳'} }])} className="p-1 text-slate-300 hover:text-slate-600"><Plus size={16}/></button>
           </div>
           <div className="space-y-8">
              {scoreDefs.map(def => (
                <div key={def.id} className="space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2 truncate pr-2">
                       <input className="text-[11px] font-black text-slate-500 uppercase bg-transparent outline-none w-24 truncate" value={def.label} onChange={e => setScoreDefs(scoreDefs.map(d => d.id === def.id ? { ...d, label: e.target.value } : d))} />
                       <button onClick={() => setEditingLabelsDefId(def.id)} className="p-1 text-slate-200"><Settings2 size={12} /></button>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[9px] font-bold text-slate-300 px-2 py-0.5 bg-slate-50 rounded-full">{def.labels[getScoreValue(def.id)]}</span>
                      <button onClick={() => setScoreDefs(scoreDefs.filter(d => d.id !== def.id))} className="text-rose-200 hover:text-rose-400 transition-colors"><Trash2 size={12}/></button>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {[-2, -1, 0, 1, 2].map(v => (
                      <button key={v} onClick={() => handleScoreChange(def.id, v)} className={`flex-1 h-10 rounded-sm font-black mono text-xs transition-all ${getScoreValue(def.id) === v ? 'text-white shadow-md' : 'bg-slate-50 text-slate-300 shadow-sm'}`} style={{ background: getScoreValue(def.id) === v ? theme.color : undefined }}>{v > 0 ? '+' : ''}{v}</button>
                    ))}
                  </div>
                </div>
              ))}
           </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-2"><MessageSquare size={12}/> 复盘心得记录</h3>
          <div className="flex gap-2 mb-2 overflow-x-auto no-scrollbar pb-1">
             {TEMPLATES.map(t => (
               <button key={t.name} onClick={() => onUpdateDay(activeDate, { reflection: t.text })} className="whitespace-nowrap px-3 py-1.5 bg-slate-50 rounded-sm text-[9px] font-black uppercase text-slate-400 border border-slate-100 shadow-sm">{t.name}</button>
             ))}
          </div>
          <textarea className="w-full min-h-[200px] bg-slate-50 border border-slate-100 rounded-sm p-5 text-sm font-bold text-slate-700 outline-none placeholder:text-slate-200 shadow-inner" placeholder="输入复盘内容..." value={activeDay?.reflection || ''} onChange={e => onUpdateDay(activeDate, { reflection: e.target.value })} />
        </section>
      </main>
      {showStats && renderStats()}
      {showShop && renderPointsShop()}
      {renderLabelEditor()}
    </div>
  );
};

export default ReviewPage;
