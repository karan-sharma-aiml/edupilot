import Cookies from 'js-cookie';
import { useAuthStore } from '@/stores/auth-store';
import type { DashboardData, Quiz, QuizResult, Roadmap, Topic, User, AuthTokens, ApiResponse, ChatMessage, NotesDocument } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const inFlightRequests = new Map<string, Promise<unknown>>();

async function requestUncached<T>(url: string, options?: RequestInit): Promise<T> {
  const accessToken = Cookies.get('access_token');
  let res: Response;

  try {
    res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...options?.headers,
      },
    });
  } catch {
    throw new Error('Unable to connect to EduPilot. Please check that the backend is running.');
  }

  if (res.status === 401) {
    // Try to refresh
    const refreshToken = Cookies.get('refresh_token');
    if (refreshToken) {
      try {
        const refreshRes = await fetch(`${API_URL}/api/auth/refresh`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${refreshToken}`,
          },
        });
        if (refreshRes.ok) {
          const data: ApiResponse<AuthTokens> = await refreshRes.json();
          const store = useAuthStore.getState();
          store.setAuth(data.data.user, data.data.access_token, data.data.refresh_token);
          // Retry original request
          const retryRes = await fetch(url, {
            ...options,
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${data.data.access_token}`,
              ...options?.headers,
            },
          });
          if (!retryRes.ok) throw new Error('Request failed after refresh');
          const retryJson: ApiResponse<T> = await retryRes.json();
          return retryJson.data;
        }
      } catch { }
    }
    // Refresh failed, clear auth
    useAuthStore.getState().clearAuth();
    if (typeof window !== 'undefined') {
      window.location.href = '/auth/login';
    }
    throw new Error('Authentication expired');
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || error.detail || `HTTP ${res.status}`);
  }

  const json: ApiResponse<T> = await res.json();
  return json.data;
}

function request<T>(url: string, options?: RequestInit): Promise<T> {
  if (options?.method && options.method !== 'GET') {
    return requestUncached<T>(url, options);
  }

  const existing = inFlightRequests.get(url);
  if (existing) return existing as Promise<T>;

  const pending = requestUncached<T>(url, options).finally(() => {
    inFlightRequests.delete(url);
  });
  inFlightRequests.set(url, pending);
  return pending;
}

export const api = {
  // Auth
  async register(data: { name: string; email: string; password: string }): Promise<AuthTokens> {
    return request(`${API_URL}/api/auth/register`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async login(data: { email: string; password: string; remember_me?: boolean }): Promise<AuthTokens> {
    return request(`${API_URL}/api/auth/login`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async refreshToken(): Promise<AuthTokens> {
    const refreshToken = Cookies.get('refresh_token');
    return request(`${API_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${refreshToken}` },
    });
  },

  async verifyEmail(token: string): Promise<void> {
    return request(`${API_URL}/api/auth/verify-email/${token}`, { method: 'POST' });
  },

  async forgotPassword(email: string): Promise<void> {
    return request(`${API_URL}/api/auth/forgot-password`, {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  async resetPassword(token: string, new_password: string): Promise<void> {
    return request(`${API_URL}/api/auth/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ token, new_password }),
    });
  },

  async getMe(): Promise<User> {
    return request(`${API_URL}/api/auth/me`);
  },

  async updateMe(data: Partial<User>): Promise<User> {
    return request(`${API_URL}/api/auth/me`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async completeOnboarding(data: any): Promise<User> {
    return request(`${API_URL}/api/auth/onboarding`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Learning (existing, updated API paths)
  async generateRoadmap(data: any): Promise<{ student_id: string; roadmap: Roadmap }> {
    return request(`${API_URL}/api/generate-roadmap`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getRoadmap(studentId: string): Promise<Roadmap> {
    return request(`${API_URL}/api/roadmap/${studentId}`);
  },

  async getTodaysTopic(studentId: string): Promise<{ topic: Topic; week_number: number } | null> {
    try {
      return await request(`${API_URL}/api/todays-topic/${studentId}`);
    } catch {
      return null;
    }
  },

  async completeTopic(studentId: string, weekNumber: number, topicOrder: number): Promise<void> {
    await request(`${API_URL}/api/complete-topic`, {
      method: 'POST',
      body: JSON.stringify({ student_id: studentId, week_number: weekNumber, topic_order: topicOrder }),
    });
  },

  async explainTopic(studentId: string, topicTitle: string): Promise<{ explanation: string }> {
    return request(`${API_URL}/api/explain-topic`, {
      method: 'POST',
      body: JSON.stringify({ student_id: studentId, topic_title: topicTitle }),
    });
  },

  async generateQuiz(studentId: string, topicTitle: string): Promise<Quiz> {
    const data = await request<any>(`${API_URL}/api/generate-quiz`, {
      method: 'POST',
      body: JSON.stringify({ student_id: studentId, topic_title: topicTitle }),
    });
    return { id: data._id || data.id, student_id: data.student_id, topic_title: data.topic_title, questions: data.questions };
  },

  async submitQuiz(studentId: string, quizId: string, answers: { question_index: number; selected_answer: number }[]): Promise<QuizResult> {
    const data = await request<any>(`${API_URL}/api/submit-quiz`, {
      method: 'POST',
      body: JSON.stringify({ student_id: studentId, quiz_id: quizId, answers }),
    });
    const result = data.result || data;
    return { id: result._id || result.id, score: result.score, total: result.total, topic_title: result.topic_title, answers: result.answers, questions: [] };
  },

  async chat(message: string, currentTopic: string, history: ChatMessage[], studentId = 'me'): Promise<{ response: string }> {
    return request(`${API_URL}/api/chat`, {
      method: 'POST',
      body: JSON.stringify({ message, currentTopic, studentId, history }),
    });
  },

  async generateNotes(topic: string, studentId = 'me'): Promise<NotesDocument> {
    const data = await request<any>(`${API_URL}/api/notes`, {
      method: 'POST',
      body: JSON.stringify({ topic, studentId }),
    });
    return { id: data._id || data.id, student_id: data.student_id, topic: data.topic, content: data.content, created_at: data.created_at };
  },

  async getDashboard(studentId: string): Promise<DashboardData> {
    const data = await request<any>(`${API_URL}/api/dashboard/${studentId}`);
    const student = data.student;
    if (student._id) { student.id = student._id; delete student._id; }
    return {
      student,
      roadmap_progress: data.roadmap_progress,
      quiz_scores: (data.quiz_scores || []).map((q: any) => ({ topic: q.topic_title, score: q.score, total: q.total })),
      weak_topics: data.weak_topics || [],
      completed_topics: data.completed_topics || [],
      learning_streak: data.learning_streak || 0,
      best_streak: data.best_streak || data.learning_streak || 0,
      next_recommendation: data.next_recommendation ? {
        type: data.next_recommendation.type,
        topic_title: data.next_recommendation.topic_title,
        reason: data.next_recommendation.reason,
        estimated_minutes: data.next_recommendation.estimated_minutes,
        difficulty: data.next_recommendation.difficulty,
      } : null,
      learning_dna: data.learning_dna || null,
    };
  },
};
