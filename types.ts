
export type TaskType = 'completed' | 'focus' | 'learning' | 'empty';
export type LibraryTab = 'task' | 'habit' | 'goal' | 'note';

export interface KeyResult {
  id: string;
  title: string;
  progress: number;
}

export interface Goal {
  id: string;
  title: string;
  category: string;
  keyResults: KeyResult[];
}

export interface Habit {
  id: string;
  title: string;
  category: string;
  streak: number;
  remark?: string;
  frequencyDays: number;
  frequencyTimes: number;
  color: string;
  iconName: string;
  completedToday?: boolean;
  krId?: string;
}

export interface ScoreDefinition {
  id: string;
  label: string;
  labels: { [key: number]: string }; // -2, -1, 0, 1, 2 对应的文本
}

export interface DayScore {
  definitionId: string;
  value: number; // -2 to 2
}

export interface Task {
  id: string;
  title: string;
  time?: string;
  duration?: string;
  type: TaskType;
  category: string;
  icon?: string;
  date?: number;
  remark?: string;
  krId?: string;
  completed?: boolean;
  frequencyDays?: number;
  frequencyTimes?: number;
  targetCount?: number;
  accumulatedCount?: number;
}

export interface DayInfo {
  date: number;
  weekday: string;
  fullDate: string;
  isActive?: boolean;
  tasks: Task[];
  reflection?: string;
  scores?: DayScore[];
}

export type AppView = 'overview' | 'daily' | 'review' | 'library' | 'profile';

export interface ThemeOption {
  name: string;
  color: string;
  lightColor: string;
}
