
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { ThemeOption, DayInfo, Habit, ScoreDefinition, Reward } from '../types';
import { MessageSquare, X, Zap, Settings, Layout, Edit, Trash2, ShoppingBag, Coins, CheckCircle2, Trophy, BarChart3, ChevronLeft, ChevronRight, History, Calendar, Plus, Save } from 'lucide-react';

interface ReviewPageProps {
  theme: ThemeOption;
  activeDate: number;
  days: DayInfo[];
  habits: Habit[];
  rewards: Reward[];
  setRewards: React.Dispatch<React.SetStateAction<Reward[]>>;
  reflectionTemplates: { id: string, name: string, text: string }[];
  setReflectionTemplates: React.Dispatch<React.SetStateAction<{ id: string, name: string, text: string }[]>>;
  scoreDefs: ScoreDefinition[];
  setScoreDefs: React.Dispatch<React.SetStateAction<ScoreDefinition[]>>;
  onUpdateDay: (date: number, updates: Partial<DayInfo>) => void;
  onOpenSidebar: () => void;
}

const ReviewPage: React.FC<ReviewPageProps> = ({ 
  theme, activeDate, days, habits, rewards, setRewards, reflectionTemplates, setReflectionTemplates, scoreDefs, setScoreDefs, onUpdateDay, onOpenSidebar 
}) => {
  const activeDay = days.find(d => d.date === activeDate);
  const [showManageScores, setShowManageScores] = useState(false);
  const [editingScoreDef, setEditingScoreDef] = useState<ScoreDefinition | null>(null);
  const [showShop, setShowShop] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [statsWeekOffset, setStatsWeekOffset] = useState(0); 
  const [isManagingShop, setIsManagingShop] = useState(false);
  const [editingReward, setEditingReward] = useState<Reward | null>(null);
  
  const [isManagingTemplates, setIsManagingTemplates] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<{ id: string, name: string, text: string } | null>(null);

  const themeGradient = `linear-gradient(135deg, ${theme.color}, ${theme.color}99)`;

  const totalPoints = days.reduce((sum, d) => sum + (d.scores?.reduce((ds, s) => ds + s.value, 0) || 0), 0);
  const tasksDone = activeDay?.tasks.filter(t => t.completed).length || 0;
  const tasksTotal = activeDay?.tasks.length || 0;
  const habitsDone = habits.filter(h => h.completedToday).length || 0;
  const habitsTotal = habits.length || 0;

  const getDayScoreSum = (day: DayInfo) => day.scores?.reduce((sum, s) => sum + s.value, 0) || 0;
  const getScoreValue = (day: DayInfo | undefined, defId: string) => day?.scores?.find(s => s.definitionId === defId)?.value ?? 0;

  const handleScoreChange = (defId: string, val: number) => {
    const currentScores = activeDay?.scores || [];
    const exists = currentScores.find(s => s.definitionId === defId);
    let newScores = exists 
      ? currentScores.map(s => s.definitionId === defId ? { ...s, value: val } : s)
      : [...currentScores, { definitionId: defId, value: val }];
    onUpdateDay(activeDate, { scores: newScores });
  };

  const getWeekDays = (offset: number) => {
    if (offset === 0) return days.slice(0, 7);
    return days.slice(0, 7).map(d => ({
      ...d,
      date: d.date - 7,
      reflection: "上周的复盘内容回顾...",
      scores: scoreDefs.map(sd => ({ definitionId: sd.id, value: Math.floor(Math.random() * 5) - 2 }))
    }));
  };

  const weekData = getWeekDays(statsWeekOffset);

  const renderStatsOverlay = () => (
    createPortal(
      <div className="fixed inset-0 z-[850] bg-white animate-in slide-in-from-bottom duration-300 flex flex-col">
        <header className="px-6 pt-16 pb-4 border-b flex justify-between items-center bg-white shrink-0">
          <div className="flex items-center gap-2">
            <BarChart3 size={18} style={{ color: theme.color }} />
            <h2 className="text-lg font-black uppercase tracking-tighter">复盘统计看板</h2>
          </div>
          <button onClick={() => setShowStats(false)} className="p-2 bg-slate-50 rounded-full"><X size={20}/></button>
        </header>

        <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-8">
          <div className="flex items-center justify-between bg-slate-50 p-1.5 rounded-sm">
            <button onClick={() => setStatsWeekOffset(1)} className={`flex-1 flex items-center justify-center gap-2 py-2 text-[10px] font-black uppercase rounded-sm transition-all ${statsWeekOffset === 1 ? 'bg-white shadow-sm text-slate-800' : 'text-slate-300'}`}>
              <ChevronLeft size={14} /> 上周数据
            </button>
            <button onClick={() => setStatsWeekOffset(0)} className={`flex-1 flex items-center justify-center gap-2 py-2 text-[10px] font-black uppercase rounded-sm transition-all ${statsWeekOffset === 0 ? 'bg-white shadow-sm text-slate-800' : 'text-slate-300'}`}>
              本周数据 <ChevronRight size={14} />
            </button>
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-2 px-1">
               <Calendar size={12} className="text-slate-300" />
               <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">多维度心流热力</h3>
            </div>
            {scoreDefs.map(def => (
              <div key={def.id} className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <span className="text-[9px] font-black text-slate-500 uppercase">{def.label}</span>
                  <div className="flex gap-1">
                    {['M','T','W','T','F','S','S'].map((w, i) => <span key={i} className="w-6 text-center text-[7px] font-black text-slate-300">{w}</span>)}
                  </div>
                </div>
                <div className="flex gap-1">
                  {weekData.map((d, i) => {
                    const val = getScoreValue(d, def.id);
                    let opacity = 0.05;
                    if (val > 0) opacity = 0.2 + (val / 2) * 0.8;
                    if (val < 0) opacity = 0.1;
                    return (
                      <div key={i} className="flex-1 h-8 rounded-[2px] shadow-inner relative group" 
                           style={{ backgroundColor: val >= 0 ? theme.color : '#cbd5e1', opacity: opacity }}>
                         <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-[8px] font-bold text-white mono">{val > 0 ? '+' : ''}{val}</span>
                         </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-4 pb-12">
            <div className="flex items-center gap-2 px-1">
               <History size={12} className="text-slate-300" />
               <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">周期笔记汇总</h3>
            </div>
            <div className="space-y-3">
               {weekData.filter(d => d.reflection).map(d => (
                 <div key={d.date} className="p-4 bg-slate-50 rounded-sm border border-slate-100 shadow-sm">
                   <div className="flex justify-between items-center mb-2">
                     <span className="text-[9px] font-black text-slate-400 mono uppercase tracking-wider">{d.fullDate} · {d.weekday}</span>
                     <span className="text-[8px] font-black text-white px-2 py-0.5 rounded-[2px]" style={{ background: themeGradient }}>{getDayScoreSum(d)} PTS</span>
                   </div>
                   <p className="text-[12px] font-bold text-slate-600 leading-relaxed italic line-clamp-3">{d.reflection}</p>
                 </div>
               ))}
            </div>
          </div>
        </div>
      </div>,
      document.body
    )
  );

  return (
    <div className="h-full flex flex-col bg-white overflow-hidden">
      <header className="px-6 pt-16 pb-3 shrink-0 bg-white flex items-center justify-between">
         <div className="flex items-center gap-3">
           <button onClick={onOpenSidebar} className="p-1 -ml-1 text-slate-400"><Layout size={18}/></button>
           <div className="w-1.5 h-4 rounded-full" style={{ background: theme.color }} />
           <h1 className="text-base font-black tracking-tighter uppercase">复盘 / REVIEW</h1>
         </div>
         <div className="flex items-center gap-2">
           <button onClick={() => setShowStats(true)} className="p-2 text-slate-400 hover:text-slate-600 active:scale-90 transition-transform">
              <BarChart3 size={18}/>
           </button>
           <button onClick={() => setShowShop(true)} className="p-2 text-slate-400 active:scale-90 transition-transform relative">
              <ShoppingBag size={18}/>
              {totalPoints > 0 && <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-rose-500 border border-white" />}
           </button>
         </div>
      </header>
      
      <main className="flex-1 overflow-y-auto no-scrollbar px-6 pb-24 space-y-5 pt-2">
        <section className="grid grid-cols-3 gap-2">
            {[
              { icon: Coins, label: '能量', val: totalPoints, unit: 'PTS' },
              { icon: Trophy, label: '事项', val: tasksDone, total: tasksTotal },
              { icon: CheckCircle2, label: '习惯', val: habitsDone, total: habitsTotal }
            ].map((item, idx) => (
              <div key={idx} className="p-3 rounded-sm flex flex-col justify-between h-24 shadow-[0_8px_16px_-4px_rgba(0,0,0,0.1)] transition-transform active:scale-95" style={{ background: themeGradient }}>
                <item.icon size={10} className="text-white/60" strokeWidth={3} />
                <div className="flex flex-col">
                  <span className="text-xl font-black mono text-white leading-none tracking-tighter">
                    {item.val}{item.total !== undefined && <span className="text-[10px] opacity-40 ml-0.5">/{item.total}</span>}
                  </span>
                  <span className="text-[7px] font-black text-white/50 uppercase mt-1 tracking-widest">{item.label} {item.unit}</span>
                </div>
              </div>
            ))}
        </section>

        <button 
          onClick={() => setShowStats(true)}
          className="w-full p-4 bg-slate-50 border border-slate-100 rounded-sm flex items-center justify-between group hover:bg-slate-100 transition-all shadow-sm"
        >
           <div className="flex items-center gap-3">
              <div className="p-2 rounded-sm text-white" style={{ background: themeGradient }}>
                <BarChart3 size={14} />
              </div>
              <div className="text-left">
                <h4 className="text-[11px] font-black text-slate-700 uppercase tracking-widest">周期复盘统计看板</h4>
                <p className="text-[9px] font-bold text-slate-300 mt-0.5">查看多维度心流热力与笔记汇总</p>
              </div>
           </div>
           <ChevronRight size={16} className="text-slate-200 group-hover:text-slate-400 transition-colors" />
        </button>

        <section className="space-y-3">
           <div className="flex items-center justify-between px-1">
              <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-2"><Zap size={12} fill="currentColor"/> 状态自评</h3>
              <button onClick={() => setShowManageScores(true)} className="p-1 text-slate-300 hover:text-slate-500"><Settings size={12}/></button>
           </div>
           {scoreDefs.map(def => (
              <div key={def.id} className="space-y-2">
                <div className="flex justify-between items-center text-[9px] font-black uppercase">
                  <span className="text-slate-500">{def.label}</span>
                  <span className="text-slate-300 italic px-2 bg-slate-50 rounded-[2px]">{def.labels[getScoreValue(activeDay, def.id)]}</span>
                </div>
                <div className="flex gap-1.5">
                  {[-2, -1, 0, 1, 2].map(v => (
                    <button key={v} onClick={() => handleScoreChange(def.id, v)} className={`flex-1 h-8 rounded-sm font-black mono text-[10px] transition-all relative ${getScoreValue(activeDay, def.id) === v ? 'text-white shadow-md' : 'bg-slate-50 text-slate-200 hover:bg-slate-100'}`} style={{ background: getScoreValue(activeDay, def.id) === v ? themeGradient : undefined }}>{v > 0 ? '+' : ''}{v}</button>
                  ))}
                </div>
              </div>
           ))}
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
               <MessageSquare size={12} fill="currentColor" className="text-slate-300"/>
               <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-widest">复盘心语</h3>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="flex gap-1 overflow-x-auto no-scrollbar max-w-[180px]">
                {reflectionTemplates.map(tmp => (
                  <button key={tmp.id} onClick={() => onUpdateDay(activeDate, { reflection: (activeDay?.reflection || '') + (activeDay?.reflection ? "\n" : "") + tmp.text })} className="px-2 py-1 bg-slate-50 rounded-sm text-[8px] font-black text-slate-400 uppercase hover:bg-slate-100 whitespace-nowrap">{tmp.name}</button>
                ))}
              </div>
              <button onClick={() => setIsManagingTemplates(true)} className="p-1 text-slate-300 hover:text-slate-500 transition-colors"><Settings size={12}/></button>
            </div>
          </div>
          <textarea className="w-full min-h-[140px] bg-slate-50 border border-slate-100 rounded-sm p-4 text-[13px] font-bold text-slate-700 outline-none focus:bg-white focus:shadow-inner transition-all placeholder:text-slate-200" value={activeDay?.reflection || ''} onChange={e => onUpdateDay(activeDate, { reflection: e.target.value })} placeholder="沉淀今日的心路历程..." />
        </section>
      </main>

      {/* 模板管理弹窗 */}
      {isManagingTemplates && createPortal(
        <div className="fixed inset-0 z-[950] bg-slate-900/60 flex items-end justify-center p-4" onClick={() => { setIsManagingTemplates(false); setEditingTemplate(null); }}>
          <div className="bg-white w-full max-w-md rounded-sm p-6 shadow-2xl animate-in slide-in-from-bottom duration-300 flex flex-col max-h-[85vh] overflow-hidden" onClick={e => e.stopPropagation()}>
             <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">管理复盘模板</h3>
                <button onClick={() => { setIsManagingTemplates(false); setEditingTemplate(null); }}><X size={20}/></button>
             </div>
             
             {editingTemplate ? (
               <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="space-y-1">
                    <span className="text-[9px] font-black text-slate-300 uppercase pl-1">模板名称</span>
                    <input className="w-full bg-slate-50 p-3 text-sm font-bold rounded-sm border outline-none" value={editingTemplate.name} onChange={e => setEditingTemplate({...editingTemplate, name: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] font-black text-slate-300 uppercase pl-1">内容正文</span>
                    <textarea className="w-full h-32 bg-slate-50 p-3 text-sm font-bold rounded-sm border outline-none resize-none" value={editingTemplate.text} onChange={e => setEditingTemplate({...editingTemplate, text: e.target.value})} />
                  </div>
                  <div className="flex gap-2 pt-2">
                     <button onClick={() => setEditingTemplate(null)} className="flex-1 py-3 bg-slate-100 text-slate-400 text-[10px] font-black uppercase rounded-sm">取消</button>
                     <button 
                      onClick={() => {
                        if (reflectionTemplates.find(t => t.id === editingTemplate.id)) {
                          setReflectionTemplates(reflectionTemplates.map(t => t.id === editingTemplate.id ? editingTemplate : t));
                        } else {
                          setReflectionTemplates([...reflectionTemplates, editingTemplate]);
                        }
                        setEditingTemplate(null);
                      }}
                      className="flex-1 py-3 text-white text-[10px] font-black uppercase rounded-sm shadow-md" style={{ background: themeGradient }}>保存模板</button>
                  </div>
               </div>
             ) : (
               <div className="flex-1 flex flex-col overflow-hidden">
                  <div className="flex-1 overflow-y-auto no-scrollbar space-y-2 mb-4">
                    {reflectionTemplates.map(tmp => (
                      <div key={tmp.id} className="p-4 bg-slate-50 rounded-sm flex items-center justify-between border border-slate-100 group">
                         <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-700">{tmp.name}</span>
                            <span className="text-[9px] text-slate-300 truncate max-w-[200px]">{tmp.text.replace(/\n/g, ' ')}</span>
                         </div>
                         <div className="flex gap-1">
                            <button onClick={() => setEditingTemplate(tmp)} className="p-2 text-blue-400 hover:bg-blue-50 rounded-sm transition-colors"><Edit size={14}/></button>
                            <button onClick={() => setReflectionTemplates(reflectionTemplates.filter(t => t.id !== tmp.id))} className="p-2 text-rose-400 hover:bg-rose-50 rounded-sm transition-colors"><Trash2 size={14}/></button>
                         </div>
                      </div>
                    ))}
                  </div>
                  <button 
                    onClick={() => setEditingTemplate({ id: 'tmp-' + Date.now(), name: '新模板', text: '' })}
                    className="w-full py-4 border-2 border-dashed border-slate-100 text-slate-300 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:border-slate-200 transition-all"
                  >
                    <Plus size={14} /> 新增自定义模板
                  </button>
               </div>
             )}
          </div>
        </div>,
        document.body
      )}

      {/* 统计看板 Overlay */}
      {showStats && renderStatsOverlay()}

      {/* 能量商店 Overlay 等保持不变... */}
      {showShop && createPortal(
        <div className="fixed inset-0 z-[800] bg-white animate-in slide-in-from-right duration-300 flex flex-col">
           <header className="px-6 pt-16 pb-4 border-b flex justify-between items-center bg-white">
              <div className="flex items-center gap-3">
                 <h2 className="text-lg font-black uppercase tracking-tighter">能量商店</h2>
                 <button onClick={() => setIsManagingShop(!isManagingShop)} className={`p-1.5 rounded-sm transition-colors ${isManagingShop ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-50 text-slate-400'}`}>
                    <Settings size={14} />
                 </button>
              </div>
              <button onClick={() => { setShowShop(false); setIsManagingShop(false); }} className="p-2 bg-slate-50 rounded-full"><X size={20}/></button>
           </header>
           <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-6">
              <div className="p-5 rounded-sm flex items-center gap-4 text-white shadow-[0_12px_24px_-8px_rgba(0,0,0,0.2)]" style={{ background: themeGradient }}>
                 <div className="p-2.5 bg-white/20 rounded-full shadow-inner"><Coins size={24} /></div>
                 <div>
                    <div className="text-[9px] font-black uppercase opacity-60">Balance</div>
                    <div className="text-3xl font-black mono leading-none">{totalPoints}</div>
                 </div>
              </div>
              <div className="space-y-3">
                {rewards.map(r => (
                  <div key={r.id} className="p-4 bg-white border border-slate-100 rounded-sm flex justify-between items-center group shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 bg-slate-50 rounded-sm flex items-center justify-center text-xl shadow-inner group-hover:scale-105 transition-transform">🍹</div>
                       <div>
                          <div className="text-sm font-bold text-slate-800">{r.title}</div>
                          <div className="text-[10px] text-amber-500 font-black mono mt-0.5">{r.cost} ENERGY</div>
                       </div>
                    </div>
                    {isManagingShop ? (
                      <div className="flex gap-2">
                        <button onClick={() => setEditingReward(r)} className="p-2 text-blue-400 bg-blue-50 rounded-sm active:scale-90 transition-transform"><Edit size={14}/></button>
                        <button onClick={() => setRewards(rewards.filter(x => x.id !== r.id))} className="p-2 text-rose-400 bg-rose-50 rounded-sm active:scale-90 transition-transform"><Trash2 size={14}/></button>
                      </div>
                    ) : (
                      <button className="px-5 py-2 bg-slate-900 text-white text-[9px] font-black rounded-sm active:scale-95 shadow-md">REDEEM</button>
                    )}
                  </div>
                ))}
                {isManagingShop && (
                  <button 
                    onClick={() => setEditingReward({ id: 'r-' + Date.now(), title: '新奖励', cost: 10, icon: 'Gift' })}
                    className="w-full py-4 border-2 border-dashed border-slate-200 rounded-sm text-slate-300 font-black uppercase text-[10px] flex items-center justify-center gap-2 hover:border-slate-300 hover:text-slate-400 transition-all"
                  >
                    <Plus size={14} /> 新增奖励项目
                  </button>
                )}
              </div>
           </div>
        </div>,
        document.body
      )}

      {editingReward && createPortal(
        <div className="fixed inset-0 z-[900] bg-slate-900/40 flex items-center justify-center p-6" onClick={() => setEditingReward(null)}>
          <div className="bg-white w-full max-w-xs rounded-sm p-5 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
             <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">编辑奖励内容</h3>
             <input className="w-full bg-slate-50 p-3 text-sm font-bold rounded-sm border outline-none focus:bg-white transition-colors" placeholder="名称" value={editingReward.title} onChange={e => setEditingReward({...editingReward, title: e.target.value})} />
             <input className="w-full bg-slate-50 p-3 text-sm font-bold rounded-sm border outline-none focus:bg-white transition-colors" type="number" placeholder="能量花费" value={editingReward.cost} onChange={e => setEditingReward({...editingReward, cost: parseInt(e.target.value) || 0})} />
             <button 
              onClick={() => {
                if (rewards.find(r => r.id === editingReward.id)) {
                  setRewards(rewards.map(r => r.id === editingReward.id ? editingReward : r));
                } else {
                  setRewards([...rewards, editingReward]);
                }
                setEditingReward(null);
              }}
              className="w-full py-3 text-white text-[10px] font-black uppercase rounded-sm shadow-lg active:scale-95 transition-all" style={{ background: themeGradient }}>确认保存</button>
          </div>
        </div>,
        document.body
      )}

      {showManageScores && createPortal(
        <div className="fixed inset-0 z-[700] bg-slate-900/80 flex items-end justify-center p-4" onClick={() => setShowManageScores(false)}>
          <div className="bg-white w-full max-w-md rounded-sm p-6 shadow-2xl animate-in slide-in-from-bottom duration-300 flex flex-col max-h-[85vh]" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">评估维度设置</h3>
              <button onClick={() => setShowManageScores(false)} className="p-1 hover:bg-slate-50 rounded-full transition-colors"><X size={20}/></button>
            </div>
            {editingScoreDef ? (
              <div className="space-y-4 overflow-y-auto no-scrollbar">
                  <input className="w-full bg-slate-50 p-4 font-bold border rounded-sm outline-none focus:bg-white transition-colors" value={editingScoreDef.label} onChange={e => setEditingScoreDef({...editingScoreDef, label: e.target.value})} />
                  <div className="space-y-2">
                    {[-2, -1, 0, 1, 2].map(v => (
                      <div key={v} className="flex gap-3 items-center">
                        <span className="w-8 text-center font-black mono text-slate-400">{v > 0 ? '+' : ''}{v}</span>
                        <input className="flex-1 bg-slate-50 p-2 text-xs border rounded-sm outline-none focus:bg-white transition-colors" value={editingScoreDef.labels[v]} onChange={e => setEditingScoreDef({...editingScoreDef, labels: {...editingScoreDef.labels, [v]: e.target.value}})} />
                      </div>
                    ))}
                  </div>
                  <button onClick={() => { setScoreDefs(scoreDefs.map(d => d.id === editingScoreDef.id ? editingScoreDef : d)); setEditingScoreDef(null); }} className="w-full py-4 text-white font-black uppercase rounded-sm shadow-xl active:scale-[0.98] transition-all" style={{ background: themeGradient }}>完成保存</button>
              </div>
            ) : (
              <div className="space-y-3">
                {scoreDefs.map(def => (
                  <div key={def.id} className="p-4 bg-slate-50 rounded-sm flex items-center justify-between border border-slate-100 hover:border-slate-200 transition-colors">
                    <span className="text-sm font-bold text-slate-700">{def.label}</span>
                    <div className="flex gap-2">
                      <button onClick={() => setEditingScoreDef(def)} className="p-2 text-slate-400 hover:text-blue-500 transition-colors"><Edit size={14}/></button>
                      <button onClick={() => setScoreDefs(scoreDefs.filter(d => d.id !== def.id))} className="p-2 text-rose-400 hover:text-rose-600 transition-colors"><Trash2 size={14}/></button>
                    </div>
                  </div>
                ))}
                <button 
                  onClick={() => setScoreDefs([...scoreDefs, {id:'sd-'+Date.now(), label:'新维度', labels:{[-2]:'状态极差',[-1]:'略显低落',[0]:'正常发挥',[1]:'积极高效',[2]:'状态拉满'}}])}
                  className="w-full py-4 border border-dashed border-slate-200 text-[10px] font-black text-slate-300 uppercase rounded-sm hover:border-slate-300 transition-all"
                >+ 新增维度</button>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default ReviewPage;
