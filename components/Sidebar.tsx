
import React, { useState } from 'react';
import { Palette, User, Shield, Download, Upload, Trash2, Copy, Info } from 'lucide-react';
import { ThemeOption } from '../types';
import { THEME_OPTIONS } from '../constants';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: ThemeOption;
  onThemeChange: (theme: ThemeOption) => void;
  onClearTasks: () => void;
  onBackup: () => void;
  onRestore: (json: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, currentTheme, onThemeChange, onClearTasks, onBackup, onRestore }) => {
  const [restoreInput, setRestoreInput] = useState('');

  return (
    <>
      <div 
        className={`fixed inset-0 bg-slate-900/60 z-[160] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      
      <div 
        className={`fixed left-0 top-0 bottom-0 w-[85%] max-w-[320px] bg-white z-[170] shadow-2xl transition-transform duration-500 transform flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="p-8 pt-16 flex flex-col items-start bg-slate-50">
          <div className="w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg mb-4" style={{ backgroundColor: currentTheme.color }}>
            <User size={28} />
          </div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">极简日程</h2>
          <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase mt-1">Minimalist Workspace</p>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar">
          
          {/* Theme Section */}
          <section>
            <p className="text-[10px] font-black text-slate-300 tracking-widest uppercase mb-4 flex items-center gap-2">
               <Palette size={12} /> 个性化主题
            </p>
            <div className="grid grid-cols-5 gap-3">
              {THEME_OPTIONS.map((theme) => (
                <button
                  key={theme.name}
                  onClick={() => onThemeChange(theme)}
                  className={`w-8 h-8 rounded-full transition-all flex items-center justify-center ${currentTheme.name === theme.name ? 'ring-2 ring-offset-2 ring-slate-200 scale-110 shadow-md' : 'opacity-60 hover:opacity-100'}`}
                  style={{ backgroundColor: theme.color }}
                >
                  {currentTheme.name === theme.name && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                </button>
              ))}
            </div>
          </section>

          {/* Data Management Section */}
          <section className="space-y-3">
            <p className="text-[10px] font-black text-slate-300 tracking-widest uppercase mb-2 flex items-center gap-2">
               <Shield size={12} /> 数据本地维护
            </p>
            
            <button 
              onClick={onBackup}
              className="w-full flex items-center justify-between p-3.5 bg-slate-50 rounded-sm active:scale-[0.98] transition-all"
            >
              <div className="flex items-center gap-3">
                <Download size={14} className="text-slate-400" />
                <span className="text-xs font-bold text-slate-600">备份 JSON 数据</span>
              </div>
              <Copy size={12} className="text-slate-300" />
            </button>

            <div className="bg-slate-50 p-3.5 rounded-sm space-y-3">
              <div className="flex items-center gap-3">
                <Upload size={14} className="text-slate-400" />
                <span className="text-xs font-bold text-slate-600">恢复数据</span>
              </div>
              <textarea 
                className="w-full h-20 bg-white border-0 rounded-sm p-3 text-[10px] font-bold text-slate-500 outline-none placeholder:text-slate-300 resize-none"
                placeholder="在此粘贴 JSON 文本..."
                value={restoreInput}
                onChange={(e) => setRestoreInput(e.target.value)}
              />
              <button 
                onClick={() => { onRestore(restoreInput); setRestoreInput(''); }}
                className="w-full py-2.5 bg-slate-800 text-white text-[10px] font-black uppercase tracking-widest rounded-sm active:scale-[0.98] transition-all"
              >
                执行恢复
              </button>
            </div>

            <button 
              onClick={onClearTasks}
              className="w-full flex items-center justify-between p-3.5 bg-rose-50 rounded-sm active:scale-[0.98] transition-all"
            >
              <div className="flex items-center gap-3">
                <Trash2 size={14} className="text-rose-400" />
                <span className="text-xs font-bold text-rose-600">清空所有日程</span>
              </div>
            </button>
          </section>
        </div>

        <div className="p-6 bg-slate-50/50">
          <div className="flex items-center gap-2 text-slate-300 justify-center">
             <Info size={12} />
             <span className="text-[10px] font-black uppercase tracking-widest">Version 2.8.5</span>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
