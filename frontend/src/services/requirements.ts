import { apiRequest } from './api';

export interface RequirementItem {
  _id: string;
  project_id: string;
  version: number;
  original_text: string;
  normalized_text: string;
  status: 'draft' | 'analyzed' | 'archived';
  source_metadata?: {
    jira_key?: string;
    author?: string;
    document_ref?: string;
  };
  created_at: string;
  updated_at: string;
}

export interface CreateRequirementPayload {
  original_text: string;
  source_metadata?: {
    jira_key?: string;
    author?: string;
    document_ref?: string;
  };
}

export const requirementsService = {
  async listRequirements(projectId: string): Promise<RequirementItem[]> {
    return apiRequest<RequirementItem[]>(`/projects/${projectId}/requirements`);
  },

  async getRequirement(requirementId: string): Promise<RequirementItem> {
    return apiRequest<RequirementItem>(`/requirements/${requirementId}`);
  },

  async createRequirement(projectId: string, payload: CreateRequirementPayload): Promise<RequirementItem> {
    return apiRequest<RequirementItem>(`/projects/${projectId}/requirements`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async updateRequirement(requirementId: string, original_text: string): Promise<RequirementItem> {
    return apiRequest<RequirementItem>(`/requirements/${requirementId}`, {
      method: 'PATCH',
      body: JSON.stringify({ original_text })
    });
  }
};

