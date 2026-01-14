
import React, { useState } from 'react';
import { ThemeOption } from '../types';
import { THEME_OPTIONS } from '../constants';
import { Palette, Check, Shield, CircleHelp, Info, Download, Upload, Trash2, Copy } from 'lucide-react';

interface ProfilePageProps {
  theme: ThemeOption;
  onThemeChange: (theme: ThemeOption) => void;
  onClearTasks: () => void;
  onBackup: () => void;
  onRestore: (json: string) => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ theme, onThemeChange, onClearTasks, onBackup, onRestore }) => {
  const [restoreInput, setRestoreInput] = useState('');

  return (
    <div className="h-full flex flex-col bg-white overflow-hidden">
      <header className="px-6 pt-12 pb-6 shrink-0 bg-white">
        <h1 className="text-lg font-black tracking-tighter uppercase">设置 / SETTINGS</h1>
      </header>

      <main className="flex-1 overflow-y-auto no-scrollbar px-6 pb-24 space-y-8">
        {/* 主题选择区 */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Palette size={14} className="text-slate-400" />
            <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-widest">界面主题</h3>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {THEME_OPTIONS.map((option) => {
              const isSelected = theme.name === option.name;
              return (
                <button
                  key={option.name}
                  onClick={() => onThemeChange(option)}
                  className={`flex items-center justify-between p-3.5 rounded-sm transition-all ${
                    isSelected ? 'bg-slate-50' : 'bg-white'
                  }`}
                  style={{ 
                    border: isSelected ? `1.5px solid ${option.color}` : '1.5px solid #f1f5f9'
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded-full shadow-inner" 
                      style={{ backgroundColor: option.color }} 
                    />
                    <span className={`text-[11px] font-bold ${isSelected ? 'text-slate-900' : 'text-slate-400'}`}>
                      {option.name}
                    </span>
                  </div>
                  {isSelected && <Check size={12} style={{ color: option.color }} strokeWidth={4} />}
                </button>
              );
            })}
          </div>
        </section>

        {/* 数据管理 */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Shield size={14} className="text-slate-400" />
            <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-widest">数据管理</h3>
          </div>
          <div className="space-y-2">
            <button 
              onClick={onBackup}
              className="w-full flex items-center justify-between p-4 bg-slate-50 rounded-sm active:opacity-70 transition-opacity"
            >
              <div className="flex items-center gap-3">
                <Download size={14} className="text-slate-400" />
                <span className="text-xs font-bold text-slate-600">备份数据 (复制到剪贴板)</span>
              </div>
              <Copy size={12} className="text-slate-300" />
            </button>
            
            <div className="bg-slate-50 p-4 rounded-sm space-y-3">
              <div className="flex items-center gap-3">
                <Upload size={14} className="text-slate-400" />
                <span className="text-xs font-bold text-slate-600">恢复数据</span>
              </div>
              <textarea 
                className="w-full h-24 bg-white border-0 rounded-sm p-3 text-[10px] font-bold text-slate-500 outline-none placeholder:text-slate-200"
                placeholder="在此粘贴之前备份的 JSON 数据..."
                value={restoreInput}
                onChange={(e) => setRestoreInput(e.target.value)}
              />
              <button 
                onClick={() => onRestore(restoreInput)}
                className="w-full py-2 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-sm"
              >
                执行恢复
              </button>
            </div>

            <button 
              onClick={onClearTasks}
              className="w-full flex items-center justify-between p-4 bg-rose-50 rounded-sm active:opacity-70 transition-opacity"
            >
              <div className="flex items-center gap-3">
                <Trash2 size={14} className="text-rose-400" />
                <span className="text-xs font-bold text-rose-600">清除所有日程 (保留库)</span>
              </div>
            </button>
          </div>
        </section>

        {/* 常规设置 */}
        <section className="space-y-1">
          <div className="flex items-center gap-2 mb-4">
            <Info size={14} className="text-slate-400" />
            <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-widest">常规</h3>
          </div>
          {[
            { label: '帮助中心', icon: CircleHelp },
            { label: '关于极简日程', icon: Info },
          ].map((item, idx) => (
            <button 
              key={idx}
              className="w-full flex items-center justify-between p-4 bg-slate-50 rounded-sm active:opacity-70 transition-opacity"
            >
              <span className="text-xs font-bold text-slate-600">{item.label}</span>
              <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
            </button>
          ))}
        </section>

        <div className="pt-12 text-center">
          <p className="text-[10px] font-black text-slate-200 uppercase tracking-[0.3em]">Version 2.7.0</p>
        </div>
      </main>
    </div>
  );
};

export default ProfilePage;
