const BASE = '/api';

interface RequestOptions {
  method?: string;
  body?: unknown;
  token?: string;
  isFormData?: boolean;
}

async function request<T = unknown>(url: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, isFormData } = options;
  const token = options.token || localStorage.getItem('token');

  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (!isFormData && body) headers['Content-Type'] = 'application/json';

  const config: RequestInit = {
    method,
    headers,
    body: isFormData ? body as FormData : body ? JSON.stringify(body) : undefined,
  };

  const res = await fetch(`${BASE}${url}`, config);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: '请求失败' }));
    throw new Error(err.error || '请求失败');
  }
  return res.json();
}

export const api = {
  login: (data: { username: string; password: string }) => request('/auth/login', { method: 'POST', body: data }),
  register: (data: { username: string; password: string; name: string; department?: string }) => request('/auth/register', { method: 'POST', body: data }),
  getMe: () => request('/auth/me'),

  getCourses: () => request('/courses'),
  getCourse: (id: number) => request(`/courses/${id}`),
  createCourse: (data: { title: string; summary: string; training_time: string; location: string }) => request('/courses', { method: 'POST', body: data }),
  updateCourseStatus: (id: number, status: string) => request(`/courses/${id}/status`, { method: 'PUT', body: { status } }),
  enrollCourse: (id: number) => request(`/courses/${id}/enroll`, { method: 'POST' }),
  uploadMaterial: (courseId: number, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return request(`/courses/${courseId}/materials`, { method: 'POST', body: formData, isFormData: true });
  },

  getExams: () => request('/exams'),
  getExam: (id: number) => request(`/exams/${id}`),
  createExam: (data: { course_id: number; title: string; total_score: number; pass_score: number; time_limit: number; questions: Array<{ type: string; content: string; options?: string[]; answer: string; explanation?: string; score: number }> }) => request('/exams', { method: 'POST', body: data }),
  updateExam: (id: number, data: { course_id: number; title: string; total_score: number; pass_score: number; time_limit: number; questions: Array<{ type: string; content: string; options?: string[]; answer: string; explanation?: string; score: number }> }) => request(`/exams/${id}`, { method: 'PUT', body: data }),
  submitExam: (id: number, answers: Record<number, string>) => request(`/exams/${id}/submit`, { method: 'POST', body: { answers } }),

  getDashboard: () => request('/stats/dashboard'),
  getProfile: () => request('/stats/profile'),
};
