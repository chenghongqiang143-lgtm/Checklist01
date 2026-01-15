
import { Task, DayInfo, ThemeOption } from './types';
import { Layout, Archive, LayoutDashboard, ClipboardCheck } from 'lucide-react';

export const THEME_OPTIONS: ThemeOption[] = [
  { name: '郁金香', color: '#f43f5e', lightColor: '#fff1f2' },
  { name: '暗夜', color: '#171717', lightColor: '#f5f5f5' },
  { name: '琥珀', color: '#f59e0b', lightColor: '#fffbeb' },
  { name: '翡翠', color: '#10b981', lightColor: '#ecfdf5' },
  { name: '冰蓝', color: '#0ea5e9', lightColor: '#f0f9ff' },
  { name: '薰衣草', color: '#8b5cf6', lightColor: '#f5f3ff' },
  { name: '落日', color: '#f97316', lightColor: '#fff7ed' },
  { name: '松石', color: '#14b8a6', lightColor: '#f0fdfa' },
  { name: '樱花', color: '#ec4899', lightColor: '#fdf2f8' },
  { name: '石墨', color: '#52525b', lightColor: '#fafafa' },
];

export const INITIAL_DAYS: DayInfo[] = [
  { date: 12, weekday: 'MON', fullDate: '1月12日', tasks: [] },
  { date: 13, weekday: 'TUE', fullDate: '1月13日', tasks: [] },
  { date: 14, weekday: 'WED', fullDate: '1月14日', isActive: true, tasks: [] },
  { date: 15, weekday: 'THU', fullDate: '1月15日', tasks: [] },
  { date: 16, weekday: 'FRI', fullDate: '1月16日', tasks: [] },
  { date: 17, weekday: 'SAT', fullDate: '1月17日', tasks: [] },
  { date: 18, weekday: 'SUN', fullDate: '1月18日', tasks: [] },
];

export const NAV_ITEMS = [
  { id: 'overview', label: '概览', icon: LayoutDashboard },
  { id: 'daily', label: '日程', icon: Layout },
  { id: 'library', label: '库', icon: Archive },
  { id: 'review', label: '复盘', icon: ClipboardCheck },
];

export const LIBRARY_TASKS: Task[] = [
  { id: 'lib1', title: '代码重构', category: '工作', type: 'focus' },
  { id: 'lib2', title: '需求文档', category: '工作', type: 'focus' },
  { id: 'lib3', title: '阅读学习', category: '学习', type: 'learning' },
  { id: 'lib4', title: '冥想', category: '健康', type: 'focus' },
  { id: 'lib5', title: '健身', category: '健康', type: 'completed' },
  { id: 'lib6', title: '报表整理', category: '财务', type: 'completed' },
  { id: 'lib7', title: '邮件回复', category: '工作', type: 'focus' },
  { id: 'lib8', title: '背单词', category: '学习', type: 'learning' },
];
