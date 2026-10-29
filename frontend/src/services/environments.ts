import { apiRequest } from './api';

export interface LocatorItem {
  key: string;
  page: string;
  strategy: 'id' | 'css' | 'xpath' | 'name' | 'test_id';
  value: string;
  description?: string;
}

export interface TargetEnvironmentItem {
  _id: string;
  project_id: string;
  name: string;
  base_url: string;
  allowed_hosts: string[];
  environment_type: 'local' | 'dev' | 'staging' | 'production_authorized';
  is_active: boolean;
  timeouts: {
    page_load_seconds: number;
    implicit_wait_seconds: number;
  };
  locators: LocatorItem[];
  created_at: string;
  updated_at: string;
}

export interface CreateEnvironmentPayload {
  name: string;
  base_url: string;
  allowed_hosts: string[];
  environment_type?: 'local' | 'dev' | 'staging' | 'production_authorized';
  locators?: LocatorItem[];
}

export const environmentsService = {
  async listEnvironments(projectId: string): Promise<TargetEnvironmentItem[]> {
    return apiRequest<TargetEnvironmentItem[]>(`/projects/${projectId}/environments`);
  },

  async createEnvironment(projectId: string, payload: CreateEnvironmentPayload): Promise<TargetEnvironmentItem> {
    return apiRequest<TargetEnvironmentItem>(`/projects/${projectId}/environments`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }
};

