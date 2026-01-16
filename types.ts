
export type TaskType = 'completed' | 'focus' | 'learning' | 'empty';
export type LibraryTab = 'task' | 'habit' | 'goal' | 'note';
export type ResetCycle = 'none' | 'daily' | 'weekly' | 'monthly' | 'custom';

export interface Reward {
  id: string;
  title: string;
  cost: number;
  icon: string;
}

export interface PurchaseRecord {
  id: string;
  rewardId: string;
  rewardTitle: string;
  cost: number;
  timestamp: number;
}

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

export interface HabitInstance {
  id: string;
  habitId: string;
  time: string;
  completed: boolean;
}

export interface Habit {
  id: string;
  title: string;
  category: string;
  streak: number;
  remark?: string;
  completionTimes?: string[]; 
  frequencyDays: number;
  frequencyTimes: number;
  color: string;
  iconName: string;
  completedToday?: boolean;
  krId?: string;
  targetCount?: number;
  accumulatedCount?: number;
  resetCycle?: ResetCycle;
  resetDays?: number;
  lastCompletedAt?: number;
}

export interface ScoreDefinition {
  id: string;
  label: string;
  labels: { [key: number]: string };
}

export interface DayScore {
  definitionId: string;
  value: number;
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
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
  targetCount?: number;
  accumulatedCount?: number;
  originalId?: string;
  resetCycle?: ResetCycle;
  lastCompletedAt?: number;
  subtasks?: Subtask[];
}

export interface DayInfo {
  date: number;
  weekday: string;
  fullDate: string;
  isActive?: boolean;
  tasks: Task[];
  scheduledHabits?: HabitInstance[];
  reflection?: string;
  scores?: DayScore[];
}

export type AppView = 'overview' | 'daily' | 'review' | 'library';

export interface ThemeOption {
  name: string;
  color: string;
  lightColor: string;
}
