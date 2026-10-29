import { apiRequest } from './api';

export interface ITestStep {
  step_number: number;
  action: 'navigate' | 'click' | 'enter_text' | 'select_option' | 'wait_for_visible' | 'assert_text' | 'assert_visible' | 'assert_url';
  target_ref: string;
  value_ref?: string | null;
}

export interface ICandidateTestCase {
  schema_version: string;
  test_case_id: string;
  requirement_id: string;
  requirement_version: number;
  title: string;
  category: string;
  scenario_type: 'positive' | 'negative' | 'boundary' | 'authorization' | 'error_handling' | 'state_transition';
  preconditions: string[];
  test_data: Record<string, any>;
  steps: ITestStep[];
  expected_result: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  automation_status: 'requires_configuration' | 'executable' | 'unsupported';
  assumptions: string[];
  source_evidence: Array<{ requirement_span: string }>;
  review_status: 'pending' | 'approved' | 'rejected' | 'needs_changes';
}

export interface IGenerationJob {
  _id: string;
  project_id: string;
  requirement_id: string;
  requirement_version: number;
  requesting_user: string;
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'needs_review' | 'cancelled';
  provider: string;
  model_name: string;
  prompt_template_version: string;
  schema_version: string;
  retry_count: number;
  duration_ms: number;
  token_usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  candidates: ICandidateTestCase[];
  error_code?: string;
  error_summary?: string;
  created_at: string;
  updated_at: string;
}

export const generationService = {
  async generateTestCases(
    projectId: string,
    requirementId: string,
    options?: {
      scenario_types?: string[];
      provider_override?: string;
      max_cases?: number;
    }
  ): Promise<IGenerationJob> {
    const res = await apiRequest<{ job: IGenerationJob }>(
      `/projects/${projectId}/requirements/${requirementId}/generate`,
      {
        method: 'POST',
        body: JSON.stringify(options || {})
      }
    );
    return res.job;
  },

  async getGenerationJobs(
    projectId: string,
    requirementId: string
  ): Promise<IGenerationJob[]> {
    const res = await apiRequest<{ jobs: IGenerationJob[] }>(
      `/projects/${projectId}/requirements/${requirementId}/generation-jobs`
    );
    return res.jobs;
  }
};
