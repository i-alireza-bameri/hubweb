import { ContentItem, Project, ShowcaseItem, User, Workspace } from '../types';

const TOKEN_KEY = 'omnispace_jwt_token';
const USER_KEY = 'omnispace_user_cache';

export const getStoredToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

export const setStoredToken = (token: string, user: User) => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const clearStoredAuth = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

export const getStoredUser = (): User | null => {
  const cached = localStorage.getItem(USER_KEY);
  if (!cached) return null;
  try {
    return JSON.parse(cached);
  } catch {
    return null;
  }
};

const getAuthHeaders = (): Record<string, string> => {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

// ==========================================
// REST API Methods
// ==========================================

export const api = {
  // Auth
  async register(data: { email: string; username: string; password: string; full_name?: string }) {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.detail || 'Registration failed');
    setStoredToken(result.access_token, result.user);
    return result;
  },

  async login(data: { email: string; password: string }) {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.detail || 'Login failed');
    setStoredToken(result.access_token, result.user);
    return result;
  },

  async getMe(): Promise<User> {
    const res = await fetch('/api/auth/me', {
      headers: getAuthHeaders(),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.detail || 'Failed to fetch user');
    return result;
  },

  // Workspaces
  async listWorkspaces(): Promise<Workspace[]> {
    const res = await fetch('/api/workspaces', {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to load workspaces');
    return res.json();
  },

  async getWorkspace(id: number): Promise<Workspace> {
    const res = await fetch(`/api/workspaces/${id}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to load workspace');
    return res.json();
  },

  async createWorkspace(data: { name: string; description?: string }): Promise<Workspace> {
    const res = await fetch('/api/workspaces', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create workspace');
    return res.json();
  },

  async updateWorkspace(id: number, data: { name?: string; description?: string }): Promise<Workspace> {
    const res = await fetch(`/api/workspaces/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update workspace');
    return res.json();
  },

  async deleteWorkspace(id: number): Promise<void> {
    const res = await fetch(`/api/workspaces/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete workspace');
  },

  // Projects
  async listProjects(workspaceId?: number): Promise<Project[]> {
    const url = workspaceId ? `/api/projects?workspace_id=${workspaceId}` : '/api/projects';
    const res = await fetch(url, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to load projects');
    return res.json();
  },

  async getProject(id: number): Promise<Project> {
    const res = await fetch(`/api/projects/${id}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to load project');
    return res.json();
  },

  async createProject(data: { workspace_id: number; name: string; description?: string; is_published?: boolean }): Promise<Project> {
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create project');
    return res.json();
  },

  async updateProject(id: number, data: { name?: string; description?: string; is_published?: boolean }): Promise<Project> {
    const res = await fetch(`/api/projects/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update project');
    return res.json();
  },

  async deleteProject(id: number): Promise<void> {
    const res = await fetch(`/api/projects/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete project');
  },

  // Contents
  async listContents(projectId?: number): Promise<ContentItem[]> {
    const url = projectId ? `/api/contents?project_id=${projectId}` : '/api/contents';
    const res = await fetch(url, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to load contents');
    return res.json();
  },

  async getContent(id: number): Promise<ContentItem> {
    const res = await fetch(`/api/contents/${id}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to load content');
    return res.json();
  },

  async createContent(data: {
    project_id: number;
    title: string;
    content_type: string;
    body_text?: string;
    is_published?: boolean;
  }): Promise<ContentItem> {
    const res = await fetch('/api/contents', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create content');
    return res.json();
  },

  async uploadFile(formData: FormData): Promise<ContentItem> {
    const token = getStoredToken();
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const res = await fetch('/api/contents/upload', {
      method: 'POST',
      headers,
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Upload failed' }));
      throw new Error(err.detail || 'Upload failed');
    }
    return res.json();
  },

  async updateContent(id: number, data: { title?: string; body_text?: string; is_published?: boolean; content_type?: string }): Promise<ContentItem> {
    const res = await fetch(`/api/contents/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update content');
    return res.json();
  },

  async deleteContent(id: number): Promise<void> {
    const res = await fetch(`/api/contents/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete content');
  },

  // Public Endpoints (No Auth Needed!)
  async getPublicContent(slug: string): Promise<ContentItem> {
    const res = await fetch(`/api/public/content/${slug}`);
    if (!res.ok) throw new Error('Published document not found or revoked');
    return res.json();
  },

  async getPublicShowcase(): Promise<ShowcaseItem[]> {
    const res = await fetch('/api/public/showcase');
    if (!res.ok) return [];
    return res.json();
  },

  // Strawberry GraphQL Execution
  async executeGraphQL(query: string, variables?: Record<string, any>) {
    const token = getStoredToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const startTime = performance.now();
    const res = await fetch('/graphql', {
      method: 'POST',
      headers,
      body: JSON.stringify({ query, variables }),
    });
    const latency = Math.round(performance.now() - startTime);
    const data = await res.json();
    return {
      status: res.status,
      latency,
      data,
    };
  },
};
