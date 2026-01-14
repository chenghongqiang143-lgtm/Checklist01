
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
    <nav className="fixed bottom-0 left-0 right-0 pb-6 pt-2 h-[88px] bg-white/95 backdrop-blur-md flex items-center px-4 z-[100] border-t border-slate-50 shadow-sm">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = currentView === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id as AppView)}
            className="flex-1 flex flex-col items-center justify-center h-full transition-all duration-300 relative group"
            style={{ color: isActive ? theme.color : '#cbd5e1' }}
          >
            <Icon size={22} strokeWidth={isActive ? 2.5 : 2} className="mb-1 transition-transform duration-300 group-active:scale-90" />
            <span className={`text-[9px] font-black uppercase tracking-tighter transition-opacity ${isActive ? 'opacity-100' : 'opacity-60'}`}>
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};

export default BottomNav;
