import { apiRequest } from './api';

export interface TestStepItem {
  step_number: number;
  action: 'navigate' | 'click' | 'enter_text' | 'select_option' | 'wait_for_visible' | 'assert_text' | 'assert_visible' | 'assert_url';
  target_ref: string;
  value_ref?: string | null;
}

export interface AssertionItem {
  type: 'assert_visible' | 'assert_not_visible' | 'assert_text' | 'assert_url';
  target_ref: string;
  expected_value?: string | null;
  timeout_ms: number;
}

export interface ValidationFindingItem {
  rule: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  field?: string;
}

export interface TestCaseItem {
  _id: string;
  project_id: string;
  requirement_id: string;
  requirement_version: number;
  version: number;
  is_current: boolean;
  title: string;
  category: string;
  scenario_type: 'positive' | 'negative' | 'boundary' | 'authorization' | 'error_handling' | 'state_transition';
  preconditions: string[];
  test_data: Record<string, any>;
  steps: TestStepItem[];
  expected_result: string;
  assertions: AssertionItem[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  priority_score: number;
  priority_rationale?: string;
  automation_status: 'manual_only' | 'requires_configuration' | 'ready' | 'not_executable';
  validation_findings: ValidationFindingItem[];
  is_duplicate: boolean;
  duplicate_of_id?: string | null;
  duplicate_reason?: string | null;
  assumptions: string[];
  ambiguity_flags: string[];
  source_evidence: Array<{ requirement_span: string }>;
  review_status: 'pending' | 'approved' | 'rejected' | 'needs_changes';
  review_notes?: string | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  previous_version_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuditEventItem {
  _id: string;
  project_id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  actor_id: string;
  actor_email: string;
  details: Record<string, any>;
  timestamp: string;
}

export async function fetchProjectTestCases(
  projectId: string,
  filters: {
    requirement_id?: string;
    review_status?: string;
    scenario_type?: string;
    priority?: string;
  } = {}
): Promise<{ test_cases: TestCaseItem[]; count: number }> {
  const query = new URLSearchParams();
  if (filters.requirement_id) query.append('requirement_id', filters.requirement_id);
  if (filters.review_status && filters.review_status !== 'all') query.append('review_status', filters.review_status);
  if (filters.scenario_type && filters.scenario_type !== 'all') query.append('scenario_type', filters.scenario_type);
  if (filters.priority && filters.priority !== 'all') query.append('priority', filters.priority);

  const qs = query.toString() ? `?${query.toString()}` : '';
  return apiRequest<{ test_cases: TestCaseItem[]; count: number }>(`/projects/${projectId}/test-cases${qs}`);
}

export async function importCandidates(
  projectId: string,
  requirementId: string,
  candidates: any[]
): Promise<{ imported_count: number; test_cases: TestCaseItem[] }> {
  return apiRequest<{ imported_count: number; test_cases: TestCaseItem[] }>(
    `/projects/${projectId}/requirements/${requirementId}/candidates/import`,
    {
      method: 'POST',
      body: JSON.stringify({ candidates })
    }
  );
}

export async function editTestCase(
  testCaseId: string,
  updateData: Partial<TestCaseItem> & { expected_version?: number }
): Promise<{ test_case: TestCaseItem; version_bumped: boolean }> {
  return apiRequest<{ test_case: TestCaseItem; version_bumped: boolean }>(
    `/test-cases/${testCaseId}`,
    {
      method: 'PATCH',
      body: JSON.stringify(updateData)
    }
  );
}

export async function approveTestCase(
  testCaseId: string,
  notes?: string
): Promise<{ test_case: TestCaseItem; status: string }> {
  return apiRequest<{ test_case: TestCaseItem; status: string }>(
    `/test-cases/${testCaseId}/approve`,
    {
      method: 'POST',
      body: JSON.stringify({ notes })
    }
  );
}

export async function rejectTestCase(
  testCaseId: string,
  reason: string
): Promise<{ test_case: TestCaseItem; status: string }> {
  return apiRequest<{ test_case: TestCaseItem; status: string }>(
    `/test-cases/${testCaseId}/reject`,
    {
      method: 'POST',
      body: JSON.stringify({ reason })
    }
  );
}

export async function requestChangesTestCase(
  testCaseId: string,
  notes: string
): Promise<{ test_case: TestCaseItem; status: string }> {
  return apiRequest<{ test_case: TestCaseItem; status: string }>(
    `/test-cases/${testCaseId}/request-changes`,
    {
      method: 'POST',
      body: JSON.stringify({ notes })
    }
  );
}

export async function fetchAuditEvents(
  projectId: string,
  entityId?: string
): Promise<{ audit_events: AuditEventItem[]; count: number }> {
  const qs = entityId ? `?entity_id=${entityId}` : '';
  return apiRequest<{ audit_events: AuditEventItem[]; count: number }>(
    `/projects/${projectId}/audit-events${qs}`
  );
}

