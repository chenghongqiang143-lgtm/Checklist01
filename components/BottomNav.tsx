
import React from 'react';
import { AppView, ThemeOption } from '../types';
import { NAV_ITEMS } from '../constants';

interface BottomNavProps {
  currentView: AppView;
  onViewChange: (view: AppView) => void;
  theme: ThemeOption;
}

const BottomNav: React.FC<BottomNavProps> = ({ currentView, onViewChange, theme }) => {
  return (
    <nav className="fixed bottom-4 left-4 right-4 h-[68px] bg-white/95 backdrop-blur-xl flex items-center justify-between px-1 z-[100] rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-slate-100">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = currentView === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id as AppView)}
            className="flex-1 h-full flex flex-col items-center justify-center gap-1 relative group rounded-xl transition-colors hover:bg-slate-50"
          >
            <div 
              className={`transition-all duration-300 ${isActive ? '-translate-y-0.5' : ''}`}
              style={{ color: isActive ? theme.color : '#94a3b8' }}
            >
               <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
            </div>
            <span 
              className={`text-[10px] font-bold tracking-tight transition-colors duration-300 ${isActive ? 'opacity-100' : 'opacity-50 text-slate-400'}`}
              style={{ color: isActive ? theme.color : undefined }}
            >
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};

export default BottomNav;
