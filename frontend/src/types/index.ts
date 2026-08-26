export interface Student {
  id: string;
  name: string;
  goal: string;
  daily_study_time: number;
  skill_level: 'beginner' | 'intermediate' | 'advanced';
  learning_style: 'visual' | 'reading' | 'hands-on' | 'mixed';
}

export interface Topic {
  title: string;
  description: string;
  estimated_minutes: number;
  order: number;
  is_completed: boolean;
}

export interface Week {
  week_number: number;
  title: string;
  topics: Topic[];
  is_current: boolean;
}

export interface Milestone {
  title: string;
  week_number: number;
  description: string;
}

export interface Roadmap {
  id: string;
  student_id: string;
  weeks: Week[];
  milestones: Milestone[];
  total_weeks: number;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correct_answer: number;
  explanation: string;
}

export interface Quiz {
  id: string;
  student_id: string;
  topic_title: string;
  questions: QuizQuestion[];
}

export interface QuizResultAnswer {
  question_index: number;
  selected_answer: number;
  is_correct: boolean;
}

export interface QuizResult {
  id: string;
  score: number;
  total: number;
  topic_title: string;
  answers: QuizResultAnswer[];
  questions: QuizQuestion[];
}

export interface Recommendation {
  type: 'revision' | 'next_topic' | 'practice';
  topic_title: string;
  reason: string;
  estimated_minutes?: number;
  difficulty?: string;
}

export interface LearningDNA {
  student_id: string;
  learning_personality: string;
  learning_speed: string;
  retention_score: number;
  confidence_score: number;
  revision_need: string;
  most_improved_skill: string;
  current_weakness: string;
  current_strength: string;
  recommended_study_style: string;
  best_time_to_study: string;
  estimated_time_to_goal: string;
  learning_momentum: string;
  learning_health: {
    score: number;
    label: string;
    summary: string;
  };
  predictions: { text: string; priority: string; reason: string }[];
  metadata?: {
    total_topics?: number;
    completed_topics?: number;
    quiz_accuracy?: number;
    notes_count?: number;
    recommendation_count?: number;
    weak_topics?: string[];
  };
}

export interface DashboardData {
  student: Student;
  roadmap_progress: {
    completed: number;
    total: number;
    percentage: number;
  };
  quiz_scores: { topic: string; score: number; total: number }[];
  weak_topics: string[];
  completed_topics: string[];
  learning_streak: number;
  best_streak: number;
  next_recommendation: Recommendation | null;
  learning_dna: LearningDNA | null;
}

// Auth types
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  goal?: string;
  skill_level?: 'beginner' | 'intermediate' | 'advanced';
  daily_study_time?: number;
  learning_style?: 'visual' | 'reading' | 'hands-on' | 'mixed';
  area_of_interest?: string;
  target_date?: string;
  country?: string;
  timezone?: string;
  xp: number;
  level: number;
  streak: number;
  is_verified: boolean;
  is_onboarded: boolean;
  created_at: string;
  last_login?: string;
  theme: string;
  notifications_enabled: boolean;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface NotesDocument {
  id: string;
  student_id: string;
  topic: string;
  content: string;
  created_at: string;
}
