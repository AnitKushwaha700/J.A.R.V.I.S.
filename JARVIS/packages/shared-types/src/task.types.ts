export type TaskStatus = 'todo' | 'in_progress' | 'completed' | 'skipped';

export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  userId: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueAt?: string | null;
  isRecurring: boolean;
  recurrenceRule?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskDto {
  title: string;
  description?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  dueAt?: string;
  isRecurring?: boolean;
  recurrenceRule?: string;
}

export interface UpdateTaskDto {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueAt?: string | null;
}

export interface VoiceTaskExtractionResult {
  title: string;
  dueAt?: string;
  priority: TaskPriority;
  rawInput: string;
}

export interface DailyBriefing {
  greeting: string;
  dateTime: string;
  weather?: {
    location: string;
    temperature: number;
    condition: string;
  };
  topTasks: Task[];
  pendingCount: number;
  completedTodayCount: number;
  topNews: { title: string; source: string; url?: string }[];
  systemStatus: {
    activeProviders: string[];
    database: string;
    aiGateway: string;
  };
  spokenScript: string;
}
