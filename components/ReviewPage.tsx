
import React, { useState, useMemo } from 'react';
import { ThemeOption, DayInfo, Habit, ScoreDefinition, DayScore } from '../types';
import { Trophy, Star, MessageSquare, Save, CheckCircle2, Menu, LayoutGrid, ChevronRight, Plus, Trash2, BarChart3, X, Zap, ChevronLeft, Calendar, Settings2, ShoppingBag, Gift, Coins } from 'lucide-react';

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

  // Default range is current week based on the first day in 'days' constant which represents a fixed week in this demo
  const [weekOffset, setWeekOffset] = useState(0); // 0 = This week, -1 = Last week, -2 = Two weeks ago

  const currentRange = useMemo(() => {
    // Demo logic: assume days[0] is the start of "this week" for simplification
    // In a real app, this would use actual Date objects
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
    // For demo, we just filter the 'days' array based on calculated indices
    const filteredDays = days.slice(Math.max(0, weekOffset * 7), Math.max(0, (weekOffset + 1) * 7));
    
    return (
      <div className="fixed inset-0 z-[200] bg-white p-6 overflow-y-auto no-scrollbar animate-in slide-in-from-right duration-300">
        <div className="flex justify-between items-center mb-6 pt-10">
           <h2 className="text-xl font-black uppercase tracking-tighter">复盘统计 / REVIEW STATS</h2>
           <button onClick={() => setShowStats(false)} className="p-2 bg-slate-50 rounded-full"><X size={20}/></button>
        </div>

        <div className="flex items-center justify-between bg-slate-50 rounded-sm px-3 py-3 mb-8">
          <button 
            disabled={weekOffset <= 0} 
            onClick={() => setWeekOffset(prev => prev - 1)} 
            className={`transition-colors ${weekOffset <= 0 ? 'text-slate-100' : 'text-slate-300 hover:text-slate-600'}`}
          >
            <ChevronLeft size={18} />
          </button>
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-800">
              {weekOffset === 0 ? '本周' : weekOffset === -1 ? '上周' : weekOffset === -2 ? '上上周' : `${Math.abs(weekOffset)}周前`}
            </span>
            <span className="text-[8px] font-bold text-slate-400 uppercase">
               {currentRange.start}日 - {currentRange.end}日
            </span>
          </div>
          <button 
            disabled={true} 
            className="text-slate-100"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="space-y-10 pb-12">
           <section className="bg-slate-50 rounded-sm overflow-hidden border border-slate-100 shadow-sm">
             <div className="p-3 border-b border-slate-100 flex justify-between items-center bg-white">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                   <BarChart3 size={10} style={{ color: theme.color }}/> 量化趋势
                </h4>
             </div>
             <div className="overflow-x-auto no-scrollbar">
                <table className="w-full text-left border-collapse">
                   <thead>
                      <tr className="bg-slate-50/50">
                         <th className="p-3 text-[8px] font-black text-slate-300 uppercase sticky left-0 bg-slate-50 z-10 w-20">维度 / 日期</th>
                         {filteredDays.map(d => (
                            <th key={d.date} className="p-3 text-[8px] font-black text-slate-400 mono text-center min-w-[40px]">{d.date}</th>
                         ))}
                      </tr>
                   </thead>
                   <tbody>
                      {scoreDefs.map(def => (
                         <tr key={def.id} className="border-t border-slate-100 bg-white">
                            <td className="p-3 text-[10px] font-black text-slate-600 uppercase sticky left-0 bg-white z-10 border-r border-slate-50">{def.label}</td>
                            {filteredDays.map(d => {
                               const val = d.scores?.find(s => s.definitionId === def.id)?.value ?? 0;
                               const isPositive = val > 0;
                               const isZero = val === 0;
                               return (
                                  <td key={d.date} className="p-2 text-center">
                                     <div 
                                        className="inline-flex items-center justify-center w-7 h-7 rounded-sm transition-all shadow-sm" 
                                        style={{ 
                                           background: isZero ? '#f8fafc' : (isPositive ? `linear-gradient(135deg, ${theme.color}, ${theme.color}80)` : `linear-gradient(135deg, #64748b, #64748b80)`),
                                           opacity: isZero ? 1 : (0.5 + (Math.abs(val) * 0.25))
                                        }}
                                     >
                                        <span className={`text-[9px] font-black mono ${isZero ? 'text-slate-200' : 'text-white'}`}>
                                           {isZero ? '-' : (isPositive ? '+' : '') + val}
                                        </span>
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
                <MessageSquare size={10} style={{ color: theme.color }}/> 期间复盘总结
              </h4>
              <div className="space-y-3">
                {filteredDays.map(d => (
                  <div key={d.date} className="p-4 bg-slate-50 rounded-sm border border-slate-100 shadow-sm">
                    <div className="flex justify-between items-center mb-2">
                       <span className="text-[10px] font-black text-slate-800 uppercase">{d.weekday} {d.date} JAN</span>
                       <div className="flex gap-1">
                         {d.scores?.map(s => (
                            <div key={s.definitionId} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.value > 0 ? theme.color : s.value < 0 ? '#64748b' : '#e2e8f0' }} />
                         ))}
                       </div>
                    </div>
                    <p className="text-[11px] font-bold text-slate-500 leading-relaxed whitespace-pre-wrap">
                      {d.reflection || '当日未记录复盘感想。'}
                    </p>
                  </div>
                ))}
              </div>
           </section>
        </div>
      </div>
    );
  };

  const renderPointsShop = () => {
     return (
        <div className="fixed inset-0 z-[200] bg-white p-6 overflow-y-auto no-scrollbar animate-in slide-in-from-right duration-300">
           <div className="flex justify-between items-center mb-8 pt-10">
              <div className="flex flex-col">
                 <h2 className="text-xl font-black uppercase tracking-tighter">积分商店 / POINTS SHOP</h2>
                 <div className="flex items-center gap-2 mt-1">
                    <div className="px-2 py-0.5 bg-amber-50 rounded-full flex items-center gap-1 shadow-sm">
                       <Coins size={10} className="text-amber-500" />
                       <span className="text-[10px] font-black text-amber-600 uppercase">当前灵感积分: {totalPoints}</span>
                    </div>
                 </div>
              </div>
              <button onClick={() => setShowShop(false)} className="p-2 bg-slate-50 rounded-full active:scale-90 transition-transform"><X size={20}/></button>
           </div>

           <div className="space-y-6">
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest pl-1">累计得分即为积分，努力生活换取奖励</p>
              <div className="grid grid-cols-1 gap-4">
                 {INITIAL_REWARDS.map(reward => (
                    <div key={reward.id} className="p-5 bg-slate-50 rounded-sm border border-slate-100 flex items-center justify-between group active:scale-[0.98] transition-all shadow-sm">
                       <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-sm bg-white flex items-center justify-center shadow-sm">
                             <Gift size={24} style={{ color: theme.color }} />
                          </div>
                          <div className="flex flex-col">
                             <span className="text-sm font-black text-slate-800">{reward.title}</span>
                             <span className="text-[9px] font-black text-amber-500 uppercase flex items-center gap-1">消耗 {reward.cost} 积分</span>
                          </div>
                       </div>
                       <button 
                          disabled={totalPoints < reward.cost}
                          className={`px-4 py-2 rounded-sm text-[10px] font-black uppercase tracking-widest transition-all shadow-md ${totalPoints >= reward.cost ? 'text-white' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                          style={{ background: totalPoints >= reward.cost ? `linear-gradient(135deg, ${theme.color}, ${theme.color}90)` : undefined }}
                       >
                          兑换奖励
                       </button>
                    </div>
                 ))}
                 <button className="py-6 border border-dashed border-slate-200 rounded-sm flex flex-col items-center gap-2 group active:opacity-60">
                    <Plus size={20} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">自定义奖励内容</span>
                 </button>
              </div>
           </div>
        </div>
     );
  };

  const renderLabelEditor = () => {
    if (!editingLabelsDefId) return null;
    const def = scoreDefs.find(d => d.id === editingLabelsDefId);
    if (!def) return null;

    return (
      <div className="fixed inset-0 z-[250] bg-slate-900/40 backdrop-blur-md flex items-end justify-center p-4" onClick={() => setEditingLabelsDefId(null)}>
        <div className="bg-white w-full max-w-md rounded-t-sm p-6 shadow-2xl animate-in slide-in-from-bottom duration-300" onClick={e => e.stopPropagation()}>
           <div className="flex justify-between items-center mb-6">
             <div className="flex flex-col">
                <span className="text-[10px] font-black text-slate-300 uppercase">编辑刻度说明</span>
                <span className="text-base font-black text-slate-800 uppercase tracking-tight">{def.label}</span>
             </div>
             <button onClick={() => setEditingLabelsDefId(null)}><X size={20} className="text-slate-300" /></button>
           </div>
           <div className="space-y-3">
             {[-2, -1, 0, 1, 2].map(val => (
               <div key={val} className="flex items-center gap-4">
                 <div className="w-8 h-8 rounded-sm bg-slate-50 flex items-center justify-center text-[10px] font-black mono text-slate-400">
                   {val > 0 ? '+' : ''}{val}
                 </div>
                 <input 
                   className="flex-1 bg-slate-50 p-3 rounded-sm text-xs font-bold text-slate-700 outline-none border-b-2 border-transparent focus:border-slate-200"
                   value={def.labels[val]}
                   onChange={e => {
                     const newDefs = scoreDefs.map(d => d.id === def.id ? { ...d, labels: { ...d.labels, [val]: e.target.value } } : d);
                     setScoreDefs(newDefs);
                   }}
                 />
               </div>
             ))}
           </div>
           <button 
             onClick={() => setEditingLabelsDefId(null)}
             className="w-full py-4 mt-6 text-white font-black uppercase tracking-widest rounded-sm shadow-lg active:scale-95 transition-all" 
             style={{ background: `linear-gradient(135deg, ${theme.color}, ${theme.color}80)` }}
           >
             确定
           </button>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-white overflow-hidden animate-in slide-in-from-right duration-300">
      <header className="px-6 pt-16 pb-4 shrink-0 bg-white">
        <div className="flex items-center justify-between mb-4">
           <div className="flex items-center gap-3">
             <button onClick={onOpenSidebar} className="p-1 -ml-1 text-slate-400 active:scale-90 transition-transform"><Menu size={20}/></button>
             <h1 className="text-lg font-black tracking-tighter uppercase">复盘 / REVIEW</h1>
           </div>
           <div className="flex items-center gap-1">
              <button onClick={() => setShowShop(true)} className="p-2 text-slate-400 hover:text-amber-500 transition-colors flex items-center gap-1.5">
                <ShoppingBag size={18}/>
              </button>
              <button onClick={() => setShowStats(true)} className="p-2 text-slate-400 hover:text-slate-800 transition-colors flex items-center gap-1.5">
                <BarChart3 size={18}/>
              </button>
           </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto no-scrollbar px-6 pb-24 space-y-8 pt-2">
        <section className="p-6 rounded-sm space-y-6 text-white shadow-xl relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${theme.color}, ${theme.color}80)` }}>
          <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none"><Trophy size={100}/></div>
          <div className="flex items-center justify-between relative z-10">
            <h3 className="text-[10px] font-black text-white/60 uppercase tracking-widest">今日总分 ({totalDayScore > 0 ? '+' : ''}{totalDayScore})</h3>
            <span className="text-[10px] font-black mono text-white/60">{activeDate} JAN</span>
          </div>
          <div className="grid grid-cols-2 gap-4 relative z-10">
            <div className="bg-white/10 p-4 rounded-sm backdrop-blur-sm border border-white/10 flex flex-col items-center shadow-sm">
              <span className="text-2xl font-black mono text-white">{doneTasks}/{totalTasks}</span>
              <span className="text-[8px] font-black text-white/60 uppercase mt-1">任务达成</span>
            </div>
            <div className="bg-white/10 p-4 rounded-sm backdrop-blur-sm border border-white/10 flex flex-col items-center shadow-sm">
              <span className="text-2xl font-black mono text-white">{doneHabits}/{totalHabits}</span>
              <span className="text-[8px] font-black text-white/60 uppercase mt-1">习惯坚持</span>
            </div>
          </div>
          <div className="flex justify-center pt-2 relative z-10">
             <div className="flex items-center gap-2 px-6 py-2 bg-white text-slate-800 rounded-full shadow-lg">
                <Trophy size={14} style={{ color: theme.color }} />
                <span className="text-[11px] font-black uppercase tracking-tighter">累计灵感积分: {totalPoints}</span>
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
                    <div className="flex items-center gap-2">
                       <input className="text-[11px] font-black text-slate-500 uppercase bg-transparent border-none outline-none w-24" value={def.label} onChange={e => setScoreDefs(scoreDefs.map(d => d.id === def.id ? { ...d, label: e.target.value } : d))} />
                       <button onClick={() => setEditingLabelsDefId(def.id)} className="p-1 text-slate-200 hover:text-slate-400 transition-colors"><Settings2 size={12} /></button>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-bold text-slate-300 px-2 py-0.5 bg-slate-50 rounded-full shadow-sm">{def.labels[getScoreValue(def.id)]}</span>
                      <button onClick={() => setScoreDefs(scoreDefs.filter(d => d.id !== def.id))} className="opacity-0 group-hover:opacity-100 p-1 text-rose-300 transition-opacity"><Trash2 size={12}/></button>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {[-2, -1, 0, 1, 2].map(v => (
                      <button key={v} onClick={() => handleScoreChange(def.id, v)} className={`flex-1 h-10 rounded-sm font-black mono text-xs transition-all ${getScoreValue(def.id) === v ? 'text-white shadow-md' : 'bg-slate-50 text-slate-300 hover:bg-slate-100 shadow-sm'}`} style={{ background: getScoreValue(def.id) === v ? `linear-gradient(135deg, ${theme.color}, ${theme.color}80)` : undefined }}>
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
               <button key={t.name} onClick={() => onUpdateDay(activeDate, { reflection: t.text })} className="whitespace-nowrap px-3 py-1.5 bg-slate-50 rounded-sm text-[9px] font-black uppercase text-slate-400 border border-slate-100 transition-colors shadow-sm">{t.name}</button>
             ))}
          </div>
          <textarea className="w-full min-h-[200px] bg-slate-50 border border-slate-100 rounded-sm p-5 text-sm font-bold text-slate-700 outline-none placeholder:text-slate-200 shadow-inner" placeholder="点击模板或在此开始记录..." value={activeDay?.reflection || ''} onChange={e => onUpdateDay(activeDate, { reflection: e.target.value })} />
        </section>
      </main>
      {showStats && renderStats()}
      {showShop && renderPointsShop()}
      {renderLabelEditor()}
    </div>
  );
};

export default ReviewPage;
