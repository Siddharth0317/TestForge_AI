import { apiRequest } from './api';

export interface ProjectSettings {
  default_priority: 'low' | 'medium' | 'high' | 'critical';
  require_approval_for_execution: boolean;
}

export interface ProjectSummary {
  requirements_count?: number;
  environments_count?: number;
}

export interface ProjectItem {
  _id: string;
  name: string;
  description: string;
  owner_id: string;
  settings: ProjectSettings;
  summary?: ProjectSummary;
  created_at: string;
  updated_at: string;
}

export interface CreateProjectPayload {
  name: string;
  description?: string;
  settings?: Partial<ProjectSettings>;
}

export const projectsService = {
  async listProjects(): Promise<ProjectItem[]> {
    return apiRequest<ProjectItem[]>('/projects');
  },

  async getProject(projectId: string): Promise<ProjectItem> {
    return apiRequest<ProjectItem>(`/projects/${projectId}`);
  },

  async createProject(payload: CreateProjectPayload): Promise<ProjectItem> {
    return apiRequest<ProjectItem>('/projects', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }
};

