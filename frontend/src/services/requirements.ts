import { apiRequest } from './api';

export interface INLPAmbiguityFinding {
  phrase: string;
  reason: string;
  severity: 'warning' | 'info';
  start_char?: number;
  end_char?: number;
}

export interface INLPEvidenceSpan {
  category: string;
  text: string;
  start_char: number;
  end_char: number;
  confidence: number;
}

export interface INLPAnalysis {
  actors: string[];
  actions: string[];
  entities: string[];
  conditions: string[];
  constraints: string[];
  outcomes: string[];
  explicit_negations?: string[];
  ambiguity_findings: INLPAmbiguityFinding[];
  evidence_spans?: INLPEvidenceSpan[];
  processing_version?: string;
}

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
  nlp_analysis?: INLPAnalysis;
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
  },

  async analyzeRequirement(requirementId: string): Promise<RequirementItem> {
    return apiRequest<RequirementItem>(`/requirements/${requirementId}/analyze`, {
      method: 'POST'
    });
  }
};
